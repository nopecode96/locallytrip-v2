'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getPublicImageUrl } from '@/lib/images';
import { requireRole } from '@/lib/admin-auth';

export interface AdminReviewItem {
  id: number;
  rating: number;
  title: string | null;
  comment: string | null;
  created_at: Date;
  is_verified: boolean;
  reviewer: {
    id: number;
    name: string;
    email: string;
    avatar_url: string | null;
  };
  experience: {
    id: number;
    title: string;
    slug: string | null;
    hostName: string;
  };
}

export interface GetAdminReviewsParams {
  search?: string;
  ratingFilter?: string; // 'all' | 'critical' (1-2) | '5' | '4' | '3' | '2' | '1'
  page?: number;
  limit?: number;
  pageSize?: number;
}

export async function getAdminReviews(params: GetAdminReviewsParams = {}) {
  try {
    await requireRole(['super admin', 'admin', 'moderator']);
    const { search = '', ratingFilter = 'all', page = 1, limit, pageSize } = params;
    const effectiveLimit = pageSize || limit || 10;
    const skip = (page - 1) * effectiveLimit;

    const where: any = {};

    if (search.trim()) {
      where.OR = [
        { comment: { contains: search.trim(), mode: 'insensitive' } },
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { users: { name: { contains: search.trim(), mode: 'insensitive' } } },
        { experiences: { title: { contains: search.trim(), mode: 'insensitive' } } },
      ];
    }

    if (ratingFilter && ratingFilter !== 'all') {
      if (ratingFilter === 'critical') {
        where.rating = { in: [1, 2] };
      } else {
        const r = parseInt(ratingFilter, 10);
        if (!isNaN(r)) {
          where.rating = r;
        }
      }
    }

    const [rawReviews, totalCount, statsSummary] = await Promise.all([
      prisma.reviews.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: effectiveLimit,
        select: {
          id: true,
          rating: true,
          title: true,
          comment: true,
          created_at: true,
          is_verified: true,
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar_url: true,
            },
          },
          experiences: {
            select: {
              id: true,
              title: true,
              slug: true,
              users: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.reviews.count({ where }),
      Promise.all([
        prisma.reviews.count(),
        prisma.reviews.count({ where: { rating: { in: [1, 2] } } }),
        prisma.reviews.count({ where: { rating: 5 } }),
        prisma.reviews.count({ where: { rating: 4 } }),
        prisma.reviews.aggregate({ _avg: { rating: true } }),
      ]),
    ]);

    const reviews: AdminReviewItem[] = rawReviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      created_at: r.created_at,
      is_verified: Boolean(r.is_verified),
      reviewer: {
        id: r.users?.id || 0,
        name: r.users?.name || 'Anonymous Traveler',
        email: r.users?.email || 'N/A',
        avatar_url: getPublicImageUrl(r.users?.avatar_url, 'users'),
      },
      experience: {
        id: r.experiences?.id || 0,
        title: r.experiences?.title || 'Unknown Tour',
        slug: r.experiences?.slug || null,
        hostName: r.experiences?.users?.name || 'Local Guide',
      },
    }));

    const [totalReviews, criticalCount, fiveStarCount, fourStarCount, avgAgg] = statsSummary;
    const totalPages = Math.ceil(totalCount / effectiveLimit);

    return {
      success: true,
      data: reviews,
      reviews,
      totalCount,
      totalPages,
      currentPage: page,
      pagination: {
        totalItems: totalCount,
        totalPages,
        currentPage: page,
        pageSize: effectiveLimit,
      },
      stats: {
        totalReviews,
        criticalCount,
        fiveStarCount,
        fourStarCount,
        averageRating: Number(avgAgg._avg?.rating || 0).toFixed(1),
      },
    };
  } catch (error: any) {
    console.error('Error fetching admin reviews:', error);
    return {
      success: false,
      reviews: [],
      totalCount: 0,
      totalPages: 1,
      currentPage: 1,
      stats: {
        totalReviews: 0,
        criticalCount: 0,
        fiveStarCount: 0,
        fourStarCount: 0,
        averageRating: '0.0',
      },
      error: error?.message || 'Failed to fetch reviews',
    };
  }
}

export async function deleteReview(reviewId: number) {
  try {
    await requireRole(['super admin', 'admin', 'moderator']);
    const existing = await prisma.reviews.findUnique({
      where: { id: reviewId },
      select: { experience_id: true },
    });

    if (!existing) {
      return { success: false, error: 'Review not found' };
    }

    await prisma.reviews.delete({
      where: { id: reviewId },
    });

    // Recalculate average rating for the target experience
    const agg = await prisma.reviews.aggregate({
      where: { experience_id: existing.experience_id },
      _avg: { rating: true },
      _count: true,
    });

    await prisma.experiences.update({
      where: { id: existing.experience_id },
      data: {
        rating_average: agg._avg.rating || 0,
        rating_count: agg._count || 0,
      },
    });

    revalidatePath('/admin/experiences/reviews');
    revalidatePath('/admin/experiences');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting review:', error);
    return { success: false, error: error?.message || 'Failed to delete review' };
  }
}
