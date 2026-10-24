import React from 'react';
import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { getDictionary, Locale } from '@/lib/dictionary';
import { getCurrentUser } from '@/lib/session';
import {
  UserProfileClient,
  UserProfileData,
  CurrentUserSessionData,
  TierBadgeData,
} from '@/components/users/UserProfileClient';
import {
  resolveStoryImage,
  resolveMeetupImage,
  resolveExperienceImage,
  resolveMeetupDisplayImage,
} from '@/lib/utils/images';

interface UserProfilePageProps {
  params: Promise<{
    lang: string;
    username: string;
  }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: UserProfilePageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const lang = resolvedParams.lang === 'en' ? 'en' : 'id';
  const usernameOrId = decodeURIComponent(resolvedParams.username);
  const isId = lang === 'id';

  const isNumeric = /^\d+$/.test(usernameOrId);
  const user = await prisma.users.findFirst({
    where: isNumeric
      ? { id: parseInt(usernameOrId, 10) }
      : {
          OR: [
            { username: usernameOrId },
            { name: { equals: usernameOrId, mode: 'insensitive' } },
          ],
        },
    select: {
      id: true,
      name: true,
      username: true,
      avatar_url: true,
      bio: true,
      role: true,
      is_verified: true,
      cities: { select: { name: true } },
    },
  });

  if (!user) {
    return {
      title: isId ? 'Profil Tidak Ditemukan | Locallytrip' : 'Profile Not Found | Locallytrip',
      description: isId ? 'Profil traveler tidak ditemukan.' : 'Traveler profile not found.',
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://locallytrip.com';
  const canonicalUrl = `${siteUrl}/${lang}/users/${user.username || user.id}`;
  const title = isId
    ? `${user.name} (@${user.username || user.id}) - Profil ${user.role?.toUpperCase() === 'HOST' ? 'Local Host' : 'Traveler'} | Locallytrip`
    : `${user.name} (@${user.username || user.id}) - ${user.role?.toUpperCase() === 'HOST' ? 'Local Host' : 'Traveler'} Profile | Locallytrip`;
  const description =
    user.bio ||
    (isId
      ? `Jelajahi profil perjalanan, aktivitas tur, dan diskusi dari ${user.name} di Locallytrip.`
      : `Explore travel stories, guided tours, and community activities from ${user.name} on Locallytrip.`);

  let avatarFull = `${siteUrl}/images/default.jpg`;
  if (user.avatar_url) {
    avatarFull = user.avatar_url.startsWith('http') || user.avatar_url.startsWith('/')
      ? user.avatar_url
      : `${siteUrl}/images/users/avatars/${user.avatar_url}`;
  }

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'id-ID': `${siteUrl}/id/users/${user.username || user.id}`,
        'en-US': `${siteUrl}/en/users/${user.username || user.id}`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Locallytrip',
      locale: isId ? 'id_ID' : 'en_US',
      type: 'profile',
      images: [
        {
          url: avatarFull,
          width: 800,
          height: 800,
          alt: user.name,
        },
      ],
    },
  };
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const resolvedParams = await params;
  const locale = (resolvedParams.lang === 'en' ? 'en' : 'id') as Locale;
  const usernameOrId = decodeURIComponent(resolvedParams.username);

  const isNumeric = /^\d+$/.test(usernameOrId);

