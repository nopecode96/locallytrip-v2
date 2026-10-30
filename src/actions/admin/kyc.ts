'use server';

import prisma from '@/lib/prisma';
import { enum_host_kyc_status, enum_host_kyc_id_type } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { getPublicImageUrl } from '@/lib/images';
import { getAdminStaffSession, requireRole } from '@/lib/admin-auth';

export interface AdminKycDocumentItem {
  id: number;
  documentType: string;
  filePath: string;
  fileName: string;
  previewUrl: string;
}

export interface AdminKycItem {
  id: number;
  userId: number;
  fullName: string;
  dateOfBirth: Date | null;
  placeOfBirth: string | null;
  nationality: string;
  gender: string | null;
  idType: string;
  idNumber: string;
  idExpiryDate: Date | null;
  address: string;
  city: string;
  province: string;
  country: string;
  businessName: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'unverified' | string;
  rejectionReason: string | null;
  adminNotes: string | null;
  submittedAt: Date | null;
  approvedAt: Date | null;
  createdAt: Date;
  user: {
    id: number;
    name: string | null;
    email: string;
    username: string | null;
    phone: string | null;
    avatarUrl: string | null;
    isVerified: boolean | null;
    isTrusted: boolean | null;
    role: string | null;
  };
  documents: AdminKycDocumentItem[];
}

export interface AdminKycStats {
  totalSubmissions: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
}

export interface GetAdminKycParams {
  search?: string;
  status?: string;
  idType?: string;
  page?: number;
  pageSize?: number;
  limit?: number;
}

export interface GetAdminKycResponse {
  success: boolean;
  submissions: AdminKycItem[];
  data: AdminKycItem[];
  stats: AdminKycStats;
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
  error?: string;
}

/**
 * 1. Fetch paginated KYC submissions with search, filters, and parallel counts
 */
