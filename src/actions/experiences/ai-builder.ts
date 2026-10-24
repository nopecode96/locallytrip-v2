'use server';

import prisma from '@/lib/prisma';
import { enum_experiences_status } from '@prisma/client';
import crypto from 'crypto';

export interface StructuredAiExperience {
  title_id: string;
  title_en: string;
  description_id: string;
  description_en: string;
  what_to_expect: string[];
  included_items: string[];
  excluded_items: string[];
  duration_hours: number;
  max_participants: number;
  suggested_price_idr: number;
  suggested_price_usd: number;
}

export interface BuildExperienceInput {
  draftTitle: string;
  cityId: number;
  rawStory: string;
  hostId?: number;
  publishDirectly?: boolean;
}

/**
 * AI Extractor Engine yang memproses narasi mentah host
 * Menggunakan Gemini API jika GEMINI_API_KEY disetel, atau heuristik cerdas adaptif jika belum.
 */
async function extractWithGemini(rawStory: string, draftTitle: string, cityName: string): Promise<StructuredAiExperience> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const prompt = `
Anda adalah AI Travel Product Builder untuk platform Locallytrip.
Tugas Anda adalah mengekstrak teks mentah dari calon Local Host menjadi skema produk pengalaman wisata terstruktur.

Data Masukan:
Judul Draf: ${draftTitle}
Kota: ${cityName}
Narasi Mentah: """
${rawStory}
"""

Berikan output HANYA berupa JSON valid (tanpa markdown blok tambahan) dengan struktur:
{
  "title_id": "Judul menarik dalam Bahasa Indonesia",
  "title_en": "Catchy title in English",
  "description_id": "Deskripsi naratif menarik dalam Bahasa Indonesia (2-3 paragraf)",
  "description_en": "Compelling narrative description in English (2-3 paragraphs)",
  "what_to_expect": ["Poin 1 agenda/aktivitas", "Poin 2...", "Poin 3..."],
  "included_items": ["Fasilitas yang disediakan host"],
  "excluded_items": ["Pengeluaran atau hal yang tidak ditanggung"],
  "duration_hours": 3,
  "max_participants": 8,
  "suggested_price_idr": 250000,
  "suggested_price_usd": 15
}
`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const candidate = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidate) {
          const parsed = JSON.parse(candidate);
          return {
            title_id: parsed.title_id || draftTitle,
            title_en: parsed.title_en || draftTitle,
            description_id: parsed.description_id || rawStory,
            description_en: parsed.description_en || rawStory,
            what_to_expect: Array.isArray(parsed.what_to_expect) ? parsed.what_to_expect : ['Eksplorasi spot lokal'],
            included_items: Array.isArray(parsed.included_items) ? parsed.included_items : ['Pemandu lokal'],
            excluded_items: Array.isArray(parsed.excluded_items) ? parsed.excluded_items : ['Pengeluaran pribadi'],
            duration_hours: Number(parsed.duration_hours) || 4,
            max_participants: Number(parsed.max_participants) || 10,
            suggested_price_idr: Number(parsed.suggested_price_idr) || 250000,
            suggested_price_usd: Number(parsed.suggested_price_usd) || 15,
          };
        }
      }
    } catch (e) {
      console.warn('Gemini API call failed, falling back to smart heuristic:', e);
    }
  }

  // Heuristik fallback cerdas jika API key tidak disetel
  const sentences = rawStory
    .split(/[.\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);

  const whatToExpect = sentences.slice(0, 4).map((s) => `Menjelajahi ${s.toLowerCase()}`);
  if (whatToExpect.length === 0) {
    whatToExpect.push(`Menyusuri pesona tersembunyi kota ${cityName}`, 'Sesi mencicipi kuliner otentik bersama warga lokal', 'Dokumentasi foto di spot instagramable');
  }

  return {
    title_id: `${draftTitle || 'Petualangan Otentik'} di ${cityName}`,
    title_en: `${draftTitle || 'Authentic Discovery'} in ${cityName}`,
    description_id: `${rawStory}\n\nPengalaman ini dipandu langsung oleh local host berdedikasi yang akan mengajak Anda merasakan denyut kehidupan asli warga lokal di ${cityName}.`,
    description_en: `Join us for an exclusive, authentic local experience in ${cityName}. ${rawStory}`,
    what_to_expect: whatToExpect,
    included_items: [
      'Pemandu Lokal Berpengalaman',
      'Rekomendasi Kuliner Otentik',
      'Tiket Masuk Lokasi Wisata Utama',
      'Foto & Dokumentasi Perjalanan',
    ],
    excluded_items: [
      'Transportasi Menuju Titik Kumpul',
      'Pengeluaran Pribadi & Belanja Suvenir',
      'Makanan & Minuman Tambahan di Luar Paket',
    ],
    duration_hours: 4,
    max_participants: 8,
    suggested_price_idr: 250000,
    suggested_price_usd: 15,
  };
}

/**
 * Server Action: Generate & Simpan Draft Produk Host via AI
 */
export async function generateAndSaveAiExperience(input: BuildExperienceInput): Promise<{
  success: boolean;
  data?: {
    experienceId: number;
    slug: string;
    aiExtraction: StructuredAiExperience;
  };
  error?: string;
}> {
  try {
    const { draftTitle, cityId, rawStory, hostId = 34, publishDirectly = false } = input;

    if (!rawStory || rawStory.trim().length < 10) {
      return { success: false, error: 'Ceritakan aktivitas minimal 10 karakter agar AI dapat mengekstrak detailnya.' };
    }

    const city = await prisma.cities.findUnique({ where: { id: cityId } });
    const cityName = city ? city.name : 'Indonesia';

    // 1. Ekstraksi AI
    const extracted = await extractWithGemini(rawStory, draftTitle, cityName);

    // 2. Buat Slug unik
    const baseSlug = (extracted.title_en || draftTitle || 'local-experience')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    const uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-6)}`;

    // 3. Simpan ke database
    const createdExp = await prisma.experiences.create({
      data: {
        uuid: crypto.randomUUID(),
        title: extracted.title_id,
        slug: uniqueSlug,
        description: extracted.description_id,
        short_description: extracted.description_id.substring(0, 200),
        host_id: hostId,
        city_id: cityId,
        package_price: extracted.suggested_price_usd,
        currency: 'USD',
        duration_hours: extracted.duration_hours,
        max_participants: extracted.max_participants,
        min_participants: 1,
        difficulty_level: 'Easy',
        status: publishDirectly ? enum_experiences_status.published : enum_experiences_status.draft,
        is_active: true,
        images: ['1770193279228-960399169.jpg', '1770193279229-138479713.jpg'], // aset default gambar lokal
        included_items: extracted.included_items,
        excluded_items: extracted.excluded_items,
        deliverables: extracted.what_to_expect,
        host_specific_data: {
          languages: ['indonesian', 'english'],
          ai_generated: true,
          title_en: extracted.title_en,
          description_en: extracted.description_en,
          suggested_price_idr: extracted.suggested_price_idr,
        },
        requires_passport: false,
        requires_nationality: true,
        requires_emergency_contact: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return {
      success: true,
      data: {
        experienceId: createdExp.id,
        slug: createdExp.slug || String(createdExp.id),
        aiExtraction: extracted,
      },
    };
  } catch (error) {
    console.error('Error in generateAndSaveAiExperience:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal menghasilkan produk host dengan AI.',
    };
  }
}
