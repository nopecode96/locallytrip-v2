'use client';

import React, { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coins,
  Sparkles,
  Award,
  Search,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Gift,
  Send,
  Loader2,
  Filter,
  Check,
  X,
  User,
  ShieldCheck,
  Percent,
} from 'lucide-react';
import {
  EconomyLeaderboardUser,
  EconomyRedemptionClaimItem,
  EconomyTransactionItem,
  updateClaimStatus,
  grantManualAirdrop,
} from '@/actions/admin/economy';
import { getPublicImageUrl } from '@/lib/images';
import { resolveAvatarUrl } from '@/lib/avatar';
import { AdminPagination } from '@/components/admin/ui/AdminPagination';

interface EconomyControlClientProps {
  stats: {
    totalLtpCirculating: number;
    totalXpDistributed: number;
    totalWalletsCount: number;
    totalAirdropCreditsCount: number;
    totalTicketRedemptionsCount: number;
    totalTicketRedemptionsVolume: number;
    pendingClaimsCount: number;
    totalClaimsCount: number;
    usdToIdrRate: number;
  };
  initialLeaderboard: EconomyLeaderboardUser[];
  initialClaims: EconomyRedemptionClaimItem[];
  initialTransactions: EconomyTransactionItem[];
}

type SubTab = 'leaderboard' | 'claims' | 'transactions';

