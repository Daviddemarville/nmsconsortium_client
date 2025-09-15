import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Nemesis Consortium",
  description: "Site v0 du Consortium Nemesis",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground antialiased min-h-dvh`}
      >
        <Header />
        {/* pb = hauteur du footer (h-16 = 4rem) + safe area iOS */}
        <main className="w-full mx-auto max-w-6xl px-4 py-10 pb-[calc(4rem+env(safe-area-inset-bottom))]">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
