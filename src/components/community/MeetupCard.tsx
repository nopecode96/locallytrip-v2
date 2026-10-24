'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Users, Clock, ArrowRight, ShieldCheck } from 'lucide-react';
import { Locale } from '@/lib/i18n';
import { resolveMeetupDisplayImage } from '@/lib/utils/images';
import { UserPersonaLink } from '@/components/common/UserPersonaLink';
import { UserAvatar } from '@/components/common/UserAvatar';

export interface MeetupCardItem {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  start_date: string;
  end_date: string;
  duration_days: number | null;
  current_member_count: number;
  max_members?: number | null;
  max_participants?: number | null;
  join_type: string;
  images: any;
  created_at?: string | null;
  category?: {
    id: number;
    name: string;
    icon?: string | null;
    color?: string | null;
  } | null;
  cities?: {
    id: number;
    name: string;
    image_url?: string | null;
  } | null;
  city?: {
    id: number;
    name: string;
    image_url?: string | null;
    countryName?: string;
    countryCode?: string;
  } | null;
  creator?: {
    id: number;
    name: string | null;
    username?: string | null;
    avatar?: string | null;
    avatar_url?: string | null;
    is_verified?: boolean | null;
    role?: string | null;
  } | null;
  members?: Array<{
    user_id: number;
    name: string | null;
    avatar: string | null;
  }>;
  _count?: {
    vibes_travel_meetup_members: number;
  };
}

interface MeetupCardProps {
  meetup: MeetupCardItem;
  locale: Locale;
}

export function MeetupCard({ meetup, locale }: MeetupCardProps) {
  const isId = locale === 'id';
  const cityName = meetup.cities?.name || meetup.city?.name || 'Indonesia';
  const cityPhoto = meetup.cities?.image_url || meetup.city?.image_url;
  const coverSrc = resolveMeetupDisplayImage(meetup.images, cityPhoto);

  const startDate = new Date(meetup.start_date);
  const dateFormatted = !isNaN(startDate.getTime())
    ? startDate.toLocaleDateString(isId ? 'id-ID' : 'en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

  const maxSlots = meetup.max_participants || meetup.max_members;
  const memberCount =
    meetup._count?.vibes_travel_meetup_members ?? meetup.current_member_count ?? 1;
  const isFull = maxSlots ? memberCount >= maxSlots : false;

  const meetupHref = `/${locale}/community/meetups/${meetup.slug || meetup.id}`;

  return (
    <article className="group bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:border-purple-300 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
      {/* 1. Thumbnail Cover Foto dengan Smart Fallback Kota & Floating Badges */}
      <Link href={meetupHref} className="block relative focus:outline-none">
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-t-3xl bg-slate-900">
          <img
            src={coverSrc}
            alt={meetup.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            onError={(e) => {
              const target = e.currentTarget;
              if (target.src !== '/images/placeholder-meetup.webp' && !target.src.endsWith('/images/placeholder-meetup.webp')) {
                target.src = '/images/placeholder-meetup.webp';
              }
            }}
          />

          {/* Overlay Gradien Lembut */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />

          {/* Floating Badge Nama Kota di Pojok Kiri Atas */}
          {cityName && (
            <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-900/75 backdrop-blur-md text-white text-xs font-semibold shadow-sm border border-white/20 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-purple-400 shrink-0" />
              <span className="truncate max-w-[130px]">{cityName}</span>
            </span>
          )}

          {/* Floating Badge Sisa Kuota Slot di Pojok Kanan Atas */}
          <span
            className={`absolute top-3 right-3 px-3 py-1 rounded-full backdrop-blur-md text-xs font-semibold shadow-xs border ${
              isFull
                ? 'bg-rose-50/90 text-rose-700 border-rose-200'
                : 'bg-white/95 text-purple-900 border-white/60'
            }`}
          >
            {isFull
              ? (isId ? '🔒 Slot Penuh' : '🔒 Full')
              : maxSlots
              ? `🎟️ ${memberCount}/${maxSlots} ${isId ? 'Peserta' : 'Spots'}`
              : (isId ? '🎟️ Terbuka' : '🎟️ Open')}
          </span>

          {/* Floating Category/Theme di Pojok Kiri Bawah */}
          {meetup.category && (
            <div className="absolute bottom-3 left-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-950/70 backdrop-blur-md text-white text-[11px] font-medium border border-white/10">
                <span>{meetup.category.icon || '🧭'}</span>
                <span className="truncate max-w-[140px]">{meetup.category.name}</span>
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* 2. Body Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2.5">
          {/* Tanggal & Durasi */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5 font-medium text-purple-800">
              <Calendar className="w-3.5 h-3.5 text-purple-600" />
              <span>{dateFormatted}</span>
            </span>
            {meetup.duration_days && meetup.duration_days > 1 && (
              <span className="inline-flex items-center gap-1 text-slate-400 text-[11px]">
                <Clock className="w-3 h-3" />
                <span>{meetup.duration_days} {isId ? 'hari' : 'days'}</span>
              </span>
            )}
          </div>

          {/* Judul Meetup */}
          <Link href={meetupHref} className="block group/link focus:outline-none">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover/link:text-purple-700 transition font-serif line-clamp-2 leading-snug">
              {meetup.title}
            </h3>
          </Link>

          {/* Deskripsi Singkat */}
          {meetup.description && (
            <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
              {meetup.description}
            </p>
          )}
        </div>

        {/* 3. Footer: Inisiator Host (UserPersonaLink) & Member Count */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
          {/* Info Inisiator Host dengan e.stopPropagation() */}
          <div onClick={(e) => e.stopPropagation()} className="min-w-0">
            {meetup.creator ? (
              <UserPersonaLink
                user={{
                  id: meetup.creator.id,
                  name: meetup.creator.name || (isId ? 'Host Komunitas' : 'Community Host'),
                  username: meetup.creator.username,
                  avatar_url: meetup.creator.avatar_url || meetup.creator.avatar,
                }}
                locale={locale}
                variant="full"
                size="sm"
                subtitle={
                  <span className="flex items-center gap-1 text-[10px] text-slate-400">
                    <span>{isId ? 'Inisiator' : 'Host'}</span>
                    {meetup.creator.is_verified && (
                      <ShieldCheck className="w-3 h-3 text-emerald-600 inline shrink-0" />
                    )}
                  </span>
                }
              />
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-slate-100 shrink-0" />
                <span className="text-xs font-semibold text-slate-800 truncate">
                  {isId ? 'Host Komunitas' : 'Community Host'}
                </span>
              </div>
            )}
          </div>

          {/* Facepile / Member Counter */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 shrink-0">
            <Users className="w-3.5 h-3.5 text-purple-600" />
            <span>{memberCount}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

export default MeetupCard;
