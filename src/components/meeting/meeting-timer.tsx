"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface MeetingTimerProps {
  className?: string;
}

/**
 * Live meeting duration timer displaying elapsed call time.
 * Styled in Geist Vercel font inside a frosted glass pill.
 */
export function MeetingTimer({ className }: MeetingTimerProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatDuration = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const remainingSec = totalSec % 60;
    const pad = (n: number) => String(n).padStart(2, "0");

    if (hours > 0) {
      return `${hours}:${pad(minutes)}:${pad(remainingSec)}`;
    }
    return `${pad(minutes)}:${pad(remainingSec)}`;
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/60 border border-white/15 text-xs font-sans font-medium text-white backdrop-blur-md shadow-xs select-none",
        className
      )}
      title="Meeting Duration"
      aria-label={`Meeting duration: ${formatDuration(seconds)}`}
    >
      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
      <span className="font-sans font-medium tracking-wide text-white tabular-nums drop-shadow-xs">
        {formatDuration(seconds)}
      </span>
    </div>
  );
}