  // 1. Kueri Database Riil (Prisma Query) sesuai spesifikasi
  const user = await prisma.users.findFirst({
    where: isNumeric
      ? { id: parseInt(usernameOrId, 10) }
      : {
          OR: [
            { username: usernameOrId },
            { name: { equals: usernameOrId, mode: 'insensitive' } },
          ],
        },
    include: {
      user_xp: true,
      cities: {
        select: {
          id: true,
          name: true,
          image_url: true,
        },
      },
      // Relasi KYC (Khusus Host)
      host_kyc_host_kyc_user_idTousers: {
        select: {
          status: true,
          approved_at: true,
          certifications: true,
        },
      },
      // Tur yang dipandu (Khusus jika Host)
      experiences: {
        where: {
          status: 'published',
          is_active: true,
        },
        include: {
          cities: { select: { name: true } },
          host_categories: { select: { name: true, icon: true } },
          experience_types: { select: { name: true } },
          reviews: {
            select: { rating: true },
          },
        },
        orderBy: { created_at: 'desc' },
      },
      // Cerita Perjalanan yang ditulis
      stories_stories_author_idTousers: {
        where: {
          status: 'published',
          is_active: true,
        },
        include: {
          cities: { select: { id: true, name: true } },
        },
        orderBy: { created_at: 'desc' },
      },
      // Meetup Komunitas yang dibuat
      vibes_travel_meetups: {
        include: {
          cities: { select: { id: true, name: true, image_url: true } },
          experience_types: { select: { id: true, name: true, icon: true } },
          _count: { select: { vibes_travel_meetup_members: true } },
        },
        orderBy: { start_date: 'desc' },
      },
      // Meetup yang diikuti pengguna
      vibes_travel_meetup_members: {
        include: {
          vibes_travel_meetups: {
            include: {
              cities: { select: { id: true, name: true, image_url: true } },
              experience_types: { select: { id: true, name: true, icon: true } },
              _count: { select: { vibes_travel_meetup_members: true } },
            },
          },
        },
      },
      // Diskusi Forum yang dibuat
      vibes_forum_threads_vibes_forum_threads_author_idTousers: {
        include: {
          vibes_forum_categories: { select: { id: true, name: true, slug: true, icon: true } },
          _count: { select: { vibes_forum_posts: true } },
        },
        orderBy: { created_at: 'desc' },
      },
      // Reviews yang ditulis oleh user (sebagai traveller)
      reviews: {
        include: {
          experiences: {
            select: {
              id: true,
              title: true,
              slug: true,
              images: true,
              cities: { select: { name: true } },
            },
          },
        },
        orderBy: { created_at: 'desc' },
      },
      _count: {
        select: {
          user_follows_user_follows_following_idTousers: true, // followers
          user_follows_user_follows_follower_idTousers: true, // following
          bookings: true,
        },
      },
    },
  });

  // Jika pengguna tidak ditemukan, arahkan ke notFound()
  if (!user) {
    notFound();
  }

  // 2. Logika Peran & Penegakan Status KYC (Strict Host-Only)
  const isHost = user.role?.toUpperCase() === 'HOST';
  const hasApprovedKyc = isHost && (user.host_kyc_host_kyc_user_idTousers?.status === 'approved' || user.is_verified === true);

