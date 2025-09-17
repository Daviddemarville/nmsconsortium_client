import Image from "next/image";

export default function Core() {
  return (
    <section>
      <Image
        src="/images/corpos/core.png"
        alt="Logo de la CORE"
        width={200} // requis par next/image (intrinsique)
        height={200}
        className="mb-6 w-32 md:w-50 h-auto" // tes tailles visuelles restent via Tailwind
        priority // optionnel si c’est dans le viewport au chargement
      />
    </section>
  );
}
