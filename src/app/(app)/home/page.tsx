"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Video,
  LogOut,
  Sparkles,
  Keyboard,
  Clock,
  ArrowRight,
  User,
  Plus,
  Sliders,
  Check,
  Copy,
  Mail,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { CopyCode } from "@/components/motion/copy-code";
import { createClient } from "@/lib/supabase/client";
import { generateMeetingCode, normalizeMeetingCode } from "@/lib/utils";
import { getCachedUserSettings, fetchUserSettings } from "@/lib/user-settings";
import { getOrRestoreSession, persistSessionBackup, clearSessionBackup } from "@/lib/supabase/auth-helper";
import { GreenRoomDrawer } from "@/components/meeting/green-room-drawer";
import { InstallPwaButton } from "@/components/ui/install-pwa-button";
import { usePwaInstall } from "@/lib/pwa-install";
import { type User as SupabaseUser } from "@supabase/supabase-js";
import { toast } from "sonner";

export default function HomePage() {
  const router = useRouter();
  const { isInstalled } = usePwaInstall();
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("nilaa_hide_install_banner") === "true";
    }
    return false;
  });
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
  const [createdRoomCode, setCreatedRoomCode] = useState<string | null>(null);
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
    setCreatedRoomCode(code);
    setIsCreating(false);
    toast.success(`Generated room code: ${code}`);
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
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors"
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
              className="text-slate-500 hover:text-red-600 gap-1.5 text-xs"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area: Spacious, Clean, Simple */}
      <main className="flex-1 container mx-auto max-w-4xl px-4 sm:px-6 py-12 sm:py-16 flex flex-col justify-center">
        {/* Welcome Banner */}
        <div className="mb-10 text-center sm:text-left">
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Welcome,{" "}
            <span className="text-blue-600">
              {userProfile.displayName || user?.email?.split("@")[0] || "Friend"}
            </span>
          </h1>
          {user?.email && (
            <div className="mt-1 flex items-center justify-center sm:justify-start gap-1.5 text-xs sm:text-sm text-slate-500 font-normal">
              <Mail className="h-3.5 w-3.5 text-slate-400" />
              <span>{user.email}</span>
            </div>
          )}
          <p className="mt-2 text-slate-500 text-sm sm:text-base max-w-xl">
            Start an instant high-definition video meeting or enter an ongoing room with a code.
          </p>
        </div>

        {/* Install Nilaa RTC Quick App Banner - Hidden completely when installed or dismissed */}
        {!isInstalled && !bannerDismissed && (
          <div className="relative mb-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-sky-500/10 to-indigo-500/10 border border-blue-200/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shrink-0">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 fill-white" aria-hidden="true">
                  <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">
                  Install Nilaa RTC on Desktop & Mobile
                </h4>
                <p className="text-xs text-slate-500 font-normal">
                  Instant one-click access right from your Windows Taskbar or phone home screen with your saved account.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <InstallPwaButton />
              <button
                type="button"
                onClick={() => {
                  setBannerDismissed(true);
                  try {
                    localStorage.setItem("nilaa_hide_install_banner", "true");
                  } catch {}
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors cursor-pointer"
                title="Dismiss"
                aria-label="Dismiss banner"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* 2 Clear, Spacious Primary Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-10">
          {/* Card 1: Start Instant Meeting */}
          <Card className="bg-white border-slate-200 hover:border-blue-400/60 transition-all flex flex-col justify-between p-7 rounded-2xl shadow-soft-card">
            <div>
              <div className="h-12 w-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-5">
                <Sparkles className="h-6 w-6" />
              </div>
              <h2 className="font-heading text-xl font-bold text-slate-900">
                Start Instant Meeting
              </h2>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                Create a new meeting room instantly. Share the code or link with your team or friends.
              </p>
            </div>

            <div className="mt-8 pt-5 border-t border-slate-100 space-y-4">
              {createdRoomCode ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <div className="text-xs text-slate-500">
                    Your meeting is ready. Copy code or share URL:
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CopyCode code={createdRoomCode} showFullUrl={false} />
                    <Button
                      variant="accent"
                      size="sm"
                      onClick={() => router.push(`/${createdRoomCode}?host=1`)}
                      className="gap-1.5"
                    >
                      <span>Enter Room</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <Button
                  onClick={handleCreateInstantMeeting}
                  disabled={isCreating}
                  variant="accent"
                  size="lg"
                  className="w-full gap-2 text-base font-semibold h-13 shadow-md"
                >
                  <Plus className="h-5 w-5" />
                  <span>{isCreating ? "Generating Code..." : "Create New Meeting"}</span>
                </Button>
              )}
            </div>
          </Card>

          {/* Card 2: Join with Code */}
          <Card className="bg-white border-slate-200 hover:border-blue-400/60 transition-all flex flex-col justify-between p-7 rounded-2xl shadow-soft-card">
            <div>
              <div className="h-12 w-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 mb-5">
                <Keyboard className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="font-heading text-xl font-bold text-slate-900">
                Join with a Code
              </h2>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                Have an invite code or link? Enter the 6-character room code to jump straight in.
              </p>
            </div>

            <form onSubmit={handleJoin} className="mt-8 pt-5 border-t border-slate-100 space-y-3">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="e.g. X7K9M2"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="font-mono tracking-wider uppercase h-13 text-sm sm:text-base pl-4 bg-slate-50 border-slate-200"
                />
              </div>
              <Button
                type="submit"
                variant="secondary"
                size="lg"
                disabled={!joinCode.trim()}
                className="w-full gap-2 text-base h-13 font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200"
              >
                Join Call
              </Button>
            </form>
          </Card>
        </div>

        {/* Clean Spec Status Bar */}
        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-slate-500">
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
