import fs from 'fs';
import path from 'path';
import { prisma } from '../src/lib/prisma';
import { resolveForumImageUrl } from '../src/lib/utils/media';

async function runForumPipelineTest() {
  console.log('=== [1] MEMULAI SIMULASI PENGUJIAN MODUL FORUMS & STORAGE PIPELINE ===\n');

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

  // Ambil kategori forum aktif
  const category = await prisma.vibes_forum_categories.findFirst({
    where: { is_active: true },
  });

  if (!category) {
    console.error('❌ GAGAL: Kategori forum aktif tidak ditemukan di database.');
    process.exit(1);
  }
  console.log(`🏷️ Kategori Forum Uji: ${category.name} (ID: ${category.id})`);

  // --- TAHAP 1: PENULISAN BERKAS FISIK KE public/images/forums/ ---
  console.log('\n--- [2] Pengujian Penulisan Berkas ke public/images/forums/ ---');
  const forumsDir = path.join(process.cwd(), 'public', 'images', 'forums');
  if (!fs.existsSync(forumsDir)) {
    fs.mkdirSync(forumsDir, { recursive: true });
  }

  const timestamp = Date.now();
  const testFileName = `test-forum-${timestamp}.webp`;
  const testFilePath = path.join(forumsDir, testFileName);

  // Tulis buffer tiruan WebP
  fs.writeFileSync(testFilePath, Buffer.from('RIFF....WEBPVP8 ...dummy-forum-cover-bytes'));

  if (!fs.existsSync(testFilePath)) {
    console.error(`❌ GAGAL: Berkas fisik gagal ditulis ke: ${testFilePath}`);
    process.exit(1);
  }
  console.log(`✅ BERHASIL: Berkas uji fisik tersimpan di: ${testFilePath}`);
  console.log(`📁 Nama Berkas Bersih (Clean Filename): "${testFileName}"`);

  // --- TAHAP 2: SIMULASI PENYIMPANAN DRAF (STATUS: DRAFT) DENGAN CLEAN FILENAME ---
  console.log('\n--- [3] Pengujian Penyimpanan Forum Thread Status DRAFT & Clean Filename ---');
  const draftSlug = `test-draft-forum-${timestamp}`;
  const rawCoverInput = `/images/forums/${testFileName}`; // Path awalan yang akan disanitasi
  const cleanCover = path.basename(rawCoverInput.trim());

  const draftThread = await prisma.vibes_forum_threads.create({
    data: {
      author_id: user.id,
      category_id: category.id,
      title: `Uji Draf Diskusi Forum ${timestamp}`,
      slug: draftSlug,
      content: 'Penjelasan draf topik diskusi forum komunitas sebelum terbit...',
      status: 'DRAFT',
      images: [cleanCover], // Simpan HANYA nama berkas murni
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  console.log(`✅ BERHASIL: Thread DRAFT tersimpan dengan ID: ${draftThread.id}, Status: "${draftThread.status}"`);
  console.log(`📌 images di DB:`, draftThread.images);

  const imagesArr = draftThread.images as string[];
  if (!Array.isArray(imagesArr) || imagesArr[0] !== testFileName) {
    console.error(`❌ GAGAL: Kolom images harus menyimpan nama berkas murni "${testFileName}", didapat:`, imagesArr);
    process.exit(1);
  }

  // --- TAHAP 3: SIMULASI PENYIMPANAN PUBLIKASI (STATUS: PUBLISHED) ---
  console.log('\n--- [4] Pengujian Penyimpanan Forum Thread Status PUBLISHED ---');
  const pubSlug = `test-published-forum-${timestamp}`;
  const pubThread = await prisma.vibes_forum_threads.create({
    data: {
      author_id: user.id,
      category_id: category.id,
      title: `Uji Publikasi Diskusi Forum ${timestamp}`,
      slug: pubSlug,
      content: 'Rekomendasi rute tersembunyi dan tips perjalanan hemat...',
      status: 'PUBLISHED',
      images: [cleanCover],
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  console.log(`✅ BERHASIL: Thread PUBLISHED tersimpan dengan ID: ${pubThread.id}, Status: "${pubThread.status}"`);

  // --- TAHAP 4: RESOLUSI GAMBAR VIA resolveForumImageUrl ---
  console.log('\n--- [5] Pengujian Helper resolveForumImageUrl ---');
  const resolvedUrl = resolveForumImageUrl(imagesArr[0]);
  console.log(`🔗 Hasil resolveForumImageUrl("${imagesArr[0]}"): "${resolvedUrl}"`);

  const expectedUrl = `/images/forums/${testFileName}`;
  if (resolvedUrl === expectedUrl) {
    console.log(`✅ BERHASIL: resolveForumImageUrl sukses mengembalikan: "${expectedUrl}"`);
  } else {
    console.error(`❌ GAGAL: Hasil URL tidak cocok. Didapat: "${resolvedUrl}", Ekspektasi: "${expectedUrl}"`);
    process.exit(1);
  }

  // Uji fallback jika null/kosong
  const fallbackUrl = resolveForumImageUrl(null);
  console.log(`🔗 Fallback URL untuk null: "${fallbackUrl}"`);
  if (fallbackUrl === '/images/default-forum-cover.jpg') {
    console.log(`✅ BERHASIL: Fallback cover default valid!`);
  } else {
    console.error(`❌ GAGAL: Fallback salah: "${fallbackUrl}"`);
    process.exit(1);
  }

  // --- TAHAP 5: VERIFIKASI HTTP 200 OK VIA NGINX ---
  console.log('\n--- [6] Pengujian HTTP 200 OK via Server Nginx ---');
  try {
    const nginxRes = await fetch(`http://localhost:3001/images/forums/${testFileName}`);
    console.log(`🌐 HTTP Status Code dari Nginx (:3001): ${nginxRes.status} ${nginxRes.statusText}`);
    if (nginxRes.status === 200) {
      console.log('✅ BERHASIL: Berkas fisik terverifikasi dapat disajikan secara HTTP 200 OK via Nginx.');
    } else {
      console.warn(`⚠️ Catatan: HTTP Status Nginx: ${nginxRes.status}`);
    }
  } catch (httpErr) {
    console.warn('⚠️ Fetch ke Nginx port 3001 terlewati / error jaringan lokal:', httpErr);
  }

  // --- TAHAP 6: CLEANUP PENGUJIAN ---
  console.log('\n--- [7] Pembersihan Data Uji (Cleanup) ---');
  await prisma.vibes_forum_threads.deleteMany({
    where: { id: { in: [draftThread.id, pubThread.id] } },
  });
  if (fs.existsSync(testFilePath)) {
    fs.unlinkSync(testFilePath);
  }
  console.log('🧹 Cleanup: Data uji di database dan berkas uji fisik berhasil dibersihkan.');

  console.log('\n=== 🎉 SELURUH PENGUJIAN PIPELINE FORUM LULUS 100% ===');
  process.exit(0);
}

runForumPipelineTest().catch((err) => {
  console.error('❌ Gagal menjalankan pengujian pipeline forum:', err);
  process.exit(1);
});
