import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCurrentUserSession } from '@/actions/bookings';
import {
  PerksClient,
  PerkCampaign,
  UserPerkClaim,
} from '@/components/community/PerksClient';

interface CommunityPerksPageProps {
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
  const canonicalUrl = `${siteUrl}/${lang}/community/perks`;

  const title = isId
    ? 'Katalog Hadiah & Voucher Mitra Brand (Perks Marketplace) | Locallytrip'
    : 'Brand Perks & Voucher Marketplace | Locallytrip';

  const description = isId
    ? 'Tukarkan koin reward LTP dan level reputasi XP Anda dengan voucher staycation Bobocabin, diskon perlengkapan outdoor EIGER, voucher kuliner Kopi Kenangan, dan benefit perjalanan resmi dari mitra terverifikasi.'
    : 'Redeem your LTP reward coins and XP reputation for staycation vouchers, outdoor gear discounts, and dining perks from premier verified partner brands.';

  return {
    title,
    description,
    keywords: isId
      ? [
          'voucher diskon wisata',
          'hadiah reward komunitas',
          'tukar koin LTP',
          'promo staycation glamping',
          'diskon perlengkapan gunung',
          'voucher kuliner',
          'locallytrip perks',
          'loyalty travel points',
          'voucher bobocabin',
          'diskon eiger',
        ]
      : [
          'travel discount vouchers',
          'community reward perks',
          'redeem LTP coins',
          'glamping staycation promo',
          'outdoor equipment discount',
          'dining voucher perks',
          'locallytrip perks marketplace',
        ],
    authors: [{ name: 'PT Locallytrip Teknologi Indonesia', url: siteUrl }],
    creator: 'Locallytrip Community Ecosystem',
    publisher: 'PT Locallytrip Teknologi Indonesia',
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'id-ID': `${siteUrl}/id/community/perks`,
        'en-US': `${siteUrl}/en/community/perks`,
        'x-default': `${siteUrl}/id/community/perks`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Locallytrip Community Perks Marketplace',
      locale: isId ? 'id_ID' : 'en_US',
      type: 'website',
      images: [
        {
          url: `${siteUrl}/images/rewards/hero-earning-traveler.png`,
          width: 1200,
          height: 630,
          alt: 'Locallytrip Community Perks Marketplace',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${siteUrl}/images/rewards/hero-earning-traveler.png`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function CommunityPerksPage({ params }: CommunityPerksPageProps) {
  const resolvedParams = await params;
  const locale = resolvedParams.lang === 'en' ? 'en' : 'id';
  const isId = locale === 'id';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://locallytrip.com';
  const canonicalUrl = `${siteUrl}/${locale}/community/perks`;

  // 1. Identifikasi Pengguna Sesi
  let userEmail: string | null = null;
  const session = await getServerSession(authOptions);
  if (session?.user?.email) {
    userEmail = session.user.email;
  } else {
    const rawSession = await getCurrentUserSession();
    if (rawSession?.isLoggedIn && rawSession.email) {
      userEmail = rawSession.email;
    }
  }

  let loggedInUser = null;
  if (userEmail) {
    loggedInUser = await prisma.users.findUnique({
      where: { email: userEmail },
      select: { id: true, name: true, email: true },
    });
  }

  // 2. Kueri Kampanye Mitra Brand Aktif Langsung dari Database
  const rawCampaigns = await prisma.brand_campaigns.findMany({
    where: {
      is_active: true,
      partner: {
        status: { in: ['ACTIVE', 'APPROVED'] },
      },
      end_date: { gte: new Date() },
    },
    include: {
      partner: {
        select: {
          id: true,
          name: true,
          slug: true,
          category: true,
          logo_url: true,
          website_url: true,
        },
      },
      _count: {
        select: {
          vouchers: { where: { is_claimed: false } },
        },
      },
    },
    orderBy: [
      { is_featured: 'desc' },
      { created_at: 'desc' },
    ],
  });

  // 3. Kueri Saldo LTP, XP & Riwayat Klaim User (Jika Login)
  let userWalletBalance = 0;
  let userCurrentLevel = 1;
  let initialUserClaims: UserPerkClaim[] = [];

  if (loggedInUser) {
    const [wallet, xp, claims] = await Promise.all([
      prisma.user_ltp_wallets.findUnique({ where: { user_id: loggedInUser.id } }),
      prisma.user_xp.findUnique({ where: { user_id: loggedInUser.id } }),
      prisma.user_brand_claims.findMany({
        where: { user_id: loggedInUser.id },
        include: {
          campaign: {
            select: {
              title: true,
              terms: true,
              partner: { select: { name: true, logo_url: true, category: true } },
            },
          },
        },
        orderBy: { claimed_at: 'desc' },
      }),
    ]);

    userWalletBalance = wallet ? Number(wallet.balance) : 0;
    userCurrentLevel = xp?.current_level || 1;
    initialUserClaims = claims.map((c) => ({
      id: c.id,
      campaign_id: c.campaign_id,
      voucher_code: c.voucher_code,
      claimed_at: c.claimed_at.toISOString(),
      campaign_title: c.campaign.title,
      partner_name: c.campaign.partner.name,
      partner_logo: c.campaign.partner.logo_url,
      partner_category: c.campaign.partner.category,
      terms: c.campaign.terms,
    }));
  }

  // Format Data Kampanye dari Database
  const campaigns: PerkCampaign[] = rawCampaigns.map((c) => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
    description: c.description,
    terms: c.terms,
    image_url: c.image_url,
    tier_package: c.tier_package,
    is_featured: c.is_featured,
    cost_in_ltp: c.cost_in_ltp,
    min_xp_level: c.min_xp_level,
    total_quota: c.total_quota,
    claimed_quota: c.claimed_quota,
    remaining_vouchers: c._count.vouchers,
    end_date: c.end_date.toISOString(),
    partner: {
      id: c.partner.id,
      name: c.partner.name,
      slug: c.partner.slug,
      category: c.partner.category,
      logo_url: c.partner.logo_url,
      website_url: c.partner.website_url,
    },
  }));

  // Schema.org Structured Data (JSON-LD) for SEO, AIO, GEO & AEO
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: isId ? 'Beranda' : 'Home',
        item: `${siteUrl}/${locale}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: isId ? 'Komunitas' : 'Community',
        item: `${siteUrl}/${locale}/community`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: isId ? 'Katalog Hadiah Mitra (Perks)' : 'Brand Perks Marketplace',
        item: canonicalUrl,
      },
    ],
  };

