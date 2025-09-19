// src/lib/analytics.ts
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";

const CONSENT_KEY = "nms_consent_v2";
const DEBUG = process.env.NEXT_PUBLIC_GA_DEBUG === "1";

type ConsentState = "granted" | "denied";
type ConsentKey =
  | "ad_user_data"
  | "ad_personalization"
  | "ad_storage"
  | "analytics_storage"
  | "functionality_storage"
  | "personalization_storage"
  | "security_storage";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

/** Push brut dans dataLayer (safe SSR) */
export function gtag(...args: unknown[]) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(args);
}

/** Pageview manuel (car send_page_view: false côté config) */
export function pageview(path: string) {
  if (!GA_ID || typeof window === "undefined") return;
  window.gtag?.("event", "page_view", {
    page_location: window.location.href,
    page_path: path,
    page_title: typeof document !== "undefined" ? document.title : "",
    ...(DEBUG ? { debug_mode: true } : {}),
  });
}

/** Event générique réutilisable (CTA, nav, etc.) */
export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (!GA_ID || typeof window === "undefined") return;
  window.gtag?.("event", name, {
    ...(params ?? {}),
    ...(DEBUG ? { debug_mode: true } : {}),
  });
}

/** Met à jour le consentement côté GA + persiste localement */
export function updateConsent(
  partial: Partial<Record<ConsentKey, ConsentState>>,
) {
  if (typeof window === "undefined") return;
  window.gtag?.("consent", "update", partial);
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(partial));
  } catch {
    // ignore storage errors
  }
}

/** Lit le consentement stocké (null si aucun choix encore) */
export function readConsent(): Partial<
  Record<ConsentKey, ConsentState>
> | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    return raw
      ? (JSON.parse(raw) as Partial<Record<ConsentKey, ConsentState>>)
      : null;
  } catch {
    return null;
  }
}

/** Accepter (analytics autorisé ; pas d'Ads) */
export function grantAllAnalytics() {
  updateConsent({
    analytics_storage: "granted",
    functionality_storage: "granted",
    personalization_storage: "granted",
    security_storage: "granted",
    // Publicité non utilisée → on reste explicite
    ad_user_data: "denied",
    ad_personalization: "denied",
    ad_storage: "denied",
  });
}

/** Refuser (analytics & assimilés désactivés) */
export function denyAll() {
  updateConsent({
    analytics_storage: "denied",
    functionality_storage: "denied",
    personalization_storage: "denied",
    // Ads toujours refusées
    ad_user_data: "denied",
    ad_personalization: "denied",
    ad_storage: "denied",
    // security_storage reste géré par le "default" dans le layout
  });
}
