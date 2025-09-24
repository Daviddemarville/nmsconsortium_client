// src/app/(site)/corpos/eclipse/page.tsx

import { headers } from "next/headers";
import Image from "next/image";
import BioDataPadHUD from "@/components/sections/BioDataPadHUD";
import FactBlock from "@/components/sections/FactBlock";

import ContactButton from "@/components/ui/ContactButton";
import DiscordButton from "@/components/ui/DiscordButton";

type LoreEntry = {
  title: string;
  intro?: string;
  body: string;
  quote?: string;
};
type Biorp = { consortium: LoreEntry; corpos: Record<string, LoreEntry> };

async function getBaseUrl() {
  const h = await headers(); // 👈 await (Next 15)
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

async function getBiorp(): Promise<Biorp> {
  const base = await getBaseUrl(); // 👈 await
  const res = await fetch(`${base}/data/biorp.json`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error("biorp.json introuvable");
  return res.json();
}

export default async function Core() {
  const biorp = await getBiorp();

  return (
    <>
      {/* ECLIPSE : Présentation RP */}
      <section
        id="pres_rp"
        className="flex flex-col md:flex-row items-center md:items-start md:justify-evenly gap-10"
      >
        <div>
          <Image
            src="/images/corpos/eclipse.png"
            alt="Logo de eclipse"
            width={200}
            height={200}
            className="w-32 md:w-48 h-auto"
            priority
          />
        </div>

        <div>
          <BioDataPadHUD
            data={biorp.corpos.eclipse}
            meta={{
              appLabel: "DATAPAD",
              version: "v1.3",
              date: "24/09/2955",
            }}
            width={420}
            height={640}
            sounds={false}
          />
        </div>
      </section>

      {/* Avertissement */}
      <section className="bg-black/30 text-shadow-black mt-10 p-2 rounded-2xl border-2 border-red-500">
        <h2>Avertissement</h2>
        <p>
          L'organisation que vous retrouvez sur cette page, représente notre
          vision de la corpo à la sortie de Star Citizen 1.0
        </p>
        <p>
          Nous nous sommes basé sur les informations reçus lors de la citizencon
          de 2024 et l'organisation est suceptible dévoluer en fonction des
          annonces des développeurs dans le future.
        </p>
      </section>

      {/* ECLIPSE : Présentation factuelle */}
      <section
        id="pres_officiel"
        className="pt-2 pb-4 my-16 px-4 md:px-8 lg:px-16"
      >
        <FactBlock pick={{ corpoKey: "eclipse" }}></FactBlock>
      </section>

      {/* Boutons rejoindre */}
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
            location="eclipse-page"
            className="bg-nms-gold text-nms-dark font-semibold hover:opacity-90 transition"
          />
          <ContactButton
            location="eclipse-page"
            className="bg-white/10 hover:bg-white/15 transition"
          />
        </div>
      </section>
    </>
  );
}
