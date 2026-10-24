'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  ChevronRight,
  Sparkles,
  MapPin,
  Star,
  CheckCircle2,
  Compass,
  ArrowRight,
  Flame,
  Coffee,
  Sun,
  Palette,
  UtensilsCrossed,
  ChevronDown,
  HelpCircle,
} from 'lucide-react';
import { Dictionary } from '@/lib/dictionary';
import { Locale } from '@/lib/i18n';
import { resolveAvatarUrl } from '@/lib/avatar';
import { UserAvatar } from '@/components/common/UserAvatar';
import { getPublicImageUrl } from '@/lib/images';

export interface ExploreCityItem {
  id: number;
  name: string;
  country_name?: string | null;
  country_code?: string | null;
  image_url: string | null;
  slug?: string;
  _count: {
    experiences: number;
    vibes_travel_meetups: number;
    stories: number;
  };
}

export interface ExploreHostItem {
  id: number;
  name: string;
  username: string | null;
  avatar_url: string | null;
  is_verified: boolean | null;
  bio: string | null;
  city_name: string;
  rating_average: number;
  rating_count: number;
  specialty?: string;
}

interface ExploreClientProps {
  cities: ExploreCityItem[];
  hosts: ExploreHostItem[];
  locale: Locale;
  dict: Dictionary;
}

