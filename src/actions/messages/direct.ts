'use server';

import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCurrentUserSession } from '@/actions/bookings';

export interface UserConversationSummary {
  id: number;
  participant: {
    id: number;
    name: string;
    username: string;
    avatar_url: string | null;
    role?: string | null;
    is_verified: boolean;
  };
  lastMessage: {
    id: number;
    content: string;
    createdAt: string;
    isRead: boolean;
    isSenderMe: boolean;
  } | null;
  unreadCount: number;
  updatedAt: string;
}

export interface ConversationDetail {
  id: number;
  participant: {
    id: number;
    name: string;
    username: string;
    avatar_url: string | null;
    role?: string | null;
    is_verified: boolean;
    bio: string | null;
  };
  messages: Array<{
    id: number;
    senderId: number;
    content: string;
    createdAt: string;
    isRead: boolean;
  }>;
}

export interface GetOrCreateHostConversationParams {
  hostId: number;
  experienceId?: number;
  bookingReference?: string;
  initialMessage?: string;
}

export interface GetOrCreateConversationResult {
  success: boolean;
  conversationId?: number;
  error?: string;
  isUnauthorized?: boolean;
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
    select: { id: true, name: true, username: true, avatar_url: true, is_verified: true },
  });
}

/**
 * Server Action: Ambil daftar percakapan aktif pengguna
 */
export async function getUserConversations(): Promise<{
  success: boolean;
  conversations: UserConversationSummary[];
  error?: string;
}> {
  try {
    const currentUser = await getAuthenticatedUser();
    if (!currentUser) {
      return { success: false, conversations: [], error: 'Autentikasi diperlukan.' };
    }

    const rawConvs = await prisma.conversations.findMany({
      where: {
        OR: [
          { participant1_id: currentUser.id },
          { participant2_id: currentUser.id },
        ],
      },
      include: {
        users_conversations_participant1_idTousers: {
          select: { id: true, name: true, username: true, avatar_url: true, role: true, is_verified: true },
        },
        users_conversations_participant2_idTousers: {
          select: { id: true, name: true, username: true, avatar_url: true, role: true, is_verified: true },
        },
        conversation_participants: {
          where: { user_id: currentUser.id },
          select: { unread_count: true, last_read_at: true },
        },
        messages: {
          where: { is_deleted: false },
          orderBy: { created_at: 'desc' },
          take: 1,
          select: { id: true, content: true, created_at: true, is_read: true, sender_id: true },
        },
      },
      orderBy: { updated_at: 'desc' },
      take: 20,
    });

    const conversations: UserConversationSummary[] = rawConvs.map((c) => {
      const otherUser =
        c.participant1_id === currentUser.id
          ? c.users_conversations_participant2_idTousers
          : c.users_conversations_participant1_idTousers;

      const myParticipant = c.conversation_participants[0];
      const latestMsg = c.messages[0];

      return {
        id: c.id,
        participant: {
          id: otherUser.id,
          name: otherUser.name || otherUser.username || `User #${otherUser.id}`,
          username: otherUser.username || `user_${otherUser.id}`,
          avatar_url: otherUser.avatar_url,
          role: otherUser.role,
          is_verified: Boolean(otherUser.is_verified),
        },
        lastMessage: latestMsg
          ? {
              id: latestMsg.id,
              content: latestMsg.content,
              createdAt: latestMsg.created_at ? latestMsg.created_at.toISOString() : new Date().toISOString(),
              isRead: Boolean(latestMsg.is_read),
              isSenderMe: latestMsg.sender_id === currentUser.id,
            }
          : null,
        unreadCount: myParticipant?.unread_count || 0,
        updatedAt: c.updated_at.toISOString(),
      };
    });

    return { success: true, conversations };
  } catch (err: any) {
    console.error('Error fetching user conversations:', err);
    return { success: false, conversations: [], error: err?.message };
  }
}

/**
 * Server Action: Ambil detail percakapan beserta seluruh pesan dan tandai sudah dibaca
 */
