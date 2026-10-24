import React from 'react';
import { getAdminKycSubmissions } from '@/actions/admin/kyc';
import { KycManagementClient } from '@/components/admin/kyc/KycManagementClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Host KYC Verification & Identity Curation | Locallytrip CMS',
  description: 'Validasi dokumen identitas host (KTP, Paspor, SIM), kurasi legalitas, dan status lencana terverifikasi.',
};

export const dynamic = 'force-dynamic';

export default async function AdminKycPage() {
  const { submissions = [], stats, pagination } = await getAdminKycSubmissions({
    page: 1,
    pageSize: 10,
  });

  const defaultStats = stats || {
    totalSubmissions: submissions.length,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
  };

  const defaultPagination = pagination || {
    totalItems: submissions.length,
    totalPages: Math.ceil(submissions.length / 10) || 1,
    currentPage: 1,
    pageSize: 10,
  };

  return (
    <KycManagementClient
      initialSubmissions={submissions}
      initialStats={defaultStats}
      initialPagination={defaultPagination}
    />
  );
}
