import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: `Mentions légales — ${SITE.name}` };

export default function LegalPage() {
  const mail = <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>;
  return (
    <article className="prose">
      <h1 className="page-title">Mentions légales</h1>

      <h2>{SITE.name}, qu&apos;est-ce que c&apos;est ?</h2>
      <p className="lead">{SITE.description}</p>
      <p>
        Le site est gratuit, sans publicité et sans pistage. Il est né d&apos;une envie simple :
        garder une trace de ses lectures et partager ses coups de cœur, à la manière de ce que
        Letterboxd propose pour le cinéma.
      </p>

      <h2>Éditeur</h2>
      <p>
        Ce site est édité par un particulier, à titre non professionnel et non commercial.
        Contact : {mail}.
      </p>

      <h2>Hébergement</h2>
      <ul>
        <li>
          Site : Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis —
          vercel.com
        </li>
        <li>
          Base de données et fichiers (comptes, bibliothèques, photos) : Supabase Inc., hébergés
          dans l&apos;Union européenne (région de Paris) — supabase.com
        </li>
        <li>Envoi des e-mails : Brevo (Sendinblue SAS, France) — brevo.com</li>
      </ul>

      <h2>Données personnelles</h2>
      <p>Pour faire fonctionner le site, {SITE.name} enregistre :</p>
      <ul>
        <li>
          si vous créez un compte : votre adresse e-mail, votre mot de passe (chiffré, illisible
          même pour l&apos;éditeur), votre pseudo et, si vous en ajoutez une, votre photo de profil ;
        </li>
        <li>vos livres, notes, avis, listes et abonnements.</li>
      </ul>
      <p>
        Votre adresse e-mail n&apos;est jamais affichée ni transmise à des tiers ; elle sert
        uniquement à vous connecter et à vous envoyer les e-mails liés à votre compte
        (confirmation, mot de passe oublié). En revanche, votre pseudo, votre photo et votre
        bibliothèque (notes et avis compris) sont <strong>publics</strong> : c&apos;est le principe
        du site.
      </p>
      <p>
        Ces données sont conservées tant que votre compte existe. Conformément au RGPD, vous
        pouvez à tout moment demander à les consulter, les corriger ou les supprimer, ainsi que
        la suppression de votre compte, en écrivant à {mail}. Vous pouvez aussi adresser une
        réclamation à la CNIL (cnil.fr).
      </p>

      <h2>Cookies</h2>
      <p>
        {SITE.name} n&apos;utilise aucun cookie publicitaire ni outil de mesure d&apos;audience. Seules
        des informations techniques indispensables sont enregistrées dans votre navigateur pour
        garder votre session ouverte ; elles ne nécessitent pas de consentement.
      </p>

      <h2>Livres et couvertures</h2>
      <p>
        Les informations sur les livres (titres, auteurs, couvertures) proviennent d&apos;Open
        Library et de Google Books. Les couvertures restent la propriété de leurs éditeurs et
        ayants droit ; elles sont affichées à titre d&apos;illustration. Pour toute demande de
        retrait, écrivez à {mail}.
      </p>
    </article>
  );
}
