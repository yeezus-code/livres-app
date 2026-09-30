"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { splitLocale } from "@/i18n/config";
import { useI18n } from "@/i18n/I18nProvider";
import { SITE } from "@/lib/site";
import { Avatar } from "./Avatar";
import { LogoMark } from "./LogoMark";
import { useLibrary } from "./LibraryProvider";

// Petites icônes (affichées seulement dans la barre du bas, sur téléphone)
const ICONS: Record<string, React.ReactNode> = {
  search: <path d="M10.5 3a7.5 7.5 0 1 0 4.55 13.46l4.24 4.25 1.42-1.42-4.25-4.24A7.5 7.5 0 0 0 10.5 3Zm0 2a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Z" />,
  books: <path d="M4 3h4v18H4V3Zm6 0h4v18h-4V3Zm5.2 1.3 3.86-1.04 4.66 17.39-3.87 1.03L15.2 4.3Z" />,
  home: <path d="M12 3 2 11.5h3V21h5.5v-6h3v6H19v-9.5h3L12 3Z" />,
  top: <path d="m12 2.5 2.9 6.1 6.6.8-4.9 4.6 1.3 6.5L12 17.3l-5.9 3.2 1.3-6.5-4.9-4.6 6.6-.8L12 2.5Z" />,
  people: <path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7.5 0a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM1 20c0-3.3 3.6-6 8-6s8 2.7 8 6v1H1v-1Zm17.5 1v-1c0-1.8-.7-3.4-1.9-4.7 3.2.3 5.4 2.2 5.4 4.7v1h-3.5Z" />,
  user: <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-5 0-9 2.7-9 6v2h18v-2c0-3.3-4-6-9-6Z" />,
};

/** L'onglet « Bibliothèque » reste allumé sur « À lire » et « Mon top ». */
function isCurrent(pathname: string, href: string) {
  if (href === "/bibliotheque") return ["/bibliotheque", "/a-lire", "/top"].includes(pathname);
  return pathname === href;
}

export function Header() {
  const pathname = splitLocale(usePathname()).path;
  const { account } = useLibrary();
  const { t, f, href } = useI18n();
  const links = [
    { href: "/", label: t.nav.home, short: t.nav.homeShort, icon: "home" },
    { href: "/recherche", label: t.nav.search, short: t.nav.searchShort, icon: "search" },
    { href: "/bibliotheque", label: t.nav.library, short: t.nav.libraryShort, icon: "books" },
    { href: "/lecteurs", label: t.nav.readers, short: t.nav.readersShort, icon: "people" },
    {
      href: "/compte",
      label: account?.username ? `@${account.username}` : t.nav.account,
      short: account?.username ? t.nav.me : t.nav.accountShort,
      icon: "user",
    },
  ];
  return (
    <header className="header">
      <div className="header__inner">
        <Link href={href("/")} className="logo" aria-label={f(t.nav.homeLabel, { name: SITE.name })}>
          <LogoMark />
          <span className="logo__text">{SITE.name}</span>
        </Link>
        <nav className="nav">
          {links.map((link) => (
            <Link
              key={link.href}
              href={href(link.href)}
              className="nav__link"
              aria-current={isCurrent(pathname, link.href) ? "page" : undefined}
            >
              {link.icon === "user" && account?.username ? (
                <span className="nav__avatar">
                  <Avatar url={account.avatarUrl} username={account.username} size={22} />
                </span>
              ) : (
                <svg className="nav__icon" viewBox="0 0 24 24" aria-hidden="true">
                  {ICONS[link.icon]}
                </svg>
              )}
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
  const { t, f } = useI18n();
  const pathname = splitLocale(usePathname()).path;

  if (status === "ready") return null;
  if (status === "loading") {
    return pathname === "/bibliotheque" ? <p className="muted center">{t.common.loading}</p> : null;
  }
  if (status === "unconfigured") return <p className="banner">{t.status.unconfigured}</p>;
  return (
    <p className="banner banner--error">
      {t.status.error}
      {errorMessage && <span className="small"> {f(t.status.detail, { message: errorMessage })}</span>}
    </p>
  );
}
