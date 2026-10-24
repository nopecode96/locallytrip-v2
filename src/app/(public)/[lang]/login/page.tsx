import React from 'react';
import type { Metadata } from 'next';
import { UnifiedAuthCard } from '@/components/auth/UnifiedAuthCard';
import { getDictionary, Locale } from '@/lib/dictionary';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const resolved = await params;
  const lang = (resolved.lang === 'en' ? 'en' : 'id') as Locale;
  const isId = lang === 'id';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://locallytrip.com';

  const title = isId
    ? 'Masuk ke Akun Anda | Locallytrip'
    : 'Sign In to Your Account | Locallytrip';
  const description = isId
    ? 'Masuk ke akun Locallytrip Anda untuk bergabung dalam diskusi komunitas, memesan aktivitas lokal, dan mengumpulkan reward kredit LTP.'
    : 'Sign in to your Locallytrip account to join community discussions, book local activities, and earn LTP travel credits.';

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/${lang}/login`,
      languages: {
        'id-ID': `${siteUrl}/id/login`,
        'en-US': `${siteUrl}/en/login`,
      },
    },
  };
}

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
  const lang = (resolvedParams.lang === 'en' ? 'en' : 'id') as Locale;
  const callbackUrl = resolvedQuery.callbackUrl || `/${lang}/dashboard`;
  const dict = await getDictionary(lang);

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/50">
      <UnifiedAuthCard
        locale={lang}
        callbackUrl={callbackUrl}
        initialMode="login"
        dict={dict}
      />
    </div>
  );
}
