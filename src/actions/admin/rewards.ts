'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireRole } from '@/lib/admin-auth';

// ==========================================
// 1. REWARD MERCHANDISE TYPES & SCHEMAS
// ==========================================

export interface AdminMerchandiseItem {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  pointsRequired: number;
  minLevel: number;
  stockQuantity: number;
  claimedCount: number;
  category: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminLevelTierItem {
  level: number;
  nameId: string;
  nameEn: string;
  minXp: number;
  badgeIcon: string;
  ltpBonus: number;
  rewardType: string;
  rewardTitleId: string | null;
  rewardTitleEn: string | null;
  rewardDescriptionId: string | null;
  rewardDescriptionEn: string | null;
  claimRequired: boolean;
  isActive: boolean;
}

export interface AdminActionRuleItem {
  id: number;
  actionCode: string;
  category: string;
  nameId: string;
  nameEn: string;
  descriptionId: string | null;
  descriptionEn: string | null;
  xpReward: number;
  ltpReward: number;
  maxFrequency: string;
  isActive: boolean;
}

const MerchandiseSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(150),
  slug: z.string().min(2, 'Slug must be at least 2 characters').max(150),
  description: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  points_required: z.coerce.number().min(0, 'Points must be 0 or greater'),
  min_level: z.coerce.number().min(1, 'Minimum level must be at least 1').max(100),
  stock_quantity: z.coerce.number().min(0, 'Stock cannot be negative'),
  category: z.string().min(1, 'Category is required'),
  is_active: z.boolean().default(true),
});

const LevelTierSchema = z.object({
  name_id: z.string().min(1, 'Indonesian tier name is required'),
  name_en: z.string().min(1, 'English tier name is required'),
  min_xp: z.coerce.number().min(0, 'Minimum XP must be positive'),
  badge_icon: z.string().min(1, 'Badge icon is required'),
  ltp_bonus: z.coerce.number().min(0),
  reward_type: z.string().default('NONE'),
  reward_title_id: z.string().nullable().optional(),
  reward_title_en: z.string().nullable().optional(),
  reward_description_id: z.string().nullable().optional(),
  reward_description_en: z.string().nullable().optional(),
  claim_required: z.boolean().default(false),
  is_active: z.boolean().default(true),
});

const ActionRuleSchema = z.object({
  name_id: z.string().min(1, 'Indonesian rule name is required'),
  name_en: z.string().min(1, 'English rule name is required'),
  xp_reward: z.coerce.number().min(0),
  ltp_reward: z.coerce.number().min(0),
  max_frequency: z.string().default('UNLIMITED'),
  is_active: z.boolean().default(true),
});

// ==========================================
// 2. MERCHANDISE CATALOG CRUD
// ==========================================

export async function getAdminMerchandise(params: {
  search?: string;
  category?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}) {
  try {
    await requireRole(['super admin', 'admin', 'finances']);

    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (params.category && params.category !== 'ALL') {
      where.category = params.category;
    }

    if (params.isActive !== undefined) {
      where.is_active = params.isActive;
    }

    const [total, items] = await Promise.all([
      prisma.reward_merchandise.count({ where }),
      prisma.reward_merchandise.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ points_required: 'asc' }, { name: 'asc' }],
      }),
    ]);

    const formatted: AdminMerchandiseItem[] = items.map((m) => ({
      id: m.id,
      name: m.name,
      slug: m.slug,
      description: m.description,
      imageUrl: m.image_url,
      pointsRequired: m.points_required,
      minLevel: m.min_level,
      stockQuantity: m.stock_quantity,
      claimedCount: m.claimed_count,
      category: m.category,
      isActive: m.is_active,
      createdAt: m.created_at,
      updatedAt: m.updated_at,
    }));

    return {
      success: true,
      data: formatted,
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  } catch (error: any) {
    console.error('getAdminMerchandise error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch merchandise',
      data: [],
      pagination: { currentPage: 1, pageSize: 20, totalItems: 0, totalPages: 1 },
    };
  }
}

export async function createMerchandise(input: z.infer<typeof MerchandiseSchema>) {
  try {
    await requireRole(['super admin', 'admin', 'finances']);

    const validated = MerchandiseSchema.parse(input);
    const slug = validated.slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-');

    const created = await prisma.reward_merchandise.create({
      data: {
        name: validated.name.trim(),
        slug,
        description: validated.description?.trim() || null,
        image_url: validated.image_url?.trim() || null,
        points_required: validated.points_required,
        min_level: validated.min_level,
        stock_quantity: validated.stock_quantity,
        category: validated.category.toUpperCase(),
        is_active: validated.is_active,
      },
    });

    revalidatePath('/admin/rewards');
    return { success: true, data: created };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create merchandise item' };
  }
}

