import React from 'react';
import { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import CookieConsentBanner from '@/components/layout/CookieConsentBanner';
import BrowserNotificationRequest from '@/components/notifications/BrowserNotificationRequest';
import ScrollToTop from '@/components/common/ScrollToTop';
import { getDictionary } from '@/lib/getDictionary';
import { Locale } from '@/lib/i18n';

interface PublicLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    lang: string;
  }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const lang = resolvedParams.lang === 'en' ? 'en' : 'id';
  const isId = lang === 'id';

  const title = isId
    ? 'Locallytrip - Temukan Pengalaman Otentik Bersama Warga Lokal'
    : 'Locallytrip - Discover Authentic Experiences with Local Insiders';

  const description = isId
    ? 'Jelajahi sudut tersembunyi kota, rute kuliner, dan tur privat dipandu langsung oleh local host berlisensi & terverifikasi KYC.'
    : 'Explore hidden-gem spots, authentic culinary routes, and private tours hosted directly by licensed & KYC-verified local experts.';

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://locallytrip.com';
  const canonicalUrl = `${siteUrl}/${lang}`;
  const ogImage = `${siteUrl}/images/hero/travelers-couple.png`;

  return {
    title,
    description,
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'id-ID': `${siteUrl}/id`,
        'en-US': `${siteUrl}/en`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Locallytrip',
      locale: isId ? 'id_ID' : 'en_US',
      type: 'website',
      images: [
        {
          url: ogImage,
          width: 800,
          height: 1200,
          alt: 'Locallytrip Travelers Couple',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    icons: {
      icon: [
        { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
        { url: '/favicon.ico', sizes: 'any' },
      ],
      apple: { url: '/apple-touch-icon.png', sizes: '180x180' },
    },
  };
}

export default async function PublicLayout({
  children,
  params,
}: PublicLayoutProps) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang === 'en' ? 'en' : 'id';
  const currentLocale = lang as Locale;
  const dict = await getDictionary(currentLocale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://locallytrip.com';

  // Schema Organization / Corporation & LocalBusiness Legalitas
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Corporation',
    name: 'Locallytrip',
    legalName: 'PT Locallytrip Teknologi Indonesia',
    url: siteUrl,
    logo: `${siteUrl}/images/logo.webp`,
    description:
      'Platform marketplace pemandu lokal dan komunitas perjalanan terverifikasi di Indonesia.',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'ID',
      addressLocality: 'Jakarta',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      email: 'support@locallytrip.com',
      availableLanguage: ['Indonesian', 'English'],
    },
    sameAs: [
      'https://instagram.com/locallytrip',
      'https://tiktok.com/locallytrip',
    ],
  };

  // Schema BreadcrumbList untuk Halaman Beranda
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${siteUrl}/${lang}`,
      },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 text-slate-900">
      {/* Skema JSON-LD Organization & BreadcrumbList untuk E-E-A-T & Google Knowledge Graph */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Header dict={dict} />
      <main className="flex-1 w-full max-w-full overflow-x-hidden">{children}</main>
      <Footer dict={dict} locale={currentLocale} />
      <CookieConsentBanner />
      <BrowserNotificationRequest />
      <ScrollToTop />
    </div>
  );
}
