"use client";

import Link from "next/link";
import { useState } from "react";
import type { Book } from "@/lib/books";
import { entryToBook, isRead } from "@/lib/library";
import { BookDialog } from "@/components/BookDialog";
import { BookGrid } from "@/components/BookGrid";
import { LibraryTabs } from "@/components/LibraryTabs";
import { useLibrary } from "@/components/LibraryProvider";

export default function ToReadPage() {
  const { status, entries } = useLibrary();
  const [selected, setSelected] = useState<Book | null>(null);

  if (status !== "ready") return null; // le bandeau d'état s'affiche au-dessus
  const toRead = entries.filter((e) => !isRead(e));

  return (
    <>
      <LibraryTabs />
      <h1 className="page-title">
        À lire <span className="muted count">{toRead.length}</span>
      </h1>

      {toRead.length === 0 ? (
        <div className="empty">
          <p>
            Votre liste est vide. En ajoutant un livre, choisissez « Je veux le lire » pour le
            garder ici.
          </p>
          <Link href="/recherche" className="btn btn--primary">
            Rechercher un livre
          </Link>
        </div>
      ) : (
        <>
          <p className="muted small section-hint">
            Touchez un livre quand vous l&apos;avez lu pour le noter.
          </p>
          <BookGrid entries={toRead} onSelect={(entry) => setSelected(entryToBook(entry))} />
        </>
      )}

      <BookDialog book={selected} onClose={() => setSelected(null)} />
    </>
  );
}
