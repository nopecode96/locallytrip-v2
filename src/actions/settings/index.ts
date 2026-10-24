'use server';

import path from 'path';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getCurrentUserSession } from '@/actions/bookings';

async function getActiveUserEmail(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (session?.user?.email) {
    return session.user.email;
  }
  const rawSession = await getCurrentUserSession();
  if (rawSession?.isLoggedIn && rawSession.email) {
    return rawSession.email;
  }
  return null;
}

export interface UpdateProfileInput {
  name?: string;
  bio?: string;
  avatarUrl?: string;
  avatar_url?: string;
  phone?: string;
  cityId?: number | '';
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
}

export async function updateProfile(formData: UpdateProfileInput | FormData) {
  const userEmail = await getActiveUserEmail();
  if (!userEmail) return { success: false, error: 'Sesi tidak valid.' };

  let name = '';
  let bio: string | null = null;
  let rawAvatarUrl: string | null = null;
  let phone: string | null = null;
  let cityIdRaw: any = null;
  let emergencyContactName: string | null = null;
  let emergencyContactPhone: string | null = null;
  let emergencyContactRelationship: string | null = null;

  if (formData instanceof FormData) {
    name = (formData.get('name') as string) || '';
    bio = formData.get('bio') as string | null;
    rawAvatarUrl = (formData.get('avatar_url') || formData.get('avatarUrl')) as string | null;
    phone = formData.get('phone') as string | null;
    cityIdRaw = formData.get('cityId');
    emergencyContactName = formData.get('emergencyContactName') as string | null;
    emergencyContactPhone = formData.get('emergencyContactPhone') as string | null;
    emergencyContactRelationship = formData.get('emergencyContactRelationship') as string | null;
  } else {
    name = formData.name || '';
    bio = formData.bio ?? null;
    rawAvatarUrl = formData.avatar_url || formData.avatarUrl || null;
    phone = formData.phone ?? null;
    cityIdRaw = formData.cityId;
    emergencyContactName = formData.emergencyContactName ?? null;
    emergencyContactPhone = formData.emergencyContactPhone ?? null;
    emergencyContactRelationship = formData.emergencyContactRelationship ?? null;
  }

  console.log('[ServerAction updateProfile] Diterima avatar_url:', rawAvatarUrl);

  if (!name || name.trim().length < 2) {
    return { success: false, error: 'Nama lengkap minimal 2 karakter.' };
  }

  // Normalisasi path avatar: Jika local, simpan HANYA nama berkas (clean filename)
  let normalizedAvatarUrl: string | null = null;
  if (rawAvatarUrl && rawAvatarUrl.trim() !== '' && !rawAvatarUrl.startsWith('blob:')) {
    const trimmed = rawAvatarUrl.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
      normalizedAvatarUrl = trimmed;
    } else {
      // Ambil hanya nama filenya jika yang dikirim masih mengandung path /images/avatars/
      normalizedAvatarUrl = path.basename(trimmed);
    }
    console.log('[ServerAction updateProfile] Clean avatar_url to DB:', normalizedAvatarUrl);
  }

  try {
    const user = await prisma.users.findUnique({
      where: { email: userEmail },
      select: { id: true },
    });
    if (!user) return { success: false, error: 'Pengguna tidak ditemukan.' };
    const userId = user.id;

    await prisma.users.update({
      where: { id: Number(userId) },
      data: {
        name: name.trim(),
        bio: bio ? bio.trim() : null,
        // Sinkronkan ke kolom `avatar_url` pada tabel users
        ...(normalizedAvatarUrl !== null && {
          avatar_url: normalizedAvatarUrl,
        }),
        phone: phone ? phone.trim() : null,
        city_id: cityIdRaw ? Number(cityIdRaw) : null,
        emergency_contact_name: emergencyContactName ? emergencyContactName.trim() : null,
        emergency_contact_phone: emergencyContactPhone ? emergencyContactPhone.trim() : null,
        emergency_contact_relationship: emergencyContactRelationship
          ? emergencyContactRelationship.trim()
          : null,
        updated_at: new Date(),
      },
    });
    if (normalizedAvatarUrl) {
      console.log('[ServerAction updateProfile] Sukses update avatar di database ke:', normalizedAvatarUrl);
    }

    revalidatePath('/[lang]/dashboard', 'page');
    revalidatePath('/[lang]/dashboard/settings', 'page');
    return { success: true };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { success: false, error: 'Gagal memperbarui profil pengguna.' };
  }
}

