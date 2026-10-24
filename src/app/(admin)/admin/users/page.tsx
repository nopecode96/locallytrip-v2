import React from 'react';
import type { Metadata } from 'next';
import { getAdminUsers } from '@/actions/admin/users';
import { UsersManagementClient } from '@/components/admin/users/UsersManagementClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'User Management & Registrations | Locallytrip CMS',
  description: 'Inspect and manage registered travellers, hosts, staff roles, and KYC statuses.',
};

export default async function AdminUsersPage() {
  const { users, stats, pagination, success, error } = await getAdminUsers({
    page: 1,
    pageSize: 10,
  });

  if (!success) {
    return (
      <div className="p-8 text-center text-rose-400 bg-rose-950/30 border border-rose-900 rounded-3xl">
        Terjadi kendala memuat data pengguna: {error}
      </div>
    );
  }

  return (
    <UsersManagementClient
      initialUsers={users}
      initialPagination={pagination}
      stats={stats}
    />
  );
}
