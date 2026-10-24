/**
 * Helper terpusat untuk meresolusi URL Gambar secara aman dan lengkap
 * Powered by centralized getPublicImageUrl from '@/lib/images'
 */
import {
  getPublicImageUrl,
  extractSingleImage,
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

/**
 * Strict 3-level fallback hierarchy for Meetup cover images:
 * 1. User-uploaded image from meetup record (image, coverImage, photo, images array/JSON)
 * 2. City's representative image (city.image, city.coverImage, city.image_url)
 * 3. Default clean placeholder (/images/default-meetup-cover.jpg)
 */
export function resolveMeetupDisplayImage(
  meetupOrImage?: string | string[] | any,
  cityImageUrl?: string | null | any
): string {
  let candidateMeetupImage = meetupOrImage;
  let candidateCityImage = cityImageUrl;

  // Handle entire meetup object being passed as first argument
  if (
    meetupOrImage &&
    typeof meetupOrImage === 'object' &&
    !Array.isArray(meetupOrImage)
  ) {
    if (
      'title' in meetupOrImage ||
      'city' in meetupOrImage ||
      'cities' in meetupOrImage ||
      'coverImage' in meetupOrImage ||
      'image' in meetupOrImage ||
      'bannerImage' in meetupOrImage
    ) {
      candidateMeetupImage =
        meetupOrImage.image ||
        meetupOrImage.coverImage ||
        meetupOrImage.cover_image ||
        meetupOrImage.photo ||
        meetupOrImage.bannerImage ||
        meetupOrImage.images;

      if (!candidateCityImage) {
        candidateCityImage =
          meetupOrImage.city?.image ||
          meetupOrImage.city?.coverImage ||
          meetupOrImage.city?.image_url ||
          meetupOrImage.cities?.image ||
          meetupOrImage.cities?.coverImage ||
          meetupOrImage.cities?.image_url;
      }
    }
  }

  // 1. Check if meetup has a user-uploaded image
  const rawMeetupImg = extractSingleImage(candidateMeetupImage);
  if (rawMeetupImg && typeof rawMeetupImg === 'string') {
    const cleanMeetup = rawMeetupImg.trim();
    if (
      cleanMeetup &&
      cleanMeetup !== '[]' &&
      cleanMeetup !== '{}' &&
      !cleanMeetup.includes('placeholder') &&
      !cleanMeetup.includes('default-meetup-cover')
    ) {
      return getPublicImageUrl(cleanMeetup, 'meetups');
    }
  }

  // 2. Fallback to the city's representative image
  const rawCityImg = extractSingleImage(candidateCityImage);
  if (rawCityImg && typeof rawCityImg === 'string') {
    const cleanCity = rawCityImg.trim();
    if (
      cleanCity &&
      cleanCity !== '[]' &&
      cleanCity !== '{}' &&
      !cleanCity.includes('placeholder')
    ) {
      return getPublicImageUrl(cleanCity, 'cities');
    }
  }

  // 3. Fallback to clean default placeholder
  return '/images/default-meetup-cover.jpg';
}

// Aliases for compatibility
export const resolveStoryImageUrl = resolveStoryImage;
export const resolveMeetupImageUrl = resolveMeetupImage;
export const resolveExperienceImageUrl = resolveExperienceImage;
