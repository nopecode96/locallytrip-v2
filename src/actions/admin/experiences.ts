'use server';

import prisma from '@/lib/prisma';
import { enum_experiences_status } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { getPublicImageUrl } from '@/lib/images';
import { requireRole } from '@/lib/admin-auth';

export interface AdminExperienceCatalogItem {
  id: number;
  title: string;
  slug: string | null;
  package_price: number | null;
  currency: string;
  duration_hours: number | null;
  max_participants: number | null;
  status: string;
  is_active: boolean;
  is_featured: boolean;
  rating_average: number;
  rating_count: number;
  booking_count: number;
  total_bookings: number;
  cover_image: string | null;
  host: {
    id: number;
    name: string;
    email: string;
    avatar_url: string | null;
    is_verified: boolean;
  };
  city: string | null;
  category: string | null;
}

export interface GetAdminExperiencesParams {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  limit?: number;
}

function extractCoverImage(images: any): string | null {
  return getPublicImageUrl(images, 'experiences');
}

export async function getAdminExperiences(params: GetAdminExperiencesParams = {}) {
  try {
    await requireRole(['super admin', 'admin', 'moderator', 'marketing']);
    const { search = '', status = 'all', page = 1 } = params;
    const pageSize = params.pageSize || params.limit || 10;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (search.trim()) {
      where.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { users: { name: { contains: search.trim(), mode: 'insensitive' } } },
        { cities: { name: { contains: search.trim(), mode: 'insensitive' } } },
        { host_categories: { name: { contains: search.trim(), mode: 'insensitive' } } },
      ];
    }

    if (status && status !== 'all') {
      where.status = status as enum_experiences_status;
    }

    const [rawExperiences, totalCount, statsSummary] = await Promise.all([
      prisma.experiences.findMany({
        where,
        orderBy: { id: 'desc' },
        skip,
        take: pageSize,
        select: {
          id: true,
          title: true,
          slug: true,
          package_price: true,
          currency: true,
          duration_hours: true,
          max_participants: true,
          status: true,
          is_active: true,
          is_featured: true,
          rating_average: true,
          rating_count: true,
          booking_count: true,
          images: true,
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar_url: true,
              is_verified: true,
            },
          },
          cities: {
            select: {
              name: true,
            },
          },
          host_categories: {
            select: {
              name: true,
            },
          },
          _count: {
            select: {
              bookings: true,
            },
          },
        },
      }),
      prisma.experiences.count({ where }),
      Promise.all([
        prisma.experiences.count(),
        prisma.experiences.count({ where: { status: 'published' } }),
        prisma.experiences.count({ where: { status: 'draft' } }),
        prisma.experiences.count({ where: { status: 'archived' } }),
        prisma.experiences.count({ where: { is_featured: true } }),
      ]),
    ]);

    const experiences: AdminExperienceCatalogItem[] = rawExperiences.map((e) => ({
      id: e.id,
      title: e.title,
      slug: e.slug,
      package_price: e.package_price ? Number(e.package_price) : null,
      currency: e.currency || 'USD',
      duration_hours: e.duration_hours,
      max_participants: e.max_participants,
      status: e.status || 'draft',
      is_active: Boolean(e.is_active),
      is_featured: Boolean(e.is_featured),
      rating_average: e.rating_average ? Number(e.rating_average) : 0,
      rating_count: e.rating_count || 0,
      booking_count: e.booking_count || 0,
      total_bookings: e._count?.bookings || e.booking_count || 0,
      cover_image: extractCoverImage(e.images),
      host: {
        id: e.users?.id || 0,
        name: e.users?.name || 'Local Guide',
        email: e.users?.email || 'N/A',
        avatar_url: getPublicImageUrl(e.users?.avatar_url, 'users'),
        is_verified: Boolean(e.users?.is_verified),
      },
      city: e.cities?.name || 'Local Area',
      category: e.host_categories?.name || 'Tour',
    }));

    const [totalExperiences, publishedCount, draftCount, archivedCount, featuredCount] = statsSummary;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    return {
      success: true,
      experiences,
      data: experiences,
      totalCount,
      totalPages,
      currentPage: page,
      pagination: {
        totalItems: totalCount,
        totalPages,
        currentPage: page,
        pageSize,
      },
      stats: {
        totalExperiences,
        publishedCount,
        draftCount,
        archivedCount,
        featuredCount,
      },
    };
  } catch (error: any) {
    console.error('Error fetching admin experiences:', error);
    return {
      success: false,
      experiences: [],
      data: [],
      totalCount: 0,
      totalPages: 1,
      currentPage: 1,
      pagination: {
        totalItems: 0,
        totalPages: 1,
        currentPage: 1,
        pageSize: 10,
      },
      stats: {
        totalExperiences: 0,
        publishedCount: 0,
        draftCount: 0,
        archivedCount: 0,
        featuredCount: 0,
      },
      error: error?.message || 'Failed to fetch experiences',
    };
  }
}

export async function toggleExperienceStatus(experienceId: number, currentStatus: string) {
  try {
    await requireRole(['super admin', 'admin', 'moderator']);
    const nextStatus: enum_experiences_status =
      currentStatus === 'published' ? 'draft' : 'published';

    const updated = await prisma.experiences.update({
      where: { id: experienceId },
      data: {
        status: nextStatus,
        is_active: nextStatus === 'published',
      },
    });

    revalidatePath('/admin/experiences');
    return { success: true, status: updated.status };
  } catch (error: any) {
    console.error('Error toggling experience status:', error);
    return { success: false, error: error?.message || 'Failed to update experience status' };
  }
}

export async function toggleExperienceFeatured(experienceId: number, currentFeatured: boolean) {
  try {
    await requireRole(['super admin', 'admin', 'moderator', 'marketing']);
    const updated = await prisma.experiences.update({
      where: { id: experienceId },
      data: {
        is_featured: !currentFeatured,
      },
    });

    revalidatePath('/admin/experiences');
    return { success: true, is_featured: updated.is_featured };
  } catch (error: any) {
    console.error('Error toggling experience featured:', error);
    return { success: false, error: error?.message || 'Failed to update featured state' };
  }
}

export async function archiveExperience(experienceId: number) {
  try {
    await requireRole(['super admin', 'admin', 'moderator']);
    const updated = await prisma.experiences.update({
      where: { id: experienceId },
      data: {
        status: 'archived',
        is_active: false,
      },
    });

    revalidatePath('/admin/experiences');
    return { success: true, status: updated.status };
  } catch (error: any) {
    console.error('Error archiving experience:', error);
    return { success: false, error: error?.message || 'Failed to archive experience' };
  }
}
