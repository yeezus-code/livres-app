// Données de la page d'accueil, calculées à partir des bibliothèques publiques.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Book } from "./books";
import type { LibraryEntry } from "./library";
import type { Profile } from "./social";

/** Une ligne de la vue « book_stats » (voir 05-photos-et-accueil.sql). */
export type BookStats = {
  book_id: string;
  title: string;
  authors: string[];
  cover_url: string | null;
  genres: string[];
  year: number | null;
  readers: number;
  ratings: number;
  average: number | null;
};

export function statsToBook(s: BookStats): Book {
  return {
    id: s.book_id,
    title: s.title,
    authors: s.authors,
    coverUrl: s.cover_url,
    genres: s.genres,
    year: s.year,
  };
}

/** Ce que les lecteurs de l'application pensent d'un livre (null si personne ne l'a lu). */
export async function fetchBookStats(
  supabase: SupabaseClient,
  bookId: string,
): Promise<BookStats | null> {
  const { data, error } = await supabase
    .from("book_stats")
    .select("*")
    .eq("book_id", bookId)
    .maybeSingle();
  if (error) throw error;
  return data as BookStats | null;
}

/** Les mieux notés par les lecteurs de l'application. */
export async function fetchBestRated(supabase: SupabaseClient): Promise<BookStats[]> {
  const { data, error } = await supabase
    .from("book_stats")
    .select("*")
    .gt("ratings", 0)
    .order("score", { ascending: false })
    .order("ratings", { ascending: false })
    .limit(12);
  if (error) throw error;
  return data as BookStats[];
}

/** Les livres présents dans le plus de bibliothèques. */
export async function fetchPopular(supabase: SupabaseClient): Promise<BookStats[]> {
  const { data, error } = await supabase
    .from("book_stats")
    .select("*")
    .order("readers", { ascending: false })
    .order("ratings", { ascending: false })
    .limit(12);
  if (error) throw error;
  return data as BookStats[];
}

export type Review = { entry: LibraryEntry; author: Profile };

/** Les derniers avis écrits par des lecteurs (avec pseudo et photo). */
export async function fetchRecentReviews(supabase: SupabaseClient): Promise<Review[]> {
  const { data, error } = await supabase
    .from("library_entries")
    .select("*")
    .not("review", "is", null)
    .order("updated_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  const entries = data as (LibraryEntry & { user_id: string })[];
  if (!entries.length) return [];

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", [...new Set(entries.map((e) => e.user_id))]);
  if (profilesError) throw profilesError;
  const byId = new Map((profiles as Profile[]).map((p) => [p.id, p]));

  return entries
    .filter((e) => byId.has(e.user_id)) // seulement les comptes publics
    .slice(0, 6)
    .map((entry) => ({ entry, author: byId.get(entry.user_id)! }));
}
