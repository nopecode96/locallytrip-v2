import React from 'react';
import type { Metadata } from 'next';
import { getAdminReviews } from '@/actions/admin/reviews';
import { ReviewsModerationClient } from '@/components/admin/experiences/ReviewsModerationClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Reviews Moderation Center | Locallytrip CMS',
  description: 'Moderate traveler reviews, purge abusive feedback, and maintain marketplace trust.',
};

export default async function AdminReviewsPage() {
  const { reviews, stats, pagination, success, error } = await getAdminReviews({
    page: 1,
    pageSize: 10,
  });

  if (!success) {
    return (
      <div className="p-8 text-center text-rose-400 bg-rose-950/30 border border-rose-900 rounded-3xl">
        Terjadi kendala memuat data ulasan traveler: {error}
      </div>
    );
  }

  return (
    <ReviewsModerationClient
      initialReviews={reviews}
      initialPagination={pagination}
      stats={stats}
    />
  );
}
