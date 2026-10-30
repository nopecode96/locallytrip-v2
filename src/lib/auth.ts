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

        const email = credentials.email.toLowerCase().trim();
        const user = await prisma.users.findUnique({
          where: { email },
          include: {
            roles: {
              select: {
                id: true,
                name: true,
                permissions: true,
              },
            },
          },
        });

        if (!user || !user.password_hash) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password_hash);
        if (!isValid) return null;

        let roleId = user.role_id || user.roles?.id || null;
        let rolePermissions = (user.roles?.permissions as Record<string, boolean>) || null;

        if ((!roleId || !rolePermissions) && user.role) {
          const matchedRole = await prisma.roles.findFirst({
            where: { name: user.role.toLowerCase().trim() },
            select: { id: true, permissions: true },
          });
          if (matchedRole) {
            roleId = roleId || matchedRole.id;
            rolePermissions = rolePermissions || ((matchedRole.permissions as Record<string, boolean>) || null);
          }
        }

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          image: user.avatar_url,
          username: user.username,
          role: user.role,
          role_id: roleId,
          permissions: rolePermissions,
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

            // Buat user baru dengan role traveller standar dan role_id: 3
            existingUser = await prisma.users.create({
              data: {
                email,
                name: user.name || 'Travel Explorer',
                username: uniqueUsername,
                avatar_url: user.image || null,
                role: 'traveller',
                role_id: 3,
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
            // Pastikan akun memiliki role_id yang valid
            if (!existingUser.role_id && existingUser.role) {
              const matchedRole = await prisma.roles.findFirst({
                where: { name: existingUser.role.toLowerCase().trim() },
                select: { id: true },
              });
              if (matchedRole) {
                await prisma.users.update({
                  where: { id: existingUser.id },
                  data: { role_id: matchedRole.id },
                }).catch(() => {});
              }
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
        token.role_id = user.role_id;
        token.permissions = user.permissions;
        token.username = user.username;
      }
      if ((!token.role || token.permissions === undefined || token.role_id === undefined) && (token.email || (user as any)?.email || token.sub)) {
        try {
          const queryEmail = ((token.email || (user as any)?.email) as string)?.toLowerCase().trim();
          const dbUser = queryEmail
            ? await prisma.users.findUnique({
                where: { email: queryEmail },
                select: {
                  id: true,
                  role: true,
                  role_id: true,
                  username: true,
                  roles: {
                    select: {
                      id: true,
                      permissions: true,
                    },
                  },
                },
              })
            : (token.id || token.sub)
            ? await prisma.users.findUnique({
                where: { id: Number(token.id || token.sub) },
                select: {
                  id: true,
                  role: true,
                  role_id: true,
                  username: true,
                  roles: {
                    select: {
                      id: true,
                      permissions: true,
                    },
                  },
                },
              })
            : null;

          if (dbUser) {
            token.id = String(dbUser.id);
            token.role = dbUser.role;
            token.username = dbUser.username;

            let roleId = dbUser.role_id || dbUser.roles?.id || null;
            let permissions = (dbUser.roles?.permissions as Record<string, boolean>) || null;

            if ((!roleId || !permissions) && dbUser.role) {
              const roleRecord = await prisma.roles.findFirst({
                where: { name: dbUser.role.toLowerCase().trim() },
                select: { id: true, permissions: true },
              });
              if (roleRecord) {
                roleId = roleId || roleRecord.id;
                permissions = permissions || ((roleRecord.permissions as Record<string, boolean>) || null);
              }
            }

            token.role_id = roleId;
            token.permissions = permissions || {};
          }
        } catch (error) {
          console.error('Error fetching user role in jwt callback:', error);
        }
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session?.user) {
        if (token.id) session.user.id = token.id;
        if (token.role) session.user.role = token.role;
        if (token.role_id !== undefined) session.user.role_id = token.role_id;
        if (token.permissions) session.user.permissions = token.permissions;
        if (token.username) session.user.username = token.username;

        const queryEmail = (session.user.email || token.email || '')?.toLowerCase().trim();
        if (queryEmail) {
          try {
            const dbUser = await prisma.users.findUnique({
              where: { email: queryEmail },
              select: {
                id: true,
                username: true,
                role: true,
                role_id: true,
                avatar_url: true,
                is_verified: true,
                roles: {
                  select: {
                    id: true,
                    permissions: true,
                  },
                },
              },
            });
            if (dbUser) {
              session.user.id = String(dbUser.id);
              session.user.username = dbUser.username;
              session.user.role = dbUser.role;

              let roleId = dbUser.role_id || dbUser.roles?.id || null;
              let permissions = (dbUser.roles?.permissions as Record<string, boolean>) || null;

              if ((!roleId || !permissions) && dbUser.role) {
                const roleRecord = await prisma.roles.findFirst({
                  where: { name: dbUser.role.toLowerCase().trim() },
                  select: { id: true, permissions: true },
                });
                if (roleRecord) {
                  roleId = roleId || roleRecord.id;
                  permissions = permissions || ((roleRecord.permissions as Record<string, boolean>) || null);
                }
              }

              session.user.role_id = roleId;
              session.user.permissions = permissions;
              session.user.avatar_url = dbUser.avatar_url;
              session.user.image = dbUser.avatar_url;
              session.user.is_kyc_verified = Boolean(dbUser.is_verified);
            }
          } catch (error) {
            console.error('Error fetching session details:', error);
          }
        }
      }
      return session;
    },
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // Jika URL adalah path relatif, tambahkan baseUrl
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Jika URL berasal dari origin yang sama atau subdomain locallytrip, izinkan
      try {
        const parsedUrl = new URL(url);
        const parsedBase = new URL(baseUrl);
        if (
          parsedUrl.origin === parsedBase.origin ||
          parsedUrl.hostname.endsWith('locallytrip.com') ||
          parsedUrl.hostname.endsWith('locallytrip.local') ||
          parsedUrl.hostname.endsWith('localhost')
        ) {
          return url;
        }
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
