"use client";

import Link from "next/link";
import { trackEvent } from "@/lib/analytics";

type Props = {
  href?: string; // par défaut /contact
  location?: string; // ex. "header" | "footer" | "home"
  className?: string;
  children?: React.ReactNode;
};

export default function ContactButton({
  href = "/contact",
  location = "unknown",
  className = "",
  children,
}: Props) {
  return (
    <Link
      href={href}
      onClick={() => trackEvent("cta_contact", { location, href })}
      className={`inline-flex items-center justify-center rounded-2xl px-4 py-2 border hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 ${className}`}
      aria-label="Nous contacter"
    >
      {children ?? "Nous contacter"}
    </Link>
  );
}
