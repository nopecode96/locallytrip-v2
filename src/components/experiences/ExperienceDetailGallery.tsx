'use client';

import React, { useState } from 'react';
import { Camera, Image as ImageIcon } from 'lucide-react';
import { resolveExperienceImageUrl } from '@/lib/utils/media';
import { ExperienceLightboxModal } from './ExperienceLightboxModal';

interface ExperienceDetailGalleryProps {
  images: string[];
  title: string;
  locale?: string;
}

export function ExperienceDetailGallery({
  images,
  title,
  locale = 'id',
}: ExperienceDetailGalleryProps) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  const isId = locale === 'id';
  const cleanImages = images.length > 0 ? images : ['/images/placeholder-experience.jpg'];
  const total = cleanImages.length;

  return (
    <>
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm bg-slate-100">
        {/* ============================================================ */}
        {/* KONDISI A: 1 FOTO (Lanskap Penuh Hero)                         */}
        {/* ============================================================ */}
        {total === 1 && (
          <div
            className="w-full aspect-[16/9] sm:aspect-[21/9] relative overflow-hidden cursor-pointer group"
            onClick={() => setSelectedPhotoIndex(0)}
          >
            <GalleryImage
              src={cleanImages[0]}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            />
          </div>
        )}

        {/* ============================================================ */}
        {/* KONDISI B: 2 FOTO (Grid 2 Kolom Seimbang)                    */}
        {/* ============================================================ */}
        {total === 2 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 p-2 sm:p-3 aspect-[16/9]">
            {cleanImages.map((img, idx) => (
              <div
                key={idx}
                className="relative rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer group h-full"
                onClick={() => setSelectedPhotoIndex(idx)}
              >
                <GalleryImage
                  src={img}
                  alt={`${title} - ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                />
              </div>
            ))}
          </div>
        )}

        {/* ============================================================ */}
        {/* KONDISI C: 3 FOTO (1 Hero Kiri + 2 Bertumpuk di Kanan)        */}
        {/* ============================================================ */}
        {total === 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3 p-2 sm:p-3 aspect-[16/9]">
            <div
              className="md:col-span-2 relative rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer group h-full"
              onClick={() => setSelectedPhotoIndex(0)}
            >
              <GalleryImage
                src={cleanImages[0]}
                alt={`${title} - 1`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              />
            </div>
            <div className="grid grid-rows-2 gap-2 sm:gap-3 h-full">
              {cleanImages.slice(1, 3).map((img, idx) => (
                <div
                  key={idx}
                  className="relative rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer group h-full"
                  onClick={() => setSelectedPhotoIndex(idx + 1)}
                >
                  <GalleryImage
                    src={img}
                    alt={`${title} - ${idx + 2}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* KONDISI D: 4 FOTO (Grid 2x2 Simetris)                         */}
        {/* ============================================================ */}
        {total === 4 && (
          <div className="grid grid-cols-2 gap-2 sm:gap-3 p-2 sm:p-3 aspect-[16/9]">
            {cleanImages.map((img, idx) => (
              <div
                key={idx}
                className="relative rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer group h-full"
                onClick={() => setSelectedPhotoIndex(idx)}
              >
                <GalleryImage
                  src={img}
                  alt={`${title} - ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                />
              </div>
            ))}
          </div>
        )}

        {/* ============================================================ */}
        {/* KONDISI E & F: 5 FOTO & LEBIH DARI 5 FOTO (Mosaik Klasik)    */}
        {/* ============================================================ */}
        {total >= 5 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 sm:gap-3 p-2 sm:p-3 aspect-[16/9]">
            {/* Foto Utama Besar di Kiri (Span 2 Kolom) */}
            <div
              className="md:col-span-2 relative rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer group h-full"
              onClick={() => setSelectedPhotoIndex(0)}
            >
              <GalleryImage
                src={cleanImages[0]}
                alt={`${title} - 1`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              />
            </div>

            {/* 4 Foto di Kolom Kanan (Grid 2x2 Simetris) */}
            <div className="hidden md:grid md:col-span-2 grid-cols-2 grid-rows-2 gap-2 sm:gap-3 h-full">
              {cleanImages.slice(1, 5).map((img, idx) => {
                const photoIdx = idx + 1;
                const isLastVisibleSlot = idx === 3;
                const hasMorePhotos = total > 5;

                return (
                  <div
                    key={idx}
                    className="relative rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer group h-full"
                    onClick={() => setSelectedPhotoIndex(photoIdx)}
                  >
                    <GalleryImage
                      src={img}
                      alt={`${title} - ${photoIdx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />

                    {/* Overlay jika ada lebih dari 5 foto (Slot ke-5) */}
                    {isLastVisibleSlot && hasMorePhotos && (
                      <div className="absolute inset-0 bg-black/50 hover:bg-black/40 backdrop-blur-[2px] transition-colors flex flex-col items-center justify-center text-white p-2 text-center">
                        <span className="font-extrabold text-lg sm:text-2xl">
                          +{total - 4}
                        </span>
                        <span className="text-xs font-semibold text-slate-200">
                          {isId ? 'Foto Lainnya' : 'More Photos'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tombol Terapung "Lihat Semua Foto" */}
        {total > 1 && (
          <button
            type="button"
            onClick={() => setSelectedPhotoIndex(0)}
            className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 bg-white/95 hover:bg-white text-slate-900 text-xs font-bold px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl shadow-md border border-slate-200/80 backdrop-blur-xs flex items-center gap-1.5 transition-all active:scale-95 z-10 cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5 text-orange-500" />
            <span>
              {isId ? `Lihat Semua ${total} Foto` : `Show All ${total} Photos`}
            </span>
          </button>
        )}
      </div>

      {/* Lightbox Modal */}
      <ExperienceLightboxModal
        images={cleanImages}
        currentIndex={selectedPhotoIndex ?? 0}
        isOpen={selectedPhotoIndex !== null}
        onClose={() => setSelectedPhotoIndex(null)}
        onNavigate={(newIdx) => setSelectedPhotoIndex(newIdx)}
        title={title}
        locale={locale}
      />
    </>
  );
}

function GalleryImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const resolved = resolveExperienceImageUrl(src);
  const fallback = '/images/placeholder-experience.jpg';
  const [imgSrc, setImgSrc] = useState(resolved);

  return (
    <img
      src={imgSrc}
      alt={alt}
      onError={() => {
        if (imgSrc !== fallback) {
          setImgSrc(fallback);
        }
      }}
      className={className || 'w-full h-full object-cover'}
      loading="lazy"
    />
  );
}
