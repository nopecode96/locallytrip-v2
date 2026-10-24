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
    ? 'Daftar Akun Baru | Locallytrip'
    : 'Create a New Account | Locallytrip';
  const description = isId
    ? 'Daftar akun Locallytrip baru untuk terhubung dengan traveler di seluruh dunia, menulis cerita, dan mengumpulkan reward kredit LTP.'
    : 'Create a new Locallytrip account to connect with global travelers, publish stories, and earn LTP travel credits.';

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/${lang}/register`,
      languages: {
        'id-ID': `${siteUrl}/id/register`,
        'en-US': `${siteUrl}/en/register`,
      },
    },
  };
}

interface RegisterPageProps {
  params: Promise<{
    lang: string;
  }>;
  searchParams: Promise<{
    callbackUrl?: string;
  }>;
}

export default async function RegisterPage({ params, searchParams }: RegisterPageProps) {
  const resolvedParams = await params;
  const resolvedQuery = await searchParams;
  const lang = (resolvedParams.lang === 'en' ? 'en' : 'id') as Locale;
  const callbackUrl = resolvedQuery.callbackUrl || `/${lang}/dashboard`;
  const dict = await getDictionary(lang);

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/50">
      <div className="w-full max-w-md">
        {/* Banner Welcome Reward */}
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-100 to-orange-50 border border-amber-200 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0 select-none">🎁</span>
            <div>
              <h4 className="font-bold text-amber-900 text-sm">
                {lang === 'id' ? 'Welcome Reward: Edisi Peluncuran!' : 'Welcome Reward: Launch Edition!'}
              </h4>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                {lang === 'id' ? (
                  <>
                    Daftar hari ini dan langsung dapatkan modal{' '}
                    <strong className="font-bold text-amber-950">1.000 Kredit LTP & 500 XP</strong> di dompetmu.
                    Gunakan untuk diskon pemesanan tur dan aktivitas komunitas!
                  </>
                ) : (
                  <>
                    Sign up today and instantly claim{' '}
                    <strong className="font-bold text-amber-950">1,000 LTP Credits & 500 XP</strong> in your
                    wallet. Redeemable for tour booking discounts and community perks!
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        <UnifiedAuthCard
          locale={lang}
          callbackUrl={callbackUrl}
          initialMode="register"
          dict={dict}
        />
      </div>
    </div>
  );
}
