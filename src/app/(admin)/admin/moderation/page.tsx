import React from 'react';
import prisma from '@/lib/prisma';
import { MessageSquare, Users, ShieldAlert, CheckCircle, Flag } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Moderasi Komunitas | Locallytrip Admin',
  description: 'Panel moderasi forum diskusi Vibes dan travel meetups.',
};

export const dynamic = 'force-dynamic';

export default async function AdminModerationPage() {
  const [threads, meetups] = await Promise.all([
    prisma.vibes_forum_threads.findMany({
      take: 10,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        title: true,
        view_count: true,
        reply_count: true,
        like_count: true,
        created_at: true,
      },
    }),
    prisma.vibes_travel_meetups.findMany({
      take: 10,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        current_member_count: true,
        created_at: true,
      },
    }),
  ]);

  return (
    <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-gray-900 dark:text-white tracking-tight">
          Moderasi Komunitas Vibes & Meetups
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Pengawasan konten utas diskusi, keselamatan agenda temu komunitas, dan integritas platform.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Forum Threads Moderation */}
        <div className="rounded-3xl shadow-sm bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-200/90 dark:border-white/10">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Utas Diskusi Forum Terbaru</h2>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">{threads.length} utas</span>
          </div>

          <div className="space-y-3">
            {threads.map((t) => (
              <div
                key={t.id}
                className="p-3.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/90 dark:border-white/10/80 flex items-start justify-between gap-3 hover:border-slate-700 transition"
              >
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-gray-900 dark:text-gray-900 dark:text-white line-clamp-1">{t.title}</h3>
                  <div className="flex items-center gap-3 text-[10px] text-gray-500 dark:text-gray-400">
                    <span>{t.reply_count} balasan</span>
                    <span>•</span>
                    <span>{t.like_count} disukai</span>
                    <span>•</span>
                    <span>{t.view_count} pembaca</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 shrink-0">
                  Aman
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Travel Meetups Moderation */}
        <div className="rounded-3xl shadow-sm bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-200/90 dark:border-white/10">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-400" />
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Agenda Travel Meetups</h2>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">{meetups.length} agenda</span>
          </div>

          <div className="space-y-3">
            {meetups.map((m) => (
              <div
                key={m.id}
                className="p-3.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/90 dark:border-white/10/80 flex items-start justify-between gap-3 hover:border-slate-700 transition"
              >
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-gray-900 dark:text-gray-900 dark:text-white line-clamp-1">{m.title}</h3>
                  <div className="flex items-center gap-3 text-[10px] text-gray-500 dark:text-gray-400">
                    <span>{m.current_member_count} traveler bergabung</span>
                    <span>•</span>
                    <span>Status: {m.status || 'Aktif'}</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-500/10 text-teal-400 shrink-0">
                  Terkurasi
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
