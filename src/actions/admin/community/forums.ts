'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getPublicImageUrl } from '@/lib/images';

export interface AdminForumThreadItem {
  id: number;
  title: string;
  slug: string;
  content: string;
  category: {
    id: number;
    name: string;
    slug: string;
  };
  author: {
    id: number;
    name: string;
    email: string;
    avatar_url: string | null;
  };
  is_pinned: boolean;
  is_locked: boolean;
  is_featured: boolean;
  view_count: number;
  reply_count: number;
  like_count: number;
  last_reply_at: Date | null;
  created_at: Date | null;
  status: string;
}

export interface GetAdminForumThreadsParams {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
  pageSize?: number;
}

export async function getAdminForumThreads(params: GetAdminForumThreadsParams = {}) {
  try {
    const { search = '', category = 'all', page = 1, limit, pageSize } = params;
    const effectiveLimit = pageSize || limit || 10;
    const skip = (page - 1) * effectiveLimit;

    const where: any = {
      deleted_at: null,
    };

    if (search.trim()) {
      where.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { content: { contains: search.trim(), mode: 'insensitive' } },
        { users_vibes_forum_threads_author_idTousers: { name: { contains: search.trim(), mode: 'insensitive' } } },
      ];
    }

    if (category && category !== 'all') {
      where.vibes_forum_categories = { slug: category };
    }

    const [rawThreads, totalCount, categories, statsSummary] = await Promise.all([
      prisma.vibes_forum_threads.findMany({
        where,
        orderBy: [{ is_pinned: 'desc' }, { created_at: 'desc' }],
        skip,
        take: effectiveLimit,
        select: {
          id: true,
          title: true,
          slug: true,
          content: true,
          is_pinned: true,
          is_locked: true,
          is_featured: true,
          view_count: true,
          reply_count: true,
          like_count: true,
          last_reply_at: true,
          created_at: true,
          status: true,
          vibes_forum_categories: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          users_vibes_forum_threads_author_idTousers: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar_url: true,
            },
          },
          _count: {
            select: {
              vibes_forum_posts: true,
            },
          },
        },
      }),
      prisma.vibes_forum_threads.count({ where }),
      prisma.vibes_forum_categories.findMany({
        select: { id: true, name: true, slug: true },
        orderBy: { name: 'asc' },
      }),
      Promise.all([
        prisma.vibes_forum_threads.count({ where: { deleted_at: null } }),
        prisma.vibes_forum_threads.count({ where: { is_pinned: true, deleted_at: null } }),
        prisma.vibes_forum_threads.count({ where: { is_locked: true, deleted_at: null } }),
        prisma.vibes_forum_posts.count({ where: { deleted_at: null } }),
      ]),
    ]);

    const threads: AdminForumThreadItem[] = rawThreads.map((t) => ({
      id: t.id,
      title: t.title,
      slug: t.slug,
      content: t.content,
      category: {
        id: t.vibes_forum_categories.id,
        name: t.vibes_forum_categories.name,
        slug: t.vibes_forum_categories.slug,
      },
      author: {
        id: t.users_vibes_forum_threads_author_idTousers.id,
        name: t.users_vibes_forum_threads_author_idTousers.name,
        email: t.users_vibes_forum_threads_author_idTousers.email,
        avatar_url: getPublicImageUrl(t.users_vibes_forum_threads_author_idTousers.avatar_url, 'users'),
      },
      is_pinned: Boolean(t.is_pinned),
      is_locked: Boolean(t.is_locked),
      is_featured: Boolean(t.is_featured),
      view_count: t.view_count || 0,
      reply_count: t._count?.vibes_forum_posts || t.reply_count || 0,
      like_count: t.like_count || 0,
      last_reply_at: t.last_reply_at,
      created_at: t.created_at,
      status: t.status || 'active',
    }));

    const [totalThreads, pinnedCount, lockedCount, totalPosts] = statsSummary;
    const totalPages = Math.ceil(totalCount / effectiveLimit);

    return {
      success: true,
      data: threads,
      threads,
      totalCount,
      totalPages,
      currentPage: page,
      pagination: {
        totalItems: totalCount,
        totalPages,
        currentPage: page,
        pageSize: effectiveLimit,
      },
      categories,
      stats: {
        totalThreads,
        pinnedCount,
        lockedCount,
        totalPosts,
      },
    };
  } catch (error: any) {
    console.error('Error fetching admin forum threads:', error);
    return {
      success: false,
      threads: [],
      totalCount: 0,
      totalPages: 1,
      currentPage: 1,
      categories: [],
      stats: {
        totalThreads: 0,
        pinnedCount: 0,
        lockedCount: 0,
        totalPosts: 0,
      },
      error: error?.message || 'Failed to fetch forum threads',
    };
  }
}

export async function toggleThreadPinned(threadId: number, currentPinned: boolean) {
  try {
    const updated = await prisma.vibes_forum_threads.update({
      where: { id: threadId },
      data: {
        is_pinned: !currentPinned,
        updated_at: new Date(),
      },
    });

    revalidatePath('/admin/community/forums');
    return { success: true, is_pinned: updated.is_pinned };
  } catch (error: any) {
    console.error('Error toggling thread pinned:', error);
    return { success: false, error: error?.message || 'Failed to update pin status' };
  }
}

export async function toggleThreadLocked(threadId: number, currentLocked: boolean) {
  try {
    const updated = await prisma.vibes_forum_threads.update({
      where: { id: threadId },
      data: {
        is_locked: !currentLocked,
        updated_at: new Date(),
      },
    });

    revalidatePath('/admin/community/forums');
    return { success: true, is_locked: updated.is_locked };
  } catch (error: any) {
    console.error('Error toggling thread locked:', error);
    return { success: false, error: error?.message || 'Failed to update lock status' };
  }
}

export async function deleteThread(threadId: number) {
  try {
    await prisma.vibes_forum_threads.update({
      where: { id: threadId },
      data: {
        deleted_at: new Date(),
        status: 'deleted',
      },
    });

    revalidatePath('/admin/community/forums');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting thread:', error);
    return { success: false, error: error?.message || 'Failed to delete thread' };
  }
}
