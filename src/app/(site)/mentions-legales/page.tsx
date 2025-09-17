export default function MentionsLegales() {
  return (
    <main className="container mx-auto bg-black/40 px-4 py-12 prose prose-invert">
      <h1>Mentions légales</h1>

      <section className="mt-6">
        <h2 className="mt-4">Éditeur du site</h2>
        <p className="mt-4">
          Ce site est édité et développé par <strong>David de Marville</strong>.
          <br />
          Site personnel :{" "}
          <a
            href="https://www.daviddm.fr"
            target="_blank"
            rel="noopener noreferrer"
          >
            www.daviddm.fr
          </a>
        </p>
      </section>

      <section className="mt-6">
        <h2 className="mt-4">Hébergement</h2>
        <p className="mt-4">
          Le site est hébergé par <strong>Vercel Inc.</strong>
          <br />
          440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis
          <br />
          Site web :{" "}
          <a
            href="https://vercel.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            vercel.com
          </a>
        </p>
      </section>

      <section className="mt-6">
        <h2 className="mt-4">Contact</h2>
        <p className="mt-4">
          Pour toute question, vous pouvez nous écrire à :{" "}
          <a href="mailto:nmscorp.sc@gmail.com">nmscorp.sc@gmail.com</a>
        </p>
      </section>

      <section className="mt-6">
        <h2 className="mt-4">Propriété intellectuelle</h2>
        <p className="mt-4">
          Les contenus, textes et visuels présents sur ce site sont la propriété
          de leurs auteurs respectifs.
          <br />
          Star Citizen et Roberts Space Industries sont des marques déposées de
          Cloud Imperium Games (CIG).
          <br />
          Ce site est un <strong>fan site communautaire</strong> et n’est pas
          affilié, sponsorisé ni approuvé par Cloud Imperium Games.
        </p>
      </section>

      <section className="mt-6">
        <h2 className="mt-4">Protection des données</h2>
        <p className="mt-4">
          Le site utilise <strong>Google Analytics 4</strong> afin de mesurer
          l’audience et améliorer l’expérience utilisateur. Les données
          collectées sont anonymisées conformément aux règles de confidentialité
          de Google.
        </p>
        <p>
          Un formulaire de contact simple est mis à disposition des visiteurs.
          Les informations fournies via ce formulaire sont utilisées uniquement
          pour répondre aux demandes et ne sont pas stockées à des fins
          commerciales.
        </p>
      </section>

      <section className="mt-6">
        <h2 className="mt-4">Responsabilité</h2>
        <p className="mt-4">
          Le Nemesis Consortium met tout en œuvre pour fournir des informations
          exactes, mais ne saurait être tenu responsable d’erreurs, d’omissions
          ou d’éventuelles indisponibilités du service.
        </p>
      </section>
    </main>
  );
}
