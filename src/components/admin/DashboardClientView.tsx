'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Compass,
  CalendarCheck,
  TrendingUp,
  Percent,
  Coins,
  ShieldAlert,
  ArrowUpRight,
  BarChart3,
  Layers,
  CircleDollarSign,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  Award,
  CreditCard,
  Bot,
  Activity,
  AlertTriangle,
  Flame,
} from 'lucide-react';
import {
  AdminDashboardOverviewStats,
  AdminDashboardRecentBooking,
} from '@/actions/admin/dashboard';
import { AiQuotaTelemetry } from '@/lib/ai/quotaTracker';
import { useSession } from 'next-auth/react';

interface DashboardClientViewProps {
  stats: AdminDashboardOverviewStats;
  recentBookings: AdminDashboardRecentBooking[];
  aiTelemetry?: AiQuotaTelemetry;
  isSuperAdmin?: boolean;
}

type TabType = 'overview' | 'analytics' | 'sales';

const tabs: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Overview', icon: Layers },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'sales', label: 'Ledger & Sales', icon: CircleDollarSign },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' as const },
  },
};

export function DashboardClientView({
  stats,
  recentBookings,
  aiTelemetry,
  isSuperAdmin: initialIsSuperAdmin,
}: DashboardClientViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const { data: session } = useSession();

  const userRole = (session?.user as any)?.role?.toLowerCase?.()?.trim?.() || '';
  const isSuperAdmin =
    initialIsSuperAdmin ??
    (userRole === 'super admin' || userRole === 'superadmin');

  return (
    <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header section with Title, Pending KYC pill, and Interactive Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
            Dashboard Overview
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Real-time telemetry of marketplace ecosystem, platform users, and financial ledger.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {stats.pendingKycCount > 0 && (
            <Link
              href="/admin/kyc"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-bold hover:bg-amber-500/20 transition shadow-2xs"
            >
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <span>{stats.pendingKycCount} Pending KYC</span>
            </Link>
          )}

          {/* Smooth Capsule Tab Switcher */}
          <div className="flex items-center p-1.5 rounded-full bg-gray-200/70 dark:bg-white/10 backdrop-blur-md border border-gray-200/90 dark:border-white/10">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className="relative px-4 py-1.5 rounded-full text-xs font-bold transition-colors select-none flex items-center gap-1.5 outline-none"
                >
                  {/* Sliding Active Pill Background (Framer Motion layoutId) */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabBadge"
                      className="absolute inset-0 rounded-full bg-white dark:bg-purple-600 shadow-sm shadow-black/10 dark:shadow-purple-600/40"
                      transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                    />
                  )}

                  <span
                    className={`relative z-10 flex items-center gap-1.5 transition-colors duration-200 ${
                      isActive
                        ? 'text-gray-900 dark:text-white font-extrabold'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <TabIcon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content with Fluid Transition & Staggered Cards */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="space-y-6"
        >
          {activeTab === 'overview' && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              {/* Google Gemini AI API Quota & Limit Telemetry Widget */}
              {aiTelemetry && (
                <motion.div
                  variants={itemVariants}
                  className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-sm space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                        <Bot className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                            Google Gemini AI — Quota & Rate Limit Health
                          </h2>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              aiTelemetry.status === 'OPTIMAL'
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : aiTelemetry.status === 'WARNING'
                                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 animate-pulse'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                aiTelemetry.status === 'OPTIMAL'
                                  ? 'bg-emerald-500'
                                  : aiTelemetry.status === 'WARNING'
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                            />
                            {aiTelemetry.status === 'OPTIMAL'
                              ? 'Normal (Sehat)'
                              : aiTelemetry.status === 'WARNING'
                              ? 'Mendekati Limit'
                              : 'Limit Terlewati (429)'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Pantau pemakaian kapasitas request per menit (RPM), batas harian (RPD), dan estimasi waktu reset limit.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10">
                        {aiTelemetry.totalTokensToday.toLocaleString()} Tokens Hari Ini
                      </span>
                    </div>
                  </div>

                  {/* 3 Telemetry Limit Cards: Menit, Harian, Mingguan */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                    {/* 1. Limit Per Menit (RPM) */}
                    <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-gray-200/80 dark:border-white/5 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-indigo-500" /> Kapasitas Menit (RPM)
                        </span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {aiTelemetry.minute.usedRequests} / {aiTelemetry.minute.limit} req
                        </span>
                      </div>
                      {/* Progress Bar */}
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            aiTelemetry.minute.percent >= 90
                              ? 'bg-rose-500'
                              : aiTelemetry.minute.percent >= 70
                              ? 'bg-amber-500'
                              : 'bg-indigo-500'
                          }`}
                          style={{ width: `${Math.max(5, aiTelemetry.minute.percent)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span>Sisa: <strong>{aiTelemetry.minute.remaining} request</strong></span>
                        <span className="font-mono text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Reset dlm {aiTelemetry.minute.resetInSeconds}s
                        </span>
                      </div>
                    </div>

                    {/* 2. Limit Harian (RPD) */}
                    <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-gray-200/80 dark:border-white/5 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <CalendarCheck className="w-3.5 h-3.5 text-purple-500" /> Batas Kuota Harian (RPD)
                        </span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {aiTelemetry.daily.usedRequests} / {aiTelemetry.daily.limit} req
                        </span>
                      </div>
                      {/* Progress Bar */}
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            aiTelemetry.daily.percent >= 90
                              ? 'bg-rose-500'
                              : aiTelemetry.daily.percent >= 75
                              ? 'bg-amber-500'
                              : 'bg-purple-500'
                          }`}
                          style={{ width: `${Math.max(5, aiTelemetry.daily.percent)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span>Sisa: <strong>{aiTelemetry.daily.remaining} request</strong></span>
                        <span className="font-mono text-purple-600 dark:text-purple-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Reset dlm ~{aiTelemetry.daily.resetInHours} jam
                        </span>
                      </div>
                    </div>

                    {/* 3. Kapasitas Mingguan */}
                    <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-gray-200/80 dark:border-white/5 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5 text-amber-500" /> Siklus Mingguan (7 Hari)
                        </span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {aiTelemetry.weekly.usedRequests} / {aiTelemetry.weekly.limit} req
                        </span>
                      </div>
                      {/* Progress Bar */}
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-amber-500 transition-all duration-500"
                          style={{ width: `${Math.max(5, aiTelemetry.weekly.percent)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span>Sisa: <strong>{aiTelemetry.weekly.remaining} request</strong></span>
                        <span className="font-mono text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Reset dlm ~{aiTelemetry.weekly.resetInDays} hari
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Synthetic Seeding Status Footer (Khusus Super Admin Internal Tracker) */}
                  {isSuperAdmin && aiTelemetry.syntheticSeedStats && (
                    <div className="pt-3 border-t border-gray-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          AI Synthetic Personas & Seeding Telemetry:
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          🤖 Users: <strong>{aiTelemetry.syntheticSeedStats.aiUsers}</strong>
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          📖 Stories: <strong>{aiTelemetry.syntheticSeedStats.aiStories}</strong>
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-cyan-50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                          💬 Threads: <strong>{aiTelemetry.syntheticSeedStats.aiForumThreads}</strong>
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                          ✍️ Replies: <strong>{aiTelemetry.syntheticSeedStats.aiForumReplies}</strong>
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          🎒 Meetups: <strong>{aiTelemetry.syntheticSeedStats.aiMeetups}</strong>
                        </span>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Metric Cards Grid - Staggered items */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {/* Total Users */}
                <motion.div
                  variants={itemVariants}
                  whileHover={{ y: -3 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="p-6 rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-sm space-y-3 transition-colors"
                >
                  <div className="flex items-center justify-between text-gray-400 dark:text-gray-500">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Total Users
                    </span>
                    <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <span className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                      {stats.totalUsers}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mt-1">
                      {stats.totalHosts} Hosts • {stats.totalTravellers} Travellers
                    </span>
                  </div>
                </motion.div>

                {/* Total Experiences */}
                <motion.div
                  variants={itemVariants}
                  whileHover={{ y: -3 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="p-6 rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-sm space-y-3 transition-colors"
                >
                  <div className="flex items-center justify-between text-gray-400 dark:text-gray-500">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Experiences
                    </span>
                    <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                      <Compass className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <span className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                      {stats.totalPublishedExperiences}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mt-1">
                      Published active ({stats.totalExperiences} in catalog)
                    </span>
                  </div>
                </motion.div>

                {/* Gross Revenue / GMV */}
                <motion.div
                  variants={itemVariants}
                  whileHover={{ y: -3 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="p-6 rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-sm space-y-3 transition-colors"
                >
                  <div className="flex items-center justify-between text-gray-400 dark:text-gray-500">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Gross GMV
                    </span>
                    <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <span className="text-2xl sm:text-3xl font-black text-cyan-600 dark:text-cyan-400 tracking-tight">
                      Rp {stats.grossRevenueIdr.toLocaleString('id-ID')}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mt-1">
                      ${stats.grossRevenueUsd} USD • Total Booking: {stats.totalBookings}
                    </span>
                  </div>
                </motion.div>

                {/* Platform Take-Rate Revenue (12%) */}
                <motion.div
                  variants={itemVariants}
                  whileHover={{ y: -3 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="p-6 rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-sm space-y-3 transition-colors"
                >
                  <div className="flex items-center justify-between text-gray-400 dark:text-gray-500">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Take-Rate (12%)
                    </span>
                    <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <Percent className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                      Rp {stats.platformRevenueIdr.toLocaleString('id-ID')}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mt-1">
                      ${stats.platformRevenueUsd} USD net platform cut
                    </span>
                  </div>
                </motion.div>
              </div>

              {/* Row 2: LTP Points Status & Infrastructure Architecture */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <motion.div
                  variants={itemVariants}
                  className="md:col-span-2 p-6 rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-sm space-y-4 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-500">
                        <Coins className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                          LTP Points Economy & XP Telemetry
                        </h2>
                        <span className="text-[11px] text-gray-400 dark:text-gray-500">
                          Pegged valuation: 1 LTP = $1 USD • Dynamic gamification reward loop
                        </span>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 text-xs font-bold border border-purple-200 dark:border-purple-800">
                      Live Economy
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div className="p-4 rounded-2xl bg-gray-50/80 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                      <span className="text-xs text-gray-500 dark:text-gray-400 block">Circulating Wallet Tokens</span>
                      <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block tracking-tight">
                        {stats.ltpCirculating.toFixed(1)} LTP
                      </span>
                      <span className="text-[11px] text-gray-400 dark:text-gray-500">
                        Equivalent: Rp {(stats.ltpCirculating * stats.usdToIdrRate).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-gray-50/80 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                      <span className="text-xs text-gray-500 dark:text-gray-400 block">Community XP Distributed</span>
                      <span className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1 block tracking-tight">
                        {stats.totalXpDistributed.toLocaleString('id-ID')} XP
                      </span>
                      <span className="text-[11px] text-gray-400 dark:text-gray-500">
                        Total experience scoring earned
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-gray-50/80 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                      <span className="text-xs text-gray-500 dark:text-gray-400 block">Discount Redemptions</span>
                      <span className="text-2xl font-black text-gray-900 dark:text-white mt-1 block tracking-tight">
                        {stats.ltpDebitCount} Times
                      </span>
                      <span className="text-[11px] text-gray-400 dark:text-gray-500">
                        Total checkout token burns
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Monolith Infrastructure */}
                <motion.div
                  variants={itemVariants}
                  className="p-6 rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-sm space-y-4 flex flex-col justify-between transition-colors"
                >
                  <div>
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Monolith Infrastructure</h2>
                    <div className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
                      <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-white/5">
                        <span className="text-gray-400 dark:text-gray-500">Architecture:</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">Next.js 16 + Prisma</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-white/5">
                        <span className="text-gray-400 dark:text-gray-500">Database:</span>
                        <span className="font-semibold text-gray-800 dark:text-white">PostgreSQL 15</span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-gray-400 dark:text-gray-500">Base FX Rate:</span>
                        <span className="font-semibold text-gray-800 dark:text-white">1 USD = Rp {stats.usdToIdrRate.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href="/admin/experiences"
                    className="w-full py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs text-center shadow-sm shadow-purple-600/20 transition flex items-center justify-center gap-1.5"
                  >
                    <span>Manage Tour Catalog</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </motion.div>
              </div>

              {/* Row 3: Recent Bookings Table */}
              <motion.div
                variants={itemVariants}
                className="rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-sm p-6 space-y-4 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-2xl bg-emerald-500/10 text-emerald-500">
                      <CalendarCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-gray-900 dark:text-white">Recent Marketplace Bookings</h2>
                      <span className="text-[11px] text-gray-400">Live booking activity synced from database</span>
                    </div>
                  </div>
                  <Link href="/admin/bookings" className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline">
                    View All Bookings
                  </Link>
                </div>

                {recentBookings && recentBookings.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 dark:bg-white/5 text-gray-400 dark:text-gray-400 uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="px-4 py-3 rounded-l-2xl">Ref Code</th>
                          <th className="px-4 py-3">Experience</th>
                          <th className="px-4 py-3">Customer</th>
                          <th className="px-4 py-3">Trip Date</th>
                          <th className="px-4 py-3">Total</th>
                          <th className="px-4 py-3 rounded-r-2xl">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-gray-600 dark:text-gray-300">
                        {recentBookings.map((b) => (
                          <tr key={b.id} className="hover:bg-gray-50/70 dark:hover:bg-white/5 transition">
                            <td className="px-4 py-3.5 font-mono font-bold text-purple-600 dark:text-purple-400">
                              {b.bookingReference || `#${b.id}`}
                            </td>
                            <td className="px-4 py-3.5 font-medium max-w-[220px] truncate text-gray-900 dark:text-white">
                              {b.experienceTitle}
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="font-semibold block text-gray-800 dark:text-gray-200">{b.customerName}</span>
                              <span className="text-[10px] text-gray-400">{b.customerEmail}</span>
                            </td>
                            <td className="px-4 py-3.5">
                              {b.selectedDate ? new Date(b.selectedDate).toLocaleDateString('id-ID') : '-'}
                              <span className="text-[10px] text-gray-400 block">({b.participantCount || 1} pax)</span>
                            </td>
                            <td className="px-4 py-3.5 font-bold text-gray-900 dark:text-white">
                              ${b.totalPrice} USD
                            </td>
                            <td className="px-4 py-3.5">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                  b.status === 'completed' || b.status === 'confirmed'
                                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40'
                                    : b.status === 'cancelled'
                                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/40'
                                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/40'
                                }`}
                              >
                                {b.status || 'pending'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-10 text-center text-gray-400 text-xs">
                    Belum ada transaksi pemesanan tiket yang tercatat di basis data.
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              {/* Analytics Top 3 Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <motion.div
                  variants={itemVariants}
                  whileHover={{ y: -3 }}
                  className="p-6 rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-sm space-y-2"
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Average Booking Value
                  </span>
                  <div className="text-2xl font-black text-gray-900 dark:text-white">
                    ${stats.totalBookings > 0 ? (stats.grossRevenueUsd / stats.totalBookings).toFixed(1) : '0'} USD
                  </div>
                  <p className="text-xs text-gray-400">Per reservation transaction</p>
                </motion.div>

                <motion.div
                  variants={itemVariants}
                  whileHover={{ y: -3 }}
                  className="p-6 rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-sm space-y-2"
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Experiences per Host Ratio
                  </span>
                  <div className="text-2xl font-black text-teal-600 dark:text-teal-400">
                    {stats.totalHosts > 0 ? (stats.totalExperiences / stats.totalHosts).toFixed(2) : '0'}
                  </div>
                  <p className="text-xs text-gray-400">Package density per registered local host</p>
                </motion.div>

                <motion.div
                  variants={itemVariants}
                  whileHover={{ y: -3 }}
                  className="p-6 rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-sm space-y-2"
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Pending KYC Review
                  </span>
                  <div className="text-2xl font-black text-amber-500">
                    {stats.pendingKycCount} Host Submissions
                  </div>
                  <p className="text-xs text-gray-400">Awaiting identity compliance verification</p>
                </motion.div>
              </div>

              {/* Analytics Telemetry Chart Simulation */}
              <motion.div
                variants={itemVariants}
                className="p-6 rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-purple-500" />
                    Marketplace Volume Telemetry
                  </h3>
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    PostgreSQL Synced
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                    <span className="text-[11px] text-gray-400 block">Total Catalog Items</span>
                    <span className="text-xl font-bold text-gray-900 dark:text-white mt-1 block">
                      {stats.totalExperiences} Listings
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                    <span className="text-[11px] text-gray-400 block">Gross Yield (IDR)</span>
                    <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
                      Rp {stats.grossRevenueIdr.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                    <span className="text-[11px] text-gray-400 block">Net Commission (12%)</span>
                    <span className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-1 block">
                      Rp {stats.platformRevenueIdr.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                    <span className="text-[11px] text-gray-400 block">Token Burn Frequency</span>
                    <span className="text-xl font-bold text-amber-500 mt-1 block">
                      {stats.ltpDebitCount} Checkouts
                    </span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {activeTab === 'sales' && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              {/* Sales Ledger Breakdown Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <motion.div
                  variants={itemVariants}
                  whileHover={{ y: -3 }}
                  className="p-6 rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-sm space-y-2"
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Gross GMV Settled
                  </span>
                  <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400">
                    Rp {stats.grossRevenueIdr.toLocaleString('id-ID')}
                  </div>
                  <p className="text-xs text-gray-400">${stats.grossRevenueUsd} USD equivalent total volume</p>
                </motion.div>

                <motion.div
                  variants={itemVariants}
                  whileHover={{ y: -3 }}
                  className="p-6 rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-sm space-y-2"
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Locallytrip Net Fee (12%)
                  </span>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    Rp {stats.platformRevenueIdr.toLocaleString('id-ID')}
                  </div>
                  <p className="text-xs text-gray-400">${stats.platformRevenueUsd} USD platform earnings</p>
                </motion.div>

                <motion.div
                  variants={itemVariants}
                  whileHover={{ y: -3 }}
                  className="p-6 rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-sm space-y-2"
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Total Transactions
                  </span>
                  <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
                    {stats.totalBookings} Total ({stats.totalCompletedBookings} Settled)
                  </div>
                  <p className="text-xs text-gray-400">Processed through automated checkout flow</p>
                </motion.div>
              </div>

              {/* Transactions Ledger Table */}
              <motion.div
                variants={itemVariants}
                className="rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-sm p-6 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <CircleDollarSign className="w-4 h-4 text-emerald-500" />
                    Complete Sales Ledger
                  </h3>
                  <Link
                    href="/admin/finances"
                    className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    <span>Full Ledger Console</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {recentBookings && recentBookings.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 dark:bg-white/5 text-gray-400 uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="px-4 py-3 rounded-l-2xl">Ref</th>
                          <th className="px-4 py-3">Customer</th>
                          <th className="px-4 py-3">Experience</th>
                          <th className="px-4 py-3">Gross Total</th>
                          <th className="px-4 py-3">12% Fee</th>
                          <th className="px-4 py-3 rounded-r-2xl">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-gray-600 dark:text-gray-300">
                        {recentBookings.map((b) => (
                          <tr key={b.id} className="hover:bg-gray-50/70 dark:hover:bg-white/5 transition">
                            <td className="px-4 py-3.5 font-mono font-bold text-purple-600 dark:text-purple-400">
                              {b.bookingReference || `#${b.id}`}
                            </td>
                            <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-white">
                              {b.customerName}
                            </td>
                            <td className="px-4 py-3.5 truncate max-w-[200px]">
                              {b.experienceTitle}
                            </td>
                            <td className="px-4 py-3.5 font-bold text-gray-900 dark:text-white">
                              ${b.totalPrice} USD
                            </td>
                            <td className="px-4 py-3.5 font-bold text-emerald-600 dark:text-emerald-400">
                              ${(b.totalPrice * 0.12).toFixed(2)} USD
                            </td>
                            <td className="px-4 py-3.5">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                  b.status === 'completed' || b.status === 'confirmed'
                                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40'
                                    : b.status === 'cancelled'
                                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/40'
                                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/40'
                                }`}
                              >
                                {b.status || 'settled'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-10 text-center text-gray-400 text-xs">
                    Belum ada transaksi pemesanan yang tercatat.
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
