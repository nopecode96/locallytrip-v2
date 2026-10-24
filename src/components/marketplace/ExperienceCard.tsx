'use client';

import React from 'react';
import Link from 'next/link';
import { ExperienceItem } from '@/actions/experiences';
import { usePreferences } from '@/components/layout/PreferencesContext';
import { getLocalizedContent } from '@/lib/i18n-helper';
import { Star, MapPin, CheckCircle2, Clock } from 'lucide-react';
import { UserPersonaLink } from '@/components/common/UserPersonaLink';
import { Dictionary } from '@/lib/dictionary';
import { getPublicImageUrl } from '@/lib/images';

interface ExperienceCardProps {
  experience: ExperienceItem;
  dict?: Dictionary['common'];
  homeDict?: Dictionary['home'];
}

export function ExperienceCard({ experience, dict, homeDict }: ExperienceCardProps) {
  const { formatPrice, locale } = usePreferences();

  // Terjemahan judul dengan fallback cerdas
  const displayTitle = getLocalizedContent(experience, 'title', locale);

  // Gambar pertama atau default fallback
  const firstImage = experience.images?.[0];
  const imageSrc = getPublicImageUrl(firstImage, 'experiences');


  const hrefSlug = `/${locale}/experiences/${experience.slug || experience.id}`;

  const ratingVal = experience.ratingAverage > 0 ? experience.ratingAverage.toFixed(1) : '4.9';
  const ratingCountVal = experience.ratingCount > 0 ? experience.ratingCount : 28;
  const reviewsLabel = homeDict?.reviews || 'ulasan';
  const durationText = experience.durationHours
    ? `${experience.durationHours} ${dict?.hours || 'Jam'}`
    : `3 ${dict?.hours || 'Jam'}`;

  const hostName = experience.host?.name || 'Local Host';
  const hostLevel = experience.host?.level || 1;
  const joinedMembers = experience.ratingCount > 0 ? experience.ratingCount : (experience.maxParticipants ? Math.min(experience.maxParticipants, 8) : 6);
  const formattedPrice = formatPrice(experience.packagePrice, experience.currency || 'USD');

  return (
    <div className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-violet-200 overflow-hidden hover:shadow-2xl hover:shadow-violet-950/10 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
      {/* 1. Media Container: Aspect 4/3 with rounded-2xl overflow-hidden */}
      <div className="p-3 pb-0">
        <Link href={hrefSlug} className="block">
          <figure className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-slate-100 group m-0">
            <img
              src={imageSrc}
              alt={displayTitle}
              width={400}
              height={300}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/default.jpg';
              }}
            />

            <figcaption className="sr-only">
              Dokumentasi pengalaman lokal asli di {experience.city?.name || 'Indonesia'} bersama pemandu Locallytrip
            </figcaption>

            {/* Badge Kota Mengapung di Sudut Foto (Latar putih blur / glassmorphism) */}
            {experience.city && (
              <div className="absolute top-3 left-3 bg-white/85 backdrop-blur-md px-3 py-1 rounded-full text-slate-800 text-xs font-bold flex items-center gap-1 shadow-md border border-white/50">
                <MapPin className="w-3.5 h-3.5 text-violet-600" />
                <span>{experience.city.name}</span>
              </div>
            )}
          </figure>
        </Link>
      </div>

      {/* 2. Body Details: flex-1 flex flex-col justify-between p-4 sm:p-5 */}
      <div className="p-4 sm:p-5 pt-3.5 flex-1 flex flex-col justify-between">
        <div className="space-y-2.5">
          {/* Rating Bintang (xx ulasan) + Durasi Kegiatan */}
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <span className="flex items-center gap-1 text-amber-500 font-bold">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>{ratingVal}</span>
              <span className="text-slate-400 font-normal text-xs">
                ({ratingCountVal} {reviewsLabel})
              </span>
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 flex items-center gap-1 text-xs sm:text-sm">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {durationText}
            </span>
          </div>

          {/* Social Proof Tag: members joining host this Friday (dengan spasi presisi) */}
          <div className="text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-xl flex items-center gap-1.5 line-clamp-1">
            <span>
              {locale === 'id'
                ? `🎒 ${joinedMembers} anggota bergabung dengan ${hostName} Lvl ${hostLevel} Jumat ini`
                : `🎒 ${joinedMembers} members are joining ${hostName} Lvl ${hostLevel} this Friday`}
            </span>
          </div>

          {/* Judul Aktivitas (Terstandarisasi heading-h3 line-clamp-2) */}
          <Link href={hrefSlug} className="block group">
            <h3 className="heading-h3 line-clamp-2 text-slate-900 group-hover:text-purple-600 transition-colors">
              {displayTitle}
            </h3>
          </Link>
        </div>

        {/* 3. Footer: Info Host & Harga */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            {/* Host Info dengan Level XP Dinamis */}
            {experience.host ? (
              <UserPersonaLink
                user={{
                  id: experience.host.id,
                  name: experience.host.name,
                  username: experience.host.username,
                  avatar_url: experience.host.avatarUrl,
                }}
                locale={locale}
                variant="full"
                size="xs"
                subtitle={
                  <span className="text-[10px] font-bold text-violet-700 bg-violet-50 px-1.5 py-0.2 rounded border border-violet-100">
                    Lvl {hostLevel}
                  </span>
                }
                className="min-w-0 max-w-[140px]"
              />
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-full bg-slate-100 shrink-0" />
                <span className="text-xs text-slate-600 font-medium truncate">
                  Local Host
                </span>
              </div>
            )}

            {/* Harga Tegas di Kanan Bawah */}
            <div className="text-right shrink-0">
              <span className="text-xl font-bold text-slate-900">
                {formattedPrice}
              </span>
              <span className="text-xs text-slate-500 ml-1 font-medium">
                {dict?.perPerson || '/ orang'}
              </span>
            </div>
          </div>

          {/* Action Button: Join {host.name} Lvl {host.level} for ${price} (spasi sempurna) */}
          <Link
            href={hrefSlug}
            className="w-full py-2 px-3 rounded-xl bg-violet-50 hover:bg-violet-600 text-violet-700 hover:text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <span>
              {locale === 'id'
                ? `Ikut ${hostName} Lvl ${hostLevel} seharga ${formattedPrice}`
                : `Join ${hostName} Lvl ${hostLevel} for ${formattedPrice}`}
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
