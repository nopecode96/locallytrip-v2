'use client';

import React, { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  MessageSquare,
  Calendar,
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  Sparkles,
  ShieldAlert,
  Hash,
  Check,
  Compass,
} from 'lucide-react';
import {
  AdminForumCategoryItem,
  AdminExperienceTypeItem,
  AdminStoryCategoryItem,
  createForumCategory,
  updateForumCategory,
  deleteForumCategory,
  getAdminForumCategories,
  createExperienceType,
  updateExperienceType,
  deleteExperienceType,
  getAdminExperienceTypes,
  createStoryCategory,
  updateStoryCategory,
  deleteStoryCategory,
  getAdminStoryCategories,
} from '@/actions/admin/master';
import { ImageUploadDropzone } from '@/components/shared/ImageUploadDropzone';

interface CategoriesControlClientProps {
  initialForumCategories: AdminForumCategoryItem[];
  initialExperienceTypes: AdminExperienceTypeItem[];
  initialStoryCategories: AdminStoryCategoryItem[];
}

type TabType = 'forums' | 'experiences' | 'stories';

export function CategoriesControlClient({
  initialForumCategories,
  initialExperienceTypes,
  initialStoryCategories,
}: CategoriesControlClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>('forums');
  const [forumCategories, setForumCategories] = useState<AdminForumCategoryItem[]>(initialForumCategories);
  const [experienceTypes, setExperienceTypes] = useState<AdminExperienceTypeItem[]>(initialExperienceTypes);
  const [storyCategories, setStoryCategories] = useState<AdminStoryCategoryItem[]>(initialStoryCategories);
  const [search, setSearch] = useState('');
  const [isPending, startTransition] = useTransition();

  // Modal states
  const [modalType, setModalType] = useState<TabType | null>(null);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIcon, setFormIcon] = useState('');
  const [formColor, setFormColor] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formRiskLevel, setFormRiskLevel] = useState('LOW');
  const [formSortOrder, setFormSortOrder] = useState<number>(0);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete modal
  const [deletingData, setDeletingData] = useState<{ id: number; type: TabType; name: string } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Auto-generate slug when name changes for create mode
  const handleNameChange = (val: string) => {
    setFormName(val);
    if (!editingItem) {
      setFormSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
  };

  const openCreateModal = (type: TabType) => {
    setModalType(type);
    setEditingItem(null);
    setFormName('');
    setFormSlug('');
    setFormDescription('');
    setFormIcon('');
    setFormColor('#0ea5e9');
    setFormImageUrl('');
    setFormRiskLevel('LOW');
    setFormSortOrder(0);
    setFormIsActive(true);
    setFormError(null);
  };

  const openEditModal = (type: TabType, item: any) => {
    setModalType(type);
    setEditingItem(item);
    setFormName(item.name);
    setFormSlug(item.slug || '');
    setFormDescription(item.description || '');
    setFormIcon(item.icon || '');
    setFormColor(item.color || '#0ea5e9');
    setFormImageUrl(item.imageUrl || '');
    setFormRiskLevel(item.riskLevel || 'LOW');
    setFormSortOrder(item.sortOrder ?? item.displayOrder ?? 0);
    setFormIsActive(item.isActive);
    setFormError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Nama kategori wajib diisi.');
      return;
    }

    setFormError(null);
    startTransition(async () => {
      if (modalType === 'forums') {
        if (!formSlug.trim()) {
          setFormError('Slug identifier wajib diisi.');
          return;
        }
        const payload = {
          name: formName.trim(),
          slug: formSlug.trim(),
          description: formDescription.trim() || null,
          icon: formIcon.trim() || null,
          display_order: Number(formSortOrder) || 0,
          is_active: formIsActive,
        };

        const res = editingItem
          ? await updateForumCategory(editingItem.id, payload)
          : await createForumCategory(payload);

        if (res.success) {
          setModalType(null);
          showToast('success', `Kategori forum diskusi berhasil disimpan.`);
          const updated = await getAdminForumCategories({ search });
          if (updated.success && updated.data) setForumCategories(updated.data);
        } else {
          setFormError(res.error || 'Gagal menyimpan kategori forum.');
        }
      } else if (modalType === 'experiences') {
        const payload = {
          name: formName.trim(),
          description: formDescription.trim() || null,
          icon: formIcon.trim() || null,
          color: formColor.trim() || null,
          image_url: formImageUrl.trim() || null,
          sort_order: Number(formSortOrder) || 0,
          risk_level: formRiskLevel,
          is_active: formIsActive,
        };

        const res = editingItem
          ? await updateExperienceType(editingItem.id, payload)
          : await createExperienceType(payload);

        if (res.success) {
          setModalType(null);
          showToast('success', `Kategori aktivitas tur & meetup berhasil disimpan.`);
          const updated = await getAdminExperienceTypes({ search });
          if (updated.success && updated.data) setExperienceTypes(updated.data);
        } else {
          setFormError(res.error || 'Gagal menyimpan kategori pengalaman.');
        }
      } else if (modalType === 'stories') {
        if (!formSlug.trim()) {
          setFormError('Slug identifier wajib diisi.');
          return;
        }
        const payload = {
          name: formName.trim(),
          slug: formSlug.trim(),
          description: formDescription.trim() || null,
          icon: formIcon.trim() || null,
          color: formColor.trim() || null,
          image_url: formImageUrl.trim() || null,
          sort_order: Number(formSortOrder) || 0,
          is_active: formIsActive,
        };

        const res = editingItem
          ? await updateStoryCategory(editingItem.id, payload)
          : await createStoryCategory(payload);

        if (res.success) {
          setModalType(null);
          showToast('success', `Kategori cerita jurnal berhasil disimpan.`);
          const updated = await getAdminStoryCategories({ search });
          if (updated.success && updated.data) setStoryCategories(updated.data);
        } else {
          setFormError(res.error || 'Gagal menyimpan kategori cerita.');
        }
      }
    });
  };

  const handleDelete = async () => {
    if (!deletingData) return;
    setDeleteError(null);
    startTransition(async () => {
      let res: { success: boolean; error?: string };
      if (deletingData.type === 'forums') {
        res = await deleteForumCategory(deletingData.id);
        if (res.success) {
          setDeletingData(null);
          showToast('success', 'Kategori forum berhasil dihapus.');
          const updated = await getAdminForumCategories({ search });
          if (updated.success && updated.data) setForumCategories(updated.data);
        } else {
          setDeleteError(res.error || 'Gagal menghapus kategori forum.');
        }
      } else if (deletingData.type === 'experiences') {
        res = await deleteExperienceType(deletingData.id);
        if (res.success) {
          setDeletingData(null);
          showToast('success', 'Kategori aktivitas tur berhasil dihapus.');
          const updated = await getAdminExperienceTypes({ search });
          if (updated.success && updated.data) setExperienceTypes(updated.data);
        } else {
          setDeleteError(res.error || 'Gagal menghapus kategori pengalaman.');
        }
      } else if (deletingData.type === 'stories') {
        res = await deleteStoryCategory(deletingData.id);
        if (res.success) {
          setDeletingData(null);
          showToast('success', 'Kategori cerita berhasil dihapus.');
          const updated = await getAdminStoryCategories({ search });
          if (updated.success && updated.data) setStoryCategories(updated.data);
        } else {
          setDeleteError(res.error || 'Gagal menghapus kategori cerita.');
        }
      }
    });
  };

  // Filter items in active tab by search string
  const filteredForums = forumCategories.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.slug.toLowerCase().includes(search.toLowerCase()) ||
      (f.description && f.description.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredExperiences = experienceTypes.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      (e.description && e.description.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredStories = storyCategories.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.slug.toLowerCase().includes(search.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl backdrop-blur-xl border text-xs sm:text-sm font-semibold ${
              toastMessage.type === 'success'
                ? 'bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50/95 dark:bg-rose-950/90 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 text-xs font-semibold mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>Master Taksonomi & Klasifikasi Platform</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Kategori & Taksonomi Konten
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Konfigurasi klasifikasi forum diskusi, kategori tur pengalaman & meetup, dan jurnal cerita petualang.
          </p>
        </div>

        {/* Global Header Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => openCreateModal(activeTab)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md shadow-violet-500/25 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>
              Tambah Kategori {activeTab === 'forums' ? 'Forum' : activeTab === 'experiences' ? 'Pengalaman' : 'Cerita'}
            </span>
          </button>
        </div>
      </motion.div>

      {/* Telemetry Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Forums */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          onClick={() => setActiveTab('forums')}
          className={`cursor-pointer p-5 rounded-2xl border transition-all shadow-sm ${
            activeTab === 'forums'
              ? 'ring-2 ring-violet-500 bg-violet-50/50 dark:bg-violet-950/20 border-violet-300 dark:border-violet-800'
              : 'bg-white dark:bg-[#1A1D21] border-gray-200/90 dark:border-white/10 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Forum Komunitas
            </span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {forumCategories.length} Kategori
            </div>
            <div className="text-xs text-cyan-600 dark:text-cyan-400 font-semibold mt-1">
              {forumCategories.reduce((acc, curr) => acc + (curr.threadCount || 0), 0)} Total thread diskusi aktif
            </div>
          </div>
        </motion.div>

        {/* Card 2: Experiences & Meetups */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          onClick={() => setActiveTab('experiences')}
          className={`cursor-pointer p-5 rounded-2xl border transition-all shadow-sm ${
            activeTab === 'experiences'
              ? 'ring-2 ring-amber-500 bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
              : 'bg-white dark:bg-[#1A1D21] border-gray-200/90 dark:border-white/10 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Tur & Meetup
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {experienceTypes.length} Tipe
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              Klasifikasi aktivitas dan parameter risiko
            </div>
          </div>
        </motion.div>

        {/* Card 3: Stories & Journals */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          onClick={() => setActiveTab('stories')}
          className={`cursor-pointer p-5 rounded-2xl border transition-all shadow-sm ${
            activeTab === 'stories'
              ? 'ring-2 ring-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
              : 'bg-white dark:bg-[#1A1D21] border-gray-200/90 dark:border-white/10 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Cerita & Jurnal
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {storyCategories.length} Kategori
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              Tagging dan grouping artikel traveler
            </div>
          </div>
        </motion.div>
      </div>

      {/* Control Bar: Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Status Pill Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 overflow-x-auto max-w-full">
          {[
            { id: 'forums', label: 'Diskusi Forum', icon: MessageSquare, count: forumCategories.length },
            { id: 'experiences', label: 'Meetups & Experiences', icon: Calendar, count: experienceTypes.length },
            { id: 'stories', label: 'Cerita & Jurnal', icon: BookOpen, count: storyCategories.length },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as TabType);
                  setSearch('');
                }}
                className={`relative px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
                  isActive
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                    isActive
                      ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300'
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
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kategori atau identifier..."
            className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition shadow-sm"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Table Container */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border border-gray-200/90 dark:border-white/10 bg-white dark:bg-[#1A1D21] shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          {/* TAB 1: FORUMS */}
          {activeTab === 'forums' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-gray-200/90 dark:border-white/10">
                <tr>
                  <th className="px-5 py-3.5 font-bold">Kategori Forum</th>
                  <th className="px-5 py-3.5 font-bold">Slug URL</th>
                  <th className="px-5 py-3.5 font-bold">Urutan Tampil</th>
                  <th className="px-5 py-3.5 font-bold">Thread Aktif</th>
                  <th className="px-5 py-3.5 font-bold">Status</th>
                  <th className="px-5 py-3.5 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-300">
                {filteredForums.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      Tidak ada kategori forum yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredForums.map((cat) => (
                    <tr key={cat.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 flex items-center justify-center text-base shrink-0 shadow-sm">
                            {cat.icon || '💬'}
                          </span>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white text-sm block">
                              {cat.name}
                            </span>
                            {cat.description && (
                              <p className="text-[11px] text-slate-400 line-clamp-1 max-w-sm mt-0.5">
                                {cat.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {cat.slug}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-xs text-slate-500">
                        #{cat.displayOrder}
                      </td>
                      <td className="px-5 py-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/40 font-bold text-xs">
                          <MessageSquare className="w-3 h-3 text-cyan-500" />
                          <span>{cat.threadCount} Thread</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                            cat.isActive
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${cat.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          <span>{cat.isActive ? 'Aktif' : 'Nonaktif'}</span>
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal('forums', cat)}
                            className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-violet-50 dark:hover:bg-violet-950/40 text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 transition border border-gray-200/90 dark:border-white/10"
                            title="Edit Kategori"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              setDeletingData({ id: cat.id, type: 'forums', name: cat.name })
                            }
                            className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 transition border border-rose-200 dark:border-rose-800"
                            title="Hapus Kategori"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* TAB 2: EXPERIENCES / MEETUPS */}
          {activeTab === 'experiences' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-gray-200/90 dark:border-white/10">
                <tr>
                  <th className="px-5 py-3.5 font-bold">Nama Kategori</th>
                  <th className="px-5 py-3.5 font-bold">Warna Tema</th>
                  <th className="px-5 py-3.5 font-bold">Urutan</th>
                  <th className="px-5 py-3.5 font-bold">Tingkat Risiko</th>
                  <th className="px-5 py-3.5 font-bold">Keterikatan Rekor</th>
                  <th className="px-5 py-3.5 font-bold">Status</th>
                  <th className="px-5 py-3.5 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-300">
                {filteredExperiences.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      Tidak ada tipe pengalaman tur yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredExperiences.map((type) => (
                    <tr key={type.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 shadow-sm border border-slate-200 dark:border-white/10"
                            style={{ backgroundColor: `${type.color || '#6366f1'}15`, color: type.color || '#6366f1' }}
                          >
                            {type.icon || '🎒'}
                          </span>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white text-sm block">
                              {type.name}
                            </span>
                            {type.description && (
                              <p className="text-[11px] text-slate-400 line-clamp-1 max-w-sm mt-0.5">
                                {type.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-4 h-4 rounded-full border border-black/10 shadow-sm"
                            style={{ backgroundColor: type.color || '#6366f1' }}
                          />
                          <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                            {type.color || 'Default'}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-xs text-slate-500">
                        #{type.sortOrder}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-bold border ${
                          type.riskLevel === 'HIGH'
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                            : type.riskLevel === 'MEDIUM'
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        }`}>
                          {type.riskLevel || 'LOW'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-bold text-[11px] border border-teal-200 dark:border-teal-800/40">
                            <Compass className="w-3 h-3 text-teal-500" />
                            {type.experiencesCount} Tur
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold text-[11px] border border-amber-200 dark:border-amber-800/40">
                            <Calendar className="w-3 h-3 text-amber-500" />
                            {type.meetupsCount} Meetup
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                            type.isActive
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${type.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          <span>{type.isActive ? 'Aktif' : 'Nonaktif'}</span>
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal('experiences', type)}
                            className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 transition border border-gray-200/90 dark:border-white/10"
                            title="Edit Tipe"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              setDeletingData({ id: type.id, type: 'experiences', name: type.name })
                            }
                            className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 transition border border-rose-200 dark:border-rose-800"
                            title="Hapus Tipe"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* TAB 3: STORIES */}
          {activeTab === 'stories' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-gray-200/90 dark:border-white/10">
                <tr>
                  <th className="px-5 py-3.5 font-bold">Kategori Cerita</th>
                  <th className="px-5 py-3.5 font-bold">Slug Identifier</th>
                  <th className="px-5 py-3.5 font-bold">Warna Aksen</th>
                  <th className="px-5 py-3.5 font-bold">Urutan</th>
                  <th className="px-5 py-3.5 font-bold">Status</th>
                  <th className="px-5 py-3.5 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-300">
                {filteredStories.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      Tidak ada kategori cerita jurnal yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredStories.map((story) => (
                    <tr key={story.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 shadow-sm border border-slate-200 dark:border-white/10"
                            style={{ backgroundColor: `${story.color || '#10b981'}15`, color: story.color || '#10b981' }}
                          >
                            {story.icon || '📖'}
                          </span>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white text-sm block">
                              {story.name}
                            </span>
                            {story.description && (
                              <p className="text-[11px] text-slate-400 line-clamp-1 max-w-sm mt-0.5">
                                {story.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {story.slug}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-4 h-4 rounded-full border border-black/10 shadow-sm"
                            style={{ backgroundColor: story.color || '#10b981' }}
                          />
                          <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                            {story.color || 'Default'}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-xs text-slate-500">
                        #{story.sortOrder}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                            story.isActive
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${story.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          <span>{story.isActive ? 'Aktif' : 'Nonaktif'}</span>
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal('stories', story)}
                            className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition border border-gray-200/90 dark:border-white/10"
                            title="Edit Kategori"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              setDeletingData({ id: story.id, type: 'stories', name: story.name })
                            }
                            className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 transition border border-rose-200 dark:border-rose-800"
                            title="Hapus Kategori"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {modalType && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {editingItem ? 'Edit Kategori' : 'Tambah Kategori Baru'} (
                    {modalType === 'forums'
                      ? 'Forum Diskusi'
                      : modalType === 'experiences'
                      ? 'Tur & Meetup'
                      : 'Cerita Jurnal'}
                    )
                  </h3>
                </div>
                <button
                  onClick={() => setModalType(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1">
                {formError && (
                  <div className="flex items-center gap-2 p-3 text-xs rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nama Kategori <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Contoh: Kuliner Lokal, Hiking & Trekking"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                  />
                </div>

                {modalType !== 'experiences' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Slug URL <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formSlug}
                      onChange={(e) => setFormSlug(e.target.value)}
                      placeholder="contoh: kuliner-lokal"
                      className="w-full px-3.5 py-2.5 text-xs font-mono font-bold rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Icon Simbol (Emoji)
                    </label>
                    <input
                      type="text"
                      value={formIcon}
                      onChange={(e) => setFormIcon(e.target.value)}
                      placeholder="🍜 atau 🎒"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Urutan Tampil (Sort Order)
                    </label>
                    <input
                      type="number"
                      value={formSortOrder}
                      onChange={(e) => setFormSortOrder(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 text-xs font-mono font-bold rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition text-center"
                    />
                  </div>
                </div>

                {modalType !== 'forums' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Warna Aksen Tema
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={formColor || '#6366f1'}
                        onChange={(e) => setFormColor(e.target.value)}
                        className="w-10 h-10 rounded-xl border border-gray-200 dark:border-white/10 cursor-pointer bg-transparent p-1"
                      />
                      <input
                        type="text"
                        value={formColor}
                        onChange={(e) => setFormColor(e.target.value)}
                        placeholder="#6366f1"
                        className="flex-1 px-3.5 py-2.5 text-xs font-mono font-bold rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                      />
                    </div>
                  </div>
                )}

                {modalType === 'experiences' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Tingkat Risiko Aktivitas
                    </label>
                    <select
                      value={formRiskLevel}
                      onChange={(e) => setFormRiskLevel(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs font-bold rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition cursor-pointer"
                    >
                      <option value="LOW">Rendah (Santai, Tur Budaya, Kuliner)</option>
                      <option value="MEDIUM">Menengah (Walking Tour, Bersepeda, Outdoor)</option>
                      <option value="HIGH">Tinggi (Hiking Gunung, Rafting, Diving)</option>
                    </select>
                  </div>
                )}

                {modalType !== 'forums' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Visual Banner Kategori (Opsional)
                    </label>
                    <ImageUploadDropzone
                      value={formImageUrl}
                      onChange={(url) => setFormImageUrl(url)}
                      folder="categories"
                      label="Unggah Banner Kategori"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Deskripsi Kategori
                  </label>
                  <textarea
                    rows={3}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Tuliskan cakupan kategori ini..."
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsActive}
                      onChange={(e) => setFormIsActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-violet-600"></div>
                  </label>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Aktifkan kategori ini di platform
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl shadow-md shadow-violet-500/25 transition disabled:opacity-50"
                  >
                    {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{editingItem ? 'Simpan Perubahan' : 'Buat Kategori'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-2xl p-6 space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>

              <div className="text-center">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Hapus Kategori Ini?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Yakin ingin menghapus kategori &ldquo;{deletingData.name}&rdquo;? Data yang sudah terhubung dengan kategori ini mungkin akan terpengaruh.
                </p>
              </div>

              {deleteError && (
                <div className="flex items-start gap-2 p-3 text-xs rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingData(null)}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleDelete}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md shadow-rose-600/25 transition disabled:opacity-50"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Konfirmasi Hapus</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
