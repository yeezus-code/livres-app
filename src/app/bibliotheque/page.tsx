"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Book } from "@/lib/books";
import { entryToBook, isRead } from "@/lib/library";
import { BookDialog } from "@/components/BookDialog";
import { BookGrid } from "@/components/BookGrid";
import { LibraryTabs } from "@/components/LibraryTabs";
import { useLibrary } from "@/components/LibraryProvider";

type Sort = "recent" | "read" | "rating" | "title";

export default function LibraryPage() {
  const { status, entries: allEntries, account } = useLibrary();
  const entries = useMemo(() => allEntries.filter(isRead), [allEntries]);
  const [sort, setSort] = useState<Sort>("recent");
  const [selected, setSelected] = useState<Book | null>(null);

  const sorted = useMemo(() => {
    const list = [...entries];
    // Date de lecture : les plus récentes d'abord, les livres sans date à la fin
    if (sort === "read") list.sort((a, b) => (b.read_on ?? "").localeCompare(a.read_on ?? ""));
    if (sort === "rating") list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    if (sort === "title") list.sort((a, b) => a.title.localeCompare(b.title, "fr"));
    return list; // « recent » : déjà dans l'ordre d'ajout
  }, [entries, sort]);

  if (status !== "ready") return null; // le bandeau d'état s'affiche au-dessus

  return (
    <>
      <LibraryTabs />
      <div className="page-head">
        <h1 className="page-title">
          Ma bibliothèque <span className="muted count">{entries.length}</span>
        </h1>
        {entries.length > 1 && (
          <label className="sort">
            <span className="visually-hidden">Trier par</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
              <option value="recent">Ajout récent</option>
              <option value="read">Date de lecture</option>
              <option value="rating">Meilleure note</option>
              <option value="title">Titre (A→Z)</option>
            </select>
          </label>
        )}
      </div>

      {account?.isAnonymous && entries.length > 0 && (
        <p className="banner">
          Sans compte, cette bibliothèque n&apos;existe que sur cet appareil.{" "}
          <Link href="/compte">Créez un compte</Link> pour la retrouver partout : vos livres
          seront conservés.
        </p>
      )}

      {entries.length === 0 ? (
        <div className="empty">
          <p>Aucun livre lu pour l&apos;instant.</p>
          <Link href="/recherche" className="btn btn--primary">
            Rechercher un livre
          </Link>
        </div>
      ) : (
        <BookGrid entries={sorted} onSelect={(entry) => setSelected(entryToBook(entry))} />
      )}

      <BookDialog book={selected} onClose={() => setSelected(null)} />
    </>
  );
}
