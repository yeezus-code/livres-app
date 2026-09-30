import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/fr";
import { fmt } from "@/i18n/format";

/** Qui utilise l'application en ce moment. */
export type Account = {
  id: string;
  email: string | null;
  /** true tant que la personne n'a pas créé de compte (session invisible) */
  isAnonymous: boolean;
  /** null si la personne n'a pas (encore) choisi de pseudo */
  username: string | null;
  /** Adresse de la photo de profil, null s'il n'y en a pas */
  avatarUrl: string | null;
  /** Adresse e-mail en attente de confirmation (inscription pas encore validée) */
  pendingEmail: string | null;
};

/** Page où arrivent les liens envoyés par e-mail (confirmation, mot de passe oublié). */
export const EMAIL_LINK_PATH = "/compte/lien";

export type SignUpInput = { username: string; email: string; password: string };
export type SignInInput = { email: string; password: string };

export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;
export const PASSWORD_MIN_LENGTH = 8;

/** « Léo Dupont » → « leo_dupont » : ce que la base accepte comme pseudo. */
export function normalizeUsername(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[\s-]+/g, "_");
}

/** Erreur à afficher à l'utilisateur ; « key » désigne le texte dans le dictionnaire (errors). */
export class AccountError extends Error {
  constructor(public key: keyof Dictionary["errors"]) {
    super(key);
  }
}

/** Traduit les erreurs de Supabase en messages compréhensibles, dans la langue du site. */
export function toMessage(error: unknown, locale: Locale, t: Dictionary["errors"]): string {
  if (error instanceof AccountError) return t[error.key];
  const message = (error as Error)?.message ?? String(error);
  if (message.includes("Bucket not found")) return t.bucketMissing;
  // Supabase n'a pas réussi à passer l'e-mail au service d'envoi
  if (/error sending/i.test(message)) return fmt(locale, t.emailSending, { message });
  const code = (error as { code?: string })?.code;
  switch (code) {
    case "email_exists":
    case "user_already_exists":
      return t.emailExists;
    case "invalid_credentials":
      return t.invalidCredentials;
    case "weak_password":
      return fmt(locale, t.weakPassword, { n: PASSWORD_MIN_LENGTH });
    case "email_address_invalid":
    case "validation_failed":
      return t.invalidEmail;
    case "email_not_confirmed":
      return t.emailNotConfirmed;
    case "same_password":
      return t.samePassword;
    case "reauthentication_needed":
      return t.reauthenticate;
    case "otp_expired":
      return t.linkExpired;
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return t.rateLimit;
    case "PGRST204": // colonne absente
      return t.dbOutdated;
    case "42P01": // table absente
    case "PGRST205":
      return t.tableMissing;
    case "email_provider_disabled":
      return t.emailDisabled;
    case "23505": // doublon dans la base
      return t.usernameTaken;
    default:
      console.error(error);
      // Le détail technique aide à trouver la cause si le problème persiste
      return fmt(locale, t.generic, { message });
  }
}
