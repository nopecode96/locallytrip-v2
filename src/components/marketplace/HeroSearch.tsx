'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, MapPin, X } from 'lucide-react';
import { Dictionary } from '@/lib/dictionary';
import { Locale } from '@/lib/i18n';

interface HeroSearchProps {
  locale: Locale;
  initialQuery?: string;
  initialCategory?: string;
  cities: { id: number; name: string }[];
  dict?: Dictionary;
}

export function HeroSearch({
  locale,
  initialQuery = '',
  cities = [],
  dict,
}: HeroSearchProps) {
  const router = useRouter();
  const [destination, setDestination] = useState(initialQuery);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Rekomendasi kota populer
  const popularCities = ['Bali', 'Bandung', 'Yogyakarta', 'Labuan Bajo'];

  // Filter kota berdasarkan input
  const filteredCities = destination.trim()
    ? cities.filter((c) =>
        c.name.toLowerCase().includes(destination.trim().toLowerCase())
      )
    : cities.slice(0, 6);

  const handleSearch = (selectedQuery?: string) => {
    const query = (selectedQuery !== undefined ? selectedQuery : destination).trim();
    setIsOpen(false);
    if (query) {
      router.push(`/${locale}/experiences?search=${encodeURIComponent(query)}`);
    } else {
      router.push(`/${locale}/experiences`);
    }
  };

  const handleSelectCity = (cityName: string) => {
    setDestination(cityName);
    setIsOpen(false);
    router.push(`/${locale}/experiences?search=${encodeURIComponent(cityName)}`);
  };

  // Close dropdown when clicked outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const placeholderText =
    dict?.home?.searchWherePlaceholder ||
    'Mau ke mana? (cth: Bali, Bandung, Yogyakarta...)';
  const searchBtnText = dict?.home?.searchWhereBtn || 'Cari';
  const popularLabel = dict?.home?.popular || 'Populer';

  return (
    <div className="w-full max-w-full relative" ref={dropdownRef}>
      {/* 1. Single Clean Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
        className="relative flex items-center bg-white rounded-2xl border border-slate-200/90 shadow-lg shadow-purple-950/5 hover:border-violet-300 focus-within:border-violet-500 focus-within:ring-4 focus-within:ring-violet-500/10 p-1.5 sm:p-2 transition-all duration-200 w-full max-w-full"
      >
        <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0 text-violet-600 ml-1">
          <MapPin className="w-5 h-5 stroke-[2.2]" />
        </div>

        <input
          type="text"
          value={destination}
          onChange={(e) => {
            setDestination(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholderText}
          className="w-full bg-transparent px-3 text-slate-800 placeholder-slate-400 text-sm sm:text-base font-semibold focus:outline-none"
        />

        {destination && (
          <button
            type="button"
            onClick={() => {
              setDestination('');
              setIsOpen(false);
            }}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition mr-1"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <button
          type="submit"
          className="shrink-0 bg-violet-600 hover:bg-violet-700 active:scale-95 text-white font-bold text-sm px-5 sm:px-6 py-3 rounded-xl transition-all duration-200 shadow-md shadow-violet-500/25 flex items-center gap-1.5"
        >
          <Search className="w-4 h-4 stroke-[2.5]" />
          <span>{searchBtnText}</span>
        </button>
      </form>

      {/* 2. Autocomplete Dropdown List */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-100 shadow-2xl shadow-purple-950/15 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {dict?.search?.destination || 'Destinasi Terverifikasi'}
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-slate-50">
            {filteredCities.length > 0 ? (
              filteredCities.map((city) => (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => handleSelectCity(city.name)}
                  className="w-full text-left px-4 py-2.5 hover:bg-violet-50/70 flex items-center justify-between text-sm transition"
                >
                  <span className="font-semibold text-slate-700 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-violet-500" />
                    {city.name}
                  </span>
                  <span className="text-xs text-slate-400 font-normal">Indonesia</span>
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-xs text-slate-400">
                Tekan <strong>{searchBtnText}</strong> untuk mencari &ldquo;{destination}&rdquo;
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Teks Tag Rekomendasi Cepat Populer */}
      <div className="mt-3 flex items-center flex-wrap gap-2 text-xs">
        <span className="font-bold text-slate-400 text-[11px] uppercase tracking-wider">
          {popularLabel}:
        </span>
        {popularCities.map((cityName, idx) => (
          <React.Fragment key={cityName}>
            <button
              type="button"
              onClick={() => handleSelectCity(cityName)}
              className="font-semibold text-slate-600 hover:text-violet-600 hover:underline transition cursor-pointer"
            >
              {cityName}
            </button>
            {idx < popularCities.length - 1 && (
              <span className="text-slate-300">•</span>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* 4. Kapsul Kategori Cepat (Quick Category Pills) */}
      <div className="mt-3.5 mb-2 lg:mb-4 flex items-center flex-wrap gap-2">
        <Link
          href={`/${locale}/experiences?category=local-guide`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 border border-slate-200/90 hover:border-violet-500 hover:bg-violet-50 text-slate-700 hover:text-violet-700 text-xs font-semibold shadow-2xs transition-all"
        >
          <span>🧭</span>
          <span>{locale === 'id' ? 'Pemandu Lokal' : 'Local Guide'}</span>
        </Link>
        <Link
          href={`/${locale}/experiences?category=photographer`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 border border-slate-200/90 hover:border-violet-500 hover:bg-violet-50 text-slate-700 hover:text-violet-700 text-xs font-semibold shadow-2xs transition-all"
        >
          <span>📸</span>
          <span>{locale === 'id' ? 'Fotografer' : 'Photographer'}</span>
        </Link>
        <Link
          href={`/${locale}/experiences?category=trip-planner`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 border border-slate-200/90 hover:border-violet-500 hover:bg-violet-50 text-slate-700 hover:text-violet-700 text-xs font-semibold shadow-2xs transition-all"
        >
          <span>🗺️</span>
          <span>{locale === 'id' ? 'Perancang Liburan' : 'Trip Planner'}</span>
        </Link>
        <Link
          href={`/${locale}/experiences?category=combo`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 border border-slate-200/90 hover:border-violet-500 hover:bg-violet-50 text-slate-700 hover:text-violet-700 text-xs font-semibold shadow-2xs transition-all"
        >
          <span>✨</span>
          <span>Combo</span>
        </Link>
        <Link
          href={`/${locale}/experiences?category=wellness`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 border border-slate-200/90 hover:border-violet-500 hover:bg-violet-50 text-slate-700 hover:text-violet-700 text-xs font-semibold shadow-2xs transition-all"
        >
          <span>🧘</span>
          <span>Wellness</span>
        </Link>
      </div>
    </div>
  );
}
