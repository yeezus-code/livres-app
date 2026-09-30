import Link from "next/link";
import { SITE } from "@/lib/site";
import { LogoMark } from "./LogoMark";

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div>
          <Link href="/" className="logo">
            <LogoMark size={34} />
            <span className="logo__text">{SITE.name}</span>
          </Link>
          <p className="footer__tagline">{SITE.tagline}.</p>
        </div>
        <nav aria-label="Liens du pied de page">
          <p className="footer__title">Explorer</p>
          <ul className="footer__links">
            <li><Link href="/recherche">Rechercher un livre</Link></li>
            <li><Link href="/lecteurs">Lecteurs</Link></li>
            <li><Link href="/installer">Installer l&apos;appli</Link></li>
            <li><Link href="/mentions-legales">Mentions légales</Link></li>
          </ul>
        </nav>
        <div>
          <p className="footer__title">Contact</p>
          <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>
        </div>
        <p className="footer__bottom">
          © {new Date().getFullYear()} {SITE.name} · Données des livres : Open Library et Google Books
        </p>
      </div>
    </footer>
  );
}
