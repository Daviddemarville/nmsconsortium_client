"use client";

import { FaDiscord, FaFacebook, FaTiktok, FaYoutube } from "react-icons/fa";
import { trackEvent } from "@/lib/analytics";

const socials = [
  { name: "Discord", href: "https://discord.gg/FYmSmhRjW9", icon: FaDiscord },
  {
    name: "Facebook",
    href: "https://www.facebook.com/nmslgts",
    icon: FaFacebook,
  },
  {
    name: "YouTube",
    href: "https://www.youtube.com/@nemesislogistics9503",
    icon: FaYoutube,
  },
  {
    name: "TikTok",
    href: "https://www.tiktok.com/@nemesis.consortium",
    icon: FaTiktok,
  },
];

type SocialLinksProps = {
  /** Où se trouve ce bloc ? (footer, header, sidebar, page-x, …) */
  location?: string;
};

export default function SocialLinks({
  location = "social_links",
}: SocialLinksProps) {
  return (
    <div className="flex items-center gap-2 md:gap-4">
      {socials.map(({ name, href, icon: Icon }) => (
        <a
          key={name}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={name}
          className="hover:text-nms-gold transition text-xl md:text-lg p-2"
          onClick={() => {
            if (name === "Discord") {
              trackEvent("click_outbound_discord", { location });
            } else {
              trackEvent("click_outbound_social", {
                network: name,
                href,
                location,
              });
            }
          }}
        >
          <Icon />
        </a>
      ))}
    </div>
  );
}
