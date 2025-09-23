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

type GAParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

/** Push brut dans dataLayer (SSR-safe) */
export function gtag(...args: unknown[]) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(args);
}

/** Pageview manuelle (send_page_view: false côté config) */
export function pageview(path: string) {
  if (!GA_ID || typeof window === "undefined") return;
  gtag("event", "page_view", {
    page_location: window.location.href,
    page_path: path,
    page_title: typeof document !== "undefined" ? document.title : "",
    ...(DEBUG ? { debug_mode: true } : {}),
  } satisfies GAParams);
}

/** Event générique (CTA, nav, etc.) — jamais perdu si gtag pas prêt */
export function trackEvent(name: string, params: GAParams = {}) {
  if (!GA_ID || typeof window === "undefined") return;
  gtag("event", name, {
    ...params,
    transport_type: "beacon",
    ...(DEBUG ? { debug_mode: true } : {}),
  } satisfies GAParams);
}

/** Utilitaire dédié aux liens */
export function trackLinkClick(args: {
  href: string;
  label?: string;
  location?: string; // ex: "factblock_footer", "header"
  outbound?: boolean;
}) {
  const { href, label, location = "unknown", outbound } = args;
  const url = new URL(
    href,
    typeof window !== "undefined" ? window.location.origin : "http://localhost",
  );
  trackEvent(outbound ? "click_outbound_link" : "click_internal_link", {
    link_url: url.href,
    link_domain: url.hostname,
    label,
    location,
  });
}

/** Met à jour le consentement côté GA + persiste localement */
export function updateConsent(
  partial: Partial<Record<ConsentKey, ConsentState>>,
) {
  if (typeof window === "undefined") return;
  gtag("consent", "update", partial);
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
    ad_user_data: "denied",
    ad_personalization: "denied",
    ad_storage: "denied",
  });
}
