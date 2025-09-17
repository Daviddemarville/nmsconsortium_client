"use client";

import { useEffect, useMemo, useState } from "react";

type Role = {
  id: number;
  key: string;
  label: string;
  level: number; // 0 = top
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
  since?: string; // libre
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
  /** Afficher une seule unité (ex: 1 = Consortium), sinon toutes */
  unitId?: number;
  /** Afficher uniquement les membres opt-in */
  optInOnly?: boolean;
  className?: string;
};

export default function OrgChart({
  rolesUrl = "/data/roles.json",
  unitsUrl = "/data/units.json",
  membersUrl = "/data/members.json",
  unitId,
  optInOnly = true,
  className = "",
}: Props) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

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

  // Unités à afficher (une ou toutes)
  const visibleUnits = useMemo(() => {
    if (!units.length) return [];
    if (unitId) {
      const u = units.find((x) => x.id === unitId);
      return u ? [u] : [];
    }
    // Regrouper par hiérarchie simple: parent d’abord (parent_id=null), puis enfants
    const roots = units.filter((u) => u.parent_id === null);
    const children = units.filter((u) => u.parent_id !== null);
    // ordre: root puis ses enfants (ordre simple)
    const ordered: Unit[] = [];
    roots.forEach((root) => {
      ordered.push(root);
      children
        .filter((c) => c.parent_id === root.id)
        .forEach((c) => {
          ordered.push(c);
        });
    });
    // plus tout ce qui n’est pas relié (rare)
    units
      .filter((u) => !ordered.some((x) => x.id === u.id))
      .forEach((u) => {
        ordered.push(u);
      });
    return ordered;
  }, [units, unitId]);

  // Membres filtrés opt-in si demandé
  const baseMembers = useMemo(
    () => (optInOnly ? members.filter((m) => m.opt_in) : members),
    [members, optInOnly],
  );

  // Regroupe les membres par unit, calcule un "minLevel" pour trier
  const dataByUnit = useMemo(() => {
    const result: Array<{
      unit: Unit;
      members: Array<Member & { minLevel: number; rolesInUnit: Role[] }>;
    }> = [];
    visibleUnits.forEach((unit) => {
      // membres qui ont au moins une assignment dans cette unit
      const ms = baseMembers
        .map((m) => {
          const ass = m.assignments?.filter((a) => a.unit_id === unit.id) ?? [];
          if (!ass.length) return null;
          const rolesInUnit = ass
            .map((a) => roleById.get(a.role_id))
            .filter(Boolean) as Role[];
          if (!rolesInUnit.length) return null;
          const minLevel = Math.min(...rolesInUnit.map((r) => r.level));
          return { ...m, minLevel, rolesInUnit };
        })
        .filter(Boolean) as Array<
        Member & { minLevel: number; rolesInUnit: Role[] }
      >;

      // tri: level asc (0 top), puis pseudo
      ms.sort(
        (a, b) => a.minLevel - b.minLevel || a.pseudo.localeCompare(b.pseudo),
      );
      result.push({ unit, members: ms });
    });
    return result;
  }, [visibleUnits, baseMembers, roleById]);

  if (loading) {
    return <div className={className}>Chargement de l’organigramme…</div>;
  }
  if (err) {
    return <div className={className}>Erreur: {err}</div>;
  }

  return (
    <div className={`space-y-10 ${className}`}>
      {dataByUnit.map(({ unit, members }) => (
        <section key={unit.id} className="space-y-4">
          <header className="flex items-center gap-3">
            <h2 className="text-xl font-semibold">{unit.label}</h2>
            {unit.parent_id && (
              <span className="text-xs opacity-70">
                (Rattaché à {unitById.get(unit.parent_id)?.label ?? "—"})
              </span>
            )}
          </header>

          {members.length === 0 ? (
            <p className="text-sm opacity-70">
              Aucun membre affichable pour cette unité.
            </p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {members.map((m) => (
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

                  {/* Badges de rôles (dans cette unité) */}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {m.rolesInUnit
                      .sort((a, b) => a.level - b.level)
                      .map((r) => (
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
                  {m.bio && (
                    <p className="mt-3 text-sm opacity-80 line-clamp-3">
                      {m.bio}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
