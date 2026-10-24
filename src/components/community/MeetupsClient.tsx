'use client';

import React, { useState, useMemo, useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Users,
  Calendar,
  MapPin,
  ChevronRight,
  PlusCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Search,
  Coins,
  Compass,
  X,
  CalendarDays,
} from 'lucide-react';
import { Dictionary } from '@/lib/dictionary';
import { Locale } from '@/lib/i18n';
import { SidebarExperienceItem } from '@/components/community/SidebarRelatedExperiences';
import { REWARD_RULES } from '@/config/rewards.config';
import { useProtectedAction } from '@/hooks/useProtectedAction';
import { ContextualAuthModal } from '@/components/marketplace/ContextualAuthModal';
import { MeetupCard, MeetupCardItem } from './MeetupCard';

export type MeetupItem = MeetupCardItem;

export interface MeetupCityOption {
  id: number;
  name: string;
  countryName?: string;
  countryCode?: string;
  imageUrl?: string | null;
  count?: number;
}

export interface CurrentUserSessionData {
  id: number;
  name: string;
  email: string;
  avatar_url?: string | null;
  isLoggedIn: boolean;
}

interface MeetupsClientProps {
  meetups: MeetupItem[];
  cities: MeetupCityOption[];
  featuredExperiences?: SidebarExperienceItem[];
  locale: Locale;
  dict: Dictionary;
  currentUser?: CurrentUserSessionData | null;
  initialCity?: string;
  initialCategory?: string;
  initialStatus?: string;
}

