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

  // Filter Kampanye
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

  return (
    <div className="space-y-10 sm:space-y-12">
      {/* 1. HERO BANNER KATALOG PERKS */}
      <section className="bg-gradient-to-br from-slate-900 via-purple-950 to-indigo-950 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden border border-purple-800/40">
        <div className="absolute top-0 right-10 -mt-16 w-80 h-80 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 -mb-16 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-semibold backdrop-blur-md">
              <Gift className="w-3.5 h-3.5 text-amber-300" />
              <span>{isId ? 'KATALOG REWARD & HADIAH MITRA' : 'BRAND PERKS & VOUCHER MARKETPLACE'}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold font-serif text-white tracking-tight">
              {isId
                ? 'Tukarkan Koin LTP dengan Penawaran Eksklusif dari Mitra Brand Ternama'
                : 'Redeem LTP Coins for Exclusive Offers from Premier Partner Brands'}
            </h1>

            <p className="text-xs sm:text-sm text-purple-100/85 leading-relaxed">
              {isId
                ? 'Gunakan koin reward yang Anda kumpulkan dari cerita perjalanan, agenda meetup, dan kontribusi komunitas untuk menikmati voucher diskon staycation, perlengkapan gunung, hingga voucher kuliner.'
                : 'Turn your contribution coins earned from travel stories, meetups, and forum answers into real vouchers for glamping stays, outdoor equipment, and specialty dining.'}
            </p>
          </div>

          {/* User Status Pill / Login Prompt */}
          <div className="shrink-0 w-full md:w-auto">
            {isLoggedIn ? (
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 sm:p-5 text-center sm:text-left space-y-2">
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
                <div className="text-[10px] text-purple-200/70">
                  {isId ? 'Koin siap digunakan untuk klaim voucher' : 'Coins ready for perks redemption'}
                </div>
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 sm:p-5 text-center space-y-2.5">
                <div className="text-xs text-purple-200 font-semibold">
                  {isId ? 'Masuk untuk Menukarkan Koin' : 'Sign in to Redeem Coins'}
                </div>
                <Link
                  href={`/${locale}/login`}
                  className="inline-block px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-amber-950 font-bold text-xs shadow-md transition hover:scale-105"
                >
                  {isId ? 'Masuk ke Akun ➔' : 'Sign In Now ➔'}
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. FILTER KATEGORI TABS */}
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

      {/* 3. GRID KARTU PERKS VOUCHER */}
      {activeTab === 'MY_VOUCHERS' ? (
        /* TAB: VOUCHER SAYA YANG SUDAH DIKLAIM */
        <section className="space-y-4">
          {userClaims.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-dashed border-slate-200 text-slate-500 space-y-3">
              <Ticket className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">
                {isId ? 'Belum Ada Voucher yang Diklaim' : 'No Vouchers Claimed Yet'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {isId
                  ? 'Jelajahi penawaran menarik dari mitra brand ternama dan tukarkan koin LTP Anda.'
                  : 'Browse brand offers and redeem your LTP coins for exclusive discounts.'}
              </p>
              <button
                type="button"
                onClick={() => handleCategoryChange('ALL')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-900 text-white font-bold text-xs shadow-md transition hover:bg-purple-950"
              >
                <span>{isId ? 'Jelajahi Penawaran Mitra' : 'Browse Brand Perks'}</span>
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
        /* KATALOG KARTU VOUCHER UMUM */
        <section className="space-y-6">
          {filteredCampaigns.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 text-slate-500">
              <p className="text-sm">
                {isId ? 'Belum ada voucher untuk kategori ini.' : 'No vouchers in this category yet.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCampaigns.map((camp) => {
                const isClaimedByMe = userClaims.some((c) => c.campaign_id === camp.id);
                const isOutOfStock = camp.remaining_vouchers <= 0;
                const canAfford = userBalance >= camp.cost_in_ltp;
                const meetsLevel = userCurrentLevel >= camp.min_xp_level;

                const quotaPercent = Math.min(
                  100,
                  Math.round((camp.claimed_quota / Math.max(1, camp.total_quota)) * 100)
                );

                return (
                  <div
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
                  </div>
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
    </div>
  );
}
