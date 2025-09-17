import Link from "next/link";
import CommunityAttribution from "@/components/ui/CommunityAttribution";
import SocialLinks from "@/components/ui/SocialLinks";

export default function Footer() {
  return (
    <footer className="inset-x-0 bottom-0 border-t border-white/10 bg-background/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-6 text-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Bloc gauche : copyright + version */}
          <div className="opacity-70 flex flex-row md:flex-col md:items-center gap-2 justify-center">
            <div>
              © {new Date().getFullYear()} Nemesis Consortium — Tous droits
              réservés
            </div>
            <div>v0 - p2</div>
          </div>

          {/* Bloc centre gauche: navigation footer */}
          <nav className="flex flex-wrap flex-row md:flex-col justify-center gap-4">
            <a
              href="https://discord.gg/FYmSmhRjW9"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-nms-gold transition"
            >
              Discord
            </a>
            <Link href="/contact" className="hover:text-nms-gold transition">
              Contact
            </Link>
            <Link
              href="/mentions-legales"
              className="hover:text-nms-gold transition"
            >
              Mentions légales
            </Link>
          </nav>

          {/* Bloc centre droit : réseaux sociaux */}
          <div className="flex justify-center items-center gap-6">
            <SocialLinks />
          </div>
          {/* Bloc droit : attribution */}
          <div className="flex justify-center items-center gap-6">
            <CommunityAttribution mode="fanSite" variant="both" />
          </div>
        </div>
      </div>
    </footer>
  );
}
