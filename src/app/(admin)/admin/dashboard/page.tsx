import React from 'react';
import { getAdminDashboardOverview } from '@/actions/admin/dashboard';
import { DashboardClientView } from '@/components/admin/DashboardClientView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard Overview | Locallytrip Admin',
  description: 'Telemetri ekosistem marketplace, pengguna, pengalaman, dan arus kas keuangan Locallytrip.',
};

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const { stats, recentBookings, error } = await getAdminDashboardOverview();

  // If there was an error, log it and provide graceful fallback stats
  if (error) {
    console.warn('[AdminDashboardPage] Notice from overview server action:', error);
  }

  const safeStats = stats || {
    totalUsers: 0,
    totalHosts: 0,
    totalTravellers: 0,
    totalExperiences: 0,
    totalPublishedExperiences: 0,
    totalBookings: 0,
    totalCompletedBookings: 0,
    grossRevenueUsd: 0,
    grossRevenueIdr: 0,
    platformRevenueUsd: 0,
    platformRevenueIdr: 0,
    ltpCirculating: 0,
    totalXpDistributed: 0,
    ltpDebitCount: 0,
    pendingKycCount: 0,
    usdToIdrRate: 17896.9,
  };

  return (
    <DashboardClientView
      stats={safeStats}
      recentBookings={recentBookings || []}
    />
  );
}
