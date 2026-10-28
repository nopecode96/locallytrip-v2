'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { PaginationState } from '@/components/admin/ui/AdminPagination';

// ==========================================
// 1. COUNTRIES ACTIONS & TYPES
// ==========================================

export interface AdminCountryItem {
  id: number;
  name: string;
  code: string;
  cityCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const CountrySchema = z.object({
  name: z.string().min(2, 'Country name must be at least 2 characters').max(100),
  code: z.string().min(2, 'Country code must be 2 or 3 letters').max(3).toUpperCase(),
});

export async function getAdminCountries(params: {
  search?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { code: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, countries] = await Promise.all([
      prisma.countries.count({ where }),
      prisma.countries.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { cities: true },
          },
        },
      }),
    ]);

    const formatted: AdminCountryItem[] = countries.map((c) => ({
      id: c.id,
      name: c.name,
      code: c.code,
      cityCount: c._count.cities,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
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
    console.error('getAdminCountries error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch countries',
      data: [],
      pagination: { currentPage: 1, pageSize: 20, totalItems: 0, totalPages: 1 },
    };
  }
}

export async function createCountry(input: z.infer<typeof CountrySchema>) {
  try {
    const validated = CountrySchema.parse(input);

    const existing = await prisma.countries.findFirst({
      where: {
        OR: [
          { name: { equals: validated.name, mode: 'insensitive' } },
          { code: { equals: validated.code, mode: 'insensitive' } },
        ],
      },
    });

    if (existing) {
      return { success: false, error: 'A country with this name or code already exists' };
    }

    const created = await prisma.countries.create({
      data: {
        name: validated.name.trim(),
        code: validated.code.trim().toUpperCase(),
      },
    });

    revalidatePath('/admin/master/countries');
    revalidatePath('/admin/master/cities');
    return { success: true, data: created };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create country' };
  }
}

export async function updateCountry(id: number, input: z.infer<typeof CountrySchema>) {
  try {
    const validated = CountrySchema.parse(input);

    const existing = await prisma.countries.findFirst({
      where: {
        id: { not: id },
        OR: [
          { name: { equals: validated.name, mode: 'insensitive' } },
          { code: { equals: validated.code, mode: 'insensitive' } },
        ],
      },
    });

    if (existing) {
      return { success: false, error: 'Another country already uses this name or code' };
    }

    const updated = await prisma.countries.update({
      where: { id },
      data: {
        name: validated.name.trim(),
        code: validated.code.trim().toUpperCase(),
      },
    });

    revalidatePath('/admin/master/countries');
    revalidatePath('/admin/master/cities');
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update country' };
  }
}

export async function deleteCountry(id: number) {
  try {
    const cityCount = await prisma.cities.count({ where: { country_id: id } });
    if (cityCount > 0) {
      return {
        success: false,
        error: `Cannot delete country because it has ${cityCount} associated destination cities. Please reassign or delete them first.`,
      };
    }

    await prisma.countries.delete({ where: { id } });
    revalidatePath('/admin/master/countries');
    revalidatePath('/admin/master/cities');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete country' };
  }
}

// ==========================================
// 2. CITIES ACTIONS & TYPES
// ==========================================

export interface AdminCityItem {
  id: number;
  name: string;
  countryId: number | null;
  countryName: string;
  countryCode: string;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  experiencesCount: number;
  meetupsCount: number;
  storiesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const CitySchema = z.object({
  name: z.string().min(2, 'City name must be at least 2 characters').max(255),
  country_id: z.number().int().positive('Country is required'),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  description: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
});

export async function getAdminCities(params: {
  search?: string;
  countryId?: number;
  isActive?: boolean;
  page?: number;
  limit?: number;
}) {
  try {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { countries: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    if (params.countryId) {
      where.country_id = params.countryId;
    }

    if (params.isActive !== undefined) {
      where.is_active = params.isActive;
    }

    const [total, cities] = await Promise.all([
      prisma.cities.count({ where }),
      prisma.cities.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          countries: { select: { id: true, name: true, code: true } },
          _count: {
            select: {
              experiences: true,
              vibes_travel_meetups: true,
              stories: true,
            },
          },
        },
      }),
    ]);

    const formatted: AdminCityItem[] = cities.map((c) => ({
      id: c.id,
      name: c.name,
      countryId: c.country_id,
      countryName: c.countries?.name || 'Unknown',
      countryCode: c.countries?.code || 'N/A',
      latitude: c.latitude ? Number(c.latitude) : null,
      longitude: c.longitude ? Number(c.longitude) : null,
      description: c.description,
      imageUrl: c.image_url,
      isActive: c.is_active ?? true,
      experiencesCount: c._count.experiences,
      meetupsCount: c._count.vibes_travel_meetups,
      storiesCount: c._count.stories,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
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
    console.error('getAdminCities error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch cities',
      data: [],
      pagination: { currentPage: 1, pageSize: 20, totalItems: 0, totalPages: 1 },
    };
  }
}

export async function createCity(input: z.infer<typeof CitySchema>) {
  try {
    const validated = CitySchema.parse(input);

    const created = await prisma.cities.create({
      data: {
        name: validated.name.trim(),
        country_id: validated.country_id,
        latitude: validated.latitude ?? null,
        longitude: validated.longitude ?? null,
        description: validated.description?.trim() || null,
        image_url: validated.image_url?.trim() || null,
        is_active: validated.is_active ?? true,
      },
    });

    revalidatePath('/admin/master/cities');
    return { success: true, data: created };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create city' };
  }
}

export async function updateCity(id: number, input: z.infer<typeof CitySchema>) {
  try {
    const validated = CitySchema.parse(input);

    const updated = await prisma.cities.update({
      where: { id },
      data: {
        name: validated.name.trim(),
        country_id: validated.country_id,
        latitude: validated.latitude ?? null,
        longitude: validated.longitude ?? null,
        description: validated.description?.trim() || null,
        image_url: validated.image_url?.trim() || null,
        is_active: validated.is_active ?? true,
      },
    });

    revalidatePath('/admin/master/cities');
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update city' };
  }
}

export async function toggleCityStatus(id: number, is_active: boolean) {
  try {
    const updated = await prisma.cities.update({
      where: { id },
      data: { is_active },
    });
    revalidatePath('/admin/master/cities');
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to toggle status' };
  }
}

export async function deleteCity(id: number) {
  try {
    const [expCount, meetupCount, storyCount] = await Promise.all([
      prisma.experiences.count({ where: { city_id: id } }),
      prisma.vibes_travel_meetups.count({ where: { city_id: id } }),
      prisma.stories.count({ where: { city_id: id } }),
    ]);

    const totalUsage = expCount + meetupCount + storyCount;
    if (totalUsage > 0) {
      return {
        success: false,
        error: `Cannot delete city because it is referenced by ${expCount} experiences, ${meetupCount} meetups, and ${storyCount} stories. Consider deactivating it instead.`,
      };
    }

    await prisma.cities.delete({ where: { id } });
    revalidatePath('/admin/master/cities');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete city' };
  }
}

export async function getCountryOptions() {
  try {
    const countries = await prisma.countries.findMany({
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' },
    });
    return { success: true, data: countries };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch country options', data: [] };
  }
}

// ==========================================
// 3. CATEGORIES: FORUMS ACTIONS & TYPES
// ==========================================

export interface AdminForumCategoryItem {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  displayOrder: number;
  isActive: boolean;
  threadCount: number;
  parentId: number | null;
  parentName: string | null;
}

const ForumCategorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  slug: z.string().min(2, 'Slug must be at least 2 characters').max(100),
  description: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  display_order: z.number().default(0),
  is_active: z.boolean().default(true),
  parent_id: z.number().nullable().optional(),
});

export async function getAdminForumCategories(params: { search?: string; page?: number; limit?: number }) {
  try {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 30));
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

    const [total, items] = await Promise.all([
      prisma.vibes_forum_categories.count({ where }),
      prisma.vibes_forum_categories.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
        include: {
          vibes_forum_categories: { select: { id: true, name: true } },
          _count: { select: { vibes_forum_threads: true } },
        },
      }),
    ]);

    const formatted: AdminForumCategoryItem[] = items.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      icon: c.icon,
      displayOrder: c.display_order ?? 0,
      isActive: c.is_active ?? true,
      threadCount: c._count.vibes_forum_threads || c.thread_count || 0,
      parentId: c.parent_id,
      parentName: c.vibes_forum_categories?.name || null,
    }));

    return {
      success: true,
      data: formatted,
      pagination: {
        page,
        limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  } catch (error: any) {
    console.error('getAdminForumCategories error:', error);
    return { success: false, error: error.message, data: [], pagination: { page: 1, limit: 30, totalItems: 0, totalPages: 1 } };
  }
}

