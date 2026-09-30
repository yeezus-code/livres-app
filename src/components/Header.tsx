"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLibrary } from "./LibraryProvider";

const LINKS = [
  { href: "/", label: "Rechercher" },
  { href: "/bibliotheque", label: "Ma bibliothèque" },
];

export function Header() {
  const pathname = usePathname();
  return (
    <header className="header">
      <div className="header__inner">
        <Link href="/" className="logo">
          Livres
        </Link>
        <nav className="nav">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="nav__link"
              aria-current={pathname === link.href ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

/** Bandeau affiché tant que la bibliothèque n'est pas utilisable. */
export function StatusBanner() {
  const { status, errorMessage } = useLibrary();
  const pathname = usePathname();

  if (status === "ready") return null;
  if (status === "loading") {
    return pathname === "/bibliotheque" ? <p className="muted center">Chargement…</p> : null;
  }
  if (status === "unconfigured") {
    return (
      <p className="banner">
        La recherche fonctionne, mais la bibliothèque n&apos;est pas encore branchée : il manque
        les réglages Supabase (voir le README, étape 2).
      </p>
    );
  }
  return (
    <p className="banner banner--error">
      Impossible d&apos;ouvrir votre bibliothèque. Vérifiez que les connexions anonymes sont
      activées dans Supabase (README, étape 2).
      {errorMessage && <span className="small"> Détail : {errorMessage}</span>}
    </p>
  );
}
