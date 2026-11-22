import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a short 6-character room code like "X7K9M2"
 */
export function generateMeetingCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // omits confusing characters like I, O, 0, 1
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Format meeting code for display or normalization (uppercase, trimmed, strips full URLs)
 */
export function normalizeMeetingCode(code: string): string {
  if (!code) return "";
  let clean = code.trim();

  // If a full link was pasted (e.g. https://nilaa-rtc.vercel.app/X7K9M2 or /room)
  if (clean.includes("/")) {
    try {
      const url = clean.startsWith("http") ? new URL(clean) : new URL(`https://nilaa-rtc.vercel.app/${clean}`);
      const segments = url.pathname.split("/").filter(Boolean);
      if (segments.length > 0) {
        clean = segments[segments.length - 1];
        if (clean === "room" && segments.length >= 2) {
          clean = segments[segments.length - 2];
        }
      }
    } catch {
      const parts = clean.split("/").filter(Boolean);
      clean = parts[parts.length - 1] || clean;
    }
  }

  return clean.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
}
