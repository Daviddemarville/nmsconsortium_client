"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

const NAV = [
  { label: "Accueil", href: "/" },
  { label: "Nos membres", href: "/membres" },
  { label: "Qui sommes nous?", href: "/corpos" },
  { label: "Contact", href: "/contact" },
] as const;

export default function Header() {
  const pathname = usePathname();

  const isActive = useMemo(
    () => (href: string) =>
      href === "/"
        ? pathname === "/"
        : pathname === href || pathname.startsWith(`${href}/`),
    [pathname],
  );

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-background/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-wide">
          NEMESIS CONSORTIUM
        </Link>

        <nav className="flex gap-6 text-sm">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              data-active={isActive(item.href) ? "true" : "false"}
              className="transition-opacity hover:opacity-100 data-[active=false]:opacity-70"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
