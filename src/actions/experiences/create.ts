'use server';

import path from 'path';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCurrentUserSession } from '@/actions/bookings';
import { revalidatePath } from 'next/cache';
import { enum_experiences_status } from '@prisma/client';
import { grantReward } from '@/lib/rewards/reward-engine';
import { translateBilateralText, translateBilateralList } from '@/lib/bilateralTranslator';
import crypto from 'crypto';

export interface CreateExperienceItineraryItem {
  time?: string;
  title?: string;
  title_id?: string;
  title_en?: string;
  description?: string;
  description_id?: string;
  description_en?: string;
  durationMinutes?: number;
  location?: string;
}

export interface CreateExperienceParams {
  title?: string;
  title_id?: string;
  title_en?: string;
  categoryId: number;
  experienceTypeId?: number;
  serviceType?: 'PHYSICAL_TOUR' | 'DIGITAL_SERVICE' | 'CREATIVE_SESSION';
  cityId: number;
  durationHours: number;
  maxParticipants: number;
  price: number; // Flat rate per tour package
  currency?: string;
  description?: string;
  description_id?: string;
  description_en?: string;
  meetingPoint: string;
  meetingPointNotes?: string;
  consultationPlatform?: string;
  deliverables?: string[];
  coverImageUrl?: string;
  galleryImages?: string[];
  inclusions?: string[];
  inclusions_id?: string[];
  inclusions_en?: string[];
  exclusions?: string[];
  exclusions_id?: string[];
  exclusions_en?: string[];
  what_to_bring?: string[];
  what_to_bring_id?: string[];
  what_to_bring_en?: string[];
  itinerary?: CreateExperienceItineraryItem[];
  status?: 'draft' | 'published' | 'DRAFT' | 'PUBLISHED' | 'ACTIVE';
}

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  const randomSuffix = crypto.randomBytes(3).toString('hex');
  return `${base || 'experience'}-${randomSuffix}`;
}

