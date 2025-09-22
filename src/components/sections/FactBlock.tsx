// src/components/sections/FactBlock.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

/* ========= Types ========= */

type Section = {
  id?: string;
  title?: string;
  body_md?: string;
};

type ConsortiumLike = {
  tagline?: string;
  description_md?: string;
  description_paragraphs?: string[];
  sections?: Section[];
  links?: {
    members_page?: string;
    consortium?: string;
  };
};

type CorpoFile = {
  consortium?: ConsortiumLike;
  corpos?: Record<string, ConsortiumLike>;
};

type PickProp = "consortium" | { corpoKey: string };

type Props = {
  /** /data/corpo.json par défaut, mais peut pointer vers /data/ngn.json ou /data/ni2b.json */
  dataUrl?: string;
  /** Sélectionne la section à afficher quand on lit corpo.json */
  pick?: PickProp; // "consortium" (defaut) ou { corpoKey: "nsf" }
  title?: string; // Titre UI
  className?: string;
  /** Slot pour injecter la liste compacte des membres APRÈS le texte */
  children?: React.ReactNode;
};

/* ========= Composant ========= */

export default function FactBlock({
  dataUrl = "/data/corpo.json",
  pick = "consortium",
  title = "Présentation officielle",
  className = "",
  children,
}: Props) {
  const [data, setData] = useState<ConsortiumLike | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Clé de fetch stable (évite l’avertissement “deps size changed”)
  const pickKey =
    typeof pick === "string" ? pick : (pick?.corpoKey ?? "consortium");
  const fetchKey = `${dataUrl}::${pickKey}`;

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(dataUrl, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const raw = await res.json();

        let section: ConsortiumLike | null = null;

        // corpo.json (avec consortium/corpos)
        if (
          raw &&
          typeof raw === "object" &&
          ("consortium" in raw || "corpos" in raw)
        ) {
          const json = raw as CorpoFile;
          section =
            pickKey === "consortium"
              ? (json.consortium ?? null)
              : (json.corpos?.[pickKey] ?? null);
        } else {
          // Fichiers dédiés (ngn.json / ni2b.json) → le root EST la section
          section = raw as ConsortiumLike;
        }

        if (!section) throw new Error("Section introuvable");
        if (alive) setData(section);
      } catch (e: any) {
        if (alive) setErr(e?.message ?? "Erreur de chargement");
      }
    })();
    return () => {
      alive = false;
    };
  }, [fetchKey]); // taille du tableau constante

  // Hooks toujours au top-level
  const descMd = data?.description_md ?? "";
  const descParas = data?.description_paragraphs ?? [];
  const sections = data?.sections ?? [];

  const descriptionVNode = useMemo(() => {
    // utilisé uniquement quand il n’y a pas de sections[]
    if (Array.isArray(descParas) && descParas.length > 0) {
      return (
        <article className="prose prose-invert max-w-none prose-p:my-3 prose-li:my-1">
          {descParas.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </article>
      );
    }
    if (typeof descMd === "string" && descMd.trim().length > 0) {
      return <MarkdownLite text={descMd} />;
    }
    return null;
  }, [descMd, descParas]);

  if (err) {
    return (
      <section
        role="region"
        aria-labelledby="factblock-title"
        className={`rounded-2xl bg-black/30 text-white p-6 md:p-8 ${className}`}
      >
        <h2 id="factblock-title" className="text-2xl md:text-3xl font-semibold">
          {title}
        </h2>
        <p className="mt-4 text-sm opacity-80">
          Impossible de charger les informations ({err}).
        </p>
      </section>
    );
  }

  if (!data) {
    return (
      <section
        role="region"
        aria-labelledby="factblock-title"
        className={`rounded-2xl bg-black/30 text-white p-6 md:p-8 ${className}`}
      >
        <div className="animate-pulse space-y-4">
          <div className="h-7 w-56 rounded bg-white/10" />
          <div className="h-4 w-4/5 rounded bg-white/10" />
          <div className="h-4 w-3/5 rounded bg-white/10" />
        </div>
      </section>
    );
  }

  const { tagline, links } = data;

  const hasText =
    (sections && sections.length > 0) ||
    (descParas && descParas.length > 0) ||
    (descMd && descMd.trim().length > 0);

  return (
    <section
      role="region"
      aria-labelledby="factblock-title"
      className={`rounded-2xl bg-black/30 text-white p-6 md:p-10 shadow-lg ${className}`}
    >
      {/* En-tête minimal */}
      <header className="max-w-4xl">
        <p className="uppercase tracking-wide text-sm text-white/70">{title}</p>
        <h2
          id="factblock-title"
          className="mt-2 text-2xl md:text-4xl font-semibold"
        >
          Nemesis Consortium
        </h2>
        {tagline && <p className="mt-3 text-white/90">{tagline}</p>}
      </header>

      {/* 1) Texte AVANT la liste des membres */}
      {hasText && (
        <div className="mt-8 space-y-8">
          {/* Sommaire si plusieurs sections */}
          {sections.length > 1 && (
            <nav className="rounded-xl bg-white/5 border border-white/10 p-4">
              <h3 className="text-sm font-semibold mb-2">Sommaire</h3>
              <ul className="text-sm flex flex-wrap gap-3">
                {sections.map((s, i) =>
                  s?.title ? (
                    <li key={s.id ?? i}>
                      <a
                        href={`#${s.id ?? `sec-${i}`}`}
                        className="underline opacity-90 hover:opacity-100"
                      >
                        {s.title}
                      </a>
                    </li>
                  ) : null,
                )}
              </ul>
            </nav>
          )}

          {/* Sections → sinon description_md/paragraphs */}
          {sections.length > 0 ? (
            sections.map((s, i) => (
              <article
                key={s.id ?? i}
                id={s.id ?? `sec-${i}`}
                className="scroll-mt-28"
              >
                {s.title && (
                  <h3 className="text-xl md:text-2xl font-semibold">
                    {s.title}
                  </h3>
                )}
                {s.body_md && <MarkdownLite text={s.body_md} />}
              </article>
            ))
          ) : (
            <div>{descriptionVNode}</div>
          )}
        </div>
      )}

      {/* 2) Liste des membres après le texte */}
      {children && <div className="mt-8">{children}</div>}

      {/* 3) Footer minimal */}
      {(links?.members_page || links?.consortium) && (
        <footer className="mt-10 flex flex-wrap gap-3">
          {links?.members_page && (
            <A href={links.members_page}>Voir la liste complète des membres</A>
          )}
          {links?.consortium && (
            <A href={links.consortium}>Découvrir le Consortium / Rejoindre</A>
          )}
        </footer>
      )}
    </section>
  );
}

