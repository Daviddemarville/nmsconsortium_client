// src/app/(site)/corpos/nasa/page.tsx

import { headers } from "next/headers";
import Image from "next/image";
import BioDataPadHUD from "@/components/sections/BioDataPadHUD";
import FactBlock from "@/components/sections/FactBlock";
import MembersListCompact from "@/components/sections/MembersListCompact";
import ContactButton from "@/components/ui/ContactButton";
import DiscordButton from "@/components/ui/DiscordButton";
import WarningBanner from "@/components/ui/WarningBanner";

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
      {/* NASA : Présentation RP */}
      <section
        id="pres_rp"
        className="scroll-mt-[calc(var(--nav-h,56px)+40px)] flex flex-col md:flex-row items-center md:items-start md:justify-evenly gap-10"
      >
        <div>
          <Image
            src="/images/corpos/nasa.png"
            alt="Logo de NASA"
            width={200}
            height={200}
            className="w-32 md:w-48 h-auto"
            priority
          />
        </div>

        <div>
          <BioDataPadHUD
            data={biorp.corpos.nasa}
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
      <WarningBanner />

      {/* NASA : Présentation factuelle */}
      <section
        id="pres_officiel"
        className="scroll-mt-[calc(var(--nav-h,56px)+40px)] pt-2 pb-4 my-16 px-4 md:px-8 lg:px-16"
      >
        <FactBlock pick={{ corpoKey: "nasa" }}>
          <MembersListCompact
            unitPriority={[8]}
            rolePriority={[3, 5]}
            sort="alpha"
            limit={null}
          />
        </FactBlock>
      </section>

      {/* Boutons rejoindre */}
      <section
        id="rejoindre"
        aria-labelledby="rejoindre-title"
        className="scroll-mt-[calc(var(--nav-h,56px)+40px)] bg-black/30 p-6 rounded-lg mt-4"
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
            location="nasa-page"
            className="bg-nms-gold text-nms-dark font-semibold hover:opacity-90 transition"
          />
          <ContactButton
            location="nasa-page"
            className="bg-white/10 hover:bg-white/15 transition"
          />
        </div>
      </section>
    </>
  );
}
