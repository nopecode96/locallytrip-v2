'use client';

import React from 'react';
import Link from 'next/link';
import { Users, ChevronRight, Calendar } from 'lucide-react';

export interface SidebarMeetupItem {
  id: number;
  title: string;
  slug: string;
  start_date: string;
  end_date?: string | null;
  max_members?: number | null;
  current_member_count?: number;
  cityName?: string | null;
}

interface SidebarUpcomingMeetupsProps {
  meetups: SidebarMeetupItem[];
  lang: string;
}

export function SidebarUpcomingMeetups({ meetups, lang }: SidebarUpcomingMeetupsProps) {
  const isId = lang === 'id';

  if (!meetups || meetups.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
        <h3 className="font-serif font-bold text-slate-900 text-sm flex items-center gap-2">
          <span>🎒</span>
          <span>{isId ? 'Meetup Terdekat' : 'Upcoming Meetups'}</span>
        </h3>
        <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
          Komunitas
        </span>
      </div>

      {/* List Meetups */}
      <div className="space-y-3">
        {meetups.map((meetup) => {
          const dateObj = new Date(meetup.start_date);
          const day = dateObj.toLocaleDateString(isId ? 'id-ID' : 'en-US', { day: 'numeric' });
          const month = dateObj.toLocaleDateString(isId ? 'id-ID' : 'en-US', { month: 'short' });

          const memberCount = meetup.current_member_count ?? 1;
          const maxSlots = meetup.max_members;

          return (
            <Link
              key={meetup.id}
              href={`/${lang}/community/meetups/${meetup.slug || meetup.id}`}
              className="flex items-start gap-3 p-2.5 rounded-2xl hover:bg-purple-50/60 transition group"
            >
              {/* Badge Kalender Kecil */}
              <div className="flex flex-col items-center justify-center w-11 h-11 rounded-2xl bg-purple-50 border border-purple-100 text-purple-900 shrink-0 font-medium group-hover:bg-purple-900 group-hover:text-white transition">
                <span className="text-[10px] uppercase font-bold tracking-tight leading-none text-purple-600 group-hover:text-purple-200">
                  {month}
                </span>
                <span className="text-sm font-bold leading-tight mt-0.5">
                  {day}
                </span>
              </div>

              {/* Info Meetup */}
              <div className="min-w-0 flex-1 space-y-1">
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-purple-900 transition-colors line-clamp-1 leading-snug">
                  {meetup.title}
                </h4>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="truncate">📍 {meetup.cityName || (isId ? 'Indonesia' : 'Indonesia')}</span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 shrink-0 text-slate-400">
                    <Users className="w-3 h-3 text-purple-600" />
                    <span>
                      {memberCount}{maxSlots ? `/${maxSlots}` : ''}
                    </span>
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-slate-100">
        <Link
          href={`/${lang}/community/meetups`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-purple-900 hover:text-purple-950 transition"
        >
          <span>{isId ? 'Lihat Semua Meetup' : 'View All Meetups'}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
