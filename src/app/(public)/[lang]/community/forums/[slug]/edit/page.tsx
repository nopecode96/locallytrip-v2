import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCurrentUserSession } from '@/actions/bookings';
import { prisma } from '@/lib/prisma';
import { ForumThreadCreateClient, ForumCategoryOption } from '@/components/community/ForumThreadCreateClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Edit Topik Diskusi | Locallytrip',
  robots: {
    index: false,
    follow: false,
  },
};

interface EditForumThreadPageProps {
  params: Promise<{
    lang: string;
    slug: string;
  }>;
}

export const dynamic = 'force-dynamic';

export default async function EditForumThreadPage({ params }: EditForumThreadPageProps) {
  const resolved = await params;
  const locale = resolved.lang || 'id';
  const slug = resolved.slug;

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

  if (!userEmail) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/community/forums/${slug}/edit`);
  }

  const user = await prisma.users.findUnique({
    where: { email: userEmail },
    select: { id: true },
  });

  if (!user) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/community/forums/${slug}/edit`);
  }

  // 2. Ambil data topik diskusi yang akan diedit
  const thread = await prisma.vibes_forum_threads.findFirst({
    where: { slug },
  });

  if (!thread) {
    notFound();
  }

  // Otorisasi: Pastikan hanya author pemilik yang dapat mengedit
  if (thread.author_id !== user.id) {
    redirect(`/${locale}/dashboard`);
  }

  // 3. Tarik daftar kategori forum aktif dari database
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

  // 4. Tarik daftar kota aktif
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
          initialData={thread}
        />
      </div>
    </div>
  );
}
