'use server';

import prisma from '@/lib/prisma';
import { getCurrentUserSession } from '@/actions/bookings';
import { revalidatePath } from 'next/cache';
import { createNotification } from '@/lib/notifications';

export interface ToggleStoryLikeResult {
  success: boolean;
  isLiked: boolean;
  totalLikes: number;
  rewardEarned?: {
    ltp: number;
    xp: number;
  };
  error?: string;
  requireAuth?: boolean;
}

/**
 * Server Action: Toggle like pada cerita perjalanan
 * - Menambah/menghapus record di `story_likes`
 * - Memperbarui `like_count` pada `stories`
 * - Jika like baru: berikan bonus reward +1 LTP & +2 XP pada user
 */
export async function toggleStoryLike(
  storyId: number,
  path?: string
): Promise<ToggleStoryLikeResult> {
  try {
    // 1. Ambil session user aktif
    const userSession = await getCurrentUserSession();
    if (!userSession?.isLoggedIn || !userSession.id) {
      return {
        success: false,
        isLiked: false,
        totalLikes: 0,
        requireAuth: true,
        error: 'Silakan masuk untuk menyukai cerita ini.',
      };
    }

    const userId = userSession.id;
    const now = new Date();

    // 2. Periksa apakah user sudah menyukai cerita ini sebelumnya
    const existingLike = await prisma.story_likes.findUnique({
      where: {
        story_id_user_id: {
          story_id: storyId,
          user_id: userId,
        },
      },
    });

    let isLiked = false;
    let rewardEarned: { ltp: number; xp: number } | undefined;

    if (existingLike) {
      // UNLIKE: Hapus like
      await prisma.story_likes.delete({
        where: {
          id: existingLike.id,
        },
      });

      // Update like_count di cerita (tidak boleh kurang dari 0)
      await prisma.stories.update({
        where: { id: storyId },
        data: {
          like_count: {
            decrement: 1,
          },
        },
      });

      isLiked = false;
    } else {
      // LIKE: Tambah like baru
      await prisma.story_likes.create({
        data: {
          story_id: storyId,
          user_id: userId,
          created_at: now,
          updated_at: now,
        },
      });

      // Update like_count di cerita
      await prisma.stories.update({
        where: { id: storyId },
        data: {
          like_count: {
            increment: 1,
          },
        },
      });

      isLiked = true;

      // Berikan reward reward LTP (+1) & XP (+2) jika baru disukai
      try {
        // A. Tambah XP ke user_xp
        await prisma.user_xp.upsert({
          where: { user_id: userId },
          create: {
            user_id: userId,
            total_xp: 2,
            current_level: 1,
            created_at: now,
            updated_at: now,
          },
          update: {
            total_xp: { increment: 2 },
            updated_at: now,
          },
        });

        await prisma.user_xp_history.create({
          data: {
            user_id: userId,
            amount: 2,
            activity_type: 'like_story',
            source_id: storyId,
            source_table: 'stories',
            created_at: now,
          },
        });

        // B. Tambah Saldo LTP ke user_ltp_wallets
        await prisma.user_ltp_wallets.upsert({
          where: { user_id: userId },
          create: {
            user_id: userId,
            balance: 1,
            created_at: now,
            updated_at: now,
          },
          update: {
            balance: { increment: 1 },
            updated_at: now,
          },
        });

        await prisma.user_ltp_transactions.create({
          data: {
            user_id: userId,
            amount: 1,
            type: 'credit',
            activity_type: 'like_story',
            source_id: storyId,
            source_table: 'stories',
            created_at: now,
          },
        });

        rewardEarned = { ltp: 1, xp: 2 };
      } catch (err) {
        console.error('Non-critical error awarding story like reward:', err);
      }
    }

    // 3. Ambil count likes terbaru
    const totalLikes = await prisma.story_likes.count({
      where: { story_id: storyId },
    });

    if (path) {
      revalidatePath(path);
    }

    return {
      success: true,
      isLiked,
      totalLikes,
      rewardEarned,
    };
  } catch (err: any) {
    console.error('Error in toggleStoryLike:', err);
    return {
      success: false,
      isLiked: false,
      totalLikes: 0,
      error: err?.message || 'Terjadi kesalahan sistem saat memproses suka.',
    };
  }
}

