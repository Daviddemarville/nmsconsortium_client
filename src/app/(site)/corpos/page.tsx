import Link from "next/link";
import OrgChart from "@/components/sections/OrgChart";
import PresentationCorpoSection from "@/components/sections/PresentationCorpoSection";

export default function Corpos() {
  return (
    <main className="container  mx-auto px-4 py-8">
      {/* Section qui sommes nous */}
      <section
        aria-label="Synthese du consortium Némésis"
        className="bg-black/30 p-6 rounded-lg"
      >
        <h1 className="text-2xl font-semibold">Qui sommes nous?</h1>
        <PresentationCorpoSection className="mt-4" />
      </section>

      {/* Organigramme */}
      <section
        aria-label="Organigramme du consortium Némésis"
        className="bg-black/30 p-6 rounded-lg mt-4"
      >
        <h2 id="rejoindre-title" className="text-2xl font-semibold">
          Organigramme du Consortium
        </h2>
        <OrgChart className="mt-4" />
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
    </main>
  );
}
