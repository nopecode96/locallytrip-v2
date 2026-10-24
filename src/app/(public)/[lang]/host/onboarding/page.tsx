import React from 'react';
import prisma from '@/lib/prisma';
import { HostOnboardingClient } from '@/components/marketplace/HostOnboardingClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Host Product Builder | Locallytrip',
  description: 'Ceritakan aktivitas wisata atau tur lokal Anda secara santai, biarkan AI Gemini menyusun produk siap pesan di Locallytrip.',
};

interface HostOnboardingPageProps {
  params: Promise<{
    lang: string;
  }>;
}

export const dynamic = 'force-dynamic';

export default async function HostOnboardingPage({
  params,
}: HostOnboardingPageProps) {
  const resolved = await params;
  const locale = resolved.lang || 'id';

  // Mengambil daftar kota terdaftar untuk dropdown
  const cities = await prisma.cities.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      <HostOnboardingClient cities={cities} locale={locale} />
    </div>
  );
}
