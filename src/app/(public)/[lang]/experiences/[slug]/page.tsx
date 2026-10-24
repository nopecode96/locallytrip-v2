import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { Locale } from '@/lib/dictionary';
import { getLocalizedContent } from '@/lib/i18n-helper';
import {
  ExperienceDetailClient,
  ExperienceDetailData,
} from '@/components/experiences/ExperienceDetailClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCurrentUserSession } from '@/actions/bookings';

interface ExperienceDetailPageProps {
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
      if (value.includes(',')) {
        return value.split(',').map((s) => s.trim()).filter(Boolean);
      }
      return [value];
    }
  }
  return [];
}

export async function generateMetadata({
  params,
}: ExperienceDetailPageProps): Promise<Metadata> {
  const resolved = await params;
  const locale = (resolved.lang === 'en' ? 'en' : 'id') as Locale;
  const slugParam = resolved.slug;
  const isNumeric = !isNaN(Number(slugParam));
  const normalizedSlug = decodeURIComponent(slugParam).trim().toLowerCase();
  const slugWithDash = normalizedSlug.endsWith('-') ? normalizedSlug : `${normalizedSlug}-`;
  const slugWithoutDash = normalizedSlug.replace(/-+$/, '');

  const experience = await prisma.experiences.findFirst({
    where: {
      OR: [
        { slug: normalizedSlug },
        { slug: slugWithDash },
        { slug: slugWithoutDash },
        { id: isNumeric ? Number(slugParam) : -1 },
      ],
      status: 'published',
      is_active: true,
    },
    include: {
      cities: true,
    },
  });

  if (!experience) {
    return {
      title: 'Experience Not Found | Locallytrip',
      description: 'Pengalaman tur lokal tidak ditemukan.',
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://locallytrip.com';
  const title = getLocalizedContent(experience, 'title', locale) || experience.title;
  const cityName = experience.cities?.name || 'Indonesia';
  const metaTitle = `${title} - Tur Lokal ${cityName} | Locallytrip`;

  const descriptionRaw =
    getLocalizedContent(experience, 'description', locale) ||
    experience.short_description ||
    experience.description ||
    '';
  const cleanDescription = descriptionRaw
    .replace(/[#*`_~>[\]()!]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 155);

  const images = parseJsonArray(experience.images);
  const primaryImage = images[0]
    ? images[0].startsWith('http') || images[0].startsWith('/')
      ? images[0]
      : `${siteUrl}/images/experiences/${images[0]}`
    : `${siteUrl}/images/default.jpg`;

  return {
    title: metaTitle,
    description: cleanDescription,
    alternates: {
      canonical: `${siteUrl}/${locale}/experiences/${experience.slug || slugParam}`,
      languages: {
        'id-ID': `${siteUrl}/id/experiences/${experience.slug || slugParam}`,
        'en-US': `${siteUrl}/en/experiences/${experience.slug || slugParam}`,
      },
    },
    openGraph: {
      title: metaTitle,
      description: cleanDescription,
      url: `${siteUrl}/${locale}/experiences/${experience.slug || slugParam}`,
      siteName: 'Locallytrip',
      locale: locale === 'id' ? 'id_ID' : 'en_US',
      type: 'website',
      images: [
        {
          url: primaryImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
  };
}

export default async function ExperienceDetailPage({
  params,
}: ExperienceDetailPageProps) {
  const resolvedParams = await params;
  const locale = (resolvedParams.lang === 'en' ? 'en' : 'id') as Locale;
  const slugParam = resolvedParams.slug;
  const isNumeric = !isNaN(Number(slugParam));
  const normalizedSlug = decodeURIComponent(slugParam).trim().toLowerCase();
  const slugWithDash = normalizedSlug.endsWith('-') ? normalizedSlug : `${normalizedSlug}-`;
  const slugWithoutDash = normalizedSlug.replace(/-+$/, '');

  // Kueri Data Prisma Lengkap Sesuai Spesifikasi
  const experience = await prisma.experiences.findFirst({
    where: {
      OR: [
        { slug: normalizedSlug },
        { slug: slugWithDash },
        { slug: slugWithoutDash },
        { id: isNumeric ? Number(slugParam) : -1 },
      ],
      status: 'published',
      is_active: true,
    },
    include: {
      users: {
        select: {
          id: true,
          name: true,
          avatar_url: true,
          bio: true,
          is_verified: true,
          is_trusted: true,
          created_at: true,
          user_languages: {
            include: {
              languages: {
                select: {
                  name: true,
                  native_name: true,
                },
              },
            },
          },
        },
      },
      host_categories: {
        select: {
          id: true,
          name: true,
          icon: true,
        },
      },
      cities: {
        select: {
          id: true,
          name: true,
        },
      },
      experience_itineraries: {
        orderBy: {
          step_order: 'asc',
        },
      },
      reviews: {
        include: {
          users: {
            select: {
              id: true,
              name: true,
              avatar_url: true,
              cities: { select: { name: true } },
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      },
      _count: {
        select: {
          reviews: true,
          bookings: true,
        },
      },
    },
  });

  if (!experience) {
    notFound();
  }

  // Cek sesi user saat ini (NextAuth & raw cookie session)
  const [nextAuthSession, rawSession] = await Promise.all([
    getServerSession(authOptions).catch(() => null),
    getCurrentUserSession().catch(() => null),
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

  // Cek apakah user saat ini mengikuti host experience
  let initialIsFollowingHost = false;
  const hostId = experience.host_id || experience.users?.id;
  if (currentUserId && hostId && currentUserId !== hostId) {
    const followRecord = await prisma.user_follows.findUnique({
      where: {
        follower_id_following_id: {
          follower_id: currentUserId,
          following_id: hostId,
        },
      },
      select: { id: true },
    }).catch(() => null);
    initialIsFollowingHost = Boolean(followRecord);
  }

  // Siapkan Data Bersih untuk Komponen Klien
  const currentTitle =
    locale === 'en'
      ? experience.title_en || experience.title
      : experience.title_id || experience.title;

  const currentDescription =
    locale === 'en'
      ? experience.description_en || experience.description
      : experience.description_id || experience.description;

  const images = parseJsonArray(experience.images);
  const inclusions = parseJsonArray(experience.included_items);
  const exclusions = parseJsonArray(experience.excluded_items);
  const whatToExpect = parseJsonArray(experience.what_to_expect);
  const requirements = parseJsonArray(experience.requirements);
  const deliverables = parseJsonArray(experience.deliverables);
  const equipmentUsed = parseJsonArray(experience.equipment_used);

  const realReviews = experience.reviews || [];
  const totalReviews = realReviews.length;
  const averageRating =
    totalReviews > 0
      ? Number((realReviews.reduce((acc, r) => acc + Number(r.rating), 0) / totalReviews).toFixed(1))
      : (experience.rating_average ? Number(experience.rating_average) : 0);

  const detailData: ExperienceDetailData = {
    id: experience.id,
    slug: experience.slug || String(experience.id),
    title: currentTitle,
    description: currentDescription,
    description_id: experience.description_id,
    description_en: experience.description_en,
    short_description: experience.short_description,
    package_price: experience.package_price ? Number(experience.package_price) : 0,
    currency: experience.currency || 'USD',
    duration_hours: experience.duration_hours || 4,
    max_guests: experience.max_participants || 6,
    images: images,
    meeting_point: experience.meeting_point,
    ending_point: experience.ending_point,
    inclusions: inclusions,
    exclusions: exclusions,
    what_to_expect: whatToExpect,
    requirements: requirements,
    deliverables: deliverables,
    equipment_used: equipmentUsed,
    host_specific_data: experience.host_specific_data,
    walking_distance_km: experience.walking_distance_km ? Number(experience.walking_distance_km) : null,
    fitness_level: experience.fitness_level,
    difficulty_level: experience.difficulty_level,
    rating_average: averageRating,
    rating_count: totalReviews > 0 ? totalReviews : (experience._count?.reviews ?? experience.rating_count ?? 0),
    booking_count: experience._count?.bookings ?? experience.booking_count ?? 0,
    host: experience.users
      ? {
          id: experience.users.id,
          name: experience.users.name,
          avatar_url: experience.users.avatar_url,
          bio: experience.users.bio,
          is_verified: experience.users.is_verified,
          is_trusted: experience.users.is_trusted,
          created_at: experience.users.created_at,
          user_languages: experience.users.user_languages,
        }
      : null,
    host_categories: experience.host_categories,
    cities: experience.cities,
    itineraries: (experience.experience_itineraries || []).map((it) => ({
      id: it.id,
      step_order: it.step_order,
      title: it.title,
      description: it.description,
      duration_minutes: it.duration_minutes,
      location: it.location,
    })),
    reviews: realReviews.map((rev) => ({
      id: rev.id,
      rating: rev.rating ?? 5,
      comment: rev.comment,
      host_reply: rev.host_reply,
      host_replied_at: rev.host_replied_at ? rev.host_replied_at.toISOString() : null,
      created_at: rev.created_at,
      user: rev.users
        ? {
            id: rev.users.id,
            name: rev.users.name,
            avatar_url: rev.users.avatar_url,
            cityName: rev.users.cities?.name || null,
          }
        : null,
    })),
  };

  // Structured Data JSON-LD untuk SEO
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://locallytrip.com';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: detailData.title,
    description: detailData.short_description || detailData.description.slice(0, 180),
    image: images.map((img) =>
      img.startsWith('http') || img.startsWith('/') ? img : `${siteUrl}/images/experiences/${img}`
    ),
    touristType: detailData.host_categories?.name || 'Authentic Local Tour Experience',
    offers: {
      '@type': 'Offer',
      price: detailData.package_price,
      priceCurrency: detailData.currency,
      availability: 'https://schema.org/InStock',
      url: `${siteUrl}/${locale}/experiences/${detailData.slug}`,
      seller: {
        '@type': 'Person',
        name: detailData.host?.name || 'Local Host',
      },
    },
    provider: {
      '@type': 'Organization',
      name: 'PT Locallytrip Teknologi Indonesia',
      url: siteUrl,
    },
  };

  // Structured Data BreadcrumbList JSON-LD
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
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
        name: locale === 'en' ? 'Experiences' : 'Pengalaman',
        item: `${siteUrl}/${locale}/experiences`,
      },
      ...(detailData.cities
        ? [
            {
              '@type': 'ListItem',
              position: 3,
              name: detailData.cities.name,
              item: `${siteUrl}/${locale}/experiences?city=${detailData.cities.id}`,
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: detailData.title,
              item: `${siteUrl}/${locale}/experiences/${detailData.slug}`,
            },
          ]
        : [
            {
              '@type': 'ListItem',
              position: 3,
              name: detailData.title,
              item: `${siteUrl}/${locale}/experiences/${detailData.slug}`,
            },
          ]),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <main className="min-h-screen bg-slate-50/50">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <ExperienceDetailClient
            experience={detailData}
            locale={locale}
            initialIsFollowingHost={initialIsFollowingHost}
          />
        </div>
      </main>
    </>
  );
}
