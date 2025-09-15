"use client";

import Image from "next/image";
import Link from "next/link";

type Mode = "fanSite" | "fanArt" | "fanCraft";
type Variant = "badge" | "text" | "both";

type Props = {
  /** "fanSite" | "fanArt" | "fanCraft" */
  mode?: Mode;
  /** "badge" | "text" | "both" */
  variant?: Variant;
  /** Chemin vers le badge (mets l’asset du Fankit dans /public) */
  badgeSrcLight?: string;
  badgeSrcDark?: string;
  /** Lien vers le site officiel RSI */
  officialUrl?: string;
  className?: string;
};

const TEXTS = {
  fanSite: "This is an unofficial Star Citizen Fan Site",
  fanArt: "Made By The Community",
  fanCraft: "This is a Fan Made item",
} as const;

export default function CommunityAttribution({
  mode = "fanSite",
  variant = "both",
  badgeSrcLight = "/images/fankit/MadeByTheCommunity_Black.png",
  badgeSrcDark = "/images/fankit/MadeByTheCommunity_White.png",
  officialUrl = "https://robertsspaceindustries.com/",
  className = "",
}: Props) {
  const showBadge = variant === "badge" || variant === "both";
  const showText = variant === "text" || variant === "both";

  // Texte officiel court (community notice) selon le mode
  const notice =
    mode === "fanSite"
      ? TEXTS.fanSite
      : mode === "fanArt"
        ? TEXTS.fanArt
        : TEXTS.fanCraft;

  return (
    <div
      className={[
        "flex flex-wrap items-center gap-3 text-sm leading-relaxed opacity-80",
        className,
      ].join(" ")}
    >
      {/* Badge Fankit (switch clair/sombre) */}
      {showBadge && (
        <Link
          href={officialUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Official RSI site — opens in a new tab"
          className="inline-flex items-center"
        >
          <span className="hidden dark:inline">
            <Image
              src={badgeSrcLight}
              alt="Made by the Community"
              width={132}
              height={28}
              className="h-10 w-auto"
            />
          </span>
          <span className="inline dark:hidden">
            <Image
              src={badgeSrcDark}
              alt="Made by the Community"
              width={132}
              height={28}
              className="h-10 w-auto"
            />
          </span>
        </Link>
      )}

      {/* Community notice officiel (court) + lien RSI */}
      {showText && (
        <p>
          {notice}.{" "}
          <Link
            href={officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-white/30 underline-offset-2 hover:opacity-100"
          >
            Official RSI site
          </Link>
          .
        </p>
      )}
    </div>
  );
}
