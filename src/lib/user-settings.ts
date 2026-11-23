import { createClient } from "@/lib/supabase/client";

export interface UserSettings {
  displayName: string;
  role: string;
  isPublic: boolean;
  avatarUrl: string | null;
  autoMuteOnJoin: boolean;
  autoCameraOffOnJoin: boolean;
  noiseCancellation: boolean;
  dataSaverMode: boolean;
  preferredCameraId: string;
  preferredMicId: string;
  preferredSpeakerId: string;
  backgroundBlur: boolean;
  mirrorVideo: boolean;
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  displayName: "",
  role: "Team Member",
  isPublic: true,
  avatarUrl: null,
  autoMuteOnJoin: false,
  autoCameraOffOnJoin: false,
  noiseCancellation: true,
  dataSaverMode: false,
  preferredCameraId: "",
  preferredMicId: "",
  preferredSpeakerId: "",
  backgroundBlur: false,
  mirrorVideo: true,
};

const STORAGE_KEY = "nilaa_user_settings";

/**
 * Load user settings instantly from localStorage cache,
 * then optionally sync from Supabase auth user metadata.
 */
export function getCachedUserSettings(): UserSettings {
  if (typeof window === "undefined") return DEFAULT_USER_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_USER_SETTINGS;
    return { ...DEFAULT_USER_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_USER_SETTINGS;
  }
}

/**
 * Fetch latest user settings from Supabase and update local cache.
 */
export async function fetchUserSettings(): Promise<UserSettings> {
  const cached = getCachedUserSettings();
  if (typeof window === "undefined") return cached;

  try {
    const supabase = createClient();
    
    // First try getUser, fallback to getSession
    let user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      user = (await supabase.auth.getSession()).data.session?.user ?? null;
    }

    if (!user) return cached;

    const meta = user.user_metadata || {};

    // Fetch directly from public.profiles table (Primary source of truth for persistent user profile)
    let dbProfile: { display_name?: string | null; avatar_url?: string | null; role?: string | null } | null = null;
    try {
      const { data } = await (supabase.from("profiles") as any)
        .select("display_name, avatar_url, role")
        .eq("id", user.id)
        .maybeSingle();
      if (data) dbProfile = data as { display_name?: string | null; avatar_url?: string | null; role?: string | null };
    } catch (err) {
      console.warn("Could not fetch from profiles table:", err);
    }

    // Determine safe, persistent avatar URL (never base64)
    const rawAvatar = dbProfile?.avatar_url || meta.avatar_url || cached.avatarUrl;
    const safeAvatar = rawAvatar && !rawAvatar.startsWith("data:") ? rawAvatar : null;

    // Determine display name
    const finalDisplayName = dbProfile?.display_name || meta.display_name || cached.displayName || user.email?.split("@")[0] || "";

    const settings: UserSettings = {
      ...cached,
      displayName: finalDisplayName,
      role: dbProfile?.role || meta.role || cached.role || "Team Member",
      isPublic: meta.is_public !== undefined ? meta.is_public : cached.isPublic,
      avatarUrl: safeAvatar,
      autoMuteOnJoin: meta.auto_mute_on_join !== undefined ? meta.auto_mute_on_join : cached.autoMuteOnJoin,
      autoCameraOffOnJoin:
        meta.auto_camera_off_on_join !== undefined ? meta.auto_camera_off_on_join : cached.autoCameraOffOnJoin,
      noiseCancellation:
        meta.noise_cancellation !== undefined ? meta.noise_cancellation : cached.noiseCancellation,
      dataSaverMode: meta.data_saver_mode !== undefined ? meta.data_saver_mode : cached.dataSaverMode,
      preferredCameraId: meta.preferred_camera_id || cached.preferredCameraId,
      preferredMicId: meta.preferred_mic_id || cached.preferredMicId,
      preferredSpeakerId: meta.preferred_speaker_id || cached.preferredSpeakerId,
      backgroundBlur: meta.background_blur !== undefined ? meta.background_blur : cached.backgroundBlur,
      mirrorVideo: meta.mirror_video !== undefined ? meta.mirror_video : cached.mirrorVideo,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    return settings;
  } catch (err) {
    console.warn("Failed to fetch user settings from Supabase:", err);
    return cached;
  }
}

/**
 * Save user settings immediately to localStorage cache,
 * and asynchronously sync to Supabase profiles table & user metadata.
 */
export async function saveUserSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
  const current = getCachedUserSettings();
  const updated: UserSettings = { ...current, ...settings };

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  try {
    const supabase = createClient();
    let user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      user = (await supabase.auth.getSession()).data.session?.user ?? null;
    }

    if (user) {
      // NEVER put base64 data URLs into auth user_metadata cookies (exceeds Vercel 8KB header limit -> 494)
      const safeCloudAvatar = updated.avatarUrl && !updated.avatarUrl.startsWith("data:") ? updated.avatarUrl : null;

      // 1. Sync to public.profiles table (Primary source of truth for persistent user profile)
      try {
        await (supabase.from("profiles") as any).upsert({
          id: user.id,
          email: user.email || "",
          display_name: updated.displayName,
          avatar_url: safeCloudAvatar,
          role: updated.role,
          updated_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn("profiles table upsert error:", e);
      }

      // 2. Also update Supabase auth metadata
      try {
        await supabase.auth.updateUser({
          data: {
            display_name: updated.displayName,
            role: updated.role,
            is_public: updated.isPublic,
            avatar_url: safeCloudAvatar,
            auto_mute_on_join: updated.autoMuteOnJoin,
            auto_camera_off_on_join: updated.autoCameraOffOnJoin,
            noise_cancellation: updated.noiseCancellation,
            data_saver_mode: updated.dataSaverMode,
            preferred_camera_id: updated.preferredCameraId,
            preferred_mic_id: updated.preferredMicId,
            preferred_speaker_id: updated.preferredSpeakerId,
            background_blur: updated.backgroundBlur,
            mirror_video: updated.mirrorVideo,
          },
        });
      } catch (e) {
        console.warn("auth updateUser error:", e);
      }
    }
  } catch (err) {
    console.warn("Failed to sync settings to Supabase:", err);
  }

  return updated;
}
