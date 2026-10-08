import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase client configuration
// Gracefully falls back to null if environment variables are not set
// This allows the app to continue using localStorage as a fallback

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.warn('Failed to initialize Supabase client:', error);
    supabase = null;
  }
} else {
  console.info('Supabase environment variables not set. Using localStorage fallback.');
}

export { supabase };
export const isSupabaseEnabled = supabase !== null;
