// Lecture d'un top 10 public côté serveur (image de partage et page /u/<pseudo>/top).
import type { Locale } from "@/i18n/config";

export type TopBook = { title: string; author: string | null; coverUrl: string | null };
export type SharedTop = { username: string; books: TopBook[] };

/** Petit appel à l'API de Supabase, avec la clé publique (données publiques seulement). */
async function supabaseGet<T>(path: string): Promise<T> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase n'est pas configuré");
  const res = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: key },
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Supabase a répondu ${res.status}`);
  return res.json();
}

/** Le top d'un lecteur, du premier au dernier (null si le pseudo n'existe pas). */
export async function fetchSharedTop(username: string): Promise<SharedTop | null> {
  const clean = username.toLowerCase().replace(/[^a-z0-9_]/g, "");
  if (!clean) return null;
  const profiles = await supabaseGet<{ id: string; username: string }[]>(
    `profiles?select=id,username&username=eq.${clean}`,
  );
  const profile = profiles[0];
  if (!profile) return null;
  const rows = await supabaseGet<
    { title: string; authors: string[] | null; cover_url: string | null }[]
  >(
    `library_entries?select=title,authors,cover_url&user_id=eq.${profile.id}` +
      `&top_position=not.is.null&order=top_position.asc&limit=10`,
  );
  return {
    username: profile.username,
    books: rows.map((r) => ({ title: r.title, author: r.authors?.[0] ?? null, coverUrl: r.cover_url })),
  };
}

/** Adresse de l'image du top ; « v » change quand le top change (l'ancienne image n'est pas resservie). */
export function topImagePath(top: SharedTop, locale: Locale) {
  let hash = 0;
  for (const char of top.books.map((b) => b.title + b.coverUrl).join("|")) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return `/api/top-image?u=${top.username}&lang=${locale}&v=${hash.toString(36)}`;
}