export async function updateMerchandise(id: number, input: z.infer<typeof MerchandiseSchema>) {
  try {
    await requireRole(['super admin', 'admin', 'finances']);

    const validated = MerchandiseSchema.parse(input);
    const slug = validated.slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-');

    const updated = await prisma.reward_merchandise.update({
      where: { id },
      data: {
        name: validated.name.trim(),
        slug,
        description: validated.description?.trim() || null,
        image_url: validated.image_url?.trim() || null,
        points_required: validated.points_required,
        min_level: validated.min_level,
        stock_quantity: validated.stock_quantity,
        category: validated.category.toUpperCase(),
        is_active: validated.is_active,
      },
    });

    revalidatePath('/admin/rewards');
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update merchandise item' };
  }
}

export async function toggleMerchandiseStatus(id: number, is_active: boolean) {
  try {
    await requireRole(['super admin', 'admin', 'finances']);

    const updated = await prisma.reward_merchandise.update({
      where: { id },
      data: { is_active },
    });
    revalidatePath('/admin/rewards');
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to toggle status' };
  }
}

export async function deleteMerchandise(id: number) {
  try {
    await requireRole(['super admin', 'admin', 'finances']);

    await prisma.reward_merchandise.delete({ where: { id } });
    revalidatePath('/admin/rewards');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete merchandise item' };
  }
}

// ==========================================
// 3. TIERS & ACTION RULES CONFIGURATION
// ==========================================

export async function getAdminRewardRulesAndTiers() {
  try {
    const [tiers, rules] = await Promise.all([
      prisma.reward_level_tiers.findMany({
        orderBy: { level: 'asc' },
      }),
      prisma.reward_action_rules.findMany({
        orderBy: [{ category: 'asc' }, { id: 'asc' }],
      }),
    ]);

    const formattedTiers: AdminLevelTierItem[] = tiers.map((t) => ({
      level: t.level,
      nameId: t.name_id,
      nameEn: t.name_en,
      minXp: t.min_xp,
      badgeIcon: t.badge_icon,
      ltpBonus: t.ltp_bonus,
      rewardType: t.reward_type,
      rewardTitleId: t.reward_title_id,
      rewardTitleEn: t.reward_title_en,
      rewardDescriptionId: t.reward_description_id,
      rewardDescriptionEn: t.reward_description_en,
      claimRequired: t.claim_required,
      isActive: t.is_active,
    }));

    const formattedRules: AdminActionRuleItem[] = rules.map((r) => ({
      id: r.id,
      actionCode: r.action_code,
      category: r.category,
      nameId: r.name_id,
      nameEn: r.name_en,
      descriptionId: r.description_id,
      descriptionEn: r.description_en,
      xpReward: r.xp_reward,
      ltpReward: r.ltp_reward,
      maxFrequency: r.max_frequency,
      isActive: r.is_active,
    }));

    return {
      success: true,
      tiers: formattedTiers,
      rules: formattedRules,
    };
  } catch (error: any) {
    console.error('getAdminRewardRulesAndTiers error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch tiers and rules',
      tiers: [],
      rules: [],
    };
  }
}

export async function updateLevelTier(level: number, input: z.infer<typeof LevelTierSchema>) {
  try {
    const validated = LevelTierSchema.parse(input);

    const updated = await prisma.reward_level_tiers.update({
      where: { level },
      data: {
        name_id: validated.name_id.trim(),
        name_en: validated.name_en.trim(),
        min_xp: validated.min_xp,
        badge_icon: validated.badge_icon.trim(),
        ltp_bonus: validated.ltp_bonus,
        reward_type: validated.reward_type.trim(),
        reward_title_id: validated.reward_title_id?.trim() || null,
        reward_title_en: validated.reward_title_en?.trim() || null,
        reward_description_id: validated.reward_description_id?.trim() || null,
        reward_description_en: validated.reward_description_en?.trim() || null,
        claim_required: validated.claim_required,
        is_active: validated.is_active,
      },
    });

    revalidatePath('/admin/rewards');
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update level tier' };
  }
}

export async function updateActionRule(id: number, input: z.infer<typeof ActionRuleSchema>) {
  try {
    const validated = ActionRuleSchema.parse(input);

    const updated = await prisma.reward_action_rules.update({
      where: { id },
      data: {
        name_id: validated.name_id.trim(),
        name_en: validated.name_en.trim(),
        xp_reward: validated.xp_reward,
        ltp_reward: validated.ltp_reward,
        max_frequency: validated.max_frequency.trim(),
        is_active: validated.is_active,
      },
    });

    revalidatePath('/admin/rewards');
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update action rule' };
  }
}

export async function toggleActionRuleStatus(id: number, is_active: boolean) {
  try {
    const updated = await prisma.reward_action_rules.update({
      where: { id },
      data: { is_active },
    });
    revalidatePath('/admin/rewards');
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to toggle status' };
  }
}
