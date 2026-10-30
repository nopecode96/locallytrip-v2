'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getPublicImageUrl } from '@/lib/images';
import { requireRole } from '@/lib/admin-auth';

export interface EconomyLeaderboardUser {
  id: number;
  name: string;
  email: string;
  username: string | null;
  avatar_url: string | null;
  role: string;
  is_active: boolean;
  ltp_balance: number;
  total_xp: number;
  xp_level: number;
  created_at: Date;
}

export interface EconomyRedemptionClaimItem {
  id: number;
  user_id: number;
  reward_type: string;
  reward_title: string;
  status: string; // PENDING, APPROVED, COMPLETED, REJECTED
  level: number;
  voucher_code: string | null;
  tracking_number: string | null;
  claimed_at: Date;
  fulfilled_at: Date | null;
  user: {
    id: number;
    name: string;
    email: string;
    avatar_url: string | null;
    phone: string | null;
  };
}

export interface EconomyTransactionItem {
  id: string;
  user_id: number;
  amount: number;
  type: string; // credit | debit
  activity_type: string;
  created_at: Date | null;
  user: {
    id: number;
    name: string;
    email: string;
    avatar_url: string | null;
  };
}

export async function getAdminEconomyData(params: {
  search?: string;
  leaderboardSort?: 'ltp' | 'xp' | 'recent';
  claimStatus?: string;
  page?: number;
  limit?: number;
} = {}) {
  try {
    await requireRole(['super admin', 'admin', 'finances']);

    const {
      search = '',
      leaderboardSort = 'ltp',
      claimStatus = 'all',
      page = 1,
      limit = 50,
    } = params;

    // 1. Kurs USD -> IDR
    let usdToIdrRate = 17896.90;
    const rateRecord = await prisma.currency_rates.findFirst({
      where: { from_currency: 'USD', to_currency: 'IDR' },
      orderBy: { rate_date: 'desc' },
    });
    if (rateRecord?.rate) usdToIdrRate = Number(rateRecord.rate);

    // 2. Global Economy Telemetry Aggregates
    const [
      walletAgg,
      xpAgg,
      totalWalletsCount,
      totalCreditsAgg,
      totalDebitsAgg,
      pendingClaimsCount,
      totalClaimsCount,
    ] = await Promise.all([
      prisma.user_ltp_wallets.aggregate({ _sum: { balance: true } }),
      prisma.user_xp.aggregate({ _sum: { total_xp: true } }),
      prisma.user_ltp_wallets.count(),
      prisma.user_ltp_transactions.aggregate({
        where: { type: 'credit' },
        _count: true,
        _sum: { amount: true },
      }),
      prisma.user_ltp_transactions.aggregate({
        where: { type: 'debit' },
        _count: true,
        _sum: { amount: true },
      }),
      prisma.user_reward_claims.count({ where: { status: 'PENDING' } }),
      prisma.user_reward_claims.count(),
    ]);

    const totalLtpCirculating = Number(walletAgg._sum?.balance || 0);
    const totalXpDistributed = Number(xpAgg._sum?.total_xp || 0);
    const totalAirdropCreditsCount = totalCreditsAgg._count || 0;
    const totalTicketRedemptionsCount = totalDebitsAgg._count || 0;
    const totalTicketRedemptionsVolume = Number(totalDebitsAgg._sum?.amount || 0);

    // 3. User Scoring Leaderboard Query
    const userWhere: any = {};
    if (search.trim()) {
      userWhere.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { email: { contains: search.trim(), mode: 'insensitive' } },
        { username: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const rawUsers = await prisma.users.findMany({
      where: userWhere,
      take: 60,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        avatar_url: true,
        role: true,
        is_active: true,
        created_at: true,
        user_ltp_wallets: {
          select: {
            balance: true,
          },
        },
        user_xp: {
          select: {
            total_xp: true,
            current_level: true,
          },
        },
      },
    });

    const leaderboard: EconomyLeaderboardUser[] = rawUsers
      .map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        username: u.username,
        avatar_url: getPublicImageUrl(u.avatar_url, 'users'),
        role: u.role || 'traveller',
        is_active: u.is_active ?? true,
        ltp_balance: u.user_ltp_wallets?.balance ? Number(u.user_ltp_wallets.balance) : 0,
        total_xp: u.user_xp?.total_xp || 0,
        xp_level: u.user_xp?.current_level || 1,
        created_at: u.created_at,
      }))
      .sort((a, b) => {
        if (leaderboardSort === 'ltp') return b.ltp_balance - a.ltp_balance;
        if (leaderboardSort === 'xp') return b.total_xp - a.total_xp;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

    // 4. Redemption / Reward Claims Query
    const claimWhere: any = {};
    if (claimStatus && claimStatus !== 'all') {
      claimWhere.status = claimStatus.toUpperCase();
    }

    const rawClaims = await prisma.user_reward_claims.findMany({
      where: claimWhere,
      orderBy: { claimed_at: 'desc' },
      take: 40,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar_url: true,
            phone: true,
          },
        },
      },
    });

    const claims: EconomyRedemptionClaimItem[] = rawClaims.map((c) => ({
      id: c.id,
      user_id: c.user_id,
      reward_type: c.reward_type,
      reward_title: c.reward_title,
      status: c.status,
      level: c.level,
      voucher_code: c.voucher_code,
      tracking_number: c.tracking_number,
      claimed_at: c.claimed_at,
      fulfilled_at: c.fulfilled_at,
      user: {
        id: c.user.id,
        name: c.user.name,
        email: c.user.email,
        avatar_url: getPublicImageUrl(c.user.avatar_url, 'users'),
        phone: c.user.phone,
      },
    }));

    // 5. Recent LTP Debit/Credit Transaction Streams
    const rawTransactions = await prisma.user_ltp_transactions.findMany({
      orderBy: { created_at: 'desc' },
      take: 30,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar_url: true,
          },
        },
      },
    });

    const transactions: EconomyTransactionItem[] = rawTransactions.map((t) => ({
      id: t.id,
      user_id: t.user_id,
      amount: Number(t.amount),
      type: t.type,
      activity_type: t.activity_type,
      created_at: t.created_at,
      user: {
        id: t.users.id,
        name: t.users.name,
        email: t.users.email,
        avatar_url: getPublicImageUrl(t.users.avatar_url, 'users'),
      },
    }));

    return {
      success: true,
      stats: {
        totalLtpCirculating,
        totalXpDistributed,
        totalWalletsCount,
        totalAirdropCreditsCount,
        totalTicketRedemptionsCount,
        totalTicketRedemptionsVolume,
        pendingClaimsCount,
        totalClaimsCount,
        usdToIdrRate,
      },
      leaderboard,
      claims,
      transactions,
    };
  } catch (error: any) {
    console.error('Error fetching admin economy data:', error);
    return {
      success: false,
      stats: {
        totalLtpCirculating: 0,
        totalXpDistributed: 0,
        totalWalletsCount: 0,
        totalAirdropCreditsCount: 0,
        totalTicketRedemptionsCount: 0,
        totalTicketRedemptionsVolume: 0,
        pendingClaimsCount: 0,
        totalClaimsCount: 0,
        usdToIdrRate: 17896.90,
      },
      leaderboard: [],
      claims: [],
      transactions: [],
      error: error?.message || 'Failed to fetch economy telemetry',
    };
  }
}

