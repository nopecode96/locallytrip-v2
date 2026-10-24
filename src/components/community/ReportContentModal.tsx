'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag, X, AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react';
import { submitContentReport } from '@/actions/community/reports';

export interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'forum_thread' | 'forum_post' | 'story' | 'meetup';
  targetId: number;
  targetTitle?: string;
  onSuccess?: () => void;
}

const REPORT_REASONS = [
  { id: 'spam', label: 'Spam atau Promosi Tak Pantas', desc: 'Iklan massal, penipuan afiliasi, atau bot' },
  { id: 'harassment', label: 'Pelecehan atau Perundungan', desc: 'Serangan personal, doxxing, ancaman' },
  { id: 'hate_speech', label: 'Ujaran Kebencian (SARA)', desc: 'Diskriminasi ras, agama, suku, atau orientasi' },
  { id: 'inappropriate', label: 'Konten Vulgar / Asusila', desc: 'Pornografi, kekerasan eksplisit, atau bahaya fisik' },
  { id: 'scam', label: 'Penipuan / Misinformasi', desc: 'Informasi palsu berbahaya atau upaya pencurian identitas' },
  { id: 'copyright', label: 'Pelanggaran Hak Cipta', desc: 'Mengunggah karya orang lain tanpa atribusi/izin' },
  { id: 'other', label: 'Pelanggaran Lainnya', desc: 'Hal lain yang melanggar pedoman komunitas' },
];

export default function ReportContentModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetTitle,
  onSuccess,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>('spam');
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const getTargetTypeLabel = (type: string) => {
    switch (type) {
      case 'forum_thread':
        return 'Utas Forum';
      case 'forum_post':
        return 'Komentar Forum';
      case 'story':
        return 'Travel Story';
      case 'meetup':
        return 'Travel Meetup';
      default:
        return 'Konten';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason) {
      setErrorMessage('Pilih salah satu alasan pelaporan.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await submitContentReport({
        targetType,
        targetId,
        reason: selectedReason,
        description: description.trim() || undefined,
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Gagal mengirim laporan.');
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage(res.message || 'Laporan berhasil dikirim.');
      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Terjadi kesalahan sistem.');
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl z-10"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <Flag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                  Laporkan ke Moderator
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {getTargetTypeLabel(targetType)} {targetTitle ? `• "${targetTitle.slice(0, 32)}..."` : ''}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-2.5 text-xs text-emerald-700 dark:text-emerald-300">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
                Pilih Alasan Pelaporan
              </label>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {REPORT_REASONS.map((r) => {
                  const isChecked = selectedReason === r.id;
                  return (
                    <label
                      key={r.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border text-left cursor-pointer transition ${
                        isChecked
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                          : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-850'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reportReason"
                        value={r.id}
                        checked={isChecked}
                        onChange={() => setSelectedReason(r.id)}
                        className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div className="flex-1 text-xs">
                        <div className={`font-semibold ${isChecked ? 'text-emerald-700 dark:text-emerald-400' : 'text-stone-800 dark:text-stone-200'}`}>
                          {r.label}
                        </div>
                        <div className="text-stone-500 dark:text-stone-400 mt-0.5">
                          {r.desc}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
                Keterangan Tambahan (Opsional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Berikan detail atau tautan bukti tambahan untuk memudahkan peninjauan..."
                className="w-full text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-3 text-stone-800 dark:text-stone-200 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-medium rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !!successMessage}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Mengirim...</span>
                  </>
                ) : (
                  <>
                    <Flag className="w-3.5 h-3.5" />
                    <span>Kirim Laporan</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
