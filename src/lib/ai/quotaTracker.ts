import { prisma } from '@/lib/prisma';

export interface RecordAiLogParams {
  feature: string;
  model: string;
  statusCode: number;
  isSuccess: boolean;
  errorMessage?: string | null;
  tokensUsed?: number;
  latencyMs?: number;
}

/**
 * Mencatat telemetri pemanggilan Gemini AI API secara non-blocking
 */
export async function recordAiApiLog(params: RecordAiLogParams): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO public.ai_api_logs (feature, model, status_code, is_success, error_message, tokens_used, latency_ms, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
      params.feature,
      params.model,
      params.statusCode,
      params.isSuccess,
      params.errorMessage || null,
      params.tokensUsed || 0,
      params.latencyMs || 0
    );
  } catch (error) {
    // Non-blocking: kegagalan logging tidak boleh memutus request AI user
    console.error('[recordAiApiLog] Error recording log:', error);
  }
}

export interface AiQuotaTelemetry {
  minute: {
    usedRequests: number;
    limit: number;
    remaining: number;
    resetInSeconds: number;
    percent: number;
  };
  daily: {
    usedRequests: number;
    limit: number;
    remaining: number;
    resetInHours: number;
    percent: number;
  };
  weekly: {
    usedRequests: number;
    limit: number;
    remaining: number;
    resetInDays: number;
    percent: number;
  };
  status: 'OPTIMAL' | 'WARNING' | 'RATE_LIMITED';
  lastRateLimitAt: string | null;
  totalTokensToday: number;
  syntheticSeedStats?: {
    aiUsers: number;
    aiStories: number;
    aiForumThreads: number;
    aiForumReplies: number;
    aiMeetups: number;
  };
}

/**
 * Mengambil ringkasan telemetri pemakaian kuota Gemini AI (Menit, Harian, Mingguan)
 * Berdasarkan limit resmi Google Gemini Free Tier:
 * - 15 RPM (Requests Per Minute)
 * - 1,500 RPD (Requests Per Day)
 * - 10,500 RPW (Requests Per Week)
 */
export async function getAiQuotaTelemetry(): Promise<AiQuotaTelemetry> {
  const RPM_LIMIT = 15;
  const RPD_LIMIT = 1500;
  const RPW_LIMIT = 10500;

  try {
    // Hitung waktu batas reset kuota
    const now = new Date();
    const secondsToNextMinute = 60 - now.getSeconds();

    // Reset harian Gemini biasanya UTC 00:00 (atau jam 07:00 WIB)
    // Hitung sisa jam hingga jam 00:00 UTC berikutnya
    const nextUtcMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
    const hoursToNextDay = Math.max(1, Math.round((nextUtcMidnight.getTime() - now.getTime()) / (1000 * 60 * 60)));

    // Sisa hari menuju reset mingguan (setiap Senin 00:00 UTC)
    const currentUtcDay = now.getUTCDay(); // 0 is Sunday, 1 is Monday
    const daysToNextMonday = currentUtcDay === 0 ? 1 : 8 - currentUtcDay;

    const statsRes: any[] = await prisma.$queryRawUnsafe(`
      SELECT
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 minute') AS minute_calls,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') AS day_calls,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS week_calls,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '15 minutes' AND status_code = 429) AS recent_rate_limits,
        MAX(CASE WHEN status_code = 429 THEN created_at END) AS last_rate_limit,
        COALESCE(SUM(tokens_used) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours'), 0) AS tokens_today
      FROM public.ai_api_logs;
    `);

    const row = statsRes[0] || {};
    const minuteCalls = Number(row.minute_calls || 0);
    const dayCalls = Number(row.day_calls || 0);
    const weekCalls = Number(row.week_calls || 0);
    const recentRateLimits = Number(row.recent_rate_limits || 0);
    const lastRateLimit = row.last_rate_limit ? new Date(row.last_rate_limit).toISOString() : null;
    const tokensToday = Number(row.tokens_today || 0);

    // Kueri telemetri synthetic AI personas & content yang aktif
    const seedRes: any[] = await prisma.$queryRawUnsafe(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE is_ai_generated = true) as ai_users,
        (SELECT COUNT(*) FROM stories WHERE is_ai_generated = true) as ai_stories,
        (SELECT COUNT(*) FROM vibes_forum_threads WHERE is_ai_generated = true) as ai_threads,
        (SELECT COUNT(*) FROM vibes_forum_posts WHERE is_ai_generated = true) as ai_posts,
        (SELECT COUNT(*) FROM vibes_travel_meetups WHERE is_ai_generated = true) as ai_meetups;
    `);
    const seedRow = seedRes[0] || {};

    let status: 'OPTIMAL' | 'WARNING' | 'RATE_LIMITED' = 'OPTIMAL';
    if (recentRateLimits > 0 || minuteCalls >= RPM_LIMIT || dayCalls >= RPD_LIMIT) {
      status = 'RATE_LIMITED';
    } else if (minuteCalls >= RPM_LIMIT * 0.75 || dayCalls >= RPD_LIMIT * 0.8) {
      status = 'WARNING';
    }

    return {
      minute: {
        usedRequests: minuteCalls,
        limit: RPM_LIMIT,
        remaining: Math.max(0, RPM_LIMIT - minuteCalls),
        resetInSeconds: secondsToNextMinute,
        percent: Math.min(100, Math.round((minuteCalls / RPM_LIMIT) * 100)),
      },
      daily: {
        usedRequests: dayCalls,
        limit: RPD_LIMIT,
        remaining: Math.max(0, RPD_LIMIT - dayCalls),
        resetInHours: hoursToNextDay,
        percent: Math.min(100, Math.round((dayCalls / RPD_LIMIT) * 100)),
      },
      weekly: {
        usedRequests: weekCalls,
        limit: RPW_LIMIT,
        remaining: Math.max(0, RPW_LIMIT - weekCalls),
        resetInDays: daysToNextMonday,
        percent: Math.min(100, Math.round((weekCalls / RPW_LIMIT) * 100)),
      },
      status,
      lastRateLimitAt: lastRateLimit,
      totalTokensToday: tokensToday,
      syntheticSeedStats: {
        aiUsers: Number(seedRow.ai_users || 0),
        aiStories: Number(seedRow.ai_stories || 0),
        aiForumThreads: Number(seedRow.ai_threads || 0),
        aiForumReplies: Number(seedRow.ai_posts || 0),
        aiMeetups: Number(seedRow.ai_meetups || 0),
      },
    };
  } catch (error) {
    console.error('[getAiQuotaTelemetry] Database query error:', error);
    return {
      minute: { usedRequests: 0, limit: 15, remaining: 15, resetInSeconds: 60, percent: 0 },
      daily: { usedRequests: 0, limit: 1500, remaining: 1500, resetInHours: 24, percent: 0 },
      weekly: { usedRequests: 0, limit: 10500, remaining: 10500, resetInDays: 7, percent: 0 },
      status: 'OPTIMAL',
      lastRateLimitAt: null,
      totalTokensToday: 0,
    };
  }
}
