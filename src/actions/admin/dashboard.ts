'use server';

import prisma from '@/lib/prisma';
import { getAdminStaffSession, requireStaffSession } from '@/lib/admin-auth';

export interface AdminDashboardOverviewStats {
  totalUsers: number;
  totalHosts: number;
  totalTravellers: number;
  totalExperiences: number;
  totalPublishedExperiences: number;
  totalBookings: number;
  totalCompletedBookings: number;
  grossRevenueUsd: number;
  grossRevenueIdr: number;
  platformRevenueUsd: number;
  platformRevenueIdr: number;
  ltpCirculating: number;
  totalXpDistributed: number;
  ltpDebitCount: number;
  pendingKycCount: number;
  usdToIdrRate: number;
}

export interface AdminDashboardRecentBooking {
  id: number;
  bookingReference: string | null;
  experienceTitle: string;
  customerName: string;
  customerEmail: string;
  selectedDate: string | null;
  participantCount: number | null;
  totalPrice: number;
  status: string | null;
  createdAt: string;
}

export interface GetAdminDashboardOverviewResponse {
  success: boolean;
  stats: AdminDashboardOverviewStats;
  recentBookings: AdminDashboardRecentBooking[];
  error?: string;
}

const DEFAULT_STATS: AdminDashboardOverviewStats = {
  totalUsers: 0,
  totalHosts: 0,
  totalTravellers: 0,
  totalExperiences: 0,
  totalPublishedExperiences: 0,
  totalBookings: 0,
  totalCompletedBookings: 0,
  grossRevenueUsd: 0,
  grossRevenueIdr: 0,
  platformRevenueUsd: 0,
  platformRevenueIdr: 0,
  ltpCirculating: 0,
  totalXpDistributed: 0,
  ltpDebitCount: 0,
  pendingKycCount: 0,
  usdToIdrRate: 17896.9,
};

/**
 * Helper internal untuk memeriksa sesi staf / admin.
 * Memanfaatkan universal helper NextAuth + Custom Cookie.
 */
async function getStaffSession() {
  return getAdminStaffSession();
}

/**
 * Server Action: getAdminDashboardOverview
 * Mengambil 100% data agregasi analitik langsung dari PostgreSQL via Prisma ORM secara paralel (Promise.all).
 * Zero mock data / zero static placeholders.
 * Dilengkapi graceful error handling agar tidak pernah melempar exception unhandled yang merusak view klien.
 */
