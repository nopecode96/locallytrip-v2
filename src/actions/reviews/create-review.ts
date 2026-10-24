'use server';

import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { createNotification } from '@/lib/notifications';

export interface CreateReviewPayload {
  bookingId: number;
  rating: number; // 1 to 5
  comment: string;
  title?: string;
}

export async function createReview(payload: CreateReviewPayload) {
  // 1. Sesi pengguna aktif
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Silakan masuk terlebih dahulu untuk memberikan ulasan.' };
  }

  // Validasi Rating
  const numericRating = Math.round(Number(payload.rating));
  if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
    return { success: false, error: 'Rating harus berada di antara 1 hingga 5 bintang.' };
  }

  if (!payload.comment || payload.comment.trim().length < 10) {
    return { success: false, error: 'Komentar ulasan minimal 10 karakter.' };
  }

  // Cari data bookings berdasarkan bookingId
  const booking = await prisma.bookings.findUnique({
    where: { id: Number(payload.bookingId) },
    include: {
      experiences: {
        select: {
          id: true,
          title: true,
          slug: true,
          host_id: true,
        },
      },
    },
  });

  if (!booking) {
    return { success: false, error: 'Pesanan tidak ditemukan.' };
  }

  // Wajib milik user.id yang sedang login
  if (booking.user_id !== user.id) {
    return { success: false, error: 'Akses ditolak: Anda tidak memiliki akses ke pesanan ini.' };
  }

  // booking.status WAJIB 'completed'
  const bookingStatus = (booking.status || '').toLowerCase();
  if (bookingStatus !== 'completed') {
    return {
      success: false,
      error: 'Ulasan hanya dapat diberikan setelah kegiatan tur selesai dilaksanakan.',
    };
  }

  // Periksa apakah pesanan ini sudah pernah diulas
  const existingReview = await prisma.reviews.findFirst({
    where: { booking_id: booking.id },
  });

  if (existingReview) {
    return {
      success: false,
      error: 'Anda sudah pernah memberikan ulasan untuk pesanan ini.',
    };
  }

  const now = new Date();

  try {
    const result = await prisma.$transaction(async (tx) => {
      // A. Simpan Ulasan ke tabel reviews
      const review = await tx.reviews.create({
        data: {
          experience_id: booking.experience_id!,
          user_id: user.id,
          booking_id: booking.id,
          rating: numericRating,
          title: payload.title?.trim() || null,
          comment: payload.comment.trim(),
          is_verified: true,
          created_at: now,
          updated_at: now,
        },
      });

      // B. Berikan Hadiah Insentif Reputasi (+20 XP)
      await tx.user_xp.upsert({
        where: { user_id: user.id },
        update: {
          total_xp: { increment: 20 },
          updated_at: now,
        },
        create: {
          user_id: user.id,
          total_xp: 20,
          current_level: 1,
          created_at: now,
          updated_at: now,
        },
      });

      await tx.user_xp_history.create({
        data: {
          user_id: user.id,
          amount: 20,
          activity_type: 'EXPERIENCE_REVIEW',
          source_id: review.id,
          source_table: 'reviews',
          created_at: now,
        },
      });

      // C. Berikan Hadiah Koin Diskon (+5 LTP)
      await tx.user_ltp_wallets.upsert({
        where: { user_id: user.id },
        update: {
          balance: { increment: 5 },
          updated_at: now,
        },
        create: {
          user_id: user.id,
          balance: 5,
          created_at: now,
          updated_at: now,
        },
      });

      await tx.user_ltp_transactions.create({
        data: {
          user_id: user.id,
          amount: 5,
          type: 'credit',
          activity_type: 'review_reward',
          source_id: review.id,
          source_table: 'reviews',
          created_at: now,
        },
      });

      // Agregasi rating dan update pada tabel experiences
      const agg = await tx.reviews.aggregate({
        where: { experience_id: booking.experience_id! },
        _avg: { rating: true },
        _count: { id: true },
      });

      const avgRating = agg._avg.rating ? Number(agg._avg.rating.toFixed(2)) : numericRating;
      const countRating = agg._count.id;

      await tx.experiences.update({
        where: { id: booking.experience_id! },
        data: {
          rating_average: avgRating,
          rating_count: countRating,
          updated_at: now,
        },
      });

      return review;
    });

    // D. Kirim notifikasi lonceng ke Host bahwa tur-nya menerima ulasan baru
    if (booking.experiences?.host_id && booking.experiences.host_id !== user.id) {
      await createNotification({
        userId: booking.experiences.host_id,
        type: 'SYSTEM',
        title: `Ulasan Baru untuk Tur Anda (${numericRating} ⭐)`,
        message: `${user.name || 'Seorang tamu'} memberikan ulasan untuk tur ${booking.experiences.title}: "${payload.comment.trim().slice(0, 80)}"`,
        actionUrl: `/experiences/${booking.experiences.slug || booking.experience_id}`,
      }).catch((e) => console.warn('Gagal membuat notifikasi review:', e));
    }

    if (booking.experiences?.slug) {
      revalidatePath(`/[lang]/experiences/${booking.experiences.slug}`);
    }
    revalidatePath(`/[lang]/experiences/${booking.experience_id}`);
    revalidatePath('/[lang]/dashboard');

    return {
      success: true,
      message: 'Ulasan berhasil disimpan! Anda memperoleh +20 XP dan +5 LTP.',
      reviewId: result.id,
      slug: booking.experiences?.slug,
    };
  } catch (error: any) {
    console.error('Error creating review:', error);
    return {
      success: false,
      error: error?.message || 'Terjadi kesalahan sistem saat menyimpan ulasan.',
    };
  }
}
