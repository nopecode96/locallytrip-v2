import React from 'react';
import type { Metadata } from 'next';
import { AdminThemeProvider } from '@/components/admin/AdminThemeProvider';
import { AdminShell } from '@/components/admin/AdminShell';

export const metadata: Metadata = {
  title: 'Locallytrip CMS | Interactive Admin Console',
  description: 'Next-generation modern SaaS operational dashboard for Locallytrip platform administration.',
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: { url: '/apple-touch-icon.png', sizes: '180x180' },
  },
  robots: {
    index: false,
    follow: false,
  },
};

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const initialRole = (session?.user as any)?.role || null;

  return (
    <AdminThemeProvider>
      <AdminShell initialRole={initialRole}>{children}</AdminShell>
    </AdminThemeProvider>
  );
}
