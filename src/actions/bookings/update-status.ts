'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { createNotification } from '@/lib/notifications';
import { getCurrentUserSession } from './index';

export type AllowedBookingStatus = 'confirmed' | 'cancelled' | 'completed';

export async function updateBookingStatus(
  bookingId: number | string,
  newStatus: AllowedBookingStatus | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
) {
  const normalizedStatus = String(newStatus).toLowerCase() as AllowedBookingStatus;

  if (!['confirmed', 'cancelled', 'completed'].includes(normalizedStatus)) {
    return { success: false, error: 'Status pemesanan tidak valid.' };
  }

  // 1. Ambil session user aktif
  let userEmail: string | null = null;
  const nextAuthSession = await getServerSession(authOptions);
  if (nextAuthSession?.user?.email) {
    userEmail = nextAuthSession.user.email;
  } else {
    const internalSession = await getCurrentUserSession();
    if (internalSession?.isLoggedIn && internalSession.email) {
      userEmail = internalSession.email;
    }
  }

  if (!userEmail) {
    return { success: false, error: 'Sesi Anda telah kedaluwarsa. Silakan masuk kembali.' };
  }

  const currentUser = await prisma.users.findUnique({
    where: { email: userEmail },
    select: { id: true, role: true },
  });

  if (!currentUser) {
    return { success: false, error: 'Akun pengguna tidak ditemukan.' };
  }

  // 2. Ambil data booking yang hendak diperbarui
  const numId = Number(bookingId);
  const whereClause = isNaN(numId)
    ? { booking_reference: String(bookingId) }
    : { id: numId };

  const booking = await prisma.bookings.findFirst({
    where: whereClause,
    include: {
      experiences: {
        select: {
          id: true,
          title: true,
          slug: true,
          host_id: true,
        },
      },
      users: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!booking) {
    return { success: false, error: 'Data reservasi tidak ditemukan.' };
  }

  // 3. Validasi Otoritas: Hanya Host pemilik tur atau Super Admin yang berhak memperbarui status
  const isHostOwner = booking.experiences?.host_id === currentUser.id;
  const isSuperAdmin = currentUser.role?.toLowerCase().includes('admin');

  if (!isHostOwner && !isSuperAdmin) {
    return {
      success: false,
      error: 'Anda tidak memiliki hak akses untuk memperbarui pesanan pada tur ini.',
    };
  }

  try {
    // 4. Update status pemesanan di database
    const updated = await prisma.bookings.update({
      where: { id: booking.id },
      data: {
        status: normalizedStatus,
        updated_at: new Date(),
      },
    });

    // 5. Kirim notifikasi sistem & lonceng ke tamu pemesan
    if (booking.users) {
      if (normalizedStatus === 'confirmed') {
        await createNotification({
          userId: booking.users.id,
          type: 'BOOKING',
          title: 'Pesanan Dikonfirmasi Host! 🎉',
          message: `Host telah mengonfirmasi reservasi Anda untuk "${booking.experiences?.title || 'Pengalaman Lokal'}". Siapkan diri untuk petualangan seru!`,
          actionUrl: '/dashboard',
        });
      } else if (normalizedStatus === 'completed') {
        await createNotification({
          userId: booking.users.id,
          type: 'SYSTEM',
          title: 'Tur Selesai - Bagikan Ulasan Anda! ⭐',
          message: `Tur "${booking.experiences?.title || 'Pengalaman Lokal'}" telah selesai dilaksanakan. Bagikan ulasan Anda dan raih bonus +20 XP!`,
          actionUrl: booking.experiences?.slug
            ? `/experiences/${booking.experiences.slug}#reviews`
            : '/dashboard',
        });
      } else if (normalizedStatus === 'cancelled') {
        await createNotification({
          userId: booking.users.id,
          type: 'BOOKING',
          title: 'Pesanan Dibatalkan ⚠️',
          message: `Pesanan Anda #${booking.booking_reference} untuk "${booking.experiences?.title || 'Pengalaman Lokal'}" telah dibatalkan oleh Host.`,
          actionUrl: '/dashboard',
        });
      }
    }

    revalidatePath('/[lang]/dashboard', 'page');
    return {
      success: true,
      booking: {
        id: updated.id,
        booking_reference: updated.booking_reference,
        status: updated.status,
      },
    };
  } catch (err: any) {
    console.error('Failed to update booking status:', err);
    return { success: false, error: err?.message || 'Gagal memperbarui status pesanan.' };
  }
}

export async function verifyBookingByReference(bookingReference: string) {
  const cleanRef = bookingReference.trim();
  if (!cleanRef) {
    return { success: false, error: 'Kode booking wajib diisi.' };
  }

  // 1. Ambil session user aktif
  let userEmail: string | null = null;
  const nextAuthSession = await getServerSession(authOptions);
  if (nextAuthSession?.user?.email) {
    userEmail = nextAuthSession.user.email;
  } else {
    const internalSession = await getCurrentUserSession();
    if (internalSession?.isLoggedIn && internalSession.email) {
      userEmail = internalSession.email;
    }
  }

  if (!userEmail) {
    return { success: false, error: 'Sesi Anda telah kedaluwarsa. Silakan masuk kembali.' };
  }

  const currentUser = await prisma.users.findUnique({
    where: { email: userEmail },
    select: { id: true, role: true },
  });

  if (!currentUser) {
    return { success: false, error: 'Akun pengguna tidak ditemukan.' };
  }

  // 2. Kueri data booking
  const booking = await prisma.bookings.findFirst({
    where: {
      OR: [
        { booking_reference: cleanRef },
        { booking_reference: cleanRef.toUpperCase() },
        { booking_reference: cleanRef.startsWith('LT-') ? cleanRef : `LT-${cleanRef}` },
      ],
    },
    include: {
      experiences: {
        select: {
          id: true,
          title: true,
          slug: true,
          host_id: true,
          meeting_point: true,
          currency: true,
          images: true,
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
        },
        orderBy: { created_at: 'desc' },
        take: 1,
      },
    },
  });

  if (!booking) {
    return {
      success: false,
      error: `Tiket dengan kode "${cleanRef}" tidak ditemukan dalam sistem.`,
    };
  }

  // 3. Validasi Otoritas Host
  const isHostOwner = booking.experiences?.host_id === currentUser.id;
  const isSuperAdmin = currentUser.role?.toLowerCase().includes('admin');

  if (!isHostOwner && !isSuperAdmin) {
    return {
      success: false,
      error: 'Kode tiket ini bukan untuk tur yang Anda kelola.',
    };
  }

  const contactInfo = (booking.contact_info as any) || {};

  return {
    success: true,
    booking: {
      id: booking.id,
      booking_reference: booking.booking_reference,
      status: (booking.status || 'pending').toLowerCase(),
      selected_date: booking.selected_date ? booking.selected_date.toISOString() : null,
      selected_time: booking.selected_time ? booking.selected_time.toISOString() : null,
      participant_count: booking.participant_count || booking.quantity || 1,
      total_price: Number(booking.total_price || 0),
      special_requests: booking.special_requests || null,
      experience: {
        id: booking.experiences?.id || 0,
        title: booking.experiences?.title || 'Pengalaman Lokal',
        slug: booking.experiences?.slug || null,
        meeting_point: booking.experiences?.meeting_point || null,
        currency: booking.experiences?.currency || 'USD',
      },
      guest: {
        id: booking.users?.id || 0,
        name: contactInfo.name || booking.users?.name || 'Tamu',
        email: contactInfo.email || booking.users?.email || '',
        phone: contactInfo.phone || booking.users?.phone || null,
        avatar_url: booking.users?.avatar_url || null,
      },
      payment: booking.payments[0]
        ? {
            amount: Number(booking.payments[0].amount),
            currency: booking.payments[0].currency || 'USD',
            status: booking.payments[0].status || 'pending',
          }
        : null,
    },
  };
}
