// src/components/sections/MembersListCompact.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

/* ========= Types ========= */

type Assignment = {
  role_id: number;
  unit_id: number;
  primary?: boolean;
};

type Member = {
  id: number;
  pseudo: string;
  discord?: string;
  gameplay?: string[];
  opt_in: boolean;
  assignments: Assignment[];
};

type Role = {
  id: number;
  key: string;
  label: string;
  level: number; // plus petit = plus haut dans la hiérarchie
  parent_role_id: number | null;
  color?: string;
};

type Unit = {
  id: number;
  key: string;
  label: string;
  parent_id: number | null;
};

type Props = {
  /** URLs des sources JSON (par défaut le dossier /public/data) */
  membersUrl?: string; // default: /data/members.json
  rolesUrl?: string; // default: /data/roles.json
  unitsUrl?: string; // default: /data/units.json

  /** Filtrage optionnel (ne garder que ces unités et/ou rôles) */
  includeUnits?: number[] | null;
  includeRoles?: number[] | null;

  /** Priorités (appliquées AVANT le tri final) */
  unitPriority?: number[]; // ex: [17, 1]  → 17 d'abord, puis 1, puis le reste
  rolePriority?: number[]; // ex: [14, 7, 8] → Amiral, Colonel, Capitaine…

  /** Tri final à appliquer après priorités */
  sort?: "alpha" | "role" | "unit";

  /** Limite de résultats (null = pas de limite) */
  limit?: number | null;

  /** Présentation */
  title?: string; // ex: "Membres"
  className?: string; // classes conteneur
};

/* ========= Composant ========= */

