import React from 'react';
import { getAdminCountries } from '@/actions/admin/master';
import { CountriesControlClient } from '@/components/admin/master/CountriesControlClient';

export const dynamic = 'force-dynamic';

export default async function AdminCountriesPage() {
  const result = await getAdminCountries({ page: 1, limit: 20 });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <CountriesControlClient
        initialCountries={result.data || []}
        initialPagination={
          result.pagination || {
            currentPage: 1,
            pageSize: 20,
            totalItems: 0,
            totalPages: 1,
          }
        }
      />
    </div>
  );
}
