import React from 'react';
import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import { enum_stories_status } from '@prisma/client';
import { StoriesCatalog, CityFilterItem, CurrentUserSessionData } from '@/components/stories/StoriesCatalog';
import { StoryItem } from '@/components/stories/StoryCard';
import { getDictionary, Locale } from '@/lib/dictionary';
import { getCurrentUserSession } from '@/actions/bookings';
import { resolveStoryImage } from '@/lib/utils/images';

interface StoriesPageProps {
  params: Promise<{
    lang: string;
  }>;
  searchParams: Promise<{
    q?: string;
    cat?: string;
    city?: string;
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
  const canonicalUrl = `${siteUrl}/${lang}/stories`;

  const title = isId
    ? 'Cerita Petualang & Catatan Perjalanan Otentik | Locallytrip'
    : 'Traveler Stories & Authentic Insider Notes | Locallytrip';

  const description = isId
    ? 'Kumpulan panduan jujur, rute lokal tersembunyi, dan kisah petualangan otentik yang ditulis oleh komunitas traveler dan pemandu lokal terverifikasi.'
    : 'Curated honest guides, hidden local trails, and authentic adventure logs written by our community of verified travelers and local insiders.';

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'id-ID': `${siteUrl}/id/stories`,
        'en-US': `${siteUrl}/en/stories`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Locallytrip',
      locale: isId ? 'id_ID' : 'en_US',
      type: 'website',
      images: [
        {
          url: `${siteUrl}/images/stories/hero-story-book.png`,
          width: 1200,
          height: 630,
          alt: 'Locallytrip Travel Stories',
        },
      ],
    },
  };
}

