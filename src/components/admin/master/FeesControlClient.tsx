'use client';

import React, { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Percent,
  Plus,
  History,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Calendar,
  ShieldCheck,
  TrendingDown,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { AdminFeeConfigItem, createNewFeeConfiguration, getAdminFeeConfigurations } from '@/actions/admin/master';

interface FeesControlClientProps {
  initialConfigs: AdminFeeConfigItem[];
}

export function FeesControlClient({ initialConfigs }: FeesControlClientProps) {
  const [configs, setConfigs] = useState<AdminFeeConfigItem[]>(initialConfigs);
  const [isPending, startTransition] = useTransition();

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formFeePercent, setFormFeePercent] = useState<number>(12);
  const [formCategory, setFormCategory] = useState('EXPERIENCES');
  const [formFeeBearer, setFormFeeBearer] = useState<'HOST' | 'TRAVELER' | 'SPLIT'>('HOST');
  const [formDescription, setFormDescription] = useState('');
  const [formEffectiveFrom, setFormEffectiveFrom] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const activeConfig = configs.find((c) => c.isActive) || configs[0];

  const handleOpenCreateModal = () => {
    setFormName(`Perubahan Fee Experiences ${new Date().toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}`);
    setFormFeePercent(activeConfig ? activeConfig.feePercent : 12);
    setFormCategory('EXPERIENCES');
    setFormFeeBearer((activeConfig?.feeBearer as any) || 'HOST');
    setFormDescription('');
    // Default effective from now (format YYYY-MM-DDTHH:mm)
    const nowIso = new Date().toISOString().slice(0, 16);
    setFormEffectiveFrom(nowIso);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Nama kebijakan fee wajib diisi.');
      return;
    }

    if (formFeePercent < 0 || formFeePercent > 12) {
      setFormError('Nilai fee harus berada di antara 0% hingga maksimal 12%.');
      return;
    }

    setFormError(null);
    startTransition(async () => {
      const res = await createNewFeeConfiguration({
        name: formName.trim(),
        category: formCategory,
        fee_percent: Number(formFeePercent),
        fee_type: 'PERCENTAGE',
        fee_bearer: formFeeBearer,
        description: formDescription.trim() || null,
        effective_from: formEffectiveFrom ? new Date(formEffectiveFrom).toISOString() : new Date().toISOString(),
      });

      if (res.success) {
        setIsModalOpen(false);
        showToast('success', `Konfigurasi fee baru "${formName}" (${formFeePercent}%) berhasil diaktifkan!`);
        const updated = await getAdminFeeConfigurations(formCategory);
        if (updated.success && updated.data) {
          setConfigs(updated.data);
        }
      } else {
        setFormError(res.error || 'Gagal menyimpan konfigurasi fee baru.');
      }
    });
  };

  return (
    <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl backdrop-blur-xl border text-xs sm:text-sm font-semibold ${
              toastMessage.type === 'success'
                ? 'bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50/95 dark:bg-rose-950/90 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-2">
            <Percent className="w-3.5 h-3.5" />
            <span>Master Konfigurasi Transaksi & Fee</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Fee Transaksi Experiences
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Konfigurasi take-rate platform (0% – 12%). Sistem bersifat <strong>append-only</strong> sehingga perubahan fee tidak akan merusak atau mengubah perhitungan transaksi masa lampau.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-500/25 transition active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Konfigurasi Fee Baru</span>
        </button>
      </div>

      {/* Active Fee Banner Card */}
      {activeConfig && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white shadow-xl relative overflow-hidden border border-emerald-500/30"
        >
          <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Aturan Aktif Saat Ini</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">{activeConfig.name}</h2>
              <p className="text-xs text-slate-300 max-w-xl">
                {activeConfig.description || 'Komisi pemotongan platform yang diterapkan pada transaksi tur experiences baru.'}
              </p>
              <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  Mulai berlaku:{' '}
                  <strong className="text-slate-200">
                    {new Date(activeConfig.effectiveFrom).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    WIB
                  </strong>
                </span>
                <span>•</span>
                <span>
                  Dibebankan kepada:{' '}
                  <strong className="text-emerald-300 uppercase">{activeConfig.feeBearer}</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-6 bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 shrink-0">
              <div className="text-center">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Platform Fee
                </span>
                <span className="text-3xl sm:text-4xl font-black text-emerald-400">
                  {activeConfig.feePercent}%
                </span>
              </div>
              <div className="w-[1px] h-10 bg-white/10" />
              <div className="text-center">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Hak Bersih Host
                </span>
                <span className="text-3xl sm:text-4xl font-black text-white">
                  {(100 - activeConfig.feePercent).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* History Table */}
      <div className="rounded-2xl border border-gray-200/90 dark:border-white/10 bg-white dark:bg-[#1A1D21] shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-200/90 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Riwayat & Audit Log Konfigurasi Fee
            </h3>
          </div>
          <span className="text-xs text-slate-400">{configs.length} catatan versi tersimpan</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-gray-200/90 dark:border-white/10">
              <tr>
                <th className="px-5 py-3.5 font-bold">Nama Kebijakan & Kategori</th>
                <th className="px-5 py-3.5 font-bold">Besaran Fee</th>
                <th className="px-5 py-3.5 font-bold">Pihak Penanggung</th>
                <th className="px-5 py-3.5 font-bold">Periode Efektif</th>
                <th className="px-5 py-3.5 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-300">
              {configs.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                        item.isActive
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                      }`}>
                        #{item.id}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white text-sm block">
                          {item.name}
                        </span>
                        {item.description && (
                          <p className="text-[11px] text-slate-400 line-clamp-1 max-w-sm mt-0.5">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                      {item.feePercent}%
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      (Host: {(100 - item.feePercent).toFixed(0)}%)
                    </span>
                  </td>
                  <td className="px-5 py-4 font-bold text-xs">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 uppercase">
                      {item.feeBearer}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs">
                    <div>
                      <span className="text-slate-800 dark:text-slate-200 font-semibold block">
                        Sejak {new Date(item.effectiveFrom).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {item.effectiveUntil
                          ? `Hingga ${new Date(item.effectiveUntil).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`
                          : 'Masih berlaku saat ini'}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        item.isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${item.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                      <span>{item.isActive ? 'Aktif Digunakan' : 'Diarsipkan (Historical)'}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Fee Rule Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Percent className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Buat Konfigurasi Fee Transaksi Baru
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
                {formError && (
                  <div className="flex items-center gap-2 p-3 text-xs rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <span>
                    Menyimpan baris baru ini akan mengarsipkan konfigurasi aktif sebelumnya. Transaksi lama tetap mengacu pada persentase saat tanggal booking terjadi.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nama Kebijakan Fee <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Contoh: Promo Musim Liburan (Take-Rate 10%)"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Besaran Fee Platform (0% - 12%) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="12"
                        required
                        value={formFeePercent}
                        onChange={(e) => setFormFeePercent(parseFloat(e.target.value) || 0)}
                        className="w-full pl-3.5 pr-10 py-2.5 text-xs font-mono font-bold rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                        %
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Hak bersih host: {(100 - (formFeePercent || 0)).toFixed(1)}%
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Pihak Penanggung Fee
                    </label>
                    <select
                      value={formFeeBearer}
                      onChange={(e) => setFormFeeBearer(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 text-xs font-bold rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition cursor-pointer"
                    >
                      <option value="HOST">Dipotong dari Pendapatan Host (Take-rate)</option>
                      <option value="TRAVELER">Dibebankan ke Traveler (Platform Fee Tambahan)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tanggal Mulai Berlaku (Effective From)
                  </label>
                  <input
                    type="datetime-local"
                    value={formEffectiveFrom}
                    onChange={(e) => setFormEffectiveFrom(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Transaksi yang terjadi setelah tanggal/jam ini akan otomatis menggunakan nilai fee baru ini.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Keterangan & Catatan Alasan Perubahan
                  </label>
                  <textarea
                    rows={3}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Tuliskan alasan penyesuaian fee komisi ini (misal: Keputusan Manajemen Q4, Promo Holiday)..."
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl shadow-md shadow-emerald-500/25 transition disabled:opacity-50"
                  >
                    {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Aktifkan Konfigurasi Baru</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
