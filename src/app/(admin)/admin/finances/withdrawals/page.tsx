import React from 'react';
import { getAdminPayouts } from '@/actions/admin/payouts';
import { HostWithdrawalsClient } from '@/components/admin/finances/HostWithdrawalsClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Host Withdrawals & Payouts | Locallytrip Admin',
  description: 'Pusat persetujuan penarikan dana dan kliring perbankan host Locallytrip.',
};

export const dynamic = 'force-dynamic';

export default async function HostWithdrawalsPage() {
  // Fetch Payouts and Financial Telemetry (Middleware guarantees staff auth)
  const { payouts = [], stats, pagination } = await getAdminPayouts({
    page: 1,
    pageSize: 10,
  });

  return (
    <HostWithdrawalsClient
      initialPayouts={payouts}
      initialPagination={pagination}
      initialStats={
        stats || {
          pendingAmountIdr: 0,
          pendingCount: 0,
          approvedAmountIdr: 0,
          approvedCount: 0,
          completedAmountIdr: 0,
          completedCount: 0,
          completedThisMonthIdr: 0,
          rejectedAmountIdr: 0,
          rejectedCount: 0,
          totalCount: 0,
          totalVolumeIdr: 0,
        }
      }
    />
  );
}
