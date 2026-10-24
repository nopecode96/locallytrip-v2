'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { submitKycApplication, claimKycReward } from '@/actions/kyc/submit-kyc';
import { UserAvatar } from '@/components/common/UserAvatar';
import {
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Camera,
  Coins,
  Clock,
  ChevronRight,
  MapPin,
  Lock,
  Check,
  Award,
  RefreshCw,
  Eye,
  FileBadge,
} from 'lucide-react';

interface KycDocumentItem {
  id: number;
  documentType: string;
  filePath: string;
  fileName: string;
  verificationStatus: string;
}

interface KycRecordData {
  id: number;
  status: string;
  idType: string;
  idNumber: string;
  fullName: string;
  dateOfBirth: string;
  placeOfBirth: string | null;
  gender: string | null;
  addressLine1: string;
  city: string;
  province: string;
  postalCode: string | null;
  businessName: string | null;
  taxNumber: string | null;
  certifications?: any;
  rejectionReason: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  documents: KycDocumentItem[];
}

interface KycSubmissionClientProps {
  locale: string;
  user: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    avatar_url?: string | null;
    isVerified: boolean;
    kycRewardStatus: string;
  };
  kycData: KycRecordData | null;
  cities: Array<{ id: number; name: string }>;
}

// Helper kompresi WebP otomatis di sisi klien menggunakan HTMLCanvasElement
const compressImageToWebP = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1600;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const webpData = canvas.toDataURL('image/webp', 0.85);
        resolve(webpData);
      };
      img.onerror = () => resolve(reader.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
};

