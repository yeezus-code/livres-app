"use client";

import Link from "next/link";
import { useState } from "react";
import type { Book } from "@/lib/books";
import { entryToBook, isRead } from "@/lib/library";
import { BookDialog } from "@/components/BookDialog";
import { BookGrid } from "@/components/BookGrid";
import { LibraryTabs } from "@/components/LibraryTabs";
import { useLibrary } from "@/components/LibraryProvider";
import { useI18n } from "@/i18n/I18nProvider";

export default function ToReadPage() {
  const { status, entries } = useLibrary();
  const [selected, setSelected] = useState<Book | null>(null);
  const { t, href } = useI18n();

  if (status !== "ready") return null; // le bandeau d'état s'affiche au-dessus
  const toRead = entries.filter((e) => !isRead(e));

  return (
    <>
      <LibraryTabs />
      <h1 className="page-title">
        {t.toRead.title} <span className="muted count">{toRead.length}</span>
      </h1>

      {toRead.length === 0 ? (
        <div className="empty">
          <p>{t.toRead.empty}</p>
          <Link href={href("/recherche")} className="btn btn--primary">
            {t.common.searchBook}
          </Link>
        </div>
      ) : (
        <>
          <p className="muted small section-hint">{t.toRead.hint}</p>
          <BookGrid entries={toRead} onSelect={(entry) => setSelected(entryToBook(entry))} />
        </>
      )}

      <BookDialog book={selected} onClose={() => setSelected(null)} />
    </>
  );
}
