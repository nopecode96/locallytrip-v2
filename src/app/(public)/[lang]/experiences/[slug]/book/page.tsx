import React from 'react';
import { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCurrentUserSession } from '@/actions/bookings';
import prisma from '@/lib/prisma';
import { getLocalizedContent } from '@/lib/i18n-helper';
import { getAvailablePaymentMethods } from '@/config/payment-gateways';
import {
  ExperienceBookingClient,
  ExperienceBookingData,
  UserBookingProfile,
} from '@/components/experiences/ExperienceBookingClient';

interface ExperienceBookingPageProps {
  params: Promise<{
    lang: string;
    slug: string;
  }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: ExperienceBookingPageProps): Promise<Metadata> {
  const resolved = await params;
  const locale = resolved.lang || 'id';
  return {
    title: locale === 'en' ? 'Book Tour Experience | Locallytrip' : 'Reservasi Tur Pengalaman | Locallytrip',
    description: 'Amankan paket tur privat Anda dengan garansi rekening bersama dan konfirmasi instan.',
  };
}

function parseJsonArray(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      if (value.includes(',')) {
        return value.split(',').map((s) => s.trim()).filter(Boolean);
      }
      return [value];
    }
  }
  return [];
}

export default async function ExperienceBookingPage({
  params,
}: ExperienceBookingPageProps) {
  const resolved = await params;
  const locale = resolved.lang || 'id';
  const slugParam = resolved.slug;
  const isNumeric = !isNaN(Number(slugParam));

  // 1. Proteksi Sesi: Jika pengguna belum login, alihkan ke /login
  let userEmail: string | null = null;
  const session = await getServerSession(authOptions).catch(() => null);
  if (session?.user?.email) {
    userEmail = session.user.email;
  } else {
    const rawSession = await getCurrentUserSession().catch(() => null);
    if (rawSession?.isLoggedIn && rawSession.email) {
      userEmail = rawSession.email;
    }
  }

  if (!userEmail) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/experiences/${slugParam}/book`);
  }

  // 2. Ambil data user & saldo dompet LTP aktif
  const user = await prisma.users.findUnique({
    where: { email: userEmail.toLowerCase().trim() },
    include: {
      user_ltp_wallets: true,
    },
  });

  if (!user) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/experiences/${slugParam}/book`);
  }

  // 3. Pengambilan Data Tur dari Prisma
  const normalizedSlug = decodeURIComponent(slugParam).trim().toLowerCase();
  const slugWithDash = normalizedSlug.endsWith('-') ? normalizedSlug : `${normalizedSlug}-`;
  const slugWithoutDash = normalizedSlug.replace(/-+$/, '');

  const experience = await prisma.experiences.findFirst({
    where: {
      OR: [
        { slug: normalizedSlug },
        { slug: slugWithDash },
        { slug: slugWithoutDash },
        { id: isNumeric ? Number(slugParam) : -1 },
      ],
      status: 'published',
      is_active: true,
    },
    include: {
      users: {
        select: {
          id: true,
          name: true,
          avatar_url: true,
        },
      },
      cities: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!experience) {
    notFound();
  }

  // Siapkan data bersih
  const title = getLocalizedContent(experience, 'title', locale as any) || experience.title;
  const images = parseJsonArray(experience.images);
  const coverImage = images[0]
    ? images[0].startsWith('http') || images[0].startsWith('/')
      ? images[0]
      : `/images/experiences/${images[0]}`
    : '/images/default.jpg';

  const rawCurrency = experience.currency ? experience.currency.toUpperCase() : 'USD';

  const experienceData: ExperienceBookingData = {
    id: experience.id,
    slug: experience.slug || String(experience.id),
    title,
    package_price: experience.package_price ? Number(experience.package_price) : 0,
    currency: rawCurrency,
    max_guests: experience.max_participants || 6,
    duration_hours: experience.duration_hours || 4,
    cover_image_url: coverImage,
    meeting_point: experience.meeting_point,
    host: experience.users,
    city: experience.cities,
  };

  const userProfile: UserBookingProfile = {
    id: user.id,
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    ltp_balance: user.user_ltp_wallets ? Number(user.user_ltp_wallets.balance) : 0,
  };

  // 4. Ambil Metode Pembayaran yang sesuai mata uang tur
  const paymentMethods = getAvailablePaymentMethods(experienceData.currency);

  return (
    <div className="w-full min-h-screen bg-slate-50/50 py-8 sm:py-12">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ExperienceBookingClient
          experience={experienceData}
          user={userProfile}
          paymentMethods={paymentMethods}
          locale={locale}
        />
      </div>
    </div>
  );
}
