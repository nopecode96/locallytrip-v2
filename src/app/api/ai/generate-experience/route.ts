import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      prompt,
      cityName = 'Indonesia',
      basePrice = 45,
      currency = 'USD',
      categoryId,
    } = body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: 'Silakan ceritakan ide tur Anda minimal 5 karakter.' },
        { status: 400 }
      );
    }

    // 1. Ambil daftar kategori host aktif & tipe pengalaman aktif
    const [categories, experienceTypes] = await Promise.all([
      prisma.host_categories.findMany({
        where: { is_active: true },
        select: { id: true, name: true, description: true },
        orderBy: { sort_order: 'asc' },
      }),
      prisma.experience_types.findMany({
        where: { is_active: true },
        select: { id: true, name: true },
        orderBy: { sort_order: 'asc' },
      }),
    ]);

    const categoryListStr = categories
      .map((c) => `ID ${c.id}: "${c.name}" (${c.description || ''})`)
      .join('\n');

    const typeListStr = experienceTypes
      .slice(0, 30)
      .map((t) => `ID ${t.id}: "${t.name}"`)
      .join(', ');

    const apiKey = process.env.GEMINI_API_KEY;

    const systemPrompt = `Anda adalah AI Travel Product Builder & Experience Designer profesional untuk platform Locallytrip.
Tugas Anda adalah menganalisis ide singkat dari Host, mendeteksi ARCHETYPE layanan yang paling cocok, dan merancang paket tur dwibahasa yang lengkap.

INFORMASI DARI HOST:
- Ide / Cerita: """${prompt.trim()}"""
- Kota Lokasi: ${cityName}
- Estimasi Harga Paket: ${basePrice} ${currency}
${categoryId ? `- Kategori Pilihan Awal: ID ${categoryId}` : ''}

DAFTAR KATEGORI HOST TERDAFTAR (PILIH SALAH SATU ID YANG PALING COCOK):
${categoryListStr}

DAFTAR THEMA AKTIVITAS VALID (PILIH SALAH SATU ID experience_type_id):
${typeListStr}

ATURAN DETEKSI ARCHETYPE & SERVICE TYPE:
1. Jika teks berfokus pada rancangan rencana perjalanan, konsultasi liburan, pembuatan itinerary, atau dokumen rekomendasi:
   - archetype: "Trip Planner" (category_id: 4)
   - service_type: "DIGITAL_SERVICE"
   - meeting_point: "Konsultasi Online (Google Meet / Zoom / WhatsApp)"
   - meeting_point_notes: "Tautan sesi video call dan kuesioner preferensi dikirimkan via chat Locallytrip setelah pemesanan dikonfirmasi."
   - itinerary: Berupa tahapan proses perancangan (misal: "Tahap 1: Sesi Profiling & Konsultasi Kebutuhan", "Tahap 2: Penyusunan Draf Itinerary & Pemetaan Rute", "Tahap 3: Review, Revisi & Finalisasi Dokumen PDF").
   - deliverables: ["Dokumen Rencana Perjalanan PDF Interaktif", "Tautan Peta Kustom Google Maps", "Daftar Estimasi Budget & Rekomendasi Kuliner Lokal", "Dukungan Konsultasi Chat Selama Perjalanan"]

2. Jika teks berfokus pada pemotretan, sesi foto liburan, portrait, prewedding, atau hunting foto candid:
   - archetype: "Photographer" (category_id: 2)
   - service_type: "CREATIVE_SESSION"
   - meeting_point: Titik spot pemotretan fisik pertama yang ikonik di ${cityName}.
   - itinerary: Spot foto bertahap dengan durasi waktu.
   - deliverables: ["50+ Foto Resolusi Tinggi Hasil Kurasi & Color Grading", "Tautan Galeri Online Pribadi (Aktif 30 Hari)", "Pengiriman File Digital dalam 3 Hari Kerja"]

3. Jika teks berfokus pada yoga, pilates, kebugaran fisik, gym, atau meditasi:
   - archetype: "Instructor / Wellness Coach" (category_id: 9 atau ID terkait)
   - service_type: "PHYSICAL_TOUR"
   - meeting_point: Studio atau spot alam terbuka di ${cityName}.
   - deliverables: []

4. Jika teks berfokus pada tur jalan kaki, wisata sejarah, kuliner malam, atau petualangan alam:
   - archetype: "Local Guide" (category_id: 1) atau "Combo" (category_id: 3)
   - service_type: "PHYSICAL_TOUR"
   - meeting_point: Landmark atau stasiun/titik temu fisik yang mudah dicari di ${cityName}.
   - deliverables: []

PANDUAN OUTPUT:
1. Kembalikan HANYA format JSON valid tanpa format markdown \`\`\`json ... \`\`\`.
2. Format struktur JSON WAJIB persis seperti berikut:
{
  "title_id": "Judul memikat dalam Bahasa Indonesia (maks 70 karakter)",
  "title_en": "Compelling Title in English (max 70 characters)",
  "category_id": 1,
  "experience_type_id": 12,
  "service_type": "PHYSICAL_TOUR",
  "duration_hours": 3,
  "max_participants": 6,
  "description_id": "Deskripsi storytelling mendalam Bahasa Indonesia (2-3 paragraf inspiratif)",
  "description_en": "Engaging storytelling description in English (2-3 inspiring paragraphs)",
  "meeting_point": "Titik kumpul atau platform konsultasi",
  "meeting_point_notes": "Panduan cara menemukan host atau mengakses sesi",
  "deliverables": [
    "Item keluaran 1",
    "Item keluaran 2"
  ],
  "itinerary": [
    {
      "time": "09:00",
      "title_id": "Langkah / Stop 1",
      "title_en": "Step / Stop 1",
      "description_id": "Keterangan aktivitas",
      "description_en": "Activity description",
      "durationMinutes": 45
    }
  ],
  "inclusions_id": [
    "Fasilitas termasuk 1",
    "Fasilitas termasuk 2"
  ],
  "inclusions_en": [
    "Included item 1",
    "Included item 2"
  ],
  "exclusions_id": [
    "Hal tidak termasuk 1"
  ],
  "exclusions_en": [
    "Excluded item 1"
  ],
  "what_to_bring_id": [
    "Perlengkapan bawaan 1"
  ],
  "what_to_bring_en": [
    "Gear to bring 1"
  ]
}`;

    if (apiKey) {
      const candidateModels = [
        'gemini-3.8-flash',
        'gemini-flash-latest',
        'gemini-3.5-flash-lite',
        'gemini-2.5-flash-lite',
      ];

      for (const model of candidateModels) {
        try {
          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
                generationConfig: {
                  responseMimeType: 'application/json',
                  temperature: 0.7,
                },
              }),
            }
          );

          if (geminiRes.ok) {
            const geminiData = await geminiRes.json();
            const textOutput = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textOutput) {
              const cleaned = textOutput
                .replace(/^```json\s*/i, '')
                .replace(/\s*```$/i, '')
                .trim();
              const parsed = JSON.parse(cleaned);

              // Validasi category_id jika dikembalikan
              let matchedCatId = parsed.category_id;
              if (!categories.some((c) => c.id === matchedCatId)) {
                matchedCatId = categoryId || categories[0]?.id || 1;
              }

              // Validasi experience_type_id
              let matchedTypeId = parsed.experience_type_id;
              if (!experienceTypes.some((t) => t.id === matchedTypeId)) {
                matchedTypeId = experienceTypes[0]?.id || 1;
              }

              return NextResponse.json({
                success: true,
                data: {
                  ...parsed,
                  category_id: matchedCatId,
                  experience_type_id: matchedTypeId,
                  service_type: parsed.service_type || 'PHYSICAL_TOUR',
                },
                modelUsed: model,
              });
            }
          }
        } catch (err) {
          // Lanjut ke model berikutnya jika ada error
        }
      }
    }

    // Heuristik Fallback cerdas jika Gemini gagal atau API key offline
    const cleanPrompt = prompt.trim().toLowerCase();
    const isPlanner =
      cleanPrompt.includes('plan') ||
      cleanPrompt.includes('itinerary') ||
      cleanPrompt.includes('rancangan') ||
      cleanPrompt.includes('jadwal') ||
      cleanPrompt.includes('rekomendasi');
    const isPhoto =
      cleanPrompt.includes('foto') ||
      cleanPrompt.includes('photo') ||
      cleanPrompt.includes('kamera') ||
      cleanPrompt.includes('shoot') ||
      cleanPrompt.includes('potret');
    const isWellness =
      cleanPrompt.includes('yoga') ||
      cleanPrompt.includes('pilates') ||
      cleanPrompt.includes('fitness') ||
      cleanPrompt.includes('gym') ||
      cleanPrompt.includes('wellness') ||
      cleanPrompt.includes('sehat');

    let resolvedCatId = categoryId || 1;
    let resolvedServiceType: 'PHYSICAL_TOUR' | 'DIGITAL_SERVICE' | 'CREATIVE_SESSION' = 'PHYSICAL_TOUR';
    let resolvedMeetingPoint = `Lobi Utama / Landmark Pusat di ${cityName}`;
    let resolvedMeetingNotes = 'Host akan menunggu di dekat pintu masuk utama dengan penanda Locallytrip.';
    let resolvedDeliverables: string[] = [];
    let resolvedItinerary: any[] = [];

    if (isPlanner) {
      const plannerCat = categories.find((c) => c.name.toLowerCase().includes('plan')) || categories[3];
      resolvedCatId = plannerCat?.id || 4;
      resolvedServiceType = 'DIGITAL_SERVICE';
      resolvedMeetingPoint = 'Konsultasi Online (Google Meet / Zoom / WhatsApp)';
      resolvedMeetingNotes = 'Tautan video call dan kuesioner preferensi liburan akan dikirimkan melalui obrolan Locallytrip setelah pemesanan dikonfirmasi.';
      resolvedDeliverables = [
        'Dokumen Rencana Perjalanan PDF Interaktif',
        'Tautan Peta Kustom Google Maps dengan Pin Rekomendasi',
        'Daftar Estimasi Budget & Rekomendasi Kuliner Otentik',
        'Dukungan Tanya Jawab via Chat Selama Liburan Berlangsung',
      ];
      resolvedItinerary = [
        {
          time: 'Hari 1',
          title_id: 'Konsultasi Profil & Analisis Kebutuhan',
          title_en: 'Profiling Consultation & Needs Assessment',
          description_id: 'Sesi temu online 60 menit untuk memahami gaya perjalanan, ritme, dan budget traveler.',
          description_en: '60-minute online video session to uncover travel preferences, pacing, and budget.',
          durationMinutes: 60,
        },
        {
          time: 'Hari 3',
          title_id: 'Penyusunan Draf Rencana & Rute Kustom',
          title_en: 'Draft Itinerary & Route Mapping',
          description_id: 'Host merancang rincian perjalanan hari demi hari dengan rekomendasi tempat terbaik.',
          description_en: 'Host crafts personalized day-by-day itinerary with insider spots.',
          durationMinutes: 120,
        },
        {
          time: 'Hari 5',
          title_id: 'Sesi Review, Revisi & Penyerahan PDF Final',
          title_en: 'Review Session, Revisions & Final PDF Handover',
          description_id: 'Penyesuaian akhir sesuai masukan traveler dan pengiriman dokumen panduan lengkap.',
          description_en: 'Final refinements and delivery of complete high-resolution PDF itinerary guide.',
          durationMinutes: 60,
        },
      ];
    } else if (isPhoto) {
      const photoCat = categories.find((c) => c.name.toLowerCase().includes('photo')) || categories[1];
      resolvedCatId = photoCat?.id || 2;
      resolvedServiceType = 'CREATIVE_SESSION';
      resolvedMeetingPoint = `Spot Foto Utama di ${cityName}`;
      resolvedMeetingNotes = 'Fotografer akan menunggu dengan membawa kamera dan perlengkapan lensa di titik temu.';
      resolvedDeliverables = [
        '50+ Foto Resolusi Tinggi Hasil Kurasi & Color Grading',
        'Tautan Galeri Online Pribadi (Aktif 30 Hari)',
        'Pengiriman File Digital dalam 3 Hari Kerja',
      ];
      resolvedItinerary = [
        {
          time: '09:00',
          title_id: 'Pertemuan & Briefing Konsep Foto',
          title_en: 'Meetup & Photo Concept Briefing',
          description_id: 'Perkenalan, penyesuaian busana/suasana, dan pemanasan pose santai.',
          description_en: 'Greeting, outfit matching, and casual posing warmup.',
          durationMinutes: 30,
        },
        {
          time: '09:30',
          title_id: 'Sesi Pemotretan Spot Utama',
          title_en: 'Main Location Photoshoot',
          description_id: 'Pengambilan foto berlatar arsitektur atau panorama alam ikonik.',
          description_en: 'Capturing candid and portrait shots with iconic backdrop.',
          durationMinutes: 90,
        },
        {
          time: '11:00',
          title_id: 'Sesi Candid & Review Pratinjau',
          title_en: 'Candid Street Shots & Quick Preview',
          description_id: 'Melihat pratinjau hasil kamera dan pemilihan foto highlight.',
          description_en: 'Reviewing on-camera previews and selecting highlights.',
          durationMinutes: 60,
        },
      ];
    } else if (isWellness) {
      const wellnessCat = categories.find((c) => c.name.toLowerCase().includes('wellness') || c.name.toLowerCase().includes('instructor')) || categories[4];
      resolvedCatId = wellnessCat?.id || 9;
      resolvedServiceType = 'PHYSICAL_TOUR';
      resolvedMeetingPoint = `Taman / Studio Terbuka di ${cityName}`;
      resolvedMeetingNotes = 'Instruktur akan menunggu di lobi dengan mengenakan pakaian olahraga Locallytrip.';
      resolvedDeliverables = [];
      resolvedItinerary = [
        {
          time: '07:00',
          title_id: 'Peregangan Awal & Mindful Breathing',
          title_en: 'Initial Stretching & Mindful Breathing',
          description_id: 'Pemanasan fisik dan latihan pernapasan untuk menenangkan pikiran.',
          description_en: 'Physical warmup and mindful breathing exercise.',
          durationMinutes: 30,
        },
        {
          time: '07:30',
          title_id: 'Sesi Latihan Inti & Postur',
          title_en: 'Core Movement & Posture Flow',
          description_id: 'Rangkaian gerakan terbimbing sesuai tingkat kebugaran peserta.',
          description_en: 'Guided flow tailored to guests fitness level.',
          durationMinutes: 60,
        },
        {
          time: '08:30',
          title_id: 'Pendinginan & Minuman Herbal Segar',
          title_en: 'Cooldown & Fresh Herbal Drink',
          description_id: 'Relaksasi otot dan menikmati seduhan herbal khas lokal.',
          description_en: 'Muscle relaxation and enjoying local herbal infusion.',
          durationMinutes: 30,
        },
      ];
    } else {
      resolvedCatId = categories[0]?.id || 1;
      resolvedServiceType = 'PHYSICAL_TOUR';
      resolvedItinerary = [
        {
          time: '09:00',
          title_id: 'Pertemuan & Pengantar Tur',
          title_en: 'Meetup & Tour Introduction',
          description_id: 'Sesi ramah tamah, perkenalan rute, dan persiapan petualangan.',
          description_en: 'Welcome briefing, route overview, and journey preparation.',
          durationMinutes: 30,
        },
        {
          time: '09:30',
          title_id: 'Eksplorasi Spot Utama & Cerita Sejarah',
          title_en: 'Main Exploration & Heritage Stories',
          description_id: `Menjelajahi esensi dan kisah lokal dari ${prompt.trim().slice(0, 30)}.`,
          description_en: `Exploring highlights and local lore of ${prompt.trim().slice(0, 30)}.`,
          durationMinutes: 90,
        },
        {
          time: '11:00',
          title_id: 'Icip Kuliner Lokal & Istirahat Santai',
          title_en: 'Local Tasting & Relaxing Break',
          description_id: 'Menikmati hidangan ringan atau minuman khas daerah setempat bersama host.',
          description_en: 'Tasting authentic regional snacks and drinks with host.',
          durationMinutes: 60,
        },
      ];
    }

    const titleSnippet = prompt.trim().slice(0, 40);

    const fallbackResult = {
      title_id: isPlanner
        ? `Rancangan Liburan Kustom: ${titleSnippet}`
        : isPhoto
        ? `Sesi Foto Liburan Berkesan di ${cityName}: ${titleSnippet}`
        : isWellness
        ? `Sesi Kebugaran & Mindfulness di ${cityName}: ${titleSnippet}`
        : `Jelajah Otentik ${titleSnippet} di ${cityName}`,
      title_en: isPlanner
        ? `Custom Vacation Itinerary: ${titleSnippet}`
        : isPhoto
        ? `Memorable Vacation Photoshoot in ${cityName}`
        : isWellness
        ? `Wellness & Mindfulness Journey in ${cityName}`
        : `Authentic Exploration of ${titleSnippet} in ${cityName}`,
      category_id: resolvedCatId,
      experience_type_id: isPlanner ? 46 : isPhoto ? 34 : isWellness ? 59 : 12,
      service_type: resolvedServiceType,
      duration_hours: isPlanner ? 1 : 3,
      max_participants: isPlanner ? 2 : 6,
      description_id: `${prompt.trim()}\n\nPengalaman ini dirancang khusus untuk memberikan kualitas layanan terbaik di kota ${cityName} dengan perhatian mendalam pada kenyamanan dan preferensi privat Anda.`,
      description_en: `${prompt.trim()}\n\nThis experience is crafted to provide premium personalized service in ${cityName} tailored specifically to your private party.`,
      meeting_point: resolvedMeetingPoint,
      meeting_point_notes: resolvedMeetingNotes,
      deliverables: resolvedDeliverables,
      itinerary: resolvedItinerary,
      inclusions_id: isPlanner
        ? [
            'Sesi konsultasi video call 1-on-1 privat',
            'Dokumen rencana perjalanan PDF interaktif lengkap',
            'Rekomendasi hotel, kuliner, dan tips transportasi',
            'Dukungan revisi hingga 2 putaran',
          ]
        : isPhoto
        ? [
            'Jasa fotografer profesional privat',
            '50+ foto resolusi tinggi bergradasi warna',
            'Akses galeri cloud pribadi',
          ]
        : [
            'Pemandu lokal privat berlisensi',
            'Tiket masuk seluruh objek yang dikunjungi',
            'Air mineral & snack lokal',
          ],
      inclusions_en: isPlanner
        ? [
            'Private 1-on-1 video consultation session',
            'Complete interactive PDF itinerary guide',
            'Accommodation, dining & transit insider tips',
            'Up to 2 rounds of itinerary revisions',
          ]
        : isPhoto
        ? [
            'Private professional photographer service',
            '50+ color-graded high-resolution photos',
            'Private cloud gallery access',
          ]
        : [
            'Private licensed local host',
            'All entrance admissions included',
            'Bottled water & local snack',
          ],
      exclusions_id: [
        'Transportasi antar-jemput dari/ke akomodasi',
        'Pengeluaran belanja pribadi dan suvenir',
      ],
      exclusions_en: [
        'Hotel pickup & drop-off transportation',
        'Personal shopping and souvenir expenses',
      ],
      what_to_bring_id: isPlanner
        ? [
            'Catatan preferensi liburan atau wishlist tempat impian',
            'Koneksi internet yang stabil untuk sesi video call',
          ]
        : [
            'Pakaian & sepatu yang nyaman',
            'Kamera atau smartphone dengan baterai penuh',
            'Uang saku tunai secukupnya',
          ],
      what_to_bring_en: isPlanner
        ? [
            'Travel wishlist or must-visit destination notes',
            'Stable internet connection for video call session',
          ]
        : [
            'Comfortable clothing & walking shoes',
            'Camera or smartphone with full battery',
            'Small cash for personal items',
          ],
    };

    return NextResponse.json({
      success: true,
      data: fallbackResult,
      isFallback: true,
    });
  } catch (err: any) {
    console.error('Fatal error in /api/ai/generate-experience:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Gagal memproses AI Copilot.' },
      { status: 500 }
    );
  }
}
