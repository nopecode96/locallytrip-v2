import React from 'react';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import {
  ForumThreadDetailClient,
  ForumThreadDetailData,
  RelatedThreadItem,
  ForumCommentItem,
  CurrentUserSessionData,
} from '@/components/community/ForumThreadDetailClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCurrentUserSession } from '@/actions/bookings';
import { getPublicImageUrl } from '@/lib/images';

interface ForumDetailPageProps {
  params: Promise<{
    lang: string;
    slug: string;
  }>;
}

export const dynamic = 'force-dynamic';

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function getThreadData(slugOrId: string) {
  const isNumeric = /^\d+$/.test(slugOrId);
  const numId = isNumeric ? parseInt(slugOrId, 10) : parseInt(slugOrId, 10) || -1;

  // 1. Coba kueri utama dengan id atau slug
  let thread = await prisma.vibes_forum_threads.findFirst({
    where: isNumeric
      ? { id: numId }
      : {
          OR: [
            { slug: slugOrId },
            ...(numId > 0 ? [{ id: numId }] : []),
          ],
        },
    include: {
      users_vibes_forum_threads_author_idTousers: {
        select: {
          id: true,
          name: true,
          username: true,
          avatar_url: true,
          role: true,
          is_verified: true,
          bio: true,
          cities: {
            select: { id: true, name: true },
          },
          host_kyc_host_kyc_user_idTousers: {
            select: { status: true },
          },
          user_xp: {
            select: { current_level: true, total_xp: true },
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
      experience_types: {
        select: {
          id: true,
          name: true,
        },
      },
      vibes_forum_thread_likes: true,
      vibes_forum_thread_dislikes: true,
      vibes_forum_posts: {
        where: { deleted_at: null },
        orderBy: { created_at: 'asc' },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar_url: true,
              role: true,
              is_verified: true,
              user_xp: {
                select: { current_level: true, total_xp: true },
              },
            },
          },
          vibes_forum_post_likes: true,
          vibes_forum_post_dislikes: true,
          other_vibes_forum_posts: {
            where: { deleted_at: null },
            orderBy: { created_at: 'asc' },
            include: {
              users: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  avatar_url: true,
                  role: true,
                  is_verified: true,
                  user_xp: {
                    select: { current_level: true, total_xp: true },
                  },
                },
              },
              vibes_forum_post_likes: true,
              vibes_forum_post_dislikes: true,
            },
          },
        },
      },
    },
  });

  // 2. Fallback jika slug bervariasi (misal 'food-tours-local-flavors' vs 'food-tours-and-local-flavors')
  if (!thread && !isNumeric) {
    const slugVariant = slugOrId.replace(/-food-tours-local-flavors/i, '-food-tours-and-local-flavors');
    thread = await prisma.vibes_forum_threads.findFirst({
      where: {
        OR: [
          { slug: slugVariant },
          { slug: { startsWith: slugOrId.slice(0, 30) } },
          { title: { contains: 'Marrakesh-Safi on a Budget', mode: 'insensitive' } },
        ],
        deleted_at: null,
      },
      include: {
        users_vibes_forum_threads_author_idTousers: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar_url: true,
            role: true,
            is_verified: true,
            bio: true,
            cities: {
              select: { id: true, name: true },
            },
            host_kyc_host_kyc_user_idTousers: {
              select: { status: true },
            },
            user_xp: {
              select: { current_level: true, total_xp: true },
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
        experience_types: {
          select: {
            id: true,
            name: true,
          },
        },
        vibes_forum_thread_likes: true,
        vibes_forum_thread_dislikes: true,
        vibes_forum_posts: {
          where: { deleted_at: null },
          orderBy: { created_at: 'asc' },
          include: {
            users: {
              select: {
                id: true,
                name: true,
                username: true,
                avatar_url: true,
                role: true,
                is_verified: true,
                user_xp: {
                  select: { current_level: true, total_xp: true },
                },
              },
            },
            vibes_forum_post_likes: true,
            vibes_forum_post_dislikes: true,
            other_vibes_forum_posts: {
              where: { deleted_at: null },
              orderBy: { created_at: 'asc' },
              include: {
                users: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
                    avatar_url: true,
                    role: true,
                    is_verified: true,
                    user_xp: {
                      select: { current_level: true, total_xp: true },
                    },
                  },
                },
                vibes_forum_post_likes: true,
                vibes_forum_post_dislikes: true,
              },
            },
          },
        },
      },
    });
  }

  return thread;
}

