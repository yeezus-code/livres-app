"use client";

import type { EmailOtpType } from "@supabase/supabase-js";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { PASSWORD_MIN_LENGTH, toMessage } from "@/lib/account";
import { useI18n } from "@/i18n/I18nProvider";
import { getSupabase } from "@/lib/supabase";
import { useLibrary } from "@/components/LibraryProvider";

// Page d'arrivée des liens envoyés par e-mail :
//   /compte/lien?token_hash=…&type=email_change   → confirmation de l'inscription
//   /compte/lien?token_hash=…&type=recovery       → mot de passe oublié

type State =
  | { kind: "checking" }
  | { kind: "confirmed" }
  | { kind: "new-password" }
  | { kind: "password-saved" }
  | { kind: "error"; message: string };

export default function EmailLinkPage() {
  return (
    <Suspense>
      <EmailLink />
    </Suspense>
  );
}

function EmailLink() {
  const params = useSearchParams();
  const { reload } = useLibrary();
  const [state, setState] = useState<State>({ kind: "checking" });
  const started = useRef(false);
  const { t, locale, href } = useI18n();

  useEffect(() => {
    if (started.current) return; // un lien ne sert qu'une fois : on ne le vérifie pas deux fois
    started.current = true;

    const supabase = getSupabase();
    const tokenHash = params.get("token_hash");
    const type = params.get("type") as EmailOtpType | null;
    const code = params.get("code");

    (async () => {
      try {
        if (!supabase) throw new Error("Supabase n'est pas configuré");
        if (params.get("error_description")) {
          throw Object.assign(new Error(params.get("error_description")!), {
            code: params.get("error_code") ?? "otp_expired",
          });
        }
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

        const isRecovery = type === "recovery" || params.get("next") === "recovery";
        setState({ kind: isRecovery ? "new-password" : "confirmed" });
      } catch (e) {
        console.error(e);
        setState({ kind: "error", message: toMessage(e, locale, t.errors) });
      } finally {
        await reload(); // charge le compte (ou recrée une session anonyme si le lien a échoué)
      }
    })();
  }, [params, reload, locale, t]);

  return (
    <div className="narrow">
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
            <p className="muted small">{t.emailLink.invalidHint}</p>
            <Link href={href("/compte")} className="btn btn--primary btn--block">
              {t.emailLink.backToAccount}
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
