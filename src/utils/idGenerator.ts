// Base62 Character set for Public Identifiers (FR-008)
const BASE62_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/**
 * Generates a random Base62 string of requested length (FR-008, FR-010).
 * Default length is 9 characters (e.g., "F93LmQa8Y").
 */
export function generateBase62PublicId(length = 9): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * BASE62_CHARS.length);
    result += BASE62_CHARS[randomIndex];
  }
  return result;
}

/**
 * Generates a collision-free Public ID given an array/set of existing IDs (FR-009).
 */
export function generateUniquePublicId(existingIds?: Set<string> | string[], length = 9): string {
  const existingSet = existingIds instanceof Set ? existingIds : new Set(existingIds || []);
  let candidate = generateBase62PublicId(length);
  let attempts = 0;
  while (existingSet.has(candidate) && attempts < 100) {
    candidate = generateBase62PublicId(length);
    attempts++;
  }
  return candidate;
}

/**
 * Generates a unique Internal System ID (FR-001).
 * Never shown in user interface or public URLs.
 */
export function generateInternalId(prefix = 'sys'): string {
  const randomHex = Math.random().toString(36).substring(2, 10);
  return `${prefix}_int_${Date.now().toString(36)}_${randomHex}`;
}

/**
 * Formats resource URL according to FR-003 Public URL Structure.
 * User Profiles: /u/{username}
 * Projects: /project/{projectId}
 * Recipes: /recipe/{recipeId}
 * Posts: /p/{postId}
 */
export function formatResourceUrl(
  type: 'user' | 'project' | 'recipe' | 'post',
  identifier: string
): string {
  const cleanId = encodeURIComponent(identifier.trim().replace(/^@/, ''));
  switch (type) {
    case 'user':
      return `/u/${cleanId}`;
    case 'project':
      return `/project/${cleanId}`;
    case 'recipe':
      return `/recipe/${cleanId}`;
    case 'post':
      return `/p/${cleanId}`;
    default:
      return `/${cleanId}`;
  }
}

/**
 * Formats full human-readable shareable link.
 */
export function formatShareableLink(
  type: 'user' | 'project' | 'recipe' | 'post',
  identifier: string
): string {
  return `gonnng.com${formatResourceUrl(type, identifier)}`;
}
