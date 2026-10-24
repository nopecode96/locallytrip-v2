'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Compass,
  MapPin,
  Calendar,
  MessageSquare,
  Users,
  BookOpen,
  Sparkles,
  ChevronRight,
  Coins,
  ArrowRight,
  Clock,
  Star,
  Share2,
  Check,
  X,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { Locale } from '@/lib/i18n';
import { Dictionary } from '@/lib/dictionary';
import { FollowButton } from '@/components/shared/FollowButton';
import { resolveAvatarUrl } from '@/lib/avatar';
import { UserAvatar } from '@/components/common/UserAvatar';
import { getOrCreateDirectConversation } from '@/actions/community/meetups';
import {
  resolveStoryImage,
  resolveMeetupImage,
  resolveExperienceImage,
  resolveMeetupDisplayImage,
} from '@/lib/utils/images';

export interface UserProfileData {
  id: number;
  name: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  role: string;
  is_host: boolean;
  is_verified: boolean;
  created_at: string;
  city: {
    id: number;
    name: string;
    country_code?: string | null;
    image_url: string | null;
  } | null;
  xp: {
    total_xp: number;
    current_level: number;
  };
  followersCount: number;
  followingCount: number;
  initialIsFollowing?: boolean;
  experiences: Array<{
    id: number;
    title: string;
    slug: string;
    price: number;
    currency: string;
    rating: number;
    ratingCount: number;
    durationHours: number;
    image: string;
    cityName: string;
    categoryName: string;
    categoryIcon?: string | null;
  }>;
  hostTourReviews?: Array<{
    id: number;
    rating: number;
    comment?: string | null;
    host_reply?: string | null;
    host_replied_at?: string | null;
    created_at: string;
    guest: {
      id: number;
      name: string;
      avatar_url?: string | null;
      cityName?: string | null;
    };
    experience: {
      id: number;
      title: string;
      slug?: string | null;
    };
  }>;
  stories: Array<{
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    cover_image: string | null;
    images: any;
    created_at: string;
    reading_time: number;
    like_count: number;
    city: {
      id: number;
      name: string;
    } | null;
  }>;
  hostedMeetups: Array<{
    id: number;
    title: string;
    slug: string;
    description: string | null;
    start_date: string;
    end_date: string;
    duration_days: number | null;
    current_member_count: number;
    max_members: number;
    join_type: string;
    images: any;
    city: {
      id: number;
      name: string;
      image_url: string | null;
    } | null;
    category: {
      id: number;
      name: string;
      icon?: string | null;
    } | null;
  }>;
  joinedMeetups: Array<{
    id: number;
    title: string;
    slug: string;
    description: string | null;
    start_date: string;
    end_date: string;
    duration_days: number | null;
    current_member_count: number;
    max_members: number;
    join_type: string;
    images: any;
    city: {
      id: number;
      name: string;
      image_url: string | null;
    } | null;
    category: {
      id: number;
      name: string;
      icon?: string | null;
    } | null;
  }>;
  threads: Array<{
    id: number;
    title: string;
    slug: string;
    content: string;
    created_at: string | null;
    like_count: number;
    reply_count: number;
    category: {
      id: number;
      name: string;
      slug: string;
      icon?: string | null;
    } | null;
  }>;
  reviews?: Array<{
    id: number;
    rating: number;
    title?: string | null;
    comment?: string | null;
    created_at: string;
    experience?: {
      id: number;
      title: string;
      slug?: string | null;
      image: string;
      cityName?: string | null;
    } | null;
  }>;
}

export interface CurrentUserSessionData {
  id: number;
  name: string;
  email: string;
  avatar_url?: string | null;
  isLoggedIn: boolean;
}

export interface TierBadgeData {
  level: number;
  name_id: string;
  name_en: string;
  badge_icon: string;
}

interface UserProfileClientProps {
  profile: UserProfileData;
  currentUser: CurrentUserSessionData | null;
  locale: Locale;
  dict: Dictionary;
  tierBadge?: TierBadgeData | null;
  isOwnProfile?: boolean;
  ownerLtpBalance?: number;
}

