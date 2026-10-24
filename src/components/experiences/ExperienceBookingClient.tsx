'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  ShieldCheck,
  CreditCard,
  QrCode,
  Building,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Coins,
  Loader2,
  Lock,
  MapPin,
} from 'lucide-react';
import { PaymentMethodOption } from '@/config/payment-gateways';
import { createBookingOrder } from '@/actions/bookings/create';
import { UserAvatar } from '@/components/common/UserAvatar';

export interface ExperienceBookingData {
  id: number;
  slug: string;
  title: string;
  package_price: number;
  currency: string;
  max_guests: number;
  duration_hours: number;
  cover_image_url: string;
  meeting_point?: string | null;
  host: {
    id: number;
    name: string;
    avatar_url?: string | null;
  } | null;
  city: {
    name: string;
  } | null;
}

export interface UserBookingProfile {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  ltp_balance: number;
}

interface ExperienceBookingClientProps {
  experience: ExperienceBookingData;
  user: UserBookingProfile;
  paymentMethods: PaymentMethodOption[];
  locale: string;
}

export function ExperienceBookingClient({
  experience,
  user,
  paymentMethods,
  locale,
}: ExperienceBookingClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isId = locale === 'id';

  // Default tanggal esok hari (H+1)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDateStr = tomorrow.toISOString().split('T')[0];

  // State Form
  const [selectedDate, setSelectedDate] = useState<string>(minDateStr);
  const [selectedTime, setSelectedTime] = useState<string>('08:00');
  const [participantCount, setParticipantCount] = useState<number>(2);
  const [contactName, setContactName] = useState<string>(user.name || '');
  const [contactEmail, setContactEmail] = useState<string>(user.email || '');
  const [contactPhone, setContactPhone] = useState<string>(user.phone || '');
  const [specialRequests, setSpecialRequests] = useState<string>('');

  // State Pembayaran & Diskon
  const [selectedMethodId, setSelectedMethodId] = useState<string>(
    paymentMethods[0]?.id || ''
  );
  const [promoCodeInput, setPromoCodeInput] = useState<string>('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [useLtp, setUseLtp] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Format harga sesuai mata uang tur (USD / IDR)
  const formatTourPrice = (amount: number) => {
    const curr = (experience.currency || 'USD').toUpperCase();
    if (curr === 'IDR') {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
      }).format(Math.round(amount));
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Kalkulasi Harga (Tarif Flat per Paket)
  const basePrice = Number(experience.package_price);
  const promoDiscount = appliedPromo ? appliedPromo.discount : 0;
  const priceAfterPromo = Math.max(0, basePrice - promoDiscount);

  // Potongan Koin LTP (Maksimal 50% dari harga dasar tur)
  const maxLtpAllowed = basePrice * 0.5;
  const ltpDiscount = useLtp ? Math.min(user.ltp_balance, maxLtpAllowed, priceAfterPromo) : 0;
  const finalTotalPrice = Math.max(0, basePrice - promoDiscount - ltpDiscount);

  // Handle Terapkan Promo
  const handleApplyPromo = () => {
    setPromoError(null);
    if (!promoCodeInput.trim()) return;

    const code = promoCodeInput.trim().toUpperCase();
    if (code === 'LOCALLYEXPLORE') {
      const disc = Math.round(basePrice * 0.15 * 100) / 100;
      setAppliedPromo({ code, discount: disc });
    } else if (code === 'WELCOME5') {
      const disc = Math.min(5, basePrice * 0.2);
      setAppliedPromo({ code, discount: disc });
    } else {
      setPromoError(
        isId
          ? 'Kode promo tidak valid atau sudah kedaluwarsa.'
          : 'Invalid or expired promo code.'
      );
    }
  };

  // Submit Handler
  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedDate) {
      setErrorMessage(isId ? 'Pilih tanggal pelaksanaan tur.' : 'Please choose a tour date.');
      return;
    }

    if (!contactName.trim() || !contactEmail.trim() || !contactPhone.trim()) {
      setErrorMessage(
        isId
          ? 'Mohon lengkapi seluruh data nama, email, dan nomor WhatsApp pemesan.'
          : 'Please complete your full name, email, and WhatsApp number.'
      );
      return;
    }

    if (!selectedMethodId) {
      setErrorMessage(isId ? 'Pilih salah satu metode pembayaran.' : 'Please select a payment method.');
      return;
    }

    startTransition(async () => {
      const res = await createBookingOrder({
        experienceId: experience.id,
        slug: experience.slug,
        selectedDate,
        selectedTime,
        participantCount,
        contactInfo: {
          name: contactName,
          email: contactEmail,
          phone: contactPhone,
        },
        specialRequests,
        paymentMethodId: selectedMethodId,
        promoCode: appliedPromo?.code,
        useLtp,
        lang: locale,
      });

      if (!res.success) {
        setErrorMessage(
          res.error || (isId ? 'Gagal memproses pesanan. Silakan coba kembali.' : 'Failed to process booking.')
        );
      } else if (res.redirectUrl || res.redirect_url) {
        router.push(res.redirectUrl || res.redirect_url || '');
      }
    });
  };

  // Render Icon Method Helper
  const renderMethodIcon = (icon: string) => {
    switch (icon) {
      case 'paypal':
        return <CreditCard className="w-5 h-5 text-blue-600" />;
      case 'qris':
        return <QrCode className="w-5 h-5 text-rose-600" />;
      case 'bank':
        return <Building className="w-5 h-5 text-indigo-600" />;
      default:
        return <CreditCard className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="w-full space-y-8">
      {/* 1. Navigasi Atas & Judul */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href={`/${locale}/experiences/${experience.slug}`}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-orange-600 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4 text-orange-500" />
            <span>{isId ? 'Kembali ke Detail Tur' : 'Back to Tour Details'}</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {isId ? 'Reservasi & Pembayaran Tur' : 'Book & Secure Your Tour'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isId
              ? 'Lengkapi rincian rombongan dan amankan sesi privat eksklusif bersama host.'
              : 'Complete your group details and secure an exclusive private tour session with your local host.'}
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold self-start sm:self-auto shadow-2xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>{isId ? 'Jaminan Escrow Rekening Bersama' : 'Escrow Protected'}</span>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2. Formulir 2 Kolom Responsif (12 Kolom Grid) */}
      <form onSubmit={handleSubmitBooking} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        {/* ========================================================== */}
        {/* KOLOM KIRI: FORMULIR PEMESANAN (lg:col-span-8)             */}
        {/* ========================================================== */}
        <div className="lg:col-span-8 space-y-6 sm:space-y-8">
          {/* Kartu 1: Jadwal & Peserta Rombongan */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-500" />
              <span>{isId ? 'Jadwal & Peserta Rombongan' : 'Date & Group Size'}</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {isId ? 'Tanggal Pelaksanaan' : 'Tour Date'} *
                </label>
                <input
                  type="date"
                  min={minDateStr}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {isId ? 'Waktu / Jam Mulai Tur' : 'Start Time'}
                </label>
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  <option value="08:00">08:00 WIB (Pagi Nyaman)</option>
                  <option value="10:00">10:00 WIB (Sesi Menengah)</option>
                  <option value="13:30">13:30 WIB (Siang / Jelang Sore)</option>
                  <option value="14:00">14:00 WIB (Sesi Sore)</option>
                  <option value="16:00">16:00 WIB (Sunset Walk / Twilight)</option>
                </select>
              </div>
            </div>

            {/* Pengatur Jumlah Peserta Rombongan */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    {isId ? 'Jumlah Peserta Rombongan' : 'Number of Guests'}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {isId
                      ? `Maksimal hingga ${experience.max_guests} orang rombongan`
                      : `Up to ${experience.max_guests} guests allowed`}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setParticipantCount((prev) => Math.max(1, prev - 1))}
                    disabled={participantCount <= 1}
                    className="w-9 h-9 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold flex items-center justify-center disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-extrabold text-base text-slate-900">
                    {participantCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setParticipantCount((prev) => Math.min(experience.max_guests, prev + 1))}
                    disabled={participantCount >= experience.max_guests}
                    className="w-9 h-9 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold flex items-center justify-center disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Badge Informasi Ramah Penegas Tarif Flat */}
              <div className="p-3.5 rounded-2xl bg-orange-50/70 border border-orange-200/80 text-xs text-orange-950 flex items-start gap-2.5">
                <Users className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  {isId
                    ? `Tarif flat privat: Harga tetap sama untuk 1 hingga ${experience.max_guests} orang rombongan Anda tanpa biaya tambahan per orang.`
                    : `Flat private rate: The price remains identical for 1 up to ${experience.max_guests} people in your private group with zero hidden per-person fees.`}
                </p>
              </div>
            </div>
          </div>

          {/* Kartu 2: Informasi Pemesan & Kontak WhatsApp */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-500" />
              <span>{isId ? 'Informasi Pemesan & Kontak WhatsApp' : 'Lead Guest & WhatsApp Contact'}</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {isId ? 'Nama Lengkap' : 'Full Name'} *
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Budi Santoso"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {isId ? 'Nomor WhatsApp Aktif' : 'Active WhatsApp Number'} *
                </label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+62 812 3456 7890"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {isId ? 'Alamat Email (Untuk Pengiriman Voucher)' : 'Email Address (For Booking Voucher)'} *
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="budi@example.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {isId ? 'Catatan Khusus untuk Host (Opsional)' : 'Special Requests for Host (Optional)'}
                </label>
                <textarea
                  rows={2}
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder={
                    isId
                      ? 'Misal: alergi makanan tertentu, preferensi titik jemput, atau rute khusus...'
                      : 'e.g. Dietary allergies, pickup point preference, or special route interests...'
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Kartu 3: Pilihan Metode Pembayaran Dinamis */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-orange-500" />
                <span>{isId ? 'Pilihan Metode Pembayaran' : 'Select Payment Method'}</span>
              </h2>
              <span className="text-xs font-semibold text-slate-500">
                {isId ? `Mata Uang: ${experience.currency}` : `Currency: ${experience.currency}`}
              </span>
            </div>

            <div className="space-y-3">
              {paymentMethods.map((method) => {
                const isSelected = selectedMethodId === method.id;
                return (
                  <label
                    key={method.id}
                    onClick={() => setSelectedMethodId(method.id)}
                    className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50/40 ring-1 ring-orange-500 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50/60'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value={method.id}
                      checked={isSelected}
                      onChange={() => setSelectedMethodId(method.id)}
                      className="mt-1 text-orange-600 focus:ring-orange-500"
                    />

                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                      {renderMethodIcon(method.icon)}
                    </div>

                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900">{method.name}</span>
                        {method.badge && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-100 text-orange-800">
                            {method.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">{method.description}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Kartu 4: Diskon Kupon & Koin LTP */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-500" />
              <span>{isId ? 'Diskon Kupon & Koin LTP' : 'Promo Voucher & LTP Coins'}</span>
            </h2>

            {/* Input Kode Promo */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                {isId ? 'Punya Kode Promo?' : 'Have a Promo Code?'}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCodeInput}
                  onChange={(e) => setPromoCodeInput(e.target.value)}
                  placeholder="e.g. LOCALLYEXPLORE"
                  disabled={!!appliedPromo}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 uppercase disabled:bg-slate-100"
                />
                {appliedPromo ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedPromo(null);
                      setPromoCodeInput('');
                    }}
                    className="px-4 py-2.5 rounded-xl border border-rose-200 text-rose-600 font-bold text-xs hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    {isId ? 'Hapus' : 'Remove'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    {isId ? 'Terapkan' : 'Apply'}
                  </button>
                )}
              </div>
              {appliedPromo && (
                <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {isId
                      ? `Kode ${appliedPromo.code} berhasil diterapkan! Hemat ${formatTourPrice(appliedPromo.discount)}`
                      : `Code ${appliedPromo.code} applied! Saved ${formatTourPrice(appliedPromo.discount)}`}
                  </span>
                </p>
              )}
              {promoError && <p className="text-xs text-rose-600">{promoError}</p>}
            </div>

            {/* Toggle Koin LTP */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-slate-900">
                    {isId ? 'Gunakan Koin LTP' : 'Use LTP Coins'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {isId
                    ? `Saldo tersedia: ${user.ltp_balance} LTP (maks. potongan 50% tagihan)`
                    : `Available balance: ${user.ltp_balance} LTP (max 50% discount)`}
                </p>
                {useLtp && ltpDiscount > 0 && (
                  <p className="text-xs font-semibold text-amber-600">
                    {isId
                      ? `Potongan koin aktif: -${formatTourPrice(ltpDiscount)}`
                      : `Active LTP discount: -${formatTourPrice(ltpDiscount)}`}
                  </p>
                )}
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useLtp}
                  onChange={(e) => setUseLtp(e.target.checked)}
                  disabled={user.ltp_balance <= 0}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* ========================================================== */}
        {/* KOLOM KANAN: RINGKASAN TAGIHAN STICKY (lg:col-span-4)      */}
        {/* ========================================================== */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
            <h2 className="text-base font-bold text-slate-900">
              {isId ? 'Ringkasan Pesanan' : 'Order Summary'}
            </h2>

            {/* Thumbnail foto sampul, nama kota & judul */}
            <div className="flex items-start gap-3.5 pb-4 border-b border-slate-100">
              <img
                src={experience.cover_image_url}
                alt={experience.title}
                className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-slate-100 shadow-xs"
              />
              <div className="space-y-1 min-w-0">
                {experience.city && (
                  <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider block">
                    📍 {experience.city.name}
                  </span>
                )}
                <h3 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-2 leading-snug">
                  {experience.title}
                </h3>
              </div>
            </div>

            {/* Profil Singkat Host Pemandu */}
            {experience.host && (
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50/70 border border-slate-100">
                <UserAvatar
                  src={experience.host.avatar_url}
                  name={experience.host.name}
                  size={38}
                  className="border border-orange-100"
                />
                <div className="min-w-0">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    {isId ? 'Pemandu Lokal' : 'Local Host'}
                  </span>
                  <span className="text-xs font-bold text-slate-800 truncate block">
                    {experience.host.name}
                  </span>
                </div>
              </div>
            )}

            {/* Toggle Koin LTP Menonjol di Ringkasan Pesanan */}
            {user.ltp_balance > 0 && (
              <div className="p-4 rounded-2xl border-2 border-purple-200 bg-purple-50/70 flex items-center justify-between gap-3 shadow-xs">
                <div>
                  <h4 className="font-bold text-purple-900 text-sm flex items-center gap-1.5">
                    <span>🪙</span> {isId ? 'Pakai Koin LTP' : 'Pay with LTP Coins'}
                  </h4>
                  <p className="text-xs text-purple-700 mt-0.5 leading-snug">
                    {isId
                      ? `Saldo: ${user.ltp_balance.toLocaleString('id-ID')} LTP (Potongan s/d Rp ${(user.ltp_balance * 155).toLocaleString('id-ID')})`
                      : `Balance: ${user.ltp_balance.toLocaleString('en-US')} LTP (Up to IDR ${(user.ltp_balance * 155).toLocaleString('id-ID')} off)`}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={useLtp}
                    onChange={(e) => setUseLtp(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600 shadow-inner"></div>
                </label>
              </div>
            )}

            {/* Ringkasan Sesi Terpilih */}
            <div className="space-y-2 text-xs text-slate-600 pb-4 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">{isId ? 'Tanggal' : 'Date'}</span>
                <span className="font-semibold text-slate-800">
                  {new Date(selectedDate).toLocaleDateString(locale === 'en' ? 'en-US' : 'id-ID', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">{isId ? 'Waktu Mulai' : 'Start Time'}</span>
                <span className="font-semibold text-slate-800">{selectedTime} WIB</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">{isId ? 'Kuota Rombongan' : 'Group Size'}</span>
                <span className="font-semibold text-slate-800">
                  {participantCount} {isId ? 'Tamu' : 'Guests'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">{isId ? 'Format Tur' : 'Format'}</span>
                <span className="font-semibold text-orange-600">Private Package</span>
              </div>
            </div>

            {/* Breakdown Finansial */}
            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span>{isId ? 'Tarif Flat Paket Tur' : 'Flat Tour Package'}</span>
                <span className="font-bold text-slate-900">
                  {formatTourPrice(basePrice)}
                </span>
              </div>

              {promoDiscount > 0 && (
                <div className="flex items-center justify-between text-emerald-600 font-semibold">
                  <span>{isId ? 'Diskon Promo' : 'Promo Discount'}</span>
                  <span>- {formatTourPrice(promoDiscount)}</span>
                </div>
              )}

              {ltpDiscount > 0 && (
                <div className="flex items-center justify-between text-amber-600 font-semibold">
                  <span>{isId ? 'Potongan Saldo LTP' : 'LTP Balance Discount'}</span>
                  <span>- {formatTourPrice(ltpDiscount)}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-slate-400">{isId ? 'Biaya Layanan Platform' : 'Service Fee'}</span>
                <span className="text-emerald-700 font-bold">
                  {isId ? 'Rp0 / Gratis' : 'Free / Included'}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    {isId ? 'Total Pembayaran' : 'Total Due'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {isId ? 'Satu tarif seluruh rombongan' : 'Flat for entire private group'}
                  </span>
                </div>
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {formatTourPrice(finalTotalPrice)}
                </span>
              </div>
            </div>

            {/* Tombol Aksi Utama */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full min-h-[48px] px-6 py-3.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{isId ? 'Memproses Pesanan...' : 'Processing Order...'}</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>{isId ? 'Konfirmasi & Lanjutkan Pembayaran' : 'Confirm & Proceed to Payment'}</span>
                </>
              )}
            </button>

            {/* Lencana Kepercayaan E-E-A-T */}
            <div className="space-y-2 pt-1 text-[11px] text-slate-500 text-center border-t border-slate-100">
              <p className="flex items-center justify-center gap-1.5 font-semibold text-emerald-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>
                  {isId
                    ? 'Jaminan Rekening Bersama (Escrow) PT Locallytrip Teknologi Indonesia'
                    : 'Escrow Protected by PT Locallytrip Teknologi Indonesia'}
                </span>
              </p>
              <p className="text-slate-400">
                {isId
                  ? 'Kebijakan Pembatalan Fleksibel 48 Jam sebelum sesi dimulai.'
                  : 'Flexible 48-Hour Cancellation Policy prior to tour departure.'}
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
