"use client";

import { useEffect, useRef, useState } from "react";
import type { Book } from "@/lib/books";
import { toMessage } from "@/lib/account";
import { useI18n } from "@/i18n/I18nProvider";
import { isRead, today, type EntryStatus } from "@/lib/library";
import { BookHeader } from "./BookHeader";
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
  const { t, f, locale } = useI18n();
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
      setError(toMessage(e, locale, t.errors));
    } finally {
      setBusy(false);
    }
  }

  function handleDelete() {
    const question =
      existing && !isRead(existing) ? t.book.confirmRemoveToRead : t.book.confirmRemoveLibrary;
    if (confirm(f(question, { title: book.title }))) {
      run(() => remove(book.id));
    }
  }

  let submitLabel = t.common.save;
  if (!existing) submitLabel = status === "lu" ? t.common.add : t.book.addToList;
  else if (existing && !isRead(existing) && status === "lu") submitLabel = t.book.doneReading;

  return (
    <form
      className="dialog__body"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => save(book, { status, rating, review, readOn }));
      }}
    >
      <BookHeader book={book} />

      <div className="tabs tabs--choice" role="radiogroup" aria-label={t.book.where}>
        <button
          type="button"
          role="radio"
          aria-checked={status === "lu"}
          className="tab"
          onClick={() => setStatus("lu")}
        >
          {t.book.read}
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={status === "a_lire"}
          className="tab"
          onClick={() => setStatus("a_lire")}
        >
          {t.book.wantToRead}
        </button>
      </div>

      {status === "lu" ? (
        <>
          <fieldset className="field">
            <legend>{t.book.yourRating}</legend>
            <StarInput value={rating} onChange={setRating} />
          </fieldset>

          <label className="field">
            <span>{t.book.readOnLabel}</span>
            <input
              type="date"
              value={readOn}
              max={today()}
              onChange={(e) => setReadOn(e.target.value)}
              className="input-date"
            />
            <small className="muted">{t.book.readOnHint}</small>
          </label>

          <label className="field">
            <span>{t.book.yourReview}</span>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={5}
              maxLength={5000}
              placeholder={t.book.reviewPlaceholder}
            />
          </label>
        </>
      ) : (
        <p className="muted small">{t.book.toReadInfo}</p>
      )}

      {error && <p className="error">{error}</p>}

      <div className="dialog__actions">
        {existing && (
          <button type="button" className="btn btn--danger" onClick={handleDelete} disabled={busy}>
            {t.book.remove}
          </button>
        )}
        <span className="spacer" />
        <button type="button" className="btn btn--ghost" onClick={onDone} disabled={busy}>
          {t.common.cancel}
        </button>
        <button type="submit" className="btn btn--primary" disabled={busy}>
          {busy ? "…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
