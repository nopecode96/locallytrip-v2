import React from 'react';
import { getAdminVouchersData, getActiveBrandPartnersForSelect } from '@/actions/admin/vouchers';
import { VouchersControlClient } from '@/components/admin/marketing/VouchersControlClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dynamic Promo Voucher Generator | Locallytrip Admin',
  description: 'Pusat pembuatan kupon diskon perjalanan, manajemen kuota, dan pelacakan diskon Locallytrip.',
};

export const dynamic = 'force-dynamic';

export default async function AdminVouchersPage() {
  const [{ vouchers = [], stats, pagination }, brandPartnersRes] = await Promise.all([
    getAdminVouchersData({
      page: 1,
      pageSize: 10,
    }),
    getActiveBrandPartnersForSelect(),
  ]);

  return (
    <VouchersControlClient
      initialVouchers={vouchers}
      initialPagination={pagination}
      initialStats={
        stats || {
          totalVouchers: 0,
          activeVouchers: 0,
          totalRedemptions: 0,
          totalDiscountGivenIdr: 0,
          expiredOrDisabled: 0,
        }
      }
      brandPartners={brandPartnersRes.data || []}
    />
  );
}
