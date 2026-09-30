"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { entryToBook, formatDate, isRead, type LibraryEntry } from "@/lib/library";
import type { Book } from "@/lib/books";
import { profileHref, type Profile } from "@/lib/social";
import { Avatar } from "./Avatar";
import { BookCover } from "./BookCover";
import { LikeButton } from "./LikeButton";
import { useLibrary } from "./LibraryProvider";
import { Stars } from "./StarRating";

/**
 * Fiche en lecture seule d'un livre lu par un autre lecteur : sa note, son avis,
 * et un bouton pour l'ajouter à sa propre bibliothèque.
 */
export function EntryDialog({
  entry,
  author,
  onClose,
  onAdd,
}: {
  entry: LibraryEntry | null;
  author: Profile | null;
  onClose: () => void;
  /** Ouvre la fenêtre d'ajout à ma bibliothèque */
  onAdd: (book: Book) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { status, findEntry } = useLibrary();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (entry && !dialog.open) dialog.showModal();
    if (!entry && dialog.open) dialog.close();
  }, [entry]);

  const mine = entry ? findEntry(entry.book_id) : undefined;

  return (
    <dialog
      ref={dialogRef}
      className="dialog"
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {entry && (
        <div className="dialog__body">
          <div className="dialog__book">
            <BookCover src={entry.cover_url} title={entry.title} size="sm" />
            <div>
              <h2 className="dialog__title">{entry.title}</h2>
              {entry.authors.length > 0 && <p className="muted">{entry.authors.join(", ")}</p>}
              <p className="small muted">
                {[entry.year, ...entry.genres].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>

          {author && (
            <p className="small muted with-avatar">
              <Avatar url={author.avatar_url} username={author.username} size={24} />
              {isRead(entry) ? "Avis de" : "Dans la liste « À lire » de"}{" "}
              <Link href={profileHref(author.username)}>@{author.username}</Link>
            </p>
          )}
          {isRead(entry) && (
            <>
              <div className="entry-meta">
                {entry.rating ? <Stars value={entry.rating} /> : <span className="muted">Pas de note</span>}
                {entry.read_on && (
                  <span className="small muted">Lu le {formatDate(entry.read_on)}</span>
                )}
              </div>
              {entry.review ? (
                <>
                  <blockquote className="review">{entry.review}</blockquote>
                  <p>
                    <LikeButton entryId={entry.id} ownerId={entry.user_id} />
                  </p>
                </>
              ) : (
                <p className="muted small">Pas d&apos;avis écrit.</p>
              )}
            </>
          )}

          <div className="dialog__actions">
            <span className="spacer" />
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Fermer
            </button>
            {status === "ready" && (
              <button
                type="button"
                className={mine ? "btn btn--ghost" : "btn btn--primary"}
                onClick={() => onAdd(entryToBook(entry))}
              >
                {mine ? "Ma note" : "Ajouter à ma bibliothèque"}
              </button>
            )}
          </div>
        </div>
      )}
    </dialog>
  );
}
