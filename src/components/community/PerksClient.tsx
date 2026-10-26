'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import {
  Gift,
  Coins,
  Crown,
  Sparkles,
  Star,
  CheckCircle2,
  Copy,
  ExternalLink,
  Tag,
  AlertCircle,
  Loader2,
  Filter,
  Ticket,
  ChevronRight,
  Info,
  Calendar,
  X,
  Compass,
  ArrowRight,
  Printer,
  Store,
  Globe,
  Building2,
  Barcode,
  ShieldCheck,
  HelpCircle,
  Award,
  BookOpen,
  ChevronDown,
} from 'lucide-react';
import { claimBrandPerkVoucher } from '@/actions/partners/brand-actions';
import { BarcodeView, QrCodeBox, PerkVoucherPrintModal } from './PerkVoucherPrintModal';

export interface PerkPartner {
  id: number;
  name: string;
  slug: string;
  category: string;
  logo_url: string;
  website_url: string | null;
}

export interface PerkCampaign {
  id: number;
  title: string;
  slug: string;
  description: string;
  terms: string | null;
  image_url: string;
  tier_package: string;
  is_featured: boolean;
  cost_in_ltp: number;
  min_xp_level: number;
  total_quota: number;
  claimed_quota: number;
  remaining_vouchers: number;
  end_date: string;
  partner: PerkPartner;
}

export interface UserPerkClaim {
  id?: number;
  campaign_id: number;
  voucher_code: string;
  claimed_at: string;
  campaign_title?: string;
  partner_name?: string;
  partner_logo?: string;
  partner_category?: string;
  terms?: string | null;
}

interface PerksClientProps {
  locale: string;
  isLoggedIn: boolean;
  userWalletBalance: number;
  userCurrentLevel: number;
  campaigns: PerkCampaign[];
  initialUserClaims: UserPerkClaim[];
}

