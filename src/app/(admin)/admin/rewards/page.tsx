import React from 'react';
import {
  getAdminMerchandise,
  getAdminRewardRulesAndTiers,
} from '@/actions/admin/rewards';
import { RewardsControlClient } from '@/components/admin/rewards/RewardsControlClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rewards, Merchandise & Gamification | Locallytrip Admin',
  description: 'Kelola level reputation XP, katalog merchandise hadiah, dan aturan perolehan poin LTP.',
};

export const dynamic = 'force-dynamic';

interface AdminRewardsPageProps {
  searchParams?: Promise<{
    tab?: string;
  }>;
}

export default async function AdminRewardsPage({ searchParams }: AdminRewardsPageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const validTabs = ['merchandise', 'tiers', 'rules'];
  const initialTab = resolvedParams?.tab && validTabs.includes(resolvedParams.tab)
    ? (resolvedParams.tab as 'merchandise' | 'tiers' | 'rules')
    : 'merchandise';

  const [merchRes, rulesTiersRes] = await Promise.all([
    getAdminMerchandise({ page: 1, limit: 20 }),
    getAdminRewardRulesAndTiers(),
  ]);

  return (
    <RewardsControlClient
      initialMerchandise={merchRes.data || []}
      initialPagination={
        merchRes.pagination || {
          currentPage: 1,
          pageSize: 20,
          totalItems: 0,
          totalPages: 1,
        }
      }
      initialTiers={rulesTiersRes.tiers || []}
      initialRules={rulesTiersRes.rules || []}
      initialTab={initialTab}
    />
  );
}

