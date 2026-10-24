/**
 * Helper terpusat untuk meresolusi URL Avatar pengguna
 * Powered by centralized getPublicImageUrl from '@/lib/images'
 */
import { getPublicImageUrl } from '@/lib/images';

export function resolveAvatarUrl(avatarOrUser: any): string {
  if (!avatarOrUser) return '/images/default-avatar.png';

  const raw =
    typeof avatarOrUser === 'string'
      ? avatarOrUser
      : avatarOrUser?.avatar_url ||
        avatarOrUser?.image ||
        avatarOrUser?.avatar ||
        avatarOrUser?.avatarUrl;

  return getPublicImageUrl(raw, 'users');
}
