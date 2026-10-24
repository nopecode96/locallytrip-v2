/**
 * scripts/normalize-image-paths.ts
 *
 * Script normalisasi path gambar di database.
 * Mengubah path lama (legacy uploads atau path tanpa slash awalan)
 * menjadi path standar /images/[subfolder]/[filename]
 *
 * Jalankan:
 *   npx ts-node --project tsconfig.json scripts/normalize-image-paths.ts
 *   atau
 *   npx tsx scripts/normalize-image-paths.ts
 *
 * PASTIKAN backup database sebelum menjalankan script ini!
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Pemetaan folder lama → folder baru ──────────────────────────────────────
// Key: pola path lama (string match)
// Value: subfolder tujuan di public/images/
const LEGACY_DIR = 'uploads';
const FOLDER_REMAP: Array<{ pattern: RegExp; targetFolder: string }> = [
  { pattern: new RegExp(`^\\/${LEGACY_DIR}\\/avatars?\\/|^avatars?\\/`, 'i'), targetFolder: 'avatars' },
  { pattern: new RegExp(`^\\/${LEGACY_DIR}\\/stories?\\/|^stories?\\/`, 'i'), targetFolder: 'stories' },
  { pattern: new RegExp(`^\\/${LEGACY_DIR}\\/experience[s]?\\/|^experience[s]?\\/`, 'i'), targetFolder: 'experiences' },
  { pattern: new RegExp(`^\\/${LEGACY_DIR}\\/cities?\\/|^cities?\\/`, 'i'), targetFolder: 'cities' },
  { pattern: new RegExp(`^\\/${LEGACY_DIR}\\/kyc\\/|^kyc\\/`, 'i'), targetFolder: 'kyc' },
  { pattern: new RegExp(`^\\/${LEGACY_DIR}\\/banner[s]?\\/|^banner[s]?\\/`, 'i'), targetFolder: 'banners' },
  { pattern: new RegExp(`^\\/${LEGACY_DIR}\\/review[s]?\\/|^review[s]?\\/`, 'i'), targetFolder: 'reviews' },
  { pattern: new RegExp(`^\\/${LEGACY_DIR}\\/reward[s]?\\/|^reward[s]?\\/`, 'i'), targetFolder: 'rewards' },
  { pattern: new RegExp(`^\\/${LEGACY_DIR}\\/promotion[s]?\\/|^promotion[s]?\\/`, 'i'), targetFolder: 'promotions' },
  { pattern: new RegExp(`^\\/${LEGACY_DIR}\\/advertisement[s]?\\/|^advertisement[s]?\\/`, 'i'), targetFolder: 'advertisement' },
  { pattern: new RegExp(`^\\/${LEGACY_DIR}\\/forum[s]?\\/|^forum[s]?\\/`, 'i'), targetFolder: 'forums' },
  { pattern: new RegExp(`^\\/${LEGACY_DIR}\\/meetup[s]?\\/|^meetup[s]?\\/`, 'i'), targetFolder: 'meetups' },
  { pattern: new RegExp(`^\\/${LEGACY_DIR}\\/user[s]?\\/|^user[s]?\\/`, 'i'), targetFolder: 'users' },
  // Fallback: legacy general/ atau legacy unknown/
  { pattern: new RegExp(`^\\/${LEGACY_DIR}\\/`), targetFolder: 'stories' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Normalisasi satu URL gambar ke format /images/[subfolder]/[filename]
 * Mengembalikan string yang sudah dinormalisasi, atau null jika tidak perlu diubah.
 */
function normalizeUrl(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();

  // Sudah valid → /images/... (kecuali /images/default-* yang bukan upload user)
  if (trimmed.startsWith('/images/') && !trimmed.startsWith('/images/default')) {
    return null; // Tidak perlu diubah
  }

  // URL eksternal (http/https) → biarkan
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return null;
  }

  // Coba cocokkan dengan pola remap
  for (const { pattern, targetFolder } of FOLDER_REMAP) {
    if (pattern.test(trimmed)) {
      // Ambil hanya nama file dari path
      const filename = trimmed.replace(/^.*[\\/]/, '');
      if (!filename) continue;
      return `/images/${targetFolder}/${filename}`;
    }
  }

  return null; // Tidak dikenali, biarkan
}

