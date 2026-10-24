import React from 'react';
import type { Metadata } from 'next';
import { getAdminBookings } from '@/actions/admin/bookings';
import { BookingsManagementClient } from '@/components/admin/bookings/BookingsManagementClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Bookings Control & Host Quick-Contact | Locallytrip CMS',
  description: 'Manage traveller tour reservations and access instant host quick-contact tools.',
};

export default async function AdminBookingsPage() {
  const { bookings, stats, pagination, success, error } = await getAdminBookings({
    page: 1,
    pageSize: 10,
  });

  if (!success) {
    return (
      <div className="p-8 text-center text-rose-400 bg-rose-950/30 border border-rose-900 rounded-3xl">
        Terjadi kendala memuat data reservasi pesanan: {error}
      </div>
    );
  }

  return (
    <BookingsManagementClient
      initialBookings={bookings}
      initialPagination={pagination}
      stats={stats}
    />
  );
}
