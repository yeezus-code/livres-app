"use client";

import type { Book } from "@/lib/books";
import { BookCover } from "./BookCover";
import { useLibrary } from "./LibraryProvider";

export type ShelfItem = { book: Book; caption?: React.ReactNode };

/** Une rangée de couvertures qui défile horizontalement (page d'accueil). */
export function BookShelf({
  items,
  onSelect,
  loading = false,
}: {
  items: ShelfItem[];
  onSelect: (book: Book) => void;
  loading?: boolean;
}) {
  const { findEntry } = useLibrary();

  if (loading) {
    return (
      <div className="rail" aria-busy="true">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="rail__item">
            <div className="cover cover--md rail__placeholder" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <ul className="rail">
      {items.map(({ book, caption }) => (
        <li key={book.id} className="rail__item">
          <button className="rail__button" onClick={() => onSelect(book)}>
            <span className="rail__cover">
              <BookCover src={book.coverUrl} title={book.title} />
              {findEntry(book.id) && (
                <span className="rail__check" title="Dans ma bibliothèque">
                  ✓
                </span>
              )}
            </span>
            <span className="rail__title">{book.title}</span>
            {book.authors[0] && <span className="rail__author">{book.authors[0]}</span>}
            {caption && <span className="rail__caption">{caption}</span>}
          </button>
        </li>
      ))}
    </ul>
  );
}
