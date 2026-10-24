'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getAdminStaffSession } from '@/lib/admin-auth';
import { getPublicImageUrl } from '@/lib/images';

export interface AdminB2BPartnerItem {
  id: number;
  name: string;
  slug: string;
  category: string;
  logoUrl: string;
  bannerUrl: string | null;
  websiteUrl: string | null;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  description: string | null;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'PAUSED' | string;
  commissionRate: number; // Percentage, e.g. 10.0%, 12.5%
  totalCampaigns: number;
  totalVouchersPool: number;
  totalBookingsReferred: number;
  totalEarningsIdr: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminB2BStats {
  totalPartners: number;
  activePartners: number;
  totalBookingsReferred: number;
  totalEarningsOrFeesIdr: number;
}

export interface GetAdminB2BParams {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface GetAdminB2BResponse {
  success: boolean;
  partners: AdminB2BPartnerItem[];
  data?: AdminB2BPartnerItem[];
  stats: AdminB2BStats;
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

export interface B2BActionResult {
  success: boolean;
  message: string;
  error?: string;
}

export interface CreateB2BPartnerInput {
  name: string;
  category: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  websiteUrl?: string;
  logoUrl?: string;
  commissionRate?: number;
  description?: string;
  status?: string;
}

export interface UpdateB2BPartnerInput {
  name?: string;
  category?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  websiteUrl?: string;
  logoUrl?: string;
  commissionRate?: number;
  description?: string;
  status?: string;
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
    throw new Error('Akses ditolak. Anda tidak memiliki izin marketing atau administrator.');
  }

