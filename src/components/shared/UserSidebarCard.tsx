'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FollowButton } from '@/components/shared/FollowButton';
import { UserAvatar } from '@/components/common/UserAvatar';

export interface UserSidebarCardUser {
  id: number;
  name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  role?: string | null;
  is_verified?: boolean | null;
  level?: number;
  total_xp?: number;
  bio?: string | null;
  host_kyc?: { status: string } | null;
  host_kyc_host_kyc_user_idTousers?: { status: string } | null;
  is_kyc_verified?: boolean;
}

export interface UserSidebarCardProps {
  user: UserSidebarCardUser;
  lang?: string;
  initialIsFollowing?: boolean;
  currentUserId?: number | null;
  className?: string;
  subtitleExtra?: React.ReactNode;
}

export function UserSidebarCard({
  user,
  lang = 'id',
  initialIsFollowing = false,
  currentUserId,
  className = '',
  subtitleExtra,
}: UserSidebarCardProps) {
  const isId = lang === 'id';

  // 1. Aturan Validasi Badge KYC: HANYA untuk role 'host' dan host_kyc berstatus 'approved'
  const isKycApproved =
    user.role === 'host' &&
    (user.host_kyc?.status === 'approved' ||
      user.host_kyc_host_kyc_user_idTousers?.status === 'approved' ||
      user.is_kyc_verified === true);

  const profileUrl = `/${lang}/users/${user.username || user.id}`;
  const isOwnAccount = Boolean(currentUserId && currentUserId === user.id);
  const displayName = user.name || user.username || (isId ? 'Penjelajah' : 'Traveler');
  const displayUsername =
    user.username || user.name?.toLowerCase().replace(/\s+/g, '') || 'traveler';
  const level = user.level || 1;
  const totalXp = user.total_xp || 0;

  return (
    <div className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-xs ${className}`}>
      <div className="flex items-center gap-4 mb-4">
        <Link
          href={profileUrl}
          className="shrink-0 hover:ring-2 hover:ring-purple-400 rounded-full transition-all cursor-pointer"
        >
          <UserAvatar
            src={user.avatar_url}
            name={displayName}
            size={56}
            className="border-2 border-purple-100"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link
              href={profileUrl}
              className="font-bold text-slate-900 text-sm truncate hover:text-purple-700 transition-colors cursor-pointer"
            >
              {displayName}
            </Link>
            {isKycApproved && (
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                ✓ KYC
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 truncate">
            @{displayUsername}
            {subtitleExtra && <span className="ml-1">{subtitleExtra}</span>}
          </p>

          {/* 2. Tampilkan Level & Total XP riil dari database */}
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md">
              👑 LV {level}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              ⭐ {totalXp.toLocaleString()} XP
            </span>
          </div>
        </div>
      </div>

      {user.bio && (
        <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
          {user.bio}
        </p>
      )}

      {/* 3. Tombol Aksi: Follow Button & Detail Profil */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
        {isOwnAccount ? (
          <span className="w-full py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 text-xs font-medium text-center flex items-center justify-center">
            {isId ? 'Profil Anda' : 'Your Profile'}
          </span>
        ) : user.id ? (
          <FollowButton
            targetUserId={user.id}
            initialIsFollowing={initialIsFollowing}
            lang={lang}
            targetUserName={displayName}
            variant="compact"
            className="w-full py-2 px-3 text-xs"
          />
        ) : null}
        <Link
          href={profileUrl}
          className="w-full py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all text-center flex items-center justify-center cursor-pointer"
        >
          {isId ? 'Detail Profil' : 'View Profile'}
        </Link>
      </div>
    </div>
  );
}
