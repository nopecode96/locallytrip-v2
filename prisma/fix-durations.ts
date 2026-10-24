import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface DurationUpdateRule {
  id?: number;
  slugContains?: string;
  targetDuration: number;
  reason: string;
}

const durationRules: DurationUpdateRule[] = [
  {
    id: 23,
    slugContains: 'west-nusa-penida',
    targetDuration: 8, // 8-10 Jam
    reason: 'West Nusa Penida Day Trip: penyeberangan speedboat PP, eksplorasi Kelingking, Broken Beach & Angel Billabong (8-10 Jam)',
  },
  {
    id: 19,
    slugContains: 'merak-kecil',
    targetDuration: 7, // 6-8 Jam
    reason: 'Pulau Merak Kecil (Banten): perjalanan pesisir, perahu pulau, pantai dan snorkeling santai (6-8 Jam)',
  },
  {
    id: 18,
    slugContains: 'omah-kecebong',
    targetDuration: 4, // 3-4 Jam
    reason: 'Omah Kecebong (Yogyakarta): tur budaya, workshop membatik/gamelan dan kuliner tradisional (3-4 Jam, bukan 24 jam)',
  },
  {
    id: 6,
    slugContains: 'merbabu',
    targetDuration: 8, // 8-10 Jam
    reason: 'Gunung Merbabu (Via Thekelan): pendakian pos 1 s/d puncak dan savana (8-10 Jam)',
  },
  {
    id: 1,
    slugContains: 'bandung-escape',
    targetDuration: 24, // 3D2N multi-day itinerary
    reason: 'Bandung Escape 3D2N: paket perjalanan multi-hari alam & kuliner',
  },
  {
    id: 3,
    slugContains: 'asakusa-akihabara',
    targetDuration: 7, // Day trip
    reason: 'Asakusa Akihabara Day Trip: tur harian penuh eksplorasi kuil & distrik elektronik (7-8 Jam)',
  },
  {
    id: 4,
    slugContains: 'asakusa-akihabara-day-trip-1770257247239',
    targetDuration: 7,
    reason: 'Asakusa Akihabara Day Trip: tur harian penuh (7-8 Jam)',
  },
  {
    id: 5,
    slugContains: 'goa-cina',
    targetDuration: 7, // 6-8 Jam
    reason: 'Pantai Goa Cina Malang Selatan: perjalanan 2.5 jam PP dan piknik pesisir (7 Jam)',
  },
  {
    id: 7,
    slugContains: 'eat-like-a-local-in-jakarta',
    targetDuration: 4, // 3-4 Jam
    reason: 'Eat Like a Local in Jakarta: tur jalan kaki kuliner multi-lokasi (4 Jam)',
  },
  {
    id: 8,
    slugContains: 'mount-sangar',
    targetDuration: 6,
    reason: 'Gunung Sangar Bandung: pendakian perbukitan highland (6 Jam)',
  },
  {
    id: 9,
    slugContains: 'tetebatu',
    targetDuration: 5,
    reason: 'Tetebatu Walking Tour: sawah terasering, air terjun & hutan monyet (5 Jam)',
  },
  {
    id: 10,
    slugContains: 'papandayan',
    targetDuration: 7,
    reason: 'Gunung Papandayan: eksplorasi kawah aktif, hutan mati & tegal alun edelweiss (7-8 Jam)',
  },
  {
    id: 11,
    slugContains: 'mount-wayang',
    targetDuration: 6,
    reason: 'Gunung Wayang Bandung: trekking pegunungan & kebun teh (6 Jam)',
  },
  {
    id: 12,
    slugContains: 'mount-kerenceng',
    targetDuration: 6,
    reason: 'Gunung Kerenceng Bandung: petualangan hutan rimbun (6 Jam)',
  },
  {
    id: 13,
    slugContains: 'srihadi',
    targetDuration: 3,
    reason: 'Museum Pribadi Srihadi Soedarsono: kurasi karya seni & tur galeri (3 Jam)',
  },
  {
    id: 14,
    slugContains: 'nuart',
    targetDuration: 3,
    reason: 'NuArt Sculpture Park: galeri patung Nyoman Nuarta, workshop & taman (3 Jam)',
  },
  {
    id: 15,
    slugContains: 'osaka-amazing-epass',
    targetDuration: 8,
    reason: 'Osaka Amazing e-Pass 1 Day: tur keliling atraksi Osaka seharian (8 Jam)',
  },
  {
    id: 16,
    slugContains: 'taman-mini',
    targetDuration: 6,
    reason: 'Taman Mini Indonesia Indah (TMII): tur keliling anjungan daerah nusantara (6 Jam)',
  },
  {
    id: 17,
    slugContains: 'timeless-braga',
    targetDuration: 4,
    reason: 'Timeless Braga Coffee & Retro Walk: tur jalan kaki heritage Braga (4 Jam)',
  },
  {
    id: 20,
    slugContains: 'campervan',
    targetDuration: 8,
    reason: 'Campervan Wisata Alam Yogyakarta: perjalanan campervan alam terbuka (8 Jam)',
  },
  {
    id: 21,
    slugContains: 'de-jawatan',
    targetDuration: 4,
    reason: 'Hutan De Djawatan Banyuwangi: fotografi pohon trembesi raksasa (4 Jam)',
  },
  {
    id: 22,
    slugContains: 'bali-like-a-local',
    targetDuration: 2,
    reason: 'Bali Custom Trip Planning: konsultasi perencanaan itinerary privat personal (2 Jam)',
  },
  {
    id: 24,
    slugContains: 'tumpak-sewu',
    targetDuration: 8,
    reason: 'Tumpak Sewu & Pronojiwo Adventure: trekking tebing air terjun & Goa Tetes (8 Jam)',
  },
  {
    id: 25,
    slugContains: 'test-bandung-food-tour',
    targetDuration: 3,
    reason: 'Tur Kuliner Otentik Bandung Malam Hari (3 Jam)',
  },
];

async function fixDurations() {
  console.log('🔍 Memulai verifikasi kelayakan logistik durasi pengalaman tur...');

  let updatedCount = 0;

  for (const rule of durationRules) {
    let exp = null;
    if (rule.id) {
      exp = await prisma.experiences.findUnique({ where: { id: rule.id } });
    }
    if (!exp && rule.slugContains) {
      exp = await prisma.experiences.findFirst({
        where: { slug: { contains: rule.slugContains } },
      });
    }

    if (!exp) {
      console.warn(`⚠️ Pengalaman tidak ditemukan untuk rule: ${rule.reason}`);
      continue;
    }

    const previousDuration = exp.duration_hours;
    if (previousDuration !== rule.targetDuration) {
      await prisma.experiences.update({
        where: { id: exp.id },
        data: { duration_hours: rule.targetDuration },
      });
      console.log(`✅ [ID ${exp.id}] "${exp.title.slice(0, 45)}...": ${previousDuration} jam -> ${rule.targetDuration} jam (${rule.reason})`);
      updatedCount++;
    } else {
      console.log(`✓ [ID ${exp.id}] "${exp.title.slice(0, 45)}..." durasi sudah sesuai (${rule.targetDuration} jam)`);
    }
  }

  console.log(`\n🎉 SELESAI: Berhasil memperbarui ${updatedCount} durasi logistik pengalaman tur.`);
}

fixDurations()
  .catch((e) => {
    console.error('Error saat fix durasi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
