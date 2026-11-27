"use client";

import { useState, useRef, useEffect } from "react";
import { ConnectionQuality, ConnectionState } from "livekit-client";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi, Gauge, Volume2, Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type NetworkMode = "auto" | "saver" | "audio-only";

interface NetworkSignalBarsProps {
  quality: ConnectionQuality;
  size?: "xs" | "sm";
  className?: string;
}

/**
 * Subtle 3-bar cellular-style signal indicator for participant tiles & header.
 */
export function NetworkSignalBars({
  quality,
  size = "xs",
  className,
}: NetworkSignalBarsProps) {
  const isSmall = size === "xs";
  const barWidth = isSmall ? "w-[2.5px]" : "w-[3px]";
  const heights = isSmall ? ["h-1.5", "h-2.5", "h-3.5"] : ["h-2", "h-3", "h-4"];

  let activeBars = 3;
  let activeColor = "bg-emerald-400";
  let label = "Excellent connection";

  switch (quality) {
    case ConnectionQuality.Excellent:
      activeBars = 3;
      activeColor = "bg-emerald-400";
      label = "Excellent connection";
      break;
    case ConnectionQuality.Good:
      activeBars = 2;
      activeColor = "bg-emerald-400";
      label = "Good connection";
      break;
    case ConnectionQuality.Poor:
      activeBars = 1;
      activeColor = "bg-amber-400";
      label = "Weak connection";
      break;
    case ConnectionQuality.Lost:
      activeBars = 1;
      activeColor = "bg-red-500 animate-pulse";
      label = "Connection lost";
      break;
    default:
      activeBars = 3;
      activeColor = "bg-white/40";
      label = "Checking connection";
      break;
  }

  return (
    <span
      className={cn("inline-flex items-end gap-[1.5px]", className)}
      title={label}
      aria-label={label}
    >
      {heights.map((h, idx) => (
        <span
          key={idx}
          className={cn(
            barWidth,
            h,
            "rounded-full transition-colors duration-200",
            idx < activeBars ? activeColor : "bg-white/20"
          )}
        />
      ))}
    </span>
  );
}

interface NetworkHealthControlProps {
  quality: ConnectionQuality;
  connectionState: ConnectionState;
  mode: NetworkMode;
  onModeChange: (mode: NetworkMode) => void;
}

/**
 * Compact header pill + popover for Network Health & Data Saver mode.
 */
export function NetworkHealthControl({
  quality,
  connectionState,
  mode,
  onModeChange,
}: NetworkHealthControlProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [open]);

  const isWeak =
    quality === ConnectionQuality.Poor ||
    quality === ConnectionQuality.Lost ||
    connectionState === ConnectionState.Reconnecting;

  const statusText =
    connectionState === ConnectionState.Reconnecting
      ? "Reconnecting..."
      : quality === ConnectionQuality.Excellent
      ? "Excellent"
      : quality === ConnectionQuality.Good
      ? "Good"
      : quality === ConnectionQuality.Poor
      ? "Weak Signal"
      : quality === ConnectionQuality.Lost
      ? "Lost"
      : "Connected";

  const modePillLabel =
    mode === "audio-only" ? "Audio" : mode === "saver" ? "Saver" : "HD";

  const options: Array<{
    id: NetworkMode;
    title: string;
    subtitle: string;
    icon: typeof Sparkles;
  }> = [
    {
      id: "auto",
      title: "Auto (HD)",
      subtitle: "Adaptive quality for Wi-Fi & 4G",
      icon: Sparkles,
    },
    {
      id: "saver",
      title: "Data Saver",
      subtitle: "Low-bandwidth 180p video, clear voice",
      icon: Gauge,
    },
    {
      id: "audio-only",
      title: "Audio Only",
      subtitle: "Pause cameras, keep voice & screen share",
      icon: Volume2,
    },
  ];

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-sans font-medium backdrop-blur-md shadow-xs select-none transition-all cursor-pointer active:scale-95",
          mode !== "auto"
            ? "bg-sky-500/20 border-sky-400/40 text-sky-200 hover:bg-sky-500/30"
            : isWeak
            ? "bg-amber-500/15 border-amber-400/40 text-amber-200 hover:bg-amber-500/25"
            : "bg-slate-900/60 border-white/15 text-white hover:bg-slate-800/70"
        )}
        title="Network Health & Data Saver"
        aria-label="Network Health and Data Saver settings"
      >
        <NetworkSignalBars quality={quality} size="xs" />
        <span className="hidden xs:inline text-[11px] tracking-tight">
          {modePillLabel}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-10 w-64 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-white/15 shadow-2xl p-3 z-50 text-white"
          >
            {/* Status header */}
            <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Wifi className="h-3.5 w-3.5 text-sky-400" />
                <span className="text-xs font-semibold">Network Health</span>
              </div>
              <div className="flex items-center gap-1.5">
                <NetworkSignalBars quality={quality} size="xs" />
                <span
                  className={cn(
                    "text-[11px] font-medium",
                    isWeak ? "text-amber-300" : "text-emerald-400"
                  )}
                >
                  {statusText}
                </span>
              </div>
            </div>

            {isWeak && mode === "auto" && (
              <div className="mb-2 px-2.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-400/30 text-[11px] text-amber-200 leading-snug">
                Weak connection detected. Switch to Data Saver or Audio Only to keep voice clear.
              </div>
            )}

            {/* Mode selector */}
            <div className="space-y-1">
              {options.map((opt) => {
                const Icon = opt.icon;
                const active = mode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onModeChange(opt.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between gap-2 p-2 rounded-xl text-left transition-colors cursor-pointer",
                      active
                        ? "bg-sky-500/20 border border-sky-400/40"
                        : "hover:bg-white/10 border border-transparent"
                    )}
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <Icon
                        className={cn(
                          "h-3.5 w-3.5 mt-0.5 shrink-0",
                          active ? "text-sky-400" : "text-slate-400"
                        )}
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-white">
                          {opt.title}
                        </div>
                        <div className="text-[10px] text-slate-400 leading-tight">
                          {opt.subtitle}
                        </div>
                      </div>
                    </div>
                    {active && <Check className="h-3.5 w-3.5 text-sky-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
