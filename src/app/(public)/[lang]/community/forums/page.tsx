import React, { Suspense } from 'react';
import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import { ForumsClient, ForumCategoryOption, ForumCityOption, CurrentUserSessionData } from '@/components/community/ForumsClient';
import { getDictionary, Locale } from '@/lib/dictionary';
import { getCurrentUserSession } from '@/actions/bookings';
import { ForumThreadCardItem } from '@/components/community/ForumCard';

interface ForumsPageProps {
  params: Promise<{
    lang: string;
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
  const canonicalUrl = `${siteUrl}/${lang}/community/forums`;

  const title = isId
    ? 'Forum Komunitas & Tips Wisata Lokal | Locallytrip'
    : 'Travel Discussion & Local Tips Forums | Locallytrip';

  const description = isId
    ? 'Ruang diskusi hangat & tanya jawab seputar rute wisata, hidden gems, dan rekomendasi otentik bersama warga lokal terpercaya di Indonesia.'
    : 'Ask questions, discover authentic travel routes, and exchange honest local recommendations with verified community guides in Indonesia.';

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'id-ID': `${siteUrl}/id/community/forums`,
        'en-US': `${siteUrl}/en/community/forums`,
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
          url: `${siteUrl}/images/hero-forums.png`,
          width: 1200,
          height: 630,
          alt: 'Locallytrip Community Forums',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${siteUrl}/images/hero-forums.png`],
    },
  };
}

export default async function ForumsPage({ params }: ForumsPageProps) {
  const resolvedParams = await params;
  const locale = (resolvedParams.lang === 'en' ? 'en' : 'id') as Locale;

  const dict = await getDictionary(locale);

  // Kueri data riil dari PostgreSQL menggunakan Promise.all
  const [
    threadsRaw,
    totalThreads,
    categoriesRaw,
    citiesRaw,
    forumRewardRule,
    rawSession,
    experiencesRaw,
    meetupsRaw,
  ] = await Promise.all([
    // 1. Thread Diskusi Forum Aktif
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
            user_xp: true,
            cities: { select: { id: true, name: true } },
            host_kyc_host_kyc_user_idTousers: { select: { status: true } },
          },
        },
        _count: {
          select: {
            vibes_forum_posts: true,
          },
        },
      },
      orderBy: [
        { is_pinned: 'desc' },
        { created_at: 'desc' },
      ],
      take: 15,
    }),

    // Total hitungan thread aktif
    prisma.vibes_forum_threads.count({
      where: {
        status: 'active',
        deleted_at: null,
      },
    }),

    // 2. Daftar Kategori Forum Aktif
    prisma.vibes_forum_categories.findMany({
      where: { is_active: true },
      orderBy: { display_order: 'asc' },
    }),

    // 3. Daftar Kota untuk Dropdown
    prisma.cities.findMany({
      where: { is_active: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),

    // 4. Aturan Gamifikasi Pembuatan Thread (+25 XP & +5 LTP)
    prisma.reward_action_rules.findFirst({
      where: { action_code: { in: ['FORUM_TOPIC_CREATE', 'FORUM_CREATE_THREAD'] } },
      select: { xp_reward: true, ltp_reward: true },
    }),

    // Sesi pengguna aktif
    getCurrentUserSession().catch(() => null),

    // Rekomendasi Featured Experiences untuk Sidebar
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

    // Rekomendasi Upcoming Meetups untuk Sidebar
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

  // Transformasi Thread Diskusi
  const threads: ForumThreadCardItem[] = threadsRaw.map((th) => {
    const author = th.users_vibes_forum_threads_author_idTousers;
    return {
      id: th.id,
      title: th.title,
      slug: th.slug,
      content: th.content,
      is_pinned: th.is_pinned,
      is_locked: th.is_locked,
      is_featured: th.is_featured,
      view_count: th.view_count,
      reply_count: th.reply_count,
      like_count: th.like_count,
      dislike_count: th.dislike_count,
      net_votes: (th.like_count || 0) - (th.dislike_count || 0),
      created_at: th.created_at ? th.created_at.toISOString() : null,
      images: th.images,
      category: th.vibes_forum_categories
        ? {
            id: th.vibes_forum_categories.id,
            name: th.vibes_forum_categories.name,
            slug: th.vibes_forum_categories.slug,
            icon: th.vibes_forum_categories.icon,
          }
        : null,
      author: {
        id: author.id,
        name: author.name,
        username: author.username,
        avatar_url: author.avatar_url,
        role: author.role,
        is_verified: author.is_verified,
        level: author.user_xp?.current_level || 1,
        cityName: author.cities?.name || null,
        cities: author.cities,
        host_kyc_status: author.host_kyc_host_kyc_user_idTousers?.status || null,
      },
      _count: {
        vibes_forum_posts: th._count?.vibes_forum_posts ?? th.reply_count ?? 0,
      },
    };
  });

  const categories: ForumCategoryOption[] = categoriesRaw.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    icon: cat.icon,
  }));

  const cities: ForumCityOption[] = citiesRaw.map((c) => ({
    id: c.id,
    name: c.name,
  }));

  const featuredExperiences = experiencesRaw.map((exp) => {
    let img = '/images/hero/destinasi-hero.jpg';
    if (Array.isArray(exp.images) && exp.images.length > 0 && typeof exp.images[0] === 'string') {
      img = exp.images[0].startsWith('http') || exp.images[0].startsWith('/')
        ? exp.images[0]
        : `/images/experiences/${exp.images[0]}`;
    }

    return {
      id: exp.id,
      title: locale === 'id' && exp.title_id ? exp.title_id : exp.title,
      slug: exp.slug || String(exp.id),
      price: exp.package_price ? Number(exp.package_price) : 0,
      currency: exp.currency,
      rating: exp.rating_average ? Number(exp.rating_average) : 4.9,
      review_count: exp.rating_count || 0,
      image: img,
      cityName: exp.cities?.name || null,
      categoryName: exp.experience_types?.name || null,
    };
  });

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

  const currentUser: CurrentUserSessionData | null = rawSession
    ? {
        id: rawSession.id,
        name: rawSession.name,
        email: rawSession.email,
        isLoggedIn: rawSession.isLoggedIn,
      }
    : null;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://locallytrip.com';
  const pageUrl = `${siteUrl}/${locale}/community/forums`;

  // Skema JSON-LD Terstruktur (BreadcrumbList & CollectionPage)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: locale === 'en' ? 'Home' : 'Beranda',
            item: `${siteUrl}/${locale}`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: locale === 'en' ? 'Community' : 'Komunitas',
            item: `${siteUrl}/${locale}/community`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: locale === 'en' ? 'Forums' : 'Forum Diskusi',
            item: pageUrl,
          },
        ],
      },
      {
        '@type': 'CollectionPage',
        '@id': pageUrl,
        url: pageUrl,
        name: locale === 'en' ? 'Travel Community Discussion Forums' : 'Forum Diskusi Perjalanan & Komunitas',
        description:
          locale === 'en'
            ? 'Connect with verified local hosts and fellow travelers for authentic travel itineraries and recommendations.'
            : 'Terhubung langsung dengan pemandu lokal terpercaya dan sesama traveler untuk rekomendasi rute otentik.',
        mainEntity: threads.slice(0, 5).map((th) => ({
          '@type': 'DiscussionForumPosting',
          '@id': `${siteUrl}/${locale}/community/forums/${th.slug || th.id}`,
          headline: th.title,
          articleBody: th.content.slice(0, 200),
          datePublished: th.created_at,
          author: {
            '@type': 'Person',
            name: th.author.name || th.author.username || 'Traveler',
          },
          interactionStatistic: [
            {
              '@type': 'InteractionCounter',
              interactionType: 'https://schema.org/LikeAction',
              userInteractionCount: th.net_votes || 0,
            },
            {
              '@type': 'InteractionCounter',
              interactionType: 'https://schema.org/CommentAction',
              userInteractionCount: th._count?.vibes_forum_posts || 0,
            },
          ],
        })),
      },
    ],
  };

  return (
    <div className="w-full min-h-screen bg-slate-50/50 py-8 sm:py-12">
      {/* Skema Terstruktur JSON-LD untuk SEO, AEO, & GEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        <Suspense fallback={<div className="min-h-[400px] flex items-center justify-center text-slate-400">Loading forums...</div>}>
          <ForumsClient
            initialThreads={threads}
            initialHasMore={totalThreads > threads.length}
            totalThreads={totalThreads}
            categories={categories}
            cities={cities}
            rewardRule={forumRewardRule}
            featuredExperiences={featuredExperiences}
            upcomingMeetups={upcomingMeetups}
            locale={locale}
            dict={dict}
            currentUser={currentUser}
          />
        </Suspense>
      </div>
    </div>
  );
}
