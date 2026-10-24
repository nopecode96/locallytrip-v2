'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ArrowLeft,
  Star,
  Users,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Globe2,
  MessageCircle,
  MessageSquare,
  Loader2,
  Footprints,
  Calendar,
  Sparkles,
  ChevronRight,
  Navigation,
  Home,
  Camera,
  FileText,
  Video,
  Layers,
  Activity,
  Compass,
  Check,
  HelpCircle,
  Briefcase,
  ExternalLink,
} from 'lucide-react';
import { usePreferences } from '@/components/layout/PreferencesContext';
import { formatExperienceDuration } from '@/lib/duration';
import { FollowButton } from '@/components/shared/FollowButton';
import { UserAvatar } from '@/components/common/UserAvatar';
import { ExperienceDetailGallery } from './ExperienceDetailGallery';
import { useProtectedAction } from '@/hooks/useProtectedAction';
import { ContextualAuthModal } from '@/components/marketplace/ContextualAuthModal';
import { getOrCreateHostConversation } from '@/actions/messages';

export interface ExperienceDetailHost {
  id: number;
  name: string;
  avatar_url?: string | null;
  bio?: string | null;
  is_verified?: boolean | null;
  is_trusted?: boolean | null;
  created_at?: Date | string | null;
  user_languages?: Array<{
    languages?: {
      name: string;
      native_name?: string | null;
    } | null;
  }>;
}

export interface ExperienceDetailCategory {
  id: number;
  name: string;
  icon?: string | null;
}

export interface ExperienceDetailCity {
  id: number;
  name: string;
  country_code?: string | null;
}

export interface ExperienceDetailItinerary {
  id: number;
  step_order: number;
  title: string;
  description?: string | null;
  duration_minutes?: number | null;
  location?: string | null;
}

export interface ExperienceDetailReview {
  id: number;
  rating: number;
  comment?: string | null;
  host_reply?: string | null;
  host_replied_at?: Date | string | null;
  created_at: Date | string;
  user?: {
    id: number;
    name: string;
    avatar_url?: string | null;
    cityName?: string | null;
  } | null;
}

export interface ExperienceDetailData {
  id: number;
  slug: string;
  title: string;
  description: string;
  description_id?: string | null;
  description_en?: string | null;
  short_description?: string | null;
  package_price: number;
  currency: string;
  duration_hours: number;
  max_guests: number;
  images: string[];
  meeting_point?: string | null;
  ending_point?: string | null;
  inclusions: string[];
  exclusions: string[];
  what_to_expect?: string[];
  requirements?: string[];
  deliverables?: string[];
  equipment_used?: string[];
  host_specific_data?: any;
  walking_distance_km?: number | null;
  fitness_level?: string | null;
  difficulty_level?: string | null;
  rating_average: number;
  rating_count: number;
  booking_count: number;
  host: ExperienceDetailHost | null;
  host_categories: ExperienceDetailCategory | null;
  cities: ExperienceDetailCity | null;
  itineraries: ExperienceDetailItinerary[];
  reviews: ExperienceDetailReview[];
}

interface ExperienceDetailClientProps {
  experience: ExperienceDetailData;
  locale: string;
  initialIsFollowingHost?: boolean;
}

