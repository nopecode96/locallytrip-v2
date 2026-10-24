import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import {
  ShieldCheck,
  Compass,
  HeartHandshake,
  Building2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Award,
  FileText,
  Lock,
} from 'lucide-react';
import { getDictionary } from '@/lib/getDictionary';

interface AboutPageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: AboutPageProps): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const t = dict.about_page;

  return {
    title: t.metaTitle,
    description: t.metaDescription,
    alternates: {
      canonical: `/${lang}/about`,
      languages: {
        id: '/id/about',
        en: '/en/about',
      },
    },
  };
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { lang } = await params;
  const isId = lang === 'id';
  const dict = await getDictionary(lang);
  const t = dict.about_page;

  // Schema Corporation & AboutPage for E-E-A-T and AEO
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Corporation',
      name: 'PT Locallytrip Teknologi Indonesia',
      alternateName: 'Locallytrip',
      url: 'https://locallytrip.com',
      logo: 'https://locallytrip.com/icons/icon-512x512.png',
      description: t.heroSubtitle,
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'support@locallytrip.com',
        contactType: 'customer support',
        areaServed: 'ID',
        availableLanguage: ['id', 'en'],
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: t.metaTitle,
      description: t.metaDescription,
      url: `https://locallytrip.com/${lang}/about`,
      mainEntity: {
        '@type': 'Corporation',
        name: 'PT Locallytrip Teknologi Indonesia',
      },
    },
  ];

  return (
    <div className="w-full min-h-screen bg-slate-50/50 py-8 sm:py-12">
      {/* Schema JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Breadcrumbs Navigasi */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Link href={`/${lang}`} className="hover:text-violet-600 transition">
            {isId ? 'Beranda' : 'Home'}
          </Link>
          <span className="text-slate-300">›</span>
          <span className="text-slate-400">{isId ? 'Dukungan & Legal' : 'Support & Legal'}</span>
          <span className="text-slate-300">›</span>
          <span className="text-slate-900 font-semibold">{isId ? 'Tentang Kami' : 'About Us'}</span>
        </nav>

        {/* Kartu Header Halaman */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-50 text-violet-700 text-xs font-bold uppercase tracking-wider border border-violet-100">
              <Sparkles className="w-3.5 h-3.5 text-violet-600" />
              <span>{t.badge} • PT Locallytrip Teknologi Indonesia</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black font-serif text-slate-900 tracking-tight leading-tight">
              {t.heroTitle}
            </h1>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              {t.heroSubtitle}
            </p>
          </div>
        </div>

        {/* Vision & Mission Card (2 Kolom) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center font-bold text-lg">
              👁️
            </div>
            <h2 className="text-xl font-bold text-slate-900">{t.visionTitle}</h2>
            <p className="text-sm text-slate-600 leading-relaxed">{t.visionText}</p>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center font-bold text-lg">
              🎯
            </div>
            <h2 className="text-xl font-bold text-slate-900">{t.missionTitle}</h2>
            <p className="text-sm text-slate-600 leading-relaxed">{t.missionText}</p>
          </div>
        </div>

        {/* 3 Core Pillars (Grid 3 Kolom) */}
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black font-serif text-slate-900">
              {t.pillarsTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              {t.pillarsSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pilar 1 */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center">
                <Compass className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">{t.pillar1Title}</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{t.pillar1Desc}</p>
            </div>

            {/* Pilar 2 */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">{t.pillar2Title}</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{t.pillar2Desc}</p>
            </div>

            {/* Pilar 3 */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-fuchsia-50 text-fuchsia-600 flex items-center justify-center">
                <HeartHandshake className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">{t.pillar3Title}</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{t.pillar3Desc}</p>
            </div>
          </div>
        </div>

        {/* Corporate Identity Card (E-E-A-T) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-slate-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{t.corporateTitle}</h2>
              <p className="text-xs text-slate-500 font-semibold">{t.companyLegalName}</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">{t.corporateDesc}</p>
          <div className="pt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500 border-t border-slate-100">
            <span className="inline-flex items-center gap-1.5 text-violet-700 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>{isId ? 'Terdaftar Resmi di Kemenkumham RI' : 'Officially Registered Legal Entity'}</span>
            </span>
            <span>•</span>
            <span>Email: <a href="mailto:support@locallytrip.com" className="text-violet-600 hover:underline">{t.contactSupport}</a></span>
          </div>
        </div>

        {/* Founder Story & Origin Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-600 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-violet-600" />
                <span>{isId ? 'Kisah Pendiri & Visi' : 'Founding Story & Vision'}</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-black font-serif text-slate-900">
                {isId ? 'About LocallyTrip and Founder Nope' : 'About LocallyTrip and Founder Nope'}
              </h2>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold self-start sm:self-auto">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Published: June 20, 2026</span>
            </div>
          </div>

          <div className="space-y-4 text-sm sm:text-base text-slate-600 leading-relaxed">
            <p>
              {isId
                ? 'Locallytrip didirikan oleh Nope bersama tim penggiat komunitas lokal dengan satu misi mendasar: mengembalikan pariwisata ke tangan para warga lokal asli Indonesia. Di era di mana platform perjalanan global didominasi oleh perantara komersial dan potongan komisi yang mencekik, Nope merancang Locallytrip sebagai jembatan langsung dan transparan antara traveler dunia dengan pemandu akar rumput yang berpengetahuan mendalam.'
                : 'Locallytrip was founded by Nope and a collective of grassroots community innovators with a singular purpose: returning travel autonomy to indigenous Indonesian local guides. In an era where global travel aggregators are dominated by exploitative commercial middlemen and exorbitant commission cuts, Nope architected Locallytrip as a transparent, direct bridge between global adventurers and grassroots insiders.'}
            </p>
            <p>
              {isId
                ? 'Berawal dari inisiatif akar rumput di Bali, Yogyakarta, dan Bandung, platform ini berkembang menjadi ekosistem terpadu yang memadukan reservasi pengalaman tur terverifikasi, forum diskusi tips rute otentik, dan temu komunitas (meetups) berbasis kepercayaan mutual.'
                : 'Originating from grassroots community pilots across Bali, Yogyakarta, and Bandung, the platform has scaled into a unified decentralized ecosystem blending verified tour experiences, authentic route debate forums, and trust-first community meetups.'}
            </p>
          </div>
        </div>

        {/* Accreditation, Standards & Compliance Lists (UNWTO, Kemenkumham, CHSE) */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-lg space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-violet-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-violet-400" />
              <span>{isId ? 'Kepatuhan Regulasi & Standar Keberlanjutan' : 'Regulatory Compliance & Standards'}</span>
            </span>
            <h3 className="text-xl sm:text-2xl font-black font-serif text-white">
              {isId ? 'Daftar Referensi Kepatuhan Hukum & Standar Global' : 'Legal Compliance & Global Framework Reference List'}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {/* 1. UNWTO Framework */}
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-violet-400 font-bold text-sm">
                <FileText className="w-4 h-4 shrink-0" />
                <span>UNWTO Sustainable Tourism</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isId
                  ? 'Kepatuhan pada kode etik pariwisata berkelanjutan United Nations World Tourism Organization (UNWTO) untuk pelestarian warisan budaya lokal, pemberdayaan ekonomi komunitas, dan pencegahan eksploitasi alam.'
                  : 'Adherence to the United Nations World Tourism Organization (UNWTO) global code of ethics for sustainable tourism, cultural heritage preservation, and fair community economic enrichment.'}
              </p>
            </div>

            {/* 2. Kemenkumham RI */}
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Building2 className="w-4 h-4 shrink-0" />
                <span>Kemenkumham RI Registered</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isId
                  ? 'Berbadan hukum resmi terdaftar di Kementerian Hukum dan Hak Asasi Manusia Republik Indonesia sebagai PT Locallytrip Teknologi Indonesia (Nomor AHU-0034891.AH.01.01.TAHUN 2026).'
                  : 'Officially registered corporate entity under the Ministry of Law and Human Rights of the Republic of Indonesia (PT Locallytrip Teknologi Indonesia, AHU-0034891.AH.01.01.TAHUN 2026).'}
              </p>
            </div>

            {/* 3. CHSE Protocols */}
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>CHSE Certified Standards</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isId
                  ? 'Penerapan standar Cleanliness, Health, Safety, and Environment Sustainability (CHSE) di seluruh kurasi pemandu tur lapangan, rute jelajah alam, dan protokol temu komunitas.'
                  : 'Application of strict Cleanliness, Health, Safety, and Environmental Sustainability (CHSE) benchmarks across local field hosts, adventure guides, and meetup operations.'}
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action Banner (Full Width max-w-7xl) */}
        <div className="bg-gradient-to-r from-violet-900 to-purple-900 rounded-3xl p-8 sm:p-12 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center sm:text-left">
            <h3 className="text-xl sm:text-2xl font-bold">{t.ctaTitle}</h3>
            <p className="text-xs sm:text-sm text-violet-200">{t.ctaSubtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href={`/${lang}/experiences`}
              className="px-6 py-3 rounded-xl bg-white text-slate-900 text-xs font-bold hover:bg-violet-50 transition"
            >
              {t.ctaExplore}
            </Link>
            <Link
              href={`/${lang}/become-a-host`}
              className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-violet-950/30"
            >
              <span>{t.ctaHost}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
