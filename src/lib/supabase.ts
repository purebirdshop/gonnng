/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';

function normalizeDataUrl(url?: string): string {
  if (!url) return '';
  let cleaned = url.trim().replace(/\/+$/, '');
  cleaned = cleaned.replace('.storage.supabase.co', '.supabase.co');
  cleaned = cleaned.replace(/\/storage\/v1.*$/, '');
  return cleaned;
}

const rawDataUrl = process.env.SUPABASE_DATA_URL || process.env.SUPABASE_URL || (import.meta.env ? import.meta.env.VITE_SUPABASE_URL : '') || '';
const supabaseUrl = normalizeDataUrl(rawDataUrl);
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || (import.meta.env ? import.meta.env.VITE_SUPABASE_ANON_KEY : '') || '';
const enableSupabase = process.env.VITE_ENABLE_SUPABASE !== 'false' && (import.meta.env ? import.meta.env.VITE_ENABLE_SUPABASE !== 'false' : true);

export const isSupabaseConfigured = (): boolean => {
  return enableSupabase && Boolean(supabaseUrl) && Boolean(supabaseAnonKey);
};

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

