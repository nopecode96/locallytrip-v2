'use client';

import React, { useState, useTransition } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Pin,
  Lock,
  Unlock,
  Eye,
  MessageCircle,
  ThumbsUp,
  Search,
  Trash2,
  ExternalLink,
  Loader2,
  Clock,
  Sparkles,
  Tag,
} from 'lucide-react';
import Link from 'next/link';
import {
  AdminForumThreadItem,
  toggleThreadPinned,
  toggleThreadLocked,
  deleteThread,
  getAdminForumThreads,
} from '@/actions/admin/community/forums';
import { getPublicImageUrl } from '@/lib/images';
import { AdminPagination, PaginationState } from '@/components/admin/ui/AdminPagination';

interface ForumsControlClientProps {
  initialThreads: AdminForumThreadItem[];
  initialPagination?: PaginationState;
  categories: { id: number; name: string; slug: string }[];
  stats: {
    totalThreads: number;
    pinnedCount: number;
    lockedCount: number;
    totalPosts: number;
  };
}

export function ForumsControlClient({
  initialThreads,
  initialPagination,
  categories,
  stats,
}: ForumsControlClientProps) {
  const [threads, setThreads] = useState<AdminForumThreadItem[]>(initialThreads);
  const [pagination, setPagination] = useState<PaginationState>(
    initialPagination || {
      totalItems: stats.totalThreads || initialThreads.length,
      totalPages: Math.ceil((stats.totalThreads || initialThreads.length) / 10) || 1,
      currentPage: 1,
      pageSize: 10,
    }
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isPending, startTransition] = useTransition();
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const fetchData = (
    newPage: number,
    newPageSize: number = pagination.pageSize,
    searchVal: string = searchQuery,
    categoryVal: string = selectedCategory
  ) => {
    startTransition(async () => {
      const res = await getAdminForumThreads({
        page: newPage,
        pageSize: newPageSize,
        search: searchVal,
        category: categoryVal,
      });
      if (res.success && res.threads) {
        setThreads(res.threads);
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

  const handleCategorySelect = (categorySlug: string) => {
    setSelectedCategory(categorySlug);
    fetchData(1, pagination.pageSize, searchQuery, categorySlug);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData(1, pagination.pageSize, searchQuery, selectedCategory);
  };

  const filteredThreads = threads.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      t.title.toLowerCase().includes(q) ||
      t.content.toLowerCase().includes(q) ||
      t.author.name.toLowerCase().includes(q);

    const matchesCategory =
      selectedCategory === 'all' || t.category.slug === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleTogglePinned = (thread: AdminForumThreadItem) => {
    setActionLoadingId(thread.id);
    startTransition(async () => {
      const res = await toggleThreadPinned(thread.id, thread.is_pinned);
      if (res.success) {
        setThreads((prev) =>
          prev.map((t) => (t.id === thread.id ? { ...t, is_pinned: !t.is_pinned } : t))
        );
      }
      setActionLoadingId(null);
    });
  };

  const handleToggleLocked = (thread: AdminForumThreadItem) => {
    setActionLoadingId(thread.id);
    startTransition(async () => {
      const res = await toggleThreadLocked(thread.id, thread.is_locked);
      if (res.success) {
        setThreads((prev) =>
          prev.map((t) => (t.id === thread.id ? { ...t, is_locked: !t.is_locked } : t))
        );
      }
      setActionLoadingId(null);
    });
  };

  const handleDelete = (threadId: number) => {
    if (!confirm('Are you sure you want to permanently delete/archive this forum thread?')) return;
    setActionLoadingId(threadId);
    startTransition(async () => {
      const res = await deleteThread(threadId);
      if (res.success) {
        setThreads((prev) => prev.filter((t) => t.id !== threadId));
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
            Community Forums Control
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Moderate discussion threads, pin featured topics, lock threads, and eliminate spam.
          </p>
        </div>

        {/* Telemetry chips */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
            {stats.totalThreads} Discussion Threads
          </span>
          <span className="px-3 py-1.5 rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800">
            {stats.pinnedCount} Pinned Topics
          </span>
          <span className="px-3 py-1.5 rounded-full bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 font-bold border border-cyan-200 dark:border-cyan-800">
            {stats.totalPosts} Total Replies
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 transition-colors">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search discussion title, content, author..."
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
          />
        </form>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => handleCategorySelect('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 ${
              selectedCategory === 'all'
                ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.slug;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategorySelect(cat.slug)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                  isSelected
                    ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                    : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 dark:bg-white/5 text-gray-400 uppercase tracking-wider text-[10px] font-bold border-b border-gray-100 dark:border-white/5">
              <tr>
                <th className="px-5 py-3.5">Discussion Topic</th>
                <th className="px-4 py-3.5">Author</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Engagement</th>
                <th className="px-4 py-3.5">Last Activity</th>
                <th className="px-5 py-3.5 text-right">Moderation Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-gray-600 dark:text-gray-300">
              {filteredThreads.length > 0 ? (
                filteredThreads.map((t) => {
                  const isLoading = actionLoadingId === t.id;

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-gray-50/70 dark:hover:bg-white/5 transition-colors group"
                    >
                      {/* Topic Title */}
                      <td className="px-5 py-4 max-w-[260px]">
                        <div className="flex items-center gap-1.5">
                          {t.is_pinned && (
                            <span className="p-1 rounded-md bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 text-[10px] shrink-0 font-bold inline-flex items-center gap-0.5">
                              <Pin className="w-3 h-3 fill-amber-500 text-amber-500" />
                              Pinned
                            </span>
                          )}
                          {t.is_locked && (
                            <span className="p-1 rounded-md bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 text-[10px] shrink-0 font-bold inline-flex items-center gap-0.5">
                              <Lock className="w-3 h-3 text-rose-500" />
                              Locked
                            </span>
                          )}
                          <span className="font-bold text-gray-900 dark:text-white truncate" title={t.title}>
                            {t.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">
                          {t.content.replace(/<[^>]*>?/gm, '')}
                        </p>
                      </td>

                      {/* Author */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full overflow-hidden bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {t.author.avatar_url ? (
                              <img
                                src={getPublicImageUrl(t.author.avatar_url, 'users')}
                                alt={t.author.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              t.author.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-gray-800 dark:text-gray-200 block truncate max-w-[120px]">
                              {t.author.name}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="px-4 py-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10">
                          {t.category.name}
                        </span>
                      </td>

                      {/* Engagement Metrics */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1 font-semibold" title="Total Views">
                            <Eye className="w-3.5 h-3.5 text-gray-400" />
                            {t.view_count}
                          </span>
                          <span className="text-purple-600 dark:text-purple-400 flex items-center gap-1 font-bold" title="Replies / Posts">
                            <MessageCircle className="w-3.5 h-3.5" />
                            {t.reply_count}
                          </span>
                          <span className="text-amber-500 flex items-center gap-1 font-semibold" title="Likes">
                            <ThumbsUp className="w-3.5 h-3.5" />
                            {t.like_count}
                          </span>
                        </div>
                      </td>

                      {/* Last Activity */}
                      <td className="px-4 py-4">
                        <span className="text-gray-800 dark:text-gray-200 font-medium block">
                          {t.last_reply_at
                            ? new Date(t.last_reply_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                              })
                            : t.created_at
                            ? new Date(t.created_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                              })
                            : 'N/A'}
                        </span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">
                          {t.last_reply_at ? 'Recent reply' : 'Created'}
                        </span>
                      </td>

                      {/* Moderation Controls */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle Pin Button */}
                          <button
                            type="button"
                            onClick={() => handleTogglePinned(t)}
                            disabled={isLoading}
                            className={`p-1.5 rounded-xl text-xs font-bold transition ${
                              t.is_pinned
                                ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                : 'bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-600 dark:text-gray-400'
                            }`}
                            title={t.is_pinned ? 'Unpin Discussion' : 'Pin to Top of Forum'}
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>

                          {/* Toggle Lock Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleLocked(t)}
                            disabled={isLoading}
                            className={`p-1.5 rounded-xl text-xs font-bold transition ${
                              t.is_locked
                                ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                                : 'bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-600 dark:text-gray-400'
                            }`}
                            title={t.is_locked ? 'Unlock Discussion' : 'Lock Discussion (Disable Replies)'}
                          >
                            {t.is_locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                          </button>

                          {/* Public View Link */}
                          <Link
                            href={`/forums/${t.category.slug}/${t.slug}`}
                            target="_blank"
                            className="p-1.5 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-600 dark:text-gray-300 transition"
                            title="View thread publicly"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>

                          {/* Delete Thread */}
                          <button
                            type="button"
                            onClick={() => handleDelete(t.id)}
                            disabled={isLoading}
                            className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-600 hover:text-white text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 transition"
                            title="Delete / Take down Spam Thread"
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
                    No forum discussions found matching current filter parameters.
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
      </div>
    </motion.div>
  );
}
