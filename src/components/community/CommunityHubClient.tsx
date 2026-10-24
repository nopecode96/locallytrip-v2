'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPersonaLink } from '@/components/common/UserPersonaLink';
import { getPublicImageUrl } from '@/lib/images';
import { resolveMeetupDisplayImage } from '@/lib/utils/images';
import {
  Trophy,
  Medal,
  Crown,
  Sparkles,
  MessageSquare,
  Users,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Calendar,
  Flame,
  ChevronRight,
  BookOpen,
  Home,
  Plus,
  Coins,
  Compass,
  CheckCircle2,
  ExternalLink,
  Search,
  Clock,
  Heart,
  Eye,
  MessageCircle,
  Filter,
  Navigation,
  Share2,
  Check,
  Loader2,
  Layers,
} from 'lucide-react';

export interface CommunityLevelTier {
  level: number;
  badge_icon: string;
  name_id: string;
  name_en: string;
  min_xp: number;
}

export interface CommunityLeaderboardUser {
  rank: number;
  id: number;
  name: string;
  username: string;
  avatar_url: string | null;
  role: string;
  is_host: boolean;
  is_verified: boolean;
  is_kyc_approved: boolean;
  cityName: string | null;
  total_xp: number;
  current_level: number;
  tier: CommunityLevelTier;
}

export interface CommunityRecentThread {
  id: number;
  title: string;
  slug: string;
  content_snippet?: string;
  created_at: string | null;
  reply_count: number;
  like_count: number;
  view_count: number;
  is_pinned?: boolean;
  is_locked?: boolean;
  category: {
    id?: number;
    name: string;
    slug: string;
    icon?: string | null;
  } | null;
  author: {
    id: number;
    name: string;
    username: string;
    avatar_url: string | null;
    role?: string | null;
    is_verified: boolean;
    cityName: string | null;
  };
}

export interface CommunityUpcomingMeetup {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  city_name: string;
  city_image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  images: any;
  cover_image: string;
  members_count: number;
  max_members: number | null;
  join_type: string;
  creator: {
    id: number;
    name: string;
    username: string;
    avatar_url: string | null;
    role?: string | null;
    is_verified: boolean;
  };
}

export interface CommunityStoryItem {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string;
  created_at: string | null;
  reading_time: number;
  view_count: number;
  like_count: number;
  comment_count: number;
  is_featured: boolean;
  author: {
    id: number;
    name: string;
    username: string;
    avatar_url: string | null;
    bio: string | null;
    role: string | null;
    is_verified: boolean;
    level: number;
  };
  cityName: string | null;
}

export interface CommunityRewardSettings {
  ltpUsdRate: number;
  minPayoutLtp: number;
  usdIdrRate: number;
}

export interface CommunityCategoryOption {
  id: number;
  name: string;
  slug: string;
  icon?: string | null;
}

export interface CommunityCityOption {
  id: number;
  name: string;
}

interface CommunityHubClientProps {
  locale: string;
  leaderboardUsers: CommunityLeaderboardUser[];
  recentThreads: CommunityRecentThread[];
  upcomingMeetups: CommunityUpcomingMeetup[];
  recentStories: CommunityStoryItem[];
  forumCategories: CommunityCategoryOption[];
  cities: CommunityCityOption[];
  levelTiers: CommunityLevelTier[];
  rewardSettings: CommunityRewardSettings;
  initialTab?: 'all' | 'meetups' | 'forums' | 'stories' | 'leaderboard';
}

