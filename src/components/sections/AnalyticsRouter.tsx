// src/components/AnalyticsRouter.tsx

"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { pageview } from "@/lib/analytics";

const SKIP_INITIAL_PV = process.env.NEXT_PUBLIC_GA_SKIP_INITIAL_PV === "1";

export default function AnalyticsRouter() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const didMountRef = useRef(false);

  useEffect(() => {
    const query = searchParams?.toString();
    const path = query ? `${pathname}?${query}` : pathname;

    // Si GA envoie déjà un page_view auto au chargement,
    // on saute le premier envoi manuel pour éviter le doublon.
    if (!didMountRef.current) {
      didMountRef.current = true;
      if (SKIP_INITIAL_PV) return;
    }

    pageview(path);
  }, [pathname, searchParams]);

  return null;
}
