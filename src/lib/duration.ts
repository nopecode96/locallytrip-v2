/**
 * Helper pemformatan durasi pengalaman logistik yang realistis.
 * Mendukung tampilan rentang jam komersial (contoh: 8 Jam -> '8-10 Jam' atau '8-10 Hours').
 */
export function formatExperienceDuration(
  hours: number | null | undefined,
  locale: 'id' | 'en' = 'id'
): string {
  if (!hours || hours <= 0) {
    return locale === 'id' ? '3-4 Jam' : '3-4 Hours';
  }

  const isId = locale === 'id';
  const unit = isId ? 'Jam' : 'Hours';

  // Multi-day atau seharian penuh
  if (hours >= 24) {
    const days = Math.round(hours / 24);
    if (days === 1) return isId ? '1 Hari Penuh' : 'Full Day';
    return isId ? `${days} Hari` : `${days} Days`;
  }

  // Pemetaan rentang jam realistis untuk operasional tur
  if (hours === 8 || hours === 9) {
    return `8-10 ${unit}`;
  }
  if (hours === 7) {
    return `6-8 ${unit}`;
  }
  if (hours === 6) {
    return `6-7 ${unit}`;
  }
  if (hours === 4) {
    return `3-4 ${unit}`;
  }
  if (hours === 3) {
    return `2-3 ${unit}`;
  }

  return `${hours} ${unit}`;
}
