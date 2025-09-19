"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

// Positions autour du logo central
const HOTSPOTS = [
  {
    label: "ECLIPSE",
    href: "/corpos/eclipse",
    top: "10%",
    left: "50%",
    logo: "/images/corpos/eclipse.png",
  }, // N
  {
    label: "PULSE",
    href: "/corpos/pulse",
    top: "25%",
    left: "90%",
    logo: "/images/corpos/pulse.png",
  }, // NE
  {
    label: "NASA",
    href: "/corpos/nasa",
    top: "66%",
    left: "90%",
    logo: "/images/corpos/nasa.png",
  }, // SE
  {
    label: "CORE",
    href: "/corpos/core",
    top: "85%",
    left: "50%",
    logo: "/images/corpos/core.png",
  }, // S
  {
    label: "RTT",
    href: "/corpos/rtt",
    top: "66%",
    left: "13%",
    logo: "/images/corpos/rtt.png",
  }, // SW
  {
    label: "NSF",
    href: "/corpos/nsf",
    top: "25%",
    left: "13%",
    logo: "/images/corpos/nsf.png",
  }, // NW
] as const;

export default function Hero() {
  const router = useRouter();
  const heroRef = useRef<HTMLDivElement>(null);
  const [leaving, setLeaving] = useState(false);
  const [showContent, setShowContent] = useState(false);

  // Affiche les éléments orbitaux (logos corpos) après 3s
  useEffect(() => {
    const t = setTimeout(() => setShowContent(true), 3000);
    return () => clearTimeout(t);
  }, []);

  // Vol précis du logo central vers la cible [data-logo-dock]
  const startFlightToDock = useCallback(() => {
    const hero = heroRef.current;
    const dock = document.querySelector<HTMLElement>("[data-logo-dock]");
    if (!hero || !dock) {
      setLeaving(true);
      return;
    }

    const h = hero.getBoundingClientRect();
    const d = dock.getBoundingClientRect();

    const heroCx = h.left + h.width / 2;
    const heroCy = h.top + h.height / 2;
    const dockCx = d.left + d.width / 2;
    const dockCy = d.top + d.height / 2;

    hero.style.setProperty("--fly-x", `${dockCx - heroCx}px`);
    hero.style.setProperty("--fly-y", `${dockCy - heroCy}px`);

    setLeaving(true);
  }, []);

  // Anim de vol des logos de corpos + nav
  const flyAndNavigate = useCallback(
    (evt: React.MouseEvent<HTMLElement>, href: string) => {
      const dock = document.querySelector<HTMLElement>("[data-logo-dock]");
      const target = evt.currentTarget as HTMLElement;
      if (!dock || !target) {
        router.push(href);
        return;
      }

      const img = target.querySelector(
        "img, picture, [data-img]",
      ) as HTMLElement | null;
      const srcEl = img ?? target;

      const r = srcEl.getBoundingClientRect();
      const d = dock.getBoundingClientRect();

      const fromX = r.left + r.width / 2;
      const fromY = r.top + r.height / 2;
      const toX = d.left + d.width / 2;
      const toY = d.top + d.height / 2;

      // clone visuel
      const clone = srcEl.cloneNode(true) as HTMLElement;
      clone.classList.add("fly-clone");
      clone.style.left = `${fromX - r.width / 2}px`;
      clone.style.top = `${fromY - r.height / 2}px`;
      clone.style.width = `${r.width}px`;
      clone.style.height = `${r.height}px`;
      clone.style.setProperty("--fly-x", `${toX - fromX}px`);
      clone.style.setProperty("--fly-y", `${toY - fromY}px`);
      clone.style.setProperty("--clone-scale", "5");

      document.body.appendChild(clone);
      clone.classList.add("fly-animate");

      clone.addEventListener(
        "animationend",
        () => {
          clone.remove();
          router.push(href);
        },
        { once: true },
      );
    },
    [router],
  );

  // Fin d’anim du logo central → route /consortium
  const handleAnimationEnd = useCallback(() => {
    if (leaving) router.push("/corpos");
  }, [leaving, router]);

  // Accessibilité clavier : Enter / Espace
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!leaving && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        startFlightToDock();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [leaving, startFlightToDock]);

  return (
    <section className="relative isolate">
      <div className="mx-auto grid min-h-[58svh] place-items-center text-center px-4 pt-6 pb-28">
        {/* Logo central + zones cliquables */}
        <div
          ref={heroRef}
          className={[
            "hero-logo select-none relative",
            leaving ? "animate-hero-leave-exact" : "animate-hero-arrival",
          ].join(" ")}
          onAnimationEnd={handleAnimationEnd}
        >
          <Image
            src="/images/logo_consortium.png"
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
            onClick={startFlightToDock}
            className="absolute left-1/2 top-1/2 h-[40%] w-[40%] -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white/0 transition
                       hover:ring-white/30 focus-visible:ring-nms-gold"
          />

          {/* Logos des corpos (affichés après 3s) */}
          {showContent &&
            HOTSPOTS.map((h) => (
              <Link
                key={h.href}
                href={h.href}
                aria-label={`Aller à ${h.label}`}
                title={h.label}
                className="group absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full hotspot-size
                           ring-2 ring-white/0 transition will-change-transform
                           hover:ring-nms-gold/70 focus-visible:ring-nms-gold
                           hover:scale-[1.06] active:scale-95 motion-reduce:hover:scale-100"
                style={{ top: h.top, left: h.left }}
                onClick={(e) => {
                  e.preventDefault();
                  flyAndNavigate(e, h.href);
                }}
              >
                <Image
                  src={h.logo}
                  alt={`${h.label} logo`}
                  fill
                  sizes="25vw"
                  className="object-contain p-[8%] opacity-100 scale-100 transition-all duration-200
                             group-hover:drop-shadow-[0_0_12px_rgba(212,175,55,0.7)]
                             group-active:drop-shadow-[0_0_0_rgba(0,0,0,0)]
                             motion-reduce:transition-none"
                />
              </Link>
            ))}
        </div>
      </div>
    </section>
  );
}
