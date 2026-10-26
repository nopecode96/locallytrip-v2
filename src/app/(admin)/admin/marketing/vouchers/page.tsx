import React from 'react';
import {
  getAdminVouchersData,
  getActiveBrandPartnersForSelect,
  getAdminBrandCampaigns,
} from '@/actions/admin/vouchers';
import { VouchersControlClient } from '@/components/admin/marketing/VouchersControlClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dynamic Promo Voucher Generator | Locallytrip Admin',
  description: 'Pusat pembuatan kupon diskon perjalanan, manajemen kuota, dan pelacakan diskon Locallytrip.',
};

export const dynamic = 'force-dynamic';

interface AdminVouchersPageProps {
  searchParams?: Promise<{
    tab?: string;
  }>;
}

export default async function AdminVouchersPage({ searchParams }: AdminVouchersPageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const initialMasterTab =
    resolvedParams?.tab === 'perks' ? 'brand_perks' : 'booking_coupons';

  const [
    { vouchers = [], stats, pagination },
    brandPartnersRes,
    brandCampaignsRes,
  ] = await Promise.all([
    getAdminVouchersData({
      page: 1,
      pageSize: 10,
    }),
    getActiveBrandPartnersForSelect(),
    getAdminBrandCampaigns(),
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
      initialBrandCampaigns={brandCampaignsRes.campaigns || []}
      initialMasterTab={initialMasterTab}
    />
  );
}
