"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";

/* =============== Types =============== */
type Edition = {
  id?: string;
  title?: string;
  cover?: string; // URL image de couverture
  href?: string; // lien vers l'édition (non utilisé ici)
};

type NgnMeta = {
  title?: string;
  description_md?: string;
  portrait_url?: string; // logo/portrait NGN
  editions?: Edition[];
};

type Member = {
  id?: number | string;
  handle: string;
  roles?: number[];
  units?: number[];
};

// 🔁 Normalisation des données NGN + membres + rôles
type RawMedia = { latest?: { id?: string; title?: string; img?: string; href?: string }[] };

type Role = { id: number; name: string };

type Props = {
  mediaUrl?: string; // default: "/data/ngn_media.json"
  membersUrl?: string; // default: "/data/members.json"
  rolesUrl?: string; // default: "/data/roles.json"
  className?: string;
  // filtres mini-liste
  roleIds?: number[]; // ex: [31, 32] (rédac, reporter…)
  roleIncludes?: string[]; // fallback: filtre par nom de rôle contient…
  unitIds?: number[]; // ex: [1] si tu associes NGN à une unit
  limit?: number; // ex: 6
  intervalMs?: number; // vitesse carousel (default 4000)
};

/* =============== Helpers =============== */
// 1px transparent (placeholder de dernier recours)
const PLACEHOLDER_DATA_URI =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

// Nettoie les query params éphémères de Discord (ex/is/hm …)
function sanitizeDiscordUrl(u: string): string {
  try {
    const url = new URL(u);
    const host = url.hostname;
    if (!/^(media\.discordapp\.net|cdn\.discordapp\.com)$/.test(host)) return u;

    const allowed = new Set(["width", "height", "format", "quality"]);
    const clean = new URL(url.origin + url.pathname);
    url.searchParams.forEach((v, k) => {
      if (allowed.has(k) && v) clean.searchParams.set(k, v);
    });
    return clean.toString();
  } catch {
    return u;
  }
}

// Force l’URL CDN “de base” (sans query), souvent la plus fiable
function toCdnBase(u: string): string {
  try {
    const url = new URL(u);
    if (url.hostname === "media.discordapp.net") url.hostname = "cdn.discordapp.com";
    return url.origin + url.pathname; // sans query
  } catch {
    return u;
  }
}

// Construit une liste de sources à essayer en cascade
function buildZoomSources(cover?: string): string[] {
  if (!cover) return [PLACEHOLDER_DATA_URI];
  const s1 = sanitizeDiscordUrl(cover);
  const s2 = toCdnBase(cover);
  // Évite les doublons et termine par un placeholder sûr
  const out = Array.from(new Set([s1, s2, cover, PLACEHOLDER_DATA_URI]));
  return out;
}

