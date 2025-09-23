// src/app/(site)/corpos/page.tsx

import { headers } from "next/headers";
import Image from "next/image";
import BioDataPadHUD from "@/components/sections/BioDataPadHUD";
import FactBlock from "@/components/sections/FactBlock";
import MembersListCompact from "@/components/sections/MembersListCompact";
import Ni2bCard from "@/components/sections/Ni2bCard";

type LoreEntry = {
  title: string;
  intro?: string;
  body: string;
  quote?: string;
};
type Biorp = { consortium: LoreEntry; corpos: Record<string, LoreEntry> };

function baseUrl() {
  // ⚡ headers() est async → on retourne une Promise<string>
  return (async () => {
    const h = await headers(); // 👈 on attend
    const host = h.get("host") ?? "localhost:3000";
    const proto = h.get("x-forwarded-proto") ?? "http";
    return `${proto}://${host}`;
  })();
}

async function getBiorp(): Promise<Biorp> {
  const base = await baseUrl(); // 👈 récupère l’URL avec await
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
      <section className="flex flex-col md:flex-row items-center md:items-start md:justify-evenly gap-10">
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
            sounds={false} // 👈 coupe le son des boutons
          />
        </div>
      </section>
      <section className=" pt-2 pb-4 my-16 px-4 md:px-8 lg:px-16">
        <FactBlock pick="consortium">
          {/* Ex: liste synthétique des membres du consortium (unitId=1) */}
          <MembersListCompact
            unitPriority={[17, 1]} // affiche 17 en premier, puis 1
            rolePriority={[1, 5]} // optionnel: prioriser certains rôles
            sort="alpha" // ou "role", "unit"
            limit={null} // optionnel: limiter le nb affiché
          />
        </FactBlock>
      </section>
      <section className="pt-2 pb-4 my-16 px-4 md:px-8 lg:px-16">
        <Ni2bCard apiUrl="/api/ni2b" className="mt-5" />
      </section>

      {/* ============== GUIDE D'UTILISATION ==============
sort="alpha"     tri alphabétique
sort="role"      tri selon l’ordre hiérarchique de roles.json
sort="unit"      tri selon l’ordre défini dans units.json
 Page corpo : Ambassadeurs (17) d’abord, puis Consortium (1), reste alpha
<MembersListCompact 
  unitPriority={[17, 1]} 
  sort="alpha" 
/>

 Page NSF : trier les membres par grade militaire
<MembersListCompact 
  unitPriority={[5]}    // NSF
  sort="role" 
/>

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
