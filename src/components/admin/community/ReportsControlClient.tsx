'use client';

import React, { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flag,
  ShieldAlert,
  ShieldCheck,
  Search,
  ExternalLink,
  Loader2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  RefreshCw,
  MessageSquare,
  BookOpen,
  Calendar,
  User,
} from 'lucide-react';
import Link from 'next/link';
import {
  AdminReportItem,
  updateReportStatus,
  takedownReportedContent,
  getAdminContentReports,
} from '@/actions/admin/reports';
import { SafeImage } from '@/components/common/SafeImage';
import { AdminPagination, PaginationState } from '@/components/admin/ui/AdminPagination';

interface ReportsControlClientProps {
  initialReports: AdminReportItem[];
  initialPagination?: PaginationState;
  stats: {
    totalReports: number;
    pendingCount: number;
    reviewedCount: number;
    resolvedCount: number;
    dismissedCount: number;
  };
}

export function ReportsControlClient({
  initialReports,
  initialPagination,
  stats: initialStats,
}: ReportsControlClientProps) {
  const [reports, setReports] = useState<AdminReportItem[]>(initialReports);
  const [pagination, setPagination] = useState<PaginationState>(
    initialPagination || {
      totalItems: initialStats.totalReports || initialReports.length,
      totalPages: Math.ceil((initialStats.totalReports || initialReports.length) / 10) || 1,
      currentPage: 1,
      pageSize: 10,
    }
  );
  const [stats, setStats] = useState(initialStats);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [alertFeedback, setAlertFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const fetchData = (
    newPage: number,
    newPageSize: number = pagination.pageSize,
    searchVal: string = searchQuery,
    statusVal: string = selectedStatus,
    typeVal: string = selectedType
  ) => {
    startTransition(async () => {
      const res = await getAdminContentReports({
        page: newPage,
        pageSize: newPageSize,
        search: searchVal,
        status: statusVal,
        targetType: typeVal,
      });
      if (res.success && res.reports) {
        setReports(res.reports);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    });
  };

  const handlePageChange = (newPage: number) => {
    fetchData(newPage, pagination.pageSize);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    fetchData(1, newPageSize);
  };

  const handleStatusTab = (statusId: string) => {
    setSelectedStatus(statusId);
    fetchData(1, pagination.pageSize, searchQuery, statusId, selectedType);
  };

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId);
    fetchData(1, pagination.pageSize, searchQuery, selectedStatus, typeId);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData(1, pagination.pageSize, searchQuery, selectedStatus, selectedType);
  };

  // Client-side quick filter
  const filteredReports = reports.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      r.reason.toLowerCase().includes(q) ||
      (r.description && r.description.toLowerCase().includes(q)) ||
      r.reporter.name.toLowerCase().includes(q) ||
      r.reporter.email.toLowerCase().includes(q) ||
      (r.targetPreview?.title && r.targetPreview.title.toLowerCase().includes(q));

    const matchesStatus =
      selectedStatus === 'all' || r.status === selectedStatus;

    const matchesType =
      selectedType === 'all' || r.target_type === selectedType;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleUpdateStatus = (
    reportId: number,
    newStatus: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  ) => {
    setActionLoadingId(reportId);
    startTransition(async () => {
      const res = await updateReportStatus(reportId, newStatus);
      if (res.success) {
        setReports((prev) =>
          prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r))
        );
        // Adjust local stats
        setStats((prev) => {
          const currentRep = reports.find((r) => r.id === reportId);
          if (!currentRep || currentRep.status === newStatus) return prev;
          const oldStatus = currentRep.status;
          return {
            ...prev,
            pendingCount:
              oldStatus === 'pending'
                ? Math.max(0, prev.pendingCount - 1)
                : newStatus === 'pending'
                ? prev.pendingCount + 1
                : prev.pendingCount,
            reviewedCount:
              oldStatus === 'reviewed'
                ? Math.max(0, prev.reviewedCount - 1)
                : newStatus === 'reviewed'
                ? prev.reviewedCount + 1
                : prev.reviewedCount,
            resolvedCount:
              oldStatus === 'resolved'
                ? Math.max(0, prev.resolvedCount - 1)
                : newStatus === 'resolved'
                ? prev.resolvedCount + 1
                : prev.resolvedCount,
            dismissedCount:
              oldStatus === 'dismissed'
                ? Math.max(0, prev.dismissedCount - 1)
                : newStatus === 'dismissed'
                ? prev.dismissedCount + 1
                : prev.dismissedCount,
          };
        });
        setAlertFeedback({
          type: 'success',
          message: `Laporan #${reportId} status diubah menjadi "${newStatus}".`,
        });
      } else {
        setAlertFeedback({
          type: 'error',
          message: res.error || 'Gagal memperbarui status laporan.',
        });
      }
      setTimeout(() => setAlertFeedback(null), 4000);
      setActionLoadingId(null);
    });
  };

  const handleTakedown = (report: AdminReportItem) => {
    const confirmMsg = `PERINGATAN: Apakah Anda yakin ingin langsung mentakedown konten ini (${report.target_type} #${report.target_id})? Konten akan disembunyikan/di-draft dan status laporan ini akan otomatis ditandai Resolved.`;
    if (!confirm(confirmMsg)) return;

    setActionLoadingId(report.id);
    startTransition(async () => {
      const res = await takedownReportedContent(report.id);
      if (res.success) {
        setReports((prev) =>
          prev.map((r) =>
            r.target_type === report.target_type && r.target_id === report.target_id
              ? {
                  ...r,
                  status: 'resolved',
                  targetPreview: r.targetPreview
                    ? { ...r.targetPreview, currentStatus: 'hidden' }
                    : null,
                }
              : r
          )
        );
        setAlertFeedback({
          type: 'success',
          message: res.message || 'Konten berhasil di-takedown!',
        });
      } else {
        setAlertFeedback({
          type: 'error',
          message: res.error || 'Gagal melakukan takedown konten.',
        });
      }
      setTimeout(() => setAlertFeedback(null), 4000);
      setActionLoadingId(null);
    });
  };

  const getReasonBadge = (reason: string) => {
    switch (reason) {
      case 'spam':
        return (
          <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold text-[10px] border border-amber-200 dark:border-amber-800">
            Spam / Iklan
          </span>
        );
      case 'hate_speech':
        return (
          <span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-semibold text-[10px] border border-rose-200 dark:border-rose-800">
            Ujaran Kebencian (SARA)
          </span>
        );
      case 'harassment':
        return (
          <span className="px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 font-semibold text-[10px] border border-orange-200 dark:border-orange-800">
            Pelecehan / Doxxing
          </span>
        );
      case 'inappropriate':
        return (
          <span className="px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-semibold text-[10px] border border-purple-200 dark:border-purple-800">
            Asusila / Vulgar
          </span>
        );
      case 'copyright':
        return (
          <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold text-[10px] border border-blue-200 dark:border-blue-800">
            Hak Cipta
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-semibold text-[10px] border border-stone-200 dark:border-stone-700">
            {reason}
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 font-bold text-[11px] border border-amber-200 dark:border-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
            Menunggu Tinjauan
          </span>
        );
      case 'reviewed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 font-bold text-[11px] border border-blue-200 dark:border-blue-800">
            <Eye className="w-3 h-3" />
            Sedang Ditinjau
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-bold text-[11px] border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            Selesai / Ditindak
          </span>
        );
      case 'dismissed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-medium text-[11px] border border-stone-200 dark:border-stone-700">
            <XCircle className="w-3 h-3" />
            Ditolak / Valid
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 text-[11px]">
            {status}
          </span>
        );
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'forum_thread':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-semibold text-[10px] border border-purple-200 dark:border-purple-800">
            <MessageSquare className="w-3 h-3" /> Utas Forum
          </span>
        );
      case 'forum_post':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold text-[10px] border border-indigo-200 dark:border-indigo-800">
            <MessageSquare className="w-3 h-3" /> Komentar Forum
          </span>
        );
      case 'story':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold text-[10px] border border-emerald-200 dark:border-emerald-800">
            <BookOpen className="w-3 h-3" /> Travel Story
          </span>
        );
      case 'meetup':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold text-[10px] border border-amber-200 dark:border-amber-800">
            <Calendar className="w-3 h-3" /> Meetup
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[10px]">
            {type}
          </span>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="w-full max-w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6"
    >
      {/* Header & KPI Telemetry Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
            Content Moderation & Reports
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Antrean moderasi laporan komunitas (Forum, Komentar, Stories, & Meetups) dengan 1-klik takedown.
          </p>
        </div>

        {/* Telemetry Chips */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="px-3 py-1.5 rounded-full bg-stone-100 dark:bg-white/10 text-stone-700 dark:text-stone-300 font-bold border border-stone-200 dark:border-white/10">
            {stats.totalReports} Total Laporan
          </span>
          <span className="px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800">
            {stats.pendingCount} Menunggu
          </span>
          <span className="px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800">
            {stats.reviewedCount} Ditinjau
          </span>
          <span className="px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
            {stats.resolvedCount} Selesai
          </span>
        </div>
      </div>

      {/* Toast Alert Feedback */}
      {alertFeedback && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between ${
            alertFeedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
          }`}
        >
          <span>{alertFeedback.message}</span>
          <button
            onClick={() => setAlertFeedback(null)}
            className="text-stone-400 hover:text-stone-700 font-bold text-sm"
          >
            ✕
          </button>
        </motion.div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 transition-colors">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari alasan, pelapor, target konten..."
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
          />
        </form>

        {/* Filter Badges: Status & Type */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-stone-100 dark:bg-white/5 p-1 rounded-2xl">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'pending', label: 'Menunggu' },
              { id: 'reviewed', label: 'Ditinjau' },
              { id: 'resolved', label: 'Selesai' },
              { id: 'dismissed', label: 'Ditolak' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleStatusTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  selectedStatus === tab.id
                    ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs'
                    : 'text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Target Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => handleTypeSelect(e.target.value)}
            className="px-3 py-2 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
          >
            <option value="all">Semua Tipe Konten</option>
            <option value="forum_thread">Utas Forum</option>
            <option value="forum_post">Komentar Forum</option>
            <option value="story">Travel Story</option>
            <option value="meetup">Travel Meetup</option>
          </select>
        </div>
      </div>

      {/* Reports Data Table */}
      <div className="overflow-hidden rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-sm transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/5 bg-gray-50/60 dark:bg-white/[0.02] text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <th className="py-4 px-6">ID & Status</th>
                <th className="py-4 px-6">Konten yang Dilaporkan</th>
                <th className="py-4 px-6">Pelapor</th>
                <th className="py-4 px-6">Alasan & Detail</th>
                <th className="py-4 px-6">Waktu</th>
                <th className="py-4 px-6 text-right">Aksi Moderasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-xs text-gray-700 dark:text-gray-300">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-400">
                    <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-40 text-emerald-500" />
                    <p className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                      Tidak ada laporan konten
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Semua konten komunitas dalam keadaan aman dan terverifikasi.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => {
                  const isLoading = actionLoadingId === report.id;
                  const isPendingStatus = report.status === 'pending';

                  return (
                    <tr
                      key={report.id}
                      className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      {/* ID & Status */}
                      <td className="py-4 px-6 align-top">
                        <div className="space-y-1.5">
                          <span className="font-mono text-xs font-bold text-gray-400">
                            #{report.id}
                          </span>
                          <div>{getStatusBadge(report.status)}</div>
                        </div>
                      </td>

                      {/* Target Preview */}
                      <td className="py-4 px-6 align-top max-w-xs">
                        <div className="space-y-1.5">
                          <div>{getTypeBadge(report.target_type)}</div>
                          {report.targetPreview ? (
                            <div>
                              <div className="font-bold text-gray-900 dark:text-white line-clamp-2">
                                {report.targetPreview.title}
                              </div>
                              {report.targetPreview.excerpt && (
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                                  {report.targetPreview.excerpt}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-1.5">
                                {report.targetPreview.authorName && (
                                  <span className="text-[10px] text-gray-400">
                                    Oleh: {report.targetPreview.authorName}
                                  </span>
                                )}
                                {report.targetPreview.url && (
                                  <Link
                                    href={report.targetPreview.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                                  >
                                    <span>Buka Tautan</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </Link>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="text-[11px] text-gray-400 italic">
                              Target #{report.target_id} (Sudah dihapus atau tidak ditemukan)
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Reporter Info */}
                      <td className="py-4 px-6 align-top">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 dark:bg-white/10 shrink-0 relative">
                            {report.reporter.avatar_url ? (
                              <SafeImage
                                src={report.reporter.avatar_url}
                                alt={report.reporter.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-4 h-4 m-2 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {report.reporter.name}
                            </div>
                            <div className="text-[10px] text-gray-400">
                              {report.reporter.email}
                            </div>
                            <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-gray-100 dark:bg-white/10 text-gray-500">
                              {report.reporter.role}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Reason & Details */}
                      <td className="py-4 px-6 align-top max-w-sm">
                        <div className="space-y-1.5">
                          <div>{getReasonBadge(report.reason)}</div>
                          {report.description ? (
                            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed bg-stone-50 dark:bg-white/5 p-2 rounded-xl border border-stone-200/60 dark:border-white/5">
                              &ldquo;{report.description}&rdquo;
                            </p>
                          ) : (
                            <span className="text-[11px] text-gray-400 italic">
                              Tidak ada keterangan tambahan
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Timestamp */}
                      <td className="py-4 px-6 align-top text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span>
                            {new Date(report.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Moderation Actions */}
                      <td className="py-4 px-6 align-top text-right whitespace-nowrap">
                        {isLoading ? (
                          <div className="flex items-center justify-end gap-1.5 text-purple-600 font-semibold text-xs">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Memproses...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            {/* Reviewing toggle */}
                            {isPendingStatus && (
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(report.id, 'reviewed')}
                                className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-800 transition"
                                title="Tandai sedang ditinjau"
                              >
                                Tinjau
                              </button>
                            )}

                            {/* Dismiss button */}
                            {report.status !== 'dismissed' && (
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(report.id, 'dismissed')}
                                className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 dark:bg-stone-800 dark:hover:bg-stone-700 dark:text-stone-300 text-xs font-semibold border border-stone-200 dark:border-stone-700 transition"
                                title="Tolak laporan jika konten sah / tidak melanggar"
                              >
                                Tolak
                              </button>
                            )}

                            {/* Resolve button */}
                            {report.status !== 'resolved' && (
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(report.id, 'resolved')}
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800 transition"
                                title="Tandai laporan selesai tanpa takedown otomatis"
                              >
                                Selesai
                              </button>
                            )}

                            {/* Takedown Button */}
                            <button
                              type="button"
                              onClick={() => handleTakedown(report)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm shadow-rose-600/30 transition hover:scale-105 active:scale-95"
                              title="Takedown konten ini dan selesaikan laporan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Takedown</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination Bar */}
        <AdminPagination
          pagination={pagination}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          isPending={isPending}
        />
      </div>
    </motion.div>
  );
}

export default ReportsControlClient;