export default function NgnCard({
  mediaUrl = "/data/ngn_media.json",
  membersUrl = "/data/members.json",
  rolesUrl = "/data/roles.json",
  className = "",
  roleIds = [2],
  roleIncludes,
  unitIds,
  limit = 6,
  intervalMs = 6000,
}: Props) {
  const [meta, setMeta] = useState<NgnMeta | null>(null);
  const [editions, setEditions] = useState<Edition[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [err, setErr] = useState<string | null>(null);

  // fetch meta + members/roles
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [mRes, memRes, rRes] = await Promise.all([
          fetch(mediaUrl, { cache: "no-store" }),
          fetch(membersUrl, { cache: "no-store" }),
          fetch(rolesUrl, { cache: "no-store" }),
        ]);
        if (!mRes.ok) throw new Error(`NGN HTTP ${mRes.status}`);
        const mJson = (await mRes.json()) as NgnMeta | RawMedia;

        // 🔁 Editions: latest[].img -> cover
        const normalizedEditions: Edition[] =
          Array.isArray((mJson as RawMedia)?.latest)
            ? ((mJson as RawMedia).latest ?? []).map((e) => ({
                id: e.id,
                title: e.title,
                cover: e.img,
                href: e.href,
              }))
            : Array.isArray((mJson as NgnMeta)?.editions)
            ? ((mJson as NgnMeta).editions ?? [])
            : [];

        const memJson = memRes.ok ? ((await memRes.json()) as any[]) : [];
        const rJson = rRes.ok ? ((await rRes.json()) as any[]) : [];

        if (!alive) return;
        setMeta((mJson as NgnMeta) ?? {});
        setEditions(normalizedEditions);

        // 👥 handle = pseudo
        setMembers(
          (Array.isArray(memJson) ? memJson : []).map((m) => ({
            ...m,
            handle: m.handle ?? m.pseudo,
          })) as Member[],
        );

        // 🏷️ roles: id -> label
        setRoles(
          (Array.isArray(rJson) ? rJson : []).map((r) => ({
            id: r.id,
            name: r.label ?? r.name,
          })) as Role[],
        );
      } catch (e) {
        if (alive) setErr((e as Error).message || "Erreur de chargement");
      }
    })();
    return () => {
      alive = false;
    };
  }, [mediaUrl, membersUrl, rolesUrl]);

  // map roleId -> name
  const roleNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const r of roles) map.set(r.id, r.name);
    return map;
  }, [roles]);

  // filtre mini-liste
  const filtered = useMemo(() => {
    return members
      .filter((m) => {
        const hasRoleId =
          !roleIds || roleIds.length === 0
            ? true
            : (m.roles ?? []).some((rid) => roleIds?.includes(rid));
        const hasRoleName =
          !roleIncludes || roleIncludes.length === 0
            ? true
            : (m.roles ?? []).some((rid) => {
                const rn = roleNameById.get(rid as number) ?? "";
                return roleIncludes?.some((needle) =>
                  rn.toLowerCase().includes(needle.toLowerCase()),
                );
              });
        const hasUnit =
          !unitIds || unitIds.length === 0
            ? true
            : (m.units ?? []).some((uid) => unitIds?.includes(uid));
        return hasRoleId && hasRoleName && hasUnit;
      })
      .sort((a, b) => a.handle.localeCompare(b.handle, "fr"))
      .slice(0, limit);
  }, [members, roleIds, roleIncludes, unitIds, roleNameById, limit]);

  if (err) {
    return (
      <section className={`rounded-2xl bg-black/30 text-white p-6 md:p-8 ${className}`}>
        <h3 className="text-xl font-semibold">Nemesis Global News</h3>
        <p className="mt-2 text-sm text-red-400">Impossible de charger NGN ({err}).</p>
      </section>
    );
  }

  if (!meta) {
    return (
      <section className={`rounded-2xl bg-black/30 text-white p-6 md:p-8 ${className}`}>
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-3">
            <div className="h-6 w-72 bg-white/10 rounded" />
            <div className="h-4 w-full bg-white/10 rounded" />
            <div className="h-4 w-4/5 bg-white/10 rounded" />
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 h-40" />
        </div>
      </section>
    );
  }

  const {
    title = "Nemesis Global News",
    description_md = "",
    portrait_url,
  } = meta;

  return (
    <section className={`rounded-2xl bg-black/30 text-white p-6 md:p-8 shadow-lg ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Colonne texte */}
        <div className="md:col-span-2">
          <header className="flex items-start gap-4">
            {portrait_url && (
              <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden border border-white/15 bg-white/90">
                <Image
                  src={portrait_url}
                  alt="Logo/portrait NGN"
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
            )}
            <div>
              <h3 className="text-xl md:text-2xl font-semibold">{title}</h3>
              <p className="mt-1 text-xs uppercase tracking-wide text-white/60">
                Média interne — style « gazette »
              </p>
            </div>
          </header>

          {description_md && (
            <div className="mt-4">
              <MarkdownLite text={description_md} />
            </div>
          )}

          {/* Mini-liste membres */}
          {filtered.length > 0 && (
            <div className="mt-5">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-white/70">
                Rédaction
              </h4>
              <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                {filtered.map((m) => (
                  <li key={String(m.id ?? m.handle)} className="flex items-center gap-2">
                    <span className="font-medium">{m.handle}</span>
                    <span className="text-white/60">—</span>
                    <span className="text-white/80 truncate">
                      {(m.roles ?? [])
                        .map((rid) => roleNameById.get(rid as number))
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Colonne carousel */}
        <aside className="relative rounded-xl border border-white/10 bg-white/5 p-0 overflow-hidden">
          <EditionsCarousel editions={editions} intervalMs={intervalMs} />
        </aside>
      </div>
    </section>
  );
}

/* ===== Carousel NGN (auto, réduit si prefers-reduced-motion) ===== */
function EditionsCarousel({
  editions,
  intervalMs = 4000,
}: { editions: Edition[]; intervalMs?: number }) {
  const [idx, setIdx] = useState(0);
  const [hover, setHover] = useState(false);
  const [visible, setVisible] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const len = editions.length;

  // SSR-safe prefers-reduced-motion
  useEffect(() => {
    const mq =
      typeof window !== "undefined" && window.matchMedia
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;
    const apply = () => setReduced(!!mq?.matches);
    apply();
    mq?.addEventListener?.("change", apply);
    return () => mq?.removeEventListener?.("change", apply);
  }, []);

  // Page visibility
  useEffect(() => {
    const onVis = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    onVis();
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Intersection: autoplay only if visible in viewport
  useEffect(() => {
    if (!wrapRef.current) return;
    const obs = new IntersectionObserver(
      (entries) => setVisible(entries[0]?.isIntersecting ?? true),
      { threshold: 0.2 },
    );
    obs.observe(wrapRef.current);
    return () => obs.disconnect();
  }, []);

  // Autoplay + progress bar
  useEffect(() => {
    if (len <= 1 || reduced || hover || !visible || zoomOpen) return;
    if (progressRef.current) {
      progressRef.current.style.transition = "none";
      progressRef.current.style.width = "0%";
      requestAnimationFrame(() => {
        if (!progressRef.current) return;
        progressRef.current.style.transition = `width ${intervalMs}ms linear`;
        progressRef.current.style.width = "100%";
      });
    }
    timerRef.current = window.setTimeout(() => setIdx((i) => (i + 1) % len), intervalMs);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (progressRef.current) {
        progressRef.current.style.transition = "none";
        progressRef.current.style.width = "0%";
      }
    };
  }, [idx, len, reduced, hover, visible, intervalMs, zoomOpen]);

  const goto = useCallback(
    (i: number) => {
      setIdx((i + len) % len);
    },
    [len],
  );

  // Keyboard nav
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (zoomOpen) {
        if (e.key === "Escape") setZoomOpen(false);
        if (e.key === "ArrowRight") goto(idx + 1);
        if (e.key === "ArrowLeft") goto(idx - 1);
        return;
      }
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(document.activeElement)) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goto(idx + 1);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goto(idx - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goto, idx, zoomOpen]);

  // Swipe (ignore boutons/liens/SVG)
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    let startX = 0,
      moved = false;

    const isInteractive = (t: EventTarget | null) => t instanceof Element && !!(t as Element).closest("button, a");

    const down = (e: PointerEvent) => {
      if (isInteractive(e.target)) return;
      startX = e.clientX;
      moved = false;
      el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (isInteractive(e.target)) return;
      if (Math.abs(e.clientX - startX) > 24) moved = true;
    };
    const up = (e: PointerEvent) => {
      if (!isInteractive(e.target)) {
        const dx = e.clientX - startX;
        if (moved && Math.abs(dx) > 36) goto(idx + (dx < 0 ? 1 : -1));
        el.releasePointerCapture?.(e.pointerId);
      }
    };

    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
    };
  }, [goto, idx]);

  // Lightbox: lock scroll + focus bouton fermer
  useEffect(() => {
    if (!zoomOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, [zoomOpen]);

  if (len === 0) {
    return (
      <div className="h-40 md:h-full grid place-items-center text-white/60 text-sm">
        Aucune édition pour le moment
      </div>
    );
  }

  const current = editions[idx];
  const keyFor = (e: Edition) => e.id ?? e.cover ?? e.title ?? JSON.stringify(e);

  // Sources d'image pour le zoom (avec fallback auto en cas de 404)
  const zoomSources = useMemo(() => buildZoomSources(current?.cover), [current?.cover]);
  const [zoomSrcIdx, setZoomSrcIdx] = useState(0);
  useEffect(() => {
    setZoomSrcIdx(0); // reset quand on change d'édition
  }, [idx, current?.cover]);
  const zoomSrc = zoomSources[zoomSrcIdx] ?? PLACEHOLDER_DATA_URI;

  return (
    <div
      ref={wrapRef}
      role="group"
      aria-roledescription="carousel"
      aria-label="Éditions Nemesis Global News"
      aria-live="polite"
      tabIndex={0}
      className="relative h-40 md:h-full outline-none"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Progress bar */}
      <div className="absolute z-20 top-0 left-0 right-0 h-0.5 bg-black/20">
        <div ref={progressRef} className="h-full w-0 bg-black/80" />
      </div>

      {/* ambiance */}
      <div className="absolute inset-0 bg-amber-900/10 mix-blend-multiply pointer-events-none" aria-hidden />
      <div
        className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:3px_3px] pointer-events-none"
        aria-hidden
      />

      {/* Image cliquable -> ouvre le zoom (pas de lien) */}
      {current?.cover ? (
        <button
          type="button"
          onClick={() => setZoomOpen(true)}
          className="block relative h-full z-10 focus:outline-none w-full text-left"
          aria-label={`Agrandir l’édition ${current.title ?? ""}`}
        >
          <Image
            key={keyFor(current)}
            src={current.cover}
            alt={current.title ?? "Édition"}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
            priority={idx === 0}
          />
          <div className="pointer-events-none absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
            <div className="text-xs uppercase tracking-wide text-white/80">Édition</div>
            <div className="text-sm font-medium line-clamp-2">{current.title ?? "Numéro spécial"}</div>
          </div>
        </button>
      ) : (
        <div className="h-full grid place-items-center">Édition sans visuel</div>
      )}

      {/* Prev/Next */}
      {len > 1 && (
        <div className="absolute inset-0 z-50 pointer-events-none">
          <button
            type="button"
            aria-label="Édition précédente"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => goto(idx - 1)}
            className="absolute left-1 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full
                       bg-black/40 hover:bg-black/60 backdrop-blur flex items-center justify-center
                       text-white focus:ring-2 ring-white/60 pointer-events-auto"
          >
            <MdChevronLeft size={22} />
          </button>

          <button
            type="button"
            aria-label="Édition suivante"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => goto(idx + 1)}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full
                       bg-black/40 hover:bg-black/60 backdrop-blur flex items-center justify-center
                       text-white focus:ring-2 ring-white/60 pointer-events-auto"
          >
            <MdChevronRight size={22} />
          </button>
        </div>
      )}

      {/* Lightbox plein écran */}
      {zoomOpen && current?.cover && (
        <div
          className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={current.title ?? "Agrandissement de l’édition"}
          onClick={() => setZoomOpen(false)}
        >
          {/* Bouton fermer */}
          <button
            ref={closeBtnRef}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setZoomOpen(false);
            }}
            className="absolute top-3 right-3 z-[1000] h-10 w-10 rounded-full bg-black/60 hover:bg-black/80
                       text-white grid place-items-center focus:ring-2 ring-white/60"
            aria-label="Fermer l’aperçu"
          >
            {/* croix minimaliste */}
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          {/* Conteneur image (stop propagation pour éviter de fermer en cliquant sur l'image) */}
          <div className="absolute inset-0 p-4 md:p-8" onClick={(e) => e.stopPropagation()}>
            <div className="relative h-full w-full">
              {/* <img> natif avec cascade de fallbacks */}
              <img
                key={zoomSrc} // force le re-render si on change de source
                src={zoomSrc}
                alt={current.title ?? "Édition agrandie"}
                className="h-full w-full object-contain"
                referrerPolicy="no-referrer"
                onError={() => setZoomSrcIdx((i) => Math.min(i + 1, zoomSources.length - 1))}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== Markdown lite ===== */
function MarkdownLite({ text }: { text: string }) {
  const blocks = text.replace(/\r\n/g, "\n").split(/\n{1,}/).filter(Boolean);
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
      nodes.push(<h4 key={`h4-${line}-${i}`}>{line.replace(/^###\s+/, "")}</h4>);
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
            const c = new Map<string, number>();
            return items.map((it) => {
              const n = (c.get(it) ?? 0) + 1;
              c.set(it, n);
              return <li key={`${it}-${n}`}>{it}</li>;
            });
          })()}
        </ul>,
      );
      continue;
    }
    nodes.push(<p key={`p-${line}-${i}`}>{line}</p>);
  }
  return <div className="prose prose-invert max-w-none prose-p:my-3 prose-li:my-1">{nodes}</div>;
}
