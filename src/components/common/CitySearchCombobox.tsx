'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MapPin, Search, ChevronDown, Check, X } from 'lucide-react';

export interface CityOption {
  id: number | string;
  name: string;
  image_url?: string | null;
  country_name?: string | null;
  country?: string | null;
  country_code?: string | null;
}

interface CitySearchComboboxProps {
  cities: CityOption[];
  value: number | string | '' | null;
  onChange: (cityId: number | '') => void;
  placeholder?: string;
  locale?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
}

export function CitySearchCombobox({
  cities,
  value,
  onChange,
  placeholder,
  locale = 'id',
  disabled = false,
  className = '',
  error = false,
}: CitySearchComboboxProps) {
  const isId = locale === 'id';
  const defaultPlaceholder = placeholder || (isId ? 'Cari & pilih kota...' : 'Search & select city...');

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Cari nama kota terpilih saat ini
  const selectedCity = useMemo(() => {
    if (!value) return null;
    return cities.find((c) => String(c.id) === String(value)) || null;
  }, [cities, value]);

  // Filter kota on-the-fly berdasarkan input pencarian (nama kota maupun nama negara)
  const filteredCities = useMemo(() => {
    if (!searchQuery.trim()) return cities;
    const q = searchQuery.toLowerCase().trim();
    return cities.filter((c) => {
      const cityName = (c.name || '').toLowerCase();
      const countryName = (c.country_name || c.country || '').toLowerCase();
      const countryCode = (c.country_code || '').toLowerCase();
      return cityName.includes(q) || countryName.includes(q) || countryCode.includes(q);
    });
  }, [cities, searchQuery]);

  // Reset highlight saat filtered list berubah
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredCities.length]);

  // Fokuskan input saat dropdown dibuka
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIdx = highlightedIndex + 1 < filteredCities.length ? highlightedIndex + 1 : 0;
      setHighlightedIndex(nextIdx);
      scrollHighlightedIntoView(nextIdx);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIdx = highlightedIndex - 1 >= 0 ? highlightedIndex - 1 : filteredCities.length - 1;
      setHighlightedIndex(prevIdx);
      scrollHighlightedIntoView(prevIdx);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCities[highlightedIndex]) {
        selectCity(filteredCities[highlightedIndex].id);
      }
    }
  };

  const scrollHighlightedIntoView = (index: number) => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll('li');
    const targetItem = items[index];
    if (targetItem) {
      targetItem.scrollIntoView({ block: 'nearest' });
    }
  };

  const selectCity = (cityId: number | string) => {
    onChange(typeof cityId === 'number' ? cityId : Number(cityId) || (cityId as any));
    setIsOpen(false);
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchQuery('');
  };

  // Render teks dengan highlight query
  const renderHighlightedText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-amber-100 text-amber-900 font-bold rounded-xs px-0.5">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Tombol Pemicu Combobox */}
      <div
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={disabled ? undefined : handleKeyDown}
        className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl border text-sm transition cursor-pointer select-none min-h-[44px] ${
          disabled
            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
            : error
            ? 'bg-red-50/40 border-red-300 text-slate-900 focus:ring-2 focus:ring-red-400/20'
            : isOpen
            ? 'bg-white border-orange-500 ring-2 ring-orange-500/20 shadow-xs'
            : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70 text-slate-900'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <MapPin
            className={`w-4 h-4 shrink-0 transition-colors ${
              selectedCity ? 'text-orange-600' : 'text-slate-400'
            }`}
          />
          {selectedCity ? (
            <span className="font-semibold text-slate-900 truncate">
              {selectedCity.name}
              {selectedCity.country_name || selectedCity.country
                ? `, ${selectedCity.country_name || selectedCity.country}`
                : ''}
            </span>
          ) : (
            <span className="text-slate-400 truncate">{defaultPlaceholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-2">
          {selectedCity && !disabled && (
            <button
              type="button"
              onClick={clearSelection}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
              aria-label={isId ? 'Hapus pilihan kota' : 'Clear city'}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-orange-600' : ''
            }`}
          />
        </div>
      </div>

      {/* Dropdown Menu & Search Input */}
      {isOpen && (
        <div
          className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-950/10 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          style={{ maxHeight: '340px' }}
        >
          {/* Input Pencarian Langsung */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50/70 sticky top-0 z-10">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isId ? 'Ketik nama kota atau negara (misal: Bandung, Indonesia)...' : 'Type city or country name...'}
                className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
              />
            </div>
          </div>

          {/* Daftar Kota */}
          <ul
            ref={listRef}
            role="listbox"
            className="overflow-y-auto max-h-56 py-1 divide-y divide-slate-50 focus:outline-none"
          >
            {filteredCities.length === 0 ? (
              <li className="px-4 py-6 text-center text-xs text-slate-400">
                {isId
                  ? `Tidak ada kota yang cocok dengan "${searchQuery}"`
                  : `No cities match "${searchQuery}"`}
              </li>
            ) : (
              filteredCities.map((city, idx) => {
                const isSelected = selectedCity?.id === city.id;
                const isHighlighted = highlightedIndex === idx;
                const countryDisplay = city.country_name || city.country;

                return (
                  <li
                    key={city.id}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => selectCity(Number(city.id))}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`px-3.5 py-2.5 flex items-center justify-between text-xs sm:text-sm cursor-pointer transition ${
                      isSelected
                        ? 'bg-orange-50 font-bold text-orange-950'
                        : isHighlighted
                        ? 'bg-slate-100/80 text-slate-900'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <MapPin
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isSelected ? 'text-orange-600' : 'text-slate-400'
                        }`}
                      />
                      <div className="flex items-center justify-between w-full min-w-0 gap-2">
                        <span className="font-medium text-slate-800 truncate">
                          {renderHighlightedText(city.name, searchQuery)}
                        </span>
                        {countryDisplay && (
                          <span className="text-xs text-slate-400 font-normal shrink-0">
                            {renderHighlightedText(countryDisplay, searchQuery)}
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-orange-600 shrink-0 ml-2" />
                    )}
                  </li>
                );
              })
            )}
          </ul>

          {/* Footer info total */}
          <div className="px-3.5 py-2 border-t border-slate-100 bg-slate-50/50 text-[11px] text-slate-400 flex items-center justify-between">
            <span>
              {filteredCities.length} {isId ? 'kota tersedia' : 'cities available'}
            </span>
            <span className="hidden sm:inline text-[10px] text-slate-400">
              {isId ? 'Gunakan ↑ ↓ Enter' : 'Use ↑ ↓ Enter'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
