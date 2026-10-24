'use server';

import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCurrentUserSession } from '@/actions/bookings';
import { revalidatePath } from 'next/cache';
import { grantReward } from '@/lib/rewards/reward-engine';
import fs from 'fs/promises';
import path from 'path';

async function getAuthenticatedUser() {
  let userEmail: string | null = null;
  const session = await getServerSession(authOptions).catch(() => null);
  if (session?.user?.email) {
    userEmail = session.user.email;
  } else {
    const rawSession = await getCurrentUserSession().catch(() => null);
    if (rawSession?.isLoggedIn && rawSession.email) {
      userEmail = rawSession.email;
    }
  }

  if (!userEmail) return null;

  return prisma.users.findUnique({
    where: { email: userEmail.toLowerCase().trim() },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      is_verified: true,
      kyc_reward_status: true,
    },
  });
}

export interface SubmitKycInput {
  fullName: string;
  idType: 'ktp' | 'passport' | 'drivers_license';
  idNumber: string;
  dateOfBirth: string; // YYYY-MM-DD
  placeOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  addressLine1: string;
  city: string;
  province: string;
  postalCode?: string;
  taxNumber?: string;
  licenseNumber?: string;
  idCardFrontBase64: string;
  selfieWithIdBase64: string;
  certificateBase64?: string;
}

export interface SubmitKycResult {
  success: boolean;
  error?: string;
}

export async function submitKycApplication(input: SubmitKycInput): Promise<SubmitKycResult> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return { success: false, error: 'Sesi Anda telah berakhir. Silakan login terlebih dahulu.' };
  }

  // 1. Validasi Peran Host: Hanya akun Host yang berhak mengajukan verifikasi KYC pemandu
  const isHost = user.role?.toUpperCase() === 'HOST';
  if (!isHost) {
    return {
      success: false,
      error: 'Akses ditolak. Fitur verifikasi KYC pemandu hanya dapat diakses oleh akun Host.',
    };
  }

  const {
    fullName,
    idType,
    idNumber,
    dateOfBirth,
    placeOfBirth,
    gender,
    addressLine1,
    city,
    province,
    postalCode,
    taxNumber,
    licenseNumber,
    idCardFrontBase64,
    selfieWithIdBase64,
    certificateBase64,
  } = input;

  // 2. Validasi Input Form & Tipe Enum Prisma
  const validIdTypes = ['ktp', 'passport', 'drivers_license'];
  if (!validIdTypes.includes(idType)) {
    return { success: false, error: 'Jenis kartu identitas tidak valid.' };
  }

  if (gender && !['male', 'female', 'other'].includes(gender)) {
    return { success: false, error: 'Pilihan gender tidak valid.' };
  }

  if (!idNumber?.trim() || !fullName?.trim() || !dateOfBirth || !addressLine1?.trim() || !city?.trim() || !province?.trim()) {
    return { success: false, error: 'Mohon lengkapi seluruh kolom identitas wajib (Nama, NIK, Tanggal Lahir, Domisili).' };
  }

  if (idType === 'ktp' && idNumber.trim().replace(/\D/g, '').length !== 16) {
    return { success: false, error: 'Nomor NIK KTP harus terdiri dari 16 digit angka resmi.' };
  }

  if (!idCardFrontBase64 || !selfieWithIdBase64) {
    return { success: false, error: 'Foto KTP/Paspor dan Swafoto memegang KTP wajib diunggah.' };
  }

  try {
    const kycDir = path.join(process.cwd(), 'public', 'images', 'kyc');
    await fs.mkdir(kycDir, { recursive: true });

    const now = new Date();

    // Helper untuk menyimpan berkas base64 secara aman ke public/images/kyc/
    async function saveBase64File(base64Data: string, prefix: string): Promise<string> {
      const match = base64Data.match(/^data:image\/([a-zA-Z0-9.+]+);base64,(.+)$/);
      let buffer: Buffer;

      if (match) {
        buffer = Buffer.from(match[2], 'base64');
      } else {
        buffer = Buffer.from(base64Data, 'base64');
      }

      // Format nama berkas aman sesuai spesifikasi: kyc-${user.id}-${Date.now()}-${random}.webp
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const filename = `kyc-${user!.id}-${Date.now()}-${randomSuffix}.webp`;
      const fullPath = path.join(kycDir, filename);

      await fs.writeFile(fullPath, buffer);
      return filename;
    }

    const idCardFileName = await saveBase64File(idCardFrontBase64, 'id');
    const selfieFileName = await saveBase64File(selfieWithIdBase64, 'selfie');
    const certFileName = certificateBase64 ? await saveBase64File(certificateBase64, 'cert') : null;

    // 3. Transaksi Atomik Database (prisma.$transaction)
    await prisma.$transaction(async (tx) => {
      // Dapatkan status sebelumnya dari host_kyc (jika ada)
      const existingKyc = await tx.host_kyc.findUnique({
        where: { user_id: user.id },
      });
      const previousStatus = existingKyc?.status || 'pending';

      // 1. Upsert ke tabel host_kyc
      const kyc = await tx.host_kyc.upsert({
        where: { user_id: user.id },
        update: {
          full_name: fullName.trim(),
          date_of_birth: new Date(dateOfBirth),
          place_of_birth: placeOfBirth?.trim() || null,
          id_type: idType,
          id_number: idNumber.trim(),
          gender: gender || null,
          address_line_1: addressLine1.trim(),
          city: city.trim(),
          province: province.trim(),
          postal_code: postalCode?.trim() || null,
          tax_number: taxNumber?.trim() || null,
          certifications: licenseNumber?.trim() ? { license_number: licenseNumber.trim() } : undefined,
          status: 'submitted',
          submitted_at: now,
          rejection_reason: null, // Reset alasan penolakan sebelumnya
          updated_at: now,
        },
        create: {
          user_id: user.id,
          full_name: fullName.trim(),
          date_of_birth: new Date(dateOfBirth),
          place_of_birth: placeOfBirth?.trim() || null,
          nationality: 'Indonesia',
          gender: gender || null,
          id_type: idType,
          id_number: idNumber.trim(),
          address_line_1: addressLine1.trim(),
          city: city.trim(),
          province: province.trim(),
          postal_code: postalCode?.trim() || null,
          country: 'Indonesia',
          tax_number: taxNumber?.trim() || null,
          certifications: licenseNumber?.trim() ? { license_number: licenseNumber.trim() } : undefined,
          status: 'submitted',
          submitted_at: now,
          created_at: now,
          updated_at: now,
        },
      });

      // 2. Simpan rekaman berkas ke kyc_documents
      await tx.kyc_documents.create({
        data: {
          kyc_id: kyc.id,
          document_type: idType === 'passport' ? 'passport' : 'id_card_front',
          file_path: `/images/kyc/${idCardFileName}`,
          file_name: idCardFileName,
          mime_type: 'image/webp',
          verification_status: 'pending',
          created_at: now,
          updated_at: now,
        },
      });

      await tx.kyc_documents.create({
        data: {
          kyc_id: kyc.id,
          document_type: 'selfie_with_id',
          file_path: `/images/kyc/${selfieFileName}`,
          file_name: selfieFileName,
          mime_type: 'image/webp',
          verification_status: 'pending',
          created_at: now,
          updated_at: now,
        },
      });

      if (certFileName) {
        await tx.kyc_documents.create({
          data: {
            kyc_id: kyc.id,
            document_type: 'certificate',
            file_path: `/images/kyc/${certFileName}`,
            file_name: certFileName,
            mime_type: 'image/webp',
            verification_status: 'pending',
            created_at: now,
            updated_at: now,
          },
        });
      }

      // 3. Catat jejak audit ke kyc_verification_history
      await tx.kyc_verification_history.create({
        data: {
          kyc_id: kyc.id,
          previous_status: previousStatus,
          new_status: 'submitted',
          action_by: user.id,
          action_type: 'submitted',
          notes: 'Host mengajukan dokumen verifikasi identitas resmi.',
          created_at: now,
        },
      });

      // 4. Notifikasi sistem untuk pengguna
      await tx.notifications.create({
        data: {
          user_id: user.id,
          type: 'SYSTEM',
          title: 'Pengajuan KYC Berhasil Dikirim 📑',
          message:
            'Dokumen identitas Anda telah kami terima dan sedang diverifikasi oleh Tim Kurasi Locallytrip.',
          action_url: '/dashboard/kyc',
          read: false,
          created_at: now,
          updated_at: now,
        },
      });
    });

    revalidatePath('/[lang]/dashboard/kyc', 'page');
    revalidatePath('/[lang]/dashboard/settings', 'page');
    revalidatePath('/admin/kyc', 'page');

    return { success: true };
  } catch (error: any) {
    console.error('Error in submitKycApplication:', error);
    return {
      success: false,
      error:
        error?.message?.includes('id_number') || error?.code === 'P2002'
          ? 'Nomor identitas (NIK / Paspor) ini sudah pernah didaftarkan oleh akun lain.'
          : error?.message || 'Gagal mengirimkan pengajuan KYC. Silakan coba kembali.',
    };
  }
}