export async function generateMetadata({
  params,
}: ForumDetailPageProps): Promise<Metadata> {
  const resolved = await params;
  const thread = await getThreadData(resolved.slug);

  if (!thread) {
    return { title: 'Forum Thread Not Found | Locallytrip' };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://locallytrip.com';
  const pageUrl = `${siteUrl}/${resolved.lang}/community/forums/${thread.slug || thread.id}`;

  return {
    title: thread.meta_title || `${thread.title} | Forum Komunitas Locallytrip`,
    description: thread.meta_description || thread.title,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: thread.title,
      description: thread.meta_description || thread.title,
      url: pageUrl,
      type: 'article',
    },
  };
}

export default async function ForumDetailPage({ params }: ForumDetailPageProps) {
  const resolved = await params;
  const isId = resolved.lang === 'id';

  const thread = await getThreadData(resolved.slug);
  if (!thread || thread.deleted_at) notFound();

  // Increment view count directly on visit
  await prisma.vibes_forum_threads.updateMany({
    where: { id: thread.id },
    data: {
      view_count: { increment: 1 },
    },
  });

  // Query related threads di kategori yang sama, featured experiences, dan upcoming meetups
  const [rawRelatedThreads, experiencesRaw, meetupsRaw] = await Promise.all([
    prisma.vibes_forum_threads.findMany({
      where: {
        category_id: thread.category_id,
        id: { not: thread.id },
        status: { in: ['active', 'OPEN', 'PUBLISHED'] },
        deleted_at: null,
      },
      take: 4,
      orderBy: [{ reply_count: 'desc' }, { view_count: 'desc' }],
      select: {
        id: true,
        title: true,
        slug: true,
        reply_count: true,
        like_count: true,
        view_count: true,
      },
    }),
    prisma.experiences.findMany({
      where: { status: 'published', is_active: true },
      select: {
        id: true,
        title: true,
        title_id: true,
        slug: true,
        package_price: true,
        currency: true,
        rating_average: true,
        rating_count: true,
        images: true,
        cities: { select: { id: true, name: true } },
        experience_types: { select: { id: true, name: true } },
      },
      orderBy: { rating_average: 'desc' },
      take: 3,
    }),
    prisma.vibes_travel_meetups.findMany({
      where: { status: 'active', deleted_at: null },
      select: {
        id: true,
        title: true,
        slug: true,
        start_date: true,
        end_date: true,
        max_members: true,
        current_member_count: true,
        cities: { select: { id: true, name: true } },
        _count: { select: { vibes_travel_meetup_members: true } },
      },
      orderBy: { start_date: 'asc' },
      take: 2,
    }),
  ]);

  const featuredExperiences = experiencesRaw.map((exp) => ({
    id: exp.id,
    title: resolved.lang === 'id' && exp.title_id ? exp.title_id : exp.title,
    slug: exp.slug || String(exp.id),
    price: exp.package_price ? Number(exp.package_price) : 0,
    currency: exp.currency,
    rating: exp.rating_average ? Number(exp.rating_average) : 4.9,
    review_count: exp.rating_count || 0,
    image: getPublicImageUrl(exp.images, 'experiences'),
    cityName: exp.cities?.name || null,
    categoryName: exp.experience_types?.name || null,
  }));

  const upcomingMeetups = meetupsRaw.map((m) => ({
    id: m.id,
    title: m.title,
    slug: m.slug || String(m.id),
    start_date: m.start_date.toISOString(),
    end_date: m.end_date ? m.end_date.toISOString() : null,
    max_members: m.max_members,
    current_member_count: m.current_member_count ?? m._count?.vibes_travel_meetup_members ?? 1,
    cityName: m.cities?.name || null,
  }));

  const relatedThreads: RelatedThreadItem[] = rawRelatedThreads.map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    reply_count: r.reply_count || 0,
    like_count: r.like_count || 0,
    view_count: r.view_count || 0,
  }));

  // Ekstrak nama kota dari meta_keywords atau title jika ada
  let cityName: string | null = null;
  const matchCity =
    thread.title.match(/^([A-Za-z\s-]+)\s+on\s+a\s+Budget/i) ||
    thread.title.match(/in\s+([A-Za-z\s-]+)/i);
  if (matchCity && matchCity[1]) {
    cityName = matchCity[1].trim();
  } else if (thread.meta_keywords) {
    const kw = thread.meta_keywords.split(',')[0]?.trim();
    if (kw && !kw.includes('-')) cityName = kw;
  }
  if (!cityName && thread.users_vibes_forum_threads_author_idTousers?.cities?.name) {
    cityName = thread.users_vibes_forum_threads_author_idTousers.cities.name;
  }

  const author = thread.users_vibes_forum_threads_author_idTousers;
  const threadLikesCount = thread.vibes_forum_thread_likes.length;
  const threadDislikesCount = thread.vibes_forum_thread_dislikes.length;
  const threadNetScore = threadLikesCount - threadDislikesCount;

  // Format comments (flattened root comments + sub comments)
  const formattedComments: ForumCommentItem[] = thread.vibes_forum_posts.map((post) => {
    const pLikes = post.vibes_forum_post_likes.length;
    const pDislikes = post.vibes_forum_post_dislikes.length;
    return {
      id: post.id,
      thread_id: post.thread_id,
      parent_id: post.parent_id,
      content: post.content,
      created_at: post.created_at ? post.created_at.toISOString() : null,
      likes_count: pLikes,
      dislikes_count: pDislikes,
      net_score: pLikes - pDislikes,
      author: {
        id: post.users.id,
        name: post.users.name,
        username: post.users.username,
        avatar_url: getPublicImageUrl(post.users.avatar_url, 'users'),
        role: post.users.role,
        is_verified: Boolean(post.users.is_verified),
        level: post.users.user_xp?.current_level || 1,
      },
    };
  });

  const threadData: ForumThreadDetailData = {
    id: thread.id,
    title: thread.title,
    slug: thread.slug || slugify(thread.title),
    content: thread.content,
    created_at: thread.created_at ? thread.created_at.toISOString() : null,
    view_count: thread.view_count || 0,
    like_count: threadLikesCount,
    dislike_count: threadDislikesCount,
    net_score: threadNetScore,
    reply_count: thread.vibes_forum_posts.length,
    is_pinned: Boolean(thread.is_pinned),
    is_featured: Boolean(thread.is_featured),
    is_locked: Boolean(thread.is_locked),
    author: {
      id: author.id,
      name: author.name,
      username: author.username,
      avatar_url: getPublicImageUrl(author.avatar_url, 'users'),
      role: author.role,
      is_verified: Boolean(author.is_verified),
      level: author.user_xp?.current_level || 1,
      total_xp: author.user_xp?.total_xp || 0,
      bio: author.bio,
      cityName: author.cities?.name || null,
      host_kyc_host_kyc_user_idTousers: (author as any).host_kyc_host_kyc_user_idTousers,
    },
    category: thread.vibes_forum_categories
      ? {
          id: thread.vibes_forum_categories.id,
          name: thread.vibes_forum_categories.name,
          slug: thread.vibes_forum_categories.slug,
          icon: thread.vibes_forum_categories.icon,
        }
      : null,
    cityName,
    images: Array.isArray(thread.images) ? (thread.images as string[]) : [],
    comments: formattedComments,
  };

  const categoryOrCityLabel =
    cityName || thread.vibes_forum_categories?.name || (isId ? 'Topik Umum' : 'General');

  // Breadcrumb short title (max 35 chars)
  const shortTitle =
    thread.title.length > 35 ? `${thread.title.substring(0, 32)}...` : thread.title;

  // Ambil session user aktif (NextAuth & raw cookie session)
  const [nextAuthSession, rawSession] = await Promise.all([
    getServerSession(authOptions).catch(() => null),
    getCurrentUserSession().catch(() => null),
  ]);

  let currentUserId: number | null = null;
  let currentUserName = 'User';
  let currentUserEmail = '';
  let isUserLoggedIn = false;

  if (nextAuthSession?.user?.email) {
    currentUserEmail = nextAuthSession.user.email;
    const dbUser = await prisma.users.findUnique({
      where: { email: nextAuthSession.user.email },
      select: { id: true, name: true, username: true, email: true },
    });
    if (dbUser) {
      currentUserId = dbUser.id;
      currentUserName = dbUser.name || dbUser.username || 'User';
      isUserLoggedIn = true;
    }
  } else if (rawSession?.isLoggedIn && rawSession.id) {
    currentUserId = rawSession.id;
    currentUserName = rawSession.name;
    currentUserEmail = rawSession.email;
    isUserLoggedIn = true;
  }

  const currentUser: CurrentUserSessionData | null = isUserLoggedIn && currentUserId
    ? {
        id: currentUserId,
        name: currentUserName,
        email: currentUserEmail,
        isLoggedIn: true,
      }
    : null;

  // Cek relasi follow author thread
  let initialIsFollowingAuthor = false;
  if (currentUser?.isLoggedIn && author?.id && currentUser.id !== author.id) {
    const followRecord = await prisma.user_follows.findUnique({
      where: {
        follower_id_following_id: {
          follower_id: currentUser.id,
          following_id: author.id,
        },
      },
      select: { id: true },
    }).catch(() => null);
    initialIsFollowingAuthor = Boolean(followRecord);
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {/* Navigasi Back & Breadcrumb Standar Locallytrip */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href={`/${resolved.lang}/community/forums`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-violet-600 transition-colors bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs hover:border-violet-200 shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-violet-600" />
              <span>{isId ? 'Kembali ke Forum' : 'Back to Forums'}</span>
            </Link>

            <nav
              aria-label="Breadcrumb"
              className="flex items-center flex-wrap gap-2 text-xs font-medium text-slate-500"
            >
              <Link
                href={`/${resolved.lang}`}
                className="hover:text-violet-600 transition flex items-center gap-1 text-slate-600"
              >
                {isId ? 'Beranda' : 'Home'}
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              <Link
                href={`/${resolved.lang}/community`}
                className="hover:text-violet-600 transition text-slate-600"
              >
                {isId ? 'Komunitas' : 'Community'}
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              <Link
                href={`/${resolved.lang}/community/forums`}
                className="hover:text-violet-600 transition text-slate-600"
              >
                {isId ? 'Forum' : 'Forums'}
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              <span className="text-slate-600 font-semibold">{categoryOrCityLabel}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              <span className="text-violet-700 font-semibold truncate max-w-[200px] sm:max-w-xs">
                {shortTitle}
              </span>
            </nav>
          </div>
        </div>

        {/* Layout 2 Kolom (Konten Forum di Kiri + Sidebar Komunitas di Kanan) */}
        <ForumThreadDetailClient
          thread={threadData}
          relatedThreads={relatedThreads}
          featuredExperiences={featuredExperiences}
          upcomingMeetups={upcomingMeetups}
          lang={resolved.lang}
          currentUser={currentUser}
          initialIsFollowingAuthor={initialIsFollowingAuthor}
        />
      </div>
    </div>
  );
}
