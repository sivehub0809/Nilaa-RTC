"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CopyCode } from "@/components/motion/copy-code";
import { createClient } from "@/lib/supabase/client";
import { generateMeetingCode, normalizeMeetingCode } from "@/lib/utils";
import { type User as SupabaseUser } from "@supabase/supabase-js";
import { toast } from "sonner";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [joinCode, setJoinCode] = useState("");
  const [createdRoomCode, setCreatedRoomCode] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoadingUser(false);
    });
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    router.push("/login");
    router.refresh();
  };

  const handleCreateInstantMeeting = async () => {
    setIsCreating(true);
    const code = generateMeetingCode();
    setCreatedRoomCode(code);
    setIsCreating(false);
    toast.success(`Generated room code: ${code}`);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = normalizeMeetingCode(joinCode);
    if (!clean || clean.length < 4) {
      toast.error("Please enter a valid meeting code");
      return;
    }
    router.push(`/${clean}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Navbar */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-30">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/home" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-btn bg-accent text-accent-foreground font-bold shadow-cyan-glow">
              <Video className="h-5 w-5 fill-current" />
            </div>
            <span className="font-heading text-lg font-bold tracking-tight text-foreground">
              Nilaa <span className="text-accent">RTC</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-btn bg-surface border border-border text-xs text-foreground">
              <User className="h-3.5 w-3.5 text-accent" />
              <span className="font-medium truncate max-w-[150px]">
                {loadingUser ? "Loading..." : user?.user_metadata?.display_name || user?.email?.split("@")[0]}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-destructive gap-1.5"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 container mx-auto max-w-5xl px-4 sm:px-6 py-10">
        {/* Welcome Banner */}
        <div className="mb-10">
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Welcome,{" "}
            <span className="text-accent">
              {user?.user_metadata?.display_name || "Friend"}
            </span>
          </h1>
          <p className="mt-1 text-muted-foreground text-sm sm:text-base">
            Start an instant meeting with high-definition audio/video or join an ongoing call.
          </p>
        </div>

        {/* Primary Action Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Create Instant Meeting Card */}
          <Card className="bg-card border-border hover:border-accent/50 transition-all flex flex-col justify-between p-6 rounded-card shadow-lg">
            <div>
              <div className="h-12 w-12 rounded-btn bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-4">
                <Sparkles className="h-6 w-6" />
              </div>
              <h2 className="font-heading text-xl font-bold text-foreground">
                Start Instant Meeting
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Create a new meeting room instantly. Share the code or link with your team or friends.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-border/70 space-y-4">
              {createdRoomCode ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-3 p-4 rounded-btn bg-surface border border-border"
                >
                  <div className="text-xs text-muted-foreground">
                    Your meeting is ready. Copy code or share URL:
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CopyCode code={createdRoomCode} showFullUrl={false} />
                    <Button
                      variant="accent"
                      size="sm"
                      onClick={() => router.push(`/${createdRoomCode}`)}
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
                  className="w-full gap-2 text-base font-semibold"
                >
                  <Plus className="h-5 w-5" />
                  {isCreating ? "Generating Code..." : "Create New Meeting"}
                </Button>
              )}
            </div>
          </Card>

          {/* Join with Code Card */}
          <Card className="bg-card border-border hover:border-accent/50 transition-all flex flex-col justify-between p-6 rounded-card shadow-lg">
            <div>
              <div className="h-12 w-12 rounded-btn bg-surface border border-border flex items-center justify-center text-foreground mb-4">
                <Keyboard className="h-6 w-6 text-accent" />
              </div>
              <h2 className="font-heading text-xl font-bold text-foreground">
                Join with a Code
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Have a code or invite link? Enter the 6-character room code to jump straight in.
              </p>
            </div>

            <form onSubmit={handleJoin} className="mt-6 pt-4 border-t border-border/70 space-y-3">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="e.g. X7K9M2"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="font-mono tracking-wider uppercase h-12 text-sm sm:text-base pl-4"
                />
              </div>
              <Button
                type="submit"
                variant="secondary"
                size="lg"
                disabled={!joinCode.trim()}
                className="w-full gap-2 text-base"
              >
                Join Call
              </Button>
            </form>
          </Card>
        </div>

        {/* Quick Tips / Specs Bar */}
        <div className="rounded-[16px] bg-card border border-border p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 rounded-full bg-accent animate-ping" />
            <span>Nilaa RTC supports up to 15 HD video participants per meeting room.</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-foreground">
              <Clock className="h-4 w-4 text-accent" /> Auto-closes after 5 min empty
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
