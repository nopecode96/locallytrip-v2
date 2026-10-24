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
      setFormError('Name is required.');
      return;
    }

    setFormError(null);
    startTransition(async () => {
      if (modalType === 'forums') {
        if (!formSlug.trim()) {
          setFormError('Slug is required.');
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
          showToast('success', `Forum category saved.`);
          const updated = await getAdminForumCategories({ search });
          if (updated.success && updated.data) setForumCategories(updated.data);
        } else {
          setFormError(res.error || 'Failed to save');
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
          showToast('success', `Meetup & Experience category saved.`);
          const updated = await getAdminExperienceTypes({ search });
          if (updated.success && updated.data) setExperienceTypes(updated.data);
        } else {
          setFormError(res.error || 'Failed to save');
        }
      } else if (modalType === 'stories') {
        if (!formSlug.trim()) {
          setFormError('Slug is required.');
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
          showToast('success', `Story category saved.`);
          const updated = await getAdminStoryCategories({ search });
          if (updated.success && updated.data) setStoryCategories(updated.data);
        } else {
          setFormError(res.error || 'Failed to save');
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
          showToast('success', 'Forum category deleted.');
          const updated = await getAdminForumCategories({ search });
          if (updated.success && updated.data) setForumCategories(updated.data);
        } else {
          setDeleteError(res.error || 'Failed to delete');
        }
      } else if (deletingData.type === 'experiences') {
        res = await deleteExperienceType(deletingData.id);
        if (res.success) {
          setDeletingData(null);
          showToast('success', 'Experience category deleted.');
          const updated = await getAdminExperienceTypes({ search });
          if (updated.success && updated.data) setExperienceTypes(updated.data);
        } else {
          setDeleteError(res.error || 'Failed to delete');
        }
      } else if (deletingData.type === 'stories') {
        res = await deleteStoryCategory(deletingData.id);
        if (res.success) {
          setDeletingData(null);
          showToast('success', 'Story category deleted.');
          const updated = await getAdminStoryCategories({ search });
          if (updated.success && updated.data) setStoryCategories(updated.data);
        } else {
          setDeleteError(res.error || 'Failed to delete');
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
    <div className="space-y-6">
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md border ${
              toastMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span className="text-sm font-medium">{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Taxonomy & Category Master</h1>
            <p className="text-sm text-zinc-400">
              Configure content categories, badges, risk parameters, and grouping classifications.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => openCreateModal(activeTab)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-400 hover:to-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-violet-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add {activeTab === 'forums' ? 'Forum' : activeTab === 'experiences' ? 'Meetup' : 'Story'} Category
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 p-1.5 rounded-xl bg-zinc-900/60 border border-zinc-800 w-fit">
        <button
          onClick={() => {
            setActiveTab('forums');
            setSearch('');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'forums'
              ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-cyan-400" />
          Discussion Forums
          <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-zinc-950 text-zinc-400 border border-zinc-800">
            {forumCategories.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('experiences');
            setSearch('');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'experiences'
              ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <Calendar className="w-4 h-4 text-amber-400" />
          Meetups & Experiences
          <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-zinc-950 text-zinc-400 border border-zinc-800">
            {experienceTypes.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('stories');
            setSearch('');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'stories'
              ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <BookOpen className="w-4 h-4 text-emerald-400" />
          Stories & Journals
          <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-zinc-950 text-zinc-400 border border-zinc-800">
            {storyCategories.length}
          </span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-zinc-950/60 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>

        <div className="text-xs text-zinc-400">
          {activeTab === 'forums' && `${filteredForums.length} forum categories`}
          {activeTab === 'experiences' && `${filteredExperiences.length} meetup & experience types`}
          {activeTab === 'stories' && `${filteredStories.length} story categories`}
        </div>
      </div>

      {/* TAB 1: FORUMS */}
      {activeTab === 'forums' && (
        <div className="rounded-2xl bg-zinc-900/40 border border-zinc-800 overflow-hidden">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[11px] tracking-wider border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4">Forum Category</th>
                <th className="px-6 py-4">Slug Identifier</th>
                <th className="px-6 py-4">Display Order</th>
                <th className="px-6 py-4">Active Threads</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredForums.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                    No forum categories found.
                  </td>
                </tr>
              ) : (
                filteredForums.map((cat) => (
                  <tr key={cat.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-white flex items-center gap-2">
                          {cat.icon && <span className="text-base">{cat.icon}</span>}
                          {cat.name}
                        </div>
                        {cat.description && (
                          <p className="text-xs text-zinc-500 line-clamp-1 max-w-sm mt-0.5">
                            {cat.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded text-xs font-mono bg-zinc-800 text-zinc-400">
                        {cat.slug}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-zinc-400">{cat.displayOrder}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-zinc-300">
                        <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="font-semibold">{cat.threadCount}</span>
                        <span className="text-zinc-500">threads</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          cat.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-zinc-800 text-zinc-500'
                        }`}
                      >
                        {cat.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal('forums', cat)}
                          className="p-2 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors border border-zinc-700/50"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            setDeletingData({ id: cat.id, type: 'forums', name: cat.name })
                          }
                          className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors border border-rose-500/20"
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
        </div>
      )}

      {/* TAB 2: EXPERIENCES / MEETUPS */}
      {activeTab === 'experiences' && (
        <div className="rounded-2xl bg-zinc-900/40 border border-zinc-800 overflow-hidden">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[11px] tracking-wider border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4">Category Name</th>
                <th className="px-6 py-4">Theme Color</th>
                <th className="px-6 py-4">Sort Order</th>
                <th className="px-6 py-4">Risk Level</th>
                <th className="px-6 py-4">Bound Records</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredExperiences.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                    No meetup or experience types found.
                  </td>
                </tr>
              ) : (
                filteredExperiences.map((type) => (
                  <tr key={type.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-white flex items-center gap-2">
                          {type.icon && <span>{type.icon}</span>}
                          {type.name}
                        </div>
                        {type.description && (
                          <p className="text-xs text-zinc-500 line-clamp-1 max-w-sm mt-0.5">
                            {type.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                          style={{ backgroundColor: type.color || '#6366f1' }}
                        />
                        <span className="text-xs font-mono text-zinc-400">{type.color || 'Default'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-zinc-400">{type.sortOrder}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded text-xs font-mono bg-zinc-800/80 border border-zinc-700 text-zinc-300">
                        {type.riskLevel || 'LOW'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 text-xs text-zinc-300">
                        <span>{type.experiencesCount} tours</span>
                        <span className="text-zinc-600">•</span>
                        <span>{type.meetupsCount} meetups</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          type.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-zinc-800 text-zinc-500'
                        }`}
                      >
                        {type.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal('experiences', type)}
                          className="p-2 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors border border-zinc-700/50"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            setDeletingData({ id: type.id, type: 'experiences', name: type.name })
                          }
                          className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors border border-rose-500/20"
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
        </div>
      )}

      {/* TAB 3: STORIES */}
      {activeTab === 'stories' && (
        <div className="rounded-2xl bg-zinc-900/40 border border-zinc-800 overflow-hidden">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[11px] tracking-wider border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4">Story Category</th>
                <th className="px-6 py-4">Slug Identifier</th>
                <th className="px-6 py-4">Theme Color</th>
                <th className="px-6 py-4">Sort Order</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredStories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                    No story categories found.
                  </td>
                </tr>
              ) : (
                filteredStories.map((story) => (
                  <tr key={story.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-white flex items-center gap-2">
                          {story.icon && <span>{story.icon}</span>}
                          {story.name}
                        </div>
                        {story.description && (
                          <p className="text-xs text-zinc-500 line-clamp-1 max-w-sm mt-0.5">
                            {story.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded text-xs font-mono bg-zinc-800 text-zinc-400">
                        {story.slug}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                          style={{ backgroundColor: story.color || '#10b981' }}
                        />
                        <span className="text-xs font-mono text-zinc-400">{story.color || 'Default'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-zinc-400">{story.sortOrder}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          story.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-zinc-800 text-zinc-500'
                        }`}
                      >
                        {story.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal('stories', story)}
                          className="p-2 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors border border-zinc-700/50"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            setDeletingData({ id: story.id, type: 'stories', name: story.name })
                          }
                          className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors border border-rose-500/20"
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
        </div>
      )}

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {modalType && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
                <h3 className="font-semibold text-white">
                  {editingItem ? 'Edit Category' : 'Create Category'} (
                  {modalType === 'forums'
                    ? 'Forums'
                    : modalType === 'experiences'
                    ? 'Meetups & Experiences'
                    : 'Stories'}
                  )
                </h3>
                <button
                  onClick={() => setModalType(null)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4">
                {formError && (
                  <div className="flex items-center gap-2 p-3 text-xs rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Category Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Culinary Walks, Solo Backpacking"
                    className="w-full px-3.5 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
                  />
                </div>

                {modalType !== 'experiences' && (
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      URL Slug <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formSlug}
                      onChange={(e) => setFormSlug(e.target.value)}
                      placeholder="e.g. culinary-walks"
                      className="w-full px-3.5 py-2 text-sm font-mono bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Icon (Emoji or text)
                    </label>
                    <input
                      type="text"
                      value={formIcon}
                      onChange={(e) => setFormIcon(e.target.value)}
                      placeholder="🍜 or compass"
                      className="w-full px-3.5 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Display Sort Order
                    </label>
                    <input
                      type="number"
                      value={formSortOrder}
                      onChange={(e) => setFormSortOrder(parseInt(e.target.value, 10) || 0)}
                      placeholder="0"
                      className="w-full px-3.5 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                {modalType !== 'forums' && (
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Theme Color (Hex)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={formColor}
                        onChange={(e) => setFormColor(e.target.value)}
                        className="w-10 h-10 rounded-lg bg-zinc-950 border border-zinc-800 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={formColor}
                        onChange={(e) => setFormColor(e.target.value)}
                        placeholder="#0ea5e9"
                        className="flex-1 px-3.5 py-2 text-sm font-mono bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-violet-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Brief description of this category..."
                    className="w-full px-3.5 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 resize-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="cat_active"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="rounded border-zinc-800 text-violet-500 focus:ring-violet-500 bg-zinc-950 w-4 h-4"
                  />
                  <label htmlFor="cat_active" className="text-sm text-zinc-300 cursor-pointer">
                    Active (visible in public category filters and creation forms)
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    {editingItem ? 'Save Changes' : 'Create Category'}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6 space-y-4"
            >
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>

              <div className="text-center">
                <h3 className="font-semibold text-white">Delete &ldquo;{deletingData.name}&rdquo;?</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Cannot delete if active posts, tours, or meetups are bound to this category.
                </p>
              </div>

              {deleteError && (
                <div className="flex items-start gap-2 p-3 text-xs rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingData(null)}
                  className="flex-1 py-2 text-sm text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleDelete}
                  className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
