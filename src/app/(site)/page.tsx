"use client";

import { useEffect, useState } from "react";
import Hero from "@/components/sections/Hero";
import DiscordButton from "@/components/ui/DiscordButton";
import ReferralCTA from "@/components/ui/ReferralCTA";

export default function HomePage() {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      setShowContent(true); // pas d’attente pour ces utilisateurs
      return;
    }

    const t = setTimeout(() => setShowContent(true), 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <div
        data-logo-dock
        className="fixed left-2 top-[36px] w-80 h-80 pointer-events-none"
        aria-hidden="true"
      />

      <Hero />

      <main className="container mx-auto px-4">
        <section
          className={`py-12 md:py-16 text-center transition-opacity duration-700 ${
            showContent ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <p className="text-xs opacity-70">
            Cliquez sur l’emblème pour entrer. (Entrée / Espace au clavier)
          </p>
          <h1 className="mt-4 text-4xl md:text-5xl font-extrabold">
            Bienvenue au Nemesis Consortium
          </h1>
          <p className="mt-4 leading-relaxed">
            <a href="/corpos" className="hover:text-nms-gold">
              NMS CONSORTIUM
            </a>{" "}
            réunit ses corpos filles :
          </p>

          {/* Fallback navigation textuelle vers consortium + corpos */}
          <nav
            aria-label="Navigation vers consortium et corpos"
            className="mt-4 flex flex-wrap justify-center gap-3"
          >
            <a
              href="/corpos/eclipse"
              className="inline-flex items-center rounded-full border border-white/10 bg-background/70 backdrop-blur px-4 py-2 text-sm font-semibold hover:bg-nms-gold hover:text-nms-dark transition"
            >
              ECLIPSE
            </a>
            <a
              href="/corpos/pulse"
              className="inline-flex items-center rounded-full border border-white/10 bg-background/70 backdrop-blur px-4 py-2 text-sm font-semibold hover:bg-nms-gold hover:text-nms-dark transition"
            >
              PULSE
            </a>
            <a
              href="/corpos/nasa"
              className="inline-flex items-center rounded-full border border-white/10 bg-background/70 backdrop-blur px-4 py-2 text-sm font-semibold hover:bg-nms-gold hover:text-nms-dark transition"
            >
              NASA
            </a>
            <a
              href="/corpos/core"
              className="inline-flex items-center rounded-full border border-white/10 bg-background/70 backdrop-blur px-4 py-2 text-sm font-semibold hover:bg-nms-gold hover:text-nms-dark transition"
            >
              CORE
            </a>
            <a
              href="/corpos/rtt"
              className="inline-flex items-center rounded-full border border-white/10 bg-background/70 backdrop-blur px-4 py-2 text-sm font-semibold hover:bg-nms-gold hover:text-nms-dark transition"
            >
              RTT
            </a>
            <a
              href="/corpos/nsf"
              className="inline-flex items-center rounded-full border border-white/10 bg-background/70 backdrop-blur px-4 py-2 text-sm font-semibold hover:bg-nms-gold hover:text-nms-dark transition"
            >
              NSF
            </a>
          </nav>
          <p className="mt-4 leading-relaxed">
            Que vous soyez nouveau, membre fidèle ou simple visiteur, vous
            trouverez entraide, intégration et events RP aux côtés de nos corpos
            alliées.
          </p>

          {/* Bouton Discord */}
          <DiscordButton
            inviteUrl="https://discord.gg/FYmSmhRjW9"
            location="accueil-page"
            className="bg-nms-gold text-nms-dark font-semibold hover:opacity-90 transition"
          />

          {/* Code de parrainage */}
          <div className="mt-6 flex justify-center">
            <ReferralCTA />
          </div>
        </section>
      </main>
    </>
  );
}
