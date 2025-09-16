// PATCH: rotation quotidienne à 00:01 Europe/Paris, ordre stable et timer auto

"use client";

import {
  AlertTriangle,
  Clock,
  Copy,
  FileInput,
  Gift,
  HelpCircle,
  Info,
  Link as LinkIcon,
  UserPlus,
} from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

type Member = { name?: string; referralCode?: string; active?: boolean };
type Referral = { id?: number; owner?: string; code?: string; active?: boolean };

type Props = {
  label?: string;
  membersUrl?: string;                // ← /data/referrals.json par défaut
  fallbackCode?: string;
  targetBlank?: boolean;
  modalTitle?: string;
  modalContent?: React.ReactNode;
  className?: string;
  /** Point de départ de la rotation (date locale Europe/Paris, inclusif). */
  rotationStartISO?: string;          // ex: "2025-01-01"
  /** Fuseau utilisé pour le découpage du jour. */
  timeZone?: string;                  // ex: "Europe/Paris"
};

function normalizeReferral(code: string) {
  const trimmed = code.trim().toUpperCase();
  return trimmed.startsWith("STAR-") ? trimmed : `STAR-${trimmed}`;
}
function buildRsiLink(code: string) {
  const normalized = normalizeReferral(code);
  return `https://www.robertsspaceindustries.com/enlist?referral=${encodeURIComponent(
    normalized,
  )}`;
}

