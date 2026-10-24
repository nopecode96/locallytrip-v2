import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCurrentUserSession } from '@/actions/bookings';
import { prisma } from '@/lib/prisma';
import { BecomeHostClient } from '@/components/host/BecomeHostClient';
import Link from 'next/link';
import { Sparkles, LayoutDashboard, ShieldCheck, CheckCircle2, Users } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Daftar Jadi Local Host (+100 XP) | Locallytrip',
  description: 'Daftar menjadi Local Host di Locallytrip dan raih bonus +100 XP. Pandu wisatawan lokal dan internasional menikmati hidden gems kotamu.',
};

interface BecomeHostPageProps {
  params: Promise<{
    lang: string;
  }>;
  searchParams?: Promise<{
    start?: string;
  }>;
}

export const dynamic = 'force-dynamic';

export default async function BecomeHostPage({ params, searchParams }: BecomeHostPageProps) {
  const resolved = await params;
  const resolvedSearch = searchParams ? await searchParams : undefined;
  const locale = resolved.lang || 'id';
  const isId = locale === 'id';
  const startParam = resolvedSearch?.start === 'true' || resolvedSearch?.start === '1';

  // 1. Cek Sesi Pengguna
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

  // 2. Ambil data pengguna jika sudah login
  let user: {
    id: number;
    name: string | null;
    role: string | null;
    is_verified: boolean | null;
    city_id: number | null;
  } | null = null;

  if (userEmail) {
    user = await prisma.users.findUnique({
      where: { email: userEmail },
      select: {
        id: true,
        name: true,
        role: true,
        is_verified: true,
        city_id: true,
      },
    });
  }

  // 3. Jika pengguna SUDAH menjadi HOST, tampilkan kartu status aktif & akses cepat
  const isHost = user?.role?.toUpperCase() === 'HOST';

  // 4. Ambil data master kota, kategori host, dan bahasa langsung dari Prisma
  const [cities, hostCategories, languages] = await Promise.all([
    prisma.cities.findMany({
      where: { is_active: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
    prisma.host_categories.findMany({
      where: { is_active: true },
      orderBy: { sort_order: 'asc' },
      select: { id: true, name: true, icon: true, description: true },
    }),
    prisma.languages.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, native_name: true, code: true },
    }),
  ]);

  return (
    <div className="w-full min-h-[calc(100vh-80px)] bg-slate-50/50 py-10 sm:py-14">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {isHost ? (
          <>
            {/* Breadcrumbs Navigasi */}
            <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6 font-medium">
              <Link className="hover:text-purple-600 transition" href={`/${locale}`}>
                {isId ? 'Beranda' : 'Home'}
              </Link>
              <span>›</span>
              <span className="text-slate-800 font-semibold">
                {isId ? 'Status Host' : 'Host Status'}
              </span>
            </nav>

            {/* KARTU UTAMA: HOST HUB & STATUS AKTIF (Full Width max-w-7xl) */}
            <div className="w-full bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 shadow-xs mb-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                {/* Kolom Kiri: Ikon, Badge Status, & Salam Hangat */}
                <div className="flex items-start gap-5 max-w-2xl">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center shrink-0 shadow-xs">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold mb-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{isId ? 'Status: Local Host Aktif' : 'Status: Active Local Host'}</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                      {isId
                        ? `Halo ${user?.name || 'Host'}, Anda Sudah Terdaftar Sebagai Host!`
                        : `Hello ${user?.name || 'Host'}, You are Already a Registered Host!`}
                    </h1>
                    <p className="text-slate-600 text-sm sm:text-base mt-2 leading-relaxed">
                      {isId
                        ? 'Akun Anda sudah memiliki hak akses Host penuh. Anda dapat langsung mengelola reservasi tamu di Dashboard atau mulai merancang paket pengalaman tur baru menggunakan bantuan AI Copilot.'
                        : 'Your account has full Host access privileges. You can manage guest bookings in your Dashboard or start designing new tour experiences with AI Copilot.'}
                    </p>
                  </div>
                </div>

                {/* Kolom Kanan: Tombol Aksi Cepat */}
                <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-auto shrink-0">
                  <Link
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm shadow-sm transition-all hover:shadow-md"
                    href={`/${locale}/experiences/create`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isId ? 'Buat Pengalaman Tur Baru' : 'Create New Tour Experience'}</span>
                  </Link>
                  <Link
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-all"
                    href={`/${locale}/dashboard`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>{isId ? 'Buka Dashboard Host' : 'Open Host Dashboard'}</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* 3 KARTU PINTASAN FITUR HOST (Grid 3 Kolom Menghiasi Ruang Kosong Bawah) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Kartu 1: AI Experience Builder */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {isId ? 'Rancang Tur Cepat dengan AI' : 'Design Tour Quickly with AI'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {isId
                      ? 'Cukup masukkan foto, tarif, dan ide santai Anda. AI Copilot akan menyusun deskripsi dwi-bahasa dan rute tur secara otomatis.'
                      : 'Just enter photos, pricing, and your simple idea. AI Copilot crafts bilingual descriptions and itineraries automatically.'}
                  </p>
                </div>
                <Link
                  className="mt-4 text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1"
                  href={`/${locale}/experiences/create`}
                >
                  {isId ? 'Mulai Buat Tur →' : 'Start Creating Tour →'}
                </Link>
              </div>

              {/* Kartu 2: Verifikasi Identitas (KYC) */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {isId ? 'Lencana Pemandu Terpercaya' : 'Trusted Guide Badge'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {isId
                      ? 'Tingkatkan konversi pemesanan dengan melengkapi identitas resmi Anda untuk memperoleh lencana KYC Verified.'
                      : 'Boost your booking conversions by completing official identity verification to receive the KYC Verified badge.'}
                  </p>
                </div>
                <Link
                  className="mt-4 text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  href={`/${locale}/dashboard`}
                >
                  {isId ? 'Cek Status Profil →' : 'Check Profile Status →'}
                </Link>
              </div>

              {/* Kartu 3: Komunitas & Tips Host */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                    <Users className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {isId ? 'Komunitas & Teman Jalan' : 'Community & Travel Mates'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {isId
                      ? 'Berinteraksi dengan sesama penjelajah, diskusikan rute lokal di Forum, atau adakan agenda Meetup santai di kotamu.'
                      : 'Connect with fellow explorers, discuss local routes in Forums, or host casual Meetups in your city.'}
                  </p>
                </div>
                <Link
                  className="mt-4 text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                  href={`/${locale}/community`}
                >
                  {isId ? 'Buka Komunitas →' : 'Open Community →'}
                </Link>
              </div>
            </div>
          </>
        ) : (
          /* Landing Edukasi Keuntungan & Multi-Step Wizard */
          <BecomeHostClient
            cities={cities}
            hostCategories={hostCategories}
            languages={languages}
            locale={locale}
            initialShowWizard={startParam && !!user}
          />
        )}
      </div>
    </div>
  );
}
