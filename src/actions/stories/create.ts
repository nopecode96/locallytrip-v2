'use server';

import path from 'path';
import prisma from '@/lib/prisma';
import { enum_stories_status } from '@prisma/client';
import { getCurrentUserSession } from '@/actions/bookings';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import { createNotification } from '@/lib/notifications';

export interface CreateStoryInput {
  title: string;
  content: string;
  excerpt?: string;
  city_id?: number | null;
  cover_image?: string;
  images?: string[];
  tags?: string[];
  locale?: string;
  status?: 'draft' | 'published' | 'pending_review' | 'ready_to_review' | 'DRAFT' | 'PUBLISHED' | 'READY_TO_REVIEW';
  isPublish?: boolean;
}

export async function createStory(input: CreateStoryInput) {
  try {
    // 1. Ambil session user aktif baik dari NextAuth maupun cookie internal
    let userId: number | null = null;
    const nextAuthSession = await getServerSession(authOptions);
    if (nextAuthSession?.user?.id) {
      userId = parseInt(nextAuthSession.user.id, 10);
    } else {
      const internalSession = await getCurrentUserSession();
      if (internalSession?.isLoggedIn && internalSession.id) {
        userId = internalSession.id;
      }
    }

    if (!userId) {
      return {
        success: false,
        error: 'Silakan masuk terlebih dahulu untuk menyimpan atau menerbitkan cerita.',
        requireAuth: true,
      };
    }

    // Tentukan status target
    const isDraft =
      input.status?.toLowerCase() === 'draft' ||
      input.isPublish === false;

    const isReadyToReview =
      input.status?.toLowerCase() === 'ready_to_review' ||
      input.status?.toLowerCase() === 'pending_review';

    const targetStatus: enum_stories_status = isDraft
      ? enum_stories_status.draft
      : isReadyToReview
      ? enum_stories_status.pending_review
      : enum_stories_status.published;

    const isPublish = targetStatus === enum_stories_status.published;

    // Validasi input
    if (isPublish) {
      if (!input.title || !input.content || input.title.trim().length < 5) {
        return {
          success: false,
          error: 'Judul dan isi cerita wajib diisi (minimal 5 karakter) untuk menerbitkan cerita.',
        };
      }
    } else {
      if (!input.title || input.title.trim().length < 2) {
        return {
          success: false,
          error: 'Judul cerita minimal 2 karakter untuk menyimpan draf.',
        };
      }
    }

    // 2. Generate slug unik
    const baseSlug = input.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    let uniqueSlug = baseSlug || 'story-draft';
    let counter = 1;
    while (await prisma.stories.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${baseSlug || 'story'}-${counter}`;
      counter++;
    }

    const now = new Date();
    const wordCount = (input.content || '').trim().split(/\s+/).filter(Boolean).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    // Sanitasi cover_image: pastikan hanya nama file bersih (clean filename)
    let cleanCoverFileName: string | null = null;
    if (input.cover_image && typeof input.cover_image === 'string' && input.cover_image.trim() !== '') {
      const trimmed = input.cover_image.trim();
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
        cleanCoverFileName = trimmed;
      } else {
        cleanCoverFileName = path.basename(trimmed);
      }
    }

    // 3. Simpan cerita ke database
    const story = await prisma.stories.create({
      data: {
        uuid: crypto.randomUUID(),
        title: input.title.trim(),
        slug: uniqueSlug,
        content: input.content ? input.content.trim() : '',
        excerpt: input.excerpt?.trim() || (input.content ? input.content.trim().replace(/<[^>]*>/g, '').slice(0, 160) : null),
        author_id: userId,
        city_id: input.city_id || null,
        cover_image: cleanCoverFileName,
        images: input.images && input.images.length > 0 ? input.images : [],
        tags: input.tags || [],
        reading_time: readingTime,
        language: input.locale || 'id',
        status: targetStatus,
        published_at: isPublish ? now : null,
        created_at: now,
        updated_at: now,
      },
    });

    // 4. Ambil aturan reward STORY_PUBLISH dan berikan XP & LTP HANYA jika diterbitkan (published)
    if (isPublish) {
      try {
        const rule = await prisma.reward_action_rules.findFirst({
          where: { action_code: 'STORY_PUBLISH', is_active: true },
        });

        const xpBonus = rule ? rule.xp_reward : 50;
        const ltpBonus = rule ? Number(rule.ltp_reward) : 15;

        if (xpBonus > 0) {
          await prisma.user_xp.upsert({
            where: { user_id: userId },
            create: {
              user_id: userId,
              total_xp: xpBonus,
              current_level: 1,
              created_at: now,
              updated_at: now,
            },
            update: {
              total_xp: { increment: xpBonus },
              updated_at: now,
            },
          });

          await prisma.user_xp_history.create({
            data: {
              user_id: userId,
              amount: xpBonus,
              activity_type: 'STORY_PUBLISH',
              source_id: story.id,
              source_table: 'stories',
              created_at: now,
            },
          });
        }

        if (ltpBonus > 0) {
          await prisma.user_ltp_wallets.upsert({
            where: { user_id: userId },
            create: {
              user_id: userId,
              balance: ltpBonus,
              created_at: now,
              updated_at: now,
            },
            update: {
              balance: { increment: ltpBonus },
              updated_at: now,
            },
          });

          await prisma.user_ltp_transactions.create({
            data: {
              user_id: userId,
              amount: ltpBonus,
              type: 'credit',
              activity_type: 'STORY_PUBLISH',
              source_id: story.id,
              source_table: 'stories',
              created_at: now,
            },
          });
        }

        // Kirim notifikasi konfirmasi penerbitan cerita dan perolehan hadiah XP & LTP
        await createNotification({
          userId,
          type: 'REWARD_XP',
          title: 'Cerita Berhasil Diterbitkan! 🎉',
          message: `Selamat! Cerita "${story.title}" telah terbit dan Anda mendapatkan +${xpBonus} XP & +${ltpBonus} LTP.`,
          actionUrl: `/stories/${uniqueSlug}`,
          data: {
            storyId: story.id,
            xpEarned: xpBonus,
            ltpEarned: ltpBonus,
            slug: uniqueSlug,
          },
        });
      } catch (rewardErr) {
        console.error('Non-critical error awarding story publish reward:', rewardErr);
      }
    }

    // Revalidasi jalur halaman katalog cerita
    revalidatePath('/stories');
    revalidatePath('/[lang]/stories', 'page');
    revalidatePath(`/${input.locale || 'id'}/stories`);

    return {
      success: true,
      story,
      slug: uniqueSlug,
      isDraft: !isPublish,
      status: targetStatus,
    };
  } catch (err: any) {
    console.error('Error in createStory action:', err);
    return {
      success: false,
      error: err?.message || 'Gagal menyimpan cerita.',
    };
  }
}
