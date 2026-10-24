'use client';

import React, { useState } from 'react';
import { getPublicImageUrl } from '@/lib/images';

/**
 * Memastikan setiap path gambar lokal diawali dengan '/'
 * dan mendukung URL eksternal (http/https).
 */
export function normalizeImageUrl(url?: any): string | null {
  if (!url) return null;
  return getPublicImageUrl(url, 'experiences');
}

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  secondaryFallbackSrc?: string;
}

export function SafeImage({
  src,
  alt = '',
  fallbackSrc = '/images/placeholders/story-default.jpg',
  secondaryFallbackSrc = '/images/placeholders/story-default.jpg',
  className = '',
  ...props
}: SafeImageProps) {
  const normSrc = normalizeImageUrl(src) || normalizeImageUrl(fallbackSrc) || '/images/placeholders/story-default.jpg';
  const normFallback = normalizeImageUrl(fallbackSrc) || '/images/placeholders/story-default.jpg';
  const normSecondaryFallback = normalizeImageUrl(secondaryFallbackSrc) || '/images/placeholders/story-default.jpg';

  const [currentSrc, setCurrentSrc] = useState<string>(normSrc);
  const [hasFailedOnce, setHasFailedOnce] = useState(false);

  React.useEffect(() => {
    const valid = normalizeImageUrl(src) || normFallback;
    setCurrentSrc(valid);
    setHasFailedOnce(false);
  }, [src, normFallback]);

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
