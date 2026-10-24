'use client';

import React, { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarCheck,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  PhoneCall,
  Mail,
  MessageCircle,
  User,
  DollarSign,
  TrendingUp,
  Filter,
  ExternalLink,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { AdminBookingItem, updateBookingStatus, getAdminBookings } from '@/actions/admin/bookings';
import { HostContactModal } from '@/components/admin/bookings/HostContactModal';
import { getPublicImageUrl } from '@/lib/images';
import { AdminPagination, PaginationState } from '@/components/admin/ui/AdminPagination';

interface BookingsManagementClientProps {
  initialBookings: AdminBookingItem[];
  initialPagination?: PaginationState;
  stats: {
    totalBookings: number;
    confirmedCount: number;
    pendingCount: number;
    completedCount: number;
    cancelledCount: number;
    totalGmvUsd: number;
  };
}

const statusFilters = [
  { id: 'all', label: 'All Orders' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'pending', label: 'Pending' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

export function BookingsManagementClient({ initialBookings, initialPagination, stats }: BookingsManagementClientProps) {
  const [bookings, setBookings] = useState<AdminBookingItem[]>(initialBookings);
  const [pagination, setPagination] = useState<PaginationState>(
    initialPagination || {
      totalItems: stats.totalBookings || initialBookings.length,
      totalPages: Math.ceil((stats.totalBookings || initialBookings.length) / 10) || 1,
      currentPage: 1,
      pageSize: 10,
    }
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedContactBooking, setSelectedContactBooking] = useState<AdminBookingItem | null>(null);
  const [isPending, startTransition] = useTransition();
  const [loadingBookingId, setLoadingBookingId] = useState<number | null>(null);

  const fetchData = (
    newPage: number,
    newPageSize: number = pagination.pageSize,
    searchVal: string = searchQuery,
    statusVal: string = selectedStatus
  ) => {
    startTransition(async () => {
      const res = await getAdminBookings({
        page: newPage,
        pageSize: newPageSize,
        search: searchVal,
        status: statusVal,
      });
      if (res.success && res.bookings) {
        setBookings(res.bookings);
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

  const filteredBookings = bookings.filter((b) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      b.booking_reference.toLowerCase().includes(q) ||
      b.experience.title.toLowerCase().includes(q) ||
      b.traveller.name.toLowerCase().includes(q) ||
      b.traveller.email.toLowerCase().includes(q) ||
      (b.host && b.host.name.toLowerCase().includes(q));

    const matchesStatus =
      selectedStatus === 'all' || b.status.toLowerCase() === selectedStatus.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (bookingId: number, newStatus: string) => {
    setLoadingBookingId(bookingId);
    startTransition(async () => {
      const res = await updateBookingStatus(bookingId, newStatus);
      if (res.success) {
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus.toLowerCase() } : b))
        );
      }
      setLoadingBookingId(null);
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
            Booking Orders & Host Control
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Real-time marketplace booking stream with automated host quick-contact actions.
          </p>
        </div>

        {/* Telemetry chips */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="px-3 py-1.5 rounded-full bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 font-bold border border-cyan-200 dark:border-cyan-800">
            ${stats.totalGmvUsd.toLocaleString()} USD GMV
          </span>
          <span className="px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
            {stats.confirmedCount} Confirmed
          </span>
          <span className="px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800">
            {stats.pendingCount} Pending
          </span>
          <span className="px-3 py-1.5 rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800">
            {stats.totalBookings} Total Orders
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
            placeholder="Search by ref code, tour, traveller, or host..."
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

      {/* Real-Time Bookings Table Container */}
      <div className="rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 dark:bg-white/5 text-gray-400 dark:text-gray-400 uppercase tracking-wider text-[10px] font-bold border-b border-gray-100 dark:border-white/5">
              <tr>
                <th className="px-5 py-3.5">Ref Code</th>
                <th className="px-4 py-3.5">Experience</th>
                <th className="px-4 py-3.5">Traveller</th>
                <th className="px-4 py-3.5">Assigned Host</th>
                <th className="px-4 py-3.5">Trip Schedule</th>
                <th className="px-4 py-3.5">Total Amount</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Host Quick-Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-gray-600 dark:text-gray-300">
              {filteredBookings.length > 0 ? (
                filteredBookings.map((b) => {
                  const isLoading = loadingBookingId === b.id;

                  return (
                    <tr
                      key={b.id}
                      className="hover:bg-gray-50/70 dark:hover:bg-white/5 transition-colors group"
                    >
                      {/* Booking Reference */}
                      <td className="px-5 py-4 font-mono font-bold text-purple-600 dark:text-purple-400">
                        {b.booking_reference}
                      </td>

                      {/* Experience Title */}
                      <td className="px-4 py-4 font-medium text-gray-900 dark:text-white max-w-[200px]">
                        <span className="truncate block" title={b.experience.title}>
                          {b.experience.title}
                        </span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">
                          ID: #{b.experience.id}
                        </span>
                      </td>

                      {/* Traveller Details */}
                      <td className="px-4 py-4">
                        <div className="min-w-0">
                          <span className="font-bold text-gray-800 dark:text-gray-200 block truncate max-w-[150px]">
                            {b.traveller.name}
                          </span>
                          <span className="text-[10px] text-gray-400 block truncate max-w-[150px]">
                            {b.traveller.email}
                          </span>
                        </div>
                      </td>

                      {/* Assigned Host */}
                      <td className="px-4 py-4">
                        {b.host ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full overflow-hidden bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                              {b.host.avatar_url ? (
                                <img
                                  src={getPublicImageUrl(b.host.avatar_url, 'users')}
                                  alt={b.host.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                b.host.name.charAt(0).toUpperCase()
                              )}
                            </div>
                            <span className="font-medium text-gray-800 dark:text-gray-200 truncate max-w-[120px]">
                              {b.host.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">Unassigned Host</span>
                        )}
                      </td>

                      {/* Trip Date & Pax */}
                      <td className="px-4 py-4">
                        <span className="font-semibold text-gray-800 dark:text-gray-200 block">
                          {b.selected_date
                            ? new Date(b.selected_date).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'N/A'}
                        </span>
                        <span className="text-[10px] text-gray-400 block">
                          {b.participant_count} Pax
                        </span>
                      </td>

                      {/* Total Amount */}
                      <td className="px-4 py-4 font-extrabold text-gray-900 dark:text-white">
                        ${b.total_price} USD
                      </td>

                      {/* Status Dropdown/Badge */}
                      <td className="px-4 py-4">
                        <select
                          value={b.status}
                          disabled={isLoading}
                          onChange={(e) => handleStatusChange(b.id, e.target.value)}
                          className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border outline-none cursor-pointer transition-all ${
                            b.status === 'confirmed'
                              ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                              : b.status === 'completed'
                              ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                              : b.status === 'cancelled'
                              ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                              : 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>

                      {/* Host Quick-Contact Action Button */}
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedContactBooking(b)}
                          className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-600 hover:text-white dark:hover:bg-purple-600 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 text-xs font-bold transition-all shadow-2xs inline-flex items-center gap-1.5 group-hover:scale-105"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>Contact Host</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400 text-xs">
                    No booking transactions found matching current filter parameters.
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

      {/* Host Quick Contact Modal */}
      <HostContactModal
        booking={selectedContactBooking}
        onClose={() => setSelectedContactBooking(null)}
      />
    </motion.div>
  );
}
