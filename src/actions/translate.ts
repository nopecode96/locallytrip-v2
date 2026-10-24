'use server';

/**
 * Server Action: Translasi teks UGC (User Generated Content) On-Demand via Gemini Flash
 * Digunakan untuk Forum Threads, Meetups, dan Stories saat tombol "Lihat Terjemahan" diklik.
 */
export async function translateUgcText(
  text: string,
  targetLang: 'id' | 'en' = 'id'
): Promise<{ success: boolean; translatedText?: string; error?: string }> {
  try {
    if (!text || text.trim() === '') {
      return { success: false, error: 'Teks tidak boleh kosong.' };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const targetLanguageName = targetLang === 'id' ? 'Bahasa Indonesia yang santai, luwes, dan natural' : 'fluent and natural English';

    if (apiKey) {
      const prompt = `
Terjemahkan teks artikel atau catatan perjalanan berikut ke dalam ${targetLanguageName}.

PENTING - ATURAN FORMAT MARKDOWN:
1. Pertahankan SELURUH format Markdown asli secara utuh dan presisi:
   - Heading (##, ###, dll)
   - Cetak tebal (**teks**), miring (*teks*)
   - Tanda kutip (> blok kutipan)
   - Butir daftar (- item atau 1. item)
   - Garis pemisah atau tautan
2. Jangan hapus, kurangi, atau ubah format heading Markdown tersebut.
3. Pertahankan nada bicara hangat, emosi petualang, dan istilah khas lokal/slang perjalanan jika relevan.
4. Berikan HANYA teks hasil terjemahan langsung, tanpa tanda kutip pembuka/penutup dan tanpa catatan penjelasan tambahan.

Teks Asli:
"""
${text}
"""
`;

      const candidateModels = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-flash-latest'];
      for (const model of candidateModels) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.2 },
              }),
            }
          );

          if (response.ok) {
            const json = await response.json();
            const candidate = json.candidates?.[0]?.content?.parts?.[0]?.text;
            if (candidate && candidate.trim()) {
              return { success: true, translatedText: candidate.trim() };
            }
          }
        } catch (err) {
          console.warn(`Translation candidate ${model} error:`, err);
        }
      }
    }

    // Fallback jika API key tidak tersedia
    return {
      success: true,
      translatedText: `[Terjemahan Otomatis (${targetLang.toUpperCase()})]: ${text}`,
    };
  } catch (error) {
    console.error('Error in translateUgcText:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal menerjemahkan teks.',
    };
  }
}
