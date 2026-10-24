/**
 * Global Content Translation Service
 * Sends translation requests to the unified Next.js API /api/translate
 */
export async function translateContent(
  text: string,
  targetLang: string,
  isMarkdown: boolean = false
): Promise<string> {
  if (!text || text.trim() === '') return text;

  const res = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, targetLang, isMarkdown }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Gagal menerjemahkan konten');
  }

  const data = await res.json();
  return data.translatedText || text;
}
