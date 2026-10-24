import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { resolveExperienceImageUrl } from '../src/lib/utils/media';
import { grantReward } from '../src/lib/rewards/reward-engine';

const prisma = new PrismaClient();

async function main() {
  console.log('=== TEST EXPERIENCE PIPELINE & CLEAN FILENAME STORAGE ===\n');

  // 1. Test resolveExperienceImageUrl
  console.log('[1/5] Testing resolveExperienceImageUrl:');
  const testCases = [
    { input: null, expected: '/images/default-experience-cover.jpg' },
    { input: '', expected: '/images/default-experience-cover.jpg' },
    { input: 'https://example.com/photo.jpg', expected: 'https://example.com/photo.jpg' },
    { input: 'blob:http://localhost:3000/123-abc', expected: 'blob:http://localhost:3000/123-abc' },
    { input: '/images/experiences/photo1.webp', expected: '/images/experiences/photo1.webp' },
    { input: 'experiences-1729580000.webp', expected: '/images/experiences/experiences-1729580000.webp' },
    { input: '/images/custom-photo.jpg', expected: '/images/custom-photo.jpg' },
  ];

  for (const tc of testCases) {
    const res = resolveExperienceImageUrl(tc.input);
    const pass = res === tc.expected;
    console.log(`  ${pass ? '✅' : '❌'} Input: "${tc.input}" -> "${res}" (Expected: "${tc.expected}")`);
    if (!pass) throw new Error(`resolveExperienceImageUrl failed for input: ${tc.input}`);
  }

  // 2. Test physical folder public/images/experiences/
  console.log('\n[2/5] Verifying physical directory public/images/experiences/:');
  const experiencesDir = path.join(process.cwd(), 'public', 'images', 'experiences');
  if (!fs.existsSync(experiencesDir)) {
    fs.mkdirSync(experiencesDir, { recursive: true });
  }
  const testFileName = `test-exp-${Date.now()}.webp`;
  const testFilePath = path.join(experiencesDir, testFileName);
  fs.writeFileSync(testFilePath, Buffer.from('test-image-binary-data'));

  if (fs.existsSync(testFilePath)) {
    console.log(`  ✅ Successfully created physical file in: ${testFilePath}`);
    fs.unlinkSync(testFilePath);
    console.log(`  ✅ Cleaned up temporary test file.`);
  } else {
    throw new Error('Failed to write file to public/images/experiences/');
  }

  // 3. Find or ensure a Host user, city, category
  console.log('\n[3/5] Testing Prisma database insertion with Clean Filename & Bilingual data:');
  let hostUser = await prisma.users.findFirst({
    where: { role: 'HOST' },
  });

  if (!hostUser) {
    hostUser = await prisma.users.findFirst();
  }

  const city = await prisma.cities.findFirst({
    where: { is_active: true },
  });

  const category = await prisma.host_categories.findFirst({
    where: { is_active: true, name: 'Local Guide' },
  }) || await prisma.host_categories.findFirst({ where: { is_active: true } });

  const plannerCat = await prisma.host_categories.findFirst({
    where: { is_active: true, name: 'Trip Planner' },
  });

  if (!hostUser || !city || !category) {
    console.log('  ⚠️ Host user, city, or category not found. Skipping DB insert test.');
    return;
  }

  console.log(`  Found Host: ${hostUser.name} (${hostUser.email})`);
  console.log(`  Found City: ${city.name} (ID: ${city.id})`);
  console.log(`  Found Category: ${category.name} (ID: ${category.id})`);

  // Insert test draft experience (Physical Tour)
  const cleanImageName = `exp-test-${Date.now()}.webp`;
  const testExp = await prisma.experiences.create({
    data: {
      uuid: crypto.randomUUID(),
      title: 'Tur Kuliner Otentik Bandung Malam Hari',
      title_id: 'Tur Kuliner Otentik Bandung Malam Hari',
      title_en: 'Authentic Bandung Night Food Tasting Tour',
      slug: `test-bandung-food-tour-${Date.now()}`,
      description: 'Nikmati sajian kuliner malam legendaris bersama pemandu lokal Bandung.',
      description_id: 'Nikmati sajian kuliner malam legendaris bersama pemandu lokal Bandung.',
      description_en: 'Enjoy legendary night street foods with an insider Bandung local host.',
      short_description: 'Kuliner malam legendaris di Bandung.',
      host_id: hostUser.id,
      category_id: category.id,
      city_id: city.id,
      package_price: 55,
      currency: 'USD',
      duration_hours: 3,
      max_participants: 6,
      min_participants: 1,
      meeting_point: 'Depan Gedung Sate Bandung',
      status: 'draft',
      is_active: true,
      images: [cleanImageName],
      included_items: ['Snack khas', 'Air mineral', 'Pemandu lokal privat'],
      excluded_items: ['Transportasi hotel', 'Pengeluaran pribadi'],
      requirements: ['Sepatu nyaman', 'Kamera'],
      host_specific_data: {
        service_type: 'PHYSICAL_TOUR',
        meeting_point_notes: 'Host berdiri dekat monumen dengan rompi Locallytrip',
      },
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  console.log(`  ✅ Experience created with ID: ${testExp.id}, status: ${testExp.status}`);
  console.log(`  ✅ Stored images array in DB: ${JSON.stringify(testExp.images)}`);
  console.log(`  ✅ Resolved Experience Image: ${resolveExperienceImageUrl((testExp.images as any)?.[0] as string)}`);

  // Create itinerary step
  const testItinerary = await prisma.experience_itineraries.create({
    data: {
      experience_id: testExp.id,
      step_order: 1,
      title: 'Titik Kumpul & Pengenalan',
      description: 'Perkenalan rute dan briefing santai sebelum mulai jalan kaki.',
      duration_minutes: 30,
      location: 'Gedung Sate',
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
  console.log(`  ✅ Experience itinerary created with ID: ${testItinerary.id}, title: ${testItinerary.title}`);

  // 4. Test Trip Planner Digital Experience Insertion
  console.log('\n[4/5] Testing Digital Trip Planner Archetype with Deliverables:');
  if (plannerCat) {
    const digitalExp = await prisma.experiences.create({
      data: {
        uuid: crypto.randomUUID(),
        title: 'Custom Tokyo 4D3N Vacation Itinerary Planning',
        title_id: 'Rancangan Liburan Tokyo 4D3N Kustom',
        title_en: 'Custom Tokyo 4D3N Vacation Itinerary Planning',
        slug: `test-tokyo-plan-${Date.now()}`,
        description: 'Perencanaan liburan kustom lengkap dengan peta Google Maps dan panduan PDF.',
        description_id: 'Perencanaan liburan kustom lengkap dengan peta Google Maps dan panduan PDF.',
        description_en: 'Full personalized travel planning with custom Google Maps pins and interactive PDF.',
        short_description: 'Perencanaan liburan kustom di Tokyo.',
        host_id: hostUser.id,
        category_id: plannerCat.id,
        city_id: city.id,
        package_price: 35,
        currency: 'USD',
        duration_hours: 1,
        max_participants: 2,
        min_participants: 1,
        meeting_point: 'Konsultasi Online (Google Meet / Zoom / WhatsApp)',
        status: 'published',
        is_active: true,
        images: ['exp-tokyo-plan.webp'],
        deliverables: [
          'Dokumen Rencana Perjalanan PDF Interaktif',
          'Tautan Peta Kustom Google Maps',
        ],
        host_specific_data: {
          service_type: 'DIGITAL_SERVICE',
          consultation_platform: 'Google Meet',
          deliverables: [
            'Dokumen Rencana Perjalanan PDF Interaktif',
            'Tautan Peta Kustom Google Maps',
          ],
        },
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    console.log(`  ✅ Digital Trip Planner created with ID: ${digitalExp.id}`);
    console.log(`  ✅ Meeting Point: ${digitalExp.meeting_point}`);
    console.log(`  ✅ Deliverables in DB: ${JSON.stringify(digitalExp.deliverables)}`);

    // Test Reward Engine (+80 XP)
    const rewardRes = await grantReward(hostUser.id, 'EXPERIENCE_CREATE', digitalExp.id, 'experiences');
    console.log(`  ✅ Reward Grant Result for EXPERIENCE_CREATE:`, rewardRes ? `Added XP: ${rewardRes.addedXp}` : 'Null/skipped');

    await prisma.experiences.delete({ where: { id: digitalExp.id } });
    console.log('  ✅ Cleaned up digital test experience record.');
  }

  // Clean up test DB record
  await prisma.experience_itineraries.deleteMany({ where: { experience_id: testExp.id } });
  await prisma.experiences.delete({ where: { id: testExp.id } });
  console.log('  ✅ Cleaned up physical test database records.');

  console.log('\n[5/5] All Pipeline Tests Passed Successfully! 🎉');
}

main()
  .catch((e) => {
    console.error('Test failed with error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