  // 3. Kueri Ulasan Tamu pada Tur Host (Khusus jika HOST)
  const rawHostTourReviews = isHost
    ? await prisma.reviews.findMany({
        where: {
          experiences: {
            host_id: user.id,
          },
        },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              avatar_url: true,
              cities: { select: { name: true } },
            },
          },
          experiences: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
      })
    : [];

  // 4. Ambil Sesi Pengguna Aktif & Level Tiers
  const [currentUser, dict, levelTiers] = await Promise.all([
    getCurrentUser().catch(() => null),
    getDictionary(locale),
    prisma.reward_level_tiers.findMany({
      where: { is_active: true },
      orderBy: { min_xp: 'desc' },
    }),
  ]);

  const isOwnProfile = Boolean(currentUser && currentUser.id === user.id);

  // Cek relasi pertemanan (following)
  let initialIsFollowing = false;
  if (currentUser && currentUser.id !== user.id) {
    const followRel = await prisma.user_follows.findUnique({
      where: {
        follower_id_following_id: {
          follower_id: currentUser.id,
          following_id: user.id,
        },
      },
      select: { id: true },
    }).catch(() => null);
    initialIsFollowing = Boolean(followRel);
  }

  // Saldo LTP jika pemilik profil
  let ownerLtpBalance = 0;
  if (isOwnProfile) {
    const wallet = await prisma.user_ltp_wallets.findUnique({
      where: { user_id: user.id },
      select: { balance: true },
    }).catch(() => null);
    ownerLtpBalance = wallet ? Number(wallet.balance) : 0;
  }

  // 5. Transformasi Data Profil
  const profileData: UserProfileData = {
    id: user.id,
    name: user.name,
    username: user.username || `user${user.id}`,
    avatar_url: user.avatar_url,
    bio: user.bio,
    role: user.role,
    is_host: isHost,
    is_verified: hasApprovedKyc,
    created_at: user.created_at.toISOString(),
    city: user.cities
      ? {
          id: user.cities.id,
          name: user.cities.name,
          image_url: user.cities.image_url,
        }
      : null,
    xp: {
      total_xp: user.user_xp?.total_xp ?? 0,
      current_level: user.user_xp?.current_level ?? 1,
    },
    followersCount: user._count.user_follows_user_follows_following_idTousers,
    followingCount: user._count.user_follows_user_follows_follower_idTousers,
    initialIsFollowing,
    experiences: user.experiences.map((e) => {
      let firstImage: string | null = null;
      if (Array.isArray(e.images) && e.images.length > 0 && typeof e.images[0] === 'string') {
        firstImage = e.images[0];
      } else if (typeof e.images === 'string') {
        firstImage = e.images;
      }
      const img = resolveExperienceImage(firstImage);
      const revCount = e.reviews?.length || 0;
      const avgRating =
        revCount > 0
          ? Number((e.reviews.reduce((acc, r) => acc + Number(r.rating), 0) / revCount).toFixed(1))
          : (e.rating_average ? Number(e.rating_average) : 5.0);

      return {
        id: e.id,
        title: e.title,
        slug: e.slug || String(e.id),
        price: e.package_price ? Number(e.package_price) : 0,
        currency: e.currency || 'USD',
        rating: avgRating,
        ratingCount: revCount,
        durationHours: e.duration_hours || 4,
        image: img,
        cityName: e.cities?.name || 'Indonesia',
        categoryName: e.host_categories?.name || e.experience_types?.name || 'Tour',
        categoryIcon: e.host_categories?.icon || null,
      };
    }),
    hostTourReviews: rawHostTourReviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      host_reply: r.host_reply,
      host_replied_at: r.host_replied_at ? r.host_replied_at.toISOString() : null,
      created_at: r.created_at.toISOString(),
      guest: {
        id: r.users?.id || 0,
        name: r.users?.name || 'Guest Explorer',
        avatar_url: r.users?.avatar_url || null,
        cityName: r.users?.cities?.name || null,
      },
      experience: {
        id: r.experiences?.id || 0,
        title: r.experiences?.title || 'Tour Experience',
        slug: r.experiences?.slug || null,
      },
    })),
    stories: user.stories_stories_author_idTousers.map((s) => ({
      id: s.id,
      title: s.title,
      slug: s.slug,
      excerpt: s.excerpt,
      cover_image: resolveStoryImage(
        s.cover_image || (Array.isArray(s.images) && s.images.length > 0 ? s.images[0] : null)
      ),
      images: s.images,
      created_at: s.created_at.toISOString(),
      reading_time: s.reading_time || 4,
      like_count: s.like_count || 0,
      city: s.cities ? { id: s.cities.id, name: s.cities.name } : null,
    })),
    hostedMeetups: user.vibes_travel_meetups.map((m) => {
      const displayImg = resolveMeetupDisplayImage(m.images, m.cities?.image_url);
      return {
        id: m.id,
        title: m.title,
        slug: m.slug,
        description: m.description,
        start_date: m.start_date.toISOString(),
        end_date: m.end_date.toISOString(),
        duration_days: m.duration_days,
        current_member_count: m.current_member_count ?? m._count.vibes_travel_meetup_members ?? 1,
        max_members: m.max_members || 10,
        join_type: m.join_type,
        images: [displayImg],
        city: m.cities
          ? {
              id: m.cities.id,
              name: m.cities.name,
              image_url: m.cities.image_url,
            }
          : null,
        category: m.experience_types
          ? {
              id: m.experience_types.id,
              name: m.experience_types.name,
              icon: m.experience_types.icon,
            }
          : null,
      };
    }),
    joinedMeetups: user.vibes_travel_meetup_members
      .filter((mem) => mem.vibes_travel_meetups)
      .map((mem) => {
        const m = mem.vibes_travel_meetups;
        const displayImg = resolveMeetupDisplayImage(m.images, m.cities?.image_url);
        return {
          id: m.id,
          title: m.title,
          slug: m.slug,
          description: m.description,
          start_date: m.start_date.toISOString(),
          end_date: m.end_date.toISOString(),
          duration_days: m.duration_days,
          current_member_count: m.current_member_count ?? m._count.vibes_travel_meetup_members ?? 1,
          max_members: m.max_members || 10,
          join_type: m.join_type,
          images: [displayImg],
          city: m.cities
            ? {
                id: m.cities.id,
                name: m.cities.name,
                image_url: m.cities.image_url,
              }
            : null,
          category: m.experience_types
            ? {
                id: m.experience_types.id,
                name: m.experience_types.name,
                icon: m.experience_types.icon,
              }
            : null,
        };
      }),
    threads: user.vibes_forum_threads_vibes_forum_threads_author_idTousers.map((t) => ({
      id: t.id,
      title: t.title,
      slug: t.slug,
      content: t.content,
      created_at: t.created_at ? t.created_at.toISOString() : null,
      like_count: t.like_count || 0,
      reply_count: t._count.vibes_forum_posts || t.reply_count || 0,
      category: t.vibes_forum_categories
        ? {
            id: t.vibes_forum_categories.id,
            name: t.vibes_forum_categories.name,
            slug: t.vibes_forum_categories.slug,
            icon: t.vibes_forum_categories.icon,
          }
        : null,
    })),
    reviews: user.reviews.map((r) => {
      let expImg = '/images/placeholder-experience.jpg';
      const expImgs = r.experiences?.images;
      if (Array.isArray(expImgs) && expImgs.length > 0 && typeof expImgs[0] === 'string') {
        expImg = expImgs[0].startsWith('http') || expImgs[0].startsWith('/')
          ? expImgs[0]
          : `/images/experiences/${expImgs[0]}`;
      }
      return {
        id: r.id,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        created_at: r.created_at.toISOString(),
        experience: r.experiences
          ? {
              id: r.experiences.id,
              title: r.experiences.title,
              slug: r.experiences.slug,
              image: expImg,
              cityName: r.experiences.cities?.name || null,
            }
          : null,
      };
    }),
  };

  // 6. Tier Reputasi Pengguna
  const totalUserXp = user.user_xp?.total_xp ?? 0;
  const matchedTier =
    levelTiers.find((tier) => totalUserXp >= tier.min_xp) ||
    levelTiers[levelTiers.length - 1];

  const tierBadge: TierBadgeData | null = matchedTier
    ? {
        level: matchedTier.level,
        name_id: matchedTier.name_id,
        name_en: matchedTier.name_en,
        badge_icon: matchedTier.badge_icon,
      }
    : null;

  const currentUserData: CurrentUserSessionData | null = currentUser
    ? {
        id: currentUser.id,
        name: currentUser.name || '',
        email: currentUser.email || '',
        isLoggedIn: true,
      }
    : null;

  return (
    <div className="w-full min-h-screen bg-slate-50/50 py-8 sm:py-12">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <UserProfileClient
          profile={profileData}
          currentUser={currentUserData}
          locale={locale}
          dict={dict}
          tierBadge={tierBadge}
          isOwnProfile={isOwnProfile}
          ownerLtpBalance={ownerLtpBalance}
        />
      </div>
    </div>
  );
}
