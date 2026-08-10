import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Supabase client (server-side, trusted). Use the SERVICE ROLE key here if available,
// or fallback to ANON key.
// Never throw if environment variables are missing -- fallback gracefully.
// ---------------------------------------------------------------------------
export function normalizeDataUrl(url?: string): string {
  if (!url) return '';
  let cleaned = url.trim().replace(/\/+$/, '');
  cleaned = cleaned.replace('.storage.supabase.co', '.supabase.co');
  cleaned = cleaned.replace(/\/storage\/v1.*$/, '');
  return cleaned;
}

export function normalizeStorageUrl(url?: string): string {
  if (!url) return '';
  let cleaned = url.trim().replace(/\/+$/, '');
  cleaned = cleaned.replace(/\/storage\/v1.*$/, '');
  return cleaned;
}

export function formatMediaUrl(storagePath: string | null | undefined): string | null {
  if (!storagePath) return null;
  let clean = storagePath.trim();
  clean = clean.replace(/^\/+/, '');
  while (clean.startsWith('media/')) {
    clean = clean.substring(6).replace(/^\/+/, '');
  }
  return `/media/${clean}`;
}

const rawDataUrl = process.env.SUPABASE_DATA_URL || process.env.SUPABASE_URL || '';
const supabaseUrl = normalizeDataUrl(rawDataUrl);
const rawStorageUrl = process.env.SUPABASE_STORAGE_URL || process.env.SUPABASE_DATA_URL || process.env.SUPABASE_URL || '';
export const storageUrl = normalizeStorageUrl(rawStorageUrl);
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;
