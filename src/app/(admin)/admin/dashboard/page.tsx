import React from 'react';
import { getAdminDashboardOverview } from '@/actions/admin/dashboard';
import { getAiQuotaTelemetry } from '@/lib/ai/quotaTracker';
import { getAdminStaffSession } from '@/lib/admin-auth';
import { DashboardClientView } from '@/components/admin/DashboardClientView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard Overview | Locallytrip Admin',
  description: 'Telemetri ekosistem marketplace, pengguna, pengalaman, dan arus kas keuangan Locallytrip.',
};

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const [{ stats, recentBookings, error }, aiTelemetry, staffSession] = await Promise.all([
    getAdminDashboardOverview(),
    getAiQuotaTelemetry(),
    getAdminStaffSession(),
  ]);

  // If there was an error, log it and provide graceful fallback stats
  if (error) {
    console.warn('[AdminDashboardPage] Notice from overview server action:', error);
  }

  const userRole = (staffSession?.role || '').toLowerCase().trim();
  const isSuperAdmin = userRole === 'super admin' || userRole === 'superadmin';

  // Sembunyikan AI Synthetic Personas & Seeding Telemetry jika bukan superadmin
  const filteredAiTelemetry = aiTelemetry
    ? {
        ...aiTelemetry,
        syntheticSeedStats: isSuperAdmin ? aiTelemetry.syntheticSeedStats : undefined,
      }
    : undefined;

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
      aiTelemetry={filteredAiTelemetry}
      isSuperAdmin={isSuperAdmin}
    />
  );
}

