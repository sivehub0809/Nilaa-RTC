"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, KeyRound, ArrowRight, Home, X } from "lucide-react";
import { normalizeMeetingCode } from "@/lib/utils";

interface InvalidCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
  message?: string;
}

/**
 * Centered modal shown when a user enters an unavailable, ended, or non-existent meeting code.
 * Clean, minimal, zero clutter, with immediate code re-entry and return home actions.
 */
export function InvalidCodeModal({
  isOpen,
  onClose,
  initialCode = "",
  message = "This code is unavailable or has ended.",
}: InvalidCodeModalProps) {
  const router = useRouter();
  const [code, setCode] = useState(initialCode);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync initialCode if changed
  const handleCodeChange = (val: string) => {
    setCode(val.toUpperCase());
    if (error) setError(null);
  };

  const handleJoin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = normalizeMeetingCode(code);
    if (!clean || clean.length < 4) {
      setError("Please enter a valid code");
      return;
    }

    setIsChecking(true);
    setError(null);
    try {
      const res = await fetch(`/api/meetings?code=${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (!res.ok || !data.valid) {
        setError("Code not found or has ended");
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-sm sm:max-w-md p-6 sm:p-7 rounded-3xl bg-slate-900/95 border border-white/15 shadow-2xl space-y-4 text-center"
          >
            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="h-12 w-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
              <AlertCircle className="h-6 w-6" />
            </div>

            <div>
              <h3 className="font-heading text-xl font-bold text-white tracking-tight">
                Meeting Unavailable
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {message}
              </p>
            </div>

            {/* Code Re-Entry Form */}
            <form onSubmit={handleJoin} className="space-y-3 pt-1">
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  placeholder="Enter meeting code"
                  maxLength={10}
                  autoFocus
                  className="w-full h-12 pl-10 pr-3 rounded-2xl bg-slate-800/80 border border-white/10 text-white placeholder:text-slate-500 text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>

              {error && (
                <p className="text-xs text-rose-400 font-medium">{error}</p>
              )}

              <button
                type="submit"
                disabled={isChecking || !code.trim()}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-sky-400 to-blue-600 hover:from-sky-500 hover:to-blue-700 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 transition-all duration-150 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
              >
                <span>{isChecking ? "Checking..." : "Join with this Code"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={handleReturnHome}
                className="w-full h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Home className="h-3.5 w-3.5" />
                <span>Return to Home</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
