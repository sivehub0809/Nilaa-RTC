"use client";

import { motion, AnimatePresence } from "framer-motion";

export interface FloatingReaction {
  id: string;
  emoji: string;
  xOffset: number; // percentage across screen (10% - 90%)
  senderName?: string;
}

interface ReactionsOverlayProps {
  reactions: FloatingReaction[];
}

export function ReactionsOverlay({ reactions }: ReactionsOverlayProps) {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <AnimatePresence>
        {reactions.map((r) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 0, scale: 0.5, x: `${r.xOffset}vw` }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: -window.innerHeight * 0.7,
              scale: [0.5, 1.4, 1.2, 0.9],
              rotate: [0, -10, 10, -5, 0],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 2.8,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            className="absolute bottom-16 flex flex-col items-center"
          >
            <span className="text-4xl sm:text-5xl drop-shadow-lg filter select-none">
              {r.emoji}
            </span>
            {r.senderName && (
              <span className="mt-1 px-2 py-0.5 rounded-full bg-card/80 border border-border text-[10px] text-foreground font-medium shadow-md">
                {r.senderName}
              </span>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
