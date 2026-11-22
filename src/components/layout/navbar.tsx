"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { LogIn, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { type User as SupabaseUser } from "@supabase/supabase-js";

export function Navbar() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Check current auth user
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/80 backdrop-blur-md">
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
            <span className="font-heading text-lg font-bold tracking-tight text-foreground flex items-center gap-1.5">
              Nilaa <span className="text-accent font-extrabold">RTC</span>
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-3">
          {loading ? (
            <div className="h-9 w-24 animate-pulse rounded-btn bg-surface" />
          ) : user ? (
            <div className="flex items-center gap-2.5 sm:gap-3">
              <Link href="/home">
                <Button variant="accent" size="sm" className="gap-2 shadow-sm font-semibold">
                  <div className="h-4 w-4 relative flex items-center justify-center shrink-0">
                    <Image
                      src="/dashboard-icon.png"
                      alt="Dashboard"
                      width={16}
                      height={16}
                      className="object-contain brightness-0 invert"
                    />
                  </div>
                  <span>Meetings</span>
                </Button>
              </Link>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-btn bg-surface border border-border text-xs text-muted-foreground">
                <User className="h-3.5 w-3.5 text-accent" />
                <span className="truncate max-w-[140px] font-medium text-foreground">
                  {user.user_metadata?.display_name || user.email?.split("@")[0]}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link href="/guest">
                <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
                  Join as Guest
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs sm:text-sm">
                  <LogIn className="h-3.5 w-3.5" />
                  Log In
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="accent" size="sm" className="text-xs sm:text-sm">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
