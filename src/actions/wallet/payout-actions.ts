'use server';

import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCurrentUserSession } from '@/actions/bookings';
import { revalidatePath } from 'next/cache';
import { createAdminNotification } from '@/actions/admin/notifications';

export interface RequestPayoutResult {
  success: boolean;
  message: string;
  payoutId?: number;
  transactionReference?: string;
}

async function getAuthenticatedUser() {
  let userEmail: string | null = null;
  const session = await getServerSession(authOptions);
  if (session?.user?.email) {
    userEmail = session.user.email;
  } else {
    const rawSession = await getCurrentUserSession();
    if (rawSession?.isLoggedIn && rawSession.email) {
      userEmail = rawSession.email;
    }
  }

  if (!userEmail) return null;

  return prisma.users.findUnique({
    where: { email: userEmail },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      is_verified: true,
      referral_code: true,
    },
  });
}

/**
 * Server Action: requestHostPayout
 * Mengajukan permohonan pencairan dana host sesuai saldo bersih yang tersedia
 */
export async function requestHostPayout(amount: number): Promise<RequestPayoutResult> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, message: 'Autentikasi diperlukan. Silakan login kembali.' };
    }

    // Validasi Peran HOST
    if (user.role?.toUpperCase() !== 'HOST') {
      return {
        success: false,
        message: 'Akses ditolak: Hanya Local Host yang dapat mengajukan penarikan dana.',
      };
    }

    if (!amount || isNaN(amount) || amount <= 0) {
      return { success: false, message: 'Nominal penarikan tidak valid.' };
    }

    // 1. Cek Rekening Bank Utama
    const primaryBankAccount = await prisma.user_bank_accounts.findFirst({
      where: {
        user_id: user.id,
        is_primary: true,
      },
      include: {
        banks: true,
      },
    });

    if (!primaryBankAccount) {
      return {
        success: false,
        message: 'Rekening bank utama penerima dana belum diatur. Silakan tambahkan rekening bank di Pengaturan Akun.',
      };
    }

    // 2. Cek Status KYC Host (Wajib approved)
    const kycRecord = await prisma.host_kyc.findUnique({
      where: { user_id: user.id },
      select: { status: true },
    });

    const isKycApproved = kycRecord?.status === 'approved' || Boolean(user.is_verified);
    if (!isKycApproved) {
      return {
        success: false,
        message: 'Verifikasi identitas (KYC) diperlukan sebelum penarikan dana dapat diproses. Mohon lengkapi verifikasi terlebih dahulu.',
      };
    }

    // 3. Cek Pengaturan Batas Minimum Penarikan
    const payoutSettings = await prisma.payout_settings.findUnique({
      where: { user_id: user.id },
    });
    const minPayout = payoutSettings ? Number(payoutSettings.minimum_payout) : 100000;

    if (amount < minPayout) {
      return {
        success: false,
        message: `Nominal penarikan minimal adalah Rp ${minPayout.toLocaleString('id-ID')}.`,
      };
    }

    // 4. Hitung Saldo Bersih Tersedia (Completed Bookings dikurangi total payout non-rejected)
    // Note: Kurs konversi standar 1 USD = 16,000 IDR jika tur dalam USD
    const USD_TO_IDR = 16000;

    const completedBookings = await prisma.bookings.findMany({
      where: {
        experiences: {
          host_id: user.id,
        },
        status: 'completed',
      },
      select: {
        total_price: true,
        experiences: {
          select: {
            currency: true,
          },
        },
      },
    });

    const grossEarningsIdr = completedBookings.reduce((sum, b) => {
      const price = Number(b.total_price) || 0;
      const isUsd = b.experiences?.currency?.toUpperCase() === 'USD';
      return sum + (isUsd ? price * USD_TO_IDR : price);
    }, 0);

    // Ambil seluruh payout yang telah diajukan (selain 'rejected' atau 'cancelled')
    const existingPayouts = await prisma.payout_history.findMany({
      where: {
        user_id: user.id,
        status: {
          notIn: ['rejected', 'cancelled'],
        },
      },
      select: {
        amount: true,
        currency: true,
      },
    });

    const totalPayoutsIdr = existingPayouts.reduce((sum, p) => {
      const pAmount = Number(p.amount) || 0;
      const isUsd = p.currency?.toUpperCase() === 'USD';
      return sum + (isUsd ? pAmount * USD_TO_IDR : pAmount);
    }, 0);

    const availableBalanceIdr = Math.max(0, grossEarningsIdr - totalPayoutsIdr);

    if (amount > availableBalanceIdr) {
      return {
        success: false,
        message: `Saldo yang tersedia tidak mencukupi. Saldo siap ditarik saat ini: Rp ${availableBalanceIdr.toLocaleString('id-ID')}.`,
      };
    }

    // 5. Generate Kode Transaksi Unik: PAYOUT-{TIMESTAMP}-{RANDOM}
    const timestamp = Date.now();
    const randomHex = Math.random().toString(36).substring(2, 7).toUpperCase();
    const transactionRef = `PAYOUT-${timestamp}-${randomHex}`;

    // 6. Catat baris transaksi ke tabel payout_history
    const now = new Date();
    const newPayout = await prisma.payout_history.create({
      data: {
        user_id: user.id,
        bank_account_id: primaryBankAccount.id,
        amount: amount,
        currency: 'IDR',
        status: 'pending',
        payout_method: primaryBankAccount.banks?.bank_code ? 'bank_transfer' : 'bank_transfer',
        transaction_reference: transactionRef,
        notes: `Penarikan saldo host ke rekening ${primaryBankAccount.banks?.bank_name || 'Bank'} (${primaryBankAccount.account_number}) a.n. ${primaryBankAccount.account_holder_name}`,
        created_at: now,
        updated_at: now,
      },
    });

    // 7. Buat Notifikasi Lonceng untuk Host
    await prisma.notifications.create({
      data: {
        user_id: user.id,
        type: 'PAYOUT_REQUESTED',
        title: 'Permohonan Penarikan Dana Diajukan',
        message: `Permohonan penarikan dana sebesar Rp ${amount.toLocaleString('id-ID')} (${transactionRef}) berhasil diajukan dan sedang diproses oleh Tim Keuangan.`,
        action_url: '/id/dashboard/wallet',
        created_at: now,
        updated_at: now,
      },
    });

    // 8. Buat Notifikasi Lonceng untuk Admin / Finance Team
    try {
      await createAdminNotification({
        type: 'withdrawal',
        title: 'Permohonan Payout Baru! 💳',
        message: `Host ${user.name} mengajukan penarikan dana sebesar Rp ${amount.toLocaleString('id-ID')} (${transactionRef}).`,
        action_url: '/finances/withdrawals',
        data: {
          payoutId: newPayout.id,
          transactionReference: transactionRef,
          amount,
          userId: user.id,
        },
      });
    } catch (notifErr) {
      console.error('Failed to notify admin about payout request:', notifErr);
    }

    // Revalidate paths
    revalidatePath('/[lang]/dashboard/wallet', 'page');
    revalidatePath('/[lang]/dashboard', 'page');

    return {
      success: true,
      message: 'Permohonan penarikan dana berhasil diajukan! Tim Keuangan akan memproses dalam 1-2 hari kerja.',
      payoutId: newPayout.id,
      transactionReference: transactionRef,
    };
  } catch (error: any) {
    console.error('Error requesting host payout:', error);
    return {
      success: false,
      message: error?.message || 'Terjadi kesalahan sistem saat mengajukan penarikan dana.',
    };
  }
}
