'use server';

import prisma from '@/lib/prisma';
import { enum_experiences_status } from '@prisma/client';
import { getPublicImageUrl, getPublicImageUrls } from '@/lib/images';

export interface ExperienceItem {
  id: number;
  uuid: string | null;
  title: string;
  title_id: string | null;
  title_en: string | null;
  slug: string | null;
  shortDescription: string | null;
  packagePrice: number | null;
  currency: string | null;
  durationHours: number | null;
  maxParticipants: number | null;
  difficultyLevel: string | null;
  ratingAverage: number;
  ratingCount: number;
  city: {
    id: number;
    name: string;
  } | null;
  host: {
    id: number;
    name: string | null;
    username: string | null;
    avatarUrl: string | null;
    isVerified: boolean | null;
    level?: number;
  } | null;
  images: string[];
}

export interface ReviewItem {
  id: number;
  rating: number;
  title: string | null;
  comment: string | null;
  images: string[];
  hostResponse: string | null;
  hostRespondedAt: Date | null;
  isVerified: boolean | null;
  createdAt: Date;
  user: {
    id: number;
    name: string | null;
    username: string | null;
    avatarUrl: string | null;
  };
}

export interface ExperienceDetail extends ExperienceItem {
  description: string;
  description_id: string | null;
  description_en: string | null;
  meetingPoint: string | null;
  latitude: number | null;
  longitude: number | null;
  category: {
    id: number;
    name: string;
  } | null;
  experienceType: {
    id: number;
    name: string;
  } | null;
  whatToExpect: string[];
  includedItems: string[];
  excludedItems: string[];
  deliverables: string[];
  equipmentUsed: string[];
  languages: string[];
  requirementsList: string[];
  requirements: {
    requiresPassport: boolean;
    requiresNationality: boolean;
    requiresEmergencyContact: boolean;
    passportRequirementReason: string | null;
    fitnessLevel: string | null;
    walkingDistanceKm: number | null;
  };
  hostDetails: {
    bio: string | null;
    followersCount: number;
    followingCount: number;
    isTrusted: boolean | null;
    createdAt: Date | null;
  } | null;
  reviews: ReviewItem[];
  relatedExperiences: ExperienceItem[];
}

export interface GetExperiencesParams {
  search?: string;
  cityId?: number;
  category?: string;
  limit?: number;
  offset?: number;
}

function parseJsonArray(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input.filter((item): item is string => typeof item === 'string');
  }
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string');
      }
    } catch {
      return [input];
    }
  }
  return [];
}

