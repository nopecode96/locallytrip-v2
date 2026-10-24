import React from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCurrentUserSession } from '@/actions/bookings';
import prisma from '@/lib/prisma';
import { StoryCreateClient } from '@/components/stories/StoryCreateClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tulis Cerita Petualang Baru | Locallytrip',
  description: 'Tuliskan dan terbitkan pengalaman petualangan lokal Anda dan dapatkan reward reputasi XP serta koin LTP.',
};

interface CreateStoryPageProps {
  params: Promise<{
    lang: string;
  }>;
}

export default async function CreateStoryPage({ params }: CreateStoryPageProps) {
  const resolved = await params;
  const locale = resolved.lang === 'en' ? 'en' : 'id';

  // 1. Guard Autentikasi Server-side
  let isAuthed = false;
  const nextAuthSession = await getServerSession(authOptions);
  if (nextAuthSession?.user?.id) {
    isAuthed = true;
  } else {
    const rawSession = await getCurrentUserSession();
    if (rawSession?.isLoggedIn) {
      isAuthed = true;
    }
  }

  if (!isAuthed) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/stories/create`);
  }

  // 2. Tarik aturan insentif reward STORY_PUBLISH dari database
  const rewardRule = await prisma.reward_action_rules.findFirst({
    where: { action_code: 'STORY_PUBLISH', is_active: true },
  });

  // 3. Tarik daftar kota untuk opsi lokasi
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
      />
    </div>
  );
}