  const offerCatalogJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'OfferCatalog',
    name: isId
      ? 'Katalog Hadiah & Voucher Mitra Brand Terverifikasi Locallytrip'
      : 'Locallytrip Verified Partner Brand Perks Catalog',
    description: isId
      ? 'Koleksi voucher potongan harga resmi, diskon glamping, voucher perlengkapan outdoor, dan kuliner yang dapat ditukarkan dengan koin reward LTP pengguna.'
      : 'Collection of official discount vouchers, glamping perks, outdoor gear coupons, and dining rewards redeemable with traveler LTP loyalty coins.',
    url: canonicalUrl,
    numberOfItems: campaigns.length,
    itemListElement: campaigns.map((c, index) => ({
      '@type': 'Offer',
      position: index + 1,
      name: c.title,
      description: c.description,
      price: c.cost_in_ltp,
      priceCurrency: 'LTP',
      category: c.partner.category,
      offeredBy: {
        '@type': 'Organization',
        name: c.partner.name,
        url: c.partner.website_url || undefined,
        logo: c.partner.logo_url,
      },
      availability:
        c.remaining_vouchers > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      validThrough: c.end_date,
    })),
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: isId
          ? 'Apa itu Locallytrip Community Perks dan bagaimana cara kerjanya?'
          : 'What is Locallytrip Community Perks and how does it work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: isId
            ? 'Locallytrip Community Perks adalah marketplace reward loyalitas di mana penjelajah dapat menukarkan Loyalty Travel Points (LTP) dan level reputasi (XP) dengan voucher potongan harga nyata dari mitra brand resmi seperti Bobocabin, EIGER, MSIG, Kopi Kenangan, dan Bluebird.'
            : 'Locallytrip Community Perks is a loyalty reward marketplace where explorers redeem Loyalty Travel Points (LTP) and XP reputation levels for real discount vouchers from verified partner brands such as Bobocabin, EIGER, MSIG, Kopi Kenangan, and Bluebird.',
        },
      },
      {
        '@type': 'Question',
        name: isId
          ? 'Bagaimana cara mendapatkan Koin LTP dan menaikkan Level XP?'
          : 'How do travelers earn LTP Coins and level up XP?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: isId
            ? 'Pengguna mendapatkan koin LTP dan poin XP secara organik melalui kontribusi aktif dalam komunitas Locallytrip: membagikan cerita perjalanan orisinal (+150 LTP), mengulas destinasi tur (+50 LTP), berpartisipasi dalam agenda meetup traveler (+100 LTP), serta menjawab pertanyaan di forum komunitas.'
            : 'Users earn LTP coins and XP reputation points through active contributions: publishing travel stories (+150 LTP), reviewing booked tours (+50 LTP), joining community meetups (+100 LTP), and answering traveler questions in the forum.',
        },
      },
      {
        '@type': 'Question',
        name: isId
          ? 'Apakah voucher mitra dapat digunakan di gerai offline kasir fisik dan toko online?'
          : 'Can brand vouchers be used at physical offline stores and online websites?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: isId
            ? 'Ya, setiap voucher yang berhasil diklaim menyediakan kode alfanumerik unik, barcode kasir terenkripsi, serta QR Code resmi yang dapat ditunjukkan langsung kepada staf kasir outlet fisik (misalnya gerai EIGER atau kafe) atau dimasukkan pada kolom kode promo saat checkout di website mitra.'
            : 'Yes, each claimed voucher includes a unique code, encrypted POS barcode, and QR code to present directly to physical cashier staff or enter in the promo code field during online checkout on partner websites.',
        },
      },
      {
        '@type': 'Question',
        name: isId
          ? 'Apakah voucher di halaman Perks dijamin keasliannya dan bebas biaya tersembunyi?'
          : 'Are vouchers in the Perks marketplace authentic with no hidden fees?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: isId
            ? 'Semua penawaran di Locallytrip Perks diikat melalui perjanjian kemitraan resmi (B2B Brand Agreement) berbadan hukum dengan PT Locallytrip Teknologi Indonesia. Setiap voucher dijamin 100% valid tanpa biaya tambahan tersembunyi.'
            : 'All perk offers are backed by formal B2B brand agreements with PT Locallytrip Teknologi Indonesia, guaranteeing 100% authenticity and zero hidden fees.',
        },
      },
      {
        '@type': 'Question',
        name: isId
          ? 'Bagaimana cara brand atau pemilik usaha lokal bergabung dalam program Perks Locallytrip?'
          : 'How can brands and local businesses join the Locallytrip Perks program?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: isId
            ? 'Pelaku usaha, operator akomodasi, restoran, dan produsen perlengkapan outdoor dapat mengajukan kemitraan B2B melalui halaman https://locallytrip.com/id/partner-with-us untuk menjangkau puluhan ribu traveler aktif di Indonesia.'
            : 'Merchants, hospitality operators, and outdoor apparel brands can submit B2B partnership applications via https://locallytrip.com/en/partner-with-us to connect with active travel explorers across Indonesia.',
        },
      },
    ],
  };

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'PT Locallytrip Teknologi Indonesia',
    url: siteUrl,
    logo: `${siteUrl}/images/locallytrip-logo.png`,
    sameAs: [
      'https://www.instagram.com/locallytrip',
      'https://www.linkedin.com/company/locallytrip',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support & B2B Partnership',
      email: 'partnerships@locallytrip.com',
      availableLanguage: ['Indonesian', 'English'],
    },
  };

  return (
    <div className="w-full min-h-screen bg-slate-50/50 py-8 sm:py-12">
      {/* JSON-LD Structured Data Injection for SEO, AIO, GEO, AEO, EEAT */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(offerCatalogJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-12">
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 font-medium"
        >
          <Link href={`/${locale}`} className="hover:text-purple-700 transition">
            {isId ? 'Beranda' : 'Home'}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link href={`/${locale}/community`} className="hover:text-purple-700 transition">
            {isId ? 'Komunitas' : 'Community'}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-semibold">
            {isId ? 'Penukaran Hadiah Mitra (Perks)' : 'Brand Perks & Vouchers'}
          </span>
        </nav>

        <React.Suspense
          fallback={
            <div className="min-h-[400px] w-full animate-pulse rounded-2xl bg-white border border-slate-100 p-8" />
          }
        >
          <PerksClient
            locale={locale}
            isLoggedIn={Boolean(loggedInUser)}
            userWalletBalance={userWalletBalance}
            userCurrentLevel={userCurrentLevel}
            campaigns={campaigns}
            initialUserClaims={initialUserClaims}
          />
        </React.Suspense>
      </div>
    </div>
  );
}