export default async function StoriesPage({
  params,
  searchParams,
}: StoriesPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const locale = (resolvedParams.lang === 'en' ? 'en' : 'id') as Locale;
  const searchQuery = (resolvedSearchParams.q || '').trim();
  const selectedCategory = resolvedSearchParams.cat || 'all';
  const selectedCity = resolvedSearchParams.city || 'all';

  const dict = await getDictionary(locale);

  // Filter Prisma
  const andConditions: any[] = [
    { is_active: true },
    { status: enum_stories_status.published },
  ];

  // Filter Kategori Topik
  if (selectedCategory && selectedCategory !== 'all') {
    const categoryKeywords: Record<string, string[]> = {
      hidden_gems: ['hidden', 'gem', 'tersembunyi', 'rahasia', 'sudut', 'pelosok', 'island', 'beach', 'pantai', 'bukit'],
      culinary: ['kuliner', 'food', 'makan', 'resep', 'rasa', 'warung', 'kopi', 'coffee', 'cafe', 'taste'],
      tips: ['tips', 'panduan', 'guide', 'itinerary', 'rute', 'persiapan', 'anggaran', 'budget', 'cara'],
      culture: ['budaya', 'culture', 'heritage', 'tradisi', 'sejarah', 'batik', 'seni', 'art', 'temple', 'candi'],
    };

    const keywords = categoryKeywords[selectedCategory] || [selectedCategory];
    const categoryConditions = keywords.flatMap((kw) => [
      { title: { contains: kw, mode: 'insensitive' } },
      { content: { contains: kw, mode: 'insensitive' } },
      { excerpt: { contains: kw, mode: 'insensitive' } },
    ]);

    andConditions.push({ OR: categoryConditions });
  }

  // Filter Kota jika dipilih
  if (selectedCity && selectedCity !== 'all') {
    const cityIdNum = parseInt(selectedCity, 10);
    if (!isNaN(cityIdNum)) {
      andConditions.push({ city_id: cityIdNum });
    } else {
      andConditions.push({
        cities: { name: { contains: selectedCity, mode: 'insensitive' } },
      });
    }
  }

  // Filter Pencarian (Keyword Search pada judul, excerpt, atau kota)
  if (searchQuery) {
    andConditions.push({
      OR: [
        { title: { contains: searchQuery, mode: 'insensitive' } },
        { excerpt: { contains: searchQuery, mode: 'insensitive' } },
        { content: { contains: searchQuery, mode: 'insensitive' } },
        { cities: { name: { contains: searchQuery, mode: 'insensitive' } } },
      ],
    });
  }

  const whereClause: any = {
    AND: andConditions,
  };

  // Kueri Database Riil (Prisma Query): Ambil cerita unggulan, katalog cerita, kota, reward, & sesi
  const [featuredStoryRaw, storiesRaw, totalCount, citiesRaw, currentUserSession, storyRewardRule] =
    await Promise.all([
      // 1. Featured Story (Unggulan Terbaru / Editor's Pick)
      prisma.stories.findFirst({
        where: {
          status: enum_stories_status.published,
          is_active: true,
          is_featured: true,
        },
        include: {
          users_stories_author_idTousers: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar_url: true,
              is_verified: true,
              role: true,
              user_xp: {
                select: {
                  current_level: true,
                  total_xp: true,
                },
              },
            },
          },
          cities: {
            select: { id: true, name: true },
          },
        },
        orderBy: { created_at: 'desc' },
      }),

      // 2. Feed Katalog Cerita (Semua yang berstatus published)
      prisma.stories.findMany({
        where: whereClause,
        include: {
          users_stories_author_idTousers: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar_url: true,
              is_verified: true,
              role: true,
              user_xp: {
                select: {
                  current_level: true,
                  total_xp: true,
                },
              },
            },
          },
          cities: {
            select: { id: true, name: true },
          },
        },
        orderBy: [
          { is_featured: 'desc' },
          { view_count: 'desc' },
          { created_at: 'desc' },
        ],
        take: 24,
      }),

      // Total hitungan cerita sesuai filter
      prisma.stories.count({ where: whereClause }),

      // 3. Daftar Kota untuk Filter Destinasi
      prisma.cities.findMany({
        where: { is_active: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),

      // Sesi pengguna aktif
      getCurrentUserSession().catch(() => null),

      // 4. Aturan Hadiah Gamifikasi Penulisan Cerita
      prisma.reward_action_rules.findUnique({
        where: { action_code: 'STORY_PUBLISH' },
        select: { xp_reward: true, ltp_reward: true },
      }),
    ]);

  const fallbackCategories = [
    locale === 'id' ? 'Hidden Gems' : 'Hidden Gems',
    locale === 'id' ? 'Kuliner Lokal' : 'Local Food',
    locale === 'id' ? 'Tips & Panduan' : 'Tips & Guides',
    locale === 'id' ? 'Budaya & Tradisi' : 'Culture & Heritage',
  ];

  // Helper pemformat & normalisasi gambar bebas 404
  const formatStoryItem = (story: any, idx: number): StoryItem => {
    const authorData = story.users_stories_author_idTousers;
    return {
      id: story.id,
      uuid: story.uuid,
      title: story.title,
      slug: story.slug,
      content: story.content,
      excerpt: story.excerpt,
      // Normalisasi cover image sebelum dikirim ke client
      cover_image: resolveStoryImage(story.cover_image),
      reading_time: story.reading_time || (idx % 2 === 0 ? 3 : 5),
      created_at: story.created_at,
      view_count: story.view_count,
      like_count: story.like_count,
      comment_count: story.comment_count,
      city: story.cities ? { id: story.cities.id, name: story.cities.name } : null,
      author: authorData
        ? {
            id: authorData.id,
            name: authorData.name,
            username: authorData.username,
            avatar_url: authorData.avatar_url,
            is_verified: authorData.is_verified,
            role: authorData.role,
            level: authorData.user_xp?.current_level || 1,
          }
        : null,
      category: fallbackCategories[idx % fallbackCategories.length],
    };
  };

  const formattedStories: StoryItem[] = storiesRaw.map(formatStoryItem);

  // Featured Story (hanya tampil penuh di default view tanpa filter pencarian)
  const isDefaultView = !searchQuery && selectedCategory === 'all' && selectedCity === 'all';
  const featuredStory: StoryItem | null = isDefaultView
    ? featuredStoryRaw
      ? formatStoryItem(featuredStoryRaw, 0)
      : formattedStories.length > 0
      ? formattedStories[0]
      : null
    : null;

  // Feed list (menghindari duplikasi featured story di list utama jika di default view)
  const listStories =
    featuredStory && isDefaultView
      ? formattedStories.filter((s) => s.id !== featuredStory.id)
      : formattedStories;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://locallytrip.com';

  const currentUserData: CurrentUserSessionData | null = currentUserSession
    ? {
        id: currentUserSession.id,
        name: currentUserSession.name,
        email: currentUserSession.email,
        isLoggedIn: currentUserSession.isLoggedIn,
      }
    : null;

  const citiesList: CityFilterItem[] = citiesRaw.map((c) => ({
    id: c.id,
    name: c.name,
  }));

  // Skema Data Terstruktur JSON-LD untuk SEO & Mesin Pencari AI
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
            name: locale === 'en' ? 'Stories' : 'Cerita Petualang',
            item: `${siteUrl}/${locale}/stories`,
          },
        ],
      },
      {
        '@type': 'CollectionPage',
        name:
          locale === 'en'
            ? 'Authentic Travel Stories & Insider Routes Indonesia'
            : 'Jurnal Cerita Perjalanan & Hidden Gems Indonesia',
        description:
          locale === 'en'
            ? 'Curated honest guides, hidden local trails, and authentic adventure logs.'
            : 'Kumpulan panduan jujur, rute lokal tersembunyi, dan kisah petualangan otentik.',
        hasPart: formattedStories.map((story) => ({
          '@type': 'BlogPosting',
          headline: story.title,
          description: story.excerpt || story.content.slice(0, 150),
          datePublished: new Date(story.created_at).toISOString(),
          image: story.cover_image?.startsWith('http') ? story.cover_image : `${siteUrl}${story.cover_image}`,
          author: {
            '@type': 'Person',
            name: story.author?.name || 'Locallytrip Insider',
          },
          ...(story.city
            ? {
                contentLocation: {
                  '@type': 'Place',
                  name: story.city.name,
                },
              }
            : {}),
        })),
      },
    ],
  };

  return (
    <div className="w-full min-h-screen bg-slate-50/50 py-8 sm:py-12">
      {/* Script Data Terstruktur JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-12">
        <StoriesCatalog
          featuredStory={featuredStory}
          stories={listStories}
          total={totalCount}
          cities={citiesList}
          locale={locale}
          dict={dict}
          currentUser={currentUserData}
          currentCategory={selectedCategory}
          currentCity={selectedCity}
          currentSearch={searchQuery}
          rewardRule={storyRewardRule}
        />
      </div>
    </div>
  );
}
