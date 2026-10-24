'use client';

import React, { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Download,
  Printer,
  Copy,
  ExternalLink,
  ChevronRight,
  CreditCard,
  Landmark,
  ArrowDownLeft,
  Calendar,
  Sparkles,
} from 'lucide-react';
import {
  AdminPayoutItem,
  AdminPayoutStats,
  approvePayout,
  completePayout,
  rejectPayout,
  getAdminPayouts,
} from '@/actions/admin/payouts';
import { AdminPagination, PaginationState } from '@/components/admin/ui/AdminPagination';

interface HostWithdrawalsClientProps {
  initialPayouts: AdminPayoutItem[];
  initialPagination?: PaginationState;
  initialStats: AdminPayoutStats;
}

type FilterTab = 'all' | 'pending' | 'approved' | 'completed' | 'rejected';

export function HostWithdrawalsClient({
  initialPayouts,
  initialPagination,
  initialStats,
}: HostWithdrawalsClientProps) {
  const [payouts, setPayouts] = useState<AdminPayoutItem[]>(initialPayouts);
  const [pagination, setPagination] = useState<PaginationState>(
    initialPagination || {
      totalItems: initialStats.totalCount || initialPayouts.length,
      totalPages: Math.ceil((initialStats.totalCount || initialPayouts.length) / 10) || 1,
      currentPage: 1,
      pageSize: 10,
    }
  );
  const [stats, setStats] = useState<AdminPayoutStats>(initialStats);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Transition for server actions
  const [isPending, startTransition] = useTransition();

  const fetchData = (
    newPage: number,
    newPageSize: number = pagination.pageSize,
    searchVal: string = searchQuery,
    tabVal: string = activeTab
  ) => {
    startTransition(async () => {
      const res = await getAdminPayouts({
        page: newPage,
        pageSize: newPageSize,
        search: searchVal,
        status: tabVal,
      });
      if (res.success && res.payouts) {
        setPayouts(res.payouts);
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

  const handleTabSelect = (tab: FilterTab) => {
    setActiveTab(tab);
    fetchData(1, pagination.pageSize, searchQuery, tab);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData(1, pagination.pageSize, searchQuery, activeTab);
  };

  // Modals state
  const [approveModalItem, setApproveModalItem] = useState<AdminPayoutItem | null>(null);
  const [approveNote, setApproveNote] = useState('');

  const [completeModalItem, setCompleteModalItem] = useState<AdminPayoutItem | null>(null);
  const [transactionRef, setTransactionRef] = useState('');
  const [completeNote, setCompleteNote] = useState('');

  const [rejectModalItem, setRejectModalItem] = useState<AdminPayoutItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [detailModalItem, setDetailModalItem] = useState<AdminPayoutItem | null>(null);

  // Banner Alerts
  const [bannerAlert, setBannerAlert] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Filtered payouts
  const filteredPayouts = payouts.filter((item) => {
    const statusLower = (item.status || 'pending').toLowerCase();
    const tabMatch =
      activeTab === 'all'
        ? true
        : activeTab === 'approved'
        ? statusLower === 'approved' || statusLower === 'processing'
        : statusLower === activeTab;

    const query = searchQuery.toLowerCase().trim();
    if (!query) return tabMatch;

    const userMatch =
      item.user.name.toLowerCase().includes(query) ||
      item.user.email.toLowerCase().includes(query) ||
      (item.user.username && item.user.username.toLowerCase().includes(query));

    const bankMatch =
      Boolean(item.bankAccount && item.bankAccount.accountNumber.includes(query)) ||
      Boolean(item.bankAccount && item.bankAccount.accountHolderName.toLowerCase().includes(query)) ||
      Boolean(item.bankAccount && item.bankAccount.bankName.toLowerCase().includes(query)) ||
      Boolean(item.bankAccount && item.bankAccount.bankCode?.toLowerCase().includes(query));

    const refMatch =
      Boolean(item.transactionReference && item.transactionReference.toLowerCase().includes(query)) ||
      `#wd-${item.id}`.includes(query) ||
      item.id.toString() === query;

    return tabMatch && (userMatch || bankMatch || refMatch);
  });

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'Payout ID',
      'Request Date',
      'Host Name',
      'Host Email',
      'Bank Code',
      'Bank Name',
      'Account Number',
      'Account Holder',
      'Branch',
      'Amount (IDR)',
      'Status',
      'Transaction Reference',
      'Processed At',
      'Notes',
    ];

    const rows = filteredPayouts.map((p) => [
      `WD-${p.id}`,
      new Date(p.createdAt).toLocaleDateString('id-ID'),
      `"${p.user.name.replace(/"/g, '""')}"`,
      p.user.email,
      p.bankAccount?.bankCode || '',
      `"${(p.bankAccount?.bankName || '').replace(/"/g, '""')}"`,
      `'${p.bankAccount?.accountNumber || ''}`,
      `"${(p.bankAccount?.accountHolderName || '').replace(/"/g, '""')}"`,
      `"${(p.bankAccount?.branchName || '').replace(/"/g, '""')}"`,
      p.amount,
      p.status.toUpperCase(),
      p.transactionReference ? `"${p.transactionReference.replace(/"/g, '""')}"` : '',
      p.processedAt ? new Date(p.processedAt).toLocaleDateString('id-ID') : '',
      p.notes ? `"${p.notes.replace(/"/g, '""')}"` : '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `locallytrip_host_withdrawals_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Report
  const handlePrint = () => {
    window.print();
  };

  // Action: Approve
  const handleApproveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!approveModalItem) return;

    startTransition(async () => {
      try {
        const res = await approvePayout(approveModalItem.id, approveNote);
        if (res.success) {
          setPayouts((prev) =>
            prev.map((item) =>
              item.id === approveModalItem.id
                ? {
                    ...item,
                    status: 'approved',
                    notes: approveNote.trim()
                      ? item.notes
                        ? `${item.notes} | Disetujui Admin: ${approveNote.trim()}`
                        : `Disetujui Admin: ${approveNote.trim()}`
                      : item.notes,
                    updatedAt: new Date().toISOString(),
                  }
                : item
            )
          );

          setStats((prev) => ({
            ...prev,
            pendingAmountIdr: Math.max(0, prev.pendingAmountIdr - approveModalItem.amount),
            pendingCount: Math.max(0, prev.pendingCount - 1),
            approvedAmountIdr: prev.approvedAmountIdr + approveModalItem.amount,
            approvedCount: prev.approvedCount + 1,
          }));

          setBannerAlert({ type: 'success', message: res.message });
          setApproveModalItem(null);
          setApproveNote('');
        } else {
          setBannerAlert({ type: 'error', message: res.message });
        }
      } catch (err: any) {
        setBannerAlert({
          type: 'error',
          message: err?.message || 'Gagal menyetujui penarikan dana.',
        });
      }
    });
  };

  // Action: Complete
  const handleCompleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeModalItem) return;

    const refVal = transactionRef.trim() || `TRX-MANUAL-${Date.now()}`;

    startTransition(async () => {
      try {
        const res = await completePayout(completeModalItem.id, refVal, completeNote);
        if (res.success) {
          const wasPending = (completeModalItem.status || '').toLowerCase() === 'pending';
          const wasApproved = (completeModalItem.status || '').toLowerCase() === 'approved';

          setPayouts((prev) =>
            prev.map((item) =>
              item.id === completeModalItem.id
                ? {
                    ...item,
                    status: 'completed',
                    transactionReference: refVal,
                    processedAt: new Date().toISOString(),
                    notes: completeNote.trim()
                      ? item.notes
                        ? `${item.notes} | Transfer Selesai (Ref: ${refVal}): ${completeNote.trim()}`
                        : `Transfer Selesai (Ref: ${refVal}): ${completeNote.trim()}`
                      : item.notes,
                    updatedAt: new Date().toISOString(),
                  }
                : item
            )
          );

          setStats((prev) => ({
            ...prev,
            pendingAmountIdr: wasPending
              ? Math.max(0, prev.pendingAmountIdr - completeModalItem.amount)
              : prev.pendingAmountIdr,
            pendingCount: wasPending ? Math.max(0, prev.pendingCount - 1) : prev.pendingCount,
            approvedAmountIdr: wasApproved
              ? Math.max(0, prev.approvedAmountIdr - completeModalItem.amount)
              : prev.approvedAmountIdr,
            approvedCount: wasApproved ? Math.max(0, prev.approvedCount - 1) : prev.approvedCount,
            completedAmountIdr: prev.completedAmountIdr + completeModalItem.amount,
            completedCount: prev.completedCount + 1,
            completedThisMonthIdr: prev.completedThisMonthIdr + completeModalItem.amount,
          }));

          setBannerAlert({ type: 'success', message: res.message });
          setCompleteModalItem(null);
          setTransactionRef('');
          setCompleteNote('');
        } else {
          setBannerAlert({ type: 'error', message: res.message });
        }
      } catch (err: any) {
        setBannerAlert({
          type: 'error',
          message: err?.message || 'Gagal menandai transfer selesai.',
        });
      }
    });
  };

  // Action: Reject
  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalItem) return;

    if (!rejectionReason.trim()) {
      alert('Alasan penolakan wajib diisi untuk memberikan kejelasan kepada host.');
      return;
    }

    startTransition(async () => {
      try {
        const res = await rejectPayout(rejectModalItem.id, rejectionReason);
        if (res.success) {
          const wasPending = (rejectModalItem.status || '').toLowerCase() === 'pending';
          const wasApproved = (rejectModalItem.status || '').toLowerCase() === 'approved';

          setPayouts((prev) =>
            prev.map((item) =>
              item.id === rejectModalItem.id
                ? {
                    ...item,
                    status: 'rejected',
                    processedAt: new Date().toISOString(),
                    notes: item.notes
                      ? `${item.notes} | Ditolak Admin: ${rejectionReason.trim()}`
                      : `Ditolak Admin: ${rejectionReason.trim()}`,
                    updatedAt: new Date().toISOString(),
                  }
                : item
            )
          );

          setStats((prev) => ({
            ...prev,
            pendingAmountIdr: wasPending
              ? Math.max(0, prev.pendingAmountIdr - rejectModalItem.amount)
              : prev.pendingAmountIdr,
            pendingCount: wasPending ? Math.max(0, prev.pendingCount - 1) : prev.pendingCount,
            approvedAmountIdr: wasApproved
              ? Math.max(0, prev.approvedAmountIdr - rejectModalItem.amount)
              : prev.approvedAmountIdr,
            approvedCount: wasApproved ? Math.max(0, prev.approvedCount - 1) : prev.approvedCount,
            rejectedAmountIdr: prev.rejectedAmountIdr + rejectModalItem.amount,
            rejectedCount: prev.rejectedCount + 1,
          }));

          setBannerAlert({ type: 'success', message: res.message });
          setRejectModalItem(null);
          setRejectionReason('');
        } else {
          setBannerAlert({ type: 'error', message: res.message });
        }
      } catch (err: any) {
        setBannerAlert({
          type: 'error',
          message: err?.message || 'Gagal memproses penolakan penarikan dana.',
        });
      }
    });
  };

  return (
    <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-2">
            <Building2 className="w-3.5 h-3.5" />
            <span>Finance & Host Settlement Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Host Withdrawals & Payouts
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Kelola antrean pencairan dana host, audit rekening tujuan, persetujuan 1-klik, dan ekspor laporan rekonsiliasi perbankan.
          </p>
        </div>

        {/* Global Header Actions */}
        <div className="flex items-center gap-2.5 print:hidden">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm"
            title="Download CSV Rekonsiliasi"
          >
            <Download className="w-3.5 h-3.5 text-purple-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm"
            title="Cetak Laporan Penarikan"
          >
            <Printer className="w-3.5 h-3.5 text-blue-500" />
            <span>Print Report</span>
          </button>
        </div>
      </motion.div>

      {/* Banner Feedback Alert */}
      <AnimatePresence>
        {bannerAlert && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-center justify-between shadow-sm ${
              bannerAlert.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {bannerAlert.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
              )}
              <span className="font-medium">{bannerAlert.message}</span>
            </div>
            <button
              onClick={() => setBannerAlert(null)}
              className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-500"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Telemetry Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pending Requests */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          onClick={() => setActiveTab('pending')}
          className={`cursor-pointer p-5 rounded-2xl border transition-all ${
            activeTab === 'pending'
              ? 'ring-2 ring-amber-500 bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
              : 'bg-white dark:bg-[#1A1D21] border-gray-200/90 dark:border-white/10 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Pending Approvals
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Rp {stats.pendingAmountIdr.toLocaleString('id-ID')}
            </div>
            <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-1 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>{stats.pendingCount} permohonan butuh verifikasi</span>
            </div>
          </div>
        </motion.div>

        {/* Card 2: Approved / Batch Queue */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          onClick={() => setActiveTab('approved')}
          className={`cursor-pointer p-5 rounded-2xl border transition-all ${
            activeTab === 'approved'
              ? 'ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800'
              : 'bg-white dark:bg-[#1A1D21] border-gray-200/90 dark:border-white/10 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Approved Batch
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Rp {stats.approvedAmountIdr.toLocaleString('id-ID')}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-1">
              {stats.approvedCount} siap eksekusi transfer bank
            </div>
          </div>
        </motion.div>

        {/* Card 3: Total Transferred */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          onClick={() => setActiveTab('completed')}
          className={`cursor-pointer p-5 rounded-2xl border transition-all ${
            activeTab === 'completed'
              ? 'ring-2 ring-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
              : 'bg-white dark:bg-[#1A1D21] border-gray-200/90 dark:border-white/10 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Settled
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              Rp {stats.completedAmountIdr.toLocaleString('id-ID')}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              Rp {stats.completedThisMonthIdr.toLocaleString('id-ID')} cair bulan ini ({stats.completedCount} selesai)
            </div>
          </div>
        </motion.div>

        {/* Card 4: Rejected Requests */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
          onClick={() => setActiveTab('rejected')}
          className={`cursor-pointer p-5 rounded-2xl border transition-all ${
            activeTab === 'rejected'
              ? 'ring-2 ring-rose-500 bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
              : 'bg-white dark:bg-[#1A1D21] border-gray-200/90 dark:border-white/10 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Rejected / Refunded
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
              {stats.rejectedCount} Permohonan
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              Rp {stats.rejectedAmountIdr.toLocaleString('id-ID')} dikembalikan ke dompet host
            </div>
          </div>
        </motion.div>
      </div>

      {/* Control Bar: Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        {/* Status Pill Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 overflow-x-auto max-w-full">
          {[
            { id: 'all', label: 'All Requests', count: stats.totalCount },
            { id: 'pending', label: 'Pending', count: stats.pendingCount },
            { id: 'approved', label: 'Approved Batch', count: stats.approvedCount },
            { id: 'completed', label: 'Completed', count: stats.completedCount },
            { id: 'rejected', label: 'Rejected', count: stats.rejectedCount },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabSelect(tab.id as FilterTab)}
                className={`relative px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                    isActive
                      ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari host, bank, nomor rekening..."
            className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition shadow-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                fetchData(1, pagination.pageSize, '', activeTab);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>
      </div>

      {/* Main Table Container */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border border-gray-200/90 dark:border-white/10 bg-white dark:bg-[#1A1D21] shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-gray-200/90 dark:border-white/10">
              <tr>
                <th className="px-5 py-3.5 font-bold">Request ID</th>
                <th className="px-5 py-3.5 font-bold">Host Info</th>
                <th className="px-5 py-3.5 font-bold">Destination Bank & Account</th>
                <th className="px-5 py-3.5 font-bold">Requested Amount</th>
                <th className="px-5 py-3.5 font-bold">Status</th>
                <th className="px-5 py-3.5 font-bold">Audit Reference</th>
                <th className="px-5 py-3.5 font-bold text-right print:hidden">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-300">
              {filteredPayouts.length > 0 ? (
                filteredPayouts.map((item) => {
                  const statusLower = (item.status || 'pending').toLowerCase();
                  const isPendingStatus = statusLower === 'pending';
                  const isApprovedStatus = statusLower === 'approved' || statusLower === 'processing';
                  const isCompletedStatus = statusLower === 'completed';
                  const isRejectedStatus = statusLower === 'rejected';

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      {/* ID & Date */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-purple-600 dark:text-purple-400">
                          #WD-{item.id}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(item.createdAt).toLocaleDateString('id-ID')}</span>
                        </div>
                      </td>

                      {/* Host Profile */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3 min-w-[200px]">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                            {item.user.avatarUrl ? (
                              <img
                                src={item.user.avatarUrl}
                                alt={item.user.name}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              item.user.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                              <span>{item.user.name}</span>
                              {item.user.isKycApproved && (
                                <span title="KYC Verified Host">
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {item.user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Destination Bank & Account */}
                      <td className="px-5 py-4">
                        {item.bankAccount ? (
                          <div className="min-w-[220px]">
                            <div className="flex items-center gap-1.5">
                              <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-mono font-bold uppercase">
                                {item.bankAccount.bankCode || 'BANK'}
                              </span>
                              <span className="font-semibold text-slate-900 dark:text-slate-200 text-xs">
                                {item.bankAccount.bankName}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center gap-2 font-mono text-xs font-bold text-slate-800 dark:text-slate-100">
                              <span>{item.bankAccount.accountNumber}</span>
                              <button
                                onClick={() =>
                                  handleCopy(
                                    item.bankAccount?.accountNumber || '',
                                    `acc-${item.id}`
                                  )
                                }
                                title="Salin nomor rekening"
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                              >
                                {copiedId === `acc-${item.id}` ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              a.n. {item.bankAccount.accountHolderName}
                              {item.bankAccount.branchName && ` • Cabang ${item.bankAccount.branchName}`}
                            </div>
                          </div>
                        ) : (
                          <div className="text-slate-400 italic text-[11px]">
                            Metode: {item.payoutMethod || 'Bank Transfer'} (No Bank Record)
                          </div>
                        )}
                      </td>

                      {/* Requested Amount */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="text-sm font-black text-slate-900 dark:text-white">
                          Rp {item.amount.toLocaleString('id-ID')}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">
                          {item.currency}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {isPendingStatus && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            <span>Pending Review</span>
                          </span>
                        )}
                        {isApprovedStatus && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                            <ShieldCheck className="w-3 h-3 text-blue-500" />
                            <span>Approved Batch</span>
                          </span>
                        )}
                        {isCompletedStatus && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>Transferred</span>
                          </span>
                        )}
                        {isRejectedStatus && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                            <XCircle className="w-3 h-3 text-rose-500" />
                            <span>Rejected</span>
                          </span>
                        )}
                      </td>

                      {/* Audit Reference / Memo */}
                      <td className="px-5 py-4">
                        <div className="max-w-[200px]">
                          {item.transactionReference ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[11px] font-mono font-bold truncate">
                              <Receipt className="w-3 h-3 text-purple-500 shrink-0" />
                              <span className="truncate">{item.transactionReference}</span>
                            </span>
                          ) : item.notes ? (
                            <span
                              className="text-[11px] text-slate-500 dark:text-slate-400 truncate block cursor-pointer hover:underline"
                              onClick={() => setDetailModalItem(item)}
                              title={item.notes}
                            >
                              {item.notes}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">-</span>
                          )}
                        </div>
                      </td>

                      {/* Moderation Actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap print:hidden">
                        <div className="inline-flex items-center gap-1.5">
                          {isPendingStatus && (
                            <>
                              <button
                                onClick={() => {
                                  setApproveModalItem(item);
                                  setApproveNote('');
                                }}
                                disabled={isPending}
                                className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shadow-sm transition flex items-center gap-1"
                                title="Setujui permohonan penarikan dana"
                              >
                                <Check className="w-3 h-3" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => {
                                  setCompleteModalItem(item);
                                  setTransactionRef('');
                                  setCompleteNote('');
                                }}
                                disabled={isPending}
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm transition flex items-center gap-1"
                                title="Selesaikan transfer dana langsung"
                              >
                                <ArrowUpRight className="w-3 h-3" />
                                <span>Transfer</span>
                              </button>
                              <button
                                onClick={() => {
                                  setRejectModalItem(item);
                                  setRejectionReason('');
                                }}
                                disabled={isPending}
                                className="px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold text-[11px] transition flex items-center gap-1"
                                title="Tolak permohonan penarikan dana"
                              >
                                <X className="w-3 h-3" />
                                <span>Reject</span>
                              </button>
                            </>
                          )}

                          {isApprovedStatus && (
                            <>
                              <button
                                onClick={() => {
                                  setCompleteModalItem(item);
                                  setTransactionRef('');
                                  setCompleteNote('');
                                }}
                                disabled={isPending}
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm transition flex items-center gap-1"
                                title="Tandai transfer kliring selesai"
                              >
                                <ArrowUpRight className="w-3 h-3" />
                                <span>Mark Transferred</span>
                              </button>
                              <button
                                onClick={() => {
                                  setRejectModalItem(item);
                                  setRejectionReason('');
                                }}
                                disabled={isPending}
                                className="px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold text-[11px] transition flex items-center gap-1"
                                title="Batalkan dan tolak"
                              >
                                <X className="w-3 h-3" />
                                <span>Reject</span>
                              </button>
                            </>
                          )}

                          {/* View Detail Button for any status */}
                          <button
                            onClick={() => setDetailModalItem(item)}
                            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition"
                            title="Lihat Detail Lengkap"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <Wallet className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-2" />
                      <div className="font-bold text-slate-600 dark:text-slate-300">
                        Tidak ada antrean penarikan dana ditemukan
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Coba ubah kata kunci pencarian atau ganti filter status di atas.
                      </div>
                    </div>
                  </td>
                </tr>
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
          className="print:hidden"
        />
      </motion.div>

      {/* MODAL 1: APPROVE PAYOUT */}
      <AnimatePresence>
        {approveModalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl bg-white dark:bg-[#1A1D21] border border-slate-200 dark:border-white/10 p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-base">
                      Setujui Penarikan Dana
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Permohonan #WD-{approveModalItem.id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setApproveModalItem(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleApproveSubmit} className="mt-5 space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Penerima Dana:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {approveModalItem.user.name}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Rekening Tujuan:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {approveModalItem.bankAccount?.bankName} (
                      {approveModalItem.bankAccount?.accountNumber})
                    </span>
                  </div>
                  <div className="flex justify-between text-xs pt-1 border-t border-gray-200/90 dark:border-white/10">
                    <span className="text-slate-500">Nominal Penarikan:</span>
                    <span className="font-black text-blue-600 dark:text-blue-400 text-sm">
                      Rp {approveModalItem.amount.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Catatan Internal / Jadwal Batch (Opsional)
                  </label>
                  <input
                    type="text"
                    value={approveNote}
                    onChange={(e) => setApproveNote(e.target.value)}
                    placeholder="Contoh: Batch Kliring Bank BCA 15:00 WIB"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setApproveModalItem(null)}
                    disabled={isPending}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20"
                  >
                    {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Konfirmasi Setujui</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: COMPLETE / MARK TRANSFERRED */}
      <AnimatePresence>
        {completeModalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl bg-white dark:bg-[#1A1D21] border border-slate-200 dark:border-white/10 p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-base">
                      Tandai Transfer Selesai
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Permohonan #WD-{completeModalItem.id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setCompleteModalItem(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCompleteSubmit} className="mt-5 space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Penerima Dana:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {completeModalItem.user.name}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Rekening Tujuan:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {completeModalItem.bankAccount?.bankName} (
                      {completeModalItem.bankAccount?.accountNumber})
                    </span>
                  </div>
                  <div className="flex justify-between text-xs pt-1 border-t border-gray-200/90 dark:border-white/10">
                    <span className="text-slate-500">Nominal Ditransfer:</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                      Rp {completeModalItem.amount.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nomor Referensi Transfer / Resi Bank
                  </label>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="Contoh: TRX-BCA-20261024-9982"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Host akan menerima nomor referensi ini pada notifikasi lonceng & riwayat mutasi dompet.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Catatan Penyelesaian (Opsional)
                  </label>
                  <input
                    type="text"
                    value={completeNote}
                    onChange={(e) => setCompleteNote(e.target.value)}
                    placeholder="Contoh: Ditransfer via KlikBCA Bisnis"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setCompleteModalItem(null)}
                    disabled={isPending}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                  >
                    {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Konfirmasi Transfer Selesai</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: REJECT PAYOUT */}
      <AnimatePresence>
        {rejectModalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl bg-white dark:bg-[#1A1D21] border border-slate-200 dark:border-white/10 p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-base">
                      Tolak Penarikan Dana
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Permohonan #WD-{rejectModalItem.id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setRejectModalItem(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleRejectSubmit} className="mt-5 space-y-4">
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300">
                  <span className="font-bold">Perhatian: </span>
                  Dengan menolak permohonan ini, nominal sebesar{' '}
                  <span className="font-bold">
                    Rp {rejectModalItem.amount.toLocaleString('id-ID')}
                  </span>{' '}
                  secara otomatis kembali 100% ke saldo tersedia di dompet host.
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Alasan Penolakan <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Contoh: Nama pemilik rekening tidak sesuai dengan KTP identitas KYC yang terdaftar."
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Alasan ini akan dikirimkan langsung ke host melalui notifikasi platform.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setRejectModalItem(null)}
                    disabled={isPending}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isPending || !rejectionReason.trim()}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-500/20 disabled:opacity-50"
                  >
                    {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Konfirmasi Tolak & Refund</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: DETAIL INSPECTION MODAL */}
      <AnimatePresence>
        {detailModalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#1A1D21] border border-slate-200 dark:border-white/10 p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-base">
                      Audit Penarikan Dana #WD-{detailModalItem.id}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Diajukan pada {new Date(detailModalItem.createdAt).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setDetailModalItem(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                {/* Financial Summary Block */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Nominal Penarikan
                  </span>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    Rp {detailModalItem.amount.toLocaleString('id-ID')}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                    <span className="font-mono uppercase font-semibold">
                      {detailModalItem.currency}
                    </span>
                    <span>•</span>
                    <span>Metode: {detailModalItem.payoutMethod}</span>
                  </div>
                </div>

                {/* Host Details */}
                <div className="space-y-2 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Informasi Host
                  </span>
                  <div className="p-3.5 rounded-2xl border border-gray-200/90 dark:border-white/10 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Nama Lengkap:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {detailModalItem.user.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Email:</span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {detailModalItem.user.email}
                      </span>
                    </div>
                    {detailModalItem.user.phone && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">No. Telepon:</span>
                        <span className="font-mono text-slate-900 dark:text-white">
                          {detailModalItem.user.phone}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-1 border-t border-slate-100 dark:border-white/10">
                      <span className="text-slate-500">Status KYC:</span>
                      <span
                        className={`font-bold ${
                          detailModalItem.user.isKycApproved
                            ? 'text-emerald-500'
                            : 'text-amber-500'
                        }`}
                      >
                        {detailModalItem.user.isKycApproved ? 'KYC Terverifikasi' : 'Belum KYC'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bank Account Details */}
                {detailModalItem.bankAccount && (
                  <div className="space-y-2 text-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Rekening Bank Tujuan
                    </span>
                    <div className="p-3.5 rounded-2xl border border-gray-200/90 dark:border-white/10 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Nama Bank:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {detailModalItem.bankAccount.bankName} (
                          {detailModalItem.bankAccount.bankCode})
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Nomor Rekening:</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          {detailModalItem.bankAccount.accountNumber}
                          <button
                            onClick={() =>
                              handleCopy(
                                detailModalItem.bankAccount?.accountNumber || '',
                                'modal-acc'
                              )
                            }
                            className="text-slate-400 hover:text-slate-600"
                          >
                            {copiedId === 'modal-acc' ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Nama Pemilik Rekening:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {detailModalItem.bankAccount.accountHolderName}
                        </span>
                      </div>
                      {detailModalItem.bankAccount.branchName && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Kantor Cabang:</span>
                          <span className="text-slate-700 dark:text-slate-300">
                            {detailModalItem.bankAccount.branchName}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Audit & Notes */}
                <div className="space-y-2 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Riwayat Audit & Catatan
                  </span>
                  <div className="p-3.5 rounded-2xl border border-gray-200/90 dark:border-white/10 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status Terkini:</span>
                      <span className="font-bold uppercase text-purple-600 dark:text-purple-400">
                        {detailModalItem.status}
                      </span>
                    </div>
                    {detailModalItem.transactionReference && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">No. Referensi:</span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {detailModalItem.transactionReference}
                        </span>
                      </div>
                    )}
                    {detailModalItem.processedAt && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Waktu Diproses:</span>
                        <span className="text-slate-700 dark:text-slate-300">
                          {new Date(detailModalItem.processedAt).toLocaleString('id-ID')}
                        </span>
                      </div>
                    )}
                    {detailModalItem.notes && (
                      <div className="pt-2 border-t border-slate-100 dark:border-white/10">
                        <span className="text-slate-500 block mb-1">Catatan:</span>
                        <p className="text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-[#1A1D21] p-2.5 rounded-xl">
                          {detailModalItem.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  onClick={() => setDetailModalItem(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
