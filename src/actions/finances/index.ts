'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { createNotification } from '@/lib/notifications';

const MINIMUM_PAYOUT_LTP = 3000; // 3,000 LTP = $30.00 USD

export async function getWalletDetails() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  const user = await prisma.users.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      user_ltp_wallets: true,
    },
  });

  if (!user) return null;

  const wallet = user.user_ltp_wallets;
  const currentBalance = wallet ? Number(wallet.balance) : 0;

  // Ambil riwayat mutasi transaksi LTP
  const transactions = await prisma.user_ltp_transactions.findMany({
    where: { user_id: user.id },
    orderBy: { created_at: 'desc' },
    take: 20,
  });

  return {
    balance: currentBalance,
    minimumPayout: MINIMUM_PAYOUT_LTP,
    canPayout: currentBalance >= MINIMUM_PAYOUT_LTP,
    walletId: wallet ? wallet.id : null,
    transactions: transactions.map((t) => ({
      id: t.id,
      amount: Number(t.amount),
      type: t.type,
      activity_type: t.activity_type,
      created_at: t.created_at ? t.created_at.toISOString() : new Date().toISOString(),
    })),
  };
}

export async function requestPayout(formData: {
  amountLtp: number;
  payoutMethod: 'BANK_TRANSFER' | 'PAYPAL';
  accountDetails: {
    bankName?: string;
    accountNumber?: string;
    accountHolder?: string;
    paypalEmail?: string;
  };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { success: false, error: 'Sesi tidak valid. Silakan masuk kembali.' };

  const user = await prisma.users.findUnique({
    where: { email: session.user.email },
    include: { user_ltp_wallets: true },
  });

  if (!user) return { success: false, error: 'Pengguna tidak ditemukan.' };

  const wallet = user.user_ltp_wallets;
  if (!wallet) {
    return { success: false, error: 'Dompet LTP belum diinisialisasi.' };
  }
  const balance = Number(wallet.balance) || 0;

  if (formData.amountLtp < MINIMUM_PAYOUT_LTP) {
    return {
      success: false,
      error: `Jumlah penarikan minimal adalah ${MINIMUM_PAYOUT_LTP.toLocaleString()} LTP ($30.00 USD).`,
    };
  }

  if (balance < formData.amountLtp) {
    return { success: false, error: 'Saldo LTP Anda tidak mencukupi.' };
  }

  try {
    const now = new Date();

    // 1. Kurangi saldo di user_ltp_wallets
    await prisma.user_ltp_wallets.update({
      where: { id: wallet.id },
      data: {
        balance: balance - formData.amountLtp,
        updated_at: now,
      },
    });

    // 2. Catat mutasi debit di user_ltp_transactions
    await prisma.user_ltp_transactions.create({
      data: {
        user_id: user.id,
        amount: formData.amountLtp,
        type: 'debit',
        activity_type: 'PAYOUT_REQUEST',
        created_at: now,
      },
    });

    // 3. Beri notifikasi lonceng ke pengguna
    await createNotification({
      userId: user.id,
      type: 'REWARD_LTP',
      title: 'Permohonan Pencairan LTP Diajukan',
      message: `Permohonan penarikan ${formData.amountLtp.toLocaleString()} LTP Anda sedang diproses oleh tim keuangan (${formData.payoutMethod === 'BANK_TRANSFER' ? formData.accountDetails.bankName : 'PayPal'}).`,
      actionUrl: '/dashboard',
      data: {
        amountLtp: formData.amountLtp,
        method: formData.payoutMethod,
        accountDetails: formData.accountDetails,
      },
    });

    revalidatePath('/[lang]/dashboard', 'page');
    return { success: true };
  } catch (error) {
    console.error('Payout request error:', error);
    return { success: false, error: 'Gagal mengajukan pencairan. Silakan coba lagi.' };
  }
}
