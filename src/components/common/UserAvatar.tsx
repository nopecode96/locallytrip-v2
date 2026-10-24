'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { resolveAvatarUrl } from '@/lib/utils/media';

export interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: number; // ukuran pixel (default: 40)
  className?: string;
  priority?: boolean;
}

export function UserAvatar({
  src,
  name,
  size = 40,
  className = '',
  priority = false,
}: UserAvatarProps) {
  const [imgSrc, setImgSrc] = useState<string>(() => resolveAvatarUrl(src));
  const fallbackAvatar = '/images/default-avatar.png';

  // Synchronize internal state jika prop src berubah
  React.useEffect(() => {
    setImgSrc(resolveAvatarUrl(src));
  }, [src]);

  const altText = name ? `${name}'s Avatar` : 'User Avatar';

  return (
    <div
      className={`relative rounded-full overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-200/80 ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={imgSrc}
        alt={altText}
        fill
        sizes={`${size}px`}
        className="object-cover"
        priority={priority}
        onError={() => {
          if (imgSrc !== fallbackAvatar) {
            setImgSrc(fallbackAvatar);
          }
        }}
      />
    </div>
  );
}
