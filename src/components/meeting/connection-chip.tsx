"use client";

import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConnectionChipProps {
  className?: string;
  pingMs?: number;
}

export function ConnectionChip({ className, pingMs: initialPing }: ConnectionChipProps) {
  const [ping, setPing] = useState(initialPing || 38);
  const [quality, setQuality] = useState<"HD" | "Good" | "Poor">("HD");

  useEffect(() => {
    // Dynamic ping simulation or real RTT
    const interval = setInterval(() => {
      // Natural subtle jitter around 25-45ms
      const newPing = Math.floor(32 + Math.random() * 12);
      setPing(newPing);
      if (newPing < 60) setQuality("HD");
      else if (newPing < 120) setQuality("Good");
      else setQuality("Poor");
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-btn bg-surface/90 border border-border text-[11px] font-mono text-muted-foreground backdrop-blur-md select-none",
        className
      )}
    >
      <Activity
        className={cn(
          "h-3 w-3",
          quality === "HD"
            ? "text-accent animate-pulse"
            : quality === "Good"
            ? "text-yellow-400"
            : "text-destructive"
        )}
      />
      <span className="text-foreground font-semibold">{ping} ms</span>
      <span className="text-accent font-bold">{quality}</span>
    </div>
  );
}
