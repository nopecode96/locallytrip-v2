'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  updateProfile,
  updateNotificationSettings,
  addOrUpdateBankAccount,
  updatePayoutSettings,
  updateUserLanguages,
  updateUserCommunicationContacts,
} from '@/actions/settings';
import { CitySearchCombobox, CityOption } from '@/components/common/CitySearchCombobox';
import { ImageUploadDropzone } from '@/components/shared/ImageUploadDropzone';
import { resolveAvatarUrl } from '@/lib/avatar';
import { signOut, useSession } from 'next-auth/react';
import { logoutAction } from '@/actions/auth/logout';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  User,
  Bell,
  MapPin,
  Phone,
  FileText,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Camera,
  Mail,
  Smartphone,
  ShieldCheck,
  Building,
  CreditCard,
  Globe,
  Share2,
  Plus,
  HelpCircle,
  Check,
  LogOut,
  X,
} from 'lucide-react';

export { resolveAvatarUrl } from '@/lib/avatar';

export interface BankAccountItem {
  id: number;
  bank_id: number;
  bank_name: string;
  bank_code: string;
  account_number: string;
  account_holder_name: string;
  branch_name: string | null;
  is_primary: boolean;
  is_verified: boolean;
}

export interface PayoutSettingsData {
  minimum_payout: number;
  payout_method: string;
  auto_payout: boolean;
}

export interface BankOption {
  id: number;
  bank_name: string;
  bank_code: string;
}

export interface LanguageOption {
  id: number;
  name: string;
  code: string;
  native_name: string | null;
}

export interface CommunicationAppOption {
  id: number;
  name: string;
  display_name: string;
}

export interface CommunicationContactItem {
  communicationAppId: number;
  appName: string;
  contactValue: string;
}

interface UserProfileData {
  id: number;
  name: string;
  email: string;
  username: string | null;
  role: string;
  is_verified: boolean;
  is_kyc_approved?: boolean;
  bio: string | null;
  phone: string | null;
  avatar_url: string | null;
  image?: string | null;
  city_id: number | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
}

interface NotificationSettingsData {
  email_bookings: boolean;
  email_messages: boolean;
  email_reviews: boolean;
  email_promotions: boolean;
  email_updates: boolean;
  push_bookings: boolean;
  push_messages: boolean;
  push_reviews: boolean;
}

interface SettingsClientProps {
  user: UserProfileData;
  initialNotificationSettings: NotificationSettingsData;
  initialBankAccounts: BankAccountItem[];
  initialPayoutSettings: PayoutSettingsData;
  initialUserLanguages: number[];
  initialCommunicationContacts: CommunicationContactItem[];
  cities: CityOption[];
  banks: BankOption[];
  languages: LanguageOption[];
  communicationApps: CommunicationAppOption[];
  locale: string;
}

type SettingsTab = 'profile' | 'payout' | 'languages_social' | 'notifications';

