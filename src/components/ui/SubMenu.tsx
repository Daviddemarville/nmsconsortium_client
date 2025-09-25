// src/components/ui/SubMenu.tsx
"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Item = { id: string; label: string };

const LABELS: Record<string, string> = {
  pres_rp: "Présentation RP",
  pres_officiel: "Présentation officielle",
  diplomatie: "Diplomatie",
  ni2b: "NI2B",
  nsf: "NSF",
  aion: "AION",
  ngn: "NGN",
};

const ORDER = [
  "pres_rp",
  "pres_officiel",
  "diplomatie",
  "ni2b",
  "nsf",
  "aion",
  "ngn",
];

const ALLOWED_PATHS = new Set([
  "/corpos",
  "/corpos/nsf",
  "/corpos/core",
  "/corpos/eclipse",
  "/corpos/nasa",
  "/corpos/rtt",
  "/corpos/pulse",
]);

export default function SubMenu() {
  const pathname = usePathname();
  const enabled = useMemo(
    () => !!pathname && ALLOWED_PATHS.has(pathname),
    [pathname],
  );

  const [items, setItems] = useState<Item[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const scrollerRef = useRef<HTMLUListElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  // Détecter les sections présentes
  // biome-ignore lint/correctness/useExhaustiveDependencies: besoin de pathname pour redéclencher lors d'un changement de route
  useEffect(() => {
    if (!enabled) return;
    const present = ORDER.filter((id) => document.getElementById(id)).map(
      (id) => ({ id, label: LABELS[id] ?? id }),
    );
    setItems(present);
  }, [enabled, pathname]);

  // Observer la section active
  useEffect(() => {
    if (!enabled || items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActiveId(visible.target.id);
      },
      { rootMargin: "0px 0px -60% 0px", threshold: [0.1, 0.25, 0.5, 0.75, 1] },
    );

    const nodes = items
      .map((it) => document.getElementById(it.id))
      .filter(Boolean) as Element[];

    nodes.forEach((n) => {
      observer.observe(n);
    });

    return () => observer.disconnect();
  }, [enabled, items]);

  // Calculer l'état des flèches (overflow + position)
  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth - 1;
    setCanLeft(el.scrollLeft > 0);
    setCanRight(el.scrollLeft < max);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    updateArrows();
    const el = scrollerRef.current;
    if (!el) return;

    el.addEventListener("scroll", updateArrows, { passive: true });
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);

    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      ro.disconnect();
      window.removeEventListener("resize", updateArrows);
    };
  }, [enabled, updateArrows]);

  if (!enabled || items.length === 0) return null;

  const onClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
    if (!["ArrowLeft", "ArrowRight"].includes(e.key)) return;
    const delta = e.key === "ArrowRight" ? 160 : -160;
    scrollerRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  };

  const nudge = (dir: "left" | "right") => {
    const delta = dir === "right" ? 280 : -280;
    scrollerRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <nav aria-label="Sections de la page" className="relative w-full">
      <ul
        ref={scrollerRef}
        onKeyDown={onKeyDown}
        className={[
          "flex items-center gap-3 px-4 py-2 text-sm overflow-x-auto whitespace-nowrap snap-x snap-mandatory",
          "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          "md:justify-center md:text-base md:px-6 md:mx-auto md:max-w-6xl",
        ].join(" ")}
      >
        {items.map((it) => {
          const isActive = activeId === it.id;
          return (
            <li key={it.id} className="snap-start">
              <a
                aria-current={isActive ? "true" : undefined}
                href={`#${it.id}`}
                onClick={(e) => onClick(e, it.id)}
                className={[
                  "inline-block px-2 py-1 transition-opacity rounded-md",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
                  isActive
                    ? "font-semibold underline underline-offset-4"
                    : "opacity-75 hover:opacity-100 hover:underline hover:underline-offset-4",
                ].join(" ")}
              >
                {it.label}
              </a>
            </li>
          );
        })}
      </ul>

      {canLeft && (
        <button
          type="button"
          onClick={() => nudge("left")}
          aria-label="Faire défiler le menu vers la gauche"
          className={[
            "absolute left-1 top-1/2 -translate-y-1/2 p-1 rounded-md",
            "bg-black/20 hover:bg-black/30 transition",
            "backdrop-blur-sm",
            "md:left-4",
          ].join(" ")}
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
      )}

      {canRight && (
        <button
          type="button"
          onClick={() => nudge("right")}
          aria-label="Faire défiler le menu vers la droite"
          className={[
            "absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-md",
            "bg-black/20 hover:bg-black/30 transition",
            "backdrop-blur-sm",
            "md:right-4",
          ].join(" ")}
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      )}
    </nav>
  );
}