  return session;
}

function parseCommissionFromText(text: string | null, fallback = 10): number {
  if (!text) return fallback;
  const match = text.match(/(\d+(\.\d+)?)%/);
  if (match && match[1]) {
    const num = parseFloat(match[1]);
    if (!isNaN(num) && num > 0) return num;
  }
  return fallback;
}

/**
 * 1. Fetch all B2B partners and compute corporate telemetry with standardized pagination
 */
export async function getAdminB2BPartnersData(
  params: GetAdminB2BParams = {}
): Promise<GetAdminB2BResponse> {
  try {
    await requireAdminOrMarketingSession();

    const { search = '', status = 'all', page = 1 } = params;
    const pageSize = params.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (search.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { contact_person: { contains: search.trim(), mode: 'insensitive' } },
        { contact_email: { contains: search.trim(), mode: 'insensitive' } },
        { category: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    if (status && status !== 'all') {
      where.status = { equals: status.toUpperCase().trim() };
    }

    const [rawPartners, totalCount, allPartnersForTelemetry] = await Promise.all([
      prisma.brand_partners.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { created_at: 'desc' },
        include: {
          campaigns: {
            include: {
              claims: { select: { id: true } },
              vouchers: { select: { id: true } },
            },
          },
        },
      }),
      prisma.brand_partners.count({ where }),
      prisma.brand_partners.findMany({
        select: {
          status: true,
          campaigns: {
            select: {
              claims: { select: { id: true } },
              claimed_quota: true,
              placement_fee: true,
            },
          },
        },
      }),
    ]);

    let activePartners = 0;
    let totalBookingsReferred = 0;
    let totalEarningsOrFeesIdr = 0;

    for (const item of allPartnersForTelemetry) {
      const statusUpper = (item.status || 'PENDING').toUpperCase();
      if (statusUpper === 'ACTIVE' || statusUpper === 'APPROVED') {
        activePartners += 1;
      }
      for (const camp of item.campaigns) {
        totalBookingsReferred += camp.claims.length || camp.claimed_quota || 0;
        totalEarningsOrFeesIdr += Number(camp.placement_fee) || 0;
      }
    }

    const partners: AdminB2BPartnerItem[] = rawPartners.map((item) => {
      const statusUpper = (item.status || 'PENDING').toUpperCase();
      let partnerBookings = 0;
      let partnerEarnings = 0;
      let totalVouchers = 0;

      for (const camp of item.campaigns) {
        partnerBookings += camp.claims.length || camp.claimed_quota || 0;
        partnerEarnings += Number(camp.placement_fee) || 0;
        totalVouchers += camp.vouchers.length;
      }

      const commissionRate = parseCommissionFromText(item.description, 10);

      return {
        id: item.id,
        name: item.name,
        slug: item.slug,
        category: item.category,
        logoUrl: getPublicImageUrl(item.logo_url, 'advertisement'),
        bannerUrl: item.banner_url ? getPublicImageUrl(item.banner_url, 'banners') : null,
        websiteUrl: item.website_url,
        contactPerson: item.contact_person,
        contactEmail: item.contact_email,
        contactPhone: item.contact_phone,
        description: item.description,
        status: statusUpper === 'APPROVED' ? 'ACTIVE' : statusUpper,
        commissionRate,
        totalCampaigns: item.campaigns.length,
        totalVouchersPool: totalVouchers,
        totalBookingsReferred: partnerBookings,
        totalEarningsIdr: partnerEarnings,
        createdAt: item.created_at.toISOString(),
        updatedAt: item.updated_at.toISOString(),
      };
    });

    const stats: AdminB2BStats = {
      totalPartners: allPartnersForTelemetry.length,
      activePartners,
      totalBookingsReferred,
      totalEarningsOrFeesIdr,
    };

    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    return {
      success: true,
      partners,
      data: partners,
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
    console.error('Error fetching admin B2B partners data:', error);
    return {
      success: false,
      partners: [],
      data: [],
      stats: {
        totalPartners: 0,
        activePartners: 0,
        totalBookingsReferred: 0,
        totalEarningsOrFeesIdr: 0,
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
      error: error?.message || 'Gagal memuat data mitra B2B.',
    };
  }
}

/**
 * 2. Create / Register a new B2B Partner
 */
export async function createB2BPartner(
  input: CreateB2BPartnerInput
): Promise<B2BActionResult> {
  try {
    await requireAdminOrMarketingSession();

    const nameClean = input.name.trim();
    if (!nameClean || nameClean.length < 3) {
      return {
        success: false,
        message: 'Nama perusahaan mitra B2B minimal 3 karakter.',
      };
    }

    const emailClean = input.contactEmail.trim().toLowerCase();
    if (!emailClean.includes('@')) {
      return {
        success: false,
        message: 'Email kontak PIC tidak valid.',
      };
    }

    // Generate unique slug
    const baseSlug = nameClean
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    let slug = baseSlug;
    let suffix = 1;
    while (await prisma.brand_partners.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    const commissionPercent = input.commissionRate ?? 10;
    const descWithCommission = input.description
      ? `${input.description.trim()} (Commission: ${commissionPercent}%)`
      : `Corporate B2B partner (Commission: ${commissionPercent}%)`;

    const created = await prisma.brand_partners.create({
      data: {
        name: nameClean,
        slug,
        category: (input.category || 'CORPORATE').toUpperCase(),
        logo_url:
          input.logoUrl?.trim() ||
          'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=300&auto=format&fit=crop&q=80',
        website_url: input.websiteUrl?.trim() || null,
        contact_person: input.contactPerson.trim() || 'Partnership Lead',
        contact_email: emailClean,
        contact_phone: input.contactPhone.trim() || '-',
        description: descWithCommission,
        status: (input.status || 'ACTIVE').toUpperCase(),
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    revalidatePath('/admin/b2b');
    revalidatePath('/admin/marketing/b2b');

    return {
      success: true,
      message: `Mitra B2B "${created.name}" berhasil didaftarkan dengan komisi ${commissionPercent}%.`,
    };
  } catch (error: any) {
    console.error('Error creating B2B partner:', error);
    return {
      success: false,
      message: error?.message || 'Gagal mendaftarkan mitra B2B.',
      error: error?.message,
    };
  }
}

/**
 * 3. Update B2B Partner Details
 */
export async function updateB2BPartner(
  partnerId: number,
  input: UpdateB2BPartnerInput
): Promise<B2BActionResult> {
  try {
    await requireAdminOrMarketingSession();

    const partner = await prisma.brand_partners.findUnique({
      where: { id: partnerId },
    });

    if (!partner) {
      return {
        success: false,
        message: 'Mitra B2B tidak ditemukan.',
      };
    }

    const updateData: any = { updated_at: new Date() };

    if (input.name) updateData.name = input.name.trim();
    if (input.category) updateData.category = input.category.toUpperCase();
    if (input.contactPerson) updateData.contact_person = input.contactPerson.trim();
    if (input.contactEmail) updateData.contact_email = input.contactEmail.trim().toLowerCase();
    if (input.contactPhone) updateData.contact_phone = input.contactPhone.trim();
    if (input.websiteUrl !== undefined) updateData.website_url = input.websiteUrl?.trim() || null;
    if (input.logoUrl) updateData.logo_url = input.logoUrl.trim();
    if (input.status) updateData.status = input.status.toUpperCase();

    if (input.commissionRate !== undefined || input.description !== undefined) {
      const baseDesc = input.description !== undefined ? input.description : (partner.description || '');
      const rate = input.commissionRate !== undefined ? input.commissionRate : parseCommissionFromText(baseDesc, 10);
      // clean old commission mention and re-append
      const cleanDesc = baseDesc.replace(/\(Commission: [^)]+\)/, '').trim();
      updateData.description = `${cleanDesc} (Commission: ${rate}%)`.trim();
    }

    const updated = await prisma.brand_partners.update({
      where: { id: partnerId },
      data: updateData,
    });

    revalidatePath('/admin/b2b');
    revalidatePath('/admin/marketing/b2b');

    return {
      success: true,
      message: `Data mitra B2B "${updated.name}" berhasil diperbarui.`,
    };
  } catch (error: any) {
    console.error('Error updating B2B partner:', error);
    return {
      success: false,
      message: error?.message || 'Gagal memperbarui data mitra B2B.',
      error: error?.message,
    };
  }
}

/**
 * 4. Toggle Partner Status (ACTIVE ↔ SUSPENDED ↔ PENDING)
 */
export async function toggleB2BPartnerStatus(
  partnerId: number,
  targetStatus: 'ACTIVE' | 'SUSPENDED' | 'PENDING'
): Promise<B2BActionResult> {
  try {
    await requireAdminOrMarketingSession();

    const partner = await prisma.brand_partners.findUnique({
      where: { id: partnerId },
    });

    if (!partner) {
      return {
        success: false,
        message: 'Mitra B2B tidak ditemukan.',
      };
    }

    const updated = await prisma.brand_partners.update({
      where: { id: partnerId },
      data: {
        status: targetStatus,
        updated_at: new Date(),
      },
    });

    revalidatePath('/admin/b2b');
    revalidatePath('/admin/marketing/b2b');

    return {
      success: true,
      message: `Status kemitraan "${updated.name}" berhasil diubah menjadi ${targetStatus}.`,
    };
  } catch (error: any) {
    console.error('Error in toggleB2BPartnerStatus:', error);
    return {
      success: false,
      message: error?.message || 'Gagal mengubah status kemitraan.',
      error: error?.message,
    };
  }
}

/**
 * 5. Delete B2B Partner
 */
export async function deleteB2BPartner(
  partnerId: number
): Promise<B2BActionResult> {
  try {
    await requireAdminOrMarketingSession();

    const partner = await prisma.brand_partners.findUnique({
      where: { id: partnerId },
      include: { _count: { select: { campaigns: true } } },
    });

    if (!partner) {
      return {
        success: false,
        message: 'Mitra B2B tidak ditemukan.',
      };
    }

    if (partner._count.campaigns > 0) {
      // Suspend partner instead of hard delete to preserve voucher and campaign history
      await prisma.brand_partners.update({
        where: { id: partnerId },
        data: {
          status: 'SUSPENDED',
          updated_at: new Date(),
        },
      });

      revalidatePath('/admin/b2b');
      revalidatePath('/admin/marketing/b2b');

      return {
        success: true,
        message: `Mitra "${partner.name}" memiliki riwayat kampanye/voucher promosi, status dinonaktifkan (SUSPENDED).`,
      };
    }

    await prisma.brand_partners.delete({
      where: { id: partnerId },
    });

    revalidatePath('/admin/b2b');
    revalidatePath('/admin/marketing/b2b');

    return {
      success: true,
      message: `Mitra B2B "${partner.name}" berhasil dihapus secara permanen.`,
    };
  } catch (error: any) {
    console.error('Error deleting B2B partner:', error);
    return {
      success: false,
      message: error?.message || 'Gagal menghapus data mitra B2B.',
      error: error?.message,
    };
  }
}
