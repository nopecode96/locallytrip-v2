export type SupportedLocale = 'id' | 'en';

/**
 * Mengambil teks terjemahan dengan fallback cerdas:
 * - Jika currentLang === 'id', utamakan ${field}_id -> fallback ke ${field}
 * - Jika currentLang === 'en', utamakan ${field}_en -> fallback ke ${field}
 */
export function getLocalizedContent<T extends Record<string, any>>(
  item: T,
  field: string,
  currentLang: string = 'id'
): string {
  if (!item) return '';

  const lang = currentLang.toLowerCase() === 'en' ? 'en' : 'id';
  const localizedKey = `${field}_${lang}`;

  if (item[localizedKey] && typeof item[localizedKey] === 'string' && item[localizedKey].trim() !== '') {
    return item[localizedKey];
  }

  // Fallback ke bahasa sebaliknya jika ada
  const alternativeKey = lang === 'id' ? `${field}_en` : `${field}_id`;
  if (item[alternativeKey] && typeof item[alternativeKey] === 'string' && item[alternativeKey].trim() !== '') {
    return item[alternativeKey];
  }

  // Fallback ke kolom dasar
  if (item[field] && typeof item[field] === 'string') {
    return item[field];
  }

  return '';
}
