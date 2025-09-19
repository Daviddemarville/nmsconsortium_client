"use client";

import Link from "next/link";
import MainNav from "./MainNav";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-background/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-wide">
          NEMESIS CONSORTIUM
        </Link>

        <div>
          {/* nav */}
          <MainNav />
        </div>
      </div>
    </header>
  );
}
