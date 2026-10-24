'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { grantReward } from '@/lib/rewards/reward-engine';
import { sendVerificationEmail } from '@/lib/mailjet';

export async function registerQuickUser(formData: {
  name: string;
  email: string;
  password: string;
  referralCode?: string;
}) {
  const { name, email, password, referralCode } = formData;

  if (!name || !email || !password || password.length < 6) {
    return { success: false, error: 'Silakan isi seluruh formulir dengan benar (password minimal 6 karakter).' };
  }

  const cleanEmail = email.toLowerCase().trim();
  const existingUser = await prisma.users.findUnique({ where: { email: cleanEmail } });
  if (existingUser) {
    return { success: false, error: 'Email ini sudah terdaftar. Silakan masuk langsung.' };
  }

  // Buat username otomatis dari prefix email
  const baseUsername = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').toLowerCase() || 'traveler';
  let uniqueUsername = baseUsername;
  let counter = 1;
  while (await prisma.users.findUnique({ where: { username: uniqueUsername } })) {
    uniqueUsername = `${baseUsername}${counter}`;
    counter++;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const now = new Date();

  // Cek keberadaan referral code jika ada
  let referrerUser: { id: number; name: string } | null = null;
  const cleanReferral = referralCode?.trim();
  if (cleanReferral) {
    referrerUser = await prisma.users.findFirst({
      where: { referral_code: cleanReferral },
      select: { id: true, name: true },
    });
  }

  // Generate unique referral code untuk user baru
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const newReferralCode = `${uniqueUsername.substring(0, 4).toUpperCase()}-${randomSuffix}`;

  // Generate OTP/Token verifikasi 6 digit
  const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

  const newUser = await prisma.users.create({
    data: {
      name: name.trim(),
      email: cleanEmail,
      username: uniqueUsername,
      password_hash: hashedPassword,
      role: 'traveller',
      role_id: 3,
      is_active: true,
      referral_code: newReferralCode,
      used_referral_code: referrerUser ? cleanReferral : null,
      referred_by_user_id: referrerUser ? referrerUser.id : null,
      verification_token: verificationToken,
      created_at: now,
      updated_at: now,
    },
  });

  // Sambutan pemula: Berikan Welcome Airdrop (1.000 LTP & 500 XP)
  await grantReward(newUser.id, 'WELCOME_AIRDROP', newUser.id, 'users');

  if (referrerUser) {
    // 1. Berikan reward pendaftar (+50 XP)
    await grantReward(newUser.id, 'REFERRAL_SIGNUP_INVITEE', referrerUser.id, 'users');

    // 2. Berikan reward pemilik kode (+100 XP & +10 LTP)
    await grantReward(referrerUser.id, 'REFERRAL_SIGNUP_INVITER', newUser.id, 'users');

    // Notifikasi lonceng untuk pemilik kode
    await prisma.notifications.create({
      data: {
        user_id: referrerUser.id,
        type: 'COMMUNITY',
        title: 'Teman Baru Bergabung via Referral! 🎁',
        message: `${newUser.name} telah mendaftar menggunakan kode referral Anda. Anda memperoleh +100 XP & +10 LTP Koin!`,
        action_url: '/id/dashboard?tab=referral',
        created_at: now,
        updated_at: now,
      },
    });
  }

  // Kirim email verifikasi via Mailjet secara non-blocking agar tidak menghambat thread pendaftaran/auto-login
  sendVerificationEmail(cleanEmail, name.trim(), verificationToken)
    .then((mailRes) => {
      console.log(`[Mailjet:Register] Verification email sent to ${cleanEmail} (Status: ${mailRes.status})`);
    })
    .catch((err) => {
      console.error(`[Mailjet:Register] Non-blocking email dispatch error for ${cleanEmail}:`, err?.message || err);
    });

  return { success: true, username: uniqueUsername };
}
