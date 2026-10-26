import React from 'react';
import { getAdminCities, getCountryOptions } from '@/actions/admin/master';
import { CitiesControlClient } from '@/components/admin/master/CitiesControlClient';

export const dynamic = 'force-dynamic';

export default async function AdminCitiesPage() {
  const [citiesResult, countryOptionsResult] = await Promise.all([
    getAdminCities({ page: 1, limit: 10 }),
    getCountryOptions(),
  ]);

  return (
    <CitiesControlClient
      initialCities={citiesResult.data || []}
      initialPagination={
        citiesResult.pagination || {
          currentPage: 1,
          pageSize: 10,
          totalItems: 0,
          totalPages: 1,
        }
      }
      countryOptions={countryOptionsResult.data || []}
    />
  );
}
