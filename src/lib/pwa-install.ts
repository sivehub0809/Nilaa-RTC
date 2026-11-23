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
  // 1. Listen for Chrome/Edge/Brave/Android native install prompt
  window.addEventListener("beforeinstallprompt", (e: Event) => {
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    notifyListeners();
  });

  // 2. Track when app has been installed
  window.addEventListener("appinstalled", () => {
    globalDeferredPrompt = null;
    try {
      localStorage.setItem("nilaa_app_installed", "true");
    } catch {}
    notifyListeners();
  });

  // 3. Register service worker
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    });
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

export function isStandaloneApp(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (localStorage.getItem("nilaa_app_installed") === "true") {
      return true;
    }
  } catch {}

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
  const [canPrompt, setCanPrompt] = useState(Boolean(globalDeferredPrompt));
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
    setCanPrompt(Boolean(globalDeferredPrompt));

    const handler = () => {
      setCanPrompt(Boolean(globalDeferredPrompt));
      setIsInstalled(isStandaloneApp());
    };

    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  const promptInstall = async (): Promise<"accepted" | "dismissed" | "manual"> => {
    if (globalDeferredPrompt) {
      try {
        await globalDeferredPrompt.prompt();
        const choice = await globalDeferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          globalDeferredPrompt = null;
          markAsInstalled();
          setCanPrompt(false);
          setIsInstalled(true);
          return "accepted";
        }
        return "dismissed";
      } catch {
        return "manual";
      }
    }
    return "manual";
  };

  return {
    canPrompt,
    isInstalled,
    platform,
    promptInstall,
    markAsInstalled,
  };
}
