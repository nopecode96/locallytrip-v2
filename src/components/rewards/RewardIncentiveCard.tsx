'use client';

import React from 'react';
import { Sparkles, Zap, Coins } from 'lucide-react';

interface RewardIncentiveCardProps {
  xp: number;
  ltp: number;
  actionTitleId: string;
  actionTitleEn: string;
  locale: string;
  className?: string;
  variant?: 'banner' | 'card' | 'inline';
}

export function RewardIncentiveCard({
  xp,
  ltp,
  actionTitleId,
  actionTitleEn,
  locale,
  className = '',
  variant,
}: RewardIncentiveCardProps) {
  if (xp <= 0 && ltp <= 0) return null;

  const isId = locale === 'id';
  const title = isId ? actionTitleId : actionTitleEn;
  const description = isId
    ? 'Kontribusi Anda dihargai dengan reputasi komunitas dan saldo koin yang dapat dicairkan.'
    : 'Your contribution is rewarded with community reputation and cashable token balance.';

  // Format vertical layout (sesuai spesifikasi sidebar widget / variant 'card')
  if (variant === 'card') {
    return (
      <div className={`bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4 ${className}`}>
        {/* Baris 1: Ikon + Judul */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-600 flex items-center justify-center text-white shrink-0 shadow-sm shadow-purple-200">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <h3 className="font-bold text-slate-900 text-base leading-snug">
            {title}
          </h3>
        </div>

        {/* Baris 2: Deskripsi Lengkap Mengalir Penuh */}
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          {description}
        </p>

        {/* Baris 3: Badge Reward (Bersisian di Baris Tersendiri) */}
        <div className="flex items-center gap-2 pt-1">
          {xp > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 text-xs font-semibold border border-purple-100">
              <Zap className="w-3.5 h-3.5 fill-purple-600 text-purple-600" />
              +{xp} XP
            </span>
          )}
          {ltp > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200/60">
              <Coins className="w-3.5 h-3.5 text-amber-600" />
              +{ltp} LTP
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${className}`}
    >
      <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
        <div className="w-11 h-11 rounded-xl bg-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm shadow-purple-200">
          <Sparkles className="w-5 h-5 text-amber-300 fill-amber-300" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
            {title}
          </h4>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 self-start sm:self-auto pl-14 sm:pl-0">
        {xp > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-50 text-purple-700 border border-purple-100 shadow-sm">
            <Zap className="w-3.5 h-3.5 text-purple-600 fill-purple-600" /> +{xp} XP
          </span>
        )}
        {ltp > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-sm">
            <Coins className="w-3.5 h-3.5 text-amber-600" /> +{ltp} LTP
          </span>
        )}
      </div>
    </div>
  );
}
