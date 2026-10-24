export type SupportedCurrency = 'IDR' | 'USD';

export interface ExchangeRatesMap {
  [toCurrency: string]: number;
}

/**
 * Pembulatan harga psikologis komersial untuk Rupiah (IDR):
 * Menghilangkan angka canggung/keriting hasil perkalian kurs valas (contoh: Rp447.423 -> Rp450.000).
 * Mengacu pada standar harga komersial industri travel lokal:
 * - < Rp 50.000: dibulatkan ke kelipatan Rp 1.000 terdekat
 * - Rp 50.000 s/d Rp 200.000: dibulatkan ke kelipatan Rp 5.000 terdekat (misal: Rp 143.175 -> Rp 145.000)
 * - Rp 200.000 s/d Rp 1.000.000: dibulatkan ke kelipatan Rp 10.000 terdekat (misal: Rp 447.423 -> Rp 450.000)
 * - > Rp 1.000.000: dibulatkan ke kelipatan Rp 25.000 terdekat (misal: Rp 1.199.092 -> Rp 1.200.000, Rp 1.234.886 -> Rp 1.225.000)
 */
export function roundCommercialIdr(rawIdr: number): number {
  if (!rawIdr || rawIdr <= 0 || isNaN(rawIdr)) return 0;

  if (rawIdr < 50000) {
    return Math.round(rawIdr / 1000) * 1000;
  }
  if (rawIdr < 200000) {
    return Math.round(rawIdr / 5000) * 5000;
  }
  if (rawIdr < 1000000) {
    return Math.round(rawIdr / 10000) * 10000;
  }
  // Nominal di atas 1 juta
  return Math.round(rawIdr / 25000) * 25000;
}

/**
 * Konversi nilai angka harga ke target currency dengan pembulatan psikologis komersial.
 */
export function convertPrice(
  amount: number | null | undefined,
  baseCurrency: string = 'USD',
  targetCurrency: SupportedCurrency = 'IDR',
  usdToIdrRate: number = 17896.90
): number {
  if (amount == null || isNaN(amount) || amount <= 0) return 0;

  const baseUpper = (baseCurrency || 'USD').toUpperCase();
  const targetUpper = targetCurrency.toUpperCase();

  let amountInUsd = amount;
  if (baseUpper === 'IDR') {
    amountInUsd = amount / usdToIdrRate;
  }

  if (targetUpper === 'IDR') {
    const rawIdr = baseUpper === 'IDR' ? amount : amountInUsd * usdToIdrRate;
    return roundCommercialIdr(rawIdr);
  }

  return Number(amountInUsd.toFixed(2));
}

/**
 * Konversi dan format harga dinamis:
 * - baseCurrency: mata uang acuan produk host (USD atau IDR)
 * - targetCurrency: preferensi mata uang pengunjung (IDR atau USD)
 * - usdToIdrRate: kurs dari tabel currency_rates (default ~17896.90)
 */
export function formatPrice(
  amount: number | null | undefined,
  baseCurrency: string = 'USD',
  targetCurrency: SupportedCurrency = 'IDR',
  usdToIdrRate: number = 17896.90
): string {
  if (amount == null || isNaN(amount)) {
    return targetCurrency === 'IDR' ? 'Rp -' : '$ -';
  }

  const baseUpper = (baseCurrency || 'USD').toUpperCase();
  const targetUpper = targetCurrency.toUpperCase();

  // Konversi amount ke USD terlebih dahulu jika base adalah IDR
  let amountInUsd = amount;
  if (baseUpper === 'IDR') {
    amountInUsd = amount / usdToIdrRate;
  }

  // Jika target adalah IDR
  if (targetUpper === 'IDR') {
    const rawIdr = baseUpper === 'IDR' ? amount : amountInUsd * usdToIdrRate;
    const finalIdr = roundCommercialIdr(rawIdr);
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(finalIdr);
  }

  // Jika target adalah USD
  const finalUsd = amountInUsd;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: Number.isInteger(finalUsd) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(finalUsd);
}
