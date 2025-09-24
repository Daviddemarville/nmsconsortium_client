import OrgChart from "@/components/sections/OrgChart";
import PresentationCorpoSection from "@/components/sections/PresentationCorpoSection";
import ContactButton from "@/components/ui/ContactButton";
import DiscordButton from "@/components/ui/DiscordButton";

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
          <DiscordButton
            inviteUrl="https://discord.gg/FYmSmhRjW9"
            location="consortium-page"
            className="bg-nms-gold text-nms-dark font-semibold hover:opacity-90 transition"
          />

          <ContactButton
            location="consortium-page"
            className=" bg-white/10  hover:bg-white/15 transition"
          />
        </div>
      </section>
    </main>
  );
}
