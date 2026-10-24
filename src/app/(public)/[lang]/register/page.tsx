import React from 'react';
import type { Metadata } from 'next';
import { UnifiedAuthCard } from '@/components/auth/UnifiedAuthCard';

export const metadata: Metadata = {
  title: 'Daftar Akun Baru | Locallytrip',
  description: 'Daftar akun Locallytrip baru untuk terhubung dengan traveler di seluruh dunia, menulis cerita, dan mengumpulkan reward.',
};

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
  const lang = resolvedParams.lang === 'en' ? 'en' : 'id';
  const callbackUrl = resolvedQuery.callbackUrl || `/${lang}/dashboard`;

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/50">
      <div className="w-full max-w-md">
        {/* Banner Peringatan FOMO Welcome Airdrop */}
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-100 to-orange-50 border border-amber-200 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0 select-none">🎁</span>
            <div>
              <h4 className="font-bold text-amber-900 text-sm">
                {lang === 'id' ? 'Welcome Airdrop: Edisi Peluncuran!' : 'Welcome Airdrop: Launch Edition!'}
              </h4>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                {lang === 'id' ? (
                  <>
                    Daftar hari ini dan langsung dapatkan modal{' '}
                    <strong className="font-bold text-amber-950">1.000 LTP & 500 XP</strong> di dompetmu.
                    Berlaku untuk 5.000 pendaftar pertama!
                  </>
                ) : (
                  <>
                    Sign up today and instantly claim{' '}
                    <strong className="font-bold text-amber-950">1,000 LTP & 500 XP</strong> in your
                    wallet. Valid for the first 5,000 members!
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
        />
      </div>
    </div>
  );
}
