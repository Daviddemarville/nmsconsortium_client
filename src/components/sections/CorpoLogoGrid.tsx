"use client";

import Image from "next/image";
import Link from "next/link";

type Corpo = {
  name: string;
  slug: string; // route: /corpos/<slug>
  logo: string; // chemin public/...
};

const CORPOS: Corpo[] = [
  { name: "NASA", slug: "nasa", logo: "/images/corpos/nasa.png" },
  { name: "CORS", slug: "cors", logo: "/images/corpos/core.png" },
  { name: "NSF", slug: "nsf", logo: "/images/corpos/nsf.png" },
  { name: "PULSE", slug: "pulse", logo: "/images/corpos/pulse.png" },
  { name: "RTT", slug: "rtt", logo: "/images/corpos/rtt.png" },
  { name: "ECLIPSE", slug: "eclipse", logo: "/images/corpos/eclipse.png" },
];

export default function CorpoLogoGrid({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div className={["mx-auto w-full max-w-5xl", className].join(" ")}>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
        {CORPOS.map((c) => (
          <li key={c.slug}>
            <Link
              href={`/corpos/${c.slug}`}
              className="
                group block rounded-2xl border border-white/10  backdrop-blur
                p-4 text-center transition hover:border-nms-gold/60 hover:shadow-lg
              "
            >
              <div className="relative mx-auto grid h-24 w-24 place-items-center overflow-hidden rounded-full bg-black/20 ring-1 ring-white/10 group-hover:ring-nms-gold/60">
                <Image
                  src={c.logo}
                  alt={`${c.name} logo`}
                  fill
                  sizes="96px"
                  className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="mt-3 text-xs font-semibold tracking-wide opacity-90 group-hover:opacity-100">
                {c.name}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
