import React from 'react';
import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { CommunityRewardsClient } from '@/components/community/CommunityRewardsClient';

interface CommunityRewardsPageProps {
  params: Promise<{
    lang: string;
  }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: CommunityRewardsPageProps): Promise<Metadata> {
  const resolved = await params;
  const lang = resolved.lang === 'en' ? 'en' : 'id';
  const isId = lang === 'id';

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://locallytrip.com';
  const canonicalUrl = `${siteUrl}/${lang}/community/rewards`;

  const title = isId
    ? 'Sistem Hadiah Komunitas, Reputasi XP & Koin LTP | Locallytrip'
    : 'Community Rewards, XP Reputation & LTP Coins | Locallytrip';

  const description = isId
    ? 'Pelajari bagaimana kontribusi traveling, cerita lokal, dan keaktifan komunitas Locallytrip dihargai dengan XP dan koin LTP nyata yang dapat dicairkan.'
    : 'Discover how authentic travel contributions, secret stories, and community engagement in Locallytrip earn XP and real redeemable LTP Coins.';

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'id-ID': `${siteUrl}/id/community/rewards`,
        'en-US': `${siteUrl}/en/community/rewards`,
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
          url: `${siteUrl}/images/rewards/hero-earning-traveler.png`,
          width: 1200,
          height: 630,
          alt: 'Locallytrip Rewards & Tokenomics',
        },
      ],
    },
  };
}

export default async function CommunityRewardsPage({
  params,
}: CommunityRewardsPageProps) {
  const resolved = await params;
  const lang = resolved.lang === 'en' ? 'en' : 'id';

  // Kueri konfigurasi reward resmi dari database PostgreSQL via Prisma
  const [tiersList, actionsList, systemSettings] = await Promise.all([
    // 1. Tingkatan Level XP (Level 1 s/d Level 12)
    prisma.reward_level_tiers.findMany({
      where: { is_active: true },
      orderBy: { level: 'asc' },
    }),

    // 2. Daftar Aksi Penghasil Reward
    prisma.reward_action_rules.findMany({
      where: { is_active: true },
      orderBy: { xp_reward: 'desc' },
    }),

    // 3. Pengaturan Konversi Tokenomics
    prisma.reward_system_settings.findMany(),
  ]);

  return (
    <div className="w-full min-h-screen bg-slate-50/50 py-8 sm:py-12">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        <CommunityRewardsClient
          locale={lang}
          settings={systemSettings}
          tiers={tiersList}
          actions={actionsList}
        />
      </div>
    </div>
  );
}