export function UserProfileClient({
  profile,
  currentUser,
  locale,
  dict,
  tierBadge,
  isOwnProfile,
  ownerLtpBalance = 0,
}: UserProfileClientProps) {
  const isId = locale === 'id';
  const router = useRouter();

  const isHost = Boolean(profile.is_host);
  const hasApprovedKyc = isHost && Boolean(profile.is_verified);

  // Tabulasi Adaptif:
  // Jika Host: Default 'experiences'
  // Jika Traveller: Default 'stories' (experiences & reviews disembunyikan)
  const defaultTab = isHost && profile.experiences.length > 0 ? 'experiences' : (isHost ? 'experiences' : 'stories');
  const [activeTab, setActiveTab] = useState<'experiences' | 'reviews' | 'stories' | 'meetups' | 'threads'>(defaultTab);

  // Pagination mandiri per tab (Incremental load)
  const PAGE_SIZE = 6;
  const [visibleCounts, setVisibleCounts] = useState({
    experiences: PAGE_SIZE,
    reviews: PAGE_SIZE,
    stories: PAGE_SIZE,
    meetups: PAGE_SIZE,
    threads: 8,
  });

  const handleLoadMore = (tabKey: keyof typeof visibleCounts) => {
    setVisibleCounts((prev) => ({
      ...prev,
      [tabKey]: prev[tabKey] + PAGE_SIZE,
    }));
  };

  // Follow State
  const [isFollowing, setIsFollowing] = useState(Boolean(profile.initialIsFollowing));
  const [followersCount, setFollowersCount] = useState(profile.followersCount || 0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 3500);
  };

  // Chat/DM state
  const [isDirectChatLoading, setIsDirectChatLoading] = useState(false);

  const handleSendMessageToUser = async () => {
    if (!currentUser?.isLoggedIn) {
      router.push(`/${locale}/login?callbackUrl=/${locale}/users/${profile.username}`);
      return;
    }

    if (currentUser.id === profile.id) {
      showToast(isId ? 'Anda tidak dapat mengirim pesan ke akun sendiri.' : 'You cannot message yourself.');
      return;
    }

    setIsDirectChatLoading(true);
    try {
      const res = await getOrCreateDirectConversation(profile.id);
      if (res.success && res.conversationId) {
        router.push(`/${locale}/messages?conversationId=${res.conversationId}`);
      } else {
        router.push(`/${locale}/messages`);
      }
    } catch {
      router.push(`/${locale}/messages`);
    } finally {
      setIsDirectChatLoading(false);
    }
  };

  // Tip Modal State
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [tipAmount, setTipAmount] = useState<number>(5);
  const [isTipping, setIsTipping] = useState(false);
  const [tipSuccessMessage, setTipSuccessMessage] = useState<string | null>(null);

  const handleOpenTipModal = () => {
    if (!currentUser?.isLoggedIn) {
      router.push(`/${locale}/login?callbackUrl=/${locale}/users/${profile.username}`);
      return;
    }
    setTipSuccessMessage(null);
    setIsTipModalOpen(true);
  };

  const handleSubmitTip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.isLoggedIn) return;

    setIsTipping(true);
    try {
      // Simulasi / panggil endpoint tip
      await new Promise((r) => setTimeout(r, 800));
      setTipSuccessMessage(
        isId
          ? `🎉 Berhasil mengirim tip ${tipAmount} LTP ke ${profile.name}!`
          : `🎉 Successfully tipped ${tipAmount} LTP to ${profile.name}!`
      );
      setTimeout(() => {
        setIsTipModalOpen(false);
      }, 1800);
    } catch {
      showToast(isId ? 'Gagal mengirim tip LTP.' : 'Failed to send tip.');
    } finally {
      setIsTipping(false);
    }
  };

  // Format avatar URL aman
  const avatarUrl = resolveAvatarUrl(profile.avatar_url);
  const joinYear = new Date(profile.created_at).getFullYear();

  // Koleksi gabungan meetups
  const allMeetups = [...profile.hostedMeetups, ...profile.joinedMeetups];
  const hostTourReviews = profile.hostTourReviews || [];

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      {/* Toast Notifikasi */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 backdrop-blur-md text-white text-xs sm:text-sm font-semibold px-4 py-3 rounded-2xl shadow-2xl border border-slate-700/60 animate-in slide-in-from-bottom-3 duration-200">
          {toastMessage}
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. HERO PERSONA HEADER (Banner & Identitas Profil)         */}
      {/* ======================================================== */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Banner Cover Gradien */}
        <div className="relative h-44 sm:h-56 md:h-64 w-full bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 overflow-hidden shadow-inner">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.12),transparent)]" />
          <div className="absolute -right-12 -bottom-12 w-60 h-60 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute left-1/4 top-0 w-44 h-44 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />

          {/* Badge Peran di Sudut Banner */}
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/30 backdrop-blur-md border border-white/20 text-xs font-semibold text-white shadow-xs">
              {isHost ? '✨ Local Host' : '🧭 Traveler Explorer'}
            </span>
          </div>
        </div>

        {/* Konten Hero Info Pengguna */}
        <div className="relative px-6 sm:px-10 pb-8 pt-4">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-6">
            {/* Avatar & Info Utama */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 sm:gap-6 text-center sm:text-left min-w-0 flex-1">
              {/* Avatar dengan Ring Putih Tebal 4px */}
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full ring-4 ring-white shadow-xl overflow-hidden bg-slate-100 shrink-0 -mt-14 sm:-mt-16">
                <Image
                  src={avatarUrl}
                  alt={profile.name || 'User Profile'}
                  fill
                  sizes="(max-width: 640px) 96px, 112px"
                  className="object-cover"
                  priority
                />
              </div>

              {/* Teks Identitas */}
              <div className="min-w-0 flex-1 space-y-2 pb-1">
                {/* Baris 1: Nama Pengguna + Badge KYC / Role */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-serif break-words">
                    {profile.name}
                  </h1>

                  {/* PENEGAKAN LOGIKA BADGE KYC (HOST ONLY) */}
                  {hasApprovedKyc ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold shadow-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>KYC Verified Local Host</span>
                    </span>
                  ) : isHost ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-medium">
                      <Compass className="w-3.5 h-3.5 text-purple-500" />
                      <span>Local Host</span>
                    </span>
                  ) : (
                    /* DILARANG KERAS menampilkan badge KYC pada Traveller */
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium">
                      <Compass className="w-3.5 h-3.5 text-slate-500" />
                      <span>Traveler</span>
                    </span>
                  )}
                </div>

                {/* Baris 2: Badge Level Reputasi XP */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-0.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200/70 shadow-2xs">
                    <span>{tierBadge?.badge_icon || '👑'}</span>
                    <span>
                      LV {profile.xp?.current_level || 1} • {isId ? (tierBadge?.name_id || 'Penjelajah') : (tierBadge?.name_en || 'Explorer')}
                    </span>
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-500 font-medium">
                    ⭐ {profile.xp?.total_xp || 0} XP
                  </span>
                </div>

                {/* Baris 3: Metadata (@username, Lokasi, Tahun Bergabung) */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-xs sm:text-sm text-slate-500 pt-0.5">
                  <span className="font-semibold text-purple-700">@{profile.username}</span>
                  {profile.city && (
                    <span className="flex items-center gap-1 text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{profile.city.name}</span>
                    </span>
                  )}
                  <span className="text-slate-400">•</span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {isId ? 'Bergabung sejak' : 'Joined'} {joinYear}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Tombol Aksi Kanan */}
            <div className="flex flex-wrap items-center justify-center lg:justify-end gap-2.5 shrink-0 pt-2 lg:pt-0 lg:self-center">
              {!isOwnProfile ? (
                <>
                  <FollowButton
                    targetUserId={profile.id}
                    initialIsFollowing={isFollowing}
                    initialFollowersCount={followersCount}
                    onFollowChange={(nextFollowing, nextCount) => {
                      setIsFollowing(nextFollowing);
                      setFollowersCount(nextCount);
                    }}
                    lang={locale}
                    targetUserName={profile.name}
                    variant="default"
                  />
                  <button
                    type="button"
                    onClick={handleSendMessageToUser}
                    disabled={isDirectChatLoading}
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs shadow-2xs transition flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-75 min-h-[40px]"
                    title={isId ? 'Kirim Pesan Langsung' : 'Send Message'}
                  >
                    {isDirectChatLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-700" />
                    ) : (
                      <MessageSquare className="w-3.5 h-3.5 text-purple-700" />
                    )}
                    <span>{isId ? 'Kirim Pesan' : 'Message'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenTipModal}
                    className="px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer active:scale-95 min-h-[40px]"
                  >
                    <span>🪙</span>
                    <span>{isId ? 'Beri Tip LTP' : 'Tip LTP'}</span>
                  </button>
                </>
              ) : (
                <Link
                  href={`/${locale}/dashboard/settings`}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center gap-2 shadow-xs active:scale-95 min-h-[40px]"
                >
                  <span>✏️</span>
                  <span>{isId ? 'Edit Profil' : 'Edit Profile'}</span>
                </Link>
              )}
            </div>
          </div>

          {/* Bio Singkat Pengguna */}
          {profile.bio && (
            <div className="max-w-3xl pt-2 pb-2 text-xs sm:text-sm text-slate-600 leading-relaxed text-center sm:text-left border-t border-slate-100">
              <p>{profile.bio}</p>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. BAR METRIK AKTIVITAS KOMUNITAS (4 Kartu Ringkas)       */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Kartu 1: Tur Dipandu (Host) atau Aktivitas Diikuti (Traveller) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            {isHost ? (isId ? 'Tur Dipandu' : 'Tours Hosted') : (isId ? 'Aktivitas Diikuti' : 'Activities Joined')}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-serif my-1">
            {isHost ? profile.experiences.length : (allMeetups.length + (profile.reviews?.length || 0))}
          </div>
          <div className="text-[11px] text-slate-500">
            {isHost ? (isId ? 'Paket tur aktif' : 'Active published tours') : (isId ? 'Meetup & partisipasi tur' : 'Meetups & bookings')}
          </div>
        </div>

        {/* Kartu 2: Cerita Perjalanan Diterbitkan */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            {isId ? 'Cerita Perjalanan' : 'Stories Published'}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-serif my-1">
            {profile.stories.length}
          </div>
          <div className="text-[11px] text-slate-500">
            {isId ? 'Artikel catatan perjalanan' : 'Published travel articles'}
          </div>
        </div>

        {/* Kartu 3: Agenda Meetup */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            {isId ? 'Agenda Meetup' : 'Meetups'}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-serif my-1">
            {allMeetups.length}
          </div>
          <div className="text-[11px] text-slate-500">
            {isId ? 'Inisiasi & partisipasi' : 'Organized & joined'}
          </div>
        </div>

        {/* Kartu 4: Reputasi Komunitas */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            {isId ? 'Reputasi Komunitas' : 'Reputation Score'}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-900 font-serif my-1 flex items-center gap-1.5">
            <Star className="w-5 h-5 fill-amber-400 text-amber-500 shrink-0" />
            <span>{profile.xp?.total_xp || 0} XP</span>
          </div>
          <div className="text-[11px] text-purple-700 font-semibold">
            LV {profile.xp?.current_level || 1} • {tierBadge?.name_id || 'Explorer'}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. TABULASI KONTEN ADAPTIF (Polymorphic Content Tabs)     */}
      {/* ======================================================== */}
      <div className="space-y-6">
        {/* Tab Navigation Pill Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200">
          {/* TAB KHUSUS HOST: Pengalaman Tur */}
          {isHost && (
            <button
              type="button"
              onClick={() => setActiveTab('experiences')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 min-h-[40px] ${
                activeTab === 'experiences'
                  ? 'bg-purple-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-purple-900 hover:bg-purple-50/50 border border-slate-200'
              }`}
            >
              <span>🌟</span>
              <span>{isId ? 'Pengalaman Tur' : 'Tour Experiences'}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeTab === 'experiences' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {profile.experiences.length}
              </span>
            </button>
          )}

          {/* TAB KHUSUS HOST: Ulasan Tamu */}
          {isHost && (
            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 min-h-[40px] ${
                activeTab === 'reviews'
                  ? 'bg-purple-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-purple-900 hover:bg-purple-50/50 border border-slate-200'
              }`}
            >
              <span>⭐</span>
              <span>{isId ? 'Ulasan Tamu' : 'Guest Reviews'}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeTab === 'reviews' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {hostTourReviews.length}
              </span>
            </button>
          )}

          {/* TAB: Cerita Perjalanan (Semua Peran, Default Traveller) */}
          <button
            type="button"
            onClick={() => setActiveTab('stories')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 min-h-[40px] ${
              activeTab === 'stories'
                ? 'bg-purple-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-purple-900 hover:bg-purple-50/50 border border-slate-200'
            }`}
          >
            <span>📖</span>
            <span>{isId ? 'Cerita Perjalanan' : 'Travel Stories'}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === 'stories' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {profile.stories.length}
            </span>
          </button>

          {/* TAB: Agenda Meetup */}
          <button
            type="button"
            onClick={() => setActiveTab('meetups')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 min-h-[40px] ${
              activeTab === 'meetups'
                ? 'bg-purple-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-purple-900 hover:bg-purple-50/50 border border-slate-200'
            }`}
          >
            <span>🎒</span>
            <span>{isId ? 'Agenda Meetup' : 'Meetups'}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === 'meetups' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {allMeetups.length}
            </span>
          </button>

          {/* TAB: Diskusi Forum */}
          <button
            type="button"
            onClick={() => setActiveTab('threads')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 min-h-[40px] ${
              activeTab === 'threads'
                ? 'bg-purple-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-purple-900 hover:bg-purple-50/50 border border-slate-200'
            }`}
          >
            <span>💬</span>
            <span>{isId ? 'Diskusi Forum' : 'Forum Topics'}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === 'threads' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {profile.threads.length}
            </span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* KONTEN TAB 1 (HOST ONLY): PENGALAMAN TUR                  */}
        {/* ======================================================== */}
        {isHost && activeTab === 'experiences' && (
          <div>
            {profile.experiences.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-slate-200/90 shadow-2xs max-w-lg mx-auto space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center mx-auto text-2xl">
                  🌟
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  {isId ? 'Belum Ada Tur yang Dipublikasikan' : 'No Active Tours Published'}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {isId
                    ? 'Host ini belum mempublikasikan tur aktif.'
                    : 'This host has not published any active tours yet.'}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {profile.experiences.slice(0, visibleCounts.experiences).map((exp) => (
                    <div
                      key={exp.id}
                      className="group bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:border-purple-200 overflow-hidden hover:shadow-xl hover:shadow-purple-950/5 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
                    >
                      {/* Media Image */}
                      <Link href={`/${locale}/experiences/${exp.slug}`} className="block relative aspect-[4/3] bg-slate-100 overflow-hidden">
                        <img
                          src={resolveExperienceImage(exp.image)}
                          alt={exp.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (target.src !== '/images/placeholder-experience.webp') {
                              target.src = '/images/placeholder-experience.webp';
                            }
                          }}
                        />
                        <div className="absolute top-3 left-3 flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-slate-900/80 backdrop-blur-md text-white px-2.5 py-1 rounded-lg border border-white/10 shadow-xs">
                            <span>{exp.categoryName}</span>
                            <span>•</span>
                            <span>{exp.cityName}</span>
                          </span>
                        </div>
                      </Link>

                      {/* Content Body */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <Link href={`/${locale}/experiences/${exp.slug}`} className="block group/link">
                            <h3 className="font-serif font-bold text-base text-slate-900 group-hover/link:text-purple-900 transition line-clamp-2 leading-snug">
                              {exp.title}
                            </h3>
                          </Link>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100">
                          <div className="flex items-center gap-1.5">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                            <span className="font-bold text-slate-800">{exp.rating.toFixed(1)}</span>
                            <span className="text-[11px] text-slate-400 font-medium">({exp.ratingCount})</span>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block">{isId ? 'Mulai dari' : 'From'}</span>
                            <span className="text-sm font-black text-slate-900">
                              {exp.currency === 'USD' ? `$${exp.price}` : `Rp ${exp.price.toLocaleString('id-ID')}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {profile.experiences.length > visibleCounts.experiences && (
                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => handleLoadMore('experiences')}
                      className="px-6 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm border border-slate-200 shadow-2xs hover:border-purple-300 transition cursor-pointer"
                    >
                      {isId
                        ? `Muat Lebih Banyak Tur (${profile.experiences.length - visibleCounts.experiences} tersisa) ↓`
                        : `Load More Tours (${profile.experiences.length - visibleCounts.experiences} remaining) ↓`}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* KONTEN TAB 2 (HOST ONLY): ULASAN TAMU                     */}
        {/* ======================================================== */}
        {isHost && activeTab === 'reviews' && (
          <div>
            {hostTourReviews.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-slate-200/90 shadow-2xs max-w-lg mx-auto space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-2xl">
                  ⭐
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  {isId ? 'Belum Ada Ulasan Tamu' : 'No Guest Reviews Yet'}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {isId
                    ? 'Belum ada ulasan dari tamu untuk tur yang dipandu.'
                    : 'No guest reviews received yet for tours guided by this host.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hostTourReviews.slice(0, visibleCounts.reviews).map((rev) => (
                    <div
                      key={rev.id}
                      className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <UserAvatar
                              src={rev.guest.avatar_url}
                              name={rev.guest.name}
                              size={38}
                              className="border border-slate-200"
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs sm:text-sm text-slate-900">
                                  {rev.guest.name}
                                </span>
                                {rev.guest.cityName && (
                                  <span className="text-[10px] text-slate-400 font-normal">
                                    • {rev.guest.cityName}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400">
                                {new Date(rev.created_at).toLocaleDateString(
                                  locale === 'en' ? 'en-US' : 'id-ID',
                                  { month: 'short', day: 'numeric', year: 'numeric' }
                                )}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${
                                  i < rev.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        {rev.experience.title && (
                          <div className="text-[11px] font-semibold text-purple-700 flex items-center gap-1">
                            <span>Tur:</span>
                            {rev.experience.slug ? (
                              <Link
                                href={`/${locale}/experiences/${rev.experience.slug}`}
                                className="hover:underline line-clamp-1"
                              >
                                {rev.experience.title}
                              </Link>
                            ) : (
                              <span className="line-clamp-1">{rev.experience.title}</span>
                            )}
                          </div>
                        )}

                        <p className="text-xs text-slate-700 leading-relaxed italic bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
                          "{rev.comment}"
                        </p>
                      </div>

                      {/* Tanggapan Resmi Host */}
                      {rev.host_reply && (
                        <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100 text-xs space-y-1 mt-2">
                          <div className="flex items-center gap-2 font-bold text-purple-900 text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                            <span>{isId ? `Tanggapan dari Pemandu (${profile.name}):` : `Response from Host (${profile.name}):`}</span>
                            {rev.host_replied_at && (
                              <span className="text-slate-400 font-normal">
                                • {new Date(rev.host_replied_at).toLocaleDateString(
                                  locale === 'en' ? 'en-US' : 'id-ID',
                                  { month: 'short', day: 'numeric' }
                                )}
                              </span>
                            )}
                          </div>
                          <p className="text-slate-700 italic">"{rev.host_reply}"</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {hostTourReviews.length > visibleCounts.reviews && (
                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => handleLoadMore('reviews')}
                      className="px-6 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm border border-slate-200 shadow-2xs hover:border-purple-300 transition cursor-pointer"
                    >
                      {isId
                        ? `Muat Lebih Banyak Ulasan (${hostTourReviews.length - visibleCounts.reviews} tersisa) ↓`
                        : `Load More Reviews (${hostTourReviews.length - visibleCounts.reviews} remaining) ↓`}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* KONTEN TAB 3: CERITA PERJALANAN (Stories)                */}
        {/* ======================================================== */}
        {activeTab === 'stories' && (
          <div>
            {profile.stories.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-slate-200/90 shadow-2xs max-w-lg mx-auto space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center mx-auto text-2xl">
                  📖
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  {isId ? 'Belum Ada Cerita Perjalanan' : 'No Travel Stories Published'}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {isId
                    ? 'Pengguna ini belum mempublikasikan cerita perjalanan.'
                    : 'This user has not published any travel stories yet.'}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {profile.stories.slice(0, visibleCounts.stories).map((story) => (
                    <div
                      key={story.id}
                      className="group bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:border-purple-200 overflow-hidden hover:shadow-xl hover:shadow-purple-950/5 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
                    >
                      <Link href={`/${locale}/stories/${story.slug}`} className="block relative aspect-[16/10] bg-slate-100 overflow-hidden">
                        <img
                          src={resolveStoryImage(
                            story.cover_image ||
                              (Array.isArray(story.images) && story.images.length > 0 ? story.images[0] : null)
                          )}
                          alt={story.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (target.src !== '/images/placeholder-story.webp') {
                              target.src = '/images/placeholder-story.webp';
                            }
                          }}
                        />
                        {story.city && (
                          <div className="absolute top-3 left-3">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-slate-900/80 backdrop-blur-md text-white px-2.5 py-1 rounded-lg border border-white/10 shadow-xs">
                              <MapPin className="w-3 h-3 text-purple-300" />
                              <span>{story.city.name}</span>
                            </span>
                          </div>
                        )}
                      </Link>

                      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <Clock className="w-3 h-3" />
                            <span>{story.reading_time || 4} min baca</span>
                            <span>•</span>
                            <span>
                              {new Date(story.created_at).toLocaleDateString(
                                locale === 'en' ? 'en-US' : 'id-ID',
                                { month: 'short', day: 'numeric', year: 'numeric' }
                              )}
                            </span>
                          </div>

                          <Link href={`/${locale}/stories/${story.slug}`} className="block group/link">
                            <h3 className="font-serif font-bold text-base text-slate-900 group-hover/link:text-purple-900 transition line-clamp-2 leading-snug">
                              {story.title}
                            </h3>
                          </Link>

                          {story.excerpt && (
                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                              {story.excerpt}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100 text-slate-400">
                          <span>❤️ {story.like_count || 0} suka</span>
                          <Link
                            href={`/${locale}/stories/${story.slug}`}
                            className="font-bold text-purple-700 hover:text-purple-900 inline-flex items-center gap-1"
                          >
                            <span>{isId ? 'Baca Selengkapnya' : 'Read More'}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {profile.stories.length > visibleCounts.stories && (
                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => handleLoadMore('stories')}
                      className="px-6 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm border border-slate-200 shadow-2xs hover:border-purple-300 transition cursor-pointer"
                    >
                      {isId
                        ? `Muat Lebih Banyak Cerita (${profile.stories.length - visibleCounts.stories} tersisa) ↓`
                        : `Load More Stories (${profile.stories.length - visibleCounts.stories} remaining) ↓`}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* KONTEN TAB 4: AGENDA MEETUP                              */}
        {/* ======================================================== */}
        {activeTab === 'meetups' && (
          <div>
            {allMeetups.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-slate-200/90 shadow-2xs max-w-lg mx-auto space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto text-2xl">
                  🎒
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  {isId ? 'Belum Ada Agenda Meetup' : 'No Meetups Found'}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {isId
                    ? 'Belum ada agenda meetup yang diselenggarakan.'
                    : 'No community meetups hosted yet.'}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allMeetups.slice(0, visibleCounts.meetups).map((meetup) => (
                    <div
                      key={meetup.id}
                      className="group bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:border-purple-200 overflow-hidden hover:shadow-xl hover:shadow-purple-950/5 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
                    >
                      <Link href={`/${locale}/community/meetups/${meetup.slug}`} className="block relative aspect-[16/10] bg-slate-100 overflow-hidden">
                        <img
                          src={resolveMeetupDisplayImage(
                            meetup.images,
                            meetup.city?.image_url
                          )}
                          alt={meetup.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (target.src !== '/images/placeholder-meetup.webp') {
                              target.src = '/images/placeholder-meetup.webp';
                            }
                          }}
                        />
                        {meetup.city && (
                          <div className="absolute top-3 left-3">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-slate-900/80 backdrop-blur-md text-white px-2.5 py-1 rounded-lg border border-white/10 shadow-xs">
                              <MapPin className="w-3 h-3 text-orange-300" />
                              <span>{meetup.city.name}</span>
                            </span>
                          </div>
                        )}
                      </Link>

                      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {new Date(meetup.start_date).toLocaleDateString(
                                locale === 'en' ? 'en-US' : 'id-ID',
                                { month: 'short', day: 'numeric', year: 'numeric' }
                              )}
                            </span>
                          </div>

                          <Link href={`/${locale}/community/meetups/${meetup.slug}`} className="block group/link">
                            <h3 className="font-serif font-bold text-base text-slate-900 group-hover/link:text-purple-900 transition line-clamp-2 leading-snug">
                              {meetup.title}
                            </h3>
                          </Link>

                          {meetup.description && (
                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                              {meetup.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100">
                          <span className="inline-flex items-center gap-1 text-slate-600 font-semibold">
                            <Users className="w-3.5 h-3.5 text-purple-600" />
                            <span>{meetup.current_member_count}/{meetup.max_members} peserta</span>
                          </span>

                          <Link
                            href={`/${locale}/community/meetups/${meetup.slug}`}
                            className="font-bold text-purple-700 hover:text-purple-900 inline-flex items-center gap-1"
                          >
                            <span>{isId ? 'Detail Meetup' : 'Details'}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {allMeetups.length > visibleCounts.meetups && (
                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => handleLoadMore('meetups')}
                      className="px-6 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm border border-slate-200 shadow-2xs hover:border-purple-300 transition cursor-pointer"
                    >
                      {isId
                        ? `Muat Lebih Banyak Meetup (${allMeetups.length - visibleCounts.meetups} tersisa) ↓`
                        : `Load More Meetups (${allMeetups.length - visibleCounts.meetups} remaining) ↓`}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* KONTEN TAB 5: DISKUSI FORUM                              */}
        {/* ======================================================== */}
        {activeTab === 'threads' && (
          <div>
            {profile.threads.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-slate-200/90 shadow-2xs max-w-lg mx-auto space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto text-2xl">
                  💬
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  {isId ? 'Belum Ada Topik Diskusi' : 'No Forum Discussions'}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {isId
                    ? 'Belum ada topik diskusi yang dibuat.'
                    : 'No forum discussions started yet.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  {profile.threads.slice(0, visibleCounts.threads).map((thread) => (
                    <div
                      key={thread.id}
                      className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs hover:border-purple-200 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        {thread.category && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                            <span>{thread.category.icon || '🏷️'}</span>
                            <span>{thread.category.name}</span>
                          </span>
                        )}

                        <Link href={`/${locale}/community/forums/${thread.slug}`} className="block group">
                          <h4 className="font-serif font-bold text-sm sm:text-base text-slate-900 group-hover:text-purple-900 transition line-clamp-1">
                            {thread.title}
                          </h4>
                        </Link>

                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {thread.content}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-400 shrink-0 self-end sm:self-center">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                          <span>{thread.reply_count} balasan</span>
                        </span>
                        <Link
                          href={`/${locale}/community/forums/${thread.slug}`}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-purple-50 hover:text-purple-900 text-slate-700 font-bold text-xs transition"
                        >
                          {isId ? 'Buka Diskusi' : 'View Thread'}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                {profile.threads.length > visibleCounts.threads && (
                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => handleLoadMore('threads')}
                      className="px-6 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm border border-slate-200 shadow-2xs hover:border-purple-300 transition cursor-pointer"
                    >
                      {isId
                        ? `Muat Lebih Banyak Topik (${profile.threads.length - visibleCounts.threads} tersisa) ↓`
                        : `Load More Topics (${profile.threads.length - visibleCounts.threads} remaining) ↓`}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL TIP LTP INTERAKTIF                                 */}
      {/* ======================================================== */}
      {isTipModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 relative animate-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setIsTipModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-2xl shrink-0">
                🪙
              </div>
              <div>
                <h3 className="font-serif font-bold text-slate-900 text-base">
                  {isId ? `Kirim Tip LTP ke ${profile.name}` : `Tip LTP Coins to ${profile.name}`}
                </h3>
                <p className="text-xs text-slate-500">
                  {isId ? 'Apresiasi traveler & kontribusi komunitas' : 'Support traveler & local contributions'}
                </p>
              </div>
            </div>

            {tipSuccessMessage ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold text-center space-y-1">
                <span>{tipSuccessMessage}</span>
              </div>
            ) : (
              <form onSubmit={handleSubmitTip} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    {isId ? 'Pilih Jumlah Tip' : 'Select Tip Amount'}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[2, 5, 10, 25].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setTipAmount(amt)}
                        className={`py-2 px-3 rounded-2xl text-xs font-bold transition cursor-pointer border ${
                          tipAmount === amt
                            ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300'
                        }`}
                      >
                        🪙 {amt} LTP
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsTipModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
                  >
                    {isId ? 'Batal' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isTipping}
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isTipping ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{isId ? 'Mengirim...' : 'Sending...'}</span>
                      </>
                    ) : (
                      <span>{isId ? `Kirim ${tipAmount} LTP` : `Send ${tipAmount} LTP`}</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
