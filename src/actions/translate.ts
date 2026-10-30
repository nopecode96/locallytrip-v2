'use server';

/**
 * Server Action: Translasi teks UGC (User Generated Content) On-Demand via Gemini Flash
 * Digunakan untuk Forum Threads, Meetups, Komentar, dan Stories.
 * Otomatis mendeteksi bahasa sumber secara cerdas dan menerjemahkannya ke bahasa lawan (ID <-> EN).
 */
export async function translateUgcText(
  text: string,
  preferredLocale?: 'id' | 'en'
): Promise<{
  success: boolean;
  translatedText?: string;
  detectedSourceLang?: string;
  targetLang?: 'id' | 'en';
  error?: string;
}> {
  try {
    if (!text || text.trim() === '') {
      return { success: false, error: 'Teks tidak boleh kosong.' };
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY;

    if (apiKey) {
      const prompt = `You are a professional bilingual travel localization assistant.
Detect the language of the source text, then translate it:
- If the source text is in Indonesian (or Indonesian slang), translate it into natural English.
- If the source text is in English (or any other language), translate it into warm, engaging, and natural Bahasa Indonesia.

CRITICAL RULES:
1. Preserve ALL Markdown formatting EXACTLY as they are:
   - Headings (##, ###, etc.)
   - Bold (**text**), Italic (*text* or _text_)
   - Blockquotes (> quote)
   - Bullet lists (- item or 1. item)
   - Links [text](url)
2. Preserve paragraph breaks.
3. Keep travel jargon, informal vibe, and place names accurate.
4. Do NOT add preamble, commentary, greetings, or notes.
5. Return ONLY a valid JSON object strictly matching this schema:
{"detectedSourceLang": "id" | "en" | "other", "targetLang": "id" | "en", "translatedText": "the string result"}

Source Text:
${text}`;

      const candidateModels = ['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
      for (const model of candidateModels) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);

          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  temperature: 0.1,
                  responseMimeType: 'application/json',
                },
              }),
              signal: controller.signal,
            }
          );
          clearTimeout(timeoutId);

          if (response.ok) {
            const json = await response.json();
            const rawOutput = json.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawOutput && rawOutput.trim()) {
              try {
                const parsed = JSON.parse(rawOutput.trim());
                if (parsed.translatedText) {
                  return {
                    success: true,
                    translatedText: parsed.translatedText.trim(),
                    detectedSourceLang: parsed.detectedSourceLang || 'id',
                    targetLang: (parsed.targetLang as 'id' | 'en') || (parsed.detectedSourceLang === 'id' ? 'en' : 'id'),
                  };
                }
              } catch (parseErr) {
                // In case it returned pure text
                return {
                  success: true,
                  translatedText: rawOutput.trim(),
                  targetLang: preferredLocale === 'en' ? 'en' : 'id',
                };
              }
            }
          }
        } catch (err) {
          console.warn(`Translation candidate ${model} error:`, err);
        }
      }
    }

    // Fallback: Gunakan Google Translate API jika Gemini tidak dapat dijangkau
    const isProbablyId = /[a-zA-Z]/.test(text) && /\b(yang|dan|di|ini|ke|dari|untuk|pada|adalah|bisa|buat|kalian|banget|nggak|aja|kalau)\b/i.test(text);
    const target = isProbablyId ? 'en' : 'id';
    try {
      const gtUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;
      const gtRes = await fetch(gtUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (gtRes.ok) {
        const gtData = await gtRes.json();
        const simpleTranslated = gtData[0]?.map((item: any) => item[0]).join('') || text;
        return {
          success: true,
          translatedText: simpleTranslated.trim(),
          targetLang: target,
        };
      }
    } catch (gtErr) {
      console.warn('Google Translate fallback error:', gtErr);
    }

    return {
      success: true,
      translatedText: text,
      targetLang: target,
    };
  } catch (error) {
    console.error('Error in translateUgcText:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal menerjemahkan teks.',
    };
  }
}
