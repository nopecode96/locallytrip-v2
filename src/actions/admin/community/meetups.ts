'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getPublicImageUrl } from '@/lib/images';
import { requireRole } from '@/lib/admin-auth';

export interface AdminMeetupItem {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  start_date: Date;
  end_date: Date;
  max_members: number | null;
  current_member_count: number;
  attendees_count: number;
  status: string;
  join_type: string;
  view_count: number;
  created_at: Date | null;
  creator: {
    id: number;
    name: string;
    email: string;
    avatar_url: string | null;
    phone: string | null;
  };
  city: {
    id: number;
    name: string;
  } | null;
}

export interface GetAdminMeetupsParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
  pageSize?: number;
}

export async function getAdminMeetups(params: GetAdminMeetupsParams = {}) {
  try {
    await requireRole(['super admin', 'admin', 'moderator']);
    const { search = '', status = 'all', page = 1, limit, pageSize } = params;
    const effectiveLimit = pageSize || limit || 10;
    const skip = (page - 1) * effectiveLimit;

    const where: any = {
      deleted_at: null,
    };

    if (search.trim()) {
      where.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { users: { name: { contains: search.trim(), mode: 'insensitive' } } },
        { users: { email: { contains: search.trim(), mode: 'insensitive' } } },
        { cities: { name: { contains: search.trim(), mode: 'insensitive' } } },
      ];
    }

    if (status && status !== 'all') {
      where.status = { equals: status.toLowerCase().trim(), mode: 'insensitive' };
    }

    const [rawMeetups, totalCount, statsSummary] = await Promise.all([
      prisma.vibes_travel_meetups.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: effectiveLimit,
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          start_date: true,
          end_date: true,
          max_members: true,
          current_member_count: true,
          status: true,
          join_type: true,
          view_count: true,
          created_at: true,
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar_url: true,
              phone: true,
            },
          },
          cities: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              vibes_travel_meetup_members: true,
            },
          },
        },
      }),
      prisma.vibes_travel_meetups.count({ where }),
      // Meetup status breakdown
      Promise.all([
        prisma.vibes_travel_meetups.count({ where: { deleted_at: null } }),
        prisma.vibes_travel_meetups.count({ where: { status: 'active', deleted_at: null } }),
        prisma.vibes_travel_meetups.count({ where: { status: 'completed', deleted_at: null } }),
        prisma.vibes_travel_meetups.count({ where: { status: 'cancelled', deleted_at: null } }),
      ]),
    ]);

    const meetups: AdminMeetupItem[] = rawMeetups.map((m) => ({
      id: m.id,
      title: m.title,
      slug: m.slug,
      description: m.description,
      start_date: m.start_date,
      end_date: m.end_date,
      max_members: m.max_members,
      current_member_count: m.current_member_count || 1,
      attendees_count: m._count?.vibes_travel_meetup_members || m.current_member_count || 1,
      status: (m.status || 'active').toLowerCase(),
      join_type: m.join_type || 'public',
      view_count: m.view_count || 0,
      created_at: m.created_at,
      creator: {
        id: m.users?.id || 0,
        name: m.users?.name || 'Unknown Host',
        email: m.users?.email || 'N/A',
        avatar_url: getPublicImageUrl(m.users?.avatar_url, 'users'),
        phone: m.users?.phone || null,
      },
      city: m.cities
        ? {
            id: m.cities.id,
            name: m.cities.name,
          }
        : null,
    }));

    const [totalMeetups, activeCount, completedCount, cancelledCount] = statsSummary;
    const totalPages = Math.ceil(totalCount / effectiveLimit);

    return {
      success: true,
      data: meetups,
      meetups,
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
        totalMeetups,
        activeCount,
        completedCount,
        cancelledCount,
      },
    };
  } catch (error: any) {
    console.error('Error fetching admin meetups:', error);
    return {
      success: false,
      meetups: [],
      totalCount: 0,
      totalPages: 1,
      currentPage: 1,
      stats: {
        totalMeetups: 0,
        activeCount: 0,
        completedCount: 0,
        cancelledCount: 0,
      },
      error: error?.message || 'Failed to fetch meetups',
    };
  }
}

export async function updateMeetupStatus(meetupId: number, newStatus: string) {
  try {
    await requireRole(['super admin', 'admin', 'moderator']);
    const statusClean = newStatus.toLowerCase().trim();
    const updated = await prisma.vibes_travel_meetups.update({
      where: { id: meetupId },
      data: {
        status: statusClean,
        updated_at: new Date(),
      },
    });

    revalidatePath('/admin/community/meetups');
    return { success: true, status: updated.status };
  } catch (error: any) {
    console.error('Error updating meetup status:', error);
    return { success: false, error: error?.message || 'Failed to update meetup status' };
  }
}

export async function deleteMeetup(meetupId: number) {
  try {
    await requireRole(['super admin', 'admin', 'moderator']);
    await prisma.vibes_travel_meetups.update({
      where: { id: meetupId },
      data: {
        deleted_at: new Date(),
        status: 'cancelled',
      },
    });

    revalidatePath('/admin/community/meetups');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting meetup:', error);
    return { success: false, error: error?.message || 'Failed to delete meetup' };
  }
}
