import React from 'react';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import {
  MeetupDetailClient,
  MeetupDetailData,
  CurrentUserSessionData,
} from '@/components/community/MeetupDetailClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCurrentUserSession } from '@/actions/bookings';
import { getPublicImageUrl } from '@/lib/images';
import { resolveMeetupDisplayImage } from '@/lib/utils/images';

interface MeetupDetailPageProps {
  params: Promise<{
    lang: string;
    slug: string;
  }>;
}

export const dynamic = 'force-dynamic';

async function getMeetupData(slugOrId: string) {
  const isNumeric = /^\d+$/.test(slugOrId);
  const numId = isNumeric ? parseInt(slugOrId, 10) : parseInt(slugOrId, 10) || -1;

  // Cari meetup berdasarkan slug atau id
  let meetup = await prisma.vibes_travel_meetups.findFirst({
    where: isNumeric
      ? { id: numId }
      : {
        OR: [
          { slug: slugOrId },
          ...(numId > 0 ? [{ id: numId }] : []),
        ],
      },
    include: {
      users: {
        select: {
          id: true,
          name: true,
          username: true,
          avatar_url: true,
          role: true,
          is_verified: true,
          bio: true,
          host_kyc_host_kyc_user_idTousers: {
            select: { status: true },
          },
          user_xp: {
            select: { current_level: true, total_xp: true },
          },
        },
      },
      cities: {
        select: { id: true, name: true, description: true, image_url: true },
      },
      experience_types: {
        select: { id: true, name: true, icon: true },
      },
      vibes_travel_meetup_members: {
        include: {
          users: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar_url: true,
              is_verified: true,
            },
          },
        },
        orderBy: {
          id: 'asc',
        },
      },
    },
  });

  // Fallback slug partial match jika URL sedikit berbeda
  if (!meetup && !isNumeric) {
    meetup = await prisma.vibes_travel_meetups.findFirst({
      where: {
        OR: [
          { slug: { startsWith: slugOrId.slice(0, 25) } },
          { title: { contains: slugOrId.replace(/-/g, ' ').slice(0, 25), mode: 'insensitive' } },
        ],
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar_url: true,
            role: true,
            is_verified: true,
            bio: true,
            host_kyc_host_kyc_user_idTousers: {
              select: { status: true },
            },
            user_xp: {
              select: { current_level: true, total_xp: true },
            },
          },
        },
        cities: {
          select: { id: true, name: true, description: true, image_url: true },
        },
        experience_types: {
          select: { id: true, name: true, icon: true },
        },
        vibes_travel_meetup_members: {
          include: {
            users: {
              select: {
                id: true,
                name: true,
                username: true,
                avatar_url: true,
                is_verified: true,
              },
            },
          },
          orderBy: {
            id: 'asc',
          },
        },
      },
    });
  }

  return meetup;
}

export async function generateMetadata({
  params,
}: MeetupDetailPageProps): Promise<Metadata> {
  const resolved = await params;
  const meetup = await getMeetupData(resolved.slug);

  if (!meetup) {
    return {
      title: 'Meetup Agenda | Locallytrip',
    };
  }

  const cityName = meetup.cities?.name ? ` di ${meetup.cities.name}` : '';
  return {
    title: `${meetup.title}${cityName} | Locallytrip Meetup`,
    description: meetup.description
      ? meetup.description.slice(0, 160)
      : `Gabung agenda kumpul seru traveler Locallytrip: ${meetup.title}`,
    openGraph: {
      title: `${meetup.title} | Locallytrip Meetup`,
      description: meetup.description ? meetup.description.slice(0, 160) : undefined,
      type: 'website',
    },
  };
}