export async function getConversationDetail(conversationId: number): Promise<{
  success: boolean;
  conversation?: ConversationDetail;
  error?: string;
}> {
  try {
    const currentUser = await getAuthenticatedUser();
    if (!currentUser) {
      return { success: false, error: 'Autentikasi diperlukan.' };
    }

    const conv = await prisma.conversations.findUnique({
      where: { id: conversationId },
      include: {
        users_conversations_participant1_idTousers: {
          select: { id: true, name: true, username: true, avatar_url: true, role: true, is_verified: true, bio: true },
        },
        users_conversations_participant2_idTousers: {
          select: { id: true, name: true, username: true, avatar_url: true, role: true, is_verified: true, bio: true },
        },
        messages: {
          where: { is_deleted: false },
          orderBy: { created_at: 'asc' },
          take: 100,
          select: { id: true, sender_id: true, content: true, created_at: true, is_read: true },
        },
      },
    });

    if (!conv) {
      return { success: false, error: 'Percakapan tidak ditemukan.' };
    }

    // Pastikan user adalah peserta
    if (conv.participant1_id !== currentUser.id && conv.participant2_id !== currentUser.id) {
      return { success: false, error: 'Akses ditolak.' };
    }

    const otherUser =
      conv.participant1_id === currentUser.id
        ? conv.users_conversations_participant2_idTousers
        : conv.users_conversations_participant1_idTousers;

    // Tandai pesan sudah dibaca (read)
    const now = new Date();
    await prisma.$transaction(async (tx) => {
      await tx.messages.updateMany({
        where: {
          conversation_id: conv.id,
          sender_id: { not: currentUser.id },
          is_read: false,
        },
        data: {
          is_read: true,
          read_at: now,
        },
      });

      await tx.conversation_participants.updateMany({
        where: {
          conversation_id: conv.id,
          user_id: currentUser.id,
        },
        data: {
          unread_count: 0,
          last_read_at: now,
        },
      });
    });

    return {
      success: true,
      conversation: {
        id: conv.id,
        participant: {
          id: otherUser.id,
          name: otherUser.name || otherUser.username || `User #${otherUser.id}`,
          username: otherUser.username || `user_${otherUser.id}`,
          avatar_url: otherUser.avatar_url,
          role: otherUser.role,
          is_verified: Boolean(otherUser.is_verified),
          bio: otherUser.bio,
        },
        messages: conv.messages.map((m) => ({
          id: m.id,
          senderId: m.sender_id,
          content: m.content,
          createdAt: m.created_at ? m.created_at.toISOString() : new Date().toISOString(),
          isRead: Boolean(m.is_read),
        })),
      },
    };
  } catch (err: any) {
    console.error('Error fetching conversation detail:', err);
    return { success: false, error: err?.message };
  }
}

/**
 * Server Action: Kirim pesan di percakapan personal
 */
export async function sendDirectMessage(conversationId: number, content: string) {
  try {
    const currentUser = await getAuthenticatedUser();
    if (!currentUser) {
      return { success: false, error: 'Autentikasi diperlukan.' };
    }

    if (!content || !content.trim()) {
      return { success: false, error: 'Pesan tidak boleh kosong.' };
    }

    const conv = await prisma.conversations.findUnique({
      where: { id: conversationId },
    });

    if (!conv) {
      return { success: false, error: 'Percakapan tidak ditemukan.' };
    }

    if (conv.participant1_id !== currentUser.id && conv.participant2_id !== currentUser.id) {
      return { success: false, error: 'Akses ditolak.' };
    }

    const targetUserId =
      conv.participant1_id === currentUser.id ? conv.participant2_id : conv.participant1_id;

    const now = new Date();

    const createdMsg = await prisma.$transaction(async (tx) => {
      const msg = await tx.messages.create({
        data: {
          conversation_id: conv.id,
          sender_id: currentUser.id,
          content: content.trim(),
          message_type: 'text',
          is_read: false,
          created_at: now,
        },
      });

      await tx.conversations.update({
        where: { id: conv.id },
        data: {
          last_message_at: now,
          updated_at: now,
        },
      });

      // Tambah unread_count penerima
      await tx.conversation_participants.updateMany({
        where: {
          conversation_id: conv.id,
          user_id: targetUserId,
        },
        data: {
          unread_count: { increment: 1 },
        },
      });

      // Buat notifikasi lonceng ke penerima
      await tx.notifications.create({
        data: {
          user_id: targetUserId,
          type: 'COMMUNITY',
          title: `Pesan Baru dari ${currentUser.name} 💬`,
          message: `${currentUser.name}: "${content.trim().slice(0, 50)}..."`,
          action_url: `/messages?c=${conv.id}`,
          created_at: now,
          updated_at: now,
        },
      });

      return msg;
    });

    return {
      success: true,
      message: {
        id: createdMsg.id,
        senderId: currentUser.id,
        content: createdMsg.content,
        createdAt: now.toISOString(),
        isRead: false,
      },
    };
  } catch (err: any) {
    console.error('Error sending direct message:', err);
    return { success: false, error: err?.message };
  }
}

