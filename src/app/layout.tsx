import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script"; // ⬅️ AJOUT
import type { ReactNode } from "react";
import "./globals.css";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import AnalyticsRouter from "@/components/sections/AnalyticsRouter";
import CookieBanner from "@/components/ui/CookieBanner";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Nemesis Consortium",
  description:
    "Site communautaire du Consortium Nemesis : présentation, membres, corpos filles, actualités et contacts.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground antialiased min-h-dvh`}
      >
        {/* === GA4 + Consent Mode v2 (default denied) === */}
        {gaId && (
          <>
            {/* Consent par défaut AVANT le chargement du tag */}
            <Script id="ga-consent-default" strategy="beforeInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('consent', 'default', {
                  'ad_user_data': 'denied',
                  'ad_personalization': 'denied',
                  'ad_storage': 'denied',
                  'analytics_storage': 'denied',
                  'functionality_storage': 'denied',
                  'personalization_storage': 'denied',
                  'security_storage': 'granted'
                });
              `}
            </Script>

            {/* Charge le tag GA4 */}
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />

            {/* Init GA4 (sans page_view auto) */}
            <Script id="ga-init" strategy="afterInteractive">
              {`
                gtag('js', new Date());
                gtag('config', '${gaId}', { send_page_view: false });
              `}
            </Script>
          </>
        )}

        <Header />
        <CookieBanner />
        <AnalyticsRouter />
        <main className="w-full mx-auto max-w-6xl px-4 py-10 pb-[calc(4rem+env(safe-area-inset-bottom))]">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
