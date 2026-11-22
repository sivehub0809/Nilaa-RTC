"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { UserCheck, User, Keyboard, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { normalizeMeetingCode } from "@/lib/utils";
import { toast } from "sonner";

export default function GuestJoinPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [meetingCode, setMeetingCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGuestJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = normalizeMeetingCode(meetingCode);

    if (!displayName.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (!cleanCode || cleanCode.length < 4) {
      toast.error("Please enter a valid 6-character meeting code");
      return;
    }

    setLoading(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("nilaa_guest_name", displayName.trim());
      sessionStorage.setItem("nilaa_user_name", displayName.trim());
    }

    toast.success(`Joining room ${cleanCode} as ${displayName.trim()}`);
    router.push(`/${cleanCode}?guest=true&name=${encodeURIComponent(displayName.trim())}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-8 text-slate-900 select-none">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[28px] border border-slate-200/80 shadow-2xl p-6 sm:p-8 space-y-6"
      >
        {/* Top Navigation */}
        <div className="flex items-center justify-between pb-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Link>

          <Link href="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full overflow-hidden">
              <Image src="/nilaa-logo.jpg" alt="Nilaa" width={28} height={28} className="object-cover" />
            </div>
            <span className="font-heading font-extrabold text-sm text-slate-900">
              Nilaa <span className="text-blue-600">RTC</span>
            </span>
          </Link>
        </div>

        {/* Heading */}
        <div className="text-center space-y-1.5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 mb-2">
            <UserCheck className="h-7 w-7" />
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Join as Guest
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            No password or account required. Enter your name to enter the call.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleGuestJoin} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Your Display Name
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="e.g. Jordan"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                autoFocus
                className="w-full h-13 pl-12 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 text-sm sm:text-base font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Meeting Code
            </label>
            <div className="relative">
              <Keyboard className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="e.g. X7K9M2"
                value={meetingCode}
                onChange={(e) => setMeetingCode(e.target.value.toUpperCase())}
                required
                className="w-full h-13 pl-12 pr-4 uppercase font-mono tracking-wider rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 text-sm sm:text-base font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !displayName.trim() || !meetingCode.trim()}
              className="w-full h-13 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] disabled:opacity-60 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
            >
              <span>Join Meeting</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500 space-y-1">
          <div>Want to host your own meetings?</div>
          <div className="space-x-2">
            <Link href="/login" className="font-bold text-blue-600 hover:underline">
              Log In
            </Link>
            <span>•</span>
            <Link href="/signup" className="font-bold text-blue-600 hover:underline">
              Sign Up
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
