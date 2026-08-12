/// <reference types="vite/client" />

/**
 * Returns the fully qualified API URL for backend endpoint requests.
 * When running inside a native Capacitor shell (iOS/Android), relative requests
 * like `/api/auth/login` resolve to `capacitor://localhost/api/auth/login` which hits
 * the local webview static bundle instead of the remote server.
 * This helper resolves those endpoints to the actual backend server (e.g. https://gonnng.com/api/auth/login).
 */
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
