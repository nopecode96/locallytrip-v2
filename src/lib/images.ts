/**
 * Centralized Image Resolution Utility for Locallytrip
 *
 * Resolves images consistently from /public/images/[category]/...
 * Supports:
 * - Direct absolute URLs (http://, https://, data:, blob:)
 * - Public asset paths (/images/...)
 * - Clean relative filenames (e.g. 'bali-yoga.jpg' -> '/images/experiences/bali-yoga.jpg')
 * - Category aliases (users -> avatars, stories, meetups, forums, etc.)
 * - Category-specific default placeholders
 * - Unsplash travel placeholders as secondary fallback
 * - Absolute URL prepending with NEXT_PUBLIC_APP_URL for emails/external consumers
 */

export type ImageCategory =
  | 'experiences'
  | 'users'
  | 'avatars'
  | 'stories'
  | 'banners'
  | 'badges'
  | 'kyc'
  | 'advertisement'
  | 'meetups'
  | 'forums'
  | 'cities'
  | 'categories'
  | 'rewards'
  | 'banks'
  | 'apps'
  | 'destinations'
  | 'reviews'
  | 'promotions'
  | 'testimonials'
  | 'placeholders'
  | (string & {});

export interface ImageUrlOptions {
  /** If true, returns an absolute URL with process.env.NEXT_PUBLIC_APP_URL */
  absolute?: boolean;
  /** Custom fallback URL if imagePath is empty or invalid */
  fallbackUrl?: string;
  /** Whether to use online Unsplash travel placeholder fallback instead of local file */
  useUnsplashFallback?: boolean;
}

export const DEFAULT_PLACEHOLDERS: Record<string, string> = {
  experiences: '/images/placeholder-experience.jpg',
  users: '/images/default-avatar.png',
  avatars: '/images/default-avatar.png',
  stories: '/images/default-story-cover.jpg',
  meetups: '/images/default-meetup-cover.jpg',
  forums: '/images/default-forum-cover.jpg',
  cities: '/images/placeholders/city-default.jpg',
  banners: '/images/hero-experiences.png',
  badges: '/images/placeholder.jpg',
  kyc: '/images/placeholder.jpg',
  advertisement: '/images/placeholder.jpg',
  rewards: '/images/placeholder.jpg',
  banks: '/images/placeholder.jpg',
  apps: '/images/placeholder.jpg',
  destinations: '/images/placeholder.jpg',
  reviews: '/images/default-avatar.png',
  default: '/images/placeholder.jpg',
};

export const UNSPLASH_PLACEHOLDERS: Record<string, string> = {
  experiences:
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80',
  stories:
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
  meetups:
    'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=80',
  users:
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  avatars:
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  default:
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80',
};

const KNOWN_DIRECTORIES = new Set([
  'advertisement',
  'apps',
  'avatars',
  'badges',
  'banks',
  'banners',
  'become',
  'categories',
  'cities',
  'communication-apps',
  'destinations',
  'experiences',
  'explore',
  'forums',
  'hero',
  'kyc',
  'meetups',
  'placeholders',
  'promotions',
  'reviews',
  'rewards',
  'stories',
  'testimonials',
  'users',
]);

/**
 * Extracts a raw single image string from any input (string, JSON string, array, or object)
 */
export function extractSingleImage(input: any): string | null {
  if (input === null || input === undefined) return null;
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return extractSingleImage(parsed[0]);
        }
      } catch {
        // Not valid JSON array, treat as regular string
      }
    }
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        return extractSingleImage(parsed);
      } catch {
        // Not valid JSON object, treat as regular string
      }
    }
    return trimmed;
  }
  if (Array.isArray(input)) {
    if (input.length === 0) return null;
    return extractSingleImage(input[0]);
  }
  if (typeof input === 'object') {
    const candidate =
      input.url ||
      input.src ||
      input.file_path ||
      input.filePath ||
      input.image_url ||
      input.imageUrl ||
      input.avatar_url ||
      input.avatarUrl ||
      input.avatar ||
      input.image ||
      input.cover_image ||
      input.coverImage;
    if (candidate) return extractSingleImage(candidate);
  }
  return null;
}

/**
 * Extracts an array of image strings from any input (string, JSON string, array, or object)
 */
export function extractImageArray(input: any): string[] {
  if (input === null || input === undefined) return [];
  if (Array.isArray(input)) {
    return input
      .map((item) => extractSingleImage(item))
      .filter((img): img is string => typeof img === 'string' && img.length > 0);
  }
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return extractImageArray(parsed);
        }
      } catch {
        // Not JSON, return as single string
      }
    }
    if (trimmed.includes(',')) {
      return trimmed
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [trimmed];
  }
  const single = extractSingleImage(input);
  return single ? [single] : [];
}

/**
 * Single centralized image path utility function.
 * Normalizes any image path or filename to a consistent /images/[category]/... URL.
 */
