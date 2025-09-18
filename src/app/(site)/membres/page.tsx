"use client";

import Link from "next/link";
import { useState } from "react";
import IntegrationSection from "@/components/sections/IntegrationSection";
import MembersList from "@/components/sections/MembersList";

export default function MembresPage() {
  const [counts, setCounts] = useState({ total: 0, filtered: 0 });

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Section membres */}
      <section
        aria-label="Membres du consortium Némésis"
        className="bg-black/30 p-6 rounded-lg"
      >
        <h1 className="text-2xl font-semibold">Membres</h1>
        <p className="mt-2">Effectifs : {counts.total} membres actifs</p>
        <p className="text-sm opacity-70">
          Résultats filtrés : {counts.filtered}
        </p>
        <MembersList
          className="mt-2"
          withControls
          pageSize={6}
          onCounts={setCounts} // ← récupère { total, filtered }
          showFilteredCountInControls={false} // ← masque "X résultat(s)" à droite si tu préfères
        />
      </section>

      {/* Parcours d’intégration */}
      <section
        id="integration"
        aria-labelledby="integration-title"
        className="bg-black/30 p-6 rounded-lg mt-4"
      >
        <IntegrationSection className="mt-2" />
      </section>

      {/* Rejoindre le consortium */}
      <section
        id="rejoindre"
        aria-labelledby="rejoindre-title"
        className="bg-black/30 p-6 rounded-lg mt-4"
      >
        <h2 id="rejoindre-title" className="text-2xl font-semibold">
          Rejoindre le consortium
        </h2>
        <p className="mt-2 text-sm opacity-70">
          Tu veux nous rejoindre&nbsp;? Passe sur notre Discord pour échanger,
          ou envoie-nous un message via le formulaire de contact.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="https://discord.gg/FYmSmhRjW9"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Rejoindre le Discord Némésis"
            className="inline-flex items-center justify-center rounded-full bg-nms-gold text-nms-dark px-5 py-2.5 font-semibold hover:opacity-90 transition"
          >
            DISCORD NÉMÉSIS
          </a>
          <Link
            href="/contact"
            aria-label="Postuler au consortium via le formulaire de contact"
            className="inline-flex items-center justify-center rounded-full bg-white/10 px-4 py-2 font-semibold hover:bg-white/15 transition"
          >
            Postuler / Nous contacter
          </Link>
        </div>
      </section>

      {/* En savoir plus */}
      <section
        id="a-propos"
        aria-labelledby="apropos-title"
        className="bg-black/30 p-6 rounded-lg mt-4"
      >
        <h2 id="apropos-title" className="text-2xl font-semibold">
          En savoir plus
        </h2>
        <p className="mt-2 text-sm opacity-70">
          Pour l’histoire, les objectifs et l’organisation du consortium,
          consulte la page{" "}
          <Link href="/qui-sommes-nous" className="underline hover:opacity-80">
            Qui sommes-nous&nbsp;?
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
