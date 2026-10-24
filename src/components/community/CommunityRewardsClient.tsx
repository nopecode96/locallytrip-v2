'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sparkles,
  Coins,
  ArrowRight,
  TrendingUp,
  Award,
  Wallet,
  CheckCircle2,
  ChevronRight,
  Gift,
  HelpCircle,
  Clock,
  ShieldCheck,
  CreditCard,
  Building,
  ArrowUpRight,
  Zap,
  Package,
  Ticket,
  Crown,
  Smartphone,
  Share2,
  Users,
  Copy,
  Check,
} from 'lucide-react';

export interface RewardSettingItem {
  id: number;
  setting_key: string;
  setting_value: string;
  description: string | null;
}

export interface RewardLevelTierItem {
  level: number;
  name_id: string;
  name_en: string;
  min_xp: number;
  badge_icon: string;
  ltp_bonus: number;
  reward_type: string;
  reward_title_id: string | null;
  reward_title_en: string | null;
  reward_description_id: string | null;
  reward_description_en: string | null;
  claim_required: boolean;
  is_active: boolean;
}

export interface RewardActionRuleItem {
  id: number;
  action_code: string;
  category: string;
  name_id: string;
  name_en: string;
  description_id: string | null;
  description_en: string | null;
  xp_reward: number;
  ltp_reward: number;
  max_frequency: string;
  is_active: boolean;
}

interface CommunityRewardsClientProps {
  locale: string;
  settings?: RewardSettingItem[];
  tiers?: RewardLevelTierItem[];
  actions?: RewardActionRuleItem[];
}

