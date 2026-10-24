import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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

    const body = await req.json();
    const { voteType, userId = 235 } = body; // voteType: 'up' | 'down' | 'clear'

    if (!['up', 'down', 'clear'].includes(voteType)) {
      return NextResponse.json({ success: false, error: 'Invalid voteType' }, { status: 400 });
    }

    const thread = await prisma.vibes_forum_threads.findUnique({
      where: { id: threadId },
      select: { id: true, like_count: true, dislike_count: true },
    });

    if (!thread) {
      return NextResponse.json({ success: false, error: 'Thread not found' }, { status: 404 });
    }

    // Check existing likes and dislikes
    const existingLike = await prisma.vibes_forum_thread_likes.findFirst({
      where: { thread_id: threadId, user_id: userId },
    });
    const existingDislike = await prisma.vibes_forum_thread_dislikes.findFirst({
      where: { thread_id: threadId, user_id: userId },
    });

    if (voteType === 'up') {
      if (!existingLike) {
        await prisma.vibes_forum_thread_likes.create({
          data: { thread_id: threadId, user_id: userId },
        });
      }
      if (existingDislike) {
        await prisma.vibes_forum_thread_dislikes.delete({
          where: { id: existingDislike.id },
        });
      }
    } else if (voteType === 'down') {
      if (!existingDislike) {
        await prisma.vibes_forum_thread_dislikes.create({
          data: { thread_id: threadId, user_id: userId },
        });
      }
      if (existingLike) {
        await prisma.vibes_forum_thread_likes.delete({
          where: { id: existingLike.id },
        });
      }
    } else if (voteType === 'clear') {
      if (existingLike) {
        await prisma.vibes_forum_thread_likes.delete({
          where: { id: existingLike.id },
        });
      }
      if (existingDislike) {
        await prisma.vibes_forum_thread_dislikes.delete({
          where: { id: existingDislike.id },
        });
      }
    }

    // Recalculate accurate counts
    const [likesCount, dislikesCount] = await Promise.all([
      prisma.vibes_forum_thread_likes.count({ where: { thread_id: threadId } }),
      prisma.vibes_forum_thread_dislikes.count({ where: { thread_id: threadId } }),
    ]);

    await prisma.vibes_forum_threads.update({
      where: { id: threadId },
      data: {
        like_count: likesCount,
        dislike_count: dislikesCount,
      },
    });

    const netScore = likesCount - dislikesCount;

    return NextResponse.json({
      success: true,
      likesCount,
      dislikesCount,
      netScore,
      userVote: voteType === 'clear' ? null : voteType,
    });
  } catch (error) {
    console.error('Error voting thread:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
