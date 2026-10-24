import React from 'react';
import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ChevronRight,
  Eye,
  Heart,
  MessageCircle,
  MapPin,
  Clock,
  CheckCircle2,
  Calendar,
  Compass,
  ArrowRight,
  Sparkles,
  Star,
  Users,
  MessageSquare,
  Share2,
  Flame,
} from 'lucide-react';
import { SafeImage } from '@/components/common/SafeImage';
import { UgcTranslateButton } from '@/components/community/UgcTranslateButton';
import { ShareButton } from '@/components/common/ShareModal';
import { ReportContentButton } from '@/components/community/ReportContentButton';
import { QuickFactsTable, StoryFaqAccordion } from '@/components/marketplace/StoryExtras';
import { StoryLikeButton } from '@/components/marketplace/StoryLikeButton';
import { FollowButton } from '@/components/shared/FollowButton';
import { UserSidebarCard } from '@/components/shared/UserSidebarCard';
import { getStoryLikeStatus } from '@/actions/stories';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCurrentUserSession } from '@/actions/bookings';
import { UserPersonaLink } from '@/components/common/UserPersonaLink';
import { StoryCommentsClient } from '@/components/marketplace/StoryCommentsClient';
import { ExperienceItem } from '@/actions/experiences';
import { getDictionary, Locale } from '@/lib/dictionary';
import TranslatableContent from '@/components/common/TranslatableContent';
import { getPublicImageUrl } from '@/lib/images';
import { SidebarUpcomingMeetups, SidebarMeetupItem } from '@/components/community/SidebarUpcomingMeetups';
import { SidebarRelatedExperiences, SidebarExperienceItem } from '@/components/community/SidebarRelatedExperiences';

interface StoryDetailPageProps {
  params: Promise<{
    lang: string;
    slug: string;
  }>;
}

export const dynamic = 'force-dynamic';

/**
 * Memastikan setiap path gambar lokal diawali dengan '/'
 * dan mendukung URL eksternal (http/https).
 */
export function normalizeImageUrl(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Jika sudah URL absolut (http://, https://, atau data:image)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  // Jika sudah diawali slash '/'
  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  // Jika belum ada slash, tambahkan '/' di awal (misal 'images/...' -> '/images/...')
  return `/${trimmed}`;
}

export function extractMediaImage(item: any, fallbackCity?: any): string {
  if (!item) {
    const cityFallback = normalizeImageUrl(fallbackCity?.image_url || fallbackCity?.cover_image);
    return cityFallback || '/images/placeholders/story-default.jpg';
  }

  // 1. Periksa properti string langsung
  const directFields = [
    item.cover_image,
    item.image_url,
    item.thumbnail_url,
    item.cover,
    item.photo_url,
    item.image,
  ];

  for (const field of directFields) {
    if (typeof field === 'string' && field.trim() !== '') {
      const normalized = normalizeImageUrl(field);
      if (normalized) return normalized;
    }
  }

  // 2. Periksa properti array/JSON (media, images, photos)
  const mediaContainers = [item.media, item.images, item.photos];

  for (let media of mediaContainers) {
    if (!media) continue;

    // Jika tersimpan sebagai string JSON
    if (typeof media === 'string') {
      try {
        media = JSON.parse(media);
      } catch (_) {
        // Jika ternyata string URL biasa
        const normalized = normalizeImageUrl(media);
        if (normalized) return normalized;
      }
    }

    if (Array.isArray(media) && media.length > 0) {
      const first = media[0];
      if (typeof first === 'string') {
        const normalized = normalizeImageUrl(first);
        if (normalized) return normalized;
      }
      if (typeof first === 'object' && first !== null) {
        const objUrl = first.url || first.path || first.src || first.image_url;
        if (typeof objUrl === 'string') {
          const normalized = normalizeImageUrl(objUrl);
          if (normalized) return normalized;
        }
      }
    }
  }

  // 3. Fallback ke relasi kota dari DB
  const cityUrl = normalizeImageUrl(item.cities?.image_url || fallbackCity?.image_url);
  if (cityUrl) return cityUrl;

  // 4. Fallback aset lokal aman
  return '/images/placeholders/story-default.jpg';
}

async function getStoryBySlugOrId(slugOrId: string, shouldIncrementView: boolean = false) {
  const asId = parseInt(slugOrId, 10);

  // 1. Coba cari berdasarkan slug jika bukan angka murni, atau fallback ke id
  const story = await prisma.stories.findFirst({
    where: {
      OR: [
        { slug: slugOrId },
        ...(!isNaN(asId) ? [{ id: asId }] : []),
      ],
      is_active: true,
    },
    include: {
      users_stories_author_idTousers: {
        select: {
          id: true,
          name: true,
          username: true,
          avatar_url: true,
          bio: true,
          role: true,
          is_verified: true,
          cities: {
            select: { id: true, name: true },
          },
          host_kyc_host_kyc_user_idTousers: {
            select: { status: true },
          },
          user_xp: {
            select: {
              total_xp: true,
              current_level: true,
            },
          },
        },
      },
      cities: {
        select: {
          id: true,
          name: true,
          image_url: true,
          countries: {
            select: { id: true, name: true, code: true },
          },
        },
      },
      story_comments: {
        where: { is_approved: true },
        take: 30,
        orderBy: { created_at: 'desc' },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar_url: true,
              is_verified: true,
              user_xp: {
                select: {
                  total_xp: true,
                  current_level: true,
                },
              },
            },
          },
        },
      },
      _count: {
        select: {
          story_likes: true,
          story_comments: true,
        },
      },
    },
  });

  if (story && shouldIncrementView) {
    try {
      await prisma.stories.update({
        where: { id: story.id },
        data: {
          view_count: {
            increment: 1,
          },
        },
      });
      story.view_count = (story.view_count || 0) + 1;
    } catch (err) {
      console.error('Error incrementing view_count:', err);
    }
  }

  return story;
}

