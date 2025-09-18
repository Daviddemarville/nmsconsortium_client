"use client";

import clsx from "clsx";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/* ===== Types ===== */
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

/* ===== Props ===== */
export type MembersListProps = {
  className?: string;
  withControls?: boolean;
  pageSize?: number;
  rolesUrl?: string;
  unitsUrl?: string;
  membersUrl?: string;
  onCounts?: (c: { total: number; filtered: number }) => void;
  showFilteredCountInControls?: boolean;
};

/* ===== Utils ===== */
const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const primaryAssignment = (m: Member) =>
  m.assignments.find((a) => a.primary) ?? m.assignments[0];

/** Style inline pour un chip de rôle (même logique que dans OrgChart) */
const roleChipStyle = (hex?: string): React.CSSProperties | undefined => {
  if (!hex) return undefined;
  // #rrggbb + "20" = alpha ~12.5%
  const alphaBg = `${hex}20`;
  return {
    backgroundColor: alphaBg,
    color: hex,
    borderColor: hex,
  };
};

const applyFilters = (
  members: Member[],
  query: string,
  roleId: number | "all",
  unitId: number | "all",
  _rolesMap: Map<number, Role>,
) => {
  const q = query.trim().toLowerCase();
  return members.filter((m) => {
    const text =
      `${m.pseudo} ${m.discord ?? ""} ${m.bio ?? ""} ${(m.gameplay ?? []).join(" ")}`.toLowerCase();
    if (q && !text.includes(q)) return false;
    if (roleId !== "all" && !m.assignments.some((a) => a.role_id === roleId))
      return false;
    if (unitId !== "all" && !m.assignments.some((a) => a.unit_id === unitId))
      return false;
    return true;
  });
};

async function fetchJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const r = await fetch(url, { signal });
  if (!r.ok) throw new Error(`HTTP ${r.status} on ${url}`);
  return (await r.json()) as T;
}

