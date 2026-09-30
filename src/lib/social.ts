// Lecture des profils publics, abonnements et fil d'activité.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { LibraryEntry } from "./library";

export type Profile = { id: string; username: string };

export type PublicProfile = Profile & {
  entries: LibraryEntry[];
  followers: number;
  following: number;
};

export type ActivityItem = { entry: LibraryEntry; username: string };

/** Adresse de la page publique d'un lecteur. */
export function profileHref(username: string) {
  return `/u/${username}`;
}

/** Profil complet d'un lecteur à partir de son pseudo (null s'il n'existe pas). */
export async function fetchPublicProfile(
  supabase: SupabaseClient,
  username: string,
): Promise<PublicProfile | null> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("username", username.toLowerCase())
    .maybeSingle();
  if (error) throw error;
  if (!profile) return null;

  const [entries, followers, following] = await Promise.all([
    supabase
      .from("library_entries")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("followee_id", profile.id),
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", profile.id),
  ]);
  if (entries.error) throw entries.error;

  return {
    ...profile,
    entries: entries.data as LibraryEntry[],
    followers: followers.count ?? 0,
    following: following.count ?? 0,
  };
}

/** Les lecteurs que je suis. */
export async function fetchFollowing(supabase: SupabaseClient, myId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("follows")
    .select("followee:profiles!follows_followee_id_fkey(id, username)")
    .eq("follower_id", myId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as { followee: Profile }[]).map((row) => row.followee);
}

export async function follow(supabase: SupabaseClient, myId: string, otherId: string) {
  const { error } = await supabase
    .from("follows")
    .insert({ follower_id: myId, followee_id: otherId });
  if (error && error.code !== "23505") throw error; // 23505 : déjà abonné
}

export async function unfollow(supabase: SupabaseClient, myId: string, otherId: string) {
  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", myId)
    .eq("followee_id", otherId);
  if (error) throw error;
}

/** Dernières lectures ajoutées ou notées par les lecteurs suivis. */
export async function fetchActivity(
  supabase: SupabaseClient,
  people: Profile[],
): Promise<ActivityItem[]> {
  if (!people.length) return [];
  const names = new Map(people.map((p) => [p.id, p.username]));
  const { data, error } = await supabase
    .from("library_entries")
    .select("*")
    .in("user_id", [...names.keys()])
    .order("updated_at", { ascending: false })
    .limit(40);
  if (error) throw error;
  return (data as (LibraryEntry & { user_id: string })[]).map((entry) => ({
    entry,
    username: names.get(entry.user_id)!,
  }));
}

/** Recherche de lecteurs par pseudo ; sans texte, les derniers inscrits. */
export async function searchReaders(supabase: SupabaseClient, query: string): Promise<Profile[]> {
  let request = supabase.from("profiles").select("id, username");
  const clean = query.trim().toLowerCase();
  if (clean) {
    // « _ » et « % » ont un sens spécial dans ILIKE : on les neutralise
    const escaped = clean.replace(/[\\%_]/g, (c) => `\\${c}`);
    request = request.ilike("username", `%${escaped}%`).order("username");
  } else {
    request = request.order("created_at", { ascending: false });
  }
  const { data, error } = await request.limit(20);
  if (error) throw error;
  return data as Profile[];
}

/** « il y a 3 jours » */
export function timeAgo(iso: string): string {
  const seconds = (new Date(iso).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, size] of steps) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return "à l'instant";
}
