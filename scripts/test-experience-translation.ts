import { PrismaClient } from '@prisma/client';
import { translateBilateralText, translateBilateralList } from '../src/lib/bilateralTranslator';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('=================================================================');
  console.log('🧪 TEST: BILATERAL AUTO-TRANSLATION & MARKDOWN INTEGRITY SUITE');
  console.log('=================================================================\n');

  // -------------------------------------------------------------
  // Test 1: Unit Translation Engine & Markdown / List Preservation
  // -------------------------------------------------------------
  console.log('▶ TEST 1: Unit Translation Engine (ID -> EN & EN -> ID)');

  const sampleIdMarkdown = `## Sorotan Petualangan
**Menjelajahi** keindahan tersembunyi pulau Bali dan pesona matahari terbenam.
- Pemandu lokal berlisensi dan ramah
- Sajian kuliner otentik khas Bali
- Air kelapa muda segar`;

  console.log('  Translating Indonesian Markdown to English...');
  const translatedEnMarkdown = await translateBilateralText(sampleIdMarkdown, 'en');
  console.log('  Result EN Markdown:\n', translatedEnMarkdown);

  const hasHeading = translatedEnMarkdown.includes('##') || translatedEnMarkdown.includes('#');
  const hasBold = translatedEnMarkdown.includes('**') || translatedEnMarkdown.includes('*');
  const hasList = translatedEnMarkdown.includes('-') || translatedEnMarkdown.includes('*');

  console.log(`  Heading preserved: ${hasHeading ? '✅' : '❌'}`);
  console.log(`  Bold formatting preserved: ${hasBold ? '✅' : '❌'}`);
  console.log(`  List bullets preserved: ${hasList ? '✅' : '❌'}`);

  if (!hasHeading || !hasBold) {
    throw new Error('Markdown preservation failed in Test 1!');
  }

  // List Translation Test
  console.log('\n  Translating List Items (ID -> EN)...');
  const sampleListId = [
    'Pemandu lokal berlisensi',
    'Tiket masuk seluruh objek wisata',
    'Perlengkapan keselamatan standar internasional',
  ];
  const translatedListEn = await translateBilateralList(sampleListId, 'en');
  console.log('  Result EN List:', translatedListEn);
  if (translatedListEn.length !== sampleListId.length || !translatedListEn[0]) {
    throw new Error('List translation failed in Test 1!');
  }
  console.log('  ✅ Unit Translation Engine passed with flying colors!\n');

  // -------------------------------------------------------------
  // Test 2: Database E2E Auto-Translation Pipeline (ID Only Input)
  // -------------------------------------------------------------
  console.log('▶ TEST 2: E2E Pipeline with ID-Only Input -> Auto Generate EN in Database');

  // 1. Fetch valid host, category, and city
  const hostUser = await prisma.users.findFirst({
    where: { role: { equals: 'host', mode: 'insensitive' } },
  }) || await prisma.users.findFirst();

  if (!hostUser) {
    throw new Error('No user found in database for testing!');
  }

  const category = await prisma.host_categories.findFirst({
    where: { is_active: true },
  });

  const city = await prisma.cities.findFirst({
    where: { is_active: true },
  });

  if (!category || !city) {
    throw new Error('Active category or city not found!');
  }

  // 2. Prepare payload with ONLY Indonesian fields
  const idOnlyTitle = `Petualangan Alam Pegunungan Bali Test ${Date.now()}`;
  const idOnlyDesc = `## Ringkasan Eksplorasi
**Rasakan** ketenangan alam asri pegunungan dengan panorama kabut pagi yang memukau.
- Jalur trekking ramah pemula
- Sarapan pagi tradisional di pos pandang
- Dokumentasi foto berkualitas tinggi`;

  const idOnlyInclusions = ['Pemandu lokal profesional', 'Sarapan pagi tradisional', 'Air mineral dingin'];
  const idOnlyExclusions = ['Pengeluaran pribadi', 'Transportasi menuju meeting point'];
  const idOnlyWhatToBring = ['Sepatu olahraga/trekking', 'Jaket hangat', 'Kamera'];

  console.log('  Resolving bilateral translation concurrently via Promise.all...');
  const [resolvedTitleEn, resolvedDescEn, resolvedInclusionsEn, resolvedExclusionsEn, resolvedWhatToBringEn] =
    await Promise.all([
      translateBilateralText(idOnlyTitle, 'en'),
      translateBilateralText(idOnlyDesc, 'en'),
      translateBilateralList(idOnlyInclusions, 'en'),
      translateBilateralList(idOnlyExclusions, 'en'),
      translateBilateralList(idOnlyWhatToBring, 'en'),
    ]);

  console.log(`  Resolved Title (EN): "${resolvedTitleEn}"`);
  console.log(`  Resolved Description (EN):\n${resolvedDescEn}\n`);
  console.log(`  Resolved Inclusions (EN):`, resolvedInclusionsEn);

  // 3. Persist to DB
  const testExpUuid = crypto.randomUUID();
  const slug = `test-tour-id-${Date.now()}`;
  const now = new Date();

  const createdExp = await prisma.experiences.create({
    data: {
      uuid: testExpUuid,
      title: resolvedTitleEn || idOnlyTitle,
      title_id: idOnlyTitle,
      title_en: resolvedTitleEn,
      slug,
      description: resolvedDescEn || idOnlyDesc,
      description_id: idOnlyDesc,
      description_en: resolvedDescEn,
      short_description: resolvedDescEn.replace(/<[^>]*>/g, '').slice(0, 200),
      host_id: hostUser.id,
      category_id: category.id,
      city_id: city.id,
      package_price: 55,
      currency: 'USD',
      duration_hours: 4,
      max_participants: 6,
      min_participants: 1,
      meeting_point: 'Basecamp Desa Bedugul',
      status: 'draft',
      is_active: true,
      images: ['test-exp-01.webp'],
      included_items: idOnlyInclusions,
      excluded_items: idOnlyExclusions,
      requirements: idOnlyWhatToBring,
      deliverables: [],
      host_specific_data: {
        service_type: 'PHYSICAL_TOUR',
        inclusions_id: idOnlyInclusions,
        inclusions_en: resolvedInclusionsEn,
        exclusions_id: idOnlyExclusions,
        exclusions_en: resolvedExclusionsEn,
        what_to_bring_id: idOnlyWhatToBring,
        what_to_bring_en: resolvedWhatToBringEn,
      },
      created_at: now,
      updated_at: now,
    },
  });

  console.log(`  ✅ Successfully created Experience ID: ${createdExp.id}`);

  // Add itinerary step
  const stepTitleEn = await translateBilateralText('Pertemuan di Pos Utama', 'en');
  const stepDescEn = await translateBilateralText('Briefing keselamatan dan pembagian tongkat trekking.', 'en');

  const createdItinerary = await prisma.experience_itineraries.create({
    data: {
      experience_id: createdExp.id,
      step_order: 1,
      title: stepTitleEn,
      description: stepDescEn,
      duration_minutes: 30,
      location: 'Basecamp Bedugul',
      created_at: now,
      updated_at: now,
    },
  });

  console.log(`  ✅ Successfully created Itinerary step ID: ${createdItinerary.id}`);

  // 4. Verify DB record
  const verifyExp = await prisma.experiences.findUnique({
    where: { id: createdExp.id },
    include: { experience_itineraries: true },
  });

  if (!verifyExp?.title_en || !verifyExp?.description_en) {
    throw new Error('Database record verification failed: title_en or description_en is empty!');
  }

  console.log('  DB Verification:');
  console.log(`    - ID Title: "${verifyExp.title_id}"`);
  console.log(`    - EN Title: "${verifyExp.title_en}"`);
  console.log(`    - ID Desc Length: ${verifyExp.description_id?.length} chars`);
  console.log(`    - EN Desc Length: ${verifyExp.description_en?.length} chars`);
  console.log(`    - Itinerary Step Count: ${verifyExp.experience_itineraries.length}`);

  // -------------------------------------------------------------
  // Test 3: Reverse E2E Pipeline (EN Only Input -> Auto Generate ID)
  // -------------------------------------------------------------
  console.log('\n▶ TEST 3: Reverse Pipeline with EN-Only Input -> Auto Generate ID');

  const enOnlyTitle = `Sunset Photography Masterclass Ubud ${Date.now()}`;
  const enOnlyDesc = `## Workshop Overview
**Capture** the golden hour magic over Bali rice terraces with professional guidance.
- Composition and framing techniques
- Manual exposure mastery
- Lightroom mobile editing secrets`;

  const [resolvedTitleIdReverse, resolvedDescIdReverse] = await Promise.all([
    translateBilateralText(enOnlyTitle, 'id'),
    translateBilateralText(enOnlyDesc, 'id'),
  ]);

  console.log(`  Input EN Title: "${enOnlyTitle}"`);
  console.log(`  Generated ID Title: "${resolvedTitleIdReverse}"`);
  console.log(`  Generated ID Desc:\n${resolvedDescIdReverse}\n`);

  if (!resolvedTitleIdReverse || !resolvedDescIdReverse) {
    throw new Error('Reverse translation failed in Test 3!');
  }
  console.log('  ✅ Reverse translation (EN -> ID) verified successfully!');

  // -------------------------------------------------------------
  // Clean Up Test Records
  // -------------------------------------------------------------
  console.log('\n▶ CLEANUP: Deleting test records from database...');
  await prisma.experience_itineraries.deleteMany({
    where: { experience_id: createdExp.id },
  });
  await prisma.experiences.delete({
    where: { id: createdExp.id },
  });
  console.log('  ✅ Cleaned up test experience and itinerary records.');

  console.log('\n=================================================================');
  console.log('🎉 ALL TESTS PASSED: MARKDOWN & BILATERAL AUTO-TRANSLATION READY!');
  console.log('=================================================================');
}

main()
  .catch((e) => {
    console.error('❌ Test failed with error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
