'use client';

import React, { useState } from 'react';
import { toggleExperienceActive, AdminExperienceItem } from '@/actions/admin';
import { Compass, Check, X, Search, ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface AdminExperiencesClientViewProps {
  initialList: AdminExperienceItem[];
}

export function AdminExperiencesClientView({ initialList }: AdminExperiencesClientViewProps) {
  const [list, setList] = useState<AdminExperienceItem[]>(initialList);
  const [search, setSearch] = useState('');
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const filtered = list.filter(
    (exp) =>
      exp.title.toLowerCase().includes(search.toLowerCase()) ||
      exp.city.toLowerCase().includes(search.toLowerCase()) ||
      exp.hostName.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleActive = async (id: number, currentStatus: boolean | null) => {
    setLoadingId(id);
    const res = await toggleExperienceActive(id, !!currentStatus);
    setLoadingId(null);
    if (res.success) {
      setList((prev) =>
        prev.map((e) => (e.id === id ? { ...e, isActive: !currentStatus } : e))
      );
    } else {
      alert(res.error || 'Gagal mengubah status aktif aktivitas.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Manajemen Listing Experiences
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Katalog seluruh aktivitas wisata lokal, status publikasi, dan kontrol visibilitas listing.
          </p>
        </div>

        {/* Search Filter */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul, kota, host..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Catalog Table */}
      <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-4">Aktivitas / Destinasi</th>
                <th className="px-5 py-4">Host Lokal</th>
                <th className="px-5 py-4">Harga Tiket</th>
                <th className="px-5 py-4">Status Publikasi</th>
                <th className="px-5 py-4 text-center">Aktif di Katalog</th>
                <th className="px-5 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-900/40 transition">
                  {/* Title & City */}
                  <td className="px-5 py-4 max-w-[280px]">
                    <span className="font-bold text-white block line-clamp-1 leading-snug">
                      {item.title}
                    </span>
                    <span className="text-[11px] text-emerald-400 mt-0.5 block">
                      📍 {item.city}
                    </span>
                  </td>

                  {/* Host */}
                  <td className="px-5 py-4">
                    <span className="font-semibold text-slate-200 block">{item.hostName}</span>
                    <span className="text-[10px] text-slate-500 block truncate max-w-[150px]">
                      {item.hostEmail}
                    </span>
                  </td>

                  {/* Price */}
                  <td className="px-5 py-4">
                    <span className="font-black text-white text-sm">
                      ${item.packagePrice ?? 0} {item.currency}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      ≈ Rp {((item.packagePrice ?? 0) * 17896.90).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        item.status === 'published'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : item.status === 'rejected'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>

                  {/* Toggle Active */}
                  <td className="px-5 py-4 text-center">
                    <button
                      type="button"
                      disabled={loadingId === item.id}
                      onClick={() => handleToggleActive(item.id, item.isActive)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        item.isActive ? 'bg-emerald-600' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          item.isActive ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </td>

                  {/* Detail link */}
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/id/experiences/${item.slug || item.id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition text-[11px] font-semibold"
                    >
                      <span>Lihat</span>
                      <ExternalLink className="w-3 h-3 text-slate-500" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
