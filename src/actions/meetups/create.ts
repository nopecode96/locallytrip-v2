'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { createNotification } from '@/lib/notifications';
import { getCurrentUserSession } from '@/actions/bookings';
import path from 'path';

export interface CreateMeetupInput {
  title: string;
  category: string;
  cityId: number;
  locationName: string;
  address?: string;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime?: string; // HH:mm
  maxParticipants: number;
  costType: 'free' | 'split_bill' | 'paid';
  pricePerPerson?: number;
  coverImageUrl?: string;
  description: string;
  requirements?: string;
}

export async function createCommunityMeetup(formData: CreateMeetupInput) {
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
    return { success: false, error: 'Silakan masuk terlebih dahulu untuk membuat agenda meetup.' };
  }

  const {
    title,
    category,
    cityId,
    locationName,
    address,
    startDate,
    startTime,
    endTime,
    maxParticipants,
    costType,
    pricePerPerson,
    coverImageUrl,
    description,
    requirements,
  } = formData;

  if (!title || title.trim().length < 5) {
    return { success: false, error: 'Judul meetup minimal 5 karakter.' };
  }
  if (!category) {
    return { success: false, error: 'Pilih kategori kegiatan temu.' };
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
  if (!description || description.trim().length < 20) {
    return { success: false, error: 'Deskripsikan rencana agenda meetup minimal 20 karakter.' };
  }

  const user = await prisma.users.findUnique({
    where: { email: userEmail },
    select: { id: true, name: true },
  });

  if (!user) return { success: false, error: 'Pengguna tidak ditemukan.' };

  // Ambil aturan reward inisiator MEETUP_CREATE (default 40 XP & 10 LTP)
  let xpReward = 40;
  let ltpReward = 10;
  try {
    const rule = await prisma.reward_action_rules.findUnique({
      where: { action_code: 'MEETUP_CREATE' },
    });
    if (rule && rule.is_active) {
      xpReward = rule.xp_reward;
      ltpReward = Number(rule.ltp_reward);
    }
  } catch (err) {
    console.warn('Could not fetch MEETUP_CREATE reward rule:', err);
  }

  // Petakan category ke experience_type_id jika cocok
  let experienceTypeId: number | null = null;
  const catLower = category.toLowerCase();
  if (catLower.includes('hiking') || catLower.includes('outdoor')) {
    experienceTypeId = 1; // Adventure & Outdoor
  } else if (catLower.includes('kuliner') || catLower.includes('food')) {
    experienceTypeId = 17; // Food & Culinary
  } else if (catLower.includes('photo')) {
    experienceTypeId = 34; // Photography & Content
  } else if (catLower.includes('walk') || catLower.includes('sejarah') || catLower.includes('city')) {
    experienceTypeId = 29; // Urban Exploration
  } else if (catLower.includes('kopi') || catLower.includes('coffee')) {
    experienceTypeId = 22; // Coffee & Tea
  }

  // Format deskripsi komprehensif agar kompatibel dengan pembaca parser eksisting & UI detail
  const formattedSections: string[] = [];
  formattedSections.push(description.trim());
  formattedSections.push(`\n📍 Meeting Point: ${locationName.trim()}${address ? ` (${address.trim()})` : ''}`);
  formattedSections.push(`⏰ Waktu: ${startTime}${endTime ? ` - ${endTime}` : ' - Selesai'}`);

  let costText = 'Gratis';
  if (costType === 'split_bill') {
    costText = 'Split-Bill (Bayar Sendiri)';
  } else if (costType === 'paid') {
    costText = pricePerPerson ? `Patungan (Rp ${pricePerPerson.toLocaleString('id-ID')}/orang)` : 'Patungan';
  }
  formattedSections.push(`💰 Biaya: ${costText}`);

  if (requirements && requirements.trim()) {
    formattedSections.push(`🎒 Yang Perlu Dibawa:\n${requirements.trim()}`);
  }

  const fullDescription = formattedSections.join('\n\n');

  try {
    // Generate slug ramah SEO
    const baseSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') || 'meetup';
    const slug = `${baseSlug}-${Date.now().toString().slice(-6)}`;

    const eventDate = new Date(`${startDate}T00:00:00.000Z`);
    const now = new Date();

    const cleanCoverFileName = coverImageUrl && typeof coverImageUrl === 'string' && !coverImageUrl.startsWith('blob:')
      ? path.basename(coverImageUrl.trim())
      : null;

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
        max_members: Number(maxParticipants) || 10,
        current_member_count: 1, // Inisiator terhitung sebagai peserta pertama
        status: 'OPEN',
        join_type: 'public',
        images: cleanCoverFileName ? [cleanCoverFileName] : [],
        experience_type_id: experienceTypeId,
        created_at: now,
        updated_at: now,
      },
    });

    // 2. Daftarkan Host sebagai inisiator di tabel peserta vibes_travel_meetup_members
    try {
      await prisma.vibes_travel_meetup_members.create({
        data: {
          meetup_id: meetup.id,
          user_id: user.id,
          status: 'confirmed',
          is_creator: true,
          joined_at: now,
          approved_at: now,
        },
      });
    } catch (e) {
      console.warn('vibes_travel_meetup_members creator creation error/skipped:', e);
    }

    // 3. Tambahkan kredit XP ke user
    await prisma.user_xp.upsert({
      where: { user_id: user.id },
      update: { total_xp: { increment: xpReward } },
      create: { user_id: user.id, total_xp: xpReward, current_level: 1, created_at: now, updated_at: now },
    });

    await prisma.user_xp_history.create({
      data: {
        user_id: user.id,
        amount: xpReward,
        activity_type: 'MEETUP_CREATE',
        source_id: meetup.id,
        source_table: 'vibes_travel_meetups',
        created_at: now,
      },
    });

    // 4. Tambahkan kredit koin LTP jika reward > 0
    if (ltpReward > 0) {
      await prisma.user_ltp_wallets.upsert({
        where: { user_id: user.id },
        update: {
          balance: { increment: ltpReward },
          updated_at: now,
        },
        create: {
          user_id: user.id,
          balance: ltpReward,
          created_at: now,
          updated_at: now,
        },
      });

      await prisma.user_ltp_transactions.create({
        data: {
          user_id: user.id,
          amount: ltpReward,
          type: 'credit',
          activity_type: 'meetup_create',
          source_id: meetup.id,
          source_table: 'vibes_travel_meetups',
          created_at: now,
        },
      });
    }

    // 5. Kirim notifikasi lonceng internal ke pembuat meetup
    await createNotification({
      userId: user.id,
      type: 'MEETUP_RSVP',
      title: 'Agenda Meetup Berhasil Dibuat! 🗓️',
      message: `Meetup "${title.slice(0, 30)}..." berhasil dibuka untuk umum. Anda mendapatkan +${xpReward} XP & +${ltpReward} LTP!`,
      actionUrl: `/community/meetups/${meetup.slug}`,
      data: {
        meetupId: meetup.id,
        slug: meetup.slug,
        locationName,
        category,
      },
    });

    revalidatePath('/community/meetups');
    revalidatePath('/[lang]/community/meetups', 'page');
    revalidatePath('/[lang]/dashboard', 'page');

    return { success: true, slug: meetup.slug };
  } catch (error: any) {
    console.error('Error creating meetup:', error);
    return { success: false, error: error?.message || 'Gagal membuat agenda meetup. Silakan coba lagi.' };
  }
}
