"use client";

import { useEffect, useRef, useState } from "react";
import type { Book } from "@/lib/books";
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

  const [rating, setRating] = useState<number | null>(existing?.rating ?? null);
  const [review, setReview] = useState(existing?.review ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      onDone();
    } catch (e) {
      console.error(e);
      setError("L'enregistrement a échoué. Vérifiez votre connexion et réessayez.");
    } finally {
      setBusy(false);
    }
  }

  function handleDelete() {
    if (confirm(`Retirer « ${book.title} » de votre bibliothèque ?`)) {
      run(() => remove(book.id));
    }
  }

  return (
    <form
      className="dialog__body"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => save(book, { rating, review }));
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

      <fieldset className="field">
        <legend>Votre note</legend>
        <StarInput value={rating} onChange={setRating} />
      </fieldset>

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
          {busy ? "…" : existing ? "Enregistrer" : "Ajouter"}
        </button>
      </div>
    </form>
  );
}
