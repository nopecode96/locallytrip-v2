import React from 'react';
import { getAdminDashboardStats } from '@/actions/admin';
import { CreditCard, TrendingUp, DollarSign, Wallet } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Transaksi & Finansial | Locallytrip Admin',
  description: 'Laporan arus kas transaksi, take-rate komisi 12%, dan pembagian hasil host di Locallytrip.',
};

export const dynamic = 'force-dynamic';

export default async function AdminFinancesPage() {
  const { stats, recentBookings } = await getAdminDashboardStats();

  if (!stats) return null;

  return (
    <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header / Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
            Laporan Transaksi & Finansial
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Rekapitulasi Gross Merchandise Value (GMV), take-rate komisi platform (12%), dan hak bagi hasil host (88%).
          </p>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-sm space-y-2 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Gross Transaction Volume</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white block tracking-tight">
            Rp {stats.grossRevenueIdr.toLocaleString('id-ID')}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 block">${stats.grossRevenueUsd} USD total booking tercatat</span>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-sm space-y-2 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Platform Take-rate (12%)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 block tracking-tight">
            Rp {stats.platformRevenueIdr.toLocaleString('id-ID')}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 block">${stats.platformRevenueUsd} USD komisi bersih platform</span>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-sm space-y-2 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Host Payout Reserve (88%)</span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-teal-600 dark:text-teal-400 block tracking-tight">
            Rp {(stats.grossRevenueIdr - stats.platformRevenueIdr).toLocaleString('id-ID')}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 block">Alokasi hak penerimaan local host</span>
        </div>
      </div>

      {/* Main Data Table Card (Full Width w-full) */}
      <div className="rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-sm p-6 space-y-4 transition-colors">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-emerald-500" />
          <span>Buku Transaksi Pemesanan Tiket</span>
        </h2>

        {recentBookings && recentBookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-white/5 text-gray-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3 rounded-l-2xl">Kode Booking</th>
                  <th className="px-4 py-3">Pengalaman</th>
                  <th className="px-4 py-3">Pelanggan</th>
                  <th className="px-4 py-3">Nilai Bruto</th>
                  <th className="px-4 py-3">Komisi Platform (12%)</th>
                  <th className="px-4 py-3">Hak Host (88%)</th>
                  <th className="px-4 py-3 rounded-r-2xl">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-gray-600 dark:text-gray-300">
                {recentBookings.map((b) => {
                  const comm = Math.round(b.totalPrice * 0.12 * 100) / 100;
                  const hostPart = Math.round((b.totalPrice - comm) * 100) / 100;

                  return (
                    <tr key={b.id} className="hover:bg-gray-50/70 dark:hover:bg-white/5 transition">
                      <td className="px-4 py-3.5 font-mono font-bold text-purple-600 dark:text-purple-400">
                        {b.bookingReference || `#${b.id}`}
                      </td>
                      <td className="px-4 py-3.5 max-w-[200px] truncate text-gray-900 dark:text-white font-medium">
                        {b.experienceTitle}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-gray-700 dark:text-gray-300">
                        {b.customerName}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-gray-900 dark:text-white">
                        ${b.totalPrice} USD
                      </td>
                      <td className="px-4 py-3.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                        +${comm} USD
                      </td>
                      <td className="px-4 py-3.5 text-teal-600 dark:text-teal-400 font-semibold">
                        ${hostPart} USD
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          {b.status || 'confirmed'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-10 text-center text-gray-400 text-xs">
            Belum ada catatan transaksi booking.
          </div>
        )}
      </div>
    </div>
  );
}
