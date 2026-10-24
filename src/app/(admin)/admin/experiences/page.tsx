import React from 'react';
import type { Metadata } from 'next';
import { getAdminExperiences } from '@/actions/admin/experiences';
import { ExperiencesControlClient } from '@/components/admin/experiences/ExperiencesControlClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Experiences Catalog Control | Locallytrip CMS',
  description: 'Manage tour package catalog listings, publish states, and homepage featured placements.',
};

export default async function AdminExperiencesPage() {
  const { experiences, stats, pagination, success, error } = await getAdminExperiences({
    page: 1,
    pageSize: 10,
  });

  if (!success) {
    return (
      <div className="p-8 text-center text-rose-400 bg-rose-950/30 border border-rose-900 rounded-3xl">
        Terjadi kendala memuat data katalog tur: {error}
      </div>
    );
  }

  return (
    <ExperiencesControlClient
      initialExperiences={experiences}
      initialPagination={pagination}
      stats={stats}
    />
  );
}