export async function getActiveExperiences(
  params: GetExperiencesParams = {}
): Promise<{ success: boolean; data: ExperienceItem[]; total: number; error?: string }> {
  try {
    const { search, cityId, category, limit = 12, offset = 0 } = params;

    const whereClause: any = {
      is_active: true,
      status: enum_experiences_status.published,
    };

    if (search && search.trim() !== '') {
      whereClause.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { title_id: { contains: search.trim(), mode: 'insensitive' } },
        { title_en: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
        { short_description: { contains: search.trim(), mode: 'insensitive' } },
        { cities: { name: { contains: search.trim(), mode: 'insensitive' } } },
      ];
    }

    if (cityId) {
      whereClause.city_id = cityId;
    }

    if (category && category.trim() !== '') {
      whereClause.OR = [
        ...(whereClause.OR || []),
        { host_categories: { name: { contains: category.trim(), mode: 'insensitive' } } },
        { experience_types: { name: { contains: category.trim(), mode: 'insensitive' } } },
        { title: { contains: category.trim(), mode: 'insensitive' } },
        { description: { contains: category.trim(), mode: 'insensitive' } },
      ];
    }

    const [experiences, total] = await Promise.all([
      prisma.experiences.findMany({
        where: whereClause,
        take: limit,
        skip: offset,
        orderBy: [
          { is_featured: 'desc' },
          { rating_average: 'desc' },
          { created_at: 'desc' },
        ],
        select: {
          id: true,
          uuid: true,
          title: true,
          title_id: true,
          title_en: true,
          slug: true,
          short_description: true,
          package_price: true,
          currency: true,
          duration_hours: true,
          max_participants: true,
          difficulty_level: true,
          rating_average: true,
          rating_count: true,
          images: true,
          cities: {
            select: {
              id: true,
              name: true,
            },
          },
          users: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar_url: true,
              is_verified: true,
              user_xp: {
                select: {
                  current_level: true,
                  total_xp: true,
                },
              },
            },
          },
        },
      }),
      prisma.experiences.count({ where: whereClause }),
    ]);

    const formattedData: ExperienceItem[] = experiences.map((exp) => ({
      id: exp.id,
      uuid: exp.uuid,
      title: exp.title,
      title_id: exp.title_id,
      title_en: exp.title_en,
      slug: exp.slug,
      shortDescription: exp.short_description,
      packagePrice: exp.package_price ? Number(exp.package_price) : null,
      currency: exp.currency || 'USD',
      durationHours: exp.duration_hours,
      maxParticipants: exp.max_participants,
      difficultyLevel: exp.difficulty_level,
      ratingAverage: exp.rating_average ? Number(exp.rating_average) : 0,
      ratingCount: exp.rating_count ?? 0,
      city: exp.cities ? { id: exp.cities.id, name: exp.cities.name } : null,
      host: exp.users
        ? {
            id: exp.users.id,
            name: exp.users.name,
            username: exp.users.username,
            avatarUrl: getPublicImageUrl(exp.users.avatar_url, 'users'),
            isVerified: exp.users.is_verified,
            level: (exp.users as any).user_xp?.current_level || 1,
          }
        : null,
      images: getPublicImageUrls(exp.images, 'experiences'),
    }));

    return {
      success: true,
      data: formattedData,
      total,
    };
  } catch (error) {
    console.error('Error fetching active experiences:', error);
    return {
      success: false,
      data: [],
      total: 0,
      error: error instanceof Error ? error.message : 'Database error',
    };
  }
}

