'use client';

import React, { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Coins,
  Sparkles,
  MoreVertical,
  Calendar,
  Mail,
  Phone,
  Power,
  UserCheck,
  UserX,
  ExternalLink,
  ChevronDown,
  Layers,
  ArrowUpDown,
  Loader2,
  Eye,
} from 'lucide-react';
import { AdminUserItem, toggleUserStatus, updateUserRole, getAdminUsers } from '@/actions/admin/users';
import Image from 'next/image';
import { getPublicImageUrl } from '@/lib/images';
import { AdminPagination, PaginationState } from '@/components/admin/ui/AdminPagination';

interface UsersManagementClientProps {
  initialUsers: AdminUserItem[];
  initialPagination?: PaginationState;
  stats: {
    totalUsers: number;
    totalTravellers: number;
    totalHosts: number;
    totalStaff: number;
    totalInactive: number;
  };
}

const roleOptions = [
  { id: 'all', label: 'All Roles' },
  { id: 'traveller', label: 'Travellers' },
  { id: 'host', label: 'Hosts / Guides' },
  { id: 'admin', label: 'Admins' },
  { id: 'moderator', label: 'Moderators' },
  { id: 'finances', label: 'Finances' },
  { id: 'marketing', label: 'Marketing' },
];

export function UsersManagementClient({ initialUsers, initialPagination, stats }: UsersManagementClientProps) {
  const [users, setUsers] = useState<AdminUserItem[]>(initialUsers);
  const [pagination, setPagination] = useState<PaginationState>(
    initialPagination || {
      totalItems: stats.totalUsers || initialUsers.length,
      totalPages: Math.ceil((stats.totalUsers || initialUsers.length) / 10) || 1,
      currentPage: 1,
      pageSize: 10,
    }
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedKyc, setSelectedKyc] = useState('all');
  const [selectedUserDetail, setSelectedUserDetail] = useState<AdminUserItem | null>(null);
  const [isPending, startTransition] = useTransition();
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const fetchData = (
    newPage: number,
    newPageSize: number = pagination.pageSize,
    searchVal: string = searchQuery,
    roleVal: string = selectedRole
  ) => {
    startTransition(async () => {
      const res = await getAdminUsers({
        page: newPage,
        pageSize: newPageSize,
        search: searchVal,
        role: roleVal,
        kycStatus: selectedKyc,
      });
      if (res.success && res.users) {
        setUsers(res.users);
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

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    fetchData(1, pagination.pageSize, searchQuery, roleId);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData(1, pagination.pageSize, searchQuery, selectedRole);
  };

  // Client-side instant filter on current page results if user is typing
  const filteredUsers = users.filter((u) => {
    // Search match
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.phone && u.phone.includes(q));

    // Role match
    const matchesRole =
      selectedRole === 'all' || u.role.toLowerCase() === selectedRole.toLowerCase();

    // KYC match
    const matchesKyc =
      selectedKyc === 'all' || u.kyc_status.toLowerCase() === selectedKyc.toLowerCase();

    return matchesSearch && matchesRole && matchesKyc;
  });

  const handleToggleStatus = (user: AdminUserItem) => {
    setActionLoadingId(user.id);
    startTransition(async () => {
      const res = await toggleUserStatus(user.id, user.is_active);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === user.id ? { ...u, is_active: !u.is_active } : u
          )
        );
        if (selectedUserDetail?.id === user.id) {
          setSelectedUserDetail((prev) => prev ? { ...prev, is_active: !prev.is_active } : null);
        }
      }
      setActionLoadingId(null);
    });
  };

  const handleRoleChange = (userId: number, newRole: string) => {
    setActionLoadingId(userId);
    startTransition(async () => {
      const res = await updateUserRole(userId, newRole);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, role: newRole } : u
          )
        );
        if (selectedUserDetail?.id === userId) {
          setSelectedUserDetail((prev) => prev ? { ...prev, role: newRole } : null);
        }
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
      {/* Top Header & Overview KPI Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
            User Operations
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Real-time registry of explorers, verified hosts, and platform staff members.
          </p>
        </div>

        {/* Telemetry pill chips */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="px-3 py-1.5 rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800">
            {stats.totalUsers} Total Registered
          </span>
          <span className="px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
            {stats.totalHosts} Hosts
          </span>
          <span className="px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
            {stats.totalStaff} Staff
          </span>
          {stats.totalInactive > 0 && (
            <span className="px-3 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800">
              {stats.totalInactive} Suspended
            </span>
          )}
        </div>
      </div>

      {/* Filter and Search Capsule Bar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 transition-colors">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, username..."
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
          />
        </form>

        {/* Roles Pill Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {roleOptions.map((opt) => {
            const isSelected = selectedRole === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleRoleSelect(opt.id)}
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

      {/* Data Table Container */}
      <div className="rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 dark:bg-white/5 text-gray-400 dark:text-gray-400 uppercase tracking-wider text-[10px] font-bold border-b border-gray-100 dark:border-white/5">
              <tr>
                <th className="px-5 py-3.5">User Identity</th>
                <th className="px-4 py-3.5">Role</th>
                <th className="px-4 py-3.5">KYC Status</th>
                <th className="px-4 py-3.5">LTP & XP Rewards</th>
                <th className="px-4 py-3.5">Registered</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-gray-600 dark:text-gray-300">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const isLoading = actionLoadingId === user.id;

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50/70 dark:hover:bg-white/5 transition-colors group"
                    >
                      {/* User Identity Column */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-9 h-9 rounded-2xl overflow-hidden bg-purple-100 dark:bg-purple-900/40 border border-purple-200 dark:border-purple-800 flex items-center justify-center font-black text-xs text-purple-700 dark:text-purple-300 shrink-0">
                            {user.avatar_url ? (
                              <img
                                src={getPublicImageUrl(user.avatar_url, 'users')}
                                alt={user.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              user.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-gray-900 dark:text-white truncate max-w-[160px]">
                                {user.name}
                              </span>
                              {user.is_trusted && (
                                <span title="Trusted Member">
                                  <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-gray-400 block truncate max-w-[180px]">
                              {user.email}
                            </span>
                            {user.username && (
                              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-mono">
                                @{user.username}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="px-4 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1 border ${
                            user.role === 'admin' || user.role === 'super admin'
                              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/50'
                              : user.role === 'host'
                              ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800/50'
                              : user.role === 'moderator' || user.role === 'finances' || user.role === 'marketing'
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/50'
                              : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>

                      {/* KYC Status Badge */}
                      <td className="px-4 py-4">
                        {user.kyc_status === 'approved' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                            Verified
                          </span>
                        ) : user.kyc_status === 'pending' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                            Pending Review
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                            Unverified
                          </span>
                        )}
                      </td>

                      {/* Rewards Column: LTP & XP */}
                      <td className="px-4 py-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold text-xs">
                            <Coins className="w-3.5 h-3.5" />
                            <span>{user.ltp_balance.toFixed(0)} LTP</span>
                          </div>
                          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold block">
                            {user.total_xp} XP • Lvl {user.xp_level}
                          </span>
                        </div>
                      </td>

                      {/* Registration Date Column */}
                      <td className="px-4 py-4">
                        <span className="text-gray-800 dark:text-gray-200 font-medium block">
                          {new Date(user.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {new Date(user.created_at).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>

                      {/* Account Active Status Toggle */}
                      <td className="px-4 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(user)}
                          disabled={isLoading}
                          title={user.is_active ? 'Click to suspend account' : 'Click to activate account'}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                            user.is_active
                              ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 border border-emerald-300 dark:border-emerald-800'
                              : 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 hover:bg-rose-200 border border-rose-300 dark:border-rose-800'
                          }`}
                        >
                          {isLoading ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Power className="w-3 h-3" />
                          )}
                          <span>{user.is_active ? 'Active' : 'Suspended'}</span>
                        </button>
                      </td>

                      {/* Actions Column */}
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedUserDetail(user)}
                          className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-purple-600 hover:text-white dark:hover:bg-purple-600 text-gray-700 dark:text-gray-300 text-xs font-bold transition-all shadow-2xs inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 text-xs">
                    No users found matching current filter parameters.
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

      {/* User Details & Quick Action Modal */}
      <AnimatePresence>
        {selectedUserDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 p-6 shadow-2xl space-y-6 relative"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/40 border border-purple-200 dark:border-purple-800 flex items-center justify-center font-black text-base text-purple-700 dark:text-purple-300">
                    {selectedUserDetail.avatar_url ? (
                      <img
                        src={getPublicImageUrl(selectedUserDetail.avatar_url, 'users')}
                        alt={selectedUserDetail.name}
                        className="w-full h-full object-cover rounded-2xl"
                      />
                    ) : (
                      selectedUserDetail.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                      {selectedUserDetail.name}
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 uppercase font-black">
                        {selectedUserDetail.role}
                      </span>
                    </h3>
                    <p className="text-xs text-gray-400">{selectedUserDetail.email}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedUserDetail(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-500 dark:text-gray-400 flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                  <span className="text-[10px] text-gray-400 block font-bold uppercase">LTP Balance</span>
                  <span className="text-base font-black text-amber-600 dark:text-amber-400 mt-0.5 block">
                    {selectedUserDetail.ltp_balance.toFixed(0)} LTP
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                  <span className="text-[10px] text-gray-400 block font-bold uppercase">XP & Level</span>
                  <span className="text-base font-black text-purple-600 dark:text-purple-400 mt-0.5 block">
                    Lvl {selectedUserDetail.xp_level}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                  <span className="text-[10px] text-gray-400 block font-bold uppercase">Bookings</span>
                  <span className="text-base font-black text-teal-600 dark:text-teal-400 mt-0.5 block">
                    {selectedUserDetail.bookings_count} Trips
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                  <span className="text-[10px] text-gray-400 block font-bold uppercase">Tours Hosted</span>
                  <span className="text-base font-black text-cyan-600 dark:text-cyan-400 mt-0.5 block">
                    {selectedUserDetail.experiences_count} Tours
                  </span>
                </div>
              </div>

              {/* Detailed Specs */}
              <div className="space-y-2.5 text-xs text-gray-600 dark:text-gray-300 py-2 border-y border-gray-100 dark:border-white/5">
                <div className="flex justify-between py-1">
                  <span className="text-gray-400">User ID:</span>
                  <span className="font-mono font-bold">#{selectedUserDetail.id}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-400">Phone Contact:</span>
                  <span className="font-semibold">{selectedUserDetail.phone || 'Not provided'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-400">KYC Status:</span>
                  <span className="font-bold uppercase text-purple-600 dark:text-purple-400">
                    {selectedUserDetail.kyc_status}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-400">Email Verification:</span>
                  <span className="font-semibold">
                    {selectedUserDetail.email_verified_at ? 'Verified' : 'Pending Verification'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-400">Registered On:</span>
                  <span className="font-medium">
                    {new Date(selectedUserDetail.created_at).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Quick Role Elevation Switcher */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  Update Member Privilege Role:
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {['traveller', 'host', 'moderator', 'admin'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleRoleChange(selectedUserDetail.id, r)}
                      disabled={actionLoadingId === selectedUserDetail.id}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all border ${
                        selectedUserDetail.role === r
                          ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                          : 'bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-purple-400'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => handleToggleStatus(selectedUserDetail)}
                  disabled={actionLoadingId === selectedUserDetail.id}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold inline-flex items-center gap-1.5 transition-all ${
                    selectedUserDetail.is_active
                      ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 hover:bg-rose-100'
                      : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{selectedUserDetail.is_active ? 'Suspend Account' : 'Reactivate Account'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedUserDetail(null)}
                  className="px-4 py-2 rounded-2xl bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 text-xs font-bold hover:bg-gray-200 transition-colors"
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
