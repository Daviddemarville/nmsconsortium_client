// src/components/sections/OrgChart.tsx
"use client";

/**
 * ▶ CONFIG TAMPON – À MODIFIER ICI
 * - enabled: activer/désactiver le tampon pour le groupe
 * - text:     texte affiché sur chaque carte du groupe
 * Groupes :
 *   g1 = Fondateur & Global Council
 *   g2 = Diplomatie & Coordination CANAD
 *   g3 = NSF · AION · NI2B · NGN
 *   g4 = Corpos filles (le reste)
 */
const STAMP = {
  g1: { enabled: false, text: "PROJECT" },
  g2: { enabled: false, text: "CLASSIFIED" },
  g3: { enabled: false, text: "IN PROGRESS" },
  g4: { enabled: true, text: "PROJECT CLASSIFIED" },
};

import { useEffect, useMemo, useState } from "react";
import WarningBanner from "@/components/ui/WarningBanner";

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
  unitId?: number; // compat
  optInOnly?: boolean;
  className?: string;
};

export default function OrgChart({
  rolesUrl = "/data/roles.json",
  unitsUrl = "/data/units.json",
  membersUrl = "/data/members.json",
  unitId: _unitId,
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
        if (!cancelled) setErr(e instanceof Error ? e.message : String(e));
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

  // ====== VISIBILITÉ (ne pas toucher aux excluded) ======
  const EXCLUDED_UNIT_IDS_ARRAY = [1, 14, 15, 16, 18];
  const excludedIds = useMemo(
    () => new Set<number>(EXCLUDED_UNIT_IDS_ARRAY),
    [],
  );

  const PRIORITY_UNIT_IDS = [17, 11, 12, 13, 5, 4, 3, 2];
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
      if (ra !== rb) return ra - rb;
      return a.id - b.id;
    });
    return list;
  }, [units, excludedIds, priorityRank]);

  // ====== MEMBRES ======
  const baseMembers = useMemo(
    () => (optInOnly ? members.filter((m) => m.opt_in) : members),
    [members, optInOnly],
  );

  type Entry = {
    unit: Unit;
    members: Array<Member & { minLevel: number; rolesInUnit: Role[] }>;
  };

  const dataByUnit: Entry[] = useMemo(() => {
    const result: Entry[] = [];
    visibleUnits.forEach((unit) => {
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

      ms.sort(
        (a, b) => a.minLevel - b.minLevel || a.pseudo.localeCompare(b.pseudo),
      );
      result.push({ unit, members: ms });
    });
    return result;
  }, [visibleUnits, baseMembers, roleById]);

  // ====== GROUPES ======
  const G1 = new Set([17, 11]); // Fondateur & Global Council
  const G2 = new Set([12, 13]); // Diplomatie & Coordination CANAD
  const G3 = new Set([5, 4, 3, 2]); // NSF, AION, NI2B, NGN

  const mapByUnitId = useMemo(() => {
    const m = new Map<number, Entry>();
    dataByUnit.forEach((e) => {
      m.set(e.unit.id, e);
    });
    return m;
  }, [dataByUnit]);

  const pickGroup = (ids: Set<number>) =>
    Array.from(ids)
      .map((id) => mapByUnitId.get(id))
      .filter(Boolean) as Entry[];

  const group1 = pickGroup(G1);
  const group2 = pickGroup(G2);
  const group3 = pickGroup(G3);

  // Reste = corpos filles
  const groupedIds = new Set<number>([...G1, ...G2, ...G3]);
  const group4 = dataByUnit.filter((e) => !groupedIds.has(e.unit.id));

  if (loading)
    return <div className={className}>Chargement de l’organigramme…</div>;
  if (err) return <div className={className}>Erreur: {err}</div>;

  return (
    <div className={`space-y-8 ${className}`}>
      <GroupBlock
        title="Fondateur & Global Council"
        entries={group1}
        unitById={unitById}
        stampEnabled={STAMP.g1.enabled}
        stampText={STAMP.g1.text}
      />
      <GroupBlock
        title="Diplomatie & Coordination CANAD"
        entries={group2}
        unitById={unitById}
        stampEnabled={STAMP.g2.enabled}
        stampText={STAMP.g2.text}
      />
      <GroupBlock
        title="NSF · AION · NI2B · NGN"
        entries={group3}
        unitById={unitById}
        stampEnabled={STAMP.g3.enabled}
        stampText={STAMP.g3.text}
      />

      {/* Bandeau d’avertissement entre 3 et 4 */}
      <WarningBanner />

      <GroupBlock
        title="Corpos filles"
        entries={group4}
        unitById={unitById}
        stampEnabled={STAMP.g4.enabled}
        stampText={STAMP.g4.text}
      />
    </div>
  );
}

/* ---------- Sous-composant ---------- */

function GroupBlock({
  title,
  entries,
  unitById,
  stampEnabled,
  stampText,
}: {
  title: string;
  entries: Array<{
    unit: Unit;
    members: Array<Member & { minLevel: number; rolesInUnit: Role[] }>;
  }>;
  unitById: Map<number, Unit>;
  stampEnabled: boolean;
  stampText: string;
}) {
  if (!entries.length) return null;

  return (
    <section className="space-y-6 bg-black/30 rounded-2xl border border-white/10 p-4 md:p-6">
      <h2 className="text-lg md:text-xl font-semibold">{title}</h2>

      {entries.map(({ unit, members }) => (
        <div key={unit.id} className="space-y-3">
          <header className="flex items-center gap-3">
            <h3 className="text-base md:text-lg font-semibold">{unit.label}</h3>
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
                  className="relative overflow-hidden rounded-2xl border border-white/10 bg-background/60 backdrop-blur p-4"
                >
                  {/* TAMPON – visible si activé pour ce groupe */}
                  {stampEnabled && (
                    <div
                      aria-hidden="true"
                      className="
                        pointer-events-none absolute inset-0 grid place-items-center
                        select-none
                      "
                    >
                      <span
                        className="
                          rotate-[-16deg]
                          rounded-md border-2 border-red-500/70
                          px-5 py-1.5 text-sm md:text-base font-extrabold tracking-[0.35em]
                          text-red-400/80 uppercase
                          shadow-[0_0_8px_rgba(0,0,0,0.35)]
                        "
                        // Astuce : on évite mix-blend pour garantir la visibilité partout
                        // (le fond des cartes est déjà semi-transparent)
                      >
                        {stampText}
                      </span>
                    </div>
                  )}

                  <div className="relative z-10 flex items-center justify-between">
                    <h4 className="text-base md:text-lg font-semibold">
                      {m.pseudo}
                    </h4>
                  </div>

                  {/* Badges de rôles */}
                  <div className="relative z-10 mt-2 flex flex-wrap gap-2">
                    {m.rolesInUnit
                      .sort((a, b) => a.level - b.level)
                      .map((r, i) => (
                        <span
                          key={`role-${r.id}-${i}`}
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
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </section>
  );
}
