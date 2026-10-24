import { prisma } from '@/lib/prisma';

export interface CreateNotificationParams {
  userId: number;
  type: 'REWARD_XP' | 'REWARD_LTP' | 'COMMENT' | 'MEETUP_RSVP' | 'BOOKING' | 'SYSTEM';
  title: string;
  message: string;
  actionUrl?: string;
  data?: Record<string, any>;
}

export async function createNotification({
  userId,
  type,
  title,
  message,
  actionUrl,
  data = {},
}: CreateNotificationParams) {
  try {
    return await prisma.notifications.create({
      data: {
        user_id: userId,
        type,
        title,
        message,
        action_url: actionUrl || null,
        data: data || {},
        read: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
}
