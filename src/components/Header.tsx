"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLibrary } from "./LibraryProvider";

export function Header() {
  const pathname = usePathname();
  const { account } = useLibrary();
  const links = [
    { href: "/", label: "Recherche" },
    { href: "/bibliotheque", label: "Bibliothèque" },
    { href: "/compte", label: account?.username ? `@${account.username}` : "Compte" },
  ];
  return (
    <header className="header">
      <div className="header__inner">
        <Link href="/" className="logo">
          Livres
        </Link>
        <nav className="nav">
          {links.map((link) => (
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
      Impossible d&apos;ouvrir votre bibliothèque. Vérifiez les réglages Supabase : connexions
      anonymes activées (README, étape 2) et fichier 02-comptes.sql lancé (étape 5).
      {errorMessage && <span className="small"> Détail : {errorMessage}</span>}
    </p>
  );
}
