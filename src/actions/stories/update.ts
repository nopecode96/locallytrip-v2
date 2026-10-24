'use server';

import prisma from '@/lib/prisma';
import { enum_stories_status } from '@prisma/client';
import { getCurrentUserSession } from '@/actions/bookings';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export interface UpdateStoryParams {
  // Title & slug are deliberately omitted or ignored to enforce strict SEO immutability
  title?: string;
  slug?: string;
  content: string;
  excerpt?: string;
  city_id?: number | null;
  cover_image?: string;
  images?: string[];
  tags?: string[];
  status?: 'draft' | 'published' | 'pending_review' | 'DRAFT' | 'PUBLISHED';
  isPublish?: boolean;
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

export async function updateStory(storyId: number, params: UpdateStoryParams) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return { success: false, error: 'Silakan masuk terlebih dahulu untuk mengubah cerita.' };
    }

    const story = await prisma.stories.findUnique({
      where: { id: storyId },
      select: { id: true, author_id: true, slug: true, status: true, title: true },
    });

    if (!story) {
      return { success: false, error: 'Cerita tidak ditemukan.' };
    }

    // Otorisasi: Hanya pemilik (author_id) yang berhak mengedit
    if (story.author_id !== userId) {
      return { success: false, error: 'Anda tidak memiliki hak akses untuk mengubah cerita ini.' };
    }

    // STRICT SEO PROTECTION:
    // Judul dan slug sengaja DIABAIKAN dan DILINDUNGI agar tautan SEO Google/GEO tidak rusak.

    const isPublish = params.isPublish === true || params.status?.toLowerCase() === 'published';
    const targetStatus: enum_stories_status = isPublish
      ? enum_stories_status.published
      : enum_stories_status.draft;

    const now = new Date();

    const updateData: any = {
      content: params.content,
      excerpt: params.excerpt || null,
      status: targetStatus,
      is_active: isPublish,
      updated_at: now,
    };

    if (params.city_id !== undefined) updateData.city_id = params.city_id;
    if (params.cover_image !== undefined) updateData.cover_image = params.cover_image;
    if (params.images !== undefined) updateData.images = params.images;
    if (params.tags !== undefined) updateData.tags = params.tags;

    await prisma.stories.update({
      where: { id: storyId },
      data: updateData,
    });

    try {
      revalidatePath('/[lang]/dashboard', 'page');
      revalidatePath('/id/dashboard', 'page');
      revalidatePath('/en/dashboard', 'page');
      revalidatePath(`/[lang]/stories/${story.slug}`, 'page');
      revalidatePath(`/id/stories/${story.slug}`, 'page');
      revalidatePath(`/en/stories/${story.slug}`, 'page');
      revalidatePath('/[lang]/stories', 'page');
    } catch (_) {}

    return {
      success: true,
      message: 'Cerita berhasil diperbarui.',
      slug: story.slug,
    };
  } catch (error: any) {
    console.error('Error in updateStory:', error);
    return { success: false, error: error?.message || 'Gagal memperbarui cerita.' };
  }
}

export async function toggleStoryStatus(storyId: number, targetStatus?: string | null) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return { success: false, error: 'Silakan masuk terlebih dahulu.' };
    }

    const story = await prisma.stories.findUnique({
      where: { id: storyId },
      select: { id: true, author_id: true, status: true, slug: true, is_active: true },
    });

    if (!story) return { success: false, error: 'Cerita tidak ditemukan.' };
    if (story.author_id !== userId) return { success: false, error: 'Akses ditolak.' };

    const newStatus = targetStatus
      ? targetStatus.toLowerCase() === 'published'
        ? enum_stories_status.published
        : enum_stories_status.draft
      : story.status === enum_stories_status.published
      ? enum_stories_status.draft
      : enum_stories_status.published;

    const newIsActive = newStatus === enum_stories_status.published;

    await prisma.stories.update({
      where: { id: storyId },
      data: {
        status: newStatus,
        is_active: newIsActive,
        updated_at: new Date(),
      },
    });

    try {
      revalidatePath('/[lang]/dashboard', 'page');
      revalidatePath(`/id/stories/${story.slug}`, 'page');
      revalidatePath(`/en/stories/${story.slug}`, 'page');
    } catch (_) {}

    return {
      success: true,
      status: newStatus,
      isActive: newIsActive,
      message: newStatus === enum_stories_status.published ? 'Cerita berhasil diterbitkan (Published).' : 'Cerita diubah menjadi draf (Draft).',
    };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Gagal mengubah status cerita.' };
  }
}
