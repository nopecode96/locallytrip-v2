export type SupportedCurrency = 'IDR' | 'USD';

export interface ExchangeRatesMap {
  [toCurrency: string]: number;
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
    let finalIdr = amount;
    if (baseUpper !== 'IDR') {
      finalIdr = Math.round(amountInUsd * usdToIdrRate);
    }
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(Math.round(finalIdr));
  }

  // Jika target adalah USD
  let finalUsd = amountInUsd;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(finalUsd);
}
