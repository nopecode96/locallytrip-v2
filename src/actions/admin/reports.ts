'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getPublicImageUrl } from '@/lib/images';
import { requireRole } from '@/lib/admin-auth';

export interface AdminReportItem {
  id: number;
  target_type: 'forum_thread' | 'forum_post' | 'story' | 'meetup';
  target_id: number;
  reporter_id: number;
  reason: string;
  description: string | null;
  status: string; // 'pending', 'reviewed', 'resolved', 'dismissed'
  created_at: Date;
  updated_at: Date;
  reporter: {
    id: number;
    name: string;
    email: string;
    avatar_url: string | null;
    role: string;
  };
  targetPreview?: {
    id: number;
    title: string;
    excerpt?: string | null;
    slug?: string | null;
    url?: string;
    cover_image?: string | null;
    authorName?: string;
    authorEmail?: string;
    currentStatus?: string;
  } | null;
}

export interface GetAdminReportsParams {
  search?: string;
  status?: string;
  targetType?: string;
  page?: number;
  pageSize?: number;
  limit?: number;
}

export async function getAdminContentReports(params: GetAdminReportsParams = {}) {
  try {
    await requireRole(['super admin', 'admin', 'moderator']);
    const {
      search = '',
      status = 'all',
      targetType = 'all',
      page = 1,
    } = params;

    const pageSize = params.pageSize || params.limit || 10;
    const skip = (page - 1) * pageSize;
    const where: any = {};

    if (status !== 'all') {
      where.status = status;
    }

    if (targetType !== 'all') {
      where.target_type = targetType;
    }

    if (search.trim()) {
      where.OR = [
        { reason: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
        {
          reporter: {
            OR: [
              { name: { contains: search.trim(), mode: 'insensitive' } },
              { email: { contains: search.trim(), mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    // Query in parallel: telemetry stats, total filtered count, and reports page
    const [
      totalCount,
      rawReports,
      pendingCount,
      reviewedCount,
      resolvedCount,
      dismissedCount,
    ] = await Promise.all([
      prisma.content_reports.count({ where }),
      prisma.content_reports.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { created_at: 'desc' },
        include: {
          reporter: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar_url: true,
              role: true,
            },
          },
        },
      }),
      prisma.content_reports.count({ where: { status: 'pending' } }),
      prisma.content_reports.count({ where: { status: 'reviewed' } }),
      prisma.content_reports.count({ where: { status: 'resolved' } }),
      prisma.content_reports.count({ where: { status: 'dismissed' } }),
    ]);

    // Hydrate targets asynchronously
    const reports: AdminReportItem[] = await Promise.all(
      rawReports.map(async (rep) => {
        let targetPreview: AdminReportItem['targetPreview'] = null;

        try {
          if (rep.target_type === 'forum_thread') {
            const thread = await prisma.vibes_forum_threads.findUnique({
              where: { id: rep.target_id },
              select: {
                id: true,
                title: true,
                slug: true,
                status: true,
                users_vibes_forum_threads_author_idTousers: { select: { name: true, email: true } },
              },
            });
            if (thread) {
              targetPreview = {
                id: thread.id,
                title: thread.title,
                slug: thread.slug,
                url: `/id/community/forums/${thread.slug}`,
                authorName: thread.users_vibes_forum_threads_author_idTousers?.name,
                authorEmail: thread.users_vibes_forum_threads_author_idTousers?.email,
                currentStatus: thread.status || 'active',
              };
            }
          } else if (rep.target_type === 'forum_post') {
            const post = await prisma.vibes_forum_posts.findUnique({
              where: { id: rep.target_id },
              select: {
                id: true,
                content: true,
                status: true,
                users: { select: { name: true, email: true } },
                vibes_forum_threads: { select: { id: true, title: true, slug: true } },
              },
            });
            if (post) {
              targetPreview = {
                id: post.id,
                title: `Balasan di "${post.vibes_forum_threads?.title || 'Utas Komunitas'}"`,
                excerpt: post.content,
                slug: post.vibes_forum_threads?.slug,
                url: post.vibes_forum_threads?.slug ? `/id/community/forums/${post.vibes_forum_threads.slug}` : undefined,
                authorName: post.users?.name,
                authorEmail: post.users?.email,
                currentStatus: post.status || 'active',
              };
            }
          } else if (rep.target_type === 'story') {
            const story = await prisma.stories.findUnique({
              where: { id: rep.target_id },
              select: {
                id: true,
                title: true,
                slug: true,
                excerpt: true,
                cover_image: true,
                status: true,
                users_stories_author_idTousers: { select: { name: true, email: true } },
              },
            });
            if (story) {
              targetPreview = {
                id: story.id,
                title: story.title,
                excerpt: story.excerpt,
                slug: story.slug,
                url: `/id/community/stories/${story.slug || story.id}`,
                cover_image: getPublicImageUrl(story.cover_image, 'stories'),
                authorName: story.users_stories_author_idTousers?.name,
                authorEmail: story.users_stories_author_idTousers?.email,
                currentStatus: story.status || 'draft',
              };
            }
          } else if (rep.target_type === 'meetup') {
            const meetup = await prisma.vibes_travel_meetups.findUnique({
              where: { id: rep.target_id },
              select: {
                id: true,
                title: true,
                slug: true,
                description: true,
                cover_image: true,
                status: true,
                users: { select: { name: true, email: true } },
              },
            });
            if (meetup) {
              targetPreview = {
                id: meetup.id,
                title: meetup.title,
                excerpt: meetup.description,
                slug: meetup.slug,
                url: `/id/community/meetups/${meetup.slug || meetup.id}`,
                cover_image: getPublicImageUrl(meetup.cover_image, 'banners'),
                authorName: meetup.users?.name,
                authorEmail: meetup.users?.email,
                currentStatus: meetup.status || 'active',
              };
            }
          }
        } catch (enrichErr) {
          console.error(`Failed to enrich target ${rep.target_type} #${rep.target_id}:`, enrichErr);
        }

        return {
          id: rep.id,
          target_type: rep.target_type as AdminReportItem['target_type'],
          target_id: rep.target_id,
          reporter_id: rep.reporter_id,
          reason: rep.reason,
          description: rep.description,
          status: rep.status,
          created_at: rep.created_at,
          updated_at: rep.updated_at,
          reporter: {
            id: rep.reporter.id,
            name: rep.reporter.name,
            email: rep.reporter.email,
            avatar_url: getPublicImageUrl(rep.reporter.avatar_url, 'users'),
            role: rep.reporter.role,
          },
          targetPreview,
        };
      })
    );

    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    return {
      success: true,
      reports,
      data: reports,
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
        totalReports: pendingCount + reviewedCount + resolvedCount + dismissedCount,
        pendingCount,
        reviewedCount,
        resolvedCount,
        dismissedCount,
      },
    };
  } catch (error: any) {
    console.error('Error fetching admin content reports:', error);
    return {
      success: false,
      reports: [],
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
        totalReports: 0,
        pendingCount: 0,
        reviewedCount: 0,
        resolvedCount: 0,
        dismissedCount: 0,
      },
      error: error?.message || 'Failed to fetch content reports',
    };
  }
}

export async function updateReportStatus(reportId: number, newStatus: 'pending' | 'reviewed' | 'resolved' | 'dismissed') {
  try {
    await requireRole(['super admin', 'admin', 'moderator']);
    const updated = await prisma.content_reports.update({
      where: { id: reportId },
      data: {
        status: newStatus,
        updated_at: new Date(),
      },
    });

    revalidatePath('/admin/community/reports');
    return { success: true, report: updated };
  } catch (error: any) {
    console.error('Error updating report status:', error);
    return { success: false, error: error?.message || 'Gagal mengubah status laporan' };
  }
}

export async function takedownReportedContent(reportId: number) {
  try {
    await requireRole(['super admin', 'admin', 'moderator']);
    const report = await prisma.content_reports.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return { success: false, error: 'Laporan tidak ditemukan.' };
    }

    const { target_type, target_id } = report;

    // Execute target takedown based on type
    if (target_type === 'forum_thread') {
      await prisma.vibes_forum_threads.update({
        where: { id: target_id },
        data: {
          status: 'hidden',
          deleted_at: new Date(),
        },
      });
      revalidatePath('/admin/community/forums');
    } else if (target_type === 'forum_post') {
      await prisma.vibes_forum_posts.update({
        where: { id: target_id },
        data: {
          status: 'hidden',
          deleted_at: new Date(),
        },
      });
      revalidatePath('/admin/community/forums');
    } else if (target_type === 'story') {
      await prisma.stories.update({
        where: { id: target_id },
        data: {
          status: 'draft',
          is_featured: false,
        },
      });
      revalidatePath('/admin/community/stories');
    } else if (target_type === 'meetup') {
      await prisma.vibes_travel_meetups.update({
        where: { id: target_id },
        data: {
          status: 'cancelled',
          is_active: false,
        },
      });
      revalidatePath('/admin/community/meetups');
    }

    // Mark current report and any other pending reports on this target as resolved
    await prisma.content_reports.updateMany({
      where: {
        target_type,
        target_id,
        status: { in: ['pending', 'reviewed'] },
      },
      data: {
        status: 'resolved',
        updated_at: new Date(),
      },
    });

    revalidatePath('/admin/community/reports');
    return {
      success: true,
      message: `Konten (${target_type} #${target_id}) berhasil di-takedown dan status laporan diselesaikan.`,
    };
  } catch (error: any) {
    console.error('Error taking down reported content:', error);
    return { success: false, error: error?.message || 'Gagal melakukan takedown konten.' };
  }
}
