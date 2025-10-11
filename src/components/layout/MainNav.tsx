"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { trackEvent } from "@/lib/analytics";

type NavItem = { href: string; label: string };

const TOP_LEVEL: NavItem[] = [
  { href: "/", label: "Accueil" },
  { href: "/membres", label: "Membres" },
  { href: "/consortium", label: "Qui sommes-nous?" },
  { href: "/corpos", label: "Consortium" }, // ← après celui-ci, on insère "Corpos filles"
  { href: "/contact", label: "Contact" },
];

const SUB_CORPOS: NavItem[] = [
  { href: "/corpos/nasa", label: "NASA" },
  { href: "/corpos/core", label: "CORE" },
  { href: "/corpos/rtt", label: "RTT" },
  { href: "/corpos/nsf", label: "NSF" },
  { href: "/corpos/eclipse", label: "ECLIPSE" },
  { href: "/corpos/pulse", label: "PULSE" },
];

function dedupByHref(items: NavItem[]) {
  const seen = new Set<string>();
  return items.filter((it) => {
    if (seen.has(it.href)) return false;
    seen.add(it.href);
    return true;
  });
}

export default function MainNav() {
  const [open, setOpen] = useState(false); // burger mobile
  const [openSub, setOpenSub] = useState(false); // sous-menu mobile
  const panelRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  const pathname = usePathname();
  const isActivePath = useCallback(
    (path: string) => pathname === path || pathname.startsWith(`${path}/`),
    [pathname],
  );

  const items = useMemo(() => dedupByHref(TOP_LEVEL), []);
  const close = useCallback(() => setOpen(false), []);

  // Fermer le burger au clic extérieur (sécurité en plus du scrim)
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!panelRef.current) return;
      const t = e.target as Node;
      if (!panelRef.current.contains(t) && !btnRef.current?.contains(t)) {
        close();
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open, close]);

  // Fermer sur ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  // Focus trap dans le panneau mobile (n'empêche pas le scroll)
  useEffect(() => {
    if (!open || !panelRef.current) return;
    const root = panelRef.current;

    const selector =
      'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])';
    const getFocusable = () =>
      Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(
        (el) => el.offsetParent !== null || el === root,
      );

    const firstFocus = getFocusable()[0] ?? root;
    firstFocus.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const list = getFocusable();
      if (!list.length) {
        e.preventDefault();
        return;
      }
      const first = list[0];
      const last = list[list.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (active === first || active === root) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      btnRef.current?.focus();
    };
  }, [open]);

  const NavLink = ({ href, label }: NavItem) => {
    const active = isActivePath(href);
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        onClick={() => trackEvent("nav_click", { label, href })}
        className={`px-3 py-2 hover:opacity-90 ${
          active ? "text-nms-gold font-semibold" : ""
        }`}
      >
        {label}
      </Link>
    );
  };

  // ▼ Dropdown desktop "Corpos filles"
  const DesktopCorposDropdown = () => {
    const activeSub = SUB_CORPOS.some((s) => isActivePath(s.href));
    return (
      <div className="relative group">
        <button
          type="button"
          className={`px-3 py-2 hover:opacity-90 ${
            activeSub ? "text-nms-gold font-semibold" : ""
          }`}
          aria-haspopup="menu"
          aria-expanded="false"
          aria-controls="submenu-corpos-desktop"
        >
          Corpos filles
        </button>

        {/* Wrapper sans gap : top-full + pt-2 */}
        <div
          id="submenu-corpos-desktop"
          className="absolute left-0 top-full pt-2 opacity-0 invisible
                     group-hover:opacity-100 group-hover:visible
                     group-focus-within:opacity-100 group-focus-within:visible
                     transition-opacity duration-150 z-20"
        >
          {/* Le panneau lui-même (une seule couche) */}
          <ul className="min-w-[220px] border bg-[#0a0f1a] text-white shadow-xl py-1">
            {SUB_CORPOS.map((sub) => (
              <li key={`${sub.href}-${sub.label}`}>
                <Link
                  href={sub.href}
                  onClick={() =>
                    trackEvent("nav_click", {
                      label: sub.label,
                      section: "corpos_filles",
                      device: "desktop",
                    })
                  }
                  className={`block px-4 py-2 border-t border-[#1c2a3a] first:border-t-0 hover:bg-black/20 ${
                    isActivePath(sub.href) ? "text-nms-gold font-semibold" : ""
                  }`}
                  aria-current={isActivePath(sub.href) ? "page" : undefined}
                >
                  {sub.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  return (
    <nav className="w-full relative">
      {/* Desktop */}
      <div className="hidden md:flex items-center gap-2">
        {items.map((item) => {
          if (item.href === "/corpos") {
            return (
              <Fragment key={`${item.href}-${item.label}`}>
                <NavLink {...item} />
                {/* insertion du dropdown ici (entre Consortium et Contact) */}
                <DesktopCorposDropdown />
              </Fragment>
            );
          }
          return <NavLink key={`${item.href}-${item.label}`} {...item} />;
        })}
      </div>

      {/* Mobile */}
      <div className="md:hidden">
        <button
          ref={btnRef}
          type="button"
          aria-label="Ouvrir le menu"
          aria-controls="mobile-nav"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center justify-center rounded-md border px-3 py-2 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {/* Icône burger */}
          <span className="relative block w-5 h-3.5">
            <span
              className={`absolute inset-x-0 top-0 h-0.5 bg-current transition-transform ${
                open ? "translate-y-1.75 rotate-45" : ""
              }`}
            />
            <span
              className={`absolute inset-x-0 top-1.5 h-0.5 bg-current transition-opacity ${
                open ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute inset-x-0 bottom-0 h-0.5 bg-current transition-transform ${
                open ? "-translate-y-1.75 -rotate-45" : ""
              }`}
            />
          </span>
        </button>

        {open && (
          <div className="fixed inset-0 z-40 flex items-start justify-center pt-16">
            {/* scrim */}
            <div
              className="absolute inset-0 bg-black/40"
              onClick={close}
              aria-hidden
            />
            {/* panneau (scroll autorisé) */}
            <div
              id="mobile-nav"
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              className="relative z-50 w-[min(92vw,420px)] mx-auto border bg-[#0a0f1a] text-white shadow-2xl rounded-2xl max-h-[90vh] overflow-hidden"
              tabIndex={-1}
            >
              <div
                className="flex flex-col overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+1rem)] touch-pan-y overscroll-y-contain"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                {items.map((item) => {
                  if (item.href === "/corpos") {
                    const active = isActivePath(item.href);
                    const activeSubMobile = SUB_CORPOS.some((s) =>
                      isActivePath(s.href),
                    );
                    return (
                      <div key={`${item.href}-${item.label}`}>
                        {/* Lien Consortium */}
                        <Link
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                          onClick={() => {
                            trackEvent("nav_click", {
                              label: item.label,
                              href: item.href,
                              device: "mobile",
                            });
                            close();
                          }}
                          className={`px-4 py-3 border-b border-[#1c2a3a] hover:bg-black/20 block ${
                            active ? "text-nms-gold font-semibold" : ""
                          }`}
                        >
                          {item.label}
                        </Link>

                        {/* Accordéon Corpos filles — placé ici */}
                        <div
                          className={`border-b border-[#1c2a3a] ${
                            openSub ? "mb-3" : ""
                          }`}
                        >
                          <button
                            type="button"
                            aria-expanded={openSub}
                            aria-controls="submenu-corpos-mobile"
                            onClick={() => setOpenSub((v) => !v)}
                            className={`w-full text-left px-4 py-3 hover:bg-black/20 ${
                              activeSubMobile
                                ? "text-nms-gold font-semibold"
                                : ""
                            }`}
                          >
                            Corpos filles
                          </button>
                          {openSub && (
                            <ul id="submenu-corpos-mobile" className="pb-2">
                              {SUB_CORPOS.map((sub) => (
                                <li key={`${sub.href}-${sub.label}`}>
                                  <Link
                                    href={sub.href}
                                    aria-current={
                                      isActivePath(sub.href)
                                        ? "page"
                                        : undefined
                                    }
                                    onClick={() => {
                                      trackEvent("nav_click", {
                                        label: sub.label,
                                        section: "corpos_filles",
                                        device: "mobile",
                                      });
                                      close();
                                    }}
                                    className={`block pl-8 pr-4 py-2 border-t border-[#1c2a3a] hover:bg-black/30 text-sm ${
                                      isActivePath(sub.href)
                                        ? "text-nms-gold font-semibold"
                                        : ""
                                    }`}
                                  >
                                    {sub.label}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // autres items
                  const active = isActivePath(item.href);
                  return (
                    <Link
                      key={`${item.href}-${item.label}`}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      onClick={() => {
                        trackEvent("nav_click", {
                          label: item.label,
                          href: item.href,
                          device: "mobile",
                        });
                        close();
                      }}
                      className={`px-4 py-3 border-b border-[#1c2a3a] hover:bg-black/20 last:mb-3 last:border-b-0 ${
                        active ? "text-nms-gold font-semibold" : ""
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
