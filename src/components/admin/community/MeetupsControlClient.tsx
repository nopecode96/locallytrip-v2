'use client';

import React, { useState, useTransition } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Calendar,
  MapPin,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Trash2,
  ExternalLink,
  Loader2,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { AdminMeetupItem, updateMeetupStatus, deleteMeetup, getAdminMeetups } from '@/actions/admin/community/meetups';
import { getPublicImageUrl } from '@/lib/images';
import { AdminPagination, PaginationState } from '@/components/admin/ui/AdminPagination';

interface MeetupsControlClientProps {
  initialMeetups: AdminMeetupItem[];
  initialPagination?: PaginationState;
  stats: {
    totalMeetups: number;
    activeCount: number;
    completedCount: number;
    cancelledCount: number;
  };
}

const statusFilters = [
  { id: 'all', label: 'All Meetups' },
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

export function MeetupsControlClient({ initialMeetups, initialPagination, stats }: MeetupsControlClientProps) {
  const [meetups, setMeetups] = useState<AdminMeetupItem[]>(initialMeetups);
  const [pagination, setPagination] = useState<PaginationState>(
    initialPagination || {
      totalItems: stats.totalMeetups || initialMeetups.length,
      totalPages: Math.ceil((stats.totalMeetups || initialMeetups.length) / 10) || 1,
      currentPage: 1,
      pageSize: 10,
    }
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isPending, startTransition] = useTransition();
  const [loadingMeetupId, setLoadingMeetupId] = useState<number | null>(null);

  const fetchData = (
    newPage: number,
    newPageSize: number = pagination.pageSize,
    searchVal: string = searchQuery,
    statusVal: string = selectedStatus
  ) => {
    startTransition(async () => {
      const res = await getAdminMeetups({
        page: newPage,
        pageSize: newPageSize,
        search: searchVal,
        status: statusVal,
      });
      if (res.success && res.meetups) {
        setMeetups(res.meetups);
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

  const filteredMeetups = meetups.filter((m) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      m.title.toLowerCase().includes(q) ||
      m.creator.name.toLowerCase().includes(q) ||
      m.creator.email.toLowerCase().includes(q) ||
      (m.city && m.city.name.toLowerCase().includes(q));

    const matchesStatus =
      selectedStatus === 'all' || m.status.toLowerCase() === selectedStatus.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (meetupId: number, newStatus: string) => {
    setLoadingMeetupId(meetupId);
    startTransition(async () => {
      const res = await updateMeetupStatus(meetupId, newStatus);
      if (res.success) {
        setMeetups((prev) =>
          prev.map((m) => (m.id === meetupId ? { ...m, status: newStatus.toLowerCase() } : m))
        );
      }
      setLoadingMeetupId(null);
    });
  };

  const handleDelete = (meetupId: number) => {
    if (!confirm('Are you sure you want to cancel and takedown this meetup?')) return;
    setLoadingMeetupId(meetupId);
    startTransition(async () => {
      const res = await deleteMeetup(meetupId);
      if (res.success) {
        setMeetups((prev) =>
          prev.map((m) => (m.id === meetupId ? { ...m, status: 'cancelled' } : m))
        );
      }
      setLoadingMeetupId(null);
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
            Meetups Control
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Supervise community travel meetups, member capacity, and host accountability.
          </p>
        </div>

        {/* Telemetry chips */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="px-3 py-1.5 rounded-full bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 font-bold border border-teal-200 dark:border-teal-800">
            {stats.activeCount} Active Meetups
          </span>
          <span className="px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800">
            {stats.completedCount} Completed
          </span>
          <span className="px-3 py-1.5 rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800">
            {stats.totalMeetups} Total Gatherings
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
            placeholder="Search by title, host name, city..."
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
                <th className="px-5 py-3.5">Meetup Title</th>
                <th className="px-4 py-3.5">Host / Creator</th>
                <th className="px-4 py-3.5">Location & Schedule</th>
                <th className="px-4 py-3.5">Capacity vs Attendees</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-gray-600 dark:text-gray-300">
              {filteredMeetups.length > 0 ? (
                filteredMeetups.map((m) => {
                  const isLoading = loadingMeetupId === m.id;
                  const capacityPct = m.max_members
                    ? Math.min(100, Math.round((m.attendees_count / m.max_members) * 100))
                    : 50;

                  return (
                    <tr
                      key={m.id}
                      className="hover:bg-gray-50/70 dark:hover:bg-white/5 transition-colors group"
                    >
                      {/* Meetup Title & Public Link */}
                      <td className="px-5 py-4 max-w-[220px]">
                        <span className="font-bold text-gray-900 dark:text-white block truncate" title={m.title}>
                          {m.title}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-gray-400 font-mono">#{m.id}</span>
                          <span className="text-[10px] text-gray-400 flex items-center gap-1">
                            <Eye className="w-3 h-3" /> {m.view_count} views
                          </span>
                        </div>
                      </td>

                      {/* Host Identity */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-black text-xs flex items-center justify-center shrink-0">
                            {m.creator.avatar_url ? (
                              <img
                                src={getPublicImageUrl(m.creator.avatar_url, 'users')}
                                alt={m.creator.name}
                                className="w-full h-full object-cover rounded-xl"
                              />
                            ) : (
                              m.creator.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-gray-800 dark:text-gray-200 block truncate max-w-[140px]">
                              {m.creator.name}
                            </span>
                            <span className="text-[10px] text-gray-400 block truncate max-w-[140px]">
                              {m.creator.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Location & Dates */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 font-semibold text-gray-800 dark:text-gray-200">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span>{m.city?.name || 'Local Destination'}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {new Date(m.start_date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                          })}{' '}
                          -{' '}
                          {new Date(m.end_date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </td>

                      {/* Capacity vs Attendees */}
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-between text-[11px] mb-1 font-semibold">
                          <span className="text-gray-800 dark:text-gray-200">
                            {m.attendees_count} Members
                          </span>
                          <span className="text-gray-400 text-[10px]">
                            {m.max_members ? `/ ${m.max_members} max` : '(Open Cap)'}
                          </span>
                        </div>
                        <div className="w-24 h-1.5 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-teal-500 to-purple-600 rounded-full"
                            style={{ width: `${capacityPct}%` }}
                          />
                        </div>
                      </td>

                      {/* Status Selector */}
                      <td className="px-4 py-4">
                        <select
                          value={m.status}
                          disabled={isLoading}
                          onChange={(e) => handleStatusChange(m.id, e.target.value)}
                          className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border outline-none cursor-pointer transition-all ${
                            m.status === 'active'
                              ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                              : m.status === 'completed'
                              ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                              : 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                          }`}
                        >
                          <option value="active">Active</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>

                      {/* Moderation Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/meetups/${m.slug}`}
                            target="_blank"
                            className="p-1.5 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-600 dark:text-gray-300 transition"
                            title="View on public site"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleDelete(m.id)}
                            disabled={isLoading}
                            className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-600 hover:text-white text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 transition"
                            title="Takedown / Cancel Meetup"
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
                    No travel meetups found matching current filter parameters.
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