export function ExperienceDetailClient({
  experience,
  locale,
  initialIsFollowingHost = false,
}: ExperienceDetailClientProps) {
  const { formatPrice } = usePreferences();
  const isId = locale === 'id';
  const router = useRouter();

  // State untuk bilingual description toggle jika tersedia dua bahasa
  const [descLang, setDescLang] = useState<'id' | 'en'>(locale === 'en' ? 'en' : 'id');
  const [isStartingChat, setIsStartingChat] = useState(false);

  const { isAuthModalOpen, setIsAuthModalOpen, authMessage, executeProtected } =
    useProtectedAction();

  const host = experience.host;

  const handleChatWithHost = () => {
    if (!host) return;
    executeProtected(
      async () => {
        try {
          setIsStartingChat(true);
          const res = await getOrCreateHostConversation({
            hostId: host.id,
            experienceId: experience.id,
          });
          if (res.success && res.conversationId) {
            router.push(`/${locale}/messages?c=${res.conversationId}&exp=${experience.slug}`);
          } else if (res.error) {
            alert(res.error);
          }
        } catch (e) {
          console.error('Failed to start conversation with host:', e);
          router.push(`/${locale}/messages?recipientId=${host.id}&exp=${experience.slug}`);
        } finally {
          setIsStartingChat(false);
        }
      },
      isId
        ? `Silakan masuk untuk berkirim pesan langsung dengan pemandu ${host.name}.`
        : `Please sign in to chat directly with local guide ${host.name}.`
    );
  };
  const languages = (host?.user_languages || [])
    .map((ul) => ul.languages?.native_name || ul.languages?.name)
    .filter(Boolean);

  const hostJoinedYear = host?.created_at
    ? new Date(host.created_at).getFullYear()
    : null;

  // Format booking target link
  const bookUrl = `/${locale}/experiences/${experience.slug}/book`;
  const hostChatUrl = host
    ? `/${locale}/messages?recipientId=${host.id}&returnUrl=${encodeURIComponent(`/${locale}/experiences/${experience.slug}`)}`
    : '#';

  // Identifikasi Archetype / Kategori Host
  const categoryName = (experience.host_categories?.name || '').toLowerCase();
  const isPhotographer = categoryName.includes('photo') && !categoryName.includes('combo');
  const isTripPlanner = categoryName.includes('trip planner') || categoryName.includes('planner');
  const isWellness = categoryName.includes('wellness') || categoryName.includes('instructor');
  const isCombo = categoryName.includes('combo');
  const isLocalGuide = !isPhotographer && !isTripPlanner && !isWellness && !isCombo;

  // Cek ketersediaan deskripsi dwibahasa
  const hasBothDescriptions = Boolean(
    experience.description_id &&
    experience.description_en &&
    experience.description_id.trim() !== experience.description_en.trim()
  );

  const currentDescriptionText = hasBothDescriptions
    ? (descLang === 'en' ? experience.description_en : experience.description_id) || experience.description
    : experience.description;

  // Data Spesifik Host / Custom Archetype JSON
  const hsd = experience.host_specific_data || {};
  const photoDelivery = hsd.delivery || {};
  const photoStyles: string[] = hsd.photography_styles || [];
  const planningServices = hsd.planning_services || {};
  const consultationMethods: string[] = hsd.consultation_methods || [];
  const plannerDeliverables = hsd.trip_planner_deliverables || {};

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 sm:space-y-10 pb-16 lg:pb-12">
      {/* ============================================================ */}
      {/* 1. Breadcrumb Navigasi Baku Sejajar Header                    */}
      {/* ============================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href={`/${locale}/experiences`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-orange-600 transition-colors bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs hover:border-orange-200 shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-orange-500" />
            <span>{isId ? 'Kembali ke Eksplorasi' : 'Back to Experiences'}</span>
          </Link>

          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-medium text-slate-500 flex-wrap">
            <Link
              href={`/${locale}`}
              className="inline-flex items-center gap-1 hover:text-orange-600 transition-colors"
            >
              <Home className="w-3.5 h-3.5 text-slate-400" />
              <span>{isId ? 'Beranda' : 'Home'}</span>
            </Link>

            <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />

            <Link
              href={`/${locale}/experiences`}
              className="hover:text-orange-600 transition-colors font-semibold"
            >
              {isId ? 'Pengalaman' : 'Experiences'}
            </Link>

            {experience.cities && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                <Link
                  href={`/${locale}/experiences?city=${experience.cities.id}`}
                  className="hover:text-orange-600 transition-colors flex items-center gap-1 font-semibold"
                >
                  <MapPin className="w-3 h-3 text-orange-500" />
                  <span>{experience.cities.name}</span>
                </Link>
              </>
            )}

            <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />

            <span className="text-slate-900 font-semibold truncate max-w-xs sm:max-w-md">
              {experience.title}
            </span>
          </nav>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          {experience.host_categories && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">
              <Sparkles className="w-3 h-3 text-orange-500" />
              <span>{experience.host_categories.name}</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {isTripPlanner ? 'Custom Digital Service' : 'Private Group Experience'}
          </span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. Header Tur (Judul & Metrik)                                */}
      {/* ============================================================ */}
      <div className="space-y-3">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
          {experience.title}
        </h1>

        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs sm:text-sm font-medium text-slate-600">
          <div className="flex items-center gap-1.5">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="font-bold text-slate-900">
              {experience.rating_average > 0
                ? Number(experience.rating_average).toFixed(1)
                : (isId ? 'Baru' : 'New')}
            </span>
            <span className="text-slate-500 underline underline-offset-2">
              ({experience.rating_count} {isId ? 'ulasan' : 'reviews'})
            </span>
          </div>

          <span className="text-slate-300">•</span>

          <div className="flex items-center gap-1 text-slate-700">
            <Users className="w-4 h-4 text-orange-500" />
            <span>
              {experience.booking_count > 0
                ? `${experience.booking_count} ${isId ? 'rombongan pernah memesan' : 'groups booked'}`
                : (isId ? 'Rombongan pertama' : 'First group bookings')}
            </span>
          </div>

          {experience.cities && (
            <>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1 text-slate-700">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>{experience.cities.name}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. Galeri Foto Dinamis & Adaptif (1, 2, 3, 4, 5, >5 Foto)     */}
      {/* ============================================================ */}
      <ExperienceDetailGallery
        images={experience.images}
        title={experience.title}
        locale={locale}
      />

      {/* ============================================================ */}
      {/* 4. Tata Letak 2 Kolom Responsif (Konten Kiri + Booking Kanan) */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10">
        {/* ========================================================== */}
        {/* KOLOM KIRI: KONTEN LENGKAP PENGALAMAN (Span 2 Kolom)        */}
        {/* ========================================================== */}
        <div className="lg:col-span-2 space-y-8 sm:space-y-10">
          {/* A. Kartu Profil Singkat Host */}
          {host && (
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="relative shrink-0">
                  <UserAvatar
                    src={host.avatar_url}
                    name={host.name}
                    size={68}
                    className="border-2 border-orange-100 ring-2 ring-white shadow-sm"
                  />
                  {host.is_verified && (
                    <span
                      title="Verified Host"
                      className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-xs"
                    >
                      <ShieldCheck className="w-5 h-5 text-emerald-600 fill-white" />
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">
                      {isId ? 'Dipandu oleh' : 'Hosted by'} {host.name}
                    </h2>
                    {host.is_verified && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Verified Host
                      </span>
                    )}
                    {host.is_trusted && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        Trusted Guide
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 max-w-lg">
                    {host.bio ||
                      (isId
                        ? 'Pemandu lokal terverifikasi yang siap berbagi cerita otentik dan spot terbaik kota.'
                        : 'Verified local host ready to share authentic local stories and hidden spots.')}
                  </p>

                  {languages.length > 0 && (
                    <div className="flex items-center gap-1.5 pt-1 text-xs text-slate-500">
                      <Globe2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{isId ? 'Bahasa:' : 'Languages:'}</span>
                      <span className="font-semibold text-slate-700">{languages.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="self-end sm:self-center shrink-0 flex flex-col items-end gap-2">
                {hostJoinedYear && (
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">
                      {isId ? 'Bergabung sejak' : 'Hosting since'}
                    </span>
                    <span className="text-xs font-bold text-slate-700">{hostJoinedYear}</span>
                  </div>
                )}
                {host.id && (
                  <FollowButton
                    targetUserId={host.id}
                    initialIsFollowing={initialIsFollowingHost}
                    lang={locale}
                    targetUserName={host.name}
                    variant="compact"
                  />
                )}
              </div>
            </div>
          )}

          {/* B. Sorotan Utama Tur (Highlights) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  {isTripPlanner ? (isId ? 'Estimasi Pengerjaan' : 'Timeline') : (isId ? 'Durasi Kegiatan' : 'Duration')}
                </span>
                <span className="text-sm font-bold text-slate-900">
                  {isTripPlanner && planningServices.planning_timeline_days
                    ? `⚡ ${planningServices.planning_timeline_days} ${isId ? 'Hari Kerja' : 'Days'}`
                    : `⏳ ${formatExperienceDuration(experience.duration_hours, isId ? 'id' : 'en')}`}
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  {isTripPlanner ? (isId ? 'Kapasitas Grup' : 'Group Size') : (isId ? 'Kapasitas Rombongan' : 'Capacity')}
                </span>
                <span className="text-sm font-bold text-slate-900">
                  👥 Maks. {experience.max_guests} {isId ? 'orang/paket' : 'guests/pkg'}
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  {isId ? 'Format Layanan' : 'Service Format'}
                </span>
                <span className="text-sm font-bold text-slate-900">
                  {isTripPlanner
                    ? 'Custom Digital Plan'
                    : isPhotographer
                    ? 'Private Photo Session'
                    : 'Private Group Experience'}
                </span>
              </div>
            </div>
          </div>

          {/* C. Deskripsi Tur Lengkap (Semantic Markdown Prose) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-500" />
                <span>{isId ? 'Tentang Pengalaman Ini' : 'About This Experience'}</span>
              </h2>

              {/* Bilingual Language Switcher jika kedua bahasa tersedia */}
              {hasBothDescriptions && (
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setDescLang('id')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      descLang === 'id'
                        ? 'bg-white text-orange-600 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    🇮🇩 ID
                  </button>
                  <button
                    type="button"
                    onClick={() => setDescLang('en')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      descLang === 'en'
                        ? 'bg-white text-orange-600 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    🇬🇧 EN
                  </button>
                </div>
              )}
            </div>

            {/* Markdown Body */}
            <div className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-3 prose-p:text-slate-700 prose-p:leading-relaxed prose-li:text-slate-700 prose-strong:text-slate-900">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h2: ({ node, ...props }) => (
                    <h2
                      className="text-lg sm:text-xl font-bold text-slate-900 mt-6 mb-3 border-b border-slate-100 pb-2 flex items-center gap-2"
                      {...props}
                    />
                  ),
                  h3: ({ node, ...props }) => (
                    <h3 className="text-base font-bold text-slate-900 mt-4 mb-2" {...props} />
                  ),
                  p: ({ node, ...props }) => (
                    <p className="text-sm sm:text-base text-slate-700 leading-relaxed mb-4" {...props} />
                  ),
                  ul: ({ node, ...props }) => (
                    <ul className="list-disc pl-5 space-y-2 mb-4 text-sm sm:text-base text-slate-700" {...props} />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol className="list-decimal pl-5 space-y-2 mb-4 text-sm sm:text-base text-slate-700" {...props} />
                  ),
                  li: ({ node, ...props }) => <li className="pl-1 leading-relaxed" {...props} />,
                }}
              >
                {currentDescriptionText}
              </ReactMarkdown>
            </div>
          </div>

          {/* ========================================================== */}
          {/* D. POLIMORFISME ARCHETYPE: BLOK EKSEKUSI DINAMIS           */}
          {/* ========================================================== */}

          {/* D1. ARCHETYPE PHOTOGRAPHER & COMBO: SPESIFIKASI FOTO & PERALATAN */}
          {(isPhotographer || isCombo) && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
              <div className="space-y-1">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-orange-500" />
                  <span>{isId ? 'Hasil Foto & Spesifikasi Layanan' : 'Deliverables & Equipment'}</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  {isId
                    ? 'Spesifikasi hasil jepretan, durasi penyimpanan link drive, dan peralatan yang digunakan host.'
                    : 'Photo deliverables, cloud storage timeline, and equipment gear used.'}
                </p>
              </div>

              {/* Delivery Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {photoDelivery.photos_edited && (
                  <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-100">
                    <span className="text-[11px] font-bold text-orange-700 uppercase tracking-wider block">
                      {isId ? 'Foto Ter-edit' : 'Edited Photos'}
                    </span>
                    <span className="text-base sm:text-lg font-extrabold text-slate-900">
                      📸 {photoDelivery.photos_edited} Foto
                    </span>
                  </div>
                )}

                {photoDelivery.timeline_days && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      {isId ? 'Waktu Pengiriman' : 'Turnaround'}
                    </span>
                    <span className="text-base sm:text-lg font-extrabold text-slate-900">
                      ⚡ {photoDelivery.timeline_days} {isId ? 'Hari' : 'Days'}
                    </span>
                  </div>
                )}

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    {isId ? 'Format File' : 'Format'}
                  </span>
                  <span className="text-base sm:text-lg font-extrabold text-slate-900">
                    💾 High-Res JPG
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    {isId ? 'Akses Link' : 'Cloud Storage'}
                  </span>
                  <span className="text-base sm:text-lg font-extrabold text-slate-900">
                    ☁️ Google Drive
                  </span>
                </div>
              </div>

              {/* Peralatan yang Digunakan */}
              {experience.equipment_used && experience.equipment_used.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    {isId ? 'Peralatan Kamera & Lensa (Equipment Gear)' : 'Equipment & Gear Used'}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {experience.equipment_used.map((item, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200"
                      >
                        <Camera className="w-3.5 h-3.5 text-slate-500" />
                        <span>{item}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Gaya Fotografi */}
              {photoStyles.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    {isId ? 'Gaya Fotografi (Styles)' : 'Photography Styles'}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {photoStyles.map((style, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200 capitalize"
                      >
                        ✨ {style}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* D2. ARCHETYPE TRIP PLANNER: TAHAPAN KONSULTASI & DELIVERABLES DIGITAL */}
          {isTripPlanner && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
              <div className="space-y-1">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-orange-500" />
                  <span>{isId ? 'Paket Layanan Perencanaan Perjalanan' : 'Trip Planning Deliverables'}</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  {isId
                    ? 'Rincian metode konsultasi, dokumen hasil rancangan, dan garansi revisi itinerary Anda.'
                    : 'Consultation channels, custom itinerary deliverables, and revision rounds.'}
                </p>
              </div>

              {/* Metode Konsultasi */}
              {consultationMethods.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    {isId ? 'Metode Konsultasi Online' : 'Consultation Methods'}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {consultationMethods.map((method, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 capitalize"
                      >
                        {method.includes('video') ? (
                          <Video className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                        <span>{method.replace('_', ' ')}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Planning Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {planningServices.revision_rounds !== undefined && (
                  <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-100">
                    <span className="text-[11px] font-bold text-orange-700 uppercase tracking-wider block">
                      {isId ? 'Jatah Revisi' : 'Revisions'}
                    </span>
                    <span className="text-base sm:text-lg font-extrabold text-slate-900">
                      🔄 {planningServices.revision_rounds}x {isId ? 'Revisi' : 'Rounds'}
                    </span>
                  </div>
                )}

                {planningServices.planning_timeline_days !== undefined && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      {isId ? 'Pengerjaan Draf' : 'Delivery Draft'}
                    </span>
                    <span className="text-base sm:text-lg font-extrabold text-slate-900">
                      ⏱️ {planningServices.planning_timeline_days} {isId ? 'Hari' : 'Days'}
                    </span>
                  </div>
                )}

                {planningServices.consultation_duration_minutes !== undefined && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      {isId ? 'Durasi Sesi' : 'Session Duration'}
                    </span>
                    <span className="text-base sm:text-lg font-extrabold text-slate-900">
                      💬 {planningServices.consultation_duration_minutes} {isId ? 'Menit' : 'Mins'}
                    </span>
                  </div>
                )}

                {planningServices.follow_up_support_days !== undefined && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      {isId ? 'Pendampingan' : 'Follow-up Support'}
                    </span>
                    <span className="text-base sm:text-lg font-extrabold text-slate-900">
                      🛡️ {planningServices.follow_up_support_days} {isId ? 'Hari' : 'Days'}
                    </span>
                  </div>
                )}
              </div>

              {/* Deliverables List (Array deliverables dari database) */}
              {experience.deliverables && experience.deliverables.length > 0 && (
                <div className="space-y-3 pt-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    {isId ? 'Dokumen & File yang Akan Anda Terima' : 'Documents & Output You Will Receive'}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {experience.deliverables.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm font-semibold text-slate-800"
                      >
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* D3. RUTE & AGENDA PERJALANAN / SPOT FOTO (Itinerary Timeline) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <Footprints className="w-5 h-5 text-orange-500" />
                <span>
                  {isPhotographer
                    ? (isId ? 'Rute & Spot Foto Pilihan' : 'Photo Route & Spots')
                    : isTripPlanner
                    ? (isId ? 'Alur & Tahapan Rencana Perjalanan' : 'Itinerary Overview')
                    : (isId ? 'Rute & Agenda Perjalanan' : 'Itinerary Timeline')}
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                {isId
                  ? 'Urutan kegiatan terencana yang dipandu langkah demi langkah oleh host.'
                  : 'Planned schedule guided step-by-step by your local host.'}
              </p>
            </div>

            {experience.itineraries.length > 0 ? (
              <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-2.5 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-orange-200">
                {experience.itineraries.map((step, idx) => (
                  <div key={step.id || idx} className="relative group">
                    {/* Stepper Bullet */}
                    <div className="absolute -left-6 sm:-left-8 top-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-orange-500 text-white font-extrabold text-xs flex items-center justify-center ring-4 ring-white shadow-xs">
                      {idx + 1}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                          {step.title}
                        </h3>
                        {step.duration_minutes && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                            ⏱️ {step.duration_minutes >= 60 ? `${Math.round(step.duration_minutes / 60)} Jam` : `${step.duration_minutes} Menit`}
                          </span>
                        )}
                        {step.location && (
                          <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {step.location}
                          </span>
                        )}
                      </div>
                      {step.description && (
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                          {step.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 text-center text-xs sm:text-sm text-slate-500">
                {isTripPlanner
                  ? (isId
                      ? 'Rute dan jadwal hari-ke-hari akan disesuaikan secara personal dalam dokumen panduan Anda.'
                      : 'Day-to-day route will be fully tailored to your specific preferences in your personalized guide.')
                  : (isId
                      ? 'Jadwal dan rute fleksibel disesuaikan bersama host sesuai preferensi rombongan Anda.'
                      : 'Schedule and route can be flexibly tailored directly with the host according to your group preferences.')}
              </div>
            )}
          </div>

          {/* D4. TITIK KUMPUL & CATATAN LOKASI (Meeting Point - Untuk Tur Fisik/Wellness/Photo) */}
          {!isTripPlanner && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <Navigation className="w-5 h-5 text-orange-500" />
                <span>{isId ? 'Titik Kumpul (Meeting Point)' : 'Meeting Point & Guidelines'}</span>
              </h2>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      {isId ? 'Lokasi Bertemu' : 'Location'}
                    </span>
                    <p className="text-sm sm:text-base font-bold text-slate-900">
                      {experience.meeting_point ||
                        (isId
                          ? 'Dikonfirmasi langsung oleh host setelah pesanan dibuat'
                          : 'Directly confirmed by host upon booking')}
                    </p>
                    {experience.ending_point && (
                      <p className="text-xs text-slate-600 pt-1">
                        <span className="font-semibold text-slate-700">
                          {isId ? 'Titik Selesai:' : 'Ending Point:'}
                        </span>{' '}
                        {experience.ending_point}
                      </p>
                    )}
                  </div>
                </div>

                {(experience.walking_distance_km || experience.fitness_level) && (
                  <div className="pt-3 border-t border-slate-200/70 flex flex-wrap gap-4 text-xs text-slate-600">
                    {experience.walking_distance_km && (
                      <div>
                        <span className="text-slate-400 block">{isId ? 'Jarak Jalan Kaki:' : 'Walking:'}</span>
                        <span className="font-bold text-slate-800">
                          🚶 ~{experience.walking_distance_km} km
                        </span>
                      </div>
                    )}
                    {experience.fitness_level && (
                      <div>
                        <span className="text-slate-400 block">{isId ? 'Level Fisik:' : 'Fitness:'}</span>
                        <span className="font-bold text-slate-800 capitalize">
                          💪 {experience.fitness_level}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* D5. APA YANG AKAN DIALAMI (What to Expect) */}
          {experience.what_to_expect && experience.what_to_expect.length > 0 && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-500" />
                <span>{isId ? 'Yang Akan Anda Alami (What to Expect)' : 'What to Expect'}</span>
              </h2>

              <ul className="space-y-3">
                {experience.what_to_expect.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-700">
                    <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* D6. PERSIAPAN & BARANG YANG HARUS DIBAWA (Requirements) */}
          {experience.requirements && experience.requirements.length > 0 && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-orange-500" />
                <span>{isId ? 'Persiapan & Barang yang Perlu Dibawa' : 'Requirements & What to Bring'}</span>
              </h2>

              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {experience.requirements.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs sm:text-sm text-slate-700"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* E. Yang Termasuk & Tidak Termasuk (Inclusions & Exclusions) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              {isId ? 'Fasilitas & Ketentuan Layanan' : 'Inclusions & Exclusions'}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Termasuk */}
              <div className="space-y-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {isId ? 'Sudah Termasuk (Inclusions)' : 'Included'}
                </span>
                {experience.inclusions.length > 0 ? (
                  <ul className="space-y-2.5 pt-1">
                    {experience.inclusions.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-400 italic pt-1">
                    {isId ? 'Tanya rincian fasilitas pada host.' : 'Inquire host for details.'}
                  </p>
                )}
              </div>

              {/* Tidak Termasuk */}
              <div className="space-y-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                  <XCircle className="w-3.5 h-3.5 text-slate-400" />
                  {isId ? 'Tidak Termasuk (Exclusions)' : 'Not Included'}
                </span>
                {experience.exclusions.length > 0 ? (
                  <ul className="space-y-2.5 pt-1">
                    {experience.exclusions.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-500">
                        <XCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-400 italic pt-1">
                    {isId ? 'Pengeluaran pribadi lainnya.' : 'Personal expenses.'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* F. Bagian Ulasan Tamu Terverifikasi (Verified Guest Reviews) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  {isId ? 'Ulasan Tamu Terverifikasi' : 'Verified Guest Reviews'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  {isId
                    ? 'Ulasan asli dari traveler yang telah menyelesaikan layanan ini.'
                    : 'Authentic reviews from travelers who completed this experience.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3.5 py-1.5 rounded-xl">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                  <span className="font-extrabold text-slate-900 text-sm">
                    {experience.rating_average > 0 ? Number(experience.rating_average).toFixed(1) : (experience.reviews.length > 0 ? '5.0' : '0.0')}
                  </span>
                  <span className="text-xs text-slate-600 font-medium">
                    ({experience.reviews.length} {isId ? 'ulasan wisatawan' : 'traveler reviews'})
                  </span>
                </div>
              </div>
            </div>

            {experience.reviews.length > 0 ? (
              <div className="space-y-4">
                {experience.reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-5 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          src={rev.user?.avatar_url}
                          name={rev.user?.name || 'Guest'}
                          size={36}
                          className="border border-slate-200"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs sm:text-sm text-slate-900">
                              {rev.user?.name || (isId ? 'Tamu Terverifikasi' : 'Verified Guest')}
                            </span>
                            {rev.user?.cityName && (
                              <span className="text-[10px] text-slate-500 font-normal">
                                • Dari {rev.user.cityName}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {new Date(rev.created_at).toLocaleDateString(
                              locale === 'en' ? 'en-US' : 'id-ID',
                              { month: 'long', year: 'numeric', day: 'numeric' }
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < (rev.rating || 5)
                                ? 'fill-amber-400 text-amber-400'
                                : 'fill-slate-200 text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                      {rev.comment}
                    </p>

                    {/* Balon Tanggapan Resmi Host */}
                    {rev.host_reply && (
                      <div className="mt-3 ml-4 sm:ml-6 p-4 rounded-2xl bg-purple-50/70 border border-purple-100 text-xs">
                        <div className="flex items-center gap-2 mb-1.5 font-semibold text-purple-900">
                          <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                          <span>
                            {isId
                              ? `Tanggapan dari Pemandu (${experience.host?.name || 'Host'}):`
                              : `Response from Guide (${experience.host?.name || 'Host'}):`}
                          </span>
                          {rev.host_replied_at && (
                            <span className="text-slate-400 font-normal">
                              • {new Date(rev.host_replied_at).toLocaleDateString(
                                locale === 'en' ? 'en-US' : 'id-ID',
                                { day: 'numeric', month: 'short', year: 'numeric' }
                              )}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-700 leading-relaxed italic">
                          "{rev.host_reply}"
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 sm:p-10 rounded-2xl bg-slate-50 text-center space-y-2 border border-slate-100">
                <Star className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">
                  {isId ? 'Belum Ada Ulasan' : 'No Reviews Yet'}
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {isId
                    ? 'Belum ada ulasan untuk aktivitas tur ini. Jadilah penjelajah pertama yang mengikuti pengalaman ini dan bagikan cerita Anda!'
                    : 'No reviews for this tour activity yet. Be the first explorer to take this tour and share your authentic story!'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================== */}
        {/* KOLOM KANAN: STICKY BOOKING CARD (Span 1 Kolom)             */}
        {/* ========================================================== */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-lg space-y-6">
            {/* Header Tarif */}
            <div className="space-y-1 pb-4 border-b border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600 block">
                {isTripPlanner
                  ? (isId ? 'Tarif Layanan Lengkap' : 'Trip Planning Fee')
                  : (isId ? 'Tarif Per Paket Tur' : 'Price Per Tour Package')}
              </span>
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  {formatPrice(experience.package_price, experience.currency)}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  / {isTripPlanner ? (isId ? 'rancangan' : 'custom plan') : (isId ? 'paket rombongan' : 'private package')}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 pt-1 font-medium">
                {isId
                  ? 'Satu tarif tetap untuk seluruh rombongan Anda.'
                  : 'One flat fee for your entire private group.'}
              </p>
            </div>

            {/* Benefit Box */}
            <div className="bg-orange-50/70 border border-orange-200/80 rounded-2xl p-4 space-y-2 text-xs text-orange-950">
              <div className="flex items-start gap-2 font-bold">
                <Users className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                <span>
                  {isId
                    ? `Maksimal hingga ${experience.max_guests} orang tamu per rombongan tanpa biaya tambahan per orang.`
                    : `Up to ${experience.max_guests} guests per group with no additional per-person fees.`}
                </span>
              </div>
              <p className="text-[11px] text-orange-800/90 pl-6">
                {isTripPlanner
                  ? (isId
                      ? 'Rencana perjalanan dirancang khusus untuk anggota rombongan Anda.'
                      : 'Travel plan exclusively tailored for your travel companions.')
                  : (isId
                      ? 'Tur bersifat privat eksklusif. Anda tidak digabungkan dengan peserta lain di luar grup Anda.'
                      : 'Exclusively private experience. You will never be merged with outside participants.')}
              </p>
            </div>

            {/* Quick Details */}
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">
                  {isTripPlanner ? (isId ? 'Pengerjaan' : 'Timeline') : (isId ? 'Durasi' : 'Duration')}
                </span>
                <span className="font-semibold text-slate-800">
                  {isTripPlanner && planningServices.planning_timeline_days
                    ? `${planningServices.planning_timeline_days} ${isId ? 'Hari Kerja' : 'Days'}`
                    : formatExperienceDuration(experience.duration_hours, isId ? 'id' : 'en')}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">{isId ? 'Format Sesi' : 'Session Format'}</span>
                <span className="font-semibold text-slate-800">
                  {isTripPlanner ? 'Digital Service' : 'Private Experience'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400">{isId ? 'Konfirmasi' : 'Confirmation'}</span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Instant Booking
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <Link
                href={bookUrl}
                className="w-full min-h-[48px] px-6 py-3.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>
                  {isTripPlanner
                    ? (isId ? 'Pesan Rancangan Itinerary' : 'Book Planning Service')
                    : (isId ? 'Pesan Pengalaman Ini' : 'Book Experience Now')}
                </span>
              </Link>

              {host && (
                <button
                  type="button"
                  onClick={handleChatWithHost}
                  disabled={isStartingChat}
                  className="w-full py-3 px-4 rounded-2xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {isStartingChat ? (
                    <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                  ) : (
                    <MessageSquare className="w-4 h-4 text-purple-600" />
                  )}
                  <span>
                    {isId
                      ? `Chat dengan Pemandu (${host.name})`
                      : `Chat with Guide (${host.name})`}
                  </span>
                </button>
              )}
            </div>

            {/* Trust Footer */}
            <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 text-center">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>
                {isId
                  ? 'Garansi Booking Aman PT Locallytrip Teknologi Indonesia'
                  : 'Protected by PT Locallytrip Teknologi Indonesia'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 5. Floating Bottom Bar on Mobile (<= 1024px)                  */}
      {/* ============================================================ */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 shadow-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {isId ? 'Tarif Paket' : 'Package Rate'}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-extrabold text-slate-900">
                {formatPrice(experience.package_price, experience.currency)}
              </span>
              <span className="text-[10px] text-slate-500">/ {isId ? 'paket' : 'pkg'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {host && (
              <button
                type="button"
                onClick={handleChatWithHost}
                disabled={isStartingChat}
                className="p-3 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 cursor-pointer disabled:opacity-50 flex items-center justify-center"
                title={isId ? `Chat dengan Pemandu (${host.name})` : `Chat with Guide (${host.name})`}
              >
                {isStartingChat ? (
                  <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                ) : (
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                )}
              </button>
            )}
            <Link
              href={bookUrl}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-sm flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20"
            >
              <Calendar className="w-4 h-4" />
              <span>{isId ? 'Pesan Sekarang' : 'Book Now'}</span>
            </Link>
          </div>
        </div>
      </div>

      <ContextualAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        promptMessage={authMessage}
        locale={locale}
      />
    </div>
  );
}
