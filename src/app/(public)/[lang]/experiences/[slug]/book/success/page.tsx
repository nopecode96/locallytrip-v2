import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import {
  CheckCircle2,
  Calendar,
  Clock,
  Users,
  CreditCard,
  MapPin,
  ShieldCheck,
  LayoutDashboard,
  Compass,
  MessageCircle,
  Mail,
} from 'lucide-react';

interface BookingSuccessPageProps {
  params: Promise<{
    lang: string;
    slug: string;
  }>;
  searchParams: Promise<{
    ref?: string;
  }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Pemesanan Berhasil | Locallytrip',
    description: 'Reservasi tur privat Anda telah berhasil dibuat dan tercatat di sistem.',
  };
}

export default async function BookingSuccessPage({
  params,
  searchParams,
}: BookingSuccessPageProps) {
  const resolvedParams = await params;
  const resolvedQuery = await searchParams;

  const locale = resolvedParams.lang || 'id';
  const isId = locale === 'id';
  const bookingReference = resolvedQuery.ref;

  if (!bookingReference) {
    notFound();
  }

  // Kueri Data Booking dari Prisma
  const booking = await prisma.bookings.findUnique({
    where: { booking_reference: bookingReference },
    include: {
      experiences: {
        include: {
          users: {
            select: {
              name: true,
              avatar_url: true,
            },
          },
          cities: true,
        },
      },
      payments: {
        orderBy: { created_at: 'desc' },
        take: 1,
      },
    },
  });

  if (!booking || !booking.experiences) {
    notFound();
  }

  const exp = booking.experiences;
  const payment = booking.payments[0];
  const categorySpecific = (booking.category_specific as any) || {};
  const contactInfo = (booking.contact_info as any) || {};

  return (
    <div className="w-full min-h-screen bg-slate-50/50 py-8 sm:py-12">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-lg space-y-8 text-center sm:text-left">
            {/* Header Sukses dengan Centang Hijau */}
            <div className="flex flex-col items-center sm:items-start space-y-3 pb-6 border-b border-slate-100">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-9 h-9 text-emerald-600 animate-in zoom-in-75 duration-300" />
              </div>

              <div className="space-y-1 text-center sm:text-left">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
                  {isId ? 'Reservasi Berhasil Dibuat' : 'Booking Successfully Created'}
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {isId ? 'Terima Kasih atas Pemesanan Anda!' : 'Thank You for Your Booking!'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500">
                  {isId
                    ? `Voucher konfirmasi dan rincian tur telah dikirimkan ke email ${contactInfo.email || 'Anda'}.`
                    : `Confirmation voucher and itinerary details have been dispatched to ${contactInfo.email || 'your email'}.`}
                </p>
              </div>
            </div>

            {/* Kode Referensi Booking Monospaced & Status */}
            <div className="p-4 sm:p-5 rounded-2xl bg-orange-50/70 border border-orange-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              <div>
                <span className="text-[11px] font-bold text-orange-700 uppercase tracking-wider block">
                  {isId ? 'Kode Referensi Pemesanan' : 'Booking Reference'}
                </span>
                <span className="text-xl sm:text-2xl font-black text-orange-950 font-mono tracking-wider">
                  #{booking.booking_reference}
                </span>
              </div>
              <span className="px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-amber-50 text-amber-800 border border-amber-200 shadow-xs">
                {isId ? 'Menunggu Konfirmasi / Pembayaran (Pending)' : 'Pending Confirmation / Payment'}
              </span>
            </div>

            {/* Instruksi Langkah Selanjutnya */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3 text-xs sm:text-sm text-slate-700">
              <span className="font-bold text-slate-900 uppercase tracking-wider text-xs block">
                {isId ? '📋 Langkah Selanjutnya' : '📋 Next Steps'}
              </span>
              <ul className="space-y-2.5">
                <li className="flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <span>
                    {isId
                      ? 'Cek kotak masuk atau spam email Anda untuk rincian tiket dan instruksi transfer pembayaran.'
                      : 'Check your email inbox or spam folder for payment instructions and booking voucher.'}
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    {isId
                      ? `Host Anda (${exp.users?.name || 'Local Host'}) akan menghubungi nomor WhatsApp Anda untuk koordinasi titik temu dan preferensi rombongan.`
                      : `Your host (${exp.users?.name || 'Local Host'}) will connect via WhatsApp to coordinate meetup and preferences.`}
                  </span>
                </li>
              </ul>
            </div>

            {/* Rincian Tur & Pesanan */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                {isId ? 'Rincian Pengalaman Tur' : 'Tour Details'}
              </h2>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3.5 text-xs sm:text-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
                  <span className="font-semibold text-slate-800 text-sm">{exp.title}</span>
                  {exp.cities && (
                    <span className="text-slate-500 flex items-center gap-1 text-xs">
                      <MapPin className="w-3.5 h-3.5 text-orange-500" />
                      {exp.cities.name}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>
                      {booking.selected_date
                        ? new Date(booking.selected_date).toLocaleDateString(
                            locale === 'en' ? 'en-US' : 'id-ID',
                            { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
                          )
                        : '-'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>
                      {categorySpecific.selected_time
                        ? `${categorySpecific.selected_time} WIB`
                        : `${exp.duration_hours || 4} Jam`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>
                      {booking.participant_count || 1} {isId ? 'Orang Tamu (Paket Privat)' : 'Guests (Private)'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-slate-400" />
                    <span>
                      {categorySpecific.payment_method_name || payment?.payment_gateway || 'Payment Method'}
                    </span>
                  </div>

                  <div className="sm:col-span-2 pt-2 border-t border-slate-200/60 flex items-center justify-between font-bold text-slate-900">
                    <span className="text-xs uppercase text-slate-400">
                      {isId ? 'Total Tagihan' : 'Total Amount'}:
                    </span>
                    <span className="text-lg sm:text-xl text-orange-600">
                      {exp.currency} {Number(booking.total_price).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Jaminan Rekening Bersama Escrow PT Locallytrip Teknologi Indonesia */}
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-950">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                {isId
                  ? 'Dana pembayaran Anda terproteksi sepenuhnya oleh Jaminan Rekening Bersama (Escrow) PT Locallytrip Teknologi Indonesia. Dana baru diteruskan ke Host setelah tur selesai dilaksanakan dengan memuaskan.'
                  : 'Your payment is fully protected by PT Locallytrip Teknologi Indonesia Escrow Guarantee. Funds are released to the host only after your experience is successfully completed.'}
              </p>
            </div>

            {/* Tombol Aksi */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <Link
                href={`/${locale}/dashboard`}
                className="w-full sm:w-auto flex-1 min-h-[46px] px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>{isId ? 'Buka Pesanan Saya di Dashboard' : 'Open My Bookings in Dashboard'}</span>
              </Link>

              <Link
                href={`/${locale}/experiences`}
                className="w-full sm:w-auto min-h-[46px] px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm border border-slate-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Compass className="w-4 h-4 text-orange-500" />
                <span>{isId ? 'Jelajahi Aktivitas Lainnya' : 'Explore More Experiences'}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
