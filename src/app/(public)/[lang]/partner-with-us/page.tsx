import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Target,
  Award,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Building2,
  Users,
  BarChart3,
  Coins,
  Compass,
  Star,
  Zap,
} from 'lucide-react';

interface PartnerWithUsPageProps {
  params: Promise<{
    lang: string;
  }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const lang = resolvedParams.lang === 'en' ? 'en' : 'id';
  const isId = lang === 'id';

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://locallytrip.com';
  const canonicalUrl = `${siteUrl}/${lang}/partner-with-us`;

  const title = isId
    ? 'Kemitraan Brand & Barter Promosi Perks | Locallytrip'
    : 'Brand Partnerships & Community Perks Marketplace | Locallytrip';

  const description = isId
    ? 'Perluas jangkauan brand Anda ke ribuan penjelajah aktif dan local host terverifikasi di Indonesia melalui model barter voucher LTP atau slot promosi featured partner.'
    : 'Expand your brand reach to verified travelers and local hosts across Indonesia through our LTP barter perks marketplace and featured sponsor slots.';

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'id-ID': `${siteUrl}/id/partner-with-us`,
        'en-US': `${siteUrl}/en/partner-with-us`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Locallytrip Partnerships',
      locale: isId ? 'id_ID' : 'en_US',
      type: 'website',
      images: [
        {
          url: `${siteUrl}/images/rewards/hero-earning-traveler.png`,
          width: 1200,
          height: 630,
          alt: 'Locallytrip Brand Partnerships',
        },
      ],
    },
  };
}

