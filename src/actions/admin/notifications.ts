'use server';

import prisma from '@/lib/prisma';
import { getAdminStaffSession } from '@/lib/admin-auth';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';

export interface AdminNotificationItem {
  id: number;
  user_id: number;
  type: string; // 'booking' | 'b2b_application' | 'content_report' | 'withdrawal' | 'review'
  title: string;
  message: string;
  action_url: string | null;
  target_url?: string | null;
  read: boolean;
  is_read: boolean;
  read_at: Date | null;
  created_at: Date;
}

export interface GetAdminNotificationsResult {
  success: boolean;
  notifications: AdminNotificationItem[];
  unreadCount: number;
  totalCount: number;
}

export interface CreateAdminNotificationInput {
  type: 'booking' | 'b2b_application' | 'content_report' | 'withdrawal' | 'review' | string;
  title: string;
  message: string;
  action_url?: string;
  target_url?: string;
  data?: any;
  user_id?: number;
}

const ADMIN_NOTIFICATION_TYPES = [
  'booking',
  'b2b_application',
  'b2b',
  'content_report',
  'withdrawal',
  'payout',
  'review',
  'kyc',
];

/**
 * 1. Fetch unread and recent admin notifications ordered by created_at desc
 */
export async function getAdminNotifications(params: {
  page?: number;
  limit?: number;
} = {}): Promise<GetAdminNotificationsResult> {
  try {
    const session = await getAdminStaffSession();
    const currentAdminId = session?.id ? Number(session.id) : null;
    const { page = 1, limit = 15 } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (currentAdminId) {
      where.OR = [
        { user_id: currentAdminId },
        { type: { in: ADMIN_NOTIFICATION_TYPES } },
      ];
    } else {
      where.type = { in: ADMIN_NOTIFICATION_TYPES };
    }

    const [rawNotifications, unreadCount, totalCount] = await Promise.all([
      prisma.notifications.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notifications.count({
        where: {
          ...where,
          read: false,
        },
      }),
      prisma.notifications.count({ where }),
    ]);

    const notifications: AdminNotificationItem[] = rawNotifications.map((n) => ({
      id: n.id,
      user_id: n.user_id,
      type: n.type,
      title: n.title,
      message: n.message,
      action_url: n.action_url,
      target_url: n.action_url,
      read: n.read,
      is_read: n.read,
      read_at: n.read_at,
      created_at: n.created_at,
    }));

    return {
      success: true,
      notifications,
      unreadCount,
      totalCount,
    };
  } catch (error: any) {
    console.error('Error fetching admin notifications:', error);
    return {
      success: false,
      notifications: [],
      unreadCount: 0,
      totalCount: 0,
    };
  }
}

/**
 * 2. Mark a single notification as read
 */
export async function markNotificationAsRead(notificationId: number) {
  try {
    await prisma.notifications.update({
      where: { id: notificationId },
      data: {
        read: true,
        read_at: new Date(),
        updated_at: new Date(),
      },
    });

    revalidatePath('/admin');
    return { success: true };
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 3. Mark all notifications as read for admin
 */
export async function markAllNotificationsAsRead() {
  try {
    const session = await getAdminStaffSession();
    const currentAdminId = session?.id ? Number(session.id) : null;

    const where: any = { read: false };
    if (currentAdminId) {
      where.OR = [
        { user_id: currentAdminId },
        { type: { in: ADMIN_NOTIFICATION_TYPES } },
      ];
    } else {
      where.type = { in: ADMIN_NOTIFICATION_TYPES };
    }

    await prisma.notifications.updateMany({
      where,
      data: {
        read: true,
        read_at: new Date(),
        updated_at: new Date(),
      },
    });

    revalidatePath('/admin');
    return { success: true };
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 4. Helper function to create an admin notification (broadcasts to admin staff)
 */
export async function createAdminNotification(input: CreateAdminNotificationInput) {
  try {
    const actionUrl = input.action_url || input.target_url || '/dashboard';
    const now = new Date();

    if (input.user_id) {
      return await prisma.notifications.create({
        data: {
          uuid: randomUUID(),
          user_id: input.user_id,
          type: input.type,
          title: input.title,
          message: input.message,
          action_url: actionUrl,
          data: input.data || {},
          read: false,
          created_at: now,
          updated_at: now,
        },
      });
    }

    // Broadcast notification to all admin staff accounts
    const admins = await prisma.users.findMany({
      where: {
        role: { in: ['admin', 'super admin', 'superadmin', 'moderator'] },
      },
      select: { id: true },
    });

    const targetAdminIds = admins.length > 0 ? admins.map((a) => a.id) : [1];

    const created = await Promise.all(
      targetAdminIds.map((adminId) =>
        prisma.notifications.create({
          data: {
            uuid: randomUUID(),
            user_id: adminId,
            type: input.type,
            title: input.title,
            message: input.message,
            action_url: actionUrl,
            data: input.data || {},
            read: false,
            created_at: now,
            updated_at: now,
          },
        })
      )
    );

    return created[0];
  } catch (error: any) {
    console.error('Failed to create admin notification:', error);
    return null;
  }
}
