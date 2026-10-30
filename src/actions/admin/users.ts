'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getPublicImageUrl } from '@/lib/images';
import { requireRole } from '@/lib/admin-auth';

export interface AdminUserItem {
  id: number;
  name: string;
  email: string;
  username: string | null;
  role: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  is_verified: boolean;
  is_trusted: boolean;
  email_verified_at: Date | null;
  created_at: Date;
  last_login_at: Date | null;
  kyc_status: string;
  ltp_balance: number;
  total_xp: number;
  xp_level: number;
  bookings_count: number;
  experiences_count: number;
}

export interface GetAdminUsersParams {
  search?: string;
  role?: string;
  kycStatus?: string;
  page?: number;
  pageSize?: number;
  limit?: number;
}

export async function getAdminUsers(params: GetAdminUsersParams = {}) {
  try {
    await requireRole(['super admin', 'admin']);

    const { search = '', role = 'all', kycStatus = 'all', page = 1 } = params;
    const pageSize = params.pageSize || params.limit || 10;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    // Search filter across name, email, username, phone
    if (search.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { email: { contains: search.trim(), mode: 'insensitive' } },
        { username: { contains: search.trim(), mode: 'insensitive' } },
        { phone: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    // Role filter
    if (role && role !== 'all') {
      where.role = { equals: role.toLowerCase().trim(), mode: 'insensitive' };
    }

    // KYC filter
    if (kycStatus && kycStatus !== 'all') {
      if (kycStatus === 'approved') {
        where.OR = [
          { is_verified: true },
          { host_kyc_host_kyc_user_idTousers: { status: 'approved' } },
        ];
      } else if (kycStatus === 'pending') {
        where.host_kyc_host_kyc_user_idTousers = { status: 'pending' };
      } else if (kycStatus === 'unverified') {
        where.AND = [
          { is_verified: { not: true } },
          {
            OR: [
              { host_kyc_host_kyc_user_idTousers: null },
              { host_kyc_host_kyc_user_idTousers: { status: 'unverified' } },
            ],
          },
        ];
      }
    }

    // Fetch users with sorting newest registrations first
    const [rawUsers, totalCount, statsSummary] = await Promise.all([
      prisma.users.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: pageSize,
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          role: true,
          phone: true,
          avatar_url: true,
          is_active: true,
          is_verified: true,
          is_trusted: true,
          email_verified_at: true,
          created_at: true,
          last_login_at: true,
          host_kyc_host_kyc_user_idTousers: {
            select: {
              status: true,
            },
          },
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
          _count: {
            select: {
              bookings: true,
              experiences: true,
            },
          },
        },
      }),
      prisma.users.count({ where }),
      // Quick statistics summary for telemetry badges
      Promise.all([
        prisma.users.count(),
        prisma.users.count({ where: { role: 'traveller' } }),
        prisma.users.count({ where: { role: 'host' } }),
        prisma.users.count({ where: { role: { in: ['admin', 'super admin', 'moderator', 'finances', 'marketing'] } } }),
        prisma.users.count({ where: { is_active: false } }),
      ]),
    ]);

    const users: AdminUserItem[] = rawUsers.map((u) => {
      let resolvedKyc = 'unverified';
      if (u.is_verified || u.host_kyc_host_kyc_user_idTousers?.status === 'approved') {
        resolvedKyc = 'approved';
      } else if (u.host_kyc_host_kyc_user_idTousers?.status === 'pending') {
        resolvedKyc = 'pending';
      } else if (u.host_kyc_host_kyc_user_idTousers?.status === 'rejected') {
        resolvedKyc = 'rejected';
      }

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        username: u.username,
        role: u.role || 'traveller',
        phone: u.phone,
        avatar_url: getPublicImageUrl(u.avatar_url, 'users'),
        is_active: u.is_active ?? true,
        is_verified: Boolean(u.is_verified),
        is_trusted: Boolean(u.is_trusted),
        email_verified_at: u.email_verified_at,
        created_at: u.created_at,
        last_login_at: u.last_login_at,
        kyc_status: resolvedKyc,
        ltp_balance: u.user_ltp_wallets?.balance ? Number(u.user_ltp_wallets.balance) : 0,
        total_xp: u.user_xp?.total_xp || 0,
        xp_level: u.user_xp?.current_level || 1,
        bookings_count: u._count?.bookings || 0,
        experiences_count: u._count?.experiences || 0,
      };
    });

    const [totalUsers, totalTravellers, totalHosts, totalStaff, totalInactive] = statsSummary;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    return {
      success: true,
      users,
      data: users,
      totalCount,
      totalPages,
      currentPage: page,
      pagination: {
        totalItems: totalCount,
        totalPages,
        currentPage: page,
        pageSize,
      },
      stats: {
        totalUsers,
        totalTravellers,
        totalHosts,
        totalStaff,
        totalInactive,
      },
    };
  } catch (error: any) {
    console.error('Error fetching admin users:', error);
    return {
      success: false,
      users: [],
      data: [],
      totalCount: 0,
      totalPages: 1,
      currentPage: 1,
      pagination: {
        totalItems: 0,
        totalPages: 1,
        currentPage: 1,
        pageSize: 10,
      },
      stats: {
        totalUsers: 0,
        totalTravellers: 0,
        totalHosts: 0,
        totalStaff: 0,
        totalInactive: 0,
      },
      error: error?.message || 'Failed to fetch users',
    };
  }
}

export async function toggleUserStatus(userId: number, currentStatus: boolean) {
  try {
    await requireRole(['super admin', 'admin']);

    const updated = await prisma.users.update({
      where: { id: userId },
      data: {
        is_active: !currentStatus,
        updated_at: new Date(),
      },
    });

    revalidatePath('/admin/users');
    return { success: true, is_active: updated.is_active };
  } catch (error: any) {
    console.error('Error toggling user status:', error);
    return { success: false, error: error?.message || 'Failed to update user status' };
  }
}

export async function updateUserRole(userId: number, newRole: string) {
  try {
    await requireRole(['super admin', 'admin']);

    const roleClean = newRole.toLowerCase().trim();
    const matchedRole = await prisma.roles.findFirst({
      where: { name: roleClean },
      select: { id: true },
    });

    const updated = await prisma.users.update({
      where: { id: userId },
      data: {
        role: roleClean,
        role_id: matchedRole ? matchedRole.id : undefined,
        updated_at: new Date(),
      },
    });

    revalidatePath('/admin/users');
    return { success: true, role: updated.role };
  } catch (error: any) {
    console.error('Error updating user role:', error);
    return { success: false, error: error?.message || 'Failed to update user role' };
  }
}
