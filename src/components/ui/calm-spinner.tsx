"use client";

import React from "react";

interface CalmSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

/**
 * Calm, ultra-crisp blue/black gradient rotating circle
 * Represents processing / entering while maintaining high quality and calm aesthetics.
 */
export function CalmSpinner({
  size = "md",
  text,
  className = "",
}: CalmSpinnerProps) {
  // Tiny, calm dimensions: sm: 20px, md: 28px, lg: 36px
  const dim = size === "sm" ? 20 : size === "lg" ? 36 : 28;
  const strokeWidth = size === "sm" ? 2 : 2.5;

  return (
    <div className={`flex flex-col items-center justify-center gap-3 select-none ${className}`}>
      <div
        className="relative flex items-center justify-center"
        style={{ width: dim, height: dim }}
        role="status"
        aria-label={text || "Loading"}
      >
        {/* Subtle, soft track ring */}
        <div className="absolute inset-0 rounded-full border border-slate-200/50" />

        {/* Calm blue & black gradient rotating circle */}
        <div
          className="w-full h-full rounded-full animate-spin"
          style={{
            background:
              "conic-gradient(from 0deg, #0F172A 0%, #1E3A8A 35%, #2563EB 65%, #38BDF8 88%, transparent 100%)",
            mask: `radial-gradient(farthest-side, transparent calc(100% - ${strokeWidth}px), #fff calc(100% - ${strokeWidth}px + 0.5px))`,
            WebkitMask: `radial-gradient(farthest-side, transparent calc(100% - ${strokeWidth}px), #fff calc(100% - ${strokeWidth}px + 0.5px))`,
            animationDuration: "1s",
            animationTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </div>

      {text && (
        <span className="text-xs font-medium tracking-tight text-slate-700 animate-pulse">
          {text}
        </span>
      )}
    </div>
  );
}
