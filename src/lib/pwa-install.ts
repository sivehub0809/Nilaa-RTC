"use client";

import { useState, useEffect } from "react";

export type PlatformType = "windows" | "mac" | "ios" | "android" | "linux" | "other";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

if (typeof window !== "undefined") {
  // Check if prompt was already captured by early head script
  if ((window as any).__nilaa_deferred_prompt) {
    globalDeferredPrompt = (window as any).__nilaa_deferred_prompt;
  }

  // 1. Listen for Chrome/Edge/Brave/Android native install prompt
  window.addEventListener("beforeinstallprompt", (e: Event) => {
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    (window as any).__nilaa_deferred_prompt = e;
    notifyListeners();
  });

  // 2. Track when app has been installed
  window.addEventListener("appinstalled", () => {
    globalDeferredPrompt = null;
    if (typeof window !== "undefined") {
      (window as any).__nilaa_deferred_prompt = null;
      try {
        localStorage.setItem("nilaa_app_installed", "true");
        localStorage.setItem("nilaa_hide_install_banner", "true");
      } catch {}
    }
    notifyListeners();
  });

  // 3. Register service worker immediately
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }
}

export function detectPlatform(): PlatformType {
  if (typeof window === "undefined") return "windows";

  const ua = window.navigator.userAgent.toLowerCase();
  const platform = (window.navigator as any).userAgentData?.platform?.toLowerCase() || window.navigator.platform?.toLowerCase() || "";

  if (platform.includes("win") || ua.includes("windows")) return "windows";
  if (platform.includes("mac") || ua.includes("macintosh") || ua.includes("mac os x")) return "mac";
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  if (platform.includes("linux") || ua.includes("linux")) return "linux";

  return "other";
}

/**
 * Checks whether the current window is running inside the installed standalone PWA app window
 */
export function isStandaloneApp(): boolean {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: window-controls-overlay)").matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes("android-app://") ||
    window.location.search.includes("source=pwa") ||
    window.location.search.includes("mode=app")
  );
}

export function markAsInstalled() {
  try {
    localStorage.setItem("nilaa_app_installed", "true");
    localStorage.setItem("nilaa_hide_install_banner", "true");
    notifyListeners();
  } catch {}
}

export function usePwaInstall() {
  const getPrompt = () => globalDeferredPrompt || (typeof window !== "undefined" ? (window as any).__nilaa_deferred_prompt : null);
  const [canPrompt, setCanPrompt] = useState(Boolean(getPrompt()));
  const [isInstalled, setIsInstalled] = useState(() => {
    if (typeof window !== "undefined") {
      return isStandaloneApp();
    }
    return false;
  });
  const [platform, setPlatform] = useState<PlatformType>(() => detectPlatform());

  useEffect(() => {
    setPlatform(detectPlatform());
    setIsInstalled(isStandaloneApp());
    setCanPrompt(Boolean(getPrompt()));

    const handler = () => {
      setCanPrompt(Boolean(getPrompt()));
      setIsInstalled(isStandaloneApp());
    };

    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  const promptInstall = async (): Promise<"accepted" | "dismissed" | "unavailable"> => {
    const promptEvent = getPrompt();
    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice.outcome === "accepted") {
          globalDeferredPrompt = null;
          if (typeof window !== "undefined") {
            (window as any).__nilaa_deferred_prompt = null;
          }
          markAsInstalled();
          setCanPrompt(false);
          return "accepted";
        }
        return "dismissed";
      } catch {
        return "unavailable";
      }
    }
    return "unavailable";
  };

  return {
    canPrompt,
    isInstalled,
    platform,
    promptInstall,
    markAsInstalled,
  };
}
