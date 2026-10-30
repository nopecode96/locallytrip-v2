import { recordAiApiLog } from '@/lib/ai/quotaTracker';

export interface GeneratedStoryContent {
  title: string;
  excerpt: string;
  contentMarkdown: string;
  tags: string[];
  metaTitle: string;
  metaDescription: string;
  targetCity: string;
}

export interface GeneratedForumThreadContent {
  title: string;
  content: string;
  category: string;
  tags: string[];
}

export interface GeneratedMeetupContent {
  title: string;
  description: string;
  cityName: string;
  durationDays: number;
  maxMembers: number;
}

const AI_MODELS = ['gemini-3.8-flash', 'gemini-flash-latest'];

/**
 * Panggil Gemini dengan proteksi logging telemetri
 */
async function callGemini(prompt: string, feature: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  for (const model of AI_MODELS) {
    const startTime = Date.now();
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              topP: 0.95,
            },
          }),
        }
      );

      const latencyMs = Date.now() - startTime;
      if (response.ok) {
        const json = await response.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        const tokens = json.usageMetadata?.totalTokenCount || 500;

        recordAiApiLog({
          feature,
          model,
          statusCode: 200,
          isSuccess: true,
          tokensUsed: tokens,
          latencyMs,
        }).catch(() => {});

        if (text && text.trim()) return text.trim();
      } else {
        recordAiApiLog({
          feature,
          model,
          statusCode: response.status,
          isSuccess: false,
          errorMessage: `Status ${response.status}`,
          latencyMs,
        }).catch(() => {});
      }
    } catch (err: any) {
      recordAiApiLog({
        feature,
        model,
        statusCode: 500,
        isSuccess: false,
        errorMessage: err?.message || 'Gemini error',
        latencyMs: Date.now() - startTime,
      }).catch(() => {});
    }
  }

  return null;
}

/**
 * Generate Cerita Jurnal Perjalanan dengan SEO Google Page-1 Ready
 */
export async function generateSyntheticStory(cityName: string, topic?: string): Promise<GeneratedStoryContent | null> {
  const prompt = `
Kamu adalah seorang traveler lokal Indonesia yang ramah, santai, dan berpengalaman.
Tulis sebuah cerita perjalanan (travel story) nyata tentang pengalaman seru dan otentik di kota/destinasi "${cityName}".
Topik/fokus: ${topic || 'Hidden gem kuliner lokal, rute jalan santai pagi, tips hemat, atau spot sunrise otentik'}.

ATURAN WAJIB:
1. Gaya bahasa: Mengalir ramah, personal (gunakan sudut pandang "Aku / Saya"), tidak kaku, bahasa Indonesia yang hidup dan disukai traveler lokal.
2. Panjang konten: 4 - 6 paragraf terstruktur dengan sub-heading (H2 / H3).
3. Buat konten ramah SEO dan mudah dibaca oleh Google Search dan Ask AI (ChatGPT / Gemini / Perplexity).
4. Berikan format respon HANYA dalam JSON valid tanpa markdown fence (\`\`\`json):
{
  "title": "Judul Menarik & Mengundang Klik (Maks 70 karakter)",
  "excerpt": "Ringkasan memikat tentang cerita ini (Maks 150 karakter)",
  "contentMarkdown": "Isi lengkap artikel menggunakan format Markdown...",
  "tags": ["tag1", "tag2", "tag3"],
  "metaTitle": "Judul SEO untuk Google",
  "metaDescription": "Deskripsi meta ringkas ramah SEO"
}
`;

  const rawRes = await callGemini(prompt, 'SYNTHETIC_STORY_GEN');
  if (!rawRes) return null;

  try {
    const cleanJson = rawRes.replace(/^```(?:json)?\r?\n/i, '').replace(/\r?\n```$/i, '').trim();
    const parsed = JSON.parse(cleanJson);
    return {
      ...parsed,
      targetCity: cityName,
    };
  } catch (e) {
    console.error('[generateSyntheticStory] Failed to parse JSON:', e);
    return null;
  }
}

/**
 * Generate Diskusi Thread Forum Komunitas
 */
export async function generateSyntheticForumThread(categoryName: string, cityName: string): Promise<GeneratedForumThreadContent | null> {
  const prompt = `
Kamu adalah seorang traveler anggota komunitas Locallytrip. Buatlah sebuah pertanyaan atau topik diskusi forum komunitas travel di kategori "${categoryName}" terkait destinasi "${cityName}".
Topik bisa berupa: Rekomendasi rental motor terpercaya, tips solo traveling aman, warung kopi lokal terbaik buat kerja remote, atau tips transport murah.

ATURAN:
1. Nada bicara: Akrab, santai, layaknya bertanya di forum/grup traveler.
2. Panjang konten: 2 - 3 paragraf singkat dan jelas.
3. Berikan respon HANYA dalam JSON valid tanpa kode pembungkus:
{
  "title": "Judul Thread Diskusi yang Menarik",
  "content": "Isi pertanyaan atau cerita singkat pembuka diskusi...",
  "tags": ["tag1", "tag2"]
}
`;

  const rawRes = await callGemini(prompt, 'SYNTHETIC_FORUM_GEN');
  if (!rawRes) return null;

  try {
    const cleanJson = rawRes.replace(/^```(?:json)?\r?\n/i, '').replace(/\r?\n```$/i, '').trim();
    const parsed = JSON.parse(cleanJson);
    return {
      ...parsed,
      category: categoryName,
    };
  } catch (e) {
    return null;
  }
}

/**
 * Generate Balasan Diskusi / Komentar
 */
export async function generateSyntheticReply(originalContent: string, personaName: string): Promise<string> {
  const prompt = `
Ada postingan traveler di komunitas Locallytrip berikut:
"${originalContent.slice(0, 500)}"

Kamu adalah traveler lain bernama "${personaName}".
Tulis balasan (reply) yang ramah, suportif, dan memberikan tips atau sharing pengalaman pribadi yang relevan (1 - 3 kalimat santai).
Kembalikan HANYA teks balasan langsung tanpa tanda kutip pembuka atau penutup.
`;

  const res = await callGemini(prompt, 'SYNTHETIC_REPLY_GEN');
  return res || 'Wah info yang sangat menarik! Terima kasih sudah berbagi pengalamannya.';
}

/**
 * Generate Agenda Meetup Kopi Darat Komunitas
 */
export async function generateSyntheticMeetup(cityName: string): Promise<GeneratedMeetupContent | null> {
  const prompt = `
Buat satu ide agenda meetup santai komunitas traveler Locallytrip di "${cityName}".
Contoh ide: Morning Coffee & Street Photo Walk, Sunset Chill di Pantai, Hunting Kuliner Pasar Malam, atau Solo Traveler Gathering.

Berikan respon HANYA format JSON valid tanpa pembungkus:
{
  "title": "Nama Agenda Meetup (misal: Morning Coffee & Street Walk di Braga)",
  "description": "Deskripsi agenda kegiatan, titik kumpul, dan yang perlu dibawa traveler (2 paragraf santai)...",
  "durationDays": 1,
  "maxMembers": 8
}
`;

  const rawRes = await callGemini(prompt, 'SYNTHETIC_MEETUP_GEN');
  if (!rawRes) return null;

  try {
    const cleanJson = rawRes.replace(/^```(?:json)?\r?\n/i, '').replace(/\r?\n```$/i, '').trim();
    const parsed = JSON.parse(cleanJson);
    return {
      ...parsed,
      cityName,
    };
  } catch (e) {
    return null;
  }
}
