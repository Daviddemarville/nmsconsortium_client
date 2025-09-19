"use client";

import { useEffect, useState } from "react";
import {
  denyAll,
  grantAllAnalytics,
  readConsent,
  trackEvent,
  updateConsent,
} from "@/lib/analytics";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const saved = readConsent();
    if (saved) {
      // Réapplique le choix stocké, puis cache la bannière
      updateConsent(saved);
      setVisible(false);
    } else {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 flex justify-center px-2 pb-2">
      <div className="w-full md:max-w-3xl border border-[#1c2a3a] bg-[#0a0f1a] p-4 shadow-xl text-white rounded-t-xl">
        <div className="text-sm font-mono border-b border-[#1c2a3a] pb-2 mb-2">
          RGPD - Consentement
        </div>

        <p className="text-sm text-[#d1d5db] space-y-2">
          <span className="block">
            Nous utilisons quelques cookies uniquement pour suivre la
            fréquentation et améliorer votre expérience sur le site du
            Consortium.
          </span>
          <span className="block">
            Ces informations restent entre nous et ne sont jamais partagées avec
            des tiers (pas même à Chris s’il nous propose de nous offrir un
            Javelin&nbsp;!).
          </span>
          <span className="block">
            Pour nous aider à améliorer ce site, nous vous remercions d’accepter
            ces cookies.
          </span>
          <span className="block">
            Pas d’inquiétude&nbsp;: si vous les refusez, vous pourrez continuer
            à naviguer librement… sans craindre de 30K&nbsp;!
          </span>
        </p>

        <div className="mt-4 flex justify-end gap-3">
          {/* Buttons refuser */}
          <button
            type="button"
            onClick={() => {
              denyAll();
              trackEvent("consent_reject");
              setVisible(false);
            }}
            className="px-4 py-1.5 border border-red-600 text-red-400 hover:bg-red-900/40 transition font-semibold rounded-lg"
          >
            Refuser
          </button>
          {/* Buttons accepter */}
          <button
            type="button"
            onClick={() => {
              grantAllAnalytics();
              trackEvent("consent_accept");
              setVisible(false);
            }}
            className="px-4 py-1.5 border border-green-600 text-green-400 hover:bg-green-900/40 transition font-semibold rounded-lg"
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}
