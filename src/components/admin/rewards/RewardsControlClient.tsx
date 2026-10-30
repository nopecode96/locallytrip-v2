'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gift,
  Trophy,
  Zap,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  Coins,
  Package,
  Award,
  ChevronRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  AdminMerchandiseItem,
  AdminLevelTierItem,
  AdminActionRuleItem,
  createMerchandise,
  updateMerchandise,
  toggleMerchandiseStatus,
  deleteMerchandise,
  getAdminMerchandise,
  updateLevelTier,
  updateActionRule,
  toggleActionRuleStatus,
  getAdminRewardRulesAndTiers,
} from '@/actions/admin/rewards';
import { AdminPagination, PaginationState } from '@/components/admin/ui/AdminPagination';
import { ImageUploadDropzone } from '@/components/shared/ImageUploadDropzone';
import { getPublicImageUrl } from '@/lib/images';

interface RewardsControlClientProps {
  initialMerchandise: AdminMerchandiseItem[];
  initialPagination: PaginationState;
  initialTiers: AdminLevelTierItem[];
  initialRules: AdminActionRuleItem[];
  initialTab?: TabType;
}

type TabType = 'merchandise' | 'tiers' | 'rules';

export function RewardsControlClient({
  initialMerchandise,
  initialPagination,
  initialTiers,
  initialRules,
  initialTab = 'merchandise',
}: RewardsControlClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const getEffectiveTab = (): TabType => {
    const tabParam = searchParams?.get('tab');
    if (tabParam === 'tiers' || tabParam === 'rules' || tabParam === 'merchandise') {
      return tabParam;
    }
    return initialTab;
  };

  const [activeTab, setActiveTab] = useState<TabType>(getEffectiveTab());
  const [merchandise, setMerchandise] = useState<AdminMerchandiseItem[]>(initialMerchandise);
  const [pagination, setPagination] = useState<PaginationState>(initialPagination);
  const [tiers, setTiers] = useState<AdminLevelTierItem[]>(initialTiers);
  const [rules, setRules] = useState<AdminActionRuleItem[]>(initialRules);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isPending, startTransition] = useTransition();

  // Merchandise modal
  const [isMerchModalOpen, setIsMerchModalOpen] = useState(false);
  const [editingMerch, setEditingMerch] = useState<AdminMerchandiseItem | null>(null);
  const [merchName, setMerchName] = useState('');
  const [merchSlug, setMerchSlug] = useState('');
  const [merchDescription, setMerchDescription] = useState('');
  const [merchImageUrl, setMerchImageUrl] = useState('');
  const [merchPoints, setMerchPoints] = useState<number>(500);
  const [merchMinLevel, setMerchMinLevel] = useState<number>(1);
  const [merchStock, setMerchStock] = useState<number>(50);
  const [merchCategory, setMerchCategory] = useState('APPAREL');
  const [merchIsActive, setMerchIsActive] = useState(true);
  const [merchError, setMerchError] = useState<string | null>(null);

  // Level Tier modal
  const [editingTier, setEditingTier] = useState<AdminLevelTierItem | null>(null);
  const [tierNameId, setTierNameId] = useState('');
  const [tierNameEn, setTierNameEn] = useState('');
  const [tierMinXp, setTierMinXp] = useState<number>(0);
  const [tierBadgeIcon, setTierBadgeIcon] = useState('');
  const [tierLtpBonus, setTierLtpBonus] = useState<number>(0);
  const [tierRewardType, setTierRewardType] = useState('NONE');
  const [tierRewardTitleId, setTierRewardTitleId] = useState('');
  const [tierRewardTitleEn, setTierRewardTitleEn] = useState('');
  const [tierRewardDescId, setTierRewardDescId] = useState('');
  const [tierRewardDescEn, setTierRewardDescEn] = useState('');
  const [tierError, setTierError] = useState<string | null>(null);

  // Action Rule modal
  const [editingRule, setEditingRule] = useState<AdminActionRuleItem | null>(null);
  const [ruleNameId, setRuleNameId] = useState('');
  const [ruleNameEn, setRuleNameEn] = useState('');
  const [ruleXp, setRuleXp] = useState<number>(0);
  const [ruleLtp, setRuleLtp] = useState<number>(0);
  const [ruleFrequency, setRuleFrequency] = useState('UNLIMITED');
  const [ruleError, setRuleError] = useState<string | null>(null);

  // Delete modal
  const [deletingMerchId, setDeletingMerchId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Sync with URL query parameter changes
  useEffect(() => {
    const tabParam = searchParams?.get('tab');
    if (tabParam === 'merchandise' || tabParam === 'tiers' || tabParam === 'rules') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (target: TabType) => {
    setActiveTab(target);
    setSearch('');
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('tab', target);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const refreshMerchandise = (page = pagination.currentPage, query = search, cat = selectedCategory) => {
    startTransition(async () => {
      const res = await getAdminMerchandise({
        search: query,
        category: cat,
        page,
        limit: pagination.pageSize,
      });
      if (res.success && res.data) {
        setMerchandise(res.data);
        if (res.pagination) setPagination(res.pagination);
      }
    });
  };

  const handleMerchSearch = (e: React.FormEvent) => {
    e.preventDefault();
    refreshMerchandise(1, search, selectedCategory);
  };

  const handleCategoryFilter = (cat: string) => {
    setSelectedCategory(cat);
    refreshMerchandise(1, search, cat);
  };

  const openCreateMerchModal = () => {
    setEditingMerch(null);
    setMerchName('');
    setMerchSlug('');
    setMerchDescription('');
    setMerchImageUrl('');
    setMerchPoints(500);
    setMerchMinLevel(1);
    setMerchStock(50);
    setMerchCategory('APPAREL');
    setMerchIsActive(true);
    setMerchError(null);
    setIsMerchModalOpen(true);
  };

  const openEditMerchModal = (item: AdminMerchandiseItem) => {
    setEditingMerch(item);
    setMerchName(item.name);
    setMerchSlug(item.slug);
    setMerchDescription(item.description || '');
    setMerchImageUrl(item.imageUrl || '');
    setMerchPoints(item.pointsRequired);
    setMerchMinLevel(item.minLevel);
    setMerchStock(item.stockQuantity);
    setMerchCategory(item.category);
    setMerchIsActive(item.isActive);
    setMerchError(null);
    setIsMerchModalOpen(true);
  };

  const handleSaveMerch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchName.trim() || !merchSlug.trim()) {
      setMerchError('Nama merchandise dan slug identifier wajib diisi.');
      return;
    }

    setMerchError(null);
    const payload = {
      name: merchName.trim(),
      slug: merchSlug.trim(),
      description: merchDescription.trim() || null,
      image_url: merchImageUrl.trim() || null,
      points_required: Number(merchPoints),
      min_level: Number(merchMinLevel),
      stock_quantity: Number(merchStock),
      category: merchCategory,
      is_active: merchIsActive,
    };

    startTransition(async () => {
      const res = editingMerch
        ? await updateMerchandise(editingMerch.id, payload)
        : await createMerchandise(payload);

      if (res.success) {
        setIsMerchModalOpen(false);
        showToast('success', `Merchandise "${merchName}" berhasil disimpan.`);
        refreshMerchandise();
      } else {
        setMerchError(res.error || 'Gagal menyimpan merchandise.');
      }
    });
  };

  const handleToggleMerch = (item: AdminMerchandiseItem) => {
    startTransition(async () => {
      const res = await toggleMerchandiseStatus(item.id, !item.isActive);
      if (res.success) {
        setMerchandise((prev) =>
          prev.map((m) => (m.id === item.id ? { ...m, isActive: !item.isActive } : m))
        );
        showToast('success', `Status publikasi merchandise berhasil diubah.`);
      }
    });
  };

  const handleDeleteMerch = async (id: number) => {
    startTransition(async () => {
      const res = await deleteMerchandise(id);
      if (res.success) {
        setDeletingMerchId(null);
        showToast('success', 'Merchandise berhasil dihapus dari katalog.');
        refreshMerchandise();
      }
    });
  };

  // Tier modal actions
  const openEditTierModal = (tier: AdminLevelTierItem) => {
    setEditingTier(tier);
    setTierNameId(tier.nameId);
    setTierNameEn(tier.nameEn);
    setTierMinXp(tier.minXp);
    setTierBadgeIcon(tier.badgeIcon);
    setTierLtpBonus(tier.ltpBonus);
    setTierRewardType(tier.rewardType);
    setTierRewardTitleId(tier.rewardTitleId || '');
    setTierRewardTitleEn(tier.rewardTitleEn || '');
    setTierRewardDescId(tier.rewardDescriptionId || '');
    setTierRewardDescEn(tier.rewardDescriptionEn || '');
    setTierError(null);
  };

  const handleSaveTier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTier) return;

    setTierError(null);
    startTransition(async () => {
      const res = await updateLevelTier(editingTier.level, {
        name_id: tierNameId.trim(),
        name_en: tierNameEn.trim(),
        min_xp: Number(tierMinXp),
        badge_icon: tierBadgeIcon.trim(),
        ltp_bonus: Number(tierLtpBonus),
        reward_type: tierRewardType,
        reward_title_id: tierRewardTitleId.trim() || null,
        reward_title_en: tierRewardTitleEn.trim() || null,
        reward_description_id: tierRewardDescId.trim() || null,
        reward_description_en: tierRewardDescEn.trim() || null,
        claim_required: editingTier.claimRequired,
        is_active: editingTier.isActive,
      });

      if (res.success) {
        setEditingTier(null);
        showToast('success', `Tingkatan Level ${editingTier.level} berhasil diperbarui.`);
        const updated = await getAdminRewardRulesAndTiers();
        if (updated.success && updated.tiers) setTiers(updated.tiers);
      } else {
        setTierError(res.error || 'Gagal memperbarui tingkatan level.');
      }
    });
  };

  // Rule modal actions
  const openEditRuleModal = (rule: AdminActionRuleItem) => {
    setEditingRule(rule);
    setRuleNameId(rule.nameId);
    setRuleNameEn(rule.nameEn);
    setRuleXp(rule.xpReward);
    setRuleLtp(rule.ltpReward);
    setRuleFrequency(rule.maxFrequency);
    setRuleError(null);
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule) return;

    setRuleError(null);
    startTransition(async () => {
      const res = await updateActionRule(editingRule.id, {
        name_id: ruleNameId.trim(),
        name_en: ruleNameEn.trim(),
        xp_reward: Number(ruleXp),
        ltp_reward: Number(ruleLtp),
        max_frequency: ruleFrequency,
        is_active: editingRule.isActive,
      });

      if (res.success) {
        setEditingRule(null);
        showToast('success', `Aturan hadiah "${editingRule.actionCode}" berhasil diperbarui.`);
        const updated = await getAdminRewardRulesAndTiers();
        if (updated.success && updated.rules) setRules(updated.rules);
      } else {
        setRuleError(res.error || 'Gagal memperbarui aturan hadiah.');
      }
    });
  };

  const handleToggleRule = (rule: AdminActionRuleItem) => {
    startTransition(async () => {
      const res = await toggleActionRuleStatus(rule.id, !rule.isActive);
      if (res.success) {
        setRules((prev) =>
          prev.map((r) => (r.id === rule.id ? { ...r, isActive: !rule.isActive } : r))
        );
        showToast('success', `Status aturan berhasil diubah.`);
      }
    });
  };

  // Filtered lists for Tier & Rules based on search
  const filteredTiers = tiers.filter(
    (t) =>
      t.nameEn.toLowerCase().includes(search.toLowerCase()) ||
      t.nameId.toLowerCase().includes(search.toLowerCase()) ||
      t.level.toString().includes(search) ||
      (t.rewardTitleEn && t.rewardTitleEn.toLowerCase().includes(search.toLowerCase())) ||
      (t.rewardTitleId && t.rewardTitleId.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredRules = rules.filter(
    (r) =>
      r.actionCode.toLowerCase().includes(search.toLowerCase()) ||
      r.nameEn.toLowerCase().includes(search.toLowerCase()) ||
      r.nameId.toLowerCase().includes(search.toLowerCase()) ||
      r.category.toLowerCase().includes(search.toLowerCase())
  );

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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold mb-2">
            <Gift className="w-3.5 h-3.5" />
            <span>Treasury, Gamifikasi & Ekosistem Rewards</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Rewards & Merch Catalog
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Konfigurasi tingkatan level XP, katalog merchandise hadiah traveler, serta kalkulasi tokenomics koin LTP.
          </p>
        </div>

        {/* Header Action Button */}
        {activeTab === 'merchandise' && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={openCreateMerchModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md shadow-amber-500/25 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Merchandise Baru</span>
            </button>
          </div>
        )}
      </motion.div>

      {/* Telemetry Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Merchandise */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          onClick={() => handleTabChange('merchandise')}
          className={`cursor-pointer p-5 rounded-2xl border transition-all shadow-sm ${
            activeTab === 'merchandise'
              ? 'ring-2 ring-amber-500 bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
              : 'bg-white dark:bg-[#1A1D21] border-gray-200/90 dark:border-white/10 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Katalog Merchandise
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {pagination.totalItems} Produk
            </div>
            <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-1">
              {merchandise.reduce((acc, curr) => acc + curr.stockQuantity, 0)} Total unit stok tersedia
            </div>
          </div>
        </motion.div>

        {/* Card 2: Level Tiers */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          onClick={() => handleTabChange('tiers')}
          className={`cursor-pointer p-5 rounded-2xl border transition-all shadow-sm ${
            activeTab === 'tiers'
              ? 'ring-2 ring-purple-500 bg-purple-50/50 dark:bg-purple-950/20 border-purple-300 dark:border-purple-800'
              : 'bg-white dark:bg-[#1A1D21] border-gray-200/90 dark:border-white/10 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Level Tiers
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
              {tiers.length} Tingkatan
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              Level 1 (0 XP) s/d Level 12 (35,000 XP)
            </div>
          </div>
        </motion.div>

        {/* Card 3: Action Rules */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          onClick={() => handleTabChange('rules')}
          className={`cursor-pointer p-5 rounded-2xl border transition-all shadow-sm ${
            activeTab === 'rules'
              ? 'ring-2 ring-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/20 border-cyan-300 dark:border-cyan-800'
              : 'bg-white dark:bg-[#1A1D21] border-gray-200/90 dark:border-white/10 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Aturan XP & LTP
            </span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400">
              {rules.length} Aturan Aksi
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              Mekanisme reward interaksi traveler
            </div>
          </div>
        </motion.div>
      </div>

      {/* Control Bar: Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Status Pill Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 overflow-x-auto max-w-full">
          {[
            { id: 'merchandise', label: 'Merchandise Catalog', icon: Package, count: pagination.totalItems },
            { id: 'tiers', label: 'Level Tiers', icon: Trophy, count: tiers.length },
            { id: 'rules', label: 'XP & LTP Rules', icon: Zap, count: rules.length },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as TabType)}
                className={`relative px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
                  isActive
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                    isActive
                      ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Category Filter */}
        <div className="flex items-center gap-2.5">
          {activeTab === 'merchandise' && (
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="APPAREL">Apparel</option>
              <option value="ACCESSORIES">Accessories</option>
              <option value="GEAR">Gear & Travel</option>
              <option value="SOUVENIR">Souvenir</option>
              <option value="VOUCHER">Voucher</option>
            </select>
          )}

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (activeTab === 'merchandise') {
                  refreshMerchandise(1, e.target.value, selectedCategory);
                }
              }}
              placeholder={
                activeTab === 'merchandise'
                  ? 'Cari merchandise...'
                  : activeTab === 'tiers'
                  ? 'Cari nama tier...'
                  : 'Cari kode aturan...'
              }
              className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition shadow-sm"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  if (activeTab === 'merchandise') refreshMerchandise(1, '', selectedCategory);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border border-gray-200/90 dark:border-white/10 bg-white dark:bg-[#1A1D21] shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          {/* TAB 1: MERCHANDISE */}
          {activeTab === 'merchandise' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-gray-200/90 dark:border-white/10">
                <tr>
                  <th className="px-5 py-3.5 font-bold">Item & Deskripsi</th>
                  <th className="px-5 py-3.5 font-bold">Kategori</th>
                  <th className="px-5 py-3.5 font-bold">Biaya Koin (LTP)</th>
                  <th className="px-5 py-3.5 font-bold">Level Gate</th>
                  <th className="px-5 py-3.5 font-bold">Stok & Terklaim</th>
                  <th className="px-5 py-3.5 font-bold">Status</th>
                  <th className="px-5 py-3.5 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-300">
                {merchandise.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      Tidak ada merchandise yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  merchandise.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-gray-200/80 dark:border-white/10 shrink-0 flex items-center justify-center">
                            {item.imageUrl ? (
                              <img
                                src={getPublicImageUrl(item.imageUrl, 'rewards')}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <Gift className="w-5 h-5 text-amber-500/60" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">{item.name}</div>
                            <span className="text-[11px] font-mono text-slate-400">{item.slug}</span>
                            {item.description && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 max-w-xs mt-0.5">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {item.category}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
                          <Coins className="w-3.5 h-3.5" />
                          <span>{item.pointsRequired.toLocaleString()}</span>
                          <span className="text-[10px] font-normal text-slate-400">LTP</span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          <Award className="w-3 h-3" />
                          Level {item.minLevel}+
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white">{item.stockQuantity}</span>
                          <span className="text-slate-400 font-normal"> tersedia</span>
                        </div>
                        <div className="text-[11px] text-slate-400">{item.claimedCount} sudah ditebus</div>
                      </td>

                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => handleToggleMerch(item)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition ${
                            item.isActive
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${item.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {item.isActive ? 'Aktif' : 'Draft'}
                        </button>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditMerchModal(item)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-white/10 transition"
                            title="Edit Merchandise"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingMerchId(item.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                            title="Hapus Merchandise"
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
          )}

          {/* TAB 2: LEVEL TIERS */}
          {activeTab === 'tiers' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-gray-200/90 dark:border-white/10">
                <tr>
                  <th className="px-5 py-3.5 font-bold">Level & Badge</th>
                  <th className="px-5 py-3.5 font-bold">Nama Tier (EN / ID)</th>
                  <th className="px-5 py-3.5 font-bold">Ambang Batas XP</th>
                  <th className="px-5 py-3.5 font-bold">Bonus Naik Level</th>
                  <th className="px-5 py-3.5 font-bold">Hadiah Milestone Merchandise</th>
                  <th className="px-5 py-3.5 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-300">
                {filteredTiers.map((tier) => (
                  <tr key={tier.level} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-sm font-black text-purple-700 dark:text-purple-300">
                          {tier.level}
                        </div>
                        <span className="text-xl">{tier.badgeIcon}</span>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900 dark:text-white">{tier.nameEn}</div>
                      <div className="text-[11px] text-slate-500">{tier.nameId}</div>
                    </td>

                    <td className="px-5 py-3.5 font-mono font-bold text-amber-600 dark:text-amber-400">
                      {tier.minXp.toLocaleString()} XP
                    </td>

                    <td className="px-5 py-3.5 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      +{tier.ltpBonus.toLocaleString()} LTP
                    </td>

                    <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300">
                      {tier.rewardTitleEn || tier.rewardTitleId ? (
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                            <Gift className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>{tier.rewardTitleEn || tier.rewardTitleId}</span>
                          </div>
                          {tier.rewardDescriptionId && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 max-w-sm">
                              {tier.rewardDescriptionId}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">None (Bonus LTP standar)</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => openEditTierModal(tier)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-100 dark:hover:bg-white/10 transition"
                        title="Edit Tier Level"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* TAB 3: ACTION RULES */}
          {activeTab === 'rules' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-gray-200/90 dark:border-white/10">
                <tr>
                  <th className="px-5 py-3.5 font-bold">Kode Aksi</th>
                  <th className="px-5 py-3.5 font-bold">Kategori</th>
                  <th className="px-5 py-3.5 font-bold">Nama Aturan</th>
                  <th className="px-5 py-3.5 font-bold">Reward XP</th>
                  <th className="px-5 py-3.5 font-bold">Reward LTP</th>
                  <th className="px-5 py-3.5 font-bold">Frekuensi Maksimal</th>
                  <th className="px-5 py-3.5 font-bold">Status</th>
                  <th className="px-5 py-3.5 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-300">
                {filteredRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-300">
                        {rule.actionCode}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">{rule.category}</td>

                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900 dark:text-white">{rule.nameEn}</div>
                      <div className="text-[11px] text-slate-500">{rule.nameId}</div>
                    </td>

                    <td className="px-5 py-3.5 font-mono font-bold text-amber-600 dark:text-amber-400">
                      +{rule.xpReward} XP
                    </td>

                    <td className="px-5 py-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      +{rule.ltpReward} LTP
                    </td>

                    <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">
                      {rule.maxFrequency}
                    </td>

                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => handleToggleRule(rule)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition ${
                          rule.isActive
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${rule.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {rule.isActive ? 'Aktif' : 'Non-aktif'}
                      </button>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => openEditRuleModal(rule)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-white/10 transition"
                        title="Edit Aturan"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Merchandise Pagination Footer */}
        {activeTab === 'merchandise' && pagination.totalPages > 1 && (
          <div className="p-4 border-t border-gray-200/90 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02]">
            <AdminPagination
              pagination={pagination}
              onPageChange={(page) => refreshMerchandise(page, search, selectedCategory)}
            />
          </div>
        )}
      </motion.div>

      {/* MODAL: ADD / EDIT MERCHANDISE */}
      <AnimatePresence>
        {isMerchModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/90 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Package className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                    {editingMerch ? 'Edit Merchandise' : 'Tambah Merchandise Baru'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsMerchModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveMerch} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
                {merchError && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{merchError}</span>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nama Merchandise <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={merchName}
                    onChange={(e) => {
                      setMerchName(e.target.value);
                      if (!editingMerch) {
                        setMerchSlug(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, '-')
                            .replace(/(^-|-$)/g, '')
                        );
                      }
                    }}
                    placeholder="Contoh: Kaos Premium Resmi Locallytrip"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Slug Identifier <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={merchSlug}
                      onChange={(e) => setMerchSlug(e.target.value)}
                      placeholder="locallytrip-official-tshirt"
                      className="w-full px-3.5 py-2.5 font-mono rounded-xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Kategori Produk
                    </label>
                    <select
                      value={merchCategory}
                      onChange={(e) => setMerchCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="APPAREL">Apparel (Pakaian/Jaket/Kaos)</option>
                      <option value="ACCESSORIES">Accessories (Stiker/Pin/Topi)</option>
                      <option value="GEAR">Gear & Travel (Tumbler/Tas/Ransel)</option>
                      <option value="SOUVENIR">Souvenir Lokal</option>
                      <option value="VOUCHER">Voucher Digital</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Koin LTP Dibutuhkan
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={merchPoints}
                      onChange={(e) => setMerchPoints(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3.5 py-2.5 font-mono rounded-xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Syarat Min. Level
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={12}
                      value={merchMinLevel}
                      onChange={(e) => setMerchMinLevel(parseInt(e.target.value, 10) || 1)}
                      className="w-full px-3.5 py-2.5 font-mono rounded-xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Stok Fisik
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={merchStock}
                      onChange={(e) => setMerchStock(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3.5 py-2.5 font-mono rounded-xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Foto Merchandise
                  </label>
                  <ImageUploadDropzone
                    folder="rewards"
                    value={merchImageUrl}
                    onChange={(url) => setMerchImageUrl(url)}
                    label="Unggah Foto Merchandise"
                    description="Tersimpan di /public/images/rewards/. Format WebP, PNG, atau JPG."
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Deskripsi Produk
                  </label>
                  <textarea
                    rows={2}
                    value={merchDescription}
                    onChange={(e) => setMerchDescription(e.target.value)}
                    placeholder="Bahan, spesifikasi ukuran, atau informasi klaim..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="merch_active"
                    checked={merchIsActive}
                    onChange={(e) => setMerchIsActive(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                  />
                  <label htmlFor="merch_active" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer font-medium">
                    Tampilkan di katalog rewards publik traveler
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200/90 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsMerchModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md transition disabled:opacity-50"
                  >
                    {isPending ? 'Menyimpan...' : 'Simpan Merchandise'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: EDIT LEVEL TIER */}
      <AnimatePresence>
        {editingTier && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/90 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black">
                    {editingTier.level}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                      Edit Tingkatan Level {editingTier.level}
                    </h3>
                    <p className="text-[11px] text-slate-500">{editingTier.nameEn}</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingTier(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveTier} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
                {tierError && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{tierError}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Nama Level (EN) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={tierNameEn}
                      onChange={(e) => setTierNameEn(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Nama Level (ID) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={tierNameId}
                      onChange={(e) => setTierNameId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Ambang Min XP
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={tierMinXp}
                      onChange={(e) => setTierMinXp(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3.5 py-2.5 font-mono rounded-xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Bonus Koin (LTP)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={tierLtpBonus}
                      onChange={(e) => setTierLtpBonus(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3.5 py-2.5 font-mono rounded-xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Icon Emoji Badge
                    </label>
                    <input
                      type="text"
                      required
                      value={tierBadgeIcon}
                      onChange={(e) => setTierBadgeIcon(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-center text-lg rounded-xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* Milestone Perk Section */}
                <div className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                      <Gift className="w-3.5 h-3.5" /> Hadiah Milestone Merchandise Naik Level
                    </span>
                    <select
                      value={tierRewardType}
                      onChange={(e) => setTierRewardType(e.target.value)}
                      className="px-2.5 py-1 text-[11px] rounded-lg bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-700 text-purple-800 dark:text-purple-200 font-bold"
                    >
                      <option value="NONE">NONE (Tanpa Hadiah Fisik)</option>
                      <option value="PHYSICAL_MERCH">PHYSICAL_MERCH (Hadiah Fisik)</option>
                      <option value="DIGITAL_VOUCHER">DIGITAL_VOUCHER (Voucher Digital)</option>
                      <option value="ALL_ACCESS">ALL_ACCESS (VIP Pass & Jaket)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Judul Hadiah (ID)
                      </label>
                      <input
                        type="text"
                        value={tierRewardTitleId}
                        onChange={(e) => setTierRewardTitleId(e.target.value)}
                        placeholder="Contoh: Paket Stiker & Pin Enamel"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Judul Hadiah (EN)
                      </label>
                      <input
                        type="text"
                        value={tierRewardTitleEn}
                        onChange={(e) => setTierRewardTitleEn(e.target.value)}
                        placeholder="e.g. Sticker Pack & Enamel Pin"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Deskripsi Detail Hadiah (ID)
                    </label>
                    <textarea
                      rows={2}
                      value={tierRewardDescId}
                      onChange={(e) => setTierRewardDescId(e.target.value)}
                      placeholder="Penjelasan hadiah yang didapatkan traveler saat mencapai level ini..."
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200/90 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setEditingTier(null)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-md transition disabled:opacity-50"
                  >
                    {isPending ? 'Menyimpan...' : 'Simpan Perubahan Level'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: EDIT ACTION RULE */}
      <AnimatePresence>
        {editingRule && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-200/90 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      Edit Aturan Hadiah
                    </h3>
                    <p className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400">
                      {editingRule.actionCode}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingRule(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveRule} className="space-y-3.5 text-xs">
                {ruleError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400">
                    {ruleError}
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Aturan (EN)
                  </label>
                  <input
                    type="text"
                    required
                    value={ruleNameEn}
                    onChange={(e) => setRuleNameEn(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Aturan (ID)
                  </label>
                  <input
                    type="text"
                    required
                    value={ruleNameId}
                    onChange={(e) => setRuleNameId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Reward XP
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={ruleXp}
                      onChange={(e) => setRuleXp(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3.5 py-2.5 font-mono rounded-xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Reward Koin LTP
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={ruleLtp}
                      onChange={(e) => setRuleLtp(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3.5 py-2.5 font-mono rounded-xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Frekuensi Maksimal
                  </label>
                  <select
                    value={ruleFrequency}
                    onChange={(e) => setRuleFrequency(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="ONCE">ONCE (Sekali Seumur Hidup)</option>
                    <option value="DAILY">DAILY (Harian)</option>
                    <option value="WEEKLY">WEEKLY (Mingguan)</option>
                    <option value="UNLIMITED">UNLIMITED (Tanpa Batas)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200/90 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setEditingRule(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-700 text-white shadow-md transition disabled:opacity-50"
                  >
                    {isPending ? 'Menyimpan...' : 'Simpan Aturan'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRMATION MODAL: DELETE MERCHANDISE */}
      <AnimatePresence>
        {deletingMerchId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-2xl p-6 space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>

              <div className="text-center">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Hapus Produk Merchandise?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Produk ini akan dihapus dari katalog penukaran hadiah traveler secara permanen.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingMerchId(null)}
                  className="flex-1 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleDeleteMerch(deletingMerchId)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Hapus Produk
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
