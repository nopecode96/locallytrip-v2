'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ChevronRight,
  UserCheck,
  Award,
  AlertCircle,
  Share2,
  MessageSquare,
  MessagesSquare,
  Camera,
  Image as ImageIcon,
  Loader2,
  X,
} from 'lucide-react';
import { ShareButton } from '@/components/common/ShareModal';
import { ReportContentButton } from '@/components/community/ReportContentButton';
import { UgcTranslateButton } from '@/components/community/UgcTranslateButton';
import { useProtectedAction } from '@/hooks/useProtectedAction';
import { ContextualAuthModal } from '@/components/marketplace/ContextualAuthModal';
import { RewardIncentiveCard } from '@/components/rewards/RewardIncentiveCard';
import { MeetupGroupChatModal } from '@/components/community/MeetupGroupChatModal';
import { realtimeEmitter } from '@/lib/realtime';
import { getOrCreateDirectConversation, updateMeetupRecapImages } from '@/actions/community/meetups';
import { FollowButton } from '@/components/shared/FollowButton';
import { UserSidebarCard } from '@/components/shared/UserSidebarCard';
import { UserAvatar } from '@/components/common/UserAvatar';
import { ImageUploadDropzone } from '@/components/shared/ImageUploadDropzone';
import { resolveMeetupImageUrl, resolveMeetupDisplayImage } from '@/lib/utils/media';

export interface MeetupMemberItem {
  id: number;
  userId: number;
  name: string | null;
  username: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  status: string | null;
}

export interface MeetupDetailData {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  start_date: string;
  end_date: string;
  duration_days: number | null;
  max_members: number | null;
  current_member_count: number;
  status: string | null;
  join_type: string;
  view_count: number;
  created_at: string | null;
  bannerImage: string;
  recap_images?: string[];
  category: {
    id: number;
    name: string;
    icon?: string | null;
  } | null;
  city: {
    id: number;
    name: string;
    description?: string | null;
    image?: string | null;
    image_url?: string | null;
    coverImage?: string | null;
  } | null;
  creator: {
    id: number;
    name: string | null;
    username: string | null;
    avatar_url: string | null;
    role: string | null;
    is_verified: boolean;
    level: number;
    total_xp?: number;
    bio: string | null;
    host_kyc_host_kyc_user_idTousers?: { status: string } | null;
    host_kyc?: { status: string } | null;
    is_kyc_verified?: boolean;
  };
  members: MeetupMemberItem[];
}

export interface CurrentUserSessionData {
  id: number;
  name: string;
  email: string;
  avatar_url?: string | null;
  isLoggedIn: boolean;
}

export interface RelatedExperienceItem {
  id: number;
  title: string;
  slug: string | null;
  package_price: string | number | null;
  price_idr?: number | null;
  currency: string | null;
  rating_average?: string | number | null;
  rating?: number | null;
  images: any;
  cities: { id: number; name: string; slug?: string | null } | null;
  experience_types: { id: number; name: string } | null;
  users?: { id: number; name: string | null; avatar_url: string | null } | null;
}

interface MeetupDetailClientProps {
  meetup: MeetupDetailData;
  lang: string;
  currentUser: CurrentUserSessionData | null;
  initialIsJoined: boolean;
  initialIsFollowingHost?: boolean;
  relatedExperiences?: RelatedExperienceItem[];
  cityExperiences?: RelatedExperienceItem[];
  popularExperiences?: RelatedExperienceItem[];
}

