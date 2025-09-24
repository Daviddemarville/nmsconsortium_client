"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type DiplomacyMeta = {
  title?: string;
  description_md?: string;
  portrait_url?: string;
  illustration_url?: string;
};

type Member = {
  id?: number | string;
  handle: string;
  roles?: number[];
  units?: number[];
  avatar_url?: string;
};
type Role = { id: number; name: string };

type Props = {
  dataUrl?: string; // "/data/diplomacy_meta.json"
  membersUrl?: string; // "/data/members.json"
  rolesUrl?: string; // "/data/roles.json"
  roleIds?: number[];
  roleIncludes?: string[]; // ex ["diplom", "ambass"]
  unitIds?: number[];
  limit?: number;
  className?: string;
};

export default function DiplomacyCard({
  dataUrl = "/data/diplomacy_meta.json",
  membersUrl = "/data/members.json",
  rolesUrl = "/data/roles.json",
  roleIds,
  roleIncludes = ["diplom", "ambass"],
  unitIds,
  limit = 6,
  className = "",
}: Props) {
  const [meta, setMeta] = useState<DiplomacyMeta | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [mRes, memRes, rRes] = await Promise.all([
          fetch(dataUrl, { cache: "no-store" }),
          fetch(membersUrl, { cache: "no-store" }),
          fetch(rolesUrl, { cache: "no-store" }),
        ]);
        const m = mRes.ok ? ((await mRes.json()) as DiplomacyMeta) : {};
        const mem = memRes.ok ? ((await memRes.json()) as Member[]) : [];
        const r = rRes.ok ? ((await rRes.json()) as Role[]) : [];
        if (!alive) return;
        setMeta(m);
        setMembers(mem);
        setRoles(r);
      } catch {
        /* noop */
      }
    })();
    return () => {
      alive = false;
    };
  }, [dataUrl, membersUrl, rolesUrl]);

  const roleNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const r of roles) map.set(r.id, r.name);
    return map;
  }, [roles]);

  const filtered = useMemo(() => {
    return members
      .filter((m) => {
        const hasRoleId =
          !roleIds?.length ||
          (m.roles ?? []).some((id) => roleIds?.includes(id));
        const hasRoleName =
          !roleIncludes?.length ||
          (m.roles ?? []).some((id) => {
            const rn = roleNameById.get(id as number) ?? "";
            return roleIncludes?.some((needle) =>
              rn.toLowerCase().includes(needle.toLowerCase()),
            );
          });
        const hasUnit =
          !unitIds?.length || (m.units ?? []).some((u) => unitIds?.includes(u));
        return hasRoleId && hasRoleName && hasUnit;
      })
      .sort((a, b) => a.handle.localeCompare(b.handle, "fr"))
      .slice(0, limit);
  }, [members, roleIds, roleIncludes, unitIds, roleNameById, limit]);

  if (!meta) {
    return (
      <section
        className={`rounded-2xl bg-black/30 text-white p-6 md:p-8 ${className}`}
      >
        Chargement…
      </section>
    );
  }

  const {
    title = "Cellule diplomatique — Nemesis Consortium",
    description_md = "",
    portrait_url,
    illustration_url,
  } = meta;

  return (
    <section
      className={`rounded-2xl bg-black/30 text-white p-6 md:p-8 shadow-lg ${className}`}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <header className="flex items-start gap-4">
            {portrait_url && (
              <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden border border-white/15 bg-white/5">
                <Image
                  src={portrait_url}
                  alt="Insigne diplomatie"
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
            )}
            <div>
              <h3 className="text-xl md:text-2xl font-semibold">{title}</h3>
              <p className="mt-1 text-xs uppercase tracking-wide text-white/60">
                Représentation & médiation
              </p>
            </div>
          </header>

          <div className="mt-4">
            <MarkdownLite text={description_md} />
          </div>

          {filtered.length > 0 && (
            <div className="mt-5">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-white/70">
                Diplomates
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

        <aside className="relative rounded-xl border border-white/10 bg-white/5 overflow-hidden">
          {illustration_url ? (
            <Image
              src={illustration_url}
              alt="Illustration diplomatie"
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover"
            />
          ) : (
            <div className="h-40 md:h-full grid place-items-center text-white/60 text-sm">
              Illustration à venir
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

/* MarkdownLite (identique) */
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
