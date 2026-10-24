export { resolveAvatarUrl } from '@/lib/avatar';
export {
  resolveStoryImage,
  resolveMeetupImage,
  resolveExperienceImage,
  resolveMeetupDisplayImage,
} from './images';

import {
  resolveStoryImageUrl as resolveStoryImg,
  resolveExperienceImageUrl as resolveExpImg,
  resolveMeetupImageUrl as resolveMeetupImg,
  resolveForumImageUrl as resolveForumImg,
  getPublicImageUrl,
} from '@/lib/images';

export function resolveStoryImageUrl(filename: string | null | undefined): string {
  return resolveStoryImg(filename);
}

export function resolveExperienceImageUrl(filename: string | null | undefined): string {
  return resolveExpImg(filename);
}

export function resolveMeetupImageUrl(filename: string | null | undefined): string {
  return resolveMeetupImg(filename);
}

export function resolveForumImageUrl(filename: string | null | undefined): string {
  return resolveForumImg(filename);
}

export { getPublicImageUrl };
