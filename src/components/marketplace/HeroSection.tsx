'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Compass, ArrowRight } from 'lucide-react';
import { HeroSearch } from './HeroSearch';
import { Dictionary } from '@/lib/dictionary';
import { Locale } from '@/lib/i18n';

interface HeroSectionProps {
  locale: Locale;
  dict: Dictionary;
  searchQuery: string;
  selectedCategory: string;
  featuredCities: { id: number; name: string }[];
}

export function HeroSection({
  locale,
  dict,
  searchQuery,
  featuredCities,
}: HeroSectionProps) {
  const bubbleGuy =
    dict.hero?.bubble_guy ||
    'Coba cari rute hidden gem yang belum ramai... 🤔';
  const bubbleGirl =
    dict.hero?.bubble_girl ||
    'Ini ada! Pemandu lokal asli, ratingnya 4.9 ✨';

  return (
    <section className="relative overflow-hidden w-full bg-gradient-to-b from-purple-50/70 via-slate-50/50 to-white pt-6 sm:pt-8 lg:pt-10 pb-8 sm:pb-8 lg:pb-10 border-b border-slate-100">
      {/* Background Soft Glow & Accents */}
      <div className="absolute top-0 right-0 -mr-28 -mt-28 w-96 sm:w-[500px] h-96 sm:h-[500px] rounded-full bg-violet-200/35 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-0 -ml-28 w-64 sm:w-80 h-64 sm:h-80 rounded-full bg-purple-100/40 blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full overflow-hidden">
        {/* Main Grid: Mobile (< lg) Stacked Vertically & Centered; Desktop (lg:) 12-cols Grid */}
        <div className="flex flex-col items-center text-center lg:text-left lg:grid lg:grid-cols-12 gap-8 lg:gap-8 items-center w-full">
          {/* KOLOM KIRI: Teks, Headline Serif Display & Search (lg:col-span-7) */}
          <div className="w-full lg:col-span-7 space-y-5 sm:space-y-6">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-100/90 border border-violet-200/80 text-violet-700 text-xs font-black tracking-widest uppercase shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 fill-violet-600 text-violet-600" />
              <span>{dict.home.badge}</span>
            </div>

            {/* Headline Display Font (Terstandarisasi heading-h1) */}
            <h1 className="heading-h1 text-purple-950">
              {dict.home.heroTitle}{' '}
              <span className="relative inline-block text-violet-600">
                <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-violet-800 bg-clip-text text-transparent">
                  {dict.home.heroTitleAccent}
                </span>
                {/* Hand-drawn style brush accent underline */}
                <svg
                  className="absolute -bottom-2 left-0 w-full h-3 text-violet-400/60 -z-10"
                  viewBox="0 0 250 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3 9C60 3 190 2 247 8"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            {/* Subheadline Elegan & Ramah (Terstandarisasi text-body) */}
            <p className="text-body text-slate-600 max-w-2xl mt-3 mx-auto lg:mx-0">
              {dict.home.heroSubtitle}
            </p>

            {/* Kolom Pencarian Tunggal: Lebar Penuh (max-w-xl mx-auto lg:mx-0) */}
            <div className="pt-2 w-full max-w-xl mx-auto lg:mx-0 space-y-4">
              <HeroSearch
                locale={locale}
                initialQuery={searchQuery}
                cities={featuredCities}
                dict={dict}
              />

              {/* Primary Call-to-Action: Explore Local Experiences & Meetups */}
              <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
                <Link
                  href={`/${locale}/experiences`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-violet-700 hover:from-violet-700 hover:to-purple-800 text-white font-bold text-sm sm:text-base shadow-lg shadow-violet-500/25 transition-all hover:shadow-xl hover:-translate-y-0.5 active:scale-95 group cursor-pointer"
                >
                  <Compass className="w-5 h-5 text-violet-200 group-hover:rotate-45 transition-transform" />
                  <span>
                    {locale === 'id'
                      ? 'Jelajahi Pengalaman & Meetup Lokal'
                      : 'Explore Local Experiences & Meetups'}
                  </span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>

          {/* KOLOM KANAN: Foto Pasangan Traveler & Speech Bubbles (lg:col-span-5) */}
          <div className="w-full lg:col-span-5 relative flex justify-center items-center mt-6 lg:mt-0 overflow-visible">
            {/* Concentric Circles Decorator with responsive height & width */}
            <div className="relative w-full max-w-[290px] sm:max-w-[360px] lg:max-w-[420px] h-[340px] sm:h-[420px] md:h-[460px] lg:h-[500px] flex items-center justify-center">
              {/* Outer Concentric Circle */}
              <div className="bg-gradient-to-tr from-violet-200/50 via-purple-100/30 to-transparent rounded-full w-64 h-64 sm:w-80 sm:h-80 lg:w-[380px] lg:h-[380px] max-w-full absolute -z-10 pointer-events-none" />

              {/* Middle Border Pulse Circle */}
              <div className="rounded-full w-56 h-56 sm:w-72 sm:h-72 lg:w-[320px] lg:h-[320px] max-w-full border border-violet-200/60 bg-violet-50/40 absolute -z-20 pointer-events-none" />

              {/* Inner Soft Circle */}
              <div className="rounded-full w-48 h-48 sm:w-60 sm:h-60 lg:w-[260px] lg:h-[260px] max-w-full bg-gradient-to-tr from-violet-300/30 to-purple-200/20 absolute -z-30 blur-xs pointer-events-none" />

              {/* BUBBLE 1: Balon Ucapan Pria (Kanan Atas mengarah ke Pria, tetap terkunci di dalam batas layar) */}
              <div className="absolute top-1 right-0 sm:-right-2 lg:-right-4 z-30 animate-in fade-in slide-in-from-top-2 duration-500 max-w-[160px] sm:max-w-[200px] scale-90 sm:scale-100 origin-top-right">
                <div className="relative rounded-2xl p-2.5 sm:p-3 bg-white/95 backdrop-blur-md shadow-lg shadow-purple-950/10 border border-violet-100 text-[11px] sm:text-xs md:text-sm font-medium text-slate-800 leading-snug">
                  {bubbleGuy}
                  {/* Speech pointer tail menunjuk ke pria (bawah kiri bubble) */}
                  <div className="absolute -bottom-2 left-6 w-3 h-3 bg-white/95 border-b border-l border-violet-100 transform -rotate-45" />
                </div>
              </div>

              {/* BUBBLE 2: Balon Ucapan Wanita (Kiri Bawah dekat tangan / layar HP, tetap terkunci di batas layar) */}
              <div className="absolute top-28 left-0 sm:-left-3 lg:-left-6 z-30 animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-[170px] sm:max-w-[210px] scale-90 sm:scale-100 origin-bottom-left">
                <div className="relative rounded-2xl p-2.5 sm:p-3 bg-white/95 backdrop-blur-md shadow-lg shadow-purple-950/10 border border-violet-200 text-[11px] sm:text-xs md:text-sm font-semibold text-violet-900 leading-snug">
                  {bubbleGirl}
                  {/* Speech pointer tail menunjuk ke layar ponsel (kanan bubble) */}
                  <div className="absolute top-5 -right-1.5 w-3 h-3 bg-white/95 border-t border-r border-violet-200 transform rotate-45" />
                </div>
              </div>

              {/* Foto Pasangan Traveler Transparan dengan Skala Tinggi Responsif */}
              <div className="relative z-10 w-full h-full flex items-end justify-center">
                <img
                  src="/images/hero/travelers-couple.png"
                  alt="Locallytrip Authentic Travelers Couple"
                  width={400}
                  height={600}
                  className="h-64 sm:h-80 md:h-96 lg:h-[500px] w-auto object-contain drop-shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
