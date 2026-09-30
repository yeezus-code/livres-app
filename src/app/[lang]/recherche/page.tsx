"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import type { Book } from "@/lib/books";
import { BookCover } from "@/components/BookCover";
import { BookDialog } from "@/components/BookDialog";
import { isRead } from "@/lib/library";
import { useLibrary } from "@/components/LibraryProvider";
import { Stars } from "@/components/StarRating";
import { useI18n } from "@/i18n/I18nProvider";

type SearchState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "done"; books: Book[]; title: string }
  | { kind: "error"; message: string };

// useSearchParams (lecture de « ?q= » dans l'adresse) doit être entouré de <Suspense>
export default function SearchPage() {
  return (
    <Suspense>
      <Search />
    </Suspense>
  );
}

function Search() {
  // La page d'accueil peut arriver ici avec une recherche déjà tapée : /recherche?q=dune
  const [query, setQuery] = useState(useSearchParams().get("q") ?? "");
  const [state, setState] = useState<SearchState>({ kind: "idle" });
  const [selected, setSelected] = useState<Book | null>(null);
  const library = useLibrary();
  const { t, f, locale, genre } = useI18n();

  // La recherche part toute seule quand on arrête de taper pendant 0,4 s
  useEffect(() => {
    const title = query.trim();
    if (title.length < 2) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setState({ kind: "loading" });
      try {
        const res = await fetch(
          `/api/recherche?titre=${encodeURIComponent(title)}&lang=${locale}`,
          { signal: controller.signal },
        );
        const data = await res.json();
        if (!res.ok) throw new Error(t.search.unavailable);
        setState({ kind: "done", books: data.books, title });
      } catch (e) {
        if (controller.signal.aborted) return; // une nouvelle recherche a pris le relais
        setState({ kind: "error", message: e instanceof Error ? e.message : String(e) });
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, locale, t]);

  const canAdd = library.status === "ready";
  // Moins de deux lettres : on n'affiche pas d'anciens résultats
  const view: SearchState = query.trim().length < 2 ? { kind: "idle" } : state;

  return (
    <>
      <h1 className="page-title">{t.search.title}</h1>

      <form className="search" role="search" onSubmit={(e) => e.preventDefault()}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.search.placeholder}
          aria-label={t.search.label}
          autoFocus
          enterKeyHint="search"
        />
      </form>

      {view.kind === "idle" && (
        <p className="muted center">{t.search.hint}</p>
      )}
      {view.kind === "loading" && <p className="muted center">{t.search.searching}</p>}
      {view.kind === "error" && <p className="error center">{view.message}</p>}
      {view.kind === "done" && view.books.length === 0 && (
        <p className="muted center">{f(t.search.noResult, { query: view.title })}</p>
      )}

      {view.kind === "done" && view.books.length > 0 && (
        <ul className="results">
          {view.books.map((book) => {
            const entry = library.findEntry(book.id);
            return (
              <li key={book.id} className="result">
                <BookCover src={book.coverUrl} title={book.title} size="sm" />
                <div className="result__info">
                  <h2 className="result__title">{book.title}</h2>
                  {book.authors.length > 0 && <p className="muted">{book.authors.join(", ")}</p>}
                  <p className="small muted">
                    {[book.year, ...book.genres.map(genre)].filter(Boolean).join(" · ")}
                  </p>
                  {entry && (
                    <p className="small in-library">
                      {isRead(entry) ? t.search.inLibrary : t.search.inToRead}
                      {isRead(entry) && <Stars value={entry.rating} />}
                    </p>
                  )}
                </div>
                {canAdd && (
                  <button
                    className={entry ? "btn btn--ghost" : "btn btn--primary"}
                    onClick={() => setSelected(book)}
                  >
                    {entry ? t.common.edit : t.common.add}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <BookDialog book={selected} onClose={() => setSelected(null)} />
    </>
  );
}