/**
 * Server Action: Cek status like user saat ini
 */
export async function getStoryLikeStatus(storyId: number): Promise<{
  isLiked: boolean;
  userId?: number;
}> {
  try {
    const userSession = await getCurrentUserSession();
    if (!userSession?.isLoggedIn || !userSession.id) {
      return { isLiked: false };
    }

    const like = await prisma.story_likes.findUnique({
      where: {
        story_id_user_id: {
          story_id: storyId,
          user_id: userSession.id,
        },
      },
    });

    return {
      isLiked: Boolean(like),
      userId: userSession.id,
    };
  } catch (error) {
    console.error('Error in getStoryLikeStatus:', error);
    return { isLiked: false };
  }
}

export async function postStoryComment(data: {
  storyId: number;
  content: string;
  parentId?: number | null;
  path?: string;
}): Promise<{
  success: boolean;
  comment?: any;
  error?: string;
  requireAuth?: boolean;
}> {
  try {
    const userSession = await getCurrentUserSession();
    if (!userSession?.isLoggedIn || !userSession.id) {
      return {
        success: false,
        requireAuth: true,
        error: 'Silakan masuk untuk meninggalkan komentar.',
      };
    }

    if (!data.content || !data.content.trim()) {
      return {
        success: false,
        error: 'Komentar tidak boleh kosong.',
      };
    }

    const now = new Date();
    const comment = await prisma.story_comments.create({
      data: {
        story_id: data.storyId,
        user_id: userSession.id,
        parent_id: data.parentId || null,
        content: data.content.trim(),
        is_approved: true, // Publikasi langsung untuk interaksi komunitas responsif
        created_at: now,
        updated_at: now,
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar_url: true,
            is_verified: true,
            user_xp: {
              select: {
                total_xp: true,
                current_level: true,
              },
            },
          },
        },
      },
    });

    // Perbarui comment_count pada stories dan ambil author_id
    const updatedStory = await prisma.stories.update({
      where: { id: data.storyId },
      data: {
        comment_count: {
          increment: 1,
        },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        author_id: true,
      },
    });

    // Kirim notifikasi ke pemilik cerita jika yang berkomentar bukan pemilik cerita
    if (updatedStory.author_id && updatedStory.author_id !== userSession.id) {
      try {
        const commenterName = comment.users?.name || 'Seorang petualang';
        await createNotification({
          userId: updatedStory.author_id,
          type: 'COMMENT',
          title: 'Komentar Baru di Cerita Anda',
          message: `${commenterName} mengomentari "${updatedStory.title}": "${data.content.slice(0, 80)}"`,
          actionUrl: `/stories/${updatedStory.slug}`,
          data: {
            storyId: updatedStory.id,
            commentId: comment.id,
            commenterId: userSession.id,
          },
        });
      } catch (notifErr) {
        console.error('Non-critical error creating comment notification:', notifErr);
      }
    }

    // Berikan reward gamifikasi partisipasi komentar (+5 XP)
    try {
      await prisma.user_xp.upsert({
        where: { user_id: userSession.id },
        create: {
          user_id: userSession.id,
          total_xp: 5,
          current_level: 1,
          created_at: now,
          updated_at: now,
        },
        update: {
          total_xp: { increment: 5 },
          updated_at: now,
        },
      });

      await prisma.user_xp_history.create({
        data: {
          user_id: userSession.id,
          amount: 5,
          activity_type: 'comment_story',
          source_id: comment.id,
          source_table: 'story_comments',
          created_at: now,
        },
      });
    } catch (xpErr) {
      console.error('Non-critical error awarding comment XP:', xpErr);
    }

    if (data.path) {
      revalidatePath(data.path);
    }

    return {
      success: true,
      comment,
    };
  } catch (err: any) {
    console.error('Error in postStoryComment:', err);
    return {
      success: false,
      error: err?.message || 'Gagal mengirim komentar.',
    };
  }
}

