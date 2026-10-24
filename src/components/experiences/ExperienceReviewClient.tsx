'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createReview } from '@/actions/reviews/create-review';
import {
  Star,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MapPin,
  User,
  ChevronRight,
  MessageSquare,
  Gift,
  Coins,
} from 'lucide-react';

interface ExperienceSummary {
  id: number;
  title: string;
  slug?: string | null;
  coverImage?: string | null;
  hostName: string;
  cityName: string;
}

interface ExperienceReviewClientProps {
  experience: ExperienceSummary;
  bookingId: number;
  locale: string;
}

const RATING_EMOTIONS = [
  { value: 1, labelId: '1: Sangat Kecewa', labelEn: '1: Very Disappointed', icon: '😞' },
  { value: 2, labelId: '2: Kurang Puas', labelEn: '2: Needs Improvement', icon: '🙁' },
  { value: 3, labelId: '3: Cukup Baik', labelEn: '3: Decent & Good', icon: '🙂' },
  { value: 4, labelId: '4: Sangat Menyenangkan', labelEn: '4: Very Fun & Enjoyable', icon: '😃' },
  { value: 5, labelId: '5: Luar Biasa & Tak Terlupakan!', labelEn: '5: Outstanding & Unforgettable!', icon: '🤩' },
];

export function ExperienceReviewClient({
  experience,
  bookingId,
  locale,
}: ExperienceReviewClientProps) {
  const router = useRouter();
  const isId = locale === 'id';

  // State rating 1 - 5
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  // Form input state
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const activeRating = hoverRating !== null ? hoverRating : rating;
  const currentEmotion = RATING_EMOTIONS.find((e) => e.value === activeRating) || RATING_EMOTIONS[4];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (comment.trim().length < 10) {
      setErrorMessage(
        isId
          ? 'Komentar ulasan minimal 10 karakter.'
          : 'Review comment must be at least 10 characters.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await createReview({
        bookingId,
        rating,
        title: title.trim() || undefined,
        comment: comment.trim(),
      });

      if (!res.success) {
        setErrorMessage(res.error || (isId ? 'Gagal menyimpan ulasan.' : 'Failed to submit review.'));
        return;
      }

      setIsSuccess(true);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || (isId ? 'Terjadi kesalahan jaringan.' : 'Network error occurred.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="w-full max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-12 border border-emerald-100 shadow-xl shadow-emerald-500/5 text-center space-y-6 animate-in zoom-in-95 duration-200">
        <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50/50">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isId ? 'Ulasan Berhasil Dikirim!' : 'Review Submitted!'}</span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {isId ? 'Terima Kasih atas Masukan Nyata Anda!' : 'Thank You for Your Feedback!'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
            {isId
              ? 'Ulasan Anda sangat berarti untuk membantu pemandu lokal berkembang dan memberi panduan otentik bagi penjelajah berikutnya.'
              : 'Your review helps local guides grow and provides guidance for future travelers.'}
          </p>
        </div>

        {/* Reward Bonus Badge (+20 XP & +5 LTP) */}
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-xs sm:text-sm font-bold shadow-2xs">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>{isId ? '+20 XP Reputasi Ditambahkan' : '+20 Reputation XP Added'}</span>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm font-bold shadow-2xs">
            <Coins className="w-4 h-4 text-amber-600" />
            <span>{isId ? '+5 LTP Koin Diskon Masuk ke Dompet' : '+5 LTP Discount Coins Added'}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link
            href={`/${locale}/dashboard`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition min-h-[44px]"
          >
            <span>{isId ? 'Kembali ke Dashboard' : 'Back to Dashboard'}</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
          <Link
            href={`/${locale}/experiences/${experience.slug || experience.id}`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm transition shadow-sm min-h-[44px]"
          >
            <span>{isId ? 'Lihat Halaman Aktivitas Tur' : 'View Tour Page'}</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-8 sm:py-10 px-4 space-y-6">
      {/* 1. Header Nav */}
      <div className="flex items-center justify-between">
        <Link
          href={`/${locale}/dashboard`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-bold shadow-2xs transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isId ? 'Kembali ke Dashboard' : 'Back to Dashboard'}</span>
        </Link>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>{isId ? 'Ulasan Tamu Terverifikasi' : 'Verified Guest Review'}</span>
        </span>
      </div>

      {/* 2. Banner Hadiah Interaktif */}
      <div className="rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-6 sm:p-7 text-white shadow-xl shadow-purple-950/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-bold uppercase tracking-wider border border-amber-400/30">
              <Gift className="w-3.5 h-3.5" />
              <span>{isId ? 'Bonus Partisipasi Komunitas' : 'Community Reward'}</span>
            </span>
            <h3 className="text-lg sm:text-xl font-bold font-serif text-white">
              {isId
                ? '🎉 Bagikan Pengalaman Nyata Anda & Dapatkan +20 XP Reputasi + 5 LTP Koin Diskon untuk petualangan berikutnya!'
                : '🎉 Share Your Genuine Experience & Earn +20 XP Reputation + 5 LTP Coins for your next adventure!'}
            </h3>
            <p className="text-xs sm:text-sm text-purple-200/90 leading-relaxed">
              {isId
                ? 'Setiap ulasan terverifikasi membantu mempertahankan standar kualitas pemandu lokal dan memberi penghargaan langsung ke profil Anda.'
                : 'Every verified review helps uphold our local host standards and rewards your explorer profile.'}
            </p>
          </div>
          <div className="flex sm:flex-col items-center gap-2 shrink-0">
            <div className="px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 text-center">
              <div className="text-xs font-bold text-amber-300">+20 XP</div>
              <div className="text-[10px] text-purple-200">{isId ? 'Reputasi' : 'Reputation'}</div>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 text-center">
              <div className="text-xs font-bold text-amber-300">+5 LTP</div>
              <div className="text-[10px] text-purple-200">{isId ? 'Koin Diskon' : 'Discount Coins'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Kartu Ringkasan Tur */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-4">
        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100">
          <img
            src={experience.coverImage || '/images/placeholder-experience.jpg'}
            alt={experience.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 text-center sm:text-left space-y-1">
          <div className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 uppercase tracking-wider">
            <MapPin className="w-3 h-3" />
            <span>{experience.cityName}</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 line-clamp-2">
            {experience.title}
          </h2>
          <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span>{isId ? `Pemandu Lokal: ${experience.hostName}` : `Host: ${experience.hostName}`}</span>
          </p>
        </div>
      </div>

      {/* 4. Formulir Ulasan Utama */}
      <div className="w-full bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-xs">
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
            <p className="flex-1 font-medium">{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Rating Bintang Interaktif */}
          <div className="text-center space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              {isId ? 'Berapa Nilai Kepuasan Anda Bersama Pemandu?' : 'How Satisfied Were You With the Host?'}
            </label>

            <div className="flex items-center justify-center gap-2 sm:gap-3 py-2">
              {[1, 2, 3, 4, 5].map((starValue) => {
                const isFilled = starValue <= activeRating;
                return (
                  <button
                    key={starValue}
                    type="button"
                    onClick={() => setRating(starValue)}
                    onMouseEnter={() => setHoverRating(starValue)}
                    onMouseLeave={() => setHoverRating(null)}
                    aria-label={`Beri rating ${starValue} bintang`}
                    className="p-2 sm:p-2.5 rounded-2xl transition-all duration-150 transform hover:scale-110 active:scale-95 cursor-pointer focus:outline-none min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <Star
                      className={`w-9 h-9 sm:w-11 sm:h-11 transition-colors ${
                        isFilled
                          ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                          : 'fill-slate-100 text-slate-300'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Label Emosi Dinamis */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm font-bold shadow-2xs">
              <span className="text-lg">{currentEmotion.icon}</span>
              <span>{isId ? currentEmotion.labelId : currentEmotion.labelEn}</span>
            </div>
          </div>

          {/* Judul Singkat Ulasan (Opsional) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              {isId ? 'Judul Singkat Ulasan (Opsional)' : 'Review Headline (Optional)'}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                isId
                  ? 'Contoh: Pengalaman malam yang tak terlupakan bersama host lokal!'
                  : 'E.g., An unforgettable local evening tour!'
              }
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-purple-600 min-h-[44px]"
            />
          </div>

          {/* Textarea Komentar Edukatif */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                {isId ? 'Catatan Pengalaman Lengkap' : 'Detailed Experience Notes'}
              </label>
              <span
                className={`text-[11px] font-medium ${
                  comment.trim().length >= 10 ? 'text-emerald-600' : 'text-slate-400'
                }`}
              >
                {comment.trim().length}/10 {isId ? 'karakter minimal' : 'min characters'}
              </span>
            </div>
            <textarea
              rows={5}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                isId
                  ? 'Ceritakan pengalaman Anda: Bagaimana keramahan dan pengetahuan host? Apakah rute dan ketepatan waktu sesuai harapan? Apa momen paling unik dan tak terlupakan dari aktivitas ini?'
                  : 'Tell us about your experience: How hospitable and knowledgeable was your host? Was the pacing and itinerary accurate? What was the most unique highlight of this tour?'
              }
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-purple-600 resize-none leading-relaxed"
            />
          </div>

          {/* Tombol Kirim Ulasan */}
          <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
            <Link
              href={`/${locale}/dashboard`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm transition min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{isId ? 'Batal' : 'Cancel'}</span>
            </Link>

            <button
              type="submit"
              disabled={isSubmitting || comment.trim().length < 10}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm transition shadow-sm min-h-[44px] ${
                !isSubmitting && comment.trim().length >= 10
                  ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/25 cursor-pointer active:scale-95'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isId ? 'Mengirim & Mengklaim Hadiah...' : 'Submitting & Claiming Rewards...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{isId ? 'Kirim Ulasan & Klaim Hadiah (+20 XP & +5 LTP)' : 'Submit Review & Claim Rewards (+20 XP & +5 LTP)'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
