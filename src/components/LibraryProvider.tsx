"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Book } from "@/lib/books";
import {
  AccountError,
  EMAIL_LINK_PATH,
  normalizeUsername,
  USERNAME_PATTERN,
  type Account,
  type SignInInput,
  type SignUpInput,
} from "@/lib/account";
import { bookToRow, type EntryInput, type LibraryEntry } from "@/lib/library";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

type Status = "loading" | "ready" | "unconfigured" | "error";

type LibraryContextValue = {
  status: Status;
  errorMessage: string | null;
  account: Account | null;
  entries: LibraryEntry[];
  /** Retrouve un livre déjà dans la bibliothèque à partir de son identifiant */
  findEntry: (bookId: string) => LibraryEntry | undefined;
  /** Ajoute le livre, ou met à jour sa note et son avis s'il y est déjà */
  save: (book: Book, input: EntryInput) => Promise<void>;
  remove: (bookId: string) => Promise<void>;
  /** Enregistre « Mon top » : identifiants des livres, du premier au dernier */
  setTop: (bookIds: string[]) => Promise<void>;
  /** Transforme la session anonyme en vrai compte (la bibliothèque est conservée) */
  signUp: (input: SignUpInput) => Promise<void>;
  /** Se connecte à un compte existant (les livres ajoutés sans compte y sont copiés) */
  signIn: (input: SignInInput) => Promise<void>;
  signOut: () => Promise<void>;
  /** Choisit le pseudo, si le compte n'en a pas encore */
  chooseUsername: (username: string) => Promise<void>;
  /** Change la photo de profil (null = la retirer) */
  setAvatar: (image: Blob | null) => Promise<void>;
  /** Envoie l'e-mail « mot de passe oublié » */
  sendPasswordReset: (email: string) => Promise<void>;
  /** Renvoie l'e-mail de confirmation de l'inscription */
  resendConfirmation: () => Promise<void>;
  changePassword: (password: string) => Promise<void>;
  /** Relit le compte et la bibliothèque (après un clic sur un lien reçu par e-mail) */
  reload: () => Promise<void>;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function useLibrary() {
  const value = useContext(LibraryContext);
  if (!value) throw new Error("useLibrary doit être utilisé dans <LibraryProvider>");
  return value;
}

function requireSupabase(): SupabaseClient {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase n'est pas configuré");
  return supabase;
}

/** Ouvre une session si besoin, puis lit le compte et la bibliothèque. */
async function loadEverything(supabase: SupabaseClient) {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    // Personne n'est connecté : on crée une session « anonyme » invisible,
    // pour pouvoir remplir sa bibliothèque avant même de créer un compte.
    const { error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const user = userData.user;

  let username: string | null = null;
  let avatarUrl: string | null = null;
  if (!user.is_anonymous) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", user.id)
      .maybeSingle();
    if (error) throw error;
    username = profile?.username ?? null;
    avatarUrl = profile?.avatar_url ?? null;

    // Compte tout juste confirmé par e-mail : on crée le profil avec le pseudo
    // choisi à l'inscription (mis de côté en attendant la confirmation).
    const pending = user.user_metadata?.pending_username as string | undefined;
    if (!profile && pending) {
      const { error: insertError } = await supabase
        .from("profiles")
        .insert({ id: user.id, username: pending });
      if (!insertError) username = pending; // sinon (pseudo pris) : la page Compte en redemande un
    }
  }

  const { data: entries, error } = await supabase
    .from("library_entries")
    .select("*")
    .eq("user_id", user.id) // les bibliothèques des autres sont lisibles aussi : on filtre
    .order("created_at", { ascending: false });
  if (error) throw error;

  const account: Account = {
    id: user.id,
    email: user.email ?? null,
    isAnonymous: Boolean(user.is_anonymous),
    username,
    avatarUrl,
    pendingEmail: user.is_anonymous ? (user.new_email ?? null) : null,
  };
  return { account, entries: entries as LibraryEntry[] };
}

async function assertUsernameAvailable(supabase: SupabaseClient, username: string) {
  if (!USERNAME_PATTERN.test(username)) {
    throw new AccountError(
      "Pseudo : 3 à 20 caractères, lettres sans accent, chiffres ou « _ » uniquement.",
    );
  }
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (error) throw error;
  if (data) throw new AccountError("Ce pseudo est déjà pris.");
}

async function insertProfile(supabase: SupabaseClient, username: string) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Aucune session");
  const { error } = await supabase.from("profiles").insert({ id: data.user.id, username });
  if (error) throw error;
}

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>(isSupabaseConfigured ? "loading" : "unconfigured");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [entries, setEntries] = useState<LibraryEntry[]>([]);

  /** Relit tout depuis Supabase (au démarrage et après chaque changement de compte). */
  const reload = useCallback(async () => {
    try {
      const loaded = await loadEverything(requireSupabase());
      setAccount(loaded.account);
      setEntries(loaded.entries);
      setErrorMessage(null);
      setStatus("ready");
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : String(error));
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return; // état « unconfigured » dès le départ
    // Sur la page des liens reçus par e-mail, c'est cette page qui ouvre la session
    // (sinon une session anonyme risquerait de prendre la place de la bonne).
    if (window.location.pathname === EMAIL_LINK_PATH) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chargement initial depuis Supabase
    reload();
  }, [reload]);

  const findEntry = useCallback(
    (bookId: string) => entries.find((e) => e.book_id === bookId),
    [entries],
  );

  const save = useCallback(async (book: Book, input: EntryInput) => {
    const { data, error } = await requireSupabase()
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
    const supabase = requireSupabase();
    const { data } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("library_entries")
      .delete()
      .eq("user_id", data.user?.id ?? "")
      .eq("book_id", bookId);
    if (error) throw error;
    setEntries((current) => current.filter((e) => e.book_id !== bookId));
  }, []);

  const setTop = useCallback(async (bookIds: string[]) => {
    const { error } = await requireSupabase().rpc("set_top", { book_ids: bookIds });
    if (error) throw error;
    setEntries((current) =>
      current.map((e) => {
        const index = bookIds.indexOf(e.book_id);
        return { ...e, top_position: index === -1 ? null : index + 1 };
      }),
    );
  }, []);

  const signUp = useCallback(
    async ({ username, email, password }: SignUpInput) => {
      const supabase = requireSupabase();
      const cleanName = normalizeUsername(username);
      await assertUsernameAvailable(supabase, cleanName);

      // La session anonyme reçoit un e-mail et un mot de passe : c'est le même
      // utilisateur, donc sa bibliothèque est conservée telle quelle.
      // Le pseudo est mis de côté dans le compte, au cas où l'adresse doive d'abord être confirmée.
      const { data, error } = await supabase.auth.updateUser(
        { email: email.trim(), password, data: { pending_username: cleanName } },
        { emailRedirectTo: window.location.origin + EMAIL_LINK_PATH },
      );
      if (error) throw error;
      if (data.user.is_anonymous) {
        // Confirmation par e-mail activée : le compte sera créé au clic sur le lien.
        // La page Compte affiche « vérifiez votre boîte mail ».
        await reload();
        return;
      }
      // Nouveau « badge » de session, qui ne dit plus « anonyme »
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) throw refreshError;

      try {
        await insertProfile(supabase, cleanName);
      } finally {
        // Même si le pseudo a échoué (pris entre-temps), le compte existe :
        // la page Compte proposera d'en choisir un autre.
        await reload();
      }
    },
    [reload],
  );

  const signIn = useCallback(
    async ({ email, password }: SignInInput) => {
      const supabase = requireSupabase();
      // Livres ajoutés avant de se connecter, à recopier dans le compte
      const pending = account?.isAnonymous ? entries : [];

      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;

      if (pending.length) {
        const rows = pending.map(({ book_id, title, authors, cover_url, genres, year, rating, review }) => ({
          book_id, title, authors, cover_url, genres, year, rating, review,
        }));
        // Un livre déjà présent dans le compte n'est pas écrasé
        const { error: copyError } = await supabase
          .from("library_entries")
          .upsert(rows, { onConflict: "user_id,book_id", ignoreDuplicates: true });
        if (copyError) console.error(copyError);
      }
      await reload();
    },
    [account, entries, reload],
  );

  const signOut = useCallback(async () => {
    const { error } = await requireSupabase().auth.signOut();
    if (error) throw error;
    setStatus("loading");
    await reload(); // repart sur une nouvelle session anonyme, bibliothèque vide
  }, [reload]);

  const chooseUsername = useCallback(
    async (username: string) => {
      const supabase = requireSupabase();
      const cleanName = normalizeUsername(username);
      await assertUsernameAvailable(supabase, cleanName);
      await insertProfile(supabase, cleanName);
      await reload();
    },
    [reload],
  );

  const setAvatar = useCallback(
    async (image: Blob | null) => {
      const supabase = requireSupabase();
      if (!account) return;
      // Un seul fichier par compte, toujours au même endroit : avatars/<id>/avatar.jpg
      const path = `${account.id}/avatar.jpg`;
      let url: string | null = null;
      if (image) {
        const { error } = await supabase.storage
          .from("avatars")
          .upload(path, image, { upsert: true, contentType: "image/jpeg", cacheControl: "3600" });
        if (error) throw error;
        // « ?v=… » force les navigateurs à afficher la nouvelle photo, pas l'ancienne en cache
        url = `${supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl}?v=${Date.now()}`;
      } else {
        await supabase.storage.from("avatars").remove([path]);
      }
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: url })
        .eq("id", account.id);
      if (error) throw error;
      setAccount({ ...account, avatarUrl: url });
    },
    [account],
  );

  const sendPasswordReset = useCallback(async (email: string) => {
    const { error } = await requireSupabase().auth.resetPasswordForEmail(email.trim(), {
      // « next=recovery » : utile seulement avec le modèle d'e-mail d'origine de Supabase
      redirectTo: `${window.location.origin}${EMAIL_LINK_PATH}?next=recovery`,
    });
    if (error) throw error;
  }, []);

  const resendConfirmation = useCallback(async () => {
    if (!account?.pendingEmail) return;
    const { error } = await requireSupabase().auth.resend({
      type: "email_change",
      email: account.pendingEmail,
    });
    if (error) throw error;
  }, [account]);

  const changePassword = useCallback(async (password: string) => {
    const { error } = await requireSupabase().auth.updateUser({ password });
    if (error) throw error;
  }, []);

  const value = useMemo(
    () => ({
      status, errorMessage, account, entries, findEntry, save, remove, setTop,
      signUp, signIn, signOut, chooseUsername, setAvatar,
      sendPasswordReset, resendConfirmation, changePassword, reload,
    }),
    [status, errorMessage, account, entries, findEntry, save, remove, setTop, signUp, signIn, signOut, chooseUsername, setAvatar,
      sendPasswordReset, resendConfirmation, changePassword, reload],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}
