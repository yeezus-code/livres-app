import { LOCALE_TAGS, type Locale } from "./config";

/** Un texte traduit : simple, ou avec une forme au singulier et une au pluriel. */
export type Message = string | { one: string; other: string };

const pluralRules = new Map<Locale, Intl.PluralRules>();

/**
 * Remplace les {variables} d'un texte ; choisit le singulier ou le pluriel d'après {n}.
 * fmt("en", { one: "{n} book", other: "{n} books" }, { n: 3 }) → « 3 books »
 */
export function fmt(locale: Locale, message: Message, vars: Record<string, string | number> = {}) {
  let text: string;
  if (typeof message === "string") {
    text = message;
  } else {
    if (!pluralRules.has(locale)) pluralRules.set(locale, new Intl.PluralRules(LOCALE_TAGS[locale]));
    const n = Number(vars.n ?? 0);
    // Au Brésil, « 0 » se dit au pluriel (« 0 curtidas »), contrairement au français
    const one = pluralRules.get(locale)!.select(n) === "one" && !(n === 0 && locale === "pt");
    text = one ? message.one : message.other;
  }
  return text.replace(/\{(\w+)\}/g, (_, key) =>
    key in vars ? (typeof vars[key] === "number" ? formatNumber(locale, vars[key] as number) : String(vars[key])) : `{${key}}`,
  );
}

export function formatNumber(locale: Locale, value: number, maxDecimals = 1) {
  return value.toLocaleString(LOCALE_TAGS[locale], { maximumFractionDigits: maxDecimals });
}

/** « 2026-03-12 » → « 12 mars 2026 » / « March 12, 2026 » */
export function formatDate(locale: Locale, iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(LOCALE_TAGS[locale], {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** « il y a 3 jours » / « 3 days ago » (« now » : texte pour moins d'une minute) */
export function timeAgo(locale: Locale, iso: string, now: string): string {
  const seconds = (new Date(iso).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(LOCALE_TAGS[locale], { numeric: "auto" });
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, size] of steps) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return now;
}

/**
 * Insère des éléments dans un texte traduit : rich("Écrivez à {mail}.", { mail: <a…/> }).
 * Renvoie une liste de morceaux à afficher tels quels dans du JSX.
 */
export function rich<T>(text: string, parts: Record<string, T>): (string | T)[] {
  return text.split(/(\{\w+\})/).map((piece) => {
    const key = piece.match(/^\{(\w+)\}$/)?.[1];
    return key && key in parts ? parts[key] : piece;
  });
}
