import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCurrentUserSession } from '@/actions/bookings';
import { prisma } from '@/lib/prisma';
import { ExperienceCreateClient } from '@/components/experiences/ExperienceCreateClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Edit Pengalaman Tur | Locallytrip',
  robots: {
    index: false,
    follow: false,
  },
};

interface EditExperiencePageProps {
  params: Promise<{
    lang: string;
    slug: string;
  }>;
}

export const dynamic = 'force-dynamic';

export default async function EditExperiencePage({ params }: EditExperiencePageProps) {
  const resolved = await params;
  const locale = resolved.lang || 'id';
  const slug = resolved.slug;

  // 1. Validasi Sesi Pengguna
  let userEmail: string | null = null;
  const session = await getServerSession(authOptions);
  if (session?.user?.email) {
    userEmail = session.user.email;
  } else {
    const rawSession = await getCurrentUserSession();
    if (rawSession?.isLoggedIn && rawSession.email) {
      userEmail = rawSession.email;
    }
  }

  if (!userEmail) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/experiences/${slug}/edit`);
  }

  const user = await prisma.users.findUnique({
    where: { email: userEmail },
    select: { id: true, role: true },
  });

  if (!user) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/experiences/${slug}/edit`);
  }

  // 2. Ambil data experience yang akan diedit
  const experience = await prisma.experiences.findUnique({
    where: { slug },
    include: {
      experience_itineraries: {
        orderBy: { step_order: 'asc' },
      },
    },
  });

  if (!experience) {
    notFound();
  }

  // Otorisasi: Pastikan hanya host pemilik yang dapat mengedit
  if (experience.host_id !== user.id) {
    redirect(`/${locale}/dashboard`);
  }

  // 3. Pengambilan Data Master
  const [citiesRaw, categories] = await Promise.all([
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
      select: {
        id: true,
        name: true,
        icon: true,
        description: true,
      },
    }),
  ]);

  const cities = citiesRaw.map((c) => ({
    id: c.id,
    name: c.name,
    country_name: c.countries?.name || null,
    country_code: c.countries?.code || null,
  }));

  const formattedInitialData = {
    ...experience,
    price: Number(experience.package_price || 0),
    categoryId: experience.category_id,
    cityId: experience.city_id,
    durationHours: experience.duration_hours,
    maxParticipants: experience.max_participants,
    deliverables: Array.isArray(experience.deliverables) ? experience.deliverables : [],
    inclusions: Array.isArray(experience.included_items) ? experience.included_items : [],
    exclusions: Array.isArray(experience.excluded_items) ? experience.excluded_items : [],
    what_to_bring: Array.isArray(experience.requirements) ? experience.requirements : [],
    images: Array.isArray(experience.images) ? experience.images : [],
    itinerary: (experience.experience_itineraries || []).map((it) => ({
      time: `Stop ${it.step_order}`,
      title: it.title,
      description: it.description || '',
      durationMinutes: it.duration_minutes || 45,
      location: it.location || '',
    })),
  };

  return (
    <main className="min-h-screen bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <ExperienceCreateClient
          cities={cities}
          categories={categories}
          locale={locale}
          initialData={formattedInitialData}
        />
      </div>
    </main>
  );
}
