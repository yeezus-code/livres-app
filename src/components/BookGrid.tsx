"use client";

import type { LibraryEntry } from "@/lib/library";
import { BookCover } from "./BookCover";
import { Stars } from "./StarRating";

/** Grille de couvertures (ma bibliothèque, ou celle d'un autre lecteur). */
export function BookGrid({
  entries,
  onSelect,
}: {
  entries: LibraryEntry[];
  onSelect: (entry: LibraryEntry) => void;
}) {
  return (
    <ul className="grid">
      {entries.map((entry) => (
        <li key={entry.id}>
          <button className="tile" onClick={() => onSelect(entry)}>
            <BookCover src={entry.cover_url} title={entry.title} />
            <span className="tile__title">{entry.title}</span>
            {entry.authors[0] && <span className="tile__author">{entry.authors[0]}</span>}
            <Stars value={entry.rating} />
            {entry.review && <span className="tile__review">« {entry.review} »</span>}
          </button>
        </li>
      ))}
    </ul>
  );
}
