import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { id, commentId } = await params;
    const threadId = parseInt(id, 10);
    const postId = parseInt(commentId, 10);

    if (isNaN(threadId) || isNaN(postId)) {
      return NextResponse.json({ success: false, error: 'Invalid parameters' }, { status: 400 });
    }

    const body = await req.json();
    const { voteType, userId = 235 } = body; // 'up' | 'down' | 'clear'

    const post = await prisma.vibes_forum_posts.findUnique({
      where: { id: postId },
    });

    if (!post || post.thread_id !== threadId) {
      return NextResponse.json({ success: false, error: 'Comment not found' }, { status: 404 });
    }

    const existingLike = await prisma.vibes_forum_post_likes.findFirst({
      where: { post_id: postId, user_id: userId },
    });
    const existingDislike = await prisma.vibes_forum_post_dislikes.findFirst({
      where: { post_id: postId, user_id: userId },
    });

    if (voteType === 'up') {
      if (!existingLike) {
        await prisma.vibes_forum_post_likes.create({
          data: { post_id: postId, user_id: userId },
        });
      }
      if (existingDislike) {
        await prisma.vibes_forum_post_dislikes.delete({
          where: { id: existingDislike.id },
        });
      }
    } else if (voteType === 'down') {
      if (!existingDislike) {
        await prisma.vibes_forum_post_dislikes.create({
          data: { post_id: postId, user_id: userId },
        });
      }
      if (existingLike) {
        await prisma.vibes_forum_post_likes.delete({
          where: { id: existingLike.id },
        });
      }
    } else if (voteType === 'clear') {
      if (existingLike) {
        await prisma.vibes_forum_post_likes.delete({
          where: { id: existingLike.id },
        });
      }
      if (existingDislike) {
        await prisma.vibes_forum_post_dislikes.delete({
          where: { id: existingDislike.id },
        });
      }
    }

    const [likesCount, dislikesCount] = await Promise.all([
      prisma.vibes_forum_post_likes.count({ where: { post_id: postId } }),
      prisma.vibes_forum_post_dislikes.count({ where: { post_id: postId } }),
    ]);

    await prisma.vibes_forum_posts.update({
      where: { id: postId },
      data: {
        like_count: likesCount,
        dislike_count: dislikesCount,
      },
    });

    return NextResponse.json({
      success: true,
      likesCount,
      dislikesCount,
      netScore: likesCount - dislikesCount,
      userVote: voteType === 'clear' ? null : voteType,
    });
  } catch (error) {
    console.error('Error voting comment:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
