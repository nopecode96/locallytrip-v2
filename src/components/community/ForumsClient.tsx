'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  MessageSquare,
  Search,
  MessageCircle,
  MapPin,
  ChevronRight,
  BookOpen,
  PlusCircle,
  Sparkles,
  Coins,
  RotateCcw,
  Loader2,
  X,
} from 'lucide-react';
import { Dictionary } from '@/lib/dictionary';
import { Locale } from '@/lib/i18n';
import { ForumCard, ForumThreadCardItem } from './ForumCard';
import { SidebarUpcomingMeetups, SidebarMeetupItem } from '@/components/community/SidebarUpcomingMeetups';
import { SidebarRelatedExperiences, SidebarExperienceItem } from '@/components/community/SidebarRelatedExperiences';
import { useProtectedAction } from '@/hooks/useProtectedAction';
import { ContextualAuthModal } from '@/components/marketplace/ContextualAuthModal';

export type ForumThreadItem = ForumThreadCardItem;

export interface ForumCategoryOption {
  id: number;
  name: string;
  slug: string;
  icon?: string | null;
}

export interface ForumCityOption {
  id: number;
  name: string;
}

export interface CurrentUserSessionData {
  id: number;
  name: string;
  email: string;
  avatar_url?: string | null;
  isLoggedIn: boolean;
}

interface ForumsClientProps {
  initialThreads: ForumThreadCardItem[];
  initialHasMore: boolean;
  totalThreads: number;
  categories: ForumCategoryOption[];
  cities?: ForumCityOption[];
  rewardRule?: {
    xp_reward: number;
    ltp_reward: number;
  } | null;
  featuredExperiences?: SidebarExperienceItem[];
  upcomingMeetups?: SidebarMeetupItem[];
  locale: Locale;
  dict: Dictionary;
  currentUser: CurrentUserSessionData | null;
}