const t = {
  id: {
    breadcrumb: { home: 'Beranda', community: 'Komunitas', rewards: 'Sistem Hadiah & Gamifikasi' },
    hero: {
      badge: 'SISTEM TRAVEL CREDITS & REWARD',
      title: 'Kumpulkan Kredit LTP untuk Pengalaman Lokal Gratis & Diskon',
      subtitle:
        'Panduan resmi sistem reward kredit perjalanan untuk seluruh penjelajah dan kontributor komunitas. Dapatkan kredit LTP untuk membuka pengalaman tur lokal gratis, diskon tiket hingga 50%, dan merchandise eksklusif. *(Pencairan ke USD secara eksklusif hanya berlaku bagi Host Terverifikasi yang memperoleh pendapatan dari tur terbitan).*',
      ctaLevel: 'Lihat Tingkatan Level',
      ctaCalculator: 'Kalkulator Nilai Kredit',
    },
    loop: {
      title: 'Tiga Pilar Siklus Hadiah Komunitas',
      subtitle: 'Ekosistem sirkular yang transparan dan adil bagi seluruh penjelajah dan pemandu lokal di Indonesia.',
      step1Title: 'Bagikan Vibes Otentik',
      step1Desc:
        'Tulis panduan perjalanan, buat diskusi forum, hadiri agenda meetup, atau ajak rekan traveler & host.',
      step2Title: 'Kumpulkan Level XP & Kredit LTP',
      step2Desc:
        'XP meningkatkan status reputasi akunmu secara permanen, sedangkan kredit LTP memberikan keuntungan hemat perjalanan nyata.',
      step3Title: 'Buka Pengalaman Lokal & Nikmati Diskon',
      step3Desc:
        'Gunakan kredit LTP untuk membuka pengalaman tur lokal gratis & potongan harga pemesanan. *(Pencairan ke USD secara eksklusif hanya berlaku bagi Host Terverifikasi yang memperoleh pendapatan dari tur terbitan).*',
    },
    tiers: {
      title: '12 Tingkatan Level Reputasi XP & Hadiah Pencapaian',
      subtitle:
        'Semakin tinggi kontribusimu di platform, semakin prestisius statusmu dan semakin banyak hak istimewa yang bisa diklaim.',
      minXp: 'Syarat XP',
      bonusLtp: 'Bonus Kredit LTP',
      merchReward: 'Hadiah Pencapaian',
      claimStatus: 'Klaim Alamat Diperlukan',
      levelPrefix: 'Tingkat',
      allAccess: 'VIP All-Access',
      voucher: 'Voucher Digital',
      merchandise: 'Merchandise Fisik',
    },
    actions: {
      title: 'Matriks Perolehan Hadiah XP & LTP',
      subtitle: 'Daftar aktivitas resmi yang memicu perolehan poin dan koin langsung ke akunmu.',
      tabs: {
        ALL: '✨ Semua Aktivitas',
        REFERRAL: '👥 Rujukan (Referral)',
        COMMUNITY: '💬 Komunitas & Meetup',
        MOBILE_APP: '📱 Aplikasi Seluler',
        TRANSACTION: '🎟️ Transaksi & Tur',
      },
      tableHeaders: {
        activity: 'Aktivitas / Pemicu',
        category: 'Kategori',
        xpEarned: 'Reputasi XP',
        ltpEarned: 'Hadiah LTP',
        limit: 'Frekuensi Batas',
      },
      limits: {
        ONCE_PER_USER: '1x per akun',
        UNLIMITED: 'Tanpa batas',
        DAILY_LIMIT: 'Limit harian',
      },
    },
    calculator: {
      badge: 'KALKULATOR TRAVEL CREDITS & REWARD',
      title: 'Kalkulator Nilai Kredit LTP & Diskon Pengalaman',
      subtitle: 'Kredit LTP dapat ditukarkan langsung sebagai voucher diskon tur dan tiket pengalaman lokal.',
      inputLabel: 'Masukkan Jumlah Kredit LTP Kamu:',
      rateInfo: 'Nilai Acuan Kredit: 100 LTP = $1.00 USD (setara ~Rp 15.500 diskon saat checkout pemesanan tur)',
      estUsd: 'Estimasi Nilai Kredit (USD):',
      estIdr: 'Estimasi Nilai Kredit (IDR):',
      minWithdrawalNotice: 'Kredit LTP dapat digunakan langsung untuk potongan harga pemesanan tur. *(Pencairan ke USD secara eksklusif hanya berlaku bagi Host Terverifikasi yang memperoleh pendapatan dari tur terbitan).*',
      progressBarLabel: 'Kemajuan Menuju Batas Pencairan Host:',
      readyToWithdraw: '✓ Saldo memenuhi syarat untuk ditarik oleh Host!',
      needMore: 'Kurang {remaining} LTP lagi untuk mencapai batas pencairan host.',
      stepsTitle: '3 Alur Pemanfaatan Kredit & Pencairan Host',
      stepsSubtitle: 'Bagaimana kredit LTP Anda digunakan untuk diskon pemesanan atau pencairan saldo host.',
      step1: 'Kumpulkan kredit LTP dari kontribusi aktif, ulasan otentik, dan kehadiran meetup.',
      step2: 'Gunakan langsung kredit LTP saat checkout pemesanan tur untuk potongan hemat hingga 50%.',
      step3: 'Khusus Host Terverifikasi: Saldo penghasilan tur dapat dicairkan langsung ke rekening bank lokal atau PayPal.',
      guarantee: 'Semua transaksi dilindungi garansi keamanan rekening bersama PT Locallytrip Teknologi Indonesia.',
      ctaButton: 'Buka Dompet Akun',
    },
    referral: {
      badge: 'PROGRAM RUJUKAN UNIVERSAL',
      title: 'Ajak Rekan & Dapatkan Reward Bersama',
      subtitle:
        'Program referral Locallytrip terbuka untuk seluruh pengguna (Traveller dan Host). Cukup bagikan kode unik dari dasbor akunmu.',
      travellerTitle: 'Teman Menyelesaikan Trip Pertama',
      travellerDesc: 'Saat teman yang kamu undang memesan dan menyelesaikan pengalaman tur pertamanya.',
      travellerReward: '+100 XP & +50 LTP',
      hostTitle: 'Teman Menyelesaikan Tur sebagai Host',
      hostDesc: 'Saat teman yang kamu undang mendaftar sebagai pemandu lokal dan menyelesaikan tur perdananya.',
      hostReward: '+300 XP & +200 LTP',
      ctaDashboard: 'Buka Dasbor & Dapatkan Kode Referral →',
    },
    faq: {
      title: 'Pertanyaan yang Sering Diajukan (FAQ)',
      subtitle: 'Informasi lengkap mengenai perhitungan poin, pemanfaatan kredit, klaim reward, dan integritas platform.',
      q1: 'Apa perbedaan mendasar antara XP dan Kredit LTP?',
      a1: 'XP (Experience Points) adalah poin reputasi permanen yang menentukan level tier profilmu dan membuka lencana komunitas. Sedangkan Kredit LTP adalah travel reward credits yang digunakan untuk membuka pengalaman lokal gratis dan diskon tiket tur (100 LTP = $1 USD). *(Pencairan ke USD secara eksklusif hanya berlaku bagi Host Terverifikasi yang memperoleh pendapatan dari tur terbitan).*',
      q2: 'Bagaimana sistem referral bekerja untuk Traveller dan Host?',
      a2: 'Kode referral tersedia untuk semua pengguna di dasbor profil. Saat kamu mengundang Traveller dan mereka menyelesaikan trip pertamanya, kamu mendapat +100 XP & +50 LTP. Jika kamu mengundang Host dan mereka menyelesaikan tur pertamanya, kamu mendapat +300 XP & +200 LTP.',
      q3: 'Siapa yang berhak mencairkan saldo LTP ke rekening bank / PayPal?',
      a3: 'Pencairan dana ke rekening bank / PayPal secara eksklusif hanya diperuntukkan bagi Host Terverifikasi yang telah menyelesaikan verifikasi identitas (KYC) dan menyelenggarakan tur terbitan mereka. Bagi traveler, saldo LTP berfungsi penuh sebagai Travel Credits potongan harga pemesanan hingga 50%.',
      q4: 'Bagaimana Locallytrip mencegah kecurangan dan spam farming?',
      a4: 'Kami menerapkan batasan frekuensi (1x per akun, batas harian), moderasi konten otomatis, audit verifikasi identitas KYC, serta validasi transaksi untuk menjaga integritas komunitas.',
    },
  },
  en: {
    breadcrumb: { home: 'Home', community: 'Community', rewards: 'Rewards & Gamification' },
    hero: {
      badge: 'OFFICIAL TRAVEL CREDITS & REWARDS',
      title: 'Earn LTP Credits to Unlock Free Local Experiences & Discounts',
      subtitle:
        'Official travel credits guide for explorers and community contributors. Earn LTP Credits to unlock free local experiences, tour discounts, and exclusive merchandise. *(Cash-out to USD is exclusively available for Verified Local Hosts earning from published experiences).*',
      ctaLevel: 'Explore Level Tiers',
      ctaCalculator: 'Credit Value Calculator',
    },
    loop: {
      title: 'Three Pillars of the Community Reward Cycle',
      subtitle: 'A transparent circular ecosystem benefiting travelers, storytellers, and local insiders alike.',
      step1Title: 'Share Authentic Vibes',
      step1Desc:
        'Write travel guides, start forum discussions, attend meetups, or invite fellow travelers & hosts.',
      step2Title: 'Accumulate XP Levels & LTP Credits',
      step2Desc:
        'XP permanently elevates your reputation tier, while LTP Credits unlock immediate travel booking discounts.',
      step3Title: 'Unlock Free Local Tours & Exclusive Perks',
      step3Desc:
        'Earn LTP Credits to unlock free local experiences & discounts. *(Cash-out to USD is exclusively available for Verified Local Hosts earning from published experiences).*',
    },
    tiers: {
      title: '12 XP Reputation Tiers & Milestone Rewards',
      subtitle:
        'The more you contribute to the ecosystem, the more prestigious your status and the greater the exclusive perks.',
      minXp: 'Required XP',
      bonusLtp: 'Bonus LTP Credits',
      merchReward: 'Milestone Reward',
      claimStatus: 'Shipping Address Required',
      levelPrefix: 'Tier',
      allAccess: 'VIP All-Access',
      voucher: 'Digital Voucher',
      merchandise: 'Physical Merch',
    },
    actions: {
      title: 'How to Earn XP & LTP Coins',
      subtitle: 'Official platform actions that directly reward your profile.',
      tabs: {
        ALL: '✨ All Activities',
        REFERRAL: '👥 Referrals',
        COMMUNITY: '💬 Community & Meetups',
        MOBILE_APP: '📱 Mobile Apps',
        TRANSACTION: '🎟️ Transactions & Tours',
      },
      tableHeaders: {
        activity: 'Activity / Trigger',
        category: 'Category',
        xpEarned: 'XP Reputation',
        ltpEarned: 'LTP Reward',
        limit: 'Frequency Limit',
      },
      limits: {
        ONCE_PER_USER: 'Once per account',
        UNLIMITED: 'Unlimited',
        DAILY_LIMIT: 'Daily limit',
      },
    },
    calculator: {
      badge: 'TRAVEL CREDITS VALUE ESTIMATOR',
      title: 'LTP Credit Value Calculator & Experience Discounts',
      subtitle: 'Calculate your travel credit savings for booking unique local tours across Southeast Asia.',
      inputLabel: 'Enter Your LTP Credit Balance:',
      rateInfo: 'Credit Exchange Value: 100 LTP = $1.00 USD (~IDR 15,500 booking discount at checkout)',
      estUsd: 'Estimated Credit Value (USD):',
      estIdr: 'Estimated Credit Value (IDR):',
      minWithdrawalNotice: 'LTP Credits can be applied directly as booking discounts at checkout. *(Cash-out to USD is exclusively available for Verified Local Hosts earning from published experiences).*',
      progressBarLabel: 'Progress to Host Payout Threshold:',
      readyToWithdraw: '✓ Balance is eligible for Host payout!',
      needMore: '{remaining} more LTP needed to request host payout.',
      stepsTitle: '3 Ways to Use Credits & Host Payouts',
      stepsSubtitle: 'How your travel credits unlock tour discounts or convert safely into host bank disbursements.',
      step1: 'Accumulate LTP credits through genuine reviews, referrals, and meetup participation.',
      step2: 'Apply LTP credits directly at tour checkout to receive instant discounts of up to 50%.',
      step3: 'Exclusively for Verified Hosts: Published tour earnings can be disbursed to your local Bank Account or PayPal.',
      guarantee: 'All transactions secured by PT Locallytrip Teknologi Indonesia escrow guarantee.',
      ctaButton: 'Go to Wallet Dashboard',
    },
    referral: {
      badge: 'UNIVERSAL REFERRAL PROGRAM',
      title: 'Invite Friends & Earn Rewards Together',
      subtitle:
        'The referral program is available to all users (both Travelers and Hosts) on your profile dashboard. Share your link and grow together.',
      travellerTitle: 'Friend Completes First Trip',
      travellerDesc: 'When your invited friend books and finishes their first travel experience.',
      travellerReward: '+100 XP & +50 LTP',
      hostTitle: 'Friend Completes First Tour as Host',
      hostDesc: 'When your invited friend registers as a local host and completes their maiden tour.',
      hostReward: '+300 XP & +200 LTP',
      ctaDashboard: 'Go to Dashboard & Get Referral Code →',
    },
    faq: {
      title: 'Frequently Asked Questions (FAQ)',
      subtitle: 'Detailed guidance regarding rules, credit economics, merchandise claims, and platform fair-play.',
      q1: 'What is the key difference between XP and LTP Credits?',
      a1: 'XP (Experience Points) is a permanent reputation score that elevates your profile tier. LTP Credits are travel reward credits used to unlock free local experiences and checkout discounts (100 LTP = $1 USD). *(Cash-out to USD is exclusively available for Verified Local Hosts earning from published experiences).*',
      q2: 'How does the referral program reward me for Travellers and Hosts?',
      a2: 'Referral codes are available to all users on the dashboard. Referring a Traveler earns +100 XP & +50 LTP upon their first completed trip. Referring a Host earns +300 XP & +200 LTP upon their first tour completion.',
      q3: 'Who is eligible to cash out LTP Credits to a bank account or PayPal?',
      a3: 'Cash-out to USD is exclusively available for Verified Local Hosts who have completed identity verification (KYC) and host published experiences. For travelers and community members, LTP operates as sustainable travel credits providing up to 50% direct booking discounts.',
      q4: 'How does Locallytrip prevent fraud and spam farming?',
      a4: 'We enforce strict frequency limits (once per account, daily caps), automated moderation, KYC verification audits, and transaction validations to maintain platform integrity.',
    },
  },
};

