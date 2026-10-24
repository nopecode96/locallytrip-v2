'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getCurrentUserSession } from '@/actions/bookings';

export interface UpdateForumThreadParams {
  // Title & slug are deliberately omitted or ignored to enforce strict SEO immutability
  title?: string;
  slug?: string;
  categoryId?: number;
  cityId?: number | null;
  content: string;
  tags?: string[];
  images?: string[];
  status?: 'active' | 'draft' | 'PUBLISHED' | 'DRAFT';
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

export async function updateForumThread(threadId: number, params: UpdateForumThreadParams) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return { success: false, error: 'Silakan masuk terlebih dahulu untuk mengubah topik diskusi.' };
    }

    const thread = await prisma.vibes_forum_threads.findUnique({
      where: { id: threadId },
      select: { id: true, author_id: true, slug: true, status: true, title: true },
    });

    if (!thread) {
      return { success: false, error: 'Topik diskusi tidak ditemukan.' };
    }

    // Otorisasi: Hanya pembuat (author_id) yang berhak mengubah
    if (thread.author_id !== userId) {
      return { success: false, error: 'Anda tidak memiliki hak akses untuk mengubah topik diskusi ini.' };
    }

    // STRICT SEO PROTECTION:
    // Judul dan slug sengaja DIABAIKAN dan DILINDUNGI agar tautan SEO tetap valid.

    const now = new Date();
    const updateData: any = {
      content: params.content,
      updated_at: now,
    };

    if (params.categoryId) updateData.category_id = params.categoryId;
    if (params.images !== undefined) updateData.images = params.images;
    if (params.status) {
      const s = params.status.toLowerCase();
      updateData.status = s === 'draft' ? 'draft' : 'active';
    }

    await prisma.vibes_forum_threads.update({
      where: { id: threadId },
      data: updateData,
    });

    try {
      revalidatePath('/[lang]/dashboard', 'page');
      revalidatePath('/id/dashboard', 'page');
      revalidatePath('/en/dashboard', 'page');
      revalidatePath(`/[lang]/community/forums/${thread.slug}`, 'page');
      revalidatePath(`/id/community/forums/${thread.slug}`, 'page');
      revalidatePath(`/en/community/forums/${thread.slug}`, 'page');
      revalidatePath('/[lang]/community/forums', 'page');
    } catch (_) {}

    return {
      success: true,
      message: 'Topik diskusi berhasil diperbarui.',
      slug: thread.slug,
    };
  } catch (error: any) {
    console.error('Error in updateForumThread:', error);
    return { success: false, error: error?.message || 'Gagal memperbarui topik diskusi.' };
  }
}

export async function toggleForumThreadStatus(threadId: number, targetStatus?: string | null) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return { success: false, error: 'Silakan masuk terlebih dahulu.' };
    }

    const thread = await prisma.vibes_forum_threads.findUnique({
      where: { id: threadId },
      select: { id: true, author_id: true, status: true, slug: true },
    });

    if (!thread) return { success: false, error: 'Topik diskusi tidak ditemukan.' };
    if (thread.author_id !== userId) return { success: false, error: 'Akses ditolak.' };

    const currentIsActive = thread.status?.toLowerCase() === 'active' || thread.status?.toLowerCase() === 'open';
    const newStatus = targetStatus
      ? targetStatus === 'active'
        ? 'active'
        : 'draft'
      : currentIsActive
      ? 'draft'
      : 'active';

    await prisma.vibes_forum_threads.update({
      where: { id: threadId },
      data: {
        status: newStatus,
        updated_at: new Date(),
      },
    });

    try {
      revalidatePath('/[lang]/dashboard', 'page');
      revalidatePath(`/id/community/forums/${thread.slug}`, 'page');
      revalidatePath(`/en/community/forums/${thread.slug}`, 'page');
    } catch (_) {}

    return {
      success: true,
      status: newStatus,
      message: newStatus === 'active' ? 'Diskusi berhasil diterbitkan (Published).' : 'Diskusi diubah menjadi draf (Draft).',
    };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Gagal mengubah status diskusi.' };
  }
}
