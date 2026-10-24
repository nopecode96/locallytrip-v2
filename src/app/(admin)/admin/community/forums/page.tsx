import React from 'react';
import type { Metadata } from 'next';
import { getAdminForumThreads } from '@/actions/admin/community/forums';
import { ForumsControlClient } from '@/components/admin/community/ForumsControlClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Forums Control & Moderation | Locallytrip CMS',
  description: 'Moderate forum threads, pin important topics, lock conversations, and fight spam.',
};

export default async function AdminForumsPage() {
  const { threads, categories, stats, pagination, success, error } = await getAdminForumThreads({
    page: 1,
    pageSize: 10,
  });

  if (!success) {
    return (
      <div className="p-8 text-center text-rose-400 bg-rose-950/30 border border-rose-900 rounded-3xl">
        Terjadi kendala memuat data forum komunitas: {error}
      </div>
    );
  }

  return (
    <ForumsControlClient
      initialThreads={threads}
      initialPagination={pagination}
      categories={categories}
      stats={stats}
    />
  );
}