/* ========= Sous-composants ========= */

function MarkdownLite({ text }: { text: string }) {
  // Découpe simple : titres (#, ##, ###), listes (- ou •), paragraphes
  const blocks = text
    .replace(/\r\n/g, "\n")
    .split(/\n{1,}/)
    .filter(Boolean);

  // On clone le tableau pour pouvoir itérer et “consommer” les items de liste
  const parts = [...blocks];

  const nodes: React.ReactNode[] = [];
  for (let i = 0; i < parts.length; i++) {
    const line = parts[i]?.trim();
    if (!line) continue;

    // Titres
    if (/^###\s+/.test(line)) {
      nodes.push(<h4 key={`h4-${i}`}>{line.replace(/^###\s+/, "")}</h4>);
      continue;
    }
    if (/^##\s+/.test(line)) {
      nodes.push(<h3 key={`h3-${i}`}>{line.replace(/^##\s+/, "")}</h3>);
      continue;
    }
    if (/^#\s+/.test(line)) {
      nodes.push(<h2 key={`h2-${i}`}>{line.replace(/^#\s+/, "")}</h2>);
      continue;
    }

    // Listes (regroupe jusqu’au prochain bloc non-liste)
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
          {items.map((it, k) => (
            <li key={k}>{it}</li>
          ))}
        </ul>,
      );
      continue;
    }

    // Paragraphe
    nodes.push(<p key={`p-${i}`}>{line}</p>);
  }

  return (
    <div className="prose prose-invert max-w-none prose-p:my-3 prose-li:my-1">
      {nodes}
    </div>
  );
}

function A({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="inline-flex items-center rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40"
    >
      {children}
    </a>
  );
}
