import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCurrentUserSession } from '@/actions/bookings';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 detik

// Format ekstensi gambar yang diperbolehkan
const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

// Batas ukuran maksimal 10 MB per gambar sebelum/sesudah kompresi
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

// Daftar subfolder resmi yang diizinkan sesuai struktur public/images/
const ALLOWED_FOLDERS = [
  'avatars',
  'stories',
  'experiences',
  'cities',
  'destinations',
  'kyc',
  'banners',
  'promotions',
  'reviews',
  'rewards',
  'advertisement',
  'forums',
  'meetups',
  'users',
] as const;

type AllowedFolder = (typeof ALLOWED_FOLDERS)[number];

function isAllowedFolder(folder: string): folder is AllowedFolder {
  return ALLOWED_FOLDERS.includes(folder as AllowedFolder);
}

export async function POST(request: NextRequest) {
  try {
    // 1. Validasi & Proteksi Akses (Auth Guard)
    let userEmail: string | null = null;
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      userEmail = session.user.email;
    } else {
      const rawSession = await getCurrentUserSession();
      if (rawSession?.isLoggedIn && rawSession.email) {
        userEmail = rawSession.email;
      }
    }

    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Silakan masuk terlebih dahulu untuk mengunggah berkas.' },
        { status: 401 }
      );
    }

    // 2. Baca FormData
    const formData = await request.formData();
    const rawFolder = (formData.get('folder') ?? formData.get('type'))?.toString() ?? '';

    // Sanitasi nama folder untuk mencegah path traversal
    const sanitized = rawFolder.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();

    // Validasi folder terhadap whitelist resmi
    if (!sanitized || !isAllowedFolder(sanitized)) {
      return NextResponse.json(
        {
          success: false,
          error: `Folder upload tidak valid: "${rawFolder}". Folder yang diizinkan: ${ALLOWED_FOLDERS.join(', ')}.`,
        },
        { status: 400 }
      );
    }

    const targetFolder: AllowedFolder = sanitized;

    // Ambil semua file yang diunggah dengan key 'file' atau 'files'
    const files: File[] = [];
    const directFiles = formData.getAll('files');
    const singleFiles = formData.getAll('file');

    for (const item of [...directFiles, ...singleFiles]) {
      if (item instanceof File && item.size > 0) {
        files.push(item);
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Tidak ada berkas gambar yang dipilih.' },
        { status: 400 }
      );
    }

    // 3. Tentukan direktori penyimpanan → public/images/[subfolder]/
    const targetDir = path.join(process.cwd(), 'public', 'images', targetFolder);
    try {
      await fs.mkdir(targetDir, { recursive: true });
    } catch (mkdirErr: any) {
      if (mkdirErr.code !== 'EEXIST') {
        console.error('Gagal membuat direktori upload:', mkdirErr);
        return NextResponse.json(
          {
            success: false,
            error: `Izin server ditolak saat menyiapkan folder penyimpanan: ${mkdirErr.message}`,
          },
          { status: 500 }
        );
      }
    }

    const uploadedUrls: string[] = [];
    const uploadedFileNames: string[] = [];

    for (const file of files) {
      // Validasi MIME type
      const mime = file.type.toLowerCase();
      let ext = ALLOWED_MIME_TYPES[mime];
      if (!ext && file.name) {
        const fileExt = file.name.split('.').pop()?.toLowerCase();
        if (fileExt && ['jpg', 'jpeg', 'png', 'webp', 'avif'].includes(fileExt)) {
          ext = fileExt === 'jpeg' ? 'jpg' : fileExt;
        }
      }
      if (!ext) {
        return NextResponse.json(
          {
            success: false,
            error: `Tipe berkas tidak didukung (${file.name}). Hanya format JPEG, PNG, WebP, dan AVIF yang diizinkan.`,
          },
          { status: 400 }
        );
      }

      // Validasi Ukuran File (Max 5MB)
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          {
            success: false,
            error: `Ukuran berkas ${file.name} melebihi batas maksimal 5 MB.`,
          },
          { status: 400 }
        );
      }

      // Buat nama berkas unik: `${folder}-${Date.now()}-${randomId}.${ext}`
      const randomId = crypto.randomBytes(6).toString('hex');
      const filename = `${targetFolder}-${Date.now()}-${randomId}.${ext}`;
      const filePath = path.join(targetDir, filename);

      // Simpan berkas ke filesystem via fs.writeFile
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await fs.writeFile(filePath, buffer);
      console.log('UPLOAD OK:', filePath);

      // URL publik WAJIB diawali slash '/' → /images/[subfolder]/[filename]
      const publicUrl = `/images/${targetFolder}/${filename}`;
      console.log('UPLOAD PUBLIC URL:', publicUrl);
      uploadedUrls.push(publicUrl);
      uploadedFileNames.push(filename);
    }

    return NextResponse.json({
      success: true,
      fileName: uploadedFileNames[0] ?? null,
      fileNames: uploadedFileNames,
      cleanFileName: uploadedFileNames[0] ?? null,
      cleanFileNames: uploadedFileNames,
      url: uploadedUrls[0] ?? null,
      urls: uploadedUrls,
    });
  } catch (error: any) {
    console.error('Error in /api/upload:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Terjadi kesalahan sistem saat mengunggah berkas.',
      },
      { status: 500 }
    );
  }
}
