"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { entryToBook, type LibraryEntry } from "@/lib/library";
import type { Book } from "@/lib/books";
import { profileHref } from "@/lib/social";
import { BookCover } from "./BookCover";
import { useLibrary } from "./LibraryProvider";
import { Stars } from "./StarRating";

/**
 * Fiche en lecture seule d'un livre lu par un autre lecteur : sa note, son avis,
 * et un bouton pour l'ajouter à sa propre bibliothèque.
 */
export function EntryDialog({
  entry,
  username,
  onClose,
  onAdd,
}: {
  entry: LibraryEntry | null;
  username: string;
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

          <p className="small muted">
            Avis de <Link href={profileHref(username)}>@{username}</Link>
          </p>
          {entry.rating ? <Stars value={entry.rating} /> : <p className="muted">Pas de note</p>}
          {entry.review ? (
            <blockquote className="review">{entry.review}</blockquote>
          ) : (
            <p className="muted small">Pas d&apos;avis écrit.</p>
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
