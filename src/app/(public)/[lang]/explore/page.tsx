import React from 'react';
import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import { ExploreClient, ExploreCityItem, ExploreHostItem } from '@/components/marketplace/ExploreClient';
import { getDictionary, Locale } from '@/lib/dictionary';

interface ExplorePageProps {
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
  const canonicalUrl = `${siteUrl}/${lang}/explore`;

  const title = isId
    ? 'Eksplorasi Destinasi & Kota Otentik di Indonesia | Locallytrip'
    : 'Explore Authentic Indonesian Destinations & Cities | Locallytrip';

  const description = isId
    ? 'Temukan kota tujuan impian dan jelajahi sudut tersembunyi Indonesia bersama pemandu lokal berlisensi dan terverifikasi KYC.'
    : 'Discover dream Indonesian destinations and explore hidden gems guided by licensed KYC-verified local insiders.';

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'id-ID': `${siteUrl}/id/explore`,
        'en-US': `${siteUrl}/en/explore`,
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
          url: `${siteUrl}/images/explore/hero-luggage.png`,
          width: 500,
          height: 500,
          alt: 'Explore Authentic Indonesia',
        },
      ],
    },
  };
}

export default async function ExplorePage({ params }: ExplorePageProps) {
  const resolvedParams = await params;
  const locale = (resolvedParams.lang === 'en' ? 'en' : 'id') as Locale;

  const dict = await getDictionary(locale);

  // 1. Ambil data kota dengan agregasi hitungan pengalaman, meetup, dan cerita
  const citiesRaw = await prisma.cities.findMany({
    where: { is_active: true },
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
          experiences: {
            where: { is_active: true, status: 'published' },
          },
          vibes_travel_meetups: true,
          stories: true,
        },
      },
    },
  });

  // Filter kota yang memiliki konten (>= 1) dan urutkan terbanyak (experiences + meetups + stories) DESC
  const cities: ExploreCityItem[] = citiesRaw
    .map((c) => ({
      id: c.id,
      name: c.name,
      country_name: c.countries?.name || null,
      country_code: c.countries?.code || null,
      image_url: c.image_url,
      _count: {
        experiences: c._count.experiences,
        vibes_travel_meetups: c._count.vibes_travel_meetups,
        stories: c._count.stories,
      },
      totalContent:
        c._count.experiences + c._count.vibes_travel_meetups + c._count.stories,
    }))
    .filter((c) => c.totalContent > 0)
    .sort((a, b) => b.totalContent - a.totalContent)
    .map(({ totalContent, ...cityItem }) => cityItem);

  // 2. Ambil pemandu lokal terverifikasi unggulan (hanya dengan foto profil nyata)
  const hostsRaw = await prisma.users.findMany({
    where: {
      role: 'host',
      is_active: true,
      OR: [
        { is_verified: true },
        { host_kyc_host_kyc_user_idTousers: { is: { status: 'approved' } } },
      ],
      avatar_url: { not: null },
      AND: [
        { avatar_url: { not: '' } },
        { NOT: { avatar_url: { contains: 'default' } } },
      ],
    },
    take: 8,
    orderBy: { followers_count: 'desc' },
    select: {
      id: true,
      name: true,
      username: true,
      avatar_url: true,
      is_verified: true,
      bio: true,
      host_kyc_host_kyc_user_idTousers: {
        select: { status: true },
      },
      cities: {
        select: { name: true },
      },
      experiences: {
        take: 1,
        select: {
          rating_average: true,
          rating_count: true,
          cities: {
            select: { name: true },
          },
        },
      },
    },
  });

  const hosts: ExploreHostItem[] = hostsRaw.map((h) => {
    const exp = h.experiences[0];
    const isKycApproved =
      h.host_kyc_host_kyc_user_idTousers?.status === 'approved' || h.is_verified === true;

    return {
      id: h.id,
      name: h.name,
      username: h.username,
      avatar_url: h.avatar_url,
      is_verified: isKycApproved,
      bio: h.bio,
      city_name: h.cities?.name || exp?.cities?.name || 'Indonesia',
      rating_average: exp?.rating_average ? Number(exp.rating_average) : 4.9,
      rating_count: exp?.rating_count ?? 24,
    };
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://locallytrip.com';

  // Skema JSON-LD terstruktur untuk GEO & AEO
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
            name: locale === 'en' ? 'Explore Destinations' : 'Eksplorasi Destinasi',
            item: `${siteUrl}/${locale}/explore`,
          },
        ],
      },
      {
        '@type': 'ItemList',
        name: locale === 'en' ? 'Top Authentic Indonesian Cities' : 'Direktori Kota Terpopuler Indonesia',
        description:
          locale === 'en'
            ? 'Top curated tourist destinations and vibrant cities across Indonesia.'
            : 'Destinasi wisata otentik dan direktori kota terpopuler di Indonesia.',
        itemListElement: cities.slice(0, 10).map((city, index) => {
          const citySlug = city.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
          return {
            '@type': 'TouristDestination',
            position: index + 1,
            name: city.name,
            url: `${siteUrl}/${locale}/destination/${citySlug}`,
            description: `Jelajahi wisata lokal otentik, tur tersembunyi, dan agenda kumpul komunitas di ${city.name}.`,
          };
        }),
      },
      {
        '@type': 'FAQPage',
        mainEntity: (dict.explore_faq?.items || []).map((faq) => ({
          '@type': 'Question',
          name: faq.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.a,
          },
        })),
      },
    ],
  };

  return (
    <div className="w-full min-h-screen bg-slate-50/50">
      {/* Skema JSON-LD untuk SEO, AEO, dan GEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <ExploreClient
          cities={cities}
          hosts={hosts}
          locale={locale}
          dict={dict}
        />
      </div>
    </div>
  );
}