export async function createForumCategory(input: z.infer<typeof ForumCategorySchema>) {
  try {
    const validated = ForumCategorySchema.parse(input);
    const slug = validated.slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-');

    const created = await prisma.vibes_forum_categories.create({
      data: {
        name: validated.name.trim(),
        slug,
        description: validated.description?.trim() || null,
        icon: validated.icon?.trim() || null,
        display_order: validated.display_order ?? 0,
        is_active: validated.is_active ?? true,
        parent_id: validated.parent_id || null,
      },
    });

    revalidatePath('/admin/master/categories');
    return { success: true, data: created };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create forum category' };
  }
}

export async function updateForumCategory(id: number, input: z.infer<typeof ForumCategorySchema>) {
  try {
    const validated = ForumCategorySchema.parse(input);
    const slug = validated.slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-');

    const updated = await prisma.vibes_forum_categories.update({
      where: { id },
      data: {
        name: validated.name.trim(),
        slug,
        description: validated.description?.trim() || null,
        icon: validated.icon?.trim() || null,
        display_order: validated.display_order ?? 0,
        is_active: validated.is_active ?? true,
        parent_id: validated.parent_id || null,
      },
    });

    revalidatePath('/admin/master/categories');
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update forum category' };
  }
}

export async function deleteForumCategory(id: number) {
  try {
    const threadCount = await prisma.vibes_forum_threads.count({ where: { category_id: id } });
    if (threadCount > 0) {
      return {
        success: false,
        error: `Cannot delete forum category because it has ${threadCount} discussion threads. Please archive or reassign them.`,
      };
    }

    await prisma.vibes_forum_categories.delete({ where: { id } });
    revalidatePath('/admin/master/categories');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete forum category' };
  }
}

