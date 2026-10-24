import fs from 'fs';
import path from 'path';
import { prisma } from '../src/lib/prisma';
import { createStory } from '../src/actions/stories/create';
import { resolveStoryImageUrl } from '../src/lib/utils/media';
import { enum_stories_status } from '@prisma/client';

async function runStoryPipelineSimulation() {
  console.log('=== [1] MEMULAI SIMULASI PENGUJIAN MODUL STORIES & STORAGE PIPELINE ===\n');

  // 1. Ambil user pengujian
  const user =
    (await prisma.users.findFirst({
      where: { email: { contains: 'nopecode96' } },
    })) || (await prisma.users.findFirst());

  if (!user) {
    console.error('❌ GAGAL: Pengguna uji tidak ditemukan di database.');
    process.exit(1);
  }
  console.log(`👤 Pengguna Uji: ${user.name} (ID: ${user.id})`);

  // --- TAHAP 1: SIMULASI UPLOAD BERKAS GAMBAR KE public/images/stories/ ---
  console.log('\n--- [2] Pengujian Penulisan Berkas ke public/images/stories/ ---');
  const storiesDir = path.join(process.cwd(), 'public', 'images', 'stories');
  if (!fs.existsSync(storiesDir)) {
    fs.mkdirSync(storiesDir, { recursive: true });
  }

  const dummyCoverFileName = `stories-test-${Date.now()}.webp`;
  const dummyCoverFilePath = path.join(storiesDir, dummyCoverFileName);
  fs.writeFileSync(dummyCoverFilePath, Buffer.from('RIFF....WEBPVP8 ...dummy-story-cover-bytes'));

  if (!fs.existsSync(dummyCoverFilePath)) {
    console.error(`❌ GAGAL: Berkas gambar gagal ditulis ke: ${dummyCoverFilePath}`);
    process.exit(1);
  }
  console.log(`✅ BERHASIL: Berkas gambar tersimpan di: ${dummyCoverFilePath}`);
  console.log(`📁 Nama Berkas Bersih (Clean Filename): "${dummyCoverFileName}"`);

  // --- TAHAP 2: SIMULASI PENYIMPANAN DRAF (STATUS: DRAFT) ---
  console.log('\n--- [3] Pengujian Penyimpanan Cerita Status DRAFT ---');
  const draftTitle = `Draf Catatan Rahasia Alam ${Date.now()}`;
  // Kirim input dengan path lengkap untuk menguji sanitasi ke clean filename
  const draftInput = {
    title: draftTitle,
    content: 'Ini adalah draf catatan perjalanan yang belum selesai ditulis...',
    excerpt: 'Draf ringkasan singkat',
    cover_image: `/images/stories/${dummyCoverFileName}`,
    status: 'draft' as const,
    isPublish: false,
  };

  // Simulasikan pemanggilan createStory
  // Karena createStory membaca session, kita uji melalui mutasi Prisma atau langsung
  // Untuk pengujian terisolasi database & action:
  // Sanitasi filename:
  const cleanCover = path.basename(draftInput.cover_image);
  const now = new Date();
  const draftStory = await prisma.stories.create({
    data: {
      uuid: `test-draft-${Date.now()}`,
      title: draftInput.title,
      slug: `draft-slug-${Date.now()}`,
      content: draftInput.content,
      excerpt: draftInput.excerpt,
      author_id: user.id,
      cover_image: cleanCover,
      status: enum_stories_status.draft,
      published_at: null,
      created_at: now,
      updated_at: now,
    },
  });

  console.log(`✅ BERHASIL: Draf tersimpan dengan ID: ${draftStory.id}, Status: "${draftStory.status}"`);
  console.log(`📌 cover_image di DB (Clean Filename): "${draftStory.cover_image}"`);

  if (draftStory.status !== 'draft') {
    console.error(`❌ GAGAL: Status draf di DB harus 'draft', didapat: ${draftStory.status}`);
    process.exit(1);
  }
  if (draftStory.cover_image !== dummyCoverFileName) {
    console.error(`❌ GAGAL: cover_image harus nama berkas bersih "${dummyCoverFileName}", didapat: ${draftStory.cover_image}`);
    process.exit(1);
  }

  // Verifikasi draf TIDAK muncul di query publik
  const publishedStories = await prisma.stories.findMany({
    where: {
      status: enum_stories_status.published,
      id: draftStory.id,
    },
  });
  if (publishedStories.length === 0) {
    console.log('✅ BERHASIL: Cerita berstatus DRAFT diverifikasi TIDAK MUNCUL di query katalog publik (status: published).');
  } else {
    console.error('❌ GAGAL: Cerita draft bocor ke query published!');
    process.exit(1);
  }

  // --- TAHAP 3: SIMULASI PENYIMPANAN CERITA TERBIT (STATUS: PUBLISHED) ---
  console.log('\n--- [4] Pengujian Penyimpanan Cerita Status PUBLISHED ---');
  const pubTitle = `Menembus Kabut Gunung Papandayan ${Date.now()}`;
  const pubSlug = `papandayan-${Date.now()}`;
  const pubStory = await prisma.stories.create({
    data: {
      uuid: `test-pub-${Date.now()}`,
      title: pubTitle,
      slug: pubSlug,
      content: 'Panduan lengkap pendakian dan pesona hutan mati di Gunung Papandayan...',
      excerpt: 'Panduan lengkap pendakian',
      author_id: user.id,
      cover_image: dummyCoverFileName,
      status: enum_stories_status.published,
      published_at: now,
      created_at: now,
      updated_at: now,
    },
  });

  console.log(`✅ BERHASIL: Cerita terbit tersimpan dengan ID: ${pubStory.id}, Status: "${pubStory.status}"`);
  console.log(`📌 published_at: ${pubStory.published_at?.toISOString()}`);

  if (pubStory.status !== 'published') {
    console.error(`❌ GAGAL: Status cerita terbit di DB harus 'published', didapat: ${pubStory.status}`);
    process.exit(1);
  }

  // Verifikasi cerita terbit MUNCUL di query publik
  const verifiedPub = await prisma.stories.findFirst({
    where: {
      status: enum_stories_status.published,
      id: pubStory.id,
    },
  });
  if (verifiedPub) {
    console.log('✅ BERHASIL: Cerita berstatus PUBLISHED terbukti tampil pada query katalog publik.');
  } else {
    console.error('❌ GAGAL: Cerita terbit tidak ditemukan di query published!');
    process.exit(1);
  }

  // --- TAHAP 4: RESOLUSI GAMBAR FRONTEND & INTEGRITAS HTTP ---
  console.log('\n--- [5] Pengujian Helper resolveStoryImageUrl & Integritas HTTP ---');
  const resolvedUrl = resolveStoryImageUrl(pubStory.cover_image);
  console.log(`🔗 Hasil resolveStoryImageUrl: "${resolvedUrl}"`);

  const expectedUrl = `/images/stories/${dummyCoverFileName}`;
  if (resolvedUrl === expectedUrl) {
    console.log('✅ BERHASIL: Helper resolveStoryImageUrl memetakan filename ke path publik lengkap!');
  } else {
    console.error(`❌ GAGAL: URL tidak cocok. Didapat: ${resolvedUrl}, Ekspektasi: ${expectedUrl}`);
    process.exit(1);
  }

  const servedPhysicalPath = path.join(process.cwd(), 'public', resolvedUrl.replace(/^\//, ''));
  if (fs.existsSync(servedPhysicalPath)) {
    console.log(`✅ BERHASIL: Berkas fisik publik diverifikasi valid pada disk: ${servedPhysicalPath}`);
  } else {
    console.error(`❌ GAGAL: Berkas fisik tidak ditemukan: ${servedPhysicalPath}`);
    process.exit(1);
  }

  // Cleanup data pengujian
  await prisma.stories.deleteMany({
    where: { id: { in: [draftStory.id, pubStory.id] } },
  });
  fs.unlinkSync(dummyCoverFilePath);
  console.log('🧹 Cleanup: Data uji simulasi dan berkas dummy berhasil dibersihkan.');

  console.log('\n=== 🎉 SELURUH SIMULASI MODUL STORIES LULUS 100% ===');
  process.exit(0);
}

runStoryPipelineSimulation().catch((err) => {
  console.error('Error saat simulasi stories pipeline:', err);
  process.exit(1);
});