export function CommunityRewardsClient({
  locale,
  settings = [],
  tiers = [],
  actions = [],
}: CommunityRewardsClientProps) {
  const isId = locale === 'id';
  const dict = isId ? t.id : t.en;

  // Konversi Resmi:
  // 100 LTP = 1 USD ($0.01 per LTP)
  // 1 LTP = Rp 155 (sehingga 100 LTP = $1 USD = Rp 15.500)
  // 3.000 LTP = $30.00 USD = Rp 465.000
  const usdPerLtp = 0.01;
  const idrPerLtp = 155;
  const minPayout = 3000;

  // Calculator State (Default 3.000 LTP)
  const [calculatorLtp, setCalculatorLtp] = useState<number>(3000);

  // Dynamic calculations
  const estimatedUsdVal = calculatorLtp * usdPerLtp;
  const estimatedUsdStr = estimatedUsdVal.toFixed(2);
  const estimatedIdrNum = Math.round(calculatorLtp * idrPerLtp);
  const estimatedIdrStr = estimatedIdrNum.toLocaleString(isId ? 'id-ID' : 'en-US');

  const minPayoutUsdStr = (minPayout * usdPerLtp).toFixed(2);
  const minPayoutIdrStr = Math.round(minPayout * idrPerLtp).toLocaleString(
    isId ? 'id-ID' : 'en-US'
  );

  const payoutProgress = Math.min(100, Math.round((calculatorLtp / minPayout) * 100));
  const remainingLtp = Math.max(0, minPayout - calculatorLtp);

  // Category filter state
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories = [
    { key: 'ALL', label: dict.actions.tabs.ALL },
    { key: 'REFERRAL', label: dict.actions.tabs.REFERRAL },
    { key: 'COMMUNITY', label: dict.actions.tabs.COMMUNITY },
    { key: 'MOBILE_APP', label: dict.actions.tabs.MOBILE_APP },
    { key: 'TRANSACTION', label: dict.actions.tabs.TRANSACTION },
  ];

  const filteredActions =
    selectedCategory === 'ALL'
      ? actions
      : actions.filter((a) => a.category === selectedCategory);

  // FAQ Accordion State (item pertama terbuka default)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const faqItems = [
    { question: dict.faq.q1, answer: dict.faq.a1 },
    { question: dict.faq.q2, answer: dict.faq.a2 },
    { question: dict.faq.q3, answer: dict.faq.a3 },
    { question: dict.faq.q4, answer: dict.faq.a4 },
  ];

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* 1. Breadcrumbs & Hero Section */}
      <section className="space-y-6">
        {/* Breadcrumb: Beranda › Komunitas › Sistem Hadiah & Gamifikasi */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Link
            href={`/${locale}`}
            className="hover:text-purple-700 transition flex items-center gap-1 text-slate-600"
          >
            {dict.breadcrumb.home}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <Link
            href={`/${locale}/community`}
            className="hover:text-purple-700 transition text-slate-600"
          >
            {dict.breadcrumb.community}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-purple-700 font-semibold">
            {dict.breadcrumb.rewards}
          </span>
        </nav>

        {/* Hero Banner 2-Kolom */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-950 via-slate-900 to-indigo-950 border border-purple-800/40 shadow-xl p-6 sm:p-10 lg:p-12">
          {/* Radial Glow Ornaments */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Kolom Kiri: Teks & Tombol CTA (lg:col-span-7) */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/15 border border-purple-400/30 text-purple-300 text-xs font-semibold tracking-wide">
                <span>🪙</span>
                <span>{dict.hero.badge}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-serif tracking-tight leading-tight">
                {locale === 'id' ? (
                  <>
                    Ubah Jejak Petualanganmu Menjadi{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-200 to-yellow-400">
                      Hadiah & Reputasi Nyata
                    </span>
                  </>
                ) : (
                  <>
                    Turn Your Travel Passion into{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-200 to-yellow-400">
                      Real Rewards & Reputation
                    </span>
                  </>
                )}
              </h1>

              <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
                {dict.hero.subtitle}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href="#tiers"
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-98"
                >
                  <span>{dict.hero.ctaLevel}</span>
                  <span>→</span>
                </a>
                <a
                  href="#calculator"
                  className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-semibold text-sm backdrop-blur-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>🪙</span>
                  <span>{dict.hero.ctaCalculator}</span>
                </a>
              </div>
            </div>

            {/* Kolom Kanan: Foto Maskot / Traveler Ceria (lg:col-span-5) */}
            <div className="lg:col-span-5 relative flex justify-center lg:justify-end">
              <div className="relative w-full max-w-xs sm:max-w-sm">
                <div className="relative rounded-3xl overflow-hidden border border-purple-500/30 shadow-2xl bg-slate-900/40">
                  <Image
                    src="/images/rewards/hero-earning-traveler.png"
                    alt="Locallytrip Community Earnings"
                    width={500}
                    height={550}
                    priority
                    className="w-full h-auto object-cover object-top hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Floating Badge 1: Payout Ready */}
                <div className="absolute -left-4 top-1/3 sm:-left-6 bg-slate-950/90 backdrop-blur-md border border-purple-400/30 rounded-2xl px-3.5 py-2.5 shadow-xl flex items-center gap-2.5 z-20">
                  <span className="text-xl">💵</span>
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">Payout Ready</div>
                    <div className="text-xs font-bold text-emerald-400">$30.00 USD (3.000 LTP)</div>
                  </div>
                </div>

                {/* Floating Badge 2: Host Referral */}
                <div className="absolute -right-3 -bottom-3 sm:-right-4 sm:-bottom-4 bg-slate-950/90 backdrop-blur-md border border-amber-400/30 rounded-2xl px-3.5 py-2.5 shadow-xl flex items-center gap-2.5 z-20">
                  <span className="text-xl">👥</span>
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">Host Referral</div>
                    <div className="text-xs font-bold text-amber-300">+200 LTP ($2.00)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Tiga Pilar Ekosistem (Core Reward Loop) */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold text-purple-600 uppercase tracking-widest">
            {isId ? 'Sistem Terbuka & Sirkular' : 'Open & Circular Loop'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
            {dict.loop.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            {dict.loop.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-purple-300 transition-all duration-300 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center text-xl font-bold">
              1
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              {dict.loop.step1Title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {dict.loop.step1Desc}
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-purple-300 transition-all duration-300 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl font-bold">
              2
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              {dict.loop.step2Title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {dict.loop.step2Desc}
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-purple-300 transition-all duration-300 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl font-bold">
              3
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              {dict.loop.step3Title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {dict.loop.step3Desc}
            </p>
          </div>
        </div>
      </section>

      {/* 3. Tingkatan Level Reputasi XP (Tiers Grid 1 s/d 12) */}
      <section id="tiers" className="space-y-6 scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-purple-600 uppercase tracking-widest">
              {isId ? 'Tingkatan Reputasi' : 'Reputation Ranks'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
              {dict.tiers.title}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md">
            {dict.tiers.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {tiers.map((tier) => {
            const hasPhysicalMerch = tier.reward_type === 'PHYSICAL_MERCH';
            const hasDigitalVoucher = tier.reward_type === 'DIGITAL_VOUCHER';
            const isAllAccess = tier.reward_type === 'ALL_ACCESS';
            const hasSpecialReward = hasPhysicalMerch || hasDigitalVoucher || isAllAccess;

            const tierName = locale === 'id' ? tier.name_id : tier.name_en;
            const rewardTitle = locale === 'id' ? tier.reward_title_id : tier.reward_title_en;
            const rewardDesc = locale === 'id' ? tier.reward_description_id : tier.reward_description_en;

            let badgeLabel = '';
            if (hasPhysicalMerch) badgeLabel = dict.tiers.merchandise;
            else if (hasDigitalVoucher) badgeLabel = dict.tiers.voucher;
            else if (isAllAccess) badgeLabel = dict.tiers.allAccess;

            return (
              <div
                key={tier.level}
                className={`bg-white rounded-3xl p-5 border transition-all duration-300 flex flex-col justify-between space-y-4 relative group ${
                  hasSpecialReward
                    ? 'border-purple-300 shadow-md ring-1 ring-purple-200/50 hover:border-purple-500 hover:shadow-xl'
                    : 'border-slate-200/90 shadow-xs hover:border-purple-300 hover:shadow-md'
                }`}
              >
                {/* Reward Type Tag */}
                {hasSpecialReward && (
                  <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-sm bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                    {hasPhysicalMerch && <Package className="w-3 h-3" />}
                    {hasDigitalVoucher && <Ticket className="w-3 h-3" />}
                    {isAllAccess && <Crown className="w-3 h-3" />}
                    <span>{badgeLabel}</span>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl p-2.5 rounded-2xl bg-slate-50 border border-slate-100 shadow-2xs group-hover:scale-110 transition-transform">
                      {tier.badge_icon}
                    </span>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-800">
                      {dict.tiers.levelPrefix} {tier.level}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-purple-700 transition">
                      {tierName}
                    </h3>
                    <p className="text-xs text-purple-600 font-semibold mt-0.5">
                      {tier.min_xp === 0
                        ? `0 XP (${dict.tiers.minXp})`
                        : `≥ ${tier.min_xp.toLocaleString(isId ? 'id-ID' : 'en-US')} XP (${dict.tiers.minXp})`}
                    </p>
                  </div>

                  {/* Merchandise / Reward Title */}
                  {rewardTitle ? (
                    <div className="p-2.5 rounded-xl bg-purple-50/80 border border-purple-100 text-xs">
                      <p className="font-bold text-purple-900 flex items-center gap-1">
                        <Gift className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span>{rewardTitle}</span>
                      </p>
                      {rewardDesc && (
                        <p className="text-[11px] text-purple-700 mt-1 leading-snug">
                          {rewardDesc}
                        </p>
                      )}
                      {tier.claim_required && (
                        <span className="inline-block mt-1 text-[10px] font-bold text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded">
                          {dict.tiers.claimStatus}
                        </span>
                      )}
                    </div>
                  ) : rewardDesc ? (
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {rewardDesc}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      {isId
                        ? 'Meningkatkan reputasi profil dan hak partisipasi komunitas.'
                        : 'Boosts community reputation and engagement privileges.'}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>{dict.tiers.bonusLtp}</span>
                  <span className="text-amber-600 font-bold">
                    {tier.ltp_bonus > 0 ? `+${tier.ltp_bonus} LTP` : '-'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Matriks Perolehan Hadiah XP & LTP (How to Earn) */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold text-purple-600 uppercase tracking-widest">
            {isId ? 'Katalog Aturan Resmi' : 'Official Rules Catalog'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
            {dict.actions.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            {dict.actions.subtitle}
          </p>
        </div>

        {/* Filter Kategori Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === cat.key
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-purple-300 hover:text-purple-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredActions.map((action) => {
            const isReferral = action.category === 'REFERRAL';
            const isMobile = action.category === 'MOBILE_APP';
            const isCommunity = action.category === 'COMMUNITY';
            const isTransaction = action.category === 'TRANSACTION';

            let categoryBadge = 'bg-slate-100 text-slate-700';
            let icon = '⚡';

            if (isReferral) {
              categoryBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
              icon = '🎁';
            } else if (isMobile) {
              categoryBadge = 'bg-blue-50 text-blue-700 border-blue-200';
              icon = '📱';
            } else if (isCommunity) {
              categoryBadge = 'bg-purple-50 text-purple-700 border-purple-200';
              icon = '💬';
            } else if (isTransaction) {
              categoryBadge = 'bg-amber-50 text-amber-700 border-amber-200';
              icon = '🎟️';
            }

            const limitText =
              action.max_frequency === 'ONCE_PER_USER'
                ? dict.actions.limits.ONCE_PER_USER
                : action.max_frequency === 'DAILY_LIMIT'
                ? dict.actions.limits.DAILY_LIMIT
                : dict.actions.limits.UNLIMITED;

            const actionName = locale === 'id' ? action.name_id : action.name_en;
            const actionDesc = locale === 'id' ? action.description_id : action.description_en;

            return (
              <div
                key={action.id}
                className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs hover:border-purple-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{icon}</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${categoryBadge}`}>
                      +{action.ltp_reward} LTP
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {actionName}
                  </h3>

                  {actionDesc && (
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {actionDesc}
                    </p>
                  )}

                  <span className="inline-block text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                    {limitText}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">{dict.actions.tableHeaders.xpEarned}</span>
                  <span className="text-purple-700 font-bold bg-purple-50 px-2.5 py-1 rounded-md">
                    +{action.xp_reward} XP
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Kalkulator Konversi LTP Dinamis & Alur Pencairan (Withdrawal Workflow) */}
      <section id="calculator" className="space-y-8 scroll-mt-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Sisi Kiri: Kalkulator Interaktif (lg:col-span-7) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-10 border border-purple-200/90 shadow-md flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                <Coins className="w-3.5 h-3.5 text-amber-500" />
                <span>{dict.calculator.badge}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-slate-900">
                {dict.calculator.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                {dict.calculator.subtitle}
              </p>
              <div className="text-xs font-semibold text-purple-700 bg-purple-50/80 px-3 py-1.5 rounded-xl border border-purple-100 inline-block">
                {dict.calculator.rateInfo}
              </div>
            </div>

            {/* Kontrol Slider & Input */}
            <div className="space-y-4 p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between gap-4">
                <label className="text-xs sm:text-sm font-bold text-slate-700">
                  {dict.calculator.inputLabel}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="50000"
                    step="100"
                    value={calculatorLtp}
                    onChange={(e) => setCalculatorLtp(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-28 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-right text-sm font-bold text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                  <span className="text-xs font-bold text-slate-500">LTP</span>
                </div>
              </div>

              {/* Slider */}
              <input
                type="range"
                min="0"
                max="10000"
                step="100"
                value={calculatorLtp}
                onChange={(e) => setCalculatorLtp(parseInt(e.target.value, 10))}
                className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />

              <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                <span>0 LTP</span>
                <span>
                  3.000 LTP ({isId ? 'Min Penarikan' : 'Min Payout'})
                </span>
                <span>10.000+ LTP</span>
              </div>

              {/* Progress Min Payout */}
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">
                    {dict.calculator.progressBarLabel}
                  </span>
                  <span
                    className={`font-bold ${
                      calculatorLtp >= minPayout ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  >
                    {calculatorLtp >= minPayout
                      ? dict.calculator.readyToWithdraw
                      : dict.calculator.needMore.replace(
                          '{remaining}',
                          remainingLtp.toLocaleString(isId ? 'id-ID' : 'en-US')
                        )}
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      calculatorLtp >= minPayout ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${payoutProgress}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 pt-0.5">
                  {dict.calculator.minWithdrawalNotice}
                </p>
              </div>
            </div>

            {/* Nilai Konversi Dinamis (IDR & USD) */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-purple-600/20">
              <div className="space-y-1">
                <p className="text-xs text-purple-200 font-medium">
                  {isId ? dict.calculator.estIdr : dict.calculator.estUsd}
                </p>

                {isId ? (
                  <div>
                    <p className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                      Rp {estimatedIdrStr}
                    </p>
                    <p className="text-xs text-purple-200 font-semibold mt-0.5">
                      ($ {estimatedUsdStr} USD)
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                      $ {estimatedUsdStr} USD
                    </p>
                    <p className="text-xs text-purple-200 font-semibold mt-0.5">
                      (~IDR {estimatedIdrStr})
                    </p>
                  </div>
                )}

                <p className="text-[11px] text-purple-200 pt-1">
                  {isId
                    ? '100 LTP = $1.00 USD (Rp 15.500). Bebas biaya admin transfer penarikan lokal.'
                    : '100 LTP = $1.00 USD (~IDR 15,500). Zero withdrawal fee for local bank & PayPal.'}
                </p>
              </div>

              <Link
                href={`/${locale}/dashboard/wallet`}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-purple-50 text-purple-900 font-bold text-xs sm:text-sm shadow-sm transition shrink-0"
              >
                <span>{dict.calculator.ctaButton}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Sisi Kanan: 3 Langkah Mudah Pencairan (Payout Workflow) (lg:col-span-5) */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-bold text-purple-600 uppercase tracking-widest">
                {isId ? 'Panduan Pencairan' : 'Payout Workflow'}
              </span>
              <h3 className="text-xl font-serif font-bold text-slate-900">
                {dict.calculator.stepsTitle}
              </h3>
              <p className="text-xs text-slate-500">
                {dict.calculator.stepsSubtitle}
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 font-bold text-sm">
                  1
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900">
                    {isId ? 'Kumpulkan Minimal 3.000 LTP' : 'Reach 3,000 LTP'}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {dict.calculator.step1}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 font-bold text-sm">
                  2
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900">
                    {isId ? 'Lengkapi Rekening Bank di Dompet' : 'Add Bank or PayPal in Wallet'}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {dict.calculator.step2}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-sm">
                  3
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900">
                    {isId ? 'Pencairan Dana Masuk 1-2 Hari' : 'Payout Disbursed in 1-2 Days'}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {dict.calculator.step3}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3 text-xs text-slate-600">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{dict.calculator.guarantee}</span>
            </div>
          </div>
        </div>

        {/* Banner Sorotan: Penukaran Voucher Mitra Brand (Perks) */}
        <div className="bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 rounded-3xl p-6 sm:p-8 border-2 border-purple-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-left">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 text-2xl font-bold">
              🎁
            </div>
            <div className="space-y-1">
              <h4 className="text-base sm:text-lg font-bold font-serif text-slate-900">
                {isId
                  ? 'Ingin Menukarkan LTP dengan Perlengkapan Outdoor, Staycation, atau Voucher Kopi?'
                  : 'Want to Exchange LTP for Outdoor Gear, Stays, or Dining Vouchers?'}
              </h4>
              <p className="text-xs sm:text-sm text-slate-600">
                {isId
                  ? 'Kunjungi Perks Marketplace dan nikmati diskon eksklusif dari EIGER, Bobocabin, Kopi Kenangan, Bluebird, dan mitra ternama lainnya.'
                  : 'Explore the Perks Marketplace for exclusive vouchers from EIGER, Bobocabin, Kopi Kenangan, Bluebird, and premier brand partners.'}
              </p>
            </div>
          </div>

          <Link
            href={`/${locale}/community/perks`}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-purple-900 hover:bg-purple-950 text-white font-bold text-xs sm:text-sm shadow-md transition active:scale-95 shrink-0"
          >
            <span>{isId ? 'Jelajahi Katalog Mitra Brand ➔' : 'Explore Brand Perks ➔'}</span>
          </Link>
        </div>
      </section>

      {/* 6. Program Referral Universal (Semua Pengguna) */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-8 sm:p-12 shadow-xl border border-purple-700/40">
        <div className="absolute right-0 top-0 -mr-20 -mt-20 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-amber-300 text-xs font-bold tracking-wide">
              <span>👥</span>
              <span>{dict.referral.badge}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-white tracking-tight">
              {dict.referral.title}
            </h2>
            <p className="text-sm sm:text-base text-purple-100 max-w-2xl leading-relaxed">
              {dict.referral.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Referral Traveller */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/15 space-y-3 hover:border-amber-300/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-2xl">🎒</span>
                <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-amber-400 text-slate-900">
                  {dict.referral.travellerReward}
                </span>
              </div>
              <h3 className="text-base font-bold text-white">
                {dict.referral.travellerTitle}
              </h3>
              <p className="text-xs text-purple-200 leading-relaxed">
                {dict.referral.travellerDesc}
              </p>
            </div>

            {/* Card 2: Referral Host */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/15 space-y-3 hover:border-amber-300/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-2xl">👑</span>
                <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-400 text-slate-900">
                  {dict.referral.hostReward}
                </span>
              </div>
              <h3 className="text-base font-bold text-white">
                {dict.referral.hostTitle}
              </h3>
              <p className="text-xs text-purple-200 leading-relaxed">
                {dict.referral.hostDesc}
              </p>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href={`/${locale}/dashboard`}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white hover:bg-purple-50 text-purple-950 font-bold text-xs sm:text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-95"
            >
              <span>{dict.referral.ctaDashboard}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 7. FAQ Keamanan & Tokenomics */}
      <section className="w-full space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-bold tracking-widest text-purple-600 uppercase">
            {locale === 'id' ? 'TANYA JAWAB UMUM' : 'FREQUENTLY ASKED QUESTIONS'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-serif">
            {dict.faq.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            {dict.faq.subtitle}
          </p>
        </div>

        {/* Accordion List */}
        <div className="w-full space-y-3.5 max-w-4xl mx-auto">
          {faqItems.map((item, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                className="w-full rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-xs transition-all duration-200 hover:border-purple-300"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full py-5 px-6 sm:px-8 text-left flex items-center justify-between gap-4 focus:outline-none cursor-pointer"
                >
                  <span className="font-semibold text-slate-900 text-sm sm:text-base flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center shrink-0">
                      ?
                    </span>
                    <span>{item.question}</span>
                  </span>
                  <span
                    className={`text-slate-400 transition-transform duration-300 shrink-0 ${
                      isOpen ? 'rotate-180 text-purple-600' : ''
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </button>

                {isOpen && (
                  <div className="px-6 sm:px-8 pb-6 pt-2 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/40">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default CommunityRewardsClient;