// ==========================================
// 4. CATEGORIES: MEETUPS / EXPERIENCES TYPES
// ==========================================

export interface AdminExperienceTypeItem {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  riskLevel: string | null;
  experiencesCount: number;
  meetupsCount: number;
}

const ExperienceTypeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
  sort_order: z.number().default(0),
  risk_level: z.string().nullable().optional(),
});

export async function getAdminExperienceTypes(params: { search?: string; page?: number; limit?: number }) {
  try {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 30));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.experience_types.count({ where }),
      prisma.experience_types.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
        include: {
          _count: {
            select: {
              experiences: true,
              vibes_travel_meetups: true,
            },
          },
        },
      }),
    ]);

    const formatted: AdminExperienceTypeItem[] = items.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      icon: t.icon,
      color: t.color,
      imageUrl: t.image_url,
      isActive: t.is_active ?? true,
      sortOrder: t.sort_order ?? 0,
      riskLevel: t.risk_level,
      experiencesCount: t._count.experiences,
      meetupsCount: t._count.vibes_travel_meetups,
    }));

    return {
      success: true,
      data: formatted,
      pagination: {
        page,
        limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  } catch (error: any) {
    console.error('getAdminExperienceTypes error:', error);
    return { success: false, error: error.message, data: [], pagination: { page: 1, limit: 30, totalItems: 0, totalPages: 1 } };
  }
}

