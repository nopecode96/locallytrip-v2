'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getNotifications(limit = 15) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { notifications: [], unreadCount: 0 };

  const user = await prisma.users.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) return { notifications: [], unreadCount: 0 };

  const [notifications, unreadCount] = await Promise.all([
    prisma.notifications.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: 'desc' },
      take: limit,
    }),
    prisma.notifications.count({
      where: { user_id: user.id, read: false },
    }),
  ]);

  return {
    notifications: notifications.map((n) => ({
      id: Number(n.id),
      uuid: n.uuid || null,
      user_id: Number(n.user_id),
      type: n.type,
      title: n.title,
      message: n.message,
      data: n.data,
      read: n.read,
      action_url: n.action_url,
      created_at: n.created_at.toISOString(),
      read_at: n.read_at ? n.read_at.toISOString() : null,
    })),
    unreadCount,
  };
}

export async function markNotificationAsRead(notificationId: number) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { success: false };

  try {
    await prisma.notifications.update({
      where: { id: notificationId },
      data: { read: true, read_at: new Date(), updated_at: new Date() },
    });
    return { success: true };
  } catch (err) {
    console.error('Failed to mark notification as read:', err);
    return { success: false };
  }
}

export async function markAllNotificationsAsRead() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { success: false };

  const user = await prisma.users.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) return { success: false };

  try {
    await prisma.notifications.updateMany({
      where: { user_id: user.id, read: false },
      data: { read: true, read_at: new Date(), updated_at: new Date() },
    });
    return { success: true };
  } catch (err) {
    console.error('Failed to mark all notifications as read:', err);
    return { success: false };
  }
}
