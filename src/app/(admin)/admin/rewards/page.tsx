import React from 'react';
import {
  getAdminMerchandise,
  getAdminRewardRulesAndTiers,
} from '@/actions/admin/rewards';
import { RewardsControlClient } from '@/components/admin/rewards/RewardsControlClient';

export const dynamic = 'force-dynamic';

export default async function AdminRewardsPage() {
  const [merchRes, rulesTiersRes] = await Promise.all([
    getAdminMerchandise({ page: 1, limit: 20 }),
    getAdminRewardRulesAndTiers(),
  ]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
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
      />
    </div>
  );
}
