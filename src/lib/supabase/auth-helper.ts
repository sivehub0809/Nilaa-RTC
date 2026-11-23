import { createClient } from "@/lib/supabase/client";
import { type User as SupabaseUser, type Session as SupabaseSession } from "@supabase/supabase-js";

const SESSION_BACKUP_KEY = "nilaa_session_backup";
const REFRESH_TOKEN_KEY = "nilaa_refresh_token";
const USER_BACKUP_KEY = "nilaa_user";

/**
 * Robustly restore the current Supabase session across browser closures.
 * 1. Checks live session via getSession()
 * 2. If null, attempts to exchange refresh_token via refreshSession({ refresh_token })
 * 3. Falls back to setSession({ access_token, refresh_token })
 * 4. Falls back to getUser()
 * 5. Falls back to cached user in localStorage
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

    // 2. Extract refresh token from multiple redundant storage keys
    let refreshToken: string | null = null;
    let backupAccessToken: string = "";
    let backupUser: SupabaseUser | null = null;

    try {
      refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      const backupRaw = localStorage.getItem(SESSION_BACKUP_KEY);
      if (backupRaw) {
        const parsed = JSON.parse(backupRaw);
        if (!refreshToken && parsed?.refresh_token) {
          refreshToken = parsed.refresh_token;
        }
        if (parsed?.access_token) {
          backupAccessToken = parsed.access_token;
        }
        if (parsed?.user) {
          backupUser = parsed.user;
        }
      }
    } catch {}

    // 3. If we have a refresh_token, attempt refreshSession
    if (refreshToken) {
      try {
        const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
        if (data?.session?.user) {
          persistSessionBackup(data.session);
          return { user: data.session.user, session: data.session };
        }
      } catch (err) {
        console.warn("refreshSession attempt failed, trying fallback:", err);
      }

      // Fallback: try setSession if access_token is also available
      if (backupAccessToken) {
        try {
          const { data } = await supabase.auth.setSession({
            access_token: backupAccessToken,
            refresh_token: refreshToken,
          });
          if (data?.session?.user) {
            persistSessionBackup(data.session);
            return { user: data.session.user, session: data.session };
          }
        } catch {}
      }
    }

    // 4. Fallback to getUser()
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        return { user: userData.user, session: null };
      }
    } catch {}

    // 5. Fallback to cached user backup
    if (backupUser) {
      return { user: backupUser, session: null };
    }
    const rawUser = localStorage.getItem(USER_BACKUP_KEY);
    if (rawUser) {
      try {
        const parsed = JSON.parse(rawUser);
        if (parsed?.id) {
          return { user: parsed as SupabaseUser, session: null };
        }
      } catch {}
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
      if (session.refresh_token) {
        localStorage.setItem(REFRESH_TOKEN_KEY, session.refresh_token);
      }
      if (session.user) {
        localStorage.setItem(USER_BACKUP_KEY, JSON.stringify(session.user));
      }
      // If user is authenticated, ensure cookie consent is marked accepted
      localStorage.setItem("nilaa_cookie_consent", "accepted");
    } else {
      localStorage.removeItem(SESSION_BACKUP_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_BACKUP_KEY);
    }
  } catch {}
}

export function clearSessionBackup() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(SESSION_BACKUP_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_BACKUP_KEY);
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("nilaa_auth_chunk_") || key.startsWith("sb-"))) {
        localStorage.removeItem(key);
      }
    }
  } catch {}
}
