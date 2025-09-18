// src/components/sections/IntegrationSection.tsx

export type IntegrationSectionProps = {
  className?: string;
};

export default function IntegrationSection({
  className,
}: IntegrationSectionProps) {
  const steps = [
    {
      title: "Arrivant",
      bullets: [
        "Réunion d’incorporation",
        "Exprimer le souhait de devenir postulant",
      ],
    },
    {
      title: "Postulant (~30 j)",
      bullets: [
        "Stages en micro-entreprises / unités publiques",
        "Entretien avec le GC",
      ],
    },
    {
      title: "Membre",
      bullets: [
        "Créer / rejoindre une micro-entreprise (ou rester freelance)",
        "Incorporation RSI (org mère + corpo fille)",
      ],
    },
  ] as const;

  return (
    <section
      id="integration"
      aria-labelledby="integration-title"
      className={className}
    >
      <h2 id="integration-title" className="text-2xl font-semibold">
        Parcours d’intégration
      </h2>

      {/* Intro */}
      <p className="mt-2 text-sm opacity-80 max-w-prose">
        La NMS propose à ses nouveaux arrivants un parcours d’intégration
        complet qui permet de découvrir les principaux gameplays de Star
        Citizen, de choisir une carrière ou spécialité en connaissance de cause,
        et de devenir autonome rapidement… tout en s’amusant.
      </p>
      <p className="mt-2 text-sm opacity-80 max-w-prose">
        Ce parcours est structuré, mais flexible : des étapes claires, ponctuées
        par des entretiens, et un accompagnement humain. Une équipe du{" "}
        <em>Global Council</em> suit chaque nouvelle recrue, s’assure que tout
        se passe bien et reste à l’écoute au quotidien.
      </p>

      {/* Pourquoi ce parcours ? */}
      <div className="mt-4 rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
        <div className="font-semibold">Pourquoi ce parcours&nbsp;?</div>
        <ul className="mt-2 grid gap-1 text-sm opacity-80 sm:grid-cols-3 list-disc pl-5">
          <li>Mieux comprendre nos métiers et gameplays</li>
          <li>Choisir un rôle et une unité adaptés à ton style</li>
          <li>Devenir opérationnel rapidement avec du soutien</li>
        </ul>
      </div>

      {/* Timeline 3 étapes */}
      <ol className="mt-4 grid gap-4 sm:grid-cols-3">
        {steps.map((s) => (
          <li
            key={s.title}
            className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10"
          >
            <h3 className="font-semibold">{s.title}</h3>
            <ul className="mt-2 space-y-1 text-sm opacity-80 list-disc pl-5">
              {s.bullets.map((b) => (
                <li key={`${s.title}-${b}`}>{b}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      {/* Accès Discord */}
      <div className="mt-6 text-sm">
        <div className="font-semibold">Accès Discord</div>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/10 px-2 py-0.5 ring-1 ring-white/10">
            Arrivant&nbsp;: quelques canaux
          </span>
          <span className="rounded-full bg-white/10 px-2 py-0.5 ring-1 ring-white/10">
            Postulant&nbsp;: majorité des canaux
          </span>
          <span className="rounded-full bg-white/10 px-2 py-0.5 ring-1 ring-white/10">
            Membre&nbsp;: tous les canaux
          </span>
        </div>
        <p className="mt-2 opacity-80 max-w-prose">
          Le Discord est notre hub de coordination. L’accès s’élargit au fil des
          étapes pour t’aider à t’impliquer progressivement dans la vie du
          consortium.
        </p>
      </div>

      {/* Critères de validation */}
      <div className="mt-6 rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
        <div className="font-semibold">
          Les points clés pour rejoindre le consortium
        </div>
        <ul className="mt-2 grid gap-1 text-sm opacity-80 sm:grid-cols-2 list-disc pl-5">
          <li>Motivation et engagement</li>
          <li>Stages réalisés (sérieux et assiduité)</li>
          <li>Présence minimale</li>
          <li>Esprit collectif (entraide & respect)</li>
          <li>Intégration sociale au sein de l’équipe</li>
          <li>Participation aux activités et événements</li>
        </ul>
      </div>
    </section>
  );
}