/**
 * Server Action: Inisialisasi atau temukan percakapan personal antara Tamu dan Host
 */
export async function getOrCreateHostConversation({
  hostId,
  experienceId,
  bookingReference,
  initialMessage,
}: GetOrCreateHostConversationParams): Promise<GetOrCreateConversationResult> {
  try {
    const currentUser = await getAuthenticatedUser();
    if (!currentUser) {
      return {
        success: false,
        error: 'Autentikasi diperlukan. Silakan masuk terlebih dahulu.',
        isUnauthorized: true,
      };
    }

    if (!hostId || isNaN(hostId)) {
      return { success: false, error: 'Identitas Host tidak valid.' };
    }

    // Cegah chat dengan diri sendiri
    if (currentUser.id === hostId) {
      return {
        success: false,
        error: 'Anda tidak dapat memulai obrolan dengan akun Anda sendiri.',
      };
    }

    const p1 = Math.min(currentUser.id, hostId);
    const p2 = Math.max(currentUser.id, hostId);

    // Cari percakapan eksisting
    let conversation = await prisma.conversations.findFirst({
      where: {
        participant1_id: p1,
        participant2_id: p2,
      },
      select: { id: true },
    });

    const now = new Date();

    if (!conversation) {
      // Buat percakapan baru jika belum ada
      conversation = await prisma.conversations.create({
        data: {
          participant1_id: p1,
          participant2_id: p2,
          last_message_at: now,
          created_at: now,
          updated_at: now,
        },
        select: { id: true },
      });

      // Inisialisasi conversation_participants untuk kedua pihak
      await prisma.conversation_participants.createMany({
        data: [
          { conversation_id: conversation.id, user_id: p1, unread_count: 0, joined_at: now },
          { conversation_id: conversation.id, user_id: p2, unread_count: 0, joined_at: now },
        ],
      });
    }

    // Jika terdapat pesan awal (initialMessage), buat pesan pertama dan notifikasi
    if (initialMessage && initialMessage.trim().length > 0) {
      const trimmed = initialMessage.trim();
      await prisma.messages.create({
        data: {
          conversation_id: conversation.id,
          sender_id: currentUser.id,
          content: trimmed,
          message_type: 'text',
          is_read: false,
          created_at: now,
        },
      });

      await prisma.conversations.update({
        where: { id: conversation.id },
        data: {
          last_message_at: now,
          updated_at: now,
        },
      });

      await prisma.conversation_participants.updateMany({
        where: {
          conversation_id: conversation.id,
          user_id: hostId,
        },
        data: {
          unread_count: { increment: 1 },
        },
      });

      await prisma.notifications.create({
        data: {
          user_id: hostId,
          type: 'MESSAGE',
          title: `Pesan Baru dari ${currentUser.name || 'Tamu'} 💬`,
          message: trimmed.length > 100 ? `${trimmed.slice(0, 100)}...` : trimmed,
          action_url: `/messages?c=${conversation.id}`,
          created_at: now,
          updated_at: now,
        },
      });
    }

    return {
      success: true,
      conversationId: conversation.id,
    };
  } catch (err: any) {
    console.error('Error in getOrCreateHostConversation:', err);
    return {
      success: false,
      error: err?.message || 'Terjadi kesalahan saat memulai percakapan.',
    };
  }
}
