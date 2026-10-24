import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(30, Math.max(1, parseInt(searchParams.get('limit') || '15', 10)));
    const skip = (page - 1) * limit;

    const [total, threadsRaw] = await Promise.all([
      prisma.vibes_forum_threads.count({
        where: {
          status: 'active',
          deleted_at: null,
        },
      }),
      prisma.vibes_forum_threads.findMany({
        where: {
          status: 'active',
          deleted_at: null,
        },
        orderBy: [{ is_pinned: 'desc' }, { created_at: 'desc' }],
        skip,
        take: limit,
        include: {
          users_vibes_forum_threads_author_idTousers: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar_url: true,
              role: true,
              is_verified: true,
              cities: {
                select: {
                  id: true,
                  name: true,
                },
              },
              user_xp: {
                select: {
                  current_level: true,
                  total_xp: true,
                },
              },
            },
          },
          vibes_forum_categories: {
            select: {
              id: true,
              name: true,
              slug: true,
              icon: true,
            },
          },
          _count: {
            select: {
              vibes_forum_posts: true,
              vibes_forum_thread_likes: true,
              vibes_forum_thread_dislikes: true,
            },
          },
        },
      }),
    ]);

    const threads = threadsRaw.map((th) => {
      const author = th.users_vibes_forum_threads_author_idTousers;
      const likesCount = th._count?.vibes_forum_thread_likes ?? th.like_count ?? 0;
      const dislikesCount = th._count?.vibes_forum_thread_dislikes ?? th.dislike_count ?? 0;
      const repliesCount = th._count?.vibes_forum_posts ?? th.reply_count ?? 0;
      const netVotes = likesCount - dislikesCount;
      const city = author?.cities ? { id: author.cities.id, name: author.cities.name } : null;

      return {
        id: th.id,
        title: th.title,
        slug: th.slug,
        content: th.content,
        created_at: th.created_at ? th.created_at.toISOString() : null,
        view_count: th.view_count ?? 0,
        like_count: likesCount,
        dislike_count: dislikesCount,
        net_votes: netVotes,
        reply_count: repliesCount,
        is_pinned: Boolean(th.is_pinned),
        is_featured: Boolean(th.is_featured),
        is_locked: Boolean(th.is_locked),
        author: {
          id: author?.id || 0,
          name: author?.name || null,
          username: author?.username || null,
          avatar_url: author?.avatar_url || null,
          role: author?.role || null,
          is_verified: Boolean(author?.is_verified),
          level: author?.user_xp?.current_level || 1,
          cityName: author?.cities?.name || null,
        },
        category: th.vibes_forum_categories
          ? {
              id: th.vibes_forum_categories.id,
              name: th.vibes_forum_categories.name,
              slug: th.vibes_forum_categories.slug,
              icon: th.vibes_forum_categories.icon,
            }
          : null,
        city,
        _count: {
          comments: repliesCount,
        },
      };
    });

    const hasMore = skip + threads.length < total;

    return NextResponse.json({
      success: true,
      threads,
      pagination: {
        page,
        limit,
        total,
        hasMore,
      },
    });
  } catch (error) {
    console.error('Error fetching forum threads:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat diskusi forum.' },
      { status: 500 }
    );
  }
}
