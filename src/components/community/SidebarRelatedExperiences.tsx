'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Star } from 'lucide-react';

export interface SidebarExperienceItem {
  id: number;
  title: string;
  slug: string;
  price: number | string | null;
  currency: string | null;
  rating: number | string | null;
  review_count?: number;
  image: string;
  cityName?: string | null;
  categoryName?: string | null;
}

interface SidebarRelatedExperiencesProps {
  experiences: SidebarExperienceItem[];
  lang: string;
}

export function SidebarRelatedExperiences({
  experiences,
  lang,
}: SidebarRelatedExperiencesProps) {
  const isId = lang === 'id';

  if (!experiences || experiences.length === 0) return null;

  const formatPrice = (priceVal: number | string | null, cur: string | null) => {
    if (!priceVal) return isId ? 'Mulai Rp 150.000' : 'From $15';
    const num = typeof priceVal === 'string' ? parseFloat(priceVal) : priceVal;
    if (isNaN(num)) return isId ? 'Mulai Rp 150.000' : 'From $15';

    if (cur === 'USD' || cur === '$') {
      return `$${num.toLocaleString()}`;
    }
    return `Rp ${(num > 1000 ? num : num * 15500).toLocaleString('id-ID')}`;
  };

  const formatRating = (ratingVal: number | string | null) => {
    if (!ratingVal) return '4.9';
    const num = typeof ratingVal === 'string' ? parseFloat(ratingVal) : ratingVal;
    return num > 0 ? num.toFixed(1) : '4.9';
  };

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
        <h3 className="font-serif font-bold text-slate-900 text-sm flex items-center gap-2">
          <span>✨</span>
          <span>{isId ? 'Aktivitas Lokal Populer' : 'Popular Experiences'}</span>
        </h3>
        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
          Pilihan
        </span>
      </div>

      {/* List Experiences */}
      <div className="space-y-3">
        {experiences.map((exp) => {
          const displayRating = formatRating(exp.rating);
          const displayPrice = formatPrice(exp.price, exp.currency);

          return (
            <Link
              key={exp.id}
              href={`/${lang}/experiences/${exp.slug || exp.id}`}
              className="flex items-center gap-3 p-2 rounded-2xl hover:bg-slate-50 transition group"
            >
              {/* Gambar Thumbnail */}
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-150">
                <Image
                  src={exp.image}
                  alt={exp.title}
                  fill
                  sizes="64px"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Info Detail */}
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-purple-700">
                  <span className="truncate">{exp.categoryName || 'Tour'}</span>
                  {exp.cityName && (
                    <>
                      <span>•</span>
                      <span className="text-slate-400 font-normal truncate">{exp.cityName}</span>
                    </>
                  )}
                </div>

                <h4 className="text-xs font-bold text-slate-800 group-hover:text-purple-900 transition-colors line-clamp-1 leading-snug">
                  {exp.title}
                </h4>

                <div className="flex items-center justify-between text-[11px] pt-0.5">
                  <div className="inline-flex items-center gap-1 font-bold text-amber-500">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="text-slate-700">{displayRating}</span>
                  </div>

                  <span className="font-semibold text-slate-900">
                    {displayPrice}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-slate-100">
        <Link
          href={`/${lang}/experiences`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-purple-900 hover:text-purple-950 transition"
        >
          <span>{isId ? 'Jelajahi Semua Pengalaman' : 'Explore All Experiences'}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
