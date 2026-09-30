// Les langues de Codex. Le français est à la racine du site (codexby.app/recherche),
// les autres langues ont leur préfixe (codexby.app/en/recherche).

export const LOCALES = ["fr", "en", "es", "pt"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "fr";

/** Nom de chaque langue, écrit dans cette langue (menu de choix de la langue). */
export const LOCALE_NAMES: Record<Locale, string> = {
  fr: "Français",
  en: "English",
  es: "Español",
  pt: "Português (Brasil)",
};

/** Réglages régionaux utilisés pour les dates et les nombres. */
export const LOCALE_TAGS: Record<Locale, string> = {
  fr: "fr-FR",
  en: "en-US",
  es: "es-ES",
  pt: "pt-BR",
};

/** Cookie qui retient la langue choisie dans le menu. */
export const LOCALE_COOKIE = "codex-lang";

export function isLocale(value: string | undefined | null): value is Locale {
  return (LOCALES as readonly string[]).includes(value ?? "");
}

/** « /recherche » → « /en/recherche » (le français reste sans préfixe). */
export function localizePath(locale: Locale, path: string): string {
  if (locale === DEFAULT_LOCALE) return path;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

/** « /en/recherche » → { locale: "en", path: "/recherche" } */
export function splitLocale(pathname: string): { locale: Locale; path: string } {
  const [, first, ...rest] = pathname.split("/");
  if (isLocale(first) && first !== DEFAULT_LOCALE) {
    return { locale: first, path: "/" + rest.join("/") };
  }
  return { locale: DEFAULT_LOCALE, path: pathname || "/" };
}

/** Langue préférée d'après l'en-tête « Accept-Language » du navigateur. */
export function localeFromAcceptLanguage(header: string | null): Locale {
  if (!header) return DEFAULT_LOCALE;
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { lang: tag.split("-")[0].toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { lang } of ranked) {
    if (isLocale(lang)) return lang;
  }
  return DEFAULT_LOCALE;
}
