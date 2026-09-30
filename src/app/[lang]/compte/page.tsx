"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { prepareAvatar } from "@/lib/avatar";
import { Avatar } from "@/components/Avatar";
import { profileHref } from "@/lib/social";
import { normalizeUsername, PASSWORD_MIN_LENGTH, toMessage } from "@/lib/account";
import { useI18n } from "@/i18n/I18nProvider";
import { isRead } from "@/lib/library";
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
  const { t, locale } = useI18n();

  async function submit(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(toMessage(e, locale, t.errors));
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
  const { t, f } = useI18n();

  function switchTo(next: Mode) {
    setMode(next);
    setResetSent(false);
  }

  let intro =
    mode === "signup"
      ? t.account.introSignUp
      : mode === "signin"
        ? t.account.introSignIn
        : t.account.introForgot;
  if (mode !== "forgot" && bookCount > 0) {
    intro +=
      " " +
      f(mode === "signup" ? t.account.keptOnSignUp : t.account.copiedOnSignIn, { n: bookCount });
  }

  return (
    <div className="narrow">
      <h1 className="page-title">{t.account.title}</h1>

      <div className="tabs" role="tablist">
        <button
          role="tab"
          aria-selected={mode === "signup"}
          className="tab"
          onClick={() => switchTo("signup")}
        >
          {t.account.signUp}
        </button>
        <button
          role="tab"
          aria-selected={mode !== "signup"}
          className="tab"
          onClick={() => switchTo("signin")}
        >
          {t.account.signIn}
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
        {mode === "forgot" && <h2 className="card__title">{t.account.forgotTitle}</h2>}
        <p className="muted small">{intro}</p>

        {mode === "signup" && (
          <label className="field">
            <span>{t.account.username}</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={20}
              autoComplete="username"
              autoCapitalize="none"
              placeholder={t.account.usernamePlaceholder}
            />
            <small className="muted">
              {username.trim() && normalizeUsername(username) !== username
                ? f(t.account.usernameSavedAs, { name: normalizeUsername(username) })
                : t.account.usernameHint}
            </small>
          </label>
        )}

        <label className="field">
          <span>{t.account.email}</span>
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
            <span>{t.account.password}</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={mode === "signup" ? PASSWORD_MIN_LENGTH : undefined}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
            {mode === "signup" && (
              <small className="muted">{f(t.account.passwordHint, { n: PASSWORD_MIN_LENGTH })}</small>
            )}
          </label>
        )}

        {error && <p className="error">{error}</p>}
        {resetSent && (
          <p className="success">{t.account.resetSent}</p>
        )}

        <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
          {busy
            ? "…"
            : mode === "signup"
              ? t.account.createMyAccount
              : mode === "signin"
                ? t.account.signIn
                : resetSent
                  ? t.account.resendLink
                  : t.account.getLink}
        </button>

        {mode === "signin" && (
          <p className="center small">
            <button type="button" className="text-btn" onClick={() => switchTo("forgot")}>
              {t.account.forgotLink}
            </button>
          </p>
        )}
        {mode === "forgot" && (
          <p className="center small">
            <button type="button" className="text-btn" onClick={() => switchTo("signin")}>
              {t.account.backToSignIn}
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
  const { t, r } = useI18n();

  if (restart) return <AuthForms bookCount={bookCount} />;

  return (
    <div className="narrow">
      <h1 className="page-title">{t.account.checkInbox}</h1>
      <div className="card">
        <p>{r(t.account.confirmationSent, { email: <strong>{email}</strong> })}</p>
        <p className="muted small">{t.account.nothingReceived}</p>
        {error && <p className="error">{error}</p>}
        {sent && <p className="success">{t.account.emailResent}</p>}
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
          {busy ? "…" : t.account.resendEmail}
        </button>
        <p className="center small">
          <button type="button" className="text-btn" onClick={() => setRestart(true)}>
            {t.account.otherAddress}
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
  const { t } = useI18n();

  return (
    <div className="narrow">
      <h1 className="page-title">{t.account.chooseUsername}</h1>
      <form
        className="card"
        onSubmit={(e) => {
          e.preventDefault();
          submit(() => chooseUsername(username));
        }}
      >
        <p className="muted small">{t.account.onlyUsernameMissing}</p>
        <label className="field">
          <span>{t.account.username}</span>
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
          {busy ? "…" : t.account.validate}
        </button>
      </form>
    </div>
  );
}

function Profile() {
  const { account, entries, signOut } = useLibrary();
  const { busy, error, submit } = useSubmit();
  const read = entries.filter(isRead);
  const rated = read.filter((e) => e.rating).length;
  const toRead = entries.length - read.length;
  const { t, f, href } = useI18n();

  return (
    <div className="narrow">
      <h1 className="page-title">{t.account.title}</h1>
      <div className="card">
        <AvatarEditor />
        <p className="profile__name">@{account!.username}</p>
        <p className="muted">{account!.email}</p>
        <p>
          {f(t.account.statsRead, { n: read.length })}, {f(t.account.statsRated, { n: rated })}
          {" · "}
          {f(t.account.statsToRead, { n: toRead })}.
        </p>
        <p>
          <Link href={href(profileHref(account!.username!))}>{t.account.publicProfile}</Link>
          {" · "}
          <Link href={href("/installer")}>{t.account.installApp}</Link>
        </p>
        <ChangePassword />
        {error && <p className="error">{error}</p>}
        <button
          className="btn btn--ghost btn--block"
          disabled={busy}
          onClick={() => submit(signOut)}
        >
          {t.account.signOut}
        </button>
      </div>
    </div>
  );
}

function AvatarEditor() {
  const { account, setAvatar } = useLibrary();
  const { busy, error, submit } = useSubmit();
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useI18n();

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
          {busy ? t.account.uploading : account!.avatarUrl ? t.account.changePhoto : t.account.addPhoto}
        </button>
        {account!.avatarUrl && (
          <button
            type="button"
            className="link-btn"
            disabled={busy}
            onClick={() => submit(() => setAvatar(null))}
          >
            {t.account.removePhoto}
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
  const { t, f } = useI18n();

  if (!open) {
    return (
      <p>
        <button type="button" className="text-btn" onClick={() => setOpen(true)}>
          {t.account.changePassword}
        </button>
        {done && <span className="success"> {t.account.passwordChanged}</span>}
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
        <span>{t.account.newPassword}</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={PASSWORD_MIN_LENGTH}
          autoComplete="new-password"
        />
        <small className="muted">{f(t.account.passwordHint, { n: PASSWORD_MIN_LENGTH })}</small>
      </label>
      {error && <p className="error">{error}</p>}
      <div className="dialog__actions">
        <span className="spacer" />
        <button type="button" className="btn btn--ghost" onClick={() => setOpen(false)}>
          {t.common.cancel}
        </button>
        <button type="submit" className="btn btn--primary" disabled={busy}>
          {busy ? "…" : t.common.save}
        </button>
      </div>
    </form>
  );
}
