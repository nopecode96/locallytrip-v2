'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { requestHostPayout } from '@/actions/wallet/payout-actions';
import {
  ArrowLeft,
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Share2,
  Building,
  CreditCard,
  ShieldCheck,
  ShieldAlert,
  Download,
  ExternalLink,
  Loader2,
  X,
  Gift,
  Sparkles,
  Info,
  Calendar,
} from 'lucide-react';

interface BankAccountData {
  id: number;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountHolderName: string;
  branchName: string | null;
  isVerified: boolean;
}

interface PayoutHistoryItem {
  id: number;
  amount: number;
  currency: string;
  status: string;
  payoutMethod: string;
  transactionReference: string;
  notes: string | null;
  createdAt: string;
  processedAt: string | null;
  bankInfo: string;
}

interface HostWalletClientProps {
  locale: string;
  user: {
    id: number;
    name: string;
    referralCode: string | null;
    referralUsageCount: number;
    isKycApproved: boolean;
    kycStatus: string;
  };
  metrics: {
    availableBalanceIdr: number;
    pendingBalanceIdr: number;
    completedPayoutsIdr: number;
    grossEarningsIdr: number;
    minimumPayoutIdr: number;
  };
  bankAccount: BankAccountData | null;
  payoutHistory: PayoutHistoryItem[];
}

