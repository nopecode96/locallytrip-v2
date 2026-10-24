'use client';

import React, { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  MapPin,
  Calendar,
} from 'lucide-react';
import {
  AdminCountryItem,
  createCountry,
  updateCountry,
  deleteCountry,
  getAdminCountries,
} from '@/actions/admin/master';
import { AdminPagination, PaginationState } from '@/components/admin/ui/AdminPagination';

interface CountriesControlClientProps {
  initialCountries: AdminCountryItem[];
  initialPagination: PaginationState;
}

export function CountriesControlClient({
  initialCountries,
  initialPagination,
}: CountriesControlClientProps) {
  const [countries, setCountries] = useState<AdminCountryItem[]>(initialCountries);
  const [pagination, setPagination] = useState<PaginationState>(initialPagination);
  const [search, setSearch] = useState('');
  const [isPending, startTransition] = useTransition();

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState<AdminCountryItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const refreshData = (newPage = pagination.currentPage, query = search) => {
    startTransition(async () => {
      const res = await getAdminCountries({ search: query, page: newPage, limit: pagination.pageSize });
      if (res.success && res.data) {
        setCountries(res.data);
        if (res.pagination) setPagination(res.pagination);
      }
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    refreshData(1, search);
  };

  const openCreateModal = () => {
    setEditingCountry(null);
    setFormName('');
    setFormCode('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (country: AdminCountryItem) => {
    setEditingCountry(country);
    setFormName(country.name);
    setFormCode(country.code);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveCountry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim()) {
      setFormError('Please fill in both name and code.');
      return;
    }

    setFormError(null);
    startTransition(async () => {
      if (editingCountry) {
        const res = await updateCountry(editingCountry.id, {
          name: formName.trim(),
          code: formCode.trim().toUpperCase(),
        });
        if (res.success) {
          setIsModalOpen(false);
          showToast('success', `Country "${formName}" updated successfully.`);
          refreshData();
        } else {
          setFormError(res.error || 'Failed to update country');
        }
      } else {
        const res = await createCountry({
          name: formName.trim(),
          code: formCode.trim().toUpperCase(),
        });
        if (res.success) {
          setIsModalOpen(false);
          showToast('success', `Country "${formName}" created successfully.`);
          refreshData(1);
        } else {
          setFormError(res.error || 'Failed to create country');
        }
      }
    });
  };

  const handleDeleteCountry = async (id: number) => {
    setDeleteError(null);
    startTransition(async () => {
      const res = await deleteCountry(id);
      if (res.success) {
        setDeletingId(null);
        showToast('success', 'Country deleted successfully.');
        refreshData();
      } else {
        setDeleteError(res.error || 'Failed to delete country');
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
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Countries & Global Regions</h1>
            <p className="text-sm text-zinc-400">
              Manage international country definitions, ISO codes, and destination bindings.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-sm transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Country
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by country or code..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-zinc-950/60 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </form>

        <div className="text-xs text-zinc-400">
          Showing <span className="font-semibold text-zinc-200">{countries.length}</span> of{' '}
          <span className="font-semibold text-zinc-200">{pagination.totalItems}</span> countries
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl bg-zinc-900/40 border border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[11px] tracking-wider border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4">Country</th>
                <th className="px-6 py-4">ISO Code</th>
                <th className="px-6 py-4">Linked Cities</th>
                <th className="px-6 py-4">Registered</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {countries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                    No countries found matching your criteria.
                  </td>
                </tr>
              ) : (
                countries.map((country) => (
                  <tr key={country.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-xs font-bold text-cyan-400">
                          {country.code}
                        </span>
                        <span className="font-medium text-white">{country.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-zinc-800/80 border border-zinc-700 text-zinc-300">
                        {country.code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-zinc-300">
                        <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="font-semibold">{country.cityCount}</span>
                        <span className="text-zinc-500 text-xs">destinations</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                        {new Date(country.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(country)}
                          className="p-2 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors border border-zinc-700/50"
                          title="Edit Country"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setDeletingId(country.id);
                            setDeleteError(null);
                          }}
                          className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors border border-rose-500/20"
                          title="Delete Country"
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
            onPageChange={(page) => refreshData(page, search)}
          />
        </div>
      </div>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
                <h3 className="font-semibold text-white">
                  {editingCountry ? 'Edit Country' : 'Add New Country'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCountry} className="p-6 space-y-4">
                {formError && (
                  <div className="flex items-center gap-2 p-3 text-xs rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Country Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Indonesia, Japan, Germany"
                    className="w-full px-3.5 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    ISO Code (2-3 chars) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={3}
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    placeholder="e.g. ID, JP, DE, USA"
                    className="w-full px-3.5 py-2 text-sm uppercase font-mono bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

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
                    className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    {editingCountry ? 'Save Changes' : 'Create Country'}
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
                <h3 className="font-semibold text-white">Delete Country?</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Are you sure you want to delete this country? This cannot be undone.
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
                  onClick={() => handleDeleteCountry(deletingId)}
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
