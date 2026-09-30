"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { Book } from "@/lib/books";
import { isRead, type LibraryEntry } from "@/lib/library";
import { fetchPublicProfile, follow, unfollow, type PublicProfile } from "@/lib/social";
import { getSupabase } from "@/lib/supabase";
import { Avatar } from "@/components/Avatar";
import { BookCover } from "@/components/BookCover";
import { BookDialog } from "@/components/BookDialog";
import { BookGrid } from "@/components/BookGrid";
import { EntryDialog } from "@/components/EntryDialog";
import { useLibrary } from "@/components/LibraryProvider";
import { useI18n } from "@/i18n/I18nProvider";

type State =
  | { kind: "loading" }
  | { kind: "missing" }
  | { kind: "error" }
  | { kind: "ready"; profile: PublicProfile };

export default function PublicProfilePage() {
  const { pseudo } = useParams<{ pseudo: string }>();
  const username = decodeURIComponent(pseudo);
  const { status, account } = useLibrary();
  const [state, setState] = useState<State>({ kind: "loading" });
  const [selected, setSelected] = useState<LibraryEntry | null>(null);
  const [toAdd, setToAdd] = useState<Book | null>(null);
  const { t, f, href } = useI18n();

  const load = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    try {
      const profile = await fetchPublicProfile(supabase, username);
      setState(profile ? { kind: "ready", profile } : { kind: "missing" });
    } catch (e) {
      console.error(e);
      setState({ kind: "error" });
    }
  }, [username]);

  // On attend que la session soit prête (elle peut modifier ce qu'on a le droit de lire)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chargement depuis Supabase
    if (status === "ready") load();
  }, [status, load]);

  if (status !== "ready") return null;
  if (state.kind === "loading") return <p className="muted center">{t.common.loading}</p>;
  if (state.kind === "error") return <p className="error center">{t.profile.loadError}</p>;
  if (state.kind === "missing") {
    return (
      <div className="empty">
        <p>{f(t.profile.missing, { name: username })}</p>
        <Link href={href("/lecteurs")} className="btn btn--primary">
          {t.profile.findReader}
        </Link>
      </div>
    );
  }

  const { profile } = state;
  const isMe = account?.id === profile.id;
  const read = profile.entries.filter(isRead);
  const toRead = profile.entries.filter((e) => !isRead(e));
  const top = read
    .filter((e) => e.top_position != null)
    .sort((a, b) => a.top_position! - b.top_position!);
  const rated = read.filter((e) => e.rating).length;

  return (
    <>
      <section className="profile-head">
        <Avatar url={profile.avatar_url} username={profile.username} size={72} />
        <div className="profile-head__main">
          <h1 className="page-title profile-head__name">@{profile.username}</h1>
          <p className="muted small profile-head__stats">
            <span>
              <strong>{read.length}</strong> {f(t.profile.read, { n: read.length })}
            </span>
            <span>
              <strong>{rated}</strong> {f(t.profile.rated, { n: rated })}
            </span>
            <span>
              <strong>{profile.followers}</strong> {f(t.profile.followers, { n: profile.followers })}
            </span>
            <span>
              <strong>{profile.following}</strong> {f(t.profile.following, { n: profile.following })}
            </span>
          </p>
        </div>
        {isMe ? (
          <span className="badge">{t.profile.itsYou}</span>
        ) : (
          <FollowButton profile={profile} onChange={load} />
        )}
      </section>

      {top.length > 0 && (
        <section>
          <h2 className="section-title">{t.profile.top}</h2>
          <ol className="shelf">
            {top.map((entry, index) => (
              <li key={entry.id}>
                <button className="shelf__item" onClick={() => setSelected(entry)}>
                  <span className="shelf__rank">{index + 1}</span>
                  <BookCover src={entry.cover_url} title={entry.title} />
                </button>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section>
        <h2 className="section-title">{t.profile.library}</h2>
        {read.length === 0 ? (
          <p className="muted">{t.profile.noBooks}</p>
        ) : (
          <BookGrid entries={read} onSelect={setSelected} />
        )}
      </section>

      {toRead.length > 0 && (
        <section>
          <h2 className="section-title">{f(t.profile.wantsToRead, { n: toRead.length })}</h2>
          <BookGrid entries={toRead} onSelect={setSelected} />
        </section>
      )}

      <EntryDialog
        entry={selected}
        author={profile}
        onClose={() => setSelected(null)}
        onAdd={(book) => {
          setSelected(null);
          setToAdd(book);
        }}
      />
      <BookDialog book={toAdd} onClose={() => setToAdd(null)} />
    </>
  );
}

function FollowButton({ profile, onChange }: { profile: PublicProfile; onChange: () => void }) {
  const { account } = useLibrary();
  const [following, setFollowing] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const { t, href } = useI18n();
  const canFollow = Boolean(account && !account.isAnonymous && account.username);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !canFollow) return;
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", account!.id)
      .eq("followee_id", profile.id)
      .then(({ count }) => setFollowing((count ?? 0) > 0));
  }, [account, canFollow, profile.id]);

  if (!canFollow) {
    return (
      <Link href={href("/compte")} className="btn btn--primary">
        {t.profile.follow}
      </Link>
    );
  }
  if (following === null) return null;

  async function toggle() {
    const supabase = getSupabase()!;
    setBusy(true);
    try {
      if (following) await unfollow(supabase, account!.id, profile.id);
      else await follow(supabase, account!.id, profile.id);
      setFollowing(!following);
      onChange(); // met à jour le nombre d'abonnés
    } catch (e) {
      console.error(e);
      alert(t.profile.actionFailed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      className={following ? "btn btn--ghost" : "btn btn--primary"}
      onClick={toggle}
      disabled={busy}
    >
      {following ? t.profile.followingButton : t.profile.follow}
    </button>
  );
}