export function KycSubmissionClient({
  locale,
  user,
  kycData,
  cities,
}: KycSubmissionClientProps) {
  const router = useRouter();
  const isId = locale === 'id';

  const [activeStep, setActiveStep] = useState<1 | 2>(1);
  const [isRevising, setIsRevising] = useState<boolean>(false);

  // Status Form & Data
  const [idType, setIdType] = useState<'ktp' | 'passport' | 'drivers_license'>(
    (kycData?.idType as any) || 'ktp'
  );
  const [idNumber, setIdNumber] = useState(kycData?.idNumber || '');
  const [fullName, setFullName] = useState(kycData?.fullName || user.name || '');
  const [dateOfBirth, setDateOfBirth] = useState(kycData?.dateOfBirth || '1995-05-15');
  const [placeOfBirth, setPlaceOfBirth] = useState(kycData?.placeOfBirth || '');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>(
    (kycData?.gender as any) || 'male'
  );
  const [addressLine1, setAddressLine1] = useState(kycData?.addressLine1 || '');
  const [city, setCity] = useState(kycData?.city || (cities[0]?.name || 'Bandung'));
  const [province, setProvince] = useState(kycData?.province || 'Jawa Barat');
  const [postalCode, setPostalCode] = useState(kycData?.postalCode || '');
  const [taxNumber, setTaxNumber] = useState(kycData?.taxNumber || '');
  const [licenseNumber, setLicenseNumber] = useState(
    kycData?.certifications?.license_number || ''
  );

  // Berkas File Base64
  const [idCardFrontBase64, setIdCardFrontBase64] = useState<string>('');
  const [selfieWithIdBase64, setSelfieWithIdBase64] = useState<string>('');
  const [certificateBase64, setCertificateBase64] = useState<string>('');

  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  // Klaim Hadiah
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  const isApproved = kycData?.status === 'approved';
  const isPending = kycData?.status === 'submitted' || kycData?.status === 'under_review';
  const isRejected = kycData?.status === 'rejected' || kycData?.status === 'resubmission_required';

  // Helper penanganan berkas dengan auto-kompresi WebP
  const handleFileWithCompression = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert(isId ? 'Ukuran file asli maksimal 10MB.' : 'Original file size cannot exceed 10MB.');
      return;
    }

    setIsCompressing(true);
    try {
      const compressedWebP = await compressImageToWebP(file);
      setter(compressedWebP);
    } catch {
      alert(isId ? 'Gagal memproses gambar.' : 'Failed to process image.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!idNumber.trim() || !fullName.trim() || !dateOfBirth || !addressLine1.trim()) {
      setSubmitError(
        isId
          ? 'Mohon lengkapi seluruh kolom identitas wajib.'
          : 'Please complete all required identity fields.'
      );
      return;
    }

    if (idType === 'ktp' && idNumber.trim().replace(/\D/g, '').length !== 16) {
      setSubmitError(
        isId
          ? 'Nomor NIK KTP harus terdiri dari 16 digit angka resmi.'
          : 'KTP ID Number must consist of 16 numeric digits.'
      );
      return;
    }

    if (!idCardFrontBase64 || !selfieWithIdBase64) {
      setSubmitError(
        isId
          ? 'Wajib melampirkan Foto KTP/Paspor dan Swafoto memegang KTP.'
          : 'ID Card Photo and Selfie with ID are required.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitKycApplication({
        fullName: fullName.trim(),
        idType,
        idNumber: idNumber.trim(),
        dateOfBirth,
        placeOfBirth: placeOfBirth.trim() || undefined,
        gender,
        addressLine1: addressLine1.trim(),
        city: city.trim(),
        province: province.trim(),
        postalCode: postalCode.trim() || undefined,
        taxNumber: taxNumber.trim() || undefined,
        licenseNumber: licenseNumber.trim() || undefined,
        idCardFrontBase64,
        selfieWithIdBase64,
        certificateBase64: certificateBase64 || undefined,
      });

      if (res.success) {
        setSubmitSuccess(true);
        setIsRevising(false);
        router.refresh();
      } else {
        setSubmitError(
          res.error || (isId ? 'Gagal mengirimkan pengajuan verifikasi.' : 'Failed to submit verification.')
        );
      }
    } catch {
      setSubmitError(isId ? 'Terjadi kesalahan sistem saat memproses pengajuan.' : 'System error processing submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClaimReward = async () => {
    setIsClaiming(true);
    setClaimError(null);
    try {
      const res = await claimKycReward();
      if (res.success) {
        setClaimSuccess(true);
        router.refresh();
      } else {
        setClaimError(res.error || (isId ? 'Gagal mengklaim hadiah.' : 'Failed to claim reward.'));
      }
    } catch {
      setClaimError(isId ? 'Terjadi kesalahan sistem.' : 'System error.');
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="w-full space-y-8">
      {/* Tombol Kembali ke Dashboard */}
      <div>
        <Link
          className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-orange-600 inline-flex items-center gap-1.5 transition-colors"
          href={`/${locale}/dashboard`}
        >
          <ArrowLeft className="w-4 h-4 text-orange-500" />
          <span>{isId ? 'Kembali ke Dashboard Host' : 'Back to Host Dashboard'}</span>
        </Link>
      </div>

      {/* Banner Header Gamifikasi & Status KYC */}
      <div className="w-full bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-orange-500/10 border border-emerald-200/60 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 shadow-xs">
        <div className="space-y-1.5">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 px-3 py-1 rounded-full border border-emerald-200 inline-block">
            {isId ? 'Verifikasi Resmi Pemandu Wisata' : 'Official Host Verification'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {isId ? 'Verifikasi Identitas & Legalitas Host (KYC)' : 'Identity & Legal Host Verification (KYC)'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
            {isId
              ? 'Dapatkan lencana Verified Host, tingkatkan kepercayaan wisatawan, dan aktifkan fitur penarikan dana pemesanan tur Anda.'
              : 'Earn the Verified Host badge, boost guest confidence, and unlock automated revenue payouts.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          <div className="px-3.5 py-2 bg-emerald-100 text-emerald-900 text-xs font-black rounded-xl border border-emerald-300 shadow-xs flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>+150 XP</span>
          </div>
          <div className="px-3.5 py-2 bg-amber-100 text-amber-900 text-xs font-black rounded-xl border border-amber-300 shadow-xs flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-amber-600" />
            <span>+20 LTP</span>
          </div>
        </div>
      </div>

      {/* Grid Utama: 8 Kolom Form / Status (Kiri) + 4 Kolom Panduan & Privasi (Kanan) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          {/* ========================================================== */}
          {/* KONDISI 1: STATUS APPROVED                                 */}
          {/* ========================================================== */}
          {isApproved && (
            <div className="space-y-6 text-center sm:text-left">
              <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-amber-50/60 via-emerald-50/40 to-teal-50/40 border border-amber-200/80 space-y-5">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                  <div className="relative shrink-0">
                    <UserAvatar
                      src={user.avatar_url}
                      name={user.name}
                      size={72}
                      className="border-2 border-amber-300 ring-4 ring-white shadow-md"
                    />
                    <span
                      title="KYC Verified"
                      className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-xs"
                    >
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 fill-white" />
                    </span>
                  </div>

                  <div className="space-y-1.5 text-center sm:text-left">
                    <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-800 bg-amber-100/80 border border-amber-300 px-3 py-1 rounded-full shadow-2xs">
                      <Award className="w-3.5 h-3.5 text-amber-600" />
                      <span>KYC Verified Local Guide</span>
                    </span>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                      {isId ? 'Selamat! Identitas Anda Telah Terverifikasi' : 'Congratulations! Your Identity is Verified'}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {isId
                        ? `Dokumen identitas resmi (${kycData.idType.toUpperCase()}: ${kycData.idNumber}) atas nama ${kycData.fullName} telah diverifikasi dan disetujui resmi oleh Tim Kepatuhan PT Locallytrip Teknologi Indonesia.`
                        : `Your government identification (${kycData.idType.toUpperCase()}: ${kycData.idNumber}) has been officially validated by Locallytrip Compliance Team.`}
                    </p>
                  </div>
                </div>

                {/* Klaim Hadiah XP & LTP Wallet */}
                {user.kycRewardStatus === 'unclaimed' && !claimSuccess ? (
                  <div className="pt-4 border-t border-amber-200/70 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/80 p-4 sm:p-5 rounded-2xl border border-amber-200/80 shadow-xs">
                    <div className="space-y-0.5">
                      <div className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>{isId ? 'Bonus Verifikasi Belum Diklaim!' : 'Unclaimed Verification Bonus!'}</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {isId
                          ? 'Dapatkan +150 XP reputasi pemandu dan +20 LTP langsung ke dompet Anda.'
                          : 'Receive +150 XP and +20 LTP coins credited directly to your wallet.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleClaimReward}
                      disabled={isClaiming}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-orange-500/20 transition min-h-[44px] cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      {isClaiming ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-amber-200" />
                      )}
                      <span>{isId ? 'Klaim Hadiah Sekarang' : 'Claim Reward Now'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-3.5 bg-emerald-50 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2 border border-emerald-200/80">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      {isId
                        ? 'Hadiah reputasi 150 XP & 20 LTP telah berhasil dikreditkan ke dompet akun Anda.'
                        : '150 XP & 20 LTP reputation points have been successfully credited to your wallet.'}
                    </span>
                  </div>
                )}

                {claimError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
                    {claimError}
                  </div>
                )}
              </div>

              {/* Ringkasan Rekaman Data Terverifikasi */}
              <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-4 text-xs">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span>{isId ? 'Data Identitas Resmi Terdaftar' : 'Verified Identity Record'}</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[11px] font-bold uppercase">{isId ? 'Nama Lengkap' : 'Full Name'}</span>
                    <span className="font-bold text-slate-800 text-sm">{kycData.fullName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] font-bold uppercase">{isId ? 'Nomor Identitas' : 'ID Number'}</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {kycData.idNumber} ({kycData.idType.toUpperCase()})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] font-bold uppercase">{isId ? 'Domisili' : 'Location'}</span>
                    <span className="font-semibold text-slate-800">
                      {kycData.city}, {kycData.province}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] font-bold uppercase">{isId ? 'Disetujui Tanggal' : 'Approval Date'}</span>
                    <span className="font-semibold text-slate-800">
                      {kycData.approvedAt
                        ? new Date(kycData.approvedAt).toLocaleDateString(isId ? 'id-ID' : 'en-US', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })
                        : '-'}
                    </span>
                  </div>
                  {kycData.certifications?.license_number && (
                    <div className="sm:col-span-2">
                      <span className="text-slate-400 block text-[11px] font-bold uppercase">{isId ? 'Nomor Lisensi Pemandu' : 'Tour Guide License'}</span>
                      <span className="font-bold text-slate-800">
                        📜 {kycData.certifications.license_number}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* KONDISI 2: STATUS SUBMITTED / UNDER REVIEW                 */}
          {/* ========================================================== */}
          {isPending && !isRevising && (
            <div className="space-y-6">
              <div className="p-6 sm:p-7 rounded-3xl bg-amber-50/80 border border-amber-200 space-y-3">
                <div className="flex items-center gap-2.5 text-amber-900 font-bold text-base">
                  <Clock className="w-5 h-5 text-amber-600 animate-spin" />
                  <span>{isId ? 'Dokumen Sedang Dalam Peninjauan Tim Kurasi' : 'Documents Under Review'}</span>
                </div>
                <p className="text-xs sm:text-sm text-amber-900/90 leading-relaxed">
                  {isId
                    ? 'Pengajuan berkas identitas Anda telah kami terima dan sedang ditinjau oleh Tim Kurasi Locallytrip (Estimasi maksimal 1x24 jam kerja). Anda akan menerima notifikasi dan email begitu proses kurasi selesai.'
                    : 'Your identity submission has been received and is currently under review by the Locallytrip Compliance Team (ETA 1x24 business hours). You will receive an update once finished.'}
                </p>
                <div className="text-[11px] text-amber-800 font-mono pt-1">
                  {isId ? 'Waktu Pengajuan:' : 'Submitted on:'}{' '}
                  {kycData?.submittedAt ? new Date(kycData.submittedAt).toLocaleString() : '-'}
                </div>
              </div>

              {/* Ringkasan Data Read-Only */}
              <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-4 text-xs">
                <h3 className="font-bold text-slate-900 text-sm">{isId ? 'Rincian Pengajuan Anda' : 'Your Submitted Details'}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[11px] font-bold uppercase">{isId ? 'Nama Lengkap' : 'Full Name'}</span>
                    <span className="font-semibold text-slate-800">{kycData?.fullName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] font-bold uppercase">No. {kycData?.idType?.toUpperCase()}</span>
                    <span className="font-semibold text-slate-800">{kycData?.idNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] font-bold uppercase">{isId ? 'Domisili' : 'Location'}</span>
                    <span className="font-semibold text-slate-800">{kycData?.city}, {kycData?.province}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] font-bold uppercase">{isId ? 'Dokumen Terlampir' : 'Attached Documents'}</span>
                    <span className="font-semibold text-slate-800">{kycData?.documents?.length || 2} Berkas</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* KONDISI 3 & 4: STATUS REJECTED / BELUM PERNAH (WIZARD FORM)*/}
          {/* ========================================================== */}
          {(!kycData || isRejected || isRevising) && !isApproved && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Alert Penolakan jika Status Rejected */}
              {isRejected && !isRevising && (
                <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-rose-900 text-sm">
                    <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                    <span>{isId ? 'Pengajuan Verifikasi Perlu Diperbaiki' : 'Submission Requires Revision'}</span>
                  </div>
                  <div className="text-xs sm:text-sm text-rose-700 space-y-1">
                    <p className="font-semibold">{isId ? 'Alasan Penolakan dari Tim Kurasi:' : 'Reason from Compliance Team:'}</p>
                    <p className="p-3 bg-white/80 rounded-xl border border-rose-200 font-mono text-xs">
                      {kycData?.rejectionReason || (isId ? 'Foto kartu identitas atau swafoto buram / tidak terbaca dengan jelas.' : 'ID photo or selfie was blurry or unreadable.')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsRevising(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{isId ? 'Buka Formulir Unggah Ulang' : 'Open Resubmission Form'}</span>
                  </button>
                </div>
              )}

              {submitSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>
                    {isId
                      ? 'Pengajuan verifikasi berhasil dikirimkan! Tim kurasi akan meninjau dalam 1x24 jam.'
                      : 'Verification submitted successfully! Our compliance team will review within 24 hours.'}
                  </span>
                </div>
              )}

              {submitError && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Wizard Navigasi Langkah 1 & 2 */}
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className={`flex items-center gap-2 text-xs font-bold transition pb-1 border-b-2 cursor-pointer ${
                    activeStep === 1
                      ? 'border-orange-600 text-orange-600'
                      : 'border-transparent text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                      activeStep === 1 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    1
                  </span>
                  <span>{isId ? 'Data Identitas Resmi' : 'Official Identity Info'}</span>
                </button>
                <ChevronRight className="w-4 h-4 text-slate-300" />
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className={`flex items-center gap-2 text-xs font-bold transition pb-1 border-b-2 cursor-pointer ${
                    activeStep === 2
                      ? 'border-orange-600 text-orange-600'
                      : 'border-transparent text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                      activeStep === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    2
                  </span>
                  <span>{isId ? 'Unggah Dokumen Fisik' : 'Upload Documents'}</span>
                </button>
              </div>

              {/* ====================================================== */}
              {/* LANGKAH 1: IDENTITAS RESMI & DOMISILI                  */}
              {/* ====================================================== */}
              {activeStep === 1 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        {isId ? 'Jenis Kartu Identitas' : 'ID Type'} <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={idType}
                        onChange={(e) => setIdType(e.target.value as any)}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[44px]"
                      >
                        <option value="ktp">e-KTP (Kartu Tanda Penduduk RI)</option>
                        <option value="passport">Paspor Internasional</option>
                        <option value="drivers_license">SIM (Surat Izin Mengemudi)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        {isId ? 'Nomor Identitas (NIK / No. Paspor)' : 'ID Number'} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={idNumber}
                        onChange={(e) => setIdNumber(e.target.value)}
                        placeholder={idType === 'ktp' ? '16 digit NIK e-KTP' : 'Nomor paspor atau SIM'}
                        required
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[44px]"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        {isId ? 'Nama Lengkap Sesuai Dokumen' : 'Full Name (as in ID)'} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Nama lengkap resmi tanpa gelar singkatan"
                        required
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[44px]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        {isId ? 'Tempat Lahir' : 'Place of Birth'}
                      </label>
                      <input
                        type="text"
                        value={placeOfBirth}
                        onChange={(e) => setPlaceOfBirth(e.target.value)}
                        placeholder="Contoh: Bandung"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[44px]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        {isId ? 'Tanggal Lahir' : 'Date of Birth'} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[44px]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        {isId ? 'Jenis Kelamin' : 'Gender'}
                      </label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value as any)}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[44px]"
                      >
                        <option value="male">{isId ? 'Laki-laki' : 'Male'}</option>
                        <option value="female">{isId ? 'Perempuan' : 'Female'}</option>
                        <option value="other">{isId ? 'Lainnya' : 'Other'}</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        {isId ? 'No. Lisensi Pemandu / Sertifikasi (Opsional)' : 'Guide License / Cert No. (Optional)'}
                      </label>
                      <input
                        type="text"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        placeholder="e.g. HPI-BDG-2024 atau lisensi BNSP"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[44px]"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        {isId ? 'Alamat Lengkap Sesuai KTP' : 'Full Residential Address'} <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={2}
                        value={addressLine1}
                        onChange={(e) => setAddressLine1(e.target.value)}
                        placeholder="Nama jalan, RT/RW, kelurahan, kecamatan"
                        required
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        {isId ? 'Kota / Kabupaten' : 'City'} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Contoh: Bandung"
                        required
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[44px]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        {isId ? 'Provinsi' : 'Province'} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={province}
                        onChange={(e) => setProvince(e.target.value)}
                        placeholder="Contoh: Jawa Barat"
                        required
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[44px]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        {isId ? 'Kode Pos' : 'Postal Code'}
                      </label>
                      <input
                        type="text"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="Contoh: 40115"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[44px]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        {isId ? 'NPWP Pribadi (Opsional)' : 'Tax Number / NPWP (Optional)'}
                      </label>
                      <input
                        type="text"
                        value={taxNumber}
                        onChange={(e) => setTaxNumber(e.target.value)}
                        placeholder="16 digit NPWP"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[44px]"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setActiveStep(2)}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-orange-500/20 transition min-h-[44px] cursor-pointer"
                    >
                      <span>{isId ? 'Lanjut ke Unggah Berkas →' : 'Continue to Upload →'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ====================================================== */}
              {/* LANGKAH 2: UNGGAH DOKUMEN FISIK                        */}
              {/* ====================================================== */}
              {activeStep === 2 && (
                <div className="space-y-5">
                  {/* Dropzone 1: Foto KTP / Paspor */}
                  <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-orange-600" />
                        <span>1. Foto KTP / Paspor Depan</span>
                        <span className="text-red-500">*</span>
                      </label>
                      {idCardFrontBase64 && (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>{isId ? 'Berkas Siap' : 'Ready'}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {isId
                        ? 'Pastikan seluruh teks NIK, nama, dan foto terlihat tajam tanpa pantulan flash.'
                        : 'Ensure ID number, name, and photo are sharp and well-lit without glare.'}
                    </p>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => handleFileWithCompression(e, setIdCardFrontBase64)}
                      className="w-full text-xs text-slate-600 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer"
                    />
                  </div>

                  {/* Dropzone 2: Swafoto Memegang KTP */}
                  <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-orange-600" />
                        <span>2. Swafoto (Selfie) Memegang KTP</span>
                        <span className="text-red-500">*</span>
                      </label>
                      {selfieWithIdBase64 && (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>{isId ? 'Berkas Siap' : 'Ready'}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {isId
                        ? 'Pegang kartu identitas di samping wajah. Pastikan wajah dan kartu menghadap kamera dengan jelas.'
                        : 'Hold your ID next to your face. Ensure both face and ID card are in clear focus.'}
                    </p>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => handleFileWithCompression(e, setSelfieWithIdBase64)}
                      className="w-full text-xs text-slate-600 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer"
                    />
                  </div>

                  {/* Dropzone 3: Lisensi / Sertifikasi Pemandu Wisata */}
                  <div className="p-5 rounded-2xl border border-dashed border-slate-300 bg-white space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <FileBadge className="w-4 h-4 text-slate-500" />
                        <span>3. Berkas Sertifikasi Pemandu Wisata (Opsional)</span>
                      </label>
                      {certificateBase64 && (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>{isId ? 'Berkas Siap' : 'Ready'}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      {isId
                        ? 'Unggah kartu tanda anggota HPI, sertifikat BNSP, lisensi selam PADI, atau sertifikat first-aid.'
                        : 'Upload HPI membership, BNSP guide certification, diving license, or first-aid training proof.'}
                    </p>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => handleFileWithCompression(e, setCertificateBase64)}
                      className="w-full text-xs text-slate-600 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-800 hover:file:bg-slate-200 cursor-pointer"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveStep(1)}
                      className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition cursor-pointer"
                    >
                      ← {isId ? 'Kembali ke Data Diri' : 'Back to Identity'}
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting || isCompressing || !idCardFrontBase64 || !selfieWithIdBase64}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-orange-500/20 transition min-h-[44px] cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting || isCompressing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{isId ? 'Mengunggah Berkas...' : 'Uploading...'}</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-4 h-4" />
                          <span>{isId ? 'Kirim Berkas Verifikasi KYC' : 'Submit KYC Documents'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>

        {/* ========================================================== */}
        {/* KOLOM KANAN: PANDUAN FOTO & STANDAR PRIVASI (lg:col-span-4)*/}
        {/* ========================================================== */}
        <div className="lg:col-span-4 space-y-6">
          {/* Kartu Panduan Foto KTP */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Camera className="w-4 h-4 text-orange-600" />
              <span>{isId ? 'Ketentuan Foto Dokumen' : 'Photo Quality Guidelines'}</span>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Dokumen fisik asli, bukan hasil fotokopi hitam putih.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Seluruh 4 sudut kartu identitas terlihat utuh dalam bingkai.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Swafoto tidak menggunakan kacamata hitam atau penutup wajah.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Format file didukung: JPG, PNG, atau WebP (terkompresi otomatis).</span>
              </li>
            </ul>
          </div>

          {/* Keuntungan Status Host Terverifikasi */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-3.5">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>{isId ? 'Manfaat Host Terverifikasi' : 'Verified Host Benefits'}</span>
            </div>
            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Lencana resmi *Verified Host* pada seluruh halaman tur Anda.</span>
              </div>
              <div className="flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span>Mendapatkan reward instan +150 XP dan +20 Koin LTP.</span>
              </div>
              <div className="flex items-start gap-2">
                <Coins className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span>Membuka hak pencairan otomatis hasil pemesanan ke rekening bank.</span>
              </div>
            </div>
          </div>

          {/* Kartu Standar Keamanan & Enkripsi AES-256 */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-6 shadow-md space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5" />
              <span>Standar Keamanan Enkripsi 256-bit</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Seluruh berkas dokumen KYC disimpan di direktori terisolasi dengan enkripsi dan hanya digunakan oleh tim kepatuhan resmi PT Locallytrip Teknologi Indonesia untuk validasi pemandu wisata.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
