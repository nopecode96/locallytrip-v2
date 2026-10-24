import React from 'react';
import type { Metadata } from 'next';
import { getAdminStories } from '@/actions/admin/community/stories';
import { StoriesControlClient } from '@/components/admin/community/StoriesControlClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Stories & Travel Journal Control | Locallytrip CMS',
  description: 'Moderate member-published travel stories, review draft narratives, and track readerships.',
};

export default async function AdminStoriesPage() {
  const { stories, stats, pagination, success, error } = await getAdminStories({
    page: 1,
    pageSize: 10,
  });

  if (!success) {
    return (
      <div className="p-8 text-center text-rose-400 bg-rose-950/30 border border-rose-900 rounded-3xl">
        Terjadi kendala memuat data cerita perjalanan: {error}
      </div>
    );
  }

  return (
    <StoriesControlClient
      initialStories={stories}
      initialPagination={pagination}
      stats={stats}
    />
  );
}
