'use server';

import prisma from '@/lib/prisma';
import { enum_experiences_status } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/admin-auth';

export interface AdminStats {
  totalUsers: number;
  totalExperiences: number;
  totalBookings: number;
  grossRevenueUsd: number;
  grossRevenueIdr: number;
  platformRevenueUsd: number;
  platformRevenueIdr: number;
  ltpCirculating: number;
  ltpDebitCount: number;
  pendingKycCount: number;
  usdToIdrRate: number;
}

export interface AdminRecentBooking {
  id: number;
  bookingReference: string | null;
  experienceTitle: string;
  customerName: string;
  customerEmail: string;
  selectedDate: Date | null;
  participantCount: number | null;
  totalPrice: number;
  status: string | null;
  createdAt: Date;
}

export interface AdminExperienceItem {
  id: number;
  title: string;
  slug: string | null;
  status: string;
  isActive: boolean | null;
  packagePrice: number | null;
  currency: string | null;
  city: string;
  hostName: string;
  hostEmail: string;
  createdAt: Date;
}

import { getAdminDashboardOverview as fetchDashboardOverview } from './dashboard';

export async function getAdminDashboardOverview() {
  return fetchDashboardOverview();
}

export async function getAdminDashboardStats() {
  return fetchDashboardOverview();
}

import {
  getAdminKycSubmissions as fetchKycSubmissions,
  getAdminKycQueue as fetchKycQueue,
  approveKyc as executeApproveKyc,
  rejectKyc as executeRejectKyc,
} from './kyc';

export async function getAdminKycSubmissions(params?: any) {
  return fetchKycSubmissions(params);
}

export async function getAdminKycQueue() {
  return fetchKycQueue();
}

export async function approveKyc(kycId: number, adminNotes?: string) {
  return executeApproveKyc(kycId, adminNotes);
}

export async function rejectKyc(kycId: number, reason: string, adminNotes?: string) {
  return executeRejectKyc(kycId, reason, adminNotes);
}

/**
 * 5. Ambil Seluruh Listing Experiences untuk Manajemen Admin
 */
export async function getAdminExperiencesList(): Promise<{
  success: boolean;
  data?: AdminExperienceItem[];
  error?: string;
}> {
  try {
    await requireRole(['super admin', 'admin', 'moderator', 'marketing']);

    const list = await prisma.experiences.findMany({
      orderBy: { created_at: 'desc' },
      take: 50,
      include: {
        cities: { select: { name: true } },
        users: { select: { name: true, email: true } },
      },
    });

    const formatted: AdminExperienceItem[] = list.map((e) => ({
      id: e.id,
      title: e.title,
      slug: e.slug,
      status: e.status,
      isActive: e.is_active,
      packagePrice: e.package_price ? Number(e.package_price) : null,
      currency: e.currency || 'USD',
      city: e.cities?.name || 'Destinasi',
      hostName: e.users?.name || 'Local Host',
      hostEmail: e.users?.email || '-',
      createdAt: e.created_at,
    }));

    return { success: true, data: formatted };
  } catch (error) {
    console.error('Error fetching admin experiences list:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Database error' };
  }
}

/**
 * 6. Server Action: Toggle Aktif/Nonaktifkan Experience
 */
export async function toggleExperienceActive(
  experienceId: number,
  currentStatus: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole(['super admin', 'admin', 'moderator']);

    await prisma.experiences.update({
      where: { id: experienceId },
      data: {
        is_active: !currentStatus,
        updated_at: new Date(),
      },
    });

    revalidatePath('/admin/experiences');
    revalidatePath('/id');
    revalidatePath('/en');
    return { success: true };
  } catch (error) {
    console.error('Error toggling experience active status:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Gagal memperbarui status.' };
  }
}

