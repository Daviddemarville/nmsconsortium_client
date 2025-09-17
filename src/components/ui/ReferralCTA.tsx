// PATCH: rotation quotidienne à 00:01 Europe/Paris, ordre stable, timer auto, + MODALE RESTAURÉE

"use client";

import { Copy, Info, Link as LinkIcon } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import ReferralInfoContent from "./ReferralInfoContent";

type Member = { name?: string; referralCode?: string; active?: boolean };
type Referral = {
  id?: number;
  owner?: string;
  code?: string;
  active?: boolean;
};

type Props = {
  label?: string;
  membersUrl?: string; // ← /data/referrals.json par défaut
  fallbackCode?: string;
  targetBlank?: boolean;
  modalTitle?: string;
  modalContent?: React.ReactNode;
  className?: string;
  /** Point de départ de la rotation (date locale Europe/Paris, inclusif). */
  rotationStartISO?: string; // ex: "2025-01-01"
  /** Fuseau utilisé pour le découpage du jour. */
  timeZone?: string; // ex: "Europe/Paris"
};

function normalizeReferral(code: string) {
  const trimmed = (code ?? "").trim().toUpperCase();
  return trimmed.startsWith("STAR-") ? trimmed : `STAR-${trimmed}`;
}

function buildRsiLink(code: string) {
  const normalized = normalizeReferral(code);
  return `https://www.robertsspaceindustries.com/enlist?referral=${encodeURIComponent(
    normalized,
  )}`;
}

/** Diff de jours entre deux YYYY-MM-DD (UTC minuit vs UTC minuit) */
function daysSince(dateISO: string, sinceISO: string) {
  const parts = (s: string) => {
    const [y, m, d] = s.split("-").map(Number);
    return { y, m, d };
  };
  const mkUTC = ({ y, m, d }: { y: number; m: number; d: number }) =>
    Date.UTC(y, m - 1, d, 0, 0, 0, 0);

  const nowUTC = mkUTC(parts(dateISO));
  const startUTC = mkUTC(parts(sinceISO));
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
  const y = parts.find((p) => p.type === "year")?.value ?? "1970";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
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

  const parts = fmt
    .formatToParts(now)
    .reduce<Record<string, string>>((acc, p) => {
      if (p.type !== "literal") acc[p.type] = p.value;
      return acc;
    }, {});
  const y = Number(parts.year);
  const m = Number(parts.month);
  const d = Number(parts.day);
  const h = Number(parts.hour);
  const min = Number(parts.minute);

  const local = new Date(y, m - 1, d, h, min, 0, 0);
  const goal = new Date(local);
  if (h === 0 && min < 1) {
    goal.setHours(0, 1, 0, 0); // aujourd’hui 00:01
  } else {
    goal.setDate(goal.getDate() + 1);
    goal.setHours(0, 1, 0, 0); // demain 00:01
  }
  return Math.max(1, goal.getTime() - local.getTime());
}

