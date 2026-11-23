import { createBrowserClient } from "@supabase/ssr";
import { parse, serialize } from "cookie";
import { Database } from "@/types/database";

let clientInstance: ReturnType<typeof createBrowserClient<Database>> | null = null;
const AUTH_COOKIE_STORAGE_PREFIX = "nilaa_auth_chunk_";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (typeof window !== "undefined" && clientInstance) {
    return clientInstance;
  }

  const client = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        if (typeof document === "undefined") return [];

        const parsed = parse(document.cookie || "");
        const cookies: { name: string; value: string }[] = Object.keys(parsed).map((name) => ({
          name,
          value: parsed[name] || "",
        }));

        // Secondary persistent fallback: localStorage
        // If the browser purged session cookies on close, restore from localStorage immediately
        if (typeof localStorage !== "undefined") {
          try {
            const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith(AUTH_COOKIE_STORAGE_PREFIX)) {
                const cookieName = key.slice(AUTH_COOKIE_STORAGE_PREFIX.length);
                const cookieValue = localStorage.getItem(key);
                if (cookieValue && !parsed[cookieName]) {
                  // Re-inject missing cookie back into document.cookie with 1-year expires date
                  const expiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
                  document.cookie = serialize(cookieName, cookieValue, {
                    path: "/",
                    sameSite: "lax",
                    secure: isHttps,
                    maxAge: 365 * 24 * 60 * 60,
                    expires: expiryDate,
                  });
                  cookies.push({ name: cookieName, value: cookieValue });
                }
              }
            }
          } catch {}
        }

        return cookies;
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
        if (typeof document === "undefined") return;

        const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";

        cookiesToSet.forEach(({ name, value, options }) => {
          const isDeleting = options?.maxAge === 0 || value === "";
          const expiryDate = isDeleting
            ? new Date(0)
            : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

          // 1. Write to document.cookie with BOTH maxAge, absolute expires date, and secure on https
          document.cookie = serialize(name, value, {
            ...options,
            path: options?.path || "/",
            sameSite: (options?.sameSite as any) || "lax",
            secure: isHttps,
            maxAge: isDeleting ? 0 : 365 * 24 * 60 * 60,
            expires: expiryDate,
          });

          // 2. Synchronize to localStorage backup
          if (typeof localStorage !== "undefined") {
            try {
              const storageKey = AUTH_COOKIE_STORAGE_PREFIX + name;
              if (isDeleting) {
                localStorage.removeItem(storageKey);
              } else {
                localStorage.setItem(storageKey, value);
              }
            } catch {}
          }
        });
      },
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
