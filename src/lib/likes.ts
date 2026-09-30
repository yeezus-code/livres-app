// « J'aime » sur les avis (table review_likes, voir 06-a-lire-dates-jaime.sql).
import type { SupabaseClient } from "@supabase/supabase-js";

/** Nombre de « j'aime » pour chaque avis de la liste. */
export async function fetchLikeCounts(
  supabase: SupabaseClient,
  entryIds: string[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (!entryIds.length) return counts;
  const { data, error } = await supabase
    .from("review_likes")
    .select("entry_id")
    .in("entry_id", entryIds);
  if (error) {
    console.error(error); // ex. fichier SQL pas encore lancé : on affiche simplement 0
    return counts;
  }
  for (const { entry_id } of data as { entry_id: string }[]) {
    counts.set(entry_id, (counts.get(entry_id) ?? 0) + 1);
  }
  return counts;
}

/** Nombre de « j'aime » d'un avis, et si je l'aime déjà. */
export async function fetchLikeState(
  supabase: SupabaseClient,
  entryId: string,
  myId: string | null,
): Promise<{ count: number; mine: boolean }> {
  const { data, error } = await supabase
    .from("review_likes")
    .select("user_id")
    .eq("entry_id", entryId);
  if (error) throw error;
  const rows = data as { user_id: string }[];
  return { count: rows.length, mine: Boolean(myId && rows.some((r) => r.user_id === myId)) };
}

export async function setLiked(
  supabase: SupabaseClient,
  myId: string,
  entryId: string,
  liked: boolean,
) {
  const { error } = liked
    ? await supabase.from("review_likes").insert({ user_id: myId, entry_id: entryId })
    : await supabase.from("review_likes").delete().eq("user_id", myId).eq("entry_id", entryId);
  if (error && error.code !== "23505") throw error; // 23505 : déjà aimé
}
