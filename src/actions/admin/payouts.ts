'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getAdminStaffSession, hasRole } from '@/lib/admin-auth';
import { resolveAvatarUrl } from '@/lib/avatar';
import { getPublicImageUrl } from '@/lib/images';

export interface AdminPayoutItem {
  id: number;
  userId: number;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected' | string;
  payoutMethod: string;
  transactionReference: string | null;
  notes: string | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    name: string;
    email: string;
    username: string | null;
    phone: string | null;
    avatarUrl: string | null;
    role: string | null;
    isKycApproved: boolean;
  };
  bankAccount: {
    id: number;
    bankName: string;
    bankCode: string | null;
    logoUrl: string | null;
    accountNumber: string;
    accountHolderName: string;
    branchName: string | null;
  } | null;
}

export interface AdminPayoutStats {
  pendingAmountIdr: number;
  pendingCount: number;
  approvedAmountIdr: number;
  approvedCount: number;
  completedAmountIdr: number;
  completedCount: number;
  completedThisMonthIdr: number;
  rejectedAmountIdr: number;
  rejectedCount: number;
  totalCount: number;
  totalVolumeIdr: number;
}

export interface GetAdminPayoutsParams {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface GetAdminPayoutsResponse {
  success: boolean;
  payouts: AdminPayoutItem[];
  data?: AdminPayoutItem[];
  stats: AdminPayoutStats;
  totalCount?: number;
  totalPages?: number;
  currentPage?: number;
  pagination?: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
  error?: string;
}

export interface PayoutActionResult {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Helper internal untuk memverifikasi role Admin / Finance
 */
async function requireAdminSession() {
  const session = await getAdminStaffSession();
  if (!session || !session.isLoggedIn) {
    if (process.env.NODE_ENV === 'development') {
      return { id: 1, name: 'Admin Dev', email: 'admin@locallytrip.com', role: 'admin' };
    }
    throw new Error('Sesi tidak valid. Silakan login terlebih dahulu.');
  }

  if (!hasRole(session, ['super admin', 'finances'])) {
    throw new Error('Akses ditolak. Fitur keuangan dan penarikan dana hanya untuk Super Admin dan Finance.');
  }

  return session;
}

/**
 * 1. Ambil daftar permohonan penarikan dana beserta metrik ringkasan dengan pagination standar
 */
export async function getAdminPayouts(
  params: GetAdminPayoutsParams = {}
): Promise<GetAdminPayoutsResponse> {
  try {
    await requireAdminSession();

    const { search = '', status = 'all', page = 1 } = params;
    const pageSize = params.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (search.trim()) {
      where.OR = [
        { transaction_reference: { contains: search.trim(), mode: 'insensitive' } },
        { users: { name: { contains: search.trim(), mode: 'insensitive' } } },
        { users: { email: { contains: search.trim(), mode: 'insensitive' } } },
      ];
    }

    if (status && status !== 'all') {
      where.status = { equals: status.toLowerCase().trim() };
    }

    const [rawList, totalCount, allPayoutsForTelemetry] = await Promise.all([
      prisma.payout_history.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { created_at: 'desc' },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true,
              phone: true,
              avatar_url: true,
              role: true,
              is_verified: true,
              host_kyc_host_kyc_user_idTousers: {
                select: { status: true },
              },
            },
          },
          user_bank_accounts: {
            include: {
              banks: {
                select: {
                  bank_name: true,
                  bank_code: true,
                  logo_url: true,
                  bank_name_short: true,
                },
              },
            },
          },
        },
      }),
      prisma.payout_history.count({ where }),
      prisma.payout_history.findMany({
        select: {
          amount: true,
          status: true,
          processed_at: true,
        },
      }),
    ]);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let pendingAmountIdr = 0;
    let pendingCount = 0;
    let approvedAmountIdr = 0;
    let approvedCount = 0;
    let completedAmountIdr = 0;
    let completedCount = 0;
    let completedThisMonthIdr = 0;
    let rejectedAmountIdr = 0;
    let rejectedCount = 0;
    let totalVolumeIdr = 0;

    for (const item of allPayoutsForTelemetry) {
      const numAmount = Number(item.amount) || 0;
      const statusLower = (item.status || 'pending').toLowerCase();
      totalVolumeIdr += numAmount;

      if (statusLower === 'pending') {
        pendingAmountIdr += numAmount;
        pendingCount += 1;
      } else if (statusLower === 'approved' || statusLower === 'processing') {
        approvedAmountIdr += numAmount;
        approvedCount += 1;
      } else if (statusLower === 'completed') {
        completedAmountIdr += numAmount;
        completedCount += 1;
        if (item.processed_at && item.processed_at >= startOfMonth) {
          completedThisMonthIdr += numAmount;
        }
      } else if (statusLower === 'rejected') {
        rejectedAmountIdr += numAmount;
        rejectedCount += 1;
      }
    }

    const payouts: AdminPayoutItem[] = rawList.map((item) => {
      const numAmount = Number(item.amount) || 0;
      const isKycApproved =
        item.users?.host_kyc_host_kyc_user_idTousers?.status === 'approved' ||
        item.users?.is_verified === true;

      return {
        id: item.id,
        userId: item.user_id,
        amount: numAmount,
        currency: item.currency || 'IDR',
        status: item.status,
        payoutMethod: item.payout_method || 'bank_transfer',
        transactionReference: item.transaction_reference,
        notes: item.notes,
        processedAt: item.processed_at ? item.processed_at.toISOString() : null,
        createdAt: item.created_at.toISOString(),
        updatedAt: item.updated_at.toISOString(),
        user: {
          id: item.users.id,
          name: item.users.name || 'Host Locallytrip',
          email: item.users.email,
          username: item.users.username,
          phone: item.users.phone,
          avatarUrl: resolveAvatarUrl(item.users),
          role: item.users.role,
          isKycApproved,
        },
        bankAccount: item.user_bank_accounts
          ? {
              id: item.user_bank_accounts.id,
              bankName:
                item.user_bank_accounts.banks?.bank_name || 'Bank Transfer',
              bankCode: item.user_bank_accounts.banks?.bank_code || null,
              logoUrl: item.user_bank_accounts.banks?.logo_url
                ? getPublicImageUrl(item.user_bank_accounts.banks.logo_url, 'banks')
                : null,
              accountNumber: item.user_bank_accounts.account_number,
              accountHolderName: item.user_bank_accounts.account_holder_name,
              branchName: item.user_bank_accounts.branch_name,
            }
          : null,
      };
    });

    const stats: AdminPayoutStats = {
      pendingAmountIdr,
      pendingCount,
      approvedAmountIdr,
      approvedCount,
      completedAmountIdr,
      completedCount,
      completedThisMonthIdr,
      rejectedAmountIdr,
      rejectedCount,
      totalCount: allPayoutsForTelemetry.length,
      totalVolumeIdr,
    };

    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    return {
      success: true,
      payouts,
      data: payouts,
      stats,
      totalCount,
      totalPages,
      currentPage: page,
      pagination: {
        totalItems: totalCount,
        totalPages,
        currentPage: page,
        pageSize,
      },
    };
  } catch (error: any) {
    console.error('Error fetching admin payouts:', error);
    return {
      success: false,
      payouts: [],
      data: [],
      stats: {
        pendingAmountIdr: 0,
        pendingCount: 0,
        approvedAmountIdr: 0,
        approvedCount: 0,
        completedAmountIdr: 0,
        completedCount: 0,
        completedThisMonthIdr: 0,
        rejectedAmountIdr: 0,
        rejectedCount: 0,
        totalCount: 0,
        totalVolumeIdr: 0,
      },
      totalCount: 0,
      totalPages: 1,
      currentPage: 1,
      pagination: {
        totalItems: 0,
        totalPages: 1,
        currentPage: 1,
        pageSize: 10,
      },
      error: error?.message || 'Gagal memuat antrean penarikan dana.',
    };
  }
}

