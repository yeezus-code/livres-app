"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Book } from "@/lib/books";
import {
  fetchActivity,
  fetchFollowing,
  profileHref,
  searchReaders,
  type ActivityItem,
  type Profile,
} from "@/lib/social";
import { isRead } from "@/lib/library";
import { fetchLikeCounts } from "@/lib/likes";
import { getSupabase } from "@/lib/supabase";
import { Avatar } from "@/components/Avatar";
import { BookCover } from "@/components/BookCover";
import { BookDialog } from "@/components/BookDialog";
import { EntryDialog } from "@/components/EntryDialog";
import { useLibrary } from "@/components/LibraryProvider";
import { Stars } from "@/components/StarRating";
import { useI18n } from "@/i18n/I18nProvider";

export default function ReadersPage() {
  const { status, account } = useLibrary();
  const hasProfile = Boolean(account && !account.isAnonymous && account.username);
  const { t, f, r, href, ago } = useI18n();

  const [query, setQuery] = useState("");
  const [readers, setReaders] = useState<Profile[] | null>(null);
  const [following, setFollowing] = useState<Profile[] | null>(null);
  const [activity, setActivity] = useState<ActivityItem[] | null>(null);
  const [selected, setSelected] = useState<ActivityItem | null>(null);
  const [toAdd, setToAdd] = useState<Book | null>(null);
  const [likes, setLikes] = useState<Map<string, number>>(new Map());

  // Mes abonnements et leur activité
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || status !== "ready" || !hasProfile) return;
    (async () => {
      try {
        const people = await fetchFollowing(supabase, account!.id);
        setFollowing(people);
        const items = await fetchActivity(supabase, people);
        setActivity(items);
        setLikes(await fetchLikeCounts(supabase, items.filter((i) => i.entry.review).map((i) => i.entry.id)));
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
      <h1 className="page-title">{t.readers.title}</h1>

      {!hasProfile && (
        <p className="banner">
          {r(t.readers.needAccount, {
            link: <Link href={href("/compte")}>{t.readers.createAccount}</Link>,
          })}
        </p>
      )}

      {hasProfile && following && following.length > 0 && (
        <section>
          <h2 className="section-title">{t.readers.myFollowing}</h2>
          <ul className="chips">
            {following.map((p) => (
              <li key={p.id}>
                <Link href={href(profileHref(p.username))} className="chip">
                  <Avatar url={p.avatar_url} username={p.username} size={24} />@{p.username}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {hasProfile && activity && (
        <section>
          <h2 className="section-title">{t.readers.activity}</h2>
          {activity.length === 0 ? (
            <p className="muted">
              {following?.length
                ? t.readers.followingEmpty
                : t.readers.noFollowing}
            </p>
          ) : (
            <ul className="feed">
              {activity.map((item) => (
                <li key={item.entry.id}>
                  <button className="feed__item" onClick={() => setSelected(item)}>
                    <BookCover src={item.entry.cover_url} title={item.entry.title} size="sm" />
                    <span className="feed__text">
                      <span className="small with-avatar">
                        <Avatar url={item.author.avatar_url} username={item.author.username} size={20} />
                        <strong>@{item.author.username}</strong>{" "}
                        <span className="muted">
                          {isRead(item.entry) ? t.readers.hasRead : t.readers.wantsToRead} · {ago(item.entry.updated_at)}
                        </span>
                      </span>
                      <span className="feed__title">{item.entry.title}</span>
                      <Stars value={item.entry.rating} />
                      {item.entry.review && (
                        <span className="tile__review">
                          {f(t.common.quote, { text: item.entry.review })}
                        </span>
                      )}
                      {(likes.get(item.entry.id) ?? 0) > 0 && (
                        <span className="like-count">♥ {likes.get(item.entry.id)}</span>
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
        <h2 className="section-title">{t.readers.find}</h2>
        <input
          type="search"
          className="input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.readers.placeholder}
          aria-label={t.readers.label}
          autoCapitalize="none"
        />
        {readers && readers.length === 0 && (
          <p className="muted">{query.trim() ? t.readers.noneFound : t.readers.nobodyYet}</p>
        )}
        {readers && readers.length > 0 && (
          <>
            {!query.trim() && <p className="muted small">{t.readers.newest}</p>}
            <ul className="chips">
              {readers.map((p) => (
                <li key={p.id}>
                  <Link href={href(profileHref(p.username))} className="chip">
                    <Avatar url={p.avatar_url} username={p.username} size={24} />@{p.username}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <EntryDialog
        entry={selected?.entry ?? null}
        author={selected?.author ?? null}
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

