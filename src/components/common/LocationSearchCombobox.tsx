'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin, X, Loader2, ChevronDown } from 'lucide-react';

export interface LocationOption {
  id: number;
  name: string;
  countryName?: string;
  countryCode?: string;
  imageUrl?: string | null;
}

interface LocationSearchComboboxProps {
  value?: string;
  onChange: (locationName: string, locationOption?: LocationOption | null) => void;
  placeholder?: string;
  initialOptions?: LocationOption[];
  className?: string;
  inputClassName?: string;
  popoverClassName?: string;
}

export function LocationSearchCombobox({
  value = '',
  onChange,
  placeholder = 'Cari kota atau negara tujuan...',
  initialOptions = [],
  className = '',
  inputClassName = '',
  popoverClassName = '',
}: LocationSearchComboboxProps) {
  const [inputValue, setInputValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState<LocationOption[]>(initialOptions);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Fetch autocompletion results from /api/locations
  const fetchLocations = useCallback(async (query: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/locations?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setOptions(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch location autocomplete:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setIsOpen(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchLocations(val);
    }, 250);
  };

  const handleSelectOption = (opt: LocationOption) => {
    setInputValue(opt.name);
    setIsOpen(false);
    onChange(opt.name, opt);
  };

  const handleClear = () => {
    setInputValue('');
    setIsOpen(false);
    onChange('', null);
    if (initialOptions.length > 0) {
      setOptions(initialOptions);
    } else {
      fetchLocations('');
    }
  };

  const handleFocus = () => {
    setIsOpen(true);
    if (options.length === 0) {
      fetchLocations(inputValue);
    }
  };

  // Tutup dropdown jika klik di luar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  // Konversi kode negara 2-huruf ke emoji bendera (misal "ID" -> 🇮🇩)
  const getCountryFlagEmoji = (code?: string) => {
    if (!code || code.length !== 2) return '📍';
    const upper = code.toUpperCase();
    const codePoints = [...upper].map((c) => 127397 + c.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  return (
    <div ref={wrapperRef} className={`relative w-full ${className}`}>
      {/* Input Field dengan MapPin dan Clear Button */}
      <div className="relative flex items-center w-full">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-violet-600 pointer-events-none flex items-center justify-center">
          <MapPin className="w-4 h-4" />
        </div>

        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          className={`w-full pl-10 pr-16 py-2.5 bg-white rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition shadow-2xs ${inputClassName}`}
        />

        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isLoading && (
            <Loader2 className="w-4 h-4 text-violet-500 animate-spin mr-1" />
          )}

          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              aria-label="Bersihkan input lokasi"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setIsOpen(!isOpen);
              if (!isOpen && options.length === 0) fetchLocations(inputValue);
            }}
            className="p-1 text-slate-400 hover:text-slate-600 transition"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Popover Hasil Pencarian */}
      {isOpen && (
        <div
          className={`absolute z-50 left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200/90 shadow-xl shadow-purple-950/10 overflow-hidden max-h-72 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 ${popoverClassName}`}
        >
          {options.length === 0 && !isLoading ? (
            <div className="p-4 text-center text-xs text-slate-400">
              Tidak ada lokasi yang cocok dengan "{inputValue}"
            </div>
          ) : (
            <div className="py-1 divide-y divide-slate-100">
              {options.map((opt) => {
                const flag = getCountryFlagEmoji(opt.countryCode);
                const isSelected =
                  inputValue.toLowerCase() === opt.name.toLowerCase();

                return (
                  <button
                    key={`${opt.id}-${opt.name}`}
                    type="button"
                    onClick={() => handleSelectOption(opt)}
                    className={`w-full px-4 py-2.5 flex items-center justify-between text-left transition hover:bg-violet-50/70 group ${
                      isSelected ? 'bg-violet-50 text-violet-900 font-semibold' : 'text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-lg leading-none shrink-0" title={opt.countryName || 'Indonesia'}>
                        {flag}
                      </span>
                      <div className="truncate">
                        <span className="text-sm font-medium text-slate-900 group-hover:text-violet-900 block truncate">
                          {opt.name}
                        </span>
                        <span className="text-[11px] text-slate-400 group-hover:text-violet-600 block truncate">
                          {opt.countryName || 'Indonesia'}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-violet-600 opacity-0 group-hover:opacity-100 transition shrink-0 ml-2">
                      Pilih
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