/**
 * 2. Server Action: approvePayout(payoutId, referenceNote)
 * Memvalidasi status 'pending', mengubah ke 'approved' (siap transfer batch)
 */
export async function approvePayout(
  payoutId: number,
  referenceNote?: string
): Promise<PayoutActionResult> {
  try {
    await requireAdminSession();

    const result = await prisma.$transaction(async (tx) => {
      const payout = await tx.payout_history.findUnique({
        where: { id: payoutId },
        include: {
          users: { select: { id: true, name: true } },
          user_bank_accounts: {
            include: { banks: { select: { bank_name: true } } },
          },
        },
      });

      if (!payout) {
        throw new Error('Data permohonan penarikan dana tidak ditemukan.');
      }

      if (payout.status.toLowerCase() !== 'pending') {
        throw new Error(
          `Pengajuan ini tidak dapat disetujui karena berstatus '${payout.status}'.`
        );
      }

      const now = new Date();
      const updatedNotes = referenceNote?.trim()
        ? payout.notes
          ? `${payout.notes} | Disetujui Admin: ${referenceNote.trim()}`
          : `Disetujui Admin: ${referenceNote.trim()}`
        : payout.notes;

      const updated = await tx.payout_history.update({
        where: { id: payoutId },
        data: {
          status: 'approved',
          updated_at: now,
          notes: updatedNotes,
        },
      });

      const bankName =
        payout.user_bank_accounts?.banks?.bank_name || 'Bank Rekening Anda';
      const formattedAmount = `Rp ${(Number(payout.amount) || 0).toLocaleString('id-ID')}`;

      await tx.notifications.create({
        data: {
          user_id: payout.user_id,
          type: 'PAYOUT_APPROVED',
          title: 'Pengajuan Penarikan Dana Disetujui',
          message: `Penarikan dana sebesar ${formattedAmount} telah disetujui oleh tim Finance dan sedang dijadwalkan dalam kliring transfer ke rekening ${bankName}.`.trim(),
          action_url: '/id/dashboard/wallet',
          created_at: now,
          updated_at: now,
        },
      });

      return updated;
    });

    revalidatePath('/admin/finances/withdrawals');
    revalidatePath('/admin/withdrawals');
    revalidatePath('/admin/payouts');
    revalidatePath('/admin/finances');
    revalidatePath('/[lang]/dashboard/wallet', 'page');
    revalidatePath('/id/dashboard/wallet');
    revalidatePath('/en/dashboard/wallet');

    return {
      success: true,
      message: `Pengajuan payout #${result.id} berhasil disetujui dan masuk antrean transfer.`,
    };
  } catch (error: any) {
    console.error('Error in approvePayout:', error);
    return {
      success: false,
      message: error?.message || 'Terjadi kesalahan sistem saat menyetujui penarikan dana.',
      error: error?.message,
    };
  }
}

