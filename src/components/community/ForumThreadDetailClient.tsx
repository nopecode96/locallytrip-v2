'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { sanitizeHtml } from '@/lib/sanitize';
import {
  ArrowBigUp,
  ArrowBigDown,
  MessageCircle,
  Coins,
  Send,
  CornerDownRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Info,
  Calendar,
  Eye,
  Award,
  BookOpen,
  Compass,
  Flame,
  Check,
  X,
  Share2,
  Lock,
} from 'lucide-react';
import { ShareButton } from '@/components/common/ShareModal';
import { UgcTranslateButton } from '@/components/community/UgcTranslateButton';
import { ReportContentButton } from '@/components/community/ReportContentButton';
import { SidebarUpcomingMeetups, SidebarMeetupItem } from '@/components/community/SidebarUpcomingMeetups';
import { SidebarRelatedExperiences, SidebarExperienceItem } from '@/components/community/SidebarRelatedExperiences';
import { useProtectedAction } from '@/hooks/useProtectedAction';
import { ContextualAuthModal } from '@/components/marketplace/ContextualAuthModal';
import { RewardIncentiveCard } from '@/components/rewards/RewardIncentiveCard';
import { FollowButton } from '@/components/shared/FollowButton';
import { UserSidebarCard } from '@/components/shared/UserSidebarCard';
import { UserAvatar } from '@/components/common/UserAvatar';
import { resolveForumImageUrl } from '@/lib/utils/media';

export interface ForumCommentItem {
  id: number;
  thread_id: number;
  parent_id: number | null;
  content: string;
  created_at: string | null;
  likes_count: number;
  dislikes_count: number;
  net_score: number;
  author: {
    id: number;
    name: string | null;
    username: string | null;
    avatar_url: string | null;
    role: string | null;
    is_verified: boolean;
    level: number;
    cityName?: string | null;
  };
}

export interface ForumThreadDetailData {
  id: number;
  title: string;
  slug: string;
  content: string;
  created_at: string | null;
  view_count: number;
  like_count: number;
  dislike_count: number;
  net_score: number;
  reply_count: number;
  is_pinned: boolean;
  is_featured: boolean;
  is_locked: boolean;
  author: {
    id: number;
    name: string | null;
    username: string | null;
    avatar_url: string | null;
    role: string | null;
    is_verified: boolean;
    level: number;
    total_xp?: number;
    bio?: string | null;
    cityName?: string | null;
    host_kyc_host_kyc_user_idTousers?: { status: string } | null;
    host_kyc?: { status: string } | null;
    is_kyc_verified?: boolean;
  };
  category: {
    id: number;
    name: string;
    slug: string;
    icon: string | null;
  } | null;
  cityName: string | null;
  images?: string[];
  comments: ForumCommentItem[];
}

export interface RelatedThreadItem {
  id: number;
  title: string;
  slug: string;
  reply_count: number;
  like_count: number;
  view_count: number;
}

export interface CurrentUserSessionData {
  id: number;
  name: string;
  email: string;
  avatar_url?: string | null;
  isLoggedIn: boolean;
}

interface ForumThreadDetailClientProps {
  thread: ForumThreadDetailData;
  relatedThreads: RelatedThreadItem[];
  featuredExperiences?: SidebarExperienceItem[];
  upcomingMeetups?: SidebarMeetupItem[];
  lang: string;
  currentUser: CurrentUserSessionData | null;
  initialIsFollowingAuthor?: boolean;
}

