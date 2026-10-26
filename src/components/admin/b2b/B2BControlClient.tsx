'use client';

import React, { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Briefcase,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Plus,
  Edit2,
  Trash2,
  Power,
  Globe,
  Mail,
  Phone,
  User,
  ExternalLink,
  Download,
  Copy,
  Check,
  X,
  Loader2,
  TrendingUp,
  Layers,
  Sparkles,
  ShieldCheck,
  Eye,
  FileText,
  Gift,
  Calendar,
  Tag,
} from 'lucide-react';
import {
  AdminB2BPartnerItem,
  AdminB2BStats,
  createB2BPartner,
  updateB2BPartner,
  toggleB2BPartnerStatus,
  deleteB2BPartner,
  approveB2BPartner,
  rejectB2BPartner,
  addVoucherCodesToCampaign,
  CreateB2BPartnerInput,
  getAdminB2BPartnersData,
} from '@/actions/admin/b2b';
import { AdminPagination, PaginationState } from '@/components/admin/ui/AdminPagination';
import { getPublicImageUrl } from '@/lib/images';
import { ImageUploadDropzone } from '@/components/shared/ImageUploadDropzone';

interface B2BControlClientProps {
  initialPartners: AdminB2BPartnerItem[];
  initialPagination?: PaginationState;
  initialStats: AdminB2BStats;
}

type StatusFilter = 'ALL' | 'ACTIVE' | 'PENDING' | 'SUSPENDED';

