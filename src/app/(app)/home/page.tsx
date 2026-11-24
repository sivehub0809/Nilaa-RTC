"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Video,
  LogOut,
  Keyboard,
  Clock,
  Sliders,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { generateMeetingCode, normalizeMeetingCode } from "@/lib/utils";
import { getCachedUserSettings, fetchUserSettings } from "@/lib/user-settings";
import { getOrRestoreSession, persistSessionBackup, clearSessionBackup } from "@/lib/supabase/auth-helper";
import { GreenRoomDrawer } from "@/components/meeting/green-room-drawer";
import { InstallPwaButton } from "@/components/ui/install-pwa-button";
import { type User as SupabaseUser } from "@supabase/supabase-js";
import { toast } from "sonner";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const backupRaw = localStorage.getItem("nilaa_session_backup");
        if (backupRaw) {
          const parsed = JSON.parse(backupRaw);
          return parsed.user || null;
        }
      } catch {}
    }
    return null;
  });
  const [loadingUser, setLoadingUser] = useState(() => {
    if (typeof window !== "undefined") {
      return !localStorage.getItem("nilaa_session_backup");
    }
    return true;
  });
  const [joinCode, setJoinCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Settings & Green Room Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(() => getCachedUserSettings());

  const refreshProfile = async () => {
    setUserProfile(getCachedUserSettings());
    try {
      const fresh = await fetchUserSettings();
      setUserProfile(fresh);
    } catch {}
  };

  useEffect(() => {
    const supabase = createClient();

    // 1. Restore session across browser close / cookie wipe
    getOrRestoreSession().then(async ({ user }) => {
      if (user) {
        setUser(user);
        setLoadingUser(false);
        const fresh = await fetchUserSettings();
        setUserProfile(fresh);
      } else {
        setLoadingUser(false);
        router.push("/login");
      }
    });

    // 2. Continuous auth subscription
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        persistSessionBackup(session);
        setUser(session.user);
        setLoadingUser(false);
        const fresh = await fetchUserSettings();
        setUserProfile(fresh);
      } else if (event === "SIGNED_OUT") {
        clearSessionBackup();
        setUser(null);
        router.push("/login");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const handleSignOut = async () => {
    const supabase = createClient();
    clearSessionBackup();
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    router.push("/login");
    router.refresh();
  };

  const handleCreateInstantMeeting = () => {
    setIsCreating(true);
    const code = generateMeetingCode();
    if (typeof window !== "undefined") {
      sessionStorage.setItem(`nilaa_host_${code}`, "1");
    }
    toast.success(`Meeting room created: ${code}`);
    router.push(`/${code}?host=1`);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = normalizeMeetingCode(joinCode);
    if (!clean || clean.length < 4) {
      toast.error("Please enter a valid 6-character room code");
      return;
    }
    router.push(`/${clean}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* Top Navbar */}
      <header className="border-b border-slate-100 bg-white/90 backdrop-blur-md sticky top-0 z-30">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/home" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-full overflow-hidden transition-transform duration-200 group-hover:scale-105">
              <Image
                src="/nilaa-logo.jpg"
                alt="Nilaa RTC"
                width={36}
                height={36}
                className="object-cover w-full h-full"
                priority
              />
            </div>
            <span className="font-heading text-lg font-bold tracking-tight text-slate-900">
              Nilaa <span className="text-blue-600 font-extrabold">RTC</span>
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Install App Quick Button */}
            <InstallPwaButton variant="compact" />

            {/* Green Room & Settings Button */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
              title="Open Audio & Video Settings"
            >
              <div className="h-6 w-6 rounded-full overflow-hidden bg-blue-100 text-blue-600 flex items-center justify-center text-[11px] font-bold shrink-0">
                {userProfile.avatarUrl ? (
                  <img src={userProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{(userProfile.displayName || user?.email || "U").charAt(0).toUpperCase()}</span>
                )}
              </div>
              <span className="hidden sm:inline">Settings & Check</span>
              <Sliders className="h-3.5 w-3.5 text-blue-600" />
            </button>

            {/* Sign Out Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-slate-500 hover:text-red-600 gap-1.5 text-xs cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area: Clean, Spacious, Breathing Space */}
      <main className="flex-1 container mx-auto max-w-4xl px-4 sm:px-6 py-12 sm:py-16 flex flex-col justify-center">
        {/* Welcome Greeting - Left-aligned, Medium Geist Font, Breathing Space */}
        <div className="mb-8 sm:mb-10 text-left">
          <h1 className="font-sans text-2xl sm:text-3xl font-medium text-slate-900 tracking-tight">
            Welcome,{" "}
            <span className="text-blue-600 font-medium">
              {userProfile.displayName || user?.email?.split("@")[0] || "Friend"}
            </span>
          </h1>
        </div>

        {/* Unified Pill Bar: Start Instant Meeting + Join with Code (Exact same design and codebase as Landing Page) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-xl flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 p-2 rounded-[22px] bg-white border border-slate-200/90 shadow-lg shadow-sky-950/5 mb-14 sm:mb-16"
        >
          {/* Left Pill: Start Instant Meeting */}
          <button
            onClick={handleCreateInstantMeeting}
            disabled={isCreating}
            className="flex-1 flex items-center justify-center gap-2.5 text-sm sm:text-base font-medium px-5 py-3 rounded-[16px] bg-gradient-to-b from-sky-400 to-sky-600 hover:from-sky-500 hover:to-sky-700 active:scale-[0.98] text-white disabled:opacity-60 transition-all shadow-sm cursor-pointer"
          >
            {isCreating ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Entering...</span>
              </div>
            ) : (
              <>
                <Video className="h-4.5 w-4.5" />
                <span>Start Instant Meeting</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="hidden sm:block h-8 w-[1px] bg-slate-200/80 my-auto" />

          {/* Right Form: Enter Code + Join */}
          <form
            onSubmit={handleJoin}
            className="flex items-center gap-2 flex-1"
          >
            <div className="relative flex-1">
              <Keyboard className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Enter code (e.g. X7K9M2)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="w-full h-11 pl-9 pr-3 uppercase tracking-wider font-mono text-xs sm:text-sm rounded-[14px] border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent font-normal"
              />
            </div>
            <button
              type="submit"
              disabled={!joinCode.trim()}
              className="shrink-0 px-4 h-11 rounded-[14px] bg-slate-50 border border-slate-200 text-slate-700 font-medium text-xs sm:text-sm hover:bg-slate-100 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
            >
              Join
            </button>
          </form>
        </motion.div>

        {/* Clean Spec Status Bar */}
        <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse" />
            <span>Nilaa RTC supports up to 15 HD video participants per meeting room.</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-slate-700 font-medium">
              <Clock className="h-4 w-4 text-blue-600" /> Zero friction • Browser-based
            </span>
          </div>
        </div>
      </main>

      {/* Slide-out Green Room Drawer */}
      <GreenRoomDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onProfileUpdated={refreshProfile}
      />
    </div>
  );
}
