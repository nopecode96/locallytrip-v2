import React from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCurrentUserSession } from '@/actions/bookings';
import { prisma } from '@/lib/prisma';
import { MeetupCreateClient } from '@/components/community/MeetupCreateClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Buat Agenda Meetup Komunitas (+40 XP & +10 LTP) | Locallytrip',
  description: 'Inisiasi agenda temu kumpul, jalan-jalan kota, kulineran, atau petualangan bersama teman jalan komunitas di Locallytrip.',
};

interface MeetupCreatePageProps {
  params: Promise<{
    lang: string;
  }>;
}

export const dynamic = 'force-dynamic';

export default async function MeetupCreatePage({ params }: MeetupCreatePageProps) {
  const resolved = await params;
  const locale = resolved.lang || 'id';

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

  // Jika belum login, alihkan ke login page dengan callbackUrl
  if (!userEmail) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/community/meetups/create`);
  }

  // 2. Ambil data kota aktif dari database
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
      <MeetupCreateClient cities={cities} locale={locale} />
    </div>
  );
}
