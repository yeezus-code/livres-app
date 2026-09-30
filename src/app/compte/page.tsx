"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { prepareAvatar } from "@/lib/avatar";
import { Avatar } from "@/components/Avatar";
import { profileHref } from "@/lib/social";
import { normalizeUsername, PASSWORD_MIN_LENGTH, toFrenchMessage } from "@/lib/account";
import { useLibrary } from "@/components/LibraryProvider";

type Mode = "signup" | "signin";

export default function AccountPage() {
  const { status, account, entries } = useLibrary();
  if (status !== "ready" || !account) return null; // le bandeau d'état s'affiche au-dessus

  if (account.isAnonymous) return <AuthForms bookCount={entries.length} />;
  if (!account.username) return <UsernameForm />;
  return <Profile />;
}

/** Petit utilitaire : désactive le formulaire pendant l'envoi et affiche l'erreur. */
function useSubmit() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(toFrenchMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, submit };
}

function AuthForms({ bookCount }: { bookCount: number }) {
  const { signUp, signIn } = useLibrary();
  const [mode, setMode] = useState<Mode>("signup");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { busy, error, submit } = useSubmit();

  return (
    <div className="narrow">
      <h1 className="page-title">Mon compte</h1>

      <div className="tabs" role="tablist">
        <button
          role="tab"
          aria-selected={mode === "signup"}
          className="tab"
          onClick={() => setMode("signup")}
        >
          Créer un compte
        </button>
        <button
          role="tab"
          aria-selected={mode === "signin"}
          className="tab"
          onClick={() => setMode("signin")}
        >
          Se connecter
        </button>
      </div>

      <form
        className="card"
        onSubmit={(e) => {
          e.preventDefault();
          submit(() =>
            mode === "signup" ? signUp({ username, email, password }) : signIn({ email, password }),
          );
        }}
      >
        <p className="muted small">
          {mode === "signup"
            ? "Un compte permet de retrouver votre bibliothèque sur tous vos appareils."
            : "Connectez-vous pour retrouver votre bibliothèque."}
          {bookCount === 1 &&
            (mode === "signup"
              ? " Le livre déjà ajouté sera conservé."
              : " Le livre ajouté sur cet appareil y sera copié.")}
          {bookCount > 1 &&
            (mode === "signup"
              ? ` Les ${bookCount} livres déjà ajoutés seront conservés.`
              : ` Les ${bookCount} livres ajoutés sur cet appareil y seront copiés.`)}
        </p>

        {mode === "signup" && (
          <label className="field">
            <span>Pseudo</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={20}
              autoComplete="username"
              autoCapitalize="none"
              placeholder="ex. marie_lit"
            />
            <small className="muted">
              {username.trim() && normalizeUsername(username) !== username
                ? `Il sera enregistré ainsi : @${normalizeUsername(username)}`
                : "Visible par les autres plus tard. 3 à 20 caractères : lettres, chiffres ou « _ »."}
            </small>
          </label>
        )}

        <label className="field">
          <span>E-mail</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </label>

        <label className="field">
          <span>Mot de passe</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={mode === "signup" ? PASSWORD_MIN_LENGTH : undefined}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />
          {mode === "signup" && (
            <small className="muted">Au moins {PASSWORD_MIN_LENGTH} caractères.</small>
          )}
        </label>

        {error && <p className="error">{error}</p>}

        <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
          {busy ? "…" : mode === "signup" ? "Créer mon compte" : "Se connecter"}
        </button>
      </form>
    </div>
  );
}

function UsernameForm() {
  const { chooseUsername } = useLibrary();
  const [username, setUsername] = useState("");
  const { busy, error, submit } = useSubmit();

  return (
    <div className="narrow">
      <h1 className="page-title">Choisissez un pseudo</h1>
      <form
        className="card"
        onSubmit={(e) => {
          e.preventDefault();
          submit(() => chooseUsername(username));
        }}
      >
        <p className="muted small">Votre compte est créé, il ne manque que votre pseudo.</p>
        <label className="field">
          <span>Pseudo</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3}
            maxLength={20}
            autoCapitalize="none"
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
          {busy ? "…" : "Valider"}
        </button>
      </form>
    </div>
  );
}

function Profile() {
  const { account, entries, signOut } = useLibrary();
  const { busy, error, submit } = useSubmit();
  const rated = entries.filter((e) => e.rating).length;

  return (
    <div className="narrow">
      <h1 className="page-title">Mon compte</h1>
      <div className="card">
        <AvatarEditor />
        <p className="profile__name">@{account!.username}</p>
        <p className="muted">{account!.email}</p>
        <p>
          {entries.length} livre{entries.length > 1 ? "s" : ""} dans la bibliothèque, dont {rated}{" "}
          noté{rated > 1 ? "s" : ""}.
        </p>
        <p>
          <Link href={profileHref(account!.username!)}>Voir mon profil public</Link>
        </p>
        {error && <p className="error">{error}</p>}
        <button
          className="btn btn--ghost btn--block"
          disabled={busy}
          onClick={() => submit(signOut)}
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
}

function AvatarEditor() {
  const { account, setAvatar } = useLibrary();
  const { busy, error, submit } = useSubmit();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="avatar-editor">
      <Avatar url={account!.avatarUrl} username={account!.username!} size={88} />
      <div className="avatar-editor__actions">
        <button
          type="button"
          className="btn btn--ghost"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? "Envoi…" : account!.avatarUrl ? "Changer la photo" : "Ajouter une photo"}
        </button>
        {account!.avatarUrl && (
          <button
            type="button"
            className="link-btn"
            disabled={busy}
            onClick={() => submit(() => setAvatar(null))}
          >
            Retirer la photo
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = ""; // permet de rechoisir le même fichier
          if (file) submit(async () => setAvatar(await prepareAvatar(file)));
        }}
      />
      {error && <p className="error small">{error}</p>}
    </div>
  );
}