export async function createExperienceType(input: z.infer<typeof ExperienceTypeSchema>) {
  try {
    const validated = ExperienceTypeSchema.parse(input);

    const created = await prisma.experience_types.create({
      data: {
        name: validated.name.trim(),
        description: validated.description?.trim() || null,
        icon: validated.icon?.trim() || null,
        color: validated.color?.trim() || null,
        image_url: validated.image_url?.trim() || null,
        is_active: validated.is_active ?? true,
        sort_order: validated.sort_order ?? 0,
        risk_level: validated.risk_level?.trim() || null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    revalidatePath('/admin/master/categories');
    return { success: true, data: created };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create experience type' };
  }
}

export async function updateExperienceType(id: number, input: z.infer<typeof ExperienceTypeSchema>) {
  try {
    const validated = ExperienceTypeSchema.parse(input);

    const updated = await prisma.experience_types.update({
      where: { id },
      data: {
        name: validated.name.trim(),
        description: validated.description?.trim() || null,
        icon: validated.icon?.trim() || null,
        color: validated.color?.trim() || null,
        image_url: validated.image_url?.trim() || null,
        is_active: validated.is_active ?? true,
        sort_order: validated.sort_order ?? 0,
        risk_level: validated.risk_level?.trim() || null,
        updated_at: new Date(),
      },
    });

    revalidatePath('/admin/master/categories');
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update experience type' };
  }
}

export async function deleteExperienceType(id: number) {
  try {
    const [expCount, meetupCount] = await Promise.all([
      prisma.experiences.count({ where: { experience_type_id: id } }),
      prisma.vibes_travel_meetups.count({ where: { experience_type_id: id } }),
    ]);

    if (expCount > 0 || meetupCount > 0) {
      return {
        success: false,
        error: `Cannot delete category because it is used by ${expCount} experiences and ${meetupCount} meetups.`,
      };
    }

    await prisma.experience_types.delete({ where: { id } });
    revalidatePath('/admin/master/categories');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete category' };
  }
}

// ==========================================
// 5. CATEGORIES: STORY CATEGORIES
// ==========================================

export interface AdminStoryCategoryItem {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
}

const StoryCategorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  slug: z.string().min(2, 'Slug must be at least 2 characters').max(100),
  description: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
  sort_order: z.number().default(0),
});

export async function getAdminStoryCategories(params: { search?: string; page?: number; limit?: number }) {
  try {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 30));
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

    const [total, items] = await Promise.all([
      prisma.story_categories.count({ where }),
      prisma.story_categories.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
      }),
    ]);

    const formatted: AdminStoryCategoryItem[] = items.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      description: s.description,
      icon: s.icon,
      color: s.color,
      imageUrl: s.image_url,
      isActive: s.is_active,
      sortOrder: s.sort_order,
    }));

    return {
      success: true,
      data: formatted,
      pagination: {
        page,
        limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  } catch (error: any) {
    console.error('getAdminStoryCategories error:', error);
    return { success: false, error: error.message, data: [], pagination: { page: 1, limit: 30, totalItems: 0, totalPages: 1 } };
  }
}

export async function createStoryCategory(input: z.infer<typeof StoryCategorySchema>) {
  try {
    const validated = StoryCategorySchema.parse(input);
    const slug = validated.slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-');

    const created = await prisma.story_categories.create({
      data: {
        name: validated.name.trim(),
        slug,
        description: validated.description?.trim() || null,
        icon: validated.icon?.trim() || null,
        color: validated.color?.trim() || null,
        image_url: validated.image_url?.trim() || null,
        is_active: validated.is_active ?? true,
        sort_order: validated.sort_order ?? 0,
      },
    });

    revalidatePath('/admin/master/categories');
    return { success: true, data: created };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create story category' };
  }
}

export async function updateStoryCategory(id: number, input: z.infer<typeof StoryCategorySchema>) {
  try {
    const validated = StoryCategorySchema.parse(input);
    const slug = validated.slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-');

    const updated = await prisma.story_categories.update({
      where: { id },
      data: {
        name: validated.name.trim(),
        slug,
        description: validated.description?.trim() || null,
        icon: validated.icon?.trim() || null,
        color: validated.color?.trim() || null,
        image_url: validated.image_url?.trim() || null,
        is_active: validated.is_active ?? true,
        sort_order: validated.sort_order ?? 0,
      },
    });

    revalidatePath('/admin/master/categories');
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update story category' };
  }
}