export function MeetupDetailClient({
  meetup: initialMeetup,
  lang,
  currentUser,
  initialIsJoined,
  initialIsFollowingHost = false,
  relatedExperiences = [],
  cityExperiences = [],
  popularExperiences = [],
}: MeetupDetailClientProps) {
  const isId = lang === 'id';
  const router = useRouter();
  // Cek keanggotaan dan status persetujuan user saat ini
  const userMembership = initialMeetup.members.find((m) => m.userId === currentUser?.id);
  const userIsApproved = Boolean(
    initialIsJoined || (userMembership && userMembership.status === 'approved')
  );
  const userIsPending = Boolean(userMembership && userMembership.status === 'pending');

  const isOwner = Boolean(currentUser?.id && currentUser.id === initialMeetup.creator.id);

  const [members, setMembers] = useState<MeetupMemberItem[]>(initialMeetup.members);
  const [memberCount, setMemberCount] = useState<number>(initialMeetup.current_member_count);
  const [isJoined, setIsJoined] = useState<boolean>(userIsApproved);
  const [isPending, setIsPending] = useState<boolean>(userIsPending);
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [joinSuccessMsg, setJoinSuccessMsg] = useState<string>('');
  const [joinErrorMsg, setJoinErrorMsg] = useState<string>('');
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isStartingInquiry, setIsStartingInquiry] = useState<boolean>(false);

  // State Dokumentasi Foto Momen Temu (Recap Images)
  const [recapImages, setRecapImages] = useState<string[]>(initialMeetup.recap_images || []);
  const [isRecapModalOpen, setIsRecapModalOpen] = useState<boolean>(false);
  const [tempRecapImages, setTempRecapImages] = useState<string[]>(initialMeetup.recap_images || []);
  const [isSavingRecap, setIsSavingRecap] = useState<boolean>(false);
  const [recapMsg, setRecapMsg] = useState<{ text: string; error?: boolean } | null>(null);

  const handleSaveRecapImages = async () => {
    setIsSavingRecap(true);
    setRecapMsg(null);
    try {
      const res = await updateMeetupRecapImages(initialMeetup.id, tempRecapImages, lang);
      if (res.success && res.recapImages) {
        setRecapImages(res.recapImages);
        setRecapMsg({ text: isId ? 'Dokumentasi momen temu berhasil diperbarui!' : 'Recap photos updated successfully!' });
        setTimeout(() => {
          setIsRecapModalOpen(false);
          setRecapMsg(null);
        }, 1200);
      } else {
        setRecapMsg({ text: res.error || (isId ? 'Gagal menyimpan foto.' : 'Failed to save photos.'), error: true });
      }
    } catch (err: any) {
      setRecapMsg({ text: err.message || (isId ? 'Terjadi kesalahan sistem.' : 'System error.'), error: true });
    } finally {
      setIsSavingRecap(false);
    }
  };

  // Real-time listener: Perbarui daftar peserta seketika saat orang lain bergabung ke meja
  useEffect(() => {
    const unsub = realtimeEmitter.subscribe('meetup:member_joined', (data) => {
      if (data && data.meetupId === initialMeetup.id) {
        if (data.member) {
          setMembers((prev) => {
            const exists = prev.some((m) => m.userId === data.member.userId || m.id === data.member.id);
            if (exists) return prev;
            return [...prev, data.member];
          });
        }
        if (typeof data.currentMemberCount === 'number') {
          setMemberCount(data.currentMemberCount);
        } else {
          setMemberCount((prev) => prev + 1);
        }
      }
    });
    return unsub;
  }, [initialMeetup.id]);

  // Sisa slot
  const maxSlots = initialMeetup.max_members;
  const remainingSlots = maxSlots ? Math.max(0, maxSlots - memberCount) : null;
  const isFull = maxSlots ? memberCount >= maxSlots : false;

  // Tanggal terformat
  const startDateObj = new Date(initialMeetup.start_date);
  const endDateObj = new Date(initialMeetup.end_date);

  const formattedDateRange = startDateObj.toLocaleDateString(isId ? 'id-ID' : 'en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Ekstraksi info meeting point dari deskripsi jika ada
  let meetingPointAddress = `${initialMeetup.city?.name || 'Indonesia'}`;
  let meetingTime = '09:00 - Selesai';
  if (initialMeetup.description) {
    const matchPoint = initialMeetup.description.match(/Meeting Point:\s*([^\n\r]+)/i);
    if (matchPoint && matchPoint[1]) {
      meetingPointAddress = matchPoint[1].replace(/[\(\)]/g, '').trim();
    }
    const matchTime = initialMeetup.description.match(/(?:⏰|Time|Waktu):\s*([^\n\r]+)/i);
    if (matchTime && matchTime[1]) {
      meetingTime = matchTime[1].trim();
    }
  }

  // Google Maps link
  const googleMapsQuery = encodeURIComponent(
    `${meetingPointAddress}, ${initialMeetup.city?.name || ''}`
  );
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${googleMapsQuery}`;

  const getAvatarUrl = (avatar: string | null | undefined) => {
    if (!avatar) return '/images/default.jpg';
    if (avatar.startsWith('http')) return avatar;
    return `/images/users/avatars/${avatar}`;
  };

  const creatorAvatar = getAvatarUrl(initialMeetup.creator.avatar_url);

  const { isAuthModalOpen, setIsAuthModalOpen, authMessage, executeProtected } =
    useProtectedAction();

  // Handle Join Meetup Action
  const handleJoinMeetup = async () => {
    executeProtected(async () => {
      if (isJoined || isJoining || isFull) return;

      setIsJoining(true);
      setJoinSuccessMsg('');
      setJoinErrorMsg('');

      try {
        const res = await fetch(`/api/community/meetups/${initialMeetup.id}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        const data = await res.json();
        if (data.success) {
          if (data.isPendingApproval) {
            setIsPending(true);
            setJoinSuccessMsg(
              isId
                ? '⏳ Permohonan bergabung telah terkirim! Host meja akan meninjau dan menyetujui permohonan Anda.'
                : '⏳ Join request sent! Table host will review and approve your request.'
            );
            // Emit notification event for host bell with pending info
            realtimeEmitter.emit('notification:new', {
              type: 'MEETUP_RSVP',
              title: 'Permohonan Gabung Meja Kumpul! 🔒',
              message: `${currentUser?.name || 'Seorang traveler'} meminta izin bergabung ke meja privat "${initialMeetup.title}".`,
              action_url: `/${lang}/community/meetups/${initialMeetup.slug || initialMeetup.id}`,
            });
          } else {
            setIsJoined(true);
            if (data.member) {
              setMembers((prev) => [...prev, data.member]);
            }
            const nextCount = typeof data.currentMemberCount === 'number' ? data.currentMemberCount : memberCount + 1;
            setMemberCount(nextCount);

            // Emit real-time member joined event across tabs/clients
            realtimeEmitter.emit('meetup:member_joined', {
              meetupId: initialMeetup.id,
              member: data.member,
              currentMemberCount: nextCount,
            });

            // Emit instant gamification update (+30 XP & +5 LTP)
            realtimeEmitter.emit('user:gamification_update', {
              xpEarned: 30,
              ltpEarned: 5,
            });

            // Emit notification event for host bell
            realtimeEmitter.emit('notification:new', {
              type: 'MEETUP_RSVP',
              title: 'Peserta Baru Bergabung! 🗓️',
              message: `${currentUser?.name || 'Seorang traveler'} baru saja bergabung ke Meja Kumpul "${initialMeetup.title}"!`,
              action_url: `/${lang}/community/meetups/${initialMeetup.slug || initialMeetup.id}`,
            });

            setJoinSuccessMsg(
              isId
                ? '🎉 Selamat! Anda telah berhasil bergabung dengan meja kumpul ini (+30 XP & +5 LTP).'
                : '🎉 Success! You have successfully joined this table (+30 XP & +5 LTP).'
            );
          }
        } else {
          setJoinErrorMsg(data.error || (isId ? 'Gagal bergabung dengan agenda.' : 'Failed to join meetup.'));
        }
      } catch {
        setJoinErrorMsg(isId ? 'Terjadi kesalahan sistem.' : 'Network error.');
      } finally {
        setIsJoining(false);
      }
    }, isId ? 'Masuk untuk bergabung dengan agenda meetup dan klaim reward!' : 'Sign in to join this meetup and claim rewards!');
  };

  // Handle direct inquiry chat (DM) with host
  const handleStartInquiry = async () => {
    executeProtected(async () => {
      if (!initialMeetup.creator?.id) return;
      if (currentUser?.id === initialMeetup.creator.id) {
        setIsChatOpen(true);
        return;
      }

      setIsStartingInquiry(true);
      try {
        const res = await getOrCreateDirectConversation(initialMeetup.creator.id);
        if (res.success && res.conversationId) {
          const currentMeetupPath = `/${lang}/community/meetups/${initialMeetup.slug || initialMeetup.id}`;
          router.push(`/${lang}/messages?c=${res.conversationId}&returnUrl=${encodeURIComponent(currentMeetupPath)}`);
        } else {
          setJoinErrorMsg(res.error || (isId ? 'Gagal membuka percakapan.' : 'Failed to open inquiry chat.'));
        }
      } catch {
        setJoinErrorMsg(isId ? 'Gagal membuka percakapan.' : 'Failed to open inquiry chat.');
      } finally {
        setIsStartingInquiry(false);
      }
    }, isId ? 'Masuk untuk mengirim pesan ke inisiator kumpul.' : 'Sign in to chat with the table host.');
  };

  const currentUrl =
    typeof window !== 'undefined'
      ? window.location.href
      : `https://locallytrip.com/${lang}/community/meetups/${initialMeetup.slug || initialMeetup.id}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* ======================================================== */}
      {/* KOLOM KIRI (lg:col-span-8) - DETAIL AGENDA & KEGIATAN */}
      {/* ======================================================== */}
      <div className="lg:col-span-8 space-y-6">
        {/* Meetup Main Card */}
        <article className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-xs">
          {/* 1. Banner / Foto Cover Meetup */}
          <div className="relative w-full h-72 sm:h-96 rounded-3xl overflow-hidden bg-slate-900">
            <Image
              src={resolveMeetupDisplayImage(
                initialMeetup.bannerImage,
                initialMeetup.city?.image || initialMeetup.city?.coverImage || initialMeetup.city?.image_url
              )}
              alt={initialMeetup.title || 'Meetup Cover'}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 800px"
              className="object-cover transition-transform duration-500 hover:scale-105"
              onError={(e) => {
                // Fallback jika URL gambar eksternal 404/gagal dimuat
                const target = e.target as HTMLImageElement;
                target.src = '/images/default-meetup-cover.jpg';
                target.srcset = '/images/default-meetup-cover.jpg';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/20" />

            {/* Pill Kategori & Kota di atas gambar */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
              <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-xs font-semibold text-slate-800 shadow-sm flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-violet-600" />
                <span>{initialMeetup.category?.name || (isId ? 'Agenda Temu' : 'Community Meetup')}</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-xs font-semibold text-white shadow-sm flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>{initialMeetup.city?.name || 'Singapore'}</span>
              </span>
            </div>

            {/* Date Pill at bottom left of banner */}
            <div className="absolute bottom-4 left-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md text-white text-xs border border-white/10 shadow-sm">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>{formattedDateRange}</span>
              {initialMeetup.duration_days && (
                <span className="text-violet-300 font-medium">({initialMeetup.duration_days} {isId ? 'Hari' : 'Days'})</span>
              )}
            </div>
          </div>

          {/* Content Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Header Ringkas */}
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                <span>
                  {isId ? 'Diinisiasi oleh' : 'Initiated by'}{' '}
                  <strong className="text-slate-800">{initialMeetup.creator.name}</strong>
                </span>
                <span>•</span>
                <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                  {initialMeetup.join_type === 'public'
                    ? isId
                      ? 'Terbuka untuk Umum'
                      : 'Public Meetup'
                    : isId
                    ? 'Perlu Konfirmasi'
                    : 'Approval Required'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h1 className="heading-h1 font-serif text-2xl sm:text-3xl text-slate-900 tracking-tight leading-snug">
                  {initialMeetup.title}
                </h1>

                {/* Tombol Cepat Buka Obrolan Grup Meja di Atas */}
                {isJoined && (
                  <button
                    type="button"
                    onClick={() => setIsChatOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-900 hover:to-indigo-900 text-white font-bold text-xs shadow-md shadow-purple-900/20 transition-all hover:scale-105 active:scale-95 shrink-0 cursor-pointer self-start sm:self-auto"
                  >
                    <MessagesSquare className="w-4 h-4 text-amber-300" />
                    <span>{isId ? 'Obrolan Grup Meja' : 'Group Chat'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Event Key Highlights Box */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/70 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-violet-600 shadow-xs border border-slate-100 shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">{isId ? 'Pelaksanaan' : 'Date'}</span>
                  <span className="font-bold text-slate-900 line-clamp-1">{formattedDateRange}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-violet-600 shadow-xs border border-slate-100 shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">{isId ? 'Waktu Kumpul' : 'Meeting Time'}</span>
                  <span className="font-bold text-slate-900 line-clamp-1">{meetingTime}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-violet-600 shadow-xs border border-slate-100 shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">{isId ? 'Kapasitas Kuota' : 'Capacity'}</span>
                  <span className="font-bold text-slate-900">
                    {memberCount} / {maxSlots || '∞'} {isId ? 'Peserta' : 'Members'}
                  </span>
                </div>
              </div>
            </div>

            {/* Seksi "Tentang Agenda Ini" */}
            <div className="space-y-3 pt-2">
              <h2 className="heading-h2 font-serif text-lg sm:text-xl text-slate-900 tracking-tight">
                {isId ? 'Tentang Agenda Ini' : 'About this Meetup'}
              </h2>
              <div className="text-body text-slate-700 leading-relaxed whitespace-pre-line text-sm sm:text-base space-y-3">
                <p>{initialMeetup.description || initialMeetup.title}</p>
              </div>

              {/* UGC Translation Helper */}
              <div className="pt-2">
                <UgcTranslateButton originalText={initialMeetup.description || initialMeetup.title} />
              </div>
            </div>

            {/* Seksi Dokumentasi & Momen Temu (Recap Photos) */}
            <div className="pt-4 border-t border-slate-150 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <h3 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                    <Camera className="w-5 h-5 text-purple-600" />
                    <span>{isId ? 'Dokumentasi & Momen Temu' : 'Meetup Moments & Recap Photos'}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isId
                      ? 'Keseruan foto bersama anggota komunitas saat agenda kumpul berlangsung.'
                      : 'Memorable photo moments shared with fellow community members.'}
                  </p>
                </div>

                {isOwner && (
                  <button
                    type="button"
                    onClick={() => {
                      setTempRecapImages(recapImages);
                      setRecapMsg(null);
                      setIsRecapModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100/80 text-purple-700 border border-purple-200 text-xs font-bold transition shrink-0 cursor-pointer shadow-2xs"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{isId ? 'Kelola Foto Dokumentasi' : 'Manage Recap Photos'}</span>
                  </button>
                )}
              </div>

              {/* Galeri Grid Foto Dokumentasi */}
              {recapImages.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-1">
                  {recapImages.map((imgUrl, idx) => (
                    <div
                      key={`${imgUrl}-${idx}`}
                      className="group relative aspect-4/3 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all duration-300"
                    >
                      <img
                        src={imgUrl}
                        alt={`Dokumentasi Meetup ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = '/images/placeholders/meetup-default.jpg';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                        <span className="text-[10px] text-white font-medium">
                          Foto #{idx + 1}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-slate-50/70 border border-dashed border-slate-200 text-center space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-purple-100/60 text-purple-600 flex items-center justify-center mx-auto">
                    <ImageIcon className="w-5 h-5 text-purple-500" />
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    {isId
                      ? 'Belum ada foto dokumentasi yang dibagikan untuk meetup ini.'
                      : 'No recap moments uploaded for this meetup yet.'}
                  </p>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => {
                        setTempRecapImages(recapImages);
                        setRecapMsg(null);
                        setIsRecapModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition cursor-pointer shadow-xs"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{isId ? 'Unggah Foto Pertama' : 'Upload First Photo'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Lokasi & Peta Titik Temu */}
            <div className="pt-4 border-t border-slate-150 space-y-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-violet-600" />
                <span>{isId ? 'Lokasi & Titik Kumpul' : 'Location & Meeting Point'}</span>
              </h3>

              <div className="p-4 rounded-2xl bg-violet-50/50 border border-violet-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-900 block">{meetingPointAddress}</span>
                  <span className="text-slate-500">{initialMeetup.city?.name || 'Indonesia'}</span>
                </div>

                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-violet-700 font-semibold border border-violet-200/80 shadow-xs hover:bg-violet-50 transition shrink-0"
                >
                  <span>{isId ? 'Buka Google Maps' : 'Open in Google Maps'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </article>

        {/* Seksi Daftar Peserta yang Bergabung (Facepile + Detail) */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="heading-h2 font-serif text-lg sm:text-xl text-slate-900 tracking-tight flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-600" />
              <span>
                {isId ? 'Peserta yang Sudah Bergabung' : 'Confirmed Participants'} ({members.length})
              </span>
            </h2>
            {maxSlots && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                {remainingSlots !== null && remainingSlots > 0
                  ? isId
                    ? `Tersisa ${remainingSlots} slot lagi!`
                    : `${remainingSlots} spots left!`
                  : isId
                  ? 'Kuota Penuh'
                  : 'Sold Out'}
              </span>
            )}
          </div>

          {/* Facepile Visual Bar */}
          <div className="flex items-center -space-x-2 overflow-hidden py-1">
            {members.slice(0, 10).map((m, idx) => {
              const memberId = m.username || m.userId || m.id;
              return (
                <Link
                  key={m.id || idx}
                  href={`/${lang}/users/${memberId}`}
                  title={m.name || 'Member'}
                  className="inline-block rounded-full ring-2 ring-white hover:ring-purple-400 hover:scale-105 transition-all shrink-0"
                >
                  <UserAvatar
                    src={m.avatar_url}
                    name={m.name || 'Member'}
                    size={40}
                    className="shadow-xs"
                  />
                </Link>
              );
            })}
            {members.length > 10 && (
              <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-800 ring-2 ring-white flex items-center justify-center text-xs font-bold shadow-xs">
                +{members.length - 10}
              </div>
            )}
          </div>

          {/* Grid Peserta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
            {members.map((member) => {
              const memberId = member.username || member.userId || member.id;
              return (
                <Link
                  key={member.id}
                  href={`/${lang}/users/${memberId}`}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-purple-200 hover:bg-white hover:shadow-xs transition-all group"
                >
                  <UserAvatar
                    src={member.avatar_url}
                    name={member.name || 'User'}
                    size={32}
                    className="border border-slate-200 group-hover:border-purple-300"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-slate-900 text-xs truncate group-hover:text-purple-700 transition-colors">
                        {member.name || member.username || 'Traveler'}
                      </span>
                      {member.is_verified && (
                        <span className="text-emerald-500 font-bold text-[10px]" title="KYC Verified">
                          ✓
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 capitalize block">
                      {member.status === 'approved' ? (isId ? 'Terdaftar' : 'Confirmed') : member.status}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>

      {/* ======================================================== */}
      {/* KOLOM KANAN (lg:col-span-4) - SIDEBAR AKSI & PROFIL HOST */}
      {/* ======================================================== */}
      <aside className="lg:col-span-4 space-y-6">
        {/* Kartu Insentif Reward Dinamis untuk Kehadiran Meetup (MEETUP_JOIN) */}
        <RewardIncentiveCard
          xp={30}
          ltp={5}
          actionTitleId="Hadir & Ikuti Agenda Meetup"
          actionTitleEn="Attend Community Meetup"
          locale={lang}
          variant="card"
        />

        {/* 1. Kartu Aksi Pendaftaran Meetup (Sticky Widget) */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-md sticky top-24 space-y-5">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-violet-600 block">
              {isId ? 'Status Pendaftaran' : 'Registration Status'}
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-serif text-slate-900">
                {isId ? 'Gratis Bergabung' : 'Free to Join'}
              </span>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                100% Komunitas
              </span>
            </div>
          </div>

          <div className="space-y-2.5 py-3 border-y border-slate-150 text-xs text-slate-600">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">{isId ? 'Tanggal Acara:' : 'Event Date:'}</span>
              <span className="font-semibold text-slate-800">{formattedDateRange}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">{isId ? 'Waktu:' : 'Time:'}</span>
              <span className="font-semibold text-slate-800">{meetingTime}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">{isId ? 'Sisa Kuota:' : 'Remaining Slots:'}</span>
              <span className="font-bold text-violet-700">
                {remainingSlots !== null ? `${remainingSlots} slot` : 'Tanpa batas'}
              </span>
            </div>
          </div>

          {/* Join CTA Button */}
          {isJoined ? (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{isId ? 'Anda Sudah Bergabung!' : 'You Are In!'}</span>
                </span>
                <p className="text-[11px] text-emerald-700">
                  {isId
                    ? 'Sampai jumpa di meja kumpul bersama sesama explorer.'
                    : 'See you at the social table with fellow explorers.'}
                </p>
              </div>

              {/* Tombol Utama: Buka Obrolan Grup Meja */}
              <button
                type="button"
                onClick={() => setIsChatOpen(true)}
                className="w-full py-3.5 px-4 rounded-full bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-900 hover:to-indigo-900 text-white font-bold text-xs sm:text-sm shadow-md shadow-purple-900/25 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <MessagesSquare className="w-4 h-4 text-amber-300" />
                <span>{isId ? 'Buka Obrolan Grup Meja (Group Chat)' : 'Open Table Group Chat'}</span>
              </button>
            </div>
          ) : isPending ? (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-1">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>{isId ? 'Menunggu Persetujuan Host' : 'Pending Host Approval'}</span>
                </span>
                <p className="text-[11px] text-amber-700">
                  {isId
                    ? 'Permohonan bergabung Anda sedang ditinjau oleh host meja ini. Anda akan mendapatkan notifikasi setelah disetujui.'
                    : 'Your join request is being reviewed by the table host. You will be notified once approved.'}
                </p>
              </div>

              <button
                type="button"
                disabled={isStartingInquiry}
                onClick={handleStartInquiry}
                className="w-full py-2.5 px-4 rounded-full border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-900 font-semibold text-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-3.5 h-3.5 text-purple-700" />
                <span>{isStartingInquiry ? (isId ? 'Membuka Chat...' : 'Opening Chat...') : (isId ? 'Tanya Inisiator (Chat Personal)' : 'Inquire Host (Personal Chat)')}</span>
              </button>
            </div>
          ) : isFull ? (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-center text-xs font-bold text-rose-700">
                {isId ? 'Maaf, Kuota Meja Kumpul Penuh' : 'Table is Fully Booked'}
              </div>
              <button
                type="button"
                disabled={isStartingInquiry}
                onClick={handleStartInquiry}
                className="w-full py-3 px-4 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4 text-purple-600" />
                <span>{isStartingInquiry ? (isId ? 'Menghubungkan...' : 'Connecting...') : (isId ? 'Tanya Inisiator (Chat Personal)' : 'Inquire Host (Personal Chat)')}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              <button
                type="button"
                disabled={isJoining}
                onClick={handleJoinMeetup}
                className="w-full py-3.5 px-4 rounded-full bg-purple-900 hover:bg-purple-950 disabled:bg-slate-300 text-white font-bold text-xs sm:text-sm shadow-md shadow-purple-900/25 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{isJoining
                  ? isId
                    ? 'Memproses...'
                    : 'Joining...'
                  : initialMeetup.join_type === 'private'
                  ? isId
                    ? 'Ajukan Gabung Meja (Perlu Persetujuan) 🔒'
                    : 'Request to Join Table (Approval Required) 🔒'
                  : isId
                  ? 'Gabung Meja Kumpul Sekarang 🍽️'
                  : 'Join This Table Now 🍽️'}</span>
              </button>

              {/* Indikator Pembatasan Obrolan Grup untuk Bukan Peserta */}
              <div className="pt-1">
                <button
                  type="button"
                  disabled
                  className="w-full py-2.5 px-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-slate-400 font-medium text-xs flex items-center justify-center gap-1.5 cursor-not-allowed opacity-80"
                  title={isId ? 'Gabung Meja Kumpul ini untuk membuka Ruang Obrolan Peserta' : 'Join this table to unlock the group chat'}
                >
                  <MessagesSquare className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {isId
                      ? 'Gabung Meja Kumpul ini untuk membuka Ruang Obrolan Peserta'
                      : 'Join this meetup to unlock attendee group chat'}
                  </span>
                </button>
              </div>

              {/* Tombol Tanya Inisiator untuk traveler yang belum bergabung */}
              <button
                type="button"
                disabled={isStartingInquiry}
                onClick={handleStartInquiry}
                className="w-full py-2.5 px-4 rounded-full border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-900 font-semibold text-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-3.5 h-3.5 text-purple-700" />
                <span>{isStartingInquiry ? (isId ? 'Membuka Chat...' : 'Opening Chat...') : (isId ? 'Tanya Inisiator (Chat Personal)' : 'Ask Host (Personal Chat)')}</span>
              </button>
            </div>
          )}

          {joinSuccessMsg && (
            <p className="text-xs font-semibold text-emerald-600 text-center">
              {joinSuccessMsg}
            </p>
          )}
          {joinErrorMsg && (
            <p className="text-xs font-semibold text-rose-600 text-center">
              {joinErrorMsg}
            </p>
          )}

          {/* Global Share & Report Button */}
          <div className="pt-2 flex flex-col gap-2">
            <ShareButton
              data={{
                title: initialMeetup.title,
                summary: initialMeetup.description
                  ? initialMeetup.description.slice(0, 150)
                  : initialMeetup.title,
                pathType: 'meetups',
                url: currentUrl,
              }}
              lang={lang}
              label={isId ? 'Bagikan Agenda ✨' : 'Share the Vibe ✨'}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-all cursor-pointer hover:border-slate-300 active:scale-95"
            />
            <div className="flex justify-center">
              <ReportContentButton
                targetType="meetup"
                targetId={initialMeetup.id}
                targetTitle={initialMeetup.title}
                lang={lang}
                variant="subtle"
              />
            </div>
          </div>
        </div>

        {/* 2. Kartu Profil Inisiator / Host */}
        <UserSidebarCard
          user={{
            id: initialMeetup.creator.id,
            name: initialMeetup.creator.name,
            username: initialMeetup.creator.username,
            avatar_url: initialMeetup.creator.avatar_url,
            role: initialMeetup.creator.role,
            is_verified: initialMeetup.creator.is_verified,
            level: initialMeetup.creator.level,
            total_xp: initialMeetup.creator.total_xp,
            bio: initialMeetup.creator.bio,
            host_kyc_host_kyc_user_idTousers: initialMeetup.creator.host_kyc_host_kyc_user_idTousers,
          }}
          lang={lang}
          initialIsFollowing={initialIsFollowingHost}
          currentUserId={currentUser?.id}
          subtitleExtra={
            <span className="text-slate-400">
              • {isId ? 'Inisiator Meetup' : 'Host Organizer'}
            </span>
          }
        />

        {/* Helper function: Experience Mini Card */}
        {(() => {
          const renderExperienceCard = (exp: RelatedExperienceItem) => {
            let expImg = '/images/placeholders/experience-default.jpg';
            if (Array.isArray(exp.images) && exp.images.length > 0 && typeof exp.images[0] === 'string' && exp.images[0].trim()) {
              const raw = exp.images[0].trim();
              expImg = raw.startsWith('http') || raw.startsWith('/') ? raw : `/images/experiences/${raw}`;
            }

            const ratingNum = exp.rating ?? (exp.rating_average ? Number(exp.rating_average) : 5.0);
            const displayRating = ratingNum > 0 ? ratingNum.toFixed(1) : '5.0';

            let displayPrice = 'Free';
            if (exp.price_idr) {
              displayPrice = `Rp ${Number(exp.price_idr).toLocaleString('id-ID')}`;
            } else if (exp.package_price) {
              const pNum = Number(exp.package_price);
              if (exp.currency === 'USD' || exp.currency === '$') {
                displayPrice = `$${pNum}`;
              } else {
                displayPrice = `Rp ${(pNum > 1000 ? pNum : pNum * 15500).toLocaleString('id-ID')}`;
              }
            }

            return (
              <Link
                key={exp.id}
                href={`/${lang}/experiences/${exp.slug || exp.id}`}
                className="flex items-center gap-3 p-2 rounded-2xl hover:bg-slate-50 transition-colors group"
              >
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                  <Image
                    src={expImg}
                    alt={exp.title}
                    fill
                    sizes="64px"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/images/placeholders/experience-default.jpg';
                    }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-semibold text-purple-700 block truncate">
                    {exp.experience_types?.name || 'Experience'} • {exp.cities?.name || initialMeetup.city?.name || 'Local'}
                  </span>
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-purple-900 transition-colors">
                    {exp.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                    <span className="text-amber-500 font-semibold flex items-center gap-0.5">
                      ★ {displayRating}
                    </span>
                    <span>•</span>
                    <span className="font-medium text-slate-700">
                      {displayPrice}
                    </span>
                  </div>
                </div>
              </Link>
            );
          };

          const effectiveCityExperiences = cityExperiences.length > 0 ? cityExperiences : relatedExperiences;

          return (
            <>
              {/* 1. Modul Khusus: Experiences di Kota Tersebut */}
              {effectiveCityExperiences && effectiveCityExperiences.length > 0 && (
                <div className="rounded-3xl bg-white border border-slate-200 p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 font-serif">
                      <span>✨</span>
                      <span>
                        {isId
                          ? `Aktivitas di ${initialMeetup.city?.name || 'Sekitar'}`
                          : `Experiences in ${initialMeetup.city?.name || 'Area'}`}
                      </span>
                    </h3>
                    <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                      Local Hosts
                    </span>
                  </div>

                  <div className="space-y-3">
                    {effectiveCityExperiences.map((exp) => renderExperienceCard(exp))}
                  </div>

                  <div className="pt-2 border-t border-slate-100 text-center">
                    <Link
                      href={`/${lang}/experiences?city=${encodeURIComponent(initialMeetup.city?.name || '')}`}
                      className="text-xs font-bold text-purple-700 hover:text-purple-900 transition-colors inline-block"
                    >
                      {isId
                        ? `Lihat Semua di ${initialMeetup.city?.name || 'Destinasi Ini'} ›`
                        : `See All in ${initialMeetup.city?.name || 'This Destination'} ›`}
                    </Link>
                  </div>
                </div>
              )}

              {/* 2. Modul Rekomendasi: Pengalaman Populer Lainnya (Hanya tampil jika kota meetup belum ada tur) */}
              {(!effectiveCityExperiences || effectiveCityExperiences.length === 0) && popularExperiences && popularExperiences.length > 0 && (
                <div className="rounded-3xl bg-white border border-slate-200 p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 font-serif">
                      <span>🔥</span>
                      <span>
                        {isId ? 'Pengalaman Populer Lainnya' : 'Popular Experiences'}
                      </span>
                    </h3>
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                      Top Rated
                    </span>
                  </div>

                  <div className="space-y-3">
                    {popularExperiences.map((exp) => renderExperienceCard(exp))}
                  </div>

                  <div className="pt-2 border-t border-slate-100 text-center">
                    <Link
                      href={`/${lang}/experiences`}
                      className="text-xs font-bold text-purple-700 hover:text-purple-900 transition-colors inline-block"
                    >
                      {isId ? 'Jelajahi Semua Pengalaman ›' : 'Explore All Experiences ›'}
                    </Link>
                  </div>
                </div>
              )}
            </>
          );
        })()}
      </aside>

      {/* Contextual Auth Guard Modal */}
      <ContextualAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        promptMessage={authMessage}
        locale={lang}
        onSuccess={() => {
          handleJoinMeetup();
        }}
      />

      {/* Real-Time Table Group Chat Modal */}
      <MeetupGroupChatModal
        meetupId={initialMeetup.id}
        meetupTitle={initialMeetup.title}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        currentUserId={currentUser?.id || 0}
        currentUserName={currentUser?.name || 'Explorer'}
        currentUserAvatar={currentUser?.avatar_url}
        locale={lang}
      />

      {/* Modal Kelola Dokumentasi Foto Meetup (Owner Only) */}
      {isRecapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-150 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                    {isId ? 'Kelola Foto Momen Temu' : 'Manage Recap Photos'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isId
                      ? 'Unggah dan bagikan foto dokumentasi kegiatan meetup (maks. 8 foto).'
                      : 'Upload and share recap photos of this meetup (max 8 photos).'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRecapModalOpen(false)}
                disabled={isSavingRecap}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {recapMsg && (
              <div
                className={`p-3.5 rounded-xl text-xs sm:text-sm flex items-center gap-2 font-medium ${
                  recapMsg.error
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                {recapMsg.error ? (
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                )}
                <span>{recapMsg.text}</span>
              </div>
            )}

            <div className="space-y-3">
              <ImageUploadDropzone
                value={tempRecapImages}
                onChange={(val) => {
                  const arr = Array.isArray(val) ? val : [val].filter(Boolean);
                  setTempRecapImages(arr);
                }}
                folder="meetups"
                multiple={true}
                maxFiles={8}
                label={isId ? 'Pilih atau Seret Foto Dokumentasi' : 'Select or Drop Photos'}
                description={
                  isId
                    ? 'Format JPG, PNG, WebP. Maksimal 8 foto dokumentasi.'
                    : 'Supported formats: JPG, PNG, WebP. Max 8 photos.'
                }
                disabled={isSavingRecap}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsRecapModalOpen(false)}
                disabled={isSavingRecap}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                {isId ? 'Batal' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveRecapImages}
                disabled={isSavingRecap}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-purple-600/20 transition cursor-pointer disabled:opacity-60"
              >
                {isSavingRecap && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isId ? 'Simpan Dokumentasi' : 'Save Photos'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
