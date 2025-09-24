"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type CorpoEntry = {
  pres_synthese?: string;
  links?: { details?: string; consortium?: string; members_page?: string };
  portrait_url?: string;
  illustration_url?: string;
  label?: string;
};

type CorpoFile = {
  corpos?: Record<string, CorpoEntry>;
};

type Member = {
  id?: number | string;
  handle: string;
  roles?: number[];
  units?: number[];
};
type Role = { id: number; name: string };

type Props = {
  corpoUrl?: string; // "/data/corpo.json"
  corpoKey?: string; // "nsf"
  membersUrl?: string; // "/data/members.json"
  rolesUrl?: string; // "/data/roles.json"
  roleIds?: number[];
  roleIncludes?: string[]; // ex: ["nsf","sécurité","security"]
  unitIds?: number[]; // ex: [17]
  limit?: number;
  className?: string;
};

export default function NsfCard({
  corpoUrl = "/data/corpo.json",
  corpoKey = "nsf",
  membersUrl = "/data/members.json",
  rolesUrl = "/data/roles.json",
  roleIds,
  roleIncludes = ["nsf", "sécur", "security"],
  unitIds,
  limit = 8,
  className = "",
}: Props) {
  const [entry, setEntry] = useState<CorpoEntry | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [cRes, mRes, rRes] = await Promise.all([
          fetch(corpoUrl, { cache: "no-store" }),
          fetch(membersUrl, { cache: "no-store" }),
          fetch(rolesUrl, { cache: "no-store" }),
        ]);
        const c = cRes.ok ? ((await cRes.json()) as CorpoFile) : {};
        const e = c?.corpos?.[corpoKey] ?? null;
        const m = mRes.ok ? ((await mRes.json()) as Member[]) : [];
        const r = rRes.ok ? ((await rRes.json()) as Role[]) : [];
        if (!alive) return;
        setEntry(e);
        setMembers(m);
        setRoles(r);
      } catch {
        /* noop */
      }
    })();
    return () => {
      alive = false;
    };
  }, [corpoUrl, corpoKey, membersUrl, rolesUrl]);

  const roleNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const r of roles) map.set(r.id, r.name);
    return map;
  }, [roles]);

  const filtered = useMemo(() => {
    return members
      .filter((m) => {
        const okRoleId =
          !roleIds?.length ||
          (m.roles ?? []).some((id) => roleIds?.includes(id));
        const okRoleName =
          !roleIncludes?.length ||
          (m.roles ?? []).some(
            (id) =>
              (roleNameById.get(id as number) ?? "")
                .toLowerCase()
                .includes("nsf") ||
              roleIncludes?.some((needle) =>
                (roleNameById.get(id as number) ?? "")
                  .toLowerCase()
                  .includes(needle.toLowerCase()),
              ),
          );
        const okUnit =
          !unitIds?.length || (m.units ?? []).some((u) => unitIds?.includes(u));
        return okRoleId && okRoleName && okUnit;
      })
      .sort((a, b) => a.handle.localeCompare(b.handle, "fr"))
      .slice(0, limit);
  }, [members, roleIds, roleIncludes, unitIds, roleNameById, limit]);

  if (!entry) {
    return (
      <section
        className={`rounded-2xl bg-black/30 text-white p-6 md:p-8 ${className}`}
      >
        Chargement…
      </section>
    );
  }

  const { pres_synthese, links, portrait_url, illustration_url, label } = entry;

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
                  alt="Insigne NSF"
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
            )}
            <div>
              <h3 className="text-xl md:text-2xl font-semibold">
                {label
                  ? `${label} — Forces de sécurité`
                  : "NSF — Forces de sécurité"}
              </h3>
              <p className="mt-1 text-xs uppercase tracking-wide text-white/60">
                Protection, escorte, contre-mesures
              </p>
            </div>
          </header>

          {pres_synthese && (
            <p className="mt-4 text-white/85 leading-relaxed">
              {pres_synthese}
            </p>
          )}

          {filtered.length > 0 && (
            <div className="mt-5">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-white/70">
                Équipe
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

          {(links?.details ?? links?.consortium) && (
            <div className="mt-5">
              <a
                href={links?.details ?? links?.consortium}
                className="inline-flex items-center rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
              >
                Voir la page NSF
              </a>
            </div>
          )}
        </div>

        <aside className="relative rounded-xl border border-white/10 bg-white/5 overflow-hidden">
          {illustration_url ? (
            <Image
              src={illustration_url}
              alt="Illustration NSF"
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover"
            />
          ) : (
            <div className="h-40 md:h-full grid place-items-center text-white/60 text-sm">
              Illustration à venir
            </div>
          )}
          {/* accent “militaire” léger */}
          <div
            className="absolute inset-0 ring-1 ring-white/10 [mask-image:linear-gradient(to_bottom,black_60%,transparent)]"
            aria-hidden
          />
        </aside>
      </div>
    </section>
  );
}
