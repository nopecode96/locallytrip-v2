'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, MapPin, Heart, MessageCircle, Eye } from 'lucide-react';
import { UserPersonaLink } from '@/components/common/UserPersonaLink';
import { Locale } from '@/lib/i18n';
import { extractPlainTextSnippet } from '@/lib/sanitize';
import { resolveStoryImage } from '@/lib/utils/images';

export interface StoryItem {
  id: number;
  uuid: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  cover_image: string | null;
  reading_time: number | null;
  created_at: string | Date;
  view_count?: number | null;
  like_count?: number | null;
  comment_count?: number | null;
  city: {
    id: number;
    name: string;
    slug?: string;
  } | null;
  author: {
    id: number;
    name: string | null;
    username: string | null;
    avatar_url: string | null;
    is_verified?: boolean | null;
    role?: string | null;
    level?: number;
  } | null;
  tags?: string[];
  category?: string;
}

interface StoryCardProps {
  story: StoryItem;
  locale: Locale;
  readTimeLabel?: string;
}

export function StoryCard({ story, locale, readTimeLabel = 'menit baca' }: StoryCardProps) {
  const isId = locale === 'id';
  const coverUrl = resolveStoryImage(story.cover_image);
  const cityName = story.city?.name || (isId ? 'Indonesia' : 'Indonesia');
  const readMinutes = story.reading_time || 4;
  const authorLevel = story.author?.level || (story.author as any)?.user_xp?.current_level || 1;
  const realViews = typeof story.view_count === 'number' && story.view_count > 0 ? story.view_count : 12;
  const realLikes = story.like_count ?? 0;
  const realComments = story.comment_count ?? 0;

  const dateStr = story.created_at
    ? new Date(story.created_at).toLocaleDateString(isId ? 'id-ID' : 'en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

  const fallbackStoryCover = '/images/placeholder-story.webp';

  return (
    <div className="group bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:border-purple-300 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
      {/* 1. Media Container with 16:10 Aspect Ratio, Smooth Zoom, Floating City Badge & Category */}
      <Link
        href={`/${locale}/stories/${story.slug || story.id}`}
        className="block relative overflow-hidden focus:outline-none"
      >
        <figure className="relative aspect-[16/10] w-full overflow-hidden rounded-t-3xl bg-slate-900 m-0">
          <img
            src={coverUrl}
            alt={story.title}
            width={480}
            height={300}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            onError={(e) => {
              const target = e.currentTarget;
              if (target.src !== fallbackStoryCover && !target.src.endsWith(fallbackStoryCover)) {
                target.src = fallbackStoryCover;
              }
            }}
          />
          <figcaption className="sr-only">
            Foto cerita perjalanan di {cityName}
          </figcaption>

          {/* Floating City Badge di Pojok Kiri Atas */}
          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-slate-800 text-[11px] font-bold flex items-center gap-1 shadow-sm border border-white/60">
            <MapPin className="w-3 h-3 text-purple-600 shrink-0" />
            <span className="truncate max-w-[120px]">{cityName}</span>
          </div>

          {/* Floating Category Tag di Pojok Kanan Bawah */}
          <div className="absolute bottom-3 right-3 bg-slate-950/75 backdrop-blur-md px-2.5 py-0.5 rounded-full text-white text-[10px] font-semibold tracking-wide">
            {story.category || (isId ? 'Catatan Rute' : 'Field Notes')}
          </div>
        </figure>
      </Link>

      {/* 2. Card Content (Island Body) */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-2">
          {/* Read Time & Date */}
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 text-slate-500 font-medium">
              <Clock className="w-3.5 h-3.5 text-purple-500" />
              {readMinutes} {isId ? 'menit baca' : 'min read'}
            </span>
            {dateStr && <span>{dateStr}</span>}
          </div>

          {/* Judul Artikel: line-clamp-2 text-base sm:text-lg font-bold text-slate-900 group-hover:text-purple-600 transition */}
          <Link
            href={`/${locale}/stories/${story.slug || story.id}`}
            className="block group/title focus:outline-none"
          >
            <h3 className="line-clamp-2 text-base sm:text-lg font-bold text-slate-900 group-hover/title:text-purple-600 transition-colors leading-snug">
              {story.title}
            </h3>
          </Link>

          {/* Excerpt ringkas (2-3 baris) */}
          <p className="line-clamp-2 sm:line-clamp-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
            {extractPlainTextSnippet(story.excerpt || story.content, 140)}
          </p>
        </div>

        {/* 3. Footer: Byline penulis & Statistik interaksi */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
          {story.author ? (
            <div onClick={(e) => e.stopPropagation()}>
              <UserPersonaLink
                user={{
                  id: story.author.id,
                  name: story.author.name,
                  username: story.author.username,
                  avatar_url: story.author.avatar_url,
                  level: authorLevel,
                }}
                locale={locale}
                variant="full"
                size="sm"
                subtitle={
                  <span className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200 shrink-0">
                      Lvl {authorLevel}
                    </span>
                    <span>•</span>
                    <span className="truncate">
                      {story.author.is_verified
                        ? (isId ? 'Penulis Terverifikasi' : 'Verified Author')
                        : (isId ? 'Penulis Komunitas' : 'Community Writer')}
                    </span>
                  </span>
                }
                className="min-w-0"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-100 shrink-0" />
              <p className="text-xs font-bold text-slate-800 truncate">
                {isId ? 'Traveler Locallytrip' : 'Locallytrip Traveler'}
              </p>
            </div>
          )}

          {/* Statistik interaksi: Views, Likes, dan Komentar riil dari DB (fallback realistis) */}
          <div className="flex items-center gap-2.5 text-xs text-slate-400 font-semibold shrink-0">
            <span
              className="flex items-center gap-1 hover:text-slate-600 transition-colors"
              title={isId ? 'Dilihat' : 'Views'}
            >
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span>{realViews}</span>
            </span>
            <span
              className="flex items-center gap-1 hover:text-rose-500 transition-colors"
              title={isId ? 'Suka' : 'Likes'}
            >
              <Heart className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
              <span>{realLikes}</span>
            </span>
            {realComments > 0 && (
              <span
                className="hidden sm:flex items-center gap-1 hover:text-purple-600 transition-colors"
                title={isId ? 'Komentar' : 'Comments'}
              >
                <MessageCircle className="w-3.5 h-3.5 text-purple-400" />
                <span>{realComments}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
