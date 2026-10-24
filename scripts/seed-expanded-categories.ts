import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CategorySeed {
  slug: string;
  name: string;
  name_id: string;
  name_en: string;
  icon: string;
  description: string;
}

const targetCategories: CategorySeed[] = [
  // 1. Pilar Utama
  {
    slug: 'local-guide',
    name: 'Local Guide',
    name_id: 'Pemandu Lokal',
    name_en: 'Local Guide',
    icon: '🧭',
    description: 'Pemandu lokal berlisensi dan berpengalaman memandu rute otentik.',
  },
  {
    slug: 'photographer',
    name: 'Photographer',
    name_id: 'Fotografer',
    name_en: 'Photographer',
    icon: '📸',
    description: 'Jasa fotografi profesional untuk mengabadikan momen liburan istimewa.',
  },
  {
    slug: 'combo-guide-photo',
    name: 'Combo Guide & Photo',
    name_id: 'Combo Guide & Foto',
    name_en: 'Combo Guide & Photographer',
    icon: '✨',
    description: 'Paket terpadu pemandu lokal sekaligus fotografer profesional.',
  },
  {
    slug: 'trip-planner',
    name: 'Trip Planner',
    name_id: 'Perencana Perjalanan',
    name_en: 'Trip Planner',
    icon: '🗺️',
    description: 'Rancangan rencana perjalanan (itinerary) kustom oleh pakar lokal.',
  },

  // 2. Olahraga, Laut & Kebugaran
  {
    slug: 'surfing-lesson',
    name: 'Surfing Lesson',
    name_id: 'Kursus Selancar',
    name_en: 'Surfing Lesson',
    icon: '🏄',
    description: 'Kelas dan pelatihan selancar bersama instruktur lokal terpercaya.',
  },
  {
    slug: 'diving-course',
    name: 'Diving Course',
    name_id: 'Kursus Menyelam',
    name_en: 'Diving Course',
    icon: '🤿',
    description: 'Eksplorasi bawah laut dan kursus menyelam bersertifikasi.',
  },
  {
    slug: 'yoga-pilates',
    name: 'Yoga & Pilates',
    name_id: 'Sesi Yoga & Pilates',
    name_en: 'Yoga & Pilates Session',
    icon: '🧘',
    description: 'Sesi yoga, meditasi, dan pilates untuk kebugaran jiwa dan raga.',
  },
  {
    slug: 'personal-trainer',
    name: 'Personal Trainer',
    name_id: 'Pelatih Gym Privat',
    name_en: 'Personal Trainer',
    icon: '🏋️',
    description: 'Pelatihan kebugaran privat dan panduan gym bersama pelatih profesional.',
  },

  // 3. Kuliner & Rasa
  {
    slug: 'street-food',
    name: 'Street Food Tour',
    name_id: 'Tur Kuliner Kaki Lima',
    name_en: 'Street Food Tour',
    icon: '🍲',
    description: 'Menjelajahi aneka kuliner kaki lima legendaris dan jajanan otentik.',
  },
  {
    slug: 'cooking-class',
    name: 'Cooking Class',
    name_id: 'Kelas Memasak Lokal',
    name_en: 'Cooking Class',
    icon: '🍳',
    description: 'Belajar memasak hidangan tradisional nusantara bersama warga lokal.',
  },

  // 4. Seni & Petualangan Alam
  {
    slug: 'local-craft',
    name: 'Local Craft & Art',
    name_id: 'Kerajinan & Seni Tradisional',
    name_en: 'Local Craft & Art',
    icon: '🎨',
    description: 'Workshop membatik, melukis, dan membuat kerajinan tradisional.',
  },
  {
    slug: 'secret-trek',
    name: 'Secret Trek & Nature',
    name_id: 'Rute Tersembunyi & Alam',
    name_en: 'Secret Trek & Nature',
    icon: '🥾',
    description: 'Trekking menyusuri jalur alam rahasia, air terjun, dan pegunungan hijau.',
  },
];

