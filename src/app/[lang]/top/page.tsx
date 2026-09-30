"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { isRead, TOP_SIZE, type LibraryEntry } from "@/lib/library";
import { BookCover } from "@/components/BookCover";
import { LibraryTabs } from "@/components/LibraryTabs";
import { useLibrary } from "@/components/LibraryProvider";
import { Stars } from "@/components/StarRating";
import { useI18n } from "@/i18n/I18nProvider";

export default function TopPage() {
  const { status, entries: allEntries, setTop, account } = useLibrary();
  // Seuls les livres lus peuvent entrer dans le top
  const entries = useMemo(() => allEntries.filter(isRead), [allEntries]);
  /** null = on regarde le top ; sinon = liste en cours de modification */
  const [draft, setDraft] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t, f, href } = useI18n();

  const byId = useMemo(() => new Map(entries.map((e) => [e.book_id, e])), [entries]);

  const savedTop = useMemo(
    () =>
      entries
        .filter((e) => e.top_position != null)
        .sort((a, b) => a.top_position! - b.top_position!),
    [entries],
  );

  // Livres les mieux notés (pour pré-remplir le top)
  const bestRated = useMemo(
    () =>
      entries
        .filter((e) => e.rating)
        .sort((a, b) => b.rating! - a.rating! || a.created_at.localeCompare(b.created_at))
        .slice(0, TOP_SIZE)
        .map((e) => e.book_id),
    [entries],
  );

  if (status !== "ready") return null; // le bandeau d'état s'affiche au-dessus

  if (entries.length === 0) {
    return (
      <>
        <LibraryTabs />
        <h1 className="page-title">{t.top.title}</h1>
        <div className="empty">
          <p>{t.top.emptyLibrary}</p>
          <Link href={href("/recherche")} className="btn btn--primary">
            {t.common.searchBook}
          </Link>
        </div>
      </>
    );
  }

  // ------------------------------------------------------------------ Lecture
  if (draft === null) {
    return (
      <>
        <LibraryTabs />
        <div className="page-head">
          <h1 className="page-title">{t.top.title}</h1>
          {savedTop.length > 0 && (
            <button
              className="btn btn--ghost"
              onClick={() => setDraft(savedTop.map((e) => e.book_id))}
            >
              {t.common.edit}
            </button>
          )}
        </div>

        {savedTop.length === 0 ? (
          <div className="empty">
            <p>{f(t.top.intro, { n: TOP_SIZE })}</p>
            <div className="empty__actions">
              {bestRated.length > 0 && (
                <button className="btn btn--primary" onClick={() => setDraft(bestRated)}>
                  {t.top.fromBest}
                </button>
              )}
              <button
                className={bestRated.length > 0 ? "btn btn--ghost" : "btn btn--primary"}
                onClick={() => setDraft([])}
              >
                {t.top.compose}
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="top-share-link">
              {account?.username ? (
                <Link href={href(`/u/${account.username}/top`)} className="btn btn--primary">
                  ↗ {t.share.shareMyTop}
                </Link>
              ) : (
                <span className="muted small">
                  <Link href={href("/compte")}>{t.share.needAccount}</Link>
                </span>
              )}
            </p>
            <ol className="top">
              {savedTop.map((entry, index) => (
                <li key={entry.id} className="top__item">
                  <span className="top__rank">{index + 1}</span>
                  <BookCover src={entry.cover_url} title={entry.title} size="sm" />
                  <BookInfo entry={entry} />
                </li>
              ))}
            </ol>
          </>
        )}
      </>
    );
  }

  // ------------------------------------------------------------ Modification
  const inTop = draft.map((id) => byId.get(id)).filter((e): e is LibraryEntry => Boolean(e));
  const others = entries
    .filter((e) => !draft.includes(e.book_id))
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  const full = draft.length >= TOP_SIZE;

  function move(index: number, delta: number) {
    setDraft((current) => {
      const next = [...current!];
      [next[index], next[index + delta]] = [next[index + delta], next[index]];
      return next;
    });
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await setTop(inTop.map((e) => e.book_id));
      setDraft(null);
    } catch (e) {
      console.error(e);
      setError(t.top.saveFailed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <LibraryTabs />
      <h1 className="page-title">{t.top.editTitle}</h1>

      {inTop.length === 0 ? (
        <p className="muted">{t.top.emptyDraft}</p>
      ) : (
        <ol className="top">
          {inTop.map((entry, index) => (
            <li key={entry.id} className="top__item">
              <span className="top__rank">{index + 1}</span>
              <BookCover src={entry.cover_url} title={entry.title} size="sm" />
              <BookInfo entry={entry} />
              <div className="top__controls">
                <button
                  className="icon-btn"
                  aria-label={f(t.top.moveUp, { title: entry.title })}
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  ↑
                </button>
                <button
                  className="icon-btn"
                  aria-label={f(t.top.moveDown, { title: entry.title })}
                  disabled={index === inTop.length - 1}
                  onClick={() => move(index, 1)}
                >
                  ↓
                </button>
                <button
                  className="icon-btn icon-btn--danger"
                  aria-label={f(t.top.removeFromTop, { title: entry.title })}
                  onClick={() => setDraft(draft.filter((id) => id !== entry.book_id))}
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className="sticky-actions">
        {error && <p className="error">{error}</p>}
        <div className="dialog__actions">
          <span className="spacer" />
          <button className="btn btn--ghost" onClick={() => setDraft(null)} disabled={busy}>
            {t.common.cancel}
          </button>
          <button className="btn btn--primary" onClick={save} disabled={busy}>
            {busy ? "…" : t.common.save}
          </button>
        </div>
      </div>

      {others.length > 0 && (
        <>
          <h2 className="section-title">{t.top.myLibrary}</h2>
          <p className="muted small section-hint">
            {full ? f(t.top.full, { n: TOP_SIZE }) : t.top.tapPlus}
          </p>
          <ul className="top top--pick">
            {others.map((entry) => (
              <li key={entry.id} className="top__item">
                <BookCover src={entry.cover_url} title={entry.title} size="sm" />
                <BookInfo entry={entry} />
                <button
                  className="icon-btn icon-btn--add"
                  aria-label={f(t.top.addToTop, { title: entry.title })}
                  disabled={full}
                  onClick={() => setDraft([...draft, entry.book_id])}
                >
                  +
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

function BookInfo({ entry }: { entry: LibraryEntry }) {
  return (
    <div className="top__info">
      <p className="top__title">{entry.title}</p>
      {entry.authors[0] && <p className="muted small">{entry.authors[0]}</p>}
      <Stars value={entry.rating} />
    </div>
  );
}
