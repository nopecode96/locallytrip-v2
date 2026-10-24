'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCurrentUserSession } from '@/actions/bookings';
import { revalidatePath } from 'next/cache';
import { enum_experiences_status } from '@prisma/client';
import { translateBilateralText, translateBilateralList } from '@/lib/bilateralTranslator';

export interface UpdateExperienceParams {
  // Title & slug are deliberately omitted or ignored to enforce strict SEO immutability
  title?: string;
  title_id?: string;
  title_en?: string;
  slug?: string;
  categoryId?: number;
  experienceTypeId?: number;
  serviceType?: 'PHYSICAL_TOUR' | 'DIGITAL_SERVICE' | 'CREATIVE_SESSION';
  cityId?: number;
  durationHours?: number;
  maxParticipants?: number;
  price?: number;
  currency?: string;
  description?: string;
  description_id?: string;
  description_en?: string;
  meetingPoint?: string;
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
  itinerary?: any[];
  status?: 'draft' | 'published' | 'DRAFT' | 'PUBLISHED' | 'ACTIVE';
}

async function getAuthUserId(): Promise<number | null> {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    const id = parseInt(session.user.id, 10);
    if (!isNaN(id)) return id;
  }
  if (session?.user?.email) {
    const u = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (u) return u.id;
  }
  const raw = await getCurrentUserSession();
  if (raw?.isLoggedIn && raw.id) return raw.id;
  if (raw?.isLoggedIn && raw.email) {
    const u = await prisma.users.findUnique({
      where: { email: raw.email },
      select: { id: true },
    });
    if (u) return u.id;
  }
  return null;
}

export async function updateExperience(experienceId: number, params: UpdateExperienceParams) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return { success: false, error: 'Silakan masuk terlebih dahulu untuk memperbarui pengalaman tur.' };
    }

    const exp = await prisma.experiences.findUnique({
      where: { id: experienceId },
      select: { id: true, host_id: true, slug: true, status: true, title: true, title_id: true, title_en: true },
    });

    if (!exp) {
      return { success: false, error: 'Pengalaman tur tidak ditemukan.' };
    }

    // Otorisasi: Hanya pemilik (host_id) yang berhak mengedit
    if (exp.host_id !== userId) {
      return { success: false, error: 'Anda tidak memiliki hak akses untuk mengubah pengalaman tur ini.' };
    }

    // STRICT SEO PROTECTION:
    // Judul (title, title_id, title_en) dan slug sengaja DIABAIKAN dan DILINDUNGI
    // agar URL SEO canonical dan peringkat mesin pencari Google/GEO tidak rusak (mencegah 404).

    const now = new Date();

    // Olah bilateral deskripsi jika salah satu bahasa diperbarui
    let descId = params.description_id || params.description || '';
    let descEn = params.description_en || params.description || '';

    if (descId && !descEn) {
      descEn = await translateBilateralText(descId, 'en');
    } else if (descEn && !descId) {
      descId = await translateBilateralText(descEn, 'id');
    }

    // Normalisasi status
    let targetStatus: enum_experiences_status | undefined = undefined;
    let isActive: boolean | undefined = undefined;
    if (params.status) {
      const s = params.status.toLowerCase();
      if (s === 'draft') {
        targetStatus = enum_experiences_status.draft;
        isActive = false;
      } else if (s === 'published' || s === 'active') {
        targetStatus = enum_experiences_status.published;
        isActive = true;
      }
    }

    // Siapkan gambar
    const existingImages = (exp as any).images || [];
    let updatedImages = existingImages;
    if (params.coverImageUrl || params.galleryImages) {
      const gallery = params.galleryImages || [];
      const primary = params.coverImageUrl ? [params.coverImageUrl] : [];
      updatedImages = Array.from(new Set([...primary, ...gallery])).filter(Boolean);
    }

    const updateData: any = {
      description: descId || descEn,
      description_id: descId,
      description_en: descEn,
      updated_at: now,
    };

    if (params.categoryId) updateData.category_id = params.categoryId;
    if (params.experienceTypeId !== undefined) updateData.experience_type_id = params.experienceTypeId;
    if (params.cityId) updateData.city_id = params.cityId;
    if (params.durationHours !== undefined) updateData.duration_hours = params.durationHours;
    if (params.maxParticipants !== undefined) updateData.max_participants = params.maxParticipants;
    if (params.price !== undefined) updateData.package_price = params.price;
    if (params.currency) updateData.currency = params.currency;
    if (params.meetingPoint !== undefined) updateData.meeting_point = params.meetingPoint;
    if (params.inclusions !== undefined) updateData.included_items = params.inclusions;
    if (params.exclusions !== undefined) updateData.excluded_items = params.exclusions;
    if (params.what_to_bring !== undefined) updateData.requirements = params.what_to_bring.join('\n');
    if (updatedImages && updatedImages.length > 0) updateData.images = updatedImages;
    if (targetStatus !== undefined) updateData.status = targetStatus;
    if (isActive !== undefined) updateData.is_active = isActive;

    await prisma.experiences.update({
      where: { id: experienceId },
      data: updateData,
    });

    // Revalidasi cache halaman publik dan dashboard
    try {
      revalidatePath('/[lang]/dashboard', 'page');
      revalidatePath('/id/dashboard', 'page');
      revalidatePath('/en/dashboard', 'page');
      revalidatePath(`/[lang]/experiences/${exp.slug}`, 'page');
      revalidatePath(`/id/experiences/${exp.slug}`, 'page');
      revalidatePath(`/en/experiences/${exp.slug}`, 'page');
      revalidatePath('/[lang]/experiences', 'page');
    } catch (_) {}

    return {
      success: true,
      message: 'Pengalaman tur berhasil diperbarui.',
      slug: exp.slug,
    };
  } catch (error: any) {
    console.error('Error in updateExperience:', error);
    return { success: false, error: error?.message || 'Terjadi kesalahan sistem saat memperbarui tur.' };
  }
}

export async function toggleExperienceStatus(experienceId: number, targetStatus?: 'published' | 'draft') {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return { success: false, error: 'Silakan masuk terlebih dahulu.' };
    }

    const exp = await prisma.experiences.findUnique({
      where: { id: experienceId },
      select: { id: true, host_id: true, status: true, slug: true, is_active: true },
    });

    if (!exp) return { success: false, error: 'Tur tidak ditemukan.' };
    if (exp.host_id !== userId) return { success: false, error: 'Akses ditolak.' };

    const newStatus = targetStatus
      ? targetStatus === 'published'
        ? enum_experiences_status.published
        : enum_experiences_status.draft
      : exp.status === enum_experiences_status.published
      ? enum_experiences_status.draft
      : enum_experiences_status.published;

    const newIsActive = newStatus === enum_experiences_status.published;

    await prisma.experiences.update({
      where: { id: experienceId },
      data: {
        status: newStatus,
        is_active: newIsActive,
        updated_at: new Date(),
      },
    });

    try {
      revalidatePath('/[lang]/dashboard', 'page');
      revalidatePath(`/id/experiences/${exp.slug}`, 'page');
      revalidatePath(`/en/experiences/${exp.slug}`, 'page');
    } catch (_) {}

    return {
      success: true,
      status: newStatus,
      isActive: newIsActive,
      message: newStatus === enum_experiences_status.published ? 'Tur berhasil diterbitkan (Published).' : 'Tur diubah menjadi draf (Draft).',
    };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Gagal mengubah status tur.' };
  }
}
