'use client';

import React, { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  FileText,
  UserCheck,
  CheckCircle2,
  XCircle,
  Eye,
  AlertCircle,
  Clock,
  Loader2,
  Search,
  Filter,
  Calendar,
  MapPin,
  Building2,
  Download,
  ExternalLink,
  Check,
  X,
  FileCheck,
  AlertTriangle,
  User,
  Image as ImageIcon,
  ChevronRight,
} from 'lucide-react';
import {
  AdminKycItem,
  AdminKycStats,
  AdminKycDocumentItem,
  getAdminKycSubmissions,
  approveKyc,
  rejectKyc,
} from '@/actions/admin/kyc';
import { AdminPagination, PaginationState } from '@/components/admin/ui/AdminPagination';
import { resolveAvatarUrl } from '@/lib/avatar';
import { getPublicImageUrl } from '@/lib/images';

interface KycManagementClientProps {
  initialSubmissions: AdminKycItem[];
  initialStats: AdminKycStats;
  initialPagination: PaginationState;
}

const STATUS_TABS = [
  { id: 'all', label: 'Semua Status' },
  { id: 'pending', label: 'Menunggu Review', badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' },
  { id: 'approved', label: 'Terverifikasi', badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' },
  { id: 'rejected', label: 'Ditolak', badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' },
];

const ID_TYPES = [
  { id: 'all', label: 'Semua Tipe ID' },
  { id: 'ktp', label: 'e-KTP' },
  { id: 'passport', label: 'Paspor' },
  { id: 'sim', label: 'SIM A/C' },
  { id: 'kitas', label: 'KITAS / KITAP' },
];

const QUICK_REJECTION_REASONS = [
  'Foto dokumen KTP / Paspor buram atau tidak terbaca dengan jelas.',
  'Masa berlaku dokumen identitas telah habis (kedaluwarsa).',
  'Nama pada kartu identitas tidak sesuai dengan nama akun pemilik.',
  'Foto selfie tidak cocok atau tidak memperlihatkan wajah secara utuh.',
  'Dokumen legalitas bisnis atau NPWP tidak dapat divalidasi.',
];

export function KycManagementClient({
  initialSubmissions,
  initialStats,
  initialPagination,
}: KycManagementClientProps) {
  const [submissions, setSubmissions] = useState<AdminKycItem[]>(initialSubmissions);
  const [stats, setStats] = useState<AdminKycStats>(initialStats);
  const [pagination, setPagination] = useState<PaginationState>(initialPagination);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedIdType, setSelectedIdType] = useState('all');

  // Modals & previews
  const [previewDoc, setPreviewDoc] = useState<AdminKycDocumentItem | null>(null);
  const [selectedKycDetail, setSelectedKycDetail] = useState<AdminKycItem | null>(null);
  const [approveConfirmKyc, setApproveConfirmKyc] = useState<AdminKycItem | null>(null);
  const [approveNotes, setApproveNotes] = useState('');
  const [rejectModalKyc, setRejectModalKyc] = useState<AdminKycItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const [isPending, startTransition] = useTransition();
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const fetchKycData = (
    newPage: number = pagination.currentPage,
    newPageSize: number = pagination.pageSize,
    searchVal: string = searchQuery,
    statusVal: string = selectedStatus,
    idTypeVal: string = selectedIdType
  ) => {
    startTransition(async () => {
      const res = await getAdminKycSubmissions({
        page: newPage,
        pageSize: newPageSize,
        search: searchVal,
        status: statusVal,
        idType: idTypeVal,
      });

      if (res.success) {
        setSubmissions(res.submissions);
        setStats(res.stats);
        setPagination(res.pagination);
      }
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchKycData(1, pagination.pageSize, searchQuery, selectedStatus, selectedIdType);
  };

  const handleStatusChange = (newStatus: string) => {
    setSelectedStatus(newStatus);
    fetchKycData(1, pagination.pageSize, searchQuery, newStatus, selectedIdType);
  };

  const handleIdTypeChange = (newIdType: string) => {
    setSelectedIdType(newIdType);
    fetchKycData(1, pagination.pageSize, searchQuery, selectedStatus, newIdType);
  };

  const handlePageChange = (newPage: number) => {
    fetchKycData(newPage, pagination.pageSize, searchQuery, selectedStatus, selectedIdType);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    fetchKycData(1, newPageSize, searchQuery, selectedStatus, selectedIdType);
  };

  // Approve action
  const handleConfirmApprove = () => {
    if (!approveConfirmKyc) return;
    const kycId = approveConfirmKyc.id;
    setActionLoadingId(kycId);

    startTransition(async () => {
      const res = await approveKyc(kycId, approveNotes);
      setActionLoadingId(null);

      if (res.success) {
        setSubmissions((prev) =>
          prev.map((item) =>
            item.id === kycId
              ? {
                  ...item,
                  status: 'approved',
                  approvedAt: new Date(),
                  user: { ...item.user, isVerified: true, isTrusted: true, role: 'host' },
                }
              : item
          )
        );
        setStats((prev) => ({
          ...prev,
          pendingCount: Math.max(0, prev.pendingCount - 1),
          approvedCount: prev.approvedCount + 1,
        }));
        setApproveConfirmKyc(null);
        setApproveNotes('');
      } else {
        alert(res.error || 'Gagal menyetujui verifikasi KYC.');
      }
    });
  };

  // Reject action
  const handleConfirmReject = () => {
    if (!rejectModalKyc) return;
    const kycId = rejectModalKyc.id;
    setActionLoadingId(kycId);

    startTransition(async () => {
      const res = await rejectKyc(kycId, rejectReason);
      setActionLoadingId(null);

      if (res.success) {
        setSubmissions((prev) =>
          prev.map((item) =>
            item.id === kycId
              ? {
                  ...item,
                  status: 'rejected',
                  rejectionReason: rejectReason,
                  user: { ...item.user, isVerified: false },
                }
              : item
          )
        );
        setStats((prev) => ({
          ...prev,
          pendingCount: Math.max(0, prev.pendingCount - 1),
          rejectedCount: prev.rejectedCount + 1,
        }));
        setRejectModalKyc(null);
        setRejectReason('');
      } else {
        alert(res.error || 'Gagal menolak verifikasi KYC.');
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6"
    >
      {/* 1. Header & Overview Badges */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
            Host KYC Verification
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Panel kurasi dokumen identitas host, audit berkas fisik, dan pemberian lencana verified.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => fetchKycData()}
            disabled={isPending}
            className="px-4 py-2 rounded-2xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-200 text-xs font-bold transition shadow-2xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Clock className={`w-3.5 h-3.5 ${isPending ? 'animate-spin text-purple-600' : 'text-gray-400'}`} />
            <span>Segarkan Data</span>
          </button>
        </div>
      </div>

      {/* 2. Telemetry KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Submissions */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Total Berkas Masuk</span>
            <div className="w-9 h-9 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">
            {stats.totalSubmissions.toLocaleString()}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Seluruh pengajuan KYC host terdata</p>
        </div>

        {/* Pending Review */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#1A1D21] border border-amber-200/80 dark:border-amber-900/40 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400">Menunggu Kurasi</span>
            <div className="w-9 h-9 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {stats.pendingCount.toLocaleString()}
          </div>
          <p className="text-[11px] text-amber-600/70 dark:text-amber-400/70 mt-1">Antrean berkas perlu diverifikasi</p>
        </div>

        {/* Approved Hosts */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#1A1D21] border border-emerald-200/80 dark:border-emerald-900/40 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Host Terverifikasi</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {stats.approvedCount.toLocaleString()}
          </div>
          <p className="text-[11px] text-emerald-600/70 dark:text-emerald-400/70 mt-1">Lencana terverifikasi aktif</p>
        </div>

        {/* Rejected Submissions */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#1A1D21] border border-rose-200/80 dark:border-rose-900/40 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-rose-700 dark:text-rose-400">Pengajuan Ditolak</span>
            <div className="w-9 h-9 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ShieldX className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
            {stats.rejectedCount.toLocaleString()}
          </div>
          <p className="text-[11px] text-rose-600/70 dark:text-rose-400/70 mt-1">Dokumen tidak valid atau buram</p>
        </div>
      </div>

      {/* 3. Filter & Search Controls */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama host, ID, email, kota, bisnis..."
            className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                fetchKycData(1, pagination.pageSize, '', selectedStatus, selectedIdType);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>

        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {STATUS_TABS.map((tab) => {
            const isActive = selectedStatus === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleStatusChange(tab.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ID Type Dropdown Selector */}
        <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
          <select
            value={selectedIdType}
            onChange={(e) => handleIdTypeChange(e.target.value)}
            className="px-3.5 py-2 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-700 dark:text-gray-200 focus:outline-none cursor-pointer"
          >
            {ID_TYPES.map((t) => (
              <option key={t.id} value={t.id} className="bg-white dark:bg-[#1A1D21]">
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. Main KYC Data Table */}
      <div className="rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 dark:bg-white/5 text-gray-400 uppercase tracking-wider text-[10px] font-bold border-b border-gray-100 dark:border-white/5">
              <tr>
                <th className="px-5 py-4">Host / Profil</th>
                <th className="px-4 py-4">Data Identitas</th>
                <th className="px-4 py-4">Dokumen Fisik</th>
                <th className="px-4 py-4">Status & Tanggal</th>
                <th className="px-5 py-4 text-right">Tindakan Kurasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-gray-600 dark:text-gray-300">
              {isPending && submissions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-gray-400 text-xs">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-600 mb-2" />
                    <span>Memuat berkas verifikasi KYC...</span>
                  </td>
                </tr>
              ) : submissions.length > 0 ? (
                submissions.map((kyc) => {
                  const isLoading = actionLoadingId === kyc.id && isPending;

                  return (
                    <tr
                      key={kyc.id}
                      className="hover:bg-gray-50/70 dark:hover:bg-white/5 transition group"
                    >
                      {/* Host Profile */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl overflow-hidden bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center shrink-0 border border-purple-200/50 dark:border-purple-800/50">
                            <img
                              src={resolveAvatarUrl(kyc.user)}
                              alt={kyc.fullName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.currentTarget;
                                if (target.src !== '/images/default-avatar.png') {
                                  target.src = '/images/default-avatar.png';
                                }
                              }}
                            />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-gray-900 dark:text-white block truncate max-w-[180px]">
                              {kyc.fullName}
                            </span>
                            <span className="text-[11px] text-gray-400 block truncate max-w-[180px]">
                              {kyc.user.email}
                            </span>
                            {kyc.user.phone && (
                              <span className="text-[10px] text-gray-400 block truncate">
                                {kyc.user.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Identity Details */}
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              {kyc.idType}
                            </span>
                            <span className="font-mono text-xs font-bold text-gray-900 dark:text-gray-100">
                              {kyc.idNumber}
                            </span>
                          </div>

                          <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                            <span className="truncate max-w-[160px]">{kyc.city}, {kyc.country}</span>
                          </div>

                          {kyc.businessName && (
                            <div className="text-[10px] text-purple-600 dark:text-purple-400 flex items-center gap-1 font-semibold">
                              <Building2 className="w-3 h-3 shrink-0" />
                              <span className="truncate max-w-[160px]">{kyc.businessName}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Uploaded Documents */}
                      <td className="px-4 py-4">
                        {kyc.documents.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-2">
                            {kyc.documents.map((doc) => (
                              <button
                                key={doc.id}
                                type="button"
                                onClick={() => setPreviewDoc(doc)}
                                className="group/doc px-2.5 py-1.5 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-gray-200/80 dark:border-white/10 hover:border-purple-300 dark:hover:border-purple-800 transition flex items-center gap-1.5 cursor-pointer text-left shadow-2xs"
                                title="Klik untuk pratinjau dokumen"
                              >
                                <ImageIcon className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                                <div className="text-[10px] leading-tight">
                                  <span className="font-bold text-gray-700 dark:text-gray-200 block uppercase">
                                    {doc.documentType}
                                  </span>
                                  <span className="text-[9px] text-gray-400 block truncate max-w-[80px]">
                                    {doc.fileName || 'Pratinjau'}
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-400 italic flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-amber-500" />
                            Tidak ada file berkas
                          </span>
                        )}
                      </td>

                      {/* Status & Date */}
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 ${
                              kyc.status === 'approved'
                                ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300'
                                : kyc.status === 'rejected'
                                ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300'
                                : 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                            }`}
                          >
                            {kyc.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                            {kyc.status === 'rejected' && <XCircle className="w-3 h-3" />}
                            {kyc.status === 'pending' && <Clock className="w-3 h-3" />}
                            <span>{kyc.status}</span>
                          </span>

                          <span className="text-[10px] text-gray-400 block">
                            {kyc.submittedAt
                              ? new Date(kyc.submittedAt).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : 'Baru saja'}
                          </span>

                          {kyc.status === 'rejected' && kyc.rejectionReason && (
                            <p className="text-[10px] text-rose-600 dark:text-rose-400 line-clamp-1 italic max-w-[180px]">
                              Alasan: {kyc.rejectionReason}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedKycDetail(kyc)}
                            className="p-1.5 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition"
                            title="Detail Lengkap Host"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {kyc.status !== 'approved' && (
                            <button
                              type="button"
                              onClick={() => {
                                setApproveConfirmKyc(kyc);
                                setApproveNotes('');
                              }}
                              disabled={isLoading}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition inline-flex items-center gap-1 shadow-2xs cursor-pointer disabled:opacity-50"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Setujui</span>
                            </button>
                          )}

                          {kyc.status !== 'rejected' && (
                            <button
                              type="button"
                              onClick={() => {
                                setRejectModalKyc(kyc);
                                setRejectReason('');
                              }}
                              disabled={isLoading}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 font-bold text-xs transition inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Tolak</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-gray-400 text-xs">
                    <ShieldCheck className="w-8 h-8 opacity-30 mx-auto mb-2 text-gray-400" />
                    <span className="font-bold text-gray-700 dark:text-gray-200 block">
                      Tidak ada pengajuan KYC yang cocok
                    </span>
                    <span className="text-[11px] text-gray-400">
                      Ubah kata kunci pencarian atau sesuaikan filter status di atas.
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Standardized Server-Side Pagination */}
      <AdminPagination
        pagination={pagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        isPending={isPending}
      />

      {/* MODAL 1: Document Preview Lightbox */}
      <AnimatePresence>
        {previewDoc && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-black uppercase">
                    {previewDoc.documentType}
                  </span>
                  <span className="font-bold text-xs text-gray-900 dark:text-white truncate">
                    {previewDoc.fileName || 'Pratinjau Dokumen KYC'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={previewDoc.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 text-gray-600 dark:text-gray-300 transition text-xs flex items-center gap-1 font-bold"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka Penuh</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(null)}
                    className="w-7 h-7 rounded-full bg-gray-100 dark:bg-white/10 text-gray-400 hover:text-gray-600 flex items-center justify-center text-xs"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="w-full h-80 sm:h-96 rounded-2xl bg-gray-100 dark:bg-black/40 flex items-center justify-center overflow-hidden border border-gray-200/80 dark:border-white/5">
                <img
                  src={previewDoc.previewUrl}
                  alt={previewDoc.documentType}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== '/images/placeholder.jpg') {
                      target.src = '/images/placeholder.jpg';
                    }
                  }}
                />
              </div>

              <div className="text-[11px] text-gray-400 text-center">
                Path fisik server: <span className="font-mono text-purple-500">{previewDoc.filePath}</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Approve Confirmation */}
      <AnimatePresence>
        {approveConfirmKyc && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 p-6 shadow-2xl space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>

              <div>
                <h3 className="font-black text-base text-gray-900 dark:text-white">
                  Setujui Verifikasi KYC Host
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Host <strong className="text-gray-900 dark:text-white">{approveConfirmKyc.fullName}</strong> akan segera menerima lencana terverifikasi (verified host) dan diizinkan menerbitkan paket tur wisata.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Catatan Admin (Opsional):
                </label>
                <textarea
                  value={approveNotes}
                  onChange={(e) => setApproveNotes(e.target.value)}
                  placeholder="Contoh: Dokumen e-KTP dan sertifikasi pemandu wisata valid dan terverifikasi."
                  rows={2}
                  className="w-full p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setApproveConfirmKyc(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmApprove}
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Ya, Setujui Sekarang</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: Reject Reason */}
      <AnimatePresence>
        {rejectModalKyc && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 p-6 shadow-2xl space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <ShieldX className="w-6 h-6" />
              </div>

              <div>
                <h3 className="font-black text-base text-gray-900 dark:text-white">
                  Tolak Pengajuan KYC Host
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Pilih atau tuliskan alasan penolakan agar host <strong className="text-gray-900 dark:text-white">{rejectModalKyc.fullName}</strong> dapat merevisi berkas mereka.
                </p>
              </div>

              {/* Quick Reasons */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Opsi Cepat Alasan Penolakan:
                </label>
                <div className="space-y-1">
                  {QUICK_REJECTION_REASONS.map((reason, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRejectReason(reason)}
                      className={`w-full text-left p-2 rounded-xl text-xs transition border ${
                        rejectReason === reason
                          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-semibold'
                          : 'bg-gray-50 dark:bg-white/5 border-transparent hover:border-gray-200 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Teks Alasan Lengkap:
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Tuliskan alasan penolakan secara spesifik..."
                  rows={3}
                  required
                  className="w-full p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalKyc(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  disabled={isPending || !rejectReason.trim()}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                  <span>Kirim Penolakan</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: Full KYC Detail Drawer */}
      <AnimatePresence>
        {selectedKycDetail && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/5">
                <h3 className="font-black text-base text-gray-900 dark:text-white">
                  Profil Lengkap KYC Host
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedKycDetail(null)}
                  className="w-7 h-7 rounded-full bg-gray-100 dark:bg-white/10 text-gray-400 hover:text-gray-600 flex items-center justify-center text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Nama Lengkap:</span>
                    <strong className="text-gray-900 dark:text-white font-bold">{selectedKycDetail.fullName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tipe & No. Identitas:</span>
                    <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                      {selectedKycDetail.idType.toUpperCase()} - {selectedKycDetail.idNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Kewarganegaraan:</span>
                    <span className="font-semibold">{selectedKycDetail.nationality}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Alamat Fisik:</span>
                    <span className="font-semibold text-right max-w-[240px]">
                      {selectedKycDetail.address || '-'}, {selectedKycDetail.city}, {selectedKycDetail.province}
                    </span>
                  </div>
                  {selectedKycDetail.businessName && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Nama Usaha / Tour Agency:</span>
                      <strong className="text-purple-600 dark:text-purple-400">{selectedKycDetail.businessName}</strong>
                    </div>
                  )}
                </div>

                {/* Documents */}
                <div>
                  <span className="font-bold text-gray-700 dark:text-gray-300 block mb-2">
                    Berkas Dokumen Lampiran ({selectedKycDetail.documents.length}):
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedKycDetail.documents.map((doc) => (
                      <div
                        key={doc.id}
                        onClick={() => {
                          setPreviewDoc(doc);
                        }}
                        className="p-2.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 hover:border-purple-400 transition cursor-pointer flex items-center gap-2"
                      >
                        <ImageIcon className="w-4 h-4 text-purple-600 shrink-0" />
                        <div className="min-w-0">
                          <span className="font-bold uppercase text-[10px] block truncate text-gray-900 dark:text-white">
                            {doc.documentType}
                          </span>
                          <span className="text-[9px] text-gray-400 block truncate">
                            {doc.fileName || 'Lihat foto'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
