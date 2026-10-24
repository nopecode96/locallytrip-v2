import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { grantReward } from '@/lib/rewards/reward-engine';
import { createNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('locallytrip_session')?.value;

  if (sessionToken) {
    const session = await prisma.user_sessions.findUnique({
      where: { session_token: sessionToken },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar_url: true,
            role: true,
            is_verified: true,
          },
        },
      },
    });

    if (session?.users) {
      return session.users;
    }
  }

  return null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const isNumeric = /^\d+$/.test(id);
    const numId = isNumeric ? parseInt(id, 10) : -1;

    const meetup = await prisma.vibes_travel_meetups.findFirst({
      where: isNumeric ? { id: numId } : { slug: id },
      select: {
        id: true,
        title: true,
        slug: true,
        creator_id: true,
        max_members: true,
        current_member_count: true,
        status: true,
        join_type: true,
      },
    });

    if (!meetup) {
      return NextResponse.json({ success: false, error: 'Meetup tidak ditemukan' }, { status: 404 });
    }

    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Silakan masuk untuk bergabung dengan meetup' },
        { status: 401 }
      );
    }

    // Periksa apakah user sudah bergabung
    const existingMember = await prisma.vibes_travel_meetup_members.findFirst({
      where: {
        meetup_id: meetup.id,
        user_id: authUser.id,
      },
    });

    if (existingMember) {
      return NextResponse.json({
        success: true,
        alreadyJoined: true,
        message: 'Anda sudah terdaftar dalam meetup ini.',
      });
    }

    // Periksa kapasitas kuota jika ada batas
    if (meetup.max_members) {
      const currentCount = await prisma.vibes_travel_meetup_members.count({
        where: { meetup_id: meetup.id },
      });
      if (currentCount >= meetup.max_members) {
        return NextResponse.json(
          { success: false, error: 'Maaf, kuota peserta meetup ini sudah penuh.' },
          { status: 400 }
        );
      }
    }

    const isPrivate = meetup.join_type === 'private';
    const initialStatus = isPrivate ? 'pending' : 'approved';

    // Tambahkan user sebagai member (approved untuk public, pending untuk private)
    const newMember = await prisma.vibes_travel_meetup_members.create({
      data: {
        meetup_id: meetup.id,
        user_id: authUser.id,
        status: initialStatus,
        is_creator: false,
        joined_at: new Date(),
        approved_at: isPrivate ? null : new Date(),
      },
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
    });

    // Update count pada meetup (hanya hitung member yang statusnya approved)
    const totalApprovedCount = await prisma.vibes_travel_meetup_members.count({
      where: { meetup_id: meetup.id, status: 'approved' },
    });

    await prisma.vibes_travel_meetups.update({
      where: { id: meetup.id },
      data: { current_member_count: totalApprovedCount },
    });

    // Berikan reward terpusat (XP + LTP) untuk peserta jika langsung bergabung (public)
    if (!isPrivate) {
      await grantReward(
        authUser.id,
        'MEETUP_JOIN',
        meetup.id,
        'vibes_travel_meetups'
      ).catch((err) => console.error('Error granting meetup join reward:', err));
    }

    // Kirim notifikasi lonceng ke inisiator/host meetup
    if (meetup.creator_id && meetup.creator_id !== authUser.id) {
      try {
        const notifTitle = isPrivate ? 'Permohonan Gabung Meja Kumpul! 🔒' : 'Peserta Baru Bergabung! 🗓️';
        const notifMsg = isPrivate
          ? `${authUser.name || 'Seorang traveler'} meminta persetujuan untuk bergabung ke meja privat "${meetup.title}".`
          : `${authUser.name || 'Seorang traveler'} baru saja bergabung ke meja "${meetup.title}".`;

        await createNotification({
          userId: meetup.creator_id,
          type: 'MEETUP_RSVP',
          title: notifTitle,
          message: notifMsg,
          actionUrl: `/community/meetups/${meetup.slug}`,
          data: {
            meetupId: meetup.id,
            participantId: authUser.id,
            participantName: authUser.name,
            status: initialStatus,
          },
        });
      } catch (notifErr) {
        console.error('Non-critical error creating meetup rsvp notification:', notifErr);
      }
    }

    return NextResponse.json({
      success: true,
      isPendingApproval: isPrivate,
      message: isPrivate
        ? 'Permohonan bergabung telah dikirim. Menunggu persetujuan dari host meetup.'
        : 'Selamat! Anda berhasil bergabung ke agenda meetup ini.',
      member: {
        id: newMember.id,
        userId: newMember.users.id,
        name: newMember.users.name,
        username: newMember.users.username,
        avatar_url: newMember.users.avatar_url,
        is_verified: newMember.users.is_verified,
        status: newMember.status,
      },
      currentMemberCount: totalApprovedCount,
    });
  } catch (error) {
    console.error('Error joining meetup:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