/* ===== Modale détaillée ===== */
function MemberDialog({
  member,
  roles,
  units,
  onClose,
}: {
  member: Member;
  roles: Map<number, Role>;
  units: Map<number, Unit>;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  // Garde-fou: dédup (role_id, unit_id)
  const uniqueAssignments = useMemo(() => {
    const seen = new Set<string>();
    return member.assignments.filter((a) => {
      const k = `${a.role_id}-${a.unit_id}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [member.assignments]);

  const assignments = uniqueAssignments.map((a) => ({
    role: roles.get(a.role_id),
    unit: units.get(a.unit_id),
    raw: a,
  }));

  // Garde-fou: dédup gameplay
  const gameplayAll = useMemo(
    () => Array.from(new Set(member.gameplay ?? [])),
    [member.gameplay],
  );

  return (
    <div
      aria-modal="true"
      role="dialog"
      aria-labelledby="member-title"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      {/* Overlay cliquable (élément sémantique) */}
      <button
        type="button"
        aria-label="Fermer la fenêtre"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Dialog */}
      <div
        ref={ref}
        tabIndex={-1}
        className="relative z-10 max-h-[85vh] w-[min(720px,92vw)] overflow-auto rounded-xl bg-black/80 p-6 ring-1 ring-white/10"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute right-3 top-3 rounded-md px-2 py-1 text-lg text-white/80 hover:bg-white/10"
        >
          ×
        </button>

        <h3 id="member-title" className="text-2xl font-semibold">
          Fiche membre
        </h3>

        {/* Identité */}
        <dl className="mt-3 grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1">
          <dt className="opacity-60">Pseudo IG</dt>
          <dd className="font-medium">{member.pseudo}</dd>
          <dt className="opacity-60">Discord</dt>
          <dd className="font-medium">{member.discord ?? "—"}</dd>
        </dl>

        {/* Rôles au sein de la corpo (colorés) */}
        <h4 className="mt-5 text-xl font-semibold opacity-80">
          Rôles au sein de la corpo
        </h4>
        <div className="mt-2 flex flex-wrap gap-2">
          {assignments.map(({ role, unit, raw }, i) => (
            <span
              key={`${raw.role_id}-${raw.unit_id}-${i}`}
              className="inline-flex items-center rounded-full px-2.5 py-1 text-xs ring-1"
              title={`${role?.label ?? "Rôle"} • ${unit?.label ?? "Unité"}`}
              style={roleChipStyle(role?.color)}
            >
              {role?.label ?? "Rôle"} • {unit?.label ?? "Unité"}
              {raw.primary && (
                <em className="ml-1 rounded bg-white/10 px-1 not-italic opacity-80">
                  principal
                </em>
              )}
            </span>
          ))}
        </div>

        {/* Gameplay (dédup) */}
        {!!gameplayAll.length && (
          <>
            <h4 className="mt-5 text-xl font-semibold opacity-80">Gameplay</h4>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {gameplayAll.map((g, i) => (
                <span
                  key={`gp-${member.id}-${i}`}
                  className="rounded-full bg-white/10 px-2 py-0.5"
                >
                  {g}
                </span>
              ))}
            </div>
          </>
        )}

        {/* Bio */}
        {member.bio && (
          <>
            <h4 className="mt-5 text-sm font-semibold opacity-80">Bio</h4>
            <p className="mt-2 whitespace-pre-line text-sm opacity-80">
              {member.bio}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

/* ===== Carte compacte ===== */
function MemberCardCompact({
  member,
  roles,
  onClick,
  isActive = false,
}: {
  member: Member;
  roles: Map<number, Role>;
  onClick: () => void;
  isActive?: boolean;
}) {
  const pa = primaryAssignment(member);
  const primaryRole = pa ? roles.get(pa.role_id) : undefined;

  // Garde-fou: dédup + max 3 avec clés stables
  const gameplayTags = useMemo(
    () => Array.from(new Set(member.gameplay ?? [])).slice(0, 3),
    [member.gameplay],
  );

  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "text-left rounded-2xl bg-black/40 p-4 ring-1 ring-white/10 hover:bg-white/15 transition",
        isActive && "ring-2 ring-nms-gold",
      )}
      aria-label={`Voir la fiche de ${member.pseudo}`}
    >
      <h3 className="font-semibold">{member.pseudo}</h3>

      {/* Rôle principal sous forme de badge coloré */}
      <div className="mt-1">
        <span
          className="inline-flex items-center rounded-full px-2 py-0.5 text-xs ring-1"
          style={roleChipStyle(primaryRole?.color)}
          title={
            primaryRole
              ? `Rôle principal : ${primaryRole.label}`
              : "Rôle principal"
          }
        >
          {primaryRole?.label ?? "—"}
        </span>
      </div>

      {/* Gameplays */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {gameplayTags.map((g, i) => (
          <span
            key={`gp-mini-${member.id}-${i}`}
            className="rounded-full bg-white/10 px-2 py-0.5 text-xs"
          >
            {g}
          </span>
        ))}
      </div>
    </button>
  );
}

/* ===== Contrôles ===== */
function Controls({
  query,
  onQuery,
  roles,
  units,
  roleId,
  unitId,
  onRole,
  onUnit,
  count,
  showCount = true,
}: {
  query: string;
  onQuery: (v: string) => void;
  roles: Role[];
  units: Unit[];
  roleId: number | "all";
  unitId: number | "all";
  onRole: (v: number | "all") => void;
  onUnit: (v: number | "all") => void;
  count: number;
  showCount?: boolean;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label htmlFor="member-search" className="sr-only">
          Recherche membres
        </label>
        <input
          id="member-search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="pseudo, bio, discord, gameplay…"
          className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm outline-none ring-1 ring-black/10 placeholder:text-white/40 focus:ring-2 focus:ring-black/20"
        />
      </div>

      <div className="flex gap-2">
        <label className="sr-only" htmlFor="role-filter">
          Rôle
        </label>
        <select
          id="role-filter"
          value={roleId === "all" ? "all" : String(roleId)}
          onChange={(e) =>
            onRole(e.target.value === "all" ? "all" : Number(e.target.value))
          }
          className="rounded-lg bg-black/80 px-3 py-2 text-sm ring-1 ring-white/10 focus:ring-2 focus:ring-white/20"
        >
          <option value="all">Tous les rôles</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor="unit-filter">
          Unité
        </label>
        <select
          id="unit-filter"
          value={unitId === "all" ? "all" : String(unitId)}
          onChange={(e) =>
            onUnit(e.target.value === "all" ? "all" : Number(e.target.value))
          }
          className="rounded-lg bg-black/80 px-3 py-2 text-sm ring-1 ring-white/10 focus:ring-2 focus:ring-white/20"
        >
          <option value="all">Toutes les unités</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.label}
            </option>
          ))}
        </select>
      </div>

      {showCount && (
        <div className="text-xs opacity-70 sm:ml-auto">{count} résultat(s)</div>
      )}
    </div>
  );
}

/* ===== Composant principal ===== */
export default function MembersList({
  className,
  withControls = true,
  pageSize = 6,
  rolesUrl = "/data/roles.json",
  unitsUrl = "/data/units.json",
  membersUrl = "/data/members.json",
  onCounts,
  showFilteredCountInControls = true,
}: MembersListProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [roleId, setRoleId] = useState<number | "all">("all");
  const [unitId, setUnitId] = useState<number | "all">("all");

  const [visible, setVisible] = useState(pageSize);
  useEffect(() => setVisible(pageSize), [pageSize]);

  const rolesMap = useMemo(
    () => new Map<number, Role>(roles.map((r) => [r.id, r])),
    [roles],
  );
  const unitsMap = useMemo(
    () => new Map<number, Unit>(units.map((u) => [u.id, u])),
    [units],
  );

  // Chargement avec garde-fous (AbortError)
  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setErr(null);

    (async () => {
      try {
        const [r, u, m] = await Promise.all([
          fetchJson<Role[]>(rolesUrl, ac.signal),
          fetchJson<Unit[]>(unitsUrl, ac.signal),
          fetchJson<Member[]>(membersUrl, ac.signal),
        ]);
        if (ac.signal.aborted) return;
        setRoles(r);
        setUnits(u);
        setMembers(m.filter((x) => x.opt_in !== false));
      } catch (e: unknown) {
        const name = (e as { name?: string })?.name;
        if (name === "AbortError" || ac.signal.aborted) return;
        setErr((e as Error)?.message ?? "Erreur de chargement");
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [rolesUrl, unitsUrl, membersUrl]);

  const filtered = useMemo(
    () => applyFilters(members, query, roleId, unitId, rolesMap),
    [members, query, roleId, unitId, rolesMap],
  );

  const collator = useMemo(
    () => new Intl.Collator("fr", { sensitivity: "base", numeric: true }),
    [],
  );
  const sorted = useMemo(
    () => filtered.slice().sort((a, b) => collator.compare(a.pseudo, b.pseudo)),
    [filtered, collator],
  );

  useEffect(() => {
    onCounts?.({ total: members.length, filtered: sorted.length });
  }, [onCounts, members.length, sorted.length]);

  // Routing pour ?member=slug
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [selected, setSelected] = useState<Member | null>(null);

  useEffect(() => {
    const slug = params.get("member");
    if (!slug) {
      setSelected(null);
      return;
    }
    const m =
      sorted.find((x) => slugify(x.pseudo) === slug) ??
      members.find((x) => slugify(x.pseudo) === slug);
    if (m) setSelected(m);
  }, [params, sorted, members]);

  const openMember = useCallback(
    (m: Member) => {
      const p = new URLSearchParams(params.toString());
      p.set("member", slugify(m.pseudo));
      router.push(`${pathname}?${p.toString()}`, { scroll: false });
      setSelected(m);
    },
    [params, pathname, router],
  );

  const closeMember = useCallback(() => {
    const p = new URLSearchParams(params.toString());
    p.delete("member");
    router.push(`${pathname}?${p.toString()}`, { scroll: false });
    setSelected(null);
  }, [params, pathname, router]);

  // Handlers (éviter fonctions inline et reset pagination)
  const handleQuery = useCallback(
    (v: string) => {
      setQuery(v);
      setVisible(pageSize);
    },
    [pageSize],
  );

  const handleRole = useCallback(
    (v: number | "all") => {
      setRoleId(v);
      setVisible(pageSize);
    },
    [pageSize],
  );

  const handleUnit = useCallback(
    (v: number | "all") => {
      setUnitId(v);
      setVisible(pageSize);
    },
    [pageSize],
  );

  /* ===== Render ===== */
  if (loading) {
    return (
      <div className={className}>
        <div className="rounded-lg bg-white/5 p-4 text-sm opacity-70">
          Chargement des membres…
        </div>
      </div>
    );
  }
  if (err) {
    return (
      <div className={className}>
        <div className="rounded-lg bg-red-500/10 p-4 text-sm text-red-300 ring-1 ring-red-500/30">
          Erreur : {err}
        </div>
      </div>
    );
  }

  return (
    <section className={className}>
      {withControls && (
        <Controls
          query={query}
          onQuery={handleQuery}
          roles={roles}
          units={units}
          roleId={roleId}
          unitId={unitId}
          onRole={handleRole}
          onUnit={handleUnit}
          count={sorted.length}
          showCount={showFilteredCountInControls}
        />
      )}

      {sorted.length === 0 ? (
        <div className="rounded-lg bg-white/5 p-6 text-sm opacity-80">
          Aucun membre ne correspond à la recherche.
          <div className="mt-2 text-xs opacity-70">
            Astuce : élargis le terme ou réinitialise les filtres.
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.slice(0, visible).map((m) => (
              <MemberCardCompact
                key={`${m.id}-${slugify(m.pseudo)}`}
                member={m}
                roles={rolesMap}
                onClick={() => openMember(m)}
                isActive={selected?.id === m.id}
              />
            ))}
          </div>

          {visible < sorted.length && (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() =>
                  setVisible((v) => Math.min(v + pageSize, sorted.length))
                }
                className="rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
              >
                Voir plus
              </button>
            </div>
          )}
        </>
      )}

      {selected && (
        <MemberDialog
          member={selected}
          roles={rolesMap}
          units={unitsMap}
          onClose={closeMember}
        />
      )}
    </section>
  );
}
