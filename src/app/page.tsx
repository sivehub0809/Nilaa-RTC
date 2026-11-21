"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Video,
  Zap,
  Shield,
  Smile,
  ArrowRight,
  Keyboard,
  Users,
} from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { generateMeetingCode, normalizeMeetingCode } from "@/lib/utils";
import { toast } from "sonner";

export default function LandingPage() {
  const router = useRouter();
  const [meetingCode, setMeetingCode] = useState("");
  const [isStarting, setIsStarting] = useState(false);

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
    <div className="min-h-screen flex flex-col bg-background selection:bg-accent selection:text-accent-foreground">
      <Navbar />

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative px-4 sm:px-6 pt-16 sm:pt-24 pb-20 max-w-5xl mx-auto w-full text-center flex flex-col items-center">
          {/* Subtle accent glow behind hero */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[500px] h-[300px] bg-accent/10 rounded-full blur-[100px] pointer-events-none -z-10" />

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface border border-border text-xs sm:text-sm text-foreground mb-6"
          >
            <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse" />
            <span>Next-Generation WebRTC Video Meetings</span>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-heading text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1] max-w-4xl"
          >
            Clear, fast video meetings.{" "}
            <span className="text-accent underline decoration-accent/30 decoration-wavy underline-offset-8">
              Zero friction.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-base sm:text-xl text-muted-foreground max-w-2xl"
          >
            Connect instantly with up to 15 people. Crisp audio, sharp video,
            real-time emoji reactions, and seamless screen sharing right from your browser.
          </motion.p>

          {/* Quick Actions Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-10 w-full max-w-xl flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 p-2 rounded-[20px] bg-card/80 border border-border backdrop-blur-md shadow-xl"
          >
            <Button
              onClick={handleStartInstant}
              disabled={isStarting}
              variant="accent"
              size="lg"
              className="flex-1 gap-2.5 text-base"
            >
              <Video className="h-5 w-5" />
              {isStarting ? "Creating..." : "Start Instant Meeting"}
            </Button>

            <div className="hidden sm:block h-8 w-[1px] bg-border my-auto" />

            <form
              onSubmit={handleJoinWithCode}
              className="flex items-center gap-2 flex-1"
            >
              <div className="relative flex-1">
                <Keyboard className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Enter code (e.g. X7K9M2)"
                  value={meetingCode}
                  onChange={(e) => setMeetingCode(e.target.value.toUpperCase())}
                  className="pl-9 uppercase tracking-wider font-mono text-xs sm:text-sm h-11"
                />
              </div>
              <Button
                type="submit"
                variant="secondary"
                size="default"
                disabled={!meetingCode.trim()}
                className="shrink-0"
              >
                Join
              </Button>
            </form>
          </motion.div>

          {/* Guest joining note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-4 text-xs text-muted-foreground flex items-center gap-1.5"
          >
            <span>No account required.</span>
            <Link
              href="/guest"
              className="text-accent hover:underline font-medium inline-flex items-center gap-1"
            >
              Join as Guest <ArrowRight className="h-3 w-3" />
            </Link>
          </motion.div>
        </section>

        {/* Feature Highlights Grid */}
        <section className="px-4 sm:px-6 py-16 border-t border-border/50 max-w-6xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-card hover:border-accent/40 transition-colors">
              <CardContent className="p-6 flex flex-col gap-3">
                <div className="h-10 w-10 rounded-btn bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                  <Zap className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-xl font-bold text-foreground">
                  Instant & Fast
                </h3>
                <p className="text-sm text-muted-foreground">
                  Join in under a second. No downloads, no waiting lobbies, and
                  no bloated software. Responsive button interactions throughout.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card hover:border-accent/40 transition-colors">
              <CardContent className="p-6 flex flex-col gap-3">
                <div className="h-10 w-10 rounded-btn bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                  <Smile className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-xl font-bold text-foreground">
                  Interactive & Lively
                </h3>
                <p className="text-sm text-muted-foreground">
                  Live chat, spring-animated emoji reactions, raise hand, and
                  active speaker glow make every conversation engaging.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card hover:border-accent/40 transition-colors">
              <CardContent className="p-6 flex flex-col gap-3">
                <div className="h-10 w-10 rounded-btn bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                  <Shield className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-xl font-bold text-foreground">
                  Reliable & Clear
                </h3>
                <p className="text-sm text-muted-foreground">
                  Built on LiveKit SFU architecture. Adapts stream quality
                  automatically to weak connections with sub-second latency.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-4 text-center text-xs text-muted-foreground">
        <p>© 2026 Nilaa RTC. Real-time video conferencing for professionals & friends.</p>
      </footer>
    </div>
  );
}