export function ForumThreadDetailClient({
  thread: initialThread,
  relatedThreads,
  featuredExperiences = [],
  upcomingMeetups = [],
  lang,
  currentUser: initialCurrentUser,
  initialIsFollowingAuthor = false,
}: ForumThreadDetailClientProps) {
  const isId = lang === 'id';
  const router = useRouter();

  // Auth state
  const currentUser = initialCurrentUser;

  // Thread voting state
  const [threadNetScore, setThreadNetScore] = useState(initialThread.net_score);
  const [threadVote, setThreadVote] = useState<'up' | 'down' | null>(null);
  const [isVotingThread, setIsVotingThread] = useState(false);

  // Comments state
  const [comments, setComments] = useState<ForumCommentItem[]>(initialThread.comments);
  const [commentVotes, setCommentVotes] = useState<Record<number, 'up' | 'down' | null>>({});

  // Main comment input form state
  const [mainCommentText, setMainCommentText] = useState('');
  const [isSubmittingMain, setIsSubmittingMain] = useState(false);
  const [mainSuccessMsg, setMainSuccessMsg] = useState('');

  // Inline reply-to-reply state (commentId -> boolean/text)
  const [activeReplyId, setActiveReplyId] = useState<number | null>(null);
  const [inlineReplyText, setInlineReplyText] = useState('');
  const [isSubmittingInline, setIsSubmittingInline] = useState(false);

  // LTP Tip Modal state
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [tipAmount, setTipAmount] = useState<number>(5);
  const [isSubmittingTip, setIsSubmittingTip] = useState(false);
  const [tipSuccessMsg, setTipSuccessMsg] = useState('');

  // Handle Thread Vote (Reddit/Threads Style)
  const handleThreadVote = async (type: 'up' | 'down') => {
    if (isVotingThread) return;

    const previousVote = threadVote;
    const previousScore = threadNetScore;

    let newVote: 'up' | 'down' | null = type;
    let scoreDelta = 0;

    if (previousVote === type) {
      newVote = null;
      scoreDelta = type === 'up' ? -1 : 1;
    } else if (previousVote === null) {
      scoreDelta = type === 'up' ? 1 : -1;
    } else {
      scoreDelta = type === 'up' ? 2 : -2;
    }

    setThreadVote(newVote);
    setThreadNetScore((prev) => prev + scoreDelta);
    setIsVotingThread(true);

    try {
      const res = await fetch(`/api/forums/${initialThread.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voteType: newVote || 'clear' }),
      });
      const data = await res.json();
      if (!data.success) {
        setThreadVote(previousVote);
        setThreadNetScore(previousScore);
      } else {
        setThreadNetScore(data.netScore);
      }
    } catch {
      setThreadVote(previousVote);
      setThreadNetScore(previousScore);
    } finally {
      setIsVotingThread(false);
    }
  };

  // Handle Comment Vote
  const handleCommentVote = async (commentId: number, type: 'up' | 'down') => {
    const currentVote = commentVotes[commentId] || null;
    let newVote: 'up' | 'down' | null = type;
    let scoreDelta = 0;

    if (currentVote === type) {
      newVote = null;
      scoreDelta = type === 'up' ? -1 : 1;
    } else if (currentVote === null) {
      scoreDelta = type === 'up' ? 1 : -1;
    } else {
      scoreDelta = type === 'up' ? 2 : -2;
    }

    setCommentVotes((prev) => ({ ...prev, [commentId]: newVote }));
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId ? { ...c, net_score: c.net_score + scoreDelta } : c
      )
    );

    try {
      const res = await fetch(`/api/forums/${initialThread.id}/comments/${commentId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voteType: newVote || 'clear' }),
      });
      const data = await res.json();
      if (!data.success) {
        setCommentVotes((prev) => ({ ...prev, [commentId]: currentVote }));
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId ? { ...c, net_score: c.net_score - scoreDelta } : c
          )
        );
      }
    } catch {
      setCommentVotes((prev) => ({ ...prev, [commentId]: currentVote }));
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, net_score: c.net_score - scoreDelta } : c
        )
      );
    }
  };

  const { isAuthModalOpen, setIsAuthModalOpen, authMessage, executeProtected } =
    useProtectedAction();

  // Submit Main Top-level Comment
  const handleSubmitMainComment = async (e: React.FormEvent) => {
    e.preventDefault();
    executeProtected(async () => {
      if (!mainCommentText.trim() || isSubmittingMain) return;

      setIsSubmittingMain(true);
      setMainSuccessMsg('');

      try {
        const res = await fetch(`/api/forums/${initialThread.id}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: mainCommentText.trim(),
            parentId: null,
          }),
        });

        const data = await res.json();
        if (data.success && data.post) {
          const newCommentItem: ForumCommentItem = {
            id: data.post.id,
            thread_id: data.post.thread_id,
            parent_id: data.post.parent_id,
            content: data.post.content,
            created_at: data.post.created_at,
            likes_count: 0,
            dislikes_count: 0,
            net_score: 0,
            author: data.post.author,
          };

          setComments((prev) => [...prev, newCommentItem]);
          setMainCommentText('');
          setMainSuccessMsg(
            isId
              ? '✨ Balasan Anda berhasil diposting! Terima kasih atas partisipasinya.'
              : '✨ Your reply was posted successfully! Thank you for sharing.'
          );
          setTimeout(() => setMainSuccessMsg(''), 4000);
        }
      } catch (err) {
        console.error('Error posting main comment:', err);
      } finally {
        setIsSubmittingMain(false);
      }
    }, isId ? 'Masuk untuk membalas diskusi forum dan klaim reward +10 XP!' : 'Sign in to reply and earn +10 XP reward!');
  };

  // Submit Inline Reply-to-Reply
  const handleSubmitInlineReply = async (parentCommentId: number) => {
    executeProtected(async () => {
      if (!inlineReplyText.trim() || isSubmittingInline) return;

      setIsSubmittingInline(true);
      try {
        const res = await fetch(`/api/forums/${initialThread.id}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: inlineReplyText.trim(),
            parentId: parentCommentId,
          }),
        });

        const data = await res.json();
        if (data.success && data.post) {
          const newCommentItem: ForumCommentItem = {
            id: data.post.id,
            thread_id: data.post.thread_id,
            parent_id: data.post.parent_id,
            content: data.post.content,
            created_at: data.post.created_at,
            likes_count: 0,
            dislikes_count: 0,
            net_score: 0,
            author: data.post.author,
          };

          setComments((prev) => [...prev, newCommentItem]);
          setInlineReplyText('');
          setActiveReplyId(null);
        }
      } catch (err) {
        console.error('Error posting inline reply:', err);
      } finally {
        setIsSubmittingInline(false);
      }
    }, isId ? 'Masuk untuk membalas komentar ini.' : 'Sign in to reply to this comment.');
  };

  // Handle Reply Button click on comment
  const handleReplyButtonClick = (commentId: number) => {
    executeProtected(() => {
      setActiveReplyId(activeReplyId === commentId ? null : commentId);
      setInlineReplyText('');
    }, isId ? 'Masuk untuk membalas diskusi.' : 'Sign in to reply.');
  };

  // Handle Send LTP Tip
  const handleSendTip = async () => {
    executeProtected(async () => {
      if (isSubmittingTip) return;
      setIsSubmittingTip(true);
      setTipSuccessMsg('');
      try {
        const res = await fetch(`/api/forums/${initialThread.id}/tip`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: tipAmount }),
        });
        const data = await res.json();
        if (data.success) {
          setTipSuccessMsg(
            isId
              ? `🪙 Berhasil mengirim apresiasi ${tipAmount} LTP!`
              : `🪙 Successfully sent ${tipAmount} LTP tip!`
          );
          setTimeout(() => {
            setIsTipModalOpen(false);
            setTipSuccessMsg('');
          }, 2000);
        }
      } catch {
        // error
      } finally {
        setIsSubmittingTip(false);
      }
    }, isId ? 'Masuk untuk mengirim tip koin LTP ke traveler ini.' : 'Sign in to send LTP tip.');
  };

  // Helper avatar URL
  const getAvatarUrl = (avatar: string | null | undefined) => {
    if (!avatar) return '/images/default.jpg';
    if (avatar.startsWith('http')) return avatar;
    return `/images/users/avatars/${avatar}`;
  };

  const authorAvatar = getAvatarUrl(initialThread.author.avatar_url);

  // Group root comments and sub-replies
  const rootComments = comments.filter((c) => !c.parent_id);
  const getReplies = (parentId: number) => comments.filter((c) => c.parent_id === parentId);

  // Format date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(isId ? 'id-ID' : 'en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getRelativeTime = (dateStr: string | null) => {
    if (!dateStr) return '';
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return isId ? 'Hari ini' : 'Today';
      if (diffDays === 1) return isId ? 'Kemarin' : 'Yesterday';
      if (diffDays < 30) return isId ? `${diffDays} hari lalu` : `${diffDays}d ago`;
      return formatDate(dateStr);
    } catch {
      return '';
    }
  };

  const categoryEmoji = initialThread.category?.name.toLowerCase().includes('food')
    ? '🍲'
    : initialThread.category?.name.toLowerCase().includes('budget')
    ? '🪙'
    : initialThread.category?.name.toLowerCase().includes('destin')
    ? '🗺️'
    : '💬';

  const currentUrl =
    typeof window !== 'undefined'
      ? window.location.href
      : `https://locallytrip.com/${lang}/community/forums/${initialThread.id}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* ======================================================== */}
      {/* KOLOM KIRI (lg:col-span-8): THREAD UTAMA & DISKUSI */}
      {/* ======================================================== */}
      <div className="lg:col-span-8 space-y-6">
        {/* Main Thread Card */}
        <article className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs relative overflow-hidden">
          {/* Top Metadata Header Ringkas */}
          <div className="flex flex-wrap items-center gap-2.5 pb-4 border-b border-slate-150 text-xs">
            {initialThread.category && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 text-violet-700 font-semibold border border-violet-100/80">
                <span>{categoryEmoji}</span>
                <span>{initialThread.category.name}</span>
              </span>
            )}

            {initialThread.cityName && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
                <span>📍</span>
                <span>{initialThread.cityName}</span>
              </span>
            )}

            <span className="text-slate-400 font-normal">
              {isId ? 'Oleh' : 'By'}{' '}
              <Link
                href={`/${lang}/users/${initialThread.author.username || initialThread.author.id}`}
                className="font-semibold text-slate-700 hover:text-purple-700 transition-colors cursor-pointer"
              >
                {initialThread.author.name || initialThread.author.username || 'Traveler'}
              </Link>
            </span>

            <span className="text-slate-300">•</span>
            <span className="text-slate-400 font-normal">
              {getRelativeTime(initialThread.created_at)}
            </span>

            <div className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-400 font-normal ml-auto">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {initialThread.view_count} {isId ? 'dilihat' : 'views'}
              </span>
            </div>
          </div>

          {/* Thread Title */}
          <h1 className="heading-h1 font-serif text-2xl sm:text-3xl text-slate-900 tracking-tight leading-snug mt-6 mb-4">
            {initialThread.title}
          </h1>

          {/* Thread Content Body */}
          {initialThread.content && /<[a-z][\s\S]*>/i.test(initialThread.content) ? (
            <div
              className="rich-text-body text-slate-800 leading-relaxed mb-6 text-sm sm:text-base"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(initialThread.content) }}
            />
          ) : (
            <div className="text-body text-slate-700 leading-relaxed whitespace-pre-line space-y-4 mb-6 text-sm sm:text-base">
              <p>{initialThread.content || initialThread.title}</p>
            </div>
          )}

          {/* Thread Media Gallery (jika ada gambar yang diunggah) */}
          {initialThread.images && initialThread.images.length > 0 && (
            <div className={`mb-6 grid gap-3 ${
              initialThread.images.length === 1
                ? 'grid-cols-1'
                : initialThread.images.length === 2
                ? 'grid-cols-1 sm:grid-cols-2'
                : 'grid-cols-1 sm:grid-cols-3'
            }`}>
              {initialThread.images.map((imgUrl, imgIdx) => {
                const resolved = resolveForumImageUrl(imgUrl);
                return (
                  <div
                    key={`${imgUrl}-${imgIdx}`}
                    className="relative aspect-video rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs group cursor-pointer"
                    onClick={() => window.open(resolved, '_blank')}
                    title="Klik untuk membuka gambar ukuran penuh"
                  >
                    <Image
                      src={resolved}
                      alt={`Lampiran foto #${imgIdx + 1}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      unoptimized
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* AI UGC Translation Helper */}
          <div className="pt-2 pb-6 border-b border-slate-150">
            <UgcTranslateButton originalText={initialThread.content || initialThread.title} />
          </div>

          {/* Action Bar (Reddit / Threads Style) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {/* Reddit-Style Interactive Vote Pill */}
              <div className="inline-flex items-center rounded-full bg-slate-100/90 p-1 border border-slate-200/60 shadow-xs">
                <button
                  type="button"
                  onClick={() => handleThreadVote('up')}
                  disabled={isVotingThread}
                  title="Upvote"
                  className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                    threadVote === 'up'
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-white hover:text-emerald-600'
                  }`}
                >
                  <ArrowBigUp className="w-5 h-5 fill-current" />
                </button>

                <span
                  className={`px-2.5 text-xs font-bold ${
                    threadVote === 'up'
                      ? 'text-emerald-600'
                      : threadVote === 'down'
                      ? 'text-rose-600'
                      : 'text-slate-700'
                  }`}
                >
                  {threadNetScore}
                </span>

                <button
                  type="button"
                  onClick={() => handleThreadVote('down')}
                  disabled={isVotingThread}
                  title="Downvote"
                  className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                    threadVote === 'down'
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-white hover:text-rose-600'
                  }`}
                >
                  <ArrowBigDown className="w-5 h-5 fill-current" />
                </button>
              </div>

              {/* Counter Komentar */}
              <a
                href="#discussion-replies"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-slate-100/90 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold border border-slate-200/60 transition"
              >
                <MessageCircle className="w-4 h-4 text-violet-600" />
                <span>
                  {comments.length} {isId ? 'Balasan' : 'Replies'}
                </span>
              </a>

              {/* Tombol Reward LTP Coin */}
              <button
                type="button"
                onClick={() => setIsTipModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-amber-50 hover:bg-amber-100/80 text-amber-900 text-xs font-semibold border border-amber-200/70 transition shadow-xs cursor-pointer active:scale-95"
              >
                <span>🪙</span>
                <span>{isId ? 'Apresiasi LTP' : 'Tip LTP Coin'}</span>
              </button>
            </div>

            {/* Tombol Share Sosial & Laporkan */}
            <div className="flex items-center gap-2">
              <ShareButton
                data={{
                  title: initialThread.title,
                  summary: initialThread.content
                    ? initialThread.content.slice(0, 150)
                    : initialThread.title,
                  pathType: 'forums',
                  url: currentUrl,
                }}
                lang={lang}
                label={isId ? 'Share the Vibe ✨' : 'Share the Vibe ✨'}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white text-xs font-semibold shadow-md shadow-violet-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              />

              <ReportContentButton
                targetType="forum_thread"
                targetId={initialThread.id}
                targetTitle={initialThread.title}
                lang={lang}
                variant="pill"
              />
            </div>
          </div>
        </article>

        {/* ======================================================== */}
        {/* SEKSI BALASAN KOMUNITAS (NESTED COMMENTS) */}
        {/* ======================================================== */}
        <section id="discussion-replies" className="space-y-6 pt-2">
          {/* Kartu Insentif Reward Dinamis untuk Balasan Forum (FORUM_REPLY) */}
          <RewardIncentiveCard
            xp={10}
            ltp={2}
            actionTitleId="Bantu Traveler Lain & Balas Diskusi"
            actionTitleEn="Help Fellow Travelers & Reply"
            locale={lang}
          />

          <div className="flex items-center justify-between">
            <h2 className="heading-h2 font-serif text-xl sm:text-2xl text-slate-900 tracking-tight flex items-center gap-2">
              <span>💬</span>
              <span>
                {isId ? 'Diskusi Komunitas' : 'Community Discussion'} ({comments.length})
              </span>
            </h2>
          </div>

          {/* 1. AUTH GUARD PADA FORM BALASAN UTAMA */}
          {!currentUser?.isLoggedIn ? (
            /* Guest CTA Box yang Ramah */
            <div className="rounded-3xl border border-dashed border-purple-200 bg-purple-50/40 p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mx-auto mb-3 text-xl">
                🔒
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-1">
                {lang === 'id'
                  ? 'Masuk untuk Bergabung dalam Diskusi'
                  : 'Sign in to Join the Discussion'}
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-5">
                {lang === 'id'
                  ? 'Bagikan tips lokal, ajukan pertanyaan, dan kumpulkan poin reward LTP dengan aktif berkomentar.'
                  : 'Share local tips, ask questions, and earn LTP reward points by joining the discussion.'}
              </p>
              <button
                type="button"
                onClick={() =>
                  executeProtected(
                    () => {},
                    isId
                      ? 'Masuk untuk membalas diskusi forum dan klaim reward +10 XP!'
                      : 'Sign in to reply and earn +10 XP reward!'
                  )
                }
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-purple-900 hover:bg-purple-950 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>{lang === 'id' ? 'Masuk / Daftar Akun' : 'Sign In / Register'}</span>
              </button>
            </div>
          ) : (
            /* User Form Terautentikasi */
            <form
              onSubmit={handleSubmitMainComment}
              className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-3"
            >
              <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                <UserAvatar
                  src={currentUser.avatar_url}
                  name={currentUser.name}
                  size={32}
                  className="border border-purple-200"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900">{currentUser.name}</span>
                  <span className="text-slate-400 ml-1.5">
                    ({isId ? 'Akun Anda' : 'Your Account'})
                  </span>
                </div>
              </div>

              <div className="relative">
                <textarea
                  rows={3}
                  value={mainCommentText}
                  onChange={(e) => setMainCommentText(e.target.value)}
                  placeholder={
                    isId
                      ? 'Bagikan tips lokal, ajukan pertanyaan, atau berikan tanggapan di sini...'
                      : 'Share local tips, ask questions, or provide recommendations here...'
                  }
                  className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 transition"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>
                    {isId
                      ? 'Berbagi info otentik & raih +10 XP traveler.'
                      : 'Share authentic tips & earn +10 traveler XP.'}
                  </span>
                </span>

                <button
                  type="submit"
                  disabled={isSubmittingMain || !mainCommentText.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 text-white text-xs font-semibold shadow-md shadow-violet-500/20 transition hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {isSubmittingMain
                      ? isId
                        ? 'Mengirim...'
                        : 'Posting...'
                      : isId
                      ? 'Kirim Balasan'
                      : 'Post Reply'}
                  </span>
                </button>
              </div>

              {mainSuccessMsg && (
                <p className="text-xs font-semibold text-emerald-600 pt-1">
                  {mainSuccessMsg}
                </p>
              )}
            </form>
          )}

          {/* 2. DAFTAR KOMENTAR & NESTED THREADED REPLIES */}
          {comments.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200/80 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-700">
                {isId ? 'Belum ada balasan diskusi.' : 'No replies yet.'}
              </p>
              <p className="text-xs text-slate-400">
                {isId
                  ? 'Jadilah penanggap pertama untuk berbagi rekomendasi atau wawasan Anda!'
                  : 'Be the first to share your local insights or recommendations!'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {rootComments.map((comment) => {
                const commentAvatar = getAvatarUrl(comment.author.avatar_url);
                const currentVote = commentVotes[comment.id] || null;
                const replies = getReplies(comment.id);
                const isReplyingThis = activeReplyId === comment.id;

                return (
                  <div
                    key={comment.id}
                    className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/70 shadow-xs space-y-4 transition"
                  >
                    {/* Header Komentar Induk */}
                    <div className="flex items-center justify-between text-xs">
                      <Link
                        href={`/${lang}/users/${comment.author.username || comment.author.id}`}
                        className="flex items-center gap-2.5 group cursor-pointer"
                      >
                        <UserAvatar
                          src={comment.author.avatar_url}
                          name={comment.author.name || 'User'}
                          size={32}
                          className="border border-slate-200 group-hover:border-purple-300 transition-colors"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                              {comment.author.name || comment.author.username || 'Member'}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200/60">
                              LV {comment.author.level}
                            </span>
                            {comment.author.is_verified && (
                              <span
                                title="KYC Verified"
                                className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[8px]"
                              >
                                ✓
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {getRelativeTime(comment.created_at)}
                          </span>
                        </div>
                      </Link>
                    </div>

                    {/* Teks Komentar */}
                    <div className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line pl-10">
                      {comment.content}
                    </div>

                    {/* UGC Translation */}
                    <div className="pl-10">
                      <UgcTranslateButton originalText={comment.content} />
                    </div>

                    {/* Action Bar Komentar: Vote + Tombol Balas */}
                    <div className="flex items-center gap-3 pl-10 text-xs">
                      <div className="inline-flex items-center rounded-full bg-slate-100 p-0.5 border border-slate-200/60">
                        <button
                          type="button"
                          onClick={() => handleCommentVote(comment.id, 'up')}
                          className={`p-1 rounded-full transition ${
                            currentVote === 'up'
                              ? 'bg-emerald-500 text-white'
                              : 'text-slate-500 hover:text-emerald-600'
                          }`}
                          title="Upvote"
                        >
                          <ArrowBigUp className="w-3.5 h-3.5 fill-current" />
                        </button>
                        <span
                          className={`px-1.5 text-[11px] font-bold ${
                            currentVote === 'up'
                              ? 'text-emerald-600'
                              : currentVote === 'down'
                              ? 'text-rose-600'
                              : 'text-slate-600'
                          }`}
                        >
                          {comment.net_score}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCommentVote(comment.id, 'down')}
                          className={`p-1 rounded-full transition ${
                            currentVote === 'down'
                              ? 'bg-rose-500 text-white'
                              : 'text-slate-500 hover:text-rose-600'
                          }`}
                          title="Downvote"
                        >
                          <ArrowBigDown className="w-3.5 h-3.5 fill-current" />
                        </button>
                      </div>

                      {/* Tombol Aksi Balas [ ↩️ Balas / Reply ] */}
                      <button
                        type="button"
                        onClick={() => handleReplyButtonClick(comment.id)}
                        className={`inline-flex items-center gap-1 font-semibold transition px-2.5 py-1 rounded-full cursor-pointer ${
                          isReplyingThis
                            ? 'bg-violet-100 text-violet-800'
                            : 'text-slate-500 hover:text-violet-600 hover:bg-slate-50'
                        }`}
                      >
                        <CornerDownRight className="w-3.5 h-3.5" />
                        <span>{isId ? '↩️ Balas' : '↩️ Reply'}</span>
                      </button>

                      {/* Tombol Laporkan Komentar */}
                      <ReportContentButton
                        targetType="forum_post"
                        targetId={comment.id}
                        targetTitle={comment.content.slice(0, 40)}
                        lang={lang}
                        variant="subtle"
                        className="text-[11px]"
                      />
                    </div>

                    {/* SUB-FORM BALASAN INLINE TEPAT DI BAWAH KOMENTAR */}
                    {isReplyingThis && (
                      <div className="ml-6 sm:ml-10 p-4 rounded-2xl bg-slate-50 border border-violet-200/80 space-y-3 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-violet-800 flex items-center gap-1.5">
                            <CornerDownRight className="w-3.5 h-3.5" />
                            <span>
                              {isId ? 'Membalas' : 'Replying to'} @
                              {comment.author.name || comment.author.username}
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setActiveReplyId(null)}
                            className="text-slate-400 hover:text-rose-600 font-bold cursor-pointer"
                          >
                            ✕ {isId ? 'Batal' : 'Cancel'}
                          </button>
                        </div>

                        <textarea
                          rows={2}
                          value={inlineReplyText}
                          onChange={(e) => setInlineReplyText(e.target.value)}
                          placeholder={
                            isId
                              ? `Tulis balasan untuk @${comment.author.name || 'member'}...`
                              : `Write a reply to @${comment.author.name || 'member'}...`
                          }
                          className="w-full p-3 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 transition"
                          autoFocus
                          required
                        />

                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveReplyId(null)}
                            className="px-3 py-1.5 rounded-full text-xs font-semibold text-slate-500 hover:bg-slate-200/60 transition cursor-pointer"
                          >
                            {isId ? 'Batal' : 'Cancel'}
                          </button>
                          <button
                            type="button"
                            disabled={isSubmittingInline || !inlineReplyText.trim()}
                            onClick={() => handleSubmitInlineReply(comment.id)}
                            className="px-4 py-1.5 rounded-full bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 text-white text-xs font-semibold transition cursor-pointer"
                          >
                            {isSubmittingInline
                              ? isId
                                ? 'Mengirim...'
                                : 'Posting...'
                              : isId
                              ? 'Kirim Balasan'
                              : 'Post Reply'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* NESTED THREADED REPLIES (Indentasi visual ke kanan & garis bantu vertikal) */}
                    {replies.length > 0 && (
                      <div className="ml-6 sm:ml-10 pl-3 sm:pl-4 border-l-2 border-slate-150 space-y-3 pt-2">
                        {replies.map((reply) => {
                          const replyAvatar = getAvatarUrl(reply.author.avatar_url);
                          const replyVote = commentVotes[reply.id] || null;

                          return (
                            <div
                              key={reply.id}
                              className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/60 space-y-2 relative"
                            >
                              <div className="flex items-center justify-between text-xs">
                                <Link
                                  href={`/${lang}/users/${reply.author.username || reply.author.id}`}
                                  className="flex items-center gap-2 group cursor-pointer"
                                >
                                  <UserAvatar
                                    src={reply.author.avatar_url}
                                    name={reply.author.name || 'User'}
                                    size={24}
                                    className="border border-slate-200 group-hover:border-purple-300"
                                  />
                                  <span className="font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                                    {reply.author.name || reply.author.username || 'Member'}
                                  </span>
                                  <span className="px-1 py-0.2 rounded bg-amber-50 text-amber-800 text-[9px] font-bold">
                                    LV {reply.author.level}
                                  </span>
                                  {reply.author.is_verified && (
                                    <span className="w-3 h-3 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[7px]">
                                      ✓
                                    </span>
                                  )}
                                </Link>
                                <span className="text-[10px] text-slate-400">
                                  {getRelativeTime(reply.created_at)}
                                </span>
                              </div>

                              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line pl-8">
                                {reply.content}
                              </p>

                              <div className="pl-8 flex items-center gap-3 pt-1">
                                <div className="inline-flex items-center rounded-full bg-white p-0.5 border border-slate-200">
                                  <button
                                    type="button"
                                    onClick={() => handleCommentVote(reply.id, 'up')}
                                    className={`p-0.5 rounded-full ${
                                      replyVote === 'up'
                                        ? 'bg-emerald-500 text-white'
                                        : 'text-slate-400 hover:text-emerald-600'
                                    }`}
                                  >
                                    <ArrowBigUp className="w-3 h-3 fill-current" />
                                  </button>
                                  <span className="px-1 text-[10px] font-bold text-slate-600">
                                    {reply.net_score}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCommentVote(reply.id, 'down')}
                                    className={`p-0.5 rounded-full ${
                                      replyVote === 'down'
                                        ? 'bg-rose-500 text-white'
                                        : 'text-slate-400 hover:text-rose-600'
                                    }`}
                                  >
                                    <ArrowBigDown className="w-3 h-3 fill-current" />
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleReplyButtonClick(comment.id)}
                                  className="text-[11px] font-medium text-slate-400 hover:text-violet-600 transition cursor-pointer"
                                >
                                  {isId ? 'Balas' : 'Reply'}
                                </button>

                                <ReportContentButton
                                  targetType="forum_post"
                                  targetId={reply.id}
                                  targetTitle={reply.content.slice(0, 40)}
                                  lang={lang}
                                  variant="minimal"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* ======================================================== */}
      {/* KOLOM KANAN (lg:col-span-4): SIDEBAR KOMUNITAS & RELATED */}
      {/* ======================================================== */}
      <aside className="lg:col-span-4 space-y-6">
        {/* 1. Kartu Profil Pembuat Thread (Posisi Paling Atas) */}
        <UserSidebarCard
          user={{
            id: initialThread.author.id,
            name: initialThread.author.name,
            username: initialThread.author.username,
            avatar_url: initialThread.author.avatar_url,
            role: initialThread.author.role,
            is_verified: initialThread.author.is_verified,
            level: initialThread.author.level,
            total_xp: initialThread.author.total_xp,
            bio: initialThread.author.bio,
            host_kyc_host_kyc_user_idTousers: initialThread.author.host_kyc_host_kyc_user_idTousers,
          }}
          lang={lang}
          initialIsFollowing={initialIsFollowingAuthor}
          currentUserId={currentUser?.id}
        />

        {/* 2. Kartu Aturan & Etika Komunitas */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base font-serif">
            <BookOpen className="w-5 h-5 text-violet-600" />
            <span>{isId ? 'Aturan & Etika Forum' : 'Community Guidelines'}</span>
          </div>

          <ul className="space-y-3 text-xs text-slate-600 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">✓</span>
              <span>
                {isId
                  ? 'Bagikan rekomendasi otentik berdasarkan pengalaman nyata Anda di destinasi.'
                  : 'Share authentic recommendations based on your real travel experience.'}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">✓</span>
              <span>
                {isId
                  ? 'Gunakan bahasa yang ramah, sopan, dan apresiatif sesama traveler serta local host.'
                  : 'Maintain a welcoming, respectful tone with fellow travelers and local hosts.'}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-500 font-bold">✕</span>
              <span>
                {isId
                  ? 'Dilarang keras menyebarkan spam, tautan promosi tak berizin, maupun ujaran kebencian.'
                  : 'No spam, unverified affiliate links, hate speech, or harassment.'}
              </span>
            </li>
          </ul>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>🛡️ Locallytrip Safety First</span>
            <span>Versi Komunitas 2.0</span>
          </div>
        </div>

        {/* 2. Apresiasi Komunitas Locallytrip (LTP & XP) */}
        <div className="bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-950 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden space-y-4">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-violet-500/20 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center gap-2">
            <span className="text-2xl">🪙</span>
            <div>
              <h3 className="font-bold text-sm tracking-wide text-amber-300">
                {isId ? 'Apresiasi LTP & Tingkatan XP' : 'LTP Rewards & XP Levels'}
              </h3>
              <p className="text-[11px] text-violet-200">
                {isId ? 'Ekosistem Komunitas Aktif' : 'Active Traveler Ecosystem'}
              </p>
            </div>
          </div>

          <p className="text-xs text-violet-100 leading-relaxed">
            {isId
              ? 'Dapatkan 10 XP untuk setiap balasan berkualitas dan raih bonus LTP Coin yang dapat digunakan untuk diskon booking tur lokal atau tip sesama explorer!'
              : 'Earn 10 XP for every high-value reply and collect LTP Coins for discounts on local tour packages or tipping inspiring travelers!'}
          </p>

          <div className="grid grid-cols-2 gap-2.5 pt-1 text-center">
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10">
              <span className="block text-lg font-bold text-amber-300">⚡ +10 XP</span>
              <span className="text-[10px] text-violet-200">
                {isId ? 'Per Balasan Diskusi' : 'Per Discussion Reply'}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10">
              <span className="block text-lg font-bold text-amber-300">🪙 Tip LTP</span>
              <span className="text-[10px] text-violet-200">
                {isId ? 'Dukungan Komunitas' : 'Community Support'}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Sticky Section: Diskusi Populer, Meetup Terdekat & Aktivitas Rekomendasi */}
        <div className="sticky top-24 space-y-6">
          {relatedThreads.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base font-serif">
                <Flame className="w-5 h-5 text-amber-500" />
                <span>
                  {isId ? 'Diskusi Populer Terkait' : 'Related Discussions'}
                </span>
              </div>

              <div className="space-y-3">
                {relatedThreads.map((item) => (
                  <Link
                    key={item.id}
                    href={`/${lang}/community/forums/${item.slug || item.id}`}
                    className="block p-3.5 rounded-2xl bg-slate-50/70 hover:bg-violet-50/80 border border-slate-100 hover:border-violet-200 transition group"
                  >
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-violet-700 line-clamp-2 leading-snug">
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3 text-slate-400" />
                        <span>{item.reply_count}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3 text-slate-400" />
                        <span>{item.view_count}</span>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {upcomingMeetups.length > 0 && (
            <SidebarUpcomingMeetups meetups={upcomingMeetups} lang={lang} />
          )}

          {featuredExperiences.length > 0 && (
            <SidebarRelatedExperiences experiences={featuredExperiences} lang={lang} />
          )}
        </div>
      </aside>

      {/* ======================================================== */}
      {/* MODAL APRESIASI LTP COIN */}
      {/* ======================================================== */}
      {isTipModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-5 shadow-2xl relative border border-slate-100">
            <button
              type="button"
              onClick={() => setIsTipModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <span className="text-4xl inline-block mb-1">🪙</span>
              <h3 className="text-lg font-bold font-serif text-slate-900">
                {isId ? 'Kirim Apresiasi LTP' : 'Tip LTP Coin'}
              </h3>
              <p className="text-xs text-slate-500">
                {isId
                  ? `Berikan dukungan koin kepada ${initialThread.author.name || 'penulis'} atas thread yang bermanfaat ini.`
                  : `Support ${initialThread.author.name || 'the author'} for this helpful thread.`}
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                {isId ? 'Pilih Jumlah Koin LTP:' : 'Select LTP Amount:'}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[2, 5, 10, 25].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTipAmount(amt)}
                    className={`py-2 rounded-xl text-xs font-bold transition border ${
                      tipAmount === amt
                        ? 'bg-amber-400 text-slate-900 border-amber-500 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    🪙 {amt}
                  </button>
                ))}
              </div>
            </div>

            {tipSuccessMsg ? (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold text-center border border-emerald-200">
                {tipSuccessMsg}
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSendTip}
                disabled={isSubmittingTip}
                className="w-full py-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition hover:scale-[1.02] active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingTip
                  ? isId
                    ? 'Memproses...'
                    : 'Sending...'
                  : isId
                  ? `Kirim Apresiasi ${tipAmount} LTP Sekarang`
                  : `Send ${tipAmount} LTP Tip Now`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Contextual Auth Guard Modal */}
      <ContextualAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        promptMessage={authMessage}
        locale={lang}
      />
    </div>
  );
}
