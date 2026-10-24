'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface PhotoGalleryLightboxProps {
  images: string[];
  title: string;
  lang?: string;
}

function getImgSrc(img: string): string {
  if (!img) return '/images/default.jpg';
  if (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('/')) {
    return img;
  }
  return `/images/experiences/${img}`;
}

export function PhotoGalleryLightbox({ images, title, lang = 'id' }: PhotoGalleryLightboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  // Fallback jika array kosong
  const photoList = images.length > 0 ? images : ['default.jpg'];
  const totalPhotos = photoList.length;

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setIsZoomed(false);
    setIsOpen(true);
  };

  const closeLightbox = () => {
    setIsOpen(false);
    setIsZoomed(false);
  };

  const nextPhoto = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % photoList.length);
    setIsZoomed(false);
  }, [photoList.length]);

  const prevPhoto = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + photoList.length) % photoList.length);
    setIsZoomed(false);
  }, [photoList.length]);

  // Keyboard navigation (Escape, ArrowLeft, ArrowRight)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextPhoto();
      if (e.key === 'ArrowLeft') prevPhoto();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, nextPhoto, prevPhoto]);

  // Lock scroll background saat modal terbuka
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const renderGalleryLayout = () => {
    // 1 Gambar: Penuh lebar aspect ratio
    if (totalPhotos === 1) {
      return (
        <div
          onClick={() => openLightbox(0)}
          className="relative w-full h-[380px] sm:h-[440px] rounded-3xl overflow-hidden bg-slate-100 cursor-pointer group shadow-xs"
        >
          <Image
            src={getImgSrc(photoList[0])}
            alt={title}
            fill
            priority
            sizes="100vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <span className="px-4 py-2 rounded-full bg-white/90 backdrop-blur-md text-xs font-bold text-slate-800 flex items-center gap-1.5 shadow-md">
              <Maximize2 className="w-3.5 h-3.5" />
              {lang === 'id' ? 'Lihat Foto Penuh' : 'View Full Photo'}
            </span>
          </div>
        </div>
      );
    }

    // 2 Gambar: Split Grid 2 Kolom Sejajar (50:50)
    if (totalPhotos === 2) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 rounded-3xl overflow-hidden h-[380px] sm:h-[440px]">
          {photoList.map((img, idx) => (
            <div
              key={idx}
              onClick={() => openLightbox(idx)}
              className="relative h-full overflow-hidden rounded-2xl cursor-pointer group bg-slate-100"
            >
              <Image
                src={getImgSrc(img)}
                alt={`${title} - Foto ${idx + 1}`}
                fill
                priority={idx === 0}
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            </div>
          ))}
        </div>
      );
    }

    // >= 3 Gambar (Berlaku untuk 3, 4, maupun 5+ gambar):
    // Selalu gunakan 3 kolom sejajar ke kanan tanpa tumpukan vertikal
    return (
      <div className="relative grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 rounded-3xl overflow-hidden h-[380px] sm:h-[440px]">
        {/* Kolom 1 */}
        <div
          onClick={() => openLightbox(0)}
          className="relative h-full overflow-hidden rounded-2xl cursor-pointer group bg-slate-100"
        >
          <Image
            src={getImgSrc(photoList[0])}
            alt={`${title} - Foto 1`}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
        </div>

        {/* Kolom 2 */}
        <div
          onClick={() => openLightbox(1)}
          className="relative h-full overflow-hidden rounded-2xl cursor-pointer group bg-slate-100"
        >
          <Image
            src={getImgSrc(photoList[1])}
            alt={`${title} - Foto 2`}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
        </div>

        {/* Kolom 3 */}
        <div
          onClick={() => openLightbox(2)}
          className="relative h-full overflow-hidden rounded-2xl cursor-pointer group bg-slate-100"
        >
          <Image
            src={getImgSrc(photoList[2])}
            alt={`${title} - Foto 3`}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />

          {/* Tombol Mengambang jika total gambar > 3 */}
          {totalPhotos > 3 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openLightbox(0);
              }}
              className="absolute bottom-4 right-4 z-10 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/95 hover:bg-white text-slate-900 text-xs font-semibold shadow-lg backdrop-blur-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span>📷</span>
              <span>
                {lang === 'id'
                  ? `Lihat Semua ${totalPhotos} Foto`
                  : `Show All ${totalPhotos} Photos`}
              </span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <section className="relative w-full">
        {renderGalleryLayout()}
      </section>

      {/* ========================================================= */}
      {/* MODAL LIGHTBOX FULLSCREEN (Seluruh Foto Dimuat)           */}
      {/* ========================================================= */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-200 select-none"
        >
          {/* Top Bar: Counter & Controls */}
          <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between text-white">
            <span className="text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
              {currentIndex + 1} / {photoList.length} {lang === 'id' ? 'Foto' : 'Photos'}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsZoomed((prev) => !prev)}
                className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition text-white cursor-pointer"
                title={isZoomed ? 'Zoom Out' : 'Zoom In'}
              >
                {isZoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
              </button>
              <button
                type="button"
                onClick={closeLightbox}
                className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition text-white cursor-pointer"
                title={lang === 'id' ? 'Tutup (Esc)' : 'Close (Esc)'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Previous */}
          {photoList.length > 1 && (
            <button
              type="button"
              onClick={prevPhoto}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition active:scale-95 cursor-pointer"
              title="Foto Sebelumnya (←)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Active Image View */}
          <div
            className={`relative max-w-5xl max-h-[85vh] w-full h-full flex items-center justify-center p-4 transition-all duration-300 ${
              isZoomed ? 'scale-125 cursor-zoom-out' : 'cursor-zoom-in'
            }`}
            onClick={() => setIsZoomed((prev) => !prev)}
          >
            <img
              src={getImgSrc(photoList[currentIndex])}
              alt={`${title} - Foto ${currentIndex + 1}`}
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl transition-transform duration-300"
            />
          </div>

          {/* Navigation Next */}
          {photoList.length > 1 && (
            <button
              type="button"
              onClick={nextPhoto}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition active:scale-95 cursor-pointer"
              title="Foto Selanjutnya (→)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Bottom Thumbnails Strip */}
          {photoList.length > 1 && (
            <div className="absolute bottom-4 left-4 right-4 z-20 flex justify-center">
              <div className="flex items-center gap-2 overflow-x-auto max-w-2xl px-3 py-2 rounded-2xl bg-black/40 backdrop-blur-md scrollbar-none">
                {photoList.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setCurrentIndex(i);
                      setIsZoomed(false);
                    }}
                    className={`relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                      currentIndex === i
                        ? 'border-violet-500 scale-105 shadow-md'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={getImgSrc(img)}
                      alt={`Thumb ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