export async function deleteStoryCategory(id: number) {
  try {
    await prisma.story_categories.delete({ where: { id } });
    revalidatePath('/admin/master/categories');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete story category' };
  }
}

// ==========================================
// 6. PLATFORM FEE CONFIGURATIONS (APPEND-ONLY)
// ==========================================

export interface AdminFeeConfigItem {
  id: number;
  name: string;
  category: string;
  feePercent: number;
  feeType: string;
  feeBearer: string;
  description: string | null;
  effectiveFrom: string;
  effectiveUntil: string | null;
  isActive: boolean;
  createdAt: string;
}

const FeeConfigSchema = z.object({
  name: z.string().min(2, 'Nama konfigurasi minimal 2 karakter').max(100),
  category: z.string().default('EXPERIENCES'),
  fee_percent: z.number().min(0, 'Fee minimal 0%').max(12, 'Fee maksimal 12%'),
  fee_type: z.enum(['PERCENTAGE', 'FIXED', 'HYBRID']).default('PERCENTAGE'),
  fee_bearer: z.enum(['HOST', 'TRAVELER', 'SPLIT']).default('HOST'),
  description: z.string().nullable().optional(),
  effective_from: z.string().optional(),
});

export async function getAdminFeeConfigurations(category: string = 'EXPERIENCES') {
  try {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT 
        id, name, category, fee_percent, fee_type, fee_bearer, 
        description, effective_from, effective_until, is_active, created_at
      FROM public.platform_fee_configurations
      WHERE category = ${category}
      ORDER BY effective_from DESC, id DESC;
    `;

    const formatted: AdminFeeConfigItem[] = rows.map((r) => ({
      id: Number(r.id),
      name: String(r.name),
      category: String(r.category),
      feePercent: Number(r.fee_percent),
      feeType: String(r.fee_type),
      feeBearer: String(r.fee_bearer),
      description: r.description ? String(r.description) : null,
      effectiveFrom: new Date(r.effective_from).toISOString(),
      effectiveUntil: r.effective_until ? new Date(r.effective_until).toISOString() : null,
      isActive: Boolean(r.is_active),
      createdAt: new Date(r.created_at).toISOString(),
    }));

    return { success: true, data: formatted };
  } catch (error: any) {
    console.error('getAdminFeeConfigurations error:', error);
    return { success: false, error: error.message || 'Failed to fetch fee configurations', data: [] };
  }
}

/**
 * Membuat baris baru konfigurasi fee (Append-Only Rule).
 * Otomatis menutup effective_until baris sebelumnya agar data transaksi lama tetap utuh.
 */
export async function createNewFeeConfiguration(input: z.infer<typeof FeeConfigSchema>) {
  try {
    const validated = FeeConfigSchema.parse(input);
    const now = validated.effective_from ? new Date(validated.effective_from) : new Date();

    // 1. Tutup baris aktif sebelumnya pada kategori yang sama
    await prisma.$executeRaw`
      UPDATE public.platform_fee_configurations
      SET effective_until = ${now}, is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE category = ${validated.category} AND is_active = true AND effective_from <= ${now};
    `;

    // 2. Tambah baris baru (append-only)
    await prisma.$executeRaw`
      INSERT INTO public.platform_fee_configurations (
        name, category, fee_percent, fee_type, fee_bearer, description, effective_from, is_active
      ) VALUES (
        ${validated.name.trim()},
        ${validated.category},
        ${validated.fee_percent},
        ${validated.fee_type},
        ${validated.fee_bearer},
        ${validated.description?.trim() || null},
        ${now},
        true
      );
    `;

    revalidatePath('/admin/master/fees');
    revalidatePath('/admin/finances');
    return { success: true };
  } catch (error: any) {
    console.error('createNewFeeConfiguration error:', error);
    return { success: false, error: error.message || 'Gagal menambahkan konfigurasi fee baru' };
  }
}