export function SettingsClient({
  user,
  initialNotificationSettings,
  initialBankAccounts,
  initialPayoutSettings,
  initialUserLanguages,
  initialCommunicationContacts,
  cities,
  banks,
  languages,
  communicationApps,
  locale,
}: SettingsClientProps) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const isId = locale === 'id';

  // Cek apakah pengguna berstatus Host dan status KYC
  const isHost = user.role?.toLowerCase() === 'host';
  const isKycApproved = user.is_kyc_approved ?? (user.is_verified || false);

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // State Tab 1: Profil
  const [name, setName] = useState(user.name || '');
  const [bio, setBio] = useState(user.bio || '');
  const [avatarUrl, setAvatarUrl] = useState<string>(user?.avatar_url || (user as any)?.image || '');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [phone, setPhone] = useState(user.phone || '');
  const [cityId, setCityId] = useState<number | ''>(user.city_id || '');
  const [emergencyName, setEmergencyName] = useState(user.emergency_contact_name || '');
  const [emergencyPhone, setEmergencyPhone] = useState(user.emergency_contact_phone || '');
  const [emergencyRelationship, setEmergencyRelationship] = useState(
    user.emergency_contact_relationship || ''
  );
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // State Tab 2: Rekening Bank & Payout
  const [bankAccounts, setBankAccounts] = useState<BankAccountItem[]>(initialBankAccounts);
  const [selectedBankId, setSelectedBankId] = useState<number | ''>(banks[0]?.id || '');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState(user.name || '');
  const [branchName, setBranchName] = useState('');
  const [minimumPayout, setMinimumPayout] = useState<number>(initialPayoutSettings.minimum_payout || 100000);
  const [payoutMethod, setPayoutMethod] = useState<string>(initialPayoutSettings.payout_method || 'bank_transfer');
  const [isSavingBank, setIsSavingBank] = useState(false);
  const [bankSuccess, setBankSuccess] = useState<string | null>(null);
  const [bankError, setBankError] = useState<string | null>(null);

  // State Tab 3: Bahasa & Media Sosial
  const [selectedLanguageIds, setSelectedLanguageIds] = useState<number[]>(initialUserLanguages);
  const [socialValues, setSocialValues] = useState<{ [appId: number]: string }>(() => {
    const map: { [appId: number]: string } = {};
    communicationApps.forEach((app) => {
      const found = initialCommunicationContacts.find((c) => c.communicationAppId === app.id);
      map[app.id] = found ? found.contactValue : '';
    });
    return map;
  });
  const [isSavingLangSocial, setIsSavingLangSocial] = useState(false);
  const [langSocialSuccess, setLangSocialSuccess] = useState<string | null>(null);
  const [langSocialError, setLangSocialError] = useState<string | null>(null);

  // State Tab 4: Notifikasi
  const [notifSettings, setNotifSettings] = useState<NotificationSettingsData>(initialNotificationSettings);
  const [isSavingNotifs, setIsSavingNotifs] = useState(false);
  const [notifSuccess, setNotifSuccess] = useState<string | null>(null);
  const [notifError, setNotifError] = useState<string | null>(null);

  // State Logout Dialog
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutAction();
      await signOut({ redirect: true, callbackUrl: `/${locale}` });
    } catch {
      window.location.href = `/${locale}`;
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Helper toggle notifikasi
  const handleToggle = (key: keyof NotificationSettingsData) => {
    setNotifSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Helper toggle bahasa
  const toggleLanguage = (langId: number) => {
    setSelectedLanguageIds((prev) =>
      prev.includes(langId) ? prev.filter((id) => id !== langId) : [...prev, langId]
    );
  };

  // 1. Simpan Profil
  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProfileSuccess(null);
    setProfileError(null);

    if (!name || name.trim().length < 2) {
      setProfileError(isId ? 'Nama lengkap minimal 2 karakter.' : 'Full name must be at least 2 characters.');
      return;
    }

    if (isUploadingImage) {
      setProfileError(isId ? 'Foto profil masih dalam proses unggah. Mohon tunggu.' : 'Profile photo is still uploading.');
      return;
    }

    setIsSavingProfile(true);
    try {
      const form = e.currentTarget;
      const formData = new FormData(form);

      // Injeksi paksa avatarUrl jika ada perubahan & bukan blob
      if (avatarUrl && !avatarUrl.startsWith('blob:')) {
        formData.set('avatar_url', avatarUrl);
      }
      formData.set('name', name.trim());
      formData.set('bio', bio.trim());
      formData.set('phone', phone.trim());
      if (cityId) formData.set('cityId', String(cityId));
      formData.set('emergencyContactName', emergencyName.trim());
      formData.set('emergencyContactPhone', emergencyPhone.trim());
      formData.set('emergencyContactRelationship', emergencyRelationship.trim());

      console.log('SettingsClient mengirim formData avatar_url:', formData.get('avatar_url'));

      const res = await updateProfile(formData);

      if (res?.success) {
        setProfileSuccess(isId ? 'Profil biodata berhasil diperbarui!' : 'Profile successfully updated!');
        // Hapus previewUrl agar gambar resmi dari server/state yang tampil
        if (avatarUrl && !avatarUrl.startsWith('blob:')) {
          setPreviewUrl(null);
        }
        // Perbarui token JWT NextAuth dengan avatar terbaru agar Dasbor langsung sinkron
        if (avatarUrl && !avatarUrl.startsWith('blob:')) {
          await updateSession({ image: resolveAvatarUrl(avatarUrl) }).catch(() => null);
        }
        router.refresh();
      } else {
        setProfileError(res?.error || (isId ? 'Gagal menyimpan profil.' : 'Failed to save profile.'));
      }
    } catch {
      setProfileError(isId ? 'Terjadi kesalahan sistem.' : 'System error.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // 2. Simpan Rekening Bank & Payout
  const handleSaveBankAndPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setBankSuccess(null);
    setBankError(null);

    setIsSavingBank(true);
    try {
      if (accountNumber.trim()) {
        if (!selectedBankId || !accountHolder.trim()) {
          setBankError(isId ? 'Lengkapi bank dan nama pemilik rekening.' : 'Please provide bank and account holder.');
          setIsSavingBank(false);
          return;
        }

        const bankRes = await addOrUpdateBankAccount({
          bankId: Number(selectedBankId),
          accountNumber: accountNumber.trim(),
          accountHolderName: accountHolder.trim(),
          branchName: branchName.trim() || undefined,
          isPrimary: true,
        });

        if (!bankRes.success) {
          setBankError(bankRes.error || (isId ? 'Gagal menyimpan rekening bank.' : 'Failed to save bank account.'));
          setIsSavingBank(false);
          return;
        }
      }

      const payoutRes = await updatePayoutSettings({
        minimumPayout: Number(minimumPayout),
        payoutMethod,
      });

      if (payoutRes.success) {
        setBankSuccess(isId ? 'Rekening bank & preferensi penarikan dana tersimpan!' : 'Bank account & payout settings saved!');
        router.refresh();
      } else {
        setBankError(payoutRes.error || (isId ? 'Gagal menyimpan konfigurasi payout.' : 'Failed to save payout settings.'));
      }
    } catch {
      setBankError(isId ? 'Terjadi kesalahan sistem.' : 'System error.');
    } finally {
      setIsSavingBank(false);
    }
  };

  // 3. Simpan Bahasa & Media Sosial
  const handleSaveLanguagesAndSocial = async (e: React.FormEvent) => {
    e.preventDefault();
    setLangSocialSuccess(null);
    setLangSocialError(null);

    setIsSavingLangSocial(true);
    try {
      const langRes = await updateUserLanguages(selectedLanguageIds);
      if (!langRes.success) {
        setLangSocialError(langRes.error || (isId ? 'Gagal memperbarui bahasa.' : 'Failed to update languages.'));
        setIsSavingLangSocial(false);
        return;
      }

      const contactsPayload = Object.entries(socialValues).map(([appId, val]) => ({
        communicationAppId: Number(appId),
        contactValue: val,
      }));

      const socialRes = await updateUserCommunicationContacts(contactsPayload);
      if (socialRes.success) {
        setLangSocialSuccess(isId ? 'Bahasa & tautan komunikasi berhasil disimpan!' : 'Languages & communication links saved!');
        router.refresh();
      } else {
        setLangSocialError(socialRes.error || (isId ? 'Gagal menyimpan kontak medsos.' : 'Failed to save social contacts.'));
      }
    } catch {
      setLangSocialError(isId ? 'Terjadi kesalahan sistem.' : 'System error.');
    } finally {
      setIsSavingLangSocial(false);
    }
  };

  // 4. Simpan Notifikasi
  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotifSuccess(null);
    setNotifError(null);

    setIsSavingNotifs(true);
    try {
      const res = await updateNotificationSettings(notifSettings);
      if (res.success) {
        setNotifSuccess(isId ? 'Preferensi notifikasi berhasil disimpan!' : 'Notification preferences saved!');
        router.refresh();
      } else {
        setNotifError(res.error || (isId ? 'Gagal menyimpan preferensi notifikasi.' : 'Failed to save notifications.'));
      }
    } catch {
      setNotifError(isId ? 'Terjadi kesalahan sistem.' : 'System error.');
    } finally {
      setIsSavingNotifs(false);
    }
  };

  // Sumber gambar yang ditampilkan pada lingkaran avatar menggunakan helper terpusat
  const rawAvatar = previewUrl || avatarUrl || user?.avatar_url || (user as any)?.image;
  const displayAvatar = resolveAvatarUrl(rawAvatar);

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Tombol Navigasi Kembali ke Dashboard */}
        <div className="mb-6">
          <Link
            href={`/${locale}/dashboard`}
            className="text-sm font-medium text-slate-500 hover:text-purple-600 inline-flex items-center gap-1 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{isId ? 'Kembali ke Dashboard' : 'Back to Dashboard'}</span>
          </Link>
        </div>

        {/* Header Judul Halaman */}
        <div className="mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200/60">
            {isId ? 'Pengaturan Akun' : 'Account Settings'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 font-serif tracking-tight">
            {isId ? 'Pengaturan Profil & Preferensi Akun' : 'Profile & Account Preferences'}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {isId
              ? 'Kelola biodata profil publik, nomor kontak, rekening pencairan dana, serta notifikasi platform.'
              : 'Manage your public profile bio, contact details, payout accounts, and platform notifications.'}
          </p>
        </div>

        {/* Layout 2-Kolom: Navigasi Sidebar Tab (Kiri: 4 Kolom) + Konten Tab Aktif (Kanan: 8 Kolom) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Kolom Kiri: Sidebar Menu Tab */}
          <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs space-y-1 sticky top-24">
            {[
              {
                id: 'profile' as SettingsTab,
                label: isId ? 'Profil & Biodata Diri' : 'Profile & Bio',
                icon: User,
                desc: isId ? 'Identitas, avatar, kontak & darurat' : 'Identity, avatar, emergency contacts',
              },
              {
                id: 'payout' as SettingsTab,
                label: isId ? 'Rekening Bank & Payout' : 'Bank Accounts & Payout',
                icon: Building,
                desc: isId ? 'Pencairan saldo hasil tur & affiliate' : 'Tour revenue & affiliate bank payout',
              },
              {
                id: 'languages_social' as SettingsTab,
                label: isId ? 'Bahasa & Media Sosial' : 'Languages & Social Media',
                icon: Globe,
                desc: isId ? 'Kemampuan bahasa & kontak medsos' : 'Tour guide languages & public links',
              },
              {
                id: 'notifications' as SettingsTab,
                label: isId ? 'Preferensi & Notifikasi' : 'Notifications',
                icon: Bell,
                desc: isId ? 'Kendalikan email & push notification' : 'Email & push notifications toggle',
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left p-3.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-start gap-3 cursor-pointer ${
                    isActive
                      ? 'bg-purple-900 text-white shadow-xs'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${isActive ? 'text-amber-300' : 'text-slate-400'}`} />
                  <div className="min-w-0">
                    <div className="truncate">{tab.label}</div>
                    <div className={`text-[11px] font-normal truncate ${isActive ? 'text-purple-200' : 'text-slate-400'}`}>
                      {tab.desc}
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Blok Khusus Host KYC: HANYA TAMPIL JIKA user.role === 'host' */}
            {isHost && (
              <div className="pt-4 border-t border-slate-100 mt-2 px-3 pb-2 space-y-2.5">
                <div className="flex items-center justify-between text-xs px-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {isId ? 'Status Verifikasi' : 'Verification Status'}
                  </span>
                  {isKycApproved ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px]">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Verified KYC</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 text-[10px]">
                      <span>{isId ? 'Belum Verifikasi' : 'Unverified'}</span>
                    </span>
                  )}
                </div>
                <Link
                  href={`/${locale}/dashboard/kyc`}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 transition border border-purple-100"
                >
                  <span>{isId ? 'Verifikasi Identitas & Host KYC' : 'Verify Identity & Host KYC'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            {/* Tombol Cepat Logout di Sidebar: Tampil untuk SEMUA USER di bagian bawah */}
            <div className="pt-3 border-t border-slate-100 px-3 pb-1">
              <button
                type="button"
                onClick={() => setShowLogoutModal(true)}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold border border-rose-200/70 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{isId ? 'Keluar dari Akun' : 'Sign Out'}</span>
              </button>
            </div>
          </div>

          {/* Kolom Kanan: Panel Form Konten Tab Aktif */}
          <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs">
            {/* ================= TAB 1: PROFIL & BIODATA DIRI ================= */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 font-serif">
                    {isId ? 'Profil & Biodata Diri' : 'Profile & Personal Info'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isId
                      ? 'Informasi ini tampil di profil publik dan e-tiket pesanan Anda.'
                      : 'This information appears on your public profile and booking tickets.'}
                  </p>
                </div>

                {profileSuccess && (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
                    <p className="font-semibold">{profileSuccess}</p>
                  </div>
                )}

                {profileError && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
                    <p className="font-semibold">{profileError}</p>
                  </div>
                )}

                {/* Pastikan Hidden Input Form Benar-benar Memuat avatarUrl: */}
                <input type="hidden" name="avatar_url" value={avatarUrl || ''} />

                {/* Section Avatar & Sampul Profil */}
                <div className="space-y-4 p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                    {/* Lingkaran Avatar dengan Instant Client Preview */}
                    <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-purple-100 bg-slate-100 shrink-0">
                      <img
                        key={displayAvatar}
                        src={displayAvatar}
                        alt="Foto Profil"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Jika preview/path gagal, fallback aman ke default
                          (e.target as HTMLImageElement).src = '/images/default-avatar.png';
                        }}
                      />
                    </div>
                    <div className="flex-1 w-full">
                      <ImageUploadDropzone
                        folder="avatars"
                        onPreviewChange={(blob) => {
                          console.log('Preview blob URL:', blob);
                          setPreviewUrl(blob);
                        }}
                        onUploadingChange={setIsUploadingImage}
                        onChange={(uploadedUrl) => {
                          const finalPath = Array.isArray(uploadedUrl) ? uploadedUrl[0] : uploadedUrl;
                          console.log('SettingsClient menerima uploadedUrl:', finalPath);
                          if (finalPath) {
                            setAvatarUrl(finalPath); // Simpan path "/images/avatars/..."
                          }
                        }}
                        disabled={isSavingProfile}
                        hidePreview={true}
                        label={isId ? 'Foto Profil (Avatar)' : 'Profile Avatar'}
                        description={
                          isId
                            ? 'Foto wajah jelas dan ramah. Format JPG, PNG, WebP maks. 5 MB.'
                            : 'Clear and friendly face photo. JPG, PNG, WebP max 5 MB.'
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Grid Input Data Diri */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      {isId ? 'Nama Lengkap' : 'Full Name'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="Contoh: Nope Lavanda"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 min-h-[44px]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      {isId ? 'Username Akun' : 'Account Username'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">@</span>
                      <input
                        type="text"
                        value={user.username || ''}
                        disabled
                        className="w-full pl-8 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-xs sm:text-sm cursor-not-allowed min-h-[44px]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      {isId ? 'Alamat Email Terdaftar' : 'Registered Email'}
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={user.email}
                        disabled
                        className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-xs sm:text-sm cursor-not-allowed min-h-[44px]"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Terverifikasi
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      {isId ? 'Nomor WhatsApp / HP' : 'WhatsApp / Mobile Phone'}
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Contoh: 08123456789 atau +62812..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 min-h-[44px]"
                      />
                    </div>
                  </div>

                  {/* Kota Asal / Domisili dengan CitySearchCombobox */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      {isId ? 'Kota Domisili / Asal' : 'Current City / Location'}
                    </label>
                    <CitySearchCombobox
                      cities={cities}
                      value={cityId}
                      onChange={(newCityId) => setCityId(newCityId)}
                      locale={locale}
                      placeholder={isId ? 'Pilih kota asal atau domisili...' : 'Select home city or location...'}
                    />
                  </div>

                  {/* Bio Singkat */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700">
                        {isId ? 'Bio Singkat / Tentang Saya' : 'Short Bio / About Me'}
                      </label>
                      <span className={`text-[11px] ${bio.length > 300 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                        {bio.length}/300
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      maxLength={300}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder={
                        isId
                          ? 'Ceritakan secara singkat minat perjalanan Anda, rute favorit, atau spesialisasi pemanduan...'
                          : 'Share a brief summary of your travel interests or tour guiding passion...'
                      }
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 leading-relaxed"
                    />
                  </div>
                </div>

                {/* Seksi Kontak Darurat (Emergency Contact) */}
                <div className="pt-6 border-t border-slate-100 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {isId ? 'Kontak Darurat (Emergency Contact)' : 'Emergency Contact Details'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {isId
                        ? 'Dibutuhkan untuk keamanan perjalanan saat Anda mengikuti atau memandu tur alam terbuka.'
                        : 'Required for travel safety when joining or hosting outdoor activities.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        {isId ? 'Nama Lengkap Kontak' : 'Contact Name'}
                      </label>
                      <input
                        type="text"
                        value={emergencyName}
                        onChange={(e) => setEmergencyName(e.target.value)}
                        placeholder="Contoh: Siti Rahma"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/30 min-h-[44px]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        {isId ? 'Nomor Telepon Darurat' : 'Emergency Phone'}
                      </label>
                      <input
                        type="tel"
                        value={emergencyPhone}
                        onChange={(e) => setEmergencyPhone(e.target.value)}
                        placeholder="Contoh: 081298765432"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/30 min-h-[44px]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        {isId ? 'Hubungan Kerabat' : 'Relationship'}
                      </label>
                      <input
                        type="text"
                        value={emergencyRelationship}
                        onChange={(e) => setEmergencyRelationship(e.target.value)}
                        placeholder="Contoh: Pasangan / Orang Tua"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/30 min-h-[44px]"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingProfile || isUploadingImage}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-900 hover:bg-purple-950 text-white font-bold text-xs sm:text-sm shadow-xs transition min-h-[44px] disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingProfile || isUploadingImage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>
                      {isUploadingImage
                        ? isId
                          ? 'Mengunggah Foto...'
                          : 'Uploading Photo...'
                        : isSavingProfile
                        ? isId
                          ? 'Menyimpan...'
                          : 'Saving...'
                        : isId
                        ? 'Simpan Perubahan Profil'
                        : 'Save Profile Changes'}
                    </span>
                  </button>
                </div>

                {/* Seksi Khusus: Sesi Akun / Keluar dari Perangkat */}
                <div className="pt-8 border-t border-slate-200/80 mt-8">
                  <div className="p-5 rounded-2xl bg-rose-50/50 border border-rose-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <LogOut className="w-4 h-4 text-rose-600" />
                        <span>{isId ? 'Sesi Akun & Keluar Perangkat' : 'Account Session & Sign Out'}</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
                        {isId
                          ? 'Keluar dari akun Anda pada perangkat ini. Seluruh cookie sesi dan autentikasi akan dibersihkan secara aman.'
                          : 'Sign out of your account on this device. All session cookies and credentials will be safely cleared.'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowLogoutModal(true)}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 font-bold text-xs sm:text-sm shadow-2xs transition shrink-0 active:scale-95 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{isId ? 'Keluar dari Akun' : 'Sign Out'}</span>
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* ================= TAB 2: REKENING BANK & PAYOUT ================= */}
            {activeTab === 'payout' && (
              <form onSubmit={handleSaveBankAndPayout} className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 font-serif">
                    {isId ? 'Rekening Bank & Penarikan Dana (Payout Host)' : 'Bank Account & Payout Settings'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isId
                      ? 'Kelola rekening bank tujuan pencairan pendapatan tur dan komisi referral affiliate.'
                      : 'Manage destination bank account for tour revenues and referral commissions.'}
                  </p>
                </div>

                {bankSuccess && (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
                    <p className="font-semibold">{bankSuccess}</p>
                  </div>
                )}

                {bankError && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
                    <p className="font-semibold">{bankError}</p>
                  </div>
                )}

                {/* Daftar Rekening Tersimpan */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                    {isId ? 'Rekening Bank Terdaftar' : 'Registered Bank Accounts'}
                  </span>
                  {bankAccounts.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center text-xs text-slate-500">
                      {isId
                        ? 'Belum ada rekening bank yang tersimpan. Daftarkan rekening di bawah untuk menerima dana.'
                        : 'No bank account registered yet. Register your account below to receive payouts.'}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {bankAccounts.map((acc) => (
                        <div
                          key={acc.id}
                          className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-900 font-black flex items-center justify-center shrink-0">
                              <Building className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                                <span>{acc.bank_name}</span>
                                {acc.is_primary && (
                                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                    Rekening Utama
                                  </span>
                                )}
                              </div>
                              <p className="font-mono text-xs text-slate-600 mt-0.5">
                                {acc.account_number} • a.n. {acc.account_holder_name}
                              </p>
                            </div>
                          </div>
                          {acc.branch_name && (
                            <span className="text-xs text-slate-400">Cabang: {acc.branch_name}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Form Tambah/Ubah Rekening */}
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <span className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                    {isId ? 'Tambah / Perbarui Rekening Bank' : 'Add / Update Bank Account'}
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        {isId ? 'Nama Bank' : 'Bank Name'}
                      </label>
                      <select
                        value={selectedBankId}
                        onChange={(e) => setSelectedBankId(Number(e.target.value))}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/30 min-h-[44px]"
                      >
                        {banks.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.bank_name} ({b.bank_code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        {isId ? 'Nomor Rekening' : 'Account Number'}
                      </label>
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="Contoh: 1234567890"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/30 min-h-[44px]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        {isId ? 'Atas Nama Pemilik Rekening' : 'Account Holder Name'}
                      </label>
                      <input
                        type="text"
                        value={accountHolder}
                        onChange={(e) => setAccountHolder(e.target.value)}
                        placeholder="Harus sesuai dengan nama di buku tabungan"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/30 min-h-[44px]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        {isId ? 'Kantor Cabang (Opsional)' : 'Branch Name (Optional)'}
                      </label>
                      <input
                        type="text"
                        value={branchName}
                        onChange={(e) => setBranchName(e.target.value)}
                        placeholder="Contoh: KCU Bandung Asia Afrika"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/30 min-h-[44px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Konfigurasi Payout Minimum */}
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <span className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                    {isId ? 'Preferensi Penarikan Dana' : 'Payout Preferences'}
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        {isId ? 'Batas Minimum Pencairan (IDR)' : 'Minimum Payout (IDR)'}
                      </label>
                      <input
                        type="number"
                        min={50000}
                        step={10000}
                        value={minimumPayout}
                        onChange={(e) => setMinimumPayout(Number(e.target.value))}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/30 min-h-[44px]"
                      />
                      <span className="text-[11px] text-slate-400">
                        {isId ? 'Batas pencairan minimal Rp 50.000' : 'Minimum threshold IDR 50,000'}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        {isId ? 'Metode Penarikan Utama' : 'Default Payout Method'}
                      </label>
                      <select
                        value={payoutMethod}
                        onChange={(e) => setPayoutMethod(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/30 min-h-[44px]"
                      >
                        <option value="bank_transfer">Transfer Bank Lokal (BCA, Mandiri, BRI, dll)</option>
                        <option value="paypal">PayPal</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingBank}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-900 hover:bg-purple-950 text-white font-bold text-xs sm:text-sm shadow-xs transition min-h-[44px] disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingBank ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{isId ? 'Simpan Rekening & Payout' : 'Save Bank & Payout'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* ================= TAB 3: BAHASA & MEDIA SOSIAL ================= */}
            {activeTab === 'languages_social' && (
              <form onSubmit={handleSaveLanguagesAndSocial} className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 font-serif">
                    {isId ? 'Bahasa & Media Sosial' : 'Languages & Social Media'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isId
                      ? 'Pilih bahasa yang Anda kuasai untuk memandu tur dan cantumkan tautan media sosial untuk memperkuat kredibilitas.'
                      : 'Select spoken languages and provide social links to boost traveler trust.'}
                  </p>
                </div>

                {langSocialSuccess && (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
                    <p className="font-semibold">{langSocialSuccess}</p>
                  </div>
                )}

                {langSocialError && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
                    <p className="font-semibold">{langSocialError}</p>
                  </div>
                )}

                {/* Pilihan Bahasa */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    {isId ? 'Bahasa yang Dikuasai (Pemandu Tur)' : 'Spoken Tour Languages'}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {languages.map((lang) => {
                      const isSelected = selectedLanguageIds.includes(lang.id);
                      return (
                        <button
                          key={lang.id}
                          type="button"
                          onClick={() => toggleLanguage(lang.id)}
                          className={`p-3 rounded-xl border text-left transition flex items-center justify-between text-xs font-bold cursor-pointer min-h-[44px] ${
                            isSelected
                              ? 'bg-purple-900 text-white border-purple-900 shadow-2xs'
                              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          <div>
                            <div>{lang.native_name || lang.name}</div>
                            <div className={`text-[10px] font-normal ${isSelected ? 'text-purple-200' : 'text-slate-400'}`}>
                              {lang.name} ({lang.code.toUpperCase()})
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-amber-300 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Media Sosial & Tautan Komunikasi */}
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      {isId ? 'Tautan Media Sosial & Chat App' : 'Social Media & Chat Apps'}
                    </label>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isId
                        ? 'Tautan ini akan tampil di profil publik Anda.'
                        : 'These handles will appear on your public profile.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {communicationApps.map((app) => (
                      <div key={app.id} className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">
                          {app.display_name}
                        </label>
                        <input
                          type="text"
                          value={socialValues[app.id] || ''}
                          onChange={(e) =>
                            setSocialValues((prev) => ({
                              ...prev,
                              [app.id]: e.target.value,
                            }))
                          }
                          placeholder={
                            app.name === 'instagram'
                              ? '@username atau https://instagram.com/...'
                              : app.name === 'whatsapp'
                              ? '628123456789'
                              : 'Username atau tautan profil...'
                          }
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/30 min-h-[44px]"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingLangSocial}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-900 hover:bg-purple-950 text-white font-bold text-xs sm:text-sm shadow-xs transition min-h-[44px] disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingLangSocial ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{isId ? 'Simpan Bahasa & Medsos' : 'Save Languages & Links'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* ================= TAB 4: PREFERENSI & NOTIFIKASI ================= */}
            {activeTab === 'notifications' && (
              <form onSubmit={handleSaveNotifications} className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 font-serif">
                    {isId ? 'Preferensi & Notifikasi' : 'Notification Preferences'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isId
                      ? 'Pilih pembaruan dan saluran pemberitahuan yang ingin Anda terima.'
                      : 'Choose which email and push updates you would like to receive.'}
                  </p>
                </div>

                {notifSuccess && (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
                    <p className="font-semibold">{notifSuccess}</p>
                  </div>
                )}

                {notifError && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
                    <p className="font-semibold">{notifError}</p>
                  </div>
                )}

                {/* Email Notifications */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Mail className="w-4 h-4 text-purple-700" />
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      {isId ? 'Pemberitahuan Melalui Email' : 'Email Notifications'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {[
                      {
                        key: 'email_bookings' as keyof NotificationSettingsData,
                        title: isId ? 'Pemesanan Tur & Reservasi' : 'Tour Bookings & Reservations',
                        desc: isId ? 'Konfirmasi jadwal tiket, invoice, dan perubahan status tur' : 'Booking vouchers, confirmation, and schedule updates',
                      },
                      {
                        key: 'email_messages' as keyof NotificationSettingsData,
                        title: isId ? 'Pesan Obrolan & Meetup' : 'Chat Messages & Meetups',
                        desc: isId ? 'Pemberitahuan saat ada pesan masuk atau ajakan kumpul' : 'Incoming chat messages and meetup community invites',
                      },
                      {
                        key: 'email_reviews' as keyof NotificationSettingsData,
                        title: isId ? 'Ulasan Tur & Forum Diskusi' : 'Tour Reviews & Forum Replies',
                        desc: isId ? 'Pemberitahuan ulasan baru tamu atau balasan thread vibes' : 'New reviews from guests or answers on your forum threads',
                      },
                      {
                        key: 'email_promotions' as keyof NotificationSettingsData,
                        title: isId ? 'Promo Khusus & Hadiah LTP' : 'Special Promotions & LTP Rewards',
                        desc: isId ? 'Voucher diskon petualangan dan penawaran promosi lokal' : 'Discounts, local deals, and reward milestones',
                      },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between gap-4"
                      >
                        <div>
                          <div className="font-bold text-xs sm:text-sm text-slate-900">{item.title}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggle(item.key)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            notifSettings[item.key] ? 'bg-purple-900' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              notifSettings[item.key] ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Push Notifications */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Smartphone className="w-4 h-4 text-purple-700" />
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      {isId ? 'Push Notification Browser & Perangkat' : 'Browser & Mobile Push Notifications'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {[
                      {
                        key: 'push_bookings' as keyof NotificationSettingsData,
                        title: isId ? 'Pengingat Jadwal Tur Masuk' : 'Realtime Tour Schedule Reminders',
                        desc: isId ? 'Notifikasi seketika saat tamu melakukan reservasi tur Anda' : 'Instant alerts when travelers book your experience',
                      },
                      {
                        key: 'push_messages' as keyof NotificationSettingsData,
                        title: isId ? 'Pesan Langsung Traveler' : 'Direct Messages',
                        desc: isId ? 'Pesan baru dari tamu atau pemandu di Locallytrip' : 'Instant alert for direct chats and coordination',
                      },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between gap-4"
                      >
                        <div>
                          <div className="font-bold text-xs sm:text-sm text-slate-900">{item.title}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggle(item.key)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            notifSettings[item.key] ? 'bg-purple-900' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              notifSettings[item.key] ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingNotifs}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-900 hover:bg-purple-950 text-white font-bold text-xs sm:text-sm shadow-xs transition min-h-[44px] disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingNotifs ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{isId ? 'Simpan Preferensi Notifikasi' : 'Save Notification Preferences'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Modal Dialog Konfirmasi Logout */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-150 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                  <LogOut className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-serif">
                    {isId ? 'Konfirmasi Keluar Akun' : 'Confirm Sign Out'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {user.name} (@{user.username})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 leading-relaxed">
              {isId
                ? 'Apakah Anda yakin ingin keluar dari akun Locallytrip? Anda harus masuk kembali untuk mengelola pesanan, cerita, dan dompet.'
                : 'Are you sure you want to sign out of your Locallytrip account? You will need to log back in to manage your bookings, stories, and wallet.'}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-bold transition hover:bg-slate-100"
              >
                {isId ? 'Batal' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                disabled={isLoggingOut}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isId ? 'Mengeluarkan...' : 'Signing out...'}</span>
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4" />
                    <span>{isId ? 'Ya, Keluar' : 'Yes, Sign Out'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
