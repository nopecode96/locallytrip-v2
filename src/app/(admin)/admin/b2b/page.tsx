import React from 'react';
import { getAdminB2BPartnersData } from '@/actions/admin/b2b';
import { B2BControlClient } from '@/components/admin/b2b/B2BControlClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'B2B Partners & Corporate Accounts | Locallytrip Admin',
  description: 'Pusat kemitraan korporat, agen perjalanan, komisi, dan tracking pemesanan referal Locallytrip.',
};

export const dynamic = 'force-dynamic';

export default async function AdminB2BPage() {
  const { partners = [], stats, pagination } = await getAdminB2BPartnersData({
    page: 1,
    pageSize: 10,
  });

  return (
    <B2BControlClient
      initialPartners={partners}
      initialPagination={pagination}
      initialStats={
        stats || {
          totalPartners: 0,
          activePartners: 0,
          totalBookingsReferred: 0,
          totalEarningsOrFeesIdr: 0,
        }
      }
    />
  );
}
