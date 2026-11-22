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
      {/* Light-themed Navbar override */}
      <header className="sticky top-0 z-40 w-full border-b border-sky-200/70 bg-white/70 backdrop-blur-md">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-full overflow-hidden transition-transform duration-200 group-hover:scale-105">
              <Image
                src="/nilaa-logo.jpg"
                alt="Nilaa RTC Logo"
                width={36}
                height={36}
                className="object-cover w-full h-full"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-lg font-bold tracking-tight text-gray-800 flex items-center gap-1.5">
                Nilaa <span className="text-sky-500 font-extrabold">RTC</span>
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <div className="flex items-center gap-2.5">
                <Link href="/home">
                  <button className="text-xs sm:text-sm px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors font-semibold shadow-sm flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    <span>Go to Meetings</span>
                  </button>
                </Link>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 border border-sky-200 text-xs font-medium text-slate-700">
                  <User className="h-3.5 w-3.5 text-blue-600" />
                  <span className="truncate max-w-[140px]">
                    {user.user_metadata?.display_name || user.email?.split("@")[0]}
                  </span>
                </div>
              </div>
            ) : (
              <>
                <Link href="/guest">
                  <button className="text-xs sm:text-sm px-3.5 py-1.5 rounded-xl text-gray-700 hover:text-gray-950 hover:bg-white/60 transition-colors font-medium">
                    Join as Guest
                  </button>
                </Link>
                <Link href="/login">
                  <button className="text-xs sm:text-sm px-3.5 py-1.5 rounded-xl border border-sky-300 text-sky-800 bg-white/50 hover:bg-white transition-colors font-semibold">
                    Log In
                  </button>
                </Link>
                <Link href="/signup">
                  <button className="text-xs sm:text-sm px-4 py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors font-semibold shadow-sm">
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
        <section className="relative px-4 sm:px-6 pt-16 sm:pt-24 pb-20 max-w-5xl mx-auto w-full text-center flex flex-col items-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/70 border border-sky-200 text-xs sm:text-sm text-sky-700 mb-6 shadow-sm backdrop-blur-sm"
          >
            <span className="flex h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
            <span>Next-Generation WebRTC Video Meetings</span>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-heading text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-gray-900 leading-[1.1] max-w-4xl"
          >
            Clear, fast video meetings.{" "}
            <span className="text-sky-500 underline decoration-sky-300 decoration-wavy underline-offset-8">
              Zero friction.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-base sm:text-xl text-gray-500 max-w-2xl"
          >
            Connect instantly with up to 15 people. Crisp audio, sharp video,
            real-time emoji reactions, and seamless screen sharing right from your browser.
          </motion.p>

          {/* Quick Actions Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-10 w-full max-w-xl flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 p-2 rounded-[20px] bg-white/80 border border-sky-200 backdrop-blur-md shadow-xl"
          >
            <button
              onClick={handleStartInstant}
              disabled={isStarting}
              className="flex-1 flex items-center justify-center gap-2.5 text-base font-semibold px-5 py-3 rounded-[14px] bg-sky-500 text-white hover:bg-sky-600 disabled:opacity-60 transition-colors shadow-sm"
            >
              <Video className="h-5 w-5" />
              {isStarting ? "Creating..." : "Start Instant Meeting"}
            </button>

            <div className="hidden sm:block h-8 w-[1px] bg-sky-200 my-auto" />

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
                  className="w-full h-11 pl-9 pr-3 uppercase tracking-wider font-mono text-xs sm:text-sm rounded-[12px] border border-sky-200 bg-white/90 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={!meetingCode.trim()}
                className="shrink-0 px-4 h-11 rounded-[12px] bg-white border border-sky-300 text-sky-700 font-semibold text-sm hover:bg-sky-50 disabled:opacity-50 transition-colors"
              >
                Join
              </button>
            </form>
          </motion.div>

          {/* Guest joining note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-4 text-xs text-gray-500 flex items-center gap-1.5"
          >
            <span>No account required.</span>
            <Link
              href="/guest"
              className="text-sky-500 hover:underline font-medium inline-flex items-center gap-1"
            >
              Join as Guest <ArrowRight className="h-3 w-3" />
            </Link>
          </motion.div>
        </section>

        {/* Feature Highlights Grid */}
        <section className="px-4 sm:px-6 py-16 border-t border-sky-100 max-w-6xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="rounded-[20px] bg-white/80 border border-sky-100 p-6 flex flex-col gap-3 hover:border-sky-300 hover:shadow-md transition-all backdrop-blur-sm"
            >
              <div className="h-10 w-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-500">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-xl font-bold text-gray-900">
                Instant & Fast
              </h3>
              <p className="text-sm text-gray-500">
                Join in under a second. No downloads, no waiting lobbies, and
                no bloated software. Responsive button interactions throughout.
              </p>
            </motion.div>

            {/* Card 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="rounded-[20px] bg-white/80 border border-sky-100 p-6 flex flex-col gap-3 hover:border-sky-300 hover:shadow-md transition-all backdrop-blur-sm"
            >
              <div className="h-10 w-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-500">
                <Smile className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-xl font-bold text-gray-900">
                Interactive & Lively
              </h3>
              <p className="text-sm text-gray-500">
                Live chat, spring-animated emoji reactions, raise hand, and
                active speaker glow make every conversation engaging.
              </p>
            </motion.div>

            {/* Card 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="rounded-[20px] bg-white/80 border border-sky-100 p-6 flex flex-col gap-3 hover:border-sky-300 hover:shadow-md transition-all backdrop-blur-sm"
            >
              <div className="h-10 w-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-500">
                <Shield className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-xl font-bold text-gray-900">
                Reliable & Clear
              </h3>
              <p className="text-sm text-gray-500">
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
