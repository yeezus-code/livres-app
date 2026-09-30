import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// Ces deux valeurs viennent du fichier .env.local (en local) ou des
// « Environment Variables » de Vercel (en ligne). Voir le README.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Nouvelle « publishable key » ou ancienne clé « anon » : les deux fonctionnent.
const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && key);

let client: SupabaseClient | null = null;

/** Client Supabase utilisé dans le navigateur (null si Supabase n'est pas configuré). */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  client ??= createBrowserClient(url!, key!);
  return client;
}
