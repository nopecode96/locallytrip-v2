import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCurrentUserSession } from '@/actions/bookings';
import { prisma } from '@/lib/prisma';
import { MeetupCreateClient } from '@/components/community/MeetupCreateClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Edit Agenda Meetup Komunitas | Locallytrip',
  robots: {
    index: false,
    follow: false,
  },
};

interface EditMeetupPageProps {
  params: Promise<{
    lang: string;
    slug: string;
  }>;
}

export const dynamic = 'force-dynamic';

export default async function EditMeetupPage({ params }: EditMeetupPageProps) {
  const resolved = await params;
  const locale = resolved.lang || 'id';
  const slug = resolved.slug;

  // 1. Proteksi Sesi
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
    redirect(`/${locale}/login?callbackUrl=/${locale}/community/meetups/${slug}/edit`);
  }

  const user = await prisma.users.findUnique({
    where: { email: userEmail },
    select: { id: true },
  });

  if (!user) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/community/meetups/${slug}/edit`);
  }

  // 2. Ambil data meetup yang akan diedit
  const meetup = await prisma.vibes_travel_meetups.findUnique({
    where: { slug },
  });

  if (!meetup) {
    notFound();
  }

  // Otorisasi: Pastikan hanya creator pemilik yang dapat mengedit
  if (meetup.creator_id !== user.id) {
    redirect(`/${locale}/dashboard`);
  }

  // 3. Ambil data kota aktif dari database
  const citiesRaw = await prisma.cities.findMany({
    where: { is_active: true },
    orderBy: { name: 'asc' },
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
    },
  });

  const cities = citiesRaw.map((c) => ({
    id: c.id,
    name: c.name,
    image_url: c.image_url,
    country_name: c.countries?.name || null,
    country_code: c.countries?.code || null,
  }));

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16">
      <MeetupCreateClient
        cities={cities}
        locale={locale}
        initialData={meetup}
      />
    </div>
  );
}
