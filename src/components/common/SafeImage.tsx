'use client';

import React, { useState } from 'react';
import { getPublicImageUrl, ImageCategory } from '@/lib/images';
import { resolveAvatarUrl } from '@/lib/avatar';

/**
 * Memastikan setiap path gambar lokal diawali dengan '/'
 * dan mendukung URL eksternal (http/https).
 */
export function normalizeImageUrl(url?: any, category: ImageCategory = 'experiences'): string | null {
  if (!url) return null;
  if (category === 'users' || category === 'avatars') {
    return resolveAvatarUrl(url);
  }
  return getPublicImageUrl(url, category);
}

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  category?: ImageCategory;
  fallbackSrc?: string;
  secondaryFallbackSrc?: string;
}

export function SafeImage({
  src,
  alt = '',
  category = 'experiences',
  fallbackSrc,
  secondaryFallbackSrc,
  className = '',
  ...props
}: SafeImageProps) {
  const isAvatar = category === 'users' || category === 'avatars';
  const defaultFallback = isAvatar
    ? '/images/default-avatar.png'
    : '/images/placeholders/story-default.jpg';

  const chosenFallback = fallbackSrc || defaultFallback;
  const chosenSecondaryFallback = secondaryFallbackSrc || defaultFallback;

  const normSrc =
    normalizeImageUrl(src, category) ||
    normalizeImageUrl(chosenFallback, category) ||
    defaultFallback;

  const normFallback =
    normalizeImageUrl(chosenFallback, category) || defaultFallback;

  const normSecondaryFallback =
    normalizeImageUrl(chosenSecondaryFallback, category) || defaultFallback;

  const [currentSrc, setCurrentSrc] = useState<string>(normSrc);
  const [hasFailedOnce, setHasFailedOnce] = useState(false);

  React.useEffect(() => {
    const valid = normalizeImageUrl(src, category) || normFallback;
    setCurrentSrc(valid);
    setHasFailedOnce(false);
  }, [src, category, normFallback]);

  return (
    <img
      {...props}
      src={currentSrc}
      alt={alt}
      className={className}
      onError={() => {
        if (!hasFailedOnce && normFallback && currentSrc !== normFallback) {
          setHasFailedOnce(true);
          setCurrentSrc(normFallback);
        } else if (currentSrc !== normSecondaryFallback) {
          setCurrentSrc(normSecondaryFallback);
        }
      }}
    />
  );
}

export default SafeImage;
