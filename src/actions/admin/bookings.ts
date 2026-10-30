'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getPublicImageUrl } from '@/lib/images';
import { requireRole } from '@/lib/admin-auth';

export interface AdminBookingItem {
  id: number;
  booking_reference: string;
  selected_date: Date | null;
  selected_time: Date | null;
  participant_count: number;
  total_price: number;
  status: string;
  special_requests: string | null;
  created_at: Date;
  traveller: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
  };
  experience: {
    id: number;
    title: string;
    slug: string | null;
    package_price: number | null;
    currency: string | null;
  };
  host: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
    is_verified: boolean;
  } | null;
}

export interface GetAdminBookingsParams {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  limit?: number;
}

export async function getAdminBookings(params: GetAdminBookingsParams = {}) {
  try {
    await requireRole(['super admin', 'admin', 'finances']);

    const { search = '', status = 'all', page = 1 } = params;
    const pageSize = params.pageSize || params.limit || 10;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (search.trim()) {
      where.OR = [
        { booking_reference: { contains: search.trim(), mode: 'insensitive' } },
        { users: { name: { contains: search.trim(), mode: 'insensitive' } } },
        { users: { email: { contains: search.trim(), mode: 'insensitive' } } },
        { experiences: { title: { contains: search.trim(), mode: 'insensitive' } } },
      ];
    }

    if (status && status !== 'all') {
      where.status = { equals: status.toLowerCase().trim(), mode: 'insensitive' };
    }

    const [rawBookings, totalCount, statsSummary] = await Promise.all([
      prisma.bookings.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: pageSize,
        select: {
          id: true,
          booking_reference: true,
          selected_date: true,
          selected_time: true,
          participant_count: true,
          total_price: true,
          status: true,
          special_requests: true,
          created_at: true,
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar_url: true,
            },
          },
          experiences: {
            select: {
              id: true,
              title: true,
              slug: true,
              package_price: true,
              currency: true,
              users: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                  avatar_url: true,
                  is_verified: true,
                },
              },
            },
          },
        },
      }),
      prisma.bookings.count({ where }),
      // Aggregate booking statuses
      Promise.all([
        prisma.bookings.count(),
        prisma.bookings.count({ where: { status: { in: ['confirmed', 'CONFIRMED'] } } }),
        prisma.bookings.count({ where: { status: { in: ['pending', 'PENDING'] } } }),
        prisma.bookings.count({ where: { status: { in: ['completed', 'COMPLETED'] } } }),
        prisma.bookings.count({ where: { status: { in: ['cancelled', 'CANCELLED'] } } }),
        prisma.bookings.aggregate({ _sum: { total_price: true } }),
      ]),
    ]);

    const bookings: AdminBookingItem[] = rawBookings.map((b) => ({
      id: b.id,
      booking_reference: b.booking_reference || `#${b.id}`,
      selected_date: b.selected_date,
      selected_time: b.selected_time,
      participant_count: b.participant_count || 1,
      total_price: Number(b.total_price || 0),
      status: (b.status || 'pending').toLowerCase(),
      special_requests: b.special_requests,
      created_at: b.created_at,
      traveller: {
        id: b.users?.id || 0,
        name: b.users?.name || 'Unknown Traveller',
        email: b.users?.email || 'N/A',
        phone: b.users?.phone || null,
        avatar_url: getPublicImageUrl(b.users?.avatar_url, 'users'),
      },
      experience: {
        id: b.experiences?.id || 0,
        title: b.experiences?.title || 'Untitled Tour Experience',
        slug: b.experiences?.slug || null,
        package_price: b.experiences?.package_price ? Number(b.experiences.package_price) : null,
        currency: b.experiences?.currency || 'USD',
      },
      host: b.experiences?.users
        ? {
            id: b.experiences.users.id,
            name: b.experiences.users.name || 'Local Guide',
            email: b.experiences.users.email,
            phone: b.experiences.users.phone,
            avatar_url: getPublicImageUrl(b.experiences.users.avatar_url, 'users'),
            is_verified: Boolean(b.experiences.users.is_verified),
          }
        : null,
    }));

    const [totalBookings, confirmedCount, pendingCount, completedCount, cancelledCount, gmvSum] = statsSummary;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    return {
      success: true,
      bookings,
      data: bookings,
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
        totalBookings,
        confirmedCount,
        pendingCount,
        completedCount,
        cancelledCount,
        totalGmvUsd: Number(gmvSum._sum.total_price || 0),
      },
    };
  } catch (error: any) {
    console.error('Error fetching admin bookings:', error);
    return {
      success: false,
      bookings: [],
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
        totalBookings: 0,
        confirmedCount: 0,
        pendingCount: 0,
        completedCount: 0,
        cancelledCount: 0,
        totalGmvUsd: 0,
      },
      error: error?.message || 'Failed to fetch bookings',
    };
  }
}

export async function updateBookingStatus(bookingId: number, newStatus: string) {
  try {
    await requireRole(['super admin', 'admin', 'finances']);

    const statusClean = newStatus.toLowerCase().trim();
    const updated = await prisma.bookings.update({
      where: { id: bookingId },
      data: {
        status: statusClean,
        updated_at: new Date(),
      },
    });

    revalidatePath('/admin/bookings');
    return { success: true, status: updated.status };
  } catch (error: any) {
    console.error('Error updating booking status:', error);
    return { success: false, error: error?.message || 'Failed to update booking status' };
  }
}