export default async function PartnerWithUsPage({ params }: PartnerWithUsPageProps) {
  const resolvedParams = await params;
  const locale = resolvedParams.lang === 'en' ? 'en' : 'id';
  const isId = locale === 'id';

  return (
    <div className="w-full min-h-screen bg-slate-50/50 py-8 sm:py-12">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        {/* 1. BREADCRUMBS */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 font-medium"
        >
          <Link href={`/${locale}`} className="hover:text-purple-700 transition">
            {isId ? 'Beranda' : 'Home'}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500">{isId ? 'Mitra & Bisnis' : 'Partners & Business'}</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-semibold">{isId ? 'Kerjasama Brand' : 'Brand Partnerships'}</span>
        </nav>

        {/* 2. HERO SECTION B2B 2-KOLOM */}
        <section className="bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950 rounded-3xl p-6 sm:p-10 lg:p-12 text-white shadow-xl relative overflow-hidden border border-purple-800/40">
          <div className="absolute top-0 right-1/4 -mt-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 -mb-20 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
            {/* Kolom Kiri: Teks & Nilai Utama */}
            <div className="lg:col-span-7 space-y-5 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-semibold backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{isId ? 'B2B BRAND PARTNERSHIP & PERKS' : 'B2B BRAND PARTNERSHIP & PERKS'}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-serif tracking-tight leading-[1.15] text-white">
                {isId
                  ? 'Perluas Jangkauan Brand Anda ke Komunitas Penjelajah & Local Host Terverifikasi'
                  : "Expand Your Brand's Reach to Verified Explorers & Local Hosts"}
              </h1>

              <p className="text-sm sm:text-base text-purple-100/85 leading-relaxed max-w-2xl">
                {isId
                  ? 'Distribusikan produk, voucher diskon staycation, perlengkapan outdoor, dan kuliner terbaik Anda langsung kepada komunitas petualang dengan model barter koin LTP tanpa biaya komisi, atau maksimalkan visibilitas melalui paket Featured Partner.'
                  : 'Distribute your outdoor gear, staycation vouchers, dining perks, and travel goods directly to active travelers and certified local guides using our zero-fee LTP barter model or featured partner placements.'}
              </p>

              {/* Badges Sorotan */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
                <span className="px-3 py-1 rounded-lg bg-white/10 border border-white/15 text-purple-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>{isId ? '100% Pengguna & Host Nyata' : '100% Real Users & Hosts'}</span>
                </span>
                <span className="px-3 py-1 rounded-lg bg-white/10 border border-white/15 text-purple-200 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span>{isId ? 'Model Barter Koin LTP' : 'LTP Barter Ecosystem'}</span>
                </span>
                <span className="px-3 py-1 rounded-lg bg-white/10 border border-white/15 text-purple-200 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  <span>{isId ? 'ROI Terukur Real-Time' : 'Measurable Claim ROI'}</span>
                </span>
              </div>

              {/* Baris CTA */}
              <div className="pt-3 flex flex-wrap items-center gap-3">
                <Link
                  href={`/${locale}/partner-with-us/apply`}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs sm:text-sm shadow-md transition active:scale-95"
                >
                  <span>{isId ? 'Daftar Sebagai Mitra Brand Sekarang ➔' : 'Apply as Brand Partner Now ➔'}</span>
                </Link>

                <Link
                  href={`/${locale}/community/perks`}
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/20 transition active:scale-95"
                >
                  <span>{isId ? 'Lihat Katalog Hadiah Mitra' : 'View Brand Perks Catalog'}</span>
                </Link>
              </div>
            </div>

            {/* Kolom Kanan: Card Showcase Mitra Brand */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 sm:p-7 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/15 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-emerald-300">
                      {isId ? 'Ekosistem Mitra Aktif' : 'Active Partner Network'}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-purple-200">
                    Locallytrip B2B Perks
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="p-3 rounded-2xl bg-white/10 border border-white/10 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-black text-lg">
                      ⛺
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white line-clamp-1">Bobocabin by Bobobox</div>
                      <div className="text-[11px] text-purple-200">Voucher Rp 150.000 • 500 LTP</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-amber-400 text-amber-950 font-black text-[10px]">
                      FEATURED
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/10 border border-white/10 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-400/20 text-emerald-300 flex items-center justify-center font-black text-lg">
                      🎒
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white line-clamp-1">EIGER Adventure</div>
                      <div className="text-[11px] text-purple-200">Diskon 30% Gear • 300 LTP</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-amber-400 text-amber-950 font-black text-[10px]">
                      FEATURED
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/10 border border-white/10 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-400/20 text-purple-300 flex items-center justify-center font-black text-lg">
                      ☕
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white line-clamp-1">Kopi Kenangan</div>
                      <div className="text-[11px] text-purple-200">Free Upgrade Cup • 100 LTP</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-purple-300/30 text-purple-100 font-bold text-[10px]">
                      BARTER
                    </span>
                  </div>
                </div>

                <div className="pt-2 text-center text-xs text-purple-200/80">
                  {isId
                    ? 'Bergabunglah bersama brand ternama di sektor travel & hospitality!'
                    : 'Join top hospitality, gear, and dining brands on Locallytrip!'}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. VALUE PROPOSITION: 3 PILAR KEUNGGULAN MITRA */}
        <section className="space-y-6">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900">
              {isId ? 'Mengapa Bermitra dengan Locallytrip?' : 'Why Partner with Locallytrip?'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              {isId
                ? 'Kami menghadirkan platform interaktif dua sisi yang mempertemukan brand Anda dengan konsumen yang paling relevan.'
                : 'A curated two-sided marketplace connecting your offerings directly with high-intent travel enthusiasts.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pilar 1 */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs hover:shadow-md transition space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center text-2xl font-bold">
                <Target className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="font-serif font-bold text-lg text-slate-900">
                {isId ? '1. Target Audiens Spesifik' : '1. Highly Targeted Audience'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {isId
                  ? 'Bukan sembarang audiens internet. Pengguna Locallytrip adalah wisatawan aktif, solo traveler, dan local host terverifikasi KYC yang siap melakukan perjalanan darat, eksplorasi kuliner, dan staycation.'
                  : 'Reach active travelers and licensed hosts with proven purchase intent, genuine interest in outdoor exploration, and authentic dining experiences.'}
              </p>
            </div>

            {/* Pilar 2 */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs hover:shadow-md transition space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center text-2xl font-bold">
                <TrendingUp className="w-7 h-7 text-amber-600" />
              </div>
              <h3 className="font-serif font-bold text-lg text-slate-900">
                {isId ? '2. Keterlibatan (Engagement) Tinggi' : '2. Gamified High Engagement'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {isId
                  ? 'Melalui gamifikasi koin LTP dan reputasi level XP, pengguna termotivasi untuk secara aktif menukarkan poin reward hasil kontribusi perjalanan mereka dengan voucher penawaran brand Anda.'
                  : 'Vouchers are perceived as earned privileges through our LTP tokenomics and XP tiers, driving substantially higher redemption and retention rates.'}
              </p>
            </div>

            {/* Pilar 3 */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs hover:shadow-md transition space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-2xl font-bold">
                <BarChart3 className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="font-serif font-bold text-lg text-slate-900">
                {isId ? '3. ROI & Atribusi Transparan' : '3. Measurable Real-Time ROI'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {isId
                  ? 'Setiap kode voucher yang disetor dilacak secara individual. Anda mendapatkan visibilitas penuh kapan voucher diklaim, siapa yang mengklaim, dan rasio konversi kampanye secara transparan.'
                  : 'Track voucher claims, user profiles, and conversion metrics in real-time with zero ambiguity, giving your brand crystal-clear attribution.'}
              </p>
            </div>
          </div>
        </section>

        {/* 4. TABEL PERBANDINGAN PAKET (BARTER VS FEATURED) */}
        <section className="space-y-6">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900">
              {isId ? 'Pilihan Skema Kemitraan Fleksibel' : 'Flexible Partnership Packages'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              {isId
                ? 'Pilih skema barter tanpa biaya tunai atau tingkatkan eksposur brand dengan paket berbayar unggulan.'
                : 'Choose zero-cash community barter or amplify your visibility with premium featured sponsor placements.'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {/* Paket 1: Community Barter */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider">
                  {isId ? 'Skema Barter' : 'Barter Scheme'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 font-serif">Community Barter</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {isId ? 'Ideal untuk brand lokal & startup yang ingin menjaring pengguna baru.' : 'Ideal for emerging brands and local boutique operators.'}
                  </p>
                </div>

                <div className="pt-2">
                  <div className="text-3xl font-black text-slate-900">Rp 0</div>
                  <div className="text-xs text-slate-400 font-medium">{isId ? 'Gratis biaya penempatan (Barter Promo)' : 'Zero placement fee (Voucher Barter)'}</div>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-600 pt-3 border-t border-slate-100">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{isId ? 'Setor minimal 50 voucher diskon unik' : 'Deposit min. 50 unique voucher codes'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{isId ? 'Tampil resmi di Katalog Perks Komunitas' : 'Listed in Community Perks Catalog'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{isId ? 'Penukaran poin koin LTP oleh pengguna' : 'Redeemable via traveler LTP coins'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{isId ? 'Profil Mitra & tautan langsung ke website' : 'Partner profile & official website backlink'}</span>
                  </li>
                </ul>
              </div>

              <Link
                href={`/${locale}/partner-with-us/apply?package=COMMUNITY_BARTER`}
                className="w-full text-center py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm transition"
              >
                {isId ? 'Pilih Community Barter' : 'Select Community Barter'}
              </Link>
            </div>

            {/* Paket 2: Founding Partner (Featured) */}
            <div className="relative p-6 sm:p-8 rounded-3xl bg-purple-950 text-white shadow-xl overflow-hidden border-2 border-purple-500 flex flex-col justify-between space-y-6">
              <div className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider shadow-sm">
                {isId ? 'Terbatas 50 Brand' : 'Limited to 50 Brands'}
              </div>

              <div className="space-y-4 pt-1">
                <div className="inline-block px-3 py-1 rounded-full bg-purple-900/80 text-purple-200 border border-purple-700/60 text-xs font-bold uppercase tracking-wider">
                  {isId ? 'Penawaran Khusus Peluncuran' : 'Launch Exclusive'}
                </div>
                <div>
                  <h3 className="text-xl font-bold font-serif mb-1 text-white">
                    {isId ? 'Founding Partner (Featured)' : 'Founding Partner (Featured)'}
                  </h3>
                  <div className="flex items-end gap-2 my-3">
                    <span className="text-3xl font-extrabold text-amber-400">
                      {isId ? 'GRATIS' : 'FREE'}
                    </span>
                    <span className="text-purple-300 line-through text-sm mb-1">
                      {isId ? 'Rp 1.500.000/bln' : 'IDR 1,500,000/mo'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-purple-200 leading-relaxed">
                    {isId
                      ? 'Bebas biaya penempatan selama 6 bulan pertama. Cukup siapkan minimal 50 voucher diskon/produk untuk komunitas kami. Tanpa risiko finansial.'
                      : 'Zero placement fee for the first 6 months. Simply provide a minimum of 50 voucher codes/products for our traveler community. Zero financial risk.'}
                  </p>
                </div>

                <ul className="space-y-2.5 text-xs text-purple-100 pt-3 border-t border-purple-800/80">
                  <li className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{isId ? 'Seluruh benefit Community Barter' : 'All Community Barter perks'}</span>
                  </li>
                  <li className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{isId ? 'Lencana Emas "Founding Partner ⭐"' : 'Gold "Founding Partner ⭐" Badge'}</span>
                  </li>
                  <li className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{isId ? 'Posisi teratas (Sticky Pin) di Katalog Hadiah' : 'Top sticky rank in Perks Catalog'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-300 shrink-0" />
                    <span>{isId ? 'Banner promosi di Halaman Forum & Meetup' : 'Sponsored banner in Forums & Meetups'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-300 shrink-0" />
                    <span>{isId ? 'Sorotan bulanan di Newsletter Penjelajah' : 'Monthly feature in Travelers Newsletter'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-300 shrink-0" />
                    <span>{isId ? 'Laporan performa klaim bulanan terperinci' : 'Detailed monthly performance reporting'}</span>
                  </li>
                </ul>
              </div>

              <Link
                href={`/${locale}/partner-with-us/apply?package=FEATURED_PARTNER`}
                className="w-full text-center py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs sm:text-sm shadow-lg transition active:scale-[0.99]"
              >
                {isId ? 'Klaim Slot Founding Partner' : 'Claim Founding Partner Slot'}
              </Link>
            </div>

            {/* Paket 3: Premium Sponsor */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="inline-block px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold uppercase tracking-wider">
                  {isId ? 'Kustom Korporat' : 'Enterprise'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 font-serif">Official Sponsor</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {isId ? 'Kolaborasi terintegrasi penuh untuk kampanye brand skala besar.' : 'Fully tailored co-branding and multi-city activations.'}
                  </p>
                </div>

                <div className="pt-2">
                  <div className="text-2xl font-black text-slate-900">{isId ? 'Hubungi Tim' : 'Custom Pricing'}</div>
                  <div className="text-xs text-slate-400 font-medium">{isId ? 'Kampanye co-branding khusus & event akbar' : 'Custom activations & event takeovers'}</div>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-600 pt-3 border-t border-slate-100">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>{isId ? 'Seluruh benefit Featured Partner' : 'All Featured Partner perks'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>{isId ? 'Homepage Hero Banner Takeover' : 'Homepage Hero Banner Takeover'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>{isId ? 'Sponsor utama agenda temu akbar nasional' : 'Title sponsor for national community meetups'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>{isId ? 'Integrasi rute tur kustom bersama Local Host' : 'Custom guided tour routes integration'}</span>
                  </li>
                </ul>
              </div>

              <Link
                href={`/${locale}/contact?topic=b2b_sponsorship`}
                className="w-full text-center py-3 rounded-xl bg-purple-900 hover:bg-purple-950 text-white font-bold text-xs sm:text-sm transition"
              >
                {isId ? 'Hubungi Tim Kemitraan' : 'Contact Partnership Team'}
              </Link>
            </div>
          </div>
        </section>

        {/* 5. WORKFLOW: 4 LANGKAH MUDAH BERMITRA */}
        <section className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-2xs space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h3 className="text-xl sm:text-2xl font-bold font-serif text-slate-900">
              {isId ? '4 Langkah Mudah Memulai Kemitraan' : '4 Easy Steps to Get Started'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              {isId ? 'Proses pendaftaran cepat, transparan, dan terverifikasi dalam 1x24 jam.' : 'Quick, transparent onboarding verified within 24 hours.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-center">
              <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-black text-sm flex items-center justify-center mx-auto">
                1
              </div>
              <h4 className="font-bold text-sm text-slate-900">{isId ? 'Isi Formulir & Setor Voucher' : 'Submit Application'}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {isId ? 'Lengkapi profil brand dan masukkan daftar kode voucher unik promosi Anda.' : 'Fill in your brand profile and paste your unique promotion codes.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-center">
              <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-black text-sm flex items-center justify-center mx-auto">
                2
              </div>
              <h4 className="font-bold text-sm text-slate-900">{isId ? 'Verifikasi Tim Locallytrip' : 'Curated Verification'}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {isId ? 'Tim kami meninjau relevansi penawaran dengan standar komunitas dalam 1x24 jam.' : 'Our partnership team reviews the offer alignment within 24 business hours.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-center">
              <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-black text-sm flex items-center justify-center mx-auto">
                3
              </div>
              <h4 className="font-bold text-sm text-slate-900">{isId ? 'Kampanye Live di Katalog' : 'Live Campaign'}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {isId ? 'Voucher tayang di Katalog Hadiah & siap ditukarkan oleh ribuan traveler aktif.' : 'Your offer goes live in the Perks Marketplace ready for instant redemption.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-center">
              <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-black text-sm flex items-center justify-center mx-auto">
                4
              </div>
              <h4 className="font-bold text-sm text-slate-900">{isId ? 'Pantau Klaim & Atribusi' : 'Track Attribution'}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {isId ? 'Dapatkan laporan real-time klaim voucher dan pertumbuhan pelanggan baru Anda.' : 'Receive clear conversion insights and direct traveler patronage.'}
              </p>
            </div>
          </div>
        </section>

        {/* 6. BANNER CTA PENDAFTARAN BAWAH */}
        <section className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden border border-purple-800/50 shadow-xl text-center space-y-4">
          <div className="max-w-2xl mx-auto space-y-3">
            <h3 className="text-2xl sm:text-3xl font-extrabold font-serif">
              {isId ? 'Siap Meningkatkan Konversi Brand Anda?' : 'Ready to Elevate Your Brand Presence?'}
            </h3>
            <p className="text-xs sm:text-sm text-purple-200">
              {isId
                ? 'Daftarkan kampanye voucher brand Anda sekarang secara instan tanpa biaya setup awal.'
                : 'Register your brand voucher campaign right now with zero upfront friction.'}
            </p>
            <div className="pt-2">
              <Link
                href={`/${locale}/partner-with-us/apply`}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-amber-950 font-black text-sm shadow-md transition active:scale-95"
              >
                <span>{isId ? 'Mulai Pendaftaran Mitra Sekarang ➔' : 'Get Started as Brand Partner ➔'}</span>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
