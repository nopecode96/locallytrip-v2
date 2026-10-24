'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createForumThread } from '@/actions/forum/create';
import { updateForumThread } from '@/actions/forum/update';
import { CitySearchCombobox, CityOption } from '@/components/common/CitySearchCombobox';
import { ImageUploadDropzone } from '@/components/shared/ImageUploadDropzone';
import { RichTextEditor } from '@/components/shared/RichTextEditor';
import { stripHtmlToPlainText } from '@/lib/sanitize';
import {
  ArrowLeft,
  MessageSquare,
  Sparkles,
  Loader2,
  AlertCircle,
  HelpCircle,
  Tag,
  Image as ImageIcon,
  BookOpen,
  Eye,
  Send,
  Folder,
  BookmarkCheck,
} from 'lucide-react';
import { resolveForumImageUrl } from '@/lib/utils/media';

export interface ForumCategoryOption {
  id: number;
  name: string;
  slug: string;
  icon?: string | null;
  description?: string | null;
}

interface ForumThreadCreateClientProps {
  categories: ForumCategoryOption[];
  cities: CityOption[];
  locale: string;
  initialData?: any;
}

export function ForumThreadCreateClient({
  categories,
  cities,
  locale,
  initialData,
}: ForumThreadCreateClientProps) {
  const router = useRouter();
  const isId = locale === 'id';
  const isEdit = Boolean(initialData);

  // Form states
  const [title, setTitle] = useState(initialData?.title || '');
  const [categoryId, setCategoryId] = useState<number>(
    initialData?.category_id
      ? Number(initialData.category_id)
      : initialData?.categoryId
      ? Number(initialData.categoryId)
      : categories[0]?.id || 1
  );
  const [cityId, setCityId] = useState<number | ''>(
    initialData?.city_id
      ? Number(initialData.city_id)
      : initialData?.cityId
      ? Number(initialData.cityId)
      : ''
  );
  const [tags, setTags] = useState<string[]>(
    Array.isArray(initialData?.tags) ? initialData.tags : []
  );
  const [tagInput, setTagInput] = useState('');
  const [content, setContent] = useState(initialData?.content || '');
  const [images, setImages] = useState<string[]>(
    Array.isArray(initialData?.images) ? initialData.images : []
  );

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((cur) => (cur?.message === message ? null : cur));
    }, 4000);
  };

  const handleAddTag = (e?: React.KeyboardEvent | React.MouseEvent) => {
    if (e && 'key' in e && e.key !== 'Enter' && e.key !== ',') {
      return;
    }
    if (e) e.preventDefault();

    const clean = tagInput.trim().replace(/^#/, '').replace(/,/g, '');
    if (clean && !tags.includes(clean.toLowerCase())) {
      setTags([...tags, clean.toLowerCase()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const isValid = title.trim().length >= 5 && Boolean(categoryId) && content.trim().length >= 15;

  const handleCreateThread = async (isPublish: boolean) => {
    setErrorMessage(null);

    if (!isValid) {
      const err = isId
        ? 'Mohon lengkapi judul (min. 5 karakter), pilih kategori, dan tulis penjelasan diskusi (min. 15 karakter).'
        : 'Please complete title (min 5 chars), select category, and write content (min 15 chars).';
      setErrorMessage(err);
      showToast(err, 'error');
      return;
    }

    if (isPublish) {
      setIsSubmitting(true);
    } else {
      setIsSavingDraft(true);
    }

    try {
      // Masukkan tag yang masih ada di input teks jika belum ditambahkan
      let finalTags = [...tags];
      if (tagInput.trim()) {
        const remaining = tagInput.trim().replace(/^#/, '').replace(/,/g, '').toLowerCase();
        if (remaining && !finalTags.includes(remaining)) {
          finalTags.push(remaining);
        }
      }

      // Pastikan nama berkas dikirimkan secara bersih
      const finalImages = images
        .filter(Boolean)
        .map((img) => (img.startsWith('blob:') ? img : img.split('/').pop() || img));

      let res;
      if (isEdit && initialData?.id) {
        res = await updateForumThread(initialData.id, {
          categoryId: Number(categoryId),
          cityId: cityId ? Number(cityId) : null,
          tags: finalTags,
          content: content.trim(),
          images: finalImages,
          status: isPublish ? 'PUBLISHED' : 'DRAFT',
        });
      } else {
        res = await createForumThread({
          title: title.trim(),
          categoryId: Number(categoryId),
          cityId: cityId ? Number(cityId) : null,
          tags: finalTags,
          content: content.trim(),
          images: finalImages,
          status: isPublish ? 'PUBLISHED' : 'DRAFT',
        });
      }

      if (!res.success) {
        const err = res.error || (isId ? 'Gagal menyimpan diskusi.' : 'Failed to save discussion.');
        setErrorMessage(err);
        showToast(err, 'error');
        setIsSubmitting(false);
        setIsSavingDraft(false);
        return;
      }

      showToast(
        isPublish
          ? isId
            ? isEdit
              ? 'Perubahan diskusi berhasil disimpan!'
              : '🎉 Topik diskusi berhasil diterbitkan! (+25 XP & +5 LTP)'
            : isEdit
            ? 'Discussion changes saved successfully!'
            : '🎉 Discussion topic published successfully! (+25 XP & +5 LTP)'
          : isId
          ? '💾 Draf diskusi berhasil disimpan!'
          : '💾 Discussion draft saved successfully!',
        'success'
      );

      setTimeout(() => {
        router.push(`/${locale}/community/forums/${res.slug || initialData?.slug}`);
        router.refresh();
      }, 700);
    } catch (err: any) {
      console.error('Error saving forum thread:', err);
      const msg = err?.message || (isId ? 'Terjadi kesalahan sistem.' : 'System error.');
      setErrorMessage(msg);
      showToast(msg, 'error');
      setIsSubmitting(false);
      setIsSavingDraft(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleCreateThread(true);
  };

  const selectedCategory = categories.find((c) => c.id === Number(categoryId));
  const selectedCityName = cities.find((c) => c.id === Number(cityId))?.name;

  return (
    <div className="w-full">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div
            className={`px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border text-sm font-semibold ${
              toast.type === 'success'
                ? 'bg-slate-900 text-white border-slate-800'
                : 'bg-rose-600 text-white border-rose-500'
            }`}
          >
            {toast.type === 'success' ? (
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-white shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Breadcrumb: Beranda > Komunitas > Forum > Buat Utas Baru */}
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs font-medium text-slate-500 overflow-x-auto whitespace-nowrap">
        <Link href={`/${locale}`} className="hover:text-purple-600 transition">
          {isId ? 'Beranda' : 'Home'}
        </Link>
        <span>/</span>
        <Link href={`/${locale}/community`} className="hover:text-purple-600 transition">
          {isId ? 'Komunitas' : 'Community'}
        </Link>
        <span>/</span>
        <Link href={`/${locale}/community/forums`} className="hover:text-purple-600 transition">
          {isId ? 'Forum' : 'Forums'}
        </Link>
        <span>/</span>
        <span className="text-purple-900 font-bold">
          {isId ? 'Buat Utas Baru' : 'Create New Thread'}
        </span>
      </nav>

      {/* Banner Informasi Gamifikasi Membentang Penuh */}
      <div className="w-full bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-amber-500/10 border border-purple-200/60 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-2xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{isId ? 'Ruang Diskusi Komunitas' : 'Community Discussion Space'}</span>
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
            {isId ? 'Mulai Topik Diskusi Baru' : 'Start a New Discussion Topic'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            {isId
              ? '🎉 Dapatkan +25 XP Reputasi & +5 Koin LTP untuk setiap topik diskusi berkualitas yang Anda buat!'
              : '🎉 Earn +25 Reputation XP & +5 LTP Coins for every quality discussion topic you create!'}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <span className="px-3.5 py-1.5 bg-amber-100 text-amber-900 text-xs font-extrabold rounded-full flex items-center gap-1.5 border border-amber-200 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            +25 XP Reputasi
          </span>
          <span className="px-3.5 py-1.5 bg-purple-100 text-purple-900 text-xs font-extrabold rounded-full border border-purple-200 shadow-2xs">
            +5 Koin LTP
          </span>
        </div>
      </div>

      {/* Grid 2-Kolom: 8 Kolom Form Input (Kiri) + 4 Kolom Panduan & Live Preview (Kanan) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Kolom Kiri: Form Input Diskusi (8 Kolom) */}
        <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-purple-700">
              {isEdit ? (isId ? 'EDIT FORMULIR DISKUSI' : 'EDIT DISCUSSION FORM') : (isId ? 'FORMULIR DISKUSI' : 'DISCUSSION FORM')}
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mt-1">
              {isEdit
                ? isId
                  ? 'Perbarui Topik Diskusi'
                  : 'Update Discussion Topic'
                : isId
                ? 'Tulis & Terbitkan Topik Diskusi'
                : 'Write & Publish Discussion Topic'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {isId
                ? 'Gunakan bahasa yang ramah dan sertakan detail konteks pertanyaan Anda agar member komunitas dapat membantu dengan tepat.'
                : 'Use clear wording and context so community members can give the most helpful advice.'}
            </p>
          </div>

          {/* Notifikasi Status Error */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Kategori Forum & Kota Terkait */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Pilihan Kategori */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Folder className="w-3.5 h-3.5 text-purple-600" />
                    <span>{isId ? 'Kategori Diskusi (Wajib)' : 'Discussion Category (Required)'} *</span>
                  </span>
                  {selectedCategory && (
                    <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200/50">
                      {selectedCategory.slug}
                    </span>
                  )}
                </label>
                <div className="relative">
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(Number(e.target.value))}
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition min-h-[44px]"
                    required
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedCategory?.description && (
                  <p className="text-[11px] text-slate-500 line-clamp-1 italic">
                    {selectedCategory.description}
                  </p>
                )}
              </div>

              {/* Kota Terkait (CitySearchCombobox) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  {isId ? 'Kota / Wilayah Terkait (Opsional)' : 'Related City / Region (Optional)'}
                </label>
                <CitySearchCombobox
                  cities={cities}
                  value={cityId}
                  onChange={(val) => setCityId(val)}
                  placeholder={isId ? 'Cari & pilih kota terkait...' : 'Search & select city...'}
                  locale={locale}
                />
              </div>
            </div>

            {/* Judul Diskusi */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                {isId ? 'Judul Diskusi (Wajib)' : 'Discussion Title (Required)'} *
              </label>
              <input
                type="text"
                required
                disabled={isEdit}
                readOnly={isEdit}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  isId
                    ? 'Contoh: Rekomendasi kuliner halal malam hari di sekitar Ubud & Gianyar'
                    : 'Example: Best halal night food recommendations around Ubud'
                }
                className={`w-full px-4 py-3 rounded-xl border text-sm transition min-h-[44px] ${
                  isEdit
                    ? 'border-slate-200 bg-slate-100/80 text-slate-500 cursor-not-allowed select-none'
                    : 'border-slate-200 bg-slate-50/60 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600'
                }`}
              />
              {isEdit && (
                <p className="text-xs text-amber-700 flex items-center gap-1.5 font-medium mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Judul tidak dapat diubah setelah diterbitkan untuk menjaga validitas tautan SEO. (Title cannot be changed to protect SEO links).
                  </span>
                </p>
              )}
              {!isEdit && (
                <p className="text-[11px] text-slate-400">
                  {title.length}/5 {isId ? 'karakter minimal' : 'min characters'}
                </p>
              )}
            </div>

            {/* Tagar / Kata Kunci Topik dengan Dynamic Badges */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-purple-600" />
                  <span>{isId ? 'Tagar / Kata Kunci Topik' : 'Topic Tags'}</span>
                </span>
                <span className="text-[11px] text-slate-400 font-normal">
                  {tags.length} {isId ? 'tag ditambahkan' : 'tags added'}
                </span>
              </label>

              {/* Tag Badges List */}
              {tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 border border-slate-200/80 rounded-xl">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-900 border border-purple-200 rounded-full text-xs font-bold animate-in fade-in zoom-in-95"
                    >
                      <span>#{t}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="w-4 h-4 rounded-full hover:bg-purple-200 flex items-center justify-center text-purple-700 transition"
                        title={isId ? 'Hapus tag' : 'Remove tag'}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Tag Input & Add Button */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder={
                    isId
                      ? 'Ketik tag lalu tekan Enter (misal: kuliner, backpacking, budget)'
                      : 'Type tag and press Enter (e.g. food, solo-travel, tips)'
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition min-h-[44px]"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition min-h-[44px] shrink-0"
                >
                  {isId ? '+ Tambah' : '+ Add'}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                {isId
                  ? 'Gunakan tag spesifik agar utas mudah ditemukan oleh sesama penjelajah.'
                  : 'Use specific tags to make your thread easily discoverable.'}
              </p>
            </div>

            {/* Unggah Foto Sampul / Media Utama via ImageUploadDropzone */}
            <div className="space-y-1.5">
              <ImageUploadDropzone
                value={images}
                onChange={(val) => {
                  const arr = Array.isArray(val) ? val : val ? [val] : [];
                  setImages(arr);
                }}
                onPreviewChange={(previewUrl) => {
                  setImages((prev) => (prev.includes(previewUrl) ? prev : [...prev, previewUrl]));
                }}
                folder="forums"
                multiple={true}
                maxFiles={3}
                label={isId ? 'Foto Sampul / Media Utama Diskusi' : 'Discussion Cover / Attachment Photos'}
                description={
                  isId
                    ? 'Tambahkan hingga 3 foto sampul (JPG, PNG, WebP, AVIF, maks. 5 MB). Format optimal lanskap 1200x800 px. Foto ini akan menjadi pratinjau kartu diskusi dan tidak otomatis masuk ke teks.'
                    : 'Add up to 3 cover photos (JPG, PNG, WebP, AVIF, max 5 MB). Recommended landscape 1200x800 px. Used for card thumbnail, not inserted into body text.'
                }
                disabled={isSubmitting || isSavingDraft}
              />
            </div>

            {/* Isi Pertanyaan / Penjelasan Lengkap (Rich Text Editorial) */}
            <div className="space-y-1.5">
              <RichTextEditor
                value={content}
                onChange={(html) => setContent(html)}
                folder="forums"
                label={`${isId ? 'Isi Pertanyaan / Penjelasan Lengkap' : 'Question / Discussion Content'} *`}
                placeholder={
                  isId
                    ? 'Jelaskan pertanyaan atau topik diskusi Anda dengan detail (kapan rencana perjalanan, perkiraan budget, preferensi khusus, atau gunakan tombol Sisipkan Foto untuk gambar di tengah teks)...'
                    : 'Describe your question with clear details (timing, budget, transport preference, or use Insert Photo button for inline photos)...'
                }
                disabled={isSubmitting || isSavingDraft}
                minHeight="240px"
              />
            </div>

            {/* Tombol Simpan Draf & Terbitkan */}
            <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100">
              <p className="text-xs text-slate-400">
                {isId
                  ? 'Simpan sebagai draf terlebih dahulu atau terbitkan langsung untuk dilihat komunitas.'
                  : 'Save as draft to finish later or publish live immediately.'}
              </p>

              <div className="flex items-center gap-3">
                {/* Tombol Simpan Draf */}
                <button
                  type="button"
                  onClick={() => handleCreateThread(false)}
                  disabled={!isValid || isSubmitting || isSavingDraft}
                  className={`px-5 py-3 rounded-xl font-bold text-xs sm:text-sm border transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 min-h-[44px] ${
                    isValid && !isSubmitting && !isSavingDraft
                      ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 shadow-2xs'
                      : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isSavingDraft ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                      <span>{isId ? 'Menyimpan Draf...' : 'Saving Draft...'}</span>
                    </>
                  ) : (
                    <>
                      <BookmarkCheck className="w-4 h-4 text-slate-600" />
                      <span>{isId ? 'Simpan Draf' : 'Save Draft'}</span>
                    </>
                  )}
                </button>

                {/* Tombol Terbitkan Diskusi */}
                <button
                  type="submit"
                  disabled={!isValid || isSubmitting || isSavingDraft}
                  className={`px-7 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 min-h-[44px] ${
                    isValid && !isSubmitting && !isSavingDraft
                      ? 'bg-purple-900 hover:bg-purple-950 text-white shadow-purple-900/20 active:scale-[0.99]'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>{isId ? 'Menyimpan...' : 'Saving...'}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-purple-200" />
                      <span>
                        {isEdit
                          ? isId
                            ? 'Simpan Perubahan'
                            : 'Update / Save Changes'
                          : isId
                          ? 'Terbitkan Diskusi (+25 XP & +5 LTP)'
                          : 'Publish Discussion (+25 XP & +5 LTP)'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Kolom Kanan: Panduan, Live Preview & Tips Diskusi (4 Kolom) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Kartu Live Preview Thread */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Eye className="w-4 h-4 text-purple-600" />
              <span>{isId ? 'Pratinjau Ringkas Topik' : 'Thread Live Preview'}</span>
            </div>
            <div className="border border-slate-100 rounded-xl p-4 bg-slate-50 space-y-2.5">
              <div className="flex items-center gap-2 text-[10px] font-bold flex-wrap">
                <span className="text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-md">
                  {selectedCategory?.name || (isId ? 'Kategori' : 'Category')}
                </span>
                {selectedCityName && (
                  <span className="text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                    📍 {selectedCityName}
                  </span>
                )}
              </div>
              <h3 className="font-bold text-slate-900 text-sm line-clamp-2">
                {title || (isId ? 'Judul Diskusi Anda...' : 'Your Discussion Title...')}
              </h3>
              <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                {stripHtmlToPlainText(content) || (isId ? 'Cuplikan topik pertanyaan Anda...' : 'Snippet of your discussion topic...')}
              </p>
              {images.length > 0 && (
                <div className={`grid gap-1.5 pt-1 ${
                  images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                }`}>
                  {images.map((img, i) => (
                    <div key={i} className="relative w-full h-20 rounded-lg overflow-hidden border border-slate-200">
                      <Image
                        src={resolveForumImageUrl(img)}
                        alt={`Attached ${i + 1}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Panduan Bertanya yang Baik */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3.5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-600" />
              <span>{isId ? 'Panduan Bertanya yang Baik' : 'Good Question Guidelines'}</span>
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">•</span>
                <span>{isId ? 'Buat judul spesifik dan jelas (sebutkan nama kota atau rute tujuan).' : 'Make specific titles mentioning cities or routes.'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">•</span>
                <span>{isId ? 'Sebutkan perkiraan tanggal/musim perjalanan agar info cuaca dan aksesibilitas lebih akurat.' : 'Mention travel dates/season for accurate weather and accessibility info.'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">•</span>
                <span>{isId ? 'Gunakan fitur pencarian terlebih dahulu untuk melihat apakah topik serupa pernah dibahas.' : 'Check existing topics first to avoid duplicates.'}</span>
              </li>
            </ul>
          </div>

          {/* Pedoman Komunitas */}
          <div className="bg-purple-50/60 border border-purple-200/60 rounded-2xl p-5 space-y-2.5">
            <h4 className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-purple-700" />
              <span>{isId ? 'Etika Diskusi Komunitas' : 'Community Etiquette'}</span>
            </h4>
            <p className="text-[11px] text-purple-900 leading-relaxed">
              {isId
                ? 'Hormati sesama penjelajah dan warga lokal. Locallytrip melarang keras spam, ujaran kebencian, promosi komersial ilegal, serta informasi yang menyesatkan.'
                : 'Respect fellow travelers and locals. Locallytrip strictly prohibits spam, hate speech, illegal promotion, and misleading info.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
