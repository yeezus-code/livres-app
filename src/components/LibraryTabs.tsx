"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isRead } from "@/lib/library";
import { useLibrary } from "./LibraryProvider";

/** Onglets « Lus / À lire / Mon top » en haut de la bibliothèque. */
export function LibraryTabs() {
  const pathname = usePathname();
  const { entries } = useLibrary();
  const read = entries.filter(isRead).length;
  const tabs = [
    { href: "/bibliotheque", label: `Lus · ${read}` },
    { href: "/a-lire", label: `À lire · ${entries.length - read}` },
    { href: "/top", label: "Mon top" },
  ];
  return (
    <nav className="tabs tabs--links" aria-label="Bibliothèque">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className="tab"
          aria-current={pathname === tab.href ? "page" : undefined}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
