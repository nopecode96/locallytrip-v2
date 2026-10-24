'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import {
  Search,
  MapPin,
  Clock,
  Users,
  Star,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Compass,
  DollarSign,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import { getPublicImageUrl } from '@/lib/images';
import { usePreferences } from '@/components/layout/PreferencesContext';
import { formatExperienceDuration } from '@/lib/duration';

export interface CatalogHostInfo {
  id: number;
  name: string;
  avatar_url?: string | null;
  is_verified?: boolean | null;
  is_trusted?: boolean | null;
}

export interface CatalogCategoryInfo {
  id: number;
  name: string;
  icon?: string | null;
}

export interface CatalogCityInfo {
  id: number;
  name: string;
}

export interface CatalogExperienceItem {
  id: number;
  title: string;
  slug: string | null;
  coverImage: string | null;
  packagePrice: number;
  currency: string;
  durationHours: number;
  maxParticipants: number;
  ratingAverage: number;
  reviewsCount: number;
  category: CatalogCategoryInfo | null;
  city: CatalogCityInfo | null;
  host: CatalogHostInfo | null;
  createdAt: string;
}

export interface FilterCityOption {
  id: number;
  name: string;
  country_name?: string | null;
  country_code?: string | null;
}

export interface FilterCategoryOption {
  id: number;
  name: string;
  icon?: string | null;
}

interface ExperienceCatalogClientProps {
  initialExperiences: CatalogExperienceItem[];
  cities: FilterCityOption[];
  categories: FilterCategoryOption[];
  locale: string;
}

