import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/types/database";

let clientInstance: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (typeof window !== "undefined" && clientInstance) {
    return clientInstance;
  }

  const client = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookieOptions: {
      maxAge: 60 * 60 * 24 * 365, // 1 year cookie persistence across browser restarts
      path: "/",
      sameSite: "lax",
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  if (typeof window !== "undefined") {
    clientInstance = client;
  }

  return client;
}
