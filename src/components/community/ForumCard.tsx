'use client';

import React from 'react';
import Link from 'next/link';
import { Pin, Lock, MessageCircle, Eye, ShieldCheck, MapPin } from 'lucide-react';
import { Locale } from '@/lib/i18n';
import { extractPlainTextSnippet } from '@/lib/sanitize';
import { resolveForumImageUrl } from '@/lib/utils/media';
import { UserPersonaLink } from '@/components/common/UserPersonaLink';

export interface ForumThreadCardItem {
  id: number;
  category_id?: number;
  author_id?: number;
  title: string;
  slug: string;
  content: string;
  is_pinned?: boolean | null;
  is_locked?: boolean | null;
  is_featured?: boolean | null;
  view_count?: number | null;
  reply_count?: number | null;
  like_count?: number | null;
  dislike_count?: number | null;
  net_votes?: number;
  created_at: string | Date | null;
  images?: any;
  category?: {
    id: number;
    name: string;
    slug?: string;
    icon?: string | null;
  } | null;
  vibes_forum_categories?: {
    id: number;
    name: string;
    slug?: string;
    icon?: string | null;
  } | null;
  author: {
    id: number;
    name: string | null;
    username: string | null;
    avatar_url: string | null;
    role?: string | null;
    is_verified?: boolean | null;
    level?: number;
    user_xp?: {
      current_level: number;
      total_xp: number;
    } | null;
    cityName?: string | null;
    cities?: {
      id: number;
      name: string;
    } | null;
    host_kyc?: {
      status: string | null;
    } | null;
    host_kyc_status?: string | null;
  };
  city?: {
    id: number;
    name: string;
  } | null;
  _count?: {
    vibes_forum_posts?: number;
    comments?: number;
  };
}

interface ForumCardProps {
  thread: ForumThreadCardItem;
  locale: Locale;
}

