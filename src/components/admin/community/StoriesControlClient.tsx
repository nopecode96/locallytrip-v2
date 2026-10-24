'use client';

import React, { useState, useTransition } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Search,
  Eye,
  Heart,
  MessageSquare,
  Clock,
  Sparkles,
  Trash2,
  ExternalLink,
  Loader2,
  Power,
  CheckCircle2,
  FileText,
  LayoutGrid,
  List,
} from 'lucide-react';
import Link from 'next/link';
import {
  AdminStoryItem,
  toggleStoryStatus,
  deleteStory,
  getAdminStories,
} from '@/actions/admin/community/stories';
import { getPublicImageUrl } from '@/lib/images';
import { resolveAvatarUrl } from '@/lib/avatar';
import { AdminPagination, PaginationState } from '@/components/admin/ui/AdminPagination';

interface StoriesControlClientProps {
  initialStories: AdminStoryItem[];
  initialPagination?: PaginationState;
  stats: {
    totalStories: number;
    publishedCount: number;
    draftCount: number;
    pendingReviewCount: number;
  };
}

const statusFilters = [
  { id: 'all', label: 'All Stories' },
  { id: 'published', label: 'Published' },
  { id: 'draft', label: 'Drafts' },
  { id: 'pending_review', label: 'Pending Review' },
];

