import { getDictionary as getDict, Dictionary, Locale } from './dictionary';

export async function getDictionary(locale: Locale | string): Promise<Dictionary> {
  return getDict(locale);
}

export type { Dictionary };