export async function updateClaimStatus(
  claimId: number,
  newStatus: 'APPROVED' | 'COMPLETED' | 'REJECTED' | 'PENDING',
  voucherCode?: string
) {
  try {
    await requireRole(['super admin', 'admin', 'finances']);

    const updated = await prisma.user_reward_claims.update({
      where: { id: claimId },
      data: {
        status: newStatus,
        voucher_code: voucherCode || undefined,
        fulfilled_at: newStatus === 'APPROVED' || newStatus === 'COMPLETED' ? new Date() : null,
      },
    });

    revalidatePath('/admin/economy');
    revalidatePath('/admin/rewards');
    return { success: true, status: updated.status };
  } catch (error: any) {
    console.error('Error updating claim status:', error);
    return { success: false, error: error?.message || 'Failed to update claim' };
  }
}

export async function grantManualAirdrop(
  userId: number,
  ltpAmount: number,
  xpAmount: number,
  reason: string
) {
  try {
    await requireRole(['super admin', 'admin', 'finances']);

    if (!userId || (ltpAmount <= 0 && xpAmount <= 0)) {
      return { success: false, error: 'User ID and positive LTP or XP amount are required.' };
    }

    const now = new Date();

    await prisma.$transaction(async (tx) => {
      // 1. Credit LTP Wallet
      if (ltpAmount > 0) {
        await tx.user_ltp_wallets.upsert({
          where: { user_id: userId },
          create: {
            user_id: userId,
            balance: ltpAmount,
            created_at: now,
            updated_at: now,
          },
          update: {
            balance: { increment: ltpAmount },
            updated_at: now,
          },
        });

        // Record transaction
        await tx.user_ltp_transactions.create({
          data: {
            user_id: userId,
            amount: ltpAmount,
            type: 'credit',
            activity_type: reason ? `MANUAL_AIRDROP: ${reason.slice(0, 30)}` : 'MANUAL_ADMIN_AIRDROP',
            source_id: userId,
            source_table: 'admin_airdrop',
            created_at: now,
          },
        });
      }

      // 2. Credit XP and update level
      if (xpAmount > 0) {
        const currentXp = await tx.user_xp.findUnique({
          where: { user_id: userId },
        });

        const newTotalXp = (currentXp?.total_xp || 0) + xpAmount;
        // Simple level progression: 1000 XP per level
        const newLevel = Math.max(1, Math.floor(newTotalXp / 1000) + 1);

        await tx.user_xp.upsert({
          where: { user_id: userId },
          create: {
            user_id: userId,
            total_xp: newTotalXp,
            current_level: newLevel,
            created_at: now,
          },
          update: {
            total_xp: { increment: xpAmount },
            current_level: newLevel,
          },
        });

        await tx.user_xp_history.create({
          data: {
            user_id: userId,
            amount: xpAmount,
            activity_type: reason ? `MANUAL_AIRDROP: ${reason.slice(0, 30)}` : 'MANUAL_ADMIN_AIRDROP',
            source_id: userId,
            source_table: 'admin_airdrop',
            created_at: now,
          },
        });
      }
    });

    revalidatePath('/admin/economy');
    revalidatePath('/admin/rewards');
    return { success: true };
  } catch (error: any) {
    console.error('Error executing manual airdrop:', error);
    return { success: false, error: error?.message || 'Failed to execute airdrop' };
  }
}
