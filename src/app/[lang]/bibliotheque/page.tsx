"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Book } from "@/lib/books";
import { entryToBook, isRead } from "@/lib/library";
import { BookDialog } from "@/components/BookDialog";
import { BookGrid } from "@/components/BookGrid";
import { LibraryTabs } from "@/components/LibraryTabs";
import { useLibrary } from "@/components/LibraryProvider";
import { LOCALE_TAGS } from "@/i18n/config";
import { useI18n } from "@/i18n/I18nProvider";

type Sort = "recent" | "read" | "rating" | "title";

export default function LibraryPage() {
  const { status, entries: allEntries, account } = useLibrary();
  const entries = useMemo(() => allEntries.filter(isRead), [allEntries]);
  const [sort, setSort] = useState<Sort>("recent");
  const [selected, setSelected] = useState<Book | null>(null);
  const { t, r, href, locale } = useI18n();

  const sorted = useMemo(() => {
    const list = [...entries];
    // Date de lecture : les plus récentes d'abord, les livres sans date à la fin
    if (sort === "read") list.sort((a, b) => (b.read_on ?? "").localeCompare(a.read_on ?? ""));
    if (sort === "rating") list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    if (sort === "title") list.sort((a, b) => a.title.localeCompare(b.title, LOCALE_TAGS[locale]));
    return list; // « recent » : déjà dans l'ordre d'ajout
  }, [entries, sort, locale]);

  if (status !== "ready") return null; // le bandeau d'état s'affiche au-dessus

  return (
    <>
      <LibraryTabs />
      <div className="page-head">
        <h1 className="page-title">
          {t.library.title} <span className="muted count">{entries.length}</span>
        </h1>
        {entries.length > 1 && (
          <label className="sort">
            <span className="visually-hidden">{t.library.sortBy}</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
              <option value="recent">{t.library.sortRecent}</option>
              <option value="read">{t.library.sortRead}</option>
              <option value="rating">{t.library.sortRating}</option>
              <option value="title">{t.library.sortTitle}</option>
            </select>
          </label>
        )}
      </div>

      {account?.isAnonymous && entries.length > 0 && (
        <p className="banner">
          {r(t.library.anonymousBanner, {
            link: <Link href={href("/compte")}>{t.library.createAccount}</Link>,
          })}
        </p>
      )}

      {entries.length === 0 ? (
        <div className="empty">
          <p>{t.library.empty}</p>
          <Link href={href("/recherche")} className="btn btn--primary">
            {t.common.searchBook}
          </Link>
        </div>
      ) : (
        <BookGrid entries={sorted} onSelect={(entry) => setSelected(entryToBook(entry))} />
      )}

      <BookDialog book={selected} onClose={() => setSelected(null)} />
    </>
  );
}
