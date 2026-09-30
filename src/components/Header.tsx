"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLibrary } from "./LibraryProvider";

// Petites icônes (affichées seulement dans la barre du bas, sur téléphone)
const ICONS: Record<string, React.ReactNode> = {
  search: <path d="M10.5 3a7.5 7.5 0 1 0 4.55 13.46l4.24 4.25 1.42-1.42-4.25-4.24A7.5 7.5 0 0 0 10.5 3Zm0 2a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Z" />,
  books: <path d="M4 3h4v18H4V3Zm6 0h4v18h-4V3Zm5.2 1.3 3.86-1.04 4.66 17.39-3.87 1.03L15.2 4.3Z" />,
  top: <path d="m12 2.5 2.9 6.1 6.6.8-4.9 4.6 1.3 6.5L12 17.3l-5.9 3.2 1.3-6.5-4.9-4.6 6.6-.8L12 2.5Z" />,
  people: <path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7.5 0a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM1 20c0-3.3 3.6-6 8-6s8 2.7 8 6v1H1v-1Zm17.5 1v-1c0-1.8-.7-3.4-1.9-4.7 3.2.3 5.4 2.2 5.4 4.7v1h-3.5Z" />,
  user: <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-5 0-9 2.7-9 6v2h18v-2c0-3.3-4-6-9-6Z" />,
};

export function Header() {
  const pathname = usePathname();
  const { account } = useLibrary();
  const links = [
    { href: "/", label: "Recherche", short: "Chercher", icon: "search" },
    { href: "/bibliotheque", label: "Bibliothèque", short: "Biblio", icon: "books" },
    { href: "/top", label: "Top", short: "Top", icon: "top" },
    { href: "/lecteurs", label: "Lecteurs", short: "Lecteurs", icon: "people" },
    {
      href: "/compte",
      label: account?.username ? `@${account.username}` : "Compte",
      short: account?.username ? "Moi" : "Compte",
      icon: "user",
    },
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
              <svg className="nav__icon" viewBox="0 0 24 24" aria-hidden="true">
                {ICONS[link.icon]}
              </svg>
              <span className="nav__label">{link.label}</span>
              <span className="nav__short" aria-hidden="true">
                {link.short}
              </span>
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
