import React from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCurrentUserSession } from '@/actions/bookings';
import { prisma } from '@/lib/prisma';
import { SettingsClient } from '@/components/dashboard/SettingsClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pengaturan Profil & Preferensi Akun | Locallytrip',
  description: 'Kelola data diri, kontak, rekening bank, bahasa, media sosial, dan preferensi notifikasi akun Locallytrip Anda.',
};

interface SettingsPageProps {
  params: Promise<{
    lang: string;
  }>;
}

export const dynamic = 'force-dynamic';

export default async function SettingsPage({ params }: SettingsPageProps) {
  const resolved = await params;
  const locale = resolved.lang || 'id';

  // 1. Sesi Proteksi
  let userEmail: string | null = null;
  const session = await getServerSession(authOptions);
  if (session?.user?.email) {
    userEmail = session.user.email;
  } else {
    const rawSession = await getCurrentUserSession();
    if (rawSession?.isLoggedIn && rawSession.email) {
      userEmail = rawSession.email;
    }
  }

  // Jika belum login, alihkan ke login page dengan callbackUrl
  if (!userEmail) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/dashboard/settings`);
  }

  // 2. Kueri komprehensif data pengguna beserta relasi pendukung
  const [user, cities, banks, languages, communicationApps] = await Promise.all([
    prisma.users.findUnique({
      where: { email: userEmail },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        is_verified: true,
        bio: true,
        phone: true,
        avatar_url: true,
        city_id: true,
        emergency_contact_name: true,
        emergency_contact_phone: true,
        emergency_contact_relationship: true,
        host_kyc_host_kyc_user_idTousers: {
          select: {
            status: true,
          },
        },
        notification_settings: {
          select: {
            email_bookings: true,
            email_messages: true,
            email_reviews: true,
            email_promotions: true,
            email_updates: true,
            push_bookings: true,
            push_messages: true,
            push_reviews: true,
          },
        },
        user_bank_accounts: {
          include: {
            banks: {
              select: {
                id: true,
                bank_name: true,
                bank_code: true,
                logo_url: true,
              },
            },
          },
          orderBy: { is_primary: 'desc' },
        },
        payout_settings: {
          select: {
            minimum_payout: true,
            payout_method: true,
            auto_payout: true,
          },
        },
        user_languages: {
          include: {
            languages: {
              select: {
                id: true,
                name: true,
                code: true,
                native_name: true,
              },
            },
          },
        },
        user_communication_contacts: {
          include: {
            communication_apps: {
              select: {
                id: true,
                name: true,
                display_name: true,
                icon_url: true,
              },
            },
          },
        },
      },
    }),
    prisma.cities.findMany({
      where: { is_active: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        countries: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    }),
    prisma.banks.findMany({
      where: { is_active: true },
      orderBy: { bank_name: 'asc' },
      select: {
        id: true,
        bank_name: true,
        bank_code: true,
      },
    }),
    prisma.languages.findMany({
      where: { is_active: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        code: true,
        native_name: true,
      },
    }),
    prisma.communication_apps.findMany({
      where: { is_active: true },
      orderBy: { sort_order: 'asc' },
      select: {
        id: true,
        name: true,
        display_name: true,
      },
    }),
  ]);

  if (!user) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/dashboard/settings`);
  }

  const defaultNotifSettings = {
    email_bookings: user.notification_settings?.email_bookings ?? true,
    email_messages: user.notification_settings?.email_messages ?? true,
    email_reviews: user.notification_settings?.email_reviews ?? true,
    email_promotions: user.notification_settings?.email_promotions ?? true,
    email_updates: user.notification_settings?.email_updates ?? true,
    push_bookings: user.notification_settings?.push_bookings ?? true,
    push_messages: user.notification_settings?.push_messages ?? true,
    push_reviews: user.notification_settings?.push_reviews ?? true,
  };

  return (
    <SettingsClient
      locale={locale}
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        is_verified: Boolean(user.is_verified),
        is_kyc_approved:
          user.host_kyc_host_kyc_user_idTousers?.status === 'approved' ||
          Boolean(user.is_verified),
        bio: user.bio,
        phone: user.phone,
        avatar_url: user.avatar_url,
        city_id: user.city_id,
        emergency_contact_name: user.emergency_contact_name,
        emergency_contact_phone: user.emergency_contact_phone,
        emergency_contact_relationship: user.emergency_contact_relationship,
      }}
      initialNotificationSettings={defaultNotifSettings}
      initialBankAccounts={user.user_bank_accounts.map((acc) => ({
        id: acc.id,
        bank_id: acc.bank_id,
        bank_name: acc.banks?.bank_name || 'Bank',
        bank_code: acc.banks?.bank_code || '',
        account_number: acc.account_number,
        account_holder_name: acc.account_holder_name,
        branch_name: acc.branch_name,
        is_primary: Boolean(acc.is_primary),
        is_verified: Boolean(acc.is_verified),
      }))}
      initialPayoutSettings={{
        minimum_payout: Number(user.payout_settings?.minimum_payout || 100000),
        payout_method: user.payout_settings?.payout_method || 'bank_transfer',
        auto_payout: Boolean(user.payout_settings?.auto_payout),
      }}
      initialUserLanguages={user.user_languages.map((ul) => ul.language_id).filter(Boolean) as number[]}
      initialCommunicationContacts={user.user_communication_contacts.map((c) => ({
        communicationAppId: c.communication_app_id || 0,
        appName: c.communication_apps?.name || '',
        contactValue: c.contact_value,
      }))}
      cities={cities.map((c) => ({
        id: c.id,
        name: c.name,
        country_name: c.countries?.name || null,
        country_code: c.countries?.code || null,
      }))}
      banks={banks}
      languages={languages}
      communicationApps={communicationApps}
    />
  );
}
