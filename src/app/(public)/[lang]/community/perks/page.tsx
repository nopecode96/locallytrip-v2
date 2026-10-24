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
    ? 'Tukarkan koin reward LTP dan reputasi level XP Anda dengan voucher staycation glamping, diskon perlengkapan outdoor EIGER, dan voucher kuliner eksklusif.'
    : 'Redeem your LTP reward coins and XP reputation for staycation vouchers, outdoor gear discounts, and dining perks from premier partner brands.';

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'id-ID': `${siteUrl}/id/community/perks`,
        'en-US': `${siteUrl}/en/community/perks`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Locallytrip Community Perks',
      locale: isId ? 'id_ID' : 'en_US',
      type: 'website',
      images: [
        {
          url: `${siteUrl}/images/rewards/hero-earning-traveler.png`,
          width: 1200,
          height: 630,
          alt: 'Locallytrip Community Perks',
        },
      ],
    },
  };
}

export default async function CommunityPerksPage({ params }: CommunityPerksPageProps) {
  const resolvedParams = await params;
  const locale = resolvedParams.lang === 'en' ? 'en' : 'id';
  const isId = locale === 'id';

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

  // 2. Kueri Kampanye Mitra Brand Aktif
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

  // Format Data Kampanye
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

  return (
    <div className="w-full min-h-screen bg-slate-50/50 py-8 sm:py-12">
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

        <React.Suspense fallback={<div className="min-h-[400px] w-full animate-pulse rounded-2xl bg-white border border-slate-100 p-8" />}>
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