export default function MembersListCompact({
  membersUrl = "/data/members.json",
  rolesUrl = "/data/roles.json",
  unitsUrl = "/data/units.json",
  includeUnits = null,
  includeRoles = null,
  unitPriority = [],
  rolePriority = [],
  sort = "alpha",
  limit = null,
  title = "Membres",
  className = "",
}: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [mRes, rRes, uRes] = await Promise.all([
          fetch(membersUrl, { cache: "no-store" }),
          fetch(rolesUrl, { cache: "no-store" }),
          fetch(unitsUrl, { cache: "no-store" }),
        ]);
        if (!mRes.ok) throw new Error(`members HTTP ${mRes.status}`);
        if (!rRes.ok) throw new Error(`roles HTTP ${rRes.status}`);
        if (!uRes.ok) throw new Error(`units HTTP ${uRes.status}`);

        const [mData, rData, uData] = await Promise.all([
          mRes.json(),
          rRes.json(),
          uRes.json(),
        ]);

        if (!alive) return;
        setMembers((mData as Member[]).filter((m) => m.opt_in));
        setRoles(rData as Role[]);
        setUnits(uData as Unit[]);
      } catch (e: any) {
        if (alive) setErr(e?.message ?? "Erreur de chargement");
      }
    })();
    return () => {
      alive = false;
    };
  }, [membersUrl, rolesUrl, unitsUrl]);

  /* ======== Pré-calculs : hiérarchies et index ======== */

  const roleIndexById = useMemo(() => {
    // Ordonner par level croissant (0 = top) puis id pour stabilité
    const ordered = [...roles].sort((a, b) =>
      a.level === b.level ? a.id - b.id : a.level - b.level,
    );
    const map = new Map<number, number>();
    ordered.forEach((r, i) => map.set(r.id, i));
    return map;
  }, [roles]);

  const unitIndexById = useMemo(() => {
    // Ordonner par id croissant pour stabilité (ou autre logique si besoin)
    const ordered = [...units].sort((a, b) => a.id - b.id);
    const map = new Map<number, number>();
    ordered.forEach((u, i) => map.set(u.id, i));
    return map;
  }, [units]);

  const rolePriorityIndex = useMemo(() => {
    const map = new Map<number, number>();
    rolePriority.forEach((id, i) => map.set(id, i));
    return map;
  }, [rolePriority]);

  const unitPriorityIndex = useMemo(() => {
    const map = new Map<number, number>();
    unitPriority.forEach((id, i) => map.set(id, i));
    return map;
  }, [unitPriority]);

  /* ======== Filtrage ======== */

  const filtered = useMemo(() => {
    let list = [...members];

    if (includeUnits && includeUnits.length > 0) {
      list = list.filter((m) =>
        m.assignments?.some((a) => includeUnits.includes(a.unit_id)),
      );
    }

    if (includeRoles && includeRoles.length > 0) {
      list = list.filter((m) =>
        m.assignments?.some((a) => includeRoles.includes(a.role_id)),
      );
    }

    return list;
  }, [members, includeUnits, includeRoles]);

  /* ======== Métriques par membre ======== */

  function computeMemberMetrics(m: Member) {
    const asg = m.assignments ?? [];
    // Rôle hiérarchiquement "le plus haut" (index le plus petit)
    let bestRoleRank = Number.POSITIVE_INFINITY;
    let bestRoleId: number | null = null;

    for (const a of asg) {
      const idx = roleIndexById.get(a.role_id);
      if (idx !== undefined && idx < bestRoleRank) {
        bestRoleRank = idx;
        bestRoleId = a.role_id;
      }
    }

    // Unité la "première" selon l'ordre units
    let bestUnitRank = Number.POSITIVE_INFINITY;
    let bestUnitId: number | null = null;

    for (const a of asg) {
      const idx = unitIndexById.get(a.unit_id);
      if (idx !== undefined && idx < bestUnitRank) {
        bestUnitRank = idx;
        bestUnitId = a.unit_id;
      }
    }

    // Clés de priorité
    const unitPrio =
      Math.min(
        ...asg
          .map((a) => unitPriorityIndex.get(a.unit_id))
          .filter((v): v is number => typeof v === "number"),
      ) ?? Number.POSITIVE_INFINITY;

    const rolePrio =
      Math.min(
        ...asg
          .map((a) => rolePriorityIndex.get(a.role_id))
          .filter((v): v is number => typeof v === "number"),
      ) ?? Number.POSITIVE_INFINITY;

    return {
      bestRoleRank,
      bestRoleId,
      bestUnitRank,
      bestUnitId,
      unitPrio,
      rolePrio,
    };
  }

  /* ======== Tri combiné ======== */

  const sorted = useMemo(() => {
    const list = [...filtered];

    list.sort((a, b) => {
      const A = computeMemberMetrics(a);
      const B = computeMemberMetrics(b);

      // 1) Priorité unités (plus petit = plus prioritaire)
      if (A.unitPrio !== B.unitPrio) return A.unitPrio - B.unitPrio;

      // 2) Priorité rôles
      if (A.rolePrio !== B.rolePrio) return A.rolePrio - B.rolePrio;

      // 3) Tri final selon le mode choisi
      if (sort === "role") {
        // plus petit bestRoleRank = rôle plus élevé
        if (A.bestRoleRank !== B.bestRoleRank) {
          return A.bestRoleRank - B.bestRoleRank;
        }
        // fallback alpha
        return a.pseudo.localeCompare(b.pseudo);
      }

      if (sort === "unit") {
        if (A.bestUnitRank !== B.bestUnitRank) {
          return A.bestUnitRank - B.bestUnitRank;
        }
        // fallback alpha
        return a.pseudo.localeCompare(b.pseudo);
      }

      // sort === "alpha"
      return a.pseudo.localeCompare(b.pseudo);
    });

    return limit ? list.slice(0, limit) : list;
  }, [
    filtered,
    sort,
    limit,
    roleIndexById,
    unitIndexById,
    rolePriorityIndex,
    unitPriorityIndex,
  ]);

  /* ======== Rendu ======== */

  if (err) {
    return (
      <div className={`rounded-2xl bg-black/30 p-4 text-white ${className}`}>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-red-400">Erreur de chargement : {err}</p>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label={title}
      className={`rounded-2xl bg-black/30 p-4 text-white ${className}`}
    >
      <h3 className="text-lg font-semibold mb-3">{title}</h3>

      {sorted.length === 0 ? (
        <p className="text-sm text-white/70">Aucun membre trouvé.</p>
      ) : (
        <ul className="flex flex-wrap gap-2 text-sm">
          {sorted.map((m) => (
            <li
              key={m.id}
              className="rounded-lg bg-white/5 border border-white/10 px-3 py-1 hover:bg-white/10 transition"
              title={m.pseudo}
            >
              {m.pseudo}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
