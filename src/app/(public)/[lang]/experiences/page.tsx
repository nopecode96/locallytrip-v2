import React from 'react';
import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import { enum_experiences_status } from '@prisma/client';
import {
  ExperienceCatalogClient,
  CatalogExperienceItem,
  FilterCityOption,
  FilterCategoryOption,
} from '@/components/experiences/ExperienceCatalogClient';

interface ExperiencesPageProps {
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
  const canonicalUrl = `${siteUrl}/${lang}/experiences`;

  const title = isId
    ? 'Katalog Pengalaman Otentik & Tur Lokal Indonesia | Locallytrip'
    : 'All Authentic Local Experiences & Tours in Indonesia | Locallytrip';

  const description = isId
    ? 'Jelajahi ratusan tur privat, wisata kuliner, petualangan alam, dan aktivitas budaya bersama pemandu lokal berpengetahuan luas dengan tarif flat per rombongan paket privat.'
    : 'Discover authentic private excursions, local culinary tours, nature adventures, and cultural activities hosted by knowledgeable local guides with flat private group package rates.';

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'id-ID': `${siteUrl}/id/experiences`,
        'en-US': `${siteUrl}/en/experiences`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Locallytrip',
      locale: isId ? 'id_ID' : 'en_US',
      type: 'website',
    },
  };
}

export default async function ExperiencesPage({ params }: ExperiencesPageProps) {
  const resolvedParams = await params;
  const locale = resolvedParams.lang === 'en' ? 'en' : 'id';

  // 1. Ambil Pengalaman Tur Publik & Aktif dari Prisma
  const [experiencesRaw, citiesRaw, categoriesRaw] = await Promise.all([
    prisma.experiences.findMany({
      where: {
        status: enum_experiences_status.published,
        is_active: true,
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            avatar_url: true,
            is_verified: true,
            is_trusted: true,
          },
        },
        host_categories: {
          select: { id: true, name: true, icon: true },
        },
        cities: {
          select: { id: true, name: true },
        },
        _count: {
          select: { reviews: true },
        },
      },
      orderBy: { created_at: 'desc' },
    }),
    prisma.cities.findMany({
      where: { is_active: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        countries: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    }),
    prisma.host_categories.findMany({
      where: { is_active: true },
      orderBy: { sort_order: 'asc' },
      select: { id: true, name: true, icon: true },
    }),
  ]);

  // Format data experiences
  const experiences: CatalogExperienceItem[] = experiencesRaw.map((exp) => {
    let coverImage: string | null = null;
    if (Array.isArray(exp.images) && exp.images.length > 0) {
      const firstImg = String(exp.images[0]);
      coverImage = firstImg.startsWith('http') || firstImg.startsWith('/')
        ? firstImg
        : `/images/experiences/${firstImg}`;
    }
    return {
      id: exp.id,
      title: exp.title,
      slug: exp.slug,
      coverImage,
      packagePrice: exp.package_price ? Number(exp.package_price) : 0,
      currency: exp.currency || 'USD',
      durationHours: exp.duration_hours || 4,
      maxParticipants: exp.max_participants || 10,
      ratingAverage: exp.rating_average ? Number(exp.rating_average) : 0,
      reviewsCount: exp._count.reviews || 0,
      category: exp.host_categories
        ? {
            id: exp.host_categories.id,
            name: exp.host_categories.name,
            icon: exp.host_categories.icon,
          }
        : null,
      city: exp.cities
        ? {
            id: exp.cities.id,
            name: exp.cities.name,
          }
        : null,
      host: exp.users
        ? {
            id: exp.users.id,
            name: exp.users.name,
            avatar_url: exp.users.avatar_url,
            is_verified: exp.users.is_verified,
            is_trusted: exp.users.is_trusted,
          }
        : null,
      createdAt: exp.created_at.toISOString(),
    };
  });

  const cities: FilterCityOption[] = citiesRaw.map((c) => ({
    id: c.id,
    name: c.name,
    country_name: c.countries?.name || null,
    country_code: c.countries?.code || null,
  }));

  const categories: FilterCategoryOption[] = categoriesRaw.map((cat) => ({
    id: cat.id,
    name: cat.name,
    icon: cat.icon,
  }));

  return (
    <main className="min-h-screen bg-slate-50/50">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <React.Suspense fallback={<div className="min-h-[400px] flex items-center justify-center text-slate-400">Loading catalog...</div>}>
          <ExperienceCatalogClient
            initialExperiences={experiences}
            cities={cities}
            categories={categories}
            locale={locale}
          />
        </React.Suspense>
      </div>
    </main>
  );
}
