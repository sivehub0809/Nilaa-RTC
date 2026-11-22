"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/home");
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3 text-foreground">
      <Loader2 className="h-8 w-8 text-accent animate-spin" />
      <span className="text-sm text-muted-foreground">Loading your meetings...</span>
    </div>
  );
}
