import React from 'react';
import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import { MeetupsClient, MeetupItem, MeetupCityOption } from '@/components/community/MeetupsClient';
import { getDictionary, Locale } from '@/lib/dictionary';
import { getCurrentUserSession } from '@/actions/bookings';
import { resolveMeetupDisplayImage } from '@/lib/utils/images';

interface MeetupsPageProps {
  params: Promise<{
    lang: string;
  }>;
  searchParams: Promise<{
    city?: string;
    cat?: string;
    status?: string;
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
  const canonicalUrl = `${siteUrl}/${lang}/community/meetups`;

  const title = isId
    ? 'Agenda Temu Komunitas & Teman Jalan | Locallytrip'
    : 'Community Meetups & Travel Buddies | Locallytrip';

  const description = isId
    ? 'Temukan agenda kumpul santai, jalan-jalan kota, dan petualangan bareng traveler serta local host terpercaya di Locallytrip.'
    : 'Join casual meetups, city strolls, and outdoor adventures with verified travelers and trusted local hosts on Locallytrip.';

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'id-ID': `${siteUrl}/id/community/meetups`,
        'en-US': `${siteUrl}/en/community/meetups`,
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
          url: `${siteUrl}/images/hero-meetups.png`,
          width: 1200,
          height: 630,
          alt: 'Locallytrip Community Meetups',
        },
      ],
    },
  };
}

export default async function MeetupsPage({ params, searchParams }: MeetupsPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = (await searchParams) || {};
  const locale = (resolvedParams.lang === 'en' ? 'en' : 'id') as Locale;

  const initialCity = resolvedSearchParams.city || '';
  const initialCategory = resolvedSearchParams.cat || 'all';
  const initialStatus = resolvedSearchParams.status || 'all';

  // Paralel query database riil via Prisma
  const [dict, currentUser, meetupsRaw, citiesRaw] = await Promise.all([
    getDictionary(locale),
    getCurrentUserSession().catch(() => null),

    // 1. Ambil data agenda meetup aktif dari database PostgreSQL via Prisma
    prisma.vibes_travel_meetups.findMany({
      where: {
        status: { in: ['active', 'OPEN', 'PUBLISHED'] },
        deleted_at: null,
      },
      include: {
        cities: {
          select: {
            id: true,
            name: true,
            image_url: true, // WAJIB: untuk fallback gambar kota
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
        users: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar_url: true,
            role: true,
            is_verified: true,
            user_xp: {
              select: {
                total_xp: true,
                current_level: true,
              },
            },
          },
        },
        _count: {
          select: { vibes_travel_meetup_members: true },
        },
      },
      orderBy: { start_date: 'asc' },
    }),

    // 2. Ambil daftar kota aktif untuk opsi filter dropdown
    prisma.cities.findMany({
      where: {
        is_active: true,
      },
      select: {
        id: true,
        name: true,
        image_url: true,
        countries: {
          select: {
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            vibes_travel_meetups: {
              where: {
                deleted_at: null,
                status: { in: ['active', 'OPEN', 'PUBLISHED'] },
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    }),
  ]);

  // Transformasi & Normalisasi Gambar Meetup secara Aman
  const meetups: MeetupItem[] = meetupsRaw.map((m) => {
    // Normalisasi Smart City Photo Fallback
    const resolvedDisplayImage = resolveMeetupDisplayImage(m.images, m.cities?.image_url);

    return {
      id: m.id,
      title: m.title,
      slug: m.slug,
      description: m.description,
      start_date: m.start_date.toISOString(),
      end_date: m.end_date.toISOString(),
      duration_days: m.duration_days,
      current_member_count: m.current_member_count ?? m._count.vibes_travel_meetup_members ?? 1,
      max_members: m.max_members,
      max_participants: m.max_members,
      join_type: m.join_type,
      images: m.images,
      image: resolvedDisplayImage,
      coverImage: resolvedDisplayImage,
      created_at: m.created_at ? m.created_at.toISOString() : null,
      category: m.experience_types
        ? {
            id: m.experience_types.id,
            name: m.experience_types.name,
            icon: m.experience_types.icon,
            color: m.experience_types.color,
          }
        : null,
      cities: m.cities
        ? {
            id: m.cities.id,
            name: m.cities.name,
            image: m.cities.image_url,
            image_url: m.cities.image_url,
            coverImage: m.cities.image_url,
          }
        : null,
      city: m.cities
        ? {
            id: m.cities.id,
            name: m.cities.name,
            image: m.cities.image_url,
            image_url: m.cities.image_url,
            coverImage: m.cities.image_url,
            countryName: m.cities.countries?.name || 'Indonesia',
            countryCode: m.cities.countries?.code || 'ID',
          }
        : null,
      creator: m.users
        ? {
            id: m.users.id,
            name: m.users.name,
            username: m.users.username,
            avatar: m.users.avatar_url,
            avatar_url: m.users.avatar_url,
            role: m.users.role,
            is_verified: m.users.is_verified,
          }
        : null,
      _count: {
        vibes_travel_meetup_members: m._count.vibes_travel_meetup_members,
      },
    };
  });

  // Transformasi Opsi Kota Dropdown
  const cities: MeetupCityOption[] = citiesRaw.map((c) => ({
    id: c.id,
    name: c.name,
    countryName: c.countries?.name || 'Indonesia',
    countryCode: c.countries?.code || 'ID',
    imageUrl: c.image_url,
    count: c._count.vibes_travel_meetups,
  }));

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://locallytrip.com';

  // Skema Terstruktur JSON-LD untuk AEO, GEO, & SEO
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
            name: locale === 'en' ? 'Meetups' : 'Temu Komunitas',
            item: `${siteUrl}/${locale}/community/meetups`,
          },
        ],
      },
      {
        '@type': 'ItemList',
        itemListElement: meetups.slice(0, 15).map((m, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          item: {
            '@type': 'Event',
            name: m.title,
            description: m.description || m.title,
            startDate: m.start_date,
            endDate: m.end_date,
            eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
            eventStatus: 'https://schema.org/EventScheduled',
            location: {
              '@type': 'Place',
              name: m.city ? `${m.city.name}, ${m.city.countryName || 'Indonesia'}` : 'Indonesia',
              address: {
                '@type': 'PostalAddress',
                addressLocality: m.city?.name || 'Indonesia',
                addressCountry: m.city?.countryCode || 'ID',
              },
            },
            organizer: {
              '@type': 'Person',
              name: m.creator?.name || 'Locallytrip Community Host',
            },
          },
        })),
      },
    ],
  };

  return (
    <div className="w-full min-h-screen bg-slate-50/50 py-8 sm:py-12">
      {/* Script Data Terstruktur JSON-LD untuk AEO & GEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        <React.Suspense fallback={<div className="min-h-[400px] w-full animate-pulse rounded-2xl bg-white border border-slate-100 p-8" />}>
          <MeetupsClient
            meetups={meetups}
            cities={cities}
            locale={locale}
            dict={dict}
            currentUser={currentUser}
            initialCity={initialCity}
            initialCategory={initialCategory}
            initialStatus={initialStatus}
          />
        </React.Suspense>
      </div>
    </div>
  );
}
