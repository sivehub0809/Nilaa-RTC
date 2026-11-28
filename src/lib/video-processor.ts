"use client";

import { useEffect, useRef } from "react";
import { LocalVideoTrack, Track } from "livekit-client";
import { useLocalParticipant } from "@livekit/components-react";
import { getCachedUserSettings, UserSettings } from "./user-settings";
import { toast } from "sonner";

/**
 * Hook to apply real-time background blur and virtual background
 * to the user's live camera track using LiveKit's official WebGL / MediaPipe shaders.
 */
export function useLiveBackgroundProcessor() {
  const { localParticipant, isCameraEnabled } = useLocalParticipant();
  const processorRef = useRef<any>(null);
  const isInitializingRef = useRef(false);
  const currentModeRef = useRef<string>("disabled");

  useEffect(() => {
    if (typeof window === "undefined") return;

    let isMounted = true;

    async function applyBackgroundSettings(settings: UserSettings) {
      if (!isMounted) return;

      const cameraPub = localParticipant.getTrackPublication(Track.Source.Camera);
      const videoTrack = cameraPub?.videoTrack as LocalVideoTrack | undefined;

      // Determine desired effect
      const shouldBlur = !!settings.backgroundBlur && settings.selectedBackgroundIndex === -1;
      const selectedImg =
        settings.selectedBackgroundIndex >= 0 &&
        settings.backgroundImages &&
        settings.backgroundImages[settings.selectedBackgroundIndex]
          ? settings.backgroundImages[settings.selectedBackgroundIndex]
          : null;
      const shouldVirtualBg = !shouldBlur && !!selectedImg;

      // If neither is requested, turn off processor
      if (!shouldBlur && !shouldVirtualBg) {
        if (processorRef.current && videoTrack) {
          try {
            await processorRef.current.switchTo({ mode: "disabled" });
          } catch {
            try {
              await videoTrack.stopProcessor();
            } catch {}
          }
          currentModeRef.current = "disabled";
        }
        return;
      }

      // If camera is currently off or video track not available yet, wait
      if (!videoTrack) return;

      try {
        if (isInitializingRef.current) return;
        isInitializingRef.current = true;

        // Dynamically import @livekit/track-processors to avoid SSR issues
        const { BackgroundProcessor, supportsBackgroundProcessors } = await import(
          "@livekit/track-processors"
        );

        if (!supportsBackgroundProcessors()) {
          console.warn("Background processors not supported in this browser.");
          isInitializingRef.current = false;
          return;
        }

        const blurRadius = Math.max(1, Math.min(settings.blurLevel || 10, 30));

        if (!processorRef.current) {
          // Initialize processor
          if (shouldBlur) {
            const processor = BackgroundProcessor({
              mode: "background-blur",
              blurRadius,
            });
            await videoTrack.setProcessor(processor);
            processorRef.current = processor;
            currentModeRef.current = `blur-${blurRadius}`;
          } else if (shouldVirtualBg && selectedImg) {
            const processor = BackgroundProcessor({
              mode: "virtual-background",
              imagePath: selectedImg,
            });
            await videoTrack.setProcessor(processor);
            processorRef.current = processor;
            currentModeRef.current = `virtual-${settings.selectedBackgroundIndex}`;
          }
        } else {
          // Switch existing processor on-the-fly without rebuilding WebRTC pipeline
          if (shouldBlur) {
            await processorRef.current.switchTo({
              mode: "background-blur",
              blurRadius,
            });
            currentModeRef.current = `blur-${blurRadius}`;
          } else if (shouldVirtualBg && selectedImg) {
            await processorRef.current.switchTo({
              mode: "virtual-background",
              imagePath: selectedImg,
            });
            currentModeRef.current = `virtual-${settings.selectedBackgroundIndex}`;
          }
        }
      } catch (err: unknown) {
        console.warn("Failed to apply video background processor:", err);
      } finally {
        isInitializingRef.current = false;
      }
    }

    // Apply initially
    const initialSettings = getCachedUserSettings();
    applyBackgroundSettings(initialSettings);

    // Listen for setting changes
    const handleProfileUpdate = (e: CustomEvent<UserSettings>) => {
      if (e.detail) {
        applyBackgroundSettings(e.detail);
      }
    };

    window.addEventListener("nilaa_profile_updated" as any, handleProfileUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener("nilaa_profile_updated" as any, handleProfileUpdate);
    };
  }, [localParticipant, isCameraEnabled]);
}
