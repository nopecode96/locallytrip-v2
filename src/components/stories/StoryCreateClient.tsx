'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Sparkles,
  Send,
  Image as ImageIcon,
  Tag,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Award,
  BookOpen,
  Eye,
  FileText,
  Save,
} from 'lucide-react';
import { CitySearchCombobox, CityOption } from '@/components/common/CitySearchCombobox';
import { ImageUploadDropzone } from '@/components/shared/ImageUploadDropzone';
import { RichTextEditor } from '@/components/shared/RichTextEditor';
import { createStory } from '@/actions/stories/create';
import { updateStory } from '@/actions/stories/update';
import { stripHtmlToPlainText } from '@/lib/sanitize';
import { resolveStoryImageUrl } from '@/lib/utils/media';

interface StoryCreateClientProps {
  locale: string;
  cities: CityOption[];
  rewardRule: {
    xp_reward: number;
    ltp_reward: number;
    name_id: string;
    name_en: string;
  };
  initialData?: any;
}

export function StoryCreateClient({
  locale,
  cities,
  rewardRule,
  initialData,
}: StoryCreateClientProps) {
  const router = useRouter();
  const isId = locale === 'id';
  const isEdit = Boolean(initialData);

  const [title, setTitle] = useState(initialData?.title || '');
  const [cityId, setCityId] = useState<number | ''>(
    initialData?.city_id ? Number(initialData.city_id) : ''
  );
  const [coverImage, setCoverImage] = useState(initialData?.cover_image || '');
  const [tagsInput, setTagsInput] = useState(
    Array.isArray(initialData?.tags) ? initialData.tags.join(', ') : ''
  );
  const [content, setContent] = useState(initialData?.content || '');
  const [images, setImages] = useState<string[]>(
    Array.isArray(initialData?.images) ? initialData.images : []
  );
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingAction, setSubmittingAction] = useState<'draft' | 'publish' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSaveAction = async (publish: boolean) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (publish) {
      if (!title || title.trim().length < 5) {
        setErrorMessage(isId ? 'Judul cerita minimal 5 karakter untuk diterbitkan.' : 'Title must be at least 5 characters to publish.');
        return;
      }
      if (!content || content.trim().length < 5) {
        setErrorMessage(isId ? 'Isi cerita wajib diisi (minimal 5 karakter) untuk diterbitkan.' : 'Story content must be at least 5 characters to publish.');
        return;
      }
    } else {
      if (!title || title.trim().length < 2) {
        setErrorMessage(isId ? 'Judul cerita minimal 2 karakter untuk menyimpan draf.' : 'Title must be at least 2 characters to save draft.');
        return;
      }
    }

    setIsSubmitting(true);
    setSubmittingAction(publish ? 'publish' : 'draft');

    try {
      const tags = (tagsInput || '')
        .split(',')
        .map((t: string) => t.trim())
        .filter(Boolean);

      let res;
      if (isEdit && initialData?.id) {
        res = await updateStory(initialData.id, {
          content: content || '',
          excerpt: excerpt || undefined,
          city_id: cityId ? Number(cityId) : null,
          cover_image: coverImage || undefined,
          images,
          tags,
          status: publish ? 'published' : 'draft',
        });
      } else {
        res = await createStory({
          title,
          content: content || '',
          excerpt: excerpt || undefined,
          city_id: cityId ? Number(cityId) : null,
          cover_image: coverImage || undefined,
          images,
          tags,
          locale,
          status: publish ? 'published' : 'draft',
          isPublish: publish,
        });
      }

      if (!res.success) {
        setErrorMessage(res.error || (isId ? 'Gagal menyimpan cerita.' : 'Failed to save story.'));
        setIsSubmitting(false);
        setSubmittingAction(null);
        return;
      }

      if (publish) {
        setSuccessMessage(
          isId
            ? (isEdit ? 'Perubahan cerita berhasil diterbitkan!' : 'Cerita berhasil diterbitkan! Anda mendapatkan reward XP & LTP.')
            : (isEdit ? 'Story changes published successfully!' : 'Story published successfully! You have earned XP & LTP rewards.')
        );
        setTimeout(() => {
          router.push(`/${locale}/stories/${res.slug || initialData?.slug}`);
        }, 1200);
      } else {
        setSuccessMessage(
          isId
            ? (isEdit ? 'Draf perubahan cerita berhasil disimpan!' : 'Draf cerita berhasil disimpan! Status: DRAFT. Anda dapat melanjutkannya kapan saja.')
            : (isEdit ? 'Story draft changes saved successfully!' : 'Story draft saved successfully! Status: DRAFT.')
        );
        setIsSubmitting(false);
        setSubmittingAction(null);
      }
    } catch (err: any) {
      console.error('Error saving story:', err);
      setErrorMessage(
        isId
          ? 'Terjadi kendala saat menyimpan cerita. Silakan coba kembali.'
          : 'An error occurred while saving story. Please try again.'
      );
      setIsSubmitting(false);
      setSubmittingAction(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveAction(true);
  };

  const selectedCityName = cities.find((c) => c.id === cityId)?.name;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Tombol Kembali sejajar kiri Header */}
      <div className="mb-6">
        <Link
          href={`/${locale}/stories`}
          className="text-sm font-medium text-slate-500 hover:text-orange-600 inline-flex items-center gap-1.5 transition min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isId ? 'Kembali ke Katalog Cerita' : 'Back to Stories'}</span>
        </Link>
      </div>

      {/* Banner XP Reward membentang penuh 7xl */}
      <div className="w-full bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-purple-500/10 border border-orange-200/60 rounded-2xl p-4 sm:p-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-orange-500/20">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <span>{isId ? rewardRule.name_id : rewardRule.name_en}</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[11px] font-bold">
                <Sparkles className="w-3 h-3 text-orange-600" />
                +{rewardRule.xp_reward} XP
              </span>
              {rewardRule.ltp_reward > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold">
                  +{rewardRule.ltp_reward} LTP
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              {isId
                ? 'Bagikan kisah autentik, foto, dan panduan perjalanan untuk membangun reputasi penjelajah Anda.'
                : 'Share authentic journeys, photos, and guides to build your explorer reputation.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-white/80 px-3 py-1.5 rounded-xl border border-orange-200/50">
            {isId ? 'Reward Instan' : 'Instant Reward'}
          </span>
        </div>
      </div>

      {/* Grid 2-Kolom Sejajar: 8 Kolom Form Input (Kiri) + 4 Kolom Panduan/Live Preview (Kanan) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Kolom Kiri: Form Input Cerita (8 Kolom) */}
        <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-orange-600">
              {isEdit ? (isId ? 'EDIT CERITA PERJALANAN' : 'EDIT TRAVEL STORY') : (isId ? 'RUANG KREATIF TRAVELER' : 'TRAVELER CREATIVE ROOM')}
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mt-1">
              {isEdit
                ? isId
                  ? 'Perbarui Cerita Petualang'
                  : 'Update Travel Story'
                : isId
                ? 'Terbitkan Cerita Petualang Baru'
                : 'Publish an Authentic Travel Story'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {isId
                ? 'Tuliskan catatan perjalanan otentik, rekomendasi tempat tersembunyi, atau momen tak terlupakan.'
                : 'Write genuine field notes, hidden gems, or memorable journey logs.'}
            </p>
          </div>

          {/* Notifikasi Status */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
              <span className="font-medium">{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Judul Cerita */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                {isId ? 'Judul Cerita Perjalanan' : 'Story Title'} *
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
                    ? 'Contoh: Menyusuri Jejak Kopi & Kabut Pagi di Tebing Keraton'
                    : 'E.g. Walking Through Ancient Mist and Coffee Hills'
                }
                className={`w-full px-4 py-3 rounded-xl border text-sm transition min-h-[44px] ${
                  isEdit
                    ? 'border-slate-200 bg-slate-100/80 text-slate-500 cursor-not-allowed select-none'
                    : 'border-slate-200 bg-slate-50/60 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500'
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
            </div>

            {/* Kota Destinasi (Searchable Combobox) & Tagar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  {isId ? 'Kota / Lokasi Destinasi' : 'City / Destination'}
                </label>
                <CitySearchCombobox
                  cities={cities}
                  value={cityId}
                  onChange={(val) => setCityId(val)}
                  placeholder={isId ? 'Ketik untuk cari kota...' : 'Type to search city...'}
                  locale={locale}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-orange-600" />
                  <span>{isId ? 'Tagar (Pisahkan Koma)' : 'Tags (Comma separated)'}</span>
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="kuliner, hidden-gem, alam, budaya"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition min-h-[44px]"
                />
              </div>
            </div>

            {/* Unggah Foto Sampul Cerita via ImageUploadDropzone */}
            <div className="space-y-1.5">
              <ImageUploadDropzone
                value={coverImage ? resolveStoryImageUrl(coverImage) : ''}
                onChange={(val) => setCoverImage(typeof val === 'string' ? val : val[0] || '')}
                folder="stories"
                multiple={false}
                label={isId ? 'Foto Sampul Cerita' : 'Story Cover Image'}
                description={
                  isId
                    ? 'Format JPG, PNG, WebP, AVIF maks. 5 MB. Gambar landscape resolusi tinggi sangat disarankan.'
                    : 'Format JPG, PNG, WebP, AVIF max 5 MB. High-resolution landscape photo recommended.'
                }
                disabled={isSubmitting}
              />
            </div>

            {/* Ringkasan Singkat / Excerpt */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                {isId ? 'Ringkasan Singkat (Lead / Excerpt)' : 'Short Excerpt'}
              </label>
              <input
                type="text"
                maxLength={200}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder={isId ? 'Pengantar singkat 1-2 kalimat...' : 'Brief 1-2 sentence lead...'}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition min-h-[44px]"
              />
            </div>

            {/* Isi Cerita (Editorial Rich Text Content) */}
            <div className="space-y-1.5">
              <RichTextEditor
                value={content}
                onChange={(html) => setContent(html)}
                onImagesChange={(imgs) => setImages(imgs)}
                folder="stories"
                label={`${isId ? 'Isi Cerita Lengkap' : 'Story Content'} *`}
                placeholder={
                  isId
                    ? 'Bagikan cerita perjalananmu secara rinci di sini. Kamu dapat menyusun paragraf pengalaman, tips praktis, biaya, dan menyisipkan foto dokumentasi...'
                    : 'Write your story in full detail here. Feel free to paste formatted text and insert photos...'
                }
                disabled={isSubmitting}
                minHeight="280px"
              />
            </div>

            {/* Tombol Simpan Draf & Terbitkan */}
            <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100">
              <p className="text-xs text-slate-400">
                {isId
                  ? 'Simpan sebagai Draf untuk melanjutkan nanti, atau Terbitkan sekarang agar langsung tampil di Katalog Cerita.'
                  : 'Save as Draft to continue later, or Publish now to appear in the Story Catalog.'}
              </p>

              <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                {/* Tombol Simpan Draf */}
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSaveAction(false)}
                  className="px-5 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 min-h-[44px]"
                >
                  {isSubmitting && submittingAction === 'draft' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                  ) : (
                    <FileText className="w-4 h-4 text-slate-500" />
                  )}
                  <span>{isId ? 'Simpan Draf' : 'Save Draft'}</span>
                </button>

                {/* Tombol Terbitkan Sekarang */}
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSaveAction(true)}
                  className="px-7 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 min-h-[44px]"
                >
                  {isSubmitting && submittingAction === 'publish' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>
                    {isEdit
                      ? isId
                        ? 'Simpan Perubahan'
                        : 'Update / Save Changes'
                      : isId
                      ? 'Terbitkan Sekarang'
                      : 'Publish Story Now'}
                  </span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Kolom Kanan: Panduan, Live Preview & Syarat Konten (4 Kolom) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Live Preview Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Eye className="w-4 h-4 text-orange-600" />
              <span>{isId ? 'Pratinjau Ringkas' : 'Live Preview'}</span>
            </div>
            <div className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50">
              {coverImage ? (
                <div className="relative w-full h-32 bg-slate-200">
                  <Image src={resolveStoryImageUrl(coverImage)} alt="Cover" fill className="object-cover" unoptimized />
                </div>
              ) : (
                <div className="w-full h-24 bg-gradient-to-r from-orange-100 to-amber-100 flex items-center justify-center text-xs text-slate-400">
                  <ImageIcon className="w-6 h-6 text-orange-300" />
                </div>
              )}
              <div className="p-3.5 space-y-1.5">
                {selectedCityName && (
                  <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">
                    {selectedCityName}
                  </span>
                )}
                <h3 className="font-bold text-slate-900 text-sm line-clamp-2">
                  {title || (isId ? 'Judul Cerita Anda...' : 'Your Story Title...')}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                  {excerpt || stripHtmlToPlainText(content) || (isId ? 'Deskripsi ringkas cerita petualangan Anda...' : 'Brief description of your travel story...')}
                </p>
              </div>
            </div>
          </div>

          {/* Tips Menulis Cerita Otentik */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3.5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-orange-600" />
              <span>{isId ? 'Tips Cerita Inspiratif' : 'Inspirational Story Tips'}</span>
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-orange-500 font-bold">•</span>
                <span>{isId ? 'Gunakan judul deskriptif yang memancing rasa penasaran traveler lain.' : 'Use descriptive titles that spark traveler curiosity.'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 font-bold">•</span>
                <span>{isId ? 'Sebutkan estimasi biaya, transportasi lokal, dan waktu terbaik berkunjung.' : 'Mention estimated costs, local transit, and best visiting times.'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 font-bold">•</span>
                <span>{isId ? 'Hargai adat istiadat dan etika lingkungan di tempat yang Anda kunjungi.' : 'Respect local customs and environmental guidelines.'}</span>
              </li>
            </ul>
          </div>

          {/* Pedoman Komunitas */}
          <div className="bg-amber-50/60 border border-amber-200/60 rounded-2xl p-5 space-y-2.5">
            <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-amber-600" />
              <span>{isId ? 'Ketentuan Konten' : 'Content Guidelines'}</span>
            </h4>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              {isId
                ? 'Cerita harus merupakan tulisan orisinal tanpa plagiasi, ujaran kebencian, atau promosi spam komersial ilegal.'
                : 'Stories must be original content without plagiarism, hate speech, or illicit commercial spam.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
