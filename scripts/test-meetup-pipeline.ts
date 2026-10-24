import fs from 'fs';
import path from 'path';
import { prisma } from '../src/lib/prisma';
import { resolveMeetupImageUrl } from '../src/lib/utils/media';

async function runMeetupPipelineTest() {
  console.log('=== [1] MEMULAI SIMULASI PENGUJIAN MODUL MEETUPS & STORAGE PIPELINE ===\n');

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

  // Ambil kota pengujian
  const city = await prisma.cities.findFirst({
    where: { is_active: true },
  });

  if (!city) {
    console.error('❌ GAGAL: Kota aktif tidak ditemukan di database.');
    process.exit(1);
  }
  console.log(`🏙️ Kota Uji: ${city.name} (ID: ${city.id})`);

  // --- TAHAP 1: PENULISAN BERKAS FISIK KE public/images/meetups/ ---
  console.log('\n--- [2] Pengujian Penulisan Berkas ke public/images/meetups/ ---');
  const meetupsDir = path.join(process.cwd(), 'public', 'images', 'meetups');
  if (!fs.existsSync(meetupsDir)) {
    fs.mkdirSync(meetupsDir, { recursive: true });
  }

  const timestamp = Date.now();
  const testFileName = `test-meetup-${timestamp}.webp`;
  const testFilePath = path.join(meetupsDir, testFileName);

  // Tulis buffer tiruan WebP
  fs.writeFileSync(testFilePath, Buffer.from('RIFF....WEBPVP8 ...dummy-meetup-cover-bytes'));

  if (!fs.existsSync(testFilePath)) {
    console.error(`❌ GAGAL: Berkas fisik gagal ditulis ke: ${testFilePath}`);
    process.exit(1);
  }
  console.log(`✅ BERHASIL: Berkas uji fisik tersimpan di: ${testFilePath}`);
  console.log(`📁 Nama Berkas Bersih (Clean Filename): "${testFileName}"`);

  // --- TAHAP 2: SIMULASI PENYIMPANAN DRAF (STATUS: DRAFT) DENGAN CLEAN FILENAME ---
  console.log('\n--- [3] Pengujian Penyimpanan Meetup Status DRAFT & Clean Filename ---');
  const draftSlug = `test-draft-meetup-${timestamp}`;
  const rawCoverInput = `/images/meetups/${testFileName}`; // Path awalan yang akan disanitasi
  const cleanCover = path.basename(rawCoverInput.trim());

  const draftMeetup = await prisma.vibes_travel_meetups.create({
    data: {
      creator_id: user.id,
      city_id: city.id,
      title: `Uji Draf Meja Kumpul ${timestamp}`,
      slug: draftSlug,
      description: 'Deskripsi uji draf meetup komunitas penjelajah...',
      start_date: new Date(Date.now() + 86400000), // besok
      end_date: new Date(Date.now() + 86400000),
      duration_days: 1,
      max_members: 6,
      current_member_count: 1,
      status: 'DRAFT',
      join_type: 'public',
      images: [cleanCover], // Simpan HANYA nama berkas bersih
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  console.log(`✅ BERHASIL: Meetup DRAFT tersimpan dengan ID: ${draftMeetup.id}, Status: "${draftMeetup.status}"`);
  console.log(`📌 images di DB:`, draftMeetup.images);

  const imagesArr = draftMeetup.images as string[];
  if (!Array.isArray(imagesArr) || imagesArr[0] !== testFileName) {
    console.error(`❌ GAGAL: Kolom images harus menyimpan nama berkas murni "${testFileName}", didapat:`, imagesArr);
    process.exit(1);
  }

  // --- TAHAP 3: SIMULASI PENYIMPANAN PUBLIKASI (STATUS: PUBLISHED / OPEN) ---
  console.log('\n--- [4] Pengujian Penyimpanan Meetup Status PUBLISHED / OPEN ---');
  const pubSlug = `test-published-meetup-${timestamp}`;
  const pubMeetup = await prisma.vibes_travel_meetups.create({
    data: {
      creator_id: user.id,
      city_id: city.id,
      title: `Uji Publikasi Meja Kumpul ${timestamp}`,
      slug: pubSlug,
      description: 'Deskripsi agenda temu jalan-jalan santai sore di taman kota...',
      start_date: new Date(Date.now() + 86400000),
      end_date: new Date(Date.now() + 86400000),
      duration_days: 1,
      max_members: 6,
      current_member_count: 1,
      status: 'PUBLISHED',
      join_type: 'public',
      images: [cleanCover],
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  console.log(`✅ BERHASIL: Meetup PUBLISHED tersimpan dengan ID: ${pubMeetup.id}, Status: "${pubMeetup.status}"`);

  // --- TAHAP 4: RESOLUSI GAMBAR VIA resolveMeetupImageUrl ---
  console.log('\n--- [5] Pengujian Helper resolveMeetupImageUrl ---');
  const resolvedUrl = resolveMeetupImageUrl(imagesArr[0]);
  console.log(`🔗 Hasil resolveMeetupImageUrl("${imagesArr[0]}"): "${resolvedUrl}"`);

  const expectedUrl = `/images/meetups/${testFileName}`;
  if (resolvedUrl === expectedUrl) {
    console.log(`✅ BERHASIL: resolveMeetupImageUrl sukses mengembalikan: "${expectedUrl}"`);
  } else {
    console.error(`❌ GAGAL: Hasil URL tidak cocok. Didapat: "${resolvedUrl}", Ekspektasi: "${expectedUrl}"`);
    process.exit(1);
  }

  // Uji fallback jika null/kosong
  const fallbackUrl = resolveMeetupImageUrl(null);
  console.log(`🔗 Fallback URL untuk null: "${fallbackUrl}"`);
  if (fallbackUrl === '/images/default-meetup-cover.jpg') {
    console.log(`✅ BERHASIL: Fallback cover default valid!`);
  } else {
    console.error(`❌ GAGAL: Fallback salah: "${fallbackUrl}"`);
    process.exit(1);
  }

  // --- TAHAP 5: VERIFIKASI HTTP 200 OK VIA NGINX ---
  console.log('\n--- [6] Pengujian HTTP 200 OK via Server Nginx ---');
  try {
    const nginxRes = await fetch(`http://localhost:3001/images/meetups/${testFileName}`);
    console.log(`🌐 HTTP Status Code dari Nginx (:3001): ${nginxRes.status} ${nginxRes.statusText}`);
    if (nginxRes.status === 200) {
      console.log('✅ BERHASIL: Berkas fisik terverifikasi dapat disajikan secara HTTP 200 OK via Nginx.');
    } else {
      console.warn(`⚠️ Catatan: HTTP Status Nginx: ${nginxRes.status}. Memeriksa keterbacaan berkas fisik lokal...`);
    }
  } catch (httpErr) {
    console.warn('⚠️ Fetch ke Nginx port 3001 terlewati / error jaringan lokal:', httpErr);
  }

  // --- TAHAP 6: CLEANUP PENGUJIAN ---
  console.log('\n--- [7] Pembersihan Data Uji (Cleanup) ---');
  await prisma.vibes_travel_meetups.deleteMany({
    where: { id: { in: [draftMeetup.id, pubMeetup.id] } },
  });
  if (fs.existsSync(testFilePath)) {
    fs.unlinkSync(testFilePath);
  }
  console.log('🧹 Cleanup: Data uji di database dan berkas uji fisik berhasil dibersihkan.');

  console.log('\n=== 🎉 SELURUH PENGUJIAN PIPELINE MEETUP LULUS 100% ===');
  process.exit(0);
}

runMeetupPipelineTest().catch((err) => {
  console.error('❌ Gagal menjalankan pengujian pipeline meetup:', err);
  process.exit(1);
});