export function B2BControlClient({
  initialPartners,
  initialPagination,
  initialStats,
}: B2BControlClientProps) {
  const [partners, setPartners] = useState<AdminB2BPartnerItem[]>(initialPartners);
  const [pagination, setPagination] = useState<PaginationState>(
    initialPagination || {
      totalItems: initialStats.totalPartners || initialPartners.length,
      totalPages: Math.ceil((initialStats.totalPartners || initialPartners.length) / 10) || 1,
      currentPage: 1,
      pageSize: 10,
    }
  );
  const [stats, setStats] = useState<AdminB2BStats>(initialStats);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Transitions
  const [isPending, startTransition] = useTransition();

  const fetchData = (
    newPage: number,
    newPageSize: number = pagination.pageSize,
    searchVal: string = searchQuery,
    statusVal: string = statusFilter
  ) => {
    startTransition(async () => {
      const res = await getAdminB2BPartnersData({
        page: newPage,
        pageSize: newPageSize,
        search: searchVal,
        status: statusVal,
      });
      if (res.success && res.partners) {
        setPartners(res.partners);
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

  const handleStatusFilterChange = (status: StatusFilter) => {
    setStatusFilter(status);
    fetchData(1, pagination.pageSize, searchQuery, status);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData(1, pagination.pageSize, searchQuery, statusFilter);
  };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<AdminB2BPartnerItem | null>(null);
  const [selectedDetailPartner, setSelectedDetailPartner] = useState<AdminB2BPartnerItem | null>(null);
  const [showVouchersCampaignId, setShowVouchersCampaignId] = useState<number | null>(null);
  const [topUpCampaignId, setTopUpCampaignId] = useState<number | null>(null);
  const [topUpCodesInput, setTopUpCodesInput] = useState('');

  // Banner Feedback Alert
  const [bannerAlert, setBannerAlert] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Form State
  const [formData, setFormData] = useState<CreateB2BPartnerInput>({
    name: '',
    category: 'CORPORATE',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    websiteUrl: '',
    logoUrl: '',
    status: 'ACTIVE',
    description: '',
  });

  // Filtered Partners
  const filteredPartners = partners.filter((p) => {
    const statusMatch =
      statusFilter === 'ALL'
        ? true
        : p.status === statusFilter ||
          (statusFilter === 'ACTIVE' && p.status === 'APPROVED');

    const query = searchQuery.toLowerCase().trim();
    if (!query) return statusMatch;

    const nameMatch = p.name.toLowerCase().includes(query);
    const picMatch = p.contactPerson.toLowerCase().includes(query);
    const emailMatch = p.contactEmail.toLowerCase().includes(query);
    const catMatch = p.category.toLowerCase().includes(query);

    return statusMatch && (nameMatch || picMatch || emailMatch || catMatch);
  });

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'Partner ID',
      'Company Name',
      'Category',
      'Contact Person',
      'Email',
      'Phone',
      'Active Campaigns',
      'Total Vouchers Pool',
      'Total Claims/Bookings',
      'Total Placement Fee (IDR)',
      'Status',
      'Website',
    ];

    const rows = filteredPartners.map((p) => [
      `B2B-${p.id}`,
      `"${p.name.replace(/"/g, '""')}"`,
      p.category,
      `"${p.contactPerson.replace(/"/g, '""')}"`,
      p.contactEmail,
      p.contactPhone,
      p.totalCampaigns,
      p.totalVouchersPool,
      p.totalBookingsReferred,
      p.totalEarningsIdr,
      p.status,
      p.websiteUrl || '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `locallytrip_b2b_partners_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingPartner(null);
    setFormData({
      name: '',
      category: 'CORPORATE',
      contactPerson: '',
      contactEmail: '',
      contactPhone: '',
      websiteUrl: '',
      logoUrl: '',
      status: 'ACTIVE',
      description: '',
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (partner: AdminB2BPartnerItem) => {
    setEditingPartner(partner);
    setFormData({
      name: partner.name,
      category: partner.category,
      contactPerson: partner.contactPerson,
      contactEmail: partner.contactEmail,
      contactPhone: partner.contactPhone,
      websiteUrl: partner.websiteUrl || '',
      logoUrl: partner.logoUrl || '',
      status: partner.status,
      description: partner.description || '',
    });
    setIsModalOpen(true);
  };

  // Toggle Status
  const handleToggleStatus = (id: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    startTransition(async () => {
      try {
        const res = await toggleB2BPartnerStatus(id, nextStatus as any);
        if (res.success) {
          setPartners((prev) =>
            prev.map((p) => (p.id === id ? { ...p, status: nextStatus } : p))
          );
          setStats((prev) => ({
            ...prev,
            activePartners:
              nextStatus === 'ACTIVE' ? prev.activePartners + 1 : Math.max(0, prev.activePartners - 1),
          }));
          setBannerAlert({ type: 'success', message: res.message });
        } else {
          setBannerAlert({ type: 'error', message: res.message });
        }
      } catch (err: any) {
        setBannerAlert({
          type: 'error',
          message: err?.message || 'Gagal mengubah status kemitraan.',
        });
      }
    });
  };

  // Delete Partner
  const handleDelete = (id: number, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus atau menonaktifkan kemitraan "${name}"?`)) {
      return;
    }

    startTransition(async () => {
      try {
        const res = await deleteB2BPartner(id);
        if (res.success) {
          setPartners((prev) => prev.filter((p) => p.id !== id));
          setStats((prev) => ({
            ...prev,
            totalPartners: Math.max(0, prev.totalPartners - 1),
          }));
          setBannerAlert({ type: 'success', message: res.message });
        } else {
          setBannerAlert({ type: 'error', message: res.message });
        }
      } catch (err: any) {
        setBannerAlert({
          type: 'error',
          message: err?.message || 'Gagal menghapus mitra B2B.',
        });
      }
    });
  };

  // Approve Partner Application
  const handleApprovePartner = (partnerId: number) => {
    startTransition(async () => {
      try {
        const res = await approveB2BPartner(partnerId);
        if (res.success) {
          setPartners((prev) =>
            prev.map((p) => (p.id === partnerId ? { ...p, status: 'ACTIVE' } : p))
          );
          setStats((prev) => ({
            ...prev,
            activePartners: prev.activePartners + 1,
          }));
          setBannerAlert({ type: 'success', message: res.message });
          setSelectedDetailPartner(null);
        } else {
          setBannerAlert({ type: 'error', message: res.message });
        }
      } catch (err: any) {
        setBannerAlert({
          type: 'error',
          message: err?.message || 'Gagal menyetujui kemitraan.',
        });
      }
    });
  };

  // Reject Partner Application
  const handleRejectPartner = (partnerId: number) => {
    if (!confirm('Apakah Anda yakin ingin menolak permohonan kemitraan ini?')) {
      return;
    }
    startTransition(async () => {
      try {
        const res = await rejectB2BPartner(partnerId);
        if (res.success) {
          setPartners((prev) =>
            prev.map((p) => (p.id === partnerId ? { ...p, status: 'REJECTED' } : p))
          );
          setBannerAlert({ type: 'success', message: res.message });
          setSelectedDetailPartner(null);
        } else {
          setBannerAlert({ type: 'error', message: res.message });
        }
      } catch (err: any) {
        setBannerAlert({
          type: 'error',
          message: err?.message || 'Gagal menolak permohonan kemitraan.',
        });
      }
    });
  };

  // Top Up Voucher Codes to Campaign
  const handleTopUpSubmit = (campaignId: number) => {
    if (!topUpCodesInput.trim()) return;
    startTransition(async () => {
      try {
        const res = await addVoucherCodesToCampaign(campaignId, topUpCodesInput);
        if (res.success) {
          setBannerAlert({ type: 'success', message: res.message });
          setTopUpCampaignId(null);
          setTopUpCodesInput('');
          fetchData(pagination.currentPage, pagination.pageSize, searchQuery, statusFilter);
          setSelectedDetailPartner(null);
        } else {
          setBannerAlert({ type: 'error', message: res.message });
        }
      } catch (err: any) {
        setBannerAlert({
          type: 'error',
          message: err?.message || 'Gagal menambahkan voucher.',
        });
      }
    });
  };

  // Form Submit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.contactEmail.trim()) {
      alert('Nama perusahaan dan email kontak wajib diisi.');
      return;
    }

    startTransition(async () => {
      try {
        if (editingPartner) {
          // Update
          const res = await updateB2BPartner(editingPartner.id, formData);
          if (res.success) {
            setPartners((prev) =>
              prev.map((p) =>
                p.id === editingPartner.id
                  ? {
                      ...p,
                      name: formData.name,
                      category: formData.category,
                      contactPerson: formData.contactPerson,
                      contactEmail: formData.contactEmail,
                      contactPhone: formData.contactPhone,
                      websiteUrl: formData.websiteUrl || null,
                      logoUrl: formData.logoUrl || p.logoUrl,
                      status: formData.status || p.status,
                      description: formData.description || null,
                    }
                  : p
              )
            );
            setBannerAlert({ type: 'success', message: res.message });
            setIsModalOpen(false);
          } else {
            setBannerAlert({ type: 'error', message: res.message });
          }
        } else {
          // Create
          const res = await createB2BPartner(formData);
          if (res.success) {
            const newPartner: AdminB2BPartnerItem = {
              id: Date.now(),
              name: formData.name,
              slug: formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              category: formData.category,
              logoUrl:
                formData.logoUrl ||
                'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=300&auto=format&fit=crop&q=80',
              bannerUrl: null,
              websiteUrl: formData.websiteUrl || null,
              contactPerson: formData.contactPerson,
              contactEmail: formData.contactEmail,
              contactPhone: formData.contactPhone,
              description: formData.description || null,
              status: formData.status || 'ACTIVE',
              commissionRate: 0,
              totalCampaigns: 0,
              totalVouchersPool: 0,
              totalBookingsReferred: 0,
              totalEarningsIdr: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            setPartners((prev) => [newPartner, ...prev]);
            setStats((prev) => ({
              ...prev,
              totalPartners: prev.totalPartners + 1,
              activePartners:
                newPartner.status === 'ACTIVE' ? prev.activePartners + 1 : prev.activePartners,
            }));

            setBannerAlert({ type: 'success', message: res.message });
            setIsModalOpen(false);
          } else {
            setBannerAlert({ type: 'error', message: res.message });
          }
        }
      } catch (err: any) {
        setBannerAlert({
          type: 'error',
          message: err?.message || 'Gagal menyimpan data mitra.',
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-2">
            <Building2 className="w-3.5 h-3.5" />
            <span>Corporate Travel & Brand Gateway</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            B2B Partners & Brand Sponsors
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Kelola kemitraan brand partner, sponsorship perks barter komunitas, dan monitoring kampanye voucher.
          </p>
        </div>

        {/* Global Header Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-blue-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/25 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Daftarkan Mitra B2B</span>
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
        {/* Card 1: Active Partners */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          onClick={() => setStatusFilter('ACTIVE')}
          className={`cursor-pointer p-5 rounded-2xl border transition-all ${
            statusFilter === 'ACTIVE'
              ? 'ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800'
              : 'bg-white dark:bg-[#1A1D21] border-gray-200/90 dark:border-white/10 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Mitra Aktif
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {stats.activePartners}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-1">
              Dari {stats.totalPartners} total mitra korporat terdaftar
            </div>
          </div>
        </motion.div>

        {/* Card 2: Total Bookings Generated */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="p-5 rounded-2xl border bg-white dark:bg-[#1A1D21] border-gray-200/90 dark:border-white/10"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Pemesanan Referal
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {stats.totalBookingsReferred} Booking
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              Total volume tiket terjual via kanal mitra
            </div>
          </div>
        </motion.div>

        {/* Card 3: Placement Fees & Earnings */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="p-5 rounded-2xl border bg-white dark:bg-[#1A1D21] border-gray-200/90 dark:border-white/10"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Revenue Kemitraan (Placement)
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
              Rp {stats.totalEarningsOrFeesIdr.toLocaleString('id-ID')}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              Total fee kampanye sponsor dan barter dinilai
            </div>
          </div>
        </motion.div>

        {/* Card 4: Total Partners Registered */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
          onClick={() => setStatusFilter('ALL')}
          className={`cursor-pointer p-5 rounded-2xl border transition-all ${
            statusFilter === 'ALL'
              ? 'ring-2 ring-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-800'
              : 'bg-white dark:bg-[#1A1D21] border-gray-200/90 dark:border-white/10 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Entitas Mitra
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {stats.totalPartners} Perusahaan
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              Agency, hotel, outdoor gear, F&B, dan transport
            </div>
          </div>
        </motion.div>
      </div>

      {/* Control Bar: Status Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Status Pill Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 overflow-x-auto max-w-full">
          {[
            { id: 'ALL', label: 'Semua Mitra', count: stats.totalPartners },
            { id: 'ACTIVE', label: 'Aktif', count: stats.activePartners },
            { id: 'PENDING', label: 'Pending', count: partners.filter((p) => p.status === 'PENDING').length },
            { id: 'SUSPENDED', label: 'Suspended', count: partners.filter((p) => p.status === 'SUSPENDED').length },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleStatusFilterChange(tab.id as StatusFilter)}
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
                      ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
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
            placeholder="Cari perusahaan, PIC, email..."
            className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                fetchData(1, pagination.pageSize, '', statusFilter);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>
      </div>

      {/* Main B2B Partners Table */}
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
                <th className="px-5 py-3.5 font-bold">Perusahaan Mitra</th>
                <th className="px-5 py-3.5 font-bold">Kontak Person (PIC)</th>
                <th className="px-5 py-3.5 font-bold">Kampanye & Kupon Perks</th>
                <th className="px-5 py-3.5 font-bold">Placement / Nilai Kerjasama</th>
                <th className="px-5 py-3.5 font-bold">Status</th>
                <th className="px-5 py-3.5 font-bold text-right">Moderasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-300">
              {filteredPartners.length > 0 ? (
                filteredPartners.map((item) => {
                  const isActiveStatus =
                    item.status === 'ACTIVE' || item.status === 'APPROVED';
                  const isPendingStatus = item.status === 'PENDING';
                  const isSuspendedStatus =
                    item.status === 'SUSPENDED' || item.status === 'PAUSED';

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Company Info */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3 min-w-[220px]">
                          <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                            {item.logoUrl ? (
                              <img
                                src={getPublicImageUrl(item.logoUrl, 'badges')}
                                alt={item.name}
                                className="w-full h-full object-cover rounded-xl"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <Building2 className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                              <span>{item.name}</span>
                              {item.websiteUrl && (
                                <a
                                  href={item.websiteUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-slate-400 hover:text-blue-500"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">
                                {item.category}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                #B2B-{item.id}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact PIC */}
                      <td className="px-5 py-4">
                        <div className="min-w-[180px] text-xs">
                          <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            <span>{item.contactPerson}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span className="truncate">{item.contactEmail}</span>
                          </div>
                          {item.contactPhone && (
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{item.contactPhone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Kampanye & Kupon Perks */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                          <span>{item.totalCampaigns} Kampanye Aktif</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {item.totalVouchersPool} Kupon Voucher ({item.totalBookingsReferred} Klaim)
                        </div>
                      </td>

                      {/* Placement Earnings */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 dark:text-white">
                          Rp {item.totalEarningsIdr.toLocaleString('id-ID')}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Total Gross Placement
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {isActiveStatus && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Aktif</span>
                          </span>
                        )}
                        {isPendingStatus && (
                          <div className="flex flex-col items-start gap-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-[11px] font-bold">
                              <span>Pending Review</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedDetailPartner(item)}
                              className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline inline-flex items-center gap-0.5"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Tinjau Aplikasi</span>
                            </button>
                          </div>
                        )}
                        {isSuspendedStatus && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold">
                            <span>Suspended</span>
                          </span>
                        )}
                        {item.status === 'REJECTED' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-[11px] font-semibold">
                            <span>Ditolak</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {/* View Detail & Review Button */}
                          <button
                            type="button"
                            onClick={() => setSelectedDetailPartner(item)}
                            className="p-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition"
                            title="Lihat detail lengkap & tinjau permohonan"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Approve Button for Pending */}
                          {isPendingStatus && (
                            <button
                              type="button"
                              onClick={() => handleApprovePartner(item.id)}
                              disabled={isPending}
                              className="p-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition"
                              title="Setujui Kemitraan (Approve)"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Edit Partner Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 rounded-xl border border-gray-200/90 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                            title="Edit data profil perusahaan"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Toggle Active / Suspended Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(item.id, item.status)}
                            disabled={isPending}
                            className={`p-1.5 rounded-xl border transition ${
                              isActiveStatus
                                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-600 hover:bg-amber-100'
                                : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-600 hover:bg-emerald-100'
                            }`}
                            title={isActiveStatus ? 'Suspend kemitraan' : 'Aktifkan kemitraan'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id, item.name)}
                            disabled={isPending}
                            className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-600 hover:bg-rose-100 transition"
                            title="Hapus / Putus kemitraan"
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
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <Building2 className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-2" />
                      <div className="font-bold text-slate-600 dark:text-slate-300">
                        Tidak ada data mitra B2B ditemukan
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Daftarkan partner baru atau sesuaikan filter pencarian di atas.
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

      {/* ADD / EDIT PARTNER MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#1A1D21] border border-slate-200 dark:border-white/10 p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-base">
                      {editingPartner ? 'Edit Data Mitra B2B' : 'Daftarkan Mitra B2B Baru'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Konfigurasikan detail perusahaan, kontak representatif, dan pembagian komisi.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
                {editingPartner && (
                  <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 flex items-start justify-between gap-3 text-xs">
                    <div>
                      <div className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                        <Gift className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Pool Kode Voucher &amp; Kampanye Brand</span>
                      </div>
                      <p className="text-indigo-700 dark:text-indigo-300 text-[11px] mt-0.5">
                        Mitra ini memiliki {editingPartner.totalCampaigns} kampanye ({editingPartner.totalVouchersPool} kode voucher). Untuk melihat dan menyalin kode voucher kasir, gunakan tombol <strong>Tinjau / Lihat Detail</strong> pada baris tabel atau kelola di menu Voucher Marketing.
                      </p>
                    </div>
                    <a
                      href={`/marketing/vouchers?tab=perks`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] shrink-0 inline-flex items-center gap-1 transition shadow-sm"
                    >
                      <span>Vouchers Perk</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {/* Company Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Perusahaan / Entitas Mitra <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Nusantara Corporate Travel"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Category & Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Kategori Kemitraan
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="CORPORATE">Corporate Travel</option>
                      <option value="TRAVEL_AGENCY">Travel Agency / DMC</option>
                      <option value="HOSPITALITY">Hospitality / Resort</option>
                      <option value="OUTDOOR_GEAR">Outdoor Equipment</option>
                      <option value="TRANSPORT">Transportation</option>
                      <option value="FNB">Food & Beverage</option>
                      <option value="INSURANCE">Travel Insurance</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Status Kemitraan
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ACTIVE">Aktif (ACTIVE)</option>
                      <option value="PENDING">Menunggu Review (PENDING)</option>
                      <option value="SUSPENDED">Ditangguhkan (SUSPENDED)</option>
                    </select>
                  </div>
                </div>

                {/* Contact PIC Name & Email */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nama PIC / Narahubung <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      placeholder="Contoh: Rangga Wijaya"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Email Resmi PIC <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      placeholder="partner@company.com"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Phone & Website */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nomor Telepon / WhatsApp
                    </label>
                    <input
                      type="text"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      placeholder="+62 812-3456-7890"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Website URL
                    </label>
                    <input
                      type="url"
                      value={formData.websiteUrl || ''}
                      onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                      placeholder="https://company.com"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Logo Image Upload via Drag & Drop */}
                <div>
                  <ImageUploadDropzone
                    folder="partners"
                    value={formData.logoUrl || ''}
                    onChange={(url: string) =>
                      setFormData((prev) => ({ ...prev, logoUrl: url }))
                    }
                    label="Logo Resmi Brand Mitra"
                    description="Seret & lepas berkas PNG transparan atau JPG/WebP logo perusahaan."
                  />
                  {formData.logoUrl && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-mono truncate max-w-xs">
                        {formData.logoUrl}
                      </span>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Profil Singkat / Catatan Perusahaan (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Catatan profil perusahaan, keunggulan produk/layanan, atau catatan internal kemitraan."
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Submit Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isPending}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/25"
                  >
                    {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{editingPartner ? 'Simpan Perubahan' : 'Daftarkan Mitra'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PARTNER DETAIL & APPLICATION REVIEW MODAL */}
      <AnimatePresence>
        {selectedDetailPartner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl rounded-3xl bg-white dark:bg-[#1A1D21] border border-slate-200 dark:border-white/10 p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 flex items-center justify-center overflow-hidden shrink-0">
                    {selectedDetailPartner.logoUrl ? (
                      <img
                        src={getPublicImageUrl(selectedDetailPartner.logoUrl, 'badges')}
                        alt={selectedDetailPartner.name}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <Building2 className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-slate-900 dark:text-white text-lg">
                        {selectedDetailPartner.name}
                      </h3>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">
                        {selectedDetailPartner.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      Partner ID: #B2B-{selectedDetailPartner.id} • Terdaftar pada{' '}
                      {new Date(selectedDetailPartner.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDetailPartner(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="mt-4 space-y-4">
                {/* Status Bar */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
                  <div>
                    <span className="text-xs font-bold text-slate-500 block">Status Kemitraan:</span>
                    <span className={`text-sm font-black uppercase ${
                      selectedDetailPartner.status === 'ACTIVE'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : selectedDetailPartner.status === 'PENDING'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {selectedDetailPartner.status === 'ACTIVE'
                        ? 'Aktif (Disetujui)'
                        : selectedDetailPartner.status === 'PENDING'
                        ? 'Pending Review (Menunggu Persetujuan)'
                        : selectedDetailPartner.status}
                    </span>
                  </div>
                  {/* Digital MoU badge */}
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>MoU Digital Terikat &amp; Sah</span>
                  </div>
                </div>

                {/* PIC & Company Contacts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 text-xs">
                  <div className="space-y-1.5">
                    <span className="text-slate-400 font-bold block uppercase text-[10px]">
                      Kontak PIC (Person in Charge)
                    </span>
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedDetailPartner.contactPerson}</span>
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <a
                        href={`mailto:${selectedDetailPartner.contactEmail}`}
                        className="hover:underline text-blue-600 dark:text-blue-400"
                      >
                        {selectedDetailPartner.contactEmail}
                      </a>
                    </div>
                    {selectedDetailPartner.contactPhone && (
                      <div className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <a
                          href={`tel:${selectedDetailPartner.contactPhone}`}
                          className="hover:underline text-blue-600 dark:text-blue-400"
                        >
                          {selectedDetailPartner.contactPhone}
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-slate-400 font-bold block uppercase text-[10px]">
                      Situs Web &amp; Profil
                    </span>
                    <div className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      {selectedDetailPartner.websiteUrl ? (
                        <a
                          href={selectedDetailPartner.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline text-blue-600 dark:text-blue-400 flex items-center gap-1 font-semibold truncate"
                        >
                          <span>{selectedDetailPartner.websiteUrl}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">Tidak ada website dicantumkan</span>
                      )}
                    </div>
                    <div className="pt-1">
                      <span className="text-slate-400 font-bold block uppercase text-[10px]">
                        Deskripsi Profil Perusahaan
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 text-xs mt-0.5">
                        {selectedDetailPartner.description || 'Tidak ada catatan tambahan.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submitted Campaigns & Vouchers */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Gift className="w-3.5 h-3.5 text-purple-600" />
                      <span>Kampanye Perks Yang Diajukan ({selectedDetailPartner.campaignsList?.length || 0})</span>
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      Total {selectedDetailPartner.totalVouchersPool} Kupon Disetor
                    </span>
                  </div>

                  {selectedDetailPartner.campaignsList && selectedDetailPartner.campaignsList.length > 0 ? (
                    <div className="space-y-2.5">
                      {selectedDetailPartner.campaignsList.map((camp) => (
                        <div
                          key={camp.id}
                          className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] space-y-2"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <span>{camp.title}</span>
                                {camp.isFeatured && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                                    FEATURED
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                                {camp.description}
                              </p>
                            </div>
                            <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 shrink-0">
                              {camp.tierPackage}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/60 dark:border-white/5 text-[11px]">
                            <div>
                              <span className="text-slate-400 block">Biaya Tukar:</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                {camp.costInLtp} LTP
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Min. Level XP:</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                Level {camp.minXpLevel}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Kuota Voucher:</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                {camp.totalQuota} Kupon ({camp.claimedQuota} Diklaim)
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Masa Berlaku:</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                s/d {new Date(camp.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                          </div>

                          {camp.terms && (
                            <div className="pt-1.5 text-[11px] text-slate-500 font-mono bg-white dark:bg-black/20 p-2.5 rounded-xl border border-slate-100 dark:border-white/5">
                              <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5 font-sans">
                                Syarat &amp; Ketentuan Penggunaan (T&amp;C):
                              </span>
                              <div className="whitespace-pre-line">{camp.terms}</div>
                            </div>
                          )}

                          {/* Pool Kode Voucher Kasir Section */}
                          <div className="pt-2 border-t border-slate-200/60 dark:border-white/5 space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                                  <Tag className="w-3.5 h-3.5 text-indigo-500" />
                                  <span>Pool Kode Voucher Kasir ({camp.vouchersList?.length || 0} Kode Disetor)</span>
                                </span>
                                {camp.vouchersList && camp.vouchersList.length > 0 && (
                                  <div className="flex items-center gap-1 text-[10px]">
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold">
                                      {camp.vouchersList.filter((v) => !v.isClaimed).length} Tersedia
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-bold">
                                      {camp.vouchersList.filter((v) => v.isClaimed).length} Terklaim
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                {camp.vouchersList && camp.vouchersList.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const allCodes = camp.vouchersList?.map((v) => v.code).join('\n') || '';
                                      handleCopy(allCodes, `camp-${camp.id}`);
                                    }}
                                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                                  >
                                    <Copy className="w-3 h-3" />
                                    <span>{copiedText === `camp-${camp.id}` ? 'Tersalin!' : 'Salin Semua'}</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowVouchersCampaignId(
                                      showVouchersCampaignId === camp.id ? null : camp.id
                                    )
                                  }
                                  className="text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:underline"
                                >
                                  {showVouchersCampaignId === camp.id ? 'Sembunyikan' : 'Buka Daftar Kode'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setTopUpCampaignId(topUpCampaignId === camp.id ? null : camp.id)
                                  }
                                  className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline"
                                >
                                  {topUpCampaignId === camp.id ? 'Batal Tambah' : '+ Top Up Voucher'}
                                </button>
                              </div>
                            </div>

                            {/* Expandable Vouchers List */}
                            {showVouchersCampaignId === camp.id && (
                              <div className="p-3 rounded-xl bg-white dark:bg-black/30 border border-slate-200 dark:border-white/10 max-h-40 overflow-y-auto">
                                {camp.vouchersList && camp.vouchersList.length > 0 ? (
                                  <div className="flex flex-wrap gap-1.5">
                                    {camp.vouchersList.map((v) => (
                                      <span
                                        key={v.id}
                                        className={`px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold border flex items-center gap-1.5 ${
                                          v.isClaimed
                                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 line-through'
                                            : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                        }`}
                                      >
                                        <span>{v.code}</span>
                                        <span className="text-[9px] font-sans no-underline opacity-70">
                                          {v.isClaimed ? 'Klaim' : 'Aktif'}
                                        </span>
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center text-xs text-slate-400 py-2">
                                    Belum ada kode voucher yang disetor untuk kampanye ini.
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Top Up Voucher Form */}
                            {topUpCampaignId === camp.id && (
                              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40 space-y-2">
                                <label className="block text-[11px] font-bold text-purple-900 dark:text-purple-200">
                                  Tambah Pool Kode Voucher Baru (Pisahkan baris atau koma):
                                </label>
                                <textarea
                                  rows={2}
                                  value={topUpCodesInput}
                                  onChange={(e) => setTopUpCodesInput(e.target.value)}
                                  placeholder={'CONTOH-KODE-101\nCONTOH-KODE-102'}
                                  className="w-full px-3 py-2 rounded-xl text-xs font-mono bg-white dark:bg-[#1A1D21] border border-purple-200 dark:border-purple-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTopUpCampaignId(null);
                                      setTopUpCodesInput('');
                                    }}
                                    className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-500 hover:bg-slate-100"
                                  >
                                    Batal
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleTopUpSubmit(camp.id)}
                                    disabled={isPending || !topUpCodesInput.trim()}
                                    className="px-3.5 py-1.5 rounded-lg text-[11px] font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-sm disabled:opacity-50 flex items-center gap-1"
                                  >
                                    {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                                    <span>Simpan Kode Tambahan</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                      Mitra ini belum memiliki kampanye perk atau didaftarkan secara manual oleh admin.
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-5 mt-5 border-t border-slate-100 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const p = selectedDetailPartner;
                      setSelectedDetailPartner(null);
                      handleOpenEditModal(p);
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Profil Perusahaan</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDetailPartner(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    Tutup
                  </button>

                  {selectedDetailPartner.status === 'PENDING' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleRejectPartner(selectedDetailPartner.id)}
                        disabled={isPending}
                        className="px-4 py-2 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 text-rose-600 hover:bg-rose-100 transition flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Tolak (Reject)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApprovePartner(selectedDetailPartner.id)}
                        disabled={isPending}
                        className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/25 transition flex items-center gap-1.5"
                      >
                        {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        <span>Setujui Kemitraan (Approve)</span>
                      </button>
                    </>
                  )}

                  {selectedDetailPartner.status === 'ACTIVE' && (
                    <button
                      type="button"
                      onClick={() => {
                        handleToggleStatus(selectedDetailPartner.id, 'ACTIVE');
                        setSelectedDetailPartner(null);
                      }}
                      disabled={isPending}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition flex items-center gap-1.5"
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>Suspend Kemitraan</span>
                    </button>
                  )}

                  {(selectedDetailPartner.status === 'SUSPENDED' || selectedDetailPartner.status === 'REJECTED') && (
                    <button
                      type="button"
                      onClick={() => handleApprovePartner(selectedDetailPartner.id)}
                      disabled={isPending}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Aktifkan Kembali</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
