"use client";

import {
  AlertTriangle,
  Clock,
  FileInput,
  Gift,
  HelpCircle,
  UserPlus,
} from "lucide-react";

export default function ReferralInfoContent() {
  return (
    <div className="space-y-6 text-sm leading-relaxed">
      {/* Intro / bénéfice */}
      <section className="rounded-xl border border-white/10 bg-background/70 backdrop-blur p-4">
        <div className="flex items-center gap-3">
          <Gift className="h-5 w-5 text-nms-gold" aria-hidden />
          <p className="font-medium">
            Ajoutez gratuitement{" "}
            <span className="font-bold">50&nbsp;000 UEC</span> à votre compte
            Star Citizen.
          </p>
        </div>

        <p className="mt-3 opacity-90">
          Créer un compte Star Citizen sur le site Roberts Space Industries
          (RSI) est sans obligation d’achat et vous permettra d’être prêt pour
          les événements de Free Fly (Vol Libre) régulièrement organisés au
          cours de l’année, afin de tester le jeu.
        </p>
        <p className="mt-3 opacity-90">
          À la création de votre compte, un <em>Referral&nbsp;Code</em> (code de
          parrainage) peut être renseigné. Son utilisation est facultative, mais
          elle vous permet de bénéficier d’un bonus de{" "}
          <strong>50&nbsp;000&nbsp;UEC</strong>, la monnaie en jeu de Star
          Citizen. Ce code peut provenir d’un ami, d’un streamer, ou tout
          simplement de la présente page.
        </p>
      </section>

      <hr className="border-white/10" />

      {/* FAQ express */}
      <section className="space-y-4">
        <div className="flex items-start gap-3">
          <UserPlus className="mt-0.5 h-5 w-5 opacity-80" aria-hidden />
          <div>
            <h4 className="font-semibold">
              Qu’est-ce que le “Referral&nbsp;Code” ?
            </h4>
            <p className="opacity-90">
              C’est un code de parrainage communiqué par un autre joueur.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <HelpCircle className="mt-0.5 h-5 w-5 opacity-80" aria-hidden />
          <div>
            <h4 className="font-semibold">
              Le Referral Code est-il obligatoire&nbsp;?
            </h4>
            <p className="opacity-90">
              Non. Il est optionnel, mais le renseigner lors de la création de
              votre compte ajoute <strong>50&nbsp;000&nbsp;UEC</strong> à vos
              crédits en jeu.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Clock className="mt-0.5 h-5 w-5 opacity-80" aria-hidden />
          <div>
            <h4 className="font-semibold">Quand l’utiliser&nbsp;?</h4>
            <p className="opacity-90">
              Au moment de la création du compte, ou dans un délai de
              <strong>&nbsp;24&nbsp;heures</strong> après sa création.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <FileInput className="mt-0.5 h-5 w-5 opacity-80" aria-hidden />
          <div>
            <h4 className="font-semibold">Où le saisir&nbsp;?</h4>
            <p className="opacity-90">
              Sur le formulaire <em>Enlist&nbsp;Now</em> du site RSI, dans
              l’encadré “Referral&nbsp;Code”. Cette zone est désormais
              clairement visible dans le formulaire (entre la date de naissance
              et les cases de validation).
            </p>
            <p className="mt-2 opacity-90">
              Si vous accédez au formulaire via un lien d’inscription prérempli,
              le code de votre référant s’affichera automatiquement dans ce
              champ.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-background/70 p-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-nms-gold" aria-hidden />
          <p className="opacity-90">
            Le Referral Code ne peut être utilisé qu’à la création du compte (ou
            dans les 24&nbsp;heures qui suivent). Il ne peut pas être ajouté
            rétroactivement sur un compte existant.
          </p>
        </div>
      </section>
    </div>
  );
}
