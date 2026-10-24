'use server';

import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCurrentUserSession } from '@/actions/bookings';
import { revalidatePath } from 'next/cache';
import { createAdminNotification } from '@/actions/admin/notifications';

export interface SubmitBrandApplicationInput {
  name: string;
  category: string;
  logoUrl?: string;
  bannerUrl?: string;
  websiteUrl?: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  description?: string;
  tierPackage: 'COMMUNITY_BARTER' | 'FEATURED_PARTNER' | 'PREMIUM_SPONSOR';
  campaignTitle: string;
  campaignDescription: string;
  campaignTerms?: string;
  campaignImageUrl?: string;
  costInLtp?: number;
  minXpLevel?: number;
  voucherCodes: string; // multi-line atau koma
  durationDays?: number;
}

export interface SubmitBrandApplicationResult {
  success: boolean;
  message: string;
  partnerId?: number;
  campaignId?: number;
}

export interface ClaimBrandPerkResult {
  success: boolean;
  message: string;
  voucherCode?: string;
  terms?: string | null;
  campaignTitle?: string;
  partnerName?: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
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
      username: true,
      role: true,
    },
  });
}

/**
 * Server Action: Pendaftaran Mitra Brand B2B & Kampanye Promosi
 */
export async function submitBrandPartnershipApplication(
  input: SubmitBrandApplicationInput
): Promise<SubmitBrandApplicationResult> {
  try {
    const {
      name,
      category,
      logoUrl = '/images/placeholder-brand.png',
      bannerUrl,
      websiteUrl,
      contactPerson,
      contactEmail,
      contactPhone,
      description,
      tierPackage = 'COMMUNITY_BARTER',
      campaignTitle,
      campaignDescription,
      campaignTerms,
      campaignImageUrl = '/images/placeholder-perk.jpg',
      costInLtp = 0,
      minXpLevel = 1,
      voucherCodes,
      durationDays = 30,
    } = input;

    // Validasi Field Wajib
    if (!name || !contactPerson || !contactEmail || !contactPhone || !campaignTitle || !campaignDescription) {
      return {
        success: false,
        message: 'Mohon lengkapi seluruh informasi profil brand, kontak PIC, dan rincian kampanye penawaran.',
      };
    }

    // Parse Voucher Codes
    const rawCodes = (voucherCodes || '')
      .split(/[\r\n,]+/)
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    // Hilangkan duplikasi voucher code
    const uniqueCodes = Array.from(new Set(rawCodes));

    if (uniqueCodes.length === 0) {
      return {
        success: false,
        message: 'Mohon masukkan setidaknya 1 kode voucher unik untuk program penawaran ini.',
      };
    }

    const timestamp = Date.now();
    const basePartnerSlug = slugify(name);
    const partnerSlug = `${basePartnerSlug}-${timestamp.toString().slice(-4)}`;

    const baseCampaignSlug = slugify(campaignTitle);
    const campaignSlug = `${baseCampaignSlug}-${timestamp.toString().slice(-4)}`;

    // Penentuan Fee & Status Pembayaran
    const isFeatured = tierPackage === 'FEATURED_PARTNER';
    const placementFee = isFeatured ? 1500000 : 0;
    const paymentStatus = isFeatured ? 'UNPAID' : 'WAIVED_BARTER';

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

    // Simpan ke Database secara Atomik
    const result = await prisma.$transaction(async (tx) => {
      // 1. Buat Profil Mitra Brand
      const partner = await tx.brand_partners.create({
        data: {
          name,
          slug: partnerSlug,
          category,
          logo_url: logoUrl || '/images/placeholder-brand.png',
          banner_url: bannerUrl || null,
          website_url: websiteUrl || null,
          contact_person: contactPerson,
          contact_email: contactEmail,
          contact_phone: contactPhone,
          description: description || null,
          status: 'PENDING',
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      // 2. Buat Kampanye Penawaran
      const campaign = await tx.brand_campaigns.create({
        data: {
          partner_id: partner.id,
          title: campaignTitle,
          slug: campaignSlug,
          description: campaignDescription,
          terms: campaignTerms || null,
          image_url: campaignImageUrl || '/images/placeholder-perk.jpg',
          tier_package: tierPackage,
          placement_fee: placementFee,
          payment_status: paymentStatus,
          is_featured: isFeatured,
          cost_in_ltp: Math.max(0, costInLtp),
          min_xp_level: Math.max(1, minXpLevel),
          total_quota: uniqueCodes.length,
          claimed_quota: 0,
          start_date: startDate,
          end_date: endDate,
          is_active: true,
          created_at: new Date(),
        },
      });

      // 3. Masukkan Seluruh Kode Voucher
      await tx.brand_voucher_codes.createMany({
        data: uniqueCodes.map((code) => ({
          campaign_id: campaign.id,
          code,
          is_claimed: false,
        })),
      });

      return { partner, campaign };
    });

    try {
      await createAdminNotification({
        type: 'b2b_application',
        title: 'Aplikasi B2B Baru Masuk! 🏢',
        message: `Mitra ${name} (${category}) mengajukan kemitraan B2B paket ${tierPackage}.`,
        action_url: '/b2b',
        data: {
          partnerId: result.partner.id,
          campaignId: result.campaign.id,
          partnerName: name,
          category,
        },
      });
    } catch (notifErr) {
      console.error('Failed to notify admin about B2B application:', notifErr);
    }

    try {
      revalidatePath('/[lang]/community/perks', 'page');
      revalidatePath('/[lang]/partner-with-us', 'page');
    } catch {
      // Ignore when running outside Next.js server context
    }

    return {
      success: true,
      message:
        tierPackage === 'FEATURED_PARTNER'
          ? 'Pendaftaran kemitraan Featured Partner berhasil diajukan! Invoice penempatan Rp 1.500.000 dan instruksi aktivasi telah dikirimkan ke email PIC.'
          : 'Pendaftaran kemitraan Community Barter berhasil diterima! Tim Locallytrip akan memverifikasi penawaran dalam 1x24 jam kerja.',
      partnerId: result.partner.id,
      campaignId: result.campaign.id,
    };
  } catch (err: any) {
    console.error('Error in submitBrandPartnershipApplication:', err);
    return {
      success: false,
      message: err?.message || 'Terjadi kesalahan sistem saat memproses permohonan kemitraan brand.',
    };
  }
}

/**
 * Server Action: Klaim & Penukaran Voucher Mitra Brand oleh Pengguna
 */
export async function claimBrandPerkVoucher(campaignId: number): Promise<ClaimBrandPerkResult> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return {
        success: false,
        message: 'Silakan masuk (login) ke akun Locallytrip Anda untuk menukarkan voucher mitra.',
      };
    }

    // Ambil detail kampanye beserta mitra
    const campaign = await prisma.brand_campaigns.findUnique({
      where: { id: campaignId },
      include: {
        partner: true,
        _count: {
          select: {
            vouchers: { where: { is_claimed: false } },
          },
        },
      },
    });

    if (!campaign) {
      return {
        success: false,
        message: 'Penawaran voucher mitra tidak ditemukan.',
      };
    }

    if (!campaign.is_active) {
      return {
        success: false,
        message: 'Kampanye penawaran mitra ini sedang dinonaktifkan.',
      };
    }

    if (new Date() > new Date(campaign.end_date)) {
      return {
        success: false,
        message: 'Masa berlaku penawaran voucher ini telah berakhir.',
      };
    }

    if (campaign._count.vouchers <= 0) {
      return {
        success: false,
        message: 'Maaf, seluruh kuota kode voucher untuk penawaran ini telah habis diklaim.',
      };
    }

    // 1. Validasi Batas Minimum Level XP
    const userXp = await prisma.user_xp.findUnique({
      where: { user_id: user.id },
      select: { current_level: true, total_xp: true },
    });

    const currentLevel = userXp?.current_level || 1;
    if (currentLevel < campaign.min_xp_level) {
      return {
        success: false,
        message: `Penawaran eksklusif ini membutuhkan reputasi minimal Level ${campaign.min_xp_level}. Level Anda saat ini adalah Level ${currentLevel}.`,
      };
    }

    // 2. Validasi Saldo Koin LTP
    const costInLtp = campaign.cost_in_ltp;
    if (costInLtp > 0) {
      const wallet = await prisma.user_ltp_wallets.findUnique({
        where: { user_id: user.id },
        select: { balance: true },
      });

      const currentBalance = wallet ? Number(wallet.balance) : 0;
      if (currentBalance < costInLtp) {
        return {
          success: false,
          message: `Saldo Koin LTP Anda tidak mencukupi. Dibutuhkan ${costInLtp.toLocaleString()} LTP, saldo Anda saat ini: ${currentBalance.toLocaleString()} LTP.`,
        };
      }
    }

    // 3. Eksekusi Klaim Secara Atomik
    const claimResult = await prisma.$transaction(async (tx) => {
      // Ambil 1 kode voucher yang belum diklaim
      const availableVoucher = await tx.brand_voucher_codes.findFirst({
        where: {
          campaign_id: campaignId,
          is_claimed: false,
        },
        orderBy: { id: 'asc' },
      });

      if (!availableVoucher) {
        throw new Error('Kuota voucher telah habis tepat saat transaksi berlangsung.');
      }

      // Tandai voucher telah diklaim
      await tx.brand_voucher_codes.update({
        where: { id: availableVoucher.id },
        data: {
          is_claimed: true,
          claimed_at: new Date(),
          claimed_by_user_id: user.id,
        },
      });

      // Potong saldo LTP jika ada biaya
      if (costInLtp > 0) {
        await tx.user_ltp_wallets.update({
          where: { user_id: user.id },
          data: {
            balance: { decrement: costInLtp },
            updated_at: new Date(),
          },
        });

        await tx.user_ltp_transactions.create({
          data: {
            user_id: user.id,
            amount: costInLtp,
            type: 'debit',
            activity_type: 'brand_perk_redeem',
            source_id: campaign.id,
            source_table: 'brand_campaigns',
            created_at: new Date(),
          },
        });
      }

      // Tingkatkan claimed_quota pada kampanye
      await tx.brand_campaigns.update({
        where: { id: campaign.id },
        data: {
          claimed_quota: { increment: 1 },
        },
      });

      // Catat riwayat klaim pengguna
      await tx.user_brand_claims.create({
        data: {
          user_id: user.id,
          campaign_id: campaign.id,
          voucher_code: availableVoucher.code,
          ltp_spent: costInLtp,
          status: 'ACTIVE',
          claimed_at: new Date(),
        },
      });

      // Buat Notifikasi Lonceng
      await tx.notifications.create({
        data: {
          user_id: user.id,
          type: 'PERK_CLAIMED',
          title: `Voucher ${campaign.partner.name} Berhasil Diklaim! 🎁`,
          message: `Kode voucher Anda: ${availableVoucher.code}. Cek detail di katalog perks.`,
          action_url: `/community/perks`,
          read: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      return availableVoucher.code;
    });

    try {
      revalidatePath('/[lang]/community/perks', 'page');
      revalidatePath('/[lang]/community/rewards', 'page');
      revalidatePath('/[lang]/dashboard', 'page');
    } catch {
      // Ignore when running outside Next.js server context
    }

    return {
      success: true,
      message: 'Voucher berhasil diklaim dan koin LTP Anda berhasil ditukarkan!',
      voucherCode: claimResult,
      terms: campaign.terms,
      campaignTitle: campaign.title,
      partnerName: campaign.partner.name,
    };
  } catch (err: any) {
    console.error('Error in claimBrandPerkVoucher:', err);
    return {
      success: false,
      message: err?.message || 'Gagal menukarkan voucher mitra. Silakan coba beberapa saat lagi.',
    };
  }
}
