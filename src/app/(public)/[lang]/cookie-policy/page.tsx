import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Cookie, ShieldCheck, Database, Zap, Lock, ChevronRight } from 'lucide-react';

interface CookiePolicyPageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: CookiePolicyPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const isId = resolvedParams.lang !== 'en';
  return {
    title: isId ? 'Kebijakan Penggunaan Cookie & Cache | Locallytrip' : 'Cookie & Cache Policy | Locallytrip',
    description: isId
      ? 'Pelajari bagaimana Locallytrip menggunakan cookie dan mekanisme cache lokal untuk menjaga keamanan sesi, preferensi pengguna, dan kecepatan platform.'
      : 'Learn how Locallytrip utilizes cookies and local cache storage to protect user sessions, remember preferences, and accelerate platform performance.',
  };
}

export default async function CookiePolicyPage({ params }: CookiePolicyPageProps) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang === 'en' ? 'en' : 'id';
  const isId = lang === 'id';

  return (
    <div className="w-full min-h-screen bg-slate-50/50 py-8 sm:py-12">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Breadcrumb Nav */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 font-medium">
          <Link href={`/${lang}`} className="hover:text-purple-700 transition">
            {isId ? 'Beranda' : 'Home'}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-semibold">
            {isId ? 'Kebijakan Cookie & Cache' : 'Cookie & Cache Policy'}
          </span>
        </nav>

        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-xs space-y-8">
          <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 shadow-xs">
              <Cookie className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900">
                {isId ? 'Kebijakan Penggunaan Cookie & Cache' : 'Cookie & Cache Policy'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {isId ? 'Terakhir diperbarui: 24 Oktober 2026' : 'Last updated: October 24, 2026'}
              </p>
            </div>
          </div>

          <div className="prose max-w-none text-slate-600 space-y-6 text-sm sm:text-base leading-relaxed">
            <p>
              {isId
                ? 'Locallytrip menggunakan cookie dan mekanisme penyimpanan lokal (cache) untuk berbagai fungsi esensial platform:'
                : 'Locallytrip uses cookies and local storage mechanisms (cache) for various essential platform functions:'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 not-prose">
              <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2.5">
                <div className="flex items-center gap-2 text-purple-700 font-bold text-sm">
                  <Lock className="w-4 h-4" />
                  <span>{isId ? 'Autentikasi & Sesi (Wajib)' : 'Authentication & Sessions'}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {isId
                    ? 'Menyimpan token sesi login agar Anda tidak perlu login berulang kali dan transaksi pemesanan berjalan aman.'
                    : 'Stores login session tokens so you do not need to log in repeatedly and bookings stay secure.'}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2.5">
                <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
                  <Database className="w-4 h-4" />
                  <span>{isId ? 'Preferensi Pengguna' : 'User Preferences'}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {isId
                    ? 'Mengingat pengaturan bahasa dan mata uang yang Anda pilih (IDR/USD) serta preferensi filter komunitas.'
                    : 'Remembers your chosen language and currency settings (IDR/USD) plus community filters.'}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2.5">
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                  <Zap className="w-4 h-4" />
                  <span>{isId ? 'Performa & Kecepatan' : 'Performance & Speed'}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {isId
                    ? 'Melakukan caching pada data tur, gambar, dan forum agar halaman memuat instan saat Anda berpindah navigasi.'
                    : 'Caches tour data, media assets, and forums so pages load instantaneously as you navigate.'}
                </p>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <h3 className="font-bold text-slate-900 text-base">
                {isId ? 'Manajemen Cookie pada Peramban' : 'Managing Cookies in Your Browser'}
              </h3>
              <p>
                {isId
                  ? 'Anda dapat mengontrol atau menghapus cookie melalui pengaturan browser Anda kapan saja. Harap diperhatikan bahwa menonaktifkan cookie esensial dapat memengaruhi kemampuan Anda untuk masuk ke akun dan memproses pembayaran tur.'
                  : 'You can control or delete cookies through your browser settings at any time. Please note that disabling essential cookies may impact your ability to log in and process experience bookings.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 flex items-start gap-3 not-prose">
              <ShieldCheck className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
              <p className="text-xs text-purple-900 leading-relaxed">
                {isId
                  ? 'Dengan menggunakan platform ini, Anda menyetujui penyimpanan data lokal sesuai dengan kebijakan privasi PT Locallytrip Teknologi Indonesia.'
                  : 'By using this platform, you agree to local data storage in accordance with PT Locallytrip Teknologi Indonesia privacy policy.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
