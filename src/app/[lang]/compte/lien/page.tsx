"use client";

import type { EmailOtpType } from "@supabase/supabase-js";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { PASSWORD_MIN_LENGTH, toMessage } from "@/lib/account";
import { useI18n } from "@/i18n/I18nProvider";
import { getSupabase } from "@/lib/supabase";
import { useLibrary } from "@/components/LibraryProvider";

// Page d'arrivée des liens envoyés par e-mail :
//   /compte/lien?token_hash=…&type=email_change   → confirmation de l'inscription
//   /compte/lien?token_hash=…&type=recovery       → mot de passe oublié

type State =
  | { kind: "ready"; recovery: boolean } // en attente du clic sur « Continuer »
  | { kind: "checking" }
  | { kind: "confirmed" }
  | { kind: "new-password" }
  | { kind: "password-saved" }
  | { kind: "error"; message: string; recovery: boolean };

export default function EmailLinkPage() {
  return (
    <Suspense>
      <EmailLink />
    </Suspense>
  );
}

/** Erreur renvoyée par Supabase dans l'adresse (« ?error_code=… » ou « #error_code=… »). */
function linkError(params: URLSearchParams) {
  const hash = new URLSearchParams(typeof window === "undefined" ? "" : window.location.hash.slice(1));
  const description = params.get("error_description") ?? hash.get("error_description");
  if (!description) return null;
  return Object.assign(new Error(description), {
    code: params.get("error_code") ?? hash.get("error_code") ?? "otp_expired",
  });
}

function EmailLink() {
  const params = useSearchParams();
  const { reload } = useLibrary();
  const { t, locale, href } = useI18n();
  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;
  const code = params.get("code");
  const recovery = type === "recovery" || params.get("next") === "recovery";

  // Lien normal : on attend un clic avant de l'utiliser. Les messageries (Gmail, Outlook,
  // antivirus…) « ouvrent » souvent les liens pour les tester : sans ce clic, ce test
  // suffirait à consommer le lien, qui ne fonctionne qu'une fois.
  const [state, setState] = useState<State>(() =>
    tokenHash && type ? { kind: "ready", recovery } : { kind: "checking" },
  );
  const started = useRef(false);

  const verify = useCallback(async () => {
    if (started.current) return; // un lien ne sert qu'une fois : on ne le vérifie pas deux fois
    started.current = true;
    setState({ kind: "checking" });
    const supabase = getSupabase();
    try {
      if (!supabase) throw new Error("Supabase n'est pas configuré");
      const fromLink = linkError(params);
      if (fromLink) throw fromLink;
      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
        if (error) throw error;
      } else if (code) {
        // Ancien format de lien (modèle d'e-mail d'origine de Supabase)
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;
      } else {
        throw Object.assign(new Error("Lien incomplet"), { code: "otp_expired" });
      }
      setState({ kind: recovery ? "new-password" : "confirmed" });
      await reload();
    } catch (e) {
      console.error(e);
      await reload(); // charge le compte (ou recrée une session anonyme si le lien a échoué)
      // Lien déjà utilisé, mais l'adresse est bien confirmée (ex. par un double clic, ou par
      // le test automatique de la messagerie) : sur cet appareil, le compte est déjà actif.
      const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
      if (!recovery && data.user && !data.user.is_anonymous && data.user.email) {
        setState({ kind: "confirmed" });
      } else {
        setState({ kind: "error", message: toMessage(e, locale, t.errors), recovery });
      }
    }
  }, [params, tokenHash, type, code, recovery, reload, locale, t]);

  // Erreur dans le lien, ou ancien format : pas de clic nécessaire
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- vérification au chargement
    if (!(tokenHash && type)) verify();
  }, [tokenHash, type, verify]);

  return (
    <div className="narrow">
      {state.kind === "ready" && (
        <>
          <h1 className="page-title">
            {state.recovery ? t.emailLink.newPasswordTitle : t.emailLink.confirmTitle}
          </h1>
          <div className="card">
            <p>{state.recovery ? t.emailLink.recoveryIntro : t.emailLink.confirmIntro}</p>
            <button className="btn btn--primary btn--block" onClick={verify}>
              {state.recovery ? t.emailLink.continue : t.emailLink.confirmButton}
            </button>
          </div>
        </>
      )}

      {state.kind === "checking" && <p className="muted center">{t.emailLink.checking}</p>}

      {state.kind === "confirmed" && (
        <>
          <h1 className="page-title">{t.emailLink.confirmedTitle}</h1>
          <div className="card">
            <p>{t.emailLink.confirmedText}</p>
            <Link href={href("/compte")} className="btn btn--primary btn--block">
              {t.emailLink.seeAccount}
            </Link>
          </div>
        </>
      )}

      {state.kind === "new-password" && (
        <NewPasswordForm onDone={() => setState({ kind: "password-saved" })} />
      )}

      {state.kind === "password-saved" && (
        <>
          <h1 className="page-title">{t.emailLink.passwordSavedTitle}</h1>
          <div className="card">
            <p>{t.emailLink.passwordSavedText}</p>
            <Link href={href("/bibliotheque")} className="btn btn--primary btn--block">
              {t.emailLink.myLibrary}
            </Link>
          </div>
        </>
      )}

      {state.kind === "error" && (
        <>
          <h1 className="page-title">{t.emailLink.invalidTitle}</h1>
          <div className="card">
            <p className="error">{state.message}</p>
            <p className="muted small">
              {t.emailLink.invalidHint}{" "}
              {state.recovery ? t.emailLink.recoveryHint : t.emailLink.maybeConfirmed}
            </p>
            <Link href={href("/compte")} className="btn btn--primary btn--block">
              {state.recovery ? t.emailLink.backToAccount : t.emailLink.signIn}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

function NewPasswordForm({ onDone }: { onDone: () => void }) {
  const { changePassword } = useLibrary();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t, f, locale } = useI18n();

  return (
    <>
      <h1 className="page-title">{t.emailLink.newPasswordTitle}</h1>
      <form
        className="card"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            await changePassword(password);
            onDone();
          } catch (err) {
            setError(toMessage(err, locale, t.errors));
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="field">
          <span>{t.emailLink.chooseNewPassword}</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={PASSWORD_MIN_LENGTH}
            autoComplete="new-password"
            autoFocus
          />
          <small className="muted">{f(t.account.passwordHint, { n: PASSWORD_MIN_LENGTH })}</small>
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
          {busy ? "…" : t.common.save}
        </button>
      </form>
    </>
  );
}
