"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Book } from "@/lib/books";
import {
  fetchActivity,
  fetchFollowing,
  profileHref,
  searchReaders,
  timeAgo,
  type ActivityItem,
  type Profile,
} from "@/lib/social";
import { getSupabase } from "@/lib/supabase";
import { BookCover } from "@/components/BookCover";
import { BookDialog } from "@/components/BookDialog";
import { EntryDialog } from "@/components/EntryDialog";
import { useLibrary } from "@/components/LibraryProvider";
import { Stars } from "@/components/StarRating";

export default function ReadersPage() {
  const { status, account } = useLibrary();
  const hasProfile = Boolean(account && !account.isAnonymous && account.username);

  const [query, setQuery] = useState("");
  const [readers, setReaders] = useState<Profile[] | null>(null);
  const [following, setFollowing] = useState<Profile[] | null>(null);
  const [activity, setActivity] = useState<ActivityItem[] | null>(null);
  const [selected, setSelected] = useState<ActivityItem | null>(null);
  const [toAdd, setToAdd] = useState<Book | null>(null);

  // Mes abonnements et leur activité
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || status !== "ready" || !hasProfile) return;
    (async () => {
      try {
        const people = await fetchFollowing(supabase, account!.id);
        setFollowing(people);
        setActivity(await fetchActivity(supabase, people));
      } catch (e) {
        console.error(e);
      }
    })();
  }, [status, hasProfile, account]);

  // Recherche de lecteurs (0,3 s après la dernière frappe)
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || status !== "ready") return;
    const timer = setTimeout(async () => {
      try {
        const found = await searchReaders(supabase, query);
        setReaders(found.filter((p) => p.id !== account?.id));
      } catch (e) {
        console.error(e);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, status, account]);

  if (status !== "ready") return null;

  return (
    <>
      <h1 className="page-title">Lecteurs</h1>

      {!hasProfile && (
        <p className="banner">
          Vous pouvez parcourir les profils, mais pour suivre des lecteurs il faut un compte.{" "}
          <Link href="/compte">Créer un compte</Link>
        </p>
      )}

      {hasProfile && following && following.length > 0 && (
        <section>
          <h2 className="section-title">Mes abonnements</h2>
          <ul className="chips">
            {following.map((p) => (
              <li key={p.id}>
                <Link href={profileHref(p.username)} className="chip">
                  @{p.username}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {hasProfile && activity && (
        <section>
          <h2 className="section-title">Activité</h2>
          {activity.length === 0 ? (
            <p className="muted">
              {following?.length
                ? "Vos abonnements n'ont encore rien ajouté."
                : "Abonnez-vous à des lecteurs pour voir ici leurs dernières lectures."}
            </p>
          ) : (
            <ul className="feed">
              {activity.map((item) => (
                <li key={item.entry.id}>
                  <button className="feed__item" onClick={() => setSelected(item)}>
                    <BookCover src={item.entry.cover_url} title={item.entry.title} size="sm" />
                    <span className="feed__text">
                      <span className="small">
                        <strong>@{item.username}</strong>{" "}
                        <span className="muted">· {timeAgo(item.entry.updated_at)}</span>
                      </span>
                      <span className="feed__title">{item.entry.title}</span>
                      <Stars value={item.entry.rating} />
                      {item.entry.review && (
                        <span className="tile__review">« {item.entry.review} »</span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section>
        <h2 className="section-title">Trouver des lecteurs</h2>
        <input
          type="search"
          className="input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Pseudo, ex. marie_lit"
          aria-label="Pseudo du lecteur"
          autoCapitalize="none"
        />
        {readers && readers.length === 0 && (
          <p className="muted">{query.trim() ? "Aucun lecteur trouvé." : "Personne pour l'instant."}</p>
        )}
        {readers && readers.length > 0 && (
          <>
            {!query.trim() && <p className="muted small">Derniers inscrits</p>}
            <ul className="chips">
              {readers.map((p) => (
                <li key={p.id}>
                  <Link href={profileHref(p.username)} className="chip">
                    @{p.username}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <EntryDialog
        entry={selected?.entry ?? null}
        username={selected?.username ?? ""}
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

