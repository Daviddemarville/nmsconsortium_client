"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

/* =============== Types =============== */
type Edition = {
  id?: string;
  title?: string;
  cover?: string; // URL image de couverture
  href?: string; // lien vers l'édition
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

export default function NgnCard({
  mediaUrl = "/data/ngn_media.json",
  membersUrl = "/data/members.json",
  rolesUrl = "/data/roles.json",
  className = "",
  roleIds = [2],
  roleIncludes,
  unitIds,
  limit = 6,
  intervalMs = 4000,
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
        const mJson = (await mRes.json()) as NgnMeta;
        const memJson = memRes.ok ? ((await memRes.json()) as Member[]) : [];
        const rJson = rRes.ok ? ((await rRes.json()) as Role[]) : [];

        if (!alive) return;
        setMeta(mJson ?? {});
        setEditions(
          Array.isArray(mJson?.editions) ? (mJson?.editions ?? []) : [],
        );
        setMembers(Array.isArray(memJson) ? memJson : []);
        setRoles(Array.isArray(rJson) ? rJson : []);
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
      <section
        className={`rounded-2xl bg-black/30 text-white p-6 md:p-8 ${className}`}
      >
        <h3 className="text-xl font-semibold">Nemesis Global News</h3>
        <p className="mt-2 text-sm text-red-400">
          Impossible de charger NGN ({err}).
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
    <section
      className={`rounded-2xl bg-black/30 text-white p-6 md:p-8 shadow-lg ${className}`}
    >
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
                  <li
                    key={String(m.id ?? m.handle)}
                    className="flex items-center gap-2"
                  >
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
}: {
  editions: Edition[];
  intervalMs?: number;
}) {
  const [idx, setIdx] = useState(0);
  const len = editions.length;
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (len <= 1 || prefersReducedMotion) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % len), intervalMs);
    return () => clearInterval(t);
  }, [len, prefersReducedMotion, intervalMs]);

  if (len === 0) {
    return (
      <div className="h-40 md:h-full grid place-items-center text-white/60 text-sm">
        Aucune édition pour le moment
      </div>
    );
  }

  const current = editions[idx];

  // clé stable sans index
  const keyFor = (e: Edition) =>
    e.id ?? e.cover ?? e.title ?? JSON.stringify(e);

  return (
    <div className="relative h-40 md:h-full">
      {/* ambiance “journal années 30” via overlay sepia + grain très léger */}
      <div
        className="absolute inset-0 bg-amber-900/10 mix-blend-multiply pointer-events-none"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:3px_3px] pointer-events-none"
        aria-hidden
      />
      {current?.cover ? (
        <a href={current.href ?? "#"} className="block relative h-full">
          <Image
            src={current.cover}
            alt={current.title ?? "Édition"}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
            priority={false}
          />
          <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
            <div className="text-xs uppercase tracking-wide text-white/80">
              Édition
            </div>
            <div className="text-sm font-medium">
              {current.title ?? "Numéro spécial"}
            </div>
          </div>
        </a>
      ) : (
        <div className="h-full grid place-items-center">
          Édition sans visuel
        </div>
      )}

      {/* bullets */}
      <div className="absolute right-2 top-2 flex gap-1">
        {editions.map((ed) => (
          <button
            type="button"
            key={keyFor(ed)}
            aria-label={`Aller à l’édition ${ed.title ?? ed.id ?? ""}`}
            className={`h-2 w-2 rounded-full ${ed === current ? "bg-white" : "bg-white/40"}`}
            onClick={() => setIdx(editions.indexOf(ed))}
          />
        ))}
      </div>
    </div>
  );
}

/* ===== Markdown lite ===== */
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
  return (
    <div className="prose prose-invert max-w-none prose-p:my-3 prose-li:my-1">
      {nodes}
    </div>
  );
}
