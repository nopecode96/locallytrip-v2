'use client';

import React, { useState } from 'react';
import { Smartphone, Bell, CheckCircle2, Sparkles, MapPin, MessageSquare, ArrowRight } from 'lucide-react';
import { Locale } from '@/lib/i18n';

interface MobileAppPreviewProps {
  locale: Locale;
}

export function MobileAppPreview({ locale }: MobileAppPreviewProps) {
  const isId = locale === 'id';
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setIsSubmitted(true);
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14 sm:mt-16">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-950 via-slate-900 to-purple-950 text-white p-8 sm:p-12 lg:p-14 border border-violet-800/40 shadow-2xl">
        {/* Soft Background Accents */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-fuchsia-600/15 blur-3xl pointer-events-none" />

        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Kolom Kiri: Copywriting & Waitlist Form */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/20 border border-violet-400/30 text-violet-300 text-xs font-bold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-violet-300" />
              <span>{isId ? 'Dalam Pengembangan Aktif' : 'Active Development'}</span>
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl sm:text-4xl font-black font-serif tracking-tight text-white leading-tight">
                Mobile App — Coming Soon to iOS & Android (Join Waitlist)
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
                {isId
                  ? 'Aplikasi seluler Locallytrip segera hadir di App Store dan Google Play. Akses radar temu komunitas, peta hidden gems offline, dan koordinasi chat langsung dengan pemandu lokal dalam genggaman Anda.'
                  : 'The Locallytrip mobile application is coming soon to the App Store and Google Play. Get real-time community radar, offline hidden-gem trails, and instant host chats right at your fingertips.'}
              </p>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-violet-300" />
                </div>
                <span className="text-xs font-semibold text-slate-200">
                  {isId ? 'Radar Temu Komunitas Real-Time' : 'Real-Time Meetup Radar'}
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4 text-purple-300" />
                </div>
                <span className="text-xs font-semibold text-slate-200">
                  {isId ? 'Chat Pemandu & QR Check-in' : 'Host Chat & Offline QR Check-in'}
                </span>
              </div>
            </div>

            {/* Waitlist Subscription Box */}
            <div className="pt-2">
              {isSubmitted ? (
                <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 text-xs sm:text-sm flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>
                    {isId
                      ? 'Terima kasih! Anda telah terdaftar dalam antrean prioritas rilis beta mobile app.'
                      : 'Thank you! You are now on the priority waitlist for early mobile app access.'}
                  </span>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch gap-2.5 max-w-md">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder={isId ? 'Masukkan email Anda...' : 'Enter your email...'}
                    className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 transition"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 active:scale-95 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 shadow-md shadow-violet-600/30 shrink-0"
                  >
                    <span>{isId ? 'Gabung Waitlist' : 'Join Waitlist'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>

            {/* Platform Badges */}
            <div className="flex items-center gap-4 pt-1 text-slate-400 text-xs">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>iOS TestFlight & Android APK Ready Soon</span>
              </span>
            </div>
          </div>

          {/* Kolom Kanan: Mockup Mobile Phone Estetik */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-64 sm:w-72 rounded-[2.5rem] p-3 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 border-4 border-slate-700 shadow-2xl shadow-purple-950/50">
              {/* Speaker / Dynamic Island Notch */}
              <div className="w-24 h-4 bg-slate-950 rounded-full mx-auto mb-3" />

              {/* Screen Mockup */}
              <div className="rounded-[2rem] bg-slate-950 p-4 space-y-3.5 text-xs overflow-hidden border border-slate-800">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-black text-violet-400 tracking-wider">LOCALLYTRIP</span>
                  <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[10px] font-bold">
                    v2.0 Beta
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-violet-900/30 border border-violet-500/30 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-violet-300 text-[11px] font-bold">
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Meetup Terdekat Hari Ini</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-snug">
                    Ubud Morning Trail • 12 traveler bergabung
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="h-2 rounded bg-slate-800 w-3/4" />
                  <div className="h-2 rounded bg-slate-800 w-1/2" />
                  <div className="h-2 rounded bg-slate-800 w-2/3" />
                </div>

                <div className="pt-2 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-900">
                  <span>🟢 Offline Mode: Aktif</span>
                  <span>GPS: Akurat</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default MobileAppPreview;
