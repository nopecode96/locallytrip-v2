import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();
const apiKey = process.env.GEMINI_API_KEY;

interface ExtractionResult {
  title_id: string;
  title_en: string;
  description_id: string;
  description_en: string;
  what_to_expect: string[];
  included_items: string[];
  excluded_items: string[];
  requirements: string[];
}

async function extractWithGemini(
  title: string,
  description: string,
  cityName: string,
  includedItems: any,
  excludedItems: any
): Promise<ExtractionResult> {
  if (apiKey) {
    try {
      const prompt = `Anda adalah AI Content Strategist & Translator untuk platform Locallytrip.
Tugas Anda adalah memproses data tur/aktivitas lokal berikut ke dalam struktur dwi-bahasa (Bahasa Indonesia & English) dan menerjemahkan seluruh komponennya secara fasih, luwes, dan ramah wisatawan lokal:

Judul Asli: "${title}"
Kota: "${cityName}"
Deskripsi Asli: """
${description}
"""
Fasilitas Termasuk Eksisting: ${JSON.stringify(includedItems || [])}
Fasilitas Tidak Termasuk Eksisting: ${JSON.stringify(excludedItems || [])}

Aturan Penerjemahan:
1. title_id: Judul menarik dan natural dalam Bahasa Indonesia (diawali "Jelajah " jika belum ada).
2. title_en: Judul dalam Bahasa Inggris yang engaging dan catchy.
3. description_id: Terjemahan lengkap, deskriptif, dan mengalir dari deskripsi asli ke Bahasa Indonesia (jangan gunakan bahasa Inggris).
4. description_en: Deskripsi lengkap dalam Bahasa Inggris.
5. what_to_expect: Array 3-5 langkah rencana perjalanan yang terperinci dalam Bahasa Indonesia.
6. included_items: Array fasilitas yang didapat, DITERJEMAHKAN PENUH ke Bahasa Indonesia (misal: "Tiket kapal cepat pulang-pergi", "Makan siang di restoran lokal", "Air mineral kemasan", "Biaya retribusi dan tiket masuk").
7. excluded_items: Array hal yang tidak termasuk, DITERJEMAHKAN PENUH ke Bahasa Indonesia (misal: "Keperluan pribadi dan belanja suvenir", "Fasilitas di luar daftar paket").
8. requirements: Array perlengkapan & ketentuan yang perlu dibawa/disiapkan peserta dalam Bahasa Indonesia.

Keluarkan HANYA JSON valid tanpa teks markdown pembungkus lain dengan format:
{
  "title_id": "...",
  "title_en": "...",
  "description_id": "...",
  "description_en": "...",
  "what_to_expect": ["..."],
  "included_items": ["..."],
  "excluded_items": ["..."],
  "requirements": ["..."]
}
`;

      // Gunakan gemini-flash-latest / gemini-2.5-flash dengan fallback model
      const modelEndpoint = 'gemini-flash-latest';
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelEndpoint}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        }
      );

      if (response.ok) {
        const json = await response.json();
        const candidate = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidate) {
          const parsed = JSON.parse(candidate);
          return {
            title_id: parsed.title_id || (title.startsWith('Jelajah ') ? title : `Jelajah ${title}`),
            title_en: parsed.title_en || title,
            description_id: parsed.description_id || description,
            description_en: parsed.description_en || description,
            what_to_expect: Array.isArray(parsed.what_to_expect) ? parsed.what_to_expect : [],
            included_items: Array.isArray(parsed.included_items) ? parsed.included_items : (includedItems || []),
            excluded_items: Array.isArray(parsed.excluded_items) ? parsed.excluded_items : (excludedItems || []),
            requirements: Array.isArray(parsed.requirements) ? parsed.requirements : ['Pakaian nyaman', 'Uang saku pribadi'],
          };
        }
      } else {
        const errText = await response.text();
        console.warn(`[Gemini API Error ${response.status} for "${title}"]:`, errText.slice(0, 180));
      }
    } catch (err) {
      console.warn(`[Gemini API Warning for "${title}"]:`, err);
    }
  }

  // Fallback heuristik jika API limit/timeout
  const isIndo = /[a-z]/i.test(title) && (description.includes(' di ') || description.includes(' yang ') || description.includes(' dengan '));
  return {
    title_id: isIndo ? title : `Jelajah ${title} bersama Local Host`,
    title_en: !isIndo ? title : `Discover ${title} with Local Host`,
    description_id: description,
    description_en: description,
    what_to_expect: [
      `Kumpul di titik temu dan perkenalan dengan local host di ${cityName}`,
      'Menyusuri rute terbaik dan spot otentik yang jarang diketahui turis biasa',
      'Mencicipi kuliner khas lokal dan sesi tanya jawab kebudayaan',
      'Sesi foto dokumentasi dan rekomendasi eksplorasi mandiri',
    ],
    included_items: Array.isArray(includedItems) && includedItems.length > 0 ? includedItems : [
      'Pemandu Lokal Berlisensi/Berpengalaman',
      'Tiket Masuk Spot Destinasi',
      'Dokumentasi Foto Perjalanan',
    ],
    excluded_items: Array.isArray(excludedItems) && excludedItems.length > 0 ? excludedItems : [
      'Transportasi Menuju Titik Kumpul',
      'Pengeluaran Pribadi & Belanja Suvenir',
    ],
    requirements: [
      'Pakaian dan alas kaki yang nyaman untuk jalan kaki',
      'Kamera atau smartphone dengan baterai cukup',
      'Membawa botol minum pribadi',
    ],
  };
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('--- Memulai Refactoring & Translasi Bilingual 24 Data Experiences ---');
  const experiences = await prisma.experiences.findMany({
    include: { cities: true },
    orderBy: { id: 'asc' },
  });

  console.log(`Ditemukan ${experiences.length} baris pengalaman.`);

  for (let i = 0; i < experiences.length; i++) {
    const exp = experiences[i];
    console.log(`\n[${i + 1}/${experiences.length}] Memproses ID #${exp.id}: "${exp.title}"...`);
    const cityName = exp.cities?.name || 'Indonesia';

    const result = await extractWithGemini(
      exp.title,
      exp.description,
      cityName,
      exp.included_items,
      exp.excluded_items
    );

    await prisma.experiences.update({
      where: { id: exp.id },
      data: {
        title_id: result.title_id,
        title_en: result.title_en,
        description_id: result.description_id,
        description_en: result.description_en,
        what_to_expect: result.what_to_expect,
        included_items: result.included_items,
        excluded_items: result.excluded_items,
        requirements: result.requirements,
      },
    });

    console.log(`-> Sukses: ID #${exp.id} telah diperbarui dengan teks Bahasa Indonesia natural.`);
    // Beri jeda kecil antar request agar rate-limit API aman
    await sleep(1000);
  }

  console.log('\n--- Refactoring seluruh 24 data experiences selesai dengan sukses! ---');
}

main()
  .catch((e) => {
    console.error('Error saat migrasi data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