export function getPublicImageUrl(
  imagePath?: string | null | any,
  category: ImageCategory = 'experiences',
  options?: ImageUrlOptions
): string {
  const raw = extractSingleImage(imagePath);

  // 1. Fallback if empty or null
  if (!raw || typeof raw !== 'string' || !raw.trim()) {
    if (options?.fallbackUrl) return options.fallbackUrl;
    if (options?.useUnsplashFallback) {
      return UNSPLASH_PLACEHOLDERS[category] || UNSPLASH_PLACEHOLDERS.default;
    }
    const defaultPlaceholder = DEFAULT_PLACEHOLDERS[category] || DEFAULT_PLACEHOLDERS.default;
    return applyAbsoluteOption(defaultPlaceholder, options);
  }

  const clean = raw.trim();

  // 2. Direct absolute URLs or self-contained data/blob schemes
  if (
    clean.startsWith('http://') ||
    clean.startsWith('https://') ||
    clean.startsWith('data:') ||
    clean.startsWith('blob:')
  ) {
    return clean;
  }

  let resolvedPath = '';

  // 3. User Avatar normalization (avatars reside in /images/avatars/ or /images/users/avatars/)
  if (category === 'users' || category === 'avatars') {
    if (
      clean === 'default-avatar.png' ||
      clean === 'default-avatar.jpg' ||
      clean === 'default.jpg' ||
      clean === 'placeholders/avatar-default.png' ||
      clean === '/images/default-avatar.png' ||
      clean === '/images/default-avatar.jpg'
    ) {
      resolvedPath = '/images/default-avatar.png';
    } else if (clean.startsWith('/images/avatars/') || clean.startsWith('/images/users/avatars/')) {
      resolvedPath = clean;
    } else if (clean.startsWith('/images/')) {
      resolvedPath = clean;
    } else {
      const stripped = clean.replace(/^\/+/, '');
      if (stripped.startsWith('images/')) {
        resolvedPath = `/${stripped}`;
      } else if (stripped.startsWith('avatars/')) {
        resolvedPath = `/images/${stripped}`;
      } else if (stripped.startsWith('users/avatars/')) {
        resolvedPath = `/images/${stripped}`;
      } else {
        resolvedPath = `/images/avatars/${stripped}`;
      }
    }
    return applyAbsoluteOption(resolvedPath, options);
  }

  // 4. If path already starts with /images/
  if (clean.startsWith('/images/')) {
    // Normalize any accidental double slashes
    resolvedPath = clean.replace(/\/+/g, '/');
    return applyAbsoluteOption(resolvedPath, options);
  }

  // 5. If path starts with images/ (without leading slash)
  if (clean.startsWith('images/')) {
    resolvedPath = `/${clean}`.replace(/\/+/g, '/');
    return applyAbsoluteOption(resolvedPath, options);
  }

  // 6. If path starts with leading slash
  if (clean.startsWith('/')) {
    const withoutSlash = clean.slice(1);
    const firstSegment = withoutSlash.split('/')[0];
    if (KNOWN_DIRECTORIES.has(firstSegment)) {
      resolvedPath = `/images/${withoutSlash}`;
    } else {
      // Relative file with leading slash (e.g. /bali.jpg)
      resolvedPath = `/images/${category}/${withoutSlash}`;
    }
    return applyAbsoluteOption(resolvedPath, options);
  }

  // 7. Relative path or clean filename (e.g. 'bali-yoga.jpg' or 'experiences/bali.jpg')
  const cleanRelative = clean.replace(/^\/+/, '');
  const firstSegment = cleanRelative.split('/')[0];

  if (KNOWN_DIRECTORIES.has(firstSegment)) {
    resolvedPath = `/images/${cleanRelative}`;
  } else {
    resolvedPath = `/images/${category}/${cleanRelative}`;
  }

  return applyAbsoluteOption(resolvedPath, options);
}

/**
 * Normalizes an array of image paths/filenames to an array of valid public image URLs
 */
export function getPublicImageUrls(
  images?: any,
  category: ImageCategory = 'experiences',
  options?: ImageUrlOptions
): string[] {
  const rawList = extractImageArray(images);
  if (rawList.length === 0) {
    const fallback = getPublicImageUrl(null, category, options);
    return [fallback];
  }
  return rawList.map((item) => getPublicImageUrl(item, category, options));
}

/**
 * Internal helper to prepend NEXT_PUBLIC_APP_URL when absolute option is requested
 */
function applyAbsoluteOption(path: string, options?: ImageUrlOptions): string {
  if (!options?.absolute) return path;
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/+$/, '');
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
}

// Category-specific convenience aliases
export const resolveExperienceImageUrl = (path?: string | null | any, options?: ImageUrlOptions) =>
  getPublicImageUrl(path, 'experiences', options);

export const resolveUserAvatarUrl = (path?: string | null | any, options?: ImageUrlOptions) =>
  getPublicImageUrl(path, 'users', options);

export const resolveStoryImageUrl = (path?: string | null | any, options?: ImageUrlOptions) =>
  getPublicImageUrl(path, 'stories', options);

export const resolveMeetupImageUrl = (path?: string | null | any, options?: ImageUrlOptions) =>
  getPublicImageUrl(path, 'meetups', options);

export const resolveForumImageUrl = (path?: string | null | any, options?: ImageUrlOptions) =>
  getPublicImageUrl(path, 'forums', options);

export const resolveKycImageUrl = (path?: string | null | any, options?: ImageUrlOptions) =>
  getPublicImageUrl(path, 'kyc', options);

export const resolveBannerImageUrl = (path?: string | null | any, options?: ImageUrlOptions) =>
  getPublicImageUrl(path, 'banners', options);

export const resolveBadgeImageUrl = (path?: string | null | any, options?: ImageUrlOptions) =>
  getPublicImageUrl(path, 'badges', options);

export const resolveCityImageUrl = (path?: string | null | any, options?: ImageUrlOptions) =>
  getPublicImageUrl(path, 'cities', options);
