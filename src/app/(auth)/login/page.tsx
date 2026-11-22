"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      toast.success("Welcome back to Nilaa RTC!");
      router.push("/home");
      router.refresh();
    } catch {
      toast.error("Failed to sign in. Please check your connection.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-0 sm:p-6 md:p-10 text-slate-900 select-none">
      {/* Main Full-Screen / Split Card Container */}
      <div className="w-full max-w-5xl bg-white rounded-none sm:rounded-[32px] border-0 sm:border border-slate-200/80 shadow-none sm:shadow-2xl overflow-hidden min-h-screen sm:min-h-[640px] flex flex-col md:flex-row">
        
        {/* ================= LEFT SIDE (DESKTOP ARTWORK CARD) ================= */}
        <div className="hidden md:flex flex-col justify-between w-1/2 bg-gradient-to-br from-blue-500 via-sky-400 to-indigo-500 p-10 lg:p-12 text-white relative overflow-hidden">
          {/* Subtle decorative circles */}
          <div className="absolute -top-16 -left-16 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/15 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand Pill */}
          <div className="relative z-10 flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-full bg-white p-0.5 shadow-md flex items-center justify-center overflow-hidden">
              <Image
                src="/nilaa-logo.jpg"
                alt="Nilaa"
                width={38}
                height={38}
                className="object-cover w-full h-full"
                priority
              />
            </div>
            <span className="font-heading font-extrabold text-xl tracking-tight text-white drop-shadow-xs">
              Nilaa <span className="text-sky-200">RTC</span>
            </span>
          </div>

          {/* Center Mascot & Art Display */}
          <div className="relative z-10 flex flex-col items-center justify-center my-auto py-8">
            <div className="relative h-56 w-56 lg:h-64 lg:w-64 rounded-full bg-white/20 p-4 backdrop-blur-md border border-white/30 shadow-2xl flex items-center justify-center group">
              <div className="h-full w-full rounded-full overflow-hidden bg-white shadow-inner flex items-center justify-center">
                <Image
                  src="/nilaa-logo.jpg"
                  alt="Nilaa Mascot"
                  width={240}
                  height={240}
                  className="object-cover w-full h-full scale-105 group-hover:scale-110 transition-transform duration-500"
                  priority
                />
              </div>
            </div>
            <h2 className="font-heading text-2xl lg:text-3xl font-extrabold text-white mt-8 text-center tracking-tight drop-shadow-sm">
              Clear, fast video meetings.
            </h2>
            <p className="text-sky-100 text-sm text-center mt-2 max-w-xs font-medium">
              Zero friction, crisp audio, and seamless screen sharing right from your browser.
            </p>
          </div>

          {/* Bottom Footer Note */}
          <div className="relative z-10 text-xs text-sky-100/80 font-medium">
            © 2026 Nilaa RTC • Real-time WebRTC conferencing
          </div>
        </div>

        {/* ================= RIGHT SIDE (FORM FOR MOBILE & DESKTOP) ================= */}
        <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-14 bg-white min-h-screen sm:min-h-auto">
          {/* Top Navigation Row */}
          <div className="flex items-center justify-between">
            {/* Back button */}
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors py-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Link>

            {/* Switch to Sign Up */}
            <div className="text-xs sm:text-sm text-slate-500">
              Don't have an account?{" "}
              <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-bold hover:underline">
                Sign up
              </Link>
            </div>
          </div>

          {/* Form Content */}
          <div className="max-w-md w-full mx-auto my-auto py-6 sm:py-8 space-y-6 sm:space-y-8">
            {/* Mobile Mascot Header */}
            <div className="md:hidden flex flex-col items-center text-center space-y-3 mb-2">
              <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-blue-400 p-0.5 shadow-md">
                <Image
                  src="/nilaa-logo.jpg"
                  alt="Nilaa"
                  width={64}
                  height={64}
                  className="object-cover w-full h-full rounded-full"
                  priority
                />
              </div>
            </div>

            {/* Headings */}
            <div className="space-y-1.5 text-center sm:text-left">
              <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                Sign in
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                Enter your email address and password to access your calls.
              </p>
            </div>

            {/* Input Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email Address */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full h-13 pl-12 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 text-sm sm:text-base font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full h-13 pl-12 pr-12 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 text-sm sm:text-base font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button (Generous Touch Target for Phone & Desktop) */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-13 sm:h-14 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] disabled:opacity-60 text-white font-bold text-base sm:text-lg flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign in</span>
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Guest Entry Fallback */}
            <div className="text-center pt-2">
              <span className="text-xs text-slate-500">Just joining a single call? </span>
              <Link href="/guest" className="text-xs font-bold text-blue-600 hover:underline">
                Continue as Guest
              </Link>
            </div>
          </div>

          {/* Bottom Mobile Switcher */}
          <div className="text-center text-xs text-slate-400 py-3">
            Nilaa RTC • Real-time communication
          </div>
        </div>
      </div>
    </div>
  );
}
