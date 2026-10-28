import React from 'react';
import { getAdminFeeConfigurations } from '@/actions/admin/master';
import { FeesControlClient } from '@/components/admin/master/FeesControlClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Konfigurasi Fee Transaksi Experiences | Locallytrip Admin',
  description: 'Manajemen take-rate fee transaksi tur experiences (0-12%) berbasis append-only versioning.',
};

export const dynamic = 'force-dynamic';

export default async function AdminFeesPage() {
  const res = await getAdminFeeConfigurations('EXPERIENCES');

  return <FeesControlClient initialConfigs={res.data || []} />;
}
