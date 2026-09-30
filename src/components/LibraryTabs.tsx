"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isRead } from "@/lib/library";
import { splitLocale } from "@/i18n/config";
import { useI18n } from "@/i18n/I18nProvider";
import { useLibrary } from "./LibraryProvider";

/** Onglets « Lus / À lire / Mon top » en haut de la bibliothèque. */
export function LibraryTabs() {
  const pathname = splitLocale(usePathname()).path;
  const { entries } = useLibrary();
  const { t, f, href } = useI18n();
  const read = entries.filter(isRead).length;
  const tabs = [
    { href: "/bibliotheque", label: f(t.library.tabRead, { n: read }) },
    { href: "/a-lire", label: f(t.library.tabToRead, { n: entries.length - read }) },
    { href: "/top", label: t.library.tabTop },
  ];
  return (
    <nav className="tabs tabs--links" aria-label={t.library.tabs}>
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={href(tab.href)}
          className="tab"
          aria-current={pathname === tab.href ? "page" : undefined}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
