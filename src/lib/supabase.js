import { createClient } from '@supabase/supabase-js';

const url      = import.meta.env.VITE_SUPABASE_URL;
const anonKey  = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isConfigured = Boolean(
  url && anonKey &&
  !url.includes('YOUR-PROJECT') &&
  !anonKey.includes('your-anon')
);

export const supabase = isConfigured
  ? createClient(url, anonKey, { auth: { persistSession: false } })
  : null;
