'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { createNotification } from '@/lib/notifications';
import { getCurrentUserSession } from '@/actions/bookings';
import path from 'path';

export interface CreateForumThreadInput {
  title: string;
  categoryId: number;
  cityId?: number | null;
  tags?: string[];
  content: string;
  images?: string[];
  status?: 'PUBLISHED' | 'DRAFT' | 'OPEN' | 'active';
}

export async function createForumThread(formData: CreateForumThreadInput) {
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
    return { success: false, error: 'Silakan masuk terlebih dahulu untuk memulai diskusi.' };
  }

  const { title, categoryId, cityId, tags = [], content, images = [] } = formData;

  if (!title || title.trim().length < 5) {
    return { success: false, error: 'Judul diskusi minimal 5 karakter.' };
  }

  if (!categoryId) {
    return { success: false, error: 'Pilih kategori diskusi yang relevan.' };
  }

  if (!content || content.trim().length < 15) {
    return { success: false, error: 'Isi diskusi pembuka minimal 15 karakter.' };
  }

  const user = await prisma.users.findUnique({
    where: { email: userEmail },
    select: { id: true, name: true },
  });

  if (!user) return { success: false, error: 'Pengguna tidak ditemukan.' };

  // Ambil aturan reward FORUM_TOPIC_CREATE dari basis data jika ada (default 25 XP & 5 LTP)
  let xpReward = 25;
  let ltpReward = 5;
  try {
    const rule = await prisma.reward_action_rules.findFirst({
      where: {
        action_code: { in: ['FORUM_TOPIC_CREATE', 'FORUM_CREATE_THREAD'] },
        is_active: true,
      },
    });
    if (rule) {
      xpReward = rule.xp_reward;
      ltpReward = Number(rule.ltp_reward);
    }
  } catch (ruleErr) {
    console.warn('Fallback to default forum thread rewards:', ruleErr);
  }

  // Jika kota dipilih, cari info kota untuk disematkan di metadata/tagar
  let cityName: string | null = null;
  if (cityId) {
    try {
      const city = await prisma.cities.findUnique({
        where: { id: Number(cityId) },
        select: { name: true },
      });
      if (city) cityName = city.name;
    } catch {}
  }

  try {
    const now = new Date();

    // Generate slug dari judul yang ramah SEO
    const baseSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') || 'thread';
    const slug = `${baseSlug}-${Date.now().toString().slice(-6)}`;

    // Gabungkan tagar termasuk kota jika ada
    const allTags = [...tags];
    if (cityName && !allTags.includes(cityName.toLowerCase())) {
      allTags.push(cityName);
    }

    // Sanitasi nama berkas: Simpan HANYA nama berkas murni (clean filename)
    const cleanImageFileNames: string[] = [];
    if (Array.isArray(images)) {
      for (const img of images) {
        if (img && typeof img === 'string' && !img.startsWith('blob:')) {
          cleanImageFileNames.push(path.basename(img.trim()));
        }
      }
    }

    const threadStatus = formData.status || 'PUBLISHED';

    // 1. Simpan Thread ke database (tabel vibes_forum_threads)
    const thread = await prisma.vibes_forum_threads.create({
      data: {
        author_id: user.id,
        category_id: Number(categoryId),
        title: title.trim(),
        slug,
        content: content.trim(),
        status: threadStatus,
        view_count: 0,
        reply_count: 0,
        like_count: 0,
        dislike_count: 0,
        images: cleanImageFileNames.length > 0 ? cleanImageFileNames : [],
        meta_keywords: allTags.join(', '),
        meta_title: title.slice(0, 60),
        meta_description: content.slice(0, 160).replace(/\n/g, ' '),
        created_at: now,
        updated_at: now,
      },
    });

    // 2. Simpan dan hubungkan tagar ke tabel vibes_forum_thread_tags & vibes_forum_threads_tags
    if (allTags.length > 0) {
      for (const rawTag of allTags) {
        const cleanTag = rawTag.trim();
        if (!cleanTag) continue;
        const tagSlug = cleanTag.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        if (!tagSlug) continue;

        try {
          // Cari atau buat tag
          let tagRecord = await prisma.vibes_forum_thread_tags.findFirst({
            where: {
              OR: [{ name: cleanTag }, { slug: tagSlug }],
            },
          });

          if (!tagRecord) {
            tagRecord = await prisma.vibes_forum_thread_tags.create({
              data: {
                name: cleanTag,
                slug: tagSlug,
                thread_count: 1,
                is_active: true,
                created_at: now,
                updated_at: now,
              },
            });
          } else {
            await prisma.vibes_forum_thread_tags.update({
              where: { id: tagRecord.id },
              data: {
                thread_count: { increment: 1 },
                updated_at: now,
              },
            });
          }

          // Hubungkan di tabel relasi vibes_forum_threads_tags
          await prisma.vibes_forum_threads_tags.upsert({
            where: {
              thread_id_tag_id: {
                thread_id: thread.id,
                tag_id: tagRecord.id,
              },
            },
            create: {
              thread_id: thread.id,
              tag_id: tagRecord.id,
              created_at: now,
            },
            update: {},
          });
        } catch (tagErr) {
          console.warn('Non-critical error saving forum tag:', tagErr);
        }
      }
    }

    // 3. Kreditkan XP ke user
    if (xpReward > 0) {
      await prisma.user_xp.upsert({
        where: { user_id: user.id },
        update: { total_xp: { increment: xpReward }, updated_at: now },
        create: { user_id: user.id, total_xp: xpReward, current_level: 1, created_at: now, updated_at: now },
      });

      await prisma.user_xp_history.create({
        data: {
          user_id: user.id,
          amount: xpReward,
          activity_type: 'FORUM_TOPIC_CREATE',
          source_id: thread.id,
          source_table: 'vibes_forum_threads',
          created_at: now,
        },
      });
    }

    // 4. Kreditkan LTP jika dompet tersedia
    if (ltpReward > 0) {
      const wallet = await prisma.user_ltp_wallets.findFirst({ where: { user_id: user.id } });
      if (wallet) {
        await prisma.user_ltp_wallets.update({
          where: { id: wallet.id },
          data: { balance: { increment: ltpReward }, updated_at: now },
        });

        await prisma.user_ltp_transactions.create({
          data: {
            user_id: user.id,
            amount: ltpReward,
            type: 'credit',
            activity_type: 'FORUM_TOPIC_CREATE',
            source_id: thread.id,
            source_table: 'vibes_forum_threads',
            created_at: now,
          },
        });
      }
    }

    // 5. Kirim notifikasi lonceng ke pembuat thread
    await createNotification({
      userId: user.id,
      type: 'REWARD_XP',
      title: 'Diskusi Baru Berhasil Diterbitkan! 🎉',
      message: `Topik "${title.slice(0, 30)}..." berhasil dibuat. Anda mendapatkan +${xpReward} XP & +${ltpReward} LTP!`,
      actionUrl: `/community/forums/${thread.slug}`,
      data: {
        threadId: thread.id,
        slug: thread.slug,
        xpEarned: xpReward,
        ltpEarned: ltpReward,
      },
    });

    revalidatePath('/community/forums');
    revalidatePath('/[lang]/community/forums', 'page');
    revalidatePath('/[lang]/community', 'page');
    revalidatePath('/[lang]/dashboard', 'page');

    return { success: true, slug: thread.slug };
  } catch (error) {
    console.error('Error creating forum thread:', error);
    return { success: false, error: 'Gagal membuat topik diskusi. Silakan coba lagi.' };
  }
}

export async function getForumCategories() {
  try {
    const categories = await prisma.vibes_forum_categories.findMany({
      where: { is_active: true },
      orderBy: { display_order: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        description: true,
      },
    });
    return categories;
  } catch (err) {
    console.error('Failed to get forum categories:', err);
    return [];
  }
}