export default async function MeetupDetailPage({ params }: MeetupDetailPageProps) {
  const resolved = await params;
  const meetup = await getMeetupData(resolved.slug);

  if (!meetup) {
    notFound();
  }

  const isId = resolved.lang === 'id';
  const creator = meetup.users;

  // Resolusi banner image meetup terpusat (User upload -> City image -> Default cover)
  const bannerImage = resolveMeetupDisplayImage(
    meetup.images,
    meetup.cities?.image_url
  );

  // Format anggota
  const formattedMembers = meetup.vibes_travel_meetup_members.map((member) => ({
    id: member.id,
    userId: member.user_id,
    name: member.users?.name || null,
    username: member.users?.username || null,
    avatar_url: getPublicImageUrl(member.users?.avatar_url, 'users'),
    is_verified: Boolean(member.users?.is_verified),
    status: member.status || 'joined',
  }));

  const meetupData: MeetupDetailData = {
    id: meetup.id,
    title: meetup.title,
    slug: meetup.slug || String(meetup.id),
    description: meetup.description,
    start_date: meetup.start_date.toISOString(),
    end_date: meetup.end_date.toISOString(),
    duration_days: meetup.duration_days,
    max_members: meetup.max_members,
    current_member_count: meetup.current_member_count || formattedMembers.length,
    status: meetup.status,
    join_type: meetup.join_type || 'public',
    view_count: meetup.view_count || 0,
    created_at: meetup.created_at ? meetup.created_at.toISOString() : null,
    bannerImage,
    recap_images: Array.isArray(meetup.recap_images)
      ? (meetup.recap_images as string[]).filter((url) => typeof url === 'string')
      : [],
    category: meetup.experience_types
      ? {
        id: meetup.experience_types.id,
        name: meetup.experience_types.name,
        icon: meetup.experience_types.icon,
      }
      : null,
    city: meetup.cities
      ? {
        id: meetup.cities.id,
        name: meetup.cities.name,
        description: meetup.cities.description,
        image: meetup.cities.image_url,
        image_url: meetup.cities.image_url,
        coverImage: meetup.cities.image_url,
      }
      : null,
    creator: {
      id: creator?.id || 0,
      name: creator?.name || creator?.username || 'Host Meetup',
      username: creator?.username || 'host',
      avatar_url: getPublicImageUrl(creator?.avatar_url, 'users'),
      role: creator?.role || 'host',
      is_verified: Boolean(creator?.is_verified),
      level: creator?.user_xp?.current_level || 1,
      total_xp: creator?.user_xp?.total_xp || 0,
      bio: creator?.bio || null,
      host_kyc_host_kyc_user_idTousers: (creator as any)?.host_kyc_host_kyc_user_idTousers,
    },
    members: formattedMembers,
  };

  // Cek sesi user saat ini (NextAuth & raw cookie session)
  const [nextAuthSession, rawSession] = await Promise.all([
    getServerSession(authOptions).catch(() => null),
    getCurrentUserSession().catch(() => null),
  ]);

  let currentUserId: number | null = null;
  let currentUserName = 'User';
  let currentUserEmail = '';
  let isUserLoggedIn = false;

  if (nextAuthSession?.user?.email) {
    currentUserEmail = nextAuthSession.user.email;
    const dbUser = await prisma.users.findUnique({
      where: { email: nextAuthSession.user.email },
      select: { id: true, name: true, username: true, email: true },
    });
    if (dbUser) {
      currentUserId = dbUser.id;
      currentUserName = dbUser.name || dbUser.username || 'User';
      isUserLoggedIn = true;
    }
  } else if (rawSession?.isLoggedIn && rawSession.id) {
    currentUserId = rawSession.id;
    currentUserName = rawSession.name;
    currentUserEmail = rawSession.email;
    isUserLoggedIn = true;
  }

  const currentUser: CurrentUserSessionData | null = isUserLoggedIn && currentUserId
    ? {
        id: currentUserId,
        name: currentUserName,
        email: currentUserEmail,
        isLoggedIn: true,
      }
    : null;

  // Cek apakah user saat ini sudah tergabung
  const initialIsJoined = Boolean(
    currentUser?.isLoggedIn &&
    meetup.vibes_travel_meetup_members.some((m) => m.user_id === currentUser.id)
  );

  // Cek apakah user saat ini mengikuti host meetup
  let initialIsFollowingHost = false;
  if (currentUser?.isLoggedIn && creator?.id && currentUser.id !== creator.id) {
    const followRecord = await prisma.user_follows.findUnique({
      where: {
        follower_id_following_id: {
          follower_id: currentUser.id,
          following_id: creator.id,
        },
      },
      select: { id: true },
    }).catch(() => null);
    initialIsFollowingHost = Boolean(followRecord);
  }

  // 1. Ambil pengalaman yang KHUSUS di kota meetup saja
  let cityExperiencesRaw: any[] = [];
  if (meetup.city_id) {
    cityExperiencesRaw = await prisma.experiences.findMany({
      where: {
        status: 'published',
        is_active: true,
        city_id: meetup.city_id,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        package_price: true,
        currency: true,
        rating_average: true,
        images: true,
        cities: { select: { id: true, name: true } },
        experience_types: { select: { id: true, name: true } },
        users: { select: { id: true, name: true, avatar_url: true } },
      },
      orderBy: { rating_average: 'desc' },
      take: 3,
    });
  }

  // 2. Ambil pengalaman populer platform secara terpisah (hanya jika tur kota tersebut kosong)
  let popularExperiencesRaw: any[] = [];
  if (cityExperiencesRaw.length === 0) {
    popularExperiencesRaw = await prisma.experiences.findMany({
      where: {
        status: 'published',
        is_active: true,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        package_price: true,
        currency: true,
        rating_average: true,
        images: true,
        cities: { select: { id: true, name: true } },
        experience_types: { select: { id: true, name: true } },
        users: { select: { id: true, name: true, avatar_url: true } },
      },
      orderBy: { rating_average: 'desc' },
      take: 3,
    });
  }

  const mapExperience = (exp: any) => ({
    id: exp.id,
    title: exp.title,
    slug: exp.slug,
    package_price: exp.package_price ? exp.package_price.toString() : null,
    price_idr: null,
    currency: exp.currency,
    rating_average: exp.rating_average ? exp.rating_average.toString() : '5.0',
    rating: exp.rating_average ? Number(exp.rating_average) : 5.0,
    images: exp.images,
    cities: exp.cities,
    experience_types: exp.experience_types,
    users: exp.users,
  });

  const cityExperiences = cityExperiencesRaw.map(mapExperience);
  const popularExperiences = popularExperiencesRaw.map(mapExperience);

  const cityName = meetup.cities?.name || (isId ? 'Indonesia' : 'Indonesia');
  const shortTitle =
    meetup.title.length > 35 ? `${meetup.title.substring(0, 32)}...` : meetup.title;

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {/* Navigasi Back & Breadcrumb Standar Locallytrip */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href={`/${resolved.lang}/community/meetups`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-purple-900 transition-colors bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs hover:border-purple-300 shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-purple-700" />
              <span>{isId ? 'Kembali ke Agenda Meetup' : 'Back to Meetups'}</span>
            </Link>

            <nav
              aria-label="Breadcrumb"
              className="flex items-center flex-wrap gap-2 text-xs font-medium text-slate-500"
            >
              <Link
                href={`/${resolved.lang}`}
                className="hover:text-purple-900 transition flex items-center gap-1 text-slate-600"
              >
                {isId ? 'Beranda' : 'Home'}
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              <Link
                href={`/${resolved.lang}/community`}
                className="hover:text-purple-900 transition text-slate-600"
              >
                {isId ? 'Komunitas' : 'Community'}
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              <Link
                href={`/${resolved.lang}/community/meetups`}
                className="hover:text-purple-900 transition text-slate-600"
              >
                Meetups
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              <span className="text-slate-600 font-semibold">{cityName}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              <span className="text-purple-900 font-semibold truncate max-w-[200px] sm:max-w-xs">
                {shortTitle}
              </span>
            </nav>
          </div>
        </div>

        {/* Layout 2 Kolom: Konten Agenda Meetup (Kiri) + Widget Booking/Pendaftaran & Host (Kanan) */}
        <MeetupDetailClient
          meetup={meetupData}
          lang={resolved.lang}
          currentUser={currentUser}
          initialIsJoined={initialIsJoined}
          initialIsFollowingHost={initialIsFollowingHost}
          cityExperiences={cityExperiences}
          popularExperiences={popularExperiences}
        />
      </div>
    </div>
  );
}
