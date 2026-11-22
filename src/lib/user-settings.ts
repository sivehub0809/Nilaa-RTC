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
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return cached;

    const meta = user.user_metadata || {};

    // If an old oversized base64 avatar exists in user_metadata, clean it up to prevent 494 Request Header Too Large
    if (meta.avatar_url && meta.avatar_url.startsWith("data:")) {
      supabase.auth.updateUser({ data: { avatar_url: null } }).catch(() => {});
    }

    const settings: UserSettings = {
      ...cached,
      displayName: meta.display_name || cached.displayName || user.email?.split("@")[0] || "",
      role: meta.role || cached.role || "Team Member",
      isPublic: meta.is_public !== undefined ? meta.is_public : cached.isPublic,
      avatarUrl: cached.avatarUrl || (meta.avatar_url && !meta.avatar_url.startsWith("data:") ? meta.avatar_url : null),
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
 * and asynchronously sync to Supabase user metadata & profiles table.
 */
export async function saveUserSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
  const current = getCachedUserSettings();
  const updated: UserSettings = { ...current, ...settings };

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // NEVER put base64 data URLs into auth user_metadata cookies (exceeds Vercel 8KB header limit -> 494)
      const safeCloudAvatar = updated.avatarUrl && !updated.avatarUrl.startsWith("data:") ? updated.avatarUrl : null;

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

      // Also sync to profiles table if it exists
      try {
        await (supabase.from("profiles") as any).upsert({
          id: user.id,
          email: user.email || "",
          display_name: updated.displayName,
          avatar_url: safeCloudAvatar,
        });
      } catch {}
    }
  } catch (err) {
    console.warn("Failed to sync settings to Supabase:", err);
  }

  return updated;
}
