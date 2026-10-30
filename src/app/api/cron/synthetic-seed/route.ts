import { NextRequest, NextResponse } from 'next/server';
import {
  seedNewAiPersona,
  seedNewAiStory,
  seedNewAiForumThread,
  seedAiForumReply,
  seedNewAiMeetup,
  seedAiJoinMeetup,
  SeedExecutionResult,
} from '@/lib/ai/syntheticEngine';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Verifikasi Token Keamanan Cron
    const authHeader = req.headers.get('Authorization');
    const expectedSecret = process.env.SCHEDULED_TASK_API_KEY;

    if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const forcedAction = body?.action; // 'USER' | 'STORY' | 'FORUM' | 'REPLY' | 'MEETUP' | 'JOIN_MEETUP'

    let result: SeedExecutionResult;

    if (forcedAction === 'USER') {
      result = await seedNewAiPersona();
    } else if (forcedAction === 'STORY') {
      result = await seedNewAiStory();
    } else if (forcedAction === 'FORUM') {
      result = await seedNewAiForumThread();
    } else if (forcedAction === 'REPLY') {
      result = await seedAiForumReply();
    } else if (forcedAction === 'MEETUP') {
      result = await seedNewAiMeetup();
    } else if (forcedAction === 'JOIN_MEETUP') {
      result = await seedAiJoinMeetup();
    } else {
      // Bobot Alami Acak
      const rand = Math.random();
      if (rand < 0.20) {
        result = await seedNewAiPersona();
      } else if (rand < 0.50) {
        result = await seedNewAiStory();
      } else if (rand < 0.75) {
        result = await seedNewAiForumThread();
      } else if (rand < 0.85) {
        result = await seedAiForumReply();
      } else if (rand < 0.95) {
        result = await seedNewAiMeetup();
      } else {
        result = await seedAiJoinMeetup();
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result,
    });
  } catch (error: any) {
    console.error('[API /api/cron/synthetic-seed] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
