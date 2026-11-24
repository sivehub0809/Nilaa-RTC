import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

/**
 * Creates an admin Supabase client using SUPABASE_SERVICE_ROLE_KEY.
 * Bypasses RLS to reliably manage meeting records, active room validation,
 * and room termination regardless of user authentication state.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
