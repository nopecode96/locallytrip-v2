'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { createNotification } from '@/lib/notifications';
import { getCurrentUserSession } from '@/actions/bookings';
import { enum_host_kyc_id_type } from '@prisma/client';

export interface SubmitHostApplicationParams {
  cityId: number;
  bio: string;
  categoryIds: number[];
  languageIds: number[];
  phoneNumber: string;
  socialLink?: string;
  idType: 'KTP' | 'PASSPORT';
  idNumber: string;
  // Backward compatibility
  specialties?: string[];
  languages?: string[];
}

export async function submitHostApplication(formData: SubmitHostApplicationParams) {
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
    return { success: false, error: 'Silakan masuk terlebih dahulu.' };
  }

  const {
    cityId,
    bio,
    categoryIds = [],
    languageIds = [],
    phoneNumber,
    socialLink,
    idType,
    idNumber,
  } = formData;

  if (!cityId || !bio || bio.trim().length < 20 || !phoneNumber?.trim() || !idNumber?.trim()) {
    return { success: false, error: 'Mohon lengkapi semua data wajib (bio minimal 20 karakter).' };
  }

  const user = await prisma.users.findUnique({
    where: { email: userEmail },
  });

  if (!user) return { success: false, error: 'Pengguna tidak ditemukan.' };

  try {
    const now = new Date();

    // 1. Perbarui profil user menjadi HOST
    await prisma.users.update({
      where: { id: user.id },
      data: {
        role: 'HOST',
        city_id: cityId,
        bio: bio.trim(),
        phone: phoneNumber.trim(),
        is_verified: false, // Menunggu verifikasi kurasi
        updated_at: now,
      },
    });

    // 2. Simpan atau perbarui data KYC Host (host_kyc)
    const kycIdType = idType.toLowerCase() === 'ktp' ? enum_host_kyc_id_type.ktp : enum_host_kyc_id_type.passport;
    const existingKyc = await prisma.host_kyc.findUnique({
      where: { user_id: user.id },
    });

    if (existingKyc) {
      await prisma.host_kyc.update({
        where: { user_id: user.id },
        data: {
          id_type: kycIdType,
          id_number: idNumber.trim(),
          full_name: user.name || 'Local Host',
          status: 'pending',
          submitted_at: now,
          updated_at: now,
          certifications: {
            categoryIds,
            languageIds,
            socialLink: socialLink?.trim() || null,
          },
        },
      });
    } else {
      await prisma.host_kyc.create({
        data: {
          user_id: user.id,
          id_type: kycIdType,
          id_number: idNumber.trim(),
          full_name: user.name || 'Local Host',
          date_of_birth: user.date_of_birth || new Date('1995-01-01'),
          nationality: user.nationality || 'Indonesia',
          address_line_1: 'Indonesia',
          city: 'Kota Terdaftar',
          province: 'Indonesia',
          status: 'pending',
          submitted_at: now,
          created_at: now,
          updated_at: now,
          certifications: {
            categoryIds,
            languageIds,
            socialLink: socialLink?.trim() || null,
          },
        },
      });
    }

    // 3. Simpan relasi Kategori Host ke user_host_categories
    if (categoryIds.length > 0) {
      // Hapus kategori lama jika ada agar sinkron
      await prisma.user_host_categories.deleteMany({
        where: { user_id: user.id },
      });

      for (let i = 0; i < categoryIds.length; i++) {
        const catId = categoryIds[i];
        await prisma.user_host_categories.create({
          data: {
            user_id: user.id,
            host_category_id: catId,
            is_primary: i === 0, // Kategori pertama dijadikan primary
            created_at: now,
            updated_at: now,
          },
        });
      }
    }

    // 4. Simpan relasi Bahasa ke user_languages
    if (languageIds.length > 0) {
      // Hapus relasi bahasa lama jika ada agar sinkron
      await prisma.user_languages.deleteMany({
        where: { user_id: user.id },
      });

      for (const langId of languageIds) {
        await prisma.user_languages.create({
          data: {
            user_id: user.id,
            language_id: langId,
            proficiency_level: 'fluent',
            created_at: now,
            updated_at: now,
          },
        });
      }
    }

    // 5. Beri bonus insentif pengajuan host (+100 XP)
    await prisma.user_xp.upsert({
      where: { user_id: user.id },
      update: { total_xp: { increment: 100 }, updated_at: now },
      create: { user_id: user.id, total_xp: 100, current_level: 1, created_at: now, updated_at: now },
    });

    await prisma.user_xp_history.create({
      data: {
        user_id: user.id,
        amount: 100,
        activity_type: 'BECOME_HOST_BONUS',
        source_id: user.id,
        source_table: 'users',
        created_at: now,
      },
    });

    // 6. Kirim notifikasi lonceng ke pengguna
    await createNotification({
      userId: user.id,
      type: 'SYSTEM',
      title: 'Pendaftaran Host Berhasil Dikirim! 🧭',
      message: 'Profil Host Anda telah aktif. Anda mendapatkan +100 XP dan sekarang dapat membuat pengalaman tur lokal pertama Anda.',
      actionUrl: '/dashboard',
    });

    revalidatePath('/[lang]/dashboard', 'page');
    revalidatePath('/[lang]/become-a-host', 'page');

    return { success: true };
  } catch (error: any) {
    console.error('Error submitting host application:', error);
    return { success: false, error: error?.message || 'Terjadi kesalahan sistem saat mengirim pengajuan.' };
  }
}
