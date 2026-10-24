'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { RewardIncentiveCard } from '@/components/rewards/RewardIncentiveCard';
import {
  Sparkles,
  DollarSign,
  Clock,
  Compass,
  ArrowRight,
  ShieldCheck,
  Award,
  CheckCircle2,
  Users,
  MapPin,
  TrendingUp,
  Sliders,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';

interface BecomeHostLandingProps {
  locale: string;
  onStartWizard: () => void;
}

export function BecomeHostLanding({ locale, onStartWizard }: BecomeHostLandingProps) {
  const isId = locale === 'id';

  // Earnings Calculator State: Model Sewa Pemandu / Paket Tur (Grup Privat)
  const [packagePrice, setPackagePrice] = useState<number>(50); // Default $50 / paket
  const [monthlyTours, setMonthlyTours] = useState<number>(8); // Default 8 sesi tur / bulan

  // Gross Earnings Calculation (kurs acuan: 1 USD ≈ 16.000 IDR)
  const grossUsd = packagePrice * monthlyTours;
  const grossIdr = grossUsd * 16000;

  const formattedIdr = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(grossIdr);

  const formattedUsd = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(grossUsd);

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-orange-50/30 to-amber-50/40 border border-orange-200/60 p-6 sm:p-10 lg:p-12 shadow-sm">
        {/* Decorative background blob */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-gradient-to-br from-brand-300/20 to-amber-300/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-gradient-to-tr from-purple-300/15 to-indigo-300/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-5">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs sm:text-sm font-bold tracking-tight shadow-2xs">
            <Sparkles className="w-4 h-4 text-brand-600" />
            <span>{isId ? 'Peluang Karir & Komunitas Host' : 'Host Community & Earnings'}</span>
          </div>

          {/* Tagline & Headline */}
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            {isId ? (
              <>
                Ubah Kecintaanmu pada Kotamu Menjadi <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-amber-600">Penghasilan</span>
              </>
            ) : (
              <>
                Turn Your Passion for Your City into <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-amber-600">Income</span>
              </>
            )}
          </h1>

          {/* Sub-judul */}
          <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-2xl">
            {isId
              ? 'Bagikan hidden gems, sejarah, dan kuliner otentik kotamu kepada traveler dari seluruh dunia. Tentukan jadwal dan tarifmu sendiri.'
              : 'Share hidden gems, culture, and authentic local food with travelers from all over the world. Set your own schedule and prices.'}
          </p>

          {/* Kartu Insentif: +100 XP */}
          <div className="pt-1 max-w-xl">
            <RewardIncentiveCard
              xp={100}
              ltp={0}
              locale={locale}
              actionTitleId="Bonus Sambutan Host: +100 XP Reputasi"
              actionTitleEn="Host Welcome Bonus: +100 XP Reputation"
              className="bg-white/80 backdrop-blur-xs"
            />
          </div>

          {/* CTA Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="button"
              onClick={onStartWizard}
              className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-brand-500/30 hover:shadow-brand-500/40 hover:-translate-y-0.5 transition-all cursor-pointer min-h-[48px]"
            >
              <Compass className="w-5 h-5" />
              <span>{isId ? 'Daftar Jadi Host Sekarang' : 'Apply to Become a Host Now'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-xs text-slate-500 text-center sm:text-left sm:max-w-xs leading-relaxed">
              {isId
                ? 'Gratis pendaftaran. Tanpa biaya bulanan atau komitmen terikat.'
                : 'Free registration. No monthly subscription or rigid lock-in.'}
            </p>
          </div>
        </div>
      </section>

      {/* 2. 3 Kartu Keuntungan Utama */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {isId ? 'Kenapa Memilih Menjadi Host di Locallytrip?' : 'Why Become a Locallytrip Host?'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            {isId
              ? 'Kami memberdayakan pemandu lokal dengan ekosistem yang adil, transparan, dan saling mendukung.'
              : 'Empowering local guides with a fair, transparent, and rewarding ecosystem.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {/* Card 1: Penghasilan Fleksibel */}
          <div className="group rounded-3xl bg-white p-6 sm:p-7 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-brand-200 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                <DollarSign className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  {isId ? '💵 Penghasilan Fleksibel & Transparan' : '💵 Flexible & Transparent Earnings'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {isId
                    ? 'Tetapkan harga tur sendiri. Pembayaran aman dan langsung cair ke rekening Anda.'
                    : 'Set your own tour prices. Secure payments deposited directly to your bank account.'}
                </p>
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center text-xs font-semibold text-brand-600">
              <span>{isId ? 'Bebas tentukan komisi & kuota' : 'Full price control'}</span>
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          {/* Card 2: Bebas Atur Waktu */}
          <div className="group rounded-3xl bg-white p-6 sm:p-7 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-brand-200 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 border border-brand-200/60 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  {isId ? '🕒 Bebas Atur Waktu & Kuota' : '🕒 Full Schedule & Group Freedom'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {isId
                    ? 'Pemandu penuh waktu atau sambilan di akhir pekan? Anda yang memegang kendali kalender kegiatan.'
                    : 'Full-time guide or weekend side-hustle? You control your calendar availability.'}
                </p>
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center text-xs font-semibold text-brand-600">
              <span>{isId ? 'Sinkronisasi kalender real-time' : 'Real-time sync'}</span>
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          {/* Card 3: Dukungan Komunitas & Gamifikasi */}
          <div className="group rounded-3xl bg-white p-6 sm:p-7 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-brand-200 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200/60 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                <Compass className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  {isId ? '🧭 Dukungan Komunitas & Gamifikasi' : '🧭 Community Support & Gamification'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {isId
                    ? 'Dapatkan bonus +100 XP, lencana reputasi terpercaya, dan panduan kurasi produk dari tim Locallytrip.'
                    : 'Earn a +100 XP bonus, verified reputation badges, and curation guidance from the Locallytrip team.'}
                </p>
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center text-xs font-semibold text-purple-600">
              <span>{isId ? 'Dapatkan lencana verified' : 'Earn verified badge'}</span>
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Cara Kerja (3 Langkah Mudah) */}
      <section className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-10 shadow-xs space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
            {isId ? 'Alur Mudah & Transparan' : 'Easy & Transparent Flow'}
          </span>
          <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {isId ? 'Cara Kerja Menjadi Host' : 'How Becoming a Host Works'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            {isId
              ? 'Hanya butuh beberapa menit untuk mendaftar dan mulai menerima pesanan wisatawan.'
              : 'Takes only a few minutes to apply and start welcoming tourists.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 relative">
          {/* Step 1 */}
          <div className="relative space-y-3 p-5 rounded-2xl bg-slate-50/70 border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-brand-600 text-white font-extrabold flex items-center justify-center text-sm shadow-sm shadow-brand-500/20">
              1
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {isId ? 'Lengkapi Profil & Identitas' : 'Complete Profile & Identity'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {isId
                ? 'Lengkapi profil keahlian, bahasa yang dikuasai, dan identitas dasar untuk verifikasi keamanan.'
                : 'Provide your expertise, languages spoken, and basic identity verification for traveler safety.'}
            </p>
          </div>

          {/* Step 2 */}
          <div className="relative space-y-3 p-5 rounded-2xl bg-slate-50/70 border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-brand-600 text-white font-extrabold flex items-center justify-center text-sm shadow-sm shadow-brand-500/20">
              2
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {isId ? 'Rancang Rute & Publikasikan Tur' : 'Design Route & Publish Tour'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {isId
                ? 'Rancang rute dan publikasikan tur lokal pertamamu dibantu AI Host Builder yang cerdas.'
                : 'Design your itinerary and publish your first local tour powered by our smart AI Host Builder.'}
            </p>
          </div>

          {/* Step 3 */}
          <div className="relative space-y-3 p-5 rounded-2xl bg-slate-50/70 border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-brand-600 text-white font-extrabold flex items-center justify-center text-sm shadow-sm shadow-brand-500/20">
              3
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {isId ? 'Sambut Tamu & Bangun Reputasi' : 'Welcome Guests & Grow Reputation'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {isId
                ? 'Sambut wisatawan, terima pembayaran aman, dan kembangkan reputasi bintang 5 Anda.'
                : 'Welcome tourists, receive secure payouts, and build your 5-star local guide reputation.'}
            </p>
          </div>
        </div>
      </section>

      {/* 4. Kalkulator Simulasi Pendapatan Sederhana */}
      <section className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white p-6 sm:p-10 lg:p-12 shadow-xl shadow-slate-900/10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Sliders */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-brand-300 text-xs font-bold">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{isId ? 'Simulasi Estimasi' : 'Earnings Simulator'}</span>
              </div>
              <h2 className="text-xl sm:text-3xl font-black tracking-tight">
                {isId ? 'Berapa Potensi Penghasilan Anda?' : 'How Much Could You Earn?'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {isId
                  ? 'Sesuaikan tarif per paket tur dan perkiraan jumlah jadwal tur yang Anda pandu setiap bulan untuk melihat estimasi pendapatan kotor.'
                  : 'Adjust your price per tour package and estimated monthly tour sessions to see your potential gross earnings.'}
              </p>
            </div>

            {/* Slider 1: Tarif per paket tur */}
            <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-slate-300 font-medium">
                  {isId ? 'Tarif per paket tur (USD)' : 'Price per tour package (USD)'}
                </span>
                <span className="text-base sm:text-lg font-extrabold text-amber-400">
                  ${packagePrice} <span className="text-xs font-normal text-slate-400">/ paket</span>
                </span>
              </div>
              <input
                type="range"
                min={25}
                max={250}
                step={5}
                value={packagePrice}
                onChange={(e) => setPackagePrice(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>$25</span>
                <span>$125</span>
                <span>$250</span>
              </div>
            </div>

            {/* Slider 2: Jumlah paket tur terlaksana per bulan */}
            <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-slate-300 font-medium">
                  {isId ? 'Jumlah paket tur terlaksana per bulan' : 'Tours hosted per month'}
                </span>
                <span className="text-base sm:text-lg font-extrabold text-brand-400">
                  {monthlyTours} <span className="text-xs font-normal text-slate-400">tur</span>
                </span>
              </div>
              <input
                type="range"
                min={2}
                max={30}
                step={1}
                value={monthlyTours}
                onChange={(e) => setMonthlyTours(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>2 tur</span>
                <span>15 tur</span>
                <span>30 tur</span>
              </div>
            </div>
          </div>

          {/* Right Column: Earnings Summary Display */}
          <div className="lg:col-span-5 bg-white/10 border border-white/15 rounded-3xl p-6 sm:p-8 backdrop-blur-md flex flex-col justify-between text-center space-y-6">
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-wider text-slate-300 font-bold">
                {isId ? 'Estimasi Pendapatan Kotor / Bulan' : 'Estimated Gross Monthly Income'}
              </span>
              <div className="space-y-1">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-amber-400 tracking-tight">
                  {formattedIdr}
                </div>
                <div className="text-sm font-semibold text-slate-300">
                  ≈ {formattedUsd} / bulan
                </div>
              </div>
              <p className="text-[11px] text-slate-400 pt-2 leading-relaxed">
                {isId
                  ? `*Estimasi berdasarkan asumsi ${monthlyTours} paket tur dengan tarif $${packagePrice}/paket. Setiap paket berlaku untuk satu rombongan tamu.`
                  : `*Estimate based on ${monthlyTours} tour packages hosted at $${packagePrice}/package. Each package covers one private group session.`}
              </p>
            </div>

            <button
              type="button"
              onClick={onStartWizard}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 hover:to-amber-600 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-brand-500/30 transition cursor-pointer min-h-[48px]"
            >
              <span>{isId ? 'Mulai Hasilkan Pendapatan' : 'Start Earning Today'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 5. Bottom Callout */}
      <section className="text-center space-y-4 py-4">
        <h3 className="text-lg sm:text-xl font-bold text-slate-900">
          {isId ? 'Siap bergabung dengan komunitas pemandu lokal Locallytrip?' : 'Ready to join Locallytrip local host community?'}
        </h3>
        <div>
          <button
            type="button"
            onClick={onStartWizard}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition cursor-pointer min-h-[44px]"
          >
            <span>{isId ? 'Daftar Jadi Host Sekarang (+100 XP)' : 'Apply to Become Host (+100 XP)'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
}
