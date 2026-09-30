"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchLikeState, setLiked } from "@/lib/likes";
import { getSupabase } from "@/lib/supabase";
import { useI18n } from "@/i18n/I18nProvider";
import { useLibrary } from "./LibraryProvider";

/** Bouton « ♥ J'aime » d'un avis, avec le nombre de « j'aime ». */
export function LikeButton({ entryId, ownerId }: { entryId: string; ownerId?: string }) {
  const { account } = useLibrary();
  const { t, f, href } = useI18n();
  const myId = account && !account.isAnonymous && account.username ? account.id : null;
  const [state, setState] = useState<{ count: number; mine: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    fetchLikeState(supabase, entryId, myId)
      .then(setState)
      .catch((e) => console.error(e)); // table absente : le bouton reste masqué
  }, [entryId, myId]);

  if (!state) return null;
  const label = f(t.like.count, { n: state.count });

  // Son propre avis, ou visiteur sans compte : on affiche seulement le nombre
  if (!myId || myId === ownerId) {
    return (
      <span className="like like--static" title={myId ? undefined : t.like.createAccountHint}>
        <span aria-hidden="true">♥</span> {label}
        {!myId && (
          <>
            {" "}· <Link href={href("/compte")}>{t.like.signInToLike}</Link>
          </>
        )}
      </span>
    );
  }

  async function toggle() {
    const supabase = getSupabase()!;
    const next = !state!.mine;
    setBusy(true);
    // Mise à jour immédiate à l'écran, annulée en cas d'échec
    setState((s) => s && { count: s.count + (next ? 1 : -1), mine: next });
    try {
      await setLiked(supabase, myId!, entryId, next);
    } catch (e) {
      console.error(e);
      setState((s) => s && { count: s.count + (next ? -1 : 1), mine: !next });
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className={state.mine ? "like like--on" : "like"}
      aria-pressed={state.mine}
      onClick={toggle}
      disabled={busy}
    >
      <span aria-hidden="true">{state.mine ? "♥" : "♡"}</span> {label}
    </button>
  );
}
