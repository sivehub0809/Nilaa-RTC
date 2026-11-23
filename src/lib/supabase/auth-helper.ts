import { createClient } from "@/lib/supabase/client";
import { type User as SupabaseUser, type Session as SupabaseSession } from "@supabase/supabase-js";

const SESSION_BACKUP_KEY = "nilaa_session_backup";

/**
 * Robustly restore the current Supabase session.
 * 1. Checks getSession()
 * 2. If null, attempts to restore using backup refresh_token in localStorage
 * 3. Falls back to getUser()
 */
export async function getOrRestoreSession(): Promise<{ user: SupabaseUser | null; session: SupabaseSession | null }> {
  if (typeof window === "undefined") {
    return { user: null, session: null };
  }

  const supabase = createClient();

  try {
    // 1. Check live active session
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      persistSessionBackup(session);
      return { user: session.user, session };
    }

    // 2. Check localStorage backup if cookies were purged on browser close
    const backupRaw = localStorage.getItem(SESSION_BACKUP_KEY);
    if (backupRaw) {
      try {
        const backup = JSON.parse(backupRaw);
        if (backup?.refresh_token) {
          const { data, error } = await supabase.auth.setSession({
            access_token: backup.access_token || "",
            refresh_token: backup.refresh_token,
          });
          if (data?.session?.user) {
            persistSessionBackup(data.session);
            return { user: data.session.user, session: data.session };
          }
        }
      } catch (err) {
        console.warn("Failed to restore session from backup:", err);
      }
    }

    // 3. Fallback to getUser()
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) {
      return { user: userData.user, session: null };
    }
  } catch (err) {
    console.warn("Session restoration error:", err);
  }

  return { user: null, session: null };
}

export function persistSessionBackup(session: SupabaseSession | null) {
  if (typeof window === "undefined") return;
  try {
    if (session) {
      localStorage.setItem(
        SESSION_BACKUP_KEY,
        JSON.stringify({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
          user: session.user,
        })
      );
    } else {
      localStorage.removeItem(SESSION_BACKUP_KEY);
    }
  } catch {}
}

export function clearSessionBackup() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(SESSION_BACKUP_KEY);
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("nilaa_auth_chunk_") || key.startsWith("sb-"))) {
        localStorage.removeItem(key);
      }
    }
  } catch {}
}
