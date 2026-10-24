'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RewardIncentiveCard } from '@/components/rewards/RewardIncentiveCard';
import { submitHostApplication } from '@/actions/host/apply';
import {
  Compass,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  MapPin,
  Globe2,
  Phone,
  Link2,
  ShieldCheck,
  FileText,
  AlertCircle,
  Loader2,
  Camera,
  Users,
  Map,
  Tag,
  Activity,
} from 'lucide-react';

export interface CityOption {
  id: number;
  name: string;
  country_code?: string | null;
}

export interface HostCategoryOption {
  id: number;
  name: string;
  icon?: string | null;
  description?: string | null;
}

export interface LanguageOption {
  id: number;
  name: string;
  native_name?: string | null;
  code?: string | null;
}

interface BecomeHostWizardProps {
  cities: CityOption[];
  hostCategories?: HostCategoryOption[];
  languages?: LanguageOption[];
  locale: string;
}

// Icon helper function for categories
function renderCategoryIcon(iconName?: string | null) {
  const normalized = iconName?.toLowerCase() || '';
  if (normalized.includes('camera') || normalized.includes('photo')) {
    return <Camera className="w-4 h-4 text-brand-600 shrink-0" />;
  }
  if (normalized.includes('compass') || normalized.includes('guide')) {
    return <Compass className="w-4 h-4 text-brand-600 shrink-0" />;
  }
  if (normalized.includes('users') || normalized.includes('combo')) {
    return <Users className="w-4 h-4 text-purple-600 shrink-0" />;
  }
  if (normalized.includes('map') || normalized.includes('plan')) {
    return <Map className="w-4 h-4 text-amber-600 shrink-0" />;
  }
  if (normalized.includes('activity') || normalized.includes('wellness') || normalized.includes('instructor')) {
    return <Activity className="w-4 h-4 text-emerald-600 shrink-0" />;
  }
  if (normalized.includes('sparkle')) {
    return <Sparkles className="w-4 h-4 text-brand-500 shrink-0" />;
  }
  return <Tag className="w-4 h-4 text-slate-500 shrink-0" />;
}

