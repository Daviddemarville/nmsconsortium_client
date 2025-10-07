"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Ni2bMeta = {
  title?: string;
  description_md?: string;
  signature?: string;
  balance_auec?: number | null;
  updated_at?: string | null;
  portrait_url?: string;
  vault_image_url?: string;
  vault_image_alt?: string;
};

type Props = {
  apiUrl?: string; // default: /api/ni2b
  className?: string;
};

export default function Ni2bCard({
  apiUrl = "/api/ni2b",
  className = "",
}: Props) {
  const [meta, setMeta] = useState<Ni2bMeta | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(apiUrl, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as Ni2bMeta | { error: string };
        if ("error" in json) throw new Error(json.error);
        if (alive) setMeta(json as Ni2bMeta);
      } catch (e) {
        if (alive) setErr((e as Error).message || "Erreur de chargement");
      }
    })();
    return () => {
      alive = false;
    };
  }, [apiUrl]);

  const formatDateOnly = (iso?: string | null) => {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso;
      return d.toLocaleDateString("fr-FR", {
        timeZone: "Europe/Paris",
        year: "numeric",
        month: "long",
        day: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  if (err) {
    return (
      <section
        className={`rounded-2xl bg-black/30 text-white p-6 md:p-8 ${className}`}
      >
        <h3 className="text-xl font-semibold">NI2B</h3>
        <p className="mt-3 text-sm text-red-400">
          Impossible de charger les informations ({err}).
        </p>
      </section>
    );
  }

  if (!meta) {
    return (
      <section
        className={`rounded-2xl bg-black/30 text-white p-6 md:p-8 ${className}`}
      >
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-3">
            <div className="h-6 w-64 bg-white/10 rounded" />
            <div className="h-4 w-full bg-white/10 rounded" />
            <div className="h-4 w-5/6 bg-white/10 rounded" />
            <div className="h-4 w-3/5 bg-white/10 rounded" />
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="h-5 w-40 bg-white/10 rounded" />
            <div className="mt-3 h-8 w-48 bg-white/10 rounded" />
            <div className="mt-3 h-4 w-36 bg-white/10 rounded" />
            <div className="mt-4 h-24 w-full bg-white/10 rounded" />
          </div>
        </div>
      </section>
    );
  }

  const {
    title = "NI2B — Banque communautaire du Consortium",
    description_md = "",
    signature,
    portrait_url,
    vault_image_url,
    vault_image_alt,
    balance_auec,
    updated_at,
  } = meta;

  const balanceValue: number =
    typeof balance_auec === "number" ? balance_auec : 0;

  return (
    <section
      className={`rounded-2xl bg-black/30 text-white p-6 md:p-8 shadow-lg ${className}`}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Colonne texte */}
        <div className="md:col-span-2">
          <header className="flex items-start gap-4">
            {portrait_url && (
              <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden border border-white/15 bg-white/5">
                <Image
                  src={portrait_url}
                  alt="Portrait de Craysus"
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
            )}
            <div>
              <h3 className="text-xl md:text-2xl font-semibold">{title}</h3>
              {signature && (
                <div className="mt-1 text-xs text-white/70">
                  Signé : {signature}
                </div>
              )}
            </div>
          </header>

          {description_md && (
            <div className="mt-4">
              <MarkdownLite text={description_md} />
            </div>
          )}
        </div>

        {/* Colonne “comptable” */}
        <aside className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="text-sm uppercase tracking-wide text-white/70">
            Solde NI2B
          </div>
          <div className="mt-2 text-3xl font-semibold tabular-nums">
            <CountUpNumber value={balanceValue} />
            <span className="ml-2">aUEC</span>
          </div>
          <div className="mt-1 text-xs text-white/60">
            Mise à jour : {formatDateOnly(updated_at)}
          </div>

          {vault_image_url && (
            <div className="mt-5 relative w-full h-48 md:h-56 rounded-lg overflow-hidden border border-white/10 bg-white/5">
              <Image
                src={vault_image_url}
                alt={
                  vault_image_alt ?? "Porte de coffre-fort (illustration NI2B)"
                }
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
                priority={false}
              />
              <div
                className="absolute inset-0 bg-black/25 md:bg-black/20"
                aria-hidden
              />
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

/* ================= Count-up animé et accessible ================= */
function CountUpNumber({
  value,
  duration = 5500,
}: {
  value: number;
  duration?: number;
}) {
  const [display, setDisplay] = useState<number>(0); // valeur initiale neutre (9 chiffres)
  const ref = useRef<HTMLSpanElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const toRef = useRef<number>(value);
  const inViewRef = useRef<boolean>(false);
  const displayRef = useRef<number>(0);

  const formatter = useMemo(() => new Intl.NumberFormat("fr-FR"), []);
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    displayRef.current = display;
  }, [display]);

  const cancelAnim = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const startAnim = useCallback(() => {
    cancelAnim();
    const start = performance.now();
    const from = displayRef.current;
    const to = toRef.current ?? 0;

    const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t);

    const step = (now: number) => {
      const elapsed = Math.min(1, (now - start) / duration);
      const k = easeOutQuad(elapsed);
      const curr = Math.round(from + (to - from) * k);
      setDisplay(curr);
      if (elapsed < 1) rafRef.current = requestAnimationFrame(step);
      else rafRef.current = null;
    };

    if (prefersReducedMotion) {
      setDisplay(to);
      return;
    }
    rafRef.current = requestAnimationFrame(step);
  }, [cancelAnim, duration, prefersReducedMotion]);

  // si la prop change, update la cible et relance si déjà visible
  useEffect(() => {
    toRef.current = value ?? 0;
    if (prefersReducedMotion || inViewRef.current) startAnim();
  }, [value, prefersReducedMotion, startAnim]);

  // observe l’entrée en vue + check immédiat
  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplay(value ?? 0);
      return;
    }
    const el = ref.current;
    if (!el) return;

    // ✅ check immédiat si déjà dans le viewport
    if (typeof window !== "undefined") {
      const rect = el.getBoundingClientRect();
      const vh =
        window.innerHeight || document.documentElement.clientHeight || 0;
      const inViewport = rect.top < vh && rect.bottom > 0;
      if (inViewport && !inViewRef.current) {
        inViewRef.current = true;
        startAnim();
      }
    }

    // ✅ observe les entrées dans le viewport (élément bloc)
    if (typeof IntersectionObserver !== "undefined") {
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting && !inViewRef.current) {
              inViewRef.current = true;
              startAnim();
              break;
            }
          }
        },
        { threshold: 0.1, rootMargin: "0px 0px -10% 0px" },
      );
      io.observe(el);
      return () => io.disconnect();
    }
  }, [prefersReducedMotion, startAnim, value]);

  useEffect(() => cancelAnim, [cancelAnim]);

  // A11y : zone live + équivalent texte caché
  return (
    <span ref={ref} aria-live="polite" className="inline-block align-middle">
      <span className="sr-only">{`${value} aUEC`}</span>
      {formatter.format(display)}
    </span>
  );
}

