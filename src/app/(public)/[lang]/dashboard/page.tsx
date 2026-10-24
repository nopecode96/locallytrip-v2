import React, { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUserSession, getUserBookings } from '@/actions/bookings';
import {
  DashboardClient,
  DashboardStoryItem,
  DashboardMeetupItem,
  DashboardBookingItem,
  LevelTierItem,
  DashboardTransactionItem,
} from '@/components/dashboard/DashboardClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard Pengguna | Locallytrip',
  description: 'Kelola cerita petualang, agenda meetup, pesanan tur, dan saldo koin reward LTP Anda.',
};

interface DashboardPageProps {
  params: Promise<{
    lang: string;
  }>;
}

export const dynamic = 'force-dynamic';

export default async function DashboardPage({ params }: DashboardPageProps) {
  const resolved = await params;
  const locale = resolved.lang === 'en' ? 'en' : 'id';

  // 1. Proteksi Sesi Server-side
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
    redirect(`/${locale}/login?callbackUrl=/${locale}/dashboard`);
  }

  // 2. Tarik Data Pengguna dari Prisma
  const user = await prisma.users.findUnique({
    where: { email: userEmail },
    include: {
      user_xp: true,
      user_ltp_wallets: true,
      host_kyc_host_kyc_user_idTousers: {
        select: { status: true },
      },
      cities: {
        select: { id: true, name: true },
      },
      stories_stories_author_idTousers: {
        orderBy: { created_at: 'desc' },
        take: 10,
        include: {
          cities: { select: { id: true, name: true } },
        },
      },
      vibes_travel_meetups: {
        where: { deleted_at: null },
        orderBy: { start_date: 'desc' },
        take: 10,
        include: {
          cities: { select: { id: true, name: true } },
        },
      },
      user_ltp_transactions: {
        orderBy: { created_at: 'desc' },
        take: 20,
      },
      bookings: {
        orderBy: { created_at: 'desc' },
        take: 10,
        include: {
          experiences: {
            select: { id: true, title: true, slug: true, images: true },
          },
        },
      },
    },
  });

  if (!user) {
    redirect(`/${locale}/login`);
  }

  // 3. Tarik Level Tiers aktif untuk gamifikasi
  const levelTiersRaw = await prisma.reward_level_tiers.findMany({
    where: { is_active: true },
    orderBy: { min_xp: 'asc' },
  });

  const levelTiers: LevelTierItem[] = levelTiersRaw.map((t) => ({
    level: t.level,
    min_xp: t.min_xp,
    badge_icon: t.badge_icon,
    name_id: t.name_id,
    name_en: t.name_en,
  }));

  // Hitung total stories, meetups, bookings, & forum threads
  const totalStories = await prisma.stories.count({
    where: { author_id: user.id },
  });
  const totalMeetups = await prisma.vibes_travel_meetups.count({
    where: { creator_id: user.id, deleted_at: null },
  });
  const totalBookings = await prisma.bookings.count({
    where: { user_id: user.id },
  });
  const totalForumThreads = await prisma.vibes_forum_threads.count({
    where: { author_id: user.id, deleted_at: null },
  });

  const rawUserForumThreads = await prisma.vibes_forum_threads.findMany({
    where: { author_id: user.id, deleted_at: null },
    orderBy: { created_at: 'desc' },
    take: 20,
    include: {
      vibes_forum_categories: { select: { name: true } },
    },
  });

  const formattedForumThreads = rawUserForumThreads.map((t) => ({
    id: t.id,
    title: t.title,
    slug: t.slug,
    status: t.status || 'published',
    category_name: t.vibes_forum_categories?.name || null,
    view_count: t.view_count || 0,
    reply_count: t.reply_count || 0,
    like_count: t.like_count || 0,
    created_at: t.created_at ? t.created_at.toISOString() : new Date().toISOString(),
  }));

  // Format data stories
  const formattedStories: DashboardStoryItem[] = user.stories_stories_author_idTousers.map((s) => ({
    id: s.id,
    title: s.title,
    slug: s.slug,
    status: s.status || 'published',
    cover_image: s.cover_image,
    created_at: s.created_at.toISOString(),
    view_count: s.view_count || 0,
    like_count: s.like_count || 0,
    comment_count: s.comment_count || 0,
    city_name: s.cities?.name || null,
  }));

  // Format data meetups
  const formattedMeetups: DashboardMeetupItem[] = user.vibes_travel_meetups.map((m) => ({
    id: m.id,
    title: m.title,
    slug: m.slug,
    status: m.status || 'active',
    start_date: m.start_date.toISOString(),
    current_member_count: m.current_member_count || 1,
    max_members: m.max_members,
    city_name: m.cities?.name || null,
  }));

  // Format data bookings
  const formattedBookings: DashboardBookingItem[] = user.bookings.map((b) => {
    let coverImg: string | null = null;
    if (b.experiences?.images) {
      if (Array.isArray(b.experiences.images) && b.experiences.images.length > 0) {
        coverImg = String(b.experiences.images[0]);
      }
    }
    return {
      id: b.id,
      booking_reference: b.booking_reference,
      status: b.status,
      selected_date: b.selected_date ? b.selected_date.toISOString() : null,
      total_price: Number(b.total_price) || 0,
      participant_count: b.participant_count || 1,
      experience_title: b.experiences?.title || 'Local Tour Experience',
      experience_slug: b.experiences?.slug || null,
      experience_image: coverImg,
    };
  });

  // Format data mutasi transaksi LTP
  const formattedTransactions: DashboardTransactionItem[] = (user.user_ltp_transactions || []).map((t) => ({
    id: t.id,
    amount: Number(t.amount),
    type: t.type,
    activity_type: t.activity_type,
    created_at: t.created_at ? t.created_at.toISOString() : new Date().toISOString(),
  }));

  // Tarik pemesanan via getUserBookings (traveller & host)
  const { travellerBookings, hostBookings } = await getUserBookings();

  // 4. Kueri Lengkap Pesanan Milik Pengguna (Pesanan Saya / My Bookings)
  const rawUserBookings = await prisma.bookings.findMany({
    where: { user_id: user.id },
    include: {
      experiences: {
        select: {
          id: true,
          slug: true,
          title: true,
          images: true,
          currency: true,
          package_price: true,
          duration_hours: true,
          meeting_point: true,
          cities: { select: { name: true } },
          users: {
            select: {
              id: true,
              name: true,
              avatar_url: true,
              phone: true,
            },
          },
        },
      },
      payments: {
        select: {
          id: true,
          amount: true,
          currency: true,
          status: true,
          payment_gateway: true,
          gateway_payment_method: true,
          created_at: true,
        },
        orderBy: { created_at: 'desc' },
        take: 1,
      },
      reviews: {
        select: { id: true, rating: true },
      },
    },
    orderBy: { created_at: 'desc' },
  });

  const formattedUserBookings = rawUserBookings.map((b) => {
    let coverImg: string = '/images/placeholder-experience.jpg';
    if (b.experiences?.images) {
      if (Array.isArray(b.experiences.images) && b.experiences.images.length > 0) {
        const rawImg = String(b.experiences.images[0]);
        if (rawImg.startsWith('http') || rawImg.startsWith('/')) {
          coverImg = rawImg;
        } else {
          coverImg = `/images/experiences/${rawImg}`;
        }
      }
    }

    return {
      id: b.id,
      booking_reference: b.booking_reference || `LT-${b.id}`,
      status: (b.status || 'pending').toLowerCase(),
      selected_date: b.selected_date ? b.selected_date.toISOString() : null,
      selected_time: b.selected_time ? b.selected_time.toISOString() : null,
      participant_count: b.participant_count || b.quantity || 1,
      total_price: Number(b.total_price) || 0,
      currency: b.experiences?.currency || (b.category_specific as any)?.currency || 'USD',
      created_at: b.created_at.toISOString(),
      experience: {
        id: b.experiences?.id || 0,
        slug: b.experiences?.slug || null,
        title: b.experiences?.title || 'Pengalaman Lokal',
        cover_image: coverImg,
        duration_hours: b.experiences?.duration_hours || 4,
        meeting_point: b.experiences?.meeting_point || null,
        city_name: b.experiences?.cities?.name || 'Indonesia',
        host: {
          id: b.experiences?.users?.id || 0,
          name: b.experiences?.users?.name || 'Local Host',
          avatar_url: b.experiences?.users?.avatar_url || null,
          phone: b.experiences?.users?.phone || null,
        },
      },
      payment: b.payments[0]
        ? {
            id: b.payments[0].id,
            amount: Number(b.payments[0].amount),
            currency: b.payments[0].currency || 'USD',
            status: b.payments[0].status || 'pending',
            payment_gateway: b.payments[0].payment_gateway,
            gateway_payment_method: b.payments[0].gateway_payment_method,
            created_at: b.payments[0].created_at.toISOString(),
          }
        : null,
      reviews: b.reviews ? [{ id: b.reviews.id, rating: b.reviews.rating }] : [],
    };
  });

  // 5. Cek Peran Host (berdasarkan role === 'host' ATAU memiliki tur di database)
  const hostExperienceCount = await prisma.experiences.count({
    where: { host_id: user.id },
  });
  const isHost = user.role?.toUpperCase() === 'HOST' || hostExperienceCount > 0;

  // 6. Kueri Pesanan Masuk Host Langsung dari Database
  let rawHostBookings: any[] = [];
  if (isHost) {
    rawHostBookings = await prisma.bookings.findMany({
      where: {
        experiences: {
          host_id: user.id,
        },
      },
      include: {
        experiences: {
          select: {
            id: true,
            title: true,
            slug: true,
            images: true,
            currency: true,
            package_price: true,
            meeting_point: true,
            cities: { select: { name: true } },
          },
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar_url: true,
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            currency: true,
            status: true,
            payment_gateway: true,
            gateway_payment_method: true,
            created_at: true,
          },
          orderBy: { created_at: 'desc' },
          take: 1,
        },
        reviews: {
          select: {
            id: true,
            rating: true,
            comment: true,
            host_reply: true,
            host_replied_at: true,
            created_at: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  const formattedHostBookings = rawHostBookings.map((b) => {
    let coverImg: string = '/images/placeholder-experience.jpg';
    if (b.experiences?.images) {
      if (Array.isArray(b.experiences.images) && b.experiences.images.length > 0) {
        const rawImg = String(b.experiences.images[0]);
        if (rawImg.startsWith('http') || rawImg.startsWith('/')) {
          coverImg = rawImg;
        } else {
          coverImg = `/images/experiences/${rawImg}`;
        }
      }
    }

    const contactInfo = (b.contact_info as any) || {};

    return {
      id: b.id,
      booking_reference: b.booking_reference || `LT-${b.id}`,
      status: (b.status || 'pending').toLowerCase(),
      selected_date: b.selected_date ? b.selected_date.toISOString() : null,
      selected_time: b.selected_time ? b.selected_time.toISOString() : null,
      participant_count: b.participant_count || b.quantity || 1,
      total_price: Number(b.total_price) || 0,
      currency: b.experiences?.currency || (b.category_specific as any)?.currency || 'USD',
      special_requests: b.special_requests || null,
      created_at: b.created_at.toISOString(),
      experience: {
        id: b.experiences?.id || 0,
        title: b.experiences?.title || 'Pengalaman Lokal',
        slug: b.experiences?.slug || null,
        cover_image: coverImg,
        meeting_point: b.experiences?.meeting_point || null,
        city_name: b.experiences?.cities?.name || 'Indonesia',
      },
      guest: {
        id: b.users?.id || 0,
        name: contactInfo.name || b.users?.name || 'Tamu',
        email: contactInfo.email || b.users?.email || '',
        phone: contactInfo.phone || b.users?.phone || null,
        avatar_url: b.users?.avatar_url || null,
      },
      payment: b.payments[0]
        ? {
            id: b.payments[0].id,
            amount: Number(b.payments[0].amount),
            currency: b.payments[0].currency || 'USD',
            status: b.payments[0].status || 'pending',
            payment_gateway: b.payments[0].payment_gateway,
            gateway_payment_method: b.payments[0].gateway_payment_method,
            created_at: b.payments[0].created_at.toISOString(),
          }
        : null,
      review: b.reviews
        ? {
            id: b.reviews.id,
            rating: b.reviews.rating,
            comment: b.reviews.comment,
            host_reply: b.reviews.host_reply,
            host_replied_at: b.reviews.host_replied_at ? b.reviews.host_replied_at.toISOString() : null,
            created_at: b.reviews.created_at.toISOString(),
          }
        : null,
    };
  });

  // Tarik pengalaman tur milik host jika berstatus HOST
  let hostExperiences: any[] = [];
  if (isHost) {
    const rawHostExperiences = await prisma.experiences.findMany({
      where: { host_id: user.id },
      include: {
        host_categories: { select: { name: true, icon: true } },
        cities: { select: { name: true } },
        _count: { select: { reviews: true, bookings: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    hostExperiences = rawHostExperiences.map((exp) => {
      let coverImage: string | null = null;
      if (Array.isArray(exp.images) && exp.images.length > 0) {
        coverImage = String(exp.images[0]);
      }
      return {
        id: exp.id,
        title: exp.title,
        slug: exp.slug,
        status: exp.status || 'published',
        package_price: exp.package_price ? Number(exp.package_price) : 0,
        currency: exp.currency || 'USD',
        duration_hours: exp.duration_hours || 4,
        max_participants: exp.max_participants || 10,
        rating_average: exp.rating_average ? Number(exp.rating_average) : 0,
        rating_count: exp.rating_count || 0,
        category_name: exp.host_categories?.name || 'Local Tour',
        category_icon: exp.host_categories?.icon || null,
        city_name: exp.cities?.name || null,
        images: Array.isArray(exp.images) ? exp.images : [],
        cover_image: coverImage,
        created_at: exp.created_at.toISOString(),
        reviews_count: exp._count.reviews || 0,
        bookings_count: exp._count.bookings || 0,
      };
    });
  }

  // 5. Kueri Obrolan Personal (Direct Messages) untuk Agregasi di Dasbor
  const rawDirectConvs = await prisma.conversations.findMany({
    where: {
      OR: [
        { participant1_id: user.id },
        { participant2_id: user.id },
      ],
    },
    include: {
      users_conversations_participant1_idTousers: {
        select: { id: true, name: true, username: true, avatar_url: true, is_verified: true },
      },
      users_conversations_participant2_idTousers: {
        select: { id: true, name: true, username: true, avatar_url: true, is_verified: true },
      },
      conversation_participants: {
        where: { user_id: user.id },
        select: { unread_count: true },
      },
      messages: {
        where: { is_deleted: false },
        orderBy: { created_at: 'desc' },
        take: 1,
        select: { id: true, content: true, created_at: true, sender_id: true },
      },
    },
    orderBy: { updated_at: 'desc' },
    take: 5,
  });

  const directConversations = rawDirectConvs.map((c) => {
    const otherUser =
      c.participant1_id === user.id
        ? c.users_conversations_participant2_idTousers
        : c.users_conversations_participant1_idTousers;

    const myParticipant = c.conversation_participants[0];
    const latestMsg = c.messages[0];

    return {
      id: c.id,
      participant: {
        id: otherUser.id,
        name: otherUser.name || otherUser.username || `User #${otherUser.id}`,
        username: otherUser.username || `user_${otherUser.id}`,
        avatar_url: otherUser.avatar_url,
        is_verified: Boolean(otherUser.is_verified),
      },
      lastMessage: latestMsg
        ? {
            content: latestMsg.content,
            createdAt: latestMsg.created_at ? latestMsg.created_at.toISOString() : new Date().toISOString(),
            isSenderMe: latestMsg.sender_id === user.id,
          }
        : null,
      unreadCount: myParticipant?.unread_count || 0,
      updatedAt: c.updated_at.toISOString(),
    };
  });

  // 6. Kueri Diskusi Meja Kumpul (Group Chat) yang Diikuti Pengguna
  const userMemberships = await prisma.vibes_travel_meetup_members.findMany({
    where: {
      user_id: user.id,
      status: { in: ['approved', 'joined'] },
    },
    include: {
      vibes_travel_meetups: {
        include: {
          cities: { select: { name: true } },
          vibes_travel_meetup_messages: {
            where: { is_deleted: false },
            orderBy: { created_at: 'desc' },
            take: 1,
            include: {
              users: { select: { name: true, username: true } },
            },
          },
        },
      },
    },
    orderBy: { joined_at: 'desc' },
    take: 5,
  });

  const meetupChats = userMemberships
    .filter((m) => m.vibes_travel_meetups && !m.vibes_travel_meetups.deleted_at)
    .map((m) => {
      const meetup = m.vibes_travel_meetups;
      let bannerImage: string | null = null;
      if (Array.isArray(meetup.images) && meetup.images.length > 0) {
        bannerImage = String(meetup.images[0]);
      }

      const latestMsg = meetup.vibes_travel_meetup_messages[0];

      return {
        id: meetup.id,
        title: meetup.title,
        slug: meetup.slug || String(meetup.id),
        bannerImage,
        cityName: meetup.cities?.name || null,
        membersCount: meetup.current_member_count || 1,
        lastMessage: latestMsg
          ? {
              userName: latestMsg.users.name || latestMsg.users.username || 'Traveler',
              content: latestMsg.content,
              createdAt: latestMsg.created_at.toISOString(),
            }
          : null,
      };
    });

  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50/50" />}>
      <DashboardClient
        locale={locale}
        user={{
          id: user.id,
          name: user.name,
          username: user.username || `user_${user.id}`,
          email: user.email,
          role: user.role,
          is_host: isHost,
          avatar_url: user.avatar_url,
          is_verified: Boolean(user.is_verified),
          kyc_status: (user as any).host_kyc_host_kyc_user_idTousers?.status || null,
          city_name: user.cities?.name || null,
          total_xp: user.user_xp?.total_xp || 0,
          current_level: user.user_xp?.current_level || 1,
          ltp_balance: user.user_ltp_wallets ? Number(user.user_ltp_wallets.balance) : 0,
          stories_count: totalStories,
          meetups_count: totalMeetups,
          bookings_count: totalBookings,
          forum_threads_count: totalForumThreads,
          stories: formattedStories,
          meetups: formattedMeetups,
          forumThreads: formattedForumThreads,
          bookings: formattedBookings,
          userBookings: formattedUserBookings,
          travellerBookings,
          hostBookings: formattedHostBookings,
          hostExperiences,
          levelTiers,
          transactions: formattedTransactions,
          referral_code: user.referral_code || null,
          referral_usage_count: user.referral_code
            ? await prisma.users.count({
                where: { used_referral_code: user.referral_code },
              })
            : 0,
          directConversations,
          meetupChats,
        }}
      />
    </Suspense>
  );
}
