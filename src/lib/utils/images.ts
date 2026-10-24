/**
 * Helper terpusat untuk meresolusi URL Gambar secara aman dan lengkap
 * Powered by centralized getPublicImageUrl from '@/lib/images'
 */
import {
  getPublicImageUrl,
  resolveExperienceImageUrl as resolveExpImg,
  resolveStoryImageUrl as resolveStoryImg,
  resolveMeetupImageUrl as resolveMeetupImg,
} from '@/lib/images';

export function resolveStoryImage(url?: string | null | any): string {
  return resolveStoryImg(url);
}

export function resolveMeetupImage(url?: string | null | any): string {
  return resolveMeetupImg(url);
}

export function resolveExperienceImage(url?: string | null | any): string {
  return resolveExpImg(url);
}

export function resolveMeetupDisplayImage(
  meetupImages?: string | string[] | any,
  cityImageUrl?: string | null | any
): string {
  if (meetupImages) {
    const resolved = getPublicImageUrl(meetupImages, 'meetups');
    if (resolved && !resolved.includes('placeholder')) {
      return resolved;
    }
  }

  if (cityImageUrl) {
    const resolvedCity = getPublicImageUrl(cityImageUrl, 'cities');
    if (resolvedCity && !resolvedCity.includes('placeholder')) {
      return resolvedCity;
    }
  }

  return getPublicImageUrl(null, 'meetups');
}

// Aliases for compatibility
export const resolveStoryImageUrl = resolveStoryImage;
export const resolveMeetupImageUrl = resolveMeetupImage;
export const resolveExperienceImageUrl = resolveExperienceImage;
