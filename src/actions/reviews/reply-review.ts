'use server';

import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { createNotification } from '@/lib/notifications';

export interface ReplyReviewByHostParams {
  reviewId: number;
  replyText: string;
}

export async function replyReviewByHost({ reviewId, replyText }: ReplyReviewByHostParams) {
  // 1. Dapatkan sesi Host aktif
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Silakan masuk terlebih dahulu.' };
  }

  if (user.role?.toUpperCase() !== 'HOST') {
    return { success: false, error: 'Akses ditolak: Hanya Local Host yang dapat membalas ulasan tur.' };
  }

  if (!replyText || replyText.trim().length < 3) {
    return { success: false, error: 'Tanggapan balasan minimal 3 karakter.' };
  }

  // 2. Cari review dan pastikan tur tersebut benar-benar milik Host
  const review = await prisma.reviews.findUnique({
    where: { id: Number(reviewId) },
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
        },
      },
    },
  });

  if (!review) {
    return { success: false, error: 'Ulasan tidak ditemukan.' };
  }

  if (review.experiences.host_id !== user.id) {
    return { success: false, error: 'Akses ditolak: Ulasan ini bukan untuk aktivitas tur yang Anda pandu.' };
  }

  const now = new Date();
  const trimmedReply = replyText.trim();

  try {
    // 3. Update database
    const updatedReview = await prisma.reviews.update({
      where: { id: review.id },
      data: {
        host_reply: trimmedReply,
        host_replied_at: now,
        updated_at: now,
      },
    });

    // 4. Kirim notifikasi lonceng ke tamu bahwa Host telah membalas ulasan mereka
    if (review.user_id && review.user_id !== user.id) {
      await createNotification({
        userId: review.user_id,
        type: 'SYSTEM',
        title: `Pemandu Membalas Ulasan Anda`,
        message: `${user.name || 'Pemandu lokal'} membalas ulasan Anda pada tur "${review.experiences.title}": "${trimmedReply.slice(0, 80)}${trimmedReply.length > 80 ? '...' : ''}"`,
        actionUrl: `/experiences/${review.experiences.slug || review.experiences.id}`,
      }).catch((e) => console.warn('Gagal membuat notifikasi balasan host:', e));
    }

    if (review.experiences.slug) {
      revalidatePath(`/[lang]/experiences/${review.experiences.slug}`);
    }
    revalidatePath(`/[lang]/experiences/${review.experiences.id}`);
    revalidatePath('/[lang]/dashboard');

    return {
      success: true,
      message: 'Tanggapan balasan berhasil disimpan.',
      review: updatedReview,
    };
  } catch (error: any) {
    console.error('Error replying to review:', error);
    return {
      success: false,
      error: error?.message || 'Gagal menyimpan balasan ulasan.',
    };
  }
}
