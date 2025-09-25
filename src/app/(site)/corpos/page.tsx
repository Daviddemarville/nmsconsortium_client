// src/app/(site)/corpos/page.tsx

import { headers } from "next/headers";
import Image from "next/image";
import AionCard from "@/components/sections/AionCard";
import BioDataPadHUD from "@/components/sections/BioDataPadHUD";
import DiplomacyCard from "@/components/sections/DiplomacyCard";
import FactBlock from "@/components/sections/FactBlock";
import MembersListCompact from "@/components/sections/MembersListCompact";
import NgnCard from "@/components/sections/NgnCard";
import Ni2bCard from "@/components/sections/Ni2bCard";
import NsfCard from "@/components/sections/NsfCard";
import ContactButton from "@/components/ui/ContactButton";
import DiscordButton from "@/components/ui/DiscordButton";

type LoreEntry = {
  title: string;
  intro?: string;
  body: string;
  quote?: string;
};
type Biorp = { consortium: LoreEntry; corpos: Record<string, LoreEntry> };

function baseUrl() {
  // ⚡ headers() est sync, mais ton pattern fonctionne ; on garde tel quel.
  return (async () => {
    const h = await headers();
    const host = h.get("host") ?? "localhost:3000";
    const proto = h.get("x-forwarded-proto") ?? "http";
    return `${proto}://${host}`;
  })();
}

async function getBiorp(): Promise<Biorp> {
  const base = await baseUrl();
  const res = await fetch(`${base}/data/biorp.json`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error("biorp.json introuvable");
  return res.json();
}

export default async function Consortium() {
  const biorp = await getBiorp();

  return (
    <>
      {/* CONSORTIUM : Présentation RP */}
      <section
        id="pres_rp"
        className="scroll-mt-[calc(var(--nav-h,56px)+40px)] flex flex-col md:flex-row items-center md:items-start md:justify-evenly gap-10"
      >
        <div>
          <Image
            src="/images/LOGOS-ORGAS-2_global.png"
            alt="Logo de la Nemesis Consortium"
            width={200}
            height={200}
            className="w-32 md:w-48 h-auto"
            priority
          />
        </div>
        <div>
          <BioDataPadHUD
            data={biorp.consortium}
            meta={{
              appLabel: "DATAPAD",
              version: "v1.3",
              date: "22/09/2955",
              subject: "Un peu d'histoire!",
            }}
            width={420}
            height={640}
            sounds={false}
          />
        </div>
      </section>

      {/* CONSORTIUM : Présentation factuelle */}
      <section
        id="pres_officiel"
        className="scroll-mt-[calc(var(--nav-h,56px)+40px)] pt-2 pb-4 my-16 px-4 md:px-8 lg:px-16"
      >
        <FactBlock pick="consortium">
          <MembersListCompact
            unitPriority={[17, 1]}
            rolePriority={[1, 5]}
            sort="alpha"
            limit={null}
          />
        </FactBlock>
      </section>

      {/* DIPLOMATIE */}
      <section
        id="diplomatie"
        className="scroll-mt-[calc(var(--nav-h,56px)+40px)] text-center pt-2 pb-4 my-16 px-4 md:px-8 lg:px-16"
      >
        {/* 👇 Retrait des props portrait_url et illustration_url (gérées par /data/diplomacy_meta.json) */}
        <DiplomacyCard unitIds={[12]} />
      </section>

      {/* NI2B */}
      <section
        id="ni2b"
        className="scroll-mt-[calc(var(--nav-h,56px)+40px)] pt-2 pb-4 my-16 px-4 md:px-8 lg:px-16"
      >
        <Ni2bCard apiUrl="/api/ni2b" className="mt-5" />
      </section>

      {/* NSF */}
      <section
        id="nsf"
        className="scroll-mt-[calc(var(--nav-h,56px)+40px)] text-center pt-2 pb-4 my-16 px-4 md:px-8 lg:px-16"
      >
        <NsfCard unitIds={[5]} />
      </section>

      {/* AION */}
      <section
        id="aion"
        className="scroll-mt-[calc(var(--nav-h,56px)+40px)] text-center pt-2 pb-4 my-16 px-4 md:px-8 lg:px-16"
      >
        <AionCard unitIds={[4]} />
      </section>

      {/* NGN */}
      <section
        id="ngn"
        className="scroll-mt-[calc(var(--nav-h,56px)+40px)] text-center pt-2 pb-4 my-16 px-4 md:px-8 lg:px-16"
      >
        <NgnCard unitIds={[2]} />
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
            location="corpos-page"
            className="bg-nms-gold text-nms-dark font-semibold hover:opacity-90 transition"
          />
          <ContactButton
            location="corpos-page"
            className=" bg-white/10  hover:bg-white/15 transition"
          />
        </div>
      </section>

      {/*
      ============== GUIDE D'UTILISATION ==============
      sort="alpha"     tri alphabétique
      sort="role"      tri selon l’ordre hiérarchique de roles.json
      sort="unit"      tri selon l’ordre défini dans units.json

      Page corpo : Ambassadeurs (17) d’abord, puis Consortium (1), reste alpha
      <MembersListCompact unitPriority={[17, 1]} sort="alpha" />

      Page NSF : trier les membres par grade militaire
      <MembersListCompact unitPriority={[5]} sort="role" />

      Page générale : trier tous les membres par unités
      <MembersListCompact sort="unit" />

      <FactBlock pick={{ corpoKey: "nsf" }}>
        <MembersListCompact unitPriority={[5]} sort="role" />
      </FactBlock>

      <FactBlock dataUrl="/data/ngn.json">
        <MembersListCompact includeUnits={[2]} sort="alpha" />
        ensuite, un NGNCarousel branché sur ngn_media.json si tu veux
      </FactBlock>

      <FactBlock dataUrl="/data/ni2b.json">
        <MembersListCompact includeUnits={[3]} sort="alpha" />
        puis un NI2BBalance qui lit ni2b_meta.json
      </FactBlock>
      */}
    </>
  );
}