export function PerksClient({
  locale,
  isLoggedIn,
  userWalletBalance,
  userCurrentLevel,
  campaigns,
  initialUserClaims,
}: PerksClientProps) {
  const isId = locale === 'id';
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Mapping Kategori
  const categoryLabels: Record<string, { id: string; en: string; icon: string }> = {
    ALL: { id: 'Semua Kategori', en: 'All Categories', icon: '🌟' },
    HOSPITALITY: { id: 'Hotel & Staycation', en: 'Hospitality & Stays', icon: '⛺' },
    OUTDOOR_GEAR: { id: 'Perlengkapan Outdoor', en: 'Outdoor Gear', icon: '🎒' },
    FNB: { id: 'Kuliner & Kafe', en: 'Food & Beverage', icon: '☕' },
    TRANSPORT: { id: 'Transportasi', en: 'Transport', icon: '🚗' },
    INSURANCE: { id: 'Asuransi Wisata', en: 'Insurance', icon: '🛡️' },
    MY_VOUCHERS: { id: 'Voucher Saya', en: 'My Vouchers', icon: '🎟️' },
  };

  const getNormalizedCategory = (catParam?: string | null): string => {
    if (!catParam) return 'ALL';
    const upper = catParam.toUpperCase();
    return categoryLabels[upper] ? upper : 'ALL';
  };

  const [activeTab, setActiveTab] = useState<string>(() =>
    getNormalizedCategory(searchParams?.get('category') || searchParams?.get('tab'))
  );
  const [userBalance, setUserBalance] = useState<number>(userWalletBalance);
  const [userClaims, setUserClaims] = useState<UserPerkClaim[]>(initialUserClaims);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  useEffect(() => {
    const rawCat = searchParams?.get('category') || searchParams?.get('tab');
    setActiveTab(getNormalizedCategory(rawCat));
  }, [searchParams]);

  const handleCategoryChange = (key: string) => {
    const normalizedKey = getNormalizedCategory(key);
    setActiveTab(normalizedKey);
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (!normalizedKey || normalizedKey === 'ALL') {
      params.delete('category');
      params.delete('tab');
    } else {
      params.set('category', normalizedKey);
      params.delete('tab');
    }
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  };

  // Modal State
  const [selectedCampaign, setSelectedCampaign] = useState<PerkCampaign | null>(null);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimedResult, setClaimedResult] = useState<{
    voucherCode: string;
    terms?: string | null;
    campaignTitle?: string;
    partnerName?: string;
    partnerLogo?: string;
    partnerCategory?: string;
  } | null>(null);

  // Printable Voucher Modal State
  const [printableClaim, setPrintableClaim] = useState<UserPerkClaim | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Filter Kampanye dari Database
  const filteredCampaigns = campaigns.filter((camp) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'MY_VOUCHERS') return false;
    return camp.partner.category === activeTab;
  });

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleOpenClaimModal = (campaign: PerkCampaign) => {
    setSelectedCampaign(campaign);
    setClaimError(null);
    setClaimedResult(null);

    // Cek apakah user sudah punya klaim untuk campaign ini
    const existing = userClaims.find((c) => c.campaign_id === campaign.id);
    if (existing) {
      setClaimedResult({
        voucherCode: existing.voucher_code,
        terms: campaign.terms,
        campaignTitle: campaign.title,
        partnerName: campaign.partner.name,
        partnerLogo: campaign.partner.logo_url,
        partnerCategory: campaign.partner.category,
      });
    }
  };

  const handleConfirmClaim = async () => {
    if (!selectedCampaign) return;
    setIsClaiming(true);
    setClaimError(null);

    try {
      const res = await claimBrandPerkVoucher(selectedCampaign.id);
      if (!res.success) {
        setClaimError(res.message);
      } else {
        setClaimedResult({
          voucherCode: res.voucherCode || '',
          terms: res.terms || selectedCampaign.terms,
          campaignTitle: res.campaignTitle || selectedCampaign.title,
          partnerName: res.partnerName || selectedCampaign.partner.name,
          partnerLogo: selectedCampaign.partner.logo_url,
          partnerCategory: selectedCampaign.partner.category,
        });

        // Update saldo lokal
        if (selectedCampaign.cost_in_ltp > 0) {
          setUserBalance((prev) => Math.max(0, prev - selectedCampaign.cost_in_ltp));
        }

        // Tambah ke daftar klaim lokal
        const newClaim: UserPerkClaim = {
          campaign_id: selectedCampaign.id,
          voucher_code: res.voucherCode || '',
          claimed_at: new Date().toISOString(),
          campaign_title: selectedCampaign.title,
          partner_name: selectedCampaign.partner.name,
          partner_logo: selectedCampaign.partner.logo_url,
          partner_category: selectedCampaign.partner.category,
          terms: selectedCampaign.terms,
        };
        setUserClaims((prev) => [newClaim, ...prev]);
      }
    } catch (err: any) {
      setClaimError(err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsClaiming(false);
    }
  };

  // FAQ Items for AEO & GEO
  const faqList = [
    {
      q: isId
        ? 'Apa itu Locallytrip Community Perks dan koin LTP?'
        : 'What is Locallytrip Community Perks and LTP coins?',
      a: isId
        ? 'Locallytrip Community Perks adalah marketplace reward resmi untuk anggota komunitas traveler Locallytrip. Koin LTP (Loyalty Travel Points) adalah poin loyalitas yang diperoleh dari kontribusi autentik seperti menerbitkan cerita perjalanan, menulis ulasan tur, dan memandu meetup lokal. Koin ini dapat ditukarkan dengan potongan harga nyata dari mitra resmi (Bobocabin, EIGER, Kopi Kenangan, Bluebird, Zurich, dll.).'
        : 'Locallytrip Community Perks is an official reward marketplace for Locallytrip community explorers. LTP (Loyalty Travel Points) are earned through genuine contributions such as publishing travel stories, reviewing tours, and hosting meetups. Points can be redeemed for authentic discount vouchers from verified partners.',
    },
    {
      q: isId
        ? 'Bagaimana cara menukarkan koin LTP dengan voucher mitra?'
        : 'How do I redeem LTP coins for partner perks?',
      a: isId
        ? 'Pilih promo yang Anda inginkan di halaman ini, pastikan saldo LTP dan level XP akun Anda mencukupi persyaratan minimum, lalu klik tombol "Tukarkan Sekarang". Sistem akan segera mengeluarkan kode voucher unik beserta barcode dan QR code siap pakai yang tersimpan di tab "Voucher Saya".'
        : 'Select your preferred campaign on this page, ensure your LTP balance and XP level meet the criteria, then click "Redeem Now". The system will issue a unique voucher code with an encrypted POS barcode and QR code stored in your "My Vouchers" tab.',
    },
    {
      q: isId
        ? 'Bagaimana cara menggunakan voucher di kasir fisik vs toko online mitra?'
        : 'How do I use vouchers at physical cashier vs online partner checkouts?',
      a: isId
        ? 'Untuk gerai kasir offline (seperti toko ritel EIGER atau kedai kopi), tunjukkan barcode atau QR code dari layar ponsel Anda agar dipindai oleh staf kasir saat transaksi. Untuk toko online resmi mitra, salin kode alfanumerik voucher dan tempelkan pada kolom "Kode Promo / Kupon" saat melakukan checkout pesanan.'
        : 'For offline cashier desks, present the vector barcode or QR code from your phone screen to be scanned at POS checkout. For online brand websites, copy the alphanumeric voucher code and paste it into the coupon/promo code field during checkout.',
    },
    {
      q: isId
        ? 'Apakah penawaran reward di halaman ini berasal langsung dari database resmi?'
        : 'Are the reward offers on this page sourced directly from official databases?',
      a: isId
        ? 'Ya. Seluruh promo, kuota voucher, dan masa berlaku yang tampil di halaman Locallytrip Community Perks tersimpan secara real-time di database PostgreSQL (tabel brand_campaigns dan brand_partners) yang diawasi langsung oleh manajemen PT Locallytrip Teknologi Indonesia.'
        : 'Yes. All promotions, quotas, and validity periods shown on this page are fetched in real-time from our production database, backed by formal corporate brand agreements with PT Locallytrip Teknologi Indonesia.',
    },
    {
      q: isId
        ? 'Bagaimana pemilik usaha atau brand lokal dapat bergabung menjadi mitra Locallytrip Perks?'
        : 'How can local business owners and brands become official partners?',
      a: isId
        ? 'Kami menyambut pelaku akomodasi glamping, operator tur, gerai kuliner khas, dan produsen perlengkapan outdoor untuk berkolaborasi secara barter maupun sponsorship. Silakan ajukan pendaftaran melalui formulir kemitraan di menu "Partner With Us" atau hubungi tim B2B kami di partnerships@locallytrip.com.'
        : 'We welcome glamping operators, outdoor apparel brands, specialty cafes, and local tour operators. Submit an application via the "Partner With Us" portal or contact our corporate team at partnerships@locallytrip.com.',
    },
  ];

  return (
    <div className="space-y-10 sm:space-y-14">
      {/* 1. HERO BANNER KATALOG PERKS */}
      <section className="bg-gradient-to-br from-slate-900 via-purple-950 to-indigo-950 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden border border-purple-800/40">
        <div className="absolute top-0 right-10 -mt-16 w-80 h-80 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 -mb-16 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3.5 max-w-2xl text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-semibold backdrop-blur-md">
              <Gift className="w-3.5 h-3.5 text-amber-300" />
              <span>{isId ? 'KATALOG REWARD RESMI MITRA BRAND' : 'OFFICIAL BRAND PERKS MARKETPLACE'}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold font-serif text-white tracking-tight">
              {isId
                ? 'Tukarkan Koin LTP dengan Voucher Eksklusif Mitra Brand Ternama'
                : 'Redeem LTP Coins for Exclusive Offers from Premier Partner Brands'}
            </h1>

            <p className="text-xs sm:text-sm text-purple-100/90 leading-relaxed">
              {isId
                ? 'Gunakan koin reward yang Anda kumpulkan dari kontribusi cerita petualangan, ulasan tur autentik, dan partisipasi agenda komunitas untuk menikmati diskon menginap glamping Bobocabin, perlengkapan outdoor EIGER, voucher kopi, dan proteksi asuransi perjalanan.'
                : 'Turn your contribution coins earned from travel stories, verified reviews, and community meetups into real vouchers for glamping stays, outdoor equipment, artisanal coffee, and travel insurance.'}
            </p>

            {/* Trust Pill Tags */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-purple-200/90">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-white/10 backdrop-blur-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isId ? '100% Kemitraan Resmi' : '100% Official Partners'}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-white/10 backdrop-blur-xs">
                <Barcode className="w-3.5 h-3.5 text-amber-400" />
                <span>{isId ? 'Barcode Kasir POS' : 'POS Barcode Ready'}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-white/10 backdrop-blur-xs">
                <Coins className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isId ? 'Ekonomi Koin LTP Real' : 'Real LTP Economy'}</span>
              </span>
            </div>
          </div>

          {/* User Status Pill / Login Prompt */}
          <div className="shrink-0 w-full md:w-auto">
            {isLoggedIn ? (
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 sm:p-5 text-center sm:text-left space-y-2.5 shadow-lg">
                <div className="text-[11px] uppercase font-bold text-purple-200">
                  {isId ? 'Saldo & Reputasi Anda' : 'Your Balance & Reputation'}
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-4">
                  <div className="flex items-center gap-1.5 font-black text-amber-300 text-lg">
                    <Coins className="w-5 h-5 text-amber-400" />
                    <span>{userBalance.toLocaleString()} LTP</span>
                  </div>
                  <span className="text-purple-300">•</span>
                  <div className="flex items-center gap-1.5 font-bold text-white text-sm">
                    <Crown className="w-4 h-4 text-purple-300" />
                    <span>Level {userCurrentLevel}</span>
                  </div>
                </div>
                <div className="text-[10px] text-purple-200/80">
                  {isId ? 'Koin siap digunakan untuk klaim reward mitra' : 'Coins ready for perks redemption'}
                </div>
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-5 text-center space-y-3 shadow-lg">
                <div className="text-xs text-purple-200 font-semibold">
                  {isId ? 'Masuk untuk Menukarkan Koin LTP' : 'Sign in to Redeem LTP Coins'}
                </div>
                <Link
                  href={`/${locale}/login`}
                  className="inline-block px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-amber-950 font-bold text-xs shadow-md transition hover:scale-105"
                >
                  {isId ? 'Masuk ke Akun Anda ➔' : 'Sign In Now ➔'}
                </Link>
                <div className="text-[10px] text-purple-200/70">
                  {isId ? 'Belum punya akun? Gratis mendaftar.' : 'New to Locallytrip? Free sign up.'}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. FILTER KATEGORI TABS & B2B CALLOUT */}
      <section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none w-full sm:w-auto">
            {Object.entries(categoryLabels).map(([key, label]) => {
              const isSelected = activeTab === key;
              const count =
                key === 'ALL'
                  ? campaigns.length
                  : key === 'MY_VOUCHERS'
                  ? userClaims.length
                  : campaigns.filter((c) => c.partner.category === key).length;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleCategoryChange(key)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                    isSelected
                      ? 'bg-purple-900 text-white shadow-md'
                      : 'bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50'
                  }`}
                >
                  <span>{label.icon}</span>
                  <span>{isId ? label.id : label.en}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      isSelected ? 'bg-purple-800 text-purple-200' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <Link
            href={`/${locale}/partner-with-us`}
            className="text-xs font-bold text-purple-700 hover:text-purple-900 transition flex items-center gap-1.5 ml-auto"
          >
            <span>{isId ? 'Ingin Mempromosikan Brand Anda? ➔' : 'Partner with Us ➔'}</span>
          </Link>
        </div>
      </section>

      {/* 3. GRID KARTU PERKS VOUCHER ATAU EMPTY STATE BERMUTU TINGGI */}
      {activeTab === 'MY_VOUCHERS' ? (
        /* TAB: VOUCHER SAYA YANG SUDAH DIKLAIM */
        <section className="space-y-4">
          {userClaims.length === 0 ? (
            <div className="p-10 sm:p-14 text-center rounded-3xl bg-white border border-dashed border-slate-300 text-slate-500 space-y-4 shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                <Ticket className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  {isId ? 'Belum Ada Voucher yang Anda Klaim' : 'No Vouchers Claimed Yet'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                  {isId
                    ? 'Pilih promo yang tersedia di katalog mitra resmi dan gunakan koin LTP Anda untuk membuka voucher diskon beserta barcode kasir.'
                    : 'Choose an active offer from our verified partner catalog and use your LTP coins to unlock discount codes and barcodes.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCategoryChange('ALL')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-900 text-white font-bold text-xs shadow-md transition hover:bg-purple-950"
              >
                <span>{isId ? 'Jelajahi Penawaran Mitra Sekarang' : 'Browse Brand Perks Now'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userClaims.map((claim, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-3xl p-6 border-2 border-purple-200/90 shadow-sm space-y-4 relative overflow-hidden flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Top Status & Category Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{isId ? 'Voucher Aktif' : 'Active Voucher'}</span>
                        </span>
                        {claim.partner_category && (
                          <span className="text-[10px] font-semibold text-slate-500 uppercase px-2 py-0.5 rounded bg-slate-100">
                            {claim.partner_category}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(claim.claimed_at).toLocaleDateString(isId ? 'id-ID' : 'en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    {/* Brand & Campaign Title */}
                    <div>
                      <div className="text-xs font-bold text-purple-700">
                        {claim.partner_name || 'Locallytrip Partner'}
                      </div>
                      <h4 className="font-bold text-base text-slate-900 mt-0.5 line-clamp-1">
                        {claim.campaign_title || claim.partner_name || 'Voucher Mitra'}
                      </h4>
                    </div>

                    {/* Voucher Box with Copy */}
                    <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 flex items-center justify-between gap-3">
                      <span className="font-mono font-black text-lg text-purple-950 tracking-wider">
                        {claim.voucher_code}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(claim.voucher_code)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                          copiedCode === claim.voucher_code
                            ? 'bg-emerald-600 text-white'
                            : 'bg-purple-900 text-white hover:bg-purple-950'
                        }`}
                      >
                        {copiedCode === claim.voucher_code ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{isId ? 'Tersalin' : 'Copied'}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>{isId ? 'Salin Kode' : 'Copy'}</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Barcode & QR Code Display */}
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Barcode className="w-3.5 h-3.5 text-purple-600" />
                        <span>{isId ? 'Pindai Barcode / QR Kasir' : 'Scan Barcode / QR'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <BarcodeView code={claim.voucher_code} />
                        </div>
                        <QrCodeBox code={claim.voucher_code} />
                      </div>
                    </div>

                    {/* Redemption Instructions (Offline & Online) */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-600">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-purple-600" />
                        <span>{isId ? 'Panduan Cara Penukaran:' : 'How to Redeem:'}</span>
                      </div>

                      <div className="space-y-1.5 text-[11px] leading-relaxed">
                        <div className="flex items-start gap-1.5">
                          <Store className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-slate-800">
                              {isId ? 'Gerai Fisik / Kasir Outlet:' : 'Offline Outlet:'}
                            </strong>{' '}
                            {isId
                              ? 'Tunjukkan barcode atau kode voucher ini ke kasir gerai resmi saat pembayaran.'
                              : 'Show this barcode or quote code to cashier at official partner branches.'}
                          </div>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-slate-800">
                              {isId ? 'Belanja Online Mitra:' : 'Online Brand Website:'}
                            </strong>{' '}
                            {isId
                              ? 'Masukkan kode voucher ini pada kolom "Kode Promo" saat checkout.'
                              : 'Enter this voucher code in promo/coupon field at online checkout.'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {claim.terms && (
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed italic">
                        {claim.terms}
                      </p>
                    )}
                  </div>

                  {/* Cetak / Download Action Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setPrintableClaim(claim)}
                      className="w-full py-2.5 px-4 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 font-bold text-xs flex items-center justify-center gap-2 transition"
                    >
                      <Printer className="w-4 h-4 text-purple-700" />
                      <span>
                        {isId ? 'Cetak / Unduh Voucher (PDF)' : 'Print / Download Voucher (PDF)'}
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : (
        /* KATALOG KARTU VOUCHER DARI DATABASE ATAU FALLBACK EEAT BERKUALITAS TINGGI */
        <section className="space-y-6">
          {campaigns.length === 0 ? (
            /* KONDISI 1: ZERO DATA TOTAL DARI DATABASE -> EEAT & SEO / AIO FALLBACK SECTION */
            <div className="p-8 sm:p-12 rounded-3xl bg-white border border-purple-100 shadow-sm space-y-8 text-center sm:text-left">
              <div className="max-w-3xl space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-800 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>{isId ? 'Kurasi Kemitraan Musiman' : 'Seasonal Partnership Curation'}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-serif">
                  {isId
                    ? 'Katalog Hadiah Mitra Sedang Dalam Tahap Kurasi & Rilis Kuota Baru'
                    : 'Partner Perks Catalog is Currently Under Seasonal Curation'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {isId
                    ? 'PT Locallytrip Teknologi Indonesia menerapkan standar seleksi ketat (EEAT) untuk setiap mitra brand yang bergabung. Seluruh voucher diskon staycation glamping, perlengkapan outdoor, dan kuliner diverifikasi langsung dengan manajemen brand principal guna menjamin keaslian 100% tanpa biaya tersembunyi.'
                    : 'Locallytrip applies rigorous curation standards (EEAT) for every onboarded brand partner. All discount vouchers for glamping stays, outdoor gear, and dining are directly authenticated with corporate brand principals to guarantee 100% validity.'}
                </p>
              </div>

              {/* 3 Actionable Benefit Cards for Travelers */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {isId ? '1. Bagikan Cerita & Dapatkan LTP' : '1. Share Stories & Earn LTP'}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {isId
                      ? 'Dapatkan hingga +150 LTP untuk setiap artikel perjalanan autentik yang Anda publikasikan di komunitas.'
                      : 'Earn up to +150 LTP for each authentic travel story published in our explorer community.'}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Award className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {isId ? '2. Naikkan Level XP Reputasi' : '2. Increase XP Reputation'}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {isId
                      ? 'Tingkatkan level akun Anda untuk membuka akses ke voucher tier premium eksklusif bagi member Level 2 ke atas.'
                      : 'Level up your profile to unlock exclusive premium tier vouchers reserved for Level 2+ members.'}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {isId ? '3. Terenkripsi Kasir Resmi' : '3. Encrypted POS Vouchers'}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {isId
                      ? 'Setiap kode voucher dilengkapi barcode kasir terenkripsi untuk kemudahan penukaran di seluruh gerai fisik Indonesia.'
                      : 'Each voucher includes POS barcode encryption for hassle-free redemption at physical branches.'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href={`/${locale}/community/stories`}
                  className="px-5 py-2.5 rounded-xl bg-purple-900 text-white font-bold text-xs shadow-md transition hover:bg-purple-950 flex items-center gap-2"
                >
                  <Compass className="w-4 h-4" />
                  <span>{isId ? 'Jelajahi Cerita Komunitas' : 'Explore Community Stories'}</span>
                </Link>

                <Link
                  href={`/${locale}/partner-with-us`}
                  className="px-5 py-2.5 rounded-xl bg-white border border-purple-200 text-purple-900 font-bold text-xs hover:bg-purple-50 transition flex items-center gap-2"
                >
                  <Building2 className="w-4 h-4 text-purple-700" />
                  <span>{isId ? 'Daftarkan Brand Anda' : 'Register Your Brand'}</span>
                </Link>
              </div>
            </div>
          ) : filteredCampaigns.length === 0 ? (
            /* KONDISI 2: KATEGORI TERTENTU TIDAK ADA ITEM SAAT INI */
            <div className="p-10 text-center rounded-3xl bg-white border border-slate-200 text-slate-600 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center mx-auto">
                <Filter className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-base font-bold text-slate-900">
                  {isId
                    ? `Belum Ada Voucher Aktif untuk Kategori Ini`
                    : `No Active Vouchers in this Category`}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {isId
                    ? 'Penawaran untuk kategori ini sedang dalam tahap kurasi kemitraan berikutnya. Jelajahi kategori lainnya atau kembali ke semua penawaran.'
                    : 'Perks for this category are being updated for the next curation cycle. Browse other categories or view all offers.'}
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleCategoryChange('ALL')}
                  className="px-4 py-2 rounded-xl bg-purple-900 text-white font-bold text-xs hover:bg-purple-950 transition"
                >
                  {isId ? 'Lihat Semua Kategori' : 'View All Categories'}
                </button>
                <Link
                  href={`/${locale}/partner-with-us`}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition"
                >
                  {isId ? 'Rekomendasikan Mitra' : 'Recommend Partner'}
                </Link>
              </div>
            </div>
          ) : (
            /* KONDISI 3: ADA DATA REAL DARI DATABASE -> RENDER KARTU DENGAN SEMANTIK SEO */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCampaigns.map((camp) => {
                const isClaimedByMe = userClaims.some((c) => c.campaign_id === camp.id);
                const isOutOfStock = camp.remaining_vouchers <= 0;

                const quotaPercent = Math.min(
                  100,
                  Math.round((camp.claimed_quota / Math.max(1, camp.total_quota)) * 100)
                );

                return (
                  <article
                    key={camp.id}
                    className={`bg-white rounded-3xl border transition flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-lg ${
                      camp.is_featured
                        ? 'border-amber-400 ring-2 ring-amber-400/20'
                        : 'border-slate-200/90'
                    }`}
                  >
                    <div>
                      {/* Image Cover with Badges */}
                      <div className="relative w-full h-44 bg-slate-200 overflow-hidden">
                        <Image
                          src={camp.image_url}
                          alt={camp.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 640px) 100vw, 380px"
                        />

                        {/* Top Overlay Badges */}
                        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
                          {camp.is_featured && (
                            <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-amber-950 font-black text-[10px] uppercase tracking-wider shadow-md flex items-center gap-1">
                              <Star className="w-3 h-3 fill-amber-950" />
                              <span>FEATURED</span>
                            </span>
                          )}

                          <span className="px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-xs text-white font-bold text-[10px]">
                            {camp.partner.category}
                          </span>
                        </div>

                        {/* Cost Badge */}
                        <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-slate-900/90 backdrop-blur-md text-amber-300 font-black text-xs shadow-md flex items-center gap-1.5 border border-amber-400/30">
                          <Coins className="w-3.5 h-3.5 text-amber-400" />
                          <span>
                            {camp.cost_in_ltp > 0
                              ? `${camp.cost_in_ltp.toLocaleString()} LTP`
                              : isId
                              ? 'GRATIS'
                              : 'FREE'}
                          </span>
                        </div>
                      </div>

                      {/* Content Info */}
                      <div className="p-5 sm:p-6 space-y-3.5">
                        {/* Brand Header */}
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden shrink-0 border border-slate-200 relative">
                            <Image
                              src={camp.partner.logo_url}
                              alt={camp.partner.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <span className="font-bold text-xs text-slate-700 truncate">
                            {camp.partner.name}
                          </span>
                        </div>

                        {/* Title & Description */}
                        <div>
                          <h3 className="font-bold text-base text-slate-900 line-clamp-2 leading-snug">
                            {camp.title}
                          </h3>
                          <p className="text-xs text-slate-600 line-clamp-2 mt-1.5 leading-relaxed">
                            {camp.description}
                          </p>
                        </div>

                        {/* Requirements Badges */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                          <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 font-semibold flex items-center gap-1">
                            <Crown className="w-3 h-3" />
                            <span>
                              {isId ? `Min. Level ${camp.min_xp_level}` : `Min. LV ${camp.min_xp_level}`}
                            </span>
                          </span>

                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-medium flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>
                              {isId ? 'Berlaku s.d. ' : 'Valid until '}
                              {new Date(camp.end_date).toLocaleDateString(isId ? 'id-ID' : 'en-US', {
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </span>
                        </div>

                        {/* Quota Progress Meter */}
                        <div className="space-y-1.5 pt-2">
                          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                            <span>
                              {isOutOfStock
                                ? isId
                                  ? 'Habis Diklaim'
                                  : 'Sold Out'
                                : isId
                                ? `Tersisa ${camp.remaining_vouchers} voucher`
                                : `${camp.remaining_vouchers} left`}
                            </span>
                            <span>{quotaPercent}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isOutOfStock
                                  ? 'bg-rose-500'
                                  : quotaPercent > 70
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${quotaPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Button */}
                    <div className="p-5 sm:p-6 pt-0">
                      {isClaimedByMe ? (
                        <button
                          type="button"
                          onClick={() => handleOpenClaimModal(camp)}
                          className="w-full py-3 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs sm:text-sm border border-emerald-200 transition flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>{isId ? 'Lihat Kode Voucher Anda' : 'View Your Voucher'}</span>
                        </button>
                      ) : isOutOfStock ? (
                        <button
                          type="button"
                          disabled
                          className="w-full py-3 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs sm:text-sm cursor-not-allowed"
                        >
                          {isId ? 'Kuota Voucher Habis' : 'Voucher Sold Out'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenClaimModal(camp)}
                          className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-900 to-indigo-900 hover:from-purple-950 hover:to-indigo-950 text-white font-bold text-xs sm:text-sm shadow-md transition active:scale-95 flex items-center justify-center gap-1.5"
                        >
                          <span>{isId ? 'Tukarkan Sekarang' : 'Redeem Now'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* 4. MODAL KONFIRMASI & PENUKARAN VOUCHER */}
      {selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 relative max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedCampaign(null)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {claimedResult ? (
              /* SUDAH / BERHASIL DIKLAIM: TAMPILKAN KODE */
              <div className="space-y-5 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-bold font-serif text-slate-900">
                    {isId ? 'Voucher Berhasil Dibuka!' : 'Voucher Unlocked!'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {claimedResult.campaignTitle || selectedCampaign.title}
                  </p>
                </div>

                {/* Kode Voucher Unik Box */}
                <div className="p-4 rounded-2xl bg-purple-50 border-2 border-purple-300 space-y-3">
                  <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block">
                    {isId ? 'KODE VOUCHER ANDA' : 'YOUR VOUCHER CODE'}
                  </span>
                  <div className="flex items-center justify-center gap-3">
                    <span className="font-mono font-black text-2xl text-purple-950 tracking-widest select-all">
                      {claimedResult.voucherCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(claimedResult.voucherCode)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        copiedCode === claimedResult.voucherCode
                          ? 'bg-emerald-600 text-white'
                          : 'bg-purple-900 hover:bg-purple-950 text-white'
                      }`}
                    >
                      {copiedCode === claimedResult.voucherCode ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isId ? 'Tersalin' : 'Copied'}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>{isId ? 'Salin Kode' : 'Copy Code'}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Barcode & QR Box */}
                  <div className="flex items-center gap-2 pt-1">
                    <div className="flex-1">
                      <BarcodeView code={claimedResult.voucherCode} />
                    </div>
                    <QrCodeBox code={claimedResult.voucherCode} />
                  </div>
                </div>

                {/* Redemption Instructions (Offline & Online) */}
                <div className="text-left p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-600">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-purple-600" />
                    <span>{isId ? 'Panduan Penggunaan:' : 'How to Use:'}</span>
                  </div>
                  <div className="space-y-1.5 text-[11px] leading-relaxed">
                    <div className="flex items-start gap-1.5">
                      <Store className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-800">{isId ? 'Offline (Gerai):' : 'Offline Store:'}</strong>{' '}
                        {isId
                          ? 'Tunjukkan barcode ini kepada kasir saat pembayaran.'
                          : 'Show this barcode to the cashier when paying.'}
                      </div>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-800">{isId ? 'Online (Web/App):' : 'Online Store:'}</strong>{' '}
                        {isId
                          ? 'Masukkan kode ini pada kolom kupon promo saat checkout.'
                          : 'Enter this code in promo/coupon field at online checkout.'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Syarat & Ketentuan Penggunaan */}
                {claimedResult.terms && (
                  <div className="text-left p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 text-xs text-slate-500">
                    <div className="font-bold text-slate-700">
                      {isId ? 'Syarat & Ketentuan:' : 'Terms & Conditions:'}
                    </div>
                    <p className="whitespace-pre-line text-[11px] leading-relaxed italic">
                      {claimedResult.terms}
                    </p>
                  </div>
                )}

                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPrintableClaim({
                        campaign_id: selectedCampaign.id,
                        voucher_code: claimedResult.voucherCode,
                        claimed_at: new Date().toISOString(),
                        campaign_title: claimedResult.campaignTitle || selectedCampaign.title,
                        partner_name: claimedResult.partnerName || selectedCampaign.partner.name,
                        partner_logo: claimedResult.partnerLogo || selectedCampaign.partner.logo_url,
                        partner_category: claimedResult.partnerCategory || selectedCampaign.partner.category,
                        terms: claimedResult.terms || selectedCampaign.terms,
                      });
                    }}
                    className="flex-1 py-3 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5"
                  >
                    <Printer className="w-4 h-4 text-purple-700" />
                    <span>{isId ? 'Cetak / Unduh (PDF)' : 'Print / Download (PDF)'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCampaign(null)}
                    className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm transition"
                  >
                    {isId ? 'Selesai & Tutup' : 'Done & Close'}
                  </button>
                </div>
              </div>
            ) : (
              /* PROSES KONFIRMASI KLAIM VOUCHER */
              <div className="space-y-5">
                <div className="space-y-2">
                  <div className="inline-block px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold text-[11px]">
                    {selectedCampaign.partner.name}
                  </div>
                  <h3 className="text-xl font-bold font-serif text-slate-900">
                    {selectedCampaign.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {selectedCampaign.description}
                  </p>
                </div>

                {/* Detail Penukaran Box */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{isId ? 'Biaya Penukaran:' : 'Redemption Cost:'}</span>
                    <span className="font-black text-amber-800 flex items-center gap-1">
                      <Coins className="w-4 h-4 text-amber-500" />
                      {selectedCampaign.cost_in_ltp > 0
                        ? `${selectedCampaign.cost_in_ltp.toLocaleString()} LTP`
                        : isId
                        ? 'GRATIS'
                        : 'FREE'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{isId ? 'Minimal Reputasi:' : 'Required Tier:'}</span>
                    <span className="font-bold text-purple-700 flex items-center gap-1">
                      <Crown className="w-4 h-4 text-purple-500" />
                      Level {selectedCampaign.min_xp_level}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <span className="text-slate-500">{isId ? 'Saldo Anda Saat Ini:' : 'Your Current Balance:'}</span>
                    <span className="font-bold text-slate-800">
                      {userBalance.toLocaleString()} LTP (Level {userCurrentLevel})
                    </span>
                  </div>
                </div>

                {claimError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{claimError}</span>
                  </div>
                )}

                {/* Tombol Aksi */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCampaign(null)}
                    disabled={isClaiming}
                    className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition disabled:opacity-50"
                  >
                    {isId ? 'Batal' : 'Cancel'}
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmClaim}
                    disabled={isClaiming}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-900 to-indigo-900 hover:from-purple-950 hover:to-indigo-950 text-white font-extrabold text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {isClaiming ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{isId ? 'Memproses Klaim...' : 'Processing...'}</span>
                      </>
                    ) : (
                      <>
                        <span>{isId ? 'Konfirmasi & Buka Voucher' : 'Confirm & Unlock'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. MODAL PRINTABLE VOUCHER TICKET (PDF / CETAK RESMI) */}
      <PerkVoucherPrintModal
        claim={printableClaim}
        isOpen={Boolean(printableClaim)}
        onClose={() => setPrintableClaim(null)}
        isId={isId}
      />

      {/* 6. EDUKASI, EEAT, AEO, GEO & PANDUAN PENGGUNAAN PERKS */}
      <section className="space-y-10 pt-6 border-t border-slate-200/80">
        {/* PANDUAN 3 LANGKAH EKOSISTEM LOYALITAS */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-sm space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold">
              <Compass className="w-3.5 h-3.5" />
              <span>{isId ? 'PANDUAN TRAVELER' : 'TRAVELER GUIDE'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900">
              {isId
                ? 'Cara Kerja Ekosistem Koin LTP & Penukaran Hadiah Mitra'
                : 'How the LTP Reward Ecosystem & Perks Redemption Works'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
              {isId
                ? 'Komunitas Locallytrip memberikan apresiasi nyata atas waktu dan cerita perjalanan yang Anda bagikan. Koin LTP bukanlah mata uang virtual tanpa fungsi, melainkan tiket reward untuk mendapatkan diskon riil di mitra terpercaya.'
                : 'The Locallytrip community offers tangible rewards for your contributions. LTP coins unlock authentic discounts at verified partners across Indonesia.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="p-5 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-900 text-white font-black text-sm flex items-center justify-center">
                1
              </div>
              <h3 className="font-bold text-sm text-slate-900">
                {isId ? 'Kumpulkan Koin & XP' : 'Earn Coins & XP'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isId
                  ? 'Publikasikan cerita petualangan orisinal (+150 LTP), berikan review jujur atas open trip yang Anda ikuti (+50 LTP), atau ikuti meetup lokal (+100 LTP).'
                  : 'Publish original travel stories (+150 LTP), write verified tour reviews (+50 LTP), or attend local community meetups (+100 LTP).'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-900 text-white font-black text-sm flex items-center justify-center">
                2
              </div>
              <h3 className="font-bold text-sm text-slate-900">
                {isId ? 'Buka Akses Voucher Resmi' : 'Unlock Official Voucher'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isId
                  ? 'Pilih promo yang Anda inginkan pada katalog ini. Sistem akan mengurangi saldo LTP Anda dan menerbitkan kode voucher unik beserta barcode kasir.'
                  : 'Select your preferred campaign. Your LTP balance will be deducted and an encrypted POS barcode voucher will be generated.'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-900 text-white font-black text-sm flex items-center justify-center">
                3
              </div>
              <h3 className="font-bold text-sm text-slate-900">
                {isId ? 'Gunakan di Kasir atau Online' : 'Redeem Offline or Online'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isId
                  ? 'Tunjukkan barcode voucher ke kasir outlet Bobocabin, EIGER, atau Kopi Kenangan, atau masukkan kode promo saat memesan online di website resmi mitra.'
                  : 'Present the barcode to cashiers at partner stores or paste the promo code at checkout on official partner websites.'}
              </p>
            </div>
          </div>
        </div>

        {/* STANDAR KURASI & INTEGRITAS EEAT (EXPERIENCE, EXPERTISE, AUTHORITATIVENESS, TRUST) */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl p-6 sm:p-10 text-white border border-slate-800 space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isId ? 'STANDAR KEPERCAYAAN & KEASLIAN (EEAT)' : 'TRUST & AUTHENTICITY STANDARD'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-white">
              {isId
                ? 'Jaminan Integritas & Keamanan Mitra Brand Locallytrip'
                : 'Locallytrip Partner Quality & Security Guarantee'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              {isId
                ? 'Seluruh voucher di Locallytrip Perks dikurasi langsung oleh PT Locallytrip Teknologi Indonesia di bawah perjanjian kemitraan resmi. Kami menjamin transparansi tanpa biaya siluman bagi seluruh penjelajah.'
                : 'All perks are directly vetted and authenticated under formal corporate agreements. We guarantee transparency and zero hidden fees for all travelers.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="text-emerald-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-4 h-4" />
                <span>{isId ? 'Badan Usaha Resmi' : 'Verified Entities'}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isId
                  ? 'Bermitra resmi dengan prinsipal brand terdaftar (PT/CV) di Indonesia.'
                  : 'Official partnerships with registered corporate brand entities in Indonesia.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="text-amber-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Barcode className="w-4 h-4" />
                <span>{isId ? 'Barcode Terenkripsi' : 'Encrypted Barcodes'}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isId
                  ? 'Setiap kode voucher unik dan terlindungi dari manipulasi atau duplikasi.'
                  : 'Each voucher code is cryptographically unique to prevent double-spending.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="text-cyan-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>{isId ? 'Tanpa Biaya Siluman' : 'No Hidden Fees'}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isId
                  ? 'Voucher dapat digunakan sesuai syarat & ketentuan tertulis tanpa pungutan tak terduga.'
                  : 'All terms are transparently stated with zero unexpected surcharges.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="text-purple-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Store className="w-4 h-4" />
                <span>{isId ? '1.200+ Gerai Kasir' : '1,200+ Outlets'}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isId
                  ? 'Dukungan penerimaan voucher di ribuan jaringan fisik dan online di tanah air.'
                  : 'Redeemable across thousands of physical POS branches and online checkouts.'}
              </p>
            </div>
          </div>
        </div>

        {/* TANYA JAWAB (FAQ) INTERAKTIF - AEO & GEO READY */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-sm space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{isId ? 'TANYA JAWAB UMUM (FAQ)' : 'FREQUENTLY ASKED QUESTIONS'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900">
              {isId
                ? 'Pertanyaan yang Sering Diajukan Seputar Hadiah Mitra'
                : 'Common Questions About Brand Perks & Loyalty Rewards'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-3xl leading-relaxed">
              {isId
                ? 'Pelajari lebih lanjut mengenai cara penukaran koin, masa berlaku voucher, dan kebijakan keamanan komunitas Locallytrip.'
                : 'Learn more about coin redemption mechanics, voucher validity, and platform security policies.'}
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {faqList.map((item, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-200 overflow-hidden transition"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 bg-slate-50/50 hover:bg-slate-50 transition"
                  >
                    <span className="font-bold text-xs sm:text-sm text-slate-800">
                      {item.q}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-purple-700' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="p-4 sm:p-5 pt-0 text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50/50 border-t border-slate-200/60">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* B2B / MERCHANT CTA BANNER */}
        <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-3xl p-6 sm:p-10 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
          <div className="space-y-2 text-center sm:text-left">
            <h3 className="text-lg sm:text-xl font-bold font-serif">
              {isId
                ? 'Apakah Anda Pemilik Brand Wisata, Glamping, atau Kafe?'
                : 'Are You a Hospitality, Cafe, or Outdoor Brand Owner?'}
            </h3>
            <p className="text-xs sm:text-sm text-purple-100 max-w-xl leading-relaxed">
              {isId
                ? 'Promosikan voucher dan penawaran brand Anda langsung ke hadapan puluhan ribu traveler aktif di Indonesia melalui ekosistem barter reward Locallytrip.'
                : 'Promote your offers directly to tens of thousands of active Indonesian travelers through Locallytrip’s community reward ecosystem.'}
            </p>
          </div>
          <Link
            href={`/${locale}/partner-with-us`}
            className="shrink-0 px-6 py-3 rounded-xl bg-white text-purple-950 font-bold text-xs sm:text-sm hover:bg-purple-50 transition shadow-lg active:scale-95"
          >
            {isId ? 'Daftar Kemitraan Brand ➔' : 'Join as Partner ➔'}
          </Link>
        </div>
      </section>
    </div>
  );
}
