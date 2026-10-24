'use client';

import React from 'react';
import Link from 'next/link';
import { Locale } from '@/lib/i18n';
import { Dictionary } from '@/lib/dictionary';
import { MapPin, Compass } from 'lucide-react';
import { getPublicImageUrl } from '@/lib/images';

export interface PopularCityItem {
  id: number;
  name: string;
  image_url: string | null;
  slug?: string;
  _count: {
    experiences: number;
    vibes_travel_meetups: number;
  };
}

interface PopularDestinationsProps {
  cities: PopularCityItem[];
  locale: Locale;
  dict: Dictionary;
}

export function PopularDestinations({
  cities,
  locale,
  dict,
}: PopularDestinationsProps) {
  if (!cities || cities.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 sm:mt-14">
      {/* Header Seksi */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-7 gap-3">
        <div>
          <div className="flex items-center gap-2 text-violet-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Compass className="w-4 h-4" />
            <span>{dict.common?.featured || 'Destinasi Unggulan'}</span>
          </div>
          <h2 className="heading-h2 text-slate-900">
            {dict.home?.popularDestinationsTitle || 'Jelajahi Kota Terpopuler'}
          </h2>
          <p className="text-body text-slate-500 mt-1">
            {dict.home?.popularDestinationsSub ||
              'Destinasi favorit pelancong dengan kurasi aktivitas dan komunitas lokal teraktif'}
          </p>
        </div>

        <Link
          href={`/${locale}/experiences`}
          className="text-xs font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1 shrink-0 group self-start md:self-auto"
        >
          <span>{dict.home?.allExperiences || 'Lihat Semua'}</span>
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      </div>

      {/* Grid Desktop 4 Kolom & Horizontal Scroll Mobile (snap-x snap-mandatory di mobile, grid col-2 md:col-3 lg:col-4 di tablet & desktop) */}
      <div className="w-full overflow-x-auto snap-x snap-mandatory gap-4 pb-4 no-scrollbar flex sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:overflow-visible scroll-smooth">
        {cities.map((city) => {
          // Buat slug aman (cth: "Bali Denpasar" -> "bali-denpasar")
          const citySlug = city.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
          const href = `/${locale}/destination/${citySlug}`;

          // Resolusi gambar kota terpusat
          const cityImage = getPublicImageUrl(city.image_url, 'cities');

          const expCount = city._count.experiences;
          const meetupCount = city._count.vibes_travel_meetups;

          return (
            <Link
              key={city.id}
              href={href}
              className="group min-w-[240px] snap-center h-52 sm:min-w-0 sm:h-60 rounded-2xl overflow-hidden relative block shadow-md hover:shadow-xl transition-all duration-300 shrink-0 bg-slate-900"
            >
              {/* Foto Landmark Kota dengan Zoom Lembut dalam Tag Semantik figure */}
              <figure className="relative w-full h-full m-0">
                <img
                  src={cityImage}
                  alt={city.name}
                  width={400}
                  height={240}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/default.jpg';
                  }}
                />

                <figcaption className="sr-only">
                  Eksplorasi destinasi wisata otentik di {city.name} bersama pemandu Locallytrip
                </figcaption>
              </figure>

              {/* Lapisan Gradasi Gelap Transparan */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent transition-opacity" />

              {/* Badge Pin di Pojok Atas */}
              <div className="absolute top-3 left-3 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1 text-white text-[11px] font-medium border border-white/20">
                <MapPin className="w-3 h-3 text-violet-300" />
                <span>Indonesia</span>
              </div>

              {/* Informasi di Sudut Bawah Kartu */}
              <div className="absolute bottom-3.5 left-4 right-4">
                <h3 className="heading-h3 text-white group-hover:text-violet-300 transition duration-200 truncate">
                  {city.name}
                </h3>
                <p className="text-xs text-slate-200 mt-0.5 font-medium flex items-center gap-1.5">
                  <span>
                    {expCount} {dict.home?.activitiesLabel || 'Aktivitas'}
                  </span>
                  {meetupCount > 0 && (
                    <>
                      <span className="text-slate-400">•</span>
                      <span>
                        {meetupCount} {dict.home?.meetupsLabel || 'Meetup'}
                      </span>
                    </>
                  )}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
