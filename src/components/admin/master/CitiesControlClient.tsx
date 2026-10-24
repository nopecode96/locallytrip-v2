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
import Image from 'next/image';

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
      setFormError('City name is required.');
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
          showToast('success', `City "${formName}" updated successfully.`);
          refreshData();
        } else {
          setFormError(res.error || 'Failed to update city');
        }
      } else {
        const res = await createCity(payload);
        if (res.success) {
          setIsModalOpen(false);
          showToast('success', `City "${formName}" created successfully.`);
          refreshData(1);
        } else {
          setFormError(res.error || 'Failed to create city');
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
        showToast('success', `City "${city.name}" status updated.`);
      } else {
        showToast('error', res.error || 'Failed to toggle status');
      }
    });
  };

  const handleDeleteCity = async (id: number) => {
    setDeleteError(null);
    startTransition(async () => {
      const res = await deleteCity(id);
      if (res.success) {
        setDeletingId(null);
        showToast('success', 'City deleted successfully.');
        refreshData();
      } else {
        setDeleteError(res.error || 'Failed to delete city');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md border ${
              toastMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span className="text-sm font-medium">{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Cities & Travel Destinations</h1>
            <p className="text-sm text-zinc-400">
              Manage city destinations, coordinates, representative photos, and meetup fallback visuals.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-medium text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Destination
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto flex-1">
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by city or country..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-zinc-950/60 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </form>

          <select
            value={selectedCountryId || ''}
            onChange={(e) => handleCountryFilterChange(e.target.value)}
            className="w-full sm:w-56 px-3 py-2 text-sm bg-zinc-950/60 border border-zinc-800 rounded-lg text-zinc-300 focus:outline-none focus:border-emerald-500 transition-colors"
          >
            <option value="">All Countries</option>
            {countryOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-zinc-400">
          Showing <span className="font-semibold text-zinc-200">{cities.length}</span> of{' '}
          <span className="font-semibold text-zinc-200">{pagination.totalItems}</span> destinations
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl bg-zinc-900/40 border border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[11px] tracking-wider border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4">Destination</th>
                <th className="px-6 py-4">Country</th>
                <th className="px-6 py-4">Coordinates</th>
                <th className="px-6 py-4">Catalog Bound</th>
                <th className="px-6 py-4">Fallback Image</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {cities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                    No destination cities found.
                  </td>
                </tr>
              ) : (
                cities.map((city) => (
                  <tr key={city.id} className="hover:bg-zinc-800/30 transition-colors">
                    {/* Destination name + thumb */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700/60 flex-shrink-0 flex items-center justify-center">
                          {city.imageUrl ? (
                            <img
                              src={city.imageUrl}
                              alt={city.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <MapPin className="w-5 h-5 text-zinc-500" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-white flex items-center gap-2">
                            {city.name}
                          </div>
                          {city.description && (
                            <p className="text-xs text-zinc-500 line-clamp-1 max-w-xs">
                              {city.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Country */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="text-zinc-200">{city.countryName}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                          {city.countryCode}
                        </span>
                      </div>
                    </td>

                    {/* Coordinates */}
                    <td className="px-6 py-4 text-xs font-mono text-zinc-400">
                      {city.latitude && city.longitude ? (
                        <span>
                          {city.latitude.toFixed(3)}, {city.longitude.toFixed(3)}
                        </span>
                      ) : (
                        <span className="text-zinc-600 italic">Not set</span>
                      )}
                    </td>

                    {/* Linked items */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1 text-zinc-300" title="Experiences">
                          <Compass className="w-3 h-3 text-teal-400" />
                          {city.experiencesCount}
                        </span>
                        <span className="flex items-center gap-1 text-zinc-300" title="Meetups">
                          <Calendar className="w-3 h-3 text-amber-400" />
                          {city.meetupsCount}
                        </span>
                      </div>
                    </td>

                    {/* Image Fallback Status */}
                    <td className="px-6 py-4">
                      {city.imageUrl ? (
                        <button
                          onClick={() => setPreviewImage({ name: city.name, url: city.imageUrl! })}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          Configured
                        </button>
                      ) : (
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-zinc-800 text-zinc-500">
                          Default fallback
                        </span>
                      )}
                    </td>

                    {/* Active Status */}
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(city)}
                        disabled={isPending}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          city.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            city.isActive ? 'bg-emerald-400' : 'bg-zinc-500'
                          }`}
                        />
                        {city.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(city)}
                          className="p-2 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors border border-zinc-700/50"
                          title="Edit Destination"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setDeletingId(city.id);
                            setDeleteError(null);
                          }}
                          className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors border border-rose-500/20"
                          title="Delete Destination"
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

        {/* Pagination */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/40">
          <AdminPagination
            pagination={pagination}
            onPageChange={(page) => refreshData(page, search, selectedCountryId)}
          />
        </div>
      </div>

      {/* Create / Edit City Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
                <h3 className="font-semibold text-white">
                  {editingCity ? 'Edit Destination City' : 'Add New Destination City'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCity} className="p-6 space-y-4 overflow-y-auto flex-1">
                {formError && (
                  <div className="flex items-center gap-2 p-3 text-xs rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Name & Country */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      City Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Ubud, Kyoto, Zurich"
                      className="w-full px-3.5 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Country <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={formCountryId}
                      onChange={(e) => setFormCountryId(parseInt(e.target.value, 10))}
                      className="w-full px-3.5 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    >
                      {countryOptions.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Latitude & Longitude */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formLat}
                      onChange={(e) => setFormLat(e.target.value)}
                      placeholder="-8.5069"
                      className="w-full px-3.5 py-2 text-sm font-mono bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formLng}
                      onChange={(e) => setFormLng(e.target.value)}
                      placeholder="115.2625"
                      className="w-full px-3.5 py-2 text-sm font-mono bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Image URL & Preview */}
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    City Representative Image URL
                  </label>
                  <input
                    type="url"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/... or /images/cities/ubud.jpg"
                    className="w-full px-3.5 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Used as the default fallback cover for all meetups created in this destination.
                  </p>

                  {formImageUrl && (
                    <div className="mt-3 relative w-full h-36 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800">
                      <img
                        src={formImageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-medium bg-black/60 backdrop-blur-md text-emerald-400 border border-emerald-500/30">
                        Live Fallback Preview
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Destination Description / Highlights
                  </label>
                  <textarea
                    rows={3}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Brief highlights of what makes this destination unique..."
                    className="w-full px-3.5 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>

                {/* Active Checkbox */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="city_active"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="rounded border-zinc-800 text-emerald-500 focus:ring-emerald-500 bg-zinc-950 w-4 h-4"
                  />
                  <label htmlFor="city_active" className="text-sm text-zinc-300 cursor-pointer">
                    Active destination (visible in marketplace filters & meetup creation)
                  </label>
                </div>

                {/* Submit buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    {editingCity ? 'Save Changes' : 'Create Destination'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-white">
                  Fallback Cover: {previewImage.name}
                </h4>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="w-full h-64 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800">
                <img
                  src={previewImage.url}
                  alt={previewImage.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6 space-y-4"
            >
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>

              <div className="text-center">
                <h3 className="font-semibold text-white">Delete Destination?</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Destination cannot be deleted if experiences or meetups are bound to it.
                </p>
              </div>

              {deleteError && (
                <div className="flex items-start gap-2 p-3 text-xs rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingId(null)}
                  className="flex-1 py-2 text-sm text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleDeleteCity(deletingId)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
