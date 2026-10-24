'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  MessageSquare,
  Sparkles,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Folder,
} from 'lucide-react';
import { RewardIncentiveCard } from '@/components/rewards/RewardIncentiveCard';
import { createForumThread, getForumCategories } from '@/actions/forum/create';

interface ForumCategoryOption {
  id: number;
  name: string;
  slug: string;
  icon?: string | null;
}

interface CreateForumThreadModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale?: string;
  initialCategories?: ForumCategoryOption[];
}

export function CreateForumThreadModal({
  isOpen,
  onClose,
  locale = 'id',
  initialCategories = [],
}: CreateForumThreadModalProps) {
  const isId = locale === 'id';
  const router = useRouter();

  const [categories, setCategories] = useState<ForumCategoryOption[]>(initialCategories);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(
    initialCategories[0]?.id || 1
  );
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Ambil kategori dari server jika belum dioper
  useEffect(() => {
    if (isOpen && categories.length === 0) {
      getForumCategories().then((res) => {
        if (res && res.length > 0) {
          setCategories(res);
          setSelectedCategoryId(res[0].id);
        }
      }).catch(() => {});
    }
  }, [isOpen, categories.length]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (title.trim().length < 5) {
      setErrorMsg(isId ? 'Judul diskusi minimal 5 karakter.' : 'Discussion title must be at least 5 characters.');
      return;
    }

    if (content.trim().length < 15) {
      setErrorMsg(isId ? 'Isi diskusi pembuka minimal 15 karakter.' : 'Discussion content must be at least 15 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createForumThread({
        title: title.trim(),
        categoryId: Number(selectedCategoryId),
        content: content.trim(),
      });

      if (res.success && res.slug) {
        onClose();
        router.push(`/${locale}/community/forums/${res.slug}`);
      } else {
        setErrorMsg(res.error || (isId ? 'Gagal membuat thread.' : 'Failed to create thread.'));
      }
    } catch {
      setErrorMsg(isId ? 'Terjadi kesalahan sistem.' : 'A system error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-6">
        {/* Tombol Tutup */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Modal */}
        <div className="space-y-1 pr-8">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{isId ? 'FORUM KOMUNITAS' : 'COMMUNITY FORUM'}</span>
          </span>
          <h3 className="font-serif font-bold text-xl sm:text-2xl text-slate-900">
            {isId ? 'Mulai Diskusi Baru' : 'Start a New Discussion'}
          </h3>
          <p className="text-xs text-slate-500">
            {isId
              ? 'Tanyakan tips perjalanan, rekomendasi spot lokal, atau rute bersama ribuan traveler.'
              : 'Ask travel tips, hidden gems, or itinerary advice directly from fellow travelers.'}
          </p>
        </div>

        {/* Kartu Insentif Reward (+25 XP & +5 LTP) */}
        <div className="my-4">
          <RewardIncentiveCard
            xp={25}
            ltp={5}
            actionTitleId="Dapatkan +25 XP & +5 LTP Hadiah Topik Baru"
            actionTitleEn="Earn +25 XP & +5 LTP for New Topic"
            locale={locale}
          />
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Formulir Pembuatan Thread */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Pilihan Kategori */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-purple-600" />
              <span>{isId ? 'Kategori Diskusi' : 'Discussion Category'}</span>
            </label>
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(Number(e.target.value))}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-900 transition"
              required
            >
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon ? `${cat.icon} ` : ''}{cat.name}
                  </option>
                ))
              ) : (
                <option value={1}>{isId ? 'Tips & Rekomendasi' : 'Tips & Recommendations'}</option>
              )}
            </select>
          </div>

          {/* Input Judul */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              {isId ? 'Judul Diskusi' : 'Discussion Title'}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              placeholder={
                isId
                  ? 'Contoh: Rekomendasi kuliner halal malam hari di Ubud'
                  : 'Example: Best halal night food recommendations in Ubud'
              }
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-900 transition"
              required
              minLength={5}
            />
          </div>

          {/* Input Konten Diskusi */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              {isId ? 'Isi Pertanyaan / Penjelasan Lengkap' : 'Content / Details'}
            </label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isSubmitting}
              placeholder={
                isId
                  ? 'Jelaskan pertanyaan Anda dengan detail (lokasi, budget, atau preferensi khusus)...'
                  : 'Describe your question with details (location, budget, or preferences)...'
              }
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-900 transition resize-none leading-relaxed"
              required
              minLength={15}
            />
          </div>

          {/* Footer Modal */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition"
            >
              {isId ? 'Batal' : 'Cancel'}
            </button>

            <button
              type="submit"
              disabled={isSubmitting || title.trim().length < 5 || content.trim().length < 15}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-900 hover:bg-purple-950 text-white font-bold text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              <span>{isId ? 'Terbitkan Diskusi ✍️' : 'Publish Thread ✍️'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
