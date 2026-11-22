"use client";

import { AnimatePresence, motion } from "framer-motion";
import { UserCheck, UserMinus } from "lucide-react";

export interface PresenceNotification {
  id: string;
  name: string;
  type: "joined" | "left";
}

interface PresenceToastProps {
  notifications: PresenceNotification[];
}

export function PresenceToast({ notifications }: PresenceToastProps) {
  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="sync">
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 60, scale: 0.92 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.92 }}
            transition={{ type: "spring", damping: 22, stiffness: 300 }}
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-[14px] border shadow-lg backdrop-blur-md text-sm font-medium"
            style={{
              background:
                n.type === "joined"
                  ? "linear-gradient(135deg, rgba(96,165,250,0.18) 0%, rgba(147,197,253,0.14) 100%)"
                  : "linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(167,139,250,0.14) 100%)",
              borderColor:
                n.type === "joined"
                  ? "rgba(96,165,250,0.35)"
                  : "rgba(139,92,246,0.35)",
              color: "#F2F4F8",
            }}
          >
            {n.type === "joined" ? (
              <UserCheck
                className="h-4 w-4 shrink-0"
                style={{ color: "#60A5FA" }}
              />
            ) : (
              <UserMinus
                className="h-4 w-4 shrink-0"
                style={{ color: "#A78BFA" }}
              />
            )}
            <span className="truncate max-w-[160px]">
              <span className="font-semibold">{n.name}</span>{" "}
              <span className="opacity-80">
                {n.type === "joined" ? "joined the meeting" : "left the meeting"}
              </span>
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
