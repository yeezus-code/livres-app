"use client";

import { useEffect, useRef, useState } from "react";
import type { Book } from "@/lib/books";
import { toFrenchMessage } from "@/lib/account";
import { isRead, today, type EntryStatus } from "@/lib/library";
import { BookCover } from "./BookCover";
import { useLibrary } from "./LibraryProvider";
import { StarInput } from "./StarRating";

/**
 * Fenêtre pour ajouter un livre à la bibliothèque, ou modifier sa note et son avis.
 * Elle s'affiche dès qu'un livre lui est passé ; onClose la referme.
 */
export function BookDialog({ book, onClose }: { book: Book | null; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (book && !dialog.open) dialog.showModal();
    if (!book && dialog.open) dialog.close();
  }, [book]);

  return (
    <dialog
      ref={dialogRef}
      className="dialog"
      onClose={onClose}
      // Un clic en dehors de la fenêtre la referme
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* key : le formulaire repart de zéro à chaque nouveau livre */}
      {book && <BookForm key={book.id} book={book} onDone={onClose} />}
    </dialog>
  );
}

function BookForm({ book, onDone }: { book: Book; onDone: () => void }) {
  const { findEntry, save, remove } = useLibrary();
  const existing = findEntry(book.id);

  const [status, setStatus] = useState<EntryStatus>(existing?.status ?? "lu");
  const [rating, setRating] = useState<number | null>(existing?.rating ?? null);
  const [review, setReview] = useState(existing?.review ?? "");
  // Nouveau livre lu : la date du jour est proposée (on peut l'effacer ou la changer)
  const [readOn, setReadOn] = useState(
    existing && isRead(existing) ? (existing.read_on ?? "") : today(),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      onDone();
    } catch (e) {
      setError(toFrenchMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const listName = existing && !isRead(existing) ? "votre liste « À lire »" : "votre bibliothèque";

  function handleDelete() {
    if (confirm(`Retirer « ${book.title} » de ${listName} ?`)) {
      run(() => remove(book.id));
    }
  }

  let submitLabel = "Enregistrer";
  if (!existing) submitLabel = status === "lu" ? "Ajouter" : "Ajouter à ma liste";
  else if (existing && !isRead(existing) && status === "lu") submitLabel = "C'est lu !";

  return (
    <form
      className="dialog__body"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => save(book, { status, rating, review, readOn }));
      }}
    >
      <div className="dialog__book">
        <BookCover src={book.coverUrl} title={book.title} size="sm" />
        <div>
          <h2 className="dialog__title">{book.title}</h2>
          {book.authors.length > 0 && <p className="muted">{book.authors.join(", ")}</p>}
          {book.year && <p className="muted small">{book.year}</p>}
        </div>
      </div>

      <div className="tabs tabs--choice" role="radiogroup" aria-label="Où ranger ce livre">
        <button
          type="button"
          role="radio"
          aria-checked={status === "lu"}
          className="tab"
          onClick={() => setStatus("lu")}
        >
          ✓ Je l&apos;ai lu
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={status === "a_lire"}
          className="tab"
          onClick={() => setStatus("a_lire")}
        >
          ☆ Je veux le lire
        </button>
      </div>

      {status === "lu" ? (
        <>
          <fieldset className="field">
            <legend>Votre note</legend>
            <StarInput value={rating} onChange={setRating} />
          </fieldset>

          <label className="field">
            <span>Lu le</span>
            <input
              type="date"
              value={readOn}
              max={today()}
              onChange={(e) => setReadOn(e.target.value)}
              className="input-date"
            />
            <small className="muted">Facultatif : laissez vide si vous ne savez plus.</small>
          </label>

          <label className="field">
            <span>Votre avis</span>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={5}
              maxLength={5000}
              placeholder="Ce que vous en avez pensé… (facultatif)"
            />
          </label>
        </>
      ) : (
        <p className="muted small">
          Le livre rejoint votre liste « À lire ». Quand vous l&apos;aurez lu, rouvrez-le pour le
          noter.
        </p>
      )}

      {error && <p className="error">{error}</p>}

      <div className="dialog__actions">
        {existing && (
          <button type="button" className="btn btn--danger" onClick={handleDelete} disabled={busy}>
            Retirer
          </button>
        )}
        <span className="spacer" />
        <button type="button" className="btn btn--ghost" onClick={onDone} disabled={busy}>
          Annuler
        </button>
        <button type="submit" className="btn btn--primary" disabled={busy}>
          {busy ? "…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
