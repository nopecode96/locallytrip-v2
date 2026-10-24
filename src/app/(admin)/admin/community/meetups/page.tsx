import React from 'react';
import type { Metadata } from 'next';
import { getAdminMeetups } from '@/actions/admin/community/meetups';
import { MeetupsControlClient } from '@/components/admin/community/MeetupsControlClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Meetups Control | Locallytrip CMS',
  description: 'Manage community travel gatherings, attendee limits, and meetup status.',
};

export default async function AdminMeetupsPage() {
  const { meetups, stats, pagination, success, error } = await getAdminMeetups({
    page: 1,
    pageSize: 10,
  });

  if (!success) {
    return (
      <div className="p-8 text-center text-rose-400 bg-rose-950/30 border border-rose-900 rounded-3xl">
        Terjadi kendala memuat data temu komunitas: {error}
      </div>
    );
  }

  return (
    <MeetupsControlClient
      initialMeetups={meetups}
      initialPagination={pagination}
      stats={stats}
    />
  );
}
