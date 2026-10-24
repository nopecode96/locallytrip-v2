'use server';

import prisma from '@/lib/prisma';
import { enum_stories_status } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { getPublicImageUrl } from '@/lib/images';

export interface AdminStoryItem {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  status: string;
  reading_time: number | null;
  view_count: number;
  like_count: number;
  comment_count: number;
  is_featured: boolean;
  created_at: Date;
  author: {
    id: number;
    name: string;
    email: string;
    avatar_url: string | null;
  };
  city: {
    id: number;
    name: string;
  } | null;
}

export interface GetAdminStoriesParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
  pageSize?: number;
}

export async function getAdminStories(params: GetAdminStoriesParams = {}) {
  try {
    const { search = '', status = 'all', page = 1, limit, pageSize } = params;
    const effectiveLimit = pageSize || limit || 10;
    const skip = (page - 1) * effectiveLimit;

    const where: any = {};

    if (search.trim()) {
      where.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { excerpt: { contains: search.trim(), mode: 'insensitive' } },
        { users_stories_author_idTousers: { name: { contains: search.trim(), mode: 'insensitive' } } },
      ];
    }

    if (status && status !== 'all') {
      where.status = status as enum_stories_status;
    }

    const [rawStories, totalCount, statsSummary] = await Promise.all([
      prisma.stories.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: effectiveLimit,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          cover_image: true,
          status: true,
          reading_time: true,
          view_count: true,
          like_count: true,
          comment_count: true,
          is_featured: true,
          created_at: true,
          users_stories_author_idTousers: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar_url: true,
            },
          },
          cities: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.stories.count({ where }),
      Promise.all([
        prisma.stories.count(),
        prisma.stories.count({ where: { status: 'published' } }),
        prisma.stories.count({ where: { status: 'draft' } }),
        prisma.stories.count({ where: { status: 'pending_review' } }),
      ]),
    ]);

    const stories: AdminStoryItem[] = rawStories.map((s) => ({
      id: s.id,
      title: s.title,
      slug: s.slug,
      excerpt: s.excerpt,
      cover_image: getPublicImageUrl(s.cover_image, 'stories'),
      status: s.status || 'draft',
      reading_time: s.reading_time || 3,
      view_count: s.view_count || 0,
      like_count: s.like_count || 0,
      comment_count: s.comment_count || 0,
      is_featured: Boolean(s.is_featured),
      created_at: s.created_at,
      author: {
        id: s.users_stories_author_idTousers.id,
        name: s.users_stories_author_idTousers.name,
        email: s.users_stories_author_idTousers.email,
        avatar_url: getPublicImageUrl(s.users_stories_author_idTousers.avatar_url, 'users'),
      },
      city: s.cities ? { id: s.cities.id, name: s.cities.name } : null,
    }));

    const [totalStories, publishedCount, draftCount, pendingReviewCount] = statsSummary;
    const totalPages = Math.ceil(totalCount / effectiveLimit);

    return {
      success: true,
      data: stories,
      stories,
      totalCount,
      totalPages,
      currentPage: page,
      pagination: {
        totalItems: totalCount,
        totalPages,
        currentPage: page,
        pageSize: effectiveLimit,
      },
      stats: {
        totalStories,
        publishedCount,
        draftCount,
        pendingReviewCount,
      },
    };
  } catch (error: any) {
    console.error('Error fetching admin stories:', error);
    return {
      success: false,
      stories: [],
      totalCount: 0,
      totalPages: 1,
      currentPage: 1,
      stats: {
        totalStories: 0,
        publishedCount: 0,
        draftCount: 0,
        pendingReviewCount: 0,
      },
      error: error?.message || 'Failed to fetch stories',
    };
  }
}

export async function toggleStoryStatus(storyId: number, currentStatus: string) {
  try {
    const nextStatus: enum_stories_status =
      currentStatus === 'published' ? 'draft' : 'published';

    const updated = await prisma.stories.update({
      where: { id: storyId },
      data: {
        status: nextStatus,
        updated_at: new Date(),
        ...(nextStatus === 'published' ? { published_at: new Date() } : {}),
      },
    });

    revalidatePath('/admin/community/stories');
    return { success: true, status: updated.status };
  } catch (error: any) {
    console.error('Error toggling story status:', error);
    return { success: false, error: error?.message || 'Failed to update story status' };
  }
}

export async function deleteStory(storyId: number) {
  try {
    await prisma.stories.delete({
      where: { id: storyId },
    });

    revalidatePath('/admin/community/stories');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting story:', error);
    return { success: false, error: error?.message || 'Failed to delete story' };
  }
}
