'use client';

import React, { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  Search,
  Trash2,
  ExternalLink,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Clock,
  User,
  Compass,
  MessageSquare,
} from 'lucide-react';
import Link from 'next/link';
import { AdminReviewItem, deleteReview, getAdminReviews } from '@/actions/admin/reviews';
import { getPublicImageUrl } from '@/lib/images';
import { AdminPagination, PaginationState } from '@/components/admin/ui/AdminPagination';

interface ReviewsModerationClientProps {
  initialReviews: AdminReviewItem[];
  initialPagination?: PaginationState;
  stats: {
    totalReviews: number;
    criticalCount: number;
    fiveStarCount: number;
    fourStarCount: number;
    averageRating: string;
  };
}

const ratingFilters = [
  { id: 'all', label: 'All Reviews' },
  { id: 'critical', label: '⚠️ 1-2 Stars (Critical QC)' },
  { id: '5', label: '★ 5 Stars' },
  { id: '4', label: '★ 4 Stars' },
  { id: '3', label: '★ 3 Stars' },
];

export function ReviewsModerationClient({
  initialReviews,
  initialPagination,
  stats,
}: ReviewsModerationClientProps) {
  const [reviews, setReviews] = useState<AdminReviewItem[]>(initialReviews);
  const [pagination, setPagination] = useState<PaginationState>(
    initialPagination || {
      totalItems: stats.totalReviews || initialReviews.length,
      totalPages: Math.ceil((stats.totalReviews || initialReviews.length) / 10) || 1,
      currentPage: 1,
      pageSize: 10,
    }
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isPending, startTransition] = useTransition();
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [selectedReview, setSelectedReview] = useState<AdminReviewItem | null>(null);

  const fetchData = (
    newPage: number,
    newPageSize: number = pagination.pageSize,
    searchVal: string = searchQuery,
    filterVal: string = selectedFilter
  ) => {
    startTransition(async () => {
      const res = await getAdminReviews({
        page: newPage,
        pageSize: newPageSize,
        search: searchVal,
        ratingFilter: filterVal,
      });
      if (res.success && res.reviews) {
        setReviews(res.reviews);
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

  const handleFilterSelect = (filterId: string) => {
    setSelectedFilter(filterId);
    fetchData(1, pagination.pageSize, searchQuery, filterId);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData(1, pagination.pageSize, searchQuery, selectedFilter);
  };

  const filtered = reviews.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      r.reviewer.name.toLowerCase().includes(q) ||
      r.experience.title.toLowerCase().includes(q) ||
      (r.comment && r.comment.toLowerCase().includes(q)) ||
      (r.title && r.title.toLowerCase().includes(q));

    let matchesRating = true;
    if (selectedFilter === 'critical') {
      matchesRating = r.rating <= 2;
    } else if (selectedFilter !== 'all') {
      matchesRating = r.rating === parseInt(selectedFilter, 10);
    }

    return matchesSearch && matchesRating;
  });

  const handleDelete = (reviewId: number) => {
    if (!confirm('Are you sure you want to permanently delete / takedown this review?')) return;
    setActionLoadingId(reviewId);
    startTransition(async () => {
      const res = await deleteReview(reviewId);
      if (res.success) {
        setReviews((prev) => prev.filter((r) => r.id !== reviewId));
        if (selectedReview?.id === reviewId) setSelectedReview(null);
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
            Reviews Moderation Center
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Audit traveler reviews, purge spam or abusive feedback, and preserve marketplace trust.
          </p>
        </div>

        {/* Telemetry chips */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800 flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            {stats.averageRating} Avg Score
          </span>
          {stats.criticalCount > 0 && (
            <span className="px-3 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800 animate-pulse">
              {stats.criticalCount} Critical (1-2 Stars)
            </span>
          )}
          <span className="px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
            {stats.fiveStarCount} 5-Stars
          </span>
          <span className="px-3 py-1.5 rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800">
            {stats.totalReviews} Total Feedback
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
            placeholder="Search review comment, reviewer, experience..."
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
          />
        </form>

        {/* Rating Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {ratingFilters.map((opt) => {
            const isSelected = selectedFilter === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleFilterSelect(opt.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                  isSelected
                    ? opt.id === 'critical'
                      ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30'
                      : 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                    : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Reviews Data Table */}
      <div className="rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 dark:bg-white/5 text-gray-400 uppercase tracking-wider text-[10px] font-bold border-b border-gray-100 dark:border-white/5">
              <tr>
                <th className="px-5 py-3.5">Reviewer</th>
                <th className="px-4 py-3.5">Target Experience</th>
                <th className="px-4 py-3.5">Star Rating</th>
                <th className="px-4 py-3.5">Comment Snippet</th>
                <th className="px-4 py-3.5">Date Submitted</th>
                <th className="px-5 py-3.5 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-gray-600 dark:text-gray-300">
              {filtered.length > 0 ? (
                filtered.map((r) => {
                  const isLoading = actionLoadingId === r.id;
                  const isLowScore = r.rating <= 2;

                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-gray-50/70 dark:hover:bg-white/5 transition-colors group ${
                        isLowScore ? 'bg-rose-50/30 dark:bg-rose-950/15' : ''
                      }`}
                    >
                      {/* Reviewer */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center shrink-0">
                            {r.reviewer.avatar_url ? (
                              <img
                                src={getPublicImageUrl(r.reviewer.avatar_url, 'users')}
                                alt={r.reviewer.name}
                                className="w-full h-full object-cover rounded-xl"
                              />
                            ) : (
                              r.reviewer.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-gray-900 dark:text-white block truncate max-w-[130px]">
                              {r.reviewer.name}
                            </span>
                            <span className="text-[10px] text-gray-400 block truncate max-w-[130px]">
                              {r.reviewer.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Target Experience */}
                      <td className="px-4 py-4 max-w-[200px]">
                        <span className="font-bold text-gray-800 dark:text-gray-200 block truncate" title={r.experience.title}>
                          {r.experience.title}
                        </span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">
                          Host: {r.experience.hostName}
                        </span>
                      </td>

                      {/* Star Rating */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 ${
                                star <= r.rating
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-gray-200 dark:text-white/10'
                              }`}
                            />
                          ))}
                          <span className="ml-1 text-[11px] font-black text-gray-800 dark:text-gray-200">
                            {r.rating}.0
                          </span>
                        </div>
                      </td>

                      {/* Comment Snippet */}
                      <td className="px-4 py-4 max-w-[280px]">
                        <div
                          onClick={() => setSelectedReview(r)}
                          className="cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition"
                        >
                          {r.title && (
                            <span className="font-bold text-gray-900 dark:text-white block truncate text-[11px]">
                              "{r.title}"
                            </span>
                          )}
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                            {r.comment || 'No comment text provided.'}
                          </p>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-4">
                        <span className="text-gray-800 dark:text-gray-200 font-medium block">
                          {new Date(r.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">
                          #{r.id}
                        </span>
                      </td>

                      {/* Moderation Actions (1-Click Takedown) */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {r.experience.slug && (
                            <Link
                              href={`/experiences/${r.experience.slug}`}
                              target="_blank"
                              className="p-1.5 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 text-gray-600 dark:text-gray-300 transition"
                              title="View experience on public site"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDelete(r.id)}
                            disabled={isLoading}
                            className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-600 hover:text-white text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 transition"
                            title="1-Click Takedown / Delete Review"
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
                    No traveler reviews found matching current filter parameters.
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

      {/* Review Detail Modal */}
      <AnimatePresence>
        {selectedReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="w-full max-w-md rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 p-6 shadow-2xl space-y-4 relative"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                    Review Inspection
                  </span>
                  <h3 className="text-base font-extrabold text-gray-900 dark:text-white mt-0.5">
                    {selectedReview.experience.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedReview(null)}
                  className="w-7 h-7 rounded-full bg-gray-100 dark:bg-white/10 text-gray-400 flex items-center justify-center text-xs hover:bg-gray-200 transition"
                >
                  ✕
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">By {selectedReview.reviewer.name}</span>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3 h-3 ${
                          s <= selectedReview.rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-gray-200 dark:text-white/10'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {selectedReview.title && (
                  <h4 className="font-bold text-gray-900 dark:text-white text-xs">
                    "{selectedReview.title}"
                  </h4>
                )}
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {selectedReview.comment || 'No text comment provided.'}
                </p>
                <span className="text-[10px] text-gray-400 block pt-1 border-t border-gray-200/40 dark:border-white/5">
                  Submitted on {new Date(selectedReview.created_at).toLocaleString('id-ID')}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => handleDelete(selectedReview.id)}
                  disabled={actionLoadingId === selectedReview.id}
                  className="px-4 py-2 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold hover:bg-rose-100 transition inline-flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Review</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedReview(null)}
                  className="px-4 py-2 rounded-2xl bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 text-xs font-bold hover:bg-gray-200 transition"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
