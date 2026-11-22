"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function HomePageRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3 text-foreground">
      <Loader2 className="h-8 w-8 text-accent animate-spin" />
      <span className="text-sm text-muted-foreground">Opening your dashboard...</span>
    </div>
  );
}