export function CommunityHubClient({
  locale,
  leaderboardUsers,
  recentThreads,
  upcomingMeetups,
  recentStories,
  forumCategories,
  cities,
  levelTiers,
  rewardSettings,
  initialTab = 'all',
}: CommunityHubClientProps) {
  const isId = locale === 'id';
  const [activeTab, setActiveTab] = useState<'all' | 'meetups' | 'forums' | 'stories' | 'leaderboard'>(
    initialTab
  );

  // Filters state
  const [meetupCityFilter, setMeetupCityFilter] = useState<string>('all');
  const [forumCategoryFilter, setForumCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // RSVP quick action state
  const [joinedMeetupIds, setJoinedMeetupIds] = useState<number[]>([]);
  const [joiningMeetupId, setJoiningMeetupId] = useState<number | null>(null);

  // Filtered Meetups
  const filteredMeetups = useMemo(() => {
    return upcomingMeetups.filter((m) => {
      const matchCity =
        meetupCityFilter === 'all' ||
        m.city_name.toLowerCase().includes(meetupCityFilter.toLowerCase());
      const matchSearch =
        !searchQuery.trim() ||
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.city_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCity && matchSearch;
    });
  }, [upcomingMeetups, meetupCityFilter, searchQuery]);

  // Filtered Threads
  const filteredThreads = useMemo(() => {
    return recentThreads.filter((t) => {
      const matchCategory =
        forumCategoryFilter === 'all' ||
        t.category?.slug === forumCategoryFilter ||
        String(t.category?.id) === forumCategoryFilter;
      const matchSearch =
        !searchQuery.trim() ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.content_snippet && t.content_snippet.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [recentThreads, forumCategoryFilter, searchQuery]);

  // Filtered Stories
  const filteredStories = useMemo(() => {
    return recentStories.filter((s) => {
      return (
        !searchQuery.trim() ||
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.excerpt && s.excerpt.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.cityName && s.cityName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        s.author.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [recentStories, searchQuery]);

  // Handle Quick RSVP Join
  const handleQuickJoinMeetup = async (meetupId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (joinedMeetupIds.includes(meetupId)) return;

    setJoiningMeetupId(meetupId);
    try {
      const res = await fetch(`/api/community/meetups/${meetupId}/join`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setJoinedMeetupIds((prev) => [...prev, meetupId]);
      } else if (res.status === 401) {
        window.location.href = `/${locale}/login?callbackUrl=/${locale}/community/meetups/${meetupId}`;
      } else {
        alert(data.error || 'Gagal bergabung dengan agenda meetup.');
      }
    } catch {
      alert('Terjadi kesalahan jaringan.');
    } finally {
      setJoiningMeetupId(null);
    }
  };

  // Top 3 Podium
  const top1 = leaderboardUsers.find((u) => u.rank === 1);
  const top2 = leaderboardUsers.find((u) => u.rank === 2);
  const top3 = leaderboardUsers.find((u) => u.rank === 3);
  const restUsers = leaderboardUsers.filter((u) => u.rank >= 4);

  // Tokenomics Calculator
  const [calcLtp, setCalcLtp] = useState<number>(1000);
  const minPayoutLtp = rewardSettings.minPayoutLtp || 3000;
  const usdVal = (calcLtp * (rewardSettings.ltpUsdRate || 0.01)).toFixed(2);
  const idrVal = Math.round(calcLtp * 155).toLocaleString('id-ID');

  return (
    <div className="space-y-10 sm:space-y-14">
      {/* 1. BREADCRUMB & HERO BANNER */}
      <section className="space-y-4">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 font-medium"
        >
          <Link
            href={`/${locale}`}
            className="hover:text-purple-700 transition flex items-center gap-1.5"
          >
            <Home className="w-3.5 h-3.5" />
            <span>{isId ? 'Beranda' : 'Home'}</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-semibold">{isId ? 'Komunitas' : 'Community'}</span>
        </nav>

        {/* Hero Card */}
        <div className="bg-gradient-to-br from-slate-900 via-purple-950 to-indigo-950 rounded-3xl p-6 sm:p-10 lg:p-12 text-white shadow-xl relative overflow-hidden border border-purple-800/40">
          <div className="absolute top-0 right-1/4 -mt-16 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 -mb-16 -mr-16 w-80 h-80 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
            <div className="lg:col-span-7 space-y-5 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-semibold backdrop-blur-md">
                <span className="text-sm">🌐</span>
                <span>
                  {isId
                    ? 'PUSAT KOMUNITAS & INSPIRASI LOKAL'
                    : 'COMMUNITY HUB & LOCAL INSPIRATION'}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-serif tracking-tight leading-[1.15] text-white">
                {isId
                  ? 'Jalin Koneksi, Berbagi Cerita, dan Jelajahi Dunia Bersama'
                  : 'Connect, Share Stories, and Explore the World Together'}
              </h1>

              <p className="text-sm sm:text-base text-purple-100/85 leading-relaxed max-w-2xl">
                {isId
                  ? 'Temukan agenda kumpul petualang (meetups), ruang diskusi tips & rute otentik (forums), dan catatan visual inspiratif (stories) yang dihadirkan langsung oleh penjelajah nyata di seluruh nusantara.'
                  : 'Discover spontaneous local gatherings (meetups), authentic travel routes & insider Q&As (forums), and cinematic visual field essays (stories) crafted by authentic explorers.'}
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('meetups')}
                  className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition active:scale-95 cursor-pointer"
                >
                  <Users className="w-4 h-4 text-slate-950" />
                  <span>{isId ? 'Agenda Temu (Meetups)' : 'Explore Meetups'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('forums')}
                  className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/20 transition active:scale-95 backdrop-blur-xs cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-purple-300" />
                  <span>{isId ? 'Forum Diskusi' : 'Discussion Forums'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('stories')}
                  className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-bold text-xs sm:text-sm border border-amber-400/30 transition active:scale-95 backdrop-blur-xs cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <span>{isId ? 'Cerita Petualang' : 'Travel Stories'}</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 relative flex items-center justify-center">
              <div className="relative w-full max-w-sm lg:max-w-md aspect-square flex items-center justify-center">
                <Image
                  src="/images/rewards/hero-earning-traveler.png"
                  alt="Locallytrip Community Mascot"
                  width={420}
                  height={420}
                  className="object-contain drop-shadow-2xl z-10 hover:scale-105 transition-transform duration-500"
                  priority
                />

                <div className="absolute top-4 left-0 sm:-left-4 z-20 bg-slate-900/90 backdrop-blur-md border border-amber-400/40 rounded-2xl px-3.5 py-2 shadow-xl flex items-center gap-2.5">
                  <span className="text-xl">✍️</span>
                  <div>
                    <div className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">
                      {isId ? 'Cerita Terbit' : 'Story Published'}
                    </div>
                    <div className="text-xs font-black text-white">+50 XP • +15 LTP</div>
                  </div>
                </div>

                <div className="absolute bottom-6 right-0 sm:-right-4 z-20 bg-slate-900/90 backdrop-blur-md border border-emerald-400/40 rounded-2xl px-3.5 py-2 shadow-xl flex items-center gap-2.5">
                  <span className="text-xl">🤝</span>
                  <div>
                    <div className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">
                      {isId ? 'Temu Komunitas' : 'Meetup Event'}
                    </div>
                    <div className="text-xs font-black text-white">+100 XP • +25 LTP</div>
                  </div>
                </div>

                <div className="absolute -bottom-3 left-6 z-20 bg-purple-950/90 backdrop-blur-md border border-purple-400/40 rounded-2xl px-3 py-1.5 shadow-xl flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span className="text-[11px] font-bold text-purple-200">
                    100 LTP = $1 USD
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TOP UNIFIED SWITCHER BAR (TABBED INTERFACE) */}
      <section className="sticky top-20 z-30 py-2.5 bg-slate-50/80 backdrop-blur-md border-y border-slate-200/80">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 max-w-7xl mx-auto">
          {/* Main Nav Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white border border-slate-200 shadow-xs overflow-x-auto max-w-full no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`relative px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-purple-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50/60'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{isId ? 'Semua & Ringkasan' : 'Overview Hub'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('meetups')}
              className={`relative px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === 'meetups'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>{isId ? 'Temu Komunitas' : 'Meetups'}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  activeTab === 'meetups' ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {upcomingMeetups.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('forums')}
              className={`relative px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === 'forums'
                  ? 'bg-purple-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50/60'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>{isId ? 'Forum Diskusi' : 'Forums'}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  activeTab === 'forums' ? 'bg-purple-900 text-purple-100' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {recentThreads.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('stories')}
              className={`relative px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === 'stories'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-amber-700 hover:bg-amber-50/60'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>{isId ? 'Cerita Petualang' : 'Stories'}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  activeTab === 'stories' ? 'bg-amber-800 text-amber-100' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {recentStories.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('leaderboard')}
              className={`relative px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === 'leaderboard'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-indigo-700 hover:bg-indigo-50/60'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>{isId ? 'Peringkat XP' : 'XP Leaderboard'}</span>
            </button>
          </div>

          {/* Quick Creator CTA Button matching active tab */}
          <div className="shrink-0 flex items-center gap-2">
            {activeTab === 'meetups' && (
              <Link
                href={`/${locale}/community/meetups/create`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isId ? '+ Buat Meetup' : '+ Host Meetup'}</span>
              </Link>
            )}

            {activeTab === 'forums' && (
              <Link
                href={`/${locale}/community/forums/create`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isId ? '+ Mulai Diskusi' : '+ Start Thread'}</span>
              </Link>
            )}

            {activeTab === 'stories' && (
              <Link
                href={`/${locale}/stories/create`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isId ? '+ Tulis Cerita' : '+ Write Story'}</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* 3. TAB CONTENT VIEWS */}
      <AnimatePresence mode="wait">
        {/* ========================================================================= */}
        {/* TAB 1: TRAVEL MEETUPS                                                     */}
        {/* ========================================================================= */}
        {activeTab === 'meetups' && (
          <motion.div
            key="tab-meetups"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Meetups Header & Filter Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 flex items-center gap-2">
                  <Users className="w-6 h-6 text-emerald-600" />
                  <span>{isId ? 'Agenda Temu Petualang (Travel Meetups)' : 'Spontaneous Travel Meetups'}</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  {isId
                    ? 'Bergabung dalam agenda kumpul santai, jalan bareng, atau hunting kuliner bersama penjelajah di sekitarmu.'
                    : 'Discover real-world coffee gatherings, photo treks, and spontaneous explorations with fellow travelers.'}
                </p>
              </div>

              {/* City Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 no-scrollbar">
                <button
                  type="button"
                  onClick={() => setMeetupCityFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                    meetupCityFilter === 'all'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {isId ? 'Semua Kota' : 'All Cities'}
                </button>
                {cities.slice(0, 8).map((city) => (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => setMeetupCityFilter(city.name)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                      meetupCityFilter.toLowerCase() === city.name.toLowerCase()
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {city.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Meetups Grid */}
            {filteredMeetups.length === 0 ? (
              <div className="text-center py-16 px-4 rounded-3xl bg-white border border-dashed border-slate-200 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                  <Compass className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-slate-800 text-base">
                  {isId ? 'Tidak ada agenda temu yang cocok.' : 'No meetups found matching your filter.'}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {isId
                    ? 'Jadilah inisiator pertama dengan membuat agenda temu komunitas di kotamu!'
                    : 'Be the first explorer to host a community meetup in this destination!'}
                </p>
                <Link
                  href={`/${locale}/community/meetups/create`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isId ? 'Inisiasi Agenda Temu Baru' : 'Create New Meetup'}</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMeetups.map((meetup) => {
                  const cover = resolveMeetupDisplayImage(
                    meetup.images,
                    meetup.city_image_url
                  );
                  const formattedDate = new Date(meetup.start_date).toLocaleDateString(
                    isId ? 'id-ID' : 'en-US',
                    { day: 'numeric', month: 'short', year: 'numeric' }
                  );
                  const isJoined = joinedMeetupIds.includes(meetup.id);
                  const isJoining = joiningMeetupId === meetup.id;
                  const capacityPercent = meetup.max_members
                    ? Math.min(100, Math.round((meetup.members_count / meetup.max_members) * 100))
                    : 30;

                  return (
                    <article
                      key={meetup.id}
                      className="group bg-white rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-xl hover:border-emerald-300 transition-all flex flex-col justify-between overflow-hidden"
                    >
                      <div>
                        {/* Cover image with floating badges */}
                        <div className="relative aspect-[16/10] w-full bg-slate-900 overflow-hidden">
                          <img
                            src={cover}
                            alt={meetup.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/images/placeholder-meetup.webp';
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />

                          {/* Floating Top Badges */}
                          <div className="absolute top-3 left-3 flex items-center gap-1.5">
                            <span className="px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-[11px] font-bold text-white flex items-center gap-1.5 shadow-sm">
                              <MapPin className="w-3 h-3 text-emerald-400" />
                              <span>{meetup.city_name}</span>
                            </span>

                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/90 backdrop-blur-md text-[10px] font-black text-slate-950 uppercase tracking-wider">
                              {meetup.join_type || 'public'}
                            </span>
                          </div>

                          <div className="absolute bottom-3 left-3 text-white">
                            <span className="text-xs font-bold flex items-center gap-1.5 drop-shadow-sm">
                              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                              <span>{formattedDate}</span>
                            </span>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-5 space-y-3">
                          {/* Geolocation Coordinates Badge */}
                          {meetup.latitude && meetup.longitude && (
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono bg-slate-100/80 px-2.5 py-1 rounded-lg w-fit">
                              <Navigation className="w-3 h-3 text-emerald-600" />
                              <span>
                                {Number(meetup.latitude).toFixed(4)}°, {Number(meetup.longitude).toFixed(4)}°
                              </span>
                            </div>
                          )}

                          <Link
                            href={`/${locale}/community/meetups/${meetup.slug || meetup.id}`}
                            className="block"
                          >
                            <h3 className="font-serif font-bold text-base sm:text-lg text-slate-900 group-hover:text-emerald-700 transition line-clamp-2 leading-snug">
                              {meetup.title}
                            </h3>
                          </Link>

                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                            {meetup.description || 'Mari berkumpul dan jelajahi sudut indah kota bersama-sama.'}
                          </p>

                          {/* Capacity Progress Bar */}
                          <div className="space-y-1.5 pt-1">
                            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                              <span>
                                👥 {meetup.members_count}
                                {meetup.max_members ? ` / ${meetup.max_members}` : ''}{' '}
                                {isId ? 'peserta terdaftar' : 'joined'}
                              </span>
                              <span className="text-emerald-700 font-bold">{capacityPercent}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  capacityPercent >= 100
                                    ? 'bg-rose-500'
                                    : capacityPercent >= 80
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                                style={{ width: `${capacityPercent}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer: Host & Interactive RSVP Action */}
                      <div className="p-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={getPublicImageUrl(meetup.creator.avatar_url, 'users')}
                            alt={meetup.creator.name}
                            className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-slate-200"
                          />
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-800 truncate block">
                              {meetup.creator.name}
                            </span>
                            <span className="text-[10px] text-slate-400 block">Host Inisiator</span>
                          </div>
                        </div>

                        {/* Interactive Buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          <Link
                            href={`/${locale}/community/meetups/${meetup.slug || meetup.id}`}
                            className="px-3 py-1.5 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition"
                          >
                            {isId ? 'Detail' : 'View'}
                          </Link>

                          <button
                            type="button"
                            onClick={(e) => handleQuickJoinMeetup(meetup.id, e)}
                            disabled={isJoined || isJoining}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                              isJoined
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white'
                            }`}
                          >
                            {isJoining ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : isJoined ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>{isId ? 'Terdaftar' : 'RSVPed'}</span>
                              </>
                            ) : (
                              <span>{isId ? 'Ikuti Temu' : 'Join'}</span>
                            )}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: DISCUSSION FORUMS                                                  */}
        {/* ========================================================================= */}
        {activeTab === 'forums' && (
          <motion.div
            key="tab-forums"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Forums Header & Category Filter Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-6 h-6 text-purple-700" />
                  <span>{isId ? 'Forum Diskusi Wisatawan (Travel Forums)' : 'Travel Discussion Forums'}</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  {isId
                    ? 'Tanya jawab seputar rute rahasia, tips hemat, kuliner lokal legendaris, dan rekomendasi warga asli.'
                    : 'Authentic crowd-sourced insights, hidden gem locations, transport hacks, and insider advice.'}
                </p>
              </div>

              {/* Forum Categories Pills */}
              <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 no-scrollbar">
                <button
                  type="button"
                  onClick={() => setForumCategoryFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                    forumCategoryFilter === 'all'
                      ? 'bg-purple-700 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {isId ? 'Semua Topik' : 'All Topics'}
                </button>
                {forumCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setForumCategoryFilter(cat.slug)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                      forumCategoryFilter === cat.slug
                        ? 'bg-purple-700 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{cat.icon || '💬'}</span> {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Threads List */}
            {filteredThreads.length === 0 ? (
              <div className="text-center py-16 px-4 rounded-3xl bg-white border border-dashed border-slate-200 space-y-4">
                <div className="w-16 h-16 rounded-full bg-purple-50 text-purple-700 mx-auto flex items-center justify-center">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-slate-800 text-base">
                  {isId ? 'Belum ada thread diskusi pada kategori ini.' : 'No discussion threads found in this category.'}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {isId
                    ? 'Mulai percakapan baru dan tanyakan apa saja seputar rencana liburanmu ke komunitas!'
                    : 'Start the conversation and ask fellow explorers about local secrets and travel tips!'}
                </p>
                <Link
                  href={`/${locale}/community/forums/create`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isId ? 'Mulai Diskusi Baru' : 'Start Discussion'}</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredThreads.map((thread) => {
                  const authorAvatar = getPublicImageUrl(thread.author.avatar_url, 'users');
                  const formattedDate = thread.created_at
                    ? new Date(thread.created_at).toLocaleDateString(isId ? 'id-ID' : 'en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '';

                  return (
                    <article
                      key={thread.id}
                      className="group bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-purple-300 transition-all space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          {thread.is_pinned && (
                            <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[11px] font-black flex items-center gap-1">
                              📌 {isId ? 'Disematkan' : 'Pinned'}
                            </span>
                          )}

                          {thread.category ? (
                            <span className="px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[11px] font-semibold flex items-center gap-1">
                              <span>{thread.category.icon || '💬'}</span>
                              <span>{thread.category.name}</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-semibold">
                              {isId ? 'Umum' : 'General'}
                            </span>
                          )}

                          <span className="text-[11px] text-slate-400">• {formattedDate}</span>
                        </div>

                        {/* Engagement Metrics */}
                        <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                          <span className="flex items-center gap-1 text-slate-600" title="Replies">
                            <MessageCircle className="w-3.5 h-3.5 text-purple-600" />
                            <span>{thread.reply_count} {isId ? 'Balasan' : 'Replies'}</span>
                          </span>

                          <span className="flex items-center gap-1 text-rose-600" title="Likes">
                            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                            <span>{thread.like_count}</span>
                          </span>

                          <span className="flex items-center gap-1 text-slate-400" title="Views">
                            <Eye className="w-3.5 h-3.5" />
                            <span>{thread.view_count || 12}</span>
                          </span>
                        </div>
                      </div>

                      {/* Title & Excerpt */}
                      <div>
                        <Link
                          href={`/${locale}/community/forums/${thread.slug || thread.id}`}
                          className="block"
                        >
                          <h3 className="font-serif font-bold text-base sm:text-lg text-slate-900 group-hover:text-purple-700 transition leading-snug">
                            {thread.title}
                          </h3>
                        </Link>
                        {thread.content_snippet && (
                          <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 mt-1.5 leading-relaxed">
                            {thread.content_snippet}
                          </p>
                        )}
                      </div>

                      {/* Footer: Author Info & Direct Link */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={authorAvatar}
                            alt={thread.author.name}
                            className="w-6 h-6 rounded-full object-cover shrink-0 ring-1 ring-slate-200"
                          />
                          <span className="font-semibold text-slate-800 truncate">
                            {thread.author.name}
                          </span>
                          {thread.author.cityName && (
                            <span className="text-[10px] text-slate-400 hidden sm:inline">
                              dari {thread.author.cityName}
                            </span>
                          )}
                        </div>

                        <Link
                          href={`/${locale}/community/forums/${thread.slug || thread.id}`}
                          className="text-xs font-bold text-purple-700 hover:text-purple-900 transition flex items-center gap-1 shrink-0"
                        >
                          <span>{isId ? 'Buka Diskusi' : 'Join Discussion'}</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: TRAVEL STORIES                                                     */}
        {/* ========================================================================= */}
        {activeTab === 'stories' && (
          <motion.div
            key="tab-stories"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Stories Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-amber-600" />
                  <span>{isId ? 'Catatan Visual Petualang (Travel Stories)' : 'Visual Travel Journals & Stories'}</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  {isId
                    ? 'Kumpulan cerita visual dan dokumentasi rute langsung dari para petualang di pelosok negeri.'
                    : 'Immersive photo essays, travel diaries, and route itineraries penned by global explorers.'}
                </p>
              </div>

              <Link
                href={`/${locale}/stories/create`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-xs w-fit"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isId ? '+ Tulis Cerita Baru' : '+ Share Your Story'}</span>
              </Link>
            </div>

            {/* Stories Cards Grid */}
            {filteredStories.length === 0 ? (
              <div className="text-center py-16 px-4 rounded-3xl bg-white border border-dashed border-slate-200 space-y-4">
                <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
                  <BookOpen className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-slate-800 text-base">
                  {isId ? 'Belum ada cerita yang terbit.' : 'No stories found.'}
                </h3>
                <Link
                  href={`/${locale}/stories/create`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isId ? 'Jadilah Penulis Pertama' : 'Write First Story'}</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStories.map((story) => {
                  const cover = getPublicImageUrl(story.cover_image, 'stories');
                  const authorAvatar = getPublicImageUrl(story.author.avatar_url, 'users');
                  const formattedDate = story.created_at
                    ? new Date(story.created_at).toLocaleDateString(isId ? 'id-ID' : 'en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '';

                  return (
                    <article
                      key={story.id}
                      className="group bg-white rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-xl hover:border-amber-300 transition-all flex flex-col justify-between overflow-hidden"
                    >
                      <div>
                        {/* Cover Image with 16:10 ratio & Zoom */}
                        <Link
                          href={`/${locale}/community/stories/${story.slug || story.id}`}
                          className="block relative aspect-[16/10] w-full bg-slate-900 overflow-hidden"
                        >
                          <img
                            src={cover}
                            alt={story.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/images/placeholder-story.webp';
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />

                          {story.cityName && (
                            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-[11px] font-bold text-white flex items-center gap-1 shadow-sm">
                              <MapPin className="w-3 h-3 text-amber-400" />
                              <span>{story.cityName}</span>
                            </div>
                          )}

                          <div className="absolute bottom-3 left-3 text-white text-xs font-semibold flex items-center gap-1.5 drop-shadow-sm">
                            <Clock className="w-3 h-3 text-amber-300" />
                            <span>{story.reading_time || 4} {isId ? 'menit baca' : 'min read'}</span>
                          </div>
                        </Link>

                        {/* Story Content */}
                        <div className="p-5 space-y-2.5">
                          <Link
                            href={`/${locale}/community/stories/${story.slug || story.id}`}
                            className="block"
                          >
                            <h3 className="font-serif font-bold text-base sm:text-lg text-slate-900 group-hover:text-amber-700 transition line-clamp-2 leading-snug">
                              {story.title}
                            </h3>
                          </Link>

                          <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                            {story.excerpt || 'Baca pengalaman lengkap eksplorasi autentik dalam jurnal perjalanan ini.'}
                          </p>
                        </div>
                      </div>

                      {/* Footer: Author & Engagement */}
                      <div className="p-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={authorAvatar}
                            alt={story.author.name}
                            className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-slate-200"
                          />
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-800 truncate block">
                              {story.author.name}
                            </span>
                            <span className="text-[10px] text-amber-700 font-bold block">
                              Level {story.author.level}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 text-xs text-slate-400 font-semibold shrink-0">
                          <span className="flex items-center gap-1 text-rose-600">
                            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                            <span>{story.like_count}</span>
                          </span>

                          <span className="flex items-center gap-1 text-slate-500">
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>{story.comment_count}</span>
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: LEADERBOARD & TOKENOMICS                                           */}
        {/* ========================================================================= */}
        {activeTab === 'leaderboard' && (
          <motion.div
            key="tab-leaderboard"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-10"
          >
            {/* Podium Top 3 */}
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-2xs space-y-8">
              <div className="text-center max-w-xl mx-auto space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>{isId ? 'HALL OF FAME PENJELAJAH' : 'EXPLORERS HALL OF FAME'}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold font-serif text-slate-900">
                  {isId ? 'Papan Peringkat Reputasi XP Teratas' : 'Top XP Reputation Leaderboard'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  {isId
                    ? 'Penjelajah dan pemandu paling berdedikasi yang aktif menerbitkan cerita, memandu tur, dan menginisiasi meetup.'
                    : 'The most active contributors earning real XP reputation points and LTP coin rewards.'}
                </p>
              </div>

              {/* Podium Visual */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-6">
                {/* Juara 2 */}
                {top2 && (
                  <div className="bg-gradient-to-t from-slate-100 to-white rounded-3xl p-6 border border-slate-200 text-center space-y-3 order-2 md:order-1 shadow-sm">
                    <div className="relative w-20 h-20 mx-auto">
                      <img
                        src={getPublicImageUrl(top2.avatar_url, 'users')}
                        alt={top2.name}
                        className="w-full h-full rounded-full object-cover ring-4 ring-slate-300"
                      />
                      <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-slate-300 text-slate-800 font-black text-xs flex items-center justify-center shadow-md">
                        #2
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm truncate">{top2.name}</h4>
                      <span className="text-xs text-slate-500">{top2.cityName || 'Indonesia'}</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-slate-200/60 font-black text-xs text-slate-800">
                      ⚡ {top2.total_xp.toLocaleString()} XP
                    </div>
                  </div>
                )}

                {/* Juara 1 */}
                {top1 && (
                  <div className="bg-gradient-to-t from-amber-500/10 via-amber-500/5 to-white rounded-3xl p-8 border-2 border-amber-400 text-center space-y-4 order-1 md:order-2 shadow-lg relative -mt-4">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow-md">
                      👑 Champion #1
                    </div>
                    <div className="relative w-24 h-24 mx-auto pt-2">
                      <img
                        src={getPublicImageUrl(top1.avatar_url, 'users')}
                        alt={top1.name}
                        className="w-full h-full rounded-full object-cover ring-4 ring-amber-400 shadow-md"
                      />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-base truncate">{top1.name}</h4>
                      <span className="text-xs text-amber-800 font-semibold">{top1.cityName || 'Indonesia'}</span>
                    </div>
                    <div className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-sm shadow-sm">
                      ⚡ {top1.total_xp.toLocaleString()} XP
                    </div>
                  </div>
                )}

                {/* Juara 3 */}
                {top3 && (
                  <div className="bg-gradient-to-t from-amber-900/10 to-white rounded-3xl p-6 border border-amber-200 text-center space-y-3 order-3 md:order-3 shadow-sm">
                    <div className="relative w-20 h-20 mx-auto">
                      <img
                        src={getPublicImageUrl(top3.avatar_url, 'users')}
                        alt={top3.name}
                        className="w-full h-full rounded-full object-cover ring-4 ring-amber-600/40"
                      />
                      <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-amber-700 text-white font-black text-xs flex items-center justify-center shadow-md">
                        #3
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm truncate">{top3.name}</h4>
                      <span className="text-xs text-slate-500">{top3.cityName || 'Indonesia'}</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-950 font-black text-xs">
                      ⚡ {top3.total_xp.toLocaleString()} XP
                    </div>
                  </div>
                )}
              </div>

              {/* Ranks 4-10 Table */}
              <div className="pt-6 border-t border-slate-100 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="pb-3 px-3">Peringkat</th>
                      <th className="pb-3 px-3">Penjelajah</th>
                      <th className="pb-3 px-3">Kota Asal</th>
                      <th className="pb-3 px-3">Tier Badge</th>
                      <th className="pb-3 px-3 text-right">Total XP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {restUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-3 font-mono font-bold text-slate-500">#{user.rank}</td>
                        <td className="py-3 px-3 font-bold text-slate-900 flex items-center gap-2">
                          <img
                            src={getPublicImageUrl(user.avatar_url, 'users')}
                            alt={user.name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <span>{user.name}</span>
                          {user.is_verified && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-500">{user.cityName || 'Indonesia'}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold text-[10px]">
                            {user.tier.badge_icon} Level {user.current_level}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-black text-purple-900">
                          {user.total_xp.toLocaleString()} XP
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tokenomics Calculator */}
            <div className="bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <h3 className="text-xl font-bold font-serif text-white flex items-center gap-2">
                    <Coins className="w-6 h-6 text-amber-400" />
                    <span>{isId ? 'Kalkulator Konversi Koin LTP & Hadiah' : 'LTP Coin Reward Calculator'}</span>
                  </h3>
                  <p className="text-xs text-purple-200 mt-1">
                    {isId
                      ? 'Nilai koin LTP yang diperoleh dapat dicairkan langsung ke rekening bank atau dompet digital.'
                      : 'Convert your community earnings to real cash withdrawals or tour discounts.'}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-purple-300 block">Kurs Acuan Resmi</span>
                  <span className="font-bold text-amber-300 text-sm">100 LTP = $1.00 USD</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-purple-200 block">
                    {isId ? 'Jumlah Koin LTP' : 'LTP Coins Amount'}
                  </label>
                  <input
                    type="number"
                    min={100}
                    step={100}
                    value={calcLtp}
                    onChange={(e) => setCalcLtp(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-black text-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <span className="text-[10px] text-purple-300 block">
                    Minimal pencairan: {minPayoutLtp.toLocaleString()} LTP
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center space-y-1">
                  <span className="text-xs text-purple-300 font-semibold block">Estimasi Nilai USD</span>
                  <span className="text-2xl font-black text-emerald-400 block">${usdVal}</span>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center space-y-1">
                  <span className="text-xs text-purple-300 font-semibold block">Estimasi Nilai Rupiah</span>
                  <span className="text-2xl font-black text-amber-300 block">Rp {idrVal}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* TAB 0: ALL & OVERVIEW                                                     */}
        {/* ========================================================================= */}
        {activeTab === 'all' && (
          <motion.div
            key="tab-all"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-12"
          >
            {/* 3 Pillars Gateway */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div
                onClick={() => setActiveTab('stories')}
                className="group bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs hover:shadow-lg hover:border-amber-300 transition-all flex flex-col justify-between space-y-4 cursor-pointer"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                      <BookOpen className="w-6 h-6 text-amber-600" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800">
                      +50 XP
                    </span>
                  </div>
                  <h3 className="font-serif font-bold text-lg text-slate-900 group-hover:text-amber-700 transition">
                    {isId ? 'Cerita Petualang (Stories)' : 'Travel Stories'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {isId
                      ? 'Catatan perjalanan visual, panduan rute lokal, dan potret fotografi langsung dari para petualang.'
                      : 'Field journals, secret spot routes, and photography essays by global explorers.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-800">
                  <span>{isId ? 'Buka Koleksi Cerita' : 'Read Stories'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              <div
                onClick={() => setActiveTab('meetups')}
                className="group bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs hover:shadow-lg hover:border-emerald-300 transition-all flex flex-col justify-between space-y-4 cursor-pointer"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                      <Users className="w-6 h-6 text-emerald-600" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800">
                      +100 XP & +25 LTP
                    </span>
                  </div>
                  <h3 className="font-serif font-bold text-lg text-slate-900 group-hover:text-emerald-700 transition">
                    {isId ? 'Temu Komunitas (Meetups)' : 'Travel Meetups'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {isId
                      ? 'Agenda kumpul santai, jalan bareng sunrise, hunting kuliner, atau buat pertemuan kotamu sendiri.'
                      : 'Coffee hangouts, sunrise treks, food walks, or organize your own community gathering.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700">
                  <span>{isId ? 'Jelajahi Agenda Temu' : 'Explore Meetups'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              <div
                onClick={() => setActiveTab('forums')}
                className="group bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs hover:shadow-lg hover:border-purple-300 transition-all flex flex-col justify-between space-y-4 cursor-pointer"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                      <MessageSquare className="w-6 h-6 text-purple-600" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-purple-100 text-purple-800">
                      +25 XP & +5 LTP
                    </span>
                  </div>
                  <h3 className="font-serif font-bold text-lg text-slate-900 group-hover:text-purple-700 transition">
                    {isId ? 'Forum Diskusi (Forums)' : 'Discussion Forums'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {isId
                      ? 'Tanya jawab rute hidden gems, tips hemat, kuliner lokal rahasia, dan solusi transportasi perjalanan.'
                      : 'Q&A on hidden routes, budget travel hacks, dining gems, and transport recommendations.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-700">
                  <span>{isId ? 'Buka Forum Diskusi' : 'Explore Forums'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>

            {/* Side-by-side Highlights: Upcoming Meetups & Hot Forum Threads */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Meetups Preview */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                      <Calendar className="w-4 h-4 text-emerald-700" />
                    </span>
                    <div>
                      <h3 className="font-serif font-bold text-base sm:text-lg text-slate-900">
                        {isId ? 'Agenda Temu Terdekat' : 'Upcoming Meetups'}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {isId ? 'Jalan bareng sesama penjelajah' : 'Explore together with fellow travelers'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('meetups')}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>{isId ? 'Lihat Semua' : 'View All'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {upcomingMeetups.slice(0, 3).map((meetup) => {
                    const cover = resolveMeetupDisplayImage(
                      meetup.images,
                      meetup.city_image_url
                    );
                    const formattedDate = new Date(meetup.start_date).toLocaleDateString(
                      isId ? 'id-ID' : 'en-US',
                      { day: 'numeric', month: 'short', year: 'numeric' }
                    );

                    return (
                      <div
                        key={meetup.id}
                        className="group rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-emerald-200 hover:shadow-md transition p-3.5 sm:p-4 flex flex-col sm:flex-row gap-4"
                      >
                        <Link
                          href={`/${locale}/community/meetups/${meetup.slug || meetup.id}`}
                          className="relative w-full sm:w-36 h-28 rounded-xl overflow-hidden shrink-0 bg-slate-200"
                        >
                          <img
                            src={cover}
                            alt={meetup.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-[10px] font-bold text-white flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5 text-emerald-400" />
                            <span>{formattedDate}</span>
                          </div>
                        </Link>

                        <div className="flex-1 flex flex-col justify-between min-w-0 space-y-2">
                          <div>
                            <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold mb-1">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate">{meetup.city_name}</span>
                            </div>
                            <Link
                              href={`/${locale}/community/meetups/${meetup.slug || meetup.id}`}
                              className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition line-clamp-2 leading-snug"
                            >
                              {meetup.title}
                            </Link>
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                            <span className="text-slate-500 text-[11px]">
                              Host: <strong className="text-slate-800">{meetup.creator.name}</strong>
                            </span>
                            <span className="font-semibold text-emerald-700 text-xs">
                              👥 {meetup.members_count} {isId ? 'peserta' : 'joined'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Forums Preview */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-purple-100 text-purple-700">
                      <MessageSquare className="w-4 h-4 text-purple-700" />
                    </span>
                    <div>
                      <h3 className="font-serif font-bold text-base sm:text-lg text-slate-900">
                        {isId ? 'Diskusi Forum Terhangat' : 'Hot Forum Discussions'}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {isId ? 'Topik rute & rekomendasi terpopuler' : 'Popular tips and route debates'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('forums')}
                    className="text-xs font-bold text-purple-700 hover:text-purple-900 transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>{isId ? 'Lihat Semua' : 'View All'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {recentThreads.slice(0, 3).map((thread) => (
                    <div
                      key={thread.id}
                      className="group rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-purple-200 hover:shadow-md transition p-4 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        {thread.category ? (
                          <span className="px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[11px] font-semibold">
                            {thread.category.name}
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-semibold">
                            {isId ? 'Umum' : 'General'}
                          </span>
                        )}

                        <div className="flex items-center gap-3 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1 font-semibold text-slate-600">
                            💬 {thread.reply_count}
                          </span>
                          <span className="flex items-center gap-1 font-semibold text-rose-600">
                            ▲ {thread.like_count}
                          </span>
                        </div>
                      </div>

                      <Link
                        href={`/${locale}/community/forums/${thread.slug || thread.id}`}
                        className="block font-serif font-bold text-sm text-slate-900 group-hover:text-purple-700 transition line-clamp-2 leading-snug"
                      >
                        {thread.title}
                      </Link>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>Oleh: <strong className="text-slate-800">{thread.author.name}</strong></span>
                        <Link
                          href={`/${locale}/community/forums/${thread.slug || thread.id}`}
                          className="font-bold text-purple-700 hover:text-purple-900"
                        >
                          Buka →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Travel Stories Highlights Bar */}
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif font-bold text-xl sm:text-2xl text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-amber-600" />
                    <span>{isId ? 'Jurnal Cerita Pilihan' : 'Curated Travel Stories'}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isId ? 'Inspirasi rute dan pengalaman otentik langsung dari lapangan' : 'Field essays and routes from local travelers'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('stories')}
                  className="text-xs font-bold text-amber-700 hover:text-amber-900 transition flex items-center gap-1 cursor-pointer"
                >
                  <span>{isId ? 'Jelajahi Semua Cerita' : 'View All Stories'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentStories.slice(0, 3).map((story) => {
                  const cover = getPublicImageUrl(story.cover_image, 'stories');
                  return (
                    <article
                      key={story.id}
                      className="group bg-white rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-xl hover:border-amber-300 transition-all overflow-hidden flex flex-col justify-between"
                    >
                      <Link
                        href={`/${locale}/community/stories/${story.slug || story.id}`}
                        className="block relative aspect-[16/10] w-full bg-slate-900 overflow-hidden"
                      >
                        <img
                          src={cover}
                          alt={story.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        />
                        {story.cityName && (
                          <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-md text-[10px] font-bold text-white flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-amber-400" />
                            <span>{story.cityName}</span>
                          </div>
                        )}
                      </Link>

                      <div className="p-5 space-y-2">
                        <Link
                          href={`/${locale}/community/stories/${story.slug || story.id}`}
                          className="font-serif font-bold text-sm sm:text-base text-slate-900 group-hover:text-amber-700 transition line-clamp-2 leading-snug"
                        >
                          {story.title}
                        </Link>
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {story.excerpt || 'Baca jurnal eksplorasi selengkapnya.'}
                        </p>
                      </div>

                      <div className="p-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
                        <span className="font-semibold text-slate-700">{story.author.name}</span>
                        <span className="text-rose-600 font-bold flex items-center gap-1">
                          <Heart className="w-3 h-3 fill-rose-500" />
                          <span>{story.like_count}</span>
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