export function ForumsClient({
  initialThreads,
  initialHasMore,
  totalThreads,
  categories = [],
  cities = [],
  rewardRule,
  featuredExperiences = [],
  upcomingMeetups = [],
  locale,
  dict,
  currentUser,
}: ForumsClientProps) {
  const isId = locale === 'id';
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [threads, setThreads] = useState<ForumThreadCardItem[]>(initialThreads);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const initialTopic = searchParams?.get('topic') || searchParams?.get('category') || 'all';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialTopic);
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedSort, setSelectedSort] = useState<'latest' | 'popular' | 'unanswered'>('latest');

  // Sinkronkan state jika URL parameter berubah
  useEffect(() => {
    const topicFromUrl = searchParams?.get('topic') || searchParams?.get('category') || 'all';
    setSelectedCategory(topicFromUrl);
  }, [searchParams]);

  // Fungsi Pembaruan URL State Topik
  const handleTopicChange = (newTopic: string) => {
    setSelectedCategory(newTopic);
    const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
    if (newTopic === 'all') {
      params.delete('topic');
      params.delete('category');
    } else {
      params.set('topic', newTopic);
      params.delete('category');
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const xpReward = rewardRule?.xp_reward || 25;
  const ltpReward = rewardRule?.ltp_reward || 5;

  // Handler Load More
  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const nextPage = page + 1;

    try {
      const res = await fetch(`/api/forums?page=${nextPage}&limit=15`);
      const data = await res.json();

      if (data.success && Array.isArray(data.threads)) {
        setThreads((prev) => {
          const existingIds = new Set(prev.map((th) => th.id));
          const newItems = data.threads.filter((th: ForumThreadCardItem) => !existingIds.has(th.id));
          return [...prev, ...newItems];
        });
        setPage(nextPage);
        setHasMore(Boolean(data.pagination?.hasMore));
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Failed to load more threads:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Filter & Search Logic Presisi
  const filteredThreads = useMemo(() => {
    let list = [...threads];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (th) =>
          th.title.toLowerCase().includes(q) ||
          th.content.toLowerCase().includes(q) ||
          th.author.name?.toLowerCase().includes(q) ||
          th.author.username?.toLowerCase().includes(q) ||
          th.city?.name.toLowerCase().includes(q) ||
          th.author.cityName?.toLowerCase().includes(q) ||
          th.category?.name.toLowerCase().includes(q) ||
          th.vibes_forum_categories?.name.toLowerCase().includes(q)
      );
    }

    if (selectedCategory !== 'all') {
      list = list.filter((th) => {
        const catSlug = th.category?.slug || th.vibes_forum_categories?.slug;
        return catSlug === selectedCategory;
      });
    }

    if (selectedCity !== 'all') {
      const qCity = selectedCity.toLowerCase().trim();
      list = list.filter((th) => {
        const cityName = (th.city?.name || th.author.cities?.name || th.author.cityName || '').toLowerCase();
        const cityIdStr = (th.city?.id || th.author.cities?.id || '').toString();
        return cityIdStr === qCity || cityName.includes(qCity);
      });
    }

    if (selectedSort === 'latest') {
      list.sort((a, b) => {
        if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });
    } else if (selectedSort === 'popular') {
      list.sort((a, b) => {
        const repliesB = a._count?.vibes_forum_posts ?? a.reply_count ?? 0;
        const repliesA = b._count?.vibes_forum_posts ?? b.reply_count ?? 0;
        const netB = (b.like_count || 0) - (b.dislike_count || 0);
        const netA = (a.like_count || 0) - (a.dislike_count || 0);
        return (repliesA * 2 + netB) - (repliesB * 2 + netA);
      });
    } else if (selectedSort === 'unanswered') {
      list = list.filter((th) => {
        const replies = th._count?.vibes_forum_posts ?? th.reply_count ?? 0;
        return replies === 0;
      });
      list.sort(
        (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
    }

    return list;
  }, [threads, searchQuery, selectedCategory, selectedCity, selectedSort]);

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedCity('all');
    setSearchQuery('');
    router.push(pathname, { scroll: false });
  };

  const { isAuthModalOpen, setIsAuthModalOpen, authMessage, executeProtected } =
    useProtectedAction();

  const handleStartDiscussion = () => {
    executeProtected(
      () => {
        router.push(`/${locale}/community/forums/create`);
      },
      isId
        ? `Masuk untuk membuat topik diskusi baru dan raih +${xpReward} XP & +${ltpReward} LTP Koin!`
        : `Sign in to create a new discussion thread and earn +${xpReward} XP & +${ltpReward} LTP Coins!`
    );
  };

  return (
    <div className="w-full space-y-8 sm:space-y-10">
      {/* 1. Breadcrumbs: Beranda › Komunitas › Forum Diskusi */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Link
          href={`/${locale}`}
          className="hover:text-purple-700 transition flex items-center gap-1 text-slate-600"
        >
          {isId ? 'Beranda' : 'Home'}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <Link
          href={`/${locale}/community`}
          className="hover:text-purple-700 transition text-slate-600"
        >
          {isId ? 'Komunitas' : 'Community'}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="text-purple-700 font-semibold">
          {isId ? 'Forum Diskusi' : 'Discussion Forums'}
        </span>
      </nav>

      {/* 2. Hero Banner 2-Kolom Seimbang: Ilustrasi hero-forums.png di Kanan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Kolom Kiri (lg:col-span-7 space-y-4) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-100/90 text-purple-800 text-xs font-bold tracking-wide shadow-xs border border-purple-200/60">
            <Sparkles className="w-3.5 h-3.5 fill-purple-600 text-purple-600" />
            <span>{isId ? '💬 FORUM KOMUNITAS & TIPS' : '💬 COMMUNITY & TRAVEL TIPS'}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-purple-950 tracking-tight leading-tight">
            {isId ? 'Tanya Jawab & Berbagi Tips Seputar Pengalaman' : 'Q&A & Travel Tips from the Community'}
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
            {isId
              ? 'Diskusikan rute tersembunyi, tips visa, kuliner otentik, dan rekomendasi langsung bersama warga lokal serta sesama traveler.'
              : 'Explore authentic routes, hidden gems, visa advice, food trails, and direct recommendations with verified local hosts and fellow travelers.'}
          </p>

          {/* Banner Gamifikasi Mini: Kotak highlight elegan border ungu/emas */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-50 via-violet-50 to-amber-50/70 border border-purple-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-purple-500/30">
                <Coins className="w-5 h-5 text-amber-300" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs sm:text-sm font-bold text-slate-900">
                  {isId
                    ? `✨ Punya pertanyaan atau tips lokal? Buat diskusi baru dan raih +${xpReward} XP & +${ltpReward} LTP Koin!`
                    : `✨ Have a question or local tip? Start a discussion and earn +${xpReward} XP & +${ltpReward} LTP Coins!`}
                </p>
                <p className="text-[11px] text-slate-500">
                  {isId
                    ? 'Dapatkan reward ekstra ketika diskusi Anda mendapat balasan berkualitas dari komunitas.'
                    : 'Earn extra rewards when your thread receives helpful community responses.'}
                </p>
              </div>
            </div>

            {/* Tombol CTA: + Buat Topik Baru */}
            <button
              type="button"
              onClick={handleStartDiscussion}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-semibold text-xs sm:text-sm transition-all shadow-md shadow-purple-500/25 shrink-0 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isId ? '+ Buat Topik Baru' : '+ Create Topic'}</span>
            </button>
          </div>
        </div>

        {/* Kolom Kanan (lg:col-span-5 hidden lg:flex justify-end items-center) */}
        <div className="lg:col-span-5 hidden lg:flex justify-end items-center">
          <Image
            src="/images/hero-forums.png"
            alt="Locallytrip Community Traveling Illustration"
            width={500}
            height={500}
            priority
            className="w-full max-w-md aspect-square object-contain drop-shadow-xl animate-in fade-in zoom-in-95 duration-500 select-none pointer-events-none"
          />
        </div>
      </div>

      {/* 3. Bilah Filter Terpadu: Search, Dropdown Kota, Sort, dan Kapsul Kategori */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full">
          {/* Kolom Pencarian Kata Kunci */}
          <div className="flex-1 relative flex items-center bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-purple-300 focus-within:border-purple-500 focus-within:ring-4 focus-within:ring-purple-500/10 p-1.5 transition-all">
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center shrink-0 text-purple-600 ml-1">
              <Search className="w-4 h-4 stroke-[2.2]" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isId ? 'Cari judul diskusi, topik, kota, atau pertanyaan...' : 'Search discussions, topics, cities...'}
              className="w-full bg-transparent px-3 text-slate-800 placeholder-slate-400 text-xs sm:text-sm font-medium focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-xs text-slate-400 hover:text-slate-600 p-1.5 font-bold cursor-pointer transition-colors"
                title="Hapus pencarian"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Dropdown Kota Asal / Destinasi */}
          {cities.length > 0 && (
            <div className="relative min-w-[200px] md:w-64">
              <div className="relative flex items-center bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-purple-300 px-3 py-2 transition-all">
                <MapPin className="w-4 h-4 text-purple-600 mr-2 shrink-0" />
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
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
          )}

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <select
              value={selectedSort}
              onChange={(e) =>
                setSelectedSort(e.target.value as 'latest' | 'popular' | 'unanswered')
              }
              aria-label={isId ? 'Urutkan Diskusi' : 'Sort Discussions'}
              className="px-4 py-2.5 bg-white rounded-2xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-600 transition shadow-xs cursor-pointer"
            >
              <option value="latest">{isId ? '⚡ Terbaru' : '⚡ Latest'}</option>
              <option value="popular">{isId ? '🔥 Paling Ramai' : '🔥 Most Popular'}</option>
              <option value="unanswered">{isId ? '💬 Belum Terjawab' : '💬 Unanswered'}</option>
            </select>
          </div>
        </div>

        {/* Kapsul Horizontal Kategori Forum dengan overflow-x-auto no-scrollbar */}
        <div className="flex items-center justify-between gap-3 overflow-x-auto no-scrollbar py-1 flex-wrap">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => handleTopicChange('all')}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/25 scale-[1.02]'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-purple-200'
              }`}
            >
              {isId ? '🌟 Semua Topik' : '🌟 All Topics'}
            </button>

            {categories.map((cat) => {
              const isActive = selectedCategory === cat.slug;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleTopicChange(cat.slug)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/25 scale-[1.02]'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-purple-200'
                  }`}
                >
                  #{cat.name}
                </button>
              );
            })}
          </div>

          {/* Reset Filter Button */}
          {(selectedCategory !== 'all' || selectedCity !== 'all' || searchQuery.trim() !== '') && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-semibold px-3 py-1.5 rounded-lg hover:bg-rose-50 transition cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isId ? 'Reset Filter' : 'Reset'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Grid Responsif 2 Kolom: Feed Card Island (Kiri) + Sidebar Penyeimbang (Kanan) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ======================================================== */}
        {/* KOLOM KIRI (lg:col-span-8): FEED THREAD FORMAT CARD ISLAND */}
        {/* ======================================================== */}
        <main className="lg:col-span-8 space-y-4">
          {filteredThreads.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-2 text-2xl">
                💬
              </div>
              <h3 className="font-bold text-slate-800 text-base font-serif">
                {isId ? 'Tidak ada diskusi ditemukan' : 'No discussions found'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                {isId
                  ? 'Coba ganti kata kunci pencarian, pilih kota atau kategori topik yang berbeda, atau jadilah orang pertama yang memulai diskusi!'
                  : 'Try adjusting your search query, selecting another category, or be the first to start a discussion!'}
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-5 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
                >
                  {isId ? 'Reset Filter' : 'Reset Filters'}
                </button>
                <button
                  type="button"
                  onClick={handleStartDiscussion}
                  className="px-5 py-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition cursor-pointer"
                >
                  {isId ? '+ Buat Topik Baru' : '+ Create Topic'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredThreads.map((thread) => (
                <ForumCard key={thread.id} thread={thread} locale={locale} />
              ))}

              {/* Load More Button */}
              {hasMore && (
                <div className="pt-6 flex justify-center">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full border border-purple-200 bg-white hover:bg-purple-50 active:bg-purple-100 text-purple-700 font-semibold text-xs sm:text-sm transition-all shadow-xs hover:shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-purple-700" />
                        <span>{isId ? 'Memuat diskusi lainnya...' : 'Loading more discussions...'}</span>
                      </>
                    ) : (
                      <span>
                        {isId
                          ? `Muat Lebih Banyak Diskusi (${Math.max(0, totalThreads - threads.length)} tersisa) ↓`
                          : `Load More Discussions (${Math.max(0, totalThreads - threads.length)} remaining) ↓`}
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </main>

        {/* ======================================================== */}
        {/* KOLOM KANAN (lg:col-span-4): SIDEBAR INFO KOMUNITAS      */}
        {/* ======================================================== */}
        <aside className="lg:col-span-4 space-y-6">
          {/* 1. Kartu "Mulai Diskusi Baru" (Auth Guard) */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-900 flex items-center justify-center font-bold text-lg shrink-0">
                ✍️
              </div>
              <div>
                <h3 className="font-serif font-bold text-slate-900 text-base">
                  {isId ? 'Mulai Diskusi Baru' : 'Start a Discussion'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isId ? 'Punya pertanyaan atau tips wisata?' : 'Got questions or local tips?'}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {isId
                ? 'Tanyakan apa saja seputar spot hidden gem, rekomendasi sewa motor, tiket masuk, hingga review rute bersama ribuan traveler Locallytrip.'
                : 'Ask questions about hidden gem spots, transportation options, fees, or itinerary reviews directly with thousands of verified travelers.'}
            </p>

            <button
              type="button"
              onClick={handleStartDiscussion}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-purple-500/25 transition-all text-center cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isId ? 'Buat Thread Diskusi ✍️' : 'Create New Thread ✍️'}</span>
            </button>
          </div>

          {/* 2. Kartu Panduan Komunitas & Aturan Forum */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base font-serif">
              <BookOpen className="w-5 h-5 text-purple-700" />
              <span>{isId ? 'Panduan Komunitas' : 'Community Guidelines'}</span>
            </div>

            <ul className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>
                  {isId
                    ? 'Bagikan rekomendasi otentik dan jujur berdasarkan pengalaman nyata Anda di destinasi.'
                    : 'Share honest and authentic recommendations based on your real travel experience.'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>
                  {isId
                    ? 'Jaga sikap ramah, santun, dan saling menghargai sesama traveler serta local host.'
                    : 'Maintain a polite, respectful attitude towards fellow travelers and local hosts.'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">✕</span>
                <span>
                  {isId
                    ? 'Dilarang keras menyebarkan spam, promosi link tanpa izin, atau ujaran kebencian.'
                    : 'No spam, unsolicited affiliate links, hate speech, or harassment.'}
                </span>
              </li>
            </ul>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>🛡️ Locallytrip Safety First</span>
              <span>Versi Komunitas 2.0</span>
            </div>
          </div>

          {/* 3. Kartu Reward LTP & XP */}
          <div className="bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-950 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden space-y-4">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-violet-500/20 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center gap-2">
              <span className="text-2xl">🪙</span>
              <div>
                <h3 className="font-bold text-sm tracking-wide text-amber-300">
                  {isId ? 'Reward Kredit LTP & Level XP' : 'LTP Travel Credits & XP Levels'}
                </h3>
                <p className="text-[11px] text-purple-200">
                  {isId ? 'Kredit Perjalanan & Reputasi' : 'Travel Credits & Reputation'}
                </p>
              </div>
            </div>

            <p className="text-xs text-purple-100 leading-relaxed">
              {isId
                ? 'Dapatkan kredit LTP untuk membuka pengalaman tur lokal gratis & diskon pemesanan! *(Pencairan ke USD secara eksklusif hanya berlaku bagi Host Terverifikasi yang memperoleh pendapatan dari tur terbitan).*'
                : 'Earn LTP Credits to unlock free local experiences & discounts! *(Cash-out to USD is exclusively available for Verified Local Hosts earning from published experiences).*'}
            </p>

            <div className="grid grid-cols-2 gap-2.5 pt-1 text-center">
              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10">
                <span className="block text-lg font-bold text-amber-300">⚡ +{xpReward} XP</span>
                <span className="text-[10px] text-purple-200">
                  {isId ? 'Per Topik Baru' : 'Per New Thread'}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10">
                <span className="block text-lg font-bold text-amber-300">🪙 +{ltpReward} LTP</span>
                <span className="text-[10px] text-purple-200">
                  {isId ? 'Kredit Reward' : 'Travel Credits'}
                </span>
              </div>
            </div>
          </div>

          {/* 4. Sticky Section: Widget Meetups Terdekat & Aktivitas Populer */}
          <div className="sticky top-24 space-y-6">
            {upcomingMeetups.length > 0 && (
              <SidebarUpcomingMeetups meetups={upcomingMeetups} lang={locale} />
            )}

            {featuredExperiences.length > 0 && (
              <SidebarRelatedExperiences experiences={featuredExperiences} lang={locale} />
            )}
          </div>
        </aside>
      </div>

      {/* Contextual Auth Guard Modal */}
      <ContextualAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        promptMessage={authMessage}
        locale={locale}
        onSuccess={() => {
          handleStartDiscussion();
        }}
      />
    </div>
  );
}

export default ForumsClient;