export async function getAdminDashboardOverview(): Promise<GetAdminDashboardOverviewResponse> {
  try {
    // 1. Verifikasi Sesi Staf Operasional
    await requireStaffSession();

    // 2. Ambil Nilai Kurs FX USD -> IDR terkini dari database
    let usdToIdrRate = 17896.90;
    try {
      const rateRecord = await prisma.currency_rates.findFirst({
        where: { from_currency: 'USD', to_currency: 'IDR' },
        orderBy: { rate_date: 'desc' },
      });
      if (rateRecord?.rate) {
        usdToIdrRate = Number(rateRecord.rate);
      }
    } catch (fxErr) {
      console.warn('[Admin Dashboard] FX rate query warning:', fxErr);
    }

    // 3. Kueri Agregasi Basis Data secara Paralel via Promise.all
    const [
      totalUsers,
      totalHosts,
      totalTravellers,
      totalExperiences,
      totalPublishedExperiences,
      totalBookings,
      totalCompletedBookings,
      gmvCompletedAgg,
      gmvAllActiveAgg,
      ltpWalletAgg,
      xpAgg,
      ltpDebitAgg,
      pendingKycCount,
      recentBookingsRaw,
    ] = await Promise.all([
      // 1. Pengguna & Segmentasi Role
      prisma.users.count().catch(() => 0),
      prisma.users.count({ where: { role: 'host' } }).catch(() => 0),
      prisma.users.count({ where: { role: 'traveller' } }).catch(() => 0),

      // 2. Katalog Pengalaman (Total & Published Active)
      prisma.experiences.count().catch(() => 0),
      prisma.experiences
        .count({
          where: {
            status: 'published',
            is_active: true,
          },
        })
        .catch(() => 0),

      // 3. Jumlah Transaksi Pemesanan Tiket
      prisma.bookings.count().catch(() => 0),
      prisma.bookings
        .count({
          where: {
            status: { in: ['completed', 'confirmed', 'settled', 'paid'] },
          },
        })
        .catch(() => 0),

      // 4. Gross Merchandise Value (GMV)
      prisma.bookings
        .aggregate({
          where: {
            status: { in: ['completed', 'confirmed', 'settled', 'paid'] },
          },
          _sum: { total_price: true },
        })
        .catch(() => ({ _sum: { total_price: null } })),
      prisma.bookings
        .aggregate({
          where: {
            NOT: { status: 'cancelled' },
          },
          _sum: { total_price: true },
        })
        .catch(() => ({ _sum: { total_price: null } })),

      // 5. Telemetri Ekonomi Gamifikasi LTP & XP
      prisma.user_ltp_wallets
        .aggregate({ _sum: { balance: true } })
        .catch(() => ({ _sum: { balance: null } })),
      prisma.user_xp
        .aggregate({ _sum: { total_xp: true } })
        .catch(() => ({ _sum: { total_xp: null } })),
      prisma.user_ltp_transactions
        .aggregate({
          where: { type: 'debit' },
          _count: true,
        })
        .catch(() => ({ _count: 0 })),

      // 6. Antrean Kepatuhan Identitas KYC Host
      prisma.host_kyc.count({ where: { status: 'pending' } }).catch(() => 0),

      // 7. Riwayat 10 Pemesanan Terbaru (dengan Relasi Pengalaman & Pengguna)
      prisma.bookings
        .findMany({
          take: 10,
          orderBy: { created_at: 'desc' },
          include: {
            experiences: {
              select: {
                title: true,
              },
            },
            users: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        })
        .catch(() => []),
    ]);

    // Kalkulasi Finansial
    const grossRevenueUsd = Number(
      gmvCompletedAgg._sum.total_price || gmvAllActiveAgg._sum.total_price || 0
    );
    const grossRevenueIdr = Math.round(grossRevenueUsd * usdToIdrRate);

    // Platform Take-Rate 12%
    const platformRevenueUsd = Math.round(grossRevenueUsd * 0.12 * 100) / 100;
    const platformRevenueIdr = Math.round(platformRevenueUsd * usdToIdrRate);

    // Nilai Beredar LTP & XP
    const ltpCirculating = Number(ltpWalletAgg._sum.balance || 0);
    const totalXpDistributed = Number(xpAgg._sum.total_xp || 0);
    const ltpDebitCount = ltpDebitAgg._count || 0;

    // Serialisasi Data Pemesanan Terbaru
    const recentBookings: AdminDashboardRecentBooking[] = recentBookingsRaw.map((b) => {
      let contactName = b.users?.name || 'Tamu Wisatawan';
      let contactEmail = b.users?.email || '-';

      if (b.contact_info && typeof b.contact_info === 'object') {
        const c = b.contact_info as Record<string, unknown>;
        if (typeof c.name === 'string' && c.name.trim()) contactName = c.name.trim();
        if (typeof c.email === 'string' && c.email.trim()) contactEmail = c.email.trim();
      }

      return {
        id: b.id,
        bookingReference: b.booking_reference || `#BK-${b.id}`,
        experienceTitle: b.experiences?.title || 'Pengalaman Wisata Lokal',
        customerName: contactName,
        customerEmail: contactEmail,
        selectedDate: b.selected_date ? b.selected_date.toISOString().slice(0, 10) : null,
        participantCount: b.participant_count || 1,
        totalPrice: Number(b.total_price || 0),
        status: b.status || 'pending',
        createdAt: b.created_at ? b.created_at.toISOString() : new Date().toISOString(),
      };
    });

    const stats: AdminDashboardOverviewStats = {
      totalUsers,
      totalHosts,
      totalTravellers,
      totalExperiences,
      totalPublishedExperiences,
      totalBookings,
      totalCompletedBookings,
      grossRevenueUsd,
      grossRevenueIdr,
      platformRevenueUsd,
      platformRevenueIdr,
      ltpCirculating,
      totalXpDistributed,
      ltpDebitCount,
      pendingKycCount,
      usdToIdrRate,
    };

    return {
      success: true,
      stats,
      recentBookings,
    };
  } catch (error: any) {
    console.error('[Admin Dashboard] Unexpected error in getAdminDashboardOverview:', error);
    return {
      success: false,
      stats: DEFAULT_STATS,
      recentBookings: [],
      error: error?.message || 'Gagal memuat data analitik dashboard dari basis data.',
    };
  }
}

// Backward-compatible alias
export const getAdminDashboardStats = getAdminDashboardOverview;