export function StoriesControlClient({ initialStories, initialPagination, stats }: StoriesControlClientProps) {
  const [stories, setStories] = useState<AdminStoryItem[]>(initialStories);
  const [pagination, setPagination] = useState<PaginationState>(
    initialPagination || {
      totalItems: stats.totalStories || initialStories.length,
      totalPages: Math.ceil((stats.totalStories || initialStories.length) / 10) || 1,
      currentPage: 1,
      pageSize: 10,
    }
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [isPending, startTransition] = useTransition();
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const fetchData = (
    newPage: number,
    newPageSize: number = pagination.pageSize,
    searchVal: string = searchQuery,
    statusVal: string = selectedStatus
  ) => {
    startTransition(async () => {
      const res = await getAdminStories({
        page: newPage,
        pageSize: newPageSize,
        search: searchVal,
        status: statusVal,
      });
      if (res.success && res.stories) {
        setStories(res.stories);
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

  const handleStatusSelect = (statusId: string) => {
    setSelectedStatus(statusId);
    fetchData(1, pagination.pageSize, searchQuery, statusId);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData(1, pagination.pageSize, searchQuery, selectedStatus);
  };

  const filteredStories = stories.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.title.toLowerCase().includes(q) ||
      (s.excerpt && s.excerpt.toLowerCase().includes(q)) ||
      s.author.name.toLowerCase().includes(q);

    const matchesStatus =
      selectedStatus === 'all' || s.status.toLowerCase() === selectedStatus.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const handleToggleStatus = (story: AdminStoryItem) => {
    setActionLoadingId(story.id);
    startTransition(async () => {
      const res = await toggleStoryStatus(story.id, story.status);
      if (res.success && res.status) {
        setStories((prev) =>
          prev.map((s) => (s.id === story.id ? { ...s, status: res.status! } : s))
        );
      }
      setActionLoadingId(null);
    });
  };

  const handleDelete = (storyId: number) => {
    if (!confirm('Are you sure you want to delete this travel story?')) return;
    setActionLoadingId(storyId);
    startTransition(async () => {
      const res = await deleteStory(storyId);
      if (res.success) {
        setStories((prev) => prev.filter((s) => s.id !== storyId));
      }
      setActionLoadingId(null);
    });
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
            Stories & Journal Control
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Curate member-published travel narratives, engagement metrics, and status controls.
          </p>
        </div>

        {/* Telemetry chips */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
            {stats.publishedCount} Published
          </span>
          <span className="px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800">
            {stats.draftCount} Drafts
          </span>
          <span className="px-3 py-1.5 rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800">
            {stats.totalStories} Total Stories
          </span>
        </div>
      </div>

      {/* Filter, Search, and View Mode Toggle Bar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 transition-colors">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search story title, excerpt, author..."
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
          />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {statusFilters.map((opt) => {
              const isSelected = selectedStatus === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleStatusSelect(opt.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                    isSelected
                      ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Table / Grid Switcher */}
          <div className="flex items-center p-1 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-xl transition ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-purple-600 text-purple-600 dark:text-white shadow-xs'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-xl transition ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-purple-600 text-purple-600 dark:text-white shadow-xs'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content View: Table or Grid */}
      {viewMode === 'table' ? (
        <div className="rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-sm overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 dark:bg-white/5 text-gray-400 uppercase tracking-wider text-[10px] font-bold border-b border-gray-100 dark:border-white/5">
                <tr>
                  <th className="px-5 py-3.5">Story Content</th>
                  <th className="px-4 py-3.5">Author</th>
                  <th className="px-4 py-3.5">Views & Reads</th>
                  <th className="px-4 py-3.5">Engagement</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-gray-600 dark:text-gray-300">
                {filteredStories.length > 0 ? (
                  filteredStories.map((s) => {
                    const isLoading = actionLoadingId === s.id;

                    return (
                      <tr
                        key={s.id}
                        className="hover:bg-gray-50/70 dark:hover:bg-white/5 transition-colors group"
                      >
                        {/* Cover + Title + Excerpt */}
                        <td className="px-5 py-4 max-w-[280px]">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gray-100 dark:bg-white/5 shrink-0 border border-gray-200 dark:border-white/10">
                              {s.cover_image ? (
                                <img
                                  src={getPublicImageUrl(s.cover_image, 'stories')}
                                  alt={s.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.currentTarget;
                                    if (target.src !== '/images/default-story-cover.jpg') {
                                      target.src = '/images/default-story-cover.jpg';
                                    }
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <FileText className="w-5 h-5" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-gray-900 dark:text-white block truncate" title={s.title}>
                                {s.title}
                              </span>
                              <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">
                                {s.excerpt || 'No excerpt available.'}
                              </p>
                              <span className="text-[10px] text-gray-400 block mt-0.5">
                                {s.reading_time || 3} min read • #{s.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Author */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full overflow-hidden bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold text-[10px] flex items-center justify-center shrink-0 border border-purple-200/50 dark:border-purple-800/50">
                              <img
                                src={resolveAvatarUrl(s.author)}
                                alt={s.author.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  if (target.src !== '/images/default-avatar.png') {
                                    target.src = '/images/default-avatar.png';
                                  }
                                }}
                              />
                            </div>
                            <span className="font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[120px]">
                              {s.author.name}
                            </span>
                          </div>
                        </td>

                        {/* Views & Reads */}
                        <td className="px-4 py-4 font-semibold text-gray-800 dark:text-gray-200">
                          <div className="flex items-center gap-1.5">
                            <Eye className="w-3.5 h-3.5 text-gray-400" />
                            <span>{s.view_count.toLocaleString()}</span>
                          </div>
                        </td>

                        {/* Engagement (Likes & Comments) */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1 font-semibold">
                              <Heart className="w-3.5 h-3.5" />
                              {s.like_count}
                            </span>
                            <span className="text-purple-600 dark:text-purple-400 flex items-center gap-1 font-semibold">
                              <MessageSquare className="w-3.5 h-3.5" />
                              {s.comment_count}
                            </span>
                          </div>
                        </td>

                        {/* Fast Status Toggle (Draft <-> Published) */}
                        <td className="px-4 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(s)}
                            disabled={isLoading}
                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition border inline-flex items-center gap-1 ${
                              s.status === 'published'
                                ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-200'
                                : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:bg-gray-200'
                            }`}
                            title="Click to toggle Draft / Published"
                          >
                            {isLoading ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Power className="w-3 h-3" />
                            )}
                            <span>{s.status}</span>
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/stories/${s.slug}`}
                              target="_blank"
                              className="p-1.5 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-600 dark:text-gray-300 transition"
                              title="View story on public site"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>

                            <button
                              type="button"
                              onClick={() => handleDelete(s.id)}
                              disabled={isLoading}
                              className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-600 hover:text-white text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 transition"
                              title="Delete Story"
                            >
                              {isLoading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400 text-xs">
                      No travel stories found matching current filter parameters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStories.map((s) => {
            const isLoading = actionLoadingId === s.id;

            return (
              <div
                key={s.id}
                className="rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-sm overflow-hidden flex flex-col justify-between transition-colors group"
              >
                <div>
                  <div className="relative h-44 w-full bg-gray-100 dark:bg-white/5 overflow-hidden">
                    {s.cover_image ? (
                      <img
                        src={getPublicImageUrl(s.cover_image, 'stories')}
                        alt={s.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (target.src !== '/images/default-story-cover.jpg') {
                            target.src = '/images/default-story-cover.jpg';
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <FileText className="w-8 h-8" />
                      </div>
                    )}

                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm border ${
                          s.status === 'published'
                            ? 'bg-emerald-500 text-white border-emerald-400'
                            : 'bg-gray-900/80 text-white border-white/20'
                        }`}
                      >
                        {s.status}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-2.5">
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1" title={s.title}>
                      {s.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                      {s.excerpt || 'No excerpt available.'}
                    </p>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100 dark:border-white/5 text-gray-400">
                      <span>By {s.author.name}</span>
                      <div className="flex items-center gap-2 font-medium">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" /> {s.view_count}
                        </span>
                        <span className="flex items-center gap-1 text-rose-500">
                          <Heart className="w-3.5 h-3.5" /> {s.like_count}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-2 flex items-center justify-between border-t border-gray-100 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(s)}
                    disabled={isLoading}
                    className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center gap-1"
                  >
                    {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Power className="w-3 h-3" />}
                    <span>{s.status === 'published' ? 'Switch to Draft' : 'Publish Story'}</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/stories/${s.slug}`}
                      target="_blank"
                      className="p-1.5 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 text-gray-600 dark:text-gray-300 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(s.id)}
                      className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-600 hover:text-white transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Server-Side Pagination Bar */}
      <div className="rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-sm overflow-hidden transition-colors">
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
