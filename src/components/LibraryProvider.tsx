"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Book } from "@/lib/books";
import { bookToRow, type EntryInput, type LibraryEntry } from "@/lib/library";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

type Status = "loading" | "ready" | "unconfigured" | "error";

type LibraryContextValue = {
  status: Status;
  errorMessage: string | null;
  entries: LibraryEntry[];
  /** Retrouve un livre déjà dans la bibliothèque à partir de son identifiant */
  findEntry: (bookId: string) => LibraryEntry | undefined;
  /** Ajoute le livre, ou met à jour sa note et son avis s'il y est déjà */
  save: (book: Book, input: EntryInput) => Promise<void>;
  remove: (bookId: string) => Promise<void>;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function useLibrary() {
  const value = useContext(LibraryContext);
  if (!value) throw new Error("useLibrary doit être utilisé dans <LibraryProvider>");
  return value;
}

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>(isSupabaseConfigured ? "loading" : "unconfigured");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [entries, setEntries] = useState<LibraryEntry[]>([]);

  // Au premier affichage : on ouvre une session puis on charge la bibliothèque.
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return; // état « unconfigured » dès le départ

    (async () => {
      try {
        // Pas encore de comptes : chaque navigateur reçoit une session
        // « anonyme » invisible. Quand les comptes arriveront, cette session
        // pourra être rattachée à un e-mail sans perdre la bibliothèque.
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          const { error } = await supabase.auth.signInAnonymously();
          if (error) throw error;
        }

        const { data, error } = await supabase
          .from("library_entries")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;

        setEntries(data as LibraryEntry[]);
        setStatus("ready");
      } catch (error) {
        console.error(error);
        setErrorMessage(error instanceof Error ? error.message : String(error));
        setStatus("error");
      }
    })();
  }, []);

  const findEntry = useCallback(
    (bookId: string) => entries.find((e) => e.book_id === bookId),
    [entries],
  );

  const save = useCallback(async (book: Book, input: EntryInput) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase n'est pas configuré");

    const { data, error } = await supabase
      .from("library_entries")
      .upsert(
        { ...bookToRow(book), rating: input.rating, review: input.review.trim() || null },
        { onConflict: "user_id,book_id" },
      )
      .select()
      .single();
    if (error) throw error;

    const saved = data as LibraryEntry;
    setEntries((current) =>
      current.some((e) => e.id === saved.id)
        ? current.map((e) => (e.id === saved.id ? saved : e)) // modification : même place
        : [saved, ...current], // nouvel ajout : en tête de liste
    );
  }, []);

  const remove = useCallback(async (bookId: string) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase n'est pas configuré");

    const { error } = await supabase.from("library_entries").delete().eq("book_id", bookId);
    if (error) throw error;
    setEntries((current) => current.filter((e) => e.book_id !== bookId));
  }, []);

  const value = useMemo(
    () => ({ status, errorMessage, entries, findEntry, save, remove }),
    [status, errorMessage, entries, findEntry, save, remove],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}
