'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { createNotification } from '@/lib/notifications';
import { getCurrentUserSession } from '@/actions/bookings';
import { grantReward } from '@/lib/rewards/reward-engine';
import path from 'path';

export interface CreateMeetupInput {
  title: string;
  category: string;
  cityId: number;
  locationName: string;
  addressDetail?: string;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime?: string; // HH:mm
  maxParticipants: number; // 4, 6, 8, etc.
  joinType?: 'public' | 'private';
  notes?: string;
  coverImageUrl?: string;
  status?: 'PUBLISHED' | 'DRAFT' | 'OPEN' | 'active';
}

export async function createCommunityMeetup(input: CreateMeetupInput) {
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
    return { success: false, error: 'Silakan masuk terlebih dahulu untuk membuat meja kumpul meetup.' };
  }

  const {
    title,
    category,
    cityId,
    locationName,
    addressDetail,
    startDate,
    startTime,
    endTime,
    maxParticipants,
    joinType = 'public',
    notes,
    coverImageUrl,
  } = input;

  if (!title || title.trim().length < 5) {
    return { success: false, error: 'Judul meetup minimal 5 karakter.' };
  }
  if (!category) {
    return { success: false, error: 'Pilih kategori santai kegiatan temu.' };
  }
  if (!cityId) {
    return { success: false, error: 'Pilih kota destinasi kegiatan meetup.' };
  }
  if (!startDate || !startTime) {
    return { success: false, error: 'Tentukan tanggal dan jam kumpul.' };
  }

  const startDateTime = new Date(`${startDate}T${startTime}:00`);
  if (isNaN(startDateTime.getTime()) || startDateTime <= new Date()) {
    return { success: false, error: 'Jadwal tanggal dan jam kumpul harus di masa mendatang.' };
  }

  if (!locationName || locationName.trim().length < 3) {
    return { success: false, error: 'Tentukan nama tempat atau lokasi temu kumpul.' };
  }

  const user = await prisma.users.findUnique({
    where: { email: userEmail },
    select: { id: true, name: true, username: true },
  });

  if (!user) return { success: false, error: 'Pengguna tidak ditemukan.' };

  // Map category ke experience_type_id jika cocok
  let experienceTypeId: number | null = null;
  const catLower = category.toLowerCase();
  if (catLower.includes('food') || catLower.includes('makan') || catLower.includes('kuliner') || catLower.includes('dining')) {
    experienceTypeId = 17; // Food & Culinary
  } else if (catLower.includes('coffee') || catLower.includes('ngopi') || catLower.includes('drinks') || catLower.includes('sunset')) {
    experienceTypeId = 22; // Coffee & Tea
  } else if (catLower.includes('walk') || catLower.includes('city') || catLower.includes('photo')) {
    experienceTypeId = 29; // Urban Exploration
  } else if (catLower.includes('outdoor') || catLower.includes('hiking')) {
    experienceTypeId = 1; // Adventure & Outdoor
  }

  // Format deskripsi Social Travel Table yang ringkas & ramah
  const descParts: string[] = [];
  if (notes && notes.trim()) {
    descParts.push(notes.trim());
  } else {
    descParts.push(`Agenda kumpul santai komunitas penjelajah di meja ${locationName.trim()}.`);
  }

  descParts.push(`\n📍 Meeting Point: ${locationName.trim()}${addressDetail ? ` (${addressDetail.trim()})` : ''}`);
  descParts.push(`⏰ Waktu: ${startTime}${endTime ? ` - ${endTime}` : ' - Selesai'}`);
  descParts.push(`🍽️ Format Meja: Bebas Biaya Pendaftaran / Bayar Pesanan Masing-Masing (Split Bill)`);
  descParts.push(`👥 Kuota: Meja Intim Maksimal ${maxParticipants} Orang`);

  const fullDescription = descParts.join('\n\n');

  try {
    const baseSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') || 'meetup';
    const slug = `${baseSlug}-${Date.now().toString().slice(-6)}`;

    const eventDate = new Date(`${startDate}T00:00:00.000Z`);
    const now = new Date();

    // Sanitasi nama berkas: Simpan HANYA nama berkas murni (clean filename)
    let cleanCoverFileName: string | null = null;
    if (coverImageUrl && typeof coverImageUrl === 'string' && !coverImageUrl.startsWith('blob:')) {
      const rawTrimmed = coverImageUrl.trim();
      cleanCoverFileName = path.basename(rawTrimmed);
    }

    const meetupStatus = input.status || 'OPEN';

    // 1. Simpan Meetup ke tabel vibes_travel_meetups
    const meetup = await prisma.vibes_travel_meetups.create({
      data: {
        creator_id: user.id,
        city_id: Number(cityId),
        title: title.trim(),
        slug,
        description: fullDescription,
        start_date: eventDate,
        end_date: eventDate,
        duration_days: 1,
        max_members: Number(maxParticipants) || 6,
        current_member_count: 1, // Inisiator sebagai peserta pertama
        status: meetupStatus,
        join_type: joinType === 'private' ? 'private' : 'public',
        images: cleanCoverFileName ? [cleanCoverFileName] : [],
        experience_type_id: experienceTypeId,
        created_at: now,
        updated_at: now,
      },
    });

    // 2. Daftarkan Inisiator sebagai peserta pertama di vibes_travel_meetup_members
    await prisma.vibes_travel_meetup_members.create({
      data: {
        meetup_id: meetup.id,
        user_id: user.id,
        status: 'approved',
        is_creator: true,
        joined_at: now,
        approved_at: now,
      },
    });

    // 3. Inisialisasi pesan sambutan pembuka di vibes_travel_meetup_messages
    try {
      await prisma.vibes_travel_meetup_messages.create({
        data: {
          meetup_id: meetup.id,
          user_id: user.id,
          content: `👋 Halo teman-teman! Saya telah membuka meja kumpul "${title.trim()}". Selamat bergabung dan mari ngobrol santai di sini!`,
          created_at: now,
          updated_at: now,
        },
      });
    } catch (msgErr) {
      console.warn('Initial welcome message created or skipped:', msgErr);
    }

    // 4. Berikan Reward Inisiator (+40 XP & +10 LTP)
    const rewardRes = await grantReward(
      user.id,
      'MEETUP_CREATE',
      meetup.id,
      'vibes_travel_meetups'
    );

    // 5. Kirim Notifikasi Lonceng
    await createNotification({
      userId: user.id,
      type: 'MEETUP_RSVP',
      title: 'Meja Kumpul Berhasil Dibuka! 🍽️',
      message: `Meja "${title.slice(0, 30)}..." berhasil dibuka. Anda mendapatkan +40 XP & +10 LTP!`,
      actionUrl: `/community/meetups/${meetup.slug}`,
      data: {
        meetupId: meetup.id,
        slug: meetup.slug,
        locationName,
      },
    });

    revalidatePath('/community/meetups');
    revalidatePath('/[lang]/community/meetups', 'page');
    revalidatePath('/[lang]/community', 'page');
    revalidatePath('/[lang]/dashboard', 'page');

    return {
      success: true,
      slug: meetup.slug,
      meetupId: meetup.id,
      reward: {
        xpEarned: rewardRes?.addedXp || 40,
        ltpEarned: rewardRes?.addedLtp || 10,
      },
    };
  } catch (error: any) {
    console.error('Error creating community meetup:', error);
    return { success: false, error: error?.message || 'Gagal membuat meja kumpul. Silakan coba lagi.' };
  }
}