export function ExperienceCatalogClient({
  initialExperiences,
  cities,
  categories,
  locale,
}: ExperienceCatalogClientProps) {
  const isId = locale === 'id';
  const { formatPrice } = usePreferences();
  const router = useRouter();
  const pathname = usePathname();

  const searchParams = useSearchParams();
  const paramSearch = searchParams.get('search') || searchParams.get('q') || '';
  const paramCategory = searchParams.get('category') || searchParams.get('cat') || '';
  const paramCity = searchParams.get('city') || '';

  const initialCatId = useMemo(() => {
    if (!paramCategory) return 'all';
    if (!isNaN(Number(paramCategory))) return Number(paramCategory);
    const catLower = paramCategory.toLowerCase().replace(/[^a-z0-9]/g, '');
    const matched = categories.find((c) =>
      c.name.toLowerCase().replace(/[^a-z0-9]/g, '').includes(catLower)
    );
    return matched ? matched.id : 'all';
  }, [paramCategory, categories]);

  const initialCityId = useMemo(() => {
    if (!paramCity) return 'all';
    if (!isNaN(Number(paramCity))) return Number(paramCity);
    const cityLower = paramCity.toLowerCase().trim();
    const matched = cities.find((c) =>
      c.name.toLowerCase().includes(cityLower)
    );
    return matched ? matched.id : 'all';
  }, [paramCity, cities]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState(paramSearch);
  const [selectedCityId, setSelectedCityId] = useState<number | 'all'>(initialCityId);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'all'>(initialCatId);
  const [sortBy, setSortBy] = useState<'newest' | 'rating' | 'price_low' | 'price_high'>('newest');

  // Sync if URL search params change
  useEffect(() => {
    if (paramSearch !== undefined) setSearchQuery(paramSearch);
  }, [paramSearch]);

  useEffect(() => {
    if (initialCatId !== 'all') setSelectedCategoryId(initialCatId);
  }, [initialCatId]);

  useEffect(() => {
    if (initialCityId !== 'all') setSelectedCityId(initialCityId);
  }, [initialCityId]);

  // Incremental Pagination (Load More)
  const [visibleCount, setVisibleCount] = useState(9);
  const STEP = 9;

  // Filter & Sort Logic
  const filteredExperiences = useMemo(() => {
    let result = [...initialExperiences];

    // 1. Text Search (Judul atau Nama Host)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (exp) =>
          exp.title.toLowerCase().includes(q) ||
          (exp.host?.name && exp.host.name.toLowerCase().includes(q)) ||
          (exp.city?.name && exp.city.name.toLowerCase().includes(q))
      );
    }

    // 2. City Filter
    if (selectedCityId !== 'all') {
      result = result.filter((exp) => exp.city?.id === selectedCityId);
    }

    // 3. Category Filter
    if (selectedCategoryId !== 'all') {
      result = result.filter((exp) => exp.category?.id === selectedCategoryId);
    }

    // 4. Sorting
    result.sort((a, b) => {
      if (sortBy === 'rating') {
        return b.ratingAverage - a.ratingAverage || b.reviewsCount - a.reviewsCount;
      }
      if (sortBy === 'price_low') {
        return a.packagePrice - b.packagePrice;
      }
      if (sortBy === 'price_high') {
        return b.packagePrice - a.packagePrice;
      }
      // default: newest
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [initialExperiences, searchQuery, selectedCityId, selectedCategoryId, sortBy]);

  const visibleExperiences = filteredExperiences.slice(0, visibleCount);
  const remainingCount = Math.max(0, filteredExperiences.length - visibleCount);

  const handleCategoryChange = (catId: number | 'all', catName?: string) => {
    setSelectedCategoryId(catId);
    setVisibleCount(9);

    const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
    if (catId === 'all') {
      params.delete('category');
      params.delete('cat');
    } else {
      const slugVal = catName
        ? catName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        : String(catId);
      params.set('category', slugVal);
      params.delete('cat');
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCityId('all');
    setSelectedCategoryId('all');
    setSortBy('newest');
    setVisibleCount(9);
    router.push(pathname, { scroll: false });
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      {/* 1. Header Section */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold shadow-2xs">
          <Compass className="w-3.5 h-3.5 text-brand-600" />
          <span>{isId ? 'Katalog Pengalaman Lokal Autentik' : 'Authentic Local Experiences'}</span>
        </div>
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
          {isId ? 'Jelajahi Pengalaman Lokal Autentik' : 'Explore Authentic Local Experiences'}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
          {isId
            ? 'Temukan tur privat terkurasi bersama pemandu lokal berpengetahuan luas. Tarif flat per rombongan paket privat.'
            : 'Discover curated private tours hosted by passionate local guides. Flat rate per private group package.'}
        </p>
      </div>

      {/* 2. Bilah Pencarian & Filter */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
        {/* Row 1: Search text + City dropdown + Sort dropdown */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="sm:col-span-6 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setVisibleCount(9);
              }}
              placeholder={
                isId
                  ? 'Cari judul tur, nama pemandu, atau destinasi...'
                  : 'Search tour title, host name, or spots...'
              }
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 min-h-[44px]"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Filter Kota */}
          <div className="sm:col-span-3">
            <select
              value={selectedCityId}
              onChange={(e) => {
                const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                setSelectedCityId(val);
                setVisibleCount(9);
              }}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 appearance-none min-h-[44px] cursor-pointer"
            >
              <option value="all">{isId ? 'Semua Kota' : 'All Cities'}</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}{city.country_name ? `, ${city.country_name}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown Pengurutan */}
          <div className="sm:col-span-3">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as any);
                setVisibleCount(9);
              }}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 appearance-none min-h-[44px] cursor-pointer font-medium"
            >
              <option value="newest">{isId ? 'Terbaru' : 'Newest'}</option>
              <option value="rating">{isId ? 'Rating Tertinggi' : 'Highest Rated'}</option>
              <option value="price_low">{isId ? 'Harga Paket Terendah' : 'Lowest Package Price'}</option>
              <option value="price_high">{isId ? 'Harga Paket Tertinggi' : 'Highest Package Price'}</option>
            </select>
          </div>
        </div>

        {/* Row 2: Pill Kategori Horizontal Scroll */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
          <button
            type="button"
            onClick={() => handleCategoryChange('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer min-h-[38px] ${
              selectedCategoryId === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {isId ? '✨ Semua Kategori' : '✨ All Categories'}
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.id, cat.name)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer min-h-[38px] ${
                  isSelected
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Grid Kartu Tur (Experience Cards Grid) */}
      {filteredExperiences.length === 0 ? (
        /* Empty State */
        <div className="p-8 sm:p-14 text-center rounded-3xl bg-white border border-dashed border-slate-200 space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-sm mx-auto">
            <h3 className="font-serif font-bold text-base sm:text-lg text-slate-900">
              {isId ? 'Tidak Ada Pengalaman yang Cocok' : 'No Experiences Found'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              {isId
                ? 'Coba ubah kata kunci pencarian, pilih kota lain, atau reset filter untuk melihat semua tur.'
                : 'Try adjusting your search terms, select another city, or reset filters to see all tours.'}
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition min-h-[44px] cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{isId ? 'Reset Semua Filter' : 'Reset Filters'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
            <span>
              {isId
                ? `Menampilkan ${visibleExperiences.length} dari ${filteredExperiences.length} paket tur`
                : `Showing ${visibleExperiences.length} of ${filteredExperiences.length} tour packages`}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleExperiences.map((exp) => (
              <div
                key={exp.id}
                className="group rounded-3xl bg-white border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-lg hover:border-brand-200 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Thumbnail Cover */}
                  <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
                    <ExperienceCardThumbnail
                      src={exp.coverImage}
                      alt={exp.title}
                    />

                    {/* Badge Kategori & Lokasi */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                      {exp.category && (
                        <span className="px-3 py-1 rounded-full bg-black/60 text-white text-[10px] font-bold backdrop-blur-xs shadow-xs">
                          {exp.category.name}
                        </span>
                      )}

                      {exp.city && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 text-slate-900 text-[10px] font-bold backdrop-blur-xs shadow-xs">
                          <MapPin className="w-3 h-3 text-brand-600" />
                          <span>{exp.city.name}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    {/* Judul Pengalaman */}
                    <Link
                      href={`/${locale}/experiences/${exp.slug || exp.id}`}
                      className="block group-hover:text-brand-600 transition"
                    >
                      <h3 className="font-bold text-base sm:text-lg text-slate-900 line-clamp-2 leading-snug">
                        {exp.title}
                      </h3>
                    </Link>

                    {/* Host Profile Info */}
                    {exp.host && (
                      <div className="flex items-center gap-2.5 pt-1">
                        <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                          <ExperienceHostAvatar
                            src={exp.host.avatar_url}
                            alt={exp.host.name}
                          />
                        </div>
                        <div className="min-w-0 flex items-center gap-1.5 text-xs text-slate-600">
                          <span className="truncate font-semibold text-slate-800">{exp.host.name}</span>
                          {(exp.host.is_verified || exp.host.is_trusted) && (
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          )}
                        </div>
                      </div>
                    )}

                    {/* Metrik Tur: Durasi & Maks Tamu */}
                    <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatExperienceDuration(exp.durationHours, isId ? 'id' : 'en')}</span>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{isId ? `Maks. ${exp.maxParticipants} orang` : `Max. ${exp.maxParticipants} guests`}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Kartu: Rating & Tarif Flat Paket */}
                <div className="p-5 pt-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                  {/* Rating */}
                  <div className="flex items-center gap-1 text-xs">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-slate-900">
                      {exp.ratingAverage > 0 ? exp.ratingAverage.toFixed(1) : '-'}
                    </span>
                    <span className="text-slate-400">
                      ({exp.reviewsCount})
                    </span>
                  </div>

                  {/* Tarif Flat Paket */}
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-tight">
                      {isId ? 'Tarif Paket Privat' : 'Private Package Rate'}
                    </span>
                    <div className="text-base font-black text-amber-600">
                      {formatPrice(exp.packagePrice, exp.currency || 'USD')}{' '}
                      <span className="text-[10px] font-semibold text-slate-500">
                        {isId ? '/ paket' : '/ package'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Paginasi Bertahap (Load More Button) */}
          {remainingCount > 0 && (
            <div className="pt-4 text-center">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + STEP)}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm font-bold shadow-xs transition min-h-[44px] cursor-pointer"
              >
                {isId
                  ? `Muat Lebih Banyak Tur (${remainingCount} tersisa)`
                  : `Load More Tours (${remainingCount} remaining)`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const DEFAULT_EXPERIENCE_IMAGE =
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80';
const LOCAL_FALLBACK_IMAGE = '/images/placeholder-experience.jpg';
const DEFAULT_HOST_AVATAR = '/images/default-avatar.png';

function ExperienceCardThumbnail({ src, alt }: { src: string | null; alt: string }) {
  const initial = getPublicImageUrl(src, 'experiences', {
    fallbackUrl: DEFAULT_EXPERIENCE_IMAGE,
  });
  const [imgSrc, setImgSrc] = useState<string>(initial);

  useEffect(() => {
    setImgSrc(
      getPublicImageUrl(src, 'experiences', {
        fallbackUrl: DEFAULT_EXPERIENCE_IMAGE,
      })
    );
  }, [src]);

  return (
    <img
      src={imgSrc}
      alt={alt}
      onError={() => {
        if (imgSrc !== DEFAULT_EXPERIENCE_IMAGE && imgSrc !== LOCAL_FALLBACK_IMAGE) {
          setImgSrc(DEFAULT_EXPERIENCE_IMAGE);
        } else if (imgSrc === DEFAULT_EXPERIENCE_IMAGE) {
          setImgSrc(LOCAL_FALLBACK_IMAGE);
        }
      }}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      loading="lazy"
    />
  );
}

function ExperienceHostAvatar({ src, alt }: { src: string | null | undefined; alt: string }) {
  const initial = getPublicImageUrl(src, 'users');
  const [avatarSrc, setAvatarSrc] = useState<string>(initial);

  useEffect(() => {
    setAvatarSrc(getPublicImageUrl(src, 'users'));
  }, [src]);

  return (
    <img
      src={avatarSrc}
      alt={alt}
      onError={() => {
        if (avatarSrc !== DEFAULT_HOST_AVATAR) {
          setAvatarSrc(DEFAULT_HOST_AVATAR);
        }
      }}
      className="w-full h-full object-cover"
      loading="lazy"
    />
  );
}
