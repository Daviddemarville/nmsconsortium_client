"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { trackLinkClick } from "@/lib/analytics";

type Ni2bMeta = {
  title?: string;
  description_md?: string;
  signature?: string;
  balance_auec?: number;
  updated_at?: string; // ISO
  sheet_url?: string;
  portrait_url?: string;
};

type Props = {
  apiUrl?: string; // default: /api/ni2b
  className?: string;
};

export default function Ni2bCard({
  apiUrl = "/api/ni2b",
  className = "",
}: Props) {
  const [meta, setMeta] = useState<Ni2bMeta | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(apiUrl, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as Ni2bMeta | { error: string };
        if ("error" in json) throw new Error(json.error);
        if (alive) setMeta(json as Ni2bMeta);
      } catch (e) {
        if (alive) setErr((e as Error).message || "Erreur de chargement");
      }
    })();
    return () => {
      alive = false;
    };
  }, [apiUrl]);

  // helpers de formatage
  const formatAmount = (n: unknown) => {
    const num = typeof n === "number" ? n : Number(n);
    if (!Number.isFinite(num)) return "—";
    try {
      return `${new Intl.NumberFormat("fr-FR").format(num)} aUEC`; // biome: template literal
    } catch {
      return `${num} aUEC`;
    }
  };

  // AFFICHER UNIQUEMENT LA DATE (pas l'heure)
  const formatUpdatedDateOnly = (iso: unknown) => {
    if (!iso || typeof iso !== "string" || iso.trim() === "") return "—";
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso; // brut si non parsable
      return d.toLocaleDateString("fr-FR", {
        timeZone: "Europe/Paris",
        year: "numeric",
        month: "long",
        day: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  if (err) {
    return (
      <section
        className={`rounded-2xl bg-black/30 text-white p-6 md:p-8 ${className}`}
      >
        <h3 className="text-xl font-semibold">NI2B</h3>
        <p className="mt-3 text-sm text-red-400">
          Impossible de charger les informations ({err}).
        </p>
      </section>
    );
  }

  if (!meta) {
    return (
      <section
        className={`rounded-2xl bg-black/30 text-white p-6 md:p-8 ${className}`}
      >
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-3">
            <div className="h-6 w-64 bg-white/10 rounded" />
            <div className="h-4 w-full bg-white/10 rounded" />
            <div className="h-4 w-5/6 bg-white/10 rounded" />
            <div className="h-4 w-3/5 bg-white/10 rounded" />
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="h-5 w-40 bg-white/10 rounded" />
            <div className="mt-3 h-8 w-48 bg-white/10 rounded" />
            <div className="mt-3 h-4 w-36 bg-white/10 rounded" />
            <div className="mt-4 h-9 w-44 bg-white/10 rounded" />
          </div>
        </div>
      </section>
    );
  }

  const {
    title = "NI2B — Banque communautaire du Consortium",
    description_md = "",
    signature,
    sheet_url,
    portrait_url,
    balance_auec,
    updated_at,
  } = meta;

  const amount = formatAmount(balance_auec);
  const updatedLabel = formatUpdatedDateOnly(updated_at);

  return (
    <section
      className={`rounded-2xl bg-black/30 text-white p-6 md:p-8 shadow-lg ${className}`}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Colonne texte */}
        <div className="md:col-span-2">
          <header className="flex items-start gap-4">
            {portrait_url && (
              <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden border border-white/15 bg-white/5">
                <Image
                  src={portrait_url}
                  alt="Portrait de Craysus"
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
            )}
            <div>
              <h3 className="text-xl md:text-2xl font-semibold">{title}</h3>
              {signature && (
                <div className="mt-1 text-xs text-white/70">
                  Signé : {signature}
                </div>
              )}
            </div>
          </header>

          {description_md && (
            <div className="mt-4">
              <MarkdownLite text={description_md} />
            </div>
          )}
        </div>

        {/* Colonne “comptable” */}
        <aside className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="text-sm uppercase tracking-wide text-white/70">
            Solde NI2B
          </div>
          <div className="mt-2 text-3xl font-semibold tabular-nums">
            {amount}
          </div>
          <div className="mt-1 text-xs text-white/60">
            Mise à jour : {updatedLabel}
          </div>

          {sheet_url && (
            <a
              href={sheet_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackLinkClick({
                  href: sheet_url,
                  label: "ni2b_sheet",
                  location: "ni2b_card",
                  outbound: true,
                })
              }
              className="mt-5 inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40"
            >
              Ouvrir le registre (Google Sheet)
            </a>
          )}
        </aside>
      </div>
    </section>
  );
}

/* ===== Markdown lite (titres, listes, paragraphes) + [br] ===== */
function MarkdownLite({ text }: { text: string }) {
  const blocks = text
    .replace(/\r\n/g, "\n")
    .split(/\n{1,}/)
    .filter(Boolean);
  const parts = [...blocks];
  const nodes: React.ReactNode[] = [];

  for (let i = 0; i < parts.length; i++) {
    const raw = parts[i];
    const line = raw?.trim();
    if (!line) continue;

    if (line === "[br]") {
      nodes.push(<div key={`sp-${i}`} className="h-6" aria-hidden />);
      continue;
    }

    if (/^###\s+/.test(line)) {
      nodes.push(
        <h4 key={`h4-${line}-${i}`}>{line.replace(/^###\s+/, "")}</h4>,
      );
      continue;
    }
    if (/^##\s+/.test(line)) {
      nodes.push(<h3 key={`h3-${line}-${i}`}>{line.replace(/^##\s+/, "")}</h3>);
      continue;
    }
    if (/^#\s+/.test(line)) {
      nodes.push(<h2 key={`h2-${line}-${i}`}>{line.replace(/^#\s+/, "")}</h2>);
      continue;
    }

    if (/^(-|\u2022)\s+/.test(line)) {
      const items: string[] = [line.replace(/^(-|\u2022)\s+/, "")];
      let j = i + 1;
      while (j < parts.length && /^(-|\u2022)\s+/.test(parts[j].trim())) {
        items.push(parts[j].trim().replace(/^(-|\u2022)\s+/, ""));
        parts[j] = "";
        j++;
      }
      nodes.push(
        <ul key={`ul-${i}`} className="list-disc pl-6">
          {(() => {
            const counts = new Map<string, number>();
            return items.map((it) => {
              const c = (counts.get(it) ?? 0) + 1;
              counts.set(it, c);
              return <li key={`${it}-${c}`}>{it}</li>;
            });
          })()}
        </ul>,
      );
      continue;
    }

    nodes.push(<p key={`p-${line}-${i}`}>{line}</p>);
  }

  return (
    <div className="prose prose-invert max-w-none prose-p:my-3 prose-li:my-1">
      {nodes}
    </div>
  );
}
