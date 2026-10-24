'use client';

import React, { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tag,
  Ticket,
  Percent,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Plus,
  Copy,
  Check,
  X,
  Loader2,
  Trash2,
  Power,
  Sparkles,
  Download,
  Share2,
  Layers,
  ShoppingBag,
  Building2,
} from 'lucide-react';
import {
  AdminVoucherItem,
  AdminVoucherStats,
  createPromoVoucher,
  toggleVoucherStatus,
  deletePromoVoucher,
  CreateVoucherInput,
  getAdminVouchersData,
  BrandPartnerOption,
} from '@/actions/admin/vouchers';
import { AdminPagination, PaginationState } from '@/components/admin/ui/AdminPagination';

interface VouchersControlClientProps {
  initialVouchers: AdminVoucherItem[];
  initialPagination?: PaginationState;
  initialStats: AdminVoucherStats;
  brandPartners?: BrandPartnerOption[];
}

type FilterTab = 'all' | 'active' | 'expired' | 'disabled';

export function VouchersControlClient({
  initialVouchers,
  initialPagination,
  initialStats,
  brandPartners = [],
}: VouchersControlClientProps) {
  const [vouchers, setVouchers] = useState<AdminVoucherItem[]>(initialVouchers);
  const [pagination, setPagination] = useState<PaginationState>(
    initialPagination || {
      totalItems: initialStats.totalVouchers || initialVouchers.length,
      totalPages: Math.ceil((initialStats.totalVouchers || initialVouchers.length) / 10) || 1,
      currentPage: 1,
      pageSize: 10,
    }
  );
  const [stats, setStats] = useState<AdminVoucherStats>(initialStats);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const fetchData = (
    newPage: number,
    newPageSize: number = pagination.pageSize,
    searchVal: string = searchQuery,
    tabVal: string = activeTab
  ) => {
    startTransition(async () => {
      const res = await getAdminVouchersData({
        page: newPage,
        pageSize: newPageSize,
        search: searchVal,
        status: tabVal,
      });
      if (res.success && res.vouchers) {
        setVouchers(res.vouchers);
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

  const handleTabChange = (tab: FilterTab) => {
    setActiveTab(tab);
    fetchData(1, pagination.pageSize, searchQuery, tab);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData(1, pagination.pageSize, searchQuery, activeTab);
  };

  // Alert State
  const [bannerAlert, setBannerAlert] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Form State for New Voucher
  const [formData, setFormData] = useState<CreateVoucherInput>({
    code: '',
    type: 'platform',
    brandId: null,
    discountType: 'percentage',
    discountValue: 15,
    minBookingAmount: 150000,
    maxDiscountAmount: 100000,
    usageLimit: 100,
    categoryRestrictions: [],
    validFrom: new Date().toISOString().slice(0, 10),
    validUntil: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    description: '',
    internalNotes: '',
  });

  // Random Code Generator Helper
  const generateRandomCode = () => {
    const prefixes = ['LOCALLY', 'TRIP', 'VIBE', 'EXPLORE', 'BALI', 'LOMBOK', 'SUMMER', 'WEEKEND'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomSuffix = Math.floor(10 + Math.random() * 90);
    setFormData((prev) => ({
      ...prev,
      code: `${randomPrefix}${randomSuffix}`,
    }));
  };

  // Filtered list
  const filteredVouchers = vouchers.filter((v) => {
    const statusMatch = activeTab === 'all' ? true : v.status === activeTab;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return statusMatch;

    const codeMatch = v.code.toLowerCase().includes(query);
    const descMatch = Boolean(v.description && v.description.toLowerCase().includes(query));
    const notesMatch = Boolean(v.internalNotes && v.internalNotes.toLowerCase().includes(query));
    const typeMatch = v.type.toLowerCase().includes(query);

    return statusMatch && (codeMatch || descMatch || notesMatch || typeMatch);
  });

  // Copy helper
  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Code',
      'Type',
      'Discount Type',
      'Discount Value',
      'Min Booking Amount',
      'Max Discount Cap',
      'Usage Count',
      'Usage Limit',
      'Valid From',
      'Valid Until',
      'Status',
      'Description',
    ];

    const rows = filteredVouchers.map((v) => [
      v.code,
      v.type.toUpperCase(),
      v.discountType.toUpperCase(),
      v.discountValue,
      v.minBookingAmount,
      v.maxDiscountAmount || '',
      v.usageCount,
      v.usageLimit || 'UNLIMITED',
      v.validFrom.slice(0, 10),
      v.validUntil ? v.validUntil.slice(0, 10) : 'NO_EXPIRY',
      v.status.toUpperCase(),
      `"${(v.description || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `locallytrip_promo_vouchers_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Toggle status
  const handleToggleStatus = (id: number, currentStatus: string) => {
    const targetStatus = currentStatus === 'active' ? 'disabled' : 'active';
    startTransition(async () => {
      try {
        const res = await toggleVoucherStatus(id, targetStatus);
        if (res.success) {
          setVouchers((prev) =>
            prev.map((v) => (v.id === id ? { ...v, status: targetStatus } : v))
          );
          setStats((prev) => ({
            ...prev,
            activeVouchers:
              targetStatus === 'active' ? prev.activeVouchers + 1 : Math.max(0, prev.activeVouchers - 1),
            expiredOrDisabled:
              targetStatus === 'disabled'
                ? prev.expiredOrDisabled + 1
                : Math.max(0, prev.expiredOrDisabled - 1),
          }));
          setBannerAlert({ type: 'success', message: res.message });
        } else {
          setBannerAlert({ type: 'error', message: res.message });
        }
      } catch (err: any) {
        setBannerAlert({
          type: 'error',
          message: err?.message || 'Gagal mengubah status voucher.',
        });
      }
    });
  };

  // Delete Voucher
  const handleDeleteVoucher = (id: number, code: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus atau menonaktifkan kode voucher "${code}"?`)) {
      return;
    }

    startTransition(async () => {
      try {
        const res = await deletePromoVoucher(id);
        if (res.success) {
          setVouchers((prev) => prev.filter((v) => v.id !== id));
          setStats((prev) => ({
            ...prev,
            totalVouchers: Math.max(0, prev.totalVouchers - 1),
          }));
          setBannerAlert({ type: 'success', message: res.message });
        } else {
          setBannerAlert({ type: 'error', message: res.message });
        }
      } catch (err: any) {
        setBannerAlert({
          type: 'error',
          message: err?.message || 'Gagal menghapus voucher.',
        });
      }
    });
  };

  // Create Submit
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      alert('Kode voucher wajib diisi.');
      return;
    }

    startTransition(async () => {
      try {
        const res = await createPromoVoucher(formData);
        if (res.success) {
          setBannerAlert({ type: 'success', message: res.message });
          setIsCreateModalOpen(false);

          const matchedPartner = formData.brandId
            ? brandPartners.find((p) => p.id === Number(formData.brandId))
            : null;

          // Optimistically append new voucher to list
          const newVoucher: AdminVoucherItem = {
            id: Date.now(),
            code: formData.code.trim().toUpperCase(),
            type: formData.type || 'platform',
            brandId: formData.brandId ? Number(formData.brandId) : null,
            brandPartner: matchedPartner
              ? {
                  id: matchedPartner.id,
                  name: matchedPartner.name,
                  logoUrl: matchedPartner.logo_url,
                  category: matchedPartner.category,
                }
              : null,
            discountType: formData.discountType,
            discountValue: Number(formData.discountValue),
            minBookingAmount: Number(formData.minBookingAmount) || 0,
            maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : null,
            usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
            usageCount: 0,
            stackable: false,
            categoryRestrictions: formData.categoryRestrictions || [],
            validFrom: formData.validFrom,
            validUntil: formData.validUntil || null,
            status: 'active',
            description: formData.description || null,
            currency: 'IDR',
            internalNotes: formData.internalNotes || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          setVouchers((prev) => [newVoucher, ...prev]);
          setStats((prev) => ({
            ...prev,
            totalVouchers: prev.totalVouchers + 1,
            activeVouchers: prev.activeVouchers + 1,
          }));

          // Reset form
          setFormData({
            code: '',
            type: 'platform',
            brandId: null,
            discountType: 'percentage',
            discountValue: 15,
            minBookingAmount: 150000,
            maxDiscountAmount: 100000,
            usageLimit: 100,
            categoryRestrictions: [],
            validFrom: new Date().toISOString().slice(0, 10),
            validUntil: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10),
            description: '',
            internalNotes: '',
          });
        } else {
          setBannerAlert({ type: 'error', message: res.message });
        }
      } catch (err: any) {
        setBannerAlert({
          type: 'error',
          message: err?.message || 'Gagal membuat voucher.',
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-semibold mb-2">
            <Tag className="w-3.5 h-3.5" />
            <span>Marketing Campaigns & Coupons</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Dynamic Promo Voucher Generator
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Buat dan kelola kupon diskon perjalanan, kuota pemakaian, batas masa berlaku, dan telemetri penghematan pelanggan.
          </p>
        </div>

        {/* Global Header Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-purple-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => {
              generateRandomCode();
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md shadow-purple-500/25 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Voucher Baru</span>
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
        {/* Card 1: Active Vouchers */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          onClick={() => setActiveTab('active')}
          className={`cursor-pointer p-5 rounded-2xl border transition-all ${
            activeTab === 'active'
              ? 'ring-2 ring-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
              : 'bg-white dark:bg-[#1A1D21] border-gray-200/90 dark:border-white/10 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Voucher Aktif
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {stats.activeVouchers}
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
              Siap dipakai pelanggan ({stats.totalVouchers} total kampanye)
            </div>
          </div>
        </motion.div>

        {/* Card 2: Total Redemptions */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="p-5 rounded-2xl border bg-white dark:bg-[#1A1D21] border-gray-200/90 dark:border-white/10"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Klaim Digunakan
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
              {stats.totalRedemptions} Kali
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              Redemptions berhasil pada checkout pemesanan
            </div>
          </div>
        </motion.div>

        {/* Card 3: Total Discount Value */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="p-5 rounded-2xl border bg-white dark:bg-[#1A1D21] border-gray-200/90 dark:border-white/10"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Nilai Diskon Tersalurkan
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
              Rp {stats.totalDiscountGivenIdr.toLocaleString('id-ID')}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              Insentif potongan harga yang dinikmati traveler
            </div>
          </div>
        </motion.div>

        {/* Card 4: Expired / Disabled */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
          onClick={() => setActiveTab('expired')}
          className={`cursor-pointer p-5 rounded-2xl border transition-all ${
            activeTab === 'expired'
              ? 'ring-2 ring-rose-500 bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
              : 'bg-white dark:bg-[#1A1D21] border-gray-200/90 dark:border-white/10 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Kedaluwarsa / Nonaktif
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {stats.expiredOrDisabled}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              Voucher sudah habis masa berlaku atau dinonaktifkan
            </div>
          </div>
        </motion.div>
      </div>

      {/* Control Bar: Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Status Pill Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 overflow-x-auto max-w-full">
          {[
            { id: 'all', label: 'Semua Voucher', count: stats.totalVouchers },
            { id: 'active', label: 'Aktif', count: stats.activeVouchers },
            { id: 'expired', label: 'Kedaluwarsa', count: vouchers.filter((v) => v.status === 'expired').length },
            { id: 'disabled', label: 'Dinonaktifkan', count: vouchers.filter((v) => v.status === 'disabled').length },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as FilterTab)}
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
            placeholder="Cari kode promo, judul kampanye..."
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

      {/* Main Vouchers Table */}
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
                <th className="px-5 py-3.5 font-bold">Kode Voucher</th>
                <th className="px-5 py-3.5 font-bold">Judul Kampanye</th>
                <th className="px-5 py-3.5 font-bold">Nilai Diskon</th>
                <th className="px-5 py-3.5 font-bold">Kuota Digunakan</th>
                <th className="px-5 py-3.5 font-bold">Masa Berlaku</th>
                <th className="px-5 py-3.5 font-bold">Status</th>
                <th className="px-5 py-3.5 font-bold text-right">Moderasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-300">
              {filteredVouchers.length > 0 ? (
                filteredVouchers.map((item) => {
                  const isPercent = item.discountType === 'percentage';
                  const usagePercent = item.usageLimit
                    ? Math.min(100, Math.round((item.usageCount / item.usageLimit) * 100))
                    : 0;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Code Pill */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-mono font-bold text-xs">
                          <Ticket className="w-3.5 h-3.5 text-purple-500" />
                          <span>{item.code}</span>
                          <button
                            onClick={() => handleCopy(item.code)}
                            title="Salin kode"
                            className="text-purple-400 hover:text-purple-600 dark:hover:text-purple-200 ml-1"
                          >
                            {copiedCode === item.code ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono uppercase mt-1">
                          Tipe: {item.type}
                        </div>
                        {item.brandPartner && (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-[10px] font-semibold mt-1">
                            <Building2 className="w-3 h-3 text-indigo-500" />
                            <span>{item.brandPartner.name}</span>
                          </div>
                        )}
                      </td>

                      {/* Title & Restrictions */}
                      <td className="px-5 py-4">
                        <div className="min-w-[200px]">
                          <div className="font-bold text-slate-900 dark:text-white line-clamp-1">
                            {item.description || 'Kampanye Promo Standar'}
                          </div>
                          {item.categoryRestrictions && item.categoryRestrictions.length > 0 ? (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.categoryRestrictions.map((cat, idx) => (
                                <span
                                  key={idx}
                                  className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                                >
                                  {cat}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Berlaku untuk semua kategori wisata
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Discount Value */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="font-black text-slate-900 dark:text-white flex items-center gap-1">
                          {isPercent ? (
                            <>
                              <Percent className="w-3.5 h-3.5 text-purple-500" />
                              <span>{item.discountValue}% OFF</span>
                            </>
                          ) : (
                            <span>Rp {item.discountValue.toLocaleString('id-ID')} FLAT</span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Min order: Rp {item.minBookingAmount.toLocaleString('id-ID')}
                          {isPercent && item.maxDiscountAmount && ` (Maks Rp ${item.maxDiscountAmount.toLocaleString('id-ID')})`}
                        </div>
                      </td>

                      {/* Quota Progress */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="w-32">
                          <div className="flex justify-between text-[11px] font-semibold mb-1">
                            <span>{item.usageCount} dipakai</span>
                            <span className="text-slate-400">
                              {item.usageLimit ? `/ ${item.usageLimit}` : 'Tanpa batas'}
                            </span>
                          </div>
                          {item.usageLimit ? (
                            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  usagePercent >= 90
                                    ? 'bg-rose-500'
                                    : usagePercent >= 50
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                                style={{ width: `${usagePercent}%` }}
                              />
                            </div>
                          ) : (
                            <div className="text-[10px] text-emerald-500 font-bold">Unlimited</div>
                          )}
                        </div>
                      </td>

                      {/* Validity Dates */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                          {new Date(item.validFrom).toLocaleDateString('id-ID')}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          s/d {item.validUntil ? new Date(item.validUntil).toLocaleDateString('id-ID') : 'Selamanya'}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {item.status === 'active' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Aktif</span>
                          </span>
                        )}
                        {item.status === 'expired' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-[11px] font-semibold">
                            <Clock className="w-3 h-3 text-amber-500" />
                            <span>Kedaluwarsa</span>
                          </span>
                        )}
                        {item.status === 'disabled' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-[11px] font-semibold">
                            <XCircle className="w-3 h-3 text-slate-500" />
                            <span>Dinonaktifkan</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Toggle Active / Disable Button */}
                          <button
                            onClick={() => handleToggleStatus(item.id, item.status)}
                            disabled={isPending || item.status === 'expired'}
                            className={`p-1.5 rounded-xl border transition ${
                              item.status === 'active'
                                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-600 hover:bg-amber-100'
                                : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-600 hover:bg-emerald-100'
                            }`}
                            title={item.status === 'active' ? 'Nonaktifkan voucher' : 'Aktifkan voucher'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteVoucher(item.id, item.code)}
                            disabled={isPending}
                            className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-600 hover:bg-rose-100 transition"
                            title="Hapus voucher"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
                      <Ticket className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-2" />
                      <div className="font-bold text-slate-600 dark:text-slate-300">
                        Tidak ada voucher promo ditemukan
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Buat kode voucher baru atau sesuaikan filter pencarian.
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
        />
      </motion.div>

      {/* CREATE VOUCHER MODAL */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#1A1D21] border border-slate-200 dark:border-white/10 p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-base">
                      Buat Voucher Promo Baru
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Generate kupon diskon instan untuk platform atau kampanye mitra.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
                {/* Code & Randomizer */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Kode Promo <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={generateRandomCode}
                      className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Acak Kode Otomatis</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    placeholder="Contoh: LOCALLY2026"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 text-slate-900 dark:text-white font-mono uppercase font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Campaign Title / Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Deskripsi / Judul Kampanye
                  </label>
                  <input
                    type="text"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Contoh: Diskon Eksplorasi Wisata Akhir Pekan"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Brand Partner / Sponsor */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Brand Partner / Sponsor (Opsional)
                  </label>
                  <select
                    value={formData.brandId || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        brandId: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">-- Tanpa Brand Partner (Kupon Internal Platform) --</option>
                    {brandPartners.map((bp) => (
                      <option key={bp.id} value={bp.id}>
                        {bp.name} ({bp.category})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Pilih mitra B2B jika voucher ini merupakan program sponsorship atau voucher diskon brand partner.
                  </p>
                </div>

                {/* Type & Discount Type */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Kategori Kupon
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="platform">Platform Campaign</option>
                      <option value="influencer">Influencer Partner</option>
                      <option value="host">Host Special Promo</option>
                      <option value="referral">Referral Program</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Format Potongan
                    </label>
                    <select
                      value={formData.discountType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          discountType: e.target.value as 'percentage' | 'fixed_amount',
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="percentage">Persentase (%)</option>
                      <option value="fixed_amount">Nominal Tetap (Rp)</option>
                    </select>
                  </div>
                </div>

                {/* Discount Value & Max Cap */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nilai Diskon {formData.discountType === 'percentage' ? '(%)' : '(Rp)'}
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={formData.discountType === 'percentage' ? 100 : 50000000}
                      value={formData.discountValue}
                      onChange={(e) =>
                        setFormData({ ...formData, discountValue: Number(e.target.value) })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Maksimal Diskon (Rp)
                    </label>
                    <input
                      type="number"
                      disabled={formData.discountType === 'fixed_amount'}
                      value={formData.maxDiscountAmount || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxDiscountAmount: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      placeholder={formData.discountType === 'fixed_amount' ? 'Otomatis Flat' : 'Contoh: 100000'}
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Min Booking & Max Usage Quota */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Minimal Nilai Order (Rp)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.minBookingAmount || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, minBookingAmount: Number(e.target.value) })
                      }
                      placeholder="0 (Tanpa minimum)"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Batas Kuota Pemakaian
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formData.usageLimit || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          usageLimit: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      placeholder="Kosongkan jika Unlimited"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* Validity Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Mulai Berlaku
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.validFrom}
                      onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Berakhir Pada
                    </label>
                    <input
                      type="date"
                      value={formData.validUntil || ''}
                      onChange={(e) => setFormData({ ...formData, validUntil: e.target.value || null })}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* Internal Memo */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Catatan Internal Tim Marketing (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formData.internalNotes || ''}
                    onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
                    placeholder="Contoh: Diterbitkan untuk flash sale Q4 2026"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Submit Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    disabled={isPending}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-500/25"
                  >
                    {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Terbitkan Voucher</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
