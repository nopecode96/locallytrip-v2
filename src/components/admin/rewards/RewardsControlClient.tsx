'use client';

import React, { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
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
  Layers,
  Award,
  ChevronRight,
  ShieldCheck,
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
import { getPublicImageUrl } from '@/lib/images';

interface RewardsControlClientProps {
  initialMerchandise: AdminMerchandiseItem[];
  initialPagination: PaginationState;
  initialTiers: AdminLevelTierItem[];
  initialRules: AdminActionRuleItem[];
}

type TabType = 'merchandise' | 'tiers' | 'rules';

export function RewardsControlClient({
  initialMerchandise,
  initialPagination,
  initialTiers,
  initialRules,
}: RewardsControlClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>('merchandise');
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
      setMerchError('Name and slug are required.');
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
        showToast('success', `Merchandise saved successfully.`);
        refreshMerchandise();
      } else {
        setMerchError(res.error || 'Failed to save merchandise');
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
        showToast('success', `Status updated.`);
      }
    });
  };

  const handleDeleteMerch = async (id: number) => {
    startTransition(async () => {
      const res = await deleteMerchandise(id);
      if (res.success) {
        setDeletingMerchId(null);
        showToast('success', 'Item deleted from catalog.');
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
        claim_required: editingTier.claimRequired,
        is_active: editingTier.isActive,
      });

      if (res.success) {
        setEditingTier(null);
        showToast('success', `Level ${editingTier.level} tier updated.`);
        const updated = await getAdminRewardRulesAndTiers();
        if (updated.success && updated.tiers) setTiers(updated.tiers);
      } else {
        setTierError(res.error || 'Failed to update level tier');
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
        showToast('success', `Action rule "${editingRule.actionCode}" updated.`);
        const updated = await getAdminRewardRulesAndTiers();
        if (updated.success && updated.rules) setRules(updated.rules);
      } else {
        setRuleError(res.error || 'Failed to update action rule');
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
        showToast('success', `Rule status updated.`);
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
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Rewards, Merchandise & Gamification Rules
            </h1>
            <p className="text-sm text-zinc-400">
              Manage redemption merchandise, stock levels, traveler level milestones, and XP point rules.
            </p>
          </div>
        </div>

        {activeTab === 'merchandise' && (
          <button
            onClick={openCreateMerchModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-semibold text-sm transition-all shadow-lg shadow-amber-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Merchandise
          </button>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 p-1.5 rounded-xl bg-zinc-900/60 border border-zinc-800 w-fit">
        <button
          onClick={() => setActiveTab('merchandise')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'merchandise'
              ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <Package className="w-4 h-4 text-amber-400" />
          Merchandise Catalog
          <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-zinc-950 text-zinc-400 border border-zinc-800">
            {pagination.totalItems}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('tiers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'tiers'
              ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <Trophy className="w-4 h-4 text-yellow-400" />
          Level Tiers
          <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-zinc-950 text-zinc-400 border border-zinc-800">
            {tiers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'rules'
              ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <Zap className="w-4 h-4 text-cyan-400" />
          XP & LTP Rules
          <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-zinc-950 text-zinc-400 border border-zinc-800">
            {rules.length}
          </span>
        </button>
      </div>

      {/* TAB 1: MERCHANDISE CATALOG */}
      {activeTab === 'merchandise' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto flex-1">
              <form onSubmit={handleMerchSearch} className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search merchandise..."
                  className="w-full pl-10 pr-4 py-2 text-sm bg-zinc-950/60 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </form>

              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryFilter(e.target.value)}
                className="w-full sm:w-48 px-3 py-2 text-sm bg-zinc-950/60 border border-zinc-800 rounded-lg text-zinc-300 focus:outline-none focus:border-amber-500 transition-colors"
              >
                <option value="ALL">All Categories</option>
                <option value="APPAREL">Apparel</option>
                <option value="ACCESSORIES">Accessories</option>
                <option value="GEAR">Gear & Travel</option>
                <option value="SOUVENIR">Souvenir</option>
                <option value="VOUCHER">Voucher</option>
              </select>
            </div>

            <div className="text-xs text-zinc-400">
              Showing <span className="font-semibold text-zinc-200">{merchandise.length}</span> items
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl bg-zinc-900/40 border border-zinc-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-300">
                <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[11px] tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="px-6 py-4">Item & Description</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Required Points</th>
                    <th className="px-6 py-4">Level Gate</th>
                    <th className="px-6 py-4">Stock & Claimed</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {merchandise.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                        No merchandise found.
                      </td>
                    </tr>
                  ) : (
                    merchandise.map((item) => (
                      <tr key={item.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700/60 flex-shrink-0 flex items-center justify-center">
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
                                <Gift className="w-6 h-6 text-amber-500/50" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-white">{item.name}</div>
                              <span className="text-[11px] font-mono text-zinc-500">{item.slug}</span>
                              {item.description && (
                                <p className="text-xs text-zinc-400 line-clamp-1 max-w-xs mt-0.5">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                            {item.category}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 font-bold text-amber-400">
                            <Coins className="w-4 h-4" />
                            {item.pointsRequired.toLocaleString()}
                            <span className="text-xs text-zinc-500 font-normal">LTP</span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-xs text-zinc-300">
                            <Award className="w-3.5 h-3.5 text-yellow-400" />
                            Level {item.minLevel}+
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="text-xs">
                            <div className="font-semibold text-white">
                              {item.stockQuantity} <span className="text-zinc-500 font-normal">in stock</span>
                            </div>
                            <div className="text-zinc-500">{item.claimedCount} redeemed</div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleToggleMerch(item)}
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                              item.isActive
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-zinc-800 text-zinc-500'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                item.isActive ? 'bg-emerald-400' : 'bg-zinc-500'
                              }`}
                            />
                            {item.isActive ? 'Active' : 'Draft'}
                          </button>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditMerchModal(item)}
                              className="p-2 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors border border-zinc-700/50"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingMerchId(item.id)}
                              className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors border border-rose-500/20"
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

            <div className="p-4 border-t border-zinc-800 bg-zinc-950/40">
              <AdminPagination
                pagination={pagination}
                onPageChange={(page) => refreshMerchandise(page, search, selectedCategory)}
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LEVEL TIERS */}
      {activeTab === 'tiers' && (
        <div className="rounded-2xl bg-zinc-900/40 border border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[11px] tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-4">Level & Badge</th>
                  <th className="px-6 py-4">Tier Name (ID / EN)</th>
                  <th className="px-6 py-4">Required XP</th>
                  <th className="px-6 py-4">LTP Level-Up Bonus</th>
                  <th className="px-6 py-4">Milestone Perk</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {tiers.map((tier) => (
                  <tr key={tier.level} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-sm font-bold text-amber-400">
                          {tier.level}
                        </div>
                        <span className="text-xs font-mono text-zinc-400">{tier.badgeIcon}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{tier.nameEn}</div>
                      <div className="text-xs text-zinc-500">{tier.nameId}</div>
                    </td>

                    <td className="px-6 py-4 font-mono font-medium text-amber-300">
                      {tier.minXp.toLocaleString()} XP
                    </td>

                    <td className="px-6 py-4 font-mono text-emerald-400 font-semibold">
                      +{tier.ltpBonus.toLocaleString()} LTP
                    </td>

                    <td className="px-6 py-4 text-xs text-zinc-400">
                      {tier.rewardTitleEn || tier.rewardTitleId ? (
                        <div className="flex items-center gap-1.5 text-zinc-200">
                          <Gift className="w-3.5 h-3.5 text-amber-400" />
                          {tier.rewardTitleEn || tier.rewardTitleId}
                        </div>
                      ) : (
                        <span className="text-zinc-600 italic">None</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openEditTierModal(tier)}
                        className="p-2 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors border border-zinc-700/50"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ACTION RULES */}
      {activeTab === 'rules' && (
        <div className="rounded-2xl bg-zinc-900/40 border border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[11px] tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-4">Action Code</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Rule Title</th>
                  <th className="px-6 py-4">XP Reward</th>
                  <th className="px-6 py-4">LTP Reward</th>
                  <th className="px-6 py-4">Max Frequency</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                        {rule.actionCode}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-xs font-mono text-zinc-400">{rule.category}</td>

                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{rule.nameEn}</div>
                      <div className="text-xs text-zinc-500">{rule.nameId}</div>
                    </td>

                    <td className="px-6 py-4 font-mono font-semibold text-amber-400">
                      +{rule.xpReward} XP
                    </td>

                    <td className="px-6 py-4 font-mono font-semibold text-emerald-400">
                      +{rule.ltpReward} LTP
                    </td>

                    <td className="px-6 py-4 text-xs font-mono text-zinc-400">
                      {rule.maxFrequency}
                    </td>

                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleRule(rule)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          rule.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-zinc-800 text-zinc-500'
                        }`}
                      >
                        {rule.isActive ? 'Active' : 'Disabled'}
                      </button>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openEditRuleModal(rule)}
                        className="p-2 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors border border-zinc-700/50"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Merchandise Modal */}
      <AnimatePresence>
        {isMerchModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
                <h3 className="font-semibold text-white">
                  {editingMerch ? 'Edit Merchandise' : 'Add New Merchandise'}
                </h3>
                <button
                  onClick={() => setIsMerchModalOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveMerch} className="p-6 space-y-4 overflow-y-auto flex-1">
                {merchError && (
                  <div className="flex items-center gap-2 p-3 text-xs rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{merchError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">Item Name</label>
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
                    placeholder="e.g. Locallytrip Canvas Adventure Tote"
                    className="w-full px-3.5 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">Slug</label>
                    <input
                      type="text"
                      required
                      value={merchSlug}
                      onChange={(e) => setMerchSlug(e.target.value)}
                      placeholder="locallytrip-canvas-tote"
                      className="w-full px-3.5 py-2 text-sm font-mono bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">Category</label>
                    <select
                      value={merchCategory}
                      onChange={(e) => setMerchCategory(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="APPAREL">Apparel</option>
                      <option value="ACCESSORIES">Accessories</option>
                      <option value="GEAR">Gear & Travel</option>
                      <option value="SOUVENIR">Souvenir</option>
                      <option value="VOUCHER">Voucher</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Points Cost (LTP)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={merchPoints}
                      onChange={(e) => setMerchPoints(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3.5 py-2 text-sm font-mono bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Min Level Gate
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={12}
                      value={merchMinLevel}
                      onChange={(e) => setMerchMinLevel(parseInt(e.target.value, 10) || 1)}
                      className="w-full px-3.5 py-2 text-sm font-mono bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">Stock Qty</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={merchStock}
                      onChange={(e) => setMerchStock(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3.5 py-2 text-sm font-mono bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">Image URL</label>
                  <input
                    type="url"
                    value={merchImageUrl}
                    onChange={(e) => setMerchImageUrl(e.target.value)}
                    placeholder="https://... or /images/merch/tote.png"
                    className="w-full px-3.5 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">Description</label>
                  <textarea
                    rows={2}
                    value={merchDescription}
                    onChange={(e) => setMerchDescription(e.target.value)}
                    placeholder="Item details, material, size specifications..."
                    className="w-full px-3.5 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="merch_active"
                    checked={merchIsActive}
                    onChange={(e) => setMerchIsActive(e.target.checked)}
                    className="rounded border-zinc-800 text-amber-500 focus:ring-amber-500 bg-zinc-950 w-4 h-4"
                  />
                  <label htmlFor="merch_active" className="text-sm text-zinc-300 cursor-pointer">
                    Available in public rewards store for redemption
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsMerchModalOpen(false)}
                    className="px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-black rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    {editingMerch ? 'Save Changes' : 'Create Merchandise'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Level Tier Modal */}
      <AnimatePresence>
        {editingTier && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <h3 className="font-semibold text-white">Configure Level {editingTier.level} Tier</h3>
                <button onClick={() => setEditingTier(null)} className="p-1 text-zinc-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveTier} className="space-y-4">
                {tierError && (
                  <div className="p-3 text-xs rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
                    {tierError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">Name (EN)</label>
                    <input
                      type="text"
                      required
                      value={tierNameEn}
                      onChange={(e) => setTierNameEn(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">Name (ID)</label>
                    <input
                      type="text"
                      required
                      value={tierNameId}
                      onChange={(e) => setTierNameId(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">Min XP</label>
                    <input
                      type="number"
                      required
                      value={tierMinXp}
                      onChange={(e) => setTierMinXp(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3 py-2 text-sm font-mono bg-zinc-950 border border-zinc-800 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">LTP Bonus</label>
                    <input
                      type="number"
                      required
                      value={tierLtpBonus}
                      onChange={(e) => setTierLtpBonus(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3 py-2 text-sm font-mono bg-zinc-950 border border-zinc-800 rounded-lg text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Badge Icon</label>
                  <input
                    type="text"
                    required
                    value={tierBadgeIcon}
                    onChange={(e) => setTierBadgeIcon(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Perk Title (EN)</label>
                  <input
                    type="text"
                    value={tierRewardTitleEn}
                    onChange={(e) => setTierRewardTitleEn(e.target.value)}
                    placeholder="e.g. Free Exclusive Enamel Pin"
                    className="w-full px-3 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setEditingTier(null)}
                    className="px-4 py-2 text-sm text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-5 py-2 text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-black rounded-lg"
                  >
                    Save Tier
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Action Rule Modal */}
      <AnimatePresence>
        {editingRule && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <h3 className="font-semibold text-white">Edit Rule: {editingRule.actionCode}</h3>
                <button onClick={() => setEditingRule(null)} className="p-1 text-zinc-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveRule} className="space-y-4">
                {ruleError && (
                  <div className="p-3 text-xs rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
                    {ruleError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Rule Name (EN)</label>
                  <input
                    type="text"
                    required
                    value={ruleNameEn}
                    onChange={(e) => setRuleNameEn(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Rule Name (ID)</label>
                  <input
                    type="text"
                    required
                    value={ruleNameId}
                    onChange={(e) => setRuleNameId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">XP Reward</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={ruleXp}
                      onChange={(e) => setRuleXp(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3 py-2 text-sm font-mono bg-zinc-950 border border-zinc-800 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">LTP Reward</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={ruleLtp}
                      onChange={(e) => setRuleLtp(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3 py-2 text-sm font-mono bg-zinc-950 border border-zinc-800 rounded-lg text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Max Frequency</label>
                  <select
                    value={ruleFrequency}
                    onChange={(e) => setRuleFrequency(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-white"
                  >
                    <option value="ONCE">ONCE (Lifetime)</option>
                    <option value="DAILY">DAILY</option>
                    <option value="WEEKLY">WEEKLY</option>
                    <option value="UNLIMITED">UNLIMITED</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setEditingRule(null)}
                    className="px-4 py-2 text-sm text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-5 py-2 text-sm font-semibold bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg"
                  >
                    Save Rule
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Merchandise Confirmation */}
      <AnimatePresence>
        {deletingMerchId && (
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
                <h3 className="font-semibold text-white">Delete Merchandise Item?</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  This will remove the item from the rewards catalog.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingMerchId(null)}
                  className="flex-1 py-2 text-sm text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleDeleteMerch(deletingMerchId)}
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