export default function ReferralCTA({
  label = "Rejoindre Star Citizen",
  membersUrl = "/data/referrals.json",
  fallbackCode = "STAR-B6BC-635Q",
  targetBlank = true,
  modalTitle = "Code de Parrainage - Referral Code",
  modalContent = <ReferralInfoContent />, // ← défaut = nouveau composant
  className = "",
  rotationStartISO = "2025-01-01", // point zéro de la rotation (J0 = 1er code)
  timeZone = "Europe/Paris",
}: Props) {
  const [code, setCode] = useState<string>(fallbackCode);
  const [copied, setCopied] = useState<null | "code" | "link">(null);
  const [list, setList] = useState<string[]>([]); // liste triée, active, normalisée
  const [open, setOpen] = useState(false); // ← modal
  const timerRef = useRef<number | null>(null);
  const dialogTitleId = useId();
  const dialogDescId = useId();

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
            .filter((m: Member) => m?.referralCode?.trim())
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
          .filter((r) => (r?.code ?? "").trim() && r.active !== false)
          .sort((a, b) => {
            const aid = a.id ?? Number.MAX_SAFE_INTEGER;
            const bid = b.id ?? Number.MAX_SAFE_INTEGER;
            if (aid !== bid) return aid - bid;
            const ao = (a.owner ?? "").localeCompare(b.owner ?? "");
            if (ao !== 0) return ao;
            return (a.code ?? "").localeCompare(b.code ?? "");
          })
          .map((r) => normalizeReferral(r.code ?? ""));

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
  const computeCodeForToday = useCallback(
    (codes: string[]) => {
      const safeFallback = normalizeReferral(fallbackCode);
      if (!codes.length) return safeFallback;
      const today = localYMD(timeZone);
      const n = daysSince(today, rotationStartISO);
      const idx = ((n % codes.length) + codes.length) % codes.length; // modulo safe
      return codes[idx] ?? safeFallback;
    },
    [rotationStartISO, timeZone, fallbackCode],
  );

  // Applique immédiatement et programme le prochain switch à 00:01
  useEffect(() => {
    // clear timer précédent
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    // si pas de liste → fallback immédiat
    if (!list.length) {
      setCode(normalizeReferral(fallbackCode));
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
    }, ms);

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [list, timeZone, fallbackCode, computeCodeForToday]);

  // Fermer la modale avec Echap
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // lock le scroll du body quand la modale est ouverte
  useEffect(() => {
    if (!open) return;
    const { style } = document.documentElement;
    const prev = style.overflow;
    style.overflow = "hidden";
    return () => {
      style.overflow = prev;
    };
  }, [open]);

  const rsiLink = useMemo(() => buildRsiLink(code), [code]);

  const copy = async (what: "code" | "link") => {
    try {
      await navigator.clipboard.writeText(what === "code" ? code : rsiLink);
      setCopied(what);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className={`inline-flex flex-col gap-3 ${className}`}>
      <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-background/70 backdrop-blur px-2 py-2">
        <a
          href={rsiLink}
          target={targetBlank ? "_blank" : undefined}
          rel={targetBlank ? "noopener noreferrer" : undefined}
          aria-label={`${label} avec le code ${code}${
            targetBlank ? " (nouvel onglet)" : ""
          }`}
          title="Créer votre compte avec ce code"
          className="group inline-flex items-center rounded-lg px-2 py-1.5 hover:bg-nms-gold hover:text-nms-dark transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nms-gold"
        >
          <span className="font-mono text-lg tracking-wide">{code}</span>
        </a>

        <button
          type="button"
          className="inline-grid h-8 w-8 place-items-center rounded-md border border-white/10 hover:bg-nms-gold hover:text-nms-dark transition"
          onClick={() => copy("code")}
          title="Copier le code"
          aria-label="Copier le code de parrainage"
        >
          <Copy className="h-4 w-4" aria-hidden />
        </button>

        <button
          type="button"
          className="inline-grid h-8 w-8 place-items-center rounded-md border border-white/10 hover:bg-nms-gold hover:text-nms-dark transition"
          onClick={() => copy("link")}
          title="Copier le lien"
          aria-label="Copier le lien d’inscription RSI"
        >
          <LinkIcon className="h-4 w-4" aria-hidden />
        </button>

        {/* Bouton d'ouverture de la modale d'explication */}
        {modalContent && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="ml-1 inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-xs hover:bg-white/10 transition"
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls="referral-info-dialog"
            title="Plus d'informations"
          >
            <Info className="h-4 w-4" aria-hidden />
            <span>Infos</span>
          </button>
        )}

        {copied && (
          <span className="ml-1 text-xs opacity-80">
            {copied === "code" ? "Code copié" : "Lien copié"}
          </span>
        )}
      </div>

      {/* MODALE */}
      {modalContent && open && (
        <div
          id="referral-info-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby={dialogTitleId}
          aria-describedby={dialogDescId}
          className="fixed inset-0 z-50 bg-black/60 p-4 sm:p-6"
          onClick={() => setOpen(false)} // close on backdrop
          onKeyDown={(e) => {
            // fermer au clavier si l'événement vient du backdrop lui-même
            if (
              e.currentTarget === e.target &&
              (e.key === "Enter" || e.key === " ")
            ) {
              e.preventDefault();
              setOpen(false);
            }
          }}
        >
          <div
            role="document"
            tabIndex={-1}
            className="mx-auto w-full max-w-lg max-h-[85dvh] overflow-y-auto overscroll-contain rounded-2xl border border-white/10 bg-background/95 p-4 shadow-xl backdrop-blur pb-[env(safe-area-inset-bottom)]"
            onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
            onKeyDown={(e) => {
              // empêcher que 'Espace/Entrée' à l'intérieur fasse remonter jusqu'au backdrop
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
              }
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 id={dialogTitleId} className="text-lg font-semibold">
                {modalTitle}
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-grid h-8 w-8 place-items-center rounded-md border border-white/10 hover:bg-white/10 transition"
                aria-label="Fermer la fenêtre"
                title="Fermer"
              >
                ✕
              </button>
            </div>

            {/* zone scrollable */}
            <div id={dialogDescId} className="mt-3 text-sm opacity-80">
              {modalContent}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-white/10 px-3 py-1.5 text-sm hover:bg-white/10 transition"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
