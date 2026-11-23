"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { saveUserSettings } from "@/lib/user-settings";
import { persistSessionBackup } from "@/lib/supabase/auth-helper";
import { toast } from "sonner";

export default function SignUpPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !displayName) {
      toast.error("Please fill in your name, email, and password");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName.trim(),
          },
        },
      });

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      if (data?.session) {
        persistSessionBackup(data.session);
      }

      // Pre-save display name to settings cache
      try {
        await saveUserSettings({ displayName: displayName.trim() });
      } catch {}

      toast.success("Account created successfully!");
      router.push("/home");
      router.refresh();
    } catch {
      toast.error("Failed to create account. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col md:flex-row text-slate-900 select-none overflow-x-hidden">
      {/* ================= LEFT SIDE (DESKTOP ARTWORK PANEL - FULL SCREEN EDGE-TO-EDGE) ================= */}
      <div className="hidden md:flex flex-col justify-between w-1/2 lg:w-[46%] min-h-screen bg-gradient-to-br from-blue-500 via-sky-400 to-indigo-500 p-10 lg:p-14 text-white relative overflow-hidden">
        {/* Decorative glow circles */}
        <div className="absolute -top-16 -left-16 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Brand Pill */}
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-full bg-white p-0.5 shadow-sm flex items-center justify-center overflow-hidden">
            <Image
              src="/nilaa-logo.jpg"
              alt="Nilaa"
              width={34}
              height={34}
              className="object-cover w-full h-full"
              priority
            />
          </div>
          <span className="font-heading font-medium text-lg tracking-tight text-white">
            Nilaa <span className="text-sky-100 font-light">RTC</span>
          </span>
        </div>

        {/* Center Mascot & Art Display (Thinner typography & clean refined circle) */}
        <div className="relative z-10 flex flex-col items-center justify-center my-auto py-6">
          <div className="relative h-44 w-44 lg:h-52 lg:w-52 rounded-full bg-white/15 p-2.5 backdrop-blur-sm border border-white/20 shadow-xl flex items-center justify-center group">
            <div className="h-full w-full rounded-full overflow-hidden bg-white shadow-inner flex items-center justify-center">
              <Image
                src="/nilaa-logo.jpg"
                alt="Nilaa Mascot"
                width={210}
                height={210}
                className="object-cover w-full h-full scale-105 group-hover:scale-110 transition-transform duration-500"
                priority
              />
            </div>
          </div>
          <h2 className="text-2xl lg:text-3xl font-medium font-sans text-white mt-6 text-center tracking-tight">
            Create your account.
          </h2>
          <p className="text-sky-100/90 text-xs sm:text-sm text-center mt-2 max-w-xs font-light leading-relaxed">
            Host instant video calls, customize your profile, and connect with zero friction.
          </p>
        </div>

        {/* Bottom Footer Note */}
        <div className="relative z-10 text-xs text-sky-100/70 font-light">
          © 2026 Nilaa RTC • Real-time WebRTC conferencing
        </div>
      </div>

      {/* ================= RIGHT SIDE (FORM PANEL - FULL SCREEN EDGE-TO-EDGE) ================= */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-16 bg-white min-h-screen">
        {/* Top Navigation Row */}
        <div className="flex items-center justify-between">
          {/* Back button */}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-normal text-slate-400 hover:text-slate-800 transition-colors py-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Link>

          {/* Switch to Sign In */}
          <div className="text-xs sm:text-sm text-slate-400 font-normal">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
              Sign in
            </Link>
          </div>
        </div>

        {/* Form Content */}
        <div className="max-w-md w-full mx-auto my-auto py-6 sm:py-8 space-y-6">
          {/* Mobile Mascot Header */}
          <div className="md:hidden flex flex-col items-center text-center space-y-2 mb-2">
            <div className="h-14 w-14 rounded-full overflow-hidden border border-blue-200 p-0.5 shadow-sm">
              <Image
                src="/nilaa-logo.jpg"
                alt="Nilaa"
                width={56}
                height={56}
                className="object-cover w-full h-full rounded-full"
                priority
              />
            </div>
          </div>

          {/* Headings (Medium Geist font with slightly larger title) */}
          <div className="space-y-1 text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-medium font-sans text-slate-900 tracking-tight">
              Sign up
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-light">
              Create your Nilaa RTC account in seconds.
            </p>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSignUp} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-normal uppercase tracking-wider text-slate-500">
                Your Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Alex Morgan"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 placeholder:text-slate-400 text-sm font-normal focus:bg-white focus:outline-none focus:ring-1.5 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-normal uppercase tracking-wider text-slate-500">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 placeholder:text-slate-400 text-sm font-normal focus:bg-white focus:outline-none focus:ring-1.5 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-normal uppercase tracking-wider text-slate-500">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full h-12 pl-11 pr-11 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 placeholder:text-slate-400 text-sm font-normal focus:bg-white focus:outline-none focus:ring-1.5 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 sm:h-13 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] disabled:opacity-60 text-white font-medium text-sm sm:text-base flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Sign up</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Guest Entry Fallback */}
          <div className="text-center pt-2">
            <span className="text-xs text-slate-400 font-light">Just joining a single call? </span>
            <Link href="/guest" className="text-xs font-medium text-blue-600 hover:underline">
              Continue as Guest
            </Link>
          </div>
        </div>

        {/* Bottom Mobile Switcher */}
        <div className="text-center text-xs text-slate-400 font-light py-2">
          Nilaa RTC • Real-time communication
        </div>
      </div>
    </div>
  );
}
