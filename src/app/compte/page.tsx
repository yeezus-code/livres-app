"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { prepareAvatar } from "@/lib/avatar";
import { Avatar } from "@/components/Avatar";
import { profileHref } from "@/lib/social";
import { normalizeUsername, PASSWORD_MIN_LENGTH, toFrenchMessage } from "@/lib/account";
import { useLibrary } from "@/components/LibraryProvider";

type Mode = "signup" | "signin" | "forgot";

export default function AccountPage() {
  const { status, account, entries } = useLibrary();
  if (status !== "ready" || !account) return null; // le bandeau d'état s'affiche au-dessus

  if (account.isAnonymous) {
    return account.pendingEmail ? (
      <PendingConfirmation email={account.pendingEmail} bookCount={entries.length} />
    ) : (
      <AuthForms bookCount={entries.length} />
    );
  }
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
  const { signUp, signIn, sendPasswordReset } = useLibrary();
  const [mode, setMode] = useState<Mode>("signup");
  const [resetSent, setResetSent] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { busy, error, submit } = useSubmit();

  function switchTo(next: Mode) {
    setMode(next);
    setResetSent(false);
  }

  let intro =
    mode === "signup"
      ? "Un compte permet de retrouver votre bibliothèque sur tous vos appareils."
      : mode === "signin"
        ? "Connectez-vous pour retrouver votre bibliothèque."
        : "Indiquez l'adresse de votre compte : vous recevrez un lien pour choisir un nouveau mot de passe.";
  if (mode !== "forgot" && bookCount === 1) {
    intro +=
      mode === "signup"
        ? " Le livre déjà ajouté sera conservé."
        : " Le livre ajouté sur cet appareil y sera copié.";
  }
  if (mode !== "forgot" && bookCount > 1) {
    intro +=
      mode === "signup"
        ? ` Les ${bookCount} livres déjà ajoutés seront conservés.`
        : ` Les ${bookCount} livres ajoutés sur cet appareil y seront copiés.`;
  }

  return (
    <div className="narrow">
      <h1 className="page-title">Mon compte</h1>

      <div className="tabs" role="tablist">
        <button
          role="tab"
          aria-selected={mode === "signup"}
          className="tab"
          onClick={() => switchTo("signup")}
        >
          Créer un compte
        </button>
        <button
          role="tab"
          aria-selected={mode !== "signup"}
          className="tab"
          onClick={() => switchTo("signin")}
        >
          Se connecter
        </button>
      </div>

      <form
        className="card"
        onSubmit={(e) => {
          e.preventDefault();
          submit(async () => {
            if (mode === "signup") await signUp({ username, email, password });
            else if (mode === "signin") await signIn({ email, password });
            else {
              await sendPasswordReset(email);
              setResetSent(true);
            }
          });
        }}
      >
        {mode === "forgot" && <h2 className="card__title">Mot de passe oublié</h2>}
        <p className="muted small">{intro}</p>

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
                : "Visible par les autres. 3 à 20 caractères : lettres, chiffres ou « _ »."}
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

        {mode !== "forgot" && (
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
        )}

        {error && <p className="error">{error}</p>}
        {resetSent && (
          <p className="success">
            C&apos;est envoyé ! Si un compte existe pour cette adresse, un e-mail arrive dans
            quelques instants (pensez à regarder dans les indésirables).
          </p>
        )}

        <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
          {busy
            ? "…"
            : mode === "signup"
              ? "Créer mon compte"
              : mode === "signin"
                ? "Se connecter"
                : resetSent
                  ? "Renvoyer le lien"
                  : "Recevoir le lien"}
        </button>

        {mode === "signin" && (
          <p className="center small">
            <button type="button" className="text-btn" onClick={() => switchTo("forgot")}>
              Mot de passe oublié ?
            </button>
          </p>
        )}
        {mode === "forgot" && (
          <p className="center small">
            <button type="button" className="text-btn" onClick={() => switchTo("signin")}>
              ← Retour à la connexion
            </button>
          </p>
        )}
      </form>
    </div>
  );
}

/** Inscription faite, en attente du clic sur le lien de confirmation. */
function PendingConfirmation({ email, bookCount }: { email: string; bookCount: number }) {
  const { resendConfirmation } = useLibrary();
  const [restart, setRestart] = useState(false);
  const [sent, setSent] = useState(false);
  const { busy, error, submit } = useSubmit();

  if (restart) return <AuthForms bookCount={bookCount} />;

  return (
    <div className="narrow">
      <h1 className="page-title">Vérifiez votre boîte mail</h1>
      <div className="card">
        <p>
          Un e-mail de confirmation a été envoyé à <strong>{email}</strong>. Cliquez sur le lien
          qu&apos;il contient pour activer votre compte.
        </p>
        <p className="muted small">
          Rien reçu ? Regardez dans les indésirables, ou renvoyez l&apos;e-mail. En attendant,
          vous pouvez continuer à utiliser l&apos;application normalement.
        </p>
        {error && <p className="error">{error}</p>}
        {sent && <p className="success">E-mail renvoyé.</p>}
        <button
          className="btn btn--primary btn--block"
          disabled={busy}
          onClick={() =>
            submit(async () => {
              await resendConfirmation();
              setSent(true);
            })
          }
        >
          {busy ? "…" : "Renvoyer l'e-mail"}
        </button>
        <p className="center small">
          <button type="button" className="text-btn" onClick={() => setRestart(true)}>
            Utiliser une autre adresse
          </button>
        </p>
      </div>
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
        <ChangePassword />
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

function ChangePassword() {
  const { changePassword } = useLibrary();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);
  const { busy, error, submit } = useSubmit();

  if (!open) {
    return (
      <p>
        <button type="button" className="text-btn" onClick={() => setOpen(true)}>
          Changer mon mot de passe
        </button>
        {done && <span className="success"> Mot de passe changé.</span>}
      </p>
    );
  }

  return (
    <form
      className="subform"
      onSubmit={(e) => {
        e.preventDefault();
        submit(async () => {
          await changePassword(password);
          setPassword("");
          setDone(true);
          setOpen(false);
        });
      }}
    >
      <label className="field">
        <span>Nouveau mot de passe</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={PASSWORD_MIN_LENGTH}
          autoComplete="new-password"
        />
        <small className="muted">Au moins {PASSWORD_MIN_LENGTH} caractères.</small>
      </label>
      {error && <p className="error">{error}</p>}
      <div className="dialog__actions">
        <span className="spacer" />
        <button type="button" className="btn btn--ghost" onClick={() => setOpen(false)}>
          Annuler
        </button>
        <button type="submit" className="btn btn--primary" disabled={busy}>
          {busy ? "…" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
