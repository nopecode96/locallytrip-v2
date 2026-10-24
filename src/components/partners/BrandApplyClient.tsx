'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Building2,
  Mail,
  Phone,
  Globe,
  Tag,
  Coins,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Loader2,
  Star,
  Gift,
  HelpCircle,
} from 'lucide-react';
import { submitBrandPartnershipApplication } from '@/actions/partners/brand-actions';

interface BrandApplyClientProps {
  locale: string;
}

export function BrandApplyClient({ locale }: BrandApplyClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isId = locale === 'id';

  const defaultPackage = (searchParams.get('package') || 'COMMUNITY_BARTER') as
    | 'COMMUNITY_BARTER'
    | 'FEATURED_PARTNER';

  // Form States
  const [formData, setFormData] = useState({
    name: '',
    category: 'OUTDOOR_GEAR',
    websiteUrl: '',
    logoUrl: '',
    description: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    tierPackage: defaultPackage,
    campaignTitle: '',
    campaignDescription: '',
    campaignTerms: '',
    costInLtp: 100,
    minXpLevel: 1,
    durationDays: 45,
    voucherCodes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    message: string;
    partnerId?: number;
    campaignId?: number;
  } | null>(null);

  // Live count of unique voucher codes
  const voucherCount = (formData.voucherCodes || '')
    .split(/[\r\n,]+/)
    .map((c) => c.trim())
    .filter((c) => c.length > 0)
    .filter((v, i, a) => a.indexOf(v) === i).length;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'costInLtp' || name === 'minXpLevel' || name === 'durationDays'
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (voucherCount === 0) {
      setErrorMsg(
        isId
          ? 'Mohon masukkan setidaknya 1 kode voucher unik di bagian Langkah 4.'
          : 'Please provide at least 1 unique voucher code in Step 4.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitBrandPartnershipApplication({
        name: formData.name,
        category: formData.category,
        websiteUrl: formData.websiteUrl,
        logoUrl: formData.logoUrl || '/images/placeholder-brand.png',
        description: formData.description,
        contactPerson: formData.contactPerson,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        tierPackage: formData.tierPackage,
        campaignTitle: formData.campaignTitle,
        campaignDescription: formData.campaignDescription,
        campaignTerms: formData.campaignTerms,
        costInLtp: formData.costInLtp,
        minXpLevel: formData.minXpLevel,
        durationDays: formData.durationDays,
        voucherCodes: formData.voucherCodes,
      });

      if (!res.success) {
        setErrorMsg(res.message);
      } else {
        setSuccessData({
          message: res.message,
          partnerId: res.partnerId,
          campaignId: res.campaignId,
        });
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Terjadi kesalahan sistem saat mengirim formulir.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* KOLOM KIRI (lg:col-span-4 lg:sticky lg:top-24 space-y-6) */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100 text-violet-800 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-violet-600" />
              <span>{isId ? 'Formulir Kemitraan Brand B2B' : 'B2B Brand Partnership Form'}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 leading-tight">
              {isId
                ? 'Daftarkan Brand & Kampanye Perks Anda'
                : 'Register Your Brand & Perks Campaign'}
            </h1>

            <p className="text-sm text-slate-600 leading-relaxed">
              {isId
                ? 'Lengkapi rincian profil brand, pilih skema promosi, dan setor daftar voucher untuk diverifikasi otomatis oleh tim kemitraan Locallytrip.'
                : 'Complete your brand profile details, choose a promotion tier, and submit vouchers for prompt onboarding by Locallytrip.'}
            </p>
          </div>

          {/* Ringkasan Benefit B2B */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3.5 text-xs text-slate-600">
            <h4 className="font-bold text-slate-900 text-sm">
              {isId ? 'Kenapa Bermitra?' : 'Why Partner with Us?'}
            </h4>
            <div className="flex items-center gap-2.5">
              <span className="text-emerald-500 font-bold text-sm">✓</span>
              <span>
                {isId
                  ? 'Jangkau ribuan pelancong aktif terverifikasi'
                  : 'Reach thousands of verified active travelers'}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-emerald-500 font-bold text-sm">✓</span>
              <span>
                {isId
                  ? 'Tukar voucher dengan loyalitas poin LTP & XP'
                  : 'Redeem vouchers with LTP coins & XP reputation'}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-emerald-500 font-bold text-sm">✓</span>
              <span>
                {isId
                  ? 'Dapatkan laporan analitik performa klaim transparan'
                  : 'Receive transparent real-time claim analytics'}
              </span>
            </div>
          </div>

          {/* Paket Terpilih Quick View */}
          <div className="p-4 rounded-2xl bg-slate-100/80 border border-slate-200 text-xs space-y-1">
            <div className="text-slate-500 font-medium">
              {isId ? 'Paket Aktif:' : 'Selected Tier:'}
            </div>
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <span>
                {formData.tierPackage === 'FEATURED_PARTNER'
                  ? (isId ? 'Founding Partner (GRATIS - Hemat Rp 1.500.000)' : 'Founding Partner (FREE - Save IDR 1,500,000)')
                  : 'Community Barter (Rp 0)'}
              </span>
              {formData.tierPackage === 'FEATURED_PARTNER' && (
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              )}
            </div>
          </div>

          {/* Bantuan Kemitraan */}
          <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 text-xs text-purple-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
              <span>{isId ? 'Butuh Bantuan Khusus?' : 'Need Assistance?'}</span>
            </div>
            <p className="text-purple-700/85 leading-relaxed">
              {isId
                ? 'Hubungi tim kemitraan kami via email di partnership@locallytrip.com untuk pertanyaan atau paket co-branding kustom.'
                : 'Reach our team at partnership@locallytrip.com for tailored activations.'}
            </p>
          </div>
        </div>

        {/* KOLOM KANAN (lg:col-span-8): Formulir Kartu Putih Lengkap */}
        <div className="lg:col-span-8 space-y-6">
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">{isId ? 'Perhatian:' : 'Notice:'}</strong> {errorMsg}
              </div>
            </div>
          )}

          {/* Success Dialog */}
          {successData ? (
            <div className="bg-white border-2 border-emerald-500 rounded-3xl p-8 sm:p-12 shadow-md space-y-6 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-2xl font-bold">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold font-serif text-slate-900">
                  {isId ? 'Pendaftaran Kemitraan Berhasil!' : 'Partnership Application Submitted!'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                  {successData.message}
                </p>
              </div>

              <div className="pt-4 flex flex-wrap justify-center gap-3">
                <Link
                  href={`/${locale}/community/perks`}
                  className="px-6 py-3 rounded-xl bg-purple-900 hover:bg-purple-950 text-white font-bold text-xs sm:text-sm transition"
                >
                  {isId ? 'Lihat Katalog Hadiah Mitra' : 'View Perks Marketplace'}
                </Link>
                <Link
                  href={`/${locale}`}
                  className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm transition"
                >
                  {isId ? 'Kembali ke Beranda' : 'Back to Home'}
                </Link>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xs space-y-10"
            >
              {/* LANGKAH 1: Profil Brand */}
              <div className="space-y-5">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm shrink-0">
                    1
                  </span>
                  <div>
                    <h3 className="font-serif font-bold text-lg text-slate-900">
                      {isId ? 'Profil Perusahaan / Brand' : 'Brand & Business Profile'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {isId
                        ? 'Informasi dasar identitas brand Anda'
                        : 'Basic information about your brand'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {isId ? 'Nama Brand / Perusahaan' : 'Brand Name'} *
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="misal: Eiger Adventure atau Bobocabin"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-600 focus:border-transparent transition"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {isId ? 'Kategori Industri' : 'Industry Category'} *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-600 transition"
                    >
                      <option value="OUTDOOR_GEAR">
                        {isId ? 'Perlengkapan Outdoor & Apparel' : 'Outdoor Gear & Apparel'}
                      </option>
                      <option value="HOSPITALITY">
                        {isId ? 'Hotel, Villa & Glamping (Hospitality)' : 'Hospitality & Stays'}
                      </option>
                      <option value="FNB">
                        {isId ? 'Makanan, Minuman & Kafe (FnB)' : 'Food & Beverage'}
                      </option>
                      <option value="TRANSPORT">
                        {isId ? 'Transportasi & Rental Kendaraan' : 'Transportation & Car Rental'}
                      </option>
                      <option value="INSURANCE">
                        {isId ? 'Asuransi Perjalanan' : 'Travel Insurance'}
                      </option>
                      <option value="OTHER">{isId ? 'Lainnya' : 'Other'}</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {isId ? 'Website Resmi' : 'Official Website'}
                    </label>
                    <div className="relative">
                      <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="url"
                        name="websiteUrl"
                        value={formData.websiteUrl}
                        onChange={handleChange}
                        placeholder="https://brand-anda.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-600 transition"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {isId ? 'URL Logo Brand (PNG / SVG Transparan)' : 'Brand Logo URL'}
                    </label>
                    <input
                      type="url"
                      name="logoUrl"
                      value={formData.logoUrl}
                      onChange={handleChange}
                      placeholder="https://brand-anda.com/logo.png"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-600 transition"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {isId ? 'Deskripsi Singkat Brand' : 'Brand Short Bio'}
                    </label>
                    <textarea
                      name="description"
                      rows={2}
                      value={formData.description}
                      onChange={handleChange}
                      placeholder={
                        isId
                          ? 'Ceritakan secara singkat keunggulan produk atau layanan brand Anda...'
                          : 'Briefly describe your brand offerings and distinctive qualities...'
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-600 transition"
                    />
                  </div>
                </div>
              </div>

              {/* LANGKAH 2: Data Kontak PIC */}
              <div className="space-y-5">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm shrink-0">
                    2
                  </span>
                  <div>
                    <h3 className="font-serif font-bold text-lg text-slate-900">
                      {isId ? 'Kontak Person in Charge (PIC)' : 'Contact Person (PIC)'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {isId
                        ? 'Data penanggung jawab kemitraan untuk korespondensi resmi'
                        : 'Direct partnership representative'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {isId ? 'Nama Lengkap PIC' : 'Full Name'} *
                    </label>
                    <input
                      type="text"
                      name="contactPerson"
                      required
                      value={formData.contactPerson}
                      onChange={handleChange}
                      placeholder="misal: Siti Sarah"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-600 transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {isId ? 'Email Kantor Resmi' : 'Business Email'} *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        name="contactEmail"
                        required
                        value={formData.contactEmail}
                        onChange={handleChange}
                        placeholder="partnership@brand.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-600 transition"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {isId ? 'Nomor WhatsApp / HP' : 'WhatsApp Number'} *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        name="contactPhone"
                        required
                        value={formData.contactPhone}
                        onChange={handleChange}
                        placeholder="+62 812..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-600 transition"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* LANGKAH 3: Penawaran Kampanye & Paket */}
              <div className="space-y-5">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm shrink-0">
                    3
                  </span>
                  <div>
                    <h3 className="font-serif font-bold text-lg text-slate-900">
                      {isId ? 'Rincian Kampanye & Paket Kemitraan' : 'Campaign Offer & Package'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {isId
                        ? 'Pilih skema penempatan dan tentukan kriteria penukaran'
                        : 'Configure placement scheme and redemption requirements'}
                    </p>
                  </div>
                </div>

                {/* Radio Paket Barter vs Featured */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3 ${
                      formData.tierPackage === 'COMMUNITY_BARTER'
                        ? 'border-purple-600 bg-purple-50/50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="tierPackage"
                      value="COMMUNITY_BARTER"
                      checked={formData.tierPackage === 'COMMUNITY_BARTER'}
                      onChange={handleChange}
                      className="mt-1 text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <div className="font-bold text-sm text-slate-900">
                        Community Barter (Rp 0)
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 leading-snug">
                        {isId
                          ? 'Barter eksposur komunitas tanpa biaya tunai. Tampil di katalog penukaran LTP.'
                          : 'Zero-fee barter placement. Listed in LTP Perks Catalog.'}
                      </div>
                    </div>
                  </label>

                  <label
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3 ${
                      formData.tierPackage === 'FEATURED_PARTNER'
                        ? 'border-amber-500 bg-amber-50/50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="tierPackage"
                      value="FEATURED_PARTNER"
                      checked={formData.tierPackage === 'FEATURED_PARTNER'}
                      onChange={handleChange}
                      className="mt-1 text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                        <span>Founding Partner (GRATIS - Edisi 50 Brand)</span>
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span className="text-[10px] bg-rose-500 text-white font-black px-2 py-0.5 rounded-full uppercase tracking-wider ml-1">
                          {isId ? 'Terbatas' : 'Limited'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 leading-snug">
                        {isId
                          ? 'Bebas biaya 6 bulan (Hemat Rp 1,5 Jt/bln). Posisi teratas (Sticky Pin), lencana Featured Partner, dan banner promosi forum & meetup.'
                          : 'Zero fee for 6 months (Save IDR 1.5M/mo). Sticky top rank, Featured badge, plus banner ads in forums & meetups.'}
                      </div>
                    </div>
                  </label>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {isId ? 'Judul Penawaran Promo / Voucher' : 'Campaign Title'} *
                    </label>
                    <input
                      type="text"
                      name="campaignTitle"
                      required
                      value={formData.campaignTitle}
                      onChange={handleChange}
                      placeholder={
                        isId
                          ? 'misal: Diskon 30% Perlengkapan Gunung EIGER atau Voucher Staycation Rp 150.000'
                          : 'e.g. 30% Off Mountaineering Gear or Staycation Voucher'
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-600 transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {isId ? 'Deskripsi Penawaran' : 'Offer Description'} *
                    </label>
                    <textarea
                      name="campaignDescription"
                      required
                      rows={2}
                      value={formData.campaignDescription}
                      onChange={handleChange}
                      placeholder={
                        isId
                          ? 'Jelaskan manfaat penawaran yang didapatkan oleh penjelajah yang menukarkan voucher ini...'
                          : 'Describe the perks and value travelers receive when claiming this voucher...'
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-600 transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        {isId ? 'Biaya Penukaran (LTP)' : 'Cost in LTP Coins'}
                      </label>
                      <input
                        type="number"
                        name="costInLtp"
                        min={0}
                        step={25}
                        value={formData.costInLtp}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-600 transition"
                      />
                      <span className="text-[11px] text-slate-400 block">
                        {isId ? 'Isi 0 jika voucher gratis' : 'Set 0 for free claim'}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        {isId ? 'Minimal Level XP' : 'Min. XP Level'}
                      </label>
                      <select
                        name="minXpLevel"
                        value={formData.minXpLevel}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-600 transition"
                      >
                        <option value={1}>Level 1 (Semua Penjelajah)</option>
                        <option value={2}>Level 2 (Scout)</option>
                        <option value={3}>Level 3 (Pathfinder)</option>
                        <option value={4}>Level 4 (Trailblazer)</option>
                        <option value={5}>Level 5 (Elite)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        {isId ? 'Masa Berlaku (Hari)' : 'Duration (Days)'}
                      </label>
                      <input
                        type="number"
                        name="durationDays"
                        min={7}
                        max={365}
                        value={formData.durationDays}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-600 transition"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {isId ? 'Syarat & Ketentuan Penukaran (T&C)' : 'Terms & Conditions'}
                    </label>
                    <textarea
                      name="campaignTerms"
                      rows={2}
                      value={formData.campaignTerms}
                      onChange={handleChange}
                      placeholder={
                        isId
                          ? '1. Berlaku untuk transaksi via web/aplikasi\n2. Tidak dapat digabungkan dengan promo lain'
                          : '1. Valid on online store orders\n2. One coupon per user'
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-600 transition font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* LANGKAH 4: Setor Kode Voucher Unik */}
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm shrink-0">
                      4
                    </span>
                    <div>
                      <h3 className="font-serif font-bold text-lg text-slate-900">
                        {isId ? 'Setor Pool Kode Voucher Unik' : 'Deposit Unique Voucher Codes'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {isId
                          ? 'Masukkan kode voucher diskon yang akan dibagikan kepada pengguna'
                          : 'Paste unique coupon codes distributed sequentially to claimers'}
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                    {voucherCount} {isId ? 'kode terdeteksi' : 'codes parsed'}
                  </span>
                </div>

                <div className="space-y-2">
                  <textarea
                    name="voucherCodes"
                    required
                    rows={5}
                    value={formData.voucherCodes}
                    onChange={handleChange}
                    placeholder={
                      'EIGER-PROMO-101\nEIGER-PROMO-102\nEIGER-PROMO-103\n... atau pisahkan dengan koma'
                    }
                    className="w-full p-4 rounded-xl border border-slate-200 text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-purple-600 transition leading-relaxed"
                  />
                  <p className="text-[11px] text-slate-400">
                    {isId
                      ? 'Catatan: Setiap kali pengguna berhasil mengklaim, 1 kode voucher unik akan diambil secara otomatis dan diberikan secara rahasia kepada pengguna tersebut.'
                      : 'Note: Each successful claim automatically burns and delivers one unique code from this pool.'}
                  </p>
                </div>
              </div>

              {/* Tombol Kirim Permohonan */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-900 to-indigo-900 hover:from-purple-950 hover:to-indigo-950 text-white font-extrabold text-sm sm:text-base shadow-lg transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{isId ? 'Memproses Pendaftaran...' : 'Submitting Application...'}</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {isId
                          ? 'Kirim Permohonan Kemitraan Brand ➔'
                          : 'Submit Brand Application ➔'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
