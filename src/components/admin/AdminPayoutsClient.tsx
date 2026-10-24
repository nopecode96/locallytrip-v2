'use client';

import React, { useState } from 'react';
import {
  AdminPayoutItem,
  AdminPayoutStats,
  approvePayout,
  rejectPayout,
} from '@/actions/admin/payouts';
import { resolveAvatarUrl } from '@/lib/avatar';
import {
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building2,
  User,
  ShieldCheck,
  Search,
  Filter,
  Check,
  X,
  Loader2,
  ArrowUpRight,
  Receipt,
  FileText,
  Phone,
  Mail,
} from 'lucide-react';

interface AdminPayoutsClientProps {
  initialPayouts: AdminPayoutItem[];
  initialStats: AdminPayoutStats;
}

export function AdminPayoutsClient({
  initialPayouts,
  initialStats,
}: AdminPayoutsClientProps) {
  const [payouts, setPayouts] = useState<AdminPayoutItem[]>(initialPayouts);
  const [stats, setStats] = useState<AdminPayoutStats>(initialStats);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [approveTarget, setApproveTarget] = useState<AdminPayoutItem | null>(null);
  const [referenceNote, setReferenceNote] = useState('');
  const [rejectTarget, setRejectTarget] = useState<AdminPayoutItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filtered List
  const filteredPayouts = payouts.filter((p) => {
    const statusMatch =
      activeTab === 'all' ? true : (p.status || '').toLowerCase() === activeTab;
    const query = searchQuery.toLowerCase().trim();
    const searchMatch =
      !query ||
      p.user.name.toLowerCase().includes(query) ||
      (p.user.username && p.user.username.toLowerCase().includes(query)) ||
      p.user.email.toLowerCase().includes(query) ||
      (p.transactionReference && p.transactionReference.toLowerCase().includes(query)) ||
      (p.bankAccount && p.bankAccount.accountNumber.includes(query)) ||
      (p.bankAccount && p.bankAccount.bankName.toLowerCase().includes(query));

    return statusMatch && searchMatch;
  });

  const handleApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approveTarget) return;

    setIsSubmitting(true);
    setActionAlert(null);

    try {
      const res = await approvePayout(approveTarget.id, referenceNote);
      if (res.success) {
        setPayouts((prev) =>
          prev.map((item) =>
            item.id === approveTarget.id
              ? {
                  ...item,
                  status: 'completed',
                  processedAt: new Date().toISOString(),
                  notes: referenceNote.trim()
                    ? item.notes
                      ? `${item.notes} | Admin Approval: ${referenceNote.trim()}`
                      : `Admin Approval: ${referenceNote.trim()}`
                    : item.notes,
                }
              : item
          )
        );

        setStats((prev) => ({
          ...prev,
          pendingAmountIdr: Math.max(0, prev.pendingAmountIdr - approveTarget.amount),
          pendingCount: Math.max(0, prev.pendingCount - 1),
          completedAmountIdr: prev.completedAmountIdr + approveTarget.amount,
          completedCount: prev.completedCount + 1,
        }));

        setActionAlert({ type: 'success', message: res.message });
        setApproveTarget(null);
        setReferenceNote('');
      } else {
        setActionAlert({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setActionAlert({ type: 'error', message: err?.message || 'Gagal memproses persetujuan payout.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectTarget) return;

    if (!rejectionReason.trim()) {
      alert('Alasan penolakan wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setActionAlert(null);

    try {
      const res = await rejectPayout(rejectTarget.id, rejectionReason);
      if (res.success) {
        setPayouts((prev) =>
          prev.map((item) =>
            item.id === rejectTarget.id
              ? {
                  ...item,
                  status: 'rejected',
                  processedAt: new Date().toISOString(),
                  notes: item.notes
                    ? `${item.notes} | Ditolak Admin: ${rejectionReason.trim()}`
                    : `Ditolak Admin: ${rejectionReason.trim()}`,
                }
              : item
          )
        );

        setStats((prev) => ({
          ...prev,
          pendingAmountIdr: Math.max(0, prev.pendingAmountIdr - rejectTarget.amount),
          pendingCount: Math.max(0, prev.pendingCount - 1),
          rejectedCount: prev.rejectedCount + 1,
        }));

        setActionAlert({ type: 'success', message: res.message });
        setRejectTarget(null);
        setRejectionReason('');
      } else {
        setActionAlert({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setActionAlert({ type: 'error', message: err?.message || 'Gagal memproses penolakan payout.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
            <Building2 className="w-3.5 h-3.5" />
            <span>Finance & Settlement Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Persetujuan Penarikan Dana Host (Payout Approval)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Validasi rekening perbankan, periksa legalitas verifikasi KYC pemandu, dan konfirmasi transfer pencairan dana host.
          </p>
        </div>
      </div>

      {/* Alert Status Feedback */}
      {actionAlert && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-center justify-between transition-all ${
            actionAlert.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300'
              : 'bg-rose-950/40 border-rose-700/60 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {actionAlert.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span className="font-medium">{actionAlert.message}</span>
          </div>
          <button
            onClick={() => setActionAlert(null)}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Pending Payouts Card */}
        <div className="p-6 rounded-3xl bg-slate-950 border border-amber-900/40 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between text-amber-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Menunggu Transfer</span>
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            Rp {stats.pendingAmountIdr.toLocaleString('id-ID')}
          </div>
          <p className="text-xs text-amber-300/80 mt-1 font-medium">
            {stats.pendingCount} permohonan butuh tindakan persetujuan
          </p>
        </div>

        {/* Completed Payouts Card */}
        <div className="p-6 rounded-3xl bg-slate-950 border border-emerald-900/40 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between text-emerald-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Selesai Ditransfer</span>
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            Rp {stats.completedAmountIdr.toLocaleString('id-ID')}
          </div>
          <p className="text-xs text-emerald-300/80 mt-1 font-medium">
            {stats.completedCount} transaksi payout berhasil dibayarkan
          </p>
        </div>

        {/* Rejection / Total Ratio Card */}
        <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Total Riwayat Antrean</span>
            <div className="p-2.5 rounded-2xl bg-slate-800 border border-slate-700">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {stats.totalCount} Pengajuan
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {stats.rejectedCount} ditolak / dikembalikan ke saldo dompet
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          {[
            { key: 'all', label: 'Semua Pengajuan', count: stats.totalCount },
            { key: 'pending', label: 'Menunggu Persetujuan', count: stats.pendingCount },
            { key: 'completed', label: 'Selesai', count: stats.completedCount },
            { key: 'rejected', label: 'Ditolak', count: stats.rejectedCount },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-850'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                    isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Input Pencarian */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari host, rekening, bank..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 transition"
          />
        </div>
      </div>

      {/* Tabel Permohonan Payout */}
      <div className="rounded-3xl bg-slate-950 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-4 px-6">ID & Referensi</th>
                <th className="py-4 px-6">Pemandu / Host</th>
                <th className="py-4 px-6">Rekening Tujuan</th>
                <th className="py-4 px-6">Nominal (IDR)</th>
                <th className="py-4 px-6">Tanggal Pengajuan</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Aksi Manajemen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredPayouts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Tidak ada pengajuan payout yang sesuai dengan filter atau kata kunci.
                  </td>
                </tr>
              ) : (
                filteredPayouts.map((payout) => {
                  const statusLower = (payout.status || '').toLowerCase();
                  const isPending = statusLower === 'pending';
                  const isCompleted = statusLower === 'completed';
                  const isRejected = statusLower === 'rejected';

                  return (
                    <tr key={payout.id} className="hover:bg-slate-900/40 transition">
                      {/* ID & Ref */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-white text-sm">#{payout.id}</div>
                        <div className="text-[11px] font-mono text-emerald-400/90 truncate max-w-[140px] mt-0.5">
                          {payout.transactionReference || 'REF-N/A'}
                        </div>
                      </td>

                      {/* Host & KYC */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-xs border border-purple-200/50 dark:border-purple-800/50">
                            <img
                              src={resolveAvatarUrl(payout.user)}
                              alt={payout.user.name}
                              className="w-full h-full rounded-full object-cover"
                              onError={(e) => {
                                const target = e.currentTarget;
                                if (target.src !== '/images/default-avatar.png') {
                                  target.src = '/images/default-avatar.png';
                                }
                              }}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">{payout.user.name}</span>
                              {payout.user.isKycApproved ? (
                                <span
                                  className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                                  title="Pemandu Terverifikasi KYC Resmi"
                                >
                                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                  <span>KYC</span>
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400"
                                  title="Pemandu Belum Menyelesaikan Verifikasi KYC"
                                >
                                  <AlertCircle className="w-3 h-3 text-amber-400" />
                                  <span>Non-KYC</span>
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                              <span>{payout.user.email}</span>
                              {payout.user.phone && (
                                <>
                                  <span>•</span>
                                  <span>{payout.user.phone}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Rekening Tujuan */}
                      <td className="py-4 px-6">
                        {payout.bankAccount ? (
                          <div>
                            <div className="font-bold text-slate-200">
                              {payout.bankAccount.bankName}
                            </div>
                            <div className="text-xs font-mono text-slate-400 mt-0.5">
                              {payout.bankAccount.accountNumber}
                            </div>
                            <div className="text-[11px] text-slate-500 italic mt-0.5">
                              a.n. {payout.bankAccount.accountHolderName}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Rekening tidak tercatat</span>
                        )}
                      </td>

                      {/* Nominal */}
                      <td className="py-4 px-6">
                        <div className="text-sm font-black text-white">
                          Rp {payout.amount.toLocaleString('id-ID')}
                        </div>
                        <div className="text-[10px] uppercase text-slate-500 mt-0.5">
                          Metode: {payout.payoutMethod || 'Bank Transfer'}
                        </div>
                      </td>

                      {/* Tanggal */}
                      <td className="py-4 px-6 text-slate-400 text-xs">
                        <div>{new Date(payout.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {new Date(payout.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Pending</span>
                          </span>
                        )}
                        {isCompleted && (
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Selesai</span>
                            </span>
                            {payout.processedAt && (
                              <div className="text-[10px] text-slate-500 mt-1">
                                {new Date(payout.processedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                              </div>
                            )}
                          </div>
                        )}
                        {isRejected && (
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Ditolak</span>
                            </span>
                            {payout.notes && (
                              <div className="text-[10px] text-rose-300/80 mt-1 max-w-[150px] truncate" title={payout.notes}>
                                {payout.notes}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-4 px-6 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setApproveTarget(payout);
                                setReferenceNote(`TRF-${Date.now()}`);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Setujui</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRejectTarget(payout);
                                setRejectionReason('');
                              }}
                              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Tolak</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 italic">Sudah diproses</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Konfirmasi Persetujuan (Approve Modal) */}
      {approveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Setujui & Tandai Ditransfer
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Pengajuan Payout #{approveTarget.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setApproveTarget(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Rincian Ringkas Penerima */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Nama Pemandu:</span>
                <span className="font-bold text-white">{approveTarget.user.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status KYC:</span>
                <span className={approveTarget.user.isKycApproved ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                  {approveTarget.user.isKycApproved ? '✓ Terverifikasi KYC' : 'Belum KYC'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Rekening Tujuan:</span>
                <span className="font-mono text-slate-200">
                  {approveTarget.bankAccount?.bankName} - {approveTarget.bankAccount?.accountNumber} (a.n. {approveTarget.bankAccount?.accountHolderName})
                </span>
              </div>
              <div className="pt-2 border-t border-slate-850 flex justify-between text-sm">
                <span className="text-slate-300 font-bold">Total Dana Ditransfer:</span>
                <span className="font-black text-emerald-400">
                  Rp {approveTarget.amount.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Form Input Catatan / Referensi */}
            <form onSubmit={handleApproveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Nomor Referensi Bank / Catatan Transfer (Opsional):
                </label>
                <input
                  type="text"
                  value={referenceNote}
                  onChange={(e) => setReferenceNote(e.target.value)}
                  placeholder="Contoh: TRF-BCA-9847291 atau Berhasil via Flip"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Catatan ini akan dikirimkan kepada host dalam notifikasi lonceng akunnya.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setApproveTarget(null)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition flex items-center gap-2 shadow-lg cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>Konfirmasi Setujui Payout</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Penolakan (Reject Modal) */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Tolak Pengajuan Penarikan
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Pengajuan Payout #{rejectTarget.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-900/30 text-xs text-rose-300 leading-relaxed">
              Dana sebesar <strong>Rp {rejectTarget.amount.toLocaleString('id-ID')}</strong> akan dikembalikan secara otomatis ke saldo siap tarik host di dompetnya.
            </div>

            {/* Form Input Alasan Penolakan */}
            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Alasan Penolakan (Wajib Diisi):
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Contoh: Nomor rekening tidak aktif, nama pemilik rekening berbeda dengan identitas KTP host, dll."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectTarget(null)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition flex items-center gap-2 shadow-lg cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menolak...</span>
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4 stroke-[2.5]" />
                      <span>Tolak & Kembalikan Saldo</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
