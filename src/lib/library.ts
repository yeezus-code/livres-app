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
  /** « lu » (bibliothèque) ou « a_lire » (liste « À lire ») */
  status?: EntryStatus;
  /** Date de lecture, au format AAAA-MM-JJ (facultative) */
  read_on?: string | null;
  /** Propriétaire (présent quand on lit la bibliothèque de quelqu'un d'autre) */
  user_id?: string;
  created_at: string;
  updated_at: string;
};

/** Nombre maximum de livres dans « Mon top » */
export const TOP_SIZE = 10;

export type EntryStatus = "lu" | "a_lire";

/** Ce que l'utilisateur saisit dans le formulaire. */
export type EntryInput = {
  status: EntryStatus;
  rating: number | null;
  review: string;
  /** AAAA-MM-JJ, ou chaîne vide */
  readOn: string;
};

/** Le livre a-t-il été lu ? (les fiches d'avant la liste « À lire » sont considérées comme lues) */
export function isRead(entry: LibraryEntry) {
  return (entry.status ?? "lu") === "lu";
}

/** La date du jour au format AAAA-MM-JJ (heure locale) */
export function today() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

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
