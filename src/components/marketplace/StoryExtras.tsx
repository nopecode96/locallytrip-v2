'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  HelpCircle,
  ShieldCheck,
  Award,
  ExternalLink,
  MapPin,
  Clock,
  Coins,
  Compass,
} from 'lucide-react';
import { UserPersonaLink } from '@/components/common/UserPersonaLink';
import { FollowButton } from '@/components/shared/FollowButton';
import { resolveStoryImageUrl } from '@/lib/utils/media';

export interface AuthorOtherStoryItem {
  id: number;
  title: string;
  slug: string | null;
  cover_image: string | null;
  created_at?: string | Date;
  published_at?: string | Date | null;
}

interface AuthorBioProps {
  author: {
    id: number;
    name: string | null;
    username: string | null;
    avatar_url: string | null;
    bio: string | null;
    is_verified?: boolean | null;
    role?: string | null;
    level?: number;
    tierName?: string | null;
    tierBadgeIcon?: string | null;
  } | null;
  cityName?: string;
  lang: string;
  otherStories?: AuthorOtherStoryItem[];
  initialIsFollowing?: boolean;
  initialFollowersCount?: number;
}

export function AuthorBioCard({
  author,
  cityName,
  lang,
  otherStories = [],
  initialIsFollowing = false,
  initialFollowersCount,
}: AuthorBioProps) {
  const isEn = lang === 'en';
  const authorName = author?.name || author?.username || (isEn ? 'Local Insider' : 'Penulis Komunitas');
  const profileIdentifier = author?.username || author?.id || '1';
  const profileUrl = `/${lang}/users/${profileIdentifier}`;

  const tierBadgeText = author?.tierName
    ? `${author.tierBadgeIcon || '⚡'} ${author.tierName}`
    : `Lv.${author?.level || 1}`;

  return (
    <div className="w-full rounded-3xl border border-slate-200 bg-slate-50/80 p-6 sm:p-8 space-y-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          {author ? (
            <UserPersonaLink
              user={{
                id: author.id,
                name: author.name,
                username: author.username,
                avatar_url: author.avatar_url,
              }}
              locale={lang}
              variant="avatar-only"
              size="lg"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-slate-200" />
          )}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={profileUrl}
                className="text-base sm:text-lg font-bold text-slate-900 hover:text-purple-700 transition"
              >
                {authorName}
              </Link>
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200/60 shadow-xs">
                {tierBadgeText}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100/80">
                <Award className="w-3 h-3 text-emerald-600" />
                {author?.is_verified
                  ? isEn
                    ? 'Verified Local Insider & KYC Guide'
                    : 'Pemandu Otentik Terverifikasi KYC'
                  : isEn
                  ? 'Community Explorer'
                  : 'Penjelajah Komunitas'}
              </span>
              {cityName && (
                <span className="hidden sm:inline-flex items-center gap-1 text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {cityName}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tombol Aksi: Follow, Lihat Profil & Terhubung */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {author && author.id && (
            <FollowButton
              targetUserId={author.id}
              initialIsFollowing={initialIsFollowing}
              initialFollowersCount={initialFollowersCount}
              lang={lang}
              targetUserName={authorName}
              variant="compact"
            />
          )}
          <Link
            href={profileUrl}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <span>{isEn ? 'View Profile' : 'Lihat Profil'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Deskripsi Bio Penulis */}
      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-200/60 pt-4">
        {author?.bio?.trim() ||
          (isEn
            ? 'Local explorer and contributor at Locallytrip. Passionate about uncovering authentic routes and cultural stories.'
            : 'Penjelajah lokal dan kontributor terpercaya di Locallytrip. Gemar membagikan rute otentik dan kisah budaya nusantara.')}
      </p>

      {/* Cerita Lain Karya Penulis yang Sama (More from this Author) */}
      {otherStories && otherStories.length > 0 && (
        <div className="pt-3 border-t border-slate-200/60 space-y-3">
          <span className="text-xs font-bold text-slate-800 tracking-wide uppercase flex items-center gap-1.5">
            <span>📚</span>
            <span>{isEn ? 'More from this Author' : 'Cerita Lain Karya Penulis'}</span>
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {otherStories.map((s) => {
              const cover = resolveStoryImageUrl(s.cover_image);
              return (
                <Link
                  key={s.id}
                  href={`/${lang}/stories/${s.slug || s.id}`}
                  className="flex items-center gap-3 p-2.5 rounded-2xl bg-white border border-slate-200/80 hover:border-purple-300 hover:shadow-xs transition group"
                >
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                    <img
                      src={cover}
                      alt={s.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 line-clamp-2 group-hover:text-purple-700 transition leading-snug">
                      {s.title}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

interface FactItem {
  icon: typeof Clock;
  label: string;
  value: string;
}

interface QuickFactsTableProps {
  readingTime?: number | null;
  cityName?: string;
  countryName?: string;
  countryCode?: string;
  lang: string;
}

export function QuickFactsTable({
  readingTime,
  cityName,
  countryName,
  countryCode,
  lang,
}: QuickFactsTableProps) {
  const isEn = lang === 'en';
  const effectiveCity = cityName || (isEn ? 'City Center' : 'Pusat Kota');

  // Estimasi durasi jelajah dinamis: gunakan readingTime atau fallback
  const baseHours = readingTime ? Math.max(2, Math.min(6, readingTime)) : 3;
  const explorationValue = isEn
    ? `~${baseHours} - ${baseHours + 2} Hours`
    : `~${baseHours} - ${baseHours + 2} Jam`;

  // Akses / Titik Kumpul dinamis berdasarkan kota artikel
  const accessValue = isEn
    ? `Central ${effectiveCity} / Main Transit Hub`
    : `Pusat ${effectiveCity} / Akses Transit Utama`;

  // Waktu Kunjungan Terbaik
  const bestTimeValue = isEn
    ? 'Morning (08:00 - 10:30)'
    : 'Pagi hari (08:00 - 10:30)';

  // Estimasi Biaya Kuliner Berdasarkan Negara/Kota (Hanya jika terdefinisi, tidak hardcode RM untuk Manila/Bali)
  let expenseValue: string | null = null;
  const upperCode = (countryCode || '').toUpperCase();
  const lowerCity = (cityName || '').toLowerCase();
  const lowerCountry = (countryName || '').toLowerCase();

  if (upperCode === 'MY' || lowerCity.includes('kuala lumpur') || lowerCountry.includes('malaysia')) {
    expenseValue = isEn ? 'RM 15 - 30 / person' : 'RM 15 - 30 / orang (Rp 55k - 110k)';
  } else if (upperCode === 'ID' || lowerCity.includes('bali') || lowerCity.includes('jakarta') || lowerCity.includes('bandung') || lowerCity.includes('semarang') || lowerCity.includes('jogja') || lowerCountry.includes('indonesia')) {
    expenseValue = isEn ? 'IDR 35k - 75k / person' : 'Rp 35.000 - 75.000 / orang';
  } else if (upperCode === 'PH' || lowerCity.includes('manila') || lowerCity.includes('palawan') || lowerCountry.includes('philippines')) {
    expenseValue = isEn ? 'PHP 150 - 350 / person' : '₱150 - 350 / orang';
  } else if (upperCode === 'TH' || lowerCity.includes('bangkok') || lowerCountry.includes('thailand')) {
    expenseValue = isEn ? 'THB 80 - 180 / person' : '฿80 - 180 / orang';
  } else if (upperCode === 'VN' || lowerCity.includes('hanoi') || lowerCity.includes('saigon') || lowerCountry.includes('vietnam')) {
    expenseValue = isEn ? 'VND 50k - 120k / person' : '50.000 - 120.000 ₫ / orang';
  } else if (upperCode === 'JP' || lowerCity.includes('tokyo') || lowerCountry.includes('japan')) {
    expenseValue = isEn ? '¥ 800 - 1,500 / person' : '¥ 800 - 1.500 / orang';
  } else if (upperCode === 'KR' || lowerCity.includes('seoul') || lowerCity.includes('busan') || lowerCountry.includes('korea')) {
    expenseValue = isEn ? '₩ 8,000 - 15,000 / person' : '₩ 8.000 - 15.000 / orang';
  }

  const facts: FactItem[] = [
    {
      icon: Clock,
      label: isEn ? 'Estimated Exploration' : 'Estimasi Waktu Jelajah',
      value: explorationValue,
    },
    {
      icon: Compass,
      label: isEn ? 'Best Exploration Time' : 'Waktu Kunjungan Terbaik',
      value: bestTimeValue,
    },
    {
      icon: MapPin,
      label: isEn ? 'Meeting Point / Transit' : 'Titik Kumpul / Akses',
      value: accessValue,
    },
  ];

  return (
    <div className="w-full my-6 bg-slate-50/90 rounded-2xl p-4 sm:p-6 border border-slate-200/90 shadow-2xs">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-violet-700 bg-violet-100/80 px-2.5 py-0.5 rounded-md">
          {isEn ? '💡 Field Summary & Quick Facts' : '💡 Ringkasan Fakta Lapangan'}
        </span>
        <span className="text-[11px] text-slate-500 font-medium">({effectiveCity})</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {facts.map((fact, index) => {
          const Icon = fact.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-xl p-3.5 border border-slate-100 shadow-2xs space-y-1.5"
            >
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                <Icon className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                <span>{fact.label}</span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                {fact.value}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface StoryFaqAccordionProps {
  lang: string;
  cityName?: string;
}

export function StoryFaqAccordion({ lang, cityName = 'rute ini' }: StoryFaqAccordionProps) {
  const isEn = lang === 'en';
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: isEn
        ? `What is the most peaceful time to explore ${cityName}?`
        : `Kapan waktu paling tenang untuk mengunjungi ${cityName}?`,
      a: isEn
        ? `Early morning between 08:00 AM and 10:30 AM is ideal. The alleys are calm, local vendors are just setting up with fresh morning dishes, and the natural morning light offers unobstructed photo spots before midday crowds.`
        : `Pagi hari antara pukul 08:00 hingga 10:30 adalah waktu paling ideal. Lorong-lorong masih tenang, udara belum terlalu terik, pedagang lokal baru menyajikan sajian sarapan segar, dan pencahayaan pagi sangat cantik untuk dokumentasi perjalanan.`,
    },
    {
      q: isEn
        ? 'Is this walking route family-friendly and accessible for beginners?'
        : 'Apakah rute jalan kaki ini ramah keluarga dan pemula?',
      a: isEn
        ? `Yes! The route consists primarily of paved pedestrian pathways, shaded alleys, and clearly marked transit stops. It is very suitable for families, casual strollers, and solo travelers wearing comfortable walking sneakers.`
        : `Ya, sangat ramah! Jalur ini didominasi oleh trotoar pejalan kaki beraspal, lorong rindang, dan dekat dengan akses transit transportasi publik. Sangat cocok dinikmati bersama keluarga maupun pemula dengan mengenakan sepatu jalan yang nyaman.`,
    },
  ];

  return (
    <section className="w-full mt-8 bg-white rounded-3xl p-6 sm:p-10 lg:p-12 border border-slate-200 shadow-sm space-y-6">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 text-violet-700 text-xs font-bold border border-violet-100">
          <HelpCircle className="w-3.5 h-3.5 text-violet-600" />
          <span>{isEn ? '💡 Frequently Asked Questions' : '💡 Tanya Jawab Seputar Rute'}</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 tracking-tight">
          {isEn ? 'Common Questions About This Story' : 'Pertanyaan Umum Seputar Cerita Ini'}
        </h2>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className="rounded-2xl border border-slate-200/80 bg-slate-50/50 overflow-hidden transition-all duration-200"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full flex items-center justify-between p-4 sm:p-5 text-left font-bold text-slate-900 text-xs sm:text-sm hover:text-violet-700 transition"
                aria-expanded={isOpen}
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 shrink-0 ml-3 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-violet-600' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                  <p>{faq.a}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
