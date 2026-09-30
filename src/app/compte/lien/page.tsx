"use client";

import type { EmailOtpType } from "@supabase/supabase-js";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { PASSWORD_MIN_LENGTH, toFrenchMessage } from "@/lib/account";
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
        setState({ kind: "error", message: toFrenchMessage(e) });
      } finally {
        await reload(); // charge le compte (ou recrée une session anonyme si le lien a échoué)
      }
    })();
  }, [params, reload]);

  return (
    <div className="narrow">
      {state.kind === "checking" && <p className="muted center">Vérification du lien…</p>}

      {state.kind === "confirmed" && (
        <>
          <h1 className="page-title">Adresse confirmée ✓</h1>
          <div className="card">
            <p>Votre compte est activé. Bienvenue !</p>
            <Link href="/compte" className="btn btn--primary btn--block">
              Voir mon compte
            </Link>
          </div>
        </>
      )}

      {state.kind === "new-password" && (
        <NewPasswordForm onDone={() => setState({ kind: "password-saved" })} />
      )}

      {state.kind === "password-saved" && (
        <>
          <h1 className="page-title">Mot de passe changé ✓</h1>
          <div className="card">
            <p>Vous êtes connecté avec votre nouveau mot de passe.</p>
            <Link href="/bibliotheque" className="btn btn--primary btn--block">
              Ma bibliothèque
            </Link>
          </div>
        </>
      )}

      {state.kind === "error" && (
        <>
          <h1 className="page-title">Lien invalide</h1>
          <div className="card">
            <p className="error">{state.message}</p>
            <p className="muted small">
              Un lien reçu par e-mail ne fonctionne qu&apos;une fois et pendant une durée limitée.
            </p>
            <Link href="/compte" className="btn btn--primary btn--block">
              Retour au compte
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

  return (
    <>
      <h1 className="page-title">Nouveau mot de passe</h1>
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
            setError(toFrenchMessage(err));
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="field">
          <span>Choisissez un nouveau mot de passe</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={PASSWORD_MIN_LENGTH}
            autoComplete="new-password"
            autoFocus
          />
          <small className="muted">Au moins {PASSWORD_MIN_LENGTH} caractères.</small>
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
          {busy ? "…" : "Enregistrer"}
        </button>
      </form>
    </>
  );
}
