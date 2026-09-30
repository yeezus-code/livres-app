"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Onglets « Mes livres / Mon top » en haut de la bibliothèque. */
export function LibraryTabs() {
  const pathname = usePathname();
  return (
    <nav className="tabs tabs--links" aria-label="Bibliothèque">
      <Link href="/bibliotheque" className="tab" aria-current={pathname === "/bibliotheque" ? "page" : undefined}>
        Mes livres
      </Link>
      <Link href="/top" className="tab" aria-current={pathname === "/top" ? "page" : undefined}>
        Mon top
      </Link>
    </nav>
  );
}