export function EconomyControlClient({
  stats,
  initialLeaderboard,
  initialClaims,
  initialTransactions,
}: EconomyControlClientProps) {
  const [activeTab, setActiveTab] = useState<SubTab>('leaderboard');
  const [leaderboard, setLeaderboard] = useState<EconomyLeaderboardUser[]>(initialLeaderboard);
  const [claims, setClaims] = useState<EconomyRedemptionClaimItem[]>(initialClaims);
  const [transactions, setTransactions] = useState<EconomyTransactionItem[]>(initialTransactions);

  // Filters & sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [leaderboardSort, setLeaderboardSort] = useState<'ltp' | 'xp' | 'recent'>('ltp');
  const [claimFilter, setClaimFilter] = useState('all');

  // Pagination states
  const [leaderboardPage, setLeaderboardPage] = useState(1);
  const [leaderboardPageSize, setLeaderboardPageSize] = useState(15);
  const [claimsPage, setClaimsPage] = useState(1);
  const [claimsPageSize, setClaimsPageSize] = useState(10);
  const [txPage, setTxPage] = useState(1);
  const [txPageSize, setTxPageSize] = useState(15);

  // Manual Airdrop Modal state
  const [selectedAirdropUser, setSelectedAirdropUser] = useState<EconomyLeaderboardUser | null>(null);
  const [airdropLtp, setAirdropLtp] = useState(100);
  const [airdropXp, setAirdropXp] = useState(500);
  const [airdropReason, setAirdropReason] = useState('Promotional Loyalty Incentive');

  const [isPending, startTransition] = useTransition();
  const [actionLoadingId, setActionLoadingId] = useState<string | number | null>(null);

  // Filtered leaderboard
  const filteredLeaderboard = leaderboard
    .filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      return (
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.username && u.username.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (leaderboardSort === 'ltp') return b.ltp_balance - a.ltp_balance;
      if (leaderboardSort === 'xp') return b.total_xp - a.total_xp;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  // Filtered claims
  const filteredClaims = claims.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      c.user.name.toLowerCase().includes(q) ||
      c.user.email.toLowerCase().includes(q) ||
      c.reward_title.toLowerCase().includes(q);

    const matchesStatus =
      claimFilter === 'all' || c.status.toLowerCase() === claimFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // Paginated slices
  const paginatedLeaderboard = filteredLeaderboard.slice(
    (leaderboardPage - 1) * leaderboardPageSize,
    leaderboardPage * leaderboardPageSize
  );

  const paginatedClaims = filteredClaims.slice(
    (claimsPage - 1) * claimsPageSize,
    claimsPage * claimsPageSize
  );

  const paginatedTransactions = transactions.slice(
    (txPage - 1) * txPageSize,
    txPage * txPageSize
  );

  const handleUpdateClaim = (
    claimId: number,
    newStatus: 'APPROVED' | 'COMPLETED' | 'REJECTED' | 'PENDING'
  ) => {
    setActionLoadingId(claimId);
    startTransition(async () => {
      const res = await updateClaimStatus(claimId, newStatus);
      if (res.success) {
        setClaims((prev) =>
          prev.map((c) => (c.id === claimId ? { ...c, status: newStatus } : c))
        );
      }
      setActionLoadingId(null);
    });
  };

  const handleExecuteAirdrop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAirdropUser) return;

    setActionLoadingId(`airdrop-${selectedAirdropUser.id}`);
    startTransition(async () => {
      const res = await grantManualAirdrop(
        selectedAirdropUser.id,
        airdropLtp,
        airdropXp,
        airdropReason
      );

      if (res.success) {
        // Optimistic update
        setLeaderboard((prev) =>
          prev.map((u) =>
            u.id === selectedAirdropUser.id
              ? {
                  ...u,
                  ltp_balance: u.ltp_balance + airdropLtp,
                  total_xp: u.total_xp + airdropXp,
                  xp_level: Math.floor((u.total_xp + airdropXp) / 1000) + 1,
                }
              : u
          )
        );
        setSelectedAirdropUser(null);
      } else {
        alert(res.error || 'Failed to execute manual airdrop.');
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
      {/* Header & Main Navigation Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
            Gamification & Economy Control
            <Coins className="w-5 h-5 text-amber-500 animate-pulse" />
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Telemetry of circulating LTP tokens, traveler XP leaderboards, and redemption claims.
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center p-1.5 rounded-full bg-gray-200/70 dark:bg-white/10 backdrop-blur-md border border-gray-200/90 dark:border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeTab === 'leaderboard'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            User Scoring & Wallets
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('claims')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all relative ${
              activeTab === 'claims'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span>Redemption Claims</span>
            {stats.pendingClaimsCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-500 text-white">
                {stats.pendingClaimsCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeTab === 'transactions'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Token Streams
          </button>
        </div>
      </div>

      {/* Economic Telemetry Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Circulating LTP */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-sm space-y-3 transition-colors">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Circulating LTP Tokens
            </span>
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
              {stats.totalLtpCirculating.toLocaleString(undefined, { maximumFractionDigits: 1 })} LTP
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 block mt-1">
              ≈ Rp {(stats.totalLtpCirculating * stats.usdToIdrRate).toLocaleString('id-ID', { maximumFractionDigits: 0 })} IDR valuation
            </span>
          </div>
        </div>

        {/* Distributed XP */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-sm space-y-3 transition-colors">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Total XP Distributed
            </span>
            <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-purple-600 dark:text-purple-400 tracking-tight">
              {stats.totalXpDistributed.toLocaleString()} XP
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 block mt-1">
              Active gamification progression points
            </span>
          </div>
        </div>

        {/* Active Airdrops & Claims */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-sm space-y-3 transition-colors">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Reward Claims
            </span>
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <Gift className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-cyan-600 dark:text-cyan-400 tracking-tight">
              {stats.pendingClaimsCount} Pending
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 block mt-1">
              {stats.totalClaimsCount} total tier rewards claimed
            </span>
          </div>
        </div>

        {/* Ticket Discount Redemptions */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-sm space-y-3 transition-colors">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Ticket Checkouts (Burn)
            </span>
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              {stats.totalTicketRedemptionsCount} Times
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 block mt-1">
              {stats.totalTicketRedemptionsVolume.toFixed(1)} LTP discount redeemed
            </span>
          </div>
        </div>
      </div>

      {/* Tab 1: User Scoring & Wallet Leaderboard */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-4">
          {/* Controls Bar: Search + Sorters */}
          <div className="p-4 rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search user by name, email, username..."
                className="w-full pl-10 pr-4 py-2 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setLeaderboardSort('ltp')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                  leaderboardSort === 'ltp'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                }`}
              >
                Top LTP Holders
              </button>
              <button
                type="button"
                onClick={() => setLeaderboardSort('xp')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                  leaderboardSort === 'xp'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                }`}
              >
                Top XP Scorers
              </button>
              <button
                type="button"
                onClick={() => setLeaderboardSort('recent')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                  leaderboardSort === 'recent'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                }`}
              >
                Newest
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 dark:bg-white/5 text-gray-400 uppercase tracking-wider text-[10px] font-bold border-b border-gray-100 dark:border-white/5">
                  <tr>
                    <th className="px-5 py-3.5">User Profile</th>
                    <th className="px-4 py-3.5">Role</th>
                    <th className="px-4 py-3.5">XP Score & Tier</th>
                    <th className="px-4 py-3.5">LTP Wallet Balance</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                    <th className="px-5 py-3.5 text-right">Airdrop Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-gray-600 dark:text-gray-300">
                  {paginatedLeaderboard.length > 0 ? (
                    paginatedLeaderboard.map((user, idx) => {
                      const globalIdx = (leaderboardPage - 1) * leaderboardPageSize + idx;
                      return (
                        <tr
                          key={user.id}
                          className="hover:bg-gray-50/70 dark:hover:bg-white/5 transition group"
                        >
                          {/* Identity */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-gray-400 text-xs w-4">
                                #{globalIdx + 1}
                              </span>
                              <div className="w-8 h-8 rounded-xl overflow-hidden bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center shrink-0 border border-purple-200/50 dark:border-purple-800/50">
                                <img
                                  src={resolveAvatarUrl(user)}
                                  alt={user.name}
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
                                <span className="font-bold text-gray-900 dark:text-white block truncate max-w-[140px]">
                                  {user.name}
                                </span>
                                <span className="text-[10px] text-gray-400 block truncate max-w-[140px]">
                                  {user.email}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="px-4 py-4">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300">
                              {user.role}
                            </span>
                          </td>

                          {/* XP & Level */}
                          <td className="px-4 py-4">
                            <span className="font-bold text-purple-600 dark:text-purple-400 block">
                              {user.total_xp.toLocaleString()} XP
                            </span>
                            <span className="text-[10px] text-gray-400 block">
                              Level {user.xp_level} Explorer
                            </span>
                          </td>

                          {/* LTP Balance */}
                          <td className="px-4 py-4">
                            <span className="font-extrabold text-amber-600 dark:text-amber-400 block">
                              {user.ltp_balance.toLocaleString(undefined, { maximumFractionDigits: 1 })} LTP
                            </span>
                            <span className="text-[10px] text-gray-400 block">
                              ≈ ${user.ltp_balance.toFixed(0)} USD
                            </span>
                          </td>

                          {/* Account Status */}
                          <td className="px-4 py-4 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                user.is_active
                                  ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300'
                                  : 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300'
                              }`}
                            >
                              {user.is_active ? 'Active' : 'Suspended'}
                            </span>
                          </td>

                          {/* Manual Airdrop Trigger */}
                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedAirdropUser(user)}
                              className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-600 hover:text-white text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold transition inline-flex items-center gap-1.5 shadow-2xs"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Airdrop</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400 text-xs">
                        No users found matching current leaderboard criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Leaderboard Pagination */}
          <AdminPagination
            pagination={{
              totalItems: filteredLeaderboard.length,
              totalPages: Math.ceil(filteredLeaderboard.length / leaderboardPageSize) || 1,
              currentPage: leaderboardPage,
              pageSize: leaderboardPageSize,
            }}
            onPageChange={setLeaderboardPage}
            onPageSizeChange={(newSize) => {
              setLeaderboardPageSize(newSize);
              setLeaderboardPage(1);
            }}
          />
        </div>
      )}

      {/* Tab 2: Redemption & Reward Claims */}
      {activeTab === 'claims' && (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-sm flex items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search claims by member or reward title..."
                className="w-full pl-10 pr-4 py-2 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>

            <div className="flex items-center gap-1.5">
              {['all', 'pending', 'approved', 'completed', 'rejected'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setClaimFilter(st)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition ${
                    claimFilter === st
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 dark:bg-white/5 text-gray-400 uppercase tracking-wider text-[10px] font-bold border-b border-gray-100 dark:border-white/5">
                  <tr>
                    <th className="px-5 py-3.5">Claim ID</th>
                    <th className="px-4 py-3.5">Member Identity</th>
                    <th className="px-4 py-3.5">Reward Unlocked</th>
                    <th className="px-4 py-3.5">Claimed Date</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Fulfillment Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-gray-600 dark:text-gray-300">
                  {paginatedClaims.length > 0 ? (
                    paginatedClaims.map((c) => {
                      const isLoading = actionLoadingId === c.id;

                      return (
                        <tr
                          key={c.id}
                          className="hover:bg-gray-50/70 dark:hover:bg-white/5 transition"
                        >
                          <td className="px-5 py-4 font-mono font-bold text-purple-600 dark:text-purple-400">
                            #{c.id}
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-bold text-gray-900 dark:text-white block">
                              {c.user.name}
                            </span>
                            <span className="text-[10px] text-gray-400 block">{c.user.email}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-bold text-gray-800 dark:text-gray-200 block">
                              {c.reward_title}
                            </span>
                            <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold block">
                              Tier Level {c.level} • {c.reward_type}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-gray-400">
                            {new Date(c.claimed_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                c.status === 'APPROVED' || c.status === 'COMPLETED'
                                  ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300'
                                  : c.status === 'REJECTED'
                                  ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300'
                                  : 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                              }`}
                            >
                              {c.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {c.status === 'PENDING' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateClaim(c.id, 'APPROVED')}
                                    disabled={isLoading}
                                    className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white font-bold text-[10px] hover:bg-emerald-500 transition inline-flex items-center gap-1"
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>Approve</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateClaim(c.id, 'REJECTED')}
                                    disabled={isLoading}
                                    className="px-2.5 py-1 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 font-bold text-[10px] hover:bg-rose-100 transition inline-flex items-center gap-1"
                                  >
                                    <X className="w-3 h-3" />
                                    <span>Reject</span>
                                  </button>
                                </>
                              )}
                              {c.status === 'APPROVED' && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateClaim(c.id, 'COMPLETED')}
                                  disabled={isLoading}
                                  className="px-2.5 py-1 rounded-xl bg-teal-600 text-white font-bold text-[10px] hover:bg-teal-500 transition"
                                >
                                  Mark Completed
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400 text-xs">
                        No reward claims found matching criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Claims Pagination */}
          <AdminPagination
            pagination={{
              totalItems: filteredClaims.length,
              totalPages: Math.ceil(filteredClaims.length / claimsPageSize) || 1,
              currentPage: claimsPage,
              pageSize: claimsPageSize,
            }}
            onPageChange={setClaimsPage}
            onPageSizeChange={(newSize) => {
              setClaimsPageSize(newSize);
              setClaimsPage(1);
            }}
          />
        </div>
      )}

      {/* Tab 3: Token Stream Ledger */}
      {activeTab === 'transactions' && (
        <div className="rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-500" />
                Live LTP Token Transaction Stream
              </h3>
              <p className="text-xs text-gray-400">Atomic database ledger of credits and burns.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 dark:bg-white/5 text-gray-400 uppercase tracking-wider text-[10px] font-bold border-b border-gray-100 dark:border-white/5">
                <tr>
                  <th className="px-4 py-3">Tx Ref</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Activity Trigger</th>
                  <th className="px-4 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-gray-600 dark:text-gray-300">
                {paginatedTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/70 dark:hover:bg-white/5 transition">
                    <td className="px-4 py-3 font-mono text-purple-600 dark:text-purple-400 text-[11px]">
                      {t.id.slice(0, 8)}...
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                      {t.user.name}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          t.type === 'credit'
                            ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300'
                            : 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                        }`}
                      >
                        {t.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-extrabold text-gray-900 dark:text-white">
                      {t.type === 'credit' ? '+' : '-'}
                      {t.amount.toFixed(1)} LTP
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-[11px]">
                      {t.activity_type}
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {t.created_at ? new Date(t.created_at).toLocaleString('id-ID') : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Transactions Pagination */}
          <AdminPagination
            pagination={{
              totalItems: transactions.length,
              totalPages: Math.ceil(transactions.length / txPageSize) || 1,
              currentPage: txPage,
              pageSize: txPageSize,
            }}
            onPageChange={setTxPage}
            onPageSizeChange={(newSize) => {
              setTxPageSize(newSize);
              setTxPage(1);
            }}
          />
        </div>
      )}

      {/* Manual Airdrop Modal */}
      <AnimatePresence>
        {selectedAirdropUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="w-full max-w-md rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 p-6 shadow-2xl space-y-5 relative"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400 block">
                    Admin Economy Tool
                  </span>
                  <h3 className="text-base font-black text-gray-900 dark:text-white mt-0.5">
                    Manual Airdrop Dispatch
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAirdropUser(null)}
                  className="w-7 h-7 rounded-full bg-gray-100 dark:bg-white/10 text-gray-400 flex items-center justify-center text-xs hover:bg-gray-200 transition"
                >
                  ✕
                </button>
              </div>

              {/* Recipient summary */}
              <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 font-black text-sm flex items-center justify-center shrink-0">
                  {selectedAirdropUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-gray-900 dark:text-white block truncate text-xs">
                    {selectedAirdropUser.name}
                  </span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 block truncate">
                    {selectedAirdropUser.email} • Balance: {selectedAirdropUser.ltp_balance} LTP
                  </span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleExecuteAirdrop} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    LTP Token Amount:
                  </label>
                  <input
                    type="number"
                    value={airdropLtp}
                    onChange={(e) => setAirdropLtp(Number(e.target.value))}
                    min={0}
                    step={1}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {[50, 100, 250, 500].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setAirdropLtp(amt)}
                        className="px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-white/10 text-[10px] font-bold text-gray-600 dark:text-gray-300 hover:bg-purple-100"
                      >
                        +{amt} LTP
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    XP Points Reward:
                  </label>
                  <input
                    type="number"
                    value={airdropXp}
                    onChange={(e) => setAirdropXp(Number(e.target.value))}
                    min={0}
                    step={50}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Administrative Memo / Campaign Note:
                  </label>
                  <input
                    type="text"
                    value={airdropReason}
                    onChange={(e) => setAirdropReason(e.target.value)}
                    required
                    placeholder="e.g. VIP Ambassador Reward"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="submit"
                    disabled={Boolean(actionLoadingId)}
                    className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold inline-flex items-center gap-1.5 shadow-lg shadow-purple-600/25 transition disabled:opacity-50"
                  >
                    {actionLoadingId ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Dispatch Airdrop</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedAirdropUser(null)}
                    className="px-4 py-2.5 rounded-2xl bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