export function ExploreClient({
  cities,
  hosts,
  locale,
  dict,
}: ExploreClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCitiesCount, setVisibleCitiesCount] = useState(8);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const t = dict.explore_page || {
    badge: '📍 EKSPLORASI KOTA & VIBES',
    title: 'Temukan Destinasi Impianmu',
    subtitle:
      'Jelajahi sudut otentik Indonesia melalui kurasi kota, rute rahasia, dan nuansa perjalanan yang tak terlupakan.',
    search_placeholder: 'Cari kota atau wilayah (cth: Bali, Bandung, Labuan Bajo...)',
    cities_title: 'Direktori Kota Terpopuler',
    cities_subtitle: 'Jelajahi kota-kota dengan aktivitas lokal dan komunitas traveler paling aktif.',
    vibes_title: 'Pilih Nuansa Perjalananmu',
    vibes_subtitle: 'Temukan pengalaman yang selaras dengan gaya petualanganmu.',
    hosts_title: 'Pemandu Lokal Berlisensi & Terpercaya',
    hosts_subtitle: 'Warga lokal yang terverifikasi identitas resmi (KYC) dan siap mengantar petualangan otentik.',
    host_verified_badge: 'KYC Verified Local Guides',
    btn_view_host_tours: 'Lihat Profil Pemandu',
    btn_view_host_profile: 'Lihat Profil Pemandu',
    faq_badge: '💡 Tanya Jawab Seputar Destinasi',
    faq_title: 'Panduan Memilih Destinasi & Pemandu Lokal',
    faq_subtitle: 'Informasi penting untuk membantu Anda merencanakan petualangan otentik dan aman di Indonesia.',
    breadcrumb_home: 'Beranda',
    breadcrumb_explore: 'Eksplorasi Destinasi',
    section_cities_title: 'Direktori Kota Terpopuler',
    section_cities_sub: 'Jelajahi kota-kota dengan aktivitas lokal dan komunitas traveler paling aktif.',
    section_vibes_title: 'Pilih Nuansa Perjalananmu',
    section_vibes_sub: 'Temukan pengalaman yang selaras dengan suasana hati dan gaya petualangan Anda.',
    section_hosts_title: 'Pemandu Lokal Berlisensi & Terpercaya',
    section_hosts_sub: 'Warga lokal yang terverifikasi identitas resmi (KYC) dan siap mengantar petualangan otentik.',
    activities: 'Aktivitas',
    meetups: 'Meetup',
    verified_badge: 'Terverifikasi',
    view_city: 'Lihat Destinasi',
    view_activities: 'Jelajahi Aktivitas',
    empty_cities: 'Belum ada kota yang cocok dengan pencarian Anda.',
    load_more_cities: 'Muat Kota Lainnya ({count} tersisa)',
  };

  // Filter kota berdasarkan pencarian (nama kota maupun negara)
  const filteredCities = cities.filter((city) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      city.name.toLowerCase().includes(q) ||
      (city.country_name && city.country_name.toLowerCase().includes(q)) ||
      (city.country_code && city.country_code.toLowerCase().includes(q))
    );
  });

  const displayedCities = filteredCities.slice(0, visibleCitiesCount);
  const remainingCities = Math.max(0, filteredCities.length - visibleCitiesCount);

  // Kurasi Nuansa Perjalanan (Curated Vibes)
  const curatedVibes = [
    {
      id: 'nature',
      title: 'Hidden Nature & Treks',
      desc: 'Air terjun tersembunyi, hutan pinus, dan puncak sunyi',
      tag: 'nature',
      icon: Compass,
      image: '/images/hero/destinasi-hero.jpg',
      color: 'from-emerald-950/80 via-emerald-900/40 to-transparent',
      badgeColor: 'bg-emerald-500/80 text-white',
    },
    {
      id: 'heritage',
      title: 'Heritage & Coffee Trails',
      desc: 'Rute kota tua, kedai kopi legendaris, dan narasi lokal',
      tag: 'culture',
      icon: Coffee,
      image: '/images/hero/labuan-bajo.jpg',
      color: 'from-amber-950/80 via-amber-900/40 to-transparent',
      badgeColor: 'bg-amber-500/80 text-white',
    },
    {
      id: 'coastal',
      title: 'Coastal Sunsets & Waves',
      desc: 'Pesisir eksotis, padel pantai, dan momen senja magis',
      tag: 'nature',
      icon: Sun,
      image: '/images/experiences/surfing-bali.jpg',
      color: 'from-orange-950/80 via-orange-900/40 to-transparent',
      badgeColor: 'bg-orange-500/80 text-white',
    },
    {
      id: 'artisan',
      title: 'Artisan & Cultural Soul',
      desc: 'Workshop batik, pahat kayu, dan sanggar seni warga',
      tag: 'culture',
      icon: Palette,
      image: '/images/experiences/batik-jogja.jpg',
      color: 'from-purple-950/80 via-purple-900/40 to-transparent',
      badgeColor: 'bg-violet-500/80 text-white',
    },
    {
      id: 'food',
      title: 'Midnight Street Food',
      desc: 'Jalur kuliner pasar malam dan warung resep turun-temurun',
      tag: 'food',
      icon: UtensilsCrossed,
      image: '/images/experiences/kuliner-bandung.jpg',
      color: 'from-rose-950/80 via-rose-900/40 to-transparent',
      badgeColor: 'bg-rose-500/80 text-white',
    },
  ];

  return (
    <div className="w-full">
      {/* 1. Breadcrumb Visual */}
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs font-medium text-slate-500">
        <Link
          href={`/${locale}`}
          className="hover:text-violet-600 transition flex items-center gap-1 text-slate-600"
        >
          {t.breadcrumb_home}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
        <span className="text-violet-700 font-semibold">{t.breadcrumb_explore}</span>
      </nav>

      {/* 2. Header & Search Bar Destinasi (2 Kolom di Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-12 sm:mb-14">
        {/* Kolom Kiri: Teks & Search Bar */}
        <div className="lg:col-span-7 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-semibold shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 fill-violet-600 text-violet-600" />
            <span>{t.badge}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-purple-950 tracking-tight leading-tight">
            {t.title}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
            {t.subtitle}
          </p>

          {/* Search Bar Lokasi Responsif */}
          <div className="pt-2 w-full max-w-xl">
            <div className="relative flex items-center bg-white rounded-2xl border border-slate-200/90 shadow-md shadow-purple-950/5 hover:border-violet-300 focus-within:border-violet-500 focus-within:ring-4 focus-within:ring-violet-500/10 p-2 transition-all">
              <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0 text-violet-600 ml-1">
                <MapPin className="w-5 h-5 stroke-[2.2]" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.search_placeholder}
                className="w-full bg-transparent px-3 text-slate-800 placeholder-slate-400 text-sm sm:text-base font-semibold focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 font-bold"
                >
                  ✕
                </button>
              )}
              <div className="p-2 text-slate-400">
                <Search className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Visual Hero Ilustrasi Travel */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end">
          <div className="relative w-full max-w-xs sm:max-w-sm lg:max-w-md flex justify-center lg:justify-end">
            <Image
              src="/images/explore/hero-luggage.png"
              width={500}
              height={500}
              alt="Explore Authentic Indonesia"
              priority
              className="w-auto h-52 max-h-56 sm:h-80 sm:max-h-80 lg:h-96 lg:max-h-96 object-contain drop-shadow-xl select-none pointer-events-none"
            />
          </div>
        </div>
      </div>

      {/* 3. Seksi 1: Direktori Kota Terpopuler (Grid 4 Kolom) */}
      <section className="mb-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-2">
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
              {t.cities_title || t.section_cities_title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {t.cities_subtitle || t.section_cities_sub}
            </p>
          </div>
        </div>

        {displayedCities.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayedCities.map((city) => {
                const citySlug = city.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
                const cityImage = getPublicImageUrl(city.image_url, 'cities');

                return (
                  <Link
                    key={city.id}
                    href={`/${locale}/destination/${citySlug}`}
                    className="group h-64 rounded-2xl overflow-hidden relative block shadow-md hover:shadow-xl transition-all duration-300 shrink-0 bg-slate-900"
                  >
                    <figure className="relative w-full h-full m-0">
                      <img
                        src={cityImage}
                        alt={city.name}
                        width={400}
                        height={260}
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
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent transition-opacity" />

                    {/* Badge Pin di Pojok Atas */}
                    <div className="absolute top-3.5 left-3.5 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1 text-white text-[11px] font-medium border border-white/20">
                      <MapPin className="w-3 h-3 text-violet-300" />
                      <span>{city.country_name || 'Indonesia'}</span>
                    </div>

                    {/* Informasi di Sudut Bawah Kartu */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-xl font-bold text-white group-hover:text-violet-300 transition duration-200 truncate">
                        {city.name}
                      </h3>
                      <p className="text-xs text-slate-200 mt-1 font-medium flex items-center flex-wrap gap-1.5">
                        {city._count.experiences > 0 && (
                          <span>
                            {city._count.experiences} {t.activities}
                          </span>
                        )}
                        {city._count.vibes_travel_meetups > 0 && (
                          <>
                            {city._count.experiences > 0 && <span className="text-slate-400">•</span>}
                            <span>
                              {city._count.vibes_travel_meetups} {t.meetups}
                            </span>
                          </>
                        )}
                        {city._count.stories > 0 && (
                          <>
                            {(city._count.experiences > 0 || city._count.vibes_travel_meetups > 0) && (
                              <span className="text-slate-400">•</span>
                            )}
                            <span>
                              {city._count.stories} {t.stories || 'Cerita'}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Tombol Load More Kota */}
            {remainingCities > 0 && (
              <button
                type="button"
                onClick={() => setVisibleCitiesCount((prev) => prev + 8)}
                className="mt-8 mx-auto flex items-center justify-center px-8 py-3.5 rounded-full bg-violet-600 hover:bg-violet-700 text-white font-medium text-sm sm:text-base shadow-lg shadow-violet-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                {(t.load_more_cities || 'Muat Kota Lainnya ({count} tersisa)').replace(
                  '{count}',
                  remainingCities.toString()
                )}
              </button>
            )}
          </>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 p-6">
            <p className="text-sm text-slate-500">{t.empty_cities}</p>
          </div>
        )}
      </section>

      {/* 4. Seksi 2: Jelajahi Berdasarkan Nuansa (Curated Vibes) */}
      <section className="mb-16">
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold mb-2">
            <Flame className="w-3.5 h-3.5 text-purple-600" />
            <span>Curated Atmosphere</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
            {t.vibes_title || t.section_vibes_title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t.vibes_subtitle || t.section_vibes_sub}
          </p>
        </div>

        {/* 5 Visual Collection Cards (Horizontal scroll di mobile, 3/5 grid di desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {curatedVibes.map((vibe) => {
            const Icon = vibe.icon;
            return (
              <Link
                key={vibe.id}
                href={`/${locale}/experiences?cat=${vibe.tag}`}
                className="group relative h-72 rounded-2xl overflow-hidden block shadow-sm hover:shadow-xl transition-all duration-300 bg-slate-900 border border-slate-100"
              >
                <img
                  src={vibe.image}
                  alt={vibe.title}
                  width={300}
                  height={300}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out opacity-85"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/hero/destinasi-hero.jpg';
                  }}
                />

                {/* Gradient Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-t ${vibe.color}`} />

                {/* Badge Icon */}
                <div className="absolute top-3.5 left-3.5">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-md shadow-xs ${vibe.badgeColor}`}>
                    <Icon className="w-3.5 h-3.5" />
                    <span>Vibe</span>
                  </span>
                </div>

                {/* Content */}
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-lg font-bold text-white group-hover:text-violet-200 transition">
                    {vibe.title}
                  </h3>
                  <p className="text-xs text-slate-200/90 mt-1 line-clamp-2 leading-relaxed">
                    {vibe.desc}
                  </p>
                  <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-violet-300 group-hover:translate-x-1 transition-transform">
                    <span>{t.view_activities}</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 5. Seksi 3: Pemandu Lokal Unggulan (Top Verified Hosts) */}
      <section className="mb-8">
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-semibold mb-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-violet-600" />
            <span>{t.host_verified_badge || 'KYC Verified Local Guides'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
            {t.hosts_title || t.section_hosts_title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t.hosts_subtitle || t.section_hosts_sub}
          </p>
        </div>

        {/* Grid Host Cards (4 Kolom di Desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {hosts.map((host) => {
            const avatar = resolveAvatarUrl(host.avatar_url);
            const profileUrl = `/${locale}/profile/${host.username || host.id}`;

            return (
              <div
                key={host.id}
                className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-xl hover:border-violet-200 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-3.5">
                    <Link href={profileUrl} className="relative shrink-0 block group">
                      <div className="relative shrink-0">
                        <UserAvatar
                          src={host.avatar_url}
                          name={host.name}
                          size={48}
                          className="border border-violet-100 group-hover:ring-2 group-hover:ring-violet-500 transition-all"
                        />
                        {host.is_verified && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-white absolute -bottom-0.5 -right-0.5 z-10" />
                        )}
                      </div>
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link href={profileUrl} className="hover:text-violet-700 transition">
                        <h4 className="text-sm font-bold text-slate-900 truncate hover:text-violet-700 transition">
                          {host.name}
                        </h4>
                      </Link>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-violet-600 shrink-0" />
                        <span className="truncate">{host.city_name}</span>
                      </p>
                      {host.rating_count > 0 ? (
                        <div className="flex items-center gap-1 text-xs text-amber-500 font-bold mt-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{host.rating_average.toFixed(1)}</span>
                          <span className="text-slate-400 font-normal text-[11px]">
                            ({host.rating_count})
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-1">
                          <Star className="w-3 h-3 fill-emerald-500 text-emerald-500" />
                          <span>{locale === 'id' ? 'Pemandu Baru' : 'New Guide'}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 mt-3.5 line-clamp-2 leading-relaxed">
                    {host.bio || `Pemandu spesialis rute lokal otentik di ${host.city_name}.`}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <Link
                    href={profileUrl}
                    className="w-full text-center py-2 px-3 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-bold transition block"
                  >
                    {t.btn_view_host_profile || t.btn_view_host_tours || 'Lihat Profil Pemandu'}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. Seksi Tanya Jawab Ringkas Destinasi (Model Accordion Interaktif) */}
      <section className="w-full mt-16 pt-10 border-t border-slate-200/80">
        <div className="w-full mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-semibold mb-2">
            <span>{dict.explore_faq?.badge || t.faq_badge || '💡 Tanya Jawab Seputar Destinasi'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
            {dict.explore_faq?.title || t.faq_title || 'Panduan Memilih Destinasi & Pemandu Lokal'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {dict.explore_faq?.subtitle ||
              t.faq_subtitle ||
              'Informasi penting untuk membantu Anda merencanakan petualangan otentik dan aman di Indonesia.'}
          </p>
        </div>

        <div className="w-full space-y-4">
          {(
            dict.explore_faq?.items || [
              {
                q: 'Bagaimana cara memilih kota tujuan dan aktivitas lokal yang tepat?',
                a: 'Anda dapat memanfaatkan fitur filter pencarian berdasarkan direktori kota terpopuler atau menelusuri nuansa perjalanan (Curated Vibes) seperti alam tersembunyi, budaya, atau kuliner malam. Setiap kartu destinasi menampilkan jumlah aktivitas aktif dan agenda meetup yang sedang berlangsung.',
              },
              {
                q: 'Apakah pemandu lokal di setiap kota telah terverifikasi resmi?',
                a: 'Ya, seluruh pemandu lokal (Host) unggulan di Locallytrip wajib melewati verifikasi identitas resmi (KYC) pemerintah dan peninjauan profil. Verifikasi standar pemandu kami mengacu pada regulasi kepariwisataan berkelanjutan demi memastikan pengalaman perjalanan Anda berwawasan, otentik, dan aman.',
              },
              {
                q: 'Bagaimana sistem perlindungan dan keamanan pemesanan perjalanan?',
                a: 'Setiap transaksi pemesanan dilindungi sistem rekening penampung bersama (escrow). Dana Anda disimpan dengan aman dan baru diteruskan ke pemandu setelah agenda tur atau meetup terselenggara sesuai kesepakatan jadwal. Anda juga dapat berkoordinasi langsung dengan host melalui fitur pesan.',
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
