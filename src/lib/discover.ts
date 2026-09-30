// « À découvrir » : des suggestions personnalisées, calculées à partir de la bibliothèque
// du lecteur (ses genres préférés) et des coups de cœur des lecteurs qu'il suit.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Book } from "./books";
import { statsToBook, type BookStats } from "./home";
import { entryToBook, isRead, type LibraryEntry } from "./library";
import { fetchFollowing, type Profile } from "./social";

export type Suggestion = { book: Book; note: string };
export type SuggestionShelf = { id: string; title: string; items: Suggestion[] };

const SHELF_SIZE = 12;

/** Les genres les plus fréquents parmi les livres lus et appréciés (4/5 ou plus). */
export function favoriteGenres(entries: LibraryEntry[], max = 2): string[] {
  const read = entries.filter(isRead);
  const loved = read.filter((e) => (e.rating ?? 0) >= 4);
  const counts = new Map<string, number>();
  for (const entry of loved.length ? loved : read) {
    for (const genre of entry.genres ?? []) {
      if (genre === "Roman") continue; // trop vague pour conseiller quoi que ce soit
      counts.set(genre, (counts.get(genre) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([genre]) => genre);
}

/** Les livres notés 4/5 ou plus par les lecteurs suivis, et pas encore dans la bibliothèque. */
async function fromFollowing(
  supabase: SupabaseClient,
  myId: string,
  owned: Set<string>,
): Promise<Suggestion[]> {
  const people = await fetchFollowing(supabase, myId);
  if (!people.length) return [];
  const byId = new Map<string, Profile>(people.map((p) => [p.id, p]));
  const { data, error } = await supabase
    .from("library_entries")
    .select("*")
    .in("user_id", [...byId.keys()])
    .gte("rating", 4)
    .order("updated_at", { ascending: false })
    .limit(60);
  if (error) throw error;

  const items: Suggestion[] = [];
  const seen = new Set<string>();
  for (const entry of data as (LibraryEntry & { user_id: string })[]) {
    if (owned.has(entry.book_id) || seen.has(entry.book_id)) continue;
    seen.add(entry.book_id);
    items.push({
      book: entryToBook(entry),
      note: `${"★".repeat(entry.rating ?? 0)} par @${byId.get(entry.user_id)?.username ?? "?"}`,
    });
    if (items.length >= SHELF_SIZE) break;
  }
  return items;
}

/** Les livres d'un genre les mieux notés par la communauté, pas encore dans la bibliothèque. */
async function fromGenre(
  supabase: SupabaseClient,
  genre: string,
  owned: Set<string>,
): Promise<Suggestion[]> {
  const { data, error } = await supabase
    .from("book_stats")
    .select("*")
    .contains("genres", [genre])
    .order("score", { ascending: false, nullsFirst: false })
    .order("readers", { ascending: false })
    .limit(40);
  if (error) throw error;
  return (data as BookStats[])
    .filter((s) => !owned.has(s.book_id))
    .slice(0, SHELF_SIZE)
    .map((s) => ({
      book: statsToBook(s),
      note:
        s.average !== null
          ? `★ ${Number(s.average).toLocaleString("fr-FR", { maximumFractionDigits: 1 })}`
          : `${s.readers} lecteur${s.readers > 1 ? "s" : ""}`,
    }));
}

/** Toutes les rangées « À découvrir » d'un lecteur (vide s'il n'a encore rien lu ni suivi). */
export async function fetchSuggestions(
  supabase: SupabaseClient,
  myId: string,
  entries: LibraryEntry[],
): Promise<SuggestionShelf[]> {
  const owned = new Set(entries.map((e) => e.book_id));
  const genres = favoriteGenres(entries);

  const [friends, ...byGenre] = await Promise.all([
    fromFollowing(supabase, myId, owned),
    ...genres.map((g) => fromGenre(supabase, g, owned)),
  ]);

  const shelves: SuggestionShelf[] = [];
  if (friends.length) {
    shelves.push({ id: "abonnements", title: "Les coups de cœur de vos abonnements", items: friends });
  }
  const shown = new Set(friends.map((s) => s.book.id));
  genres.forEach((genre, i) => {
    const items = byGenre[i].filter((s) => !shown.has(s.book.id));
    items.forEach((s) => shown.add(s.book.id));
    if (items.length >= 2) {
      shelves.push({ id: `genre-${genre}`, title: `Parce que vous aimez : ${genre.toLowerCase()}`, items });
    }
  });
  return shelves;
}
