import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCurrentUserSession } from '@/actions/bookings';
import prisma from '@/lib/prisma';
import { StoryCreateClient } from '@/components/stories/StoryCreateClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Edit Cerita Petualang | Locallytrip',
  robots: {
    index: false,
    follow: false,
  },
};

interface EditStoryPageProps {
  params: Promise<{
    lang: string;
    slug: string;
  }>;
}

export const dynamic = 'force-dynamic';

export default async function EditStoryPage({ params }: EditStoryPageProps) {
  const resolved = await params;
  const locale = resolved.lang === 'en' ? 'en' : 'id';
  const slug = resolved.slug;

  // 1. Guard Autentikasi Server-side
  let userEmail: string | null = null;
  const nextAuthSession = await getServerSession(authOptions);
  if (nextAuthSession?.user?.email) {
    userEmail = nextAuthSession.user.email;
  } else {
    const rawSession = await getCurrentUserSession();
    if (rawSession?.isLoggedIn && rawSession.email) {
      userEmail = rawSession.email;
    }
  }

  if (!userEmail) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/stories/${slug}/edit`);
  }

  const user = await prisma.users.findUnique({
    where: { email: userEmail },
    select: { id: true },
  });

  if (!user) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/stories/${slug}/edit`);
  }

  // 2. Ambil data story yang akan diedit
  const story = await prisma.stories.findUnique({
    where: { slug },
  });

  if (!story) {
    notFound();
  }

  // Otorisasi: Pastikan hanya author pemilik yang dapat mengedit
  if (story.author_id !== user.id) {
    redirect(`/${locale}/dashboard`);
  }

  // 3. Tarik aturan insentif reward STORY_PUBLISH dari database
  const rewardRule = await prisma.reward_action_rules.findFirst({
    where: { action_code: 'STORY_PUBLISH', is_active: true },
  });

  // 4. Tarik daftar kota untuk opsi lokasi
  const citiesRaw = await prisma.cities.findMany({
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
    <div className="min-h-screen bg-slate-50/50 pb-16">
      <StoryCreateClient
        locale={locale}
        cities={cities}
        rewardRule={{
          xp_reward: rewardRule ? rewardRule.xp_reward : 50,
          ltp_reward: rewardRule ? Number(rewardRule.ltp_reward) : 15,
          name_id: rewardRule ? rewardRule.name_id : 'Menerbitkan Cerita Perjalanan',
          name_en: rewardRule ? rewardRule.name_en : 'Publish an Authentic Travel Story',
        }}
        initialData={story}
      />
    </div>
  );
}
