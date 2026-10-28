'use client';

import React, { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  Globe,
  ImageIcon,
  Compass,
  Calendar,
  Eye,
  Check,
  Sparkles,
} from 'lucide-react';
import {
  AdminCityItem,
  createCity,
  updateCity,
  toggleCityStatus,
  deleteCity,
  getAdminCities,
} from '@/actions/admin/master';
import { AdminPagination, PaginationState } from '@/components/admin/ui/AdminPagination';
import { getPublicImageUrl } from '@/lib/images';
import { ImageUploadDropzone } from '@/components/shared/ImageUploadDropzone';

interface CountryOption {
  id: number;
  name: string;
  code: string;
}

interface CitiesControlClientProps {
  initialCities: AdminCityItem[];
  initialPagination: PaginationState;
  countryOptions: CountryOption[];
}

export function CitiesControlClient({
  initialCities,
  initialPagination,
  countryOptions,
}: CitiesControlClientProps) {
  const [cities, setCities] = useState<AdminCityItem[]>(initialCities);
  const [pagination, setPagination] = useState<PaginationState>(initialPagination);
  const [search, setSearch] = useState('');
  const [selectedCountryId, setSelectedCountryId] = useState<number | undefined>(undefined);
  const [isPending, startTransition] = useTransition();

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<AdminCityItem | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formCountryId, setFormCountryId] = useState<number>(countryOptions[0]?.id || 1);
  const [formLat, setFormLat] = useState<string>('');
  const [formLng, setFormLng] = useState<string>('');
  const [formDescription, setFormDescription] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Preview image modal
  const [previewImage, setPreviewImage] = useState<{ name: string; url: string } | null>(null);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const refreshData = (newPage = pagination.currentPage, query = search, countryId = selectedCountryId) => {
    startTransition(async () => {
      const res = await getAdminCities({
        search: query,
        countryId,
        page: newPage,
        limit: pagination.pageSize,
      });
      if (res.success && res.data) {
        setCities(res.data);
        if (res.pagination) setPagination(res.pagination);
      }
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    refreshData(1, search, selectedCountryId);
  };

  const handleCountryFilterChange = (cId: string) => {
    const id = cId ? parseInt(cId, 10) : undefined;
    setSelectedCountryId(id);
    refreshData(1, search, id);
  };

  const openCreateModal = () => {
    setEditingCity(null);
    setFormName('');
    setFormCountryId(countryOptions[0]?.id || 1);
    setFormLat('');
    setFormLng('');
    setFormDescription('');
    setFormImageUrl('');
    setFormIsActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (city: AdminCityItem) => {
    setEditingCity(city);
    setFormName(city.name);
    setFormCountryId(city.countryId || countryOptions[0]?.id || 1);
    setFormLat(city.latitude ? city.latitude.toString() : '');
    setFormLng(city.longitude ? city.longitude.toString() : '');
    setFormDescription(city.description || '');
    setFormImageUrl(city.imageUrl || '');
    setFormIsActive(city.isActive);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Nama kota destinasi wajib diisi.');
      return;
    }

    setFormError(null);
    const payload = {
      name: formName.trim(),
      country_id: Number(formCountryId),
      latitude: formLat ? parseFloat(formLat) : null,
      longitude: formLng ? parseFloat(formLng) : null,
      description: formDescription.trim() || null,
      image_url: formImageUrl.trim() || null,
      is_active: formIsActive,
    };

    startTransition(async () => {
      if (editingCity) {
        const res = await updateCity(editingCity.id, payload);
        if (res.success) {
          setIsModalOpen(false);
          showToast('success', `Kota destinasi "${formName}" berhasil diperbarui.`);
          refreshData();
        } else {
          setFormError(res.error || 'Gagal memperbarui destinasi kota.');
        }
      } else {
        const res = await createCity(payload);
        if (res.success) {
          setIsModalOpen(false);
          showToast('success', `Kota destinasi "${formName}" berhasil ditambahkan.`);
          refreshData(1, '', selectedCountryId);
        } else {
          setFormError(res.error || 'Gagal menambahkan kota destinasi.');
        }
      }
    });
  };

  const handleToggleStatus = (city: AdminCityItem) => {
    startTransition(async () => {
      const res = await toggleCityStatus(city.id, !city.isActive);
      if (res.success) {
        setCities((prev) =>
          prev.map((c) => (c.id === city.id ? { ...c, isActive: !city.isActive } : c))
        );
        showToast('success', `Status destinasi "${city.name}" berhasil diubah.`);
      } else {
        showToast('error', res.error || 'Gagal mengubah status destinasi.');
      }
    });
  };

  const handleDeleteCity = async (id: number) => {
    setDeleteError(null);
    startTransition(async () => {
      const res = await deleteCity(id);
      if (res.success) {
        setDeletingId(null);
        showToast('success', 'Kota destinasi berhasil dihapus.');
        refreshData();
      } else {
        setDeleteError(res.error || 'Gagal menghapus kota.');
      }
    });
  };

  // Telemetry summaries
  const activeCitiesCount = cities.filter((c) => c.isActive).length;
  const totalExperiencesLinked = cities.reduce((acc, curr) => acc + (curr.experiencesCount || 0), 0);
  const totalMeetupsLinked = cities.reduce((acc, curr) => acc + (curr.meetupsCount || 0), 0);

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

      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-2">
            <MapPin className="w-3.5 h-3.5" />
            <span>Master Destinasi & Titik Koordinat</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Kota & Destinasi Wisata
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Kelola data kota tujuan, koordinat GPS peta, foto visual representatif, dan keterikatan tur aktivitas lokal.
          </p>
        </div>

        {/* Global Header Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-500/25 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kota Destinasi</span>
          </button>
        </div>
      </motion.div>

      {/* Telemetry Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Cities */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="p-5 rounded-2xl border bg-white dark:bg-[#1A1D21] border-gray-200/90 dark:border-white/10 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Kota
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {pagination.totalItems} Kota
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
              Dari {countryOptions.length} negara terdaftar
            </div>
          </div>
        </motion.div>

        {/* Card 2: Active Destinations */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="p-5 rounded-2xl border bg-white dark:bg-[#1A1D21] border-gray-200/90 dark:border-white/10 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Destinasi Aktif
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Check className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
              {activeCitiesCount} Aktif
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              Tampil di katalog penjelajah & peta
            </div>
          </div>
        </motion.div>

        {/* Card 3: Connected Experiences */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="p-5 rounded-2xl border bg-white dark:bg-[#1A1D21] border-gray-200/90 dark:border-white/10 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Aktivitas Tur
            </span>
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-teal-600 dark:text-teal-400">
              {totalExperiencesLinked} Tur
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              Produk terhubung di halaman ini
            </div>
          </div>
        </motion.div>

        {/* Card 4: Community Meetups */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
          className="p-5 rounded-2xl border bg-white dark:bg-[#1A1D21] border-gray-200/90 dark:border-white/10 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Agenda Meetup
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {totalMeetupsLinked} Agenda
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              Meetup komunitas lokal terhubung
            </div>
          </div>
        </motion.div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama kota destinasi..."
              className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition shadow-sm"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  refreshData(1, '', selectedCountryId);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Country Select Filter */}
          <div className="relative">
            <select
              value={selectedCountryId || ''}
              onChange={(e) => handleCountryFilterChange(e.target.value)}
              className="w-full sm:w-auto appearance-none pl-3.5 pr-8 py-2 text-xs font-bold rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition cursor-pointer"
            >
              <option value="">Semua Negara</option>
              {countryOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
            <Globe className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Menampilkan <span className="font-bold text-slate-900 dark:text-white">{cities.length}</span> dari{' '}
          <span className="font-bold text-slate-900 dark:text-white">{pagination.totalItems}</span> kota
        </div>
      </div>

      {/* Main Table */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border border-gray-200/90 dark:border-white/10 bg-white dark:bg-[#1A1D21] shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-gray-200/90 dark:border-white/10">
              <tr>
                <th className="px-5 py-3.5 font-bold">Kota & Negara</th>
                <th className="px-5 py-3.5 font-bold">Foto Visual</th>
                <th className="px-5 py-3.5 font-bold">Koordinat GPS</th>
                <th className="px-5 py-3.5 font-bold">Keterikatan Konten</th>
                <th className="px-5 py-3.5 font-bold">Status</th>
                <th className="px-5 py-3.5 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-300">
              {cities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <MapPin className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Tidak ada kota destinasi yang sesuai kriteria pencarian.
                  </td>
                </tr>
              ) : (
                cities.map((city) => (
                  <tr key={city.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                    {/* City Info */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-sm">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white text-sm block">
                            {city.name}
                          </span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Globe className="w-3 h-3 text-slate-400" />
                            {city.countryName || 'Global'} ({city.countryCode})
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Image / Thumbnail Preview */}
                    <td className="px-5 py-4">
                      {city.imageUrl ? (
                        <div className="flex items-center gap-2">
                          <div
                            onClick={() => setPreviewImage({ name: city.name, url: city.imageUrl! })}
                            className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative cursor-pointer group shadow-sm shrink-0 bg-slate-100 dark:bg-slate-800"
                          >
                            <img
                              src={getPublicImageUrl(city.imageUrl, 'cities')}
                              alt={city.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                              onError={(e) => {
                                const target = e.currentTarget;
                                if (!target.src.includes('city-default.jpg')) {
                                  target.src = '/images/placeholders/city-default.jpg';
                                }
                              }}
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                              <Eye className="w-3.5 h-3.5" />
                            </div>
                          </div>
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                            Terkonfigurasi
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-xl overflow-hidden border border-dashed border-slate-300 dark:border-slate-700 relative shadow-sm shrink-0 bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                            <img
                              src="/images/placeholders/city-default.jpg"
                              alt="Default visual"
                              className="w-full h-full object-cover opacity-60"
                            />
                          </div>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700">
                            Visual Default
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Coordinates */}
                    <td className="px-5 py-4 font-mono text-xs">
                      {city.latitude && city.longitude ? (
                        <span className="text-slate-700 dark:text-slate-300">
                          {city.latitude.toFixed(3)}, {city.longitude.toFixed(3)}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Belum disetel</span>
                      )}
                    </td>

                    {/* Content links */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/40 font-bold text-[11px]">
                          <Compass className="w-3 h-3 text-teal-500" />
                          {city.experiencesCount} Tur
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 font-bold text-[11px]">
                          <Calendar className="w-3 h-3 text-amber-500" />
                          {city.meetupsCount} Meetup
                        </span>
                      </div>
                    </td>

                    {/* Status Toggle */}
                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleToggleStatus(city)}
                        disabled={isPending}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition shadow-sm ${
                          city.isActive
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${city.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                        <span>{city.isActive ? 'Aktif' : 'Nonaktif'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(city)}
                          className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition border border-gray-200/90 dark:border-white/10"
                          title="Edit Destinasi"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setDeletingId(city.id);
                            setDeleteError(null);
                          }}
                          className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 transition border border-rose-200 dark:border-rose-800"
                          title="Hapus Destinasi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-gray-200/90 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
          <AdminPagination
            pagination={pagination}
            onPageChange={(page) => refreshData(page, search, selectedCountryId)}
          />
        </div>
      </motion.div>

      {/* Create / Edit City Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-xl rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {editingCity ? 'Edit Kota Destinasi' : 'Tambah Kota Destinasi Baru'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveCity} className="p-6 space-y-4 overflow-y-auto flex-1">
                {formError && (
                  <div className="flex items-center gap-2 p-3 text-xs rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Name & Country */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Nama Kota <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Contoh: Ubud, Bandung, Tokyo"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Negara Induk <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formCountryId}
                      onChange={(e) => setFormCountryId(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 text-xs font-bold rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition cursor-pointer"
                    >
                      {countryOptions.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Coordinates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Latitude (Garis Lintang)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formLat}
                      onChange={(e) => setFormLat(e.target.value)}
                      placeholder="-8.5069"
                      className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Longitude (Garis Bujur)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formLng}
                      onChange={(e) => setFormLng(e.target.value)}
                      placeholder="115.2625"
                      className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                    />
                  </div>
                </div>

                {/* Drag and Drop Image Upload */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Foto Visual Hero Destinasi
                    </label>
                    {formImageUrl && (
                      <button
                        type="button"
                        onClick={() => setFormImageUrl('')}
                        className="text-[11px] text-rose-500 hover:text-rose-600 font-semibold"
                      >
                        Hapus Foto
                      </button>
                    )}
                  </div>
                  <ImageUploadDropzone
                    value={formImageUrl ? getPublicImageUrl(formImageUrl, 'cities') : ''}
                    onChange={(url) => setFormImageUrl(url)}
                    folder="cities"
                    label="Unggah Foto Destinasi Kota"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Tersimpan di direktori <code className="font-mono text-emerald-600 dark:text-emerald-400">/public/images/cities/</code>. Digunakan untuk kartu destinasi, banner jelajah, dan visual meetup.
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Deskripsi Ringkas Destinasi
                  </label>
                  <textarea
                    rows={3}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Tuliskan daya tarik kota destinasi ini..."
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                  />
                </div>

                {/* Status Toggle in Form */}
                <div className="flex items-center gap-3 pt-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsActive}
                      onChange={(e) => setFormIsActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
                  </label>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Aktifkan destinasi ini di portal publik
                  </span>
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
                    <span>{editingCity ? 'Simpan Perubahan' : 'Buat Destinasi'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-2xl p-6 space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>

              <div className="text-center">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Hapus Kota Destinasi?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Tindakan ini tidak dapat dibatalkan. Pastikan tidak ada aktivitas tur aktif yang bergantung pada kota ini.
                </p>
              </div>

              {deleteError && (
                <div className="flex items-start gap-2 p-3 text-xs rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingId(null)}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleDeleteCity(deletingId)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md shadow-rose-600/25 transition disabled:opacity-50"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Konfirmasi Hapus</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-2xl w-full bg-white dark:bg-[#1A1D21] rounded-3xl overflow-hidden shadow-2xl border border-gray-200/90 dark:border-white/10"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-white/10">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Preview Foto: {previewImage.name}
                </h4>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="relative aspect-video w-full bg-black/20">
                <img
                  src={getPublicImageUrl(previewImage.url, 'cities')}
                  alt={previewImage.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
