'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, ChevronRight, SlidersHorizontal, Sparkles, Compass, ShieldCheck, HelpCircle, ChevronDown } from 'lucide-react';
import { ExperienceItem } from '@/actions/experiences';
import { ExperienceCard } from './ExperienceCard';
import { Dictionary } from '@/lib/dictionary';
import { Locale } from '@/lib/i18n';

interface ExperiencesCatalogProps {
  initialExperiences: ExperienceItem[];
  total: number;
  locale: Locale;
  dict: Dictionary;
  currentSearch?: string;
  currentCategory?: string;
  currentSort?: string;
}

export function ExperiencesCatalog({
  initialExperiences,
  total,
  locale,
  dict,
  currentSearch = '',
  currentCategory = 'all',
  currentSort = 'popular',
}: ExperiencesCatalogProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState(currentSearch);
  const [activeCategory, setActiveCategory] = useState(currentCategory);
  const [activeSort, setActiveSort] = useState(currentSort);
  const [visibleCount, setVisibleCount] = useState(12);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const t = dict.experiences_page || {
    badge: '✨ KATALOG LENGKAP',
    title: 'Temukan Pengalaman Lokal Sesuai Seleramu',
    subtitle:
      'Kumpulan petualangan otentik, tur privat, dan rute tersembunyi yang dipandu langsung oleh warga lokal terverifikasi.',
    search_placeholder: 'Cari aktivitas atau kota tujuan...',
    categories: {
      all: 'Semua',
      food: 'Kuliner & Rasa',
      nature: 'Alam & Petualangan',
      wellness: 'Yoga & Wellness',
      culture: 'Seni & Budaya',
    },
    sort: {
      popular: 'Paling Populer',
      rating: 'Rating Tertinggi',
      price_low: 'Harga: Termurah',
      price_high: 'Harga: Termahal',
    },
    empty:
      'Belum ada aktivitas yang cocok dengan filter Anda. Coba pilih kota atau kategori lain.',
    load_more: 'Muat Aktivitas Lainnya',
    breadcrumb_home: 'Beranda',
    breadcrumb_exp: 'Aktivitas',
  };

  const categories = [
    { slug: 'all', icon: '✨', name_id: 'Semua', name_en: 'All' },
    // 1. Pilar Utama
    { slug: 'local-guide', icon: '🧭', name_id: 'Pemandu Lokal', name_en: 'Local Guide' },
    { slug: 'photographer', icon: '📸', name_id: 'Fotografer', name_en: 'Photographer' },
    { slug: 'combo-guide-photo', icon: '✨', name_id: 'Combo Guide & Foto', name_en: 'Combo Guide & Photographer' },
    { slug: 'trip-planner', icon: '🗺️', name_id: 'Perencana Perjalanan', name_en: 'Trip Planner' },
    { slug: 'instructor-wellness', icon: '🧘', name_id: 'Instruktur & Wellness', name_en: 'Instructor & Wellness' },
    // 2. Olahraga, Laut & Kebugaran
    { slug: 'surfing-lesson', icon: '🏄', name_id: 'Kursus Selancar', name_en: 'Surfing Lesson' },
    { slug: 'diving-course', icon: '🤿', name_id: 'Kursus Menyelam', name_en: 'Diving Course' },
    { slug: 'yoga-pilates', icon: '🧘', name_id: 'Sesi Yoga & Pilates', name_en: 'Yoga & Pilates' },
    { slug: 'personal-trainer', icon: '🏋️', name_id: 'Pelatih Gym Privat', name_en: 'Personal Trainer' },
    // 3. Kuliner & Rasa
    { slug: 'street-food', icon: '🍲', name_id: 'Tur Kuliner Kaki Lima', name_en: 'Street Food Tour' },
    { slug: 'cooking-class', icon: '🍳', name_id: 'Kelas Memasak Lokal', name_en: 'Cooking Class' },
    // 4. Seni & Petualangan Alam
    { slug: 'local-craft', icon: '🎨', name_id: 'Kerajinan & Seni Tradisional', name_en: 'Local Craft & Art' },
    { slug: 'secret-trek', icon: '🥾', name_id: 'Rute Tersembunyi & Alam', name_en: 'Secret Trek & Nature' },
  ];

  const updateFilters = (newCategory: string, newSort: string, newQuery: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (newCategory && newCategory !== 'all') {
      params.set('category', newCategory);
      params.delete('cat');
    } else {
      params.delete('category');
      params.delete('cat');
    }

    if (newSort && newSort !== 'popular') {
      params.set('sort', newSort);
    } else {
      params.delete('sort');
    }

    if (newQuery.trim()) {
      params.set('q', newQuery.trim());
    } else {
      params.delete('q');
    }

    startTransition(() => {
      router.push(`/${locale}/experiences?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters(activeCategory, activeSort, searchQuery);
  };

  const handleSelectCategory = (catSlug: string) => {
    setActiveCategory(catSlug);
    updateFilters(catSlug, activeSort, searchQuery);
  };

  const handleSortChange = (sortKey: string) => {
    setActiveSort(sortKey);
    updateFilters(activeCategory, sortKey, searchQuery);
  };

  const displayedExperiences = initialExperiences.slice(0, visibleCount);
  const hasMore = visibleCount < initialExperiences.length;

  return (
    <div className="w-full">
      {/* 1. Breadcrumb Visual */}
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs font-medium text-slate-500">
        <Link
          href={`/${locale}`}
          className="hover:text-purple-900 transition-colors flex items-center gap-1 text-slate-600"
        >
          {t.breadcrumb_home || (locale === 'id' ? 'Beranda' : 'Home')}
        </Link>
        <span>›</span>
        <span className="text-purple-900 font-semibold">
          {dict.nav?.experiences || (locale === 'id' ? 'Aktivitas' : 'Experiences')}
        </span>
      </nav>

      {/* 2. Grid 2-Kolom Sejajar dengan /explore */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center mb-10 sm:mb-12">
        {/* Kolom Kiri: Teks & Search Controls */}
        <div className="lg:col-span-7 space-y-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100/80 border border-violet-200 text-violet-800 text-xs font-semibold uppercase tracking-wider">
            <span>✨</span>
            <span>{dict.experiences_page?.badge || (locale === 'id' ? 'KATALOG LENGKAP' : 'COMPLETE CATALOG')}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-purple-950 tracking-tight leading-tight">
            {dict.experiences_page?.title || (locale === 'id' ? 'Temukan Pengalaman Lokal Sesuai Seleramu' : 'Discover Local Experiences That Suit Your Vibe')}
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
            {dict.experiences_page?.subtitle || (locale === 'id'
              ? 'Kumpulan petualangan otentik, tur privat, dan rute tersembunyi yang dipandu langsung oleh warga lokal terverifikasi.'
              : 'Curated authentic adventures, private tours, and hidden gems guided directly by verified local insiders.')}
          </p>

          {/* Form Pencarian & Kategori Filter */}
          <div className="pt-2 w-full max-w-full">
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-md shadow-purple-950/5 space-y-4 w-full">
              {/* Baris Atas: Form Pencarian Bersih & Sort Dropdown */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
                {/* Input Search Bersih Tanpa Tombol Submit Ungu yang Menimpa */}
                <form
                  onSubmit={handleSearchSubmit}
                  className="relative flex-1"
                >
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={locale === 'id' ? 'Cari aktivitas, nama tempat, atau local host...' : 'Search activities, destinations, or hosts...'}
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-900/10 focus:border-purple-900 transition-all font-medium"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        updateFilters(activeCategory, activeSort, '');
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold px-2 py-1 rounded-full hover:bg-slate-100 transition"
                      aria-label="Bersihkan pencarian"
                    >
                      ✕
                    </button>
                  )}
                </form>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="relative flex items-center bg-white border border-slate-200 rounded-2xl px-4 py-3 hover:border-slate-300 transition w-full sm:w-auto shadow-2xs">
                    <SlidersHorizontal className="w-4 h-4 text-purple-900 shrink-0 mr-2" />
                    <select
                      value={activeSort}
                      onChange={(e) => handleSortChange(e.target.value)}
                      className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer pr-4 w-full sm:w-auto"
                      aria-label="Urutkan Aktivitas"
                    >
                      <option value="popular">{t.sort.popular}</option>
                      <option value="rating">{t.sort.rating}</option>
                      <option value="price_low">{t.sort.price_low}</option>
                      <option value="price_high">{t.sort.price_high}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Baris Bawah: Single Row Swipeable Chips Kategori */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-none no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                {categories.map((cat) => {
                  const isActive = activeCategory === cat.slug;
                  return (
                    <button
                      key={cat.slug}
                      type="button"
                      onClick={() => handleSelectCategory(cat.slug)}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 border cursor-pointer shrink-0 ${
                        isActive
                          ? 'bg-purple-900 text-white border-purple-900 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300 hover:bg-purple-50/50'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{locale === 'id' ? cat.name_id : cat.name_en}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Ilustrasi Koper & Petualang */}
        <div className="hidden lg:flex lg:col-span-5 justify-center lg:justify-end items-center relative">
          <div className="relative w-full max-w-md aspect-square drop-shadow-2xl animate-in fade-in zoom-in-95 duration-500">
            <Image
              src="/images/hero-experiences.png"
              alt="Locallytrip Experiences Travel Suitcase"
              fill
              priority
              className="object-contain"
            />
          </div>
        </div>
      </div>

      {/* Micro-Trust Banner (E-E-A-T & Keamanan Transaksi) */}
      <div className="mt-6 flex items-center gap-3 px-4 py-3 rounded-2xl bg-violet-50/80 border border-violet-100 text-xs text-violet-950">
        <ShieldCheck className="w-4 h-4 text-violet-700 shrink-0" />
        <span className="font-medium">
          {t.trust_banner ||
            '🛡️ Seluruh pemandu terverifikasi identitas resmi (KYC) & transaksi dilindungi rekening bersama PT Locallytrip Teknologi Indonesia.'}
        </span>
      </div>

      {/* Indikator Loading Transisi */}
      {isPending && (
        <div className="flex items-center justify-center py-4 text-xs font-semibold text-violet-600 animate-pulse">
          Memperbarui katalog...
        </div>
      )}

      {/* 4. Grid Katalog Aktivitas (3 Kolom Identik dengan Beranda) */}
      {displayedExperiences.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mt-6">
            {displayedExperiences.map((exp) => (
              <div key={exp.id} className="h-full flex flex-col justify-between">
                <ExperienceCard
                  experience={exp}
                  dict={dict.common}
                  homeDict={dict.home}
                />
              </div>
            ))}
          </div>

          {/* Tombol Load More */}
          {hasMore && (
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 6)}
              className="bg-violet-600 hover:bg-violet-700 active:scale-95 text-white font-medium px-8 py-3 rounded-full mx-auto block mt-12 shadow-lg shadow-violet-500/20 transition-all duration-200 cursor-pointer text-sm"
            >
              {t.load_more} ({initialExperiences.length - visibleCount} tersisa)
            </button>
          )}
        </>
      ) : (
        /* Empty State */
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 p-8 mt-8">
          <div className="w-16 h-16 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mx-auto mb-4 border border-violet-100">
            <Compass className="w-8 h-8" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-800">
            {t.empty}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
            Coba gunakan kata kunci kota lain seperti Bali, Bandung, Yogyakarta, atau reset kategori.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setActiveCategory('all');
              setActiveSort('popular');
              updateFilters('all', 'popular', '');
            }}
            className="mt-6 px-5 py-2.5 rounded-full bg-violet-50 text-violet-700 hover:bg-violet-100 text-xs font-bold transition border border-violet-200"
          >
            Reset Semua Filter
          </button>
        </div>
      )}

      {/* 5. Seksi FAQ Khusus Aktivitas (Model Accordion / AEO) */}
      <section className="w-full mt-16 pt-10 border-t border-slate-200/80">
        <div className="w-full mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-semibold mb-2">
            <span>{dict.experiences_faq?.badge || t.faq?.badge || '💡 Tanya Jawab Seputar Aktivitas'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
            {dict.experiences_faq?.title || t.faq?.title || 'Pertanyaan yang Sering Diajukan'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {dict.experiences_faq?.subtitle ||
              t.faq?.subtitle ||
              'Panduan ringkas untuk memesan dan menikmati pengalaman lokal otentik bersama Locallytrip.'}
          </p>
        </div>

        <div className="w-full space-y-4">
          {(
            dict.experiences_faq?.items || [
              {
                q:
                  t.faq?.q1 ||
                  'Bagaimana cara memesan aktivitas lokal di Locallytrip?',
                a:
                  t.faq?.a1 ||
                  'Pilih aktivitas yang Anda minati, tentukan tanggal serta jumlah peserta, lalu klik "Pesan Sekarang". Pembayaran Anda akan disimpan aman dalam rekening penampung bersama (escrow) dan hanya diteruskan ke pemandu setelah aktivitas selesai.',
              },
              {
                q:
                  t.faq?.q2 ||
                  'Apakah jadwal aktivitas bisa disesuaikan dengan permintaan pribadi?',
                a:
                  t.faq?.a2 ||
                  'Ya, tentu saja! Anda dapat berkoordinasi langsung dengan pemandu lokal (Host) melalui fitur pesan instan sebelum memesan untuk mendiskusikan penyesuaian jam kumpul, preferensi rute, maupun kebutuhan khusus keluarga.',
              },
              {
                q:
                  t.faq?.q3 ||
                  'Bagaimana kebijakan pembatalan dan pengembalian dana?',
                a:
                  t.faq?.a3 ||
                  'Locallytrip menerapkan kebijakan pembatalan transparan. Pembatalan hingga 48 jam sebelum jadwal keberangkatan berhak mendapatkan pengembalian dana 100%. Detail kebijakan pembatalan lengkap tercantum di setiap halaman aktivitas.',
              },
            ]
          ).map((item, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                className="w-full rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm transition-all duration-200 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full text-left flex items-center justify-between gap-4 cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-3">
                    <HelpCircle
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isOpen ? 'text-violet-600' : 'text-slate-400'
                      }`}
                    />
                    <span>
                      <span className="text-violet-600 font-extrabold mr-1.5">Q{index + 1}.</span>
                      {item.q}
                    </span>
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-violet-600' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="pt-3 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 mt-4 pl-7">
                    <p>{item.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
