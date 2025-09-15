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
import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";

type Member = {
  name?: string;
  referralCode?: string; // ex: "STAR-B6BC-635Q" ou "B6BC-635Q"
  active?: boolean; // si présent et false → ignoré
};

type Props = {
  label?: string;
  /** URL (publique) du JSON membres */
  membersUrl?: string;
  /** Code par défaut si pas de JSON / pas de code */
  fallbackCode?: string;
  /** Ouvre le lien dans un nouvel onglet */
  targetBlank?: boolean;
  /** Titre + contenu de la modale */
  modalTitle?: string;
  modalContent?: React.ReactNode;
  className?: string;
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

export default function ReferralCTA({
  label = "Rejoindre Star Citizen",
  membersUrl = "/data/members.json",
  fallbackCode = "STAR-B6BC-635Q",
  targetBlank = true,
  modalTitle = "Code de Parrainage - Referral Code",
  modalContent = (
    <div className="space-y-6 text-sm leading-relaxed">
      {/* Intro / bénéfice */}
      <section className="rounded-xl border border-white/10 bg-background/70 backdrop-blur p-4">
        <div className="flex items-center gap-3">
          <Gift className="h-5 w-5 text-nms-gold" aria-hidden />
          <p className="font-medium">
            Ajoutez gratuitement{" "}
            <span className="font-bold">50&nbsp;000 UEC</span> à votre compte
            Star Citizen.
          </p>
        </div>

        <p className="mt-3 opacity-90">
          Créer un compte Star Citizen sur le site Roberts Space Industries
          (RSI) est sans obligation d’achat et vous permettra d’être prêt pour
          les événements de Free Fly (Vol Libre) régulièrement organisés au
          cours de l’année, afin de tester le jeu.
        </p>
        <p className="mt-3 opacity-90">
          À la création de votre compte, un <em>Referral&nbsp;Code</em> (code de
          parrainage) peut être renseigné. Son utilisation est facultative, mais
          elle vous permet de bénéficier d’un bonus de{" "}
          <strong>50&nbsp;000&nbsp;UEC</strong>, la monnaie en jeu de Star
          Citizen. Ce code peut provenir d’un ami, d’un streamer, ou tout
          simplement de la présente page.
        </p>
      </section>

      <hr className="border-white/10" />

      {/* FAQ express */}
      <section className="space-y-4">
        <div className="flex items-start gap-3">
          <UserPlus className="mt-0.5 h-5 w-5 opacity-80" aria-hidden />
          <div>
            <h4 className="font-semibold">
              Qu’est-ce que le “Referral&nbsp;Code” ?
            </h4>
            <p className="opacity-90">
              C’est un code de parrainage communiqué par un autre joueur.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <HelpCircle className="mt-0.5 h-5 w-5 opacity-80" aria-hidden />
          <div>
            <h4 className="font-semibold">
              Le Referral Code est-il obligatoire&nbsp;?
            </h4>
            <p className="opacity-90">
              Non. Il est optionnel, mais le renseigner lors de la création de
              votre compte ajoute <strong>50&nbsp;000&nbsp;UEC</strong> à vos
              crédits en jeu.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Clock className="mt-0.5 h-5 w-5 opacity-80" aria-hidden />
          <div>
            <h4 className="font-semibold">Quand l’utiliser&nbsp;?</h4>
            <p className="opacity-90">
              Au moment de la création du compte, ou dans un délai de
              <strong>&nbsp;24&nbsp;heures</strong> après sa création.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <FileInput className="mt-0.5 h-5 w-5 opacity-80" aria-hidden />
          <div>
            <h4 className="font-semibold">Où le saisir&nbsp;?</h4>
            <p className="opacity-90">
              Sur le formulaire <em>Enlist&nbsp;Now</em> du site RSI, dans
              l’encadré “Referral&nbsp;Code”. Cette zone est désormais
              clairement visible dans le formulaire (entre la date de naissance
              et les cases de validation).
            </p>
            <p className="mt-2 opacity-90">
              Si vous accédez au formulaire via un lien d’inscription prérempli,
              le code de votre référant s’affichera automatiquement dans ce
              champ.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-background/70 p-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-nms-gold" aria-hidden />
          <p className="opacity-90">
            Le Referral Code ne peut être utilisé qu’à la création du compte (ou
            dans les 24&nbsp;heures qui suivent). Il ne peut pas être ajouté
            rétroactivement sur un compte existant.
          </p>
        </div>
      </section>
    </div>
  ),
  className = "",
}: Props) {
  const [code, setCode] = useState<string>(fallbackCode);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<null | "code" | "link">(null);

  const dialogTitleId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const firstFocusableRef = useRef<HTMLButtonElement | null>(null);
  const lastFocusableRef = useRef<HTMLButtonElement | null>(null);

  // Récupération du code au hasard depuis /data/members.json (si dispo)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(membersUrl, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const list: Member[] = Array.isArray(data)
          ? data
          : (data?.members ?? []);
        const candidates = list.filter(
          (m) =>
            m?.referralCode && m?.referralCode.trim() && m?.active !== false,
        );
        if (!cancelled && candidates.length) {
          const pick =
            candidates[Math.floor(Math.random() * candidates.length)];
          setCode(normalizeReferral(pick.referralCode!));
        }
      } catch {
        // ignore → fallbackCode
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [membersUrl]);

  const rsiLink = useMemo(() => buildRsiLink(code), [code]);

  // Gestion modale : scroll lock + focus trap + ESC
  useEffect(() => {
    const el = document.documentElement;
    if (open) el.classList.add("overflow-hidden");
    else el.classList.remove("overflow-hidden");
    return () => el.classList.remove("overflow-hidden");
  }, [open]);

  useEffect(() => {
    if (!open && triggerRef.current) triggerRef.current.focus();
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") setOpen(false);
      if (e.key === "Tab") {
        const first = firstFocusableRef.current;
        const last = lastFocusableRef.current;
        if (!first || !last) return;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const copy = async (text: string, what: "code" | "link") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // noop
    }
  };

  return (
    <div className={`inline-flex flex-col gap-3 ${className}`}>
      {/* Bloc code cliquable + actions copy + (i) */}
      <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-background/70 backdrop-blur px-2 py-2">
        {/* Le code = lien RSI */}
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

        {/* Copier le code */}
        <button
          type="button"
          className="inline-grid h-8 w-8 place-items-center rounded-md border border-white/10 hover:bg-nms-gold hover:text-nms-dark transition"
          onClick={() => copy(code, "code")}
          title="Copier le code"
          aria-label="Copier le code de parrainage"
        >
          <Copy className="h-4 w-4" aria-hidden />
        </button>

        {/* Copier le lien */}
        <button
          type="button"
          className="inline-grid h-8 w-8 place-items-center rounded-md border border-white/10 hover:bg-nms-gold hover:text-nms-dark transition"
          onClick={() => copy(rsiLink, "link")}
          title="Copier le lien"
          aria-label="Copier le lien d’inscription RSI"
        >
          <LinkIcon className="h-4 w-4" aria-hidden />
        </button>

        {/* Ouvrir la modale d'info */}
        <button
          ref={triggerRef}
          type="button"
          className="inline-grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-background/70 backdrop-blur text-foreground/90 hover:bg-nms-gold hover:text-nms-dark transition"
          aria-haspopup="dialog"
          aria-expanded={open ? "true" : "false"}
          aria-controls="referral-info-dialog"
          onClick={() => setOpen(true)}
          title="Information parrainage"
        >
          <Info className="h-4 w-4" aria-hidden />
        </button>

        {/* petit retour visuel */}
        {copied && (
          <span className="ml-1 text-xs opacity-80">
            {copied === "code" ? "Code copié" : "Lien copié"}
          </span>
        )}
      </div>

      {/* Notice XS (texte fourni) */}
      <div className="text-xs opacity-80 leading-relaxed">
        <p>
          Copier/coller ce code afin de le placer dans le formulaire de création
          du compte Star Citizen dans la zone prévue à cet effet.
        </p>
        <p>Ou suivez ce lien ci-dessus pour créer votre compte</p>
      </div>

      {/* Modale d’info */}
      {open && (
        <div
          id="referral-info-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby={dialogTitleId}
          // ⬇️ conteneur scrollable sur mobile
          className="fixed inset-0 z-50 flex items-start justify-center px-4 py-6 overflow-y-auto"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          {/* Overlay */}
          <div className="pointer-events-none fixed inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Boîte de dialogue */}
          <div
            className="
        relative z-10 w-full max-w-lg my-auto
        rounded-2xl bg-background text-foreground shadow-xl ring-1 ring-white/10
        p-6
        // ⬇️ limite de hauteur + scroll interne
        max-h-[85svh] overflow-y-auto overscroll-contain
      "
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id={dialogTitleId} className="text-lg font-semibold">
                {modalTitle}
              </h2>

              {/* sentinelle début */}
              <button
                ref={firstFocusableRef}
                className="sr-only"
                onClick={() => setOpen(false)}
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-white/15 px-3 py-1.5 text-sm hover:bg-nms-gold hover:text-nms-dark transition"
              >
                Fermer
              </button>
            </div>

            <div className="mt-4 text-sm leading-relaxed opacity-90">
              {modalContent}
            </div>

            {/* sentinelle fin */}
            <button ref={lastFocusableRef} className="sr-only">
              .
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
