import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { grantReward } from '@/lib/rewards/reward-engine';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.users.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        if (!user || !user.password_hash) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password_hash);
        if (!isValid) return null;

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          image: user.avatar_url,
          username: user.username,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }: any) {
      if (account?.provider === 'google') {
        try {
          if (!user?.email) {
            console.error('Google sign-in error: user email is missing');
            return false;
          }

          const email = user.email.toLowerCase().trim();
          let existingUser = await prisma.users.findUnique({ where: { email } });

          if (!existingUser) {
            // Generate username unik dari bagian depan email (maksimal 30 karakter)
            const baseUsername =
              email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').toLowerCase().slice(0, 30) || 'traveler';
            let uniqueUsername = baseUsername;
            let counter = 1;
            while (await prisma.users.findUnique({ where: { username: uniqueUsername } })) {
              uniqueUsername = `${baseUsername}${counter}`;
              counter++;
            }

            const now = new Date();

            // Buat user baru dengan role traveller standar
            existingUser = await prisma.users.create({
              data: {
                email,
                name: user.name || 'Travel Explorer',
                username: uniqueUsername,
                avatar_url: user.image || null,
                role: 'traveller',
                is_active: true,
                email_verified_at: now,
                created_at: now,
                updated_at: now,
              },
            });

            // Inisialisasi Welcome Airdrop (1.000 LTP & 500 XP) secara aman
            await grantReward(existingUser.id, 'WELCOME_AIRDROP', existingUser.id, 'users').catch(() => null);
          } else {
            // Jika user sudah ada tetapi belum verifikasi email, tandai verified via Google
            if (!existingUser.email_verified_at) {
              await prisma.users.update({
                where: { id: existingUser.id },
                data: { email_verified_at: new Date() },
              }).catch(() => {});
            }
            // Jika avatar belum ada dan Google menyediakan foto
            if (!existingUser.avatar_url && user.image) {
              await prisma.users.update({
                where: { id: existingUser.id },
                data: { avatar_url: user.image },
              }).catch(() => {});
            }
          }
          return true;
        } catch (error) {
          console.error('Error during Google sign-in:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.username = user.username;
      }
      if (!token.role && token.email) {
        try {
          const dbUser = await prisma.users.findUnique({
            where: { email: token.email },
            select: { id: true, role: true, username: true },
          });
          if (dbUser) {
            token.id = String(dbUser.id);
            token.role = dbUser.role;
            token.username = dbUser.username;
          }
        } catch (error) {
          console.error('Error fetching user role in jwt callback:', error);
        }
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user && (session.user.email || token.sub)) {
        const queryEmail = session.user.email || token.email;
        if (queryEmail) {
          const dbUser = await prisma.users.findUnique({
            where: { email: queryEmail },
            select: {
              id: true,
              username: true,
              role: true,
              avatar_url: true,
              is_verified: true,
            },
          });
          if (dbUser) {
            session.user.id = String(dbUser.id);
            session.user.username = dbUser.username;
            session.user.role = dbUser.role;
            session.user.avatar_url = dbUser.avatar_url;
            session.user.image = dbUser.avatar_url;
            session.user.is_kyc_verified = Boolean(dbUser.is_verified);
          }
        }
      }
      return session;
    },
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // Jika URL adalah path relatif, tambahkan baseUrl
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Jika URL berasal dari origin yang sama, izinkan
      try {
        if (new URL(url).origin === baseUrl) return url;
      } catch {
        return baseUrl;
      }
      return baseUrl;
    },
  },
  pages: {
    signIn: '/auth/login',
  },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
};
