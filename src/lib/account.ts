/** Qui utilise l'application en ce moment. */
export type Account = {
  id: string;
  email: string | null;
  /** true tant que la personne n'a pas créé de compte (session invisible) */
  isAnonymous: boolean;
  /** null si la personne n'a pas (encore) choisi de pseudo */
  username: string | null;
};

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

/** Erreur à afficher telle quelle à l'utilisateur. */
export class AccountError extends Error {}

/** Traduit les erreurs de Supabase en messages compréhensibles. */
export function toFrenchMessage(error: unknown): string {
  if (error instanceof AccountError) return error.message;
  const code = (error as { code?: string })?.code;
  switch (code) {
    case "email_exists":
    case "user_already_exists":
      return "Un compte existe déjà avec cet e-mail. Utilisez « Se connecter ».";
    case "invalid_credentials":
      return "E-mail ou mot de passe incorrect.";
    case "weak_password":
      return `Mot de passe trop faible : au moins ${PASSWORD_MIN_LENGTH} caractères.`;
    case "email_address_invalid":
    case "validation_failed":
      return "Cette adresse e-mail n'est pas valide.";
    case "email_not_confirmed":
      return "E-mail pas encore confirmé. Désactivez « Confirm email » dans Supabase (README).";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Trop de tentatives. Patientez quelques minutes puis réessayez.";
    case "42P01": // table absente
    case "PGRST205":
      return "La table des comptes n'existe pas encore : lancez 02-comptes.sql (README, étape 5).";
    case "email_provider_disabled":
      return "Les comptes par e-mail sont désactivés dans Supabase (README, étape 5).";
    case "23505": // doublon dans la base
      return "Ce pseudo est déjà pris.";
    default:
      console.error(error);
      return "Une erreur est survenue. Vérifiez votre connexion et réessayez.";
  }
}
