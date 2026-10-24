'use server';

import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCurrentUserSession } from '@/actions/bookings';
import { createAdminNotification } from '@/actions/admin/notifications';

export interface SubmitReportInput {
  targetType: 'forum_thread' | 'forum_post' | 'story' | 'meetup';
  targetId: number;
  reason: string;
  description?: string;
}

export async function submitContentReport({
  targetType,
  targetId,
  reason,
  description,
}: SubmitReportInput) {
  try {
    // 1. Resolve active user session
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

    if (!userId || isNaN(userId)) {
      return {
        success: false,
        error: 'Silakan masuk terlebih dahulu untuk melaporkan konten ini.',
        requireAuth: true,
      };
    }

    if (!targetId || !targetType || !reason) {
      return {
        success: false,
        error: 'Parameter laporan tidak valid.',
      };
    }

    // 2. Prevent duplicate pending reports from the same user on the same content
    const existing = await prisma.content_reports.findFirst({
      where: {
        target_type: targetType,
        target_id: targetId,
        reporter_id: userId,
        status: 'pending',
      },
    });

    if (existing) {
      return {
        success: false,
        error: 'Anda sudah pernah melaporkan konten ini. Tim kami sedang meninjaunya.',
      };
    }

    // 3. Create content report
    await prisma.content_reports.create({
      data: {
        target_type: targetType,
        target_id: targetId,
        reporter_id: userId,
        reason: reason.trim(),
        description: description?.trim() || null,
        status: 'pending',
      },
    });

    try {
      await createAdminNotification({
        type: 'content_report',
        title: 'Laporan Konten Baru! 📢',
        message: `Laporan baru untuk ${targetType.replace('_', ' ')} (ID: #${targetId}) - Alasan: ${reason}.`,
        action_url: '/community/reports',
        data: {
          targetType,
          targetId,
          reporterId: userId,
          reason,
        },
      });
    } catch (notifErr) {
      console.error('Failed to notify admin about content report:', notifErr);
    }

    return {
      success: true,
      message: 'Terima kasih, laporan Anda telah diterima dan akan segera ditinjau oleh tim moderator.',
    };
  } catch (error: any) {
    console.error('Failed to submit content report:', error);
    return {
      success: false,
      error: error?.message || 'Gagal mengirim laporan konten. Silakan coba lagi.',
    };
  }
}