export async function claimKycReward(): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return { success: false, error: 'Sesi tidak valid.' };
  }

  const isHost = user.role?.toUpperCase() === 'HOST';
  if (!isHost) {
    return { success: false, error: 'Klaim hadiah verifikasi ini khusus akun Host.' };
  }

  const kyc = await prisma.host_kyc.findUnique({
    where: { user_id: user.id },
  });

  if (!kyc || kyc.status !== 'approved') {
    return {
      success: false,
      error: 'Hadiah hanya dapat diklaim setelah status KYC Anda disetujui resmi oleh admin (Approved).',
    };
  }

  const currentUser = await prisma.users.findUnique({
    where: { id: user.id },
    select: { kyc_reward_status: true },
  });

  if (currentUser?.kyc_reward_status === 'claimed') {
    return { success: false, error: 'Hadiah verifikasi KYC sudah pernah Anda klaim sebelumnya.' };
  }

  try {
    // Tambahkan hadiah reputasi: grantReward(user.id, 'KYC_VERIFIED') (+150 XP & +20 LTP ke wallet)
    await grantReward(user.id, 'KYC_VERIFIED', kyc.id, 'host_kyc');

    // Update status kyc_reward_status = 'claimed' dan aktifkan status is_verified = true
    await prisma.users.update({
      where: { id: user.id },
      data: {
        kyc_reward_status: 'claimed',
        is_verified: true,
        identity_verified_at: new Date(),
        updated_at: new Date(),
      },
    });

    revalidatePath('/[lang]/dashboard/kyc', 'page');
    revalidatePath('/[lang]/dashboard', 'page');
    return { success: true };
  } catch (error: any) {
    console.error('Error claiming KYC reward:', error);
    return { success: false, error: error?.message || 'Gagal mengklaim hadiah verifikasi.' };
  }
}
