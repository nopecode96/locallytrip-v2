'use client';

import React, { useState, useTransition } from 'react';
import { motion } from 'framer-motion';
import {
  Compass,
  Search,
  Star,
  CheckCircle2,
  Clock,
  Archive,
  Power,
  Sparkles,
  ExternalLink,
  Loader2,
  Eye,
  MapPin,
  CalendarCheck,
  Tag,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import {
  AdminExperienceCatalogItem,
  toggleExperienceStatus,
  toggleExperienceFeatured,
  archiveExperience,
  getAdminExperiences,
} from '@/actions/admin/experiences';
import { getPublicImageUrl } from '@/lib/images';
import { resolveAvatarUrl } from '@/lib/avatar';
import { AdminPagination, PaginationState } from '@/components/admin/ui/AdminPagination';

interface ExperiencesControlClientProps {
  initialExperiences: AdminExperienceCatalogItem[];
  initialPagination?: PaginationState;
  stats: {
    totalExperiences: number;
    publishedCount: number;
    draftCount: number;
    archivedCount: number;
    featuredCount: number;
  };
}

const statusFilters = [
  { id: 'all', label: 'All Catalog' },
  { id: 'published', label: 'Published' },
  { id: 'draft', label: 'Drafts' },
  { id: 'archived', label: 'Archived' },
];

export function ExperiencesControlClient({
  initialExperiences,
  initialPagination,
  stats,
}: ExperiencesControlClientProps) {
  const [experiences, setExperiences] = useState<AdminExperienceCatalogItem[]>(initialExperiences);
  const [pagination, setPagination] = useState<PaginationState>(
    initialPagination || {
      totalItems: stats.totalExperiences || initialExperiences.length,
      totalPages: Math.ceil((stats.totalExperiences || initialExperiences.length) / 10) || 1,
      currentPage: 1,
      pageSize: 10,
    }
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isPending, startTransition] = useTransition();
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const fetchData = (
    newPage: number,
    newPageSize: number = pagination.pageSize,
    searchVal: string = searchQuery,
    statusVal: string = selectedStatus
  ) => {
    startTransition(async () => {
      const res = await getAdminExperiences({
        page: newPage,
        pageSize: newPageSize,
        search: searchVal,
        status: statusVal,
      });
      if (res.success && res.experiences) {
        setExperiences(res.experiences);
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

  const filtered = experiences.filter((e) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      e.title.toLowerCase().includes(q) ||
      e.host.name.toLowerCase().includes(q) ||
      (e.city && e.city.toLowerCase().includes(q)) ||
      (e.category && e.category.toLowerCase().includes(q));

    const matchesStatus =
      selectedStatus === 'all' || e.status.toLowerCase() === selectedStatus.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const handleToggleStatus = (exp: AdminExperienceCatalogItem) => {
    setActionLoadingId(exp.id);
    startTransition(async () => {
      const res = await toggleExperienceStatus(exp.id, exp.status);
      if (res.success && res.status) {
        setExperiences((prev) =>
          prev.map((item) =>
            item.id === exp.id
              ? { ...item, status: res.status!, is_active: res.status === 'published' }
              : item
          )
        );
      }
      setActionLoadingId(null);
    });
  };

  const handleToggleFeatured = (exp: AdminExperienceCatalogItem) => {
    setActionLoadingId(exp.id);
    startTransition(async () => {
      const res = await toggleExperienceFeatured(exp.id, exp.is_featured);
      if (res.success && typeof res.is_featured === 'boolean') {
        setExperiences((prev) =>
          prev.map((item) =>
            item.id === exp.id ? { ...item, is_featured: res.is_featured! } : item
          )
        );
      }
      setActionLoadingId(null);
    });
  };

  const handleArchive = (expId: number) => {
    if (!confirm('Are you sure you want to archive / take down this experience listing?')) return;
    setActionLoadingId(expId);
    startTransition(async () => {
      const res = await archiveExperience(expId);
      if (res.success) {
        setExperiences((prev) =>
          prev.map((item) =>
            item.id === expId ? { ...item, status: 'archived', is_active: false } : item
          )
        );
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
            Experiences Catalog Control
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Curate tour listings, publish approvals, feature listings on homepage, and manage inventory.
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
            {stats.featuredCount} Featured
          </span>
          <span className="px-3 py-1.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 font-bold border border-gray-200 dark:border-white/10">
            {stats.totalExperiences} Total Catalog
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
            placeholder="Search title, host, city, or category..."
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
          />
        </form>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
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
      </div>

      {/* Data Table */}
      <div className="rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 dark:bg-white/5 text-gray-400 uppercase tracking-wider text-[10px] font-bold border-b border-gray-100 dark:border-white/5">
              <tr>
                <th className="px-5 py-3.5">Experience Listing</th>
                <th className="px-4 py-3.5">Host & Guide</th>
                <th className="px-4 py-3.5">Location & Category</th>
                <th className="px-4 py-3.5">Package Price</th>
                <th className="px-4 py-3.5">Bookings & Rating</th>
                <th className="px-4 py-3.5 text-center">Publish Status</th>
                <th className="px-5 py-3.5 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-gray-600 dark:text-gray-300">
              {filtered.length > 0 ? (
                filtered.map((exp) => {
                  const isLoading = actionLoadingId === exp.id;

                  return (
                    <tr
                      key={exp.id}
                      className="hover:bg-gray-50/70 dark:hover:bg-white/5 transition-colors group"
                    >
                      {/* Cover + Title + ID */}
                      <td className="px-5 py-4 max-w-[260px]">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gray-100 dark:bg-white/5 shrink-0 border border-gray-200 dark:border-white/10">
                            {exp.cover_image ? (
                              <img
                                src={getPublicImageUrl(exp.cover_image, 'experiences')}
                                alt={exp.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  if (target.src !== '/images/placeholder-experience.jpg') {
                                    target.src = '/images/placeholder-experience.jpg';
                                  }
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-teal-500">
                                <Compass className="w-6 h-6" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              {exp.is_featured && (
                                <span title="Featured on Homepage">
                                  <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 animate-pulse" />
                                </span>
                              )}
                              <span className="font-bold text-gray-900 dark:text-white truncate" title={exp.title}>
                                {exp.title}
                              </span>
                            </div>
                            <span className="text-[10px] text-gray-400 font-mono block mt-0.5">
                              ID: #{exp.id} • {exp.duration_hours || 4}h duration
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Host */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full overflow-hidden bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold text-[10px] flex items-center justify-center shrink-0 border border-purple-200/50 dark:border-purple-800/50">
                            <img
                              src={resolveAvatarUrl(exp.host)}
                              alt={exp.host.name}
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
                            <span className="font-semibold text-gray-800 dark:text-gray-200 block truncate max-w-[120px]">
                              {exp.host.name}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* City & Category */}
                      <td className="px-4 py-4">
                        <span className="font-medium text-gray-800 dark:text-gray-200 block flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                          {exp.city}
                        </span>
                        <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold block mt-0.5">
                          {exp.category}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-4 font-black text-gray-900 dark:text-white">
                        {exp.package_price ? `$${exp.package_price} ${exp.currency}` : 'Free / TBA'}
                      </td>

                      {/* Total Bookings & Rating */}
                      <td className="px-4 py-4">
                        <div className="space-y-0.5">
                          <span className="font-bold text-teal-600 dark:text-teal-400 block">
                            {exp.total_bookings} Bookings
                          </span>
                          <span className="text-[10px] text-gray-400 flex items-center gap-1">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            {exp.rating_average.toFixed(1)} ({exp.rating_count} reviews)
                          </span>
                        </div>
                      </td>

                      {/* Publish / Draft Toggle */}
                      <td className="px-4 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(exp)}
                          disabled={isLoading}
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition border inline-flex items-center gap-1 ${
                            exp.status === 'published'
                              ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-200'
                              : exp.status === 'archived'
                              ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                              : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:bg-gray-200'
                          }`}
                          title="Click to toggle Published / Draft"
                        >
                          {isLoading ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Power className="w-3 h-3" />
                          )}
                          <span>{exp.status}</span>
                        </button>
                      </td>

                      {/* Moderation Controls */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle Featured */}
                          <button
                            type="button"
                            onClick={() => handleToggleFeatured(exp)}
                            disabled={isLoading}
                            className={`p-1.5 rounded-xl transition ${
                              exp.is_featured
                                ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                : 'bg-gray-100 dark:bg-white/10 hover:bg-gray-200 text-gray-500 dark:text-gray-400'
                            }`}
                            title={exp.is_featured ? 'Remove from Featured Homepage' : 'Feature on Homepage'}
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>

                          {/* Direct preview link */}
                          <Link
                            href={exp.slug ? `/experiences/${exp.slug}` : `/experiences/${exp.id}`}
                            target="_blank"
                            className="p-1.5 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-600 dark:text-gray-300 transition"
                            title="Preview public experience detail page"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>

                          {/* Archive / Soft-delete */}
                          <button
                            type="button"
                            onClick={() => handleArchive(exp.id)}
                            disabled={isLoading || exp.status === 'archived'}
                            className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-600 hover:text-white text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 transition disabled:opacity-40"
                            title="Archive / Takedown listing"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 text-xs">
                    No tour experiences found matching current filter parameters.
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
