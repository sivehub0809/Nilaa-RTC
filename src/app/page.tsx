"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Video,
  Zap,
  Shield,
  Smile,
  ArrowRight,
  Keyboard,
  Users,
  User,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { generateMeetingCode, normalizeMeetingCode } from "@/lib/utils";
import { type User as SupabaseUser } from "@supabase/supabase-js";
import { toast } from "sonner";

export default function LandingPage() {
  const router = useRouter();
  const [meetingCode, setMeetingCode] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  const handleStartInstant = () => {
    setIsStarting(true);
    const code = generateMeetingCode();
    toast.success(`Meeting room created: ${code}`);
    router.push(`/${code}`);
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
    <div
      className="min-h-screen flex flex-col selection:bg-sky-200 selection:text-sky-900"
      style={{
        background:
          "linear-gradient(to bottom, #60A5FA 0%, #93C5FD 20%, #BAE6FD 45%, #E0F7FF 70%, #FFFFFF 100%)",
      }}
    >
      {/* Transparent Navbar - Completely seamless with landing page background */}
      <header className="w-full bg-transparent">
        <div className="w-full flex h-20 sm:h-22 items-center justify-between px-6 sm:px-10 lg:px-14">
          <Link href="/" className="flex items-center gap-3 group">
            {/* Logo 1.2x larger (44px) */}
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

          <nav className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <div className="flex items-center gap-2.5">
                <Link href="/home">
                  <button className="text-xs sm:text-sm px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium shadow-sm flex items-center gap-2 cursor-pointer">
                    <Video className="h-4 w-4" />
                    <span>Go to Meetings</span>
                  </button>
                </Link>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 border border-sky-200/60 text-xs font-normal text-slate-700">
                  <User className="h-3.5 w-3.5 text-blue-600" />
                  <span className="truncate max-w-[140px]">
                    {user.user_metadata?.display_name || user.email?.split("@")[0]}
                  </span>
                </div>
              </div>
            ) : (
              <>
                <Link href="/guest">
                  <button className="text-xs sm:text-sm px-3.5 py-2 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-white/50 transition-colors font-normal cursor-pointer">
                    Join as Guest
                  </button>
                </Link>
                <Link href="/login">
                  <button className="text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-sky-300/70 text-sky-900 bg-white/60 hover:bg-white/90 transition-colors font-medium shadow-xs cursor-pointer">
                    Log In
                  </button>
                </Link>
                <Link href="/signup">
                  <button className="text-xs sm:text-sm px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium shadow-sm cursor-pointer">
                    Sign Up
                  </button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
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
              className="flex-1 flex items-center justify-center gap-2.5 text-sm sm:text-base font-medium px-5 py-3 rounded-[16px] bg-sky-500 hover:bg-sky-600 text-white disabled:opacity-60 transition-colors shadow-sm cursor-pointer"
            >
              <Video className="h-4.5 w-4.5" />
              {isStarting ? "Creating..." : "Start Instant Meeting"}
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

          {/* Guest joining note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="mt-3.5 text-xs text-slate-700/80 font-normal flex items-center gap-1.5"
          >
            <span>No account required.</span>
            <Link
              href="/guest"
              className="text-sky-700 hover:underline font-medium inline-flex items-center gap-1"
            >
              Join as Guest <ArrowRight className="h-3 w-3" />
            </Link>
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
      <footer className="border-t border-sky-100 bg-white/60 py-6 px-4 text-center text-xs text-gray-400">
        <p>© 2026 Nilaa RTC. Real-time video conferencing for professionals & friends.</p>
      </footer>
    </div>
  );
}
