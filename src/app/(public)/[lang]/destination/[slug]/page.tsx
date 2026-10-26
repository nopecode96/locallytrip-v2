import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import prisma from '@/lib/prisma';
import { getDictionary, Locale } from '@/lib/dictionary';
import { ExperienceCard } from '@/components/marketplace/ExperienceCard';
import { StoryCard, StoryItem } from '@/components/marketplace/StoryCard';
import { ExperienceItem } from '@/actions/experiences';
import { resolveMeetupDisplayImage } from '@/lib/utils/images';
import { SafeImage } from '@/components/common/SafeImage';
import { resolveAvatarUrl } from '@/lib/avatar';
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  MessageCircle,
  MessageSquare,
  ThumbsUp,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  PlusCircle,
  Pin,
  Compass,
  BookOpen,
  UserPlus,
} from 'lucide-react';

interface DestinationPageProps {
  params: Promise<{
    lang: string;
    slug: string;
  }>;
}

export const dynamic = 'force-dynamic';

function parseJsonArray(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      return [value];
    }
  }
  return [];
}

// Helper untuk menemukan kota berdasarkan slug fleksibel
async function getCityBySlug(slug: string) {
  const normalizedSlug = decodeURIComponent(slug).toLowerCase().trim();
  const searchName = normalizedSlug.replace(/-/g, ' ');

  // 1. Coba pencarian langsung dengan name equals (case-insensitive)
  let city = await prisma.cities.findFirst({
    where: {
      name: { equals: searchName, mode: 'insensitive' },
      is_active: true,
    },
    include: {
      countries: true,
    },
  });

  // 2. Jika tidak ditemukan secara persis, coba pencarian contains
  if (!city) {
    city = await prisma.cities.findFirst({
      where: {
        name: { contains: searchName, mode: 'insensitive' },
        is_active: true,
      },
      include: {
        countries: true,
      },
    });
  }

  // 3. Jika masih belum ditemukan, periksa semua kota yang aktif dengan slugifikasi
  if (!city) {
    const allCities = await prisma.cities.findMany({
      where: { is_active: true },
      include: { countries: true },
    });
    city =
      allCities.find((c) => {
        const citySlug = c.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
        return citySlug === normalizedSlug || c.name.toLowerCase() === searchName;
      }) || null;
  }

  return city;
}

export async function generateMetadata({
  params,
}: DestinationPageProps): Promise<Metadata> {
  const { lang, slug } = await params;
  const locale = (lang === 'en' ? 'en' : 'id') as Locale;
  const isId = locale === 'id';

  const city = await getCityBySlug(slug);

  if (!city) {
    return {
      title: 'Destinasi Tidak Ditemukan | Locallytrip',
      description: 'Halaman destinasi yang Anda cari tidak ditemukan.',
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://locallytrip.com';
  const canonicalUrl = `${siteUrl}/${locale}/destination/${slug}`;

  const title = isId
    ? `${city.name} - City Hub Wisata, Cerita & Komunitas | Locallytrip`
    : `${city.name} - City Hub: Experiences, Stories & Community | Locallytrip`;

  const description = isId
    ? `Panduan aktivitas otentik, catatan perjalanan, agenda meetup traveler, dan forum tanya jawab warga di ${city.name}. Jelajahi bersama Locallytrip.`
    : `Authentic local experiences, traveler stories, community meetups, and local Q&A in ${city.name}. Explore with Locallytrip.`;

  const imageUrl = city.image_url
    ? `${siteUrl}/images/cities/${city.image_url}`
    : `${siteUrl}/images/hero/destinasi-hero.jpg`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'id-ID': `${siteUrl}/id/destination/${slug}`,
        'en-US': `${siteUrl}/en/destination/${slug}`,
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
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `Destinasi Wisata ${city.name}`,
        },
      ],
    },
  };
}

