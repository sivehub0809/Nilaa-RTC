"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Home, X } from "lucide-react";
import { normalizeMeetingCode } from "@/lib/utils";

interface InvalidCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
  message?: string;
}

/**
 * Centered "Meeting Unavailable" dialog designed exactly after the user mockup.
 * Clean, dark glass aesthetic with immediate re-entry input and return home action.
 */
export function InvalidCodeModal({
  isOpen,
  onClose,
  initialCode = "",
  message = "Double-check your meeting code or ask the host for a new link.",
}: InvalidCodeModalProps) {
  const router = useRouter();
  const [code, setCode] = useState(initialCode);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCodeChange = (val: string) => {
    setCode(val.toUpperCase());
    if (error) setError(null);
  };

  const handleJoin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = normalizeMeetingCode(code);
    if (!clean || clean.length < 4) {
      setError("Please enter a valid meeting code");
      return;
    }

    setIsChecking(true);
    setError(null);
    try {
      const res = await fetch(`/api/meetings?code=${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (!res.ok || !data.valid) {
        setError("Code not found or has already ended");
        setIsChecking(false);
        return;
      }
      onClose();
      router.push(`/${clean}`);
    } catch {
      router.push(`/${clean}`);
    } finally {
      setIsChecking(false);
    }
  };

  const handleReturnHome = () => {
    onClose();
    router.push("/home");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-sm sm:max-w-md p-7 sm:p-9 rounded-[28px] bg-slate-900/95 border border-white/10 shadow-2xl space-y-6 text-center"
          >
            {/* Dismiss X */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-5 right-5 h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="space-y-2">
              <h3 className="font-heading text-2xl font-bold text-white tracking-tight">
                Meeting Unavailable
              </h3>
              <p className="text-sm text-slate-400 font-normal leading-relaxed max-w-xs mx-auto">
                {message}
              </p>
            </div>

            {/* Re-Entry Form */}
            <form onSubmit={handleJoin} className="space-y-3 pt-1">
              <input
                type="text"
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                placeholder="Enter meeting code"
                maxLength={10}
                autoFocus
                className="w-full h-12 px-4 rounded-2xl bg-slate-800/60 border border-white/10 text-white placeholder:text-slate-500 text-sm font-mono tracking-wider text-center focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all"
              />

              {error && (
                <p className="text-xs text-rose-400 font-medium">{error}</p>
              )}

              {/* Frosted White-Glass Pill Button */}
              <button
                type="submit"
                disabled={isChecking || !code.trim()}
                className="w-full h-12 rounded-2xl bg-gradient-to-b from-white/20 to-white/10 hover:from-white/25 hover:to-white/15 border border-white/20 text-white font-medium text-sm flex items-center justify-center shadow-sm active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer"
              >
                {isChecking ? "Checking..." : "Join with this Code"}
              </button>
            </form>

            {/* Return Home Action */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleReturnHome}
                className="inline-flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <Home className="h-4 w-4 text-slate-400" />
                <span>Return to Home</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
