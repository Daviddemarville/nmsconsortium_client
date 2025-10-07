// components/ui/RedactedOverlay.tsx
"use client";

import { motion } from "framer-motion";
import type React from "react";

type RedactedOverlayProps = {
  /** Active ou désactive le mode redacted */
  active?: boolean;
  children: React.ReactNode;
};

export default function RedactedOverlay({
  active = false,
  children,
}: RedactedOverlayProps) {
  // ✅ Option (4) : activation globale via variable d’environnement
  const globalRedacted =
    process.env.NEXT_PUBLIC_REDACTED_MODE === "true" || active;

  if (!globalRedacted) return <>{children}</>;

  return (
    <div className="relative overflow-hidden">
      {/* ✅ Contenu masqué (flouté et atténué) */}
      <div className="blur-sm select-none pointer-events-none opacity-50">
        {children}
      </div>

      {/* ✅ Scanlines RSI-style */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-10 pointer-events-none opacity-50 mix-blend-screen animate-scanlines"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              rgba(255, 0, 0, 0.25) 0px,
              rgba(255, 0, 0, 0.25) 2px,
              rgba(0, 0, 0, 0.9) 2px,
              rgba(0, 0, 0, 0.9) 4px
            )
          `,
        }}
      />

      {/* ✅ Tampon REDACTED animé + inclinaison dynamique au survol */}
      <motion.div
        initial={{ rotate: -8, opacity: 0 }}
        animate={{ rotate: -12, opacity: 1 }}
        whileHover={{ rotate: -8, scale: 1.05, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="absolute inset-0 z-20 flex items-center justify-center"
      >
        <span className="text-red-600/90 text-5xl md:text-7xl font-extrabold tracking-widest uppercase drop-shadow-[0_0_10px_rgba(255,0,0,0.6)] transition-transform duration-300 ease-in-out select-none">
          REDACTED
        </span>
      </motion.div>
    </div>
  );
}
