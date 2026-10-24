import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getCurrentUserSession } from '@/actions/bookings';
import { getUserConversations, getConversationDetail } from '@/actions/messages/direct';
import { MessagesClient } from '@/components/messages/MessagesClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pesan & Obrolan | Locallytrip',
  description: 'Komunikasi langsung dengan host dan rekan petualang di Locallytrip.',
};

export const dynamic = 'force-dynamic';

interface MessagesPageProps {
  params: Promise<{
    lang: string;
  }>;
  searchParams: Promise<{
    c?: string;
    recipientId?: string;
    returnUrl?: string;
    experienceId?: string;
    ref?: string;
    exp?: string;
  }>;
}

export default async function MessagesPage({ params, searchParams }: MessagesPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const locale = resolvedParams.lang === 'en' ? 'en' : 'id';

  // 1. Cek sesi autentikasi
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

  // Preserve callback url with query params if user not logged in
  if (!userEmail) {
    const queryParts: string[] = [];
    if (resolvedSearchParams.c) queryParts.push(`c=${resolvedSearchParams.c}`);
    if (resolvedSearchParams.recipientId) queryParts.push(`recipientId=${resolvedSearchParams.recipientId}`);
    if (resolvedSearchParams.ref) queryParts.push(`ref=${resolvedSearchParams.ref}`);
    if (resolvedSearchParams.exp) queryParts.push(`exp=${resolvedSearchParams.exp}`);
    if (resolvedSearchParams.returnUrl) queryParts.push(`returnUrl=${encodeURIComponent(resolvedSearchParams.returnUrl)}`);
    const qStr = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    redirect(`/${locale}/login?callbackUrl=/${locale}/messages${encodeURIComponent(qStr)}`);
  }

  const user = await prisma.users.findUnique({
    where: { email: userEmail },
    select: { id: true, name: true, username: true, avatar_url: true },
  });

  if (!user) {
    redirect(`/${locale}/login`);
  }

  let activeConversationId: number | null = resolvedSearchParams.c ? parseInt(resolvedSearchParams.c, 10) : null;
  const recipientIdNum = resolvedSearchParams.recipientId ? parseInt(resolvedSearchParams.recipientId, 10) : null;
  let contextItem: {
    type?: 'experience' | 'booking';
    title: string;
    slug: string;
    reference?: string | null;
    status?: string | null;
  } | null = null;

  // 2. Handle jika ada parameter bookingReference (ref)
  if (resolvedSearchParams.ref) {
    const booking = await prisma.bookings.findFirst({
      where: { booking_reference: resolvedSearchParams.ref },
      include: {
        experiences: {
          select: { id: true, title: true, title_id: true, slug: true, host_id: true },
        },
      },
    });

    if (booking) {
      contextItem = {
        type: 'booking',
        title: (locale === 'id' && booking.experiences?.title_id ? booking.experiences.title_id : booking.experiences?.title) || 'Pemesanan Tur',
        slug: booking.experiences?.slug || '',
        reference: booking.booking_reference,
        status: booking.status,
      };

      // Jika belum ada activeConversationId, hubungkan antara Tamu dan Host pesanan ini
      if (!activeConversationId) {
        const partnerId = user.id === booking.user_id ? booking.experiences?.host_id : booking.user_id;
        if (partnerId && partnerId !== user.id) {
          const p1 = Math.min(user.id, partnerId);
          const p2 = Math.max(user.id, partnerId);
          const existing = await prisma.conversations.findFirst({
            where: { participant1_id: p1, participant2_id: p2 },
            select: { id: true },
          });

          if (existing) {
            activeConversationId = existing.id;
          } else {
            const now = new Date();
            const created = await prisma.conversations.create({
              data: {
                participant1_id: p1,
                participant2_id: p2,
                last_message_at: now,
                created_at: now,
                updated_at: now,
              },
            });
            await prisma.conversation_participants.createMany({
              data: [
                { conversation_id: created.id, user_id: p1, joined_at: now },
                { conversation_id: created.id, user_id: p2, joined_at: now },
              ],
            });
            activeConversationId = created.id;
          }
        }
      }
    }
  }

  // 3. Handle jika ada parameter experience slug (exp)
  if (!contextItem && resolvedSearchParams.exp) {
    const exp = await prisma.experiences.findFirst({
      where: { slug: resolvedSearchParams.exp },
      select: { id: true, title: true, title_id: true, slug: true, host_id: true },
    });

    if (exp) {
      contextItem = {
        type: 'experience',
        title: (locale === 'id' && exp.title_id ? exp.title_id : exp.title) || 'Tur Wisata',
        slug: exp.slug || resolvedSearchParams.exp,
      };

      if (!activeConversationId && exp.host_id && exp.host_id !== user.id) {
        const p1 = Math.min(user.id, exp.host_id);
        const p2 = Math.max(user.id, exp.host_id);
        const existing = await prisma.conversations.findFirst({
          where: { participant1_id: p1, participant2_id: p2 },
          select: { id: true },
        });

        if (existing) {
          activeConversationId = existing.id;
        } else {
          const now = new Date();
          const created = await prisma.conversations.create({
            data: {
              participant1_id: p1,
              participant2_id: p2,
              last_message_at: now,
              created_at: now,
              updated_at: now,
            },
          });
          await prisma.conversation_participants.createMany({
            data: [
              { conversation_id: created.id, user_id: p1, joined_at: now },
              { conversation_id: created.id, user_id: p2, joined_at: now },
            ],
          });
          activeConversationId = created.id;
        }
      }
    }
  }

  // 4. Handle jika ada recipientId di URL (misal klik "Kirim Pesan" langsung)
  if (!activeConversationId && recipientIdNum && recipientIdNum !== user.id) {
    const p1 = Math.min(user.id, recipientIdNum);
    const p2 = Math.max(user.id, recipientIdNum);
    const existing = await prisma.conversations.findFirst({
      where: {
        participant1_id: p1,
        participant2_id: p2,
      },
      select: { id: true },
    });

    if (existing) {
      activeConversationId = existing.id;
    } else {
      const now = new Date();
      const created = await prisma.conversations.create({
        data: {
          participant1_id: p1,
          participant2_id: p2,
          last_message_at: now,
          created_at: now,
          updated_at: now,
        },
      });
      await prisma.conversation_participants.createMany({
        data: [
          { conversation_id: created.id, user_id: p1, joined_at: now },
          { conversation_id: created.id, user_id: p2, joined_at: now },
        ],
      });
      activeConversationId = created.id;
    }
  }

  // 5. Cek returnUrl untuk konteks jika belum ada
  if (!contextItem && resolvedSearchParams.returnUrl && resolvedSearchParams.returnUrl.includes('/experiences/')) {
    const expSlugMatch = resolvedSearchParams.returnUrl.match(/\/experiences\/([^/?#]+)/);
    if (expSlugMatch && expSlugMatch[1]) {
      const expSlug = expSlugMatch[1];
      const exp = await prisma.experiences.findFirst({
        where: { slug: expSlug },
        select: { title: true, title_id: true, slug: true },
      });
      if (exp) {
        contextItem = {
          type: 'experience',
          title: locale === 'id' && exp.title_id ? exp.title_id : exp.title,
          slug: exp.slug || expSlug,
        };
      }
    }
  }

  // 6. Ambil daftar percakapan
  const convRes = await getUserConversations();
  const conversations = convRes.success ? convRes.conversations : [];

  if (!activeConversationId && conversations.length > 0) {
    activeConversationId = conversations[0].id;
  }

  // 7. Ambil detail percakapan aktif
  let initialDetail = null;
  if (activeConversationId) {
    const detailRes = await getConversationDetail(activeConversationId);
    if (detailRes.success && detailRes.conversation) {
      initialDetail = detailRes.conversation;
    }
  }

  return (
    <div className="w-full min-h-screen bg-slate-50/50 py-6 sm:py-10">
      <MessagesClient
        locale={locale}
        currentUserId={user.id}
        currentUserName={user.name || user.username || 'Explorer'}
        currentUserAvatar={user.avatar_url}
        initialConversations={conversations}
        initialActiveConversationId={activeConversationId}
        initialConversationDetail={initialDetail}
        returnUrl={resolvedSearchParams.returnUrl || null}
        initialContextItem={contextItem}
      />
    </div>
  );
}
