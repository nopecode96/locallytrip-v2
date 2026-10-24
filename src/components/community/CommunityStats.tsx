import React from 'react';
import { Users, Compass, MessageCircleHeart, MapPin } from 'lucide-react';
import { Locale } from '@/lib/i18n';

interface CommunityStatsProps {
  locale: Locale;
  activeMembers: number;
  publishedExperiences: number;
  totalConnections: number;
  totalCities: number;
}

export function CommunityStats({
  locale,
  activeMembers,
  publishedExperiences,
  totalConnections,
  totalCities,
}: CommunityStatsProps) {
  const isId = locale === 'id';

  // Format stats into clean rounded metrics
  const formatStat = (num: number, threshold = 10) => {
    if (num <= 0) return '0';
    if (num < threshold) return `${num}`;
    const rounded = Math.floor(num / 10) * 10;
    return `${rounded.toLocaleString(isId ? 'id-ID' : 'en-US')}+`;
  };

  const stats = [
    {
      icon: Users,
      value: formatStat(activeMembers, 50),
      label: isId ? 'Member Komunitas Aktif' : 'Active Community Members',
      description: isId ? 'Traveler & pemandu terdaftar' : 'Verified travelers & hosts',
      color: 'from-violet-500/15 to-purple-500/10 text-violet-700',
    },
    {
      icon: Compass,
      value: formatStat(publishedExperiences, 10),
      label: isId ? 'Pengalaman Lokal Terkurasi' : 'Curated Local Tours',
      description: isId ? 'Aktivitas unik & hidden gems' : 'Unique routes & activities',
      color: 'from-indigo-500/15 to-blue-500/10 text-indigo-700',
    },
    {
      icon: MessageCircleHeart,
      value: formatStat(totalConnections, 100),
      label: isId ? 'Koneksi & Diskusi Nyata' : 'Authentic Connections Made',
      description: isId ? 'Peserta meetup & balasan forum' : 'Meetup attendees & forum shares',
      color: 'from-fuchsia-500/15 to-pink-500/10 text-fuchsia-700',
    },
    {
      icon: MapPin,
      value: formatStat(totalCities, 20),
      label: isId ? 'Kota & Destinasi Wisata' : 'Cities & Destinations',
      description: isId ? 'Tersebar di seluruh Indonesia' : 'Across diverse Indonesian regions',
      color: 'from-amber-500/15 to-orange-500/10 text-amber-700',
    },
  ];

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="relative p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-violet-200 transition-all duration-300 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl sm:text-3xl font-black font-serif text-slate-900 tracking-tight">
                  {stat.value}
                </span>
                <div className={`p-2.5 rounded-2xl bg-gradient-to-br ${stat.color}`}>
                  <Icon className="w-5 h-5 stroke-[2.2]" />
                </div>
              </div>
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-slate-800 leading-snug">
                  {stat.label}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">
                  {stat.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CommunityStats;
