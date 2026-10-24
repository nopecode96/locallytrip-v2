import React from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCurrentUserSession } from '@/actions/bookings';
import prisma from '@/lib/prisma';
import { KycSubmissionClient } from '@/components/dashboard/KycSubmissionClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Verifikasi Identitas & Legalitas Host (KYC) | Locallytrip',
  description:
    'Verifikasi identitas resmi Anda dan legalitas pemandu wisata untuk mendapatkan badge terverifikasi dan membuka fitur pencairan dana tur.',
};

interface KycPageProps {
  params: Promise<{
    lang: string;
  }>;
}

export const dynamic = 'force-dynamic';

export default async function KycPage({ params }: KycPageProps) {
  const resolved = await params;
  const locale = resolved.lang || 'id';

  // 1. Sesi Proteksi Autentikasi Pengguna
  let userEmail: string | null = null;
  const session = await getServerSession(authOptions).catch(() => null);
  if (session?.user?.email) {
    userEmail = session.user.email;
  } else {
    const rawSession = await getCurrentUserSession().catch(() => null);
    if (rawSession?.isLoggedIn && rawSession.email) {
      userEmail = rawSession.email;
    }
  }

  if (!userEmail) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/dashboard/kyc`);
  }

  const user = await prisma.users.findUnique({
    where: { email: userEmail.toLowerCase().trim() },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      avatar_url: true,
      is_verified: true,
      kyc_reward_status: true,
    },
  });

  if (!user) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/dashboard/kyc`);
  }

  // 2. Strict Host-Only Server Guard: Pengguna Traveller dialihkan ke become-a-host
  const isHost = user.role?.toUpperCase() === 'HOST';
  if (!isHost) {
    redirect(`/${locale}/become-a-host`);
  }

  // 3. Kueri Data Eksisting dari Prisma
  const [kycRecord, cities] = await Promise.all([
    prisma.host_kyc.findUnique({
      where: { user_id: user.id },
      include: {
        kyc_documents: {
          orderBy: { created_at: 'desc' },
        },
      },
    }),
    prisma.cities.findMany({
      where: { is_active: true },
      select: { id: true, name: true, country_code: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  // Siapkan data bersih untuk komponen klien
  const formattedKycData = kycRecord
    ? {
        id: kycRecord.id,
        status: kycRecord.status,
        idType: kycRecord.id_type,
        idNumber: kycRecord.id_number,
        fullName: kycRecord.full_name,
        dateOfBirth: kycRecord.date_of_birth
          ? kycRecord.date_of_birth.toISOString().split('T')[0]
          : '',
        placeOfBirth: kycRecord.place_of_birth,
        gender: kycRecord.gender,
        addressLine1: kycRecord.address_line_1,
        city: kycRecord.city,
        province: kycRecord.province,
        postalCode: kycRecord.postal_code,
        businessName: kycRecord.business_name,
        taxNumber: kycRecord.tax_number,
        certifications: kycRecord.certifications,
        rejectionReason: kycRecord.rejection_reason,
        submittedAt: kycRecord.submitted_at ? kycRecord.submitted_at.toISOString() : null,
        approvedAt: kycRecord.approved_at ? kycRecord.approved_at.toISOString() : null,
        documents: (kycRecord.kyc_documents || []).map((d) => ({
          id: d.id,
          documentType: d.document_type,
          filePath: d.file_path,
          fileName: d.file_name,
          verificationStatus: d.verification_status,
        })),
      }
    : null;

  return (
    <div className="w-full min-h-screen bg-slate-50/50 py-8 sm:py-12">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <KycSubmissionClient
          locale={locale}
          user={{
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            avatar_url: user.avatar_url,
            isVerified: Boolean(user.is_verified),
            kycRewardStatus: user.kyc_reward_status || 'unclaimed',
          }}
          kycData={formattedKycData}
          cities={cities}
        />
      </div>
    </div>
  );
}
