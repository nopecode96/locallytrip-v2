'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

import { UserAvatar } from '@/components/common/UserAvatar';

export interface UserPersonaLinkProps {
  user: {
    id?: string | number;
    name?: string | null;
    username?: string | null;
    avatar_url?: string | null;
    avatarUrl?: string | null;
    image?: string | null;
  };
  locale: string;
  variant?: 'avatar-only' | 'name-only' | 'full' | 'card';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  subtitle?: React.ReactNode;
}

export function UserPersonaLink({
  user,
  locale,
  variant = 'full',
  size = 'sm',
  className = '',
  subtitle,
}: UserPersonaLinkProps) {
  const profileIdentifier = user.username || user.id;
  if (!profileIdentifier) return null;

  const profileHref = `/${locale}/users/${profileIdentifier}`;
  const rawAvatar = user.avatar_url || user.avatarUrl || user.image;
  const displayName = user.name || (locale === 'id' ? 'Pengguna' : 'User');

  const avatarImgSize = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 56,
  };

  return (
    <Link
      href={profileHref}
      onClick={(e) => e.stopPropagation()} // Mencegah klik tembus jika di dalam parent card
      className={`inline-flex items-center gap-2.5 group hover:opacity-90 transition-opacity cursor-pointer ${className}`}
    >
      {(variant === 'avatar-only' || variant === 'full' || variant === 'card') && (
        <UserAvatar
          src={rawAvatar}
          name={displayName}
          size={avatarImgSize[size]}
          className="ring-2 ring-transparent group-hover:ring-purple-400 transition-all shrink-0"
        />
      )}

      {(variant === 'name-only' || variant === 'full' || variant === 'card') && (
        <div className="min-w-0 text-left">
          <span className="block font-semibold text-slate-800 text-xs sm:text-sm group-hover:text-purple-700 transition-colors truncate">
            {displayName}
          </span>
          {subtitle && (
            <span className="block text-[11px] text-slate-500 truncate">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
