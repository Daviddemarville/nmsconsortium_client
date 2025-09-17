"use client";

import { useEffect, useMemo, useState } from "react";

type Role = {
  id: number;
  key: string;
  label: string;
  level: number;
  parent_role_id: number | null;
  color?: string;
};

type Unit = {
  id: number;
  key: string;
  label: string;
  parent_id: number | null;
};

type Assignment = {
  role_id: number;
  unit_id: number;
  primary?: boolean;
  since?: string;
};

type Member = {
  id: number;
  pseudo: string;
  discord?: string;
  gameplay?: string[];
  bio?: string;
  opt_in: boolean;
  assignments: Assignment[];
};

type Props = {
  rolesUrl?: string; // default: /data/roles.json
  unitsUrl?: string; // default: /data/units.json
  membersUrl?: string; // default: /data/members.json
  /** Afficher uniquement les membres opt-in */
  optInOnly?: boolean;
  /** Afficher les contrôles (recherche, filtres) */
  withControls?: boolean;
  className?: string;
};

export default function MembersList({
  rolesUrl = "/data/roles.json",
  unitsUrl = "/data/units.json",
  membersUrl = "/data/members.json",
  optInOnly = true,
  withControls = true,
  className = "",
}: Props) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // UI state
  const [q, setQ] = useState("");
  const [unitFilter, setUnitFilter] = useState<number | "">("");
  const [roleFilter, setRoleFilter] = useState<number | "">("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [rRes, uRes, mRes] = await Promise.all([
          fetch(rolesUrl, { cache: "no-store" }),
          fetch(unitsUrl, { cache: "no-store" }),
          fetch(membersUrl, { cache: "no-store" }),
        ]);
        if (!rRes.ok || !uRes.ok || !mRes.ok) {
          throw new Error("Impossible de charger les données JSON.");
        }
        const [r, u, m] = await Promise.all([
          rRes.json(),
          uRes.json(),
          mRes.json(),
        ]);
        if (!cancelled) {
          setRoles(r ?? []);
          setUnits(u ?? []);
          setMembers(m ?? []);
          setErr(null);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          const message = e instanceof Error ? e.message : String(e);
          setErr(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [rolesUrl, unitsUrl, membersUrl]);

  const roleById = useMemo(() => {
    const map = new Map<number, Role>();
    roles.forEach((r) => {
      map.set(r.id, r);
    });
    return map;
  }, [roles]);

  const unitById = useMemo(() => {
    const map = new Map<number, Unit>();
    units.forEach((u) => {
      map.set(u.id, u);
    });
    return map;
  }, [units]);

  const filtered = useMemo(() => {
    let ms = optInOnly ? members.filter((m) => m.opt_in) : members;

    // filtrage par unité
    if (unitFilter !== "") {
      ms = ms.filter((m) =>
        m.assignments?.some((a) => a.unit_id === unitFilter),
      );
    }

    // filtrage par rôle
    if (roleFilter !== "") {
      ms = ms.filter((m) =>
        m.assignments?.some((a) => a.role_id === roleFilter),
      );
    }

    // recherche plein texte (pseudo, bio, discord)
    if (q.trim()) {
      const needles = q.trim().toLowerCase().split(/\s+/);
      ms = ms.filter((m) => {
        const hay = [
          m.pseudo,
          m.discord ?? "",
          m.bio ?? "",
          ...(m.gameplay ?? []),
        ]
          .join(" ")
          .toLowerCase();
        return needles.every((n) => hay.includes(n));
      });
    }

    // tri : par niveau hiérarchique minimal (tous rôles, toutes unités), puis pseudo
    ms = ms
      .map((m) => {
        const rs = (m.assignments ?? [])
          .map((a) => roleById.get(a.role_id))
          .filter(Boolean) as Role[];
        const minLevel = rs.length ? Math.min(...rs.map((r) => r.level)) : 999;
        return { m, minLevel };
      })
      .sort(
        (a, b) =>
          a.minLevel - b.minLevel || a.m.pseudo.localeCompare(b.m.pseudo),
      )
      .map((x) => x.m);

    return ms;
  }, [members, optInOnly, unitFilter, roleFilter, q, roleById]);

  if (loading) {
    return <div className={className}>Chargement des membres…</div>;
  }
  if (err) {
    return <div className={className}>Erreur: {err}</div>;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {withControls && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="filterQuery" className="text-xs opacity-70">
              Recherche
            </label>
            <input
              id="filterQuery"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-background/70 px-3 py-2"
              placeholder="pseudo, bio, discord, gameplay…"
            />
          </div>
          <div>
            <label htmlFor="filterUnit" className="text-xs opacity-70">
              Unité
            </label>
            <select
              id="filterUnit"
              className="w-full rounded-lg border border-white/10 bg-background/70 px-3 py-2"
              value={unitFilter}
              onChange={(e) =>
                setUnitFilter(e.target.value ? Number(e.target.value) : "")
              }
            >
              <option value="">Toutes</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filterRole" className="text-xs opacity-70">
              Rôle
            </label>
            <select
              id="filterRole"
              className="w-full rounded-lg border border-white/10 bg-background/70 px-3 py-2"
              value={roleFilter}
              onChange={(e) =>
                setRoleFilter(e.target.value ? Number(e.target.value) : "")
              }
            >
              <option value="">Tous</option>
              {roles
                .slice()
                .sort(
                  (a, b) => a.level - b.level || a.label.localeCompare(b.label),
                )
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
            </select>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm opacity-70">
          Aucun membre ne correspond aux filtres.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => {
            const rolesAll = (m.assignments ?? [])
              .map((a) => roleById.get(a.role_id))
              .filter(Boolean) as Role[];
            rolesAll.sort(
              (a, b) => a.level - b.level || a.label.localeCompare(b.label),
            );

            return (
              <li
                key={m.id}
                className="rounded-2xl border border-white/10 bg-background/60 backdrop-blur p-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{m.pseudo}</h3>
                  {m.discord && (
                    <span className="text-xs opacity-70">{m.discord}</span>
                  )}
                </div>

                {/* Unité(s) d’affectation */}
                <div className="mt-2 text-xs opacity-80">
                  {(m.assignments ?? [])
                    .map((a) => unitById.get(a.unit_id)?.label)
                    .filter(Boolean)
                    .join(" • ")}
                </div>

                {/* Rôles */}
                <div className="mt-2 flex flex-wrap gap-2">
                  {rolesAll.map((r) => (
                    <span
                      key={r.id}
                      title={`Niveau ${r.level}`}
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs ring-1"
                      style={{
                        background: r.color ? `${r.color}20` : undefined,
                        color: r.color ?? "inherit",
                        borderColor: r.color ?? "rgba(255,255,255,0.15)",
                      }}
                    >
                      {r.label}
                    </span>
                  ))}
                </div>

                {/* Gameplay */}
                {!!m.gameplay?.length && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {m.gameplay.map((g) => (
                      <span
                        key={`${m.id}-${g}`}
                        className="rounded-md border border-white/10 px-1.5 py-0.5 text-xs opacity-80"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                )}

                {/* Bio */}
                {m.bio && <p className="mt-3 text-sm opacity-80">{m.bio}</p>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
