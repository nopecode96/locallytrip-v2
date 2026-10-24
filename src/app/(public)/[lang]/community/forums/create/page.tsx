import React from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCurrentUserSession } from '@/actions/bookings';
import { prisma } from '@/lib/prisma';
import { ForumThreadCreateClient, ForumCategoryOption } from '@/components/community/ForumThreadCreateClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mulai Topik Diskusi Baru (+25 XP & +5 LTP) | Locallytrip',
  description: 'Tanyakan tips rute, kuliner lokal, transportasi, atau cari teman perjalanan bersama ribuan penjelajah di Forum Komunitas Locallytrip.',
};

interface CreateForumThreadPageProps {
  params: Promise<{
    lang: string;
  }>;
}

export const dynamic = 'force-dynamic';

export default async function CreateForumThreadPage({ params }: CreateForumThreadPageProps) {
  const resolved = await params;
  const locale = resolved.lang || 'id';

  // 1. Guard Autentikasi Server-side
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

  // Jika belum login, alihkan ke login dengan callbackUrl ke halaman create
  if (!userEmail) {
    redirect(`/auth/login?redirect=/${locale}/community/forums/create`);
  }

  // 2. Tarik daftar kategori forum aktif dari database (diurutkan berdasarkan display_order asc lalu name asc)
  const categoriesRaw = await prisma.vibes_forum_categories.findMany({
    where: { is_active: true },
    orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
      description: true,
    },
  });

  const categories: ForumCategoryOption[] = categoriesRaw.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    icon: c.icon,
    description: c.description,
  }));

  // 3. Tarik daftar kota aktif untuk kebutuhan pemilihan destinasi opsional (CitySearchCombobox)
  const citiesRaw = await prisma.cities.findMany({
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
  });

  const cities = citiesRaw.map((c) => ({
    id: c.id,
    name: c.name,
    country_name: c.countries?.name || null,
    country_code: c.countries?.code || null,
  }));

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <ForumThreadCreateClient
          categories={categories}
          cities={cities}
          locale={locale}
        />
      </div>
    </div>
  );
}
