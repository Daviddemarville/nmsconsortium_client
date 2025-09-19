"use client";

import { trackEvent } from "@/lib/analytics";

type Props = {
  inviteUrl: string; // ex. "https://discord.gg/XXXXXX"
  location?: string; // ex. "header" | "footer" | "home"
  className?: string;
  children?: React.ReactNode; // libellé custom si besoin
};

export default function DiscordButton({
  inviteUrl,
  location = "unknown",
  className = "",
  children,
}: Props) {
  return (
    <a
      href={inviteUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent("click_outbound_discord", { location })}
      className={`inline-flex items-center justify-center rounded-2xl px-4 py-2 border hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${className}`}
      aria-label="Rejoindre le Discord (ouvre un nouvel onglet)"
    >
      {children ?? "Rejoindre le Discord"}
    </a>
  );
}
