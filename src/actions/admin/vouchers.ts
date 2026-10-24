'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getAdminStaffSession } from '@/lib/admin-auth';
import { enum_promotion_codes_discount_type, enum_promotion_codes_status, enum_promotion_codes_type } from '@prisma/client';

export interface AdminVoucherItem {
  id: number;
  code: string;
  type: string;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  minBookingAmount: number;
  maxDiscountAmount: number | null;
  usageLimit: number | null;
  usageCount: number;
  stackable: boolean;
  categoryRestrictions: string[];
  validFrom: string;
  validUntil: string | null;
  status: 'active' | 'inactive' | 'expired' | 'disabled';
  description: string | null;
  currency: string;
  internalNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminVoucherStats {
  totalVouchers: number;
  activeVouchers: number;
  totalRedemptions: number;
  totalDiscountGivenIdr: number;
  expiredOrDisabled: number;
}

export interface GetAdminVouchersParams {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface GetAdminVouchersResponse {
  success: boolean;
  vouchers: AdminVoucherItem[];
  data?: AdminVoucherItem[];
  stats: AdminVoucherStats;
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

export interface VoucherActionResult {
  success: boolean;
  message: string;
  error?: string;
}

export interface CreateVoucherInput {
  code: string;
  type?: 'platform' | 'influencer' | 'host' | 'referral';
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  minBookingAmount?: number;
  maxDiscountAmount?: number | null;
  usageLimit?: number | null;
  categoryRestrictions?: string[];
  validFrom: string;
  validUntil?: string | null;
  description?: string;
  currency?: string;
  internalNotes?: string;
}

async function requireAdminOrMarketingSession() {
  const session = await getAdminStaffSession();
  if (!session || !session.isLoggedIn) {
    if (process.env.NODE_ENV === 'development') {
      return { id: 1, name: 'Admin Dev', email: 'admin@locallytrip.com', role: 'admin' };
    }
    throw new Error('Sesi tidak valid. Silakan login terlebih dahulu.');
  }

  if (!session.isStaff) {
    throw new Error('Akses ditolak. Anda tidak memiliki izin marketing atau admin.');
  }

  return session;
}

/**
 * 1. Fetch promo vouchers with standardized pagination and compute marketing telemetry
 */
export async function getAdminVouchersData(
  params: GetAdminVouchersParams = {}
): Promise<GetAdminVouchersResponse> {
  try {
    await requireAdminOrMarketingSession();

    const { search = '', status = 'all', page = 1 } = params;
    const pageSize = params.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (search.trim()) {
      where.OR = [
        { code: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const now = new Date();
    if (status && status !== 'all') {
      if (status === 'active') {
        where.status = { notIn: ['disabled', 'inactive', 'expired'] };
        where.OR = [
          { valid_until: null },
          { valid_until: { gte: now } },
        ];
      } else if (status === 'expired') {
        where.OR = [
          { status: 'expired' },
          { valid_until: { lt: now } },
        ];
      } else if (status === 'disabled') {
        where.status = 'disabled';
      }
    }

    const [rawList, totalCount, allVouchersForTelemetry] = await Promise.all([
      prisma.promotion_codes.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { created_at: 'desc' },
        include: {
          promo_code_usage: {
            select: { discount_amount: true },
          },
        },
      }),
      prisma.promotion_codes.count({ where }),
      prisma.promotion_codes.findMany({
        select: {
          status: true,
          valid_until: true,
          usage_count: true,
          discount_type: true,
          discount_value: true,
          max_discount_amount: true,
          promo_code_usage: {
            select: { discount_amount: true },
          },
        },
      }),
    ]);

    let totalRedemptions = 0;
    let totalDiscountGivenIdr = 0;
    let activeVouchers = 0;
    let expiredOrDisabled = 0;

    for (const item of allVouchersForTelemetry) {
      totalRedemptions += item.usage_count;

      let discountGivenForThis = 0;
      if (item.promo_code_usage && item.promo_code_usage.length > 0) {
        discountGivenForThis = item.promo_code_usage.reduce(
          (sum, u) => sum + Number(u.discount_amount || 0),
          0
        );
      } else {
        const val = Number(item.discount_value) || 0;
        discountGivenForThis =
          item.discount_type === 'percentage'
            ? item.usage_count * (Math.min(val * 3500, Number(item.max_discount_amount) || 100000))
            : item.usage_count * val;
      }
      totalDiscountGivenIdr += discountGivenForThis;

      const isExpiredByDate = item.valid_until ? new Date(item.valid_until) < now : false;
      const effectiveStatus =
        item.status === 'disabled'
          ? 'disabled'
          : item.status === 'inactive'
          ? 'inactive'
          : isExpiredByDate || item.status === 'expired'
          ? 'expired'
          : 'active';

      if (effectiveStatus === 'active') {
        activeVouchers += 1;
      } else {
        expiredOrDisabled += 1;
      }
    }

    const vouchers: AdminVoucherItem[] = rawList.map((item) => {
      const isExpiredByDate = item.valid_until ? new Date(item.valid_until) < now : false;
      const effectiveStatus: 'active' | 'inactive' | 'expired' | 'disabled' =
        item.status === 'disabled'
          ? 'disabled'
          : item.status === 'inactive'
          ? 'inactive'
          : isExpiredByDate || item.status === 'expired'
          ? 'expired'
          : 'active';

      return {
        id: item.id,
        code: item.code,
        type: item.type,
        discountType: item.discount_type as 'percentage' | 'fixed_amount',
        discountValue: Number(item.discount_value),
        minBookingAmount: Number(item.min_booking_amount),
        maxDiscountAmount: item.max_discount_amount ? Number(item.max_discount_amount) : null,
        usageLimit: item.usage_limit,
        usageCount: item.usage_count,
        stackable: item.stackable,
        categoryRestrictions: item.category_restrictions || [],
        validFrom: item.valid_from.toISOString(),
        validUntil: item.valid_until ? item.valid_until.toISOString() : null,
        status: effectiveStatus,
        description: item.description,
        currency: item.currency || 'IDR',
        internalNotes: item.internal_notes,
        createdAt: item.created_at.toISOString(),
        updatedAt: item.updated_at.toISOString(),
      };
    });

    const stats: AdminVoucherStats = {
      totalVouchers: allVouchersForTelemetry.length,
      activeVouchers,
      totalRedemptions,
      totalDiscountGivenIdr,
      expiredOrDisabled,
    };

    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    return {
      success: true,
      vouchers,
      data: vouchers,
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
    console.error('Error fetching admin vouchers data:', error);
    return {
      success: false,
      vouchers: [],
      data: [],
      stats: {
        totalVouchers: 0,
        activeVouchers: 0,
        totalRedemptions: 0,
        totalDiscountGivenIdr: 0,
        expiredOrDisabled: 0,
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
      error: error?.message || 'Gagal memuat daftar voucher diskon.',
    };
  }
}

/**
 * 2. Create a new promo voucher
 */
export async function createPromoVoucher(
  data: CreateVoucherInput
): Promise<VoucherActionResult> {
  try {
    const session = await requireAdminOrMarketingSession();

    const cleanCode = data.code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (!cleanCode || cleanCode.length < 3) {
      return {
        success: false,
        message: 'Kode voucher minimal 3 karakter alfanumerik.',
      };
    }

    if (data.discountValue <= 0) {
      return {
        success: false,
        message: 'Nilai diskon harus lebih besar dari 0.',
      };
    }

    if (data.discountType === 'percentage' && data.discountValue > 100) {
      return {
        success: false,
        message: 'Diskon persentase tidak boleh melebihi 100%.',
      };
    }

    // Check code collision
    const existing = await prisma.promotion_codes.findUnique({
      where: { code: cleanCode },
    });

    if (existing) {
      return {
        success: false,
        message: `Kode voucher "${cleanCode}" sudah digunakan. Gunakan kode lain.`,
      };
    }

    const now = new Date();
    const validFromDate = data.validFrom ? new Date(data.validFrom) : now;
    const validUntilDate = data.validUntil ? new Date(data.validUntil) : null;

    if (validUntilDate && validUntilDate <= validFromDate) {
      return {
        success: false,
        message: 'Tanggal berakhir harus lebih lambat dari tanggal mulai berlaku.',
      };
    }

    const created = await prisma.promotion_codes.create({
      data: {
        code: cleanCode,
        type: (data.type || 'platform') as enum_promotion_codes_type,
        created_by: session.id ? Number(session.id) : null,
        discount_type: data.discountType as enum_promotion_codes_discount_type,
        discount_value: data.discountValue,
        min_booking_amount: data.minBookingAmount || 0,
        max_discount_amount: data.maxDiscountAmount || null,
        usage_limit: data.usageLimit || null,
        usage_count: 0,
        stackable: false,
        category_restrictions: data.categoryRestrictions || [],
        valid_from: validFromDate,
        valid_until: validUntilDate,
        status: enum_promotion_codes_status.active,
        description: data.description?.trim() || null,
        currency: data.currency || 'IDR',
        internal_notes: data.internalNotes?.trim() || null,
        created_at: now,
        updated_at: now,
      },
    });

    revalidatePath('/admin/marketing/vouchers');
    revalidatePath('/admin/vouchers');

    return {
      success: true,
      message: `Voucher promo "${created.code}" berhasil dibuat dan siap digunakan!`,
    };
  } catch (error: any) {
    console.error('Error creating promo voucher:', error);
    return {
      success: false,
      message: error?.message || 'Terjadi kesalahan sistem saat membuat voucher.',
      error: error?.message,
    };
  }
}

/**
 * 3. Toggle Voucher Status (Active ↔ Disabled)
 */
export async function toggleVoucherStatus(
  voucherId: number,
  targetStatus: 'active' | 'disabled'
): Promise<VoucherActionResult> {
  try {
    await requireAdminOrMarketingSession();

    const voucher = await prisma.promotion_codes.findUnique({
      where: { id: voucherId },
    });

    if (!voucher) {
      return {
        success: false,
        message: 'Voucher tidak ditemukan.',
      };
    }

    const updated = await prisma.promotion_codes.update({
      where: { id: voucherId },
      data: {
        status: targetStatus as enum_promotion_codes_status,
        updated_at: new Date(),
      },
    });

    revalidatePath('/admin/marketing/vouchers');
    revalidatePath('/admin/vouchers');

    return {
      success: true,
      message: `Status voucher "${updated.code}" berhasil diubah menjadi ${targetStatus.toUpperCase()}.`,
    };
  } catch (error: any) {
    console.error('Error in toggleVoucherStatus:', error);
    return {
      success: false,
      message: error?.message || 'Gagal mengubah status voucher.',
      error: error?.message,
    };
  }
}

/**
 * 4. Delete Promo Voucher
 */
export async function deletePromoVoucher(
  voucherId: number
): Promise<VoucherActionResult> {
  try {
    await requireAdminOrMarketingSession();

    const voucher = await prisma.promotion_codes.findUnique({
      where: { id: voucherId },
      include: { _count: { select: { promo_code_usage: true } } },
    });

    if (!voucher) {
      return {
        success: false,
        message: 'Voucher tidak ditemukan.',
      };
    }

    if (voucher._count.promo_code_usage > 0) {
      // Soft disable if it has historical bookings to protect financial audit trails
      await prisma.promotion_codes.update({
        where: { id: voucherId },
        data: {
          status: enum_promotion_codes_status.disabled,
          updated_at: new Date(),
        },
      });

      revalidatePath('/admin/marketing/vouchers');
      return {
        success: true,
        message: `Voucher "${voucher.code}" memiliki riwayat transaksi pemesanan, sehingga dinonaktifkan (archived).`,
      };
    }

    await prisma.promotion_codes.delete({
      where: { id: voucherId },
    });

    revalidatePath('/admin/marketing/vouchers');
    revalidatePath('/admin/vouchers');

    return {
      success: true,
      message: `Voucher "${voucher.code}" berhasil dihapus secara permanen.`,
    };
  } catch (error: any) {
    console.error('Error deleting promo voucher:', error);
    return {
      success: false,
      message: error?.message || 'Gagal menghapus voucher promo.',
      error: error?.message,
    };
  }
}
