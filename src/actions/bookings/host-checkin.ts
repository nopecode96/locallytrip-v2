'use server';

import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function verifyAndCheckInTicket(bookingReference: string) {
  const hostUser = await getCurrentUser();
  if (!hostUser || hostUser.role?.toUpperCase() !== 'HOST') {
    return { success: false, error: 'Akses ditolak: Hanya Local Host yang dapat memverifikasi tiket.' };
  }

  if (!bookingReference || typeof bookingReference !== 'string') {
    return { success: false, error: 'Kode referensi tiket tidak valid.' };
  }

  let cleanRef = bookingReference.trim();
  // Tangani jika QR Code berupa URL e-tiket lengkap (e.g. /success?ref=LT-XXXXXX-XXX)
  if (cleanRef.includes('ref=')) {
    const match = cleanRef.match(/ref=([a-zA-Z0-9-]+)/);
    if (match) {
      cleanRef = match[1];
    }
  }
  // Bersihkan tanda '#' di depan jika ada
  cleanRef = cleanRef.replace(/^#/, '').trim().toUpperCase();

  // Cari pesanan berdasarkan booking_reference
  const booking = await prisma.bookings.findUnique({
    where: { booking_reference: cleanRef },
    include: {
      experiences: {
        select: {
          id: true,
          title: true,
          host_id: true,
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
          status: true,
          amount: true,
          currency: true,
        },
        take: 1,
      },
    },
  });

  if (!booking) {
    return { success: false, error: 'Tiket tidak ditemukan. Pastikan kode referensi benar.' };
  }

  // Validasi Kepemilikan Tur: Pastikan tur ini milik host yang sedang login
  if (booking.experiences?.host_id !== hostUser.id) {
    return { success: false, error: 'Akses ditolak: Tiket ini bukan untuk aktivitas tur yang Anda pandu.' };
  }

  // Jika sudah completed sebelumnya
  if (booking.status === 'completed') {
    return {
      success: false,
      alreadyCompleted: true,
      error: 'Tiket ini sudah pernah di-check in sebelumnya (Tur telah selesai).',
      booking,
    };
  }

  // Transisi Status Pesanan Menjadi COMPLETED
  const updated = await prisma.bookings.update({
    where: { id: booking.id },
    data: {
      status: 'completed',
      updated_at: new Date(),
    },
  });

  const now = new Date();

  // 1. Notifikasi untuk traveler pemesan
  if (booking.user_id) {
    await prisma.notifications.create({
      data: {
        user_id: booking.user_id,
        title: 'Tur Selesai & Check-in Berhasil! 🎒',
        message: `Kehadiran Anda pada tur "${booking.experiences?.title || 'Pengalaman Lokal'}" telah diverifikasi oleh Host. Berikan ulasan untuk mendapatkan +20 XP!`,
        type: 'BOOKING',
        action_url: `/dashboard?tab=reviews`,
        created_at: now,
        updated_at: now,
      },
    }).catch(() => {});
  }

  // 2. Notifikasi untuk Host pemandu
  await prisma.notifications.create({
    data: {
      user_id: hostUser.id,
      title: 'Tur Selesai Divalidasi! ✅',
      message: `Tiket pesanan #${booking.booking_reference} telah diverifikasi. Pendapatan Anda akan diproses ke dompet host.`,
      type: 'BOOKING',
      action_url: `/dashboard?tab=earnings`,
      created_at: now,
      updated_at: now,
    },
  }).catch(() => {});

  revalidatePath('/[lang]/dashboard');

  return {
    success: true,
    message: 'Check-in berhasil! Kehadiran rombongan tamu terverifikasi dan tur ditandai selesai.',
    booking: {
      ...booking,
      status: 'completed',
    },
  };
}