export default async function DestinationPage({ params }: DestinationPageProps) {
  const { lang, slug } = await params;
  const locale = (lang === 'en' ? 'en' : 'id') as Locale;
  const isId = locale === 'id';

  const dict = await getDictionary(locale);
  const city = await getCityBySlug(slug);

  if (!city) {
    notFound();
  }

  // 1. Eksekusi Query Paralel untuk 4 Pilar Data Sekaligus dengan Defensive Fallback
  const [
    experiencesRaw = [],
    storiesRaw = [],
    meetupsRaw = [],
    forumThreadsRaw = [],
    totalExperiencesCount = 0,
    totalStoriesCount = 0,
    totalMeetupsCount = 0,
    totalForumsCount = 0,
  ] = await Promise.all([
    // Pilar 1: Experiences (Aktivitas lokal hingga 6 kartu)
    prisma.experiences.findMany({
      where: {
        city_id: city.id,
        status: 'published',
        is_active: true,
      },
      take: 6,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar_url: true,
            is_verified: true,
          },
        },
        cities: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    }).catch(() => [] as any[]),

    // Pilar 2: Travel Stories (Cerita petualang hingga 3 kartu)
    prisma.stories.findMany({
      where: {
        city_id: city.id,
        status: 'published',
        is_active: true,
      },
      take: 3,
      include: {
        users_stories_author_idTousers: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar_url: true,
            is_verified: true,
          },
        },
        cities: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    }).catch(() => [] as any[]),

    // Pilar 3: Meetups (Agenda kumpul traveler hingga 3 kartu)
    prisma.vibes_travel_meetups.findMany({
      where: {
        city_id: city.id,
        status: 'active',
        deleted_at: null,
      },
      take: 3,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar_url: true,
            is_verified: true,
          },
        },
        cities: {
          select: {
            id: true,
            name: true,
            image_url: true,
            countries: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        experience_types: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
          },
        },
        vibes_travel_meetup_members: {
          take: 4,
          select: {
            user_id: true,
            users: {
              select: {
                name: true,
                avatar_url: true,
              },
            },
          },
        },
      },
      orderBy: { start_date: 'asc' },
    }).catch(() => [] as any[]),

    // Pilar 4: Forum Threads (Diskusi & Tanya jawab warga lokal hingga 3 kartu)
    prisma.vibes_forum_threads.findMany({
      where: {
        OR: [
          { title: { contains: city.name, mode: 'insensitive' } },
          { content: { contains: city.name, mode: 'insensitive' } },
        ],
        status: 'active',
        deleted_at: null,
      },
      take: 3,
      include: {
        users_vibes_forum_threads_author_idTousers: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar_url: true,
            is_verified: true,
            role: true,
          },
        },
        vibes_forum_categories: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            vibes_forum_posts: true,
            vibes_forum_thread_likes: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    }).catch(() => [] as any[]),

    // Total counts untuk label & CTA
    prisma.experiences.count({
      where: { city_id: city.id, status: 'published', is_active: true },
    }).catch(() => 0),
    prisma.stories.count({
      where: { city_id: city.id, status: 'published', is_active: true },
    }).catch(() => 0),
    prisma.vibes_travel_meetups.count({
      where: { city_id: city.id, status: 'active', deleted_at: null },
    }).catch(() => 0),
    prisma.vibes_forum_threads.count({
      where: {
        OR: [
          { title: { contains: city.name, mode: 'insensitive' } },
          { content: { contains: city.name, mode: 'insensitive' } },
        ],
        status: 'active',
        deleted_at: null,
      },
    }).catch(() => 0),
  ]);

  // Formatter untuk Pilar 1: Experiences
  const formattedExperiences: ExperienceItem[] = (experiencesRaw || []).map((exp) => ({
    id: exp.id,
    uuid: exp.uuid,
    title: exp.title,
    title_id: exp.title_id,
    title_en: exp.title_en,
    slug: exp.slug,
    shortDescription: exp.short_description,
    packagePrice: exp.package_price ? Number(exp.package_price) : null,
    currency: exp.currency || 'USD',
    durationHours: exp.duration_hours,
    maxParticipants: exp.max_participants,
    difficultyLevel: exp.difficulty_level,
    ratingAverage: exp.rating_average ? Number(exp.rating_average) : 0,
    ratingCount: exp.rating_count ?? 0,
    city: exp.cities ? { id: exp.cities.id, name: exp.cities.name } : null,
    host: exp.users
      ? {
          id: exp.users.id,
          name: exp.users.name,
          username: exp.users.username,
          avatarUrl: exp.users.avatar_url,
          isVerified: exp.users.is_verified,
        }
      : null,
    images: parseJsonArray(exp.images),
  }));

  // Formatter untuk Pilar 2: Stories
  const formattedStories: StoryItem[] = (storiesRaw || []).map((story) => ({
    id: story.id,
    uuid: story.uuid,
    title: story.title,
    slug: story.slug,
    content: story.content,
    excerpt: story.excerpt,
    cover_image: story.cover_image,
    reading_time: story.reading_time,
    created_at: story.created_at,
    city: story.cities ? { id: story.cities.id, name: story.cities.name } : null,
    author: story.users_stories_author_idTousers
      ? {
          id: story.users_stories_author_idTousers.id,
          name: story.users_stories_author_idTousers.name,
          username: story.users_stories_author_idTousers.username,
          avatar_url: story.users_stories_author_idTousers.avatar_url,
          is_verified: story.users_stories_author_idTousers.is_verified,
        }
      : null,
    tags: Array.isArray(story.tags) ? (story.tags as string[]) : [],
  }));

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://locallytrip.com';
  const coverImageSrc = city.image_url
    ? `/images/cities/${city.image_url}`
    : '/images/hero/destinasi-hero.jpg';

  // Injeksi Skema JSON-LD Terstruktur (TouristDestination, BreadcrumbList, dan ItemList)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: isId ? 'Beranda' : 'Home',
            item: `${siteUrl}/${locale}`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: isId ? 'Eksplorasi' : 'Explore',
            item: `${siteUrl}/${locale}/explore`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: city.name,
            item: `${siteUrl}/${locale}/destination/${slug}`,
          },
        ],
      },
      {
        '@type': 'TouristDestination',
        name: city.name,
        description:
          city.description ||
          `Destinasi wisata otentik, tur tersembunyi, dan pengalaman lokal di ${city.name}.`,
        geo:
          city.latitude && city.longitude
            ? {
                '@type': 'GeoCoordinates',
                latitude: Number(city.latitude),
                longitude: Number(city.longitude),
              }
            : undefined,
        containedInPlace: {
          '@type': 'Country',
          name: city.countries?.name || 'Indonesia',
        },
        image: `${siteUrl}${coverImageSrc}`,
      },
      {
        '@type': 'ItemList',
        name: `Aktivitas & Tur Lokal di ${city.name}`,
        itemListElement: formattedExperiences.map((exp, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          item: {
            '@type': 'TouristTrip',
            name: exp.title,
            description: exp.shortDescription || exp.title,
            offers: {
              '@type': 'Offer',
              price: exp.packagePrice ?? 0,
              priceCurrency: exp.currency || 'USD',
            },
            provider: {
              '@type': 'Person',
              name: exp.host?.name || 'Local Host',
            },
          },
        })),
      },
    ],
  };

  const t = dict.destination || {
    exploreTitle: isId ? 'Jelajahi' : 'Explore',
    heroSubtitle: isId
      ? `Temukan petualangan otentik, cerita perjalanan, dan agenda temu komunitas di ${city.name} yang dipandu langsung oleh warga lokal terverifikasi.`
      : `Discover authentic adventures, travel stories, and community meetups in ${city.name} guided by verified local insiders.`,
    tabExperiences: isId ? 'Aktivitas' : 'Experiences',
    tabStories: isId ? 'Cerita Perjalanan' : 'Travel Stories',
    tabMeetups: isId ? 'Teman Jalan' : 'Meetups',
    tabForums: isId ? 'Tanya Warga' : 'Ask Locals',
    seeAll: isId ? 'Lihat Semua' : 'See All',
    activitiesTitle: isId ? 'Aktivitas Lokal di' : 'Local Experiences in',
    emptyExp: isId
      ? `Belum ada aktivitas tur di ${city.name}. Ingin menjadi pemandu lokal pertama?`
      : `No tour activities available yet in ${city.name}. Want to become the first local host?`,
    emptyStories: isId
      ? `Belum ada cerita perjalanan yang ditulis tentang ${city.name}. Punya pengalaman seru di sini? Tulis cerita pertamamu!`
      : `No travel stories written about ${city.name} yet. Have an exciting experience here? Share your story!`,
    emptyMeetups: isId
      ? `Belum ada agenda kumpul komunitas di ${city.name}. Ajak traveler lain kumpul santai atau kulineran bareng!`
      : `No community meetups scheduled yet in ${city.name}. Host a casual hangout or culinary walk with fellow travelers!`,
    emptyForums: isId
      ? `Belum ada diskusi seputar ${city.name}. Punya pertanyaan atau tips untuk warga lokal?`
      : `No discussions about ${city.name} yet. Have questions or tips for local residents?`,
    becomeHost: isId ? 'Daftar Jadi Host' : 'Become a Host',
    writeStory: isId ? 'Tulis Cerita' : 'Write a Story',
    createMeetup: isId ? '+ Buat Agenda Meetup' : '+ Host a Meetup',
    askQuestion: isId ? 'Tanya Pertanyaan Pertama' : 'Ask the First Question',
  };

  const heroSubtitleText = t.heroSubtitle
    ? t.heroSubtitle.replace('{cityName}', city.name)
    : city.description || '';

  return (
    <div className="w-full min-h-screen bg-slate-50/50">
      {/* Script Data Terstruktur JSON-LD untuk AEO & GEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
        {/* 1. Breadcrumb Navigasi */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Link
            href={`/${locale}`}
            className="hover:text-purple-900 transition-colors"
          >
            {isId ? 'Beranda' : 'Home'}
          </Link>
          <span>›</span>
          <Link
            href={`/${locale}/explore`}
            className="hover:text-purple-900 transition-colors"
          >
            {dict.nav?.explore || (isId ? 'Eksplorasi' : 'Explore')}
          </Link>
          <span>›</span>
          <span className="text-purple-900 font-semibold">{city.name}</span>
        </nav>

        {/* 2. Hero Header Destinasi (City Hub Banner) */}
        <div className="relative w-full rounded-3xl overflow-hidden bg-purple-950 text-white p-8 sm:p-12 shadow-lg">
          <Image
            src={coverImageSrc}
            alt={city.name}
            fill
            priority
            className="object-cover opacity-35 mix-blend-overlay"
          />
          <div className="relative z-10 max-w-3xl space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold tracking-wider uppercase">
              📍 {city.countries?.name || 'Indonesia'}
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-tight text-white leading-tight">
              {t.exploreTitle || (isId ? 'Jelajahi' : 'Explore')} {city.name}
            </h1>
            <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-2xl">
              {heroSubtitleText}
            </p>

            {/* Sub-CTA badges */}
            <div className="pt-2 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md text-white font-medium">
                🎒 {totalExperiencesCount} {t.tabExperiences || (isId ? 'Aktivitas' : 'Experiences')}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md text-white font-medium">
                📖 {totalStoriesCount} {t.tabStories || (isId ? 'Cerita' : 'Stories')}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md text-white font-medium">
                🤝 {totalMeetupsCount} {t.tabMeetups || (isId ? 'Meetup' : 'Meetups')}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md text-white font-medium">
                💬 {totalForumsCount} {t.tabForums || (isId ? 'Diskusi' : 'Forums')}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Bilah Pintasan Cepat (Quick Jump Sub-Nav) */}
        <div className="sticky top-20 z-20 bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-2 shadow-sm">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            <a
              href="#experiences"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:text-violet-700 hover:bg-violet-50 transition whitespace-nowrap"
            >
              <span>🎒</span>
              <span>
                {t.tabExperiences || (isId ? 'Aktivitas' : 'Experiences')} ({totalExperiencesCount})
              </span>
            </a>
            <a
              href="#stories"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:text-violet-700 hover:bg-violet-50 transition whitespace-nowrap"
            >
              <span>📖</span>
              <span>
                {t.tabStories || (isId ? 'Cerita Petualang' : 'Travel Stories')} ({totalStoriesCount})
              </span>
            </a>
            <a
              href="#meetups"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:text-violet-700 hover:bg-violet-50 transition whitespace-nowrap"
            >
              <span>🤝</span>
              <span>
                {t.tabMeetups || (isId ? 'Teman Jalan & Meetups' : 'Meetups')} ({totalMeetupsCount})
              </span>
            </a>
            <a
              href="#forums"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:text-violet-700 hover:bg-violet-50 transition whitespace-nowrap"
            >
              <span>💬</span>
              <span>
                {t.tabForums || (isId ? 'Tanya Warga' : 'Ask Locals')} ({totalForumsCount})
              </span>
            </a>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SEKSI 1: AKTIVITAS LOKAL (EXPERIENCES)                    */}
        {/* ========================================================= */}
        <section id="experiences" className="space-y-6 scroll-mt-36">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🎒</span>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
                  {t.activitiesTitle || (isId ? 'Aktivitas Lokal di' : 'Local Experiences in')} {city.name}
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {isId
                  ? `Pilihan tur & aktivitas unik dipandu pemandu lokal terverifikasi di ${city.name}`
                  : `Unique tours & curated activities hosted by verified locals in ${city.name}`}
              </p>
            </div>
            <Link
              href={`/${locale}/experiences?city=${encodeURIComponent(city.name)}`}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-violet-700 hover:text-violet-900 group"
            >
              <span>
                {t.seeAll || (isId ? 'Lihat Semua' : 'See All')} ({totalExperiencesCount})
              </span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {formattedExperiences.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {formattedExperiences.map((experience) => (
                <ExperienceCard
                  key={experience.id}
                  experience={experience}
                  dict={dict.common}
                  homeDict={dict.home}
                />
              ))}
            </div>
          ) : (
            <div className="w-full bg-white rounded-3xl border border-dashed border-slate-300 p-8 sm:p-12 text-center space-y-4 shadow-xs">
              <div className="w-14 h-14 mx-auto rounded-full bg-violet-50 text-violet-600 flex items-center justify-center text-2xl">
                🎒
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  {t.emptyExp
                    ? t.emptyExp.replace('{cityName}', city.name)
                    : isId
                    ? `Belum ada aktivitas tur di ${city.name}. Ingin menjadi pemandu lokal pertama?`
                    : `No tour activities available yet in ${city.name}. Want to become the first local host?`}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                  {isId
                    ? `Bagikan keahlian unik, rute rahasia, atau petualangan kuliner kotamu bersama traveler dunia.`
                    : `Share your hidden spots, culinary journeys, or local skills with global travelers.`}
                </p>
              </div>
              <div className="pt-2 flex flex-wrap justify-center gap-3">
                <Link
                  href={`/${locale}/host/onboarding`}
                  className="px-5 py-2.5 rounded-full bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-sm transition-all inline-flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{t.becomeHost || (isId ? 'Daftar Jadi Host' : 'Become a Host')}</span>
                </Link>
                <Link
                  href={`/${locale}/experiences`}
                  className="px-5 py-2.5 rounded-full border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all"
                >
                  {isId ? 'Lihat Kota Lain' : 'Explore Other Cities'}
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* ========================================================= */}
        {/* SEKSI 2: CERITA & CATATAN PERJALANAN (TRAVEL STORIES)      */}
        {/* ========================================================= */}
        <section id="stories" className="space-y-6 scroll-mt-36">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">📖</span>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
                  {isId ? `Cerita & Rekomendasi di ${city.name}` : `Stories & Highlights in ${city.name}`}
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {isId
                  ? `Catatan perjalanan otentik, ulasan rute, dan rekomendasi nyata dari para pelancong`
                  : `Authentic travel diaries, itinerary recommendations, and real reviews from explorers`}
              </p>
            </div>
            <Link
              href={`/${locale}/stories?city=${encodeURIComponent(city.name)}`}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-violet-700 hover:text-violet-900 group"
            >
              <span>{isId ? 'Lihat Semua Cerita' : 'View All Stories'} →</span>
            </Link>
          </div>

          {formattedStories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {formattedStories.map((story) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  locale={locale}
                  readTimeLabel={isId ? 'menit baca' : 'min read'}
                />
              ))}
            </div>
          ) : (
            <div className="w-full bg-white rounded-3xl border border-dashed border-slate-300 p-8 sm:p-12 text-center space-y-4 shadow-xs">
              <div className="w-14 h-14 mx-auto rounded-full bg-violet-50 text-violet-600 flex items-center justify-center text-2xl">
                📖
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  {t.emptyStories
                    ? t.emptyStories.replace('{cityName}', city.name)
                    : isId
                    ? `Belum ada cerita perjalanan yang ditulis tentang ${city.name}.`
                    : `No travel stories written about ${city.name} yet.`}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                  {isId
                    ? `Punya pengalaman seru di sini? Tulis cerita pertamamu dan jadilah inspirasi bagi pelancong lainnya!`
                    : `Had an unforgettable moment here? Share your first story and inspire fellow travelers!`}
                </p>
              </div>
              <div className="pt-2 flex justify-center">
                <Link
                  href={`/${locale}/stories/new`}
                  className="px-5 py-2.5 rounded-full bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-sm transition-all inline-flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>{t.writeStory || (isId ? 'Tulis Cerita' : 'Write a Story')}</span>
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* ========================================================= */}
        {/* SEKSI 3: TEMAN JALAN & MEETUPS (NOMADTABLE CARDS)          */}
        {/* ========================================================= */}
        <section id="meetups" className="space-y-6 scroll-mt-36">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🤝</span>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
                  {isId
                    ? `Agenda Kumpul Komunitas di ${city.name}`
                    : `Community Meetups in ${city.name}`}
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {isId
                  ? `Temui sesama traveler, ngopi santai, atau jelajah rute bareng ala Nomadtable`
                  : `Connect with fellow travelers, casual coffee hangouts, and route walks`}
              </p>
            </div>
            <Link
              href={`/${locale}/community/meetups?city=${encodeURIComponent(city.name)}`}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-violet-700 hover:text-violet-900 group"
            >
              <span>{isId ? 'Lihat Semua Meetup' : 'View All Meetups'} →</span>
            </Link>
          </div>

          {meetupsRaw.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {meetupsRaw.map((meetup) => {
                const startDate = new Date(meetup.start_date);
                const isValidDate = !isNaN(startDate.getTime());
                const monthShort = isValidDate
                  ? startDate
                      .toLocaleDateString(locale === 'en' ? 'en-US' : 'id-ID', { month: 'short' })
                      .toUpperCase()
                  : 'TBA';
                const dayNum = isValidDate ? startDate.getDate() : '--';
                const weekday = isValidDate
                  ? startDate.toLocaleDateString(locale === 'en' ? 'en-US' : 'id-ID', { weekday: 'short' })
                  : '';
                const timeFormatted = isValidDate
                  ? startDate.toLocaleTimeString(locale === 'en' ? 'en-US' : 'id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'TBA';

                const coverImg = resolveMeetupDisplayImage(
                  meetup.images,
                  meetup.cities?.image_url
                );

                const creatorAvatar = resolveAvatarUrl(meetup.users);

                const isFree = meetup.join_type === 'public';
                const maxSlots = meetup.max_members || 10;
                const filledSlots = Math.min(meetup.current_member_count ?? 1, maxSlots);
                const isFull = filledSlots >= maxSlots;

                const themeTag = meetup.experience_types
                  ? `${meetup.experience_types.icon ? meetup.experience_types.icon + ' ' : '🧭 '}${meetup.experience_types.name}`
                  : '🤝 Hangout & Explore';

                const participants = meetup.vibes_travel_meetup_members || [];

                return (
                  <div
                    key={meetup.id}
                    className="group bg-white rounded-3xl overflow-hidden border border-slate-200/80 hover:border-violet-300 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      {/* Media Cover Aspect 16/10 */}
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
                        <figure className="relative w-full h-full m-0">
                          <SafeImage
                            src={coverImg}
                            alt={meetup.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                            loading="lazy"
                            category="meetups"
                            fallbackSrc="/images/default-meetup-cover.jpg"
                          />
                          <figcaption className="sr-only">
                            Dokumentasi meetup komunitas di {city.name}
                          </figcaption>
                        </figure>

                        {/* Badge Tanggal */}
                        <div className="absolute top-3.5 left-3.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-lg border border-white/60 text-center min-w-[52px]">
                          <span className="block text-[10px] font-black text-violet-700 tracking-wider">
                            {monthShort}
                          </span>
                          <span className="block text-lg font-black text-slate-900 leading-none">
                            {dayNum}
                          </span>
                          <span className="block text-[9px] font-bold text-slate-400 mt-0.5">
                            {weekday}
                          </span>
                        </div>

                        {/* Free / Shared Cost Badge */}
                        <div className="absolute top-3.5 right-3.5 flex flex-col items-end gap-1.5">
                          <span
                            className={`text-[11px] font-bold px-3 py-1 rounded-full shadow-md backdrop-blur-md ${
                              isFree
                                ? 'bg-emerald-600/90 text-white'
                                : 'bg-amber-600/90 text-white'
                            }`}
                          >
                            {isFree ? (isId ? 'Gratis' : 'Free') : (isId ? 'Patungan' : 'Shared Cost')}
                          </span>
                        </div>

                        {/* Tag Tema Kegiatan */}
                        <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-900/80 backdrop-blur-md text-white px-2.5 py-1 rounded-lg border border-white/10 shadow-sm truncate max-w-[85%]">
                            <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                            <span className="truncate">{themeTag}</span>
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 sm:p-6 space-y-4">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <div className="flex items-center gap-1 font-semibold text-violet-700 truncate mr-2">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{city.name}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-400 shrink-0">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{timeFormatted} WIB</span>
                          </div>
                        </div>

                        <Link
                          href={`/${locale}/community/meetups/${meetup.id}`}
                          className="block group/link"
                        >
                          <h3 className="font-bold text-base sm:text-lg text-slate-900 group-hover/link:text-violet-700 transition line-clamp-2 leading-snug">
                            {meetup.title}
                          </h3>
                        </Link>

                        {/* Host & Slots Indicator */}
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-2.5">
                            <div className="relative">
                              <img
                                src={creatorAvatar}
                                alt={meetup.users?.name || 'Inisiator'}
                                className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-xs"
                              />
                              {meetup.users?.is_verified && (
                                <div
                                  className="absolute -bottom-1 -right-1 bg-violet-600 text-white rounded-full p-0.5 shadow-xs"
                                  title="KYC Verified Host"
                                >
                                  <ShieldCheck className="w-3 h-3" />
                                </div>
                              )}
                            </div>
                            <div className="text-xs">
                              <div className="flex items-center gap-1">
                                <span className="font-semibold text-slate-800">
                                  {meetup.users?.name || meetup.users?.username || 'Host Komunitas'}
                                </span>
                              </div>
                              <span className="text-slate-400 block text-[10px]">
                                {isId ? 'Inisiator Meetup' : 'Meetup Host'}
                              </span>
                            </div>
                          </div>

                          <span
                            className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-md ${
                              isFull
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {filledSlots}/{maxSlots} {isId ? 'Slot' : 'Spots'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer: Facepile Avatars & CTA */}
                    <div className="p-5 sm:p-6 pt-0 border-t border-slate-100 mt-2">
                      <div className="flex items-center justify-between pt-4">
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2 overflow-hidden">
                            {(participants.length > 0
                              ? participants
                              : [{ user_id: 1, users: { name: 'Member', avatar_url: null } }]
                            )
                              .slice(0, 4)
                              .map((mem: any, idx: number) => (
                                <img
                                  key={idx}
                                  src={resolveAvatarUrl(mem.users)}
                                  alt={mem.users?.name || 'Member'}
                                  className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover shadow-2xs"
                                />
                              ))}
                          </div>
                          <span className="text-[11px] font-semibold text-slate-600">
                            {meetup.current_member_count ?? 1} {isId ? 'bergabung' : 'joined'}
                          </span>
                        </div>

                        <Link
                          href={`/${locale}/community/meetups/${meetup.id}`}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-700 hover:text-violet-900 group/btn"
                        >
                          <span>{isId ? 'Lihat Detail' : 'Details'}</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="w-full bg-white rounded-3xl border border-dashed border-slate-300 p-8 sm:p-12 text-center space-y-4 shadow-xs">
              <div className="w-14 h-14 mx-auto rounded-full bg-violet-50 text-violet-600 flex items-center justify-center text-2xl">
                🤝
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  {t.emptyMeetups
                    ? t.emptyMeetups.replace('{cityName}', city.name)
                    : isId
                    ? `Belum ada agenda kumpul komunitas di ${city.name}.`
                    : `No community meetups scheduled yet in ${city.name}.`}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                  {isId
                    ? `Ajak traveler lain kumpul santai atau kulineran bareng!`
                    : `Host a casual coffee meetup or foodie walk with fellow travelers!`}
                </p>
              </div>
              <div className="pt-2 flex justify-center">
                <Link
                  href={`/${locale}/community/meetups?create=true`}
                  className="px-5 py-2.5 rounded-full bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-sm transition-all inline-flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{t.createMeetup || (isId ? '+ Buat Agenda Meetup' : '+ Host a Meetup')}</span>
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* ========================================================= */}
        {/* SEKSI 4: DISKUSI & TANYA JAWAB WARGA LOKAL (FORUM THREADS) */}
        {/* ========================================================= */}
        <section id="forums" className="space-y-6 scroll-mt-36">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">💬</span>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
                  {isId
                    ? `Tanya Jawab Seputar ${city.name}`
                    : `Discussions & Local Q&A for ${city.name}`}
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {isId
                  ? `Forum tanya jawab rute, kuliner, dan tips perjalanan seputar ${city.name}`
                  : `Q&A forum about travel tips, safety, and local recommendations in ${city.name}`}
              </p>
            </div>
            <Link
              href={`/${locale}/community/forums?city=${encodeURIComponent(city.name)}`}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-violet-700 hover:text-violet-900 group"
            >
              <span>{isId ? 'Buka Forum Diskusi' : 'Open Forums'} →</span>
            </Link>
          </div>

          {forumThreadsRaw.length > 0 ? (
            <div className="space-y-4">
              {forumThreadsRaw.map((thread) => {
                const author = thread.users_vibes_forum_threads_author_idTousers;
                const authorAvatar = resolveAvatarUrl(author);

                const formattedDate = thread.created_at
                  ? new Date(thread.created_at).toLocaleDateString(
                      locale === 'id' ? 'id-ID' : 'en-US',
                      {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      }
                    )
                  : '';

                const snippet = (thread.content || '')
                  .replace(/[#*`_~>[\]()!]/g, '')
                  .replace(/\n+/g, ' ')
                  .trim();

                const replyCount = thread._count?.vibes_forum_posts ?? thread.reply_count ?? 0;
                const likeCount = thread._count?.vibes_forum_thread_likes ?? thread.like_count ?? 0;

                return (
                  <article
                    key={thread.id}
                    className="group bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:border-violet-300 hover:shadow-md transition-all flex flex-col gap-3.5"
                  >
                    {/* Header: Author & Category */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <img
                            src={authorAvatar}
                            alt={author?.name || 'User'}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full object-cover border border-violet-100"
                          />
                          {author?.is_verified && (
                            <span
                              title="Verified User"
                              className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5 shadow-2xs"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 fill-white" />
                            </span>
                          )}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-bold text-sm text-slate-900 group-hover:text-violet-700 transition">
                              {author?.name || author?.username || 'Traveler'}
                            </span>
                            {author?.is_verified && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.2 rounded-full">
                                Verified
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{formattedDate}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {thread.vibes_forum_categories && (
                        <span className="text-xs font-semibold text-violet-700 bg-violet-50/80 border border-violet-100 px-3 py-1 rounded-full">
                          #{thread.vibes_forum_categories.name}
                        </span>
                      )}
                    </div>

                    {/* Content Snippet */}
                    <div className="space-y-1.5">
                      <Link
                        href={`/${locale}/community/forums/${thread.id}`}
                        className="block group/link"
                      >
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover/link:text-violet-700 transition leading-snug line-clamp-2">
                          {thread.title}
                        </h3>
                      </Link>
                      <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed font-normal">
                        {snippet}
                      </p>
                    </div>

                    {/* Footer Interactions */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
                      <div className="flex items-center gap-4">
                        <Link
                          href={`/${locale}/community/forums/${thread.id}#replies`}
                          className="inline-flex items-center gap-1.5 font-semibold text-slate-600 hover:text-violet-700 transition"
                        >
                          <MessageCircle className="w-4 h-4 text-violet-500" />
                          <span>
                            {replyCount} {isId ? 'Balasan' : 'Replies'}
                          </span>
                        </Link>
                        <span className="inline-flex items-center gap-1.5 font-semibold text-slate-600">
                          <ThumbsUp className="w-4 h-4 text-slate-400" />
                          <span>
                            {likeCount} {isId ? 'Suka' : 'Likes'}
                          </span>
                        </span>
                      </div>

                      <Link
                        href={`/${locale}/community/forums/${thread.id}`}
                        className="font-bold text-violet-700 hover:text-violet-900 inline-flex items-center gap-1"
                      >
                        <span>{isId ? 'Baca Diskusi' : 'Join Discussion'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="w-full bg-white rounded-3xl border border-dashed border-slate-300 p-8 sm:p-12 text-center space-y-4 shadow-xs">
              <div className="w-14 h-14 mx-auto rounded-full bg-violet-50 text-violet-600 flex items-center justify-center text-2xl">
                💬
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  {t.emptyForums
                    ? t.emptyForums.replace('{cityName}', city.name)
                    : isId
                    ? `Belum ada diskusi seputar ${city.name}.`
                    : `No discussions about ${city.name} yet.`}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                  {isId
                    ? `Punya pertanyaan tentang tempat wisata atau butuh rekomendasi lokal? Buka obrolan pertamamu!`
                    : `Have questions about local spots or need recommendations? Start the first thread!`}
                </p>
              </div>
              <div className="pt-2 flex justify-center">
                <Link
                  href={`/${locale}/community/forums#create`}
                  className="px-5 py-2.5 rounded-full bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-sm transition-all inline-flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{t.askQuestion || (isId ? 'Tanya Pertanyaan Pertama' : 'Ask the First Question')}</span>
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
