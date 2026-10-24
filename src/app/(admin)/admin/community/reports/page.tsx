import React from 'react';
import type { Metadata } from 'next';
import { getAdminContentReports } from '@/actions/admin/reports';
import { ReportsControlClient } from '@/components/admin/community/ReportsControlClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Content Reports Moderation | Locallytrip CMS',
  description: 'Review and act on user content reports across Forums, Stories, and Meetups with fast takedown workflows.',
};

export default async function AdminContentReportsPage() {
  const { reports, stats, pagination, success, error } = await getAdminContentReports({
    page: 1,
    pageSize: 10,
  });

  if (!success) {
    return (
      <div className="p-8 text-center text-rose-400 bg-rose-950/30 border border-rose-900 rounded-3xl">
        Terjadi kendala memuat antrean laporan konten: {error}
      </div>
    );
  }

  return (
    <ReportsControlClient
      initialReports={reports}
      initialPagination={pagination}
      stats={stats}
    />
  );
}
