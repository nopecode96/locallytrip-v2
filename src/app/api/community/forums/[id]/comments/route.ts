import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { grantReward } from '@/lib/rewards/reward-engine';

export const dynamic = 'force-dynamic';

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('locallytrip_session')?.value;

  if (sessionToken) {
    const session = await prisma.user_sessions.findUnique({
      where: { session_token: sessionToken },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar_url: true,
            role: true,
            is_verified: true,
            user_xp: {
              select: {
                current_level: true,
                total_xp: true,
              },
            },
          },
        },
      },
    });

    if (session?.users) {
      return session.users;
    }
  }

  return null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const threadId = parseInt(id, 10);
    if (isNaN(threadId)) {
      return NextResponse.json({ success: false, error: 'Invalid thread ID' }, { status: 400 });
    }

    // 1. Auth Guard
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Silakan masuk untuk berkomentar' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { content, parentId = null } = body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json({ success: false, error: 'Content cannot be empty' }, { status: 400 });
    }

    const thread = await prisma.vibes_forum_threads.findUnique({
      where: { id: threadId },
      select: { id: true, is_locked: true },
    });

    if (!thread) {
      return NextResponse.json({ success: false, error: 'Thread not found' }, { status: 404 });
    }

    if (thread.is_locked) {
      return NextResponse.json({ success: false, error: 'Thread is locked' }, { status: 403 });
    }

    // Verify parent comment if nested
    let validParentId: number | null = null;
    if (parentId) {
      const parsedParentId = parseInt(parentId, 10);
      if (!isNaN(parsedParentId)) {
        const parentComment = await prisma.vibes_forum_posts.findUnique({
          where: { id: parsedParentId },
        });
        if (parentComment && parentComment.thread_id === threadId) {
          validParentId = parsedParentId;
        }
      }
    }

    const newPost = await prisma.vibes_forum_posts.create({
      data: {
        thread_id: threadId,
        parent_id: validParentId,
        author_id: authUser.id,
        content: content.trim(),
        created_at: new Date(),
        updated_at: new Date(),
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar_url: true,
            role: true,
            is_verified: true,
            user_xp: {
              select: {
                current_level: true,
                total_xp: true,
              },
            },
          },
        },
        vibes_forum_post_likes: true,
        vibes_forum_post_dislikes: true,
      },
    });

    // Update reply count and last reply on thread
    const postCount = await prisma.vibes_forum_posts.count({
      where: { thread_id: threadId, deleted_at: null },
    });

    await prisma.vibes_forum_threads.update({
      where: { id: threadId },
      data: {
        reply_count: postCount,
        last_reply_at: new Date(),
        last_reply_by: authUser.id,
      },
    });

    // Berikan reward terpusat (XP + LTP) untuk kontributor balasan
    const rewardResult = await grantReward(
      authUser.id,
      'FORUM_REPLY',
      newPost.id,
      'vibes_forum_posts'
    );

    return NextResponse.json({
      success: true,
      post: {
        id: newPost.id,
        thread_id: newPost.thread_id,
        parent_id: newPost.parent_id,
        content: newPost.content,
        created_at: newPost.created_at ? newPost.created_at.toISOString() : new Date().toISOString(),
        author: {
          id: newPost.users.id,
          name: newPost.users.name,
          username: newPost.users.username,
          avatar_url: newPost.users.avatar_url,
          is_verified: Boolean(newPost.users.is_verified),
          level: newPost.users.user_xp?.current_level || 1,
        },
        likes_count: 0,
        dislikes_count: 0,
      },
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
