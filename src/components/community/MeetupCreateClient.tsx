'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createCommunityMeetup } from '@/actions/community/meetups';
import { updateMeetup } from '@/actions/meetups/update';
import { CitySearchCombobox, CityOption } from '@/components/common/CitySearchCombobox';
import { ImageUploadDropzone } from '@/components/shared/ImageUploadDropzone';
import { realtimeEmitter } from '@/lib/realtime';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Sparkles,
  Image as ImageIcon,
  AlertCircle,
  Loader2,
  Coffee,
  UtensilsCrossed,
  Eye,
  Info,
  HeartHandshake,
  Globe,
  Lock,
  BookmarkCheck,
} from 'lucide-react';
import { resolveMeetupImageUrl } from '@/lib/utils/media';

interface MeetupCreateClientProps {
  cities: CityOption[];
  locale: string;
  initialData?: any;
}

const NOMAD_TABLE_CATEGORIES = [
  { id: 'Coffee & Casual Chat', labelId: '☕ Coffee & Casual Chat', icon: '☕', hintId: 'Ngopi santai, ngobrol ringan, dan kenalan sesama explorer' },
  { id: 'Food Hunting & Dining Table', labelId: '🍽️ Food Hunting & Dining Table', icon: '🍽️', hintId: 'Makan bersama, eksplorasi kuliner lokal, kuliner malam' },
  { id: 'City Walk & Photo Walk', labelId: '🚶 City Walk & Photo Walk', icon: '🚶', hintId: 'Jalan santai keliling kota dan berburu foto tempat tersembunyi' },
  { id: 'Sunset & Drinks', labelId: '🌅 Sunset & Drinks', icon: '🌅', hintId: 'Menikmati pemandangan senja sambil berbincang santai' },
];

const TABLE_CAPACITY_OPTIONS = [4, 6, 8];

