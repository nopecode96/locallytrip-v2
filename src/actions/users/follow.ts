'use server';

import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCurrentUserSession } from '@/actions/bookings';
import { revalidatePath } from 'next/cache';

export interface ToggleFollowResult {
  success: boolean;
  message?: string;
  isFollowing?: boolean;
  followersCount?: number;
  followingCount?: number;
  error?: string;
}

async function getAuthenticatedUser() {
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

  if (!userEmail) return null;

  return prisma.users.findUnique({
    where: { email: userEmail },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
    },
  });
}

/**
 * Server Action: toggleFollowUser
 * Mengikuti (follow) atau berhenti mengikuti (unfollow) pengguna lain secara atomik.
 */
export async function toggleFollowUser(targetUserId: number): Promise<ToggleFollowResult> {
  try {
    const currentUser = await getAuthenticatedUser();
    if (!currentUser) {
      return { success: false, error: 'Autentikasi diperlukan. Silakan masuk terlebih dahulu.' };
    }

    if (!targetUserId || isNaN(targetUserId)) {
      return { success: false, error: 'Target pengguna tidak valid.' };
    }

    // Proteksi: Tidak dapat mem-follow diri sendiri
    if (currentUser.id === targetUserId) {
      return { success: false, error: 'Anda tidak dapat mengikuti akun Anda sendiri.' };
    }

    const targetUser = await prisma.users.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true, username: true },
    });

    if (!targetUser) {
      return { success: false, error: 'Pengguna yang ingin diikuti tidak ditemukan.' };
    }

    const followerId = currentUser.id;
    const followingId = targetUserId;

    // Cek apakah sudah follow saat ini
    const existingFollow = await prisma.user_follows.findUnique({
      where: {
        follower_id_following_id: {
          follower_id: followerId,
          following_id: followingId,
        },
      },
    });

    const isFollowing = !existingFollow; // Jika ada -> unfollow, jika belum ada -> follow
    const now = new Date();

    // Eksekusi atomik $transaction
    await prisma.$transaction(async (tx) => {
      if (existingFollow) {
        // 1. UNFOLLOW: Hapus relasi
        await tx.user_follows.delete({
          where: {
            id: existingFollow.id,
          },
        });

        // 2. Kurangi followers_count targetUser dan following_count currentUser
        await tx.users.update({
          where: { id: followingId },
          data: {
            followers_count: { decrement: 1 },
          },
        });

        await tx.users.update({
          where: { id: followerId },
          data: {
            following_count: { decrement: 1 },
          },
        });
      } else {
        // 1. FOLLOW: Buat relasi
        await tx.user_follows.create({
          data: {
            follower_id: followerId,
            following_id: followingId,
            created_at: now,
          },
        });

        // 2. Tambahkan followers_count targetUser dan following_count currentUser
        await tx.users.update({
          where: { id: followingId },
          data: {
            followers_count: { increment: 1 },
          },
        });

        await tx.users.update({
          where: { id: followerId },
          data: {
            following_count: { increment: 1 },
          },
        });

        // 3. Notifikasi lonceng ke targetUser
        await tx.notifications.create({
          data: {
            user_id: followingId,
            type: 'COMMUNITY',
            title: 'Pengikut Baru! 👤',
            message: `${currentUser.name} (@${currentUser.username || currentUser.id}) mulai mengikuti Anda di Locallytrip.`,
            action_url: `/users/${currentUser.username || currentUser.id}`,
            created_at: now,
            updated_at: now,
          },
        });
      }
    });

    // Ambil jumlah followers & following aktual pasca-transaksi
    const updatedTargetUser = await prisma.users.findUnique({
      where: { id: followingId },
      select: {
        followers_count: true,
        _count: {
          select: {
            user_follows_user_follows_following_idTousers: true,
          },
        },
      },
    });

    const finalFollowersCount =
      updatedTargetUser?._count.user_follows_user_follows_following_idTousers ??
      updatedTargetUser?.followers_count ??
      0;

    try {
      const uKey = targetUser.username || targetUser.id;
      revalidatePath(`/[lang]/profile/${uKey}`, 'page');
      revalidatePath(`/[lang]/users/${uKey}`, 'page');
      revalidatePath(`/id/profile/${uKey}`);
      revalidatePath(`/en/profile/${uKey}`);
      revalidatePath(`/id/users/${uKey}`);
      revalidatePath(`/en/users/${uKey}`);
      revalidatePath(`/users/${uKey}`);
      revalidatePath(`/profile/${uKey}`);
    } catch {
      // safe in non-Next runtime
    }

    return {
      success: true,
      isFollowing,
      followersCount: finalFollowersCount,
      message: isFollowing
        ? `Berhasil mengikuti ${targetUser.name}!`
        : `Berhenti mengikuti ${targetUser.name}.`,
    };
  } catch (err: any) {
    console.error('Error in toggleFollowUser:', err);
    return {
      success: false,
      error: err?.message || 'Terjadi kesalahan sistem saat memperbarui status follow.',
    };
  }
}

/**
 * Alias export: toggleFollow
 */
export const toggleFollow = toggleFollowUser;

/**
 * Server Action: checkIsFollowing
 * Memeriksa apakah pengguna aktif saat ini mengikuti target user
 */
export async function checkIsFollowing(targetUserId: number): Promise<boolean> {
  try {
    const currentUser = await getAuthenticatedUser();
    if (!currentUser || currentUser.id === targetUserId) {
      return false;
    }

    const followRecord = await prisma.user_follows.findUnique({
      where: {
        follower_id_following_id: {
          follower_id: currentUser.id,
          following_id: targetUserId,
        },
      },
      select: { id: true },
    });

    return Boolean(followRecord);
  } catch {
    return false;
  }
}
