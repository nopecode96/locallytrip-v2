'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getAdminStaffSession, hasRole } from '@/lib/admin-auth';
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
  brandId: number | null;
  brandPartner?: {
    id: number;
    name: string;
    logoUrl: string;
    category: string;
  } | null;
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
  brandId?: number | null;
}

async function requireAdminOrMarketingSession() {
  const session = await getAdminStaffSession();
  if (!session || !session.isLoggedIn) {
    if (process.env.NODE_ENV === 'development') {
      return { id: 1, name: 'Admin Dev', email: 'admin@locallytrip.com', role: 'admin' };
    }
    throw new Error('Sesi tidak valid. Silakan login terlebih dahulu.');
  }

  if (!hasRole(session, ['super admin', 'admin', 'marketing'])) {
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
          brand_partner: {
            select: {
              id: true,
              name: true,
              logo_url: true,
              category: true,
            },
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
        brandId: item.brand_id,
        brandPartner: item.brand_partner
          ? {
              id: item.brand_partner.id,
              name: item.brand_partner.name,
              logoUrl: item.brand_partner.logo_url,
              category: item.brand_partner.category,
            }
          : null,
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
        brand_id: data.brandId ? Number(data.brandId) : null,
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

export interface BrandPartnerOption {
  id: number;
  name: string;
  category: string;
  logo_url: string;
}

/**
 * 4. Fetch active B2B brand partners for dropdown selection
 */
export async function getActiveBrandPartnersForSelect(): Promise<{
  success: boolean;
  data: BrandPartnerOption[];
}> {
  try {
    const partners = await prisma.brand_partners.findMany({
      where: {
        status: { in: ['ACTIVE', 'APPROVED'] },
      },
      select: {
        id: true,
        name: true,
        category: true,
        logo_url: true,
      },
      orderBy: { name: 'asc' },
    });

    return {
      success: true,
      data: partners,
    };
  } catch (error: any) {
    console.error('Error fetching brand partners for select:', error);
    return {
      success: false,
      data: [],
    };
  }
}

export interface AdminBrandCampaignItem {
  id: number;
  partnerId: number;
  partnerName: string;
  partnerLogo: string;
  partnerCategory: string;
  partnerSlug: string;
  title: string;
  slug: string;
  description: string;
  terms: string | null;
  imageUrl: string;
  tierPackage: string;
  isFeatured: boolean;
  costInLtp: number;
  minXpLevel: number;
  totalQuota: number;
  claimedQuota: number;
  remainingVouchers: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

/**
 * 5. Fetch all Brand Perks campaigns (displayed on /community/perks)
 */
export async function getAdminBrandCampaigns(): Promise<{
  success: boolean;
  campaigns: AdminBrandCampaignItem[];
  error?: string;
}> {
  try {
    const raw = await prisma.brand_campaigns.findMany({
      include: {
        partner: {
          select: {
            id: true,
            name: true,
            logo_url: true,
            category: true,
            slug: true,
          },
        },
        _count: {
          select: {
            vouchers: { where: { is_claimed: false } },
          },
        },
      },
      orderBy: [
        { is_featured: 'desc' },
        { created_at: 'desc' },
      ],
    });

    const campaigns: AdminBrandCampaignItem[] = raw.map((c) => ({
      id: c.id,
      partnerId: c.partner.id,
      partnerName: c.partner.name,
      partnerLogo: c.partner.logo_url,
      partnerCategory: c.partner.category,
      partnerSlug: c.partner.slug,
      title: c.title,
      slug: c.slug,
      description: c.description,
      terms: c.terms,
      imageUrl: c.image_url,
      tierPackage: c.tier_package,
      isFeatured: c.is_featured,
      costInLtp: c.cost_in_ltp,
      minXpLevel: c.min_xp_level,
      totalQuota: c.total_quota,
      claimedQuota: c.claimed_quota,
      remainingVouchers: c._count.vouchers,
      startDate: c.start_date.toISOString(),
      endDate: c.end_date.toISOString(),
      isActive: c.is_active,
      createdAt: c.created_at.toISOString(),
    }));

    return {
      success: true,
      campaigns,
    };
  } catch (error: any) {
    console.error('Error fetching admin brand campaigns:', error);
    return {
      success: false,
      campaigns: [],
      error: error?.message,
    };
  }
}

/**
 * 6. Toggle Brand Perk Campaign status (active/inactive)
 */
export async function toggleBrandCampaignStatus(
  campaignId: number,
  targetStatus: boolean
): Promise<VoucherActionResult> {
  try {
    await requireAdminOrMarketingSession();

    const campaign = await prisma.brand_campaigns.update({
      where: { id: campaignId },
      data: { is_active: targetStatus },
      select: { title: true, is_active: true },
    });

    revalidatePath('/admin/marketing/vouchers');
    revalidatePath('/id/community/perks');
    revalidatePath('/en/community/perks');

    return {
      success: true,
      message: `Status promo "${campaign.title}" berhasil diubah menjadi ${
        campaign.is_active ? 'AKTIF' : 'NONAKTIF'
      }.`,
    };
  } catch (error: any) {
    console.error('Error toggling brand campaign status:', error);
    return {
      success: false,
      message: error?.message || 'Gagal mengubah status promo mitra.',
      error: error?.message,
    };
  }
}

/**
 * 7. Delete Brand Perk Campaign permanently
 */
export async function deleteBrandCampaign(
  campaignId: number
): Promise<VoucherActionResult> {
  try {
    await requireAdminOrMarketingSession();

    const campaign = await prisma.brand_campaigns.findUnique({
      where: { id: campaignId },
      select: { title: true },
    });

    if (!campaign) {
      return {
        success: false,
        message: 'Data promo reward mitra tidak ditemukan.',
      };
    }

    await prisma.brand_campaigns.delete({
      where: { id: campaignId },
    });

    revalidatePath('/admin/marketing/vouchers');
    revalidatePath('/id/community/perks');
    revalidatePath('/en/community/perks');

    return {
      success: true,
      message: `Promo reward mitra "${campaign.title}" berhasil dihapus dari database. Halaman perks telah diperbarui.`,
    };
  } catch (error: any) {
    console.error('Error deleting brand campaign:', error);
    return {
      success: false,
      message: error?.message || 'Gagal menghapus promo reward mitra.',
      error: error?.message,
    };
  }
}

export interface CreateBrandCampaignInput {
  partnerId: number;
  title: string;
  slug?: string;
  description: string;
  terms?: string;
  imageUrl: string;
  tierPackage?: string;
  isFeatured?: boolean;
  costInLtp?: number;
  minXpLevel?: number;
  totalQuota?: number;
  startDate?: string;
  endDate: string;
  voucherCodes?: string;
}

/**
 * 8. Create Brand Perk Campaign (with image and initial voucher codes pool)
 */
export async function createBrandPerkCampaign(
  input: CreateBrandCampaignInput
): Promise<{
  success: boolean;
  message: string;
  campaign?: AdminBrandCampaignItem;
  error?: string;
}> {
  try {
    await requireAdminOrMarketingSession();

    if (!input.partnerId) {
      return { success: false, message: 'Wajib memilih Mitra Brand Partner.' };
    }
    if (!input.title || !input.title.trim()) {
      return { success: false, message: 'Judul kampanye promo wajib diisi.' };
    }
    if (!input.imageUrl || !input.imageUrl.trim()) {
      return { success: false, message: 'Gambar banner promo wajib diunggah.' };
    }
    if (!input.endDate) {
      return { success: false, message: 'Tanggal batas berakhir promo wajib ditentukan.' };
    }

    // Slug generation
    const baseSlug = (input.slug || input.title)
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const existingSlug = await prisma.brand_campaigns.findUnique({
      where: { slug: baseSlug },
    });
    const finalSlug = existingSlug ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug;

    const totalQuota = Math.max(1, Number(input.totalQuota) || 50);

    const campaign = await prisma.brand_campaigns.create({
      data: {
        partner_id: Number(input.partnerId),
        title: input.title.trim(),
        slug: finalSlug,
        description: input.description.trim() || input.title.trim(),
        terms: input.terms?.trim() || null,
        image_url: input.imageUrl.trim(),
        tier_package: input.tierPackage || 'COMMUNITY_BARTER',
        is_featured: Boolean(input.isFeatured),
        cost_in_ltp: Math.max(0, Number(input.costInLtp) || 0),
        min_xp_level: Math.max(1, Number(input.minXpLevel) || 1),
        total_quota: totalQuota,
        claimed_quota: 0,
        start_date: input.startDate ? new Date(input.startDate) : new Date(),
        end_date: new Date(input.endDate),
        is_active: true,
      },
      include: {
        partner: {
          select: {
            id: true,
            name: true,
            logo_url: true,
            category: true,
            slug: true,
          },
        },
      },
    });

    // Populate initial voucher codes pool
    let codes: string[] = [];
    if (input.voucherCodes && input.voucherCodes.trim()) {
      codes = input.voucherCodes
        .split(/[\n,;]+/)
        .map((c) => c.trim().toUpperCase())
        .filter(Boolean);
    } else {
      // Auto generate unique codes
      const prefix = input.title
        .replace(/[^A-Za-z0-9]/g, '')
        .slice(0, 5)
        .toUpperCase() || 'PERK';
      const count = Math.min(totalQuota, 100);
      for (let i = 0; i < count; i++) {
        codes.push(`${prefix}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
      }
    }

    if (codes.length > 0) {
      await prisma.brand_voucher_codes.createMany({
        data: codes.map((code) => ({
          campaign_id: campaign.id,
          code,
          is_claimed: false,
        })),
        skipDuplicates: true,
      });
    }

    revalidatePath('/admin/marketing/vouchers');
    revalidatePath('/id/community/perks');
    revalidatePath('/en/community/perks');

    return {
      success: true,
      message: `Kampanye perk "${campaign.title}" berhasil diterbitkan dan langsung tayang di katalog perks publik.`,
      campaign: {
        id: campaign.id,
        partnerId: campaign.partner.id,
        partnerName: campaign.partner.name,
        partnerLogo: campaign.partner.logo_url,
        partnerCategory: campaign.partner.category,
        partnerSlug: campaign.partner.slug,
        title: campaign.title,
        slug: campaign.slug,
        description: campaign.description,
        terms: campaign.terms,
        imageUrl: campaign.image_url,
        tierPackage: campaign.tier_package,
        isFeatured: campaign.is_featured,
        costInLtp: campaign.cost_in_ltp,
        minXpLevel: campaign.min_xp_level,
        totalQuota: campaign.total_quota,
        claimedQuota: 0,
        remainingVouchers: codes.length,
        startDate: campaign.start_date.toISOString(),
        endDate: campaign.end_date.toISOString(),
        isActive: campaign.is_active,
        createdAt: campaign.created_at.toISOString(),
      },
    };
  } catch (error: any) {
    console.error('Error creating brand perk campaign:', error);
    return {
      success: false,
      message: error?.message || 'Gagal membuat kampanye perk mitra.',
      error: error?.message,
    };
  }
}
