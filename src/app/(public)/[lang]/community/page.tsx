import React from 'react';
import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import { getPublicImageUrl } from '@/lib/images';
import {
  CommunityHubClient,
  CommunityLeaderboardUser,
  CommunityRecentThread,
  CommunityUpcomingMeetup,
  CommunityStoryItem,
  CommunityLevelTier,
  CommunityRewardSettings,
  CommunityCategoryOption,
  CommunityCityOption,
} from '@/components/community/CommunityHubClient';

interface CommunityPageProps {
  params: Promise<{
    lang: string;
  }>;
  searchParams?: Promise<{
    tab?: string;
  }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const lang = resolvedParams.lang === 'en' ? 'en' : 'id';
  const isId = lang === 'id';

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://locallytrip.com';
  const canonicalUrl = `${siteUrl}/${lang}/community`;

  const title = isId
    ? 'Pusat Komunitas Penjelajah: Meetups, Forum & Cerita | Locallytrip'
    : 'Travelers Community Hub: Meetups, Forums & Stories | Locallytrip';

  const description = isId
    ? 'Pusat komunitas penjelajah dan pemandu lokal Locallytrip. Ikuti agenda temu petualang (meetups), berdiskusi di forum rute lokal, baca jurnal cerita inspiratif, dan pantau peringkat reputasi XP.'
    : 'The vibrant community hub of Locallytrip explorers. Join local meetups, discuss hidden gems on forums, read immersive field stories, and track the XP leaderboard.';

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'id-ID': `${siteUrl}/id/community`,
        'en-US': `${siteUrl}/en/community`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Locallytrip Community',
      locale: isId ? 'id_ID' : 'en_US',
      type: 'website',
      images: [
        {
          url: `${siteUrl}/images/rewards/hero-earning-traveler.png`,
          width: 1200,
          height: 630,
          alt: 'Locallytrip Community Hub',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${siteUrl}/images/rewards/hero-earning-traveler.png`],
    },
  };
}

export default async function CommunityHubPage({ params, searchParams }: CommunityPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const locale = resolvedParams.lang === 'en' ? 'en' : 'id';
  const initialTab = (['all', 'meetups', 'forums', 'stories', 'leaderboard'].includes(
    resolvedSearchParams.tab || ''
  )
    ? resolvedSearchParams.tab
    : 'all') as 'all' | 'meetups' | 'forums' | 'stories' | 'leaderboard';

  // Kueri Data Prisma Secara Paralel dari PostgreSQL
  const [
    topUsersRaw,
    meetupsRaw,
    threadsRaw,
    storiesRaw,
    forumCategoriesRaw,
    citiesRaw,
    rewardSettingsRaw,
    levelTiersRaw,
  ] = await Promise.all([
    // 1. Leaderboard Users (Top 10 by total_xp)
    prisma.user_xp.findMany({
      orderBy: { total_xp: 'desc' },
      take: 10,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar_url: true,
            role: true,
            is_verified: true,
            cities: {
              select: { id: true, name: true },
            },
            host_kyc_host_kyc_user_idTousers: {
              select: { status: true },
            },
          },
        },
      },
    }),

    // 2. Travel Meetups (Aktif)
    prisma.vibes_travel_meetups.findMany({
      where: {
        status: 'active',
        deleted_at: null,
      },
      include: {
        cities: {
          select: {
            id: true,
            name: true,
            image_url: true,
            latitude: true,
            longitude: true,
          },
        },
        users: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar_url: true,
            role: true,
            is_verified: true,
          },
        },
        _count: {
          select: { vibes_travel_meetup_members: true },
        },
      },
      orderBy: { start_date: 'asc' },
      take: 12,
    }),

    // 3. Discussion Forums (Aktif)
    prisma.vibes_forum_threads.findMany({
      where: {
        status: 'active',
        deleted_at: null,
      },
      include: {
        vibes_forum_categories: {
          select: { id: true, name: true, slug: true, icon: true },
        },
        users_vibes_forum_threads_author_idTousers: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar_url: true,
            role: true,
            is_verified: true,
            cities: { select: { id: true, name: true } },
          },
        },
        _count: {
          select: { vibes_forum_posts: true, vibes_forum_thread_likes: true },
        },
      },
      orderBy: [
        { is_pinned: 'desc' },
        { reply_count: 'desc' },
        { created_at: 'desc' },
      ],
      take: 12,
    }),

    // 4. Travel Stories (Terbit & Aktif)
    prisma.stories.findMany({
      where: {
        status: 'published',
        is_active: true,
      },
      include: {
        users_stories_author_idTousers: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar_url: true,
            role: true,
            bio: true,
            is_verified: true,
            user_xp: {
              select: { current_level: true, total_xp: true },
            },
          },
        },
        cities: {
          select: { id: true, name: true },
        },
      },
      orderBy: [
        { is_featured: 'desc' },
        { created_at: 'desc' },
      ],
      take: 12,
    }),

    // 5. Forum Categories
    prisma.vibes_forum_categories.findMany({
      select: { id: true, name: true, slug: true, icon: true },
      orderBy: { name: 'asc' },
    }),

    // 6. Cities for Filters
    prisma.cities.findMany({
      where: { is_active: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
      take: 20,
    }),

    // 7. Reward System Settings
    prisma.reward_system_settings.findMany(),

    // 8. Reward Level Tiers
    prisma.reward_level_tiers.findMany({
      where: { is_active: true },
      orderBy: { level: 'asc' },
    }),
  ]);

  // Format Level Tiers
  const levelTiers: CommunityLevelTier[] = levelTiersRaw.map((tier) => ({
    level: tier.level,
    badge_icon: tier.badge_icon,
    name_id: tier.name_id,
    name_en: tier.name_en,
    min_xp: tier.min_xp,
  }));

  const getTierForXp = (xp: number): CommunityLevelTier => {
    let current = levelTiers[0] || {
      level: 1,
      badge_icon: '🌱',
      name_id: 'Wanderer',
      name_en: 'Wanderer',
      min_xp: 0,
    };
    for (const tier of levelTiers) {
      if (xp >= tier.min_xp) {
        current = tier;
      } else {
        break;
      }
    }
    return current;
  };

  // Format Leaderboard Users
  const leaderboardUsers: CommunityLeaderboardUser[] = topUsersRaw.map((record, index) => {
    const user = record.users;
    const tier = getTierForXp(record.total_xp);
    const isHost = user.role?.toUpperCase() === 'HOST';
    const isKycApproved =
      isHost &&
      (user.host_kyc_host_kyc_user_idTousers?.status === 'approved' || user.is_verified === true);

    return {
      rank: index + 1,
      id: user.id,
      name: user.name,
      username: user.username || `user_${user.id}`,
      avatar_url: getPublicImageUrl(user.avatar_url, 'users'),
      role: user.role || 'traveller',
      is_host: isHost,
      is_verified: Boolean(user.is_verified),
      is_kyc_approved: Boolean(isKycApproved),
      cityName: user.cities?.name || null,
      total_xp: record.total_xp,
      current_level: record.current_level,
      tier,
    };
  });

  // Format Meetups with Coordinates & Centralized Image Utility
  const upcomingMeetups: CommunityUpcomingMeetup[] = meetupsRaw.map((m) => {
    const cover = getPublicImageUrl(m.images, 'meetups', {
      fallbackUrl: m.cities?.image_url
        ? getPublicImageUrl(m.cities.image_url, 'cities')
        : undefined,
    });

    return {
      id: m.id,
      title: m.title,
      slug: m.slug,
      description: m.description,
      start_date: m.start_date.toISOString(),
      end_date: m.end_date ? m.end_date.toISOString() : null,
      city_name: m.cities?.name || 'Indonesia',
      city_image_url: m.cities?.image_url ? getPublicImageUrl(m.cities.image_url, 'cities') : null,
      latitude: m.cities?.latitude ? Number(m.cities.latitude) : null,
      longitude: m.cities?.longitude ? Number(m.cities.longitude) : null,
      images: m.images,
      cover_image: cover,
      members_count: m._count?.vibes_travel_meetup_members || m.current_member_count || 1,
      max_members: m.max_members,
      join_type: m.join_type || 'public',
      creator: {
        id: m.users?.id || 0,
        name: m.users?.name || 'Host Komunitas',
        username: m.users?.username || 'host',
        avatar_url: getPublicImageUrl(m.users?.avatar_url, 'users'),
        role: m.users?.role || null,
        is_verified: Boolean(m.users?.is_verified),
      },
    };
  });

  // Format Forum Threads
  const recentThreads: CommunityRecentThread[] = threadsRaw.map((th) => {
    const author = th.users_vibes_forum_threads_author_idTousers;
    const cleanSnippet = th.content
      ? th.content.replace(/<[^>]*>?/gm, '').slice(0, 140)
      : undefined;

    return {
      id: th.id,
      title: th.title,
      slug: th.slug,
      content_snippet: cleanSnippet,
      created_at: th.created_at ? th.created_at.toISOString() : null,
      reply_count: th._count?.vibes_forum_posts ?? th.reply_count ?? 0,
      like_count: th._count?.vibes_forum_thread_likes ?? th.like_count ?? 0,
      view_count: th.view_count || 0,
      is_pinned: Boolean(th.is_pinned),
      is_locked: Boolean(th.is_locked),
      category: th.vibes_forum_categories
        ? {
            id: th.vibes_forum_categories.id,
            name: th.vibes_forum_categories.name,
            slug: th.vibes_forum_categories.slug,
            icon: th.vibes_forum_categories.icon,
          }
        : null,
      author: {
        id: author?.id || 0,
        name: author?.name || 'Explorer',
        username: author?.username || 'user',
        avatar_url: getPublicImageUrl(author?.avatar_url, 'users'),
        role: author?.role || null,
        is_verified: Boolean(author?.is_verified),
        cityName: author?.cities?.name || null,
      },
    };
  });

  // Format Stories
  const recentStories: CommunityStoryItem[] = storiesRaw.map((st) => {
    const author = st.users_stories_author_idTousers;
    return {
      id: st.id,
      title: st.title,
      slug: st.slug,
      excerpt: st.excerpt,
      cover_image: getPublicImageUrl(st.cover_image, 'stories'),
      created_at: st.created_at ? st.created_at.toISOString() : null,
      reading_time: st.reading_time || 4,
      view_count: st.view_count || 0,
      like_count: st.like_count || 0,
      comment_count: st.comment_count || 0,
      is_featured: Boolean(st.is_featured),
      author: {
        id: author?.id || 0,
        name: author?.name || 'Traveler',
        username: author?.username || 'user',
        avatar_url: getPublicImageUrl(author?.avatar_url, 'users'),
        bio: author?.bio || null,
        role: author?.role || null,
        is_verified: Boolean(author?.is_verified),
        level: author?.user_xp?.current_level || 1,
      },
      cityName: st.cities?.name || null,
    };
  });

  // Format Reward Settings
  const settingsMap = new Map(rewardSettingsRaw.map((s) => [s.setting_key, s.setting_value]));
  const rewardSettings: CommunityRewardSettings = {
    ltpUsdRate: parseFloat(settingsMap.get('ltp_usd_rate') || '0.01'),
    minPayoutLtp: parseInt(settingsMap.get('min_payout_ltp') || '3000', 10),
    usdIdrRate: parseFloat(settingsMap.get('usd_idr_exchange_rate') || '15500'),
  };

  const forumCategories: CommunityCategoryOption[] = forumCategoriesRaw.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    icon: c.icon,
  }));

  const cities: CommunityCityOption[] = citiesRaw.map((c) => ({
    id: c.id,
    name: c.name,
  }));

  return (
    <div className="w-full min-h-screen bg-slate-50/50 py-8 sm:py-12">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <CommunityHubClient
          locale={locale}
          leaderboardUsers={leaderboardUsers}
          recentThreads={recentThreads}
          upcomingMeetups={upcomingMeetups}
          recentStories={recentStories}
          forumCategories={forumCategories}
          cities={cities}
          levelTiers={levelTiers}
          rewardSettings={rewardSettings}
          initialTab={initialTab}
        />
      </div>
    </div>
  );
}