export async function getExperienceBySlug(
  slugOrId: string
): Promise<{ success: boolean; data: ExperienceDetail | null; error?: string }> {
  try {
    const isId = /^\d+$/.test(slugOrId);
    const numericId = isId ? parseInt(slugOrId, 10) : undefined;

    const exp = await prisma.experiences.findFirst({
      where: {
        OR: [
          ...(numericId ? [{ id: numericId }] : []),
          { slug: slugOrId },
        ],
        is_active: true,
        status: enum_experiences_status.published,
      },
      include: {
        cities: true,
        host_categories: true,
        experience_types: true,
        users: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar_url: true,
            bio: true,
            is_verified: true,
            is_trusted: true,
            followers_count: true,
            following_count: true,
            created_at: true,
          },
        },
        reviews: {
          where: { is_verified: true },
          orderBy: { created_at: 'desc' },
          take: 10,
          include: {
            users: {
              select: {
                id: true,
                name: true,
                username: true,
                avatar_url: true,
              },
            },
          },
        },
      },
    });

    if (!exp) {
      return { success: false, data: null, error: 'Experience not found' };
    }

    // Ambil aktivitas terkait di kota yang sama
    const related = await prisma.experiences.findMany({
      where: {
        city_id: exp.city_id,
        id: { not: exp.id },
        is_active: true,
        status: enum_experiences_status.published,
      },
      take: 4,
      orderBy: { rating_average: 'desc' },
      select: {
        id: true,
        uuid: true,
        title: true,
        title_id: true,
        title_en: true,
        slug: true,
        short_description: true,
        package_price: true,
        currency: true,
        duration_hours: true,
        max_participants: true,
        difficulty_level: true,
        rating_average: true,
        rating_count: true,
        images: true,
        cities: { select: { id: true, name: true } },
        users: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar_url: true,
            is_verified: true,
          },
        },
      },
    });

    // Parse bahasa yang dikuasai dari host_specific_data
    let languages: string[] = ['English', 'Indonesian'];
    if (exp.host_specific_data && typeof exp.host_specific_data === 'object') {
      const data = exp.host_specific_data as Record<string, unknown>;
      if (Array.isArray(data.languages)) {
        languages = data.languages.map((l) => String(l));
      }
    }

    const detail: ExperienceDetail = {
      id: exp.id,
      uuid: exp.uuid,
      slug: exp.slug,
      title: exp.title,
      title_id: exp.title_id,
      title_en: exp.title_en,
      description: exp.description,
      description_id: exp.description_id,
      description_en: exp.description_en,
      shortDescription: exp.short_description,
      packagePrice: exp.package_price ? Number(exp.package_price) : null,
      currency: exp.currency || 'USD',
      durationHours: exp.duration_hours,
      maxParticipants: exp.max_participants,
      difficultyLevel: exp.difficulty_level,
      ratingAverage: exp.rating_average ? Number(exp.rating_average) : 0,
      ratingCount: exp.rating_count ?? 0,
      meetingPoint: exp.meeting_point,
      latitude: exp.latitude ? Number(exp.latitude) : null,
      longitude: exp.longitude ? Number(exp.longitude) : null,
      city: exp.cities ? { id: exp.cities.id, name: exp.cities.name } : null,
      category: exp.host_categories
        ? { id: exp.host_categories.id, name: exp.host_categories.name }
        : null,
      experienceType: exp.experience_types
        ? { id: exp.experience_types.id, name: exp.experience_types.name }
        : null,
      host: exp.users
        ? {
            id: exp.users.id,
            name: exp.users.name,
            username: exp.users.username,
            avatarUrl: getPublicImageUrl(exp.users.avatar_url, 'users'),
            isVerified: exp.users.is_verified,
            level: (exp.users as any).user_xp?.current_level || 1,
          }
        : null,
      hostDetails: exp.users
        ? {
            bio: exp.users.bio,
            followersCount: exp.users.followers_count ?? 0,
            followingCount: exp.users.following_count ?? 0,
            isTrusted: exp.users.is_trusted,
            createdAt: exp.users.created_at,
          }
        : null,
      images: getPublicImageUrls(exp.images, 'experiences'),
      whatToExpect: parseJsonArray(exp.what_to_expect).length > 0
        ? parseJsonArray(exp.what_to_expect)
        : parseJsonArray(exp.deliverables),
      includedItems: parseJsonArray(exp.included_items),
      excludedItems: parseJsonArray(exp.excluded_items),
      deliverables: parseJsonArray(exp.deliverables),
      equipmentUsed: parseJsonArray(exp.equipment_used),
      languages,
      requirementsList: parseJsonArray(exp.requirements),
      requirements: {
        requiresPassport: exp.requires_passport,
        requiresNationality: exp.requires_nationality,
        requiresEmergencyContact: exp.requires_emergency_contact,
        passportRequirementReason: exp.passport_requirement_reason,
        fitnessLevel: exp.fitness_level,
        walkingDistanceKm: exp.walking_distance_km
          ? Number(exp.walking_distance_km)
          : null,
      },
      reviews: exp.reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        images: getPublicImageUrls(r.images, 'experiences'),
        hostResponse: r.host_response,
        hostRespondedAt: r.host_responded_at,
        isVerified: r.is_verified,
        createdAt: r.created_at,
        user: {
          id: r.users.id,
          name: r.users.name,
          username: r.users.username,
          avatarUrl: getPublicImageUrl(r.users.avatar_url, 'users'),
        },
      })),
      relatedExperiences: related.map((r) => ({
        id: r.id,
        uuid: r.uuid,
        title: r.title,
        title_id: r.title_id,
        title_en: r.title_en,
        slug: r.slug,
        shortDescription: r.short_description,
        packagePrice: r.package_price ? Number(r.package_price) : null,
        currency: r.currency || 'USD',
        durationHours: r.duration_hours,
        maxParticipants: r.max_participants,
        difficultyLevel: r.difficulty_level,
        ratingAverage: r.rating_average ? Number(r.rating_average) : 0,
        ratingCount: r.rating_count ?? 0,
        city: r.cities ? { id: r.cities.id, name: r.cities.name } : null,
        host: r.users
          ? {
              id: r.users.id,
              name: r.users.name,
              username: r.users.username,
              avatarUrl: getPublicImageUrl(r.users.avatar_url, 'users'),
              isVerified: r.users.is_verified,
              level: (r.users as any).user_xp?.current_level || 1,
            }
          : null,
        images: getPublicImageUrls(r.images, 'experiences'),
      })),
    };

    return {
      success: true,
      data: detail,
    };
  } catch (error) {
    console.error('Error fetching experience detail by slug:', error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Database error',
    };
  }
}
