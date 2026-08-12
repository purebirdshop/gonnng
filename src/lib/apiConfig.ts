/// <reference types="vite/client" />

export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // Check if running inside native Capacitor container
  const isCapacitorNative = typeof window !== 'undefined' && (
    window.location.protocol === 'capacitor:' ||
    Boolean((window as any).Capacitor?.isNativePlatform?.()) ||
    Boolean((window as any).Capacitor)
  );

  const configuredUrl = (import.meta.env.VITE_APP_URL || import.meta.env.VITE_API_BASE_URL || '').trim();

  if (isCapacitorNative) {
    const baseUrl = configuredUrl ? configuredUrl.replace(/\/+$/, '') : 'https://gonnng.com';
    return `${baseUrl}${cleanPath}`;
  }

  return cleanPath;
}

/**
 * Resolves an image/media URL (avatar, post media, recipe cover, etc.) to an absolute URL
 * when running on native Capacitor or when a relative path is provided.
 */
export function resolveImageUrl(url: string | undefined | null): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }
  return getApiUrl(trimmed);
}
