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
  unitId: _unitId, // gardé pour compat, non utilisé dans l’ordre custom
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

  // --- ORDRE D'AFFICHAGE DES UNITEES DANS LE COMPOSANT ---
  // IDs d’unités à ne jamais afficher (ex. 1 = Consortium, 14 = LTI, 15 = HSC, 16 = GARC)
  const EXCLUDED_UNIT_IDS_ARRAY = [1, 14, 15, 16];
  const excludedIds = useMemo(
    () => new Set<number>(EXCLUDED_UNIT_IDS_ARRAY),
    [],
  );

  // IDs prioritaires (dans l'ordre souhaité d'affichage)
  const PRIORITY_UNIT_IDS = [17, 11]; // ex: 17 = Fondateur, 11 = Global Council

  // Map (id -> rang de priorité) pour un tri rapide
  const priorityRank = useMemo(() => {
    const m = new Map<number, number>();
    PRIORITY_UNIT_IDS.forEach((id, idx) => {
      m.set(id, idx);
    });
    return m;
  }, []);

  const visibleUnits = useMemo(() => {
    if (!units.length) return [];

    const list = units.filter((u) => !excludedIds.has(u.id));

    list.sort((a, b) => {
      const ra = priorityRank.get(a.id) ?? Number.POSITIVE_INFINITY;
      const rb = priorityRank.get(b.id) ?? Number.POSITIVE_INFINITY;

      // 1) d'abord ceux qui sont dans PRIORITY_UNIT_IDS (ordre du tableau)
      if (ra !== rb) return ra - rb;

      // 2) sinon, tri standard par id croissant
      return a.id - b.id;
    });

    return list;
  }, [units, excludedIds, priorityRank]);
  // ------------------------------

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
                  </div>

                  {/* Badges de rôles (dans cette unité) */}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {m.rolesInUnit
                      .sort((a, b) => a.level - b.level)
                      .map((r, i) => (
                        <span
                          key={`role-${r.id}-${i}`}
                          title={`Niveau ${r.level}`}
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-xs ring-1"
                          style={{
                            background: r.color ? `${r.color}20` : undefined, // #RRGGBBAA (alpha 0x20)
                            color: r.color ?? "inherit",
                            borderColor: r.color ?? "rgba(255,255,255,0.15)",
                          }}
                        >
                          {r.label}
                        </span>
                      ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
