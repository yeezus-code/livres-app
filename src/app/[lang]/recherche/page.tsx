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

      {canAdd && view.kind === "done" && (
        <ManualBook key={view.title} initialTitle={view.title} onReady={setSelected} />
      )}

      <BookDialog book={selected} onClose={() => setSelected(null)} />
    </>
  );
}

/** Identifiant d'un livre ajouté à la main : le même pour tous ceux qui ajoutent ce livre. */
function manualId(title: string, author: string) {
  const clean = (text: string) =>
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  return `manuel:${clean(title)}--${clean(author)}`.slice(0, 200);
}

/** « Livre introuvable ? » : un petit formulaire pour ajouter un livre absent des sources. */
function ManualBook({
  initialTitle,
  onReady,
}: {
  initialTitle: string;
  onReady: (book: Book) => void;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [author, setAuthor] = useState("");
  const [year, setYear] = useState("");

  if (!open) {
    return (
      <p className="center small manual-link">
        {t.search.notFound}{" "}
        <button type="button" className="text-btn" onClick={() => setOpen(true)}>
          {t.search.addManually}
        </button>
      </p>
    );
  }

  return (
    <form
      className="card manual"
      onSubmit={(e) => {
        e.preventDefault();
        const cleanTitle = title.trim();
        const cleanAuthor = author.trim();
        const numericYear = parseInt(year, 10);
        onReady({
          id: manualId(cleanTitle, cleanAuthor),
          title: cleanTitle,
          authors: cleanAuthor ? [cleanAuthor] : [],
          coverUrl: null,
          genres: [],
          year: Number.isNaN(numericYear) ? null : numericYear,
        });
      }}
    >
      <h2 className="card__title">{t.search.manualTitle}</h2>
      <p className="muted small">{t.search.manualIntro}</p>
      <label className="field">
        <span>{t.search.manualBookTitle}</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={300} />
      </label>
      <label className="field">
        <span>{t.search.manualAuthor}</span>
        <input value={author} onChange={(e) => setAuthor(e.target.value)} required maxLength={200} />
      </label>
      <label className="field">
        <span>{t.search.manualYear}</span>
        <input
          value={year}
          onChange={(e) => setYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
          inputMode="numeric"
          placeholder="2024"
        />
      </label>
      <div className="dialog__actions">
        <span className="spacer" />
        <button type="button" className="btn btn--ghost" onClick={() => setOpen(false)}>
          {t.common.cancel}
        </button>
        <button type="submit" className="btn btn--primary">
          {t.search.manualContinue}
        </button>
      </div>
    </form>
  );
}
