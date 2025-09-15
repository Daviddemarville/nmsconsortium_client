"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import ReferralCTA from "@/components/ui/ReferralCTA";

// Positions autour du logo central
const HOTSPOTS = [
  {
    label: "ECLIPSE",
    href: "/corpos/eclipse",
    top: "18%",
    left: "50%",
    logo: "/images/corpos/eclipse.png",
  }, // N
  {
    label: "PULSE",
    href: "/corpos/pulse",
    top: "30%",
    left: "78%",
    logo: "/images/corpos/pulse.png",
  }, // NE
  {
    label: "NASA",
    href: "/corpos/nasa",
    top: "72%",
    left: "78%",
    logo: "/images/corpos/nasa.png",
  }, // SE
  {
    label: "CORE",
    href: "/corpos/core",
    top: "82%",
    left: "50%",
    logo: "/images/corpos/core.png",
  }, // S
  {
    label: "RTT",
    href: "/corpos/rtt",
    top: "72%",
    left: "22%",
    logo: "/images/corpos/rtt.png",
  }, // SW
  {
    label: "NSF",
    href: "/corpos/nsf",
    top: "30%",
    left: "22%",
    logo: "/images/corpos/nsf.png",
  }, // NW
] as const;

export default function Hero() {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [revealIndex, setRevealIndex] = useState<number | null>(null); // ← logo révélé

  // Affiche le reste après 3s
  useEffect(() => {
    const t = setTimeout(() => setShowContent(true), 3000);
    return () => clearTimeout(t);
  }, []);

  // fin anim → route
  const handleAnimationEnd = useCallback(() => {
    if (leaving) router.push("/consortium");
  }, [leaving, router]);

  // clavier : Enter/Espace → entrer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!leaving && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        setLeaving(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [leaving]);

  return (
    <section className="relative isolate">
      <div className="mx-auto grid min-h-[88svh] place-items-center text-center px-4 pt-6 pb-28">
        {/* Logo central + zones cliquables */}
        <div
          className={[
            "hero-logo select-none relative",
            leaving ? "animate-hero-leave" : "animate-hero-arrival",
          ].join(" ")}
          onAnimationEnd={handleAnimationEnd}
        >
          <Image
            src="/images/LOGOS-ORGAS-2_global.png"
            alt="Logo global du Consortium NMS"
            fill
            sizes="(max-width: 768px) 90vw, 48vw"
            className="object-contain p-4 md:p-6"
            priority
          />

          {/* Centre → /consortium */}
          <button
            type="button"
            aria-label="Entrer — aller au Consortium"
            title="Entrer — aller au Consortium"
            onClick={() => setLeaving(true)}
            className="absolute left-1/2 top-1/2 h-[40%] w-[40%] -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white/0 transition
                       hover:ring-white/30 focus-visible:ring-nms-gold"
          />

          {/* Logos des corpos : cachés par défaut, révélés individuellement */}
          {showContent &&
            HOTSPOTS.map((h, i) => {
              const active = revealIndex === i;
              return (
                <Link
                  key={h.href}
                  href={h.href}
                  aria-label={`Aller à ${h.label}`}
                  title={h.label}
                  // zone cliquable toujours présente (même quand le logo est invisible)
                  className="group absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full overflow-hidden
                             ring-2 ring-white/0 hover:ring-nms-gold/70 focus-visible:ring-nms-gold
                             transition will-change-transform hotspot-size"
                  style={{ top: h.top, left: h.left }}
                  onMouseEnter={() => setRevealIndex(i)} // hover individuel (desktop)
                  onMouseLeave={() => setRevealIndex(null)}
                  onTouchStart={() => setRevealIndex(i)} // 1er tap: révèle
                  onClick={(e) => {
                    if (!active) {
                      e.preventDefault(); // empêche la nav au 1er tap
                      setRevealIndex(i);
                    }
                  }}
                >
                  {/* support de lisibilité */}
                  <span
                    className={[
                      "absolute inset-0 rounded-full bg-background/30 backdrop-blur-sm transition-opacity",
                      active ? "opacity-100" : "opacity-0",
                      "group-hover:opacity-100",
                    ].join(" ")}
                  />
                  {/* logo : apparaît au hover de CET élément ou si actif */}
                  <Image
                    src={h.logo}
                    alt={`${h.label} logo`}
                    fill
                    sizes="25vw"
                    className={[
                      "object-contain p-[8%] transition-all duration-300",
                      active ? "opacity-100 scale-100" : "opacity-0 scale-90",
                      "group-hover:opacity-100 group-hover:scale-100",
                    ].join(" ")}
                  />
                </Link>
              );
            })}
        </div>

        {/* Contenu (fade-in après 3s) */}
        <div
          className={
            showContent
              ? "hero-content-enter mt-16 md:mt-20 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
              : "opacity-0 pointer-events-none mt-16 md:mt-20"
          }
        >
          <h1 className="text-4xl md:text-5xl font-extrabold">
            Bienvenue sur le Consortium NMS
          </h1>

          <p className="mt-4 opacity-90">
            Cliquez sur l’emblème pour entrer. (Entrée / Espace au clavier)
          </p>

          <p className="mt-2 opacity-90 leading-relaxed">
            NEMESIS CONSORTIUM regroupe les corpos filles&nbsp;:
          </p>

          {/* Pastilles texte — desktop seulement (optionnel) */}
          <nav
            aria-label="Corpos filles"
            className="mt-4 hidden md:flex flex-wrap justify-center gap-3"
          >
            {HOTSPOTS.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="inline-flex items-center rounded-full border border-white/10 bg-background/70 backdrop-blur px-4 py-2 text-sm font-semibold hover:bg-nms-gold hover:text-nms-dark transition"
              >
                {c.label}
              </Link>
            ))}
          </nav>

          <p className="mt-4 opacity-90 leading-relaxed">
            Intégration des nouveaux, entraide, et events RP avec les corpos
            amies.
          </p>

          <a
            href="https://discord.gg/FYmSmhRjW9"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Rejoindre le Discord NMS"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-nms-gold text-nms-dark px-5 py-2.5 font-semibold hover:opacity-90 transition"
          >
            DISCORD NEMESIS
          </a>

          <div>
            <ReferralCTA className="mt-6" />
          </div>
        </div>
      </div>
    </section>
  );
}
