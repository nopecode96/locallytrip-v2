'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
  ChevronRight,
  PenSquare,
  Sparkles,
  Clock,
  ArrowRight,
  MapPin,
  Flame,
  Search,
  Coins,
  Compass,
  CheckCircle2,
  X,
} from 'lucide-react';
import { StoryCard, StoryItem } from './StoryCard';
import { UserPersonaLink } from '@/components/common/UserPersonaLink';
import { Dictionary } from '@/lib/dictionary';
import { Locale } from '@/lib/i18n';
import { useProtectedAction } from '@/hooks/useProtectedAction';
import { ContextualAuthModal } from '@/components/marketplace/ContextualAuthModal';
import { resolveStoryImage } from '@/lib/utils/images';

export interface CityFilterItem {
  id: number;
  name: string;
  slug?: string;
}

export interface CurrentUserSessionData {
  id: number;
  name: string;
  email: string;
  avatar_url?: string | null;
  isLoggedIn: boolean;
}

interface StoriesCatalogProps {
  featuredStory: StoryItem | null;
  stories: StoryItem[];
  total: number;
  cities: CityFilterItem[];
  locale: Locale;
  dict: Dictionary;
  currentUser: CurrentUserSessionData | null;
  currentCategory?: string;
  currentCity?: string;
  currentSearch?: string;
  rewardRule?: {
    xp_reward: number;
    ltp_reward: number;
  } | null;
}

