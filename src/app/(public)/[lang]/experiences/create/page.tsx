import React from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCurrentUserSession } from '@/actions/bookings';
import { prisma } from '@/lib/prisma';
import { ExperienceCreateClient } from '@/components/experiences/ExperienceCreateClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Buat Pengalaman Tur Baru (+50 XP) | Locallytrip',
  description: 'Rancang dan publikasikan tur lokal privat Anda kepada traveler dari seluruh dunia. Tentukan tarif per paket dan jadwal Anda sendiri.',
};

interface CreateExperiencePageProps {
  params: Promise<{
    lang: string;
  }>;
}

export const dynamic = 'force-dynamic';

export default async function CreateExperiencePage({ params }: CreateExperiencePageProps) {
  const resolved = await params;
  const locale = resolved.lang || 'id';

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

  // Jika belum login, alihkan ke login page dengan callbackUrl
  if (!userEmail) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/experiences/create`);
  }

  // 2. Ambil data pengguna dari database & validasi peran HOST
  const user = await prisma.users.findUnique({
    where: { email: userEmail },
    select: {
      id: true,
      name: true,
      role: true,
    },
  });

  if (!user) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/experiences/create`);
  }

  // Jika bukan HOST, alihkan ke halaman become-a-host
  if (user.role?.toUpperCase() !== 'HOST') {
    redirect(`/${locale}/become-a-host`);
  }

  // 3. Pengambilan Data Master (Kota aktif & Kategori tur aktif)
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

  return (
    <main className="min-h-screen bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <ExperienceCreateClient
          cities={cities}
          categories={categories}
          locale={locale}
        />
      </div>
    </main>
  );
}