export async function generateMetadata({
  params,
}: StoryDetailPageProps): Promise<Metadata> {
  const resolved = await params;
  const lang = resolved.lang === 'en' ? 'en' : 'id';
  const slug = resolved.slug;

  const story = await getStoryBySlugOrId(slug);
  if (!story) {
    return {
      title: 'Cerita Perjalanan | Locallytrip',
      description: 'Temukan kisah perjalanan otentik dari warga lokal terpercaya di Indonesia.',
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://locallytrip.com';
  const canonicalUrl = `${siteUrl}/${lang}/stories/${story.slug || story.id}`;
  const authorName = story.users_stories_author_idTousers?.name || 'Local Community Member';
  const resolvedCover = getPublicImageUrl(story.cover_image, 'stories');
  const coverImageUrl = resolvedCover.startsWith('http') ? resolvedCover : `${siteUrl}${resolvedCover}`;

  // Title Tag: Batasi maksimal 60 karakter agar tidak terpotong di SERP
  const rawTitle = story.title.trim();
  const title =
    rawTitle.length > 45
      ? `${rawTitle.slice(0, 44)}… | Locallytrip`
      : `${rawTitle} | Locallytrip`;

  // Meta Description: Batasi maksimal 155-160 karakter
  const rawDesc =
    story.excerpt ||
    story.meta_description ||
    story.content.slice(0, 200).replace(/\r?\n|\r/g, ' ').replace(/\s+/g, ' ').trim();

  const description =
    rawDesc.length > 158 ? `${rawDesc.slice(0, 155)}…` : rawDesc;

  // Parse keywords / tags
  const rawTags = Array.isArray(story.tags)
    ? (story.tags as string[])
    : typeof story.tags === 'string'
    ? JSON.parse(story.tags || '[]')
    : [];

  const rawKeywords = Array.isArray(story.keywords)
    ? (story.keywords as string[])
    : typeof story.keywords === 'string'
    ? JSON.parse(story.keywords || '[]')
    : [];

  const combinedKeywords = Array.from(
    new Set([
      ...rawTags,
      ...rawKeywords,
      story.cities?.name || '',
      'Locallytrip',
      'Locallytrip Stories',
      'Travel Guide Indonesia',
    ].filter(Boolean))
  );

  return {
    title,
    description,
    keywords: combinedKeywords,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'id-ID': `${siteUrl}/id/stories/${story.slug || story.id}`,
        'en-US': `${siteUrl}/en/stories/${story.slug || story.id}`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Locallytrip',
      type: 'article',
      publishedTime: new Date(story.created_at).toISOString(),
      authors: [authorName],
      images: [
        {
          url: coverImageUrl,
          width: 1200,
          height: 630,
          alt: story.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [coverImageUrl],
    },
  };
}

export default async function StoryDetailPage({ params }: StoryDetailPageProps) {
  const resolved = await params;
  const locale = (resolved.lang === 'en' ? 'en' : 'id') as Locale;
  const dict = await getDictionary(locale);

  // Ambil data dengan pemicu increment view_count saat halaman diakses pengunjung
  const story = await getStoryBySlugOrId(resolved.slug, true);
  if (!story) notFound();

  // Query paralel: Status like, Sesi pengguna, Level tiers, Cerita lain karya author, Cerita terpopuler, Meetup terkini, Thread forum terkait, & Featured experiences
  const [
    likeStatus,
    nextAuthSession,
    rawSession,
    levelTiers,
    rawAuthorOtherStories,
    dbRewardRule,
    trendingStories,
    meetupsRaw,
    rawRelatedThreads,
    experiencesRaw,
  ] = await Promise.all([
    getStoryLikeStatus(story.id),
    getServerSession(authOptions).catch(() => null),
    getCurrentUserSession().catch(() => null),
    prisma.reward_level_tiers.findMany({
      where: { is_active: true },
      orderBy: { min_xp: 'desc' },
    }),
    story.author_id
      ? prisma.stories.findMany({
          where: {
            author_id: story.author_id,
            id: { not: story.id },
            is_active: true,
          },
          take: 3,
          orderBy: { created_at: 'desc' },
          select: {
            id: true,
            title: true,
            slug: true,
            cover_image: true,
            created_at: true,
          },
        })
      : Promise.resolve([]),
    prisma.reward_action_rules
      .findUnique({
        where: { action_code: 'FORUM_REPLY' },
      })
      .catch(() => null),
    prisma.stories.findMany({
      where: {
        id: { not: story.id },
        is_active: true,
      },
      take: 4,
      orderBy: [{ view_count: 'desc' }, { like_count: 'desc' }],
      select: {
        id: true,
        title: true,
        slug: true,
        cover_image: true,
        created_at: true,
        reading_time: true,
        cities: {
          select: { name: true, image_url: true },
        },
      },
    }),
    prisma.vibes_travel_meetups.findMany({
      where: {
        status: { in: ['active', 'published'] },
        deleted_at: null,
      },
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
    }).catch(() => []),
    prisma.vibes_forum_threads.findMany({
      where: {
        status: { in: ['active', 'published'] },
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
    }).catch(() => []),
    prisma.experiences.findMany({
      where: {
        status: 'published',
        is_active: true,
      },
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
    }).catch(() => []),
  ]);

  let currentUserId: number | null = null;
  if (nextAuthSession?.user?.email) {
    const dbUser = await prisma.users.findUnique({
      where: { email: nextAuthSession.user.email },
      select: { id: true },
    });
    if (dbUser) currentUserId = dbUser.id;
  } else if (rawSession?.isLoggedIn && rawSession.id) {
    currentUserId = rawSession.id;
  }

  // Cek relasi follow author
  let authorIsFollowing = false;
  if (currentUserId && story.author_id && currentUserId !== story.author_id) {
    const followRecord = await prisma.user_follows.findUnique({
      where: {
        follower_id_following_id: {
          follower_id: currentUserId,
          following_id: story.author_id,
        },
      },
      select: { id: true },
    }).catch(() => null);
    authorIsFollowing = Boolean(followRecord);
  }

  const currentUser = rawSession
    ? {
        id: Number(rawSession.id),
        name: rawSession.name || 'Traveler',
        email: rawSession.email || '',
        isLoggedIn: true,
      }
    : null;

  const commentRewardXP = dbRewardRule?.xp_reward || 10;

  // Format Sidebar Data persis seperti Forum Detail
  const featuredExperiences: SidebarExperienceItem[] = experiencesRaw.map((exp) => ({
    id: exp.id,
    title: locale === 'id' && exp.title_id ? exp.title_id : exp.title,
    slug: exp.slug || String(exp.id),
    price: exp.package_price ? Number(exp.package_price) : 0,
    currency: exp.currency,
    rating: exp.rating_average ? Number(exp.rating_average) : 4.9,
    review_count: exp.rating_count || 0,
    image: getPublicImageUrl(exp.images, 'experiences'),
    cityName: exp.cities?.name || null,
    categoryName: exp.experience_types?.name || null,
  }));

  const upcomingMeetups: SidebarMeetupItem[] = meetupsRaw.map((m) => ({
    id: m.id,
    title: m.title,
    slug: m.slug || String(m.id),
    start_date: m.start_date.toISOString(),
    end_date: m.end_date ? m.end_date.toISOString() : null,
    max_members: m.max_members,
    current_member_count: m.current_member_count ?? m._count?.vibes_travel_meetup_members ?? 1,
    cityName: m.cities?.name || null,
  }));

  const relatedThreads = rawRelatedThreads.map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    reply_count: r.reply_count || 0,
    like_count: r.like_count || 0,
    view_count: r.view_count || 0,
  }));

  const author = story.users_stories_author_idTousers;
  const authorName = author?.name || author?.username || 'Local Insider';
  const authorLevel = author?.user_xp?.current_level || 1;
  const authorTotalXp = author?.user_xp?.total_xp || 0;

  // Cocokkan Tier Badge Penulis dari reward_level_tiers
  const matchedTier =
    levelTiers.find((tier) => authorTotalXp >= tier.min_xp) ||
    levelTiers[levelTiers.length - 1];

  const authorTierName = matchedTier
    ? locale === 'en'
      ? matchedTier.name_en
      : matchedTier.name_id
    : `Level ${authorLevel}`;
  const authorTierBadgeIcon = matchedTier?.badge_icon || '⚡';

  const coverImageUrl = getPublicImageUrl(story.cover_image, 'stories');

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://locallytrip.com';
  const canonicalUrl = `${siteUrl}/${locale}/stories/${story.slug || story.id}`;

  const t = dict.stories_page || {
    breadcrumb_home: 'Beranda',
    breadcrumb_stories: 'Cerita Petualang',
    read_time: 'menit baca',
    by: 'Oleh',
    share_title: 'Bagikan Cerita Ini',
    copy_link: 'Salin Tautan',
    link_copied: 'Tautan berhasil disalin!',
    comments_title: 'Komentar & Diskusi',
    no_comments: 'Belum ada komentar di cerita ini. Jadilah yang pertama memberikan tanggapan!',
    like_story: 'Sukai Cerita',
    community_author: 'Penulis Komunitas',
  };

  // Parse tags dari field tags atau keywords di database
  const storyTags: string[] = Array.isArray(story.tags)
    ? (story.tags as string[])
    : typeof story.tags === 'string'
    ? JSON.parse(story.tags || '[]')
    : Array.isArray(story.keywords)
    ? (story.keywords as string[])
    : typeof story.keywords === 'string'
    ? JSON.parse(story.keywords || '[]')
    : [];

  // Skema JSON-LD terstruktur (BreadcrumbList & BlogPosting) untuk GEO & AEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: t.breadcrumb_home || (locale === 'en' ? 'Home' : 'Beranda'),
            item: `${siteUrl}/${locale}`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: t.breadcrumb_stories || (locale === 'en' ? 'Stories' : 'Cerita Petualang'),
            item: `${siteUrl}/${locale}/stories`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: story.title,
            item: canonicalUrl,
          },
        ],
      },
      {
        '@type': 'BlogPosting',
        headline: story.title,
        description: story.excerpt || story.content.slice(0, 160),
        image: [coverImageUrl.startsWith('http') ? coverImageUrl : `${siteUrl}${coverImageUrl}`],
        datePublished: new Date(story.created_at).toISOString(),
        dateModified: new Date(story.updated_at || story.created_at).toISOString(),
        author: {
          '@type': 'Person',
          name: authorName,
          url: `${siteUrl}/${locale}/users/${author?.username || author?.id || 1}`,
          sameAs: [`${siteUrl}/${locale}/users/${author?.username || author?.id || 1}`],
        },
        publisher: {
          '@type': 'Organization',
          name: 'PT Locallytrip Teknologi Indonesia',
          logo: {
            '@type': 'ImageObject',
            url: `${siteUrl}/images/locallytrip-logo.png`,
          },
        },
        ...(story.cities
          ? {
              contentLocation: {
                '@type': 'Place',
                name: story.cities.name,
                addressCountry: 'ID',
              },
            }
          : {}),
        interactionStatistic: [
          {
            '@type': 'InteractionCounter',
            interactionType: 'https://schema.org/ReadAction',
            userInteractionCount: story.view_count || 0,
          },
          {
            '@type': 'InteractionCounter',
            interactionType: 'https://schema.org/LikeAction',
            userInteractionCount: story._count?.story_likes ?? story.like_count ?? 0,
          },
          {
            '@type': 'InteractionCounter',
            interactionType: 'https://schema.org/CommentAction',
            userInteractionCount: story._count?.story_comments ?? story.comment_count ?? story.story_comments.length,
          },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name:
              locale === 'en'
                ? `What is the most peaceful time to explore ${story.cities?.name || 'this route'}?`
                : `Kapan waktu paling tenang untuk mengunjungi ${story.cities?.name || 'rute ini'}?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text:
                locale === 'en'
                  ? 'Early morning between 08:00 AM and 10:30 AM is ideal. The alleys are calm, local vendors are just setting up with fresh morning dishes, and the natural morning light offers unobstructed photo spots before midday crowds.'
                  : 'Pagi hari antara pukul 08:00 hingga 10:30 adalah waktu paling ideal. Lorong-lorong masih tenang, udara belum terlalu terik, pedagang lokal baru menyajikan sajian sarapan segar, dan pencahayaan pagi sangat cantik untuk dokumentasi perjalanan.',
            },
          },
          {
            '@type': 'Question',
            name:
              locale === 'en'
                ? 'Is this walking route family-friendly and accessible for beginners?'
                : 'Apakah rute jalan kaki ini ramah keluarga dan pemula?',
            acceptedAnswer: {
              '@type': 'Answer',
              text:
                locale === 'en'
                  ? 'Yes! The route consists primarily of paved pedestrian pathways, shaded alleys, and clearly marked transit stops. It is very suitable for families, casual strollers, and solo travelers wearing comfortable walking sneakers.'
                  : 'Ya, sangat ramah! Jalur ini didominasi oleh trotoar pejalan kaki beraspal, lorong rindang, dan dekat dengan akses transit transportasi publik. Sangat cocok dinikmati bersama keluarga maupun pemula dengan mengenakan sepatu jalan yang nyaman.',
            },
          },
        ],
      },
    ],
  };

  const formattedPublishedDate = new Date(story.created_at).toLocaleDateString(
    locale === 'id' ? 'id-ID' : 'en-US',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }
  );

  const formattedUpdatedDate = new Date(story.updated_at || story.created_at).toLocaleDateString(
    locale === 'id' ? 'id-ID' : 'en-US',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }
  );

  return (
    <div className="w-full min-h-screen bg-slate-50/50">
      {/* Skema Data Terstruktur JSON-LD untuk AEO & GEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {/* 1. Breadcrumb Hierarkis Terpadu */}
        <nav aria-label="Breadcrumb" className="mb-8 flex items-center flex-wrap gap-2 text-xs font-medium text-slate-500">
          <Link
            href={`/${locale}`}
            className="hover:text-purple-600 transition flex items-center gap-1 text-slate-600"
          >
            {t.breadcrumb_home}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <Link
            href={`/${locale}/stories`}
            className="hover:text-purple-600 transition text-slate-600"
          >
            {t.breadcrumb_stories}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <span className="text-purple-700 font-semibold truncate max-w-xs sm:max-w-md">
            {story.title}
          </span>
        </nav>

        {/* 2. Main 2-Column Grid Container (Sejajar Header max-w-7xl) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ======================================================== */}
          {/* KOLOM KIRI (lg:col-span-8): KONTEN UTAMA ARTIKEL CERITA */}
          {/* ======================================================== */}
          <main className="lg:col-span-8 space-y-8">
            <article className="w-full bg-white rounded-3xl border border-slate-100 shadow-xs p-6 sm:p-10 space-y-8">
            {/* Header Meta: Kategori & Kota */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="font-bold text-purple-700 bg-purple-50 border border-purple-100 px-3 py-1 rounded-full uppercase tracking-wider">
                📖 {t.badge || (locale === 'en' ? 'Travel Field Notes' : 'Jurnal Perjalanan')}
              </span>

              {story.cities && (
                <div className="flex items-center gap-1.5 font-bold text-slate-600 bg-slate-100/80 px-3 py-1 rounded-full">
                  <MapPin className="w-3.5 h-3.5 text-purple-600" />
                  <span>{story.cities.name}</span>
                </div>
              )}
            </div>

            {/* Judul Besar Editorial (Satu-satunya Tag H1 Semantik) */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-slate-900 leading-tight tracking-tight">
              {story.title}
            </h1>

            {/* Excerpt / Lead Paragraph */}
            {story.excerpt && (
              <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed italic border-l-4 border-purple-600 pl-4 bg-purple-50/50 py-3 rounded-r-2xl">
                &quot;{story.excerpt}&quot;
              </p>
            )}

            {/* Byline Penulis Editorial Menggunakan UserPersonaLink */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-slate-100">
              {author && (
                <UserPersonaLink
                  user={{
                    id: author.id,
                    name: author.name,
                    username: author.username,
                    avatar_url: author.avatar_url,
                  }}
                  locale={locale}
                  variant="full"
                  size="md"
                  subtitle={
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span className="flex items-center gap-1 text-slate-600 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-purple-600" />
                        <span>{formattedPublishedDate}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {story.reading_time || 4} {t.read_time}
                      </span>
                      {authorTierName && (
                        <>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.2 rounded-full bg-purple-100 text-purple-800 border border-purple-200/60">
                            {authorTierBadgeIcon} {authorTierName}
                          </span>
                        </>
                      )}
                    </div>
                  }
                />
              )}

              {/* Metrik Engagement Pembaca & Tombol Suka Interaktif */}
              <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-100 text-slate-600" title="Total Views">
                  <Eye className="w-4 h-4 text-slate-400" />
                  <span>{story.view_count || 0}</span>
                  <span className="text-[11px] text-slate-400 hidden sm:inline">views</span>
                </span>

                {/* Tombol Like Interaktif Client Component */}
                <StoryLikeButton
                  storyId={story.id}
                  initialLikes={story._count?.story_likes ?? story.like_count ?? 0}
                  initialIsLiked={likeStatus.isLiked}
                  lang={locale}
                />

                <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-100 text-slate-600" title="Total Comments">
                  <MessageCircle className="w-4 h-4 text-slate-400" />
                  <span>{story._count?.story_comments ?? story.comment_count ?? story.story_comments.length}</span>
                  <span className="text-[11px] text-slate-400 hidden sm:inline">komentar</span>
                </span>

                <ReportContentButton
                  targetType="story"
                  targetId={story.id}
                  targetTitle={story.title}
                  lang={locale}
                  variant="pill"
                />
              </div>
            </div>

            {/* Foto Sampul Utama Rasio 16:9 Beresolusi Tinggi */}
            <figure className="relative rounded-3xl overflow-hidden aspect-[16/9] bg-slate-900 m-0 shadow-lg border border-slate-100">
              <img
                src={coverImageUrl}
                alt={story.title}
                width={1200}
                height={675}
                className="w-full h-full object-cover"
              />
              <figcaption className="sr-only">
                Foto dokumentasi perjalanan otentik di {story.cities?.name || 'Indonesia'} - {story.title}
              </figcaption>
            </figure>

            {/* QuickFactsTable (AI Search Readiness: Extractable Facts Table) */}
            <QuickFactsTable
              readingTime={story.reading_time}
              cityName={story.cities?.name}
              countryName={story.cities?.countries?.name}
              countryCode={story.cities?.countries?.code}
              lang={locale}
            />

            {/* Isi Konten Artikel Editorial & Tipografi Membaca Nyaman */}
            <div className="w-full space-y-6 pt-2">
              <TranslatableContent
                content={story.content}
                targetLang={locale}
                isMarkdown={true}
                buttonPosition="top"
                showStatusBadge={true}
              />

              {/* Kapsul Tag / Keywords Cerita dari Database */}
              {storyTags.length > 0 && (
                <div className="pt-6 border-t border-slate-100 space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    {dict.stories?.relatedTags || (locale === 'en' ? 'RELATED TOPICS:' : 'TAG & TOPIK TERKAIT:')}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {storyTags.map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-700 rounded-full text-xs font-medium transition cursor-default"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Micro-Banner Standar Editorial & Pedoman Komunitas */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0" />
                  <p>
                    {dict.stories?.editorialNotice || (locale === 'en' ? 'This story is curated and verified in accordance with' : 'Cerita ini dikurasi dan diverifikasi sesuai')}{' '}
                    <strong className="font-semibold text-slate-800">
                      {dict.stories?.editorialStandard || (locale === 'en' ? 'PT Locallytrip Teknologi Indonesia Community & Editorial Guidelines.' : 'Standar Pedoman Komunitas & Editorial PT Locallytrip Teknologi Indonesia.')}
                    </strong>
                  </p>
                </div>
                <Link
                  href={`/${locale}/editorial-guidelines`}
                  className="inline-flex items-center gap-1 font-semibold text-purple-700 hover:text-purple-800 shrink-0 hover:underline"
                >
                  <span>{dict.stories?.editorialLink || (locale === 'en' ? 'Editorial Guidelines' : 'Pedoman Editorial')}</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            {/* Baris Berbagi Elegan (Satu Tombol Tunggal Share the Vibe ✨ - Bagian Bawah Artikel) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-purple-50/70 via-violet-50/40 to-slate-50 border border-purple-100">
              <div className="text-center sm:text-left space-y-0.5">
                <h4 className="text-sm font-bold text-purple-950">
                  {locale === 'en' ? 'Inspire your travel community! 🌍' : 'Beri inspirasi ke sesama traveler! 🌍'}
                </h4>
                <p className="text-xs text-slate-500">
                  {locale === 'en'
                    ? 'Share this story to your favourite social platforms in one click.'
                    : 'Bagikan cerita otentik ini ke media sosial favoritmu dalam sekali klik.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <ShareButton
                  lang={locale}
                  data={{
                    title: story.title,
                    summary: story.excerpt || '',
                    coverImage: coverImageUrl,
                    categoryBadge: '📖 Travel Story',
                    slug: story.slug || String(story.id),
                    pathType: 'stories',
                    url: `/${locale}/stories/${story.slug || story.id}`,
                  }}
                  label={locale === 'en' ? 'Share the Vibe ✨' : 'Bagikan Cerita Ini ✨'}
                />

                <ReportContentButton
                  targetType="story"
                  targetId={story.id}
                  targetTitle={story.title}
                  lang={locale}
                  variant="subtle"
                  className="bg-white/80 border border-purple-200/60 shadow-xs"
                />
              </div>
            </div>
          </article>

          {/* AI Search Readiness: Seksi FAQ Khusus Story */}
          <StoryFaqAccordion lang={locale} cityName={story.cities?.name} />

          {/* Seksi Komentar & Diskusi dengan Gamifikasi Insentif Komunitas */}
          <StoryCommentsClient
            storyId={story.id}
            initialComments={story.story_comments.map((sc) => ({
              id: sc.id,
              story_id: story.id,
              user_id: sc.user_id,
              content: sc.content,
              created_at: sc.created_at,
              users: sc.users
                ? {
                    id: sc.users.id,
                    name: sc.users.name,
                    username: sc.users.username,
                    avatar_url: sc.users.avatar_url,
                    is_verified: sc.users.is_verified,
                    user_xp: sc.users.user_xp,
                  }
                : null,
            }))}
            locale={locale}
            currentUser={currentUser}
            rewardXP={commentRewardXP}
          />
        </main>

        {/* ======================================================== */}
        {/* KOLOM KANAN (lg:col-span-4): SIDEBAR INFORMATIF STICKY */}
        {/* ======================================================== */}
        <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          
          {/* 1. Kartu Profil Penulis */}
          {author && (
            <UserSidebarCard
              user={{
                id: author.id,
                name: author.name,
                username: author.username,
                avatar_url: author.avatar_url,
                role: author.role,
                is_verified: author.is_verified,
                level: authorLevel,
                total_xp: authorTotalXp,
                bio: author.bio,
                host_kyc_host_kyc_user_idTousers: (author as any).host_kyc_host_kyc_user_idTousers,
              }}
              lang={locale}
              initialIsFollowing={authorIsFollowing}
              currentUserId={currentUserId}
            />
          )}

          {/* 2. Widget Gamifikasi (Apresiasi LTP & Tingkatkan XP) */}
          <div className="bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-950 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden space-y-4">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-violet-500/20 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center gap-2">
              <span className="text-2xl">🪙</span>
              <div>
                <h3 className="font-bold text-sm tracking-wide text-amber-300">
                  {locale === 'id' ? 'Apresiasi LTP & Tingkatan XP' : 'LTP Rewards & XP Levels'}
                </h3>
                <p className="text-[11px] text-violet-200">
                  {locale === 'id' ? 'Ekosistem Komunitas Aktif' : 'Active Traveler Ecosystem'}
                </p>
              </div>
            </div>

            <p className="text-xs text-violet-100 leading-relaxed">
              {locale === 'id'
                ? 'Dapatkan 10 XP untuk setiap interaksi berkualitas dan raih bonus LTP Coin yang dapat digunakan untuk diskon booking tur lokal atau apresiasi sesama explorer!'
                : 'Earn 10 XP for high-value interactions and collect LTP Coins for discounts on local tour packages or tipping inspiring travelers!'}
            </p>

            <div className="grid grid-cols-2 gap-2.5 pt-1 text-center">
              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10">
                <span className="block text-lg font-bold text-amber-300">⚡ +10 XP</span>
                <span className="text-[10px] text-violet-200">
                  {locale === 'id' ? 'Per Tanggapan' : 'Per Response'}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10">
                <span className="block text-lg font-bold text-amber-300">🪙 Tip LTP</span>
                <span className="text-[10px] text-violet-200">
                  {locale === 'id' ? 'Dukungan Komunitas' : 'Community Support'}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Meetup Terkini */}
          {upcomingMeetups.length > 0 && (
            <SidebarUpcomingMeetups meetups={upcomingMeetups} lang={locale} />
          )}

          {/* 4. Aktivitas Lokal Populer (Experiences) */}
          {featuredExperiences.length > 0 && (
            <SidebarRelatedExperiences experiences={featuredExperiences} lang={locale} />
          )}

          {/* 5. Diskusi Populer / Cerita Terkait */}
          {relatedThreads.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base font-serif">
                <Flame className="w-5 h-5 text-amber-500" />
                <span>
                  {locale === 'id' ? 'Diskusi Populer Terkait' : 'Related Discussions'}
                </span>
              </div>

              <div className="space-y-3">
                {relatedThreads.map((item) => (
                  <Link
                    key={item.id}
                    href={`/${locale}/community/forums/${item.slug || item.id}`}
                    className="block p-3.5 rounded-2xl bg-slate-50/70 hover:bg-violet-50/80 border border-slate-100 hover:border-violet-200 transition group"
                  >
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-violet-700 line-clamp-2 leading-snug">
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3 text-slate-400" />
                        <span>{item.reply_count}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3 text-slate-400" />
                        <span>{item.view_count}</span>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

        </aside>
        </div>
      </div>
    </div>
  );
}
