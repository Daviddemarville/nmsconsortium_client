"use client";

import { useEffect, useMemo, useState } from "react";
import { trackEvent, trackLinkClick } from "@/lib/analytics";

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
    rsi?: string; // lien externe RSI
  };
};

type CorpoFile = {
  consortium?: ConsortiumLike;
  corpos?: Record<string, ConsortiumLike>;
};

type PickProp = "consortium" | { corpoKey: string };

type Props = {
  dataUrl?: string; // /data/corpo.json par défaut (ou /data/ngn.json /data/ni2b.json)
  pick?: PickProp; // "consortium" (defaut) ou { corpoKey: "nsf" } quand dataUrl=corpo.json
  title?: string; // Titre UI
  className?: string;
  children?: React.ReactNode; // Slot: liste des membres APRÈS le texte
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

  // clé de sélection pour corpo.json
  const pickKey =
    typeof pick === "string" ? pick : (pick?.corpoKey ?? "consortium");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(dataUrl, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const raw = await res.json();

        let section: ConsortiumLike | null = null;

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
          section = raw as ConsortiumLike; // fichiers dédiés (ngn/ni2b)
        }

        if (!section) throw new Error("Section introuvable");
        if (alive) setData(section);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        if (alive) setErr(msg || "Erreur de chargement");
      }
    })();
    return () => {
      alive = false;
    };
  }, [dataUrl, pickKey]);

  // Hooks toujours au top-level
  const descMd = data?.description_md ?? "";
  const descParas = data?.description_paragraphs ?? [];
  const sections = data?.sections ?? [];

  const descriptionVNode = useMemo(() => {
    // utilisé uniquement quand il n’y a pas de sections[]
    if (Array.isArray(descParas) && descParas.length > 0) {
      const counts = new Map<string, number>();
      return (
        <article className="prose prose-invert max-w-none prose-p:my-3 prose-li:my-1">
          {descParas.map((p) => {
            const c = (counts.get(p) ?? 0) + 1;
            counts.set(p, c);
            return <p key={`${p.slice(0, 24)}-${c}`}>{p}</p>;
          })}
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
                {(() => {
                  const counts = new Map<string, number>();
                  return sections.map((s, i) => {
                    if (!s?.title) return null;
                    const keyBase = s.id ?? s.title;
                    const c = (counts.get(keyBase) ?? 0) + 1;
                    counts.set(keyBase, c);
                    const safeKey = s.id ?? `${s.title}-${c}`;
                    const anchor = `#${s.id ?? `sec-${i}`}`;
                    return (
                      <li key={safeKey}>
                        <a
                          href={anchor}
                          className="underline opacity-90 hover:opacity-100"
                          onClick={() =>
                            trackEvent("toc_click", {
                              section_id: s.id ?? `sec-${i}`,
                              section_title: s.title,
                              location: "factblock_toc",
                            })
                          }
                        >
                          {s.title}
                        </a>
                      </li>
                    );
                  });
                })()}
              </ul>
            </nav>
          )}

          {/* Sections → sinon description_md/paragraphs */}
          {sections.length > 0 ? (
            (() => {
              const counts = new Map<string, number>();
              return sections.map((s, i) => {
                const keyBase = s?.id ?? s?.title ?? "sec";
                const c = (counts.get(keyBase) ?? 0) + 1;
                counts.set(keyBase, c);
                const safeKey = s?.id ?? `${s?.title ?? "sec"}-${c}`;
                const anchorId = s?.id ?? `sec-${i}`;
                return (
                  <article key={safeKey} id={anchorId} className="scroll-mt-28">
                    {s?.title && (
                      <h3 className="text-xl md:text-2xl font-semibold">
                        {s.title}
                      </h3>
                    )}
                    {s?.body_md && <MarkdownLite text={s.body_md} />}
                  </article>
                );
              });
            })()
          ) : (
            <div>{descriptionVNode}</div>
          )}
        </div>
      )}

      {/* 2) Liste des membres après le texte */}
      {children && <div className="mt-8">{children}</div>}

      {/* 3) Footer minimal */}
      {(links?.members_page || links?.consortium || links?.rsi) && (
        <footer className="mt-10 flex flex-wrap gap-3">
          {links?.members_page && (
            <A href={links.members_page} label="members_list">
              Voir la liste complète des membres
            </A>
          )}
          {links?.consortium && (
            <A href={links.consortium} label="consortium_page">
              Découvrir le Consortium
            </A>
          )}
          {links?.rsi && (
            <A href={links.rsi} label="rsi_profile">
              Nous retrouver sur le site de RSI
            </A>
          )}
        </footer>
      )}
    </section>
  );
}

/* ========= Sous-composants ========= */

function MarkdownLite({ text }: { text: string }) {
  // Titres (#, ##, ###), listes (- ou •), paragraphes
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

    // Spacer explicite : une ligne contenant exactement "[br]"
    if (line === "[br]") {
      nodes.push(<div key={`sp-${i}`} className="h-6" aria-hidden />);
      continue;
    }

    // Titres
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

    // Paragraphe
    nodes.push(<p key={`p-${line}-${i}`}>{line}</p>);
  }

  return (
    <div className="prose prose-invert max-w-none prose-p:my-3 prose-li:my-1">
      {nodes}
    </div>
  );
}

function A({
  href,
  children,
  className = "",
  location = "factblock_footer",
  label,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  location?: string; // ex: "factblock_footer", "header", etc.
  label?: string; // ex: "members_list", "consortium_page", "rsi_profile"
}) {
  const siteDomain = process.env.NEXT_PUBLIC_SITE_DOMAIN; // ex: "nemesis.example.com"
  const isExternal =
    /^https?:\/\//i.test(href) &&
    (siteDomain ? !href.includes(siteDomain) : true);

  const handleClick = () => {
    trackLinkClick({
      href,
      label:
        label ??
        (typeof children === "string" ? (children as string) : undefined),
      location,
      outbound: isExternal,
    });
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className={`inline-flex items-center rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40 ${className}`}
    >
      {children}
    </a>
  );
}