export async function updateNotificationSettings(settings: {
  email_bookings: boolean;
  email_messages: boolean;
  email_reviews: boolean;
  email_promotions: boolean;
  email_updates: boolean;
  push_bookings: boolean;
  push_messages: boolean;
  push_reviews: boolean;
}) {
  const userEmail = await getActiveUserEmail();
  if (!userEmail) return { success: false, error: 'Sesi tidak valid.' };

  const user = await prisma.users.findUnique({
    where: { email: userEmail },
    select: { id: true },
  });

  if (!user) return { success: false, error: 'Pengguna tidak ditemukan.' };

  try {
    await prisma.notification_settings.upsert({
      where: { user_id: user.id },
      update: {
        ...settings,
        updated_at: new Date(),
      },
      create: {
        user_id: user.id,
        ...settings,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    revalidatePath('/[lang]/dashboard', 'page');
    revalidatePath('/[lang]/dashboard/settings', 'page');
    return { success: true };
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return { success: false, error: 'Gagal memperbarui preferensi notifikasi.' };
  }
}

export interface SaveBankAccountInput {
  bankId: number;
  accountNumber: string;
  accountHolderName: string;
  branchName?: string;
  isPrimary?: boolean;
}

export async function addOrUpdateBankAccount(input: SaveBankAccountInput) {
  const userEmail = await getActiveUserEmail();
  if (!userEmail) return { success: false, error: 'Sesi tidak valid.' };

  const user = await prisma.users.findUnique({
    where: { email: userEmail },
    select: { id: true },
  });
  if (!user) return { success: false, error: 'Pengguna tidak ditemukan.' };

  const { bankId, accountNumber, accountHolderName, branchName, isPrimary = true } = input;
  if (!bankId || !accountNumber || !accountHolderName) {
    return { success: false, error: 'Mohon lengkapi seluruh data rekening bank.' };
  }

  try {
    const now = new Date();

    if (isPrimary) {
      await prisma.user_bank_accounts.updateMany({
        where: { user_id: user.id },
        data: { is_primary: false },
      });
    }

    await prisma.user_bank_accounts.upsert({
      where: {
        user_id_bank_id_account_number: {
          user_id: user.id,
          bank_id: Number(bankId),
          account_number: accountNumber.trim(),
        },
      },
      update: {
        account_holder_name: accountHolderName.trim(),
        branch_name: branchName?.trim() || null,
        is_primary: isPrimary,
        updated_at: now,
      },
      create: {
        user_id: user.id,
        bank_id: Number(bankId),
        account_number: accountNumber.trim(),
        account_holder_name: accountHolderName.trim(),
        branch_name: branchName?.trim() || null,
        is_primary: isPrimary,
        is_verified: true,
        created_at: now,
        updated_at: now,
      },
    });

    revalidatePath('/[lang]/dashboard', 'page');
    revalidatePath('/[lang]/dashboard/settings', 'page');
    return { success: true };
  } catch (error) {
    console.error('Error saving bank account:', error);
    return { success: false, error: 'Gagal menyimpan rekening bank.' };
  }
}

export async function updatePayoutSettings(input: {
  minimumPayout: number;
  payoutMethod?: string;
  autoPayout?: boolean;
}) {
  const userEmail = await getActiveUserEmail();
  if (!userEmail) return { success: false, error: 'Sesi tidak valid.' };

  const user = await prisma.users.findUnique({
    where: { email: userEmail },
    select: { id: true },
  });
  if (!user) return { success: false, error: 'Pengguna tidak ditemukan.' };

  try {
    const now = new Date();
    await prisma.payout_settings.upsert({
      where: { user_id: user.id },
      update: {
        minimum_payout: input.minimumPayout,
        payout_method: input.payoutMethod || 'bank_transfer',
        auto_payout: input.autoPayout ?? false,
        updated_at: now,
      },
      create: {
        user_id: user.id,
        minimum_payout: input.minimumPayout,
        payout_method: input.payoutMethod || 'bank_transfer',
        auto_payout: input.autoPayout ?? false,
        created_at: now,
        updated_at: now,
      },
    });

    revalidatePath('/[lang]/dashboard', 'page');
    revalidatePath('/[lang]/dashboard/settings', 'page');
    return { success: true };
  } catch (error) {
    console.error('Error updating payout settings:', error);
    return { success: false, error: 'Gagal memperbarui pengaturan penarikan dana.' };
  }
}

export async function updateUserLanguages(languageIds: number[]) {
  const userEmail = await getActiveUserEmail();
  if (!userEmail) return { success: false, error: 'Sesi tidak valid.' };

  const user = await prisma.users.findUnique({
    where: { email: userEmail },
    select: { id: true },
  });
  if (!user) return { success: false, error: 'Pengguna tidak ditemukan.' };

  try {
    const now = new Date();
    await prisma.$transaction(async (tx) => {
      await tx.user_languages.deleteMany({
        where: { user_id: user.id },
      });

      if (languageIds.length > 0) {
        await tx.user_languages.createMany({
          data: languageIds.map((langId) => ({
            user_id: user.id,
            language_id: langId,
            proficiency_level: 'fluent',
            created_at: now,
            updated_at: now,
          })),
        });
      }
    });

    revalidatePath('/[lang]/dashboard', 'page');
    revalidatePath('/[lang]/dashboard/settings', 'page');
    return { success: true };
  } catch (error) {
    console.error('Error updating languages:', error);
    return { success: false, error: 'Gagal menyimpan pilihan bahasa.' };
  }
}

export async function updateUserCommunicationContacts(contacts: {
  communicationAppId: number;
  contactValue: string;
}[]) {
  const userEmail = await getActiveUserEmail();
  if (!userEmail) return { success: false, error: 'Sesi tidak valid.' };

  const user = await prisma.users.findUnique({
    where: { email: userEmail },
    select: { id: true },
  });
  if (!user) return { success: false, error: 'Pengguna tidak ditemukan.' };

  try {
    const now = new Date();
    await prisma.$transaction(async (tx) => {
      for (const item of contacts) {
        if (!item.contactValue.trim()) {
          await tx.user_communication_contacts.deleteMany({
            where: {
              user_id: user.id,
              communication_app_id: item.communicationAppId,
            },
          });
        } else {
          await tx.user_communication_contacts.upsert({
            where: {
              user_id_communication_app_id: {
                user_id: user.id,
                communication_app_id: item.communicationAppId,
              },
            },
            update: {
              contact_value: item.contactValue.trim(),
              updated_at: now,
            },
            create: {
              user_id: user.id,
              communication_app_id: item.communicationAppId,
              contact_value: item.contactValue.trim(),
              created_at: now,
              updated_at: now,
            },
          });
        }
      }
    });

    revalidatePath('/[lang]/dashboard', 'page');
    revalidatePath('/[lang]/dashboard/settings', 'page');
    return { success: true };
  } catch (error) {
    console.error('Error updating communication contacts:', error);
    return { success: false, error: 'Gagal memperbarui tautan media sosial / kontak.' };
  }
}
