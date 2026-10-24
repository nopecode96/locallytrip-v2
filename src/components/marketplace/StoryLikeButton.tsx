'use client';

import React, { useState, useTransition } from 'react';
import { Heart, Sparkles, X, Lock, Check } from 'lucide-react';
import { toggleStoryLike } from '@/actions/stories';
import { loginQuickUser } from '@/actions/bookings';

interface StoryLikeButtonProps {
  storyId: number;
  initialLikes: number;
  initialIsLiked?: boolean;
  lang?: string;
}

export function StoryLikeButton({
  storyId,
  initialLikes,
  initialIsLiked = false,
  lang = 'id',
}: StoryLikeButtonProps) {
  const isEn = lang === 'en';
  const [likesCount, setLikesCount] = useState<number>(initialLikes);
  const [isLiked, setIsLiked] = useState<boolean>(initialIsLiked);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [rewardToast, setRewardToast] = useState<{ ltp: number; xp: number } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  const handleLikeClick = () => {
    // Optimistic toggle
    const prevLiked = isLiked;
    const prevCount = likesCount;
    const nextLiked = !prevLiked;
    const nextCount = nextLiked ? prevCount + 1 : Math.max(0, prevCount - 1);

    setIsLiked(nextLiked);
    setLikesCount(nextCount);

    startTransition(async () => {
      const res = await toggleStoryLike(storyId);

      if (res.requireAuth) {
        // Rollback optimistic update
        setIsLiked(prevLiked);
        setLikesCount(prevCount);
        setShowAuthModal(true);
        return;
      }

      if (res.success) {
        setIsLiked(res.isLiked);
        setLikesCount(res.totalLikes);

        if (res.rewardEarned) {
          setRewardToast(res.rewardEarned);
          setTimeout(() => {
            setRewardToast(null);
          }, 3500);
        }
      } else {
        // Rollback on unexpected failure
        setIsLiked(prevLiked);
        setLikesCount(prevCount);
      }
    });
  };

  const handleQuickLogin = async () => {
    try {
      setIsLoggingIn(true);
      const res = await loginQuickUser(209);
      if (res.success) {
        setShowAuthModal(false);
        // Automatically perform the like after successful login
        const likeRes = await toggleStoryLike(storyId);
        if (likeRes.success) {
          setIsLiked(likeRes.isLiked);
          setLikesCount(likeRes.totalLikes);
          if (likeRes.rewardEarned) {
            setRewardToast(likeRes.rewardEarned);
            setTimeout(() => setRewardToast(null), 3500);
          }
        }
      }
    } catch (err) {
      console.error('Quick login failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <>
      <div className="relative inline-flex items-center">
        {/* Tombol Interaktif Berbentuk Pil */}
        <button
          type="button"
          onClick={handleLikeClick}
          disabled={isPending}
          aria-label={isLiked ? (isEn ? 'Unlike Story' : 'Batal suka cerita') : (isEn ? 'Like Story' : 'Sukai cerita')}
          className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer border ${
            isLiked
              ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-2xs hover:bg-rose-100 hover:border-rose-300'
              : 'bg-white hover:bg-rose-50/80 border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-600 shadow-2xs'
          }`}
        >
          <Heart
            className={`w-4 h-4 transition-transform duration-200 group-hover:scale-115 ${
              isLiked ? 'fill-rose-500 text-rose-500' : 'text-slate-400 group-hover:text-rose-500'
            }`}
          />
          <span className="font-bold">{likesCount}</span>
          <span className="text-[11px] font-medium hidden sm:inline">
            {isEn ? (likesCount === 1 ? 'like' : 'likes') : 'suka'}
          </span>
        </button>

        {/* Floating Toast Animasi Reward (+1 LTP, +2 XP) */}
        {rewardToast && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[11px] font-extrabold shadow-lg shadow-emerald-600/30 whitespace-nowrap">
              <Sparkles className="w-3 h-3 fill-amber-300 text-amber-300" />
              <span>+{rewardToast.ltp} LTP</span>
              <span className="text-emerald-200">•</span>
              <span>+{rewardToast.xp} XP</span>
            </div>
          </div>
        )}
      </div>

      {/* Modal Autentikasi Tamu */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm sm:max-w-md w-full shadow-2xl border border-slate-100 relative">
            <button
              type="button"
              onClick={() => setShowAuthModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <Heart className="w-6 h-6 fill-rose-500 text-rose-500" />
              </div>

              <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                {isEn ? 'Join to Like & Collect Rewards!' : 'Masuk untuk Menyukai Cerita'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xs mx-auto">
                {isEn
                  ? 'Sign in to like this story and collect your instant +1 LTP reward token & +2 XP traveler points!'
                  : 'Masuk untuk menyukai cerita ini dan kumpulkan poin reward +1 LTP & +2 XP traveler!'}
              </p>
            </div>

            <div className="mt-6 space-y-3">
              {/* Opsi Masuk Cepat / Instant Test User Joyslana */}
              <button
                type="button"
                disabled={isLoggingIn}
                onClick={handleQuickLogin}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-violet-600/25 cursor-pointer disabled:opacity-75"
              >
                <Sparkles className="w-4 h-4 fill-amber-300 text-amber-300" />
                <span>
                  {isLoggingIn
                    ? isEn
                      ? 'Signing In...'
                      : 'Menghubungkan...'
                    : isEn
                    ? 'Instant Sign In (Demo User: Joyslana)'
                    : 'Masuk Cepat (Demo User: Joyslana)'}
                </span>
              </button>

              {/* Opsi Lanjut ke Halaman Login Standar */}
              <a
                href={`/${lang}/login`}
                className="w-full py-3.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition shadow-xs cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>{isEn ? 'Sign In with Email / Google' : 'Masuk dengan Email / Google'}</span>
              </a>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 space-y-2 text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  {isEn
                    ? 'Earn LTP tokens redeemable for tour discounts'
                    : 'Dapatkan token LTP yang dapat ditukar potongan harga tur'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  {isEn
                    ? 'Level up your profile on the community leaderboard'
                    : 'Tingkatkan level profil Anda di papan peringkat komunitas'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
