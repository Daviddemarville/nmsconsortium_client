import CommunityAttribution from "@/components/ui/CommunityAttribution";

export default function Footer() {
  return (
    <footer className="fixed inset-x-0 bottom-0 h-20 border-t border-white/10 bg-background/80 backdrop-blur z-50">
      <div className="mx-auto max-w-6xl px-4 py-6 text-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="opacity-70">
            <div>© {new Date().getFullYear()} Nemesis Consortium — Tous droits
            réservés</div>
            <div>v0 - p1</div>
          </div>

          {/* Fan site: badge + texte court (conseillé) */}
          <CommunityAttribution mode="fanSite" variant="both" />
        </div>
      </div>
    </footer>
  );
}