/**
 * Server Action: Ambil Pesan Obrolan Grup Meja
 */
export async function getMeetupMessages(meetupId: number) {
  try {
    const rawMessages = await prisma.vibes_travel_meetup_messages.findMany({
      where: {
        meetup_id: Number(meetupId),
        is_deleted: false,
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
      orderBy: { created_at: 'asc' },
      take: 100,
    });

    return {
      success: true,
      messages: rawMessages.map((m) => ({
        id: m.id,
        meetupId: m.meetup_id,
        userId: m.user_id,
        content: m.content,
        createdAt: m.created_at.toISOString(),
        user: {
          id: m.users.id,
          name: m.users.name || m.users.username || 'Traveler',
          username: m.users.username,
          avatarUrl: m.users.avatar_url,
          isVerified: m.users.is_verified,
        },
      })),
    };
  } catch (err: any) {
    console.error('Failed to get meetup messages:', err);
    return { success: false, messages: [], error: err?.message };
  }
}

/**
 * Server Action: Kirim Pesan Obrolan Grup Meja
 */
export async function sendMeetupMessage(meetupId: number, content: string) {
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
    return { success: false, error: 'Silakan masuk terlebih dahulu untuk mengirim pesan.' };
  }

  if (!content || !content.trim()) {
    return { success: false, error: 'Pesan tidak boleh kosong.' };
  }

  const user = await prisma.users.findUnique({
    where: { email: userEmail },
    select: { id: true, name: true, username: true, avatar_url: true, is_verified: true },
  });

  if (!user) return { success: false, error: 'User tidak ditemukan.' };

  // Periksa apakah user adalah anggota meetup
  const membership = await prisma.vibes_travel_meetup_members.findFirst({
    where: {
      meetup_id: Number(meetupId),
      user_id: user.id,
    },
  });

  if (!membership) {
    return { success: false, error: 'Anda harus bergabung dengan meja ini untuk mengirim pesan.' };
  }

  const now = new Date();
  const createdMsg = await prisma.vibes_travel_meetup_messages.create({
    data: {
      meetup_id: Number(meetupId),
      user_id: user.id,
      content: content.trim(),
      created_at: now,
      updated_at: now,
    },
  });

  return {
    success: true,
    message: {
      id: createdMsg.id,
      meetupId: createdMsg.meetup_id,
      userId: user.id,
      content: createdMsg.content,
      createdAt: now.toISOString(),
      user: {
        id: user.id,
        name: user.name || user.username || 'Traveler',
        username: user.username,
        avatarUrl: user.avatar_url,
        isVerified: user.is_verified,
      },
    },
  };
}

