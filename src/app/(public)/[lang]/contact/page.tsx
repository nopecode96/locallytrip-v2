import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Mail, MapPin, Clock, MessageSquare, Sparkles, MessagesSquare, ArrowRight, Building2, CheckCircle2 } from 'lucide-react';
import { getDictionary } from '@/lib/getDictionary';
import { ContactForm } from '@/components/contact/ContactForm';

interface ContactPageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: ContactPageProps): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const t = dict.contact_page;

  return {
    title: t.metaTitle,
    description: t.metaDescription,
    alternates: {
      canonical: `/${lang}/contact`,
      languages: {
        id: '/id/contact',
        en: '/en/contact',
      },
    },
  };
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { lang } = await params;
  const isId = lang === 'id';
  const dict = await getDictionary(lang);
  const t = dict.contact_page;

  // Schema ContactPage for SEO & AEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: t.metaTitle,
    description: t.metaDescription,
    url: `https://locallytrip.com/${lang}/contact`,
    mainEntity: {
      '@type': 'Corporation',
      name: 'PT Locallytrip Teknologi Indonesia',
      telephone: '+62-21-0000-0000',
      email: 'support@locallytrip.com',
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: 'support@locallytrip.com',
        availableLanguage: ['Indonesian', 'English'],
        hoursAvailable: {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: [
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
            'Sunday',
          ],
          opens: '08:00',
          closes: '21:00',
        },
      },
    },
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
          <span className="text-slate-900 font-semibold">{isId ? 'Hubungi Kami' : 'Contact Us'}</span>
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

        {/* Grid 12 Kolom (lg:col-span-5 info vs lg:col-span-7 form) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* KOLOM KIRI (lg:col-span-5): Info Kontak, Direct Answer, & Legalitas */}
          <div className="lg:col-span-5 space-y-6">
            {/* Direct Answer Box (GEO / AEO Friendly Snippet) */}
            <div className="bg-gradient-to-br from-violet-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-violet-300 text-xs font-bold uppercase tracking-wider">
                <MessageSquare className="w-4 h-4" />
                <span>Direct Answer / Info Kontak Cepat</span>
              </div>
              <h2 className="text-xl font-bold font-serif leading-snug">
                {t.directAnswerQuestion}
              </h2>
              <p className="text-violet-100 text-xs sm:text-sm leading-relaxed">
                {t.directAnswerText}
              </p>
              <div className="space-y-3.5 pt-4 border-t border-violet-800/60">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-800/60 flex items-center justify-center shrink-0 mt-0.5">
                    <Mail className="w-4 h-4 text-violet-300" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-violet-300 block">{t.emailLabel}</span>
                    <a
                      href="mailto:support@locallytrip.com"
                      className="text-xs sm:text-sm font-bold text-white hover:text-violet-200 transition underline underline-offset-4"
                    >
                      {t.emailValue}
                    </a>
                    <span className="text-[10px] text-violet-300 block">{t.emailResponseTime}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-800/60 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4 text-violet-300" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-violet-300 block">{t.officeLabel}</span>
                    <span className="text-xs sm:text-sm font-bold text-white block">{t.officeValue}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-800/60 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-4 h-4 text-violet-300" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-violet-300 block">{t.hoursLabel}</span>
                    <span className="text-xs sm:text-sm font-bold text-white block">{t.hoursValue}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media & Channels */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">{t.socialTitle}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{t.socialSubtitle}</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
                <a
                  href="https://instagram.com/locallytrip"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-violet-50 hover:text-violet-700 transition text-xs font-semibold text-slate-700 group"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-xs">IG</span>
                    <span>@locallytrip</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                </a>

                <a
                  href="https://tiktok.com/@locallytrip"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-violet-50 hover:text-violet-700 transition text-xs font-semibold text-slate-700 group"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-xs">TT</span>
                    <span>@locallytrip</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                </a>
              </div>
            </div>

            {/* Forum Komunitas Card */}
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-3xl p-6 border border-violet-100 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center">
                <MessagesSquare className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">{t.forumCta}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{t.forumDesc}</p>
              <Link
                href={`/${lang}/community/forums`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-700 hover:text-violet-800 transition pt-1"
              >
                <span>Buka Forum Diskusi</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Legal Entity Badge */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3 text-xs text-slate-600">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 text-slate-600" />
              </div>
              <div>
                <span className="font-bold text-slate-900 block">PT Locallytrip Teknologi Indonesia</span>
                <span className="text-[11px] text-slate-400">Penyelenggara Sistem Elektronik Terverifikasi</span>
              </div>
            </div>
          </div>

          {/* KOLOM KANAN (lg:col-span-7): Formulir Kontak Interaktif */}
          <div className="lg:col-span-7">
            <ContactForm t={t} />
          </div>
        </div>
      </div>
    </div>
  );
}