/* ===== Markdown lite (titres, listes, paragraphes) + [br] ===== */
function MarkdownLite({ text }: { text: string }) {
  const blocks = text
    .replace(/\r\n/g, "\n")
    .split(/\n{1,}/)
    .filter(Boolean);
  const parts = [...blocks];
  const nodes: React.ReactNode[] = [];

  for (let i = 0; i < parts.length; i++) {
    const raw = parts[i];
    const line = raw?.trim();
    if (!line) continue;

    if (line === "[br]") {
      nodes.push(<div key={`sp-${i}`} className="h-6" aria-hidden />);
      continue;
    }
    if (/^###\s+/.test(line)) {
      nodes.push(
        <h4 key={`h4-${line}-${i}`}>{line.replace(/^###\s+/, "")}</h4>,
      );
      continue;
    }
    if (/^##\s+/.test(line)) {
      nodes.push(<h3 key={`h3-${line}-${i}`}>{line.replace(/^##\s+/, "")}</h3>);
      continue;
    }
    if (/^#\s+/.test(line)) {
      nodes.push(<h2 key={`h2-${line}-${i}`}>{line.replace(/^#\s+/, "")}</h2>);
      continue;
    }

    if (/^(-|\u2022)\s+/.test(line)) {
      const items: string[] = [line.replace(/^(-|\u2022)\s+/, "")];
      let j = i + 1;
      while (j < parts.length && /^(-|\u2022)\s+/.test(parts[j].trim())) {
        items.push(parts[j].trim().replace(/^(-|\u2022)\s+/, ""));
        parts[j] = "";
        j++;
      }
      nodes.push(
        <ul key={`ul-${i}`} className="list-disc pl-6">
          {(() => {
            const counts = new Map<string, number>();
            return items.map((it) => {
              const c = (counts.get(it) ?? 0) + 1;
              counts.set(it, c);
              return <li key={`${it}-${c}`}>{it}</li>;
            });
          })()}
        </ul>,
      );
      continue;
    }

    nodes.push(<p key={`p-${line}-${i}`}>{line}</p>);
  }

  return (
    <div className="prose prose-invert max-w-none prose-p:my-3 prose-li:my-1">
      {nodes}
    </div>
  );
}
