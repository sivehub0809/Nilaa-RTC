"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Video, UserCheck, User, Keyboard, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
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
      toast.error("Please enter a valid meeting code");
      return;
    }

    setLoading(true);
    // Store guest name in sessionStorage for pre-join and meeting room
    if (typeof window !== "undefined") {
      sessionStorage.setItem("nilaa_guest_name", displayName.trim());
    }

    toast.success(`Joining room ${cleanCode} as ${displayName.trim()}`);
    router.push(`/${cleanCode}?guest=true&name=${encodeURIComponent(displayName.trim())}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
      {/* Brand Header */}
      <Link href="/" className="flex items-center gap-2 mb-8 group">
        <div className="flex h-10 w-10 items-center justify-center rounded-btn bg-accent text-accent-foreground font-bold shadow-cyan-glow group-hover:scale-105 transition-transform">
          <Video className="h-5 w-5 fill-current" />
        </div>
        <span className="font-heading text-2xl font-bold tracking-tight text-foreground">
          Nilaa <span className="text-accent">RTC</span>
        </span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="border-border bg-card">
          <CardHeader className="space-y-1 text-center pb-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 border border-accent/20 text-accent mb-2">
              <UserCheck className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
              Join as Guest
            </CardTitle>
            <CardDescription className="text-muted-foreground text-sm">
              No account or password needed. Enter your name and meeting code to join.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleGuestJoin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Your Display Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="e.g. Jordan"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    autoFocus
                    className="pl-10 h-11"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Meeting Code
                </label>
                <div className="relative">
                  <Keyboard className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="e.g. X7K9M2"
                    value={meetingCode}
                    onChange={(e) => setMeetingCode(e.target.value.toUpperCase())}
                    required
                    className="pl-10 h-11 uppercase font-mono tracking-wider"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="accent"
                className="w-full h-11 text-base font-semibold gap-2 mt-2"
                disabled={loading || !displayName.trim() || !meetingCode.trim()}
              >
                <span>Join Meeting</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-2 pt-2 text-center text-xs text-muted-foreground border-t border-border/60">
            <div>
              Want to host meetings or view past chats?{" "}
              <Link href="/login" className="text-accent hover:underline font-medium">
                Log In
              </Link>
              {" or "}
              <Link href="/signup" className="text-accent hover:underline font-medium">
                Sign Up
              </Link>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
