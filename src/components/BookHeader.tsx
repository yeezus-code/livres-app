"use client";

import { useEffect, useState } from "react";
import type { Book } from "@/lib/books";
import { fetchBookStats, type BookStats } from "@/lib/home";
import { getSupabase } from "@/lib/supabase";
import { BookCover } from "./BookCover";

/**
 * Haut de la fiche d'un livre : grande couverture, titre, auteur, genres,
 * et ce qu'en pensent les lecteurs de Codex (note moyenne, nombre de lecteurs).
 */
export function BookHeader({ book }: { book: Book }) {
  const [stats, setStats] = useState<BookStats | null>(null);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    fetchBookStats(supabase, book.id)
      .then(setStats)
      .catch(() => {}); // statistiques indisponibles : on ne montre simplement rien
  }, [book.id]);

  return (
    <div className="book-header">
      <BookCover src={book.coverUrl} title={book.title} size="lg" />
      <div className="book-header__info">
        <h2 className="book-header__title">{book.title}</h2>
        {book.authors.length > 0 && (
          <p className="book-header__author">{book.authors.join(", ")}</p>
        )}
        <p className="book-header__meta">
          {book.year && <span>{book.year}</span>}
          {book.genres.map((g) => (
            <span key={g} className="chip-genre">
              {g}
            </span>
          ))}
        </p>
        {stats && stats.readers > 0 && (
          <p className="book-header__stats">
            {stats.average !== null && (
              <>
                <span className="star star--on">★</span>{" "}
                <strong>{Number(stats.average).toLocaleString("fr-FR")}</strong>
                <span className="muted"> /5 · </span>
              </>
            )}
            <span className="muted">
              {stats.readers} lecteur{stats.readers > 1 ? "s" : ""} sur Codex
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
