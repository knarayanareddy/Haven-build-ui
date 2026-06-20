import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Export the generated Database type for convenience
export type { Database };

/**
 * Creates a strongly-typed Supabase client using the generated Database types.
 * 
 * @param supabaseUrl The URL of the Supabase project
 * @param supabaseAnonKey The anon key of the Supabase project
 * @param options Optional options to pass to the createClient function
 * @returns A strongly-typed Supabase client
 */
export function createHavenClient(
  supabaseUrl: string,
  supabaseAnonKey: string,
  options?: Parameters<typeof createClient>[2]
): SupabaseClient<Database> {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, options);
}

/**
 * Creates an admin client (service role) to bypass RLS.
 * **DANGER**: Use only in server-side edge environments!
 * 
 * @param supabaseUrl The URL of the Supabase project
 * @param supabaseServiceRoleKey The service role key of the Supabase project
 * @param options Optional options
 * @returns A strongly-typed Supabase admin client
 */
export function createHavenAdminClient(
  supabaseUrl: string,
  supabaseServiceRoleKey: string,
  options?: Parameters<typeof createClient>[2]
): SupabaseClient<Database> {
  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    ...options,
  });
}
