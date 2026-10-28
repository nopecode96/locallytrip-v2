/**
 * Centralized Platform Transaction Fee Calculator & Resolution Service
 *
 * Mendukung perhitungan take-rate dinamis berbasis konfigurasi append-only,
 * aman untuk audit transaksi lama (historical safety), serta fallback 12% default.
 */

import prisma from '@/lib/prisma';

export interface FeeBreakdown {
  configId: number | null;
  configName: string;
  category: string;
  feePercent: number; // e.g. 12.0
  feeType: 'PERCENTAGE' | 'FIXED' | 'HYBRID';
  feeBearer: 'HOST' | 'TRAVELER' | 'SPLIT';
  grossAmount: number;
  platformFee: number;
  hostNetEarning: number;
  effectiveFrom: Date;
}

/**
 * Mendapatkan konfigurasi fee yang aktif pada tanggal tertentu (default: sekarang).
 * Jika tabel belum siap atau terjadi kendala DB, return fallback default 12%.
 */
export async function getActiveFeeConfiguration(
  category: string = 'EXPERIENCES',
  atDate: Date = new Date()
): Promise<{
  id: number | null;
  name: string;
  category: string;
  feePercent: number;
  feeType: 'PERCENTAGE' | 'FIXED' | 'HYBRID';
  feeBearer: 'HOST' | 'TRAVELER' | 'SPLIT';
  effectiveFrom: Date;
}> {
  try {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT id, name, category, fee_percent, fee_type, fee_bearer, effective_from
      FROM public.platform_fee_configurations
      WHERE category = ${category}
        AND is_active = true
        AND effective_from <= ${atDate}
      ORDER BY effective_from DESC
      LIMIT 1;
    `;

    if (rows && rows.length > 0) {
      const row = rows[0];
      return {
        id: Number(row.id),
        name: String(row.name),
        category: String(row.category),
        feePercent: Number(row.fee_percent),
        feeType: (row.fee_type as any) || 'PERCENTAGE',
        feeBearer: (row.fee_bearer as any) || 'HOST',
        effectiveFrom: new Date(row.effective_from),
      };
    }
  } catch (error) {
    console.error('Failed to query platform_fee_configurations, falling back to 12% default:', error);
  }

  // Fallback standar jika data belum ada
  return {
    id: null,
    name: 'Standard Take-Rate Fallback (12%)',
    category,
    feePercent: 12.0,
    feeType: 'PERCENTAGE',
    feeBearer: 'HOST',
    effectiveFrom: new Date('2026-01-01T00:00:00Z'),
  };
}

/**
 * Menghitung rincian biaya transaksi tur experiences secara presisi.
 */
export async function calculateExperienceBookingFee(
  grossAmount: number,
  atDate: Date = new Date()
): Promise<FeeBreakdown> {
  const safeGross = Math.max(0, Number(grossAmount) || 0);
  const config = await getActiveFeeConfiguration('EXPERIENCES', atDate);

  const rate = config.feePercent / 100;
  const platformFee = Math.round(safeGross * rate * 100) / 100;
  const hostNetEarning = Math.max(0, Math.round((safeGross - platformFee) * 100) / 100);

  return {
    configId: config.id,
    configName: config.name,
    category: config.category,
    feePercent: config.feePercent,
    feeType: config.feeType,
    feeBearer: config.feeBearer,
    grossAmount: safeGross,
    platformFee,
    hostNetEarning,
    effectiveFrom: config.effectiveFrom,
  };
}

/**
 * Helper untuk membaca data fee dari objek booking lama secara backward-compatible.
 */
export function extractBookingFeeDetails(booking: any): {
  feePercent: number;
  platformFee: number;
  hostNetEarning: number;
  configId: number | null;
} {
  const catSpec = (booking?.category_specific as any) || {};
  const gross = Number(catSpec.gross_amount ?? booking?.total_price ?? 0);

  // Jika sudah tercatat di booking baru
  if (catSpec.fee_config_id || catSpec.platform_fee !== undefined) {
    const feeVal = Number(catSpec.platform_fee ?? 0);
    const feeRate = catSpec.platform_take_rate
      ? parseFloat(String(catSpec.platform_take_rate).replace('%', ''))
      : 12.0;
    return {
      feePercent: isNaN(feeRate) ? 12.0 : feeRate,
      platformFee: feeVal,
      hostNetEarning: Number(catSpec.host_net_earning ?? Math.max(0, gross - feeVal)),
      configId: catSpec.fee_config_id ? Number(catSpec.fee_config_id) : null,
    };
  }

  // Fallback untuk transaksi masa lampau
  const fallbackPercent = 12.0;
  const fallbackFee = Math.round(gross * 0.12 * 100) / 100;
  return {
    feePercent: fallbackPercent,
    platformFee: fallbackFee,
    hostNetEarning: Math.max(0, gross - fallbackFee),
    configId: null,
  };
}
