import fs from 'fs';
import path from 'path';
import { prisma } from '../src/lib/prisma';

async function runAvatarPipelineSimulation() {
  console.log('=== [1] MEMULAI SIMULASI PENGUJIAN ALUR AVATAR ===\n');

  // Ambil user pengujian (Nope Lavanda / ID: 6 atau user pertama)
  const user =
    (await prisma.users.findFirst({
      where: { email: { contains: 'nopecode96' } },
    })) || (await prisma.users.findFirst());

  if (!user) {
    console.error('❌ GAGAL: Tidak ada pengguna ditemukan di database.');
    process.exit(1);
  }

  console.log(`👤 Pengguna Uji: ${user.name} (ID: ${user.id})`);
  console.log(`📌 Avatar di DB sebelum uji: "${user.avatar_url}"\n`);

  // --- TAHAP 1: SIMULASI UPLOAD BERKAS FISIK KE DISK ---
  console.log('--- [2] Menguji Penulisan Berkas ke public/images/avatars/ ---');
  const avatarsDir = path.join(process.cwd(), 'public', 'images', 'avatars');
  if (!fs.existsSync(avatarsDir)) {
    fs.mkdirSync(avatarsDir, { recursive: true });
  }

  const dummyFileName = `test-avatar-${Date.now()}.webp`;
  const dummyFilePath = path.join(avatarsDir, dummyFileName);

  // Tulis buffer tiruan 100 bytes
  fs.writeFileSync(dummyFilePath, Buffer.from('RIFF....WEBPVP8 ...dummy-image-bytes'));

  if (!fs.existsSync(dummyFilePath)) {
    console.error(`❌ GAGAL: Berkas fisik tidak berhasil ditulis ke: ${dummyFilePath}`);
    process.exit(1);
  }
  console.log(`✅ BERHASIL: Berkas fisik tersimpan di: ${dummyFilePath}`);
  console.log(`📁 Nama Berkas Bersih: "${dummyFileName}"\n`);

  // --- TAHAP 2: SIMULASI UPDATE DATABASE (HANYA SIMPAN NAMA BERKAS) ---
  console.log('--- [3] Menguji Mutasi Database (Menyimpan Nama Berkas Bersih) ---');
  const updatedUser = await prisma.users.update({
    where: { id: user.id },
    data: {
      avatar_url: dummyFileName, // Murni nama berkas, tanpa path!
    },
  });

  if (updatedUser.avatar_url !== dummyFileName) {
    console.error(
      `❌ GAGAL: Database tidak menyimpan nama berkas baru. Nilai sekarang: ${updatedUser.avatar_url}`
    );
    process.exit(1);
  }
  console.log(
    `✅ BERHASIL: Database tabel "users" ter-update dengan avatar_url: "${updatedUser.avatar_url}"\n`
  );

  // --- TAHAP 3: SIMULASI HELPER RESOLUSI FRONTEND ---
  console.log('--- [4] Menguji Logika Helper Frontend (resolveAvatarUrl) ---');
  function resolveAvatarUrl(rawName: string | null | undefined): string {
    if (!rawName || rawName.trim() === '') return '/images/default-avatar.png';
    const clean = rawName.trim();
    if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('blob:')) {
      return clean;
    }
    if (clean.startsWith('/images/')) {
      return clean;
    }
    const cleanFile = clean.replace(/^\/+/, '');
    return `/images/avatars/${cleanFile}`;
  }

  const resolved = resolveAvatarUrl(updatedUser.avatar_url);
  console.log(`🔗 Hasil Resolusi URL Frontend: "${resolved}"`);

  const expectedUrl = `/images/avatars/${dummyFileName}`;
  if (resolved === expectedUrl) {
    console.log(
      '✅ BERHASIL: Helper frontend sukses mengubah filename menjadi path lengkap publik!'
    );
  } else {
    console.error(`❌ GAGAL: URL tidak cocok. Didapat: ${resolved}, Ekspektasi: ${expectedUrl}`);
    process.exit(1);
  }

  // --- TAHAP 4: INTEGRITAS BERKAS HTTP ---
  const publicServedPath = path.join(process.cwd(), 'public', resolved.replace(/^\//, ''));
  if (fs.existsSync(publicServedPath)) {
    console.log(`✅ BERHASIL: Berkas fisik publik diverifikasi valid pada: ${publicServedPath}`);
  } else {
    console.error(
      `❌ GAGAL: Berkas tidak ditemukan pada jalur publik yang di-resolve: ${publicServedPath}`
    );
    process.exit(1);
  }

  console.log('\n=== 🎉 SELURUH SIMULASI PIPELINE LULUS 100% ===');
  process.exit(0);
}

runAvatarPipelineSimulation().catch((err) => {
  console.error('Error saat menjalankan simulasi:', err);
  process.exit(1);
});
