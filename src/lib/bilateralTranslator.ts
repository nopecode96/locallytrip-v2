/**
 * Bilateral Auto-Translator (Indonesian <-> English)
 * Mendukung penerjemahan dua arah untuk:
 * - Judul (Title)
 * - Deskripsi berformat Markdown / HTML Tiptap (mempertahankan heading, bold, list, bullet, tag)
 * - Daftar Fasilitas, Perlengkapan, Exclusions (Arrays)
 * - Rute Perjalanan / Itinerary
 */

interface TranslationResult {
  success: boolean;
  translatedText: string;
  source: 'gemini' | 'mymemory' | 'heuristic' | 'original';
}

const CANDIDATE_GEMINI_MODELS = [
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-1.5-flash',
];

/**
 * Menerjemahkan satu string teks (bisa plain text, Markdown, atau HTML)
 */
export async function translateBilateralText(
  text: string,
  targetLang: 'id' | 'en'
): Promise<string> {
  if (!text || typeof text !== 'string' || text.trim() === '') {
    return '';
  }

  const cleanText = text.trim();
  const sourceLang = targetLang === 'en' ? 'id' : 'en';
  const targetLanguageName =
    targetLang === 'id'
      ? 'Bahasa Indonesia yang santai, luwes, dan natural'
      : 'fluent, engaging, and natural English';

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY;

  // 1. Prioritas Utama: Google Gemini AI dengan preservasi Markdown & HTML
  if (apiKey) {
    const prompt = `You are an expert travel copywriter and localization translator.
Translate the following travel content from ${sourceLang.toUpperCase()} into ${targetLanguageName}.

CRITICAL RULES:
1. Preserve ALL Markdown formatting EXACTLY as they are:
   - Headings (##, ###, ####)
   - Bold (**text**), Italic (*text* or _text_)
   - Blockquotes (> quote)
   - Lists (- item, * item, 1. item)
   - Links [text](url)
2. Preserve ALL HTML tags and attributes EXACTLY as they are:
   - <p>, <h2>, <h3>, <h4>, <ul>, <ol>, <li>, <blockquote>, <strong>, <em>, <a>, <img>
   - Do NOT escape HTML tags or strip them.
3. Translate ONLY the human reading content.
4. Return ONLY the raw translated text directly without any preface, explanations, or wrapping \`\`\`markdown code fences.

Content to translate:
${cleanText}`;

    for (const model of CANDIDATE_GEMINI_MODELS) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.2,
              },
            }),
            signal: controller.signal,
          }
        );
        clearTimeout(timeoutId);

        if (response.ok) {
          const json = await response.json();
          const candidate = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidate && candidate.trim()) {
            let result = candidate.trim();
            // Bersihkan jika model membungkusnya dalam code fence
            result = result.replace(/^```(?:markdown|html)?\r?\n/i, '').replace(/\r?\n```$/i, '').trim();
            return result;
          }
        } else if (response.status === 400) {
          // Kunci API tidak valid / error format request; langsung beralih ke fallback
          break;
        }
      } catch (geminiErr) {
        // Lanjut ke model berikutnya
      }
    }
  }

  // 2. Fallback Sekunder: MyMemory Translation API (dengan perlindungan timeout)
  try {
    // Jika teks berukuran wajar (< 1000 karakter), gunakan MyMemory
    if (cleanText.length <= 1000) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const langPair = `${sourceLang}|${targetLang}`;
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanText)}&langpair=${langPair}`;

      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'LocallyTrip-TravelApp/2.0' },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const translated = data?.responseData?.translatedText;
        if (translated && typeof translated === 'string' && translated.trim()) {
          // Unescape HTML entities jika ada (misal &#39;)
          let unescaped = translated
            .replace(/&#39;/g, "'")
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>');

          // Perbaiki artefak spasi pada Markdown jika ditambahkan oleh translator eksternal
          unescaped = unescaped
            .replace(/#\s+(?=#)/g, '#')
            .replace(/\*\s+(?=\*)/g, '*');

          return unescaped.trim();
        }
      }
    } else {
      // Jika teks panjang, terjemahkan per baris / paragraf agar MyMemory tidak memotong
      const lines = cleanText.split('\n');
      const translatedLines: string[] = [];
      for (const line of lines) {
        if (!line.trim()) {
          translatedLines.push('');
          continue;
        }
        // Periksa apakah baris adalah heading atau bullet
        const prefixMatch = line.match(/^(\s*(?:#{1,4}|-|\*|\d+\.)\s+)/);
        const prefix = prefixMatch ? prefixMatch[1] : '';
        const lineContent = line.slice(prefix.length).trim();

        if (!lineContent) {
          translatedLines.push(line);
          continue;
        }

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2500);
          const langPair = `${sourceLang}|${targetLang}`;
          const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(lineContent)}&langpair=${langPair}`;
          const res = await fetch(url, {
            signal: controller.signal,
            headers: { 'User-Agent': 'LocallyTrip-TravelApp/2.0' },
          });
          clearTimeout(timeoutId);
          if (res.ok) {
            const data = await res.json();
            const translated = data?.responseData?.translatedText;
            if (translated) {
              translatedLines.push(prefix + translated.trim());
              continue;
            }
          }
        } catch {
          // ignore line error
        }
        translatedLines.push(line);
      }
      return translatedLines.join('\n');
    }
  } catch (myMemoryErr) {
    // MyMemory fallback error
  }

  // 3. Fallback Terakhir: Return teks asli jika seluruh penerjemah offline
  return cleanText;
}

/**
 * Menerjemahkan array string (seperti inclusions, exclusions, what_to_bring) secara paralel
 */
export async function translateBilateralList(
  items: string[],
  targetLang: 'id' | 'en'
): Promise<string[]> {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  const validItems = items.filter((item) => typeof item === 'string' && item.trim().length > 0);
  if (validItems.length === 0) return [];

  const translatedPromises = validItems.map((item) =>
    translateBilateralText(item, targetLang)
  );

  return Promise.all(translatedPromises);
}