/**
 * Normalisasi array JSON berisi URL gambar.
 * Mengembalikan [array baru, apakah ada perubahan]
 */
function normalizeJsonArray(jsonVal: any): [string[], boolean] {
  if (!jsonVal) return [[], false];
  let arr: string[] = [];
  try {
    arr = typeof jsonVal === 'string' ? JSON.parse(jsonVal) : (jsonVal as string[]);
  } catch {
    return [[], false];
  }
  if (!Array.isArray(arr)) return [[], false];

  let changed = false;
  const normalized = arr.map((url) => {
    const fixed = normalizeUrl(url);
    if (fixed !== null) {
      changed = true;
      return fixed;
    }
    return url;
  });
  return [normalized, changed];
}

// ─── Statistik ────────────────────────────────────────────────────────────────
let totalFixed = 0;

function logFixed(table: string, id: string | number, field: string, before: string, after: string) {
  totalFixed++;
  console.log(`  ✅ [${table}#${id}] ${field}: "${before}" → "${after}"`);
}

// ─── Normalisasi per tabel ────────────────────────────────────────────────────

async function normalizeUsers() {
  console.log('\n📋 Table: users (avatar_url, image)');
  const rows = await prisma.users.findMany({
    select: { id: true, avatar_url: true },
  });

  for (const row of rows) {
    const updates: Record<string, string> = {};

    const fixedAvatar = normalizeUrl(row.avatar_url);
    if (fixedAvatar) {
      logFixed('users', row.id, 'avatar_url', row.avatar_url!, fixedAvatar);
      updates.avatar_url = fixedAvatar;
    }

    if (Object.keys(updates).length > 0) {
      await (prisma.users as any).update({
        where: { id: row.id },
        data: updates,
      });
    }
  }
}

async function normalizeStories() {
  console.log('\n📋 Table: stories (cover_image, images[])');

  // Cari tabel stories
  const rows = await (prisma as any).$queryRaw`
    SELECT id, cover_image, images FROM stories
  `;

  for (const row of rows as any[]) {
    const updates: Record<string, any> = {};

    const fixedCover = normalizeUrl(row.cover_image);
    if (fixedCover) {
      logFixed('stories', row.id, 'cover_image', row.cover_image, fixedCover);
      updates.cover_image = fixedCover;
    }

    const [fixedImages, imagesChanged] = normalizeJsonArray(row.images);
    if (imagesChanged) {
      console.log(`  ✅ [stories#${row.id}] images array updated`);
      updates.images = fixedImages;
    }

    if (Object.keys(updates).length > 0) {
      const setClauses: string[] = [];
      const values: any[] = [];
      let idx = 1;

      if (updates.cover_image) {
        setClauses.push(`cover_image = $${idx++}`);
        values.push(updates.cover_image);
      }
      if (updates.images) {
        setClauses.push(`images = $${idx++}::jsonb`);
        values.push(JSON.stringify(updates.images));
      }

      values.push(row.id);
      await (prisma as any).$executeRawUnsafe(
        `UPDATE stories SET ${setClauses.join(', ')} WHERE id = $${idx}`,
        ...values
      );
    }
  }
}

async function normalizeExperiences() {
  console.log('\n📋 Table: experiences (images[])');
  // Catatan: tabel experiences TIDAK memiliki kolom image_url, hanya images (JSON array)
  const rows = await (prisma as any).$queryRaw`
    SELECT id, images FROM experiences
  `;

  for (const row of rows as any[]) {
    const [fixedImages, imagesChanged] = normalizeJsonArray(row.images);
    if (imagesChanged) {
      console.log(`  ✅ [experiences#${row.id}] images array updated`);
      await (prisma as any).$executeRaw`
        UPDATE experiences SET images = ${JSON.stringify(fixedImages)}::jsonb WHERE id = ${row.id}
      `;
    }
  }
}


