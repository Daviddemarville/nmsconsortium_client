// src/components/sections/PresentationCorpoSection.tsx

import CorpoLogoGrid from "./CorpoLogoGrid";

export type PresentationCorpoSectionProps = {
  className?: string;
  title?: string;
};

export default function PresentationCorpoSection({
  className,
  title = "Présentation du consortium",
}: PresentationCorpoSectionProps) {
  return (
    <section
      id="presentation"
      aria-labelledby="presentation-title"
      className={className}
    >
      <h2 id="presentation-title" className="text-2xl font-semibold">
        {title}
      </h2>

      {/* Intro */}
      <p className="mt-2 text-sm opacity-90 max-w-prose">
        Némésis Consortium est une corporation conviviale et fun, faite
        d'entraide et de bonne ambiance. parce qu'on sait que le jeu n'est
        qu'un...jeu!
      </p>
      <p className="mt-2 text-sm opacity-90 max-w-prose">
        Afin d'enrichir ce jeu, qui n'est encore qu'en version alpha, nous
        essayons de mettre en place des actions en commun, au sein de notre
        propre corpo, mais aussi lors d'évents avec d'autres corpo Amies. On
        essaye au mieux de profiter des gameplay qui nous sont actuellement
        accessibles, et l'on touche un peu à tout ( minage, salvage, commerce,
        combat, delivery etc....)
      </p>
      <p className="mt-2 text-sm opacity-90 max-w-prose">
        Toutefois, notre identité est basée sur les OPERATIONS INDUSTRIELLES.
        mais avec une force de sécurité associée: la NEMESIS SECURITY FORCES et
        completé par l'AION notre corps médical.
      </p>
      <p className="mt-2 text-sm opacity-90 max-w-prose">
        Nous sommes une corpo francophone déjà présent en Europe et en Amerique
        du Nord.
      </p>

      {/* Mission / Valeurs / Piliers */}
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
          <div className="font-semibold">Notre mission</div>
          <p className="mt-2 text-sm opacity-80">
            Offrir un cadre clair et bienveillant pour apprendre, se spécialiser
            et s’accomplir en groupe, tout en laissant la place à l’autonomie et
            à l’initiative.
          </p>
        </div>

        <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
          <div className="font-semibold">Nos valeurs</div>
          <ul className="mt-2 space-y-1 text-sm opacity-80 list-disc pl-5">
            <li>Respect et fair-play</li>
            <li>Esprit d’équipe et entraide</li>
            <li>Progression, partage et plaisir de jeu</li>
          </ul>
        </div>

        <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
          <div className="font-semibold">Nos piliers (gameplays)</div>
          <ul className="mt-2 grid gap-1 text-sm opacity-80 list-disc pl-5">
            <li>Commerce & transport</li>
            <li>Industrie & logistique</li>
            <li>Exploration & science</li>
            <li>Sécurité & escorte</li>
          </ul>
        </div>
      </div>

      {/* Organisation */}
      <div className="mt-4 rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
        <div className="font-semibold">Organisation</div>
        <ul className="mt-2 grid gap-1 text-sm opacity-80 sm:grid-cols-2 list-disc pl-5">
          <li>
            <span className="font-medium">Micro-entreprises&nbsp;:</span>{" "}
            équipes à taille humaine pour s’entraîner, opérer et monter des
            projets.
          </li>
          <li>
            <span className="font-medium">Unités&nbsp;:</span> regroupements par
            métiers / objectifs, pour coordonner les activités et la formation.
          </li>
          <li>
            <span className="font-medium">Global Council&nbsp;:</span>{" "}
            orientation, accompagnement, validation des passages clés.
          </li>
          <li>
            <span className="font-medium">Incorporation RSI&nbsp;:</span>{" "}
            organisation mère et corporations filles, selon les besoins
            opérationnels.
          </li>
        </ul>
        <CorpoLogoGrid className="mt-4" />
      </div>

      {/* Fonctionnement & esprit */}
      <div className="mt-4 rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
        <div className="font-semibold">Fonctionnement & esprit</div>
        <ul className="mt-2 grid gap-1 text-sm opacity-80 sm:grid-cols-2 list-disc pl-5">
          <li>Calendrier d’opérations, entraînements et événements internes</li>
          <li>Stages et accompagnement pour monter en compétence</li>
          <li>Objectifs d’équipe et autonomie individuelle</li>
          <li>Communication claire via Discord (briefs, retours, entraide)</li>
        </ul>
      </div>

      {/* Ce que tu y trouveras / Ce que nous attendons */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
          <div className="font-semibold">Ce que tu y trouveras</div>
          <ul className="mt-2 space-y-1 text-sm opacity-80 list-disc pl-5">
            <li>Un cadre accueillant pour progresser</li>
            <li>Des rôles clairs et évolutifs</li>
            <li>Des groupes actifs pour jouer régulièrement</li>
            <li>Des projets concrets à construire ensemble</li>
          </ul>
        </div>
        <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
          <div className="font-semibold">Ce que nous attendons</div>
          <ul className="mt-2 space-y-1 text-sm opacity-80 list-disc pl-5">
            <li>Motivation, respect et fiabilité</li>
            <li>Esprit collectif et communication</li>
            <li>Participation aux activités (selon ton rythme)</li>
            <li>Envie de partager et d’apprendre</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