/**
 * Server Action: Ambil atau Buat DM Percakapan Personal dengan Inisiator
 */
export async function getOrCreateDirectConversation(targetUserId: number) {
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
    return { success: false, error: 'Silakan masuk terlebih dahulu.' };
  }

  const user = await prisma.users.findUnique({
    where: { email: userEmail },
    select: { id: true },
  });

  if (!user) return { success: false, error: 'Pengguna tidak ditemukan.' };
  if (user.id === targetUserId) {
    return { success: false, error: 'Tidak dapat memulai obrolan dengan diri sendiri.' };
  }

  const participant1 = Math.min(user.id, targetUserId);
  const participant2 = Math.max(user.id, targetUserId);

  let conversation = await prisma.conversations.findFirst({
    where: {
      participant1_id: participant1,
      participant2_id: participant2,
    },
  });

  const now = new Date();
  if (!conversation) {
    conversation = await prisma.conversations.create({
      data: {
        participant1_id: participant1,
        participant2_id: participant2,
        last_message_at: now,
        created_at: now,
        updated_at: now,
      },
    });

    await prisma.conversation_participants.createMany({
      data: [
        { conversation_id: conversation.id, user_id: participant1, joined_at: now },
        { conversation_id: conversation.id, user_id: participant2, joined_at: now },
      ],
    });
  }

  return {
    success: true,
    conversationId: conversation.id,
  };
}

export async function updateMeetupRecapImages(meetupId: number, images: string[], locale: string = 'id') {
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
    return { success: false, error: 'Silakan masuk terlebih dahulu.' };
  }

  const user = await prisma.users.findUnique({
    where: { email: userEmail },
    select: { id: true },
  });

  if (!user) {
    return { success: false, error: 'Pengguna tidak ditemukan.' };
  }

  const meetup = await prisma.vibes_travel_meetups.findUnique({
    where: { id: meetupId },
    select: { id: true, creator_id: true, slug: true },
  });

  if (!meetup) {
    return { success: false, error: 'Agenda meetup tidak ditemukan.' };
  }

  if (meetup.creator_id !== user.id) {
    return { success: false, error: 'Hanya penyelenggara/pembuat meetup yang dapat mengelola dokumentasi foto.' };
  }

  const cleanImages = Array.isArray(images)
    ? images.filter((img) => typeof img === 'string' && img.trim().length > 0)
    : [];

  await prisma.vibes_travel_meetups.update({
    where: { id: meetupId },
    data: {
      recap_images: cleanImages,
      updated_at: new Date(),
    },
  });

  revalidatePath(`/${locale}/community/meetups/${meetup.slug}`);
  revalidatePath(`/${locale}/community/meetups`);

  return {
    success: true,
    recapImages: cleanImages,
  };
}