async function main() {
  console.log('--- Memulai Seeding Kategori Baru (Idempotent via prisma.upsert) ---');

  // 1. Seeding ke tabel host_categories (Pilar Utama)
  // Nonaktifkan ID 7 jika ada
  await prisma.host_categories.updateMany({
    where: { id: 7 },
    data: { is_active: false },
  });

  const hostCategorySeeds = [
    { name: 'Local Guide', icon: 'compass', desc: 'Pemandu lokal berlisensi dan berpengalaman memandu rute otentik', sort: 1 },
    { name: 'Photographer', icon: 'camera', desc: 'Jasa fotografi profesional untuk mengabadikan momen liburan istimewa', sort: 2 },
    { name: 'Combo', icon: 'users', desc: 'Paket terpadu pemandu lokal sekaligus fotografer profesional', sort: 3 },
    { name: 'Trip Planner', icon: 'map', desc: 'Rancangan rencana perjalanan (itinerary) kustom oleh pakar lokal', sort: 4 },
    { name: 'Instructor / Wellness Coach', icon: 'activity', desc: 'Pelatih kebugaran, instruktur yoga/pilates, dan pemandu aktivitas fisik', sort: 5 },
  ];

  for (const hc of hostCategorySeeds) {
    const upserted = await prisma.host_categories.upsert({
      where: { name: hc.name },
      update: {
        description: hc.desc,
        icon: hc.icon,
        is_active: true,
        sort_order: hc.sort,
        updated_at: new Date(),
      },
      create: {
        name: hc.name,
        description: hc.desc,
        icon: hc.icon,
        is_active: true,
        sort_order: hc.sort,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
    console.log(`[host_categories] Upserted: ID #${upserted.id} - ${upserted.name}`);
  }

  // 2. Seeding ke tabel experience_types (Aktivitas & Sub-Kategori)
  const experienceTypeSeeds = [
    { name: 'Surfing Lesson', icon: '🏄', desc: 'Kelas dan pelatihan selancar bersama instruktur lokal terpercaya' },
    { name: 'Diving Course', icon: '🤿', desc: 'Eksplorasi bawah laut dan kursus menyelam bersertifikasi' },
    { name: 'Yoga & Pilates', icon: '🧘', desc: 'Sesi yoga, meditasi, dan pilates untuk kebugaran jiwa dan raga' },
    { name: 'Personal Trainer', icon: '🏋️', desc: 'Pelatihan kebugaran privat dan panduan gym bersama pelatih profesional' },
    { name: 'Street Food Tour', icon: '🍲', desc: 'Menjelajahi aneka kuliner kaki lima legendaris dan jajanan otentik' },
    { name: 'Cooking Class', icon: '🍳', desc: 'Belajar memasak hidangan tradisional nusantara bersama warga lokal' },
    { name: 'Local Craft & Art', icon: '🎨', desc: 'Workshop membatik, melukis, dan membuat kerajinan tradisional' },
    { name: 'Secret Trek & Nature', icon: '🥾', desc: 'Trekking menyusuri jalur alam rahasia, air terjun, dan pegunungan hijau' },
    { name: 'Combo Guide & Photographer', icon: '✨', desc: 'Paket terpadu pemandu lokal sekaligus fotografer profesional' },
  ];

  for (const et of experienceTypeSeeds) {
    const upserted = await prisma.experience_types.upsert({
      where: { name: et.name },
      update: {
        description: et.desc,
        icon: et.icon,
      },
      create: {
        name: et.name,
        description: et.desc,
        icon: et.icon,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
    console.log(`[experience_types] Upserted: ID #${upserted.id} - ${upserted.name}`);
  }

  console.log('\n--- Seeding Kategori Baru Selesai dengan Sukses! ---');
}

main()
  .catch((e) => {
    console.error('Error saat seeding kategori:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
