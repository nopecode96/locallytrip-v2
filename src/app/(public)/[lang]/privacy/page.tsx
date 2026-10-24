import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, Lock, Eye, FileText, ArrowRight, Building2, CheckCircle2, Bookmark } from 'lucide-react';
import { getDictionary } from '@/lib/getDictionary';

interface PrivacyPageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: PrivacyPageProps): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const t = dict.privacy_page;

  return {
    title: t.metaTitle,
    description: t.metaDescription,
    alternates: {
      canonical: `/${lang}/privacy`,
      languages: {
        id: '/id/privacy',
        en: '/en/privacy',
      },
    },
  };
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { lang } = await params;
  const isId = lang === 'id';
  const dict = await getDictionary(lang);
  const t = dict.privacy_page;

  // Schema WebPage JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: t.metaTitle,
    description: t.metaDescription,
    url: `https://locallytrip.com/${lang}/privacy`,
    publisher: {
      '@type': 'Corporation',
      name: 'PT Locallytrip Teknologi Indonesia',
      url: 'https://locallytrip.com',
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'support@locallytrip.com',
        contactType: 'customer support',
      },
    },
  };

  const navSections = [
    { id: 'section-1', title: t.section1Title },
    { id: 'section-2', title: t.section2Title },
    { id: 'section-3', title: t.section3Title },
    { id: 'section-4', title: t.section4Title },
    { id: 'section-5', title: t.section5Title },
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
          <span className="text-slate-900 font-semibold">{isId ? 'Kebijakan Privasi' : 'Privacy Policy'}</span>
        </nav>

        {/* Kartu Header Halaman */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-50 text-violet-700 text-xs font-bold uppercase tracking-wider border border-violet-100">
              <Lock className="w-3.5 h-3.5 text-violet-600" />
              <span>{t.badge} • PT Locallytrip Teknologi Indonesia</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black font-serif text-slate-900 tracking-tight leading-tight">
              {t.heroTitle}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              {t.lastUpdated}
            </p>
          </div>
        </div>

        {/* Grid 12 Kolom (Sticky Nav di Kiri 4/12 & Pasal di Kanan 8/12) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* KOLOM KIRI (lg:col-span-4): Sticky Quick Navigation */}
          <div className="lg:col-span-4 lg:sticky lg:top-28 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Bookmark className="w-4 h-4 text-violet-600" />
                <span>{isId ? 'Daftar Isi Kebijakan' : 'On This Page'}</span>
              </div>
              <nav className="space-y-1.5">
                {navSections.map((sec, idx) => (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    className="block px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-violet-700 hover:bg-violet-50 transition leading-snug"
                  >
                    {idx + 1}. {sec.title.replace(/^[0-9]+\.\s*/, '')}
                  </a>
                ))}
              </nav>
            </div>

            {/* Entity Badge Card */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">{t.companyEntity}</h4>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                {isId
                  ? 'Kerahasiaan data Anda dilindungi oleh standar enkripsi ketat dan hukum privasi Republik Indonesia.'
                  : 'Your privacy is guarded under industry-grade encryption and Republic of Indonesia data laws.'}
              </p>
              <div className="pt-2 border-t border-slate-100 text-xs text-slate-500">
                Email: <a href="mailto:support@locallytrip.com" className="text-violet-600 hover:underline">support@locallytrip.com</a>
              </div>
            </div>
          </div>

          {/* KOLOM KANAN (lg:col-span-8): Isi Pasal-Pasal Privasi */}
          <div className="lg:col-span-8 space-y-6">
            {/* Section 1 */}
            <div
              id="section-1"
              className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-3 scroll-mt-28"
            >
              <div className="flex items-center gap-2.5 font-bold text-slate-900 text-base">
                <ShieldCheck className="w-5 h-5 text-violet-600 shrink-0" />
                <h2>{t.section1Title}</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{t.section1Text}</p>
            </div>

            {/* Section 2 */}
            <div
              id="section-2"
              className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-3.5 scroll-mt-28"
            >
              <div className="flex items-center gap-2.5 font-bold text-slate-900 text-base">
                <Eye className="w-5 h-5 text-violet-600 shrink-0" />
                <h2>{t.section2Title}</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{t.section2Text}</p>
              <ul className="list-disc pl-5 space-y-2 text-slate-600 text-xs sm:text-sm">
                <li>{t.collectItem1}</li>
                <li>{t.collectItem2}</li>
                <li>{t.collectItem3}</li>
              </ul>
            </div>

            {/* Section 3 */}
            <div
              id="section-3"
              className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-3 scroll-mt-28"
            >
              <div className="flex items-center gap-2.5 font-bold text-slate-900 text-base">
                <FileText className="w-5 h-5 text-violet-600 shrink-0" />
                <h2>{t.section3Title}</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{t.section3Text}</p>
            </div>

            {/* Section 4 */}
            <div
              id="section-4"
              className="bg-violet-50/70 rounded-2xl border border-violet-100 p-6 sm:p-8 shadow-xs space-y-3 scroll-mt-28"
            >
              <div className="flex items-center gap-2.5 font-bold text-violet-900 text-base">
                <Lock className="w-5 h-5 text-violet-600 shrink-0" />
                <h2>{t.section4Title}</h2>
              </div>
              <p className="text-xs sm:text-sm text-violet-800 leading-relaxed font-medium">
                {t.section4Text}
              </p>
            </div>

            {/* Section 5 */}
            <div
              id="section-5"
              className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-3 scroll-mt-28"
            >
              <div className="flex items-center gap-2.5 font-bold text-slate-900 text-base">
                <ShieldCheck className="w-5 h-5 text-violet-600 shrink-0" />
                <h2>{t.section5Title}</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{t.section5Text}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