export async function createExperience(params: CreateExperienceParams) {
  // 1. Validasi Sesi Pengguna
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

  // 2. Ambil user & validasi peran HOST
  const user = await prisma.users.findUnique({
    where: { email: userEmail },
    select: { id: true, name: true, role: true },
  });

  if (!user) {
    return { success: false, error: 'Pengguna tidak ditemukan.' };
  }

  if (user.role?.toUpperCase() !== 'HOST') {
    return {
      success: false,
      error: 'Hanya pengguna berstatus HOST yang dapat mempublikasikan pengalaman tur.',
    };
  }

  // 3. Normalisasi Input
  const mainTitle = (params.title_id || params.title_en || params.title || '').trim();
  const mainDesc = (params.description_id || params.description_en || params.description || '').trim();
  const isDraft = params.status?.toLowerCase() === 'draft';
  const targetStatus = isDraft
    ? enum_experiences_status.draft
    : enum_experiences_status.published;

  if (isDraft) {
    if (!mainTitle || mainTitle.length < 5) {
      return { success: false, error: 'Judul tur minimal 5 karakter untuk menyimpan draf.' };
    }
  } else {
    if (!mainTitle || mainTitle.length < 10) {
      return { success: false, error: 'Judul tur minimal 10 karakter untuk diterbitkan.' };
    }
    if (!mainDesc || mainDesc.length < 20) {
      return { success: false, error: 'Deskripsi agenda tur minimal 20 karakter.' };
    }
    if (!params.meetingPoint || params.meetingPoint.trim().length < 3) {
      return { success: false, error: 'Titik kumpul atau platform konsultasi wajib diisi dengan jelas.' };
    }
  }

  if (!params.categoryId) {
    return { success: false, error: 'Silakan pilih kategori tur.' };
  }
  if (!params.cityId) {
    return { success: false, error: 'Silakan pilih kota operasional tur.' };
  }
  if (!params.price || params.price <= 0) {
    return { success: false, error: 'Tarif paket tur harus lebih dari 0.' };
  }

  // 4. Verifikasi Category & City di basis data
  const [categoryExists, cityExists] = await Promise.all([
    prisma.host_categories.findUnique({ where: { id: Number(params.categoryId) } }),
    prisma.cities.findUnique({ where: { id: Number(params.cityId) } }),
  ]);

  if (!categoryExists) {
    return { success: false, error: 'Kategori tur tidak valid.' };
  }
  if (!cityExists) {
    return { success: false, error: 'Kota operasional tidak valid.' };
  }

  try {
    const now = new Date();

    // 5. Bilateral Auto-Translation (ID <-> EN) dijalankan secara paralel
    let resolvedTitleId = params.title_id?.trim() || '';
    let resolvedTitleEn = params.title_en?.trim() || '';
    let resolvedDescId = params.description_id?.trim() || '';
    let resolvedDescEn = params.description_en?.trim() || '';

    const translationTasks: Promise<any>[] = [];

    // Title bilateral translation
    if (resolvedTitleId && !resolvedTitleEn) {
      translationTasks.push(
        translateBilateralText(resolvedTitleId, 'en').then((val) => {
          resolvedTitleEn = val || resolvedTitleId;
        })
      );
    } else if (!resolvedTitleId && resolvedTitleEn) {
      translationTasks.push(
        translateBilateralText(resolvedTitleEn, 'id').then((val) => {
          resolvedTitleId = val || resolvedTitleEn;
        })
      );
    } else if (!resolvedTitleId && !resolvedTitleEn && mainTitle) {
      resolvedTitleId = mainTitle;
      translationTasks.push(
        translateBilateralText(mainTitle, 'en').then((val) => {
          resolvedTitleEn = val || mainTitle;
        })
      );
    }

    // Description bilateral translation (preserves Markdown & HTML tags)
    if (resolvedDescId && !resolvedDescEn) {
      translationTasks.push(
        translateBilateralText(resolvedDescId, 'en').then((val) => {
          resolvedDescEn = val || resolvedDescId;
        })
      );
    } else if (!resolvedDescId && resolvedDescEn) {
      translationTasks.push(
        translateBilateralText(resolvedDescEn, 'id').then((val) => {
          resolvedDescId = val || resolvedDescEn;
        })
      );
    } else if (!resolvedDescId && !resolvedDescEn && mainDesc) {
      resolvedDescId = mainDesc;
      translationTasks.push(
        translateBilateralText(mainDesc, 'en').then((val) => {
          resolvedDescEn = val || mainDesc;
        })
      );
    }

    // Inclusions bilateral translation
    let rawInclusionsId = [
      ...(params.inclusions_id || []),
      ...(params.inclusions || []),
    ].filter((item) => typeof item === 'string' && item.trim().length > 0);
    let rawInclusionsEn = (params.inclusions_en || []).filter(
      (item) => typeof item === 'string' && item.trim().length > 0
    );

    if (rawInclusionsId.length > 0 && rawInclusionsEn.length === 0) {
      translationTasks.push(
        translateBilateralList(rawInclusionsId, 'en').then((res) => {
          rawInclusionsEn = res;
        })
      );
    } else if (rawInclusionsEn.length > 0 && rawInclusionsId.length === 0) {
      translationTasks.push(
        translateBilateralList(rawInclusionsEn, 'id').then((res) => {
          rawInclusionsId = res;
        })
      );
    }

    // Exclusions bilateral translation
    let rawExclusionsId = [
      ...(params.exclusions_id || []),
      ...(params.exclusions || []),
    ].filter((item) => typeof item === 'string' && item.trim().length > 0);
    let rawExclusionsEn = (params.exclusions_en || []).filter(
      (item) => typeof item === 'string' && item.trim().length > 0
    );

    if (rawExclusionsId.length > 0 && rawExclusionsEn.length === 0) {
      translationTasks.push(
        translateBilateralList(rawExclusionsId, 'en').then((res) => {
          rawExclusionsEn = res;
        })
      );
    } else if (rawExclusionsEn.length > 0 && rawExclusionsId.length === 0) {
      translationTasks.push(
        translateBilateralList(rawExclusionsEn, 'id').then((res) => {
          rawExclusionsId = res;
        })
      );
    }

    // What to bring (Requirements) bilateral translation
    let rawWhatToBringId = [
      ...(params.what_to_bring_id || []),
      ...(params.what_to_bring || []),
    ].filter((item) => typeof item === 'string' && item.trim().length > 0);
    let rawWhatToBringEn = (params.what_to_bring_en || []).filter(
      (item) => typeof item === 'string' && item.trim().length > 0
    );

    if (rawWhatToBringId.length > 0 && rawWhatToBringEn.length === 0) {
      translationTasks.push(
        translateBilateralList(rawWhatToBringId, 'en').then((res) => {
          rawWhatToBringEn = res;
        })
      );
    } else if (rawWhatToBringEn.length > 0 && rawWhatToBringId.length === 0) {
      translationTasks.push(
        translateBilateralList(rawWhatToBringEn, 'id').then((res) => {
          rawWhatToBringId = res;
        })
      );
    }

    // Itinerary bilateral translation
    const rawItineraryItems = params.itinerary || [];
    const resolvedItineraryItems: {
      step_order: number;
      title: string;
      title_id: string;
      title_en: string;
      description: string | null;
      description_id: string | null;
      description_en: string | null;
      duration_minutes: number;
      location: string | null;
    }[] = [];

    for (let i = 0; i < rawItineraryItems.length; i++) {
      const item = rawItineraryItems[i];
      let itemTitleId = (item.title_id || item.title || '').trim();
      let itemTitleEn = (item.title_en || '').trim();
      let itemDescId = (item.description_id || item.description || '').trim();
      let itemDescEn = (item.description_en || '').trim();

      const itemRef = {
        step_order: i + 1,
        title: itemTitleEn || itemTitleId || `Stop ${i + 1}`,
        title_id: itemTitleId,
        title_en: itemTitleEn,
        description: itemDescEn || itemDescId || null,
        description_id: itemDescId || null,
        description_en: itemDescEn || null,
        duration_minutes: item.durationMinutes ? Number(item.durationMinutes) : 45,
        location: (item.location || item.time || '').trim() || null,
      };
      resolvedItineraryItems.push(itemRef);

      if (itemTitleId && !itemTitleEn) {
        translationTasks.push(
          translateBilateralText(itemTitleId, 'en').then((res) => {
            itemRef.title_en = res || itemTitleId;
            itemRef.title = res || itemTitleId;
          })
        );
      } else if (!itemTitleId && itemTitleEn) {
        translationTasks.push(
          translateBilateralText(itemTitleEn, 'id').then((res) => {
            itemRef.title_id = res || itemTitleEn;
          })
        );
      }

      if (itemDescId && !itemDescEn) {
        translationTasks.push(
          translateBilateralText(itemDescId, 'en').then((res) => {
            itemRef.description_en = res || itemDescId;
            itemRef.description = res || itemDescId;
          })
        );
      } else if (!itemDescId && itemDescEn) {
        translationTasks.push(
          translateBilateralText(itemDescEn, 'id').then((res) => {
            itemRef.description_id = res || itemDescEn;
          })
        );
      }
    }

    // Eksekusi seluruh tugas terjemahan secara paralel
    if (translationTasks.length > 0) {
      await Promise.all(translationTasks);
    }

    const finalTitleId = resolvedTitleId || mainTitle;
    const finalTitleEn = resolvedTitleEn || mainTitle;
    const finalDescId = resolvedDescId || mainDesc;
    const finalDescEn = resolvedDescEn || mainDesc;

    const slugSource = finalTitleEn || finalTitleId || mainTitle;
    const slug = generateSlug(slugSource);
    const uuid = crypto.randomUUID();

    // 6. Sanitasi Nama Berkas Gambar (Hanya Simpan Clean Filename murni)
    const sanitizedImages: string[] = [];
    if (params.coverImageUrl?.trim()) {
      const cleanCover = params.coverImageUrl.trim().startsWith('http')
        ? params.coverImageUrl.trim()
        : path.basename(params.coverImageUrl.trim());
      sanitizedImages.push(cleanCover);
    }

    if (Array.isArray(params.galleryImages)) {
      for (const g of params.galleryImages) {
        if (g && typeof g === 'string' && g.trim()) {
          const cleanG = g.trim().startsWith('http')
            ? g.trim()
            : path.basename(g.trim());
          if (!sanitizedImages.includes(cleanG)) {
            sanitizedImages.push(cleanG);
          }
        }
      }
    }

    const imagesArray =
      sanitizedImages.length > 0
        ? sanitizedImages
        : ['default-thumbnail.jpg'];

    const deliverablesList = (params.deliverables || []).filter(
      (item) => typeof item === 'string' && item.trim().length > 0
    );

    // 7. Simpan entri experience baru ke tabel experiences
    const newExperience = await prisma.experiences.create({
      data: {
        uuid,
        title: finalTitleEn || finalTitleId,
        title_id: finalTitleId,
        title_en: finalTitleEn,
        slug,
        description: finalDescEn || finalDescId,
        description_id: finalDescId,
        description_en: finalDescEn,
        short_description: (finalDescEn || finalDescId).replace(/<[^>]*>/g, '').slice(0, 200),
        host_id: user.id,
        category_id: Number(params.categoryId),
        experience_type_id: params.experienceTypeId ? Number(params.experienceTypeId) : null,
        city_id: Number(params.cityId),
        package_price: params.price,
        currency: params.currency || 'USD',
        duration_hours: Number(params.durationHours) || 3,
        max_participants: Number(params.maxParticipants) || 6,
        min_participants: 1,
        meeting_point: (params.meetingPoint || 'Akan dikonfirmasi').trim(),
        status: targetStatus,
        is_active: true,
        images: imagesArray,
        included_items: rawInclusionsId.length > 0 ? rawInclusionsId : rawInclusionsEn,
        excluded_items: rawExclusionsId.length > 0 ? rawExclusionsId : rawExclusionsEn,
        requirements: rawWhatToBringId.length > 0 ? rawWhatToBringId : rawWhatToBringEn,
        deliverables: deliverablesList,
        host_specific_data: {
          service_type: params.serviceType || 'PHYSICAL_TOUR',
          consultation_platform: params.consultationPlatform || null,
          meeting_point_notes: params.meetingPointNotes?.trim() || null,
          deliverables: deliverablesList,
          inclusions_id: rawInclusionsId,
          inclusions_en: rawInclusionsEn,
          exclusions_id: rawExclusionsId,
          exclusions_en: rawExclusionsEn,
          what_to_bring_id: rawWhatToBringId,
          what_to_bring_en: rawWhatToBringEn,
          itinerary_steps: resolvedItineraryItems,
        },
        created_at: now,
        updated_at: now,
      },
    });

    // 8. Simpan rute / itinerary perjalanan jika disediakan
    if (resolvedItineraryItems.length > 0) {
      for (const step of resolvedItineraryItems) {
        const stepTitle = step.title_en || step.title_id || step.title;
        if (stepTitle.trim().length > 0) {
          await prisma.experience_itineraries.create({
            data: {
              experience_id: newExperience.id,
              step_order: step.step_order,
              title: stepTitle.slice(0, 200),
              description: step.description_en || step.description_id || step.description,
              duration_minutes: step.duration_minutes,
              location: step.location,
              created_at: now,
              updated_at: now,
            },
          });
        }
      }
    }

    // 8. Berikan Gamification Reward (+80 XP Reputasi Inisiator Tur)
    let rewardResult = null;
    try {
      rewardResult = await grantReward(
        user.id,
        'EXPERIENCE_CREATE',
        newExperience.id,
        'experiences'
      );
    } catch (rewardErr) {
      console.warn('Gagal memberikan bonus XP otomatis:', rewardErr);
    }

    // 9. Revalidasi cache halaman Next.js
    revalidatePath('/experiences');
    revalidatePath('/[lang]/experiences', 'page');
    revalidatePath('/[lang]/dashboard', 'page');
    revalidatePath('/dashboard');

    return {
      success: true,
      experienceId: newExperience.id,
      slug: newExperience.slug,
      status: targetStatus,
      rewardResult,
    };
  } catch (error: any) {
    console.error('Error creating experience:', error);
    return {
      success: false,
      error: error?.message || 'Terjadi kesalahan sistem saat membuat pengalaman tur.',
    };
  }
}
