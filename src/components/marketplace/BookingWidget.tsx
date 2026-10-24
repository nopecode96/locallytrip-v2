'use client';

import React, { useState, useEffect } from 'react';
import { usePreferences } from '@/components/layout/PreferencesContext';
import { Calendar, Users, ShieldCheck, MessageCircle, Zap, Coins, CheckCircle, Loader2 } from 'lucide-react';
import { ContextualAuthModal } from './ContextualAuthModal';
import { createBooking, getCurrentUserSession, getUserLtpWallet, loginQuickUser } from '@/actions/bookings';
import { Dictionary } from '@/lib/dictionary';

interface BookingWidgetProps {
  experienceId: number;
  packagePrice: number | null;
  currency: string | null;
  maxParticipants: number | null;
  minParticipants?: number | null;
  hostName: string | null;
  dict?: Dictionary['booking'] | any;
  lang?: string;
  instantConfirmation?: boolean;
  platformFeePercent?: number;
  platformFeeAmount?: number;
}

export function BookingWidget({
  experienceId,
  packagePrice,
  currency = 'USD',
  maxParticipants = 6,
  minParticipants = 1,
  hostName = 'Host',
  dict,
  lang = 'id',
  instantConfirmation = true,
  platformFeePercent = 0,
  platformFeeAmount = 0,
}: BookingWidgetProps) {
  const { formatPrice } = usePreferences();

  // State Booking (Per Paket, tanggal pelaksanaan default besok)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [useLtp, setUseLtp] = useState<boolean>(false);

  // State User & Auth
  const [currentUser, setCurrentUser] = useState<{ id: number; name: string; email: string } | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [ltpBalance, setLtpBalance] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(false);
  const [bookingSuccessResult, setBookingSuccessResult] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cek sesi user dan saldo LTP saat pertama kali render
  useEffect(() => {
    async function checkSession() {
      const user = await getCurrentUserSession();
      if (user) {
        setCurrentUser(user);
        const wallet = await getUserLtpWallet(user.id);
        if (wallet) {
          setLtpBalance(wallet.balance);
        }
      }
    }
    checkSession();
  }, []);

  // Harga per paket riil
  const packageTotal = packagePrice ?? 0;
  
  // Jika toggle LTP aktif: potong maksimal 50% total paket atau saldo yang tersedia
  const ltpDeduction = useLtp ? Math.min(ltpBalance, packageTotal * 0.5) : 0;
  const netTotal = Math.max(0, packageTotal - ltpDeduction);

  const handleBookClick = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Jika belum login, buka Contextual Auth Modal
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    // 2. Jalankan pemesanan (1 paket untuk seluruh rombongan hingga maxParticipants)
    setIsSubmitting(true);
    const res = await createBooking({
      experienceId,
      selectedDate,
      participantCount: 1, // 1 Paket
      useLtpPoints: useLtp,
      contactName: currentUser.name,
      contactEmail: currentUser.email,
    });
    setIsSubmitting(false);

    if (res.success && res.data) {
      setBookingSuccessResult(res.data);
      if (useLtp) {
        setLtpBalance((prev) => Math.max(0, prev - ltpDeduction));
      }
    } else {
      setErrorMessage(res.error || 'Terjadi kendala saat memproses pemesanan.');
    }
  };

  const handleQuickLogin = async () => {
    setIsAuthLoading(true);
    const res = await loginQuickUser(209);
    setIsAuthLoading(false);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      setIsAuthModalOpen(false);
      const wallet = await getUserLtpWallet(res.user.id);
      if (wallet) {
        setLtpBalance(wallet.balance);
      }
    }
  };

  return (
    <>
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xl shadow-slate-200/40 sticky top-28 space-y-5">
        {/* Price Header (Harga Per Paket) */}
        <div className="flex flex-col gap-1 pb-4 border-b border-slate-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {dict?.packagePriceLabel || (lang === 'id' ? 'Harga Paket Tur' : 'Tour Package Price')}
            </span>
            {instantConfirmation && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 text-xs font-semibold shrink-0">
                ⚡ {dict?.instantConfirmation || (lang === 'id' ? 'Konfirmasi Instan' : 'Instant Confirmation')}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl sm:text-3xl font-bold text-violet-950 font-serif">
              {formatPrice(packagePrice)}
            </span>
            <span className="text-xs sm:text-sm text-slate-500 font-medium">
              / {dict?.package || (lang === 'id' ? 'paket' : 'package')}
            </span>
          </div>
        </div>

        {/* User Status Bar */}
        <div className="py-2 px-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs text-slate-600">
          {currentUser ? (
            <div className="flex items-center gap-1.5 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="truncate">Halo, <strong>{currentUser.name}</strong></span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-500">
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
              <span>Status: Tamu (Guest)</span>
            </div>
          )}

          {currentUser && ltpBalance > 0 && (
            <div className="flex items-center gap-1 text-violet-700 font-bold bg-violet-100/70 px-2 py-0.5 rounded-lg shrink-0">
              <Coins className="w-3 h-3" />
              <span>{ltpBalance.toFixed(1)} LTP</span>
            </div>
          )}
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
            {errorMessage}
          </div>
        )}

        {/* Form Pemesanan Per Paket */}
        <form onSubmit={handleBookClick} className="space-y-4">
          {/* 1. Date Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-violet-600" />
              <span>{dict?.chooseDate || 'Pilih Tanggal Pelaksanaan'}</span>
            </label>
            <input
              type="date"
              value={selectedDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition cursor-pointer"
            />
          </div>

          {/* 2. Informasi Kapasitas Rombongan (Bukan Stepper Orang) */}
          <div className="p-3.5 bg-violet-50/60 border border-violet-100 rounded-2xl flex items-center gap-3 text-xs text-violet-950">
            <Users className="w-4 h-4 text-violet-600 shrink-0" />
            <div>
              <span className="font-bold block text-slate-800">
                Kapasitas Grup: Maksimal {maxParticipants || 6} orang
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Tur privat dalam 1 rombongan tanpa biaya tambahan per orang.
              </span>
            </div>
          </div>

          {/* 3. LTP Points Redemption Toggle */}
          {currentUser && ltpBalance > 0 && (
            <div className="p-3 bg-violet-50/40 border border-violet-200/50 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-violet-600 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    {dict?.useLtpPoints || 'Tukarkan Saldo LTP'}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Hemat s.d. 50% dari harga paket
                  </span>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useLtp}
                  onChange={(e) => setUseLtp(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600" />
              </label>
            </div>
          )}

          {/* 4. Rincian Biaya Transparan */}
          <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Harga Paket (1 Rombongan)</span>
              <span className="font-semibold text-slate-800">{formatPrice(packageTotal)}</span>
            </div>

            {useLtp && ltpDeduction > 0 && (
              <div className="flex justify-between text-violet-700 font-semibold">
                <span className="flex items-center gap-1">
                  <Coins className="w-3 h-3" /> Diskon Poin LTP
                </span>
                <span>-{formatPrice(ltpDeduction)}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">
                {platformFeePercent > 0 
                  ? `${dict?.platformFee || (lang === 'id' ? 'Biaya Layanan' : 'Service Fee')} (${platformFeePercent}%)` 
                  : (dict?.platformFee || (lang === 'id' ? 'Biaya Layanan Platform' : 'Platform Service Fee'))}
              </span>
              <span className="font-medium text-emerald-600">
                {platformFeeAmount > 0 
                  ? formatPrice(platformFeeAmount) 
                  : (dict?.includedFree || (lang === 'id' ? 'Termasuk (Gratis)' : 'Included (Free)'))}
              </span>
            </div>

            <div className="pt-2 border-t border-dashed border-slate-200 flex justify-between items-baseline">
              <span className="text-sm font-bold text-slate-900">
                {dict?.totalPayment || 'Total Pembayaran'}
              </span>
              <span className="text-xl font-black text-violet-800">
                {formatPrice(netTotal)}
              </span>
            </div>
          </div>

          {/* 5. CTA Utama Pemesanan */}
          <div className="pt-2 space-y-2.5">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold text-sm transition shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-75"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 fill-white" />
              )}
              <span>
                {isSubmitting
                  ? (dict?.processing || 'Memproses Pesanan...')
                  : currentUser
                  ? (dict?.bookNow || 'Pesan Sekarang')
                  : (dict?.loginToBook || 'Masuk untuk Memesan')}
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                alert(`Menghubungkan ke ruang obrolan dengan host ${hostName}...`)
              }
              className="w-full py-3 px-4 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-900 font-bold text-xs transition border border-violet-200/60 flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-violet-600" />
              <span>Tanya Host Sebelum Pesan ({hostName})</span>
            </button>
          </div>
        </form>

        {/* Jaminan Keamanan Pemesanan */}
        <div className="pt-4 border-t border-slate-100 flex items-center gap-2.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-5 h-5 text-violet-600 shrink-0" />
          <span>Jaminan Rekening Bersama PT Locallytrip & Kebijakan Pembatalan Fleksibel</span>
        </div>
      </div>

      {/* Contextual Auth Modal */}
      <ContextualAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(u) => {
          setCurrentUser({ id: 209, name: u.name, email: u.email });
          setIsAuthModalOpen(false);
        }}
        onQuickLogin={handleQuickLogin}
        isLoading={isAuthLoading}
      />

      {/* Booking Success Dialog */}
      {bookingSuccessResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-7 max-w-sm w-full text-center space-y-4 shadow-2xl border border-gray-100">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h4 className="text-xl font-black text-gray-900">Pemesanan Terkonfirmasi!</h4>
              <p className="text-xs text-gray-400">
                Kode Booking: <strong className="text-emerald-700">{bookingSuccessResult.bookingReference}</strong>
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl text-left space-y-2 text-xs border border-gray-100">
              <div className="flex justify-between text-gray-500">
                <span>Tanggal:</span>
                <span className="font-semibold text-gray-800">{selectedDate}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Paket Tur:</span>
                <span className="font-semibold text-gray-800">1 Rombongan (Maks {maxParticipants || 6} orang)</span>
              </div>
              {bookingSuccessResult.ltpDiscountApplied > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Diskon Poin LTP:</span>
                  <span>-{formatPrice(bookingSuccessResult.ltpDiscountApplied)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-dashed border-gray-200 flex justify-between font-bold text-sm text-gray-900">
                <span>Total Terbayar:</span>
                <span className="text-emerald-700">{formatPrice(bookingSuccessResult.finalPaidAmount)}</span>
              </div>
            </div>

            <p className="text-[11px] text-gray-400 leading-relaxed">
              Konfirmasi dan voucher aktivitas telah dikirimkan ke email <strong>{currentUser?.email}</strong>.
            </p>

            <button
              type="button"
              onClick={() => setBookingSuccessResult(null)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-md shadow-emerald-600/20"
            >
              Selesai & Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
}
