import React from 'react';
import { getAdminCountries } from '@/actions/admin/master';
import { CountriesControlClient } from '@/components/admin/master/CountriesControlClient';

export const dynamic = 'force-dynamic';

export default async function AdminCountriesPage() {
  const result = await getAdminCountries({ page: 1, limit: 10 });

  return (
    <CountriesControlClient
      initialCountries={result.data || []}
      initialPagination={
        result.pagination || {
          currentPage: 1,
          pageSize: 10,
          totalItems: 0,
          totalPages: 1,
        }
      }
    />
  );
}
