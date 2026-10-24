import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCurrentUserSession } from '@/actions/bookings';
import { redirect } from 'next/navigation';
import { HostWalletClient } from '@/components/dashboard/HostWalletClient';

interface HostWalletPageProps {
  params: Promise<{
    lang: string;
  }>;
}

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Dompet Saldo & Riwayat Penarikan Dana Host | Locallytrip',
  description: 'Kelola pendapatan tur pemandu wisata, ajukan penarikan dana ke rekening bank, dan pantau program referral.',
};

export default async function HostWalletPage({ params }: HostWalletPageProps) {
  const { lang } = await params;

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

  if (!userEmail) {
    redirect(`/${lang}/login?callbackUrl=/${lang}/dashboard/wallet`);
  }

  const user = await prisma.users.findUnique({
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

  if (!user) {
    redirect(`/${lang}/login?callbackUrl=/${lang}/dashboard/wallet`);
  }

  // Strict Host Guard: Hanya pengguna dengan peran HOST yang memiliki akses ke modul keuangan host
  if (user.role?.toUpperCase() !== 'HOST') {
    redirect(`/${lang}/dashboard`);
  }

  const USD_TO_IDR = 16000;

  // 1. Ambil data pesanan selesai (completed) dan terkonfirmasi (confirmed) untuk tur milik host
  const [completedBookings, confirmedBookings, primaryBank, payoutSettings, payoutHistory, kycRecord, referralUsageCount] =
    await Promise.all([
      // Akumulasi pendapatan kotor tur selesai
      prisma.bookings.findMany({
        where: {
          experiences: { host_id: user.id },
          status: 'completed',
        },
        select: {
          id: true,
          total_price: true,
          booking_reference: true,
          created_at: true,
          experiences: {
            select: {
              title: true,
              currency: true,
            },
          },
        },
      }),

      // Saldo tertahan: Tur berstatus confirmed (belum berstatus completed)
      prisma.bookings.findMany({
        where: {
          experiences: { host_id: user.id },
          status: 'confirmed',
        },
        select: {
          id: true,
          total_price: true,
          booking_reference: true,
          created_at: true,
          experiences: {
            select: {
              title: true,
              currency: true,
            },
          },
        },
      }),

      // Rekening Bank Utama
      prisma.user_bank_accounts.findFirst({
        where: {
          user_id: user.id,
          is_primary: true,
        },
        include: {
          banks: true,
        },
      }),

      // Pengaturan Payout Host
      prisma.payout_settings.findUnique({
        where: {
          user_id: user.id,
        },
      }),

      // Riwayat Pencairan Dana
      prisma.payout_history.findMany({
        where: {
          user_id: user.id,
        },
        include: {
          user_bank_accounts: {
            include: {
              banks: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      }),

      // Status KYC Host
      prisma.host_kyc.findUnique({
        where: {
          user_id: user.id,
        },
        select: {
          status: true,
          rejection_reason: true,
        },
      }),

      // Jumlah pengguna yang menggunakan referral_code pengguna saat ini
      user.referral_code
        ? prisma.users.count({
            where: {
              used_referral_code: user.referral_code,
            },
          })
        : 0,
    ]);

  // Hitung total akumulasi pendapatan kotor (IDR)
  const grossEarningsIdr = completedBookings.reduce((sum, b) => {
    const price = Number(b.total_price) || 0;
    const isUsd = b.experiences?.currency?.toUpperCase() === 'USD';
    return sum + (isUsd ? price * USD_TO_IDR : price);
  }, 0);

  // Hitung total saldo tertahan (IDR)
  const pendingBalanceIdr = confirmedBookings.reduce((sum, b) => {
    const price = Number(b.total_price) || 0;
    const isUsd = b.experiences?.currency?.toUpperCase() === 'USD';
    return sum + (isUsd ? price * USD_TO_IDR : price);
  }, 0);

  // Hitung total pencairan dana sukses (status: 'completed' atau 'approved')
  const completedPayoutsIdr = payoutHistory
    .filter((p) => p.status === 'completed' || p.status === 'approved')
    .reduce((sum, p) => {
      const pAmount = Number(p.amount) || 0;
      const isUsd = p.currency?.toUpperCase() === 'USD';
      return sum + (isUsd ? pAmount * USD_TO_IDR : pAmount);
    }, 0);

  // Hitung total penarikan aktif non-rejected (pending + processing + completed)
  const nonRejectedPayoutsIdr = payoutHistory
    .filter((p) => !['rejected', 'cancelled'].includes(p.status))
    .reduce((sum, p) => {
      const pAmount = Number(p.amount) || 0;
      const isUsd = p.currency?.toUpperCase() === 'USD';
      return sum + (isUsd ? pAmount * USD_TO_IDR : pAmount);
    }, 0);

  // Saldo siap ditarik saat ini = Pendapatan Kotor selesai - seluruh penarikan aktif
  const availableBalanceIdr = Math.max(0, grossEarningsIdr - nonRejectedPayoutsIdr);

  // Minimum payout dari settings (default 100,000 IDR)
  const minimumPayoutIdr = payoutSettings ? Number(payoutSettings.minimum_payout) : 100000;

  // Format data bank akun
  const formattedBankAccount = primaryBank
    ? {
        id: primaryBank.id,
        bankName: primaryBank.banks?.bank_name || 'Bank Transfer',
        bankCode: primaryBank.banks?.bank_code || 'BANK',
        accountNumber: primaryBank.account_number,
        accountHolderName: primaryBank.account_holder_name,
        branchName: primaryBank.branch_name,
        isVerified: Boolean(primaryBank.is_verified),
      }
    : null;

  // Format riwayat pencairan
  const formattedPayoutHistory = payoutHistory.map((p) => ({
    id: p.id,
    amount: Number(p.amount),
    currency: p.currency,
    status: p.status,
    payoutMethod: p.payout_method,
    transactionReference: p.transaction_reference || `PAYOUT-#${p.id}`,
    notes: p.notes,
    createdAt: p.created_at.toISOString(),
    processedAt: p.processed_at ? p.processed_at.toISOString() : null,
    bankInfo: p.user_bank_accounts
      ? `${p.user_bank_accounts.banks?.bank_name_short || p.user_bank_accounts.banks?.bank_name || 'Bank'} (${p.user_bank_accounts.account_number})`
      : 'Transfer Bank',
  }));

  // Status KYC apakah sudah lolos
  const isKycApproved = kycRecord?.status === 'approved' || Boolean(user.is_verified);

  return (
    <HostWalletClient
      locale={lang}
      user={{
        id: user.id,
        name: user.name,
        referralCode: user.referral_code,
        referralUsageCount: referralUsageCount,
        isKycApproved: isKycApproved,
        kycStatus: kycRecord?.status || (user.is_verified ? 'approved' : 'none'),
      }}
      metrics={{
        availableBalanceIdr,
        pendingBalanceIdr,
        completedPayoutsIdr,
        grossEarningsIdr,
        minimumPayoutIdr,
      }}
      bankAccount={formattedBankAccount}
      payoutHistory={formattedPayoutHistory}
    />
  );
}