export function BecomeHostWizard({
  cities,
  hostCategories = [],
  languages = [],
  locale,
}: BecomeHostWizardProps) {
  const router = useRouter();
  const isId = locale === 'id';

  // Step state: 1 -> 2 -> 3
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form states with dynamic IDs
  const [cityId, setCityId] = useState<number | ''>(cities[0]?.id || '');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>(
    hostCategories.length > 0 ? [hostCategories[0].id] : []
  );
  // Default to Indonesian language ID if available, else first language
  const defaultLangId = languages.find((l) => l.code === 'id')?.id || languages[0]?.id || 1;
  const [selectedLanguageIds, setSelectedLanguageIds] = useState<number[]>([defaultLangId]);
  const [bio, setBio] = useState<string>('');

  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [socialLink, setSocialLink] = useState<string>('');

  const [idType, setIdType] = useState<'KTP' | 'PASSPORT'>('KTP');
  const [idNumber, setIdNumber] = useState<string>('');
  const [hasAgreed, setHasAgreed] = useState<boolean>(false);

  // Submitting state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const toggleCategory = (catId: number) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const toggleLanguage = (langId: number) => {
    setSelectedLanguageIds((prev) =>
      prev.includes(langId) ? prev.filter((id) => id !== langId) : [...prev, langId]
    );
  };

  // Step 1 Validation
  const isStep1Valid = Boolean(
    cityId &&
    selectedCategoryIds.length > 0 &&
    selectedLanguageIds.length > 0 &&
    bio.trim().length >= 20
  );

  // Step 2 Validation
  const isStep2Valid = Boolean(phoneNumber.trim().length >= 8);

  // Step 3 Validation
  const isStep3Valid = Boolean(idNumber.trim().length >= 6 && hasAgreed);

  const handleNext = () => {
    setErrorMessage(null);
    if (currentStep === 1) {
      if (!isStep1Valid) {
        setErrorMessage(
          isId
            ? 'Mohon lengkapi kota, minimal 1 keahlian/kategori, 1 bahasa, dan bio minimal 20 karakter.'
            : 'Please select your city, at least 1 specialty, 1 language, and bio of at least 20 chars.'
        );
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!isStep2Valid) {
        setErrorMessage(
          isId
            ? 'Nomor telepon/WhatsApp wajib diisi minimal 8 digit.'
            : 'Phone/WhatsApp number is required (min 8 digits).'
        );
        return;
      }
      setCurrentStep(3);
    }
  };

  const handlePrev = () => {
    setErrorMessage(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStep3Valid) {
      setErrorMessage(
        isId
          ? 'Mohon lengkapi nomor identitas dan centang komitmen panduan.'
          : 'Please complete your ID number and accept the host commitment.'
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      let formattedPhone = phoneNumber.trim();
      if (!formattedPhone.startsWith('+')) {
        if (formattedPhone.startsWith('0')) {
          formattedPhone = '+62' + formattedPhone.slice(1);
        } else {
          formattedPhone = '+62' + formattedPhone;
        }
      }

      const res = await submitHostApplication({
        cityId: Number(cityId),
        bio: bio.trim(),
        categoryIds: selectedCategoryIds,
        languageIds: selectedLanguageIds,
        phoneNumber: formattedPhone,
        socialLink: socialLink.trim() || undefined,
        idType,
        idNumber: idNumber.trim(),
      });

      if (!res.success) {
        setErrorMessage(res.error || (isId ? 'Gagal mengirim pendaftaran.' : 'Failed to submit application.'));
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

  // If application is completed successfully
  if (isSuccess) {
    return (
      <div className="w-full max-w-7xl mx-auto bg-white rounded-3xl p-6 sm:p-12 border border-emerald-100 shadow-xl shadow-emerald-500/5 text-center animate-in zoom-in-95 duration-200">
        <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-6 ring-8 ring-emerald-50/50">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-3">
          <span>🎉</span> {isId ? 'Pendaftaran Host Berhasil!' : 'Host Application Submitted!'}
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {isId ? 'Selamat Datang di Jajaran Local Host Locallytrip!' : 'Welcome to the Locallytrip Local Host Network!'}
        </h2>
        <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
          {isId
            ? 'Profil Anda telah ditingkatkan menjadi Host. Bonus pendaftaran +100 XP telah ditambahkan ke akun Anda. Sekarang Anda siap menyusun pengalaman tur lokal yang berkesan!'
            : 'Your profile has been upgraded to Host. A registration bonus of +100 XP has been credited to your account. You can now build unforgettable local tour experiences!'}
        </p>

        {/* Bonus card highlight */}
        <div className="my-6 inline-flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-sm font-bold shadow-xs">
          <span className="text-xl">⚡</span>
          <span>{isId ? '+100 XP Berhasil Ditambahkan ke Profil Anda' : '+100 XP Added to Your Profile'}</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4">
          <Link
            href={`/${locale}/dashboard`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition shadow-sm min-h-[48px]"
          >
            <span>{isId ? 'Buka Dashboard Saya' : 'Go to Dashboard'}</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
          <Link
            href={`/${locale}/host/onboarding`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm transition shadow-sm shadow-brand-500/20 min-h-[48px]"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isId ? 'Rancang Tur Pertama dengan AI' : 'Build First Tour with AI'}</span>
          </Link>
        </div>
      </div>
    );
  }

  const stepsList = [
    { step: 1, titleId: 'Wilayah & Keahlian', titleEn: 'City & Specialties' },
    { step: 2, titleId: 'Kontak & Profil', titleEn: 'Contact & Profile' },
    { step: 3, titleId: 'Identitas & Komitmen', titleEn: 'ID & Commitment' },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* 1. KARTU INSENTIF REWARD TERATAS (+100 XP) */}
      <RewardIncentiveCard
        xp={100}
        ltp={0}
        actionTitleId="Langkah Menjadi Local Host"
        actionTitleEn="Become a Local Host"
        locale={locale}
      />

      {/* 2. PROGRESS BAR & STEP INDICATOR */}
      <div className="w-full bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
        {/* Visual Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-2 mb-4 overflow-hidden">
          <div
            className="bg-brand-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          />
        </div>

        {/* Stepping Indicator */}
        <div className="grid grid-cols-3 gap-2">
          {stepsList.map((item) => {
            const isCompleted = item.step < currentStep;
            const isCurrent = item.step === currentStep;

            return (
              <div
                key={item.step}
                className={`flex flex-col items-center sm:items-start text-center sm:text-left transition ${
                  isCurrent
                    ? 'text-brand-600'
                    : isCompleted
                    ? 'text-slate-800'
                    : 'text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full text-xs font-bold transition ${
                      isCompleted
                        ? 'bg-emerald-500 text-white'
                        : isCurrent
                        ? 'bg-brand-600 text-white ring-4 ring-brand-100'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : item.step}
                  </span>
                  <span className="hidden sm:inline text-xs font-bold tracking-tight">
                    {isId ? item.titleId : item.titleEn}
                  </span>
                </div>
                <span className="sm:hidden text-[10px] font-bold mt-1 tracking-tight line-clamp-1">
                  {isId ? item.titleId : item.titleEn}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. WIZARD CARD BODY (Full Width aligned with Header) */}
      <div className="w-full bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-10 shadow-xs">
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
            <p className="flex-1 font-medium">{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ================= STEP 1: WILAYAH & KEAHLIAN ================= */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Compass className="w-5 h-5 text-brand-600" />
                  <span>{isId ? 'Langkah 1: Wilayah Operasional & Keahlian' : 'Step 1: Operational City & Specialties'}</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  {isId
                    ? 'Tentukan kota dan spesialisasi keahlian memandu yang Anda kuasai.'
                    : 'Select your operational city and guiding specialties.'}
                </p>
              </div>

              {/* Kota Operasional */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  {isId ? 'Kota Tempat Memandu (Wajib)' : 'Operational City (Required)'}
                </label>
                <div className="relative">
                  <select
                    value={cityId}
                    onChange={(e) => setCityId(Number(e.target.value))}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 appearance-none min-h-[44px]"
                  >
                    <option value="" disabled>
                      {isId ? '-- Pilih Kota Operasional --' : '-- Select City --'}
                    </option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name} {city.country_code ? `(${city.country_code})` : ''}
                      </option>
                    ))}
                  </select>
                  <MapPin className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Spesialisasi / Kategori Host (Dinamis dari database) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    {isId ? 'Spesialisasi Tur (Pilih Minimal 1)' : 'Tour Specialties (Select at least 1)'}
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {selectedCategoryIds.length} {isId ? 'terpilih' : 'selected'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {hostCategories.map((cat) => {
                    const isSelected = selectedCategoryIds.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategory(cat.id)}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border text-xs sm:text-sm font-semibold transition cursor-pointer text-left min-h-[50px] ${
                          isSelected
                            ? 'bg-brand-50 border-brand-500 text-brand-900 ring-1 ring-brand-500/20'
                            : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="mt-0.5">{renderCategoryIcon(cat.icon || cat.name)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-slate-900 truncate">{cat.name}</div>
                          {cat.description && (
                            <p className="text-[11px] text-slate-500 font-normal line-clamp-1 mt-0.5">
                              {cat.description}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bahasa yang Dikuasai (Dinamis dari database) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    {isId ? 'Bahasa yang Dikuasai (Pilih Minimal 1)' : 'Spoken Languages (Select at least 1)'}
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {selectedLanguageIds.length} {isId ? 'terpilih' : 'selected'}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {languages.map((lang) => {
                    const isSelected = selectedLanguageIds.includes(lang.id);
                    return (
                      <button
                        key={lang.id}
                        type="button"
                        onClick={() => toggleLanguage(lang.id)}
                        className={`px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer min-h-[44px] flex items-center gap-2 justify-center ${
                          isSelected
                            ? 'bg-purple-50 border-purple-500 text-purple-700 ring-1 ring-purple-500/20 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Globe2 className="w-3.5 h-3.5 shrink-0 opacity-60" />
                        <span className="truncate">{lang.native_name || lang.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bio Pengalaman Memandu */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    {isId ? 'Bio & Pengalaman Memandu' : 'Bio & Guiding Background'}
                  </label>
                  <span
                    className={`text-[11px] font-medium ${
                      bio.trim().length >= 20 ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  >
                    {bio.trim().length}/20 {isId ? 'karakter minimal' : 'min characters'}
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={
                    isId
                      ? 'Ceritakan latar belakang Anda, tempat favorit yang Anda ketahui, atau cara Anda memandu rombongan wisatawan lokal dan mancanegara secara santai...'
                      : 'Share your background, favorite spots you know well, and your relaxed hosting style...'
                  }
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none"
                />
              </div>
            </div>
          )}

          {/* ================= STEP 2: KONTAK & SOSMED ================= */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-brand-600" />
                  <span>{isId ? 'Langkah 2: Kontak & Media Sosial' : 'Step 2: Contact & Social Profiles'}</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  {isId
                    ? 'Kontak Anda digunakan untuk koordinasi penjemputan dan notifikasi pesanan masuk.'
                    : 'Your contact info is used for tour coordination and incoming booking alerts.'}
                </p>
              </div>

              {/* Phone / WhatsApp */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  {isId ? 'Nomor WhatsApp / Seluler (Wajib)' : 'WhatsApp / Mobile Number (Required)'}
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="08123456789 atau +628123456789"
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 min-h-[44px]"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {isId
                    ? 'Nomor akan otomatis diformat dengan kode negara (+62).'
                    : 'Number will be formatted with country code.'}
                </p>
              </div>

              {/* Social Media Link */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  {isId ? 'Tautan Instagram / LinkedIn / Portofolio (Opsional)' : 'Instagram / LinkedIn / Portfolio Link (Optional)'}
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={socialLink}
                    onChange={(e) => setSocialLink(e.target.value)}
                    placeholder="https://instagram.com/username"
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 min-h-[44px]"
                  />
                  <Link2 className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 3: IDENTITAS & KOMITMEN ================= */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-brand-600" />
                  <span>{isId ? 'Langkah 3: Verifikasi Identitas & Komitmen Host' : 'Step 3: Identity & Host Commitment'}</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  {isId
                    ? 'Data identitas diperlukan untuk keamanan traveler dan standar komunitas pemandu Locallytrip.'
                    : 'Identity data is required for traveler safety and Locallytrip trust standards.'}
                </p>
              </div>

              {/* ID Type */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  {isId ? 'Jenis Kartu Identitas' : 'ID Card Type'}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIdType('KTP')}
                    className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border text-sm font-bold transition cursor-pointer min-h-[44px] ${
                      idType === 'KTP'
                        ? 'bg-brand-50 border-brand-500 text-brand-700 ring-1 ring-brand-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>KTP (WNI)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIdType('PASSPORT')}
                    className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border text-sm font-bold transition cursor-pointer min-h-[44px] ${
                      idType === 'PASSPORT'
                        ? 'bg-brand-50 border-brand-500 text-brand-700 ring-1 ring-brand-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Paspor / Passport</span>
                  </button>
                </div>
              </div>

              {/* ID Number */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  {idType === 'KTP'
                    ? isId
                      ? 'Nomor Induk Kependudukan (NIK 16 Digit)'
                      : 'National ID Number (16 Digits)'
                    : isId
                    ? 'Nomor Paspor'
                    : 'Passport Number'}
                </label>
                <input
                  type="text"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder={idType === 'KTP' ? '3201xxxxxxxxxxxx' : 'A1234567'}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 min-h-[44px]"
                />
                <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    {isId
                      ? 'Data identitas Anda tersimpan terenkripsi dan hanya digunakan untuk verifikasi KYC internal.'
                      : 'Your ID data is encrypted and used exclusively for internal KYC verification.'}
                  </span>
                </p>
              </div>

              {/* Checkbox Persetujuan Komitmen */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasAgreed}
                    onChange={(e) => setHasAgreed(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
                  />
                  <div className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                    {isId
                      ? 'Saya berkomitmen memberikan pengalaman wisata yang otentik, aman, dan menghormati kearifan lokal serta norma kesopanan setempat.'
                      : 'I commit to providing authentic, safe, and culturally respectful local travel experiences adhering to local customs.'}
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* ================= TOUCH-FRIENDLY BOTTOM NAVIGATION ================= */}
          <div className="pt-6 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                disabled={isSubmitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm transition min-h-[44px] cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>{isId ? 'Kembali' : 'Back'}</span>
              </button>
            ) : (
              <div className="hidden sm:block" />
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm transition shadow-sm shadow-brand-500/20 min-h-[44px] cursor-pointer"
              >
                <span>{isId ? 'Lanjutkan' : 'Continue'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!isStep3Valid || isSubmitting}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm transition shadow-sm min-h-[44px] ${
                  isStep3Valid && !isSubmitting
                    ? 'bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-700 hover:to-purple-700 text-white shadow-brand-500/25 cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isId ? 'Mengirim Pendaftaran...' : 'Submitting Application...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{isId ? 'Kirim Pendaftaran Jadi Host (+100 XP)' : 'Submit Host Application (+100 XP)'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