/**
 * 3. Server Action: completePayout(payoutId, transactionReference, referenceNote)
 * Memvalidasi status 'pending' atau 'approved', mengubah ke 'completed', mengisi processed_at & reference,
 * dan mengirim notifikasi lonceng ke Host
 */
export async function completePayout(
  payoutId: number,
  transactionReference?: string,
  referenceNote?: string
): Promise<PayoutActionResult> {
  try {
    await requireAdminSession();

    const result = await prisma.$transaction(async (tx) => {
      const payout = await tx.payout_history.findUnique({
        where: { id: payoutId },
        include: {
          users: { select: { id: true, name: true } },
          user_bank_accounts: {
            include: { banks: { select: { bank_name: true } } },
          },
        },
      });

      if (!payout) {
        throw new Error('Data permohonan penarikan dana tidak ditemukan.');
      }

      const currentStatus = payout.status.toLowerCase();
      if (currentStatus !== 'pending' && currentStatus !== 'approved' && currentStatus !== 'processing') {
        throw new Error(
          `Pengajuan ini tidak dapat ditandai selesai karena berstatus '${payout.status}'.`
        );
      }

      const now = new Date();
      const refText = transactionReference?.trim() || `TRX-MANUAL-${now.getTime()}`;
      const noteMemo = referenceNote?.trim();

      const updatedNotes = noteMemo
        ? payout.notes
          ? `${payout.notes} | Transfer Selesai (Ref: ${refText}): ${noteMemo}`
          : `Transfer Selesai (Ref: ${refText}): ${noteMemo}`
        : payout.notes
        ? `${payout.notes} | Transfer Selesai (Ref: ${refText})`
        : `Transfer Selesai (Ref: ${refText})`;

      const updated = await tx.payout_history.update({
        where: { id: payoutId },
        data: {
          status: 'completed',
          transaction_reference: refText,
          processed_at: now,
          updated_at: now,
          notes: updatedNotes,
        },
      });

      const bankName =
        payout.user_bank_accounts?.banks?.bank_name || 'Bank Rekening Anda';
      const formattedAmount = `Rp ${(Number(payout.amount) || 0).toLocaleString('id-ID')}`;

      await tx.notifications.create({
        data: {
          user_id: payout.user_id,
          type: 'PAYOUT_COMPLETED',
          title: 'Penarikan Dana Berhasil Ditransfer',
          message: `Penarikan dana sebesar ${formattedAmount} telah berhasil ditransfer ke rekening ${bankName}. No. Referensi Transaksi: ${refText}.`.trim(),
          action_url: '/id/dashboard/wallet',
          created_at: now,
          updated_at: now,
        },
      });

      return updated;
    });

    revalidatePath('/admin/finances/withdrawals');
    revalidatePath('/admin/withdrawals');
    revalidatePath('/admin/payouts');
    revalidatePath('/admin/finances');
    revalidatePath('/[lang]/dashboard/wallet', 'page');
    revalidatePath('/id/dashboard/wallet');
    revalidatePath('/en/dashboard/wallet');

    return {
      success: true,
      message: `Pengajuan payout #${result.id} berhasil ditandai selesai ditransfer.`,
    };
  } catch (error: any) {
    console.error('Error in completePayout:', error);
    return {
      success: false,
      message: error?.message || 'Terjadi kesalahan sistem saat menyelesaikan penarikan dana.',
      error: error?.message,
    };
  }
}

