import type { Book } from "./books";

/** Une ligne de la table « library_entries » dans Supabase. */
export type LibraryEntry = {
  id: string;
  book_id: string;
  title: string;
  authors: string[];
  cover_url: string | null;
  genres: string[];
  year: number | null;
  rating: number | null;
  review: string | null;
  /** Place dans « Mon top » (1 = premier), null si le livre n'y est pas */
  top_position: number | null;
  created_at: string;
  updated_at: string;
};

/** Nombre maximum de livres dans « Mon top » */
export const TOP_SIZE = 10;

/** Ce que l'utilisateur saisit dans le formulaire. */
export type EntryInput = { rating: number | null; review: string };

/** Convertit un livre trouvé par la recherche en ligne de bibliothèque. */
export function bookToRow(book: Book) {
  return {
    book_id: book.id,
    title: book.title,
    authors: book.authors,
    cover_url: book.coverUrl,
    genres: book.genres,
    year: book.year,
  };
}

/** Le même livre, vu depuis la bibliothèque (pour réafficher sa fiche). */
export function entryToBook(entry: LibraryEntry): Book {
  return {
    id: entry.book_id,
    title: entry.title,
    authors: entry.authors,
    coverUrl: entry.cover_url,
    genres: entry.genres,
    year: entry.year,
  };
}