export function MeetupsClient({
  meetups,
  cities = [],
  featuredExperiences = [],
  locale,
  dict,
  currentUser,
  initialCity = '',
  initialCategory = 'all',
  initialStatus = 'all',
}: MeetupsClientProps) {
  const isId = locale === 'id';
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  type TimeFilterKey = 'all' | 'this_weekend' | 'this_month' | 'upcoming';

  const normalizeTimeParam = (param: string | null | undefined): TimeFilterKey => {
    if (!param) return initialStatus === 'upcoming' ? 'upcoming' : 'all';
    const clean = param.toLowerCase().replace(/_/g, '-');
    if (clean === 'this-weekend') return 'this_weekend';
    if (clean === 'this-month') return 'this_month';
    if (clean === 'upcoming') return 'upcoming';
    return 'all';
  };

  const toUrlTimeParam = (key: TimeFilterKey): string => {
    if (key === 'this_weekend') return 'this-weekend';
    if (key === 'this_month') return 'this-month';
    return key;
  };

  const rawTimeParam = searchParams?.get('time');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState(initialCity || 'all');
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<TimeFilterKey>(
    normalizeTimeParam(rawTimeParam)
  );
  const [visibleCount, setVisibleCount] = useState(9);

  // Sinkronkan state waktu dari URL
  React.useEffect(() => {
    setSelectedTimeFilter(normalizeTimeParam(searchParams?.get('time')));
  }, [searchParams]);

  // Fungsi Pembaruan URL State Waktu
  const handleTimeFilterChange = (filterKey: TimeFilterKey) => {
    setSelectedTimeFilter(filterKey);
    const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
    if (filterKey === 'all') {
      params.delete('time');
    } else {
      params.set('time', toUrlTimeParam(filterKey));
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  // Helper filter waktu: Akhir Pekan Ini (Jumat - Minggu)
  const isDateThisWeekend = (date: Date): boolean => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 is Sunday, 6 is Saturday
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const daysToSaturday = (6 - dayOfWeek + 7) % 7;
    const saturday = new Date(startOfToday.getTime() + daysToSaturday * 24 * 60 * 60 * 1000);
    const startOfFriday = new Date(saturday.getTime() - 24 * 60 * 60 * 1000);
    const endOfSunday = new Date(saturday.getTime() + 2 * 24 * 60 * 60 * 1000 - 1);

    const time = date.getTime();
    return time >= startOfFriday.getTime() && time <= endOfSunday.getTime();
  };

  // Helper filter waktu: Bulan Ini
  const isDateThisMonth = (date: Date): boolean => {
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  };

  // Filter Presisi: Search, Kota, dan Waktu
  const filteredMeetups = useMemo(() => {
    const now = Date.now();

    return meetups.filter((item) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q) || false;
        const matchCity =
          item.cities?.name?.toLowerCase().includes(q) ||
          item.city?.name?.toLowerCase().includes(q) ||
          false;
        const matchCreator = item.creator?.name?.toLowerCase().includes(q) || false;

        if (!matchTitle && !matchDesc && !matchCity && !matchCreator) {
          return false;
        }
      }

      // 2. Filter Kota Tujuan
      if (selectedCity && selectedCity !== 'all') {
        const qCity = selectedCity.toLowerCase().trim();
        const cityName = (item.cities?.name || item.city?.name || '').toLowerCase();
        const cityIdStr = (item.cities?.id || item.city?.id || '').toString();
        if (qCity !== cityIdStr && !cityName.includes(qCity)) {
          return false;
        }
      }

      // 3. Filter Waktu (Semua, Akhir Pekan Ini, Bulan Ini, Mendatang)
      const startDate = new Date(item.start_date);
      if (isNaN(startDate.getTime())) return true;

      if (selectedTimeFilter === 'this_weekend') {
        if (!isDateThisWeekend(startDate)) return false;
      } else if (selectedTimeFilter === 'this_month') {
        if (!isDateThisMonth(startDate)) return false;
      } else if (selectedTimeFilter === 'upcoming') {
        if (startDate.getTime() < now) return false;
      }

      return true;
    });
  }, [meetups, searchQuery, selectedCity, selectedTimeFilter]);

  const displayedMeetups = filteredMeetups.slice(0, visibleCount);
  const remainingCount = Math.max(0, filteredMeetups.length - visibleCount);
  const hasMore = visibleCount < filteredMeetups.length;

  const timeTabs = [
    { key: 'all', label: isId ? '✨ Semua Waktu' : '✨ All Dates' },
    { key: 'this_weekend', label: isId ? '🏖️ Akhir Pekan Ini' : '🏖️ This Weekend' },
    { key: 'this_month', label: isId ? '📅 Bulan Ini' : '📅 This Month' },
    { key: 'upcoming', label: isId ? '🚀 Mendatang' : '🚀 Upcoming' },
  ];

  const handleResetFilters = () => {
    setSelectedCity('all');
    handleTimeFilterChange('all');
    setSearchQuery('');
  };

  const { isAuthModalOpen, setIsAuthModalOpen, authMessage, executeProtected } =
    useProtectedAction();

  const handleInitiateMeetup = () => {
    executeProtected(
      () => {
        router.push(`/${locale}/community/meetups/create`);
      },
      isId
        ? `Masuk untuk membuat agenda meetup baru dan dapatkan +${REWARD_RULES.ACTIONS.MEETUP_CREATE.xp} XP & +${REWARD_RULES.ACTIONS.MEETUP_CREATE.ltp} LTP!`
        : `Sign in to host a meetup and earn +${REWARD_RULES.ACTIONS.MEETUP_CREATE.xp} XP & +${REWARD_RULES.ACTIONS.MEETUP_CREATE.ltp} LTP!`
    );
  };

  const selectedCityName =
    selectedCity === 'all'
      ? ''
      : cities.find((c) => c.id.toString() === selectedCity || c.name.toLowerCase() === selectedCity.toLowerCase())?.name || selectedCity;

  return (
    <div className="w-full space-y-8 sm:space-y-10">
      {/* 1. Breadcrumbs: Beranda › Komunitas › Agenda Meetup */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Link
          href={`/${locale}`}
          className="hover:text-purple-600 transition flex items-center gap-1 text-slate-600"
        >
          {isId ? 'Beranda' : 'Home'}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <Link
          href={`/${locale}/community`}
          className="hover:text-purple-600 transition text-slate-600"
        >
          {isId ? 'Komunitas' : 'Community'}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="text-purple-700 font-semibold">
          {isId ? 'Temu Komunitas' : 'Meetups'}
        </span>
      </nav>

      {/* 2. Hero Banner 2-Kolom: Ilustrasi hero-meetups.png di Kanan & Form Aksi di Kiri */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Kolom Kiri (lg:col-span-7 space-y-4) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-100/90 text-purple-800 text-xs font-bold tracking-wide shadow-xs border border-purple-200/60">
            <Sparkles className="w-3.5 h-3.5 fill-purple-600 text-purple-600" />
            <span>{isId ? '🤝 TEMAN JALAN & GATHERING' : '🤝 TRAVEL BUDDIES & GATHERINGS'}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-slate-900 tracking-tight leading-tight">
            {isId ? 'Temukan Teman Jalan & Jelajah Bareng Komunitas' : 'Find Travel Buddies & Explore Together'}
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
            {isId
              ? 'Gabung dalam agenda kumpul santai, jalan-jalan kota, kulineran, atau petualangan alam bersama sesama traveler dan warga lokal terpercaya di kotamu.'
              : 'Join casual meetups, city strolls, food adventures, or nature escapes together with verified travelers and trusted local hosts.'}
          </p>

          {/* Banner Gamifikasi / Aksi Mini */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-50 via-violet-50 to-amber-50/70 border border-purple-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-purple-500/30">
                <Coins className="w-5 h-5 text-amber-300" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs sm:text-sm font-bold text-slate-900">
                  {isId
                    ? `✨ Inisiasi meetup dan dapatkan +${REWARD_RULES.ACTIONS.MEETUP_CREATE.xp} XP & +${REWARD_RULES.ACTIONS.MEETUP_CREATE.ltp} Kredit LTP!`
                    : `✨ Host a meetup and earn +${REWARD_RULES.ACTIONS.MEETUP_CREATE.xp} XP & +${REWARD_RULES.ACTIONS.MEETUP_CREATE.ltp} LTP Credits!`}
                </p>
                <p className="text-[11px] text-slate-500">
                  {isId
                    ? 'Dapatkan Kredit LTP untuk membuka pengalaman tur lokal gratis & diskon pemesanan.'
                    : 'Earn LTP Credits to unlock free local experiences & discounts.'}
                </p>
              </div>
            </div>

            {/* Tombol CTA Buat Agenda Meetup */}
            <button
              type="button"
              onClick={handleInitiateMeetup}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-semibold text-xs sm:text-sm transition-all shadow-md shadow-purple-500/25 shrink-0 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isId ? '+ Buat Agenda Meetup' : '+ Host a Meetup'}</span>
            </button>
          </div>
        </div>

        {/* Kolom Kanan (lg:col-span-5 flex justify-center lg:justify-end) */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end">
          <div className="relative w-full max-w-xs sm:max-w-sm lg:max-w-md flex justify-center lg:justify-end">
            <Image
              src="/images/hero-meetups.png"
              width={480}
              height={380}
              alt="Locallytrip Community Meetups & Travel Buddies"
              priority
              className="w-auto h-48 sm:h-64 lg:h-76 object-contain drop-shadow-xl select-none pointer-events-none"
            />
          </div>
        </div>
      </div>

      {/* 3. Bilah Filter: Pencarian, Dropdown Kota Database, & Tab Filter Waktu */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full">
          {/* Input Pencarian Kata Kunci */}
          <div className="flex-1 relative flex items-center bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-purple-300 focus-within:border-purple-500 focus-within:ring-4 focus-within:ring-purple-500/10 p-1.5 transition-all">
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center shrink-0 text-purple-600 ml-1">
              <Search className="w-4 h-4 stroke-[2.2]" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isId ? 'Cari judul agenda atau aktivitas meetup...' : 'Search meetups or activities...'}
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

          {/* Filter Dropdown Kota dari Database */}
          <div className="relative min-w-[220px] md:w-72">
            <div className="relative flex items-center bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-purple-300 px-3 py-2 transition-all">
              <MapPin className="w-4 h-4 text-purple-600 mr-2 shrink-0" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                aria-label={isId ? 'Filter Kota Tujuan' : 'Filter by City'}
                className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none cursor-pointer pr-4 appearance-none"
              >
                <option value="all">{isId ? '📍 Semua Kota Tujuan' : '📍 All Destinations'}</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id.toString()}>
                    {city.name} {city.countryName ? `(${city.countryName})` : ''} {city.count ? `• ${city.count}` : ''}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                <ChevronRight className="w-4 h-4 rotate-90" />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Filter Waktu: [Semua] [Akhir Pekan Ini] [Bulan Ini] [Mendatang] */}
        <div className="flex items-center justify-between gap-3 overflow-x-auto no-scrollbar py-1 flex-wrap">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
              {isId ? 'Waktu:' : 'Time:'}
            </span>
            {timeTabs.map((tab) => {
              const isActive = selectedTimeFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => handleTimeFilterChange(tab.key as any)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/25 scale-[1.02]'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-purple-200'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Reset Filter Button */}
          {(selectedCity !== 'all' || selectedTimeFilter !== 'all' || searchQuery.trim() !== '') && (
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

      {/* 4. Grid Katalog Temu Komunitas (3 Kolom Simetris) */}
      {displayedMeetups.length > 0 ? (
        <div className="space-y-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {displayedMeetups.map((meetup) => (
              <MeetupCard key={meetup.id} meetup={meetup} locale={locale} />
            ))}
          </div>

          {/* 5. Tombol Paginasi / Muat Lebih Banyak */}
          {hasMore && (
            <div className="text-center pt-4">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + 6)}
                className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-semibold px-8 py-3.5 rounded-full mx-auto shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all duration-200 cursor-pointer text-sm"
              >
                <span>
                  {isId ? 'Muat Lebih Banyak Temu Komunitas' : 'Load More Community Meetups'}
                  {` (${remainingCount} ${isId ? 'tersisa' : 'remaining'}) ↓`}
                </span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/90 p-8 shadow-xs max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-4 border border-purple-100 text-2xl">
            🧭
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-800 font-serif">
            {selectedCityName
              ? isId
                ? `Belum ada agenda temu di ${selectedCityName}`
                : `No meetups in ${selectedCityName} yet`
              : isId
              ? 'Belum ada agenda temu yang cocok'
              : 'No meetups match your search'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
            {selectedCityName
              ? isId
                ? `Ingin menjadi yang pertama mengadakan temu santai atau kulineran bareng di ${selectedCityName}?`
                : `Want to be the first to host a casual hangout or food adventure in ${selectedCityName}?`
              : isId
              ? 'Coba ubah kata kunci atau pilih kota lain, atau jadilah inisiator yang membuat agenda seru di kotamu!'
              : 'Try adjusting your filters or be the first host to initiate an exciting meetup!'}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-6 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              {isId ? 'Reset Filter' : 'Reset Filters'}
            </button>
            <button
              type="button"
              onClick={handleInitiateMeetup}
              className="px-6 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              {isId ? '+ Buat Agenda Meetup' : '+ Host a Meetup'}
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
          router.push(`/${locale}/community/meetups/create`);
        }}
      />
    </div>
  );
}

export default MeetupsClient;
