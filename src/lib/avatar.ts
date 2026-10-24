/**
 * Helper terpusat untuk meresolusi URL Avatar pengguna
 * Powered by centralized getPublicImageUrl from '@/lib/images'
 */
import { getPublicImageUrl } from '@/lib/images';

export const DEFAULT_AVATAR_FALLBACK = '/images/default-avatar.png';

export function resolveAvatarUrl(avatarOrUser: any): string {
  if (!avatarOrUser) return DEFAULT_AVATAR_FALLBACK;

  let raw: any = null;

  if (typeof avatarOrUser === 'string') {
    raw = avatarOrUser;
  } else if (typeof avatarOrUser === 'object') {
    raw =
      avatarOrUser.avatar_url ||
      avatarOrUser.avatarUrl ||
      avatarOrUser.image ||
      avatarOrUser.avatar ||
      avatarOrUser.profileImage ||
      avatarOrUser.profile_image ||
      avatarOrUser.photo ||
      avatarOrUser.picture ||
      avatarOrUser.user?.avatar_url ||
      avatarOrUser.user?.avatarUrl ||
      avatarOrUser.user?.image ||
      avatarOrUser.user?.avatar ||
      avatarOrUser.creator?.avatar_url ||
      avatarOrUser.creator?.image ||
      avatarOrUser.author?.avatar_url ||
      avatarOrUser.author?.image ||
      avatarOrUser.host?.avatar_url ||
      avatarOrUser.host?.image;
  }

  if (
    !raw ||
    typeof raw !== 'string' ||
    !raw.trim() ||
    raw.trim() === 'null' ||
    raw.trim() === 'undefined' ||
    raw.trim() === 'NaN'
  ) {
    return DEFAULT_AVATAR_FALLBACK;
  }

  const resolved = getPublicImageUrl(raw.trim(), 'users');
  return resolved || DEFAULT_AVATAR_FALLBACK;
}