export function HostWalletClient({
  locale,
  user,
  metrics,
  bankAccount,
  payoutHistory,
}: HostWalletClientProps) {
  const router = useRouter();
  const isId = locale === 'id';

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(metrics.minimumPayoutIdr);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);

  // Referral Copy State
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const referralUrl = user.referralCode
    ? `https://locallytrip.com/${locale}/register?ref=${user.referralCode}`
    : `https://locallytrip.com/${locale}/register`;

  const handleCopyCode = async () => {
    if (!user.referralCode) return;
    try {
      await navigator.clipboard.writeText(user.referralCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleOpenModal = () => {
    setWithdrawAmount(Math.min(metrics.availableBalanceIdr, Math.max(metrics.minimumPayoutIdr, metrics.availableBalanceIdr)));
    setSubmissionError(null);
    setSubmissionSuccess(null);
    setIsModalOpen(true);
  };

  const handleSubmitPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.isKycApproved) {
      setSubmissionError(
        isId
          ? 'Verifikasi identitas (KYC) diperlukan sebelum penarikan dana dapat diproses.'
          : 'Identity verification (KYC) is required before payout can be processed.'
      );
      return;
    }

    if (!bankAccount) {
      setSubmissionError(
        isId
          ? 'Rekening bank utama belum diatur. Silakan tambahkan rekening bank di Pengaturan Akun.'
          : 'Primary bank account not found. Please add a bank account in Account Settings.'
      );
      return;
    }

    if (withdrawAmount < metrics.minimumPayoutIdr) {
      setSubmissionError(
        isId
          ? `Nominal minimal penarikan adalah Rp ${metrics.minimumPayoutIdr.toLocaleString('id-ID')}`
          : `Minimum withdrawal amount is Rp ${metrics.minimumPayoutIdr.toLocaleString('id-ID')}`
      );
      return;
    }

    if (withdrawAmount > metrics.availableBalanceIdr) {
      setSubmissionError(
        isId
          ? `Nominal melebihi saldo yang tersedia (Rp ${metrics.availableBalanceIdr.toLocaleString('id-ID')})`
          : `Amount exceeds available balance (Rp ${metrics.availableBalanceIdr.toLocaleString('id-ID')})`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmissionError(null);
      const res = await requestHostPayout(withdrawAmount);
      if (res.success) {
        setSubmissionSuccess(res.message);
        setTimeout(() => {
          setIsModalOpen(false);
          router.refresh();
        }, 2500);
      } else {
        setSubmissionError(res.message);
      }
    } catch (err: any) {
      setSubmissionError(err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            {isId ? 'Berhasil' : 'Completed'}
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3 text-blue-600" />
            {isId ? 'Diproses' : 'Processing'}
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            {isId ? 'Menunggu' : 'Pending'}
          </span>
        );
      case 'rejected':
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            {isId ? 'Ditolak' : 'Rejected'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-50 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50/50 py-8 sm:py-12">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigasi & Action Quick Links */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
            <Link href={`/${locale}`} className="hover:text-purple-700 transition">
              {isId ? 'Beranda' : 'Home'}
            </Link>
            <span className="text-slate-300">/</span>
            <Link href={`/${locale}/dashboard`} className="hover:text-purple-700 transition">
              {isId ? 'Dashboard Host' : 'Host Dashboard'}
            </Link>
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-slate-900">
              {isId ? 'Keuangan & Pencairan' : 'Finances & Payouts'}
            </span>
          </nav>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link
              className="text-xs font-semibold text-slate-600 hover:text-purple-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200/80 shadow-2xs transition inline-flex items-center gap-1.5"
              href={`/${locale}/dashboard`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{isId ? 'Kembali ke Dashboard' : 'Back to Dashboard'}</span>
            </Link>
            <Link
              href={`/${locale}/dashboard/settings`}
              className="text-xs font-semibold text-slate-600 hover:text-purple-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200/80 shadow-2xs transition"
            >
              {isId ? '⚙️ Rekening Bank' : '⚙️ Bank Settings'}
            </Link>
            <Link
              href={`/${locale}/dashboard/kyc`}
              className="text-xs font-semibold text-slate-600 hover:text-purple-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200/80 shadow-2xs transition"
            >
              {isId ? '🛡️ Status KYC' : '🛡️ KYC Status'}
            </Link>
          </div>
        </div>

        {/* Header Title & Banner Ringkasan */}
        <div className="w-full bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 mb-8 text-white shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 -mb-16 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-300/30 text-[11px] font-bold uppercase tracking-wider">
                  {isId ? 'Pusat Keuangan Host' : 'Host Finance Center'}
                </span>
                {user.isKycApproved ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Verified KYC
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[11px] font-bold">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                    KYC Belum Terverifikasi
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-serif mt-2">
                {isId ? 'Dompet Saldo & Pencairan Dana Host' : 'Host Wallet & Payout Center'}
              </h1>
              <p className="text-sm text-purple-200/90 max-w-2xl leading-relaxed">
                {isId
                  ? 'Pantau perolehan hasil tur wisata Anda, kelola rekening transfer, dan cairkan saldo pendapatan secara instan dan aman.'
                  : 'Track your local tour earnings, manage payout bank accounts, and withdraw funds securely.'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleOpenModal}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 transition active:scale-95 inline-flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{isId ? 'Ajukan Tarik Dana' : 'Request Payout'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3 Ringkasan Metrik Finansial */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          {/* 1. Saldo Siap Ditarik */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {isId ? 'Saldo Siap Ditarik' : 'Available Balance'}
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-serif">
                Rp {metrics.availableBalanceIdr.toLocaleString('id-ID')}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {isId ? 'Dari tur berstatus selesai (Completed)' : 'From completed experience bookings'}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Min: Rp {metrics.minimumPayoutIdr.toLocaleString('id-ID')}
              </span>
              <button
                type="button"
                onClick={handleOpenModal}
                disabled={metrics.availableBalanceIdr < metrics.minimumPayoutIdr}
                className={`text-xs font-bold transition inline-flex items-center gap-1 ${
                  metrics.availableBalanceIdr >= metrics.minimumPayoutIdr
                    ? 'text-purple-700 hover:text-purple-800 cursor-pointer'
                    : 'text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>{isId ? 'Tarik Sekarang' : 'Withdraw'}</span>
                <span>→</span>
              </button>
            </div>
          </div>

          {/* 2. Saldo Tertahan (Pending Bookings) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {isId ? 'Saldo Tertahan (Pending)' : 'Pending Escrow Balance'}
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-serif">
                Rp {metrics.pendingBalanceIdr.toLocaleString('id-ID')}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {isId ? 'Tur terjadwal belum diselesaikan' : 'Scheduled tours awaiting completion'}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-amber-700 font-medium flex items-center gap-1">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>{isId ? 'Masuk ke saldo siap ditarik setelah tur tuntas' : 'Unlocks upon tour completion'}</span>
            </div>
          </div>

          {/* 3. Total Pencairan Sukses */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {isId ? 'Total Pencairan Sukses' : 'Total Payouts Completed'}
              </span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-serif">
                Rp {metrics.completedPayoutsIdr.toLocaleString('id-ID')}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {isId ? 'Telah ditransfer ke rekening bank Anda' : 'Successfully paid to your bank'}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
              <span>{isId ? 'Total Pendapatan Kotor:' : 'Gross Earnings:'}</span>
              <span className="font-bold text-slate-700">Rp {metrics.grossEarningsIdr.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        {/* Grid 2-Kolom: 8 Kolom Riwayat Penarikan (Kiri) + 4 Kolom Rekening & Referral Card (Kanan) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Kolom Kiri: Riwayat Mutasi Penarikan Dana */}
          <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-2xs">
            <div className="flex items-center justify-between pb-5 border-b border-slate-100 mb-6">
              <div>
                <h3 className="font-serif font-bold text-lg text-slate-900">
                  {isId ? 'Riwayat Penarikan Dana (Payout History)' : 'Payout Mutation History'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isId
                    ? 'Daftar seluruh transaksi pencairan dana ke rekening bank penerima Anda'
                    : 'Log of all payout requests and disbursement records'}
                </p>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                {payoutHistory.length} {isId ? 'Transaksi' : 'Transactions'}
              </span>
            </div>

            {payoutHistory.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200">
                <div className="w-14 h-14 mx-auto rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                  <CreditCard className="w-7 h-7" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">
                  {isId ? 'Belum Ada Riwayat Penarikan Dana' : 'No Payout History Yet'}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                  {isId
                    ? 'Saldo pendapatan dari tur yang telah diselesaikan dapat Anda cairkan kapan saja dengan menekan tombol "Ajukan Tarik Dana".'
                    : 'Earnings from completed tours can be withdrawn anytime by clicking "Request Payout".'}
                </p>
                {metrics.availableBalanceIdr >= metrics.minimumPayoutIdr && (
                  <button
                    type="button"
                    onClick={handleOpenModal}
                    className="mt-4 px-4 py-2 rounded-xl bg-purple-900 hover:bg-purple-800 text-white text-xs font-bold transition shadow-xs"
                  >
                    {isId ? 'Ajukan Penarikan Pertama →' : 'Request First Payout →'}
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="pb-3">{isId ? 'Kode / ID' : 'Reference'}</th>
                      <th className="pb-3">{isId ? 'Tanggal' : 'Date'}</th>
                      <th className="pb-3">{isId ? 'Tujuan Rekening' : 'Bank Account'}</th>
                      <th className="pb-3 text-right">{isId ? 'Nominal' : 'Amount'}</th>
                      <th className="pb-3 text-center">{isId ? 'Status' : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payoutHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 pr-2">
                          <span className="font-mono font-bold text-slate-900 block truncate max-w-[140px]">
                            {item.transactionReference}
                          </span>
                          <span className="text-[10px] text-slate-400 capitalize">
                            {item.payoutMethod.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 pr-2 whitespace-nowrap text-slate-600">
                          <div className="font-medium text-slate-800">
                            {new Date(item.createdAt).toLocaleDateString(isId ? 'id-ID' : 'en-US', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="py-3.5 pr-2 text-slate-700">
                          <span className="font-medium block truncate max-w-[160px]">{item.bankInfo}</span>
                          {item.notes && <span className="text-[10px] text-slate-400 truncate block max-w-[160px]">{item.notes}</span>}
                        </td>
                        <td className="py-3.5 pr-2 text-right">
                          <span className="font-black text-slate-900 text-sm">
                            Rp {item.amount.toLocaleString('id-ID')}
                          </span>
                          <span className="text-[10px] text-slate-400 block">{item.currency}</span>
                        </td>
                        <td className="py-3.5 text-center whitespace-nowrap">
                          {getStatusBadge(item.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Kolom Kanan: 1. Rekening Bank Penerima & 2. Kartu Referral Host */}
          <div className="lg:col-span-4 space-y-6">
            {/* 1. Kartu Rekening Bank Penerima Aktif */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">
                      {isId ? 'Rekening Bank Penerima' : 'Payout Bank Account'}
                    </h4>
                    <span className="text-[10px] text-slate-500">{isId ? 'Rekening Utama (Primary)' : 'Primary Account'}</span>
                  </div>
                </div>
                <Link
                  href={`/${locale}/dashboard/settings`}
                  className="text-xs font-bold text-purple-700 hover:text-purple-800"
                >
                  {isId ? 'Ubah' : 'Edit'}
                </Link>
              </div>

              {bankAccount ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-purple-950 uppercase tracking-wider">
                      {bankAccount.bankName}
                    </span>
                    {bankAccount.isVerified ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Terverifikasi
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-full">
                        Rekening Aktif
                      </span>
                    )}
                  </div>
                  <div className="text-base font-mono font-black text-slate-900 tracking-wider">
                    {bankAccount.accountNumber}
                  </div>
                  <div className="text-xs text-slate-600 font-medium">
                    a.n. <strong className="text-slate-900 uppercase">{bankAccount.accountHolderName}</strong>
                  </div>
                  {bankAccount.branchName && (
                    <div className="text-[11px] text-slate-400">
                      Cabang: {bankAccount.branchName}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/80 text-center space-y-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 mx-auto" />
                  <p className="text-xs text-amber-900 font-medium">
                    {isId
                      ? 'Anda belum menambahkan rekening bank utama untuk menerima penarikan dana.'
                      : 'You have not added a primary bank account for payouts.'}
                  </p>
                  <Link
                    href={`/${locale}/dashboard/settings`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition"
                  >
                    <span>{isId ? 'Tambah Rekening Bank →' : 'Add Bank Account →'}</span>
                  </Link>
                </div>
              )}

              {/* Status KYC Peringatan jika belum verified */}
              {!user.isKycApproved && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold block">
                      {isId ? 'Verifikasi Identitas Diperlukan' : 'Identity Verification Required'}
                    </span>
                    <p className="text-[11px] text-rose-700 leading-relaxed">
                      {isId
                        ? 'Sesuai regulasi keamanan finansial, penarikan dana memerlukan verifikasi KTP/Identitas yang telah disetujui.'
                        : 'Identity verification (KYC) approval is required to disburse payouts.'}
                    </p>
                    <Link
                      href={`/${locale}/dashboard/kyc`}
                      className="inline-flex items-center gap-1 font-bold text-rose-800 underline hover:text-rose-950 text-[11px] mt-1"
                    >
                      <span>{isId ? 'Lakukan Verifikasi Sekarang →' : 'Verify Now →'}</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Kartu Promosi Referral Code Host */}
            <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-950 text-white rounded-2xl p-6 shadow-md relative overflow-hidden space-y-4">
              <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-300/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <Gift className="w-3 h-3 text-amber-300" />
                    <span>Referral Program</span>
                  </span>
                  <span className="text-[11px] font-bold text-purple-200">
                    {user.referralUsageCount} {isId ? 'Teman Bergabung' : 'Friends Joined'}
                  </span>
                </div>

                <h4 className="font-serif font-bold text-base text-white">
                  {isId ? 'Program Referral Pemandu & Traveler' : 'Host & Traveler Referral Program'}
                </h4>
                <p className="text-xs text-purple-200/90 leading-relaxed">
                  {isId
                    ? 'Ajak sesama pemandu wisata atau traveler menggunakan kode referral Anda untuk mengumpulkan Poin Reputasi XP dan Koin LTP!'
                    : 'Invite fellow tour guides and travelers using your referral code to collect XP Reputation Points and LTP Coins!'}
                </p>

                {/* Box Kode Referral */}
                <div className="pt-2">
                  <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm border border-purple-400/30 p-2.5 rounded-xl">
                    <span className="font-mono font-black text-amber-300 text-sm tracking-wider px-2">
                      {user.referralCode || 'NO-CODE'}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="ml-auto px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                      title="Salin Kode"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? (isId ? 'Tersalin' : 'Copied') : (isId ? 'Salin' : 'Copy')}</span>
                    </button>
                  </div>
                </div>

                {/* Tombol Bagikan Tautan */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="w-full py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Share2 className="w-3.5 h-3.5 text-amber-300" />}
                    <span>{copiedLink ? (isId ? 'Tautan Pendaftaran Tersalin!' : 'Invite Link Copied!') : (isId ? 'Bagikan Tautan Pendaftaran' : 'Share Invite Link')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= MODAL PENGAJUAN TARIK DANA ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-slate-900">
                  {isId ? 'Ajukan Penarikan Dana Host' : 'Request Host Payout'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isId ? 'Pencairan saldo hasil pemesanan tur wisata' : 'Disburse your tour experience earnings'}
                </p>
              </div>
            </div>

            {submissionSuccess ? (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-emerald-900 text-base">
                  {isId ? 'Permohonan Berhasil Dikirim!' : 'Payout Request Submitted!'}
                </h4>
                <p className="text-xs text-emerald-800 leading-relaxed">{submissionSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitPayout} className="space-y-5">
                {submissionError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{submissionError}</span>
                  </div>
                )}

                {/* Info Saldo Tersedia */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">{isId ? 'Saldo Siap Ditarik:' : 'Available Balance:'}</span>
                  <span className="font-mono font-black text-emerald-700 text-sm">
                    Rp {metrics.availableBalanceIdr.toLocaleString('id-ID')}
                  </span>
                </div>

                {/* Pengecekan KYC di Dalam Modal */}
                {!user.isKycApproved && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">
                        {isId
                          ? 'Verifikasi identitas (KYC) diperlukan sebelum penarikan dana dapat diproses.'
                          : 'Identity verification (KYC) is required before payout can be processed.'}
                      </p>
                      <Link
                        href={`/${locale}/dashboard/kyc`}
                        className="inline-flex items-center gap-1 font-bold text-purple-700 hover:text-purple-900 mt-1"
                      >
                        <span>{isId ? 'Verifikasi Sekarang →' : 'Verify Now →'}</span>
                      </Link>
                    </div>
                  </div>
                )}

                {/* Input Nominal Penarikan */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <label>{isId ? 'Nominal Penarikan (IDR)' : 'Withdrawal Amount (IDR)'}</label>
                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(metrics.availableBalanceIdr)}
                      className="text-purple-700 hover:text-purple-800 font-bold"
                    >
                      {isId ? 'Tarik Maksimal' : 'Withdraw Max'}
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-sm text-slate-400">
                      Rp
                    </span>
                    <input
                      type="number"
                      min={metrics.minimumPayoutIdr}
                      max={metrics.availableBalanceIdr}
                      step={10000}
                      value={withdrawAmount || ''}
                      onChange={(e) => setWithdrawAmount(Number(e.target.value) || 0)}
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-mono font-bold text-slate-900 text-base"
                      required
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Min: Rp {metrics.minimumPayoutIdr.toLocaleString('id-ID')}</span>
                    <span>Maks: Rp {metrics.availableBalanceIdr.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Rekening Tujuan Transfer */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    {isId ? 'Rekening Bank Tujuan' : 'Destination Bank Account'}
                  </label>
                  {bankAccount ? (
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block">{bankAccount.bankName}</span>
                        <span className="font-mono text-slate-600">{bankAccount.accountNumber}</span>
                        <span className="text-slate-500 block">a.n. {bankAccount.accountHolderName}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-bold">
                        Utama
                      </span>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                      {isId
                        ? 'Belum ada rekening bank utama. Tambahkan di Pengaturan Akun terlebih dahulu.'
                        : 'No primary bank account found.'}
                    </div>
                  )}
                </div>

                {/* Catatan Ketentuan */}
                <div className="text-[11px] text-slate-400 space-y-1 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                  <p>• Estimasi proses pencairan: 1x24 jam kerja (Senin - Jumat).</p>
                  <p>• Tidak ada potongan biaya transfer untuk bank lokal Indonesia.</p>
                </div>

                {/* Tombol Submit */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="w-1/3 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-xs text-slate-700 transition"
                  >
                    {isId ? 'Batal' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !user.isKycApproved || !bankAccount || metrics.availableBalanceIdr < metrics.minimumPayoutIdr}
                    className="w-2/3 py-2.5 rounded-xl bg-purple-900 hover:bg-purple-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{isSubmitting ? (isId ? 'Mengirim Permohonan...' : 'Submitting...') : (isId ? 'Konfirmasi Tarik Dana' : 'Confirm Payout')}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
