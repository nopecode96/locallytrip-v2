import { NextRequest, NextResponse } from 'next/server';

/**
 * Route API POST /api/translate
 * Menerjemahkan konten artikel Markdown secara riil menggunakan Google Gemini AI
 * dengan fallback ke Google Cloud / Google Translate API jika diperlukan.
 */
export async function POST(req: NextRequest) {
  try {
    const { text, targetLang, isMarkdown = false } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ success: false, error: 'Text is required' }, { status: 400 });
    }

    const langCode = targetLang === 'en' ? 'en' : 'id';
    const targetLanguageName = langCode === 'id' ? 'Bahasa Indonesia' : 'English';

    const prompt = isMarkdown
      ? `You are a professional travel article translator.
Translate the following travel blog content into natural, engaging ${targetLanguageName}.
CRITICAL RULES:
1. Preserve ALL Markdown formatting EXACTLY as they are (do not remove ##, ###, **, *, >, bullet lists, or line breaks).
2. Do NOT add preamble, commentary, greetings, or tags like "[Terjemahan Otomatis]".
3. Only output the raw translated Markdown text directly.

Content to translate:
${text}`
      : `You are a professional travel translator.
Translate the following travel comment or community text into natural, warm, and engaging ${targetLanguageName}.
Do NOT add preamble, commentary, or tags. Output only the translation directly.

Text to translate:
${text}`;

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY;

    // 1. Prioritas Utama: Google Gemini AI (Gunakan model ultra-fast gemini-3.5-flash-lite)
    if (apiKey) {
      const candidateModels = ['gemini-3.5-flash-lite', 'gemini-3.8-flash'];
      for (const model of candidateModels) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);

          const aiRes = await fetch(
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

          if (aiRes.ok) {
            const aiData = await aiRes.json();
            const translatedMarkdown = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (translatedMarkdown && translatedMarkdown.trim()) {
              let cleanResult = translatedMarkdown.trim();
              cleanResult = cleanResult.replace(/^```(?:markdown|html)?\r?\n/i, '').replace(/\r?\n```$/i, '').trim();
              return NextResponse.json({
                success: true,
                translatedText: cleanResult,
              });
            }
          }
        } catch (modelErr) {
          console.warn(`Model ${model} failed, trying next candidate:`, modelErr);
        }
      }
    }

    // 2. Fallback Google Translate endpoint
    try {
      const googleTranslateUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${langCode}&dt=t&q=${encodeURIComponent(text)}`;
      const gtRes = await fetch(googleTranslateUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      if (gtRes.ok) {
        const gtData = await gtRes.json();
        const simpleTranslated = gtData[0]?.map((item: any) => item[0]).join('') || text;
        return NextResponse.json({
          success: true,
          translatedText: simpleTranslated.trim(),
        });
      }
    } catch (gtErr) {
      console.warn('Google Translate fallback failed:', gtErr);
    }

    // 3. Fallback jika gagal koneksi
    return NextResponse.json({
      success: true,
      translatedText: text,
    });
  } catch (error) {
    console.error('API /api/translate error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to translate' },
      { status: 500 }
    );
  }
}