export function StoriesCatalog({
  featuredStory,
  stories,
  total,
  cities = [],
  locale,
  dict,
  currentUser,
  currentCategory = 'all',
  currentCity = 'all',
  currentSearch = '',
  rewardRule,
}: StoriesCatalogProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState(currentSearch);
  const [activeCategory, setActiveCategory] = useState(currentCategory);
  const [activeCity, setActiveCity] = useState(currentCity);
  const [visibleCount, setVisibleCount] = useState(9);

  const isId = locale === 'id';
  const xpReward = rewardRule?.xp_reward || 50;
  const ltpReward = rewardRule?.ltp_reward || 15;

  const t = dict?.stories_page || {
    badge: isId ? '📖 JURNAL PERJALANAN' : '📖 TRAVEL STORIES',
    title: isId ? 'Catatan Otentik dari Sudut-Sudut Tersembunyi' : 'Authentic Notes from Hidden Corners',
    subtitle: isId
      ? 'Kumpulan panduan jujur, rute lokal tersembunyi, dan kisah petualangan otentik yang ditulis oleh komunitas traveler dan pemandu lokal terverifikasi.'
      : 'Curated honest guides, hidden local trails, and authentic adventure logs written by our community of verified travelers and local insiders.',
    search_placeholder: isId ? 'Cari cerita atau kota tujuan...' : 'Search stories or destinations...',
    btn_write: isId ? '+ Tulis Cerita Baru' : '+ Write New Story',
    featured_badge: isId ? 'Pilihan Editor' : "Editor's Pick",
    read_time: isId ? 'menit baca' : 'min read',
    by: isId ? 'Oleh' : 'By',
    categories: {
      all: isId ? 'Semua' : 'All',
      hidden_gems: 'Hidden Gems',
      culinary: isId ? 'Kuliner Lokal' : 'Local Food',
      tips: isId ? 'Tips & Panduan' : 'Tips & Guides',
      culture: isId ? 'Budaya & Tradisi' : 'Culture & Heritage',
    },
    empty: isId
      ? 'Belum ada cerita perjalanan dalam kategori atau kota ini. Jadilah orang pertama yang menulis cerita!'
      : 'No travel stories found in this category or city. Be the first to share your story!',
    load_more: isId ? 'Muat Lebih Banyak Cerita' : 'Load More Stories',
    breadcrumb_home: isId ? 'Beranda' : 'Home',
    breadcrumb_stories: isId ? 'Cerita Petualang' : 'Travel Stories',
  };

  const categories = [
    { key: 'all', label: t.categories.all || (isId ? 'Semua' : 'All') },
    { key: 'hidden_gems', label: t.categories.hidden_gems || 'Hidden Gems' },
    { key: 'culinary', label: t.categories.culinary || (isId ? 'Kuliner Lokal' : 'Local Food') },
    { key: 'tips', label: t.categories.tips || (isId ? 'Tips & Panduan' : 'Tips & Guides') },
    { key: 'culture', label: t.categories.culture || (isId ? 'Budaya & Tradisi' : 'Culture & Heritage') },
  ];

  const updateFilters = (catKey: string, cityKey: string, query: string) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (catKey && catKey !== 'all') {
      params.set('cat', catKey);
    } else {
      params.delete('cat');
    }

    if (cityKey && cityKey !== 'all') {
      params.set('city', cityKey);
    } else {
      params.delete('city');
    }

    if (query.trim()) {
      params.set('q', query.trim());
    } else {
      params.delete('q');
    }

    startTransition(() => {
      const searchStr = params.toString();
      router.push(`/${locale}/stories${searchStr ? `?${searchStr}` : ''}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters(activeCategory, activeCity, searchQuery);
  };

  const handleCategoryClick = (catKey: string) => {
    setActiveCategory(catKey);
    updateFilters(catKey, activeCity, searchQuery);
  };

  const handleCityChange = (cityKey: string) => {
    setActiveCity(cityKey);
    updateFilters(activeCategory, cityKey, searchQuery);
  };

  const { isAuthModalOpen, setIsAuthModalOpen, authMessage, executeProtected } =
    useProtectedAction();

  const handleWriteStoryClick = () => {
    executeProtected(
      () => {
        router.push(`/${locale}/stories/create`);
      },
      isId
        ? `Masuk untuk mulai menulis cerita petualang dan dapatkan +${xpReward} XP & +${ltpReward} LTP!`
        : `Sign in to write travel stories and earn +${xpReward} XP & +${ltpReward} LTP!`
    );
  };

  const displayedStories = stories.slice(0, visibleCount);
  const remainingCount = Math.max(0, stories.length - visibleCount);
  const hasMore = visibleCount < stories.length;
  const isDefaultView = !searchQuery && activeCategory === 'all' && activeCity === 'all';

  return (
    <div className="w-full space-y-8 sm:space-y-12">
      {/* 1. Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Link
          href={`/${locale}`}
          className="hover:text-purple-600 transition flex items-center gap-1 text-slate-600"
        >
          {t.breadcrumb_home || (isId ? 'Beranda' : 'Home')}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="text-purple-700 font-semibold">
          {t.breadcrumb_stories || (isId ? 'Cerita Petualang' : 'Travel Stories')}
        </span>
      </nav>

      {/* 2. Hero Banner 2-Kolom & Gamification Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Kolom Kiri (lg:col-span-7 space-y-4) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Badge Kategori */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-100/90 text-purple-800 text-xs font-bold tracking-wide shadow-xs border border-purple-200/60">
            <Sparkles className="w-3.5 h-3.5 fill-purple-600 text-purple-600" />
            <span>{isId ? '📖 JURNAL PERJALANAN' : '📖 TRAVEL STORIES'}</span>
          </div>

          {/* Judul Besar Display */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-slate-900 tracking-tight leading-tight">
            {isId ? 'Catatan Otentik dari Sudut-Sudut Tersembunyi' : 'Authentic Notes from Hidden Corners'}
          </h1>

          {/* Subheadline */}
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
            {t.subtitle}
          </p>

          {/* Banner Gamifikasi Mini */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-50 via-violet-50 to-amber-50/70 border border-purple-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-purple-500/30">
                <Coins className="w-5 h-5 text-amber-300" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs sm:text-sm font-bold text-slate-900">
                  {isId
                    ? `✨ Bagikan pengalaman perjalananmu dan dapatkan +${xpReward} XP & +${ltpReward} LTP Koin untuk setiap cerita yang terbit!`
                    : `✨ Share your travel experiences and earn +${xpReward} XP & +${ltpReward} LTP Coins for every published story!`}
                </p>
                <p className="text-[11px] text-slate-500">
                  {isId
                    ? 'Koin LTP dapat ditukarkan langsung sebagai diskon pemesanan tur.'
                    : 'LTP coins can be redeemed directly for discounts on tour bookings.'}
                </p>
              </div>
            </div>

            {/* Tombol CTA Tulis Cerita Baru */}
            <button
              type="button"
              onClick={handleWriteStoryClick}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-semibold text-xs sm:text-sm transition-all shadow-md shadow-purple-500/25 shrink-0 cursor-pointer"
            >
              <PenSquare className="w-4 h-4" />
              <span>{t.btn_write || (isId ? '+ Tulis Cerita Baru' : '+ Write New Story')}</span>
            </button>
          </div>
        </div>

        {/* Kolom Kanan (lg:col-span-5 flex justify-center lg:justify-end) */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end">
          <div className="relative w-full max-w-xs sm:max-w-sm lg:max-w-md flex justify-center lg:justify-end">
            <Image
              src="/images/stories/hero-story-book.png"
              width={520}
              height={420}
              alt="Locallytrip Travel Stories & Journal"
              priority
              className="w-auto h-48 sm:h-64 lg:h-80 object-contain drop-shadow-xl select-none pointer-events-none"
            />
          </div>
        </div>
      </div>

      {/* 3. Featured Story Sinematik Lebar */}
      {featuredStory && isDefaultView && (
        <section aria-label={t.featured_badge || 'Featured Story'}>
          <div className="relative rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-purple-200 transition-all duration-300 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0">
            {/* Foto Lanskap Besar di Kiri (lg:col-span-7) */}
            <div className="lg:col-span-7 relative aspect-[16/10] lg:aspect-auto h-72 sm:h-96 lg:h-full bg-slate-950 overflow-hidden group">
              <figure className="relative w-full h-full m-0">
                <img
                  src={resolveStoryImage(featuredStory.cover_image)}
                  alt={featuredStory.title}
                  width={800}
                  height={500}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/placeholder-story.webp';
                  }}
                />
                <figcaption className="sr-only">
                  Sampul artikel unggulan: {featuredStory.title}
                </figcaption>
              </figure>

              {/* Overlay Gradien Lembut */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

              {/* Badge Pilihan Editor */}
              <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-purple-600/90 backdrop-blur-md text-white text-xs font-bold shadow-md">
                <Flame className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                <span>{t.featured_badge || (isId ? 'Pilihan Editor' : "Editor's Pick")}</span>
              </div>

              {/* Floating City on Cover */}
              {featuredStory.city && (
                <div className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-slate-900 text-xs font-bold shadow-md border border-white/60">
                  <MapPin className="w-3.5 h-3.5 text-purple-600" />
                  <span>{featuredStory.city.name}</span>
                </div>
              )}
            </div>

            {/* Editorial Ringkasan + Byline Penulis di Kanan (lg:col-span-5) */}
            <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-md border border-purple-100">
                    {featuredStory.category || (isId ? 'Sorotan Pilihan' : 'Featured Note')}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {featuredStory.reading_time || 4} {t.read_time || (isId ? 'menit baca' : 'min read')}
                  </span>
                  {featuredStory.created_at && (
                    <>
                      <span>•</span>
                      <span>
                        {new Date(featuredStory.created_at).toLocaleDateString(
                          isId ? 'id-ID' : 'en-US',
                          { day: 'numeric', month: 'short', year: 'numeric' }
                        )}
                      </span>
                    </>
                  )}
                </div>

                <Link href={`/${locale}/stories/${featuredStory.slug || featuredStory.id}`}>
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 hover:text-purple-600 transition leading-snug">
                    {featuredStory.title}
                  </h2>
                </Link>

                <p className="text-xs sm:text-sm text-slate-600 line-clamp-4 leading-relaxed">
                  {featuredStory.excerpt || featuredStory.content.slice(0, 200) + '...'}
                </p>
              </div>

              {/* Byline Penulis & Tombol CTA */}
              <div className="pt-5 border-t border-slate-100 flex items-center justify-between gap-4">
                {featuredStory.author ? (
                  <div onClick={(e) => e.stopPropagation()}>
                    <UserPersonaLink
                      user={{
                        id: featuredStory.author.id,
                        name: featuredStory.author.name,
                        username: featuredStory.author.username,
                        avatar_url: featuredStory.author.avatar_url,
                      }}
                      locale={locale}
                      variant="full"
                      size="md"
                      subtitle={
                        featuredStory.author.is_verified
                          ? (isId ? 'Penulis Terverifikasi' : 'Verified Author')
                          : (isId ? 'Penulis Komunitas' : 'Community Writer')
                      }
                      className="min-w-0"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 shrink-0" />
                    <p className="text-xs sm:text-sm font-bold text-slate-900">
                      {isId ? 'Local Insider' : 'Local Insider'}
                    </p>
                  </div>
                )}

                <Link
                  href={`/${locale}/stories/${featuredStory.slug || featuredStory.id}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs sm:text-sm font-bold transition shadow-sm shadow-purple-500/25 group shrink-0"
                >
                  <span>{isId ? 'Baca Cerita' : 'Read Story'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. Bilah Filter & Pencarian Cepat */}
      <div className="space-y-4 pt-2">
        {/* Baris Pencarian & Dropdown Kota */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full">
          {/* Kolom Pencarian Kata Kunci */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 relative flex items-center bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-purple-300 focus-within:border-purple-500 focus-within:ring-4 focus-within:ring-purple-500/10 p-1.5 transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center shrink-0 text-purple-600 ml-1">
              <Search className="w-4 h-4 stroke-[2.2]" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.search_placeholder}
              className="w-full bg-transparent px-3 text-slate-800 placeholder-slate-400 text-xs sm:text-sm font-medium focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  updateFilters(activeCategory, activeCity, '');
                }}
                className="text-xs text-slate-400 hover:text-slate-600 p-1.5 font-bold cursor-pointer transition-colors"
                title="Hapus pencarian"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-bold transition shrink-0 shadow-xs cursor-pointer"
            >
              {dict?.common?.searchBtn || (isId ? 'Cari' : 'Search')}
            </button>
          </form>

          {/* Filter Dropdown Kota (Terhubung langsung dengan citiesList) */}
          <div className="relative min-w-[200px] md:w-64">
            <div className="relative flex items-center bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-purple-300 px-3 py-2 transition-all">
              <MapPin className="w-4 h-4 text-purple-600 mr-2 shrink-0" />
              <select
                value={activeCity}
                onChange={(e) => handleCityChange(e.target.value)}
                aria-label={isId ? 'Filter Kota' : 'Filter by City'}
                className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none cursor-pointer pr-4 appearance-none"
              >
                <option value="all">{isId ? '📍 Semua Kota' : '📍 All Cities'}</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id.toString()}>
                    {city.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                <ChevronRight className="w-4 h-4 rotate-90" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Kapsul Kategori: Semua, Hidden Gems, Kuliner Lokal, Tips & Panduan, Budaya & Tradisi */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            {isId ? 'Kategori:' : 'Category:'}
          </span>
          {categories.map((cat) => {
            const isActive = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => handleCategoryClick(cat.key)}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/25 scale-[1.02]'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-purple-200'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading Transition Indicator */}
      {isPending && (
        <div className="flex items-center justify-center py-4 text-xs font-semibold text-purple-600 animate-pulse">
          {isId ? 'Memperbarui kurasi cerita...' : 'Updating travel stories...'}
        </div>
      )}

      {/* 5. 3-Column Story Cards Grid */}
      {displayedStories.length > 0 ? (
        <div className="space-y-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {displayedStories.map((story) => (
              <div key={story.id} className="h-full flex flex-col justify-between">
                <StoryCard
                  story={story}
                  locale={locale}
                  readTimeLabel={t.read_time}
                />
              </div>
            ))}
          </div>

          {/* 6. Paginasi / Tombol Muat Lebih Banyak */}
          {hasMore && (
            <div className="text-center pt-4">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + 6)}
                className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-semibold px-8 py-3.5 rounded-full mx-auto shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all duration-200 cursor-pointer text-sm"
              >
                <span>
                  {t.load_more || (isId ? 'Muat Lebih Banyak Cerita' : 'Load More Stories')}
                  {` (${remainingCount} ${isId ? 'tersisa' : 'remaining'}) ↓`}
                </span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/90 p-8 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-4 border border-purple-100">
            <Compass className="w-8 h-8" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-800">
            {t.empty}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
            {isId
              ? 'Coba pilih kota atau kategori cerita lain, atau reset filter untuk kembali menampilkan seluruh artikel.'
              : 'Try selecting another city or category, or reset filters to display all articles.'}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setActiveCategory('all');
                setActiveCity('all');
                setSearchQuery('');
                updateFilters('all', 'all', '');
              }}
              className="px-6 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              {isId ? 'Reset Filter' : 'Reset Filters'}
            </button>
            <button
              type="button"
              onClick={handleWriteStoryClick}
              className="px-6 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              {t.btn_write || (isId ? '+ Tulis Cerita Baru' : '+ Write New Story')}
            </button>
          </div>
        </div>
      )}

      {/* Contextual Auth Guard Modal */}
      <ContextualAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        promptMessage={authMessage}
        locale={locale}
        onSuccess={() => {
          router.push(`/${locale}/stories/create`);
        }}
      />
    </div>
  );
}

export default StoriesCatalog;
