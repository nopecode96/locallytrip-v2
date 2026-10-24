import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { ExperienceReviewClient } from '@/components/experiences/ExperienceReviewClient';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, CheckCircle2, Star, Clock } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Beri Ulasan Pengalaman Tur (+20 XP & +5 LTP) | Locallytrip',
  description: 'Bagikan pengalaman dan ulasan nyata Anda tentang pemandu lokal. Dapatkan bonus +20 XP dan +5 LTP untuk setiap ulasan terverifikasi.',
};

interface ReviewPageProps {
  params: Promise<{
    lang: string;
    slug: string;
  }>;
  searchParams?: Promise<{
    bookingId?: string;
  }>;
}

export const dynamic = 'force-dynamic';

export default async function ExperienceReviewPage({
  params,
  searchParams,
}: ReviewPageProps) {
  const resolved = await params;
  const resolvedSearch = searchParams ? await searchParams : undefined;
  const locale = resolved.lang || 'id';
  const rawId = resolved.slug;
  const isId = locale === 'id';

  // 1. Sesi Proteksi Pengguna
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/experiences/${rawId}/review${resolvedSearch?.bookingId ? `?bookingId=${resolvedSearch.bookingId}` : ''}`);
  }

  // 2. Cari Pengalaman Tur berdasarkan ID numerik atau Slug
  const isNumeric = /^\d+$/.test(rawId);
  const experience = await prisma.experiences.findFirst({
    where: isNumeric ? { id: Number(rawId) } : { slug: rawId },
    select: {
      id: true,
      title: true,
      slug: true,
      images: true,
      users: {
        select: { name: true },
      },
      cities: {
        select: { name: true },
      },
    },
  });

  if (!experience) {
    return (
      <main className="min-h-screen bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="max-w-xl mx-auto bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4">
            <h2 className="text-xl font-bold text-slate-900">
              {isId ? 'Pengalaman Tur Tidak Ditemukan' : 'Tour Experience Not Found'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              {isId
                ? 'Paket pengalaman tur yang ingin Anda ulas tidak tersedia atau telah dinonaktifkan.'
                : 'The tour experience you are trying to review is not available.'}
            </p>
            <Link
              href={`/${locale}/dashboard`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white font-bold text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{isId ? 'Kembali ke Dashboard' : 'Back to Dashboard'}</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // 3. Validasi Booking
  let targetBooking = null;

  if (resolvedSearch?.bookingId) {
    const specifiedBooking = await prisma.bookings.findFirst({
      where: {
        id: Number(resolvedSearch.bookingId),
        experience_id: experience.id,
        user_id: user.id,
      },
    });

    if (specifiedBooking) {
      const status = (specifiedBooking.status || '').toLowerCase();
      if (status !== 'completed') {
        // Status belum selesai (pending atau confirmed)
        return (
          <main className="min-h-screen bg-slate-50/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
              <div className="max-w-xl mx-auto bg-white rounded-3xl p-8 sm:p-10 border border-amber-200 shadow-sm text-center space-y-5">
                <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto ring-8 ring-amber-50/50">
                  <Clock className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                    {isId ? 'Aktivitas Belum Selesai' : 'Tour Not Yet Completed'}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                    {isId ? 'Aktivitas Tur Belum Selesai' : 'Tour Session in Progress or Scheduled'}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {isId
                      ? 'Aktivitas tur belum selesai. Anda baru dapat memberikan ulasan setelah check-in dilakukan oleh pemandu.'
                      : 'This tour activity is not completed yet. You will be able to submit a review once the local guide completes your check-in.'}
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href={`/${locale}/dashboard`}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white font-bold text-xs sm:text-sm hover:bg-slate-800 transition min-h-[44px]"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>{isId ? 'Kembali ke Dashboard' : 'Back to Dashboard'}</span>
                  </Link>
                  <Link
                    href={`/${locale}/experiences/${experience.slug || experience.id}`}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-purple-600 text-white font-bold text-xs sm:text-sm hover:bg-purple-700 transition min-h-[44px]"
                  >
                    <span>{isId ? 'Lihat Halaman Tur' : 'View Tour Page'}</span>
                  </Link>
                </div>
              </div>
            </div>
          </main>
        );
      }
      targetBooking = specifiedBooking;
    }
  }

  // Jika tidak ada searchParams bookingId, cari booking completed pertama untuk user ini
  if (!targetBooking) {
    targetBooking = await prisma.bookings.findFirst({
      where: {
        experience_id: experience.id,
        user_id: user.id,
        status: { in: ['completed', 'COMPLETED'] },
      },
      orderBy: { id: 'desc' },
    });
  }

  // Jika user sama sekali tidak memiliki booking completed pada tur ini
  if (!targetBooking) {
    return (
      <main className="min-h-screen bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="max-w-xl mx-auto bg-white rounded-3xl p-8 sm:p-10 border border-amber-200 shadow-sm text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto ring-8 ring-amber-50/50">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                {isId ? 'Hanya untuk Tamu Terverifikasi' : 'Verified Guests Only'}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                {isId ? 'Pesanan Belum Selesai' : 'No Completed Booking Found'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {isId
                  ? 'Ulasan hanya dapat diberikan setelah Anda memesan dan menyelesaikan sesi tur ini bersama pemandu lokal.'
                  : 'Reviews can only be submitted after booking and completing the tour experience with the local host.'}
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={`/${locale}/dashboard`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white font-bold text-xs sm:text-sm hover:bg-slate-800 transition min-h-[44px]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{isId ? 'Kembali ke Dashboard' : 'Back to Dashboard'}</span>
              </Link>
              <Link
                href={`/${locale}/experiences/${experience.slug || experience.id}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-purple-600 text-white font-bold text-xs sm:text-sm hover:bg-purple-700 transition min-h-[44px]"
              >
                <span>{isId ? 'Lihat Jadwal Tur' : 'View Tour Schedule'}</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // 4. Cek apakah sudah pernah mengirimkan ulasan untuk booking ini
  const existingReview = await prisma.reviews.findFirst({
    where: {
      booking_id: targetBooking.id,
      user_id: user.id,
    },
  });

  if (existingReview) {
    return (
      <main className="min-h-screen bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="max-w-xl mx-auto bg-white rounded-3xl p-8 sm:p-10 border border-emerald-100 shadow-sm text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50/50">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                <Star className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                <span>{isId ? 'Ulasan Sudah Diterima' : 'Review Already Submitted'}</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                {isId ? 'Anda sudah memberikan ulasan untuk pesanan ini. Terima kasih!' : 'You already reviewed this booking. Thank you!'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {isId
                  ? 'Terima kasih atas partisipasi Anda! Ulasan Anda telah tayang di profil pengalaman tur ini.'
                  : 'Thank you for your feedback! Your review is already published for this experience.'}
              </p>
            </div>

            {/* Rincian Ulasan Lama */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < existingReview.rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-200 fill-slate-200'
                      }`}
                    />
                  ))}
                  <span className="ml-1.5 text-xs font-bold text-slate-800">
                    {existingReview.rating} / 5
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  {new Date(existingReview.created_at).toLocaleDateString(isId ? 'id-ID' : 'en-US', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              {existingReview.comment && (
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                  "{existingReview.comment}"
                </p>
              )}
              {existingReview.host_reply && (
                <div className="mt-2.5 p-3 rounded-xl bg-purple-50 border border-purple-100 text-xs text-purple-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                    <span>{isId ? 'Tanggapan Pemandu:' : 'Host Response:'}</span>
                  </div>
                  <p className="italic text-slate-600">"{existingReview.host_reply}"</p>
                </div>
              )}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={`/${locale}/dashboard`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white font-bold text-xs sm:text-sm hover:bg-slate-800 transition min-h-[44px]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{isId ? 'Kembali ke Dashboard' : 'Back to Dashboard'}</span>
              </Link>
              <Link
                href={`/${locale}/experiences/${experience.slug || experience.id}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-purple-600 text-white font-bold text-xs sm:text-sm hover:bg-purple-700 transition min-h-[44px]"
              >
                <span>{isId ? 'Lihat Halaman Aktivitas Tur' : 'View Tour Page'}</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Parse thumbnail image
  let coverImage: string | null = null;
  if (Array.isArray(experience.images) && experience.images.length > 0) {
    coverImage = typeof experience.images[0] === 'string' ? experience.images[0] : null;
  }

  return (
    <main className="min-h-screen bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <ExperienceReviewClient
          experience={{
            id: experience.id,
            title: experience.title,
            slug: experience.slug,
            coverImage,
            hostName: experience.users?.name || 'Local Host',
            cityName: experience.cities?.name || 'Indonesia',
          }}
          bookingId={targetBooking.id}
          locale={locale}
        />
      </div>
    </main>
  );
}