/** Convertit une date (YYYY-MM-DD) en nombre de jours depuis l'époque en timezone donnée */
function daysSince(dateISO: string, sinceISO: string, timeZone: string) {
  const parts = (s: string) => {
    const [y, m, d] = s.split("-").map(Number);
    return { y, m, d };
  };
  const mkUTC = ({ y, m, d }: { y: number; m: number; d: number }) =>
    Date.UTC(y, m - 1, d, 0, 0, 0, 0);

  // Corrige en timezone: on formate en tz et on lit le jour/mois/année
  const fmt = new Intl.DateTimeFormat("fr-FR", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parseInTz = (d: Date) => {
    const [{ value: jour }, , { value: mois }, , { value: an }] = fmt.formatToParts(d);
    return { y: Number(an), m: Number(mois), d: Number(jour) };
  };

  const nowParts = parts(dateISO);
  const startParts = parts(sinceISO);

  // On retransforme en UTC « minuit tz » pour diff de jours propre
  const nowUTC = mkUTC(nowParts);
  const startUTC = mkUTC(startParts);

  return Math.floor((nowUTC - startUTC) / 86400000);
}

/** Renvoie la date locale "YYYY-MM-DD" pour un fuseau donné */
function localYMD(timeZone: string, date = new Date()) {
  const fmt = new Intl.DateTimeFormat("fr-FR", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(date);
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  const d = parts.find((p) => p.type === "day")!.value;
  return `${y}-${m}-${d}`;
}

/** millis jusqu'au prochain 00:01 du fuseau donné */
function msUntilNext0001(timeZone: string) {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  // composons le prochain 00:01 local
  const parts = fmt.formatToParts(now).reduce<Record<string, string>>((acc, p) => {
    if (p.type !== "literal") acc[p.type] = p.value;
    return acc;
  }, {});
  const y = Number(parts.year);
  const m = Number(parts.month);
  const d = Number(parts.day);
  const h = Number(parts.hour);
  const min = Number(parts.minute);

  // si on est avant 00:01 → aujourd’hui 00:01, sinon → demain 00:01
  const target = new Date(now);
  target.setSeconds(0, 0);
  // Remettre l'heure locale courante dans ce fuseau n'est pas trivial sans Temporal,
  // on contourne: on crée une date locale par incrément
  const local = new Date(y, m - 1, d, h, min, 0, 0);
  const goal = new Date(local);
  if (h < 0 || (h === 0 && min < 1)) {
    goal.setHours(0, 1, 0, 0); // aujourd'hui 00:01
  } else {
    goal.setDate(goal.getDate() + 1);
    goal.setHours(0, 1, 0, 0); // demain 00:01
  }
  return goal.getTime() - local.getTime();
}

export default function ReferralCTA({
  label = "Rejoindre Star Citizen",
  membersUrl = "/data/referrals.json",
  fallbackCode = "STAR-B6BC-635Q",
  targetBlank = true,
  modalTitle = "Code de Parrainage - Referral Code",
  modalContent,
  className = "",
  rotationStartISO = "2025-01-01",    // point zéro de la rotation (J0 = 1er code)
  timeZone = "Europe/Paris",
}: Props) {
  const [code, setCode] = useState<string>(fallbackCode);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<null | "code" | "link">(null);
  const [list, setList] = useState<string[]>([]); // liste triée, active, normalisée

  const dialogTitleId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const firstFocusableRef = useRef<HTMLButtonElement | null>(null);
  const lastFocusableRef = useRef<HTMLButtonElement | null>(null);
  const timerRef = useRef<number | null>(null);

  // Charge referrals.json et normalise
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(membersUrl, { cache: "no-store" });
        if (!res.ok) return;

        const raw = await res.json();
        let items: Referral[] = [];

        if (Array.isArray(raw)) {
          items = raw.filter(Boolean);
        } else if (Array.isArray(raw?.referrals)) {
          items = raw.referrals.filter(Boolean);
        } else if (Array.isArray(raw?.members)) {
          // compat members.json
          const converted: Referral[] = raw.members
            .filter((m: Member) => m?.referralCode && m?.referralCode.trim())
            .map((m: Member, idx: number) => ({
              id: idx + 1,
              owner: m.name,
              code: m.referralCode,
              active: m.active ?? true,
            }));
          items = converted;
        }

        // filtre actifs + normalise + ordre stable
        const activeCodes = items
          .filter((r) => r?.code && r.active !== false)
          .sort((a, b) => {
            const aid = a.id ?? Number.MAX_SAFE_INTEGER;
            const bid = b.id ?? Number.MAX_SAFE_INTEGER;
            if (aid !== bid) return aid - bid;
            const ao = (a.owner ?? "").localeCompare(b.owner ?? "");
            if (ao !== 0) return ao;
            return (a.code ?? "").localeCompare(b.code ?? "");
          })
          .map((r) => normalizeReferral(r.code!));

        if (!cancelled) {
          setList(activeCodes);
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [membersUrl]);

  // Calcule le code courant en fonction du jour local (Europe/Paris) et de la rotation
  const computeCodeForToday = (codes: string[]) => {
    if (!codes.length) return fallbackCode;
    const today = localYMD(timeZone);
    const n = daysSince(today, rotationStartISO, timeZone);
    const idx = ((n % codes.length) + codes.length) % codes.length; // modulo safe
    return codes[idx];
  };

  // Applique immédiatement et programme le prochain switch à 00:01
  useEffect(() => {
    // clear timer précédent
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    // si pas de liste → fallback
    if (!list.length) {
      setCode(fallbackCode);
      return;
    }
    // applique maintenant
    setCode(computeCodeForToday(list));

    // programme MAJ à 00:01 prochaine (puis toutes les 24h)
    const ms = msUntilNext0001(timeZone);
    timerRef.current = window.setTimeout(function tick() {
      setCode(computeCodeForToday(list));
      // replanifie dans ~24h
      timerRef.current = window.setTimeout(tick, 24 * 60 * 60 * 1000);
    }, Math.max(1, ms)); // garde >=1ms

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, rotationStartISO, timeZone, fallbackCode]);

  const rsiLink = useMemo(() => buildRsiLink(code), [code]);

  // ----------- (le reste de ton rendu/UX est inchangé) -----------
  // ... (pour la brièveté, réutilise ton JSX existant : boutons, modale, etc.)
  // ----------------------------------------------------------------

  return (
    <div className={`inline-flex flex-col gap-3 ${className}`}>
      <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-background/70 backdrop-blur px-2 py-2">
        <a
          href={rsiLink}
          target={targetBlank ? "_blank" : undefined}
          rel={targetBlank ? "noopener noreferrer" : undefined}
          aria-label={`Créer votre compte Star Citizen avec le code ${code}${targetBlank ? " (nouvel onglet)" : ""}`}
          title="Créer votre compte avec ce code"
          className="group inline-flex items-center rounded-lg px-2 py-1.5 hover:bg-nms-gold hover:text-nms-dark transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nms-gold"
        >
          <span className="font-mono text-lg tracking-wide">{code}</span>
        </a>

        <button
          type="button"
          className="inline-grid h-8 w-8 place-items-center rounded-md border border-white/10 hover:bg-nms-gold hover:text-nms-dark transition"
          onClick={async () => {
            await navigator.clipboard.writeText(code);
            setCopied("code");
            setTimeout(() => setCopied(null), 1500);
          }}
          title="Copier le code"
          aria-label="Copier le code de parrainage"
        >
          <Copy className="h-4 w-4" aria-hidden />
        </button>

        <button
          type="button"
          className="inline-grid h-8 w-8 place-items-center rounded-md border border-white/10 hover:bg-nms-gold hover:text-nms-dark transition"
          onClick={async () => {
            await navigator.clipboard.writeText(rsiLink);
            setCopied("link");
            setTimeout(() => setCopied(null), 1500);
          }}
          title="Copier le lien"
          aria-label="Copier le lien d’inscription RSI"
        >
          <LinkIcon className="h-4 w-4" aria-hidden />
        </button>

        {copied && (
          <span className="ml-1 text-xs opacity-80">
            {copied === "code" ? "Code copié" : "Lien copié"}
          </span>
        )}
      </div>

      {/* Tu peux remettre ici la notice + la modale identiques à ta version */}
    </div>
  );
}
