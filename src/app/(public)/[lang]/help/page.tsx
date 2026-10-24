import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { HelpCircle, Sparkles, Mail, ArrowRight } from 'lucide-react';
import { getDictionary } from '@/lib/getDictionary';
import { HelpAccordion } from '@/components/help/HelpAccordion';

interface HelpPageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: HelpPageProps): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const t = dict.help_page;

  return {
    title: t.metaTitle,
    description: t.metaDescription,
    alternates: {
      canonical: `/${lang}/help`,
      languages: {
        id: '/id/help',
        en: '/en/help',
      },
    },
  };
}

export default async function HelpPage({ params }: HelpPageProps) {
  const { lang } = await params;
  const isId = lang === 'id';
  const dict = await getDictionary(lang);
  const t = dict.help_page;

  const faqItems = [
    {
      id: 'q1',
      category: 'travelers' as const,
      question: t.q1,
      answer: t.a1,
    },
    {
      id: 'q2',
      category: 'travelers' as const,
      question: t.q2,
      answer: t.a2,
    },
    {
      id: 'q3',
      category: 'travelers' as const,
      question: t.q3,
      answer: t.a3,
    },
    {
      id: 'q4',
      category: 'hosts' as const,
      question: t.q4,
      answer: t.a4,
    },
    {
      id: 'q5',
      category: 'hosts' as const,
      question: t.q5,
      answer: t.a5,
    },
    {
      id: 'q6',
      category: 'gamification' as const,
      question: t.q6,
      answer: t.a6,
    },
    {
      id: 'q7',
      category: 'operational' as const,
      question: t.q7,
      answer: t.a7,
    },
  ];

  // Injeksi Schema FAQPage JSON-LD untuk SEO, Google Rich Results, & AEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    name: t.metaTitle,
    description: t.metaDescription,
    url: `https://locallytrip.com/${lang}/help`,
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

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
          <span className="text-slate-900 font-semibold">{isId ? 'Pusat Bantuan' : 'Help Center'}</span>
        </nav>

        {/* Kartu Header Halaman */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-50 text-violet-700 text-xs font-bold uppercase tracking-wider border border-violet-100">
              <HelpCircle className="w-3.5 h-3.5 text-violet-600" />
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

        {/* Accordion FAQ Interaktif dengan Layout 12 Kolom */}
        <HelpAccordion
          items={faqItems}
          t={{
            searchPlaceholder: t.searchPlaceholder,
            tabAll: t.tabAll,
            tabTravelers: t.tabTravelers,
            tabHosts: t.tabHosts,
            tabGamification: t.tabGamification,
            tabOperational: t.tabOperational,
          }}
        />

        {/* Banner Masih Butuh Bantuan (Full Width max-w-7xl) */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center sm:text-left">
            <h3 className="font-bold text-slate-900 text-lg">{t.stillNeedHelp}</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl">{t.stillNeedHelpDesc}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href={`/${lang}/contact`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs sm:text-sm font-bold transition shadow-md shadow-violet-500/20"
            >
              <Mail className="w-4 h-4" />
              <span>{t.contactSupportBtn}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
