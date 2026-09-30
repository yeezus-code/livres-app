"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { Book } from "@/lib/books";
import type { Collection } from "@/lib/collections";
import { BookShelf } from "./BookShelf";

/** Les livres d'une sélection (null tant qu'ils chargent). */
export function useCollectionBooks(id: string, enabled = true): Book[] | null {
  const [books, setBooks] = useState<Book[] | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    fetch(`/api/liste?id=${encodeURIComponent(id)}`)
      .then((res) => res.json())
      .then((data) => !cancelled && setBooks(data.books ?? []))
      .catch(() => !cancelled && setBooks([]));
    return () => {
      cancelled = true;
    };
  }, [id, enabled]);
  return books;
}

/**
 * Un bandeau aux couleurs d'une sélection (Noël, plage…) avec sa rangée de couvertures.
 * « delay » (page des sélections) : les livres sont chargés à l'approche du bandeau, ou au
 * plus tard après ce délai, pour ne pas interroger les sites de livres tous en même temps.
 */
export function CollectionBand({
  collection,
  onSelect,
  eyebrow,
  showAllLink = false,
  delay = 0,
}: {
  collection: Collection;
  onSelect: (book: Book) => void;
  eyebrow?: string;
  showAllLink?: boolean;
  delay?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(delay === 0);
  const books = useCollectionBooks(collection.id, visible);

  useEffect(() => {
    if (visible || !ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setVisible(true),
      { rootMargin: "400px" },
    );
    observer.observe(ref.current);
    const timer = setTimeout(() => setVisible(true), delay);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [visible, delay]);

  if (books?.length === 0) return null; // sources indisponibles : on n'affiche rien

  const { from, to, accent } = collection.theme;
  return (
    <section
      ref={ref}
      id={collection.id}
      className="home-section season"
      style={
        {
          "--season-from": from,
          "--season-to": to,
          "--season-accent": accent,
        } as React.CSSProperties
      }
    >
      <div className="season__head">
        <div>
          {eyebrow && <p className="season__eyebrow">{eyebrow}</p>}
          <h2 className="season__title">{collection.title}</h2>
          <p className="season__subtitle">{collection.subtitle}</p>
        </div>
        {showAllLink && (
          <Link href="/selections" className="season__link">
            Toutes les sélections →
          </Link>
        )}
      </div>
      <BookShelf
        loading={books === null}
        items={(books ?? []).map((book) => ({ book }))}
        onSelect={onSelect}
      />
    </section>
  );
}

const noSubscribe = () => () => {};

/**
 * La date du jour, lue dans le navigateur (null pendant le rendu côté serveur, pour
 * que la page construite à l'avance ne fige pas la saison du jour de la mise en ligne).
 */
export function useToday(): Date | null {
  const day = useSyncExternalStore(
    noSubscribe,
    () => new Date().toDateString(),
    () => null,
  );
  return useMemo(() => (day ? new Date(day) : null), [day]);
}
