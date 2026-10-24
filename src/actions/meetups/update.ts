'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getCurrentUserSession } from '@/actions/bookings';

export interface UpdateMeetupParams {
  // Title & slug are deliberately omitted or ignored to enforce strict SEO immutability
  title?: string;
  slug?: string;
  category?: string;
  cityId?: number;
  locationName?: string;
  address?: string;
  addressDetail?: string;
  startDate?: string;
  startTime?: string;
  endTime?: string;
  maxParticipants?: number;
  costType?: 'free' | 'split_bill' | 'paid';
  pricePerPerson?: number;
  coverImageUrl?: string;
  description?: string;
  requirements?: string;
  joinType?: 'public' | 'private';
  notes?: string;
  status?: 'active' | 'draft' | 'OPEN' | 'DRAFT' | 'PUBLISHED' | 'published';
}

async function getAuthUserId(): Promise<number | null> {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    const id = parseInt(session.user.id, 10);
    if (!isNaN(id)) return id;
  }
  if (session?.user?.email) {
    const u = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (u) return u.id;
  }
  const raw = await getCurrentUserSession();
  if (raw?.isLoggedIn && raw.id) return raw.id;
  if (raw?.isLoggedIn && raw.email) {
    const u = await prisma.users.findUnique({
      where: { email: raw.email },
      select: { id: true },
    });
    if (u) return u.id;
  }
  return null;
}

export async function updateMeetup(meetupId: number, params: UpdateMeetupParams) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return { success: false, error: 'Silakan masuk terlebih dahulu untuk mengubah agenda meetup.' };
    }

    const meetup = await prisma.vibes_travel_meetups.findUnique({
      where: { id: meetupId },
      select: { id: true, creator_id: true, slug: true, status: true, title: true, images: true },
    });

    if (!meetup) {
      return { success: false, error: 'Agenda meetup tidak ditemukan.' };
    }

    // Otorisasi: Hanya pembuat (creator_id) yang berhak mengubah
    if (meetup.creator_id !== userId) {
      return { success: false, error: 'Anda tidak memiliki hak akses untuk mengubah meetup ini.' };
    }

    // STRICT SEO PROTECTION:
    // Judul dan slug sengaja DIABAIKAN dan DILINDUNGI agar tautan SEO tetap valid.

    const now = new Date();
    const updateData: any = {
      updated_at: now,
    };

    if (params.cityId) updateData.city_id = params.cityId;
    if (params.description !== undefined) updateData.description = params.description;
    if (params.maxParticipants) updateData.max_members = params.maxParticipants;

    if (params.startDate) {
      const sDate = new Date(params.startDate);
      if (!isNaN(sDate.getTime())) {
        updateData.start_date = sDate;
        updateData.end_date = sDate;
      }
    }

    if (params.status) {
      const s = params.status.toLowerCase();
      updateData.status = s === 'draft' ? 'draft' : 'active';
    }

    if (params.coverImageUrl) {
      updateData.images = [params.coverImageUrl];
    }

    await prisma.vibes_travel_meetups.update({
      where: { id: meetupId },
      data: updateData,
    });

    try {
      revalidatePath('/[lang]/dashboard', 'page');
      revalidatePath('/id/dashboard', 'page');
      revalidatePath('/en/dashboard', 'page');
      revalidatePath(`/[lang]/community/meetups/${meetup.slug}`, 'page');
      revalidatePath(`/id/community/meetups/${meetup.slug}`, 'page');
      revalidatePath(`/en/community/meetups/${meetup.slug}`, 'page');
      revalidatePath('/[lang]/community/meetups', 'page');
    } catch (_) {}

    return {
      success: true,
      message: 'Agenda meetup berhasil diperbarui.',
      slug: meetup.slug,
    };
  } catch (error: any) {
    console.error('Error in updateMeetup:', error);
    return { success: false, error: error?.message || 'Gagal memperbarui agenda meetup.' };
  }
}

export async function toggleMeetupStatus(meetupId: number, targetStatus?: string | null) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return { success: false, error: 'Silakan masuk terlebih dahulu.' };
    }

    const meetup = await prisma.vibes_travel_meetups.findUnique({
      where: { id: meetupId },
      select: { id: true, creator_id: true, status: true, slug: true },
    });

    if (!meetup) return { success: false, error: 'Meetup tidak ditemukan.' };
    if (meetup.creator_id !== userId) return { success: false, error: 'Akses ditolak.' };

    const currentIsActive = meetup.status?.toLowerCase() === 'active' || meetup.status?.toLowerCase() === 'open';
    const newStatus = targetStatus
      ? targetStatus === 'active'
        ? 'active'
        : 'draft'
      : currentIsActive
      ? 'draft'
      : 'active';

    await prisma.vibes_travel_meetups.update({
      where: { id: meetupId },
      data: {
        status: newStatus,
        updated_at: new Date(),
      },
    });

    try {
      revalidatePath('/[lang]/dashboard', 'page');
      revalidatePath(`/id/community/meetups/${meetup.slug}`, 'page');
      revalidatePath(`/en/community/meetups/${meetup.slug}`, 'page');
    } catch (_) {}

    return {
      success: true,
      status: newStatus,
      message: newStatus === 'active' ? 'Agenda meetup berhasil diterbitkan (Published).' : 'Agenda meetup diubah menjadi draf (Draft).',
    };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Gagal mengubah status meetup.' };
  }
}
