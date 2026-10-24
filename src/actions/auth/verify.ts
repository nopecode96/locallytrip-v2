'use server';

import prisma from '@/lib/prisma';
import { sendWelcomeEmail } from '@/lib/mailjet';

export interface VerifyEmailResult {
  success: boolean;
  message?: string;
  error?: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

/**
 * Server Action: Memverifikasi token OTP/Email pendaftaran pengguna
 * dan memicu pengiriman email sambutan komunitas (Welcome Email) secara asinkron non-blocking.
 */
export async function verifyUserEmail(
  token: string,
  email?: string
): Promise<VerifyEmailResult> {
  const cleanToken = token?.trim();

  if (!cleanToken) {
    return {
      success: false,
      error: 'Token verifikasi tidak boleh kosong.',
    };
  }

  try {
    const cleanEmail = email?.toLowerCase().trim();

    // 1. Cari user berdasarkan token atau kombinasi email & token
    const user = await prisma.users.findFirst({
      where: cleanEmail
        ? {
            email: cleanEmail,
            verification_token: cleanToken,
          }
        : {
            verification_token: cleanToken,
          },
      select: {
        id: true,
        name: true,
        email: true,
        is_verified: true,
        email_verified_at: true,
      },
    });

    if (!user) {
      return {
        success: false,
        error: 'Kode verifikasi tidak valid atau akun Anda telah terverifikasi sebelumnya.',
      };
    }

    const now = new Date();

    // 2. Perbarui status verifikasi pengguna di PostgreSQL via Prisma
    await prisma.users.update({
      where: { id: user.id },
      data: {
        is_verified: true,
        email_verified_at: now,
        verification_token: null, // Reset token setelah berhasil digunakan
        updated_at: now,
      },
    });

    // 3. Buat notifikasi lonceng di dashboard pengguna
    await prisma.notifications.create({
      data: {
        user_id: user.id,
        title: 'Email Berhasil Diverifikasi! 🎉',
        message: 'Selamat! Akun Anda telah aktif sepenuhnya. Saldo Welcome Airdrop 1.000 LTP & 500 XP siap digunakan.',
        type: 'SYSTEM',
        action_url: '/dashboard?tab=overview',
        created_at: now,
        updated_at: now,
      },
    });

    // 4. STRATEGIC INTEGRATION: Picu pengiriman Community Welcome Email via Mailjet
    //    Wajib asinkron (NON-BLOCKING) agar tidak menghambat respon UI verifikasi
    sendWelcomeEmail(user.email, user.name)
      .then((mRes) => {
        console.log(
          `[Mailjet:Welcome] Community welcome email dispatched to ${user.email} (Status: ${mRes.status})`
        );
      })
      .catch((err) => {
        console.error(
          `[Mailjet:Welcome] Failed to dispatch welcome email to ${user.email}:`,
          err?.message || err
        );
      });

    return {
      success: true,
      message: 'Email berhasil diverifikasi! Selamat datang di Komunitas Locallytrip.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  } catch (error: any) {
    console.error('Error verifying user email:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan sistem saat memproses verifikasi. Silakan coba kembali.',
    };
  }
}
