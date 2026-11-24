"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video,
  Zap,
  Shield,
  Smile,
  ArrowRight,
  Keyboard,
  Users,
  User,
  Menu,
  X,
  Mail,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { generateMeetingCode, normalizeMeetingCode } from "@/lib/utils";
import { fetchUserSettings, getCachedUserSettings, type UserSettings } from "@/lib/user-settings";
import { getOrRestoreSession, persistSessionBackup, clearSessionBackup } from "@/lib/supabase/auth-helper";
import { type User as SupabaseUser } from "@supabase/supabase-js";
import { InstallPwaButton } from "@/components/ui/install-pwa-button";
import { toast } from "sonner";

export default function LandingPage() {
  const router = useRouter();
  const [meetingCode, setMeetingCode] = useState("");
  const [isStarting, setIsStarting] = useState(false);
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
  const [profile, setProfile] = useState<UserSettings | null>(() => getCachedUserSettings());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // 1. Initial session restoration (restores from cookies or persistent local backup)
    getOrRestoreSession().then(async ({ user }) => {
      if (user) {
        setUser(user);
        const fresh = await fetchUserSettings();
        setProfile(fresh);
        // If user is already authenticated and not explicitly viewing landing (?landing=1), send to /home
        if (typeof window !== "undefined" && !window.location.search.includes("landing=1")) {
          router.replace("/home");
        }
      }
    });

    // 2. Continuous auth subscription
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        persistSessionBackup(session);
        setUser(session.user);
        const fresh = await fetchUserSettings();
        setProfile(fresh);
      } else if (event === "SIGNED_OUT") {
        clearSessionBackup();
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleStartInstant = () => {
    setIsStarting(true);
    const code = generateMeetingCode();
    if (typeof window !== "undefined") {
      sessionStorage.setItem(`nilaa_host_${code}`, "1");
    }
    toast.success(`Meeting room created: ${code}`);
    router.push(`/${code}?host=1`);
  };

  const handleJoinWithCode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = normalizeMeetingCode(meetingCode);
    if (!cleanCode || cleanCode.length < 4) {
      toast.error("Please enter a valid meeting code");
      return;
    }
    router.push(`/${cleanCode}`);
  };

  return (
    <div className="relative min-h-[100dvh] flex flex-col selection:bg-sky-200 selection:text-sky-900 overflow-x-hidden">
      {/* Ambient Sky Background (GPU-composited: full vertical coverage on desktop, natural cover on mobile) */}
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-top md:bg-[length:100%_100%] md:bg-center bg-no-repeat transform-gpu will-change-transform"
        style={{
          backgroundImage: "url('/background.jpg')",
          backgroundColor: "#BAE6FD",
        }}
      />
      {/* Soft airy lightening wash - gently lifts and softens the background for an effortless, lighter feel */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-white/20 sm:bg-white/15 backdrop-blur-[0.5px]" />

      {/* Transparent Navbar - Completely seamless with landing page background */}
      <header className="relative z-10 w-full bg-transparent">
        <div className="max-w-6xl mx-auto w-full flex h-20 sm:h-22 items-center justify-between px-6 sm:px-8">
          <Link href="/" className="flex items-center gap-3 group">
            {/* Logo 1.2x larger (44px) - aligned inward to max-w-6xl content grid */}
            <div className="flex h-11 w-11 items-center justify-center rounded-full overflow-hidden transition-transform duration-200 group-hover:scale-105 shadow-sm border border-white/60">
              <Image
                src="/nilaa-logo.jpg"
                alt="Nilaa RTC Logo"
                width={44}
                height={44}
                className="object-cover w-full h-full"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-sans text-xl font-medium tracking-tight text-slate-800 flex items-center gap-1.5">
                Nilaa <span className="text-sky-600 font-normal">RTC</span>
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-5 sm:gap-6">
            {user ? (
              <div className="flex items-center gap-4">
                <Link
                  href="/home"
                  className="font-sans text-[15px] sm:text-base font-medium text-white hover:text-white/85 transition-colors cursor-pointer drop-shadow-xs flex items-center gap-2"
                >
                  <Video className="h-4 w-4" />
                  <span>Go to Meetings</span>
                </Link>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/40 text-xs text-white">
                  <div className="h-5 w-5 rounded-full overflow-hidden bg-white/30 flex items-center justify-center text-[10px] text-white font-bold shrink-0 border border-white/60">
                    {profile?.avatarUrl ? (
                      <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-3 w-3 text-white shrink-0" />
                    )}
                  </div>
                  <span className="truncate max-w-[130px] font-medium">
                    {profile?.displayName || user.user_metadata?.display_name || user.email?.split("@")[0]}
                  </span>
                </div>
                <InstallPwaButton variant="nav" />
              </div>
            ) : (
              <>
                {/* 1. Log In (Left) - Geist Vercel font, Pure White, Increased Size, No Container */}
                <Link
                  href="/login"
                  className="font-sans text-[15px] sm:text-base font-medium text-white hover:text-white/80 active:text-white/60 transition-colors drop-shadow-xs cursor-pointer select-none"
                >
                  Log In
                </Link>

                {/* 2. Sign Up (Middle) - Geist Vercel font, Pure White, Increased Size, No Container */}
                <Link
                  href="/signup"
                  className="font-sans text-[15px] sm:text-base font-medium text-white hover:text-white/80 active:text-white/60 transition-colors drop-shadow-xs cursor-pointer select-none"
                >
                  Sign Up
                </Link>

                {/* 3. Get for Windows (Right) - Liquid Glass Pill Button */}
                <InstallPwaButton variant="nav" />
              </>
            )}
          </nav>

          {/* Mobile Hamburger Button (Clean transparent without white background) */}
          <div className="flex md:hidden items-center">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-xl text-slate-800 hover:text-slate-950 transition-colors cursor-pointer active:scale-90"
              aria-label="Open mobile menu"
            >
              <Menu className="h-6 w-6 stroke-[2]" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-Over Drawer (Right-to-Left ~30% - 40% on tablet, ~75% max-sm on mobile) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs md:hidden"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-[78%] sm:w-[50%] md:w-[35%] max-w-sm bg-white/95 backdrop-blur-xl border-l border-sky-100 shadow-2xl flex flex-col justify-between p-6 md:hidden"
            >
              <div>
                <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full overflow-hidden shadow-xs border border-white">
                      <Image
                        src="/nilaa-logo.jpg"
                        alt="Nilaa RTC"
                        width={32}
                        height={32}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <span className="font-sans text-base font-medium text-slate-800">
                      Nilaa <span className="text-sky-600 font-normal">RTC</span>
                    </span>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex flex-col gap-3 pt-6">
                  {user ? (
                    <>
                      <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-100 mb-2">
                        <div className="text-[11px] font-medium uppercase tracking-wider text-sky-600">
                          Signed in as
                        </div>
                        <div className="flex items-center gap-2.5 mt-1.5">
                          <div className="h-7 w-7 rounded-full overflow-hidden bg-white border border-sky-200 flex items-center justify-center text-xs font-bold text-blue-600 shrink-0">
                            {profile?.avatarUrl ? (
                              <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <span>{(profile?.displayName || user.user_metadata?.display_name || user.email || "U").charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div className="font-semibold text-sm text-slate-900 truncate">
                            {profile?.displayName || user.user_metadata?.display_name || user.email?.split("@")[0]}
                          </div>
                        </div>
                        {user.email && (
                          <div className="text-xs text-slate-500 font-normal truncate mt-1 flex items-center gap-1.5 pl-0.5">
                            <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                            <span className="truncate">{user.email}</span>
                          </div>
                        )}
                      </div>

                      <Link
                        href="/home"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="w-full"
                      >
                        <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white font-medium text-sm shadow-sm hover:bg-blue-700 transition-colors cursor-pointer">
                          <Video className="h-4 w-4" />
                          <span>Go to Meetings</span>
                        </button>
                      </Link>

                      <div className="pt-2">
                        <InstallPwaButton className="w-full justify-center" />
                      </div>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="w-full"
                      >
                        <button className="w-full py-3 px-4 rounded-xl text-sky-950 bg-sky-50/70 hover:bg-sky-100/70 border border-sky-200/80 font-medium text-sm transition-colors text-left flex items-center justify-between cursor-pointer">
                          <span>Log In</span>
                          <ArrowRight className="h-4 w-4 text-sky-600" />
                        </button>
                      </Link>

                      <Link
                        href="/signup"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="w-full"
                      >
                        <button className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-sm transition-colors text-left flex items-center justify-between cursor-pointer">
                          <span>Sign Up</span>
                          <ArrowRight className="h-4 w-4 text-white/80" />
                        </button>
                      </Link>

                      <div className="pt-2">
                        <InstallPwaButton className="w-full justify-center" />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 text-[11px] text-slate-400 font-light text-center">
                © 2026 Nilaa RTC • Real-time WebRTC conferencing
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="relative z-10 flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative px-4 sm:px-6 pt-10 sm:pt-14 pb-20 max-w-4xl mx-auto w-full text-center flex flex-col items-center">
          {/* Quick Actions Bar - Placed at Top per sketch */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="w-full max-w-xl flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 p-2 rounded-[22px] bg-white/90 border border-white/90 backdrop-blur-md shadow-2xl shadow-sky-900/10"
          >
            <button
              onClick={handleStartInstant}
              disabled={isStarting}
              className="flex-1 flex items-center justify-center gap-2.5 text-sm sm:text-base font-medium px-5 py-3 rounded-[16px] bg-gradient-to-b from-sky-400 to-sky-600 hover:from-sky-500 hover:to-sky-700 active:scale-[0.98] text-white disabled:opacity-60 transition-all shadow-sm cursor-pointer"
            >
              {isStarting ? (
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

            <div className="hidden sm:block h-8 w-[1px] bg-sky-200/80 my-auto" />

            <form
              onSubmit={handleJoinWithCode}
              className="flex items-center gap-2 flex-1"
            >
              <div className="relative flex-1">
                <Keyboard className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Enter code (e.g. X7K9M2)"
                  value={meetingCode}
                  onChange={(e) => setMeetingCode(e.target.value.toUpperCase())}
                  className="w-full h-11 pl-9 pr-3 uppercase tracking-wider font-mono text-xs sm:text-sm rounded-[14px] border border-sky-200/80 bg-white text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent font-normal"
                />
              </div>
              <button
                type="submit"
                disabled={!meetingCode.trim()}
                className="shrink-0 px-4 h-11 rounded-[14px] bg-white border border-sky-200 text-sky-700 font-medium text-xs sm:text-sm hover:bg-sky-50 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
              >
                Join
              </button>
            </form>
          </motion.div>

          {/* Main Title - Geist font, Medium weight, Balanced Size */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-14 sm:mt-16 font-sans text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-slate-900 leading-[1.18] max-w-3xl"
          >
            Clear, fast video meetings.{" "}
            <span className="text-sky-500 font-medium">
              Zero friction.
            </span>
          </motion.h1>

          {/* Subtitle / Description - Larger size, Darker text for clear readability */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mt-6 text-base sm:text-lg md:text-xl text-slate-700 font-normal max-w-2xl leading-relaxed"
          >
            Connect instantly with up to 15 people. Crisp audio, sharp video,
            real-time emoji reactions, and seamless screen sharing right from your browser.
          </motion.p>

          {/* Dedicated Get for Windows / Install App Button */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5"
          >
            <InstallPwaButton />
          </motion.div>
        </section>

        {/* Feature Highlights Grid */}
        <section className="px-4 sm:px-6 py-16 border-t border-sky-100/60 max-w-6xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="rounded-[22px] bg-white/80 border border-white/90 p-6 sm:p-7 flex flex-col gap-3 hover:border-sky-200 hover:shadow-lg hover:shadow-sky-900/5 transition-all backdrop-blur-sm"
            >
              <div className="h-10 w-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-500">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-lg font-medium text-slate-800">
                Instant & Fast
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-light leading-relaxed">
                Join in under a second. No downloads, no waiting lobbies, and
                no bloated software. Responsive button interactions throughout.
              </p>
            </motion.div>

            {/* Card 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-[22px] bg-white/80 border border-white/90 p-6 sm:p-7 flex flex-col gap-3 hover:border-sky-200 hover:shadow-lg hover:shadow-sky-900/5 transition-all backdrop-blur-sm"
            >
              <div className="h-10 w-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-500">
                <Smile className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-lg font-medium text-slate-800">
                Interactive & Lively
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-light leading-relaxed">
                Live chat, spring-animated emoji reactions, raise hand, and
                active speaker glow make every conversation engaging.
              </p>
            </motion.div>

            {/* Card 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="rounded-[22px] bg-white/80 border border-white/90 p-6 sm:p-7 flex flex-col gap-3 hover:border-sky-200 hover:shadow-lg hover:shadow-sky-900/5 transition-all backdrop-blur-sm"
            >
              <div className="h-10 w-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-500">
                <Shield className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-lg font-medium text-slate-800">
                Reliable & Clear
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-light leading-relaxed">
                Built on LiveKit SFU architecture. Adapts stream quality
                automatically to weak connections with sub-second latency.
              </p>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-sky-100/70 bg-white/50 backdrop-blur-xs py-6 px-4 text-center text-xs text-slate-500">
        <p>© 2026 Nilaa RTC. Real-time video conferencing for professionals & friends.</p>
      </footer>
    </div>
  );
}
