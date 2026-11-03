import { createClient } from '@supabase/supabase-js'

/**
 * The project URL and publishable key are designed to be public: they only allow
 * what the Row Level Security policies in supabase/schema.sql permit.
 * They can be overridden with VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY.
 * Never put the secret (service_role) key in the app.
 */
const SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL ?? 'https://pnzqtbtrwfsgapnbeerj.supabase.co'
const SUPABASE_PUBLISHABLE_KEY: string =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? 'sb_publishable_wlKPVUaJH92uWsiGO-IMfQ_SSruU1J-'

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
