import fs from 'fs';
import path from 'path';
import { prisma } from '../src/lib/prisma';
import { resolveExperienceImageUrl } from '../src/lib/utils/media';
import { translateBilateralText, translateBilateralList } from '../src/lib/bilateralTranslator';

async function runExperiencesQATestSuite() {
  console.log('========================================================================');
  console.log('🧪 QA TEST SUITE: CREATE EXPERIENCES (4 HOST ARCHETYPES & AUTO-TRANSLATE)');
  console.log('========================================================================\n');

  // Ambil user host pengujian
  const hostUser = await prisma.users.findFirst({
    where: { role: { in: ['HOST', 'host'] } }
  }) || await prisma.users.findFirst();

  if (!hostUser) {
    throw new Error('❌ QA ABORT: Akun Host pengujian tidak ditemukan.');
  }

  const city = await prisma.cities.findFirst({ where: { is_active: true } }) || { id: 1, name: 'Bandung' };
  const timestamp = Date.now();
  const createdExperienceIds: number[] = [];
  const testFilePaths: string[] = [];

  try {
    // -------------------------------------------------------------------------
    // 1. PENGUJIAN KATEGORI 1: LOCAL GUIDE (PHYSICAL TOUR)
    // -------------------------------------------------------------------------
    console.log('▶ [TEST 1] ARCHETYPE: LOCAL GUIDE (PHYSICAL TOUR)');
    const guideCat = await prisma.host_categories.findFirst({
      where: { name: { contains: 'Local Guide', mode: 'insensitive' } }
    }) || { id: 1 };

    const rawTitleId = `Tur Sejarah & Kuliner Otentik ${timestamp}`;
    const rawDescId = `## Sorotan Tur\n**Jelajahi** jejak masa kolonial dan cicipi santapan legendaris bersama pemandu lokal.\n- Kunjungan gedung bersejarah\n- Icip kopi aroma klasik`;

    // Uji Auto-Translate Bilateral (ID -> EN)
    const translatedTitleEn = await translateBilateralText(rawTitleId, 'en');
    const translatedDescEn = await translateBilateralText(rawDescId, 'en');

    if (!translatedDescEn.includes('##') || !translatedDescEn.includes('**')) {
      throw new Error('❌ GAGAL: Format Markdown rusak selama penerjemahan ID -> EN!');
    }

    // Persistensi Tur Local Guide
    const expGuide = await prisma.experiences.create({
      data: {
        host_id: hostUser.id,
        city_id: city.id,
        category_id: guideCat.id,
        title: translatedTitleEn,
        title_id: rawTitleId,
        title_en: translatedTitleEn,
        description: translatedDescEn,
        description_id: rawDescId,
        description_en: translatedDescEn,
        slug: `qa-local-guide-${timestamp}`,
        package_price: 45,
        currency: 'USD',
        duration_hours: 4,
        max_participants: 6,
        meeting_point: 'Gedung Merdeka, Jl. Asia Afrika No. 65',
        images: [`exp-guide-${timestamp}.webp`],
        host_specific_data: {
          service_type: 'PHYSICAL_TOUR',
          itinerary: [
            { time: '09:00', title: 'Titik Kumpul', description: 'Briefing dan sejarah singkat' },
            { time: '11:00', title: 'Eksplorasi Kuliner', description: 'Mencicipi kopi dan makanan lokal' }
          ]
        },
        experience_itineraries: {
          create: [
            { step_order: 1, title: 'Titik Kumpul', description: 'Briefing dan sejarah singkat', created_at: new Date(), updated_at: new Date() },
            { step_order: 2, title: 'Eksplorasi Kuliner', description: 'Mencicipi kopi dan makanan lokal', created_at: new Date(), updated_at: new Date() }
          ]
        },
        status: 'published',
        created_at: new Date(),
        updated_at: new Date(),
      }
    });
    createdExperienceIds.push(expGuide.id);

    if (!expGuide.meeting_point || expGuide.meeting_point.trim() === '') {
      throw new Error('❌ GAGAL: Local Guide wajib memiliki meeting point fisik!');
    }
    console.log(`  ✅ TC-EXP-01 (Local Guide Pipeline & Markdown Integrity): PASSED (ID: ${expGuide.id})`);

    // -------------------------------------------------------------------------
    // 2. PENGUJIAN KATEGORI 2: PHOTOGRAPHER (CREATIVE SESSION)
    // -------------------------------------------------------------------------
    console.log('\n▶ [TEST 2] ARCHETYPE: PHOTOGRAPHER (CREATIVE SESSION)');
    const photoCat = await prisma.host_categories.findFirst({
      where: { name: { contains: 'Photographer', mode: 'insensitive' } }
    }) || { id: 2 };

    const expPhoto = await prisma.experiences.create({
      data: {
        host_id: hostUser.id,
        city_id: city.id,
        category_id: photoCat.id,
        title: `Golden Hour Street Photography ${timestamp}`,
        title_id: `Sesi Foto Golden Hour ${timestamp}`,
        title_en: `Golden Hour Street Photography ${timestamp}`,
        description: 'Professional portrait and street photography session.',
        description_id: 'Sesi foto jalanan dan potret profesional.',
        description_en: 'Professional portrait and street photography session.',
        slug: `qa-photographer-${timestamp}`,
        package_price: 65,
        currency: 'USD',
        duration_hours: 2,
        max_participants: 2,
        meeting_point: 'Jalan Braga & Kawasan Heritage',
        images: [`exp-photo-${timestamp}.webp`],
        deliverables: ['50 Edited High-Res Photos', 'Online Cloud Gallery Link (3 Days Delivery)'],
        host_specific_data: {
          service_type: 'CREATIVE_SESSION',
          equipment: ['Sony A7IV', '35mm f/1.4 Lens', 'Portable Reflector'],
          turnaround_days: 3
        },
        status: 'draft',
        created_at: new Date(),
        updated_at: new Date(),
      }
    });
    createdExperienceIds.push(expPhoto.id);

    const rawDeliverables = expPhoto.deliverables as string[];
    if (!Array.isArray(rawDeliverables) || rawDeliverables.length === 0) {
      throw new Error('❌ GAGAL: Photographer wajib mencatat deliverables foto!');
    }
    console.log(`  ✅ TC-EXP-02 (Photographer Storage & Deliverables): PASSED (ID: ${expPhoto.id})`);

    // -------------------------------------------------------------------------
    // 3. PENGUJIAN KATEGORI 3: TRIP PLANNER (DIGITAL SERVICE)
    // -------------------------------------------------------------------------
    console.log('\n▶ [TEST 3] ARCHETYPE: TRIP PLANNER (DIGITAL SERVICE)');
    const plannerCat = await prisma.host_categories.findFirst({
      where: { name: { contains: 'Trip Planner', mode: 'insensitive' } }
    }) || { id: 4 };

    const expPlanner = await prisma.experiences.create({
      data: {
        host_id: hostUser.id,
        city_id: city.id,
        category_id: plannerCat.id,
        title: `Custom 5-Day Bali Hidden Gems Itinerary ${timestamp}`,
        title_id: `Rencana Perjalanan Khusus 5 Hari Bali ${timestamp}`,
        title_en: `Custom 5-Day Bali Hidden Gems Itinerary ${timestamp}`,
        description: 'Comprehensive personalized travel planning with custom Google Maps pins.',
        description_id: 'Rencana perjalanan yang dipersonalisasi lengkap dengan pin Google Maps.',
        description_en: 'Comprehensive personalized travel planning with custom Google Maps pins.',
        slug: `qa-trip-planner-${timestamp}`,
        package_price: 35,
        currency: 'USD',
        duration_hours: 1, // 1 jam sesi konsultasi video call
        max_participants: 1,
        meeting_point: 'Konsultasi Online (Google Meet / Zoom / WhatsApp)',
        images: [`exp-planner-${timestamp}.webp`],
        host_specific_data: {
          service_type: 'DIGITAL_SERVICE',
          consultation_platform: 'Google Meet',
          revision_limit: 1,
          itinerary: [
            { step: 1, title: 'Preferensi & Kuesioner', description: 'Pengumpulan minat dan bujet' },
            { step: 2, title: 'Penyusunan Draf PDF', description: 'Penyusunan rute hari demi hari' },
            { step: 3, title: 'Sesi Revisi & Finalisasi', description: 'Penyerahan file PDF dan link Maps' }
          ]
        },
        experience_itineraries: {
          create: [
            { step_order: 1, title: 'Preferensi & Kuesioner', description: 'Pengumpulan minat dan bujet', created_at: new Date(), updated_at: new Date() },
            { step_order: 2, title: 'Penyusunan Draf PDF', description: 'Penyusunan rute hari demi hari', created_at: new Date(), updated_at: new Date() },
            { step_order: 3, title: 'Sesi Revisi & Finalisasi', description: 'Penyerahan file PDF dan link Maps', created_at: new Date(), updated_at: new Date() }
          ]
        },
        deliverables: ['Dokumen PDF Interaktif', 'Pin Google Maps Khusus', '1x Sesi Revisi'],
        status: 'published',
        created_at: new Date(),
        updated_at: new Date(),
      }
    });
    createdExperienceIds.push(expPlanner.id);

    if (!expPlanner.meeting_point?.toLowerCase().includes('online')) {
      throw new Error('❌ GAGAL: Trip Planner wajib merefleksikan metode konsultasi online!');
    }
    console.log(`  ✅ TC-EXP-03 (Trip Planner Digital Workflow & Steps): PASSED (ID: ${expPlanner.id})`);

    // -------------------------------------------------------------------------
    // 4. PENGUJIAN KATEGORI 4: COMBO (GUIDE + PHOTOGRAPHER)
    // -------------------------------------------------------------------------
    console.log('\n▶ [TEST 4] ARCHETYPE: COMBO (GUIDE + PHOTOGRAPHER)');
    const comboCat = await prisma.host_categories.findFirst({
      where: { id: 3, is_active: true }
    }) || await prisma.host_categories.findFirst({
      where: { name: { contains: 'Combo', mode: 'insensitive' }, is_active: true }
    }) || { id: 3 };

    const expCombo = await prisma.experiences.create({
      data: {
        host_id: hostUser.id,
        city_id: city.id,
        category_id: comboCat.id,
        title: `Explore & Shoot: Heritage Walk & Portrait Session ${timestamp}`,
        title_id: `Jalan & Foto: Tur Warisan Budaya & Sesi Potret ${timestamp}`,
        title_en: `Explore & Shoot: Heritage Walk & Portrait Session ${timestamp}`,
        description: 'Complete walking tour accompanied by personal professional photography.',
        description_id: 'Tur jalan kaki lengkap ditemani dokumentasi foto profesional.',
        description_en: 'Complete walking tour accompanied by personal professional photography.',
        slug: `qa-combo-${timestamp}`,
        package_price: 85,
        currency: 'USD',
        duration_hours: 4,
        max_participants: 4,
        meeting_point: 'Alun-alun Kota, Titik Nol Kilometer',
        images: [`exp-combo-${timestamp}.webp`],
        host_specific_data: {
          service_type: 'PHYSICAL_TOUR',
          itinerary: [
            { time: '08:00', title: 'Meeting & Golden Hour Photos', description: 'Pemotretan di spot arsitektur' },
            { time: '10:30', title: 'Kuliner & Candid Session', description: 'Istirahat makan dan foto candid' }
          ]
        },
        experience_itineraries: {
          create: [
            { step_order: 1, title: 'Meeting & Golden Hour Photos', description: 'Pemotretan di spot arsitektur', created_at: new Date(), updated_at: new Date() },
            { step_order: 2, title: 'Kuliner & Candid Session', description: 'Istirahat makan dan foto candid', created_at: new Date(), updated_at: new Date() }
          ]
        },
        deliverables: ['Full Guiding Service', '35 Curated Edited Photos'],
        status: 'published',
        created_at: new Date(),
        updated_at: new Date(),
      }
    });
    createdExperienceIds.push(expCombo.id);
    console.log(`  ✅ TC-EXP-04 (Combo Hybrid Guiding & Media Service): PASSED (ID: ${expCombo.id})`);

    // -------------------------------------------------------------------------
    // 5. PENGUJIAN PENYIMPANAN FISIK & NGINX SERVING (:3001)
    // -------------------------------------------------------------------------
    console.log('\n▶ [TEST 5] PHYSICAL STORAGE & NGINX HTTP 200 VERIFICATION');
    const testFileName = `exp-qa-serving-${timestamp}.webp`;
    const physicalPath = path.join(process.cwd(), 'public', 'images', 'experiences', testFileName);
    fs.writeFileSync(physicalPath, Buffer.from('RIFF....WEBPVP8 ....fake-experience-binary-content'));
    testFilePaths.push(physicalPath);

    const resolvedUrl = resolveExperienceImageUrl(testFileName);
    if (resolvedUrl !== `/images/experiences/${testFileName}`) {
      throw new Error(`❌ GAGAL: Resolusi Experience Image URL tidak cocok: ${resolvedUrl}`);
    }

    const res = await fetch(`http://localhost:3001/images/experiences/${testFileName}`, { method: 'HEAD' });
    if (res.status !== 200) {
      throw new Error(`❌ GAGAL: Nginx mengembalikan HTTP ${res.status} untuk ${testFileName}`);
    }
    console.log(`  🌐 HTTP 200 OK: http://localhost:3001/images/experiences/${testFileName}`);
    console.log('  ✅ TC-EXP-07 (Physical Serving via Nginx & Media Resolver): PASSED');

  } finally {
    // -------------------------------------------------------------------------
    // TEARDOWN CLEANUP
    // -------------------------------------------------------------------------
    console.log('\n🧹 [TEARDOWN] Membersihkan data uji dari PostgreSQL & filesystem...');
    if (createdExperienceIds.length > 0) {
      await prisma.experience_itineraries.deleteMany({
        where: { experience_id: { in: createdExperienceIds } }
      });
      await prisma.experiences.deleteMany({
        where: { id: { in: createdExperienceIds } }
      });
    }
    for (const p of testFilePaths) {
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
    console.log('✨ Lingkungan database dan filesystem kembali bersih tanpa residu.');
  }

  console.log('\n========================================================================');
  console.log('🎉 SELURUH SKENARIO PENGUJIAN UNIT & INTEGRASI 4 ARCHETYPE: 100% LULUS!');
  console.log('========================================================================');
}

runExperiencesQATestSuite().catch((err) => {
  console.error('\n🚨 QA TEST SUITE CRITICAL FAILURE:', err);
  process.exit(1);
});
