import idDict from '@/dictionaries/id.json';
import enDict from '@/dictionaries/en.json';

export type Dictionary = typeof idDict;
export type Locale = 'id' | 'en';

const dictionaries: Record<Locale, Dictionary> = {
  id: idDict,
  en: enDict,
};

export async function getDictionary(locale: Locale | string): Promise<Dictionary> {
  const normalizedLocale = locale === 'en' ? 'en' : 'id';
  return dictionaries[normalizedLocale] || dictionaries.id;
}