export function ForumCard({ thread, locale }: ForumCardProps) {
  const isId = locale === 'id';
  const author = thread.author;

  // Aturan Ketat KYC: HANYA muncul jika role === 'HOST' dan host_kyc.status === 'approved'
  const isHost = author.role?.toUpperCase() === 'HOST';
  const isKycApproved =
    author.host_kyc_status === 'approved' ||
    author.host_kyc?.status === 'approved';
  const showKycBadge = isHost && isKycApproved;

  const categoryName =
    thread.category?.name ||
    thread.vibes_forum_categories?.name ||
    (isId ? 'Umum' : 'General');

  const cityName =
    thread.city?.name ||
    author.cities?.name ||
    author.cityName ||
    (isId ? 'Global' : 'Global');

  // Waktu relatif pembuatan
  const getRelativeTime = (dateInput: string | Date | null) => {
    if (!dateInput) return '';
    try {
      const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
      const diffMs = Date.now() - date.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMinutes < 1) return isId ? 'Baru saja' : 'Just now';
      if (diffMinutes < 60) return isId ? `${diffMinutes} mnt lalu` : `${diffMinutes}m ago`;
      if (diffHours < 24) return isId ? `${diffHours} jam lalu` : `${diffHours}h ago`;
      if (diffDays === 1) return isId ? 'Kemarin' : 'Yesterday';
      if (diffDays < 30) return isId ? `${diffDays} hari lalu` : `${diffDays}d ago`;

      return date.toLocaleDateString(isId ? 'id-ID' : 'en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  // Ekstrak lampiran gambar pertama jika ada
  let firstImage: string | null = null;
  if (Array.isArray(thread.images) && thread.images.length > 0 && typeof thread.images[0] === 'string') {
    firstImage = thread.images[0];
  } else if (typeof thread.images === 'string' && thread.images.trim()) {
    try {
      const parsed = JSON.parse(thread.images);
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
        firstImage = parsed[0];
      } else {
        firstImage = thread.images;
      }
    } catch {
      firstImage = thread.images;
    }
  }

  const threadUrl = `/${locale}/community/forums/${thread.slug || thread.id}`;
  const netVotes =
    typeof thread.net_votes === 'number'
      ? thread.net_votes
      : (thread.like_count || 0) - (thread.dislike_count || 0);

  const replyCount =
    thread._count?.vibes_forum_posts ??
    thread._count?.comments ??
    thread.reply_count ??
    0;

  const viewCount = thread.view_count || 0;
  const userLevel = author.level || author.user_xp?.current_level || 1;

  return (
    <article className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:border-purple-300 hover:shadow-md transition-all duration-200 space-y-3.5 group">
      {/* 1. Badge Bar Atas: Kategori, Kota, Tanggal Relatif, Pinned, Locked */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        {thread.is_pinned && (
          <span className="inline-flex items-center gap-1 font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
            <Pin className="w-3 h-3 text-amber-600 fill-amber-600" />
            <span>{isId ? 'Tersemat' : 'Pinned'}</span>
          </span>
        )}

        <span className="font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
          {categoryName}
        </span>

        <span>•</span>
        <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
          <MapPin className="w-3 h-3 text-purple-600 shrink-0" />
          <span>{cityName}</span>
        </span>

        <span>•</span>
        <span className="text-slate-400">{getRelativeTime(thread.created_at)}</span>

        {thread.is_locked && (
          <>
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-slate-400 font-medium">
              <Lock className="w-3 h-3" />
              <span>{isId ? 'Terkunci' : 'Locked'}</span>
            </span>
          </>
        )}
      </div>

      {/* 2. Judul Thread, Cuplikan Teks, & Lampiran Gambar 16:10 */}
      <Link href={threadUrl} className="block group/link focus:outline-none">
        <div className="flex flex-col sm:flex-row gap-4 items-start justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-base sm:text-lg font-serif font-bold text-slate-900 group-hover/link:text-purple-700 transition-colors line-clamp-2 mb-2 leading-snug">
              {thread.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed font-normal">
              {extractPlainTextSnippet(thread.content, 160)}
            </p>
          </div>

          {/* Lampiran Gambar 16:10 jika ada */}
          {firstImage && (
            <div className="relative w-full sm:w-36 aspect-[16/10] sm:aspect-auto sm:h-24 rounded-2xl overflow-hidden bg-slate-900 shrink-0 border border-slate-200">
              <img
                src={resolveForumImageUrl(firstImage)}
                alt={thread.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover/link:scale-105 transition-transform duration-300 ease-out"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src !== '/images/default-forum-cover.jpg') {
                    target.src = '/images/default-forum-cover.jpg';
                  }
                }}
              />
            </div>
          )}
        </div>
      </Link>

      {/* 3. Baris Bawah: Footer Persona & Metrik Interaksi */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
        {/* Byline Pembuat menggunakan UserPersonaLink dengan e.stopPropagation() */}
        <div onClick={(e) => e.stopPropagation()} className="min-w-0">
          <UserPersonaLink
            user={{
              id: author.id,
              name: author.name || author.username || (isId ? 'Pengguna' : 'User'),
              username: author.username,
              avatar_url: author.avatar_url,
            }}
            locale={locale}
            variant="full"
            size="sm"
            subtitle={
              <span className="flex items-center gap-1.5 flex-wrap">
                {showKycBadge && (
                  <span
                    title={isId ? 'Host Terverifikasi KYC' : 'KYC Verified Host'}
                    className="inline-flex items-center gap-0.5 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 font-semibold shrink-0"
                  >
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>✓ KYC</span>
                  </span>
                )}
                {isHost && !showKycBadge && (
                  <span className="text-[10px] text-purple-700 font-semibold">
                    {isId ? 'Local Host' : 'Local Host'}
                  </span>
                )}
                {!isHost && (
                  <span className="text-[10px] text-slate-500">
                    {isId ? 'Traveler' : 'Traveler'}
                  </span>
                )}
                <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200 shrink-0">
                  Lvl {userLevel}
                </span>
              </span>
            }
          />
        </div>

        {/* Metrik Interaksi di Kanan: Skor Suka, Komentar/Balasan, Tayangan */}
        <div className="flex items-center gap-3.5 text-slate-500 font-semibold shrink-0">
          <span
            className="inline-flex items-center gap-1 hover:text-emerald-700 transition-colors"
            title={isId ? 'Skor Suka' : 'Net Votes'}
          >
            <span className="text-emerald-600 font-bold">▲</span>
            <span>{netVotes}</span>
          </span>

          <Link
            href={`${threadUrl}#discussion-replies`}
            className="inline-flex items-center gap-1 hover:text-purple-700 transition-colors"
            title={isId ? 'Balasan Komentar' : 'Replies'}
          >
            <MessageCircle className="w-3.5 h-3.5 text-purple-600" />
            <span>{replyCount}</span>
          </Link>

          {viewCount > 0 && (
            <span
              className="hidden sm:inline-flex items-center gap-1 text-slate-400"
              title={isId ? 'Tayangan' : 'Views'}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{viewCount}</span>
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export default ForumCard;
