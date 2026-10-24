import React, { Suspense } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Loader2 } from 'lucide-react';
import { BrandApplyClient } from '@/components/partners/BrandApplyClient';

interface BrandApplyPageProps {
  params: Promise<{
    lang: string;
  }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const lang = resolvedParams.lang === 'en' ? 'en' : 'id';
  const isId = lang === 'id';

  const title = isId
    ? 'Formulir Pendaftaran Kemitraan Brand B2B | Locallytrip'
    : 'B2B Brand Partnership Application | Locallytrip';

  const description = isId
    ? 'Daftarkan penawaran voucher dan produk brand Anda untuk program kemitraan barter koin LTP atau featured sponsor di Locallytrip.'
    : 'Submit your brand voucher and promotional perks offer for the Locallytrip barter marketplace or featured sponsorship.';

  return {
    title,
    description,
  };
}

export default async function BrandApplyPage({ params }: BrandApplyPageProps) {
  const resolvedParams = await params;
  const locale = resolvedParams.lang === 'en' ? 'en' : 'id';
  const isId = locale === 'id';

  return (
    <div className="w-full min-h-screen bg-slate-50/50 py-8 sm:py-12">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* 1. Breadcrumbs sejajar lurus di max-w-7xl */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 font-medium"
        >
          <Link href={`/${locale}`} className="hover:text-purple-700 transition">
            {isId ? 'Beranda' : 'Home'}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link href={`/${locale}/partner-with-us`} className="hover:text-purple-700 transition">
            {isId ? 'Kerjasama Brand' : 'Brand Partnerships'}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-semibold">{isId ? 'Pendaftaran' : 'Apply'}</span>
        </nav>

        {/* 2. Grid 2 Kolom B2B Seimbang */}
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-20 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          }
        >
          <BrandApplyClient locale={locale} />
        </Suspense>
      </div>
    </div>
  );
}
