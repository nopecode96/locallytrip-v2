import React from 'react';
import type { Metadata } from 'next';
import { UnifiedAuthCard } from '@/components/auth/UnifiedAuthCard';

export const metadata: Metadata = {
  title: 'Masuk / Daftar Akun | Locallytrip',
  description: 'Masuk ke akun Locallytrip Anda untuk bergabung dalam diskusi komunitas, memesan aktivitas lokal, dan mengumpulkan reward LTP.',
};

interface LoginPageProps {
  params: Promise<{
    lang: string;
  }>;
  searchParams: Promise<{
    callbackUrl?: string;
  }>;
}

export default async function LoginPage({ params, searchParams }: LoginPageProps) {
  const resolvedParams = await params;
  const resolvedQuery = await searchParams;
  const lang = resolvedParams.lang === 'en' ? 'en' : 'id';
  const callbackUrl = resolvedQuery.callbackUrl || `/${lang}/dashboard`;

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/50">
      <UnifiedAuthCard
        locale={lang}
        callbackUrl={callbackUrl}
        initialMode="login"
      />
    </div>
  );
}
