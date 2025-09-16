"use client";

import { FaDiscord, FaYoutube, FaFacebook, FaTiktok } from "react-icons/fa";

const socials = [
  {
    name: "Discord",
    href: "https://discord.gg/FYmSmhRjW9",
    icon: FaDiscord,
  },
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

export default function SocialLinks() {
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
        >
          <Icon />
        </a>
      ))}
    </div>
  );
}
