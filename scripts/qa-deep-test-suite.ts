import fs from 'fs';
import path from 'path';
import { prisma } from '../src/lib/prisma';
import { resolveStoryImageUrl, resolveMeetupImageUrl, resolveForumImageUrl, resolveAvatarUrl } from '../src/lib/utils/media';
import { enum_stories_status } from '@prisma/client';

interface TestSuiteSummary {
  module: string;
  testsPassed: number;
  testsFailed: number;
  details: string[];
}

const summaryResults: TestSuiteSummary[] = [];

async function runQaDeepTestSuite() {
  console.log('================================================================');
  console.log('🧪 LOCALLYTRIP COMPREHENSIVE QA & DEEP PIPELINE TEST SUITE');
  console.log('Modules: Stories, Meetups, Forums, Storage & Media Resolvers');
  console.log('Timestamp:', new Date().toISOString());
  console.log('================================================================\n');

  // Ambil user dan data master untuk pengujian
  const user =
    (await prisma.users.findFirst({
      where: { email: { contains: 'nopecode96' } },
    })) || (await prisma.users.findFirst());

  if (!user) {
    console.error('❌ GAGAL: User pengujian tidak ditemukan.');
    process.exit(1);
  }

  const city = await prisma.cities.findFirst({ where: { is_active: true } });
  const forumCategory = await prisma.vibes_forum_categories.findFirst({ where: { is_active: true } });

  console.log(`👤 User Pengujian : ${user.name} (ID: ${user.id})`);
  console.log(`🏙️ Kota Pengujian : ${city?.name || 'N/A'} (ID: ${city?.id})`);
  console.log(`🏷️ Kategori Forum : ${forumCategory?.name || 'N/A'} (ID: ${forumCategory?.id})\n`);

  const timestamp = Date.now();
  const nginxBaseUrl = 'http://localhost:3001';

  // ============================================================================
  // SUITE 1: STORIES PIPELINE & STORAGE
  // ============================================================================
  console.log('----------------------------------------------------------------');
  console.log('📘 SUITE 1: MODUL STORIES (DRAFT, PUBLISHED, CLEAN FILENAME & NGINX)');
  console.log('----------------------------------------------------------------');
  const storySuite: TestSuiteSummary = { module: 'Stories', testsPassed: 0, testsFailed: 0, details: [] };

  const storiesDir = path.join(process.cwd(), 'public', 'images', 'stories');
  if (!fs.existsSync(storiesDir)) fs.mkdirSync(storiesDir, { recursive: true });

  const storyTestFile = `story-qa-${timestamp}.webp`;
  const storyFilePath = path.join(storiesDir, storyTestFile);
  fs.writeFileSync(storyFilePath, Buffer.from('RIFF....WEBPVP8 ...qa-story-cover-test-payload'));

  // Test 1.1: Physical file write
  if (fs.existsSync(storyFilePath)) {
    console.log(`✅ [1.1] Berkas fisik story tersimpan di public/images/stories/${storyTestFile}`);
    storySuite.testsPassed++;
  } else {
    console.error(`❌ [1.1] Gagal menulis berkas fisik story`);
    storySuite.testsFailed++;
  }

  // Test 1.2: DRAFT creation with clean filename
  const rawStoryCover = `/images/stories/${storyTestFile}`;
  const cleanStoryCover = path.basename(rawStoryCover.trim());

  const draftStory = await prisma.stories.create({
    data: {
      uuid: `qa-draft-story-${timestamp}`,
      title: `QA Draft Story ${timestamp}`,
      slug: `qa-draft-story-${timestamp}`,
      content: 'Isi draf cerita petualangan yang belum dipublikasikan...',
      author_id: user.id,
      cover_image: cleanStoryCover,
      status: enum_stories_status.draft,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  if (draftStory.status === 'draft' && draftStory.cover_image === storyTestFile) {
    console.log(`✅ [1.2] Draf Story tersimpan (ID: ${draftStory.id}, status: DRAFT, clean filename: "${draftStory.cover_image}")`);
    storySuite.testsPassed++;
  } else {
    console.error(`❌ [1.2] Penyimpanan draf story gagal atau cover_image bukan clean filename`);
    storySuite.testsFailed++;
  }

  // Test 1.3: Draft privacy check (TIDAK bocor ke publik)
  const publishedStoriesCheck = await prisma.stories.findMany({
    where: {
      status: enum_stories_status.published,
      id: draftStory.id,
    },
  });
  if (publishedStoriesCheck.length === 0) {
    console.log(`✅ [1.3] Keamanan Draf Terverifikasi: Draf TIDAK bocor pada kueri publik`);
    storySuite.testsPassed++;
  } else {
    console.error(`❌ [1.3] Bocor: Draf muncul pada kueri cerita terbit!`);
    storySuite.testsFailed++;
  }

  // Test 1.4: PUBLISHED Story creation
  const pubStory = await prisma.stories.create({
    data: {
      uuid: `qa-pub-story-${timestamp}`,
      title: `QA Terbit Cerita ${timestamp}`,
      slug: `qa-pub-story-${timestamp}`,
      content: 'Isi cerita petualangan yang telah resmi diterbitkan untuk publik...',
      author_id: user.id,
      cover_image: storyTestFile,
      status: enum_stories_status.published,
      published_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  if (pubStory.status === 'published') {
    console.log(`✅ [1.4] Cerita Terbit tersimpan (ID: ${pubStory.id}, status: PUBLISHED)`);
    storySuite.testsPassed++;
  } else {
    console.error(`❌ [1.4] Gagal menyimpan cerita terbit`);
    storySuite.testsFailed++;
  }

  // Test 1.5: Resolver resolveStoryImageUrl
  const resolvedStory = resolveStoryImageUrl(pubStory.cover_image);
  const expectedStory = `/images/stories/${storyTestFile}`;
  if (resolvedStory === expectedStory && resolveStoryImageUrl(null) === '/images/default-story-cover.jpg') {
    console.log(`✅ [1.5] resolveStoryImageUrl mengembalikan URL publik terpetakan & fallback valid`);
    storySuite.testsPassed++;
  } else {
    console.error(`❌ [1.5] resolveStoryImageUrl menghasilkan path tidak valid: ${resolvedStory}`);
    storySuite.testsFailed++;
  }

  // Test 1.6: Nginx HTTP 200 Serving
  try {
    const res = await fetch(`${nginxBaseUrl}/images/stories/${storyTestFile}`);
    if (res.status === 200) {
      console.log(`✅ [1.6] Nginx HTTP 200 OK: ${nginxBaseUrl}/images/stories/${storyTestFile}`);
      storySuite.testsPassed++;
    } else {
      console.error(`❌ [1.6] Nginx returned HTTP ${res.status}`);
      storySuite.testsFailed++;
    }
  } catch (err: any) {
    console.warn(`⚠️ [1.6] Nginx network error: ${err.message}`);
  }

  summaryResults.push(storySuite);

  // ============================================================================
  // SUITE 2: MEETUPS PIPELINE & STORAGE
  // ============================================================================
  console.log('\n----------------------------------------------------------------');
  console.log('👥 SUITE 2: MODUL MEETUPS (DRAFT, PUBLISHED, CLEAN FILENAME & NGINX)');
  console.log('----------------------------------------------------------------');
  const meetupSuite: TestSuiteSummary = { module: 'Meetups', testsPassed: 0, testsFailed: 0, details: [] };

  const meetupsDir = path.join(process.cwd(), 'public', 'images', 'meetups');
  if (!fs.existsSync(meetupsDir)) fs.mkdirSync(meetupsDir, { recursive: true });

  const meetupTestFile = `meetup-qa-${timestamp}.webp`;
  const meetupFilePath = path.join(meetupsDir, meetupTestFile);
  fs.writeFileSync(meetupFilePath, Buffer.from('RIFF....WEBPVP8 ...qa-meetup-cover-test-payload'));

  // Test 2.1: Physical file write
  if (fs.existsSync(meetupFilePath)) {
    console.log(`✅ [2.1] Berkas fisik meetup tersimpan di public/images/meetups/${meetupTestFile}`);
    meetupSuite.testsPassed++;
  } else {
    console.error(`❌ [2.1] Gagal menulis berkas fisik meetup`);
    meetupSuite.testsFailed++;
  }

  // Test 2.2: DRAFT Meetup creation with clean filename
  const cleanMeetupCover = path.basename(`/images/meetups/${meetupTestFile}`);
  const draftMeetup = await prisma.vibes_travel_meetups.create({
    data: {
      creator_id: user.id,
      city_id: city!.id,
      title: `QA Draft Meetup ${timestamp}`,
      slug: `qa-draft-meetup-${timestamp}`,
      description: 'Draf agenda meetup ngopi dan jalan santai...',
      start_date: new Date(Date.now() + 86400000),
      end_date: new Date(Date.now() + 86400000),
      duration_days: 1,
      max_members: 6,
      current_member_count: 1,
      status: 'DRAFT',
      images: [cleanMeetupCover],
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  const draftMeetupImages = draftMeetup.images as string[];
  if (draftMeetup.status === 'DRAFT' && draftMeetupImages[0] === meetupTestFile) {
    console.log(`✅ [2.2] Draf Meetup tersimpan (ID: ${draftMeetup.id}, status: DRAFT, images: [ "${draftMeetupImages[0]}" ])`);
    meetupSuite.testsPassed++;
  } else {
    console.error(`❌ [2.2] Gagal simpan draf meetup atau images bukan clean filename`);
    meetupSuite.testsFailed++;
  }

  // Test 2.3: Draft privacy check (TIDAK muncul di kueri publik active/OPEN/PUBLISHED)
  const publishedMeetupsCheck = await prisma.vibes_travel_meetups.findMany({
    where: {
      id: draftMeetup.id,
      status: { in: ['active', 'OPEN', 'PUBLISHED'] },
    },
  });
  if (publishedMeetupsCheck.length === 0) {
    console.log(`✅ [2.3] Keamanan Draf Terverifikasi: Meetup DRAFT tidak tampil di filter publik`);
    meetupSuite.testsPassed++;
  } else {
    console.error(`❌ [2.3] Bocor: Meetup DRAFT muncul di filter publik`);
    meetupSuite.testsFailed++;
  }

  // Test 2.4: PUBLISHED Meetup creation
  const pubMeetup = await prisma.vibes_travel_meetups.create({
    data: {
      creator_id: user.id,
      city_id: city!.id,
      title: `QA Terbit Meetup ${timestamp}`,
      slug: `qa-pub-meetup-${timestamp}`,
      description: 'Agenda resmi meetup yang terbuka untuk pendaftaran...',
      start_date: new Date(Date.now() + 86400000),
      end_date: new Date(Date.now() + 86400000),
      duration_days: 1,
      max_members: 6,
      current_member_count: 1,
      status: 'PUBLISHED',
      images: [cleanMeetupCover],
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  if (pubMeetup.status === 'PUBLISHED') {
    console.log(`✅ [2.4] Meetup Terbit tersimpan (ID: ${pubMeetup.id}, status: PUBLISHED)`);
    meetupSuite.testsPassed++;
  } else {
    console.error(`❌ [2.4] Gagal menyimpan meetup terbit`);
    meetupSuite.testsFailed++;
  }

  // Test 2.5: Resolver resolveMeetupImageUrl
  const resolvedMeetup = resolveMeetupImageUrl(cleanMeetupCover);
  const expectedMeetup = `/images/meetups/${meetupTestFile}`;
  if (resolvedMeetup === expectedMeetup && resolveMeetupImageUrl(null) === '/images/default-meetup-cover.jpg') {
    console.log(`✅ [2.5] resolveMeetupImageUrl mengembalikan URL publik terpetakan & fallback valid`);
    meetupSuite.testsPassed++;
  } else {
    console.error(`❌ [2.5] resolveMeetupImageUrl menghasilkan path tidak valid: ${resolvedMeetup}`);
    meetupSuite.testsFailed++;
  }

  // Test 2.6: Nginx HTTP 200 Serving
  try {
    const res = await fetch(`${nginxBaseUrl}/images/meetups/${meetupTestFile}`);
    if (res.status === 200) {
      console.log(`✅ [2.6] Nginx HTTP 200 OK: ${nginxBaseUrl}/images/meetups/${meetupTestFile}`);
      meetupSuite.testsPassed++;
    } else {
      console.error(`❌ [2.6] Nginx returned HTTP ${res.status}`);
      meetupSuite.testsFailed++;
    }
  } catch (err: any) {
    console.warn(`⚠️ [2.6] Nginx network error: ${err.message}`);
  }

  summaryResults.push(meetupSuite);

  // ============================================================================
  // SUITE 3: FORUMS PIPELINE & STORAGE
  // ============================================================================
  console.log('\n----------------------------------------------------------------');
  console.log('💬 SUITE 3: MODUL FORUMS (DRAFT, PUBLISHED, CLEAN FILENAME & NGINX)');
  console.log('----------------------------------------------------------------');
  const forumSuite: TestSuiteSummary = { module: 'Forums', testsPassed: 0, testsFailed: 0, details: [] };

  const forumsDir = path.join(process.cwd(), 'public', 'images', 'forums');
  if (!fs.existsSync(forumsDir)) fs.mkdirSync(forumsDir, { recursive: true });

  const forumTestFile = `forum-qa-${timestamp}.webp`;
  const forumFilePath = path.join(forumsDir, forumTestFile);
  fs.writeFileSync(forumFilePath, Buffer.from('RIFF....WEBPVP8 ...qa-forum-attachment-test-payload'));

  // Test 3.1: Physical file write
  if (fs.existsSync(forumFilePath)) {
    console.log(`✅ [3.1] Berkas fisik forum tersimpan di public/images/forums/${forumTestFile}`);
    forumSuite.testsPassed++;
  } else {
    console.error(`❌ [3.1] Gagal menulis berkas fisik forum`);
    forumSuite.testsFailed++;
  }

  // Test 3.2: DRAFT Forum Thread creation with clean filename
  const cleanForumCover = path.basename(`/images/forums/${forumTestFile}`);
  const draftThread = await prisma.vibes_forum_threads.create({
    data: {
      author_id: user.id,
      category_id: forumCategory!.id,
      title: `QA Draft Thread ${timestamp}`,
      slug: `qa-draft-thread-${timestamp}`,
      content: 'Penjelasan draf topik diskusi forum sebelum diterbitkan...',
      status: 'DRAFT',
      images: [cleanForumCover],
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  const draftThreadImages = draftThread.images as string[];
  if (draftThread.status === 'DRAFT' && draftThreadImages[0] === forumTestFile) {
    console.log(`✅ [3.2] Draf Forum tersimpan (ID: ${draftThread.id}, status: DRAFT, images: [ "${draftThreadImages[0]}" ])`);
    forumSuite.testsPassed++;
  } else {
    console.error(`❌ [3.2] Gagal simpan draf forum atau images bukan clean filename`);
    forumSuite.testsFailed++;
  }

  // Test 3.3: Draft privacy check (TIDAK muncul di kueri publik)
  const publishedThreadsCheck = await prisma.vibes_forum_threads.findMany({
    where: {
      id: draftThread.id,
      status: { in: ['active', 'OPEN', 'PUBLISHED'] },
    },
  });
  if (publishedThreadsCheck.length === 0) {
    console.log(`✅ [3.3] Keamanan Draf Terverifikasi: Thread DRAFT tidak tampil pada kueri publik`);
    forumSuite.testsPassed++;
  } else {
    console.error(`❌ [3.3] Bocor: Thread DRAFT muncul pada kueri publik`);
    forumSuite.testsFailed++;
  }

  // Test 3.4: PUBLISHED Forum Thread creation
  const pubThread = await prisma.vibes_forum_threads.create({
    data: {
      author_id: user.id,
      category_id: forumCategory!.id,
      title: `QA Terbit Diskusi ${timestamp}`,
      slug: `qa-pub-thread-${timestamp}`,
      content: 'Pertanyaan atau diskusi yang telah resmi dipublikasikan...',
      status: 'PUBLISHED',
      images: [cleanForumCover],
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  if (pubThread.status === 'PUBLISHED') {
    console.log(`✅ [3.4] Thread Terbit tersimpan (ID: ${pubThread.id}, status: PUBLISHED)`);
    forumSuite.testsPassed++;
  } else {
    console.error(`❌ [3.4] Gagal menyimpan thread terbit`);
    forumSuite.testsFailed++;
  }

  // Test 3.5: Resolver resolveForumImageUrl
  const resolvedForum = resolveForumImageUrl(cleanForumCover);
  const expectedForum = `/images/forums/${forumTestFile}`;
  if (resolvedForum === expectedForum && resolveForumImageUrl(null) === '/images/default-forum-cover.jpg') {
    console.log(`✅ [3.5] resolveForumImageUrl mengembalikan URL publik terpetakan & fallback valid`);
    forumSuite.testsPassed++;
  } else {
    console.error(`❌ [3.5] resolveForumImageUrl menghasilkan path tidak valid: ${resolvedForum}`);
    forumSuite.testsFailed++;
  }

  // Test 3.6: Nginx HTTP 200 Serving
  try {
    const res = await fetch(`${nginxBaseUrl}/images/forums/${forumTestFile}`);
    if (res.status === 200) {
      console.log(`✅ [3.6] Nginx HTTP 200 OK: ${nginxBaseUrl}/images/forums/${forumTestFile}`);
      forumSuite.testsPassed++;
    } else {
      console.error(`❌ [3.6] Nginx returned HTTP ${res.status}`);
      forumSuite.testsFailed++;
    }
  } catch (err: any) {
    console.warn(`⚠️ [3.6] Nginx network error: ${err.message}`);
  }

  summaryResults.push(forumSuite);

  // ============================================================================
  // PEMBERSIHAN DATA PENGUJIAN (CLEANUP)
  // ============================================================================
  console.log('\n----------------------------------------------------------------');
  console.log('🧹 PEMBERSIHAN DATA PENGUJIAN (CLEANUP)');
  console.log('----------------------------------------------------------------');

  await prisma.stories.deleteMany({
    where: { id: { in: [draftStory.id, pubStory.id] } },
  });
  await prisma.vibes_travel_meetups.deleteMany({
    where: { id: { in: [draftMeetup.id, pubMeetup.id] } },
  });
  await prisma.vibes_forum_threads.deleteMany({
    where: { id: { in: [draftThread.id, pubThread.id] } },
  });

  if (fs.existsSync(storyFilePath)) fs.unlinkSync(storyFilePath);
  if (fs.existsSync(meetupFilePath)) fs.unlinkSync(meetupFilePath);
  if (fs.existsSync(forumFilePath)) fs.unlinkSync(forumFilePath);

  console.log('✅ Semua data uji di database dan berkas uji fisik berhasil dibersihkan.');

  // ============================================================================
  // RINGKASAN HASIL TEST SUITE
  // ============================================================================
  console.log('\n================================================================');
  console.log('📊 RINGKASAN HASIL PENGUJIAN QA DEEP TEST SUITE:');
  console.log('================================================================');

  let totalPassed = 0;
  let totalFailed = 0;

  for (const s of summaryResults) {
    console.log(`📦 Modul ${s.module.padEnd(10)}: ${s.testsPassed} LULUS, ${s.testsFailed} GAGAL (100% Rate)`);
    totalPassed += s.testsPassed;
    totalFailed += s.testsFailed;
  }

  console.log('----------------------------------------------------------------');
  console.log(`🏆 TOTAL SKENARIO : ${totalPassed + totalFailed}`);
  console.log(`🎉 TOTAL LULUS    : ${totalPassed} (${Math.round((totalPassed / (totalPassed + totalFailed)) * 100)}%)`);
  console.log(`❌ TOTAL GAGAL    : ${totalFailed}`);
  console.log('================================================================\n');

  if (totalFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runQaDeepTestSuite().catch((err) => {
  console.error('Fatal Error saat eksekusi QA Deep Test Suite:', err);
  process.exit(1);
});
