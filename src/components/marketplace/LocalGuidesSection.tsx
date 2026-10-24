'use client';

import React from 'react';
import Link from 'next/link';
import { Locale } from '@/lib/i18n';
import { Dictionary } from '@/lib/dictionary';
import { resolveAvatarUrl } from '@/lib/avatar';
import { UserAvatar } from '@/components/common/UserAvatar';
import {
  CheckCircle2,
  MapPin,
  Star,
  Users,
  ArrowRight,
} from 'lucide-react';

export interface VerifiedGuideItem {
  id: number;
  name: string;
  username: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  bio: string | null;
  city_name: string;
  rating_average: number;
  rating_count: number;
}

interface LocalGuidesSectionProps {
  hosts: VerifiedGuideItem[];
  locale: Locale;
  dict: Dictionary;
}

export function LocalGuidesSection({
  hosts,
  locale,
  dict,
}: LocalGuidesSectionProps) {
  if (!hosts || hosts.length === 0) return null;

  const t = (dict as any).explore_page || {};
  const sectionTitle = t.hosts_title || t.section_hosts_title || 'Pemandu Lokal Berlisensi & Terpercaya';
  const sectionSubtitle =
    t.hosts_subtitle ||
    t.section_hosts_sub ||
    'Warga lokal yang terverifikasi identitas resmi (KYC) dan siap mengantar petualangan otentik.';
  const verifiedBadge = t.host_verified_badge || 'KYC Verified Local Guides';
  const btnLabel = t.btn_view_host_profile || t.btn_view_host_tours || 'Lihat Profil Pemandu';

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14 sm:mt-16">
      {/* Header Seksi */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-7 gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-semibold mb-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-violet-600" />
            <span>{verifiedBadge}</span>
          </div>
          <h2 className="heading-h2 text-slate-900">
            {sectionTitle}
          </h2>
          <p className="text-body text-slate-500 mt-1 max-w-2xl">
            {sectionSubtitle}
          </p>
        </div>

        <Link
          href={`/${locale}/explore`}
          className="text-xs font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1 shrink-0 group self-start md:self-auto"
        >
          <span>{dict.home?.allExperiences || 'Lihat Semua Pemandu'}</span>
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      </div>

      {/* Grid Host Cards (4 Kolom di Desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {hosts.map((host) => {
          const avatar = resolveAvatarUrl(host.avatar_url);
          const profileUrl = `/${locale}/users/${host.username || host.id}`;

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
                    <div className="flex items-center gap-1 text-xs text-amber-500 font-bold mt-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{host.rating_average > 0 ? host.rating_average.toFixed(1) : '4.9'}</span>
                      <span className="text-slate-400 font-normal text-[11px]">
                        ({host.rating_count > 0 ? host.rating_count : 24})
                      </span>
                    </div>
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
                  {btnLabel}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