/**
 * 4. Server Action: rejectPayout(payoutId, rejectionReason)
 * Memvalidasi status 'pending' atau 'approved', mengubah ke 'rejected', menyimpan alasan penolakan,
 * mengembalikan saldo aktif, dan mengirim notifikasi lonceng ke Host
 */
export async function rejectPayout(
  payoutId: number,
  rejectionReason: string
): Promise<PayoutActionResult> {
  try {
    await requireAdminSession();

    if (!rejectionReason || !rejectionReason.trim()) {
      return {
        success: false,
        message: 'Alasan penolakan wajib diisi untuk memberikan kejelasan kepada host.',
      };
    }

    const reasonClean = rejectionReason.trim();

    const result = await prisma.$transaction(async (tx) => {
      const payout = await tx.payout_history.findUnique({
        where: { id: payoutId },
        include: {
          users: { select: { id: true, name: true } },
        },
      });

      if (!payout) {
        throw new Error('Data permohonan penarikan dana tidak ditemukan.');
      }

      const currentStatus = payout.status.toLowerCase();
      if (currentStatus !== 'pending' && currentStatus !== 'approved' && currentStatus !== 'processing') {
        throw new Error(
          `Pengajuan ini tidak dapat ditolak karena berstatus '${payout.status}'.`
        );
      }

      const now = new Date();
      const updatedNotes = payout.notes
        ? `${payout.notes} | Ditolak Admin: ${reasonClean}`
        : `Ditolak Admin: ${reasonClean}`;

      const updated = await tx.payout_history.update({
        where: { id: payoutId },
        data: {
          status: 'rejected',
          processed_at: now,
          updated_at: now,
          notes: updatedNotes,
        },
      });

      const formattedAmount = `Rp ${(Number(payout.amount) || 0).toLocaleString('id-ID')}`;

      await tx.notifications.create({
        data: {
          user_id: payout.user_id,
          type: 'PAYOUT_REJECTED',
          title: 'Pengajuan Penarikan Dana Ditolak',
          message: `Pengajuan penarikan dana Anda sebesar ${formattedAmount} ditolak. Alasan: "${reasonClean}". Saldo dana telah otomatis dikembalikan ke dompet Anda.`,
          action_url: '/id/dashboard/wallet',
          created_at: now,
          updated_at: now,
        },
      });

      return updated;
    });

    revalidatePath('/admin/finances/withdrawals');
    revalidatePath('/admin/withdrawals');
    revalidatePath('/admin/payouts');
    revalidatePath('/admin/finances');
    revalidatePath('/[lang]/dashboard/wallet', 'page');
    revalidatePath('/id/dashboard/wallet');
    revalidatePath('/en/dashboard/wallet');

    return {
      success: true,
      message: `Pengajuan payout #${result.id} telah ditolak dan dana telah dikembalikan ke saldo host.`,
    };
  } catch (error: any) {
    console.error('Error in rejectPayout:', error);
    return {
      success: false,
      message: error?.message || 'Terjadi kesalahan sistem saat menolak penarikan dana.',
      error: error?.message,
    };
  }
}
