import OrgChart from "@/components/sections/OrgChart";

export default function Corpos() {
  return (
    <main className="container bg-black/30 mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold">Qui sommes nous?</h1>
      <OrgChart className="mt-4" />
      {/* Bouton Discord */}
      <a
        href="https://discord.gg/FYmSmhRjW9"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex items-center justify-center rounded-full bg-nms-gold text-nms-dark px-5 py-2.5 font-semibold hover:opacity-90 transition"
      >
        DISCORD NEMESIS
      </a>
    </main>
  );
}
