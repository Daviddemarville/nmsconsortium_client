// src/components/ui/WarningBanner.tsx

export default function WarningBanner() {
  return (
    <section className="bg-black/30 text-shadow-black mt-10 p-4 rounded-2xl border-2 border-red-500 max-w-3xl mx-auto">
      <h2 className="font-semibold mb-2">Avertissement</h2>
      <p>
        L'organisation que vous retrouvez sur cette page représente notre vision
        de la corpo à la sortie de <strong>Star Citizen 1.0</strong>.
      </p>
      <p className="mt-2">
        Nous nous sommes <strong>basés</strong> sur les informations reçues lors
        de la CitizenCon&nbsp;2024, et l'organisation est susceptible
        <strong> d’évoluer</strong> en fonction des annonces des développeurs
        dans le <strong>futur</strong>.
      </p>
    </section>
  );
}
