'use client';

import React, { useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { resolveExperienceImageUrl } from '@/lib/utils/media';

interface ExperienceLightboxModalProps {
  images: string[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
  title?: string;
  locale?: string;
}

export function ExperienceLightboxModal({
  images,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
  title,
  locale = 'id',
}: ExperienceLightboxModalProps) {
  const isId = locale === 'id';
  const touchStartXRef = useRef<number | null>(null);

  const total = images.length;
  const currentImage = images[currentIndex];

  const handlePrev = useCallback(() => {
    if (total <= 1) return;
    onNavigate((currentIndex - 1 + total) % total);
  }, [currentIndex, total, onNavigate]);

  const handleNext = useCallback(() => {
    if (total <= 1) return;
    onNavigate((currentIndex + 1) % total);
  }, [currentIndex, total, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Prevent background scrolling
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose, handlePrev, handleNext]);

  // Touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartXRef.current - touchEndX;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartXRef.current = null;
  };

  if (!isOpen || total === 0) return null;

  const resolvedUrl = resolveExperienceImageUrl(currentImage);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isId ? 'Galeri Foto Pengalaman' : 'Experience Photo Gallery'}
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Top Bar: Title, Counter & Close Button */}
      <div
        className="w-full flex items-center justify-between px-4 sm:px-6 py-4 text-white/90 border-b border-white/10 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 min-w-0 pr-4">
          <ImageIcon className="w-5 h-5 text-orange-400 shrink-0" />
          <div className="min-w-0">
            {title && (
              <p className="text-xs sm:text-sm font-semibold truncate max-w-xs sm:max-w-md text-white/90">
                {title}
              </p>
            )}
            <p className="text-[11px] sm:text-xs text-white/60">
              {isId ? `Foto ${currentIndex + 1} dari ${total}` : `Photo ${currentIndex + 1} of ${total}`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label={isId ? 'Tutup Galeri' : 'Close Gallery'}
          className="p-2 sm:px-3 sm:py-1.5 rounded-full sm:rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs sm:text-sm transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <X className="w-4 h-4" />
          <span className="hidden sm:inline">{isId ? 'Tutup (Esc)' : 'Close (Esc)'}</span>
        </button>
      </div>

      {/* Main Image Stage */}
      <div
        className="relative flex-1 flex items-center justify-center p-4 sm:p-8 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Previous Button */}
        {total > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            aria-label={isId ? 'Foto Sebelumnya' : 'Previous Photo'}
            className="absolute left-3 sm:left-6 z-20 p-2 sm:p-3 rounded-full bg-black/50 hover:bg-black/75 text-white/90 hover:text-white transition-all backdrop-blur-sm border border-white/10 active:scale-95 cursor-pointer shadow-lg"
          >
            <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
        )}

        {/* Active Image */}
        <div className="relative max-w-6xl max-h-[75vh] sm:max-h-[80vh] flex items-center justify-center">
          <img
            key={resolvedUrl}
            src={resolvedUrl}
            alt={title ? `${title} - Foto ${currentIndex + 1}` : `Photo ${currentIndex + 1}`}
            className="max-h-[72vh] sm:max-h-[78vh] max-w-full rounded-xl sm:rounded-2xl object-contain shadow-2xl transition-all duration-300"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/images/placeholder-experience.jpg';
            }}
          />
        </div>

        {/* Next Button */}
        {total > 1 && (
          <button
            type="button"
            onClick={handleNext}
            aria-label={isId ? 'Foto Berikutnya' : 'Next Photo'}
            className="absolute right-3 sm:right-6 z-20 p-2 sm:p-3 rounded-full bg-black/50 hover:bg-black/75 text-white/90 hover:text-white transition-all backdrop-blur-sm border border-white/10 active:scale-95 cursor-pointer shadow-lg"
          >
            <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
        )}
      </div>

      {/* Bottom Thumbnail Strip */}
      {total > 1 && (
        <div
          className="w-full px-4 sm:px-6 py-3 border-t border-white/10 overflow-x-auto flex items-center justify-center gap-2 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((img, idx) => {
            const thumbUrl = resolveExperienceImageUrl(img);
            const isSelected = idx === currentIndex;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onNavigate(idx)}
                className={`relative w-12 h-9 sm:w-16 sm:h-12 rounded-lg overflow-hidden shrink-0 transition-all cursor-pointer ${
                  isSelected
                    ? 'ring-2 ring-orange-500 scale-105 opacity-100'
                    : 'opacity-40 hover:opacity-80'
                }`}
              >
                <img
                  src={thumbUrl}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/images/placeholder-experience.jpg';
                  }}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
