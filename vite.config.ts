import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const supabaseDataUrl = env.SUPABASE_DATA_URL || env.SUPABASE_URL || env.VITE_SUPABASE_URL || process.env.SUPABASE_DATA_URL || process.env.SUPABASE_URL || '';
  const supabaseStorageUrl = env.SUPABASE_STORAGE_URL || process.env.SUPABASE_STORAGE_URL || '';
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

  return {
    define: {
      'process.env.SUPABASE_DATA_URL': JSON.stringify(supabaseDataUrl),
      'process.env.SUPABASE_STORAGE_URL': JSON.stringify(supabaseStorageUrl),
      'process.env.SUPABASE_URL': JSON.stringify(supabaseDataUrl),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
      'process.env.VITE_ENABLE_SUPABASE': JSON.stringify(env.VITE_ENABLE_SUPABASE || process.env.VITE_ENABLE_SUPABASE || 'true'),
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
