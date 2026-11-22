"use client";

import * as React from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CopyCodeProps {
  code: string;
  className?: string;
  showFullUrl?: boolean;
}

export function CopyCode({ code, className, showFullUrl = false }: CopyCodeProps) {
  const [copied, setCopied] = useState(false);

  const fullUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/${code}`
      : `https://nilaa-rtc.vercel.app/${code}`;

  const displayValue = showFullUrl ? fullUrl : code;

  const handleCopy = async () => {
    try {
      // Always write the valid complete URL so mobile browsers won't throw "address is invalid"
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast.success("Meeting link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Join Nilaa RTC Meeting",
          text: `Join my video meeting on Nilaa RTC with code: ${code}`,
          url: fullUrl,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-btn bg-surface border border-border px-3 py-1.5 shadow-sm",
        className
      )}
    >
      <span className="font-mono font-semibold tracking-wider text-foreground text-sm select-all">
        {displayValue}
      </span>
      <motion.button
        type="button"
        onClick={handleCopy}
        whileTap={{ scale: 0.88 }}
        whileHover={{ scale: 1.05 }}
        aria-label="Copy meeting code"
        className={cn(
          "relative flex h-7 w-7 items-center justify-center rounded-md transition-colors",
          copied
            ? "bg-accent text-accent-foreground shadow-cyan-glow"
            : "bg-surface-hover text-muted-foreground hover:text-foreground"
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          {copied ? (
            <motion.div
              key="check"
              initial={{ scale: 0, rotate: -45, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 450, damping: 20 }}
            >
              <Check className="h-4 w-4 stroke-[2.5]" />
            </motion.div>
          ) : (
            <motion.div
              key="copy"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Copy className="h-3.5 w-3.5" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