export function MeetupCreateClient({ cities, locale, initialData }: MeetupCreateClientProps) {
  const router = useRouter();
  const isId = locale === 'id';
  const isEdit = Boolean(initialData);

  // Format start_time to date string and time string if present
  const initDate = initialData?.start_time ? new Date(initialData.start_time) : null;
  const initialDateStr = initDate && !isNaN(initDate.getTime()) 
    ? initDate.toISOString().split('T')[0] 
    : (initialData?.startDate || '');
  const initialTimeStr = initDate && !isNaN(initDate.getTime()) 
    ? initDate.toTimeString().substring(0, 5) 
    : (initialData?.startTime || '16:00');

  // State Meja Sosial
  const [title, setTitle] = useState(initialData?.title || '');
  const [category, setCategory] = useState(initialData?.category || NOMAD_TABLE_CATEGORIES[0].id);
  const [cityId, setCityId] = useState<number | ''>(
    initialData?.city_id ? Number(initialData.city_id) : (initialData?.cityId ? Number(initialData.cityId) : '')
  );
  const [locationName, setLocationName] = useState(initialData?.location_name || initialData?.locationName || '');
  const [addressDetail, setAddressDetail] = useState(initialData?.address_detail || initialData?.addressDetail || '');
  const [startDate, setStartDate] = useState(initialDateStr);
  const [startTime, setStartTime] = useState(initialTimeStr);
  const [endTime, setEndTime] = useState(initialData?.endTime || '18:00');
  const [maxParticipants, setMaxParticipants] = useState<number>(initialData?.max_participants || initialData?.maxParticipants || 6);
  const [joinType, setJoinType] = useState<'public' | 'private'>(initialData?.join_type === 'private' ? 'private' : 'public');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [coverImageUrl, setCoverImageUrl] = useState(initialData?.cover_image_url || initialData?.coverImageUrl || '');
  const [cleanCoverFileName, setCleanCoverFileName] = useState('');

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isValid =
    title.trim().length >= 5 &&
    Boolean(cityId) &&
    Boolean(startDate) &&
    Boolean(startTime) &&
    locationName.trim().length >= 3;

  const handleCreateMeetup = async (isPublish: boolean) => {
    setErrorMessage(null);

    if (!isValid) {
      setErrorMessage(
        isId
          ? 'Mohon lengkapi judul (min 5 karakter), pilih kota, tanggal & jam kumpul, serta nama tempat pertemuan.'
          : 'Please fill title (min 5 chars), destination city, schedule date & time, and venue name.'
      );
      return;
    }

    const startDateTime = new Date(`${startDate}T${startTime}:00`);
    if (isNaN(startDateTime.getTime()) || startDateTime <= new Date()) {
      setErrorMessage(
        isId
          ? 'Jadwal tanggal dan jam kumpul harus di masa mendatang.'
          : 'Meetup date and time must be set in the future.'
      );
      return;
    }

    if (isPublish) {
      setIsSubmitting(true);
    } else {
      setIsSavingDraft(true);
    }

    try {
      // Prioritaskan cleanCoverFileName jika tersedia, atau fallback coverImageUrl
      const finalImage = cleanCoverFileName || coverImageUrl.trim() || undefined;

      let res;
      if (isEdit && initialData?.id) {
        res = await updateMeetup(initialData.id, {
          category,
          cityId: Number(cityId),
          locationName: locationName.trim(),
          addressDetail: addressDetail.trim() || undefined,
          startDate,
          startTime,
          endTime: endTime || undefined,
          maxParticipants,
          joinType,
          notes: notes.trim() || undefined,
          coverImageUrl: finalImage,
          status: isPublish ? 'PUBLISHED' : 'DRAFT',
        });
      } else {
        res = await createCommunityMeetup({
          title: title.trim(),
          category,
          cityId: Number(cityId),
          locationName: locationName.trim(),
          addressDetail: addressDetail.trim() || undefined,
          startDate,
          startTime,
          endTime: endTime || undefined,
          maxParticipants,
          joinType,
          notes: notes.trim() || undefined,
          coverImageUrl: finalImage,
          status: isPublish ? 'PUBLISHED' : 'DRAFT',
        });
      }

      if (!res.success || !res.slug) {
        setErrorMessage(res.error || (isId ? 'Gagal menyimpan meetup.' : 'Failed to save meetup.'));
        setIsSubmitting(false);
        setIsSavingDraft(false);
        return;
      }

      // Pancarkan Event Real-Time Pembaruan XP & LTP jika diterbitkan baru
      if (!isEdit && (res as any).reward && isPublish) {
        realtimeEmitter.emit('user:gamification_update', {
          xpEarned: (res as any).reward.xpEarned,
          ltpEarned: (res as any).reward.ltpEarned,
        });
      }

      router.push(`/${locale}/community/meetups/${res.slug || initialData?.slug}`);
      router.refresh();
    } catch (err: any) {
      console.error('Error submitting meetup:', err);
      setErrorMessage(err?.message || (isId ? 'Terjadi kesalahan sistem.' : 'System error.'));
      setIsSubmitting(false);
      setIsSavingDraft(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleCreateMeetup(true);
  };

  const selectedCity = cities.find((c) => String(c.id) === String(cityId));
  const selectedCityName = selectedCity?.name;
  const activeCityPhoto = selectedCity?.image_url
    ? selectedCity.image_url.startsWith('http') || selectedCity.image_url.startsWith('/')
      ? selectedCity.image_url
      : `/images/cities/${selectedCity.image_url}`
    : null;
  const activeCoverPhoto =
    coverImageUrl
      ? resolveMeetupImageUrl(coverImageUrl)
      : activeCityPhoto || '/images/default-meetup-cover.jpg';

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Tombol Kembali sejajar kiri Header */}
      <div className="mb-6">
        <Link
          href={`/${locale}/community/meetups`}
          className="text-sm font-medium text-slate-500 hover:text-purple-700 inline-flex items-center gap-1.5 transition min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isId ? 'Kembali ke Meja Temu Komunitas' : 'Back to Community Tables'}</span>
        </Link>
      </div>

      {/* Banner Insentif Reward Membentang Penuh 7xl */}
      <div className="w-full bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-amber-500/10 border border-purple-200/60 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-700 to-indigo-700 text-white flex items-center justify-center shrink-0 shadow-sm shadow-purple-600/20">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <span>{isId ? 'Buka Meja Temu (Social Travel Table)' : 'Host a Social Travel Table'}</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 text-[11px] font-bold">
                <Sparkles className="w-3 h-3 text-purple-600" />
                +40 XP
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold">
                +10 LTP
              </span>
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              {isId
                ? 'Ajak sesama traveler & warga lokal makan bareng, ngopi santai, atau hunting foto dalam kelompok intim.'
                : 'Invite fellow travelers & locals for casual dining, coffee talks, or photo walks in an intimate circle.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="text-[11px] font-semibold text-slate-600 bg-white/80 px-3 py-1.5 rounded-xl border border-purple-200/50">
            {isId ? 'Format Split-Bill Santai' : 'Casual Split-Bill Table'}
          </span>
        </div>
      </div>

      {/* Grid 2-Kolom: 8 Kolom Form Input (Kiri) + 4 Kolom Panduan & Live Preview (Kanan) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Kolom Kiri: Form Input Ramping (8 Kolom) */}
        <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-purple-700">
              {isEdit ? (isId ? 'EDIT AGENDA MEJA TEMU' : 'EDIT SOCIAL TABLE') : (isId ? 'AGENDA MEJA TEMU' : 'SOCIAL TABLE AGENDA')}
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mt-1">
              {isEdit
                ? isId
                  ? 'Perbarui Meja Kumpul Teman Jalan'
                  : 'Update Community Travel Table'
                : isId
                ? 'Buka Meja Kumpul Teman Jalan'
                : 'Open a Community Travel Table'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {isId
                ? 'Tentukan lokasi tempat makan/ngopi, waktu kumpul, dan kapasitas meja santai Anda.'
                : 'Set your dining or coffee spot, meeting time, and table capacity.'}
            </p>
          </div>

          {/* Notifikasi Error */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Judul Agenda */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                {isId ? 'Judul Agenda Meja (Wajib)' : 'Table Agenda Title (Required)'} *
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
                    ? 'Contoh: Makan Siang Ikan Bakar Jimbaran atau Ngopi Sore di La Plancha'
                    : 'E.g. Grilled Seafood Lunch at Jimbaran or Sunset Drinks at La Plancha'
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

            {/* 2. Pilihan Kategori Kasual */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                {isId ? 'Kategori Kegiatan Kasual' : 'Casual Activity Category'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {NOMAD_TABLE_CATEGORIES.map((cat) => {
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col gap-1 min-h-[60px] ${
                        isSelected
                          ? 'bg-purple-900 border-purple-900 text-white shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      <span className="font-bold text-xs">{isId ? cat.labelId : cat.id}</span>
                      <span className={`text-[11px] line-clamp-1 ${isSelected ? 'text-purple-200' : 'text-slate-500'}`}>
                        {cat.hintId}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Kota Destinasi (Searchable Combobox) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                {isId ? 'Kota Destinasi Meja (Wajib)' : 'Destination City (Required)'} *
              </label>
              <CitySearchCombobox
                cities={cities}
                value={cityId}
                onChange={(val) => setCityId(val)}
                placeholder={isId ? 'Cari & pilih kota kumpul...' : 'Search & select city...'}
                locale={locale}
              />
            </div>

            {/* 4. Lokasi & Alamat */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-purple-600" />
                  <span>{isId ? 'Nama Tempat / Kafe / Resto (Wajib)' : 'Venue / Restaurant / Cafe Name'} *</span>
                </label>
                <input
                  type="text"
                  required
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder={isId ? 'Misal: Warung Menega Jimbaran' : 'E.g. Menega Cafe Jimbaran'}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition min-h-[44px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  {isId ? 'Patokan Lokasi / Link Maps (Opsional)' : 'Landmark / Maps Link (Optional)'}
                </label>
                <input
                  type="text"
                  value={addressDetail}
                  onChange={(e) => setAddressDetail(e.target.value)}
                  placeholder={isId ? 'Meja outdoor dekat pantai' : 'Outdoor beachfront table'}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition min-h-[44px]"
                />
              </div>
            </div>

            {/* 5. Jadwal Pertemuan & Jam */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-purple-600" />
                  <span>{isId ? 'Tanggal Kumpul' : 'Date'} *</span>
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition min-h-[44px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-purple-600" />
                  <span>{isId ? 'Jam Mulai' : 'Start Time'} *</span>
                </label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition min-h-[44px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isId ? 'Estimasi Selesai' : 'End Time'}</span>
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition min-h-[44px]"
                />
              </div>
            </div>

            {/* 6. Batas Kuota Meja Cepat (Intimate Table) */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                <span>{isId ? 'Batas Kuota Meja (Intimate Circle)' : 'Table Capacity'}</span>
                <span className="text-purple-900 font-bold text-xs">{maxParticipants} Orang</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {TABLE_CAPACITY_OPTIONS.map((cap) => (
                  <button
                    key={cap}
                    type="button"
                    onClick={() => setMaxParticipants(cap)}
                    className={`py-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      maxParticipants === cap
                        ? 'bg-purple-900 border-purple-900 text-white shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>{cap} {isId ? 'Orang' : 'People'}</span>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400">
                {isId
                  ? 'Termasuk Anda sebagai inisiator. Meja kecil 4–8 orang terbukti paling efektif untuk obrolan akrab.'
                  : 'Including host. 4–8 people tables allow genuine conversation.'}
              </p>
            </div>

            {/* 7. Format Biaya Santai (Baku & Transparan) */}
            <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200/80 flex items-start gap-3">
              <HeartHandshake className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-purple-950 block">
                  {isId ? 'Format Biaya Santai (Split Bill)' : 'Casual Split-Bill Table'}
                </span>
                <p className="text-xs text-purple-900 leading-relaxed">
                  {isId
                    ? 'Bebas Biaya Pendaftaran. Seluruh peserta membayar makanan & minuman pesanan masing-masing (split bill).'
                    : 'Free registration. Every participant pays their own orders directly (split bill).'}
                </p>
              </div>
            </div>

            {/* 7b. Tipe Akses / Persetujuan Bergabung (Public vs Private) */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                <span>{isId ? 'Tipe Akses Meja Temu' : 'Table Access & Join Policy'}</span>
                <span className="text-[11px] font-normal text-purple-700">
                  {joinType === 'public'
                    ? isId ? 'Terbuka Langsung' : 'Instant Join'
                    : isId ? 'Persetujuan Host' : 'Host Approval'}
                </span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Opsi 1: Public (Langsung Bergabung) */}
                <button
                  type="button"
                  onClick={() => setJoinType('public')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                    joinType === 'public'
                      ? 'bg-purple-50/80 border-purple-600 ring-2 ring-purple-600/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    joinType === 'public' ? 'bg-purple-900 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-900 block">
                      {isId ? '🌍 Publik (Langsung Gabung)' : '🌍 Public (Instant Join)'}
                    </span>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {isId
                        ? 'Semua traveler dapat langsung bergabung ke meja tanpa perlu persetujuan manual.'
                        : 'Any verified traveler can join immediately without waiting for host approval.'}
                    </p>
                  </div>
                </button>

                {/* Opsi 2: Private (Perlu Persetujuan Host) */}
                <button
                  type="button"
                  onClick={() => setJoinType('private')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                    joinType === 'private'
                      ? 'bg-purple-50/80 border-purple-600 ring-2 ring-purple-600/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    joinType === 'private' ? 'bg-purple-900 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <Lock className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-900 block">
                      {isId ? '🔒 Privat (Persetujuan Host)' : '🔒 Private (Host Approval)'}
                    </span>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {isId
                        ? 'Calon peserta mengajukan permohonan dan harus disetujui host sebelum masuk obrolan grup.'
                        : 'Travelers request to join and host must approve before they access group chat.'}
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* 8. Catatan / Topik Obrolan Santai */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                {isId ? 'Catatan Meja / Topik Obrolan (Opsional)' : 'Table Notes / Topic Vibe (Optional)'}
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  isId
                    ? 'Ceritakan suasana kumpul yang Anda inginkan, misal: obrolan santai seputar spot sunset terbaik, tips solo-traveling, atau pertukaran cerita rute.'
                    : 'Describe the vibe: casual sharing about sunset spots, solo-travel tips, or route recommendations.'
                }
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition font-sans leading-relaxed"
              />
            </div>

            {/* 9. Foto Sampul Meja (ImageUploadDropzone Opsional) */}
            <div className="space-y-2">
              <ImageUploadDropzone
                value={coverImageUrl}
                onChange={(val) => {
                  const urlStr = typeof val === 'string' ? val : val[0] || '';
                  setCoverImageUrl(urlStr);
                  if (urlStr && !urlStr.startsWith('blob:')) {
                    const filename = urlStr.split('/').pop() || '';
                    setCleanCoverFileName(filename);
                  } else if (!urlStr) {
                    setCleanCoverFileName('');
                  }
                }}
                onPreviewChange={(previewUrl) => {
                  setCoverImageUrl(previewUrl);
                }}
                onUploadSuccess={(res) => {
                  if (res?.cleanFileName) {
                    setCleanCoverFileName(res.cleanFileName);
                  }
                  if (res?.url) {
                    setCoverImageUrl(res.url);
                  }
                }}
                folder="meetups"
                multiple={false}
                label={isId ? 'Foto Suasana / Lokasi Meja Temu (Opsional)' : 'Meetup Atmosphere / Venue Photo (Optional)'}
                description={
                  isId
                    ? 'Seret & lepas foto suasana spot kumpul (JPG, PNG, WebP maks. 5 MB). Format optimal lanskap 1200x800 px. Jika dikosongkan, foto kota tujuan akan otomatis dijadikan sampul.'
                    : 'Drag & drop meetup photo (JPG, PNG, WebP max 5 MB). Recommended landscape 1200x800 px. If left empty, destination city photo will be used.'
                }
                disabled={isSubmitting || isSavingDraft}
              />
            </div>

            {/* Tombol Simpan Draf & Terbitkan Meja */}
            <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100">
              <p className="text-xs text-slate-400">
                {isId
                  ? 'Pilih terbitkan langsung untuk membuka obrolan grup seketika, atau simpan draf terlebih dahulu.'
                  : 'Publish instantly to open live table, or save as draft to continue later.'}
              </p>

              <div className="flex items-center gap-3">
                {/* Tombol Simpan Draf */}
                <button
                  type="button"
                  onClick={() => handleCreateMeetup(false)}
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

                {/* Tombol Terbitkan Meetup Langsung */}
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
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>
                        {isEdit
                          ? isId
                            ? 'Simpan Perubahan'
                            : 'Update / Save Changes'
                          : isId
                          ? 'Terbitkan Meetup (+40 XP & +10 LTP)'
                          : 'Publish Meetup (+40 XP & +10 LTP)'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Kolom Kanan: Panduan & Live Preview Meja (4 Kolom) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Live Preview Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Eye className="w-4 h-4 text-purple-600" />
              <span>{isId ? 'Pratinjau Meja Temu' : 'Table Live Preview'}</span>
            </div>
            <div className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50">
              <div className="relative w-full h-32 bg-slate-200">
                <img
                  src={activeCoverPhoto}
                  alt="Cover"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/images/placeholders/meetup-default.jpg';
                  }}
                />
              </div>
              <div className="p-3.5 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                    {category}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                      joinType === 'public'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {joinType === 'public' ? (isId ? '🌍 Publik' : '🌍 Public') : (isId ? '🔒 Privat' : '🔒 Private')}
                    </span>
                    {selectedCityName && (
                      <span className="text-slate-600">📍 {selectedCityName}</span>
                    )}
                  </div>
                </div>
                <h3 className="font-bold text-slate-900 text-sm line-clamp-2">
                  {title || (isId ? 'Judul Meja Temu Anda...' : 'Your Table Title...')}
                </h3>
                <div className="text-[11px] text-slate-500 space-y-1 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-purple-600" />
                    <span>{startDate || (isId ? 'Pilih Tanggal' : 'Pick Date')} {startTime ? `• ${startTime}` : ''}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-purple-600" />
                    <span className="truncate">{locationName || (isId ? 'Nama Tempat' : 'Venue Name')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3 h-3 text-purple-600" />
                    <span>Meja {maxParticipants} Orang (Split Bill)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Konsep Nomadtable Style */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3.5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-purple-600" />
              <span>{isId ? 'Filosofi Social Table' : 'Social Table Philosophy'}</span>
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">•</span>
                <span>{isId ? 'Bukan tur kaku: Kumpul santai seperti teman lama yang baru pertama kali bertemu di perjalanan.' : 'Casual meetup without rigid itineraries.'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">•</span>
                <span>{isId ? 'Obrolan meja hidup: Kuota 4–8 orang memastikan setiap orang dapat saling mendengar dan berbagi cerita.' : 'Intimate 4–8 people tables spark real conversations.'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">•</span>
                <span>{isId ? 'Pesan grup real-time aktif seketika setelah meja dibuka.' : 'Live group chat room is activated as soon as table opens.'}</span>
              </li>
            </ul>
          </div>

          {/* Aturan Ramah Tamu */}
          <div className="bg-purple-50/60 border border-purple-200/60 rounded-2xl p-5 space-y-2">
            <h4 className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-purple-700" />
              <span>{isId ? 'Kenyamanan Bersama' : 'Mutual Respect'}</span>
            </h4>
            <p className="text-[11px] text-purple-900 leading-relaxed">
              {isId
                ? 'Hadir tepat waktu di lokasi pertemuan, dan pastikan membatalkan kehadiran jika berhalangan agar slot meja dapat dinikmati penjelajah lain.'
                : 'Arrive on time, and release your seat if unable to attend so others can join.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