async function normalizeCities() {
  console.log('\n📋 Table: cities (image_url)');
  const rows = await (prisma as any).$queryRaw`
    SELECT id, image_url FROM cities
  `;

  for (const row of rows as any[]) {
    const fixedImage = normalizeUrl(row.image_url);
    if (fixedImage) {
      logFixed('cities', row.id, 'image_url', row.image_url, fixedImage);
      await (prisma as any).$executeRaw`
        UPDATE cities SET image_url = ${fixedImage} WHERE id = ${row.id}
      `;
    }
  }
}

async function normalizeMeetups() {
  console.log('\n📋 Table: vibes_travel_meetups (images[], recap_images[])');
  // Catatan: tabel vibes_travel_meetups TIDAK memiliki cover_image, hanya images & recap_images
  const rows = await (prisma as any).$queryRaw`
    SELECT id, images, recap_images FROM vibes_travel_meetups
  `;

  for (const row of rows as any[]) {
    const [fixedImages, imagesChanged] = normalizeJsonArray(row.images);
    const [fixedRecap, recapChanged] = normalizeJsonArray(row.recap_images);

    if (imagesChanged || recapChanged) {
      const setClauses: string[] = [];
      const values: any[] = [];
      let idx = 1;

      if (imagesChanged) {
        console.log(`  ✅ [vibes_travel_meetups#${row.id}] images array updated`);
        setClauses.push(`images = $${idx++}::jsonb`);
        values.push(JSON.stringify(fixedImages));
      }
      if (recapChanged) {
        console.log(`  ✅ [vibes_travel_meetups#${row.id}] recap_images array updated`);
        setClauses.push(`recap_images = $${idx++}::jsonb`);
        values.push(JSON.stringify(fixedRecap));
      }

      values.push(row.id);
      await (prisma as any).$executeRawUnsafe(
        `UPDATE vibes_travel_meetups SET ${setClauses.join(', ')} WHERE id = $${idx}`,
        ...values
      );
    }
  }
}

async function normalizeForumThreads() {
  console.log('\n📋 Table: vibes_forum_threads (images[])');
  const rows = await (prisma as any).$queryRaw`
    SELECT id, images FROM vibes_forum_threads
  `;

  for (const row of rows as any[]) {
    const [fixedImages, changed] = normalizeJsonArray(row.images);
    if (changed) {
      console.log(`  ✅ [vibes_forum_threads#${row.id}] images array updated`);
      await (prisma as any).$executeRaw`
        UPDATE vibes_forum_threads SET images = ${JSON.stringify(fixedImages)}::jsonb WHERE id = ${row.id}
      `;
    }
  }
}

async function normalizeKycDocuments() {
  console.log('\n📋 Table: kyc_documents (file_path)');
  // Catatan: tabel kyc_documents menyimpan path file di kolom file_path, bukan image_url
  const rows = await (prisma as any).$queryRaw`
    SELECT id, file_path FROM kyc_documents
  `;

  for (const row of rows as any[]) {
    const fixedPath = normalizeUrl(row.file_path);
    if (fixedPath) {
      logFixed('kyc_documents', row.id, 'file_path', row.file_path, fixedPath);
      await (prisma as any).$executeRaw`
        UPDATE kyc_documents SET file_path = ${fixedPath} WHERE id = ${row.id}
      `;
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Normalisasi Path Gambar Database');
  console.log('=====================================');
  console.log('Target: legacy uploads dan path tanpa awalan → /images/[subfolder]/...\n');
  console.log('⚠️  PASTIKAN Anda sudah backup database sebelum melanjutkan!\n');

  try {
    await normalizeUsers();
    await normalizeStories();
    await normalizeExperiences();
    await normalizeCities();
    await normalizeMeetups();
    await normalizeForumThreads();
    await normalizeKycDocuments();
  } catch (error) {
    console.error('\n❌ Error saat normalisasi:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n=====================================');
  console.log(`✅ Selesai! Total field yang diperbarui: ${totalFixed}`);

  if (totalFixed === 0) {
    console.log('ℹ️  Tidak ada path yang perlu dinormalisasi. Database sudah bersih!');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