export async function getAdminKycSubmissions(
  params: GetAdminKycParams = {}
): Promise<GetAdminKycResponse> {
  try {
    await requireRole(['super admin', 'admin', 'moderator']);

    const {
      search = '',
      status = 'all',
      idType = 'all',
      page = 1,
    } = params;

    const pageSize = params.pageSize || params.limit || 10;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    // Search query across name, id number, email, city, business name
    if (search.trim()) {
      const q = search.trim();
      where.OR = [
        { full_name: { contains: q, mode: 'insensitive' } },
        { id_number: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { business_name: { contains: q, mode: 'insensitive' } },
        {
          users_host_kyc_user_idTousers: {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
              { username: { contains: q, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    // Status filter
    if (status && status !== 'all') {
      where.status = status.toLowerCase() as enum_host_kyc_status;
    }

    // ID Type filter
    if (idType && idType !== 'all') {
      where.id_type = idType.toLowerCase() as enum_host_kyc_id_type;
    }

    // Execute database queries in parallel
    const [
      rawKycList,
      totalCount,
      totalSubmissions,
      pendingCount,
      approvedCount,
      rejectedCount,
    ] = await Promise.all([
      prisma.host_kyc.findMany({
        where,
        orderBy: [{ status: 'asc' }, { created_at: 'desc' }],
        skip,
        take: pageSize,
        include: {
          users_host_kyc_user_idTousers: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true,
              phone: true,
              avatar_url: true,
              is_verified: true,
              is_trusted: true,
              role: true,
            },
          },
          kyc_documents: {
            select: {
              id: true,
              document_type: true,
              file_path: true,
              file_name: true,
            },
          },
        },
      }),
      prisma.host_kyc.count({ where }),
      prisma.host_kyc.count(),
      prisma.host_kyc.count({ where: { status: 'pending' } }),
      prisma.host_kyc.count({ where: { status: 'approved' } }),
      prisma.host_kyc.count({ where: { status: 'rejected' } }),
    ]);

    const submissions: AdminKycItem[] = rawKycList.map((k) => {
      const u = k.users_host_kyc_user_idTousers;
      return {
        id: k.id,
        userId: k.user_id,
        fullName: k.full_name,
        dateOfBirth: k.date_of_birth,
        placeOfBirth: k.place_of_birth,
        nationality: k.nationality,
        gender: k.gender,
        idType: k.id_type,
        idNumber: k.id_number,
        idExpiryDate: k.id_expiry_date,
        address: [k.address_line_1, k.address_line_2].filter(Boolean).join(', '),
        city: k.city,
        province: k.province,
        country: k.country,
        businessName: k.business_name,
        status: k.status,
        rejectionReason: k.rejection_reason,
        adminNotes: k.admin_notes,
        submittedAt: k.submitted_at || k.created_at,
        approvedAt: k.approved_at,
        createdAt: k.created_at,
        user: {
          id: u.id,
          name: u.name,
          email: u.email,
          username: u.username,
          phone: u.phone,
          avatarUrl: getPublicImageUrl(u.avatar_url, 'users'),
          isVerified: u.is_verified,
          isTrusted: u.is_trusted,
          role: u.role,
        },
        documents: k.kyc_documents.map((d) => ({
          id: d.id,
          documentType: d.document_type,
          filePath: d.file_path,
          fileName: d.file_name,
          previewUrl: getPublicImageUrl(d.file_path, 'kyc'),
        })),
      };
    });

    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    return {
      success: true,
      submissions,
      data: submissions,
      stats: {
        totalSubmissions,
        pendingCount,
        approvedCount,
        rejectedCount,
      },
      pagination: {
        totalItems: totalCount,
        totalPages,
        currentPage: page,
        pageSize,
      },
    };
  } catch (error: any) {
    console.error('Error fetching admin KYC submissions:', error);
    return {
      success: false,
      submissions: [],
      data: [],
      stats: {
        totalSubmissions: 0,
        pendingCount: 0,
        approvedCount: 0,
        rejectedCount: 0,
      },
      pagination: {
        totalItems: 0,
        totalPages: 1,
        currentPage: 1,
        pageSize: 10,
      },
      error: error?.message || 'Database error',
    };
  }
}

/**
 * Backward compatible helper for existing callers
 */
export async function getAdminKycQueue() {
  const res = await getAdminKycSubmissions({ page: 1, pageSize: 25 });
  return {
    success: res.success,
    data: res.submissions,
    error: res.error,
  };
}

/**
 * 2. Approve KYC submission & grant Verified/Trusted host badge
 */
export async function approveKyc(
  kycId: number,
  adminNotes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireRole(['super admin', 'admin', 'moderator']);
    const reviewerId = session?.id ? Number(session.id) : 1;

    const kyc = await prisma.host_kyc.findUnique({
      where: { id: kycId },
    });

    if (!kyc) {
      return { success: false, error: 'Data KYC tidak ditemukan.' };
    }

    const now = new Date();

    await prisma.$transaction([
      prisma.host_kyc.update({
        where: { id: kycId },
        data: {
          status: 'approved',
          approved_at: now,
          reviewed_by: reviewerId,
          reviewed_at: now,
          admin_notes: adminNotes || null,
          updated_at: now,
        },
      }),
      prisma.users.update({
        where: { id: kyc.user_id },
        data: {
          is_verified: true,
          is_trusted: true,
          role: 'host', // Ensure user is elevated to host
          role_id: 2,
          updated_at: now,
        },
      }),
      prisma.notifications.create({
        data: {
          user_id: kyc.user_id,
          type: 'kyc',
          title: '🎉 Verifikasi KYC Berhasil Disetujui!',
          message: 'Selamat! Akun Anda telah resmi terverifikasi sebagai Local Host Locallytrip. Anda sekarang dapat menerbitkan paket tur dan menerima pesanan.',
          action_url: '/member/host/kyc',
          read: false,
          created_at: now,
          updated_at: now,
        },
      }),
    ]);

    revalidatePath('/admin/kyc');
    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/users');
    return { success: true };
  } catch (error: any) {
    console.error('Error approving KYC:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal menyetujui KYC.',
    };
  }
}

/**
 * 3. Reject KYC submission with explanation for host
 */
export async function rejectKyc(
  kycId: number,
  reason: string,
  adminNotes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireRole(['super admin', 'admin', 'moderator']);
    const reviewerId = session?.id ? Number(session.id) : 1;

    const kyc = await prisma.host_kyc.findUnique({
      where: { id: kycId },
    });

    if (!kyc) {
      return { success: false, error: 'Data KYC tidak ditemukan.' };
    }

    const rejectionMsg =
      reason?.trim() || 'Dokumen identitas atau foto belum memenuhi standar kejelasan Locallytrip.';

    const now = new Date();

    await prisma.$transaction([
      prisma.host_kyc.update({
        where: { id: kycId },
        data: {
          status: 'rejected',
          rejection_reason: rejectionMsg,
          admin_notes: adminNotes || null,
          reviewed_by: reviewerId,
          reviewed_at: now,
          updated_at: now,
        },
      }),
      prisma.users.update({
        where: { id: kyc.user_id },
        data: {
          is_verified: false,
          updated_at: now,
        },
      }),
      prisma.notifications.create({
        data: {
          user_id: kyc.user_id,
          type: 'kyc',
          title: 'Verifikasi KYC Memerlukan Revisi Dokumen',
          message: `Permohonan KYC Anda ditolak dengan alasan: "${rejectionMsg}". Silakan unggah ulang dokumen yang jelas dan valid.`,
          action_url: '/member/host/kyc',
          read: false,
          created_at: now,
          updated_at: now,
        },
      }),
    ]);

    revalidatePath('/admin/kyc');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Error rejecting KYC:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal menolak KYC.',
    };
  }
}
