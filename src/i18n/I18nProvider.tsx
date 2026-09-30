"use client";

import { createContext, Fragment, useContext, useMemo } from "react";
import { localizePath, type Locale } from "./config";
import type { Dictionary } from "./dictionaries/fr";
import { fmt, formatDate, formatNumber, rich, timeAgo, type Message } from "./format";

type I18nValue = {
  locale: Locale;
  /** Tous les textes de la langue en cours */
  t: Dictionary;
  /** Texte avec variables et pluriel : f(t.home.readCount, { n: 3 }) */
  f: (message: Message, vars?: Record<string, string | number>) => string;
  /** Adresse d'une page dans la langue en cours : href("/recherche") */
  href: (path: string) => string;
  date: (iso: string) => string;
  number: (value: number, maxDecimals?: number) => string;
  ago: (iso: string) => string;
  /** Nom d'un genre dans la langue en cours (les genres sont enregistrés en français) */
  genre: (genre: string) => string;
  /** Texte avec des éléments insérés : r(t.legal.contact, { mail: <a…/> }) */
  r: (text: string, parts: Record<string, React.ReactNode>) => React.ReactNode;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  locale,
  dictionary,
  children,
}: {
  locale: Locale;
  dictionary: Dictionary;
  children: React.ReactNode;
}) {
  const value = useMemo<I18nValue>(
    () => ({
      locale,
      t: dictionary,
      f: (message, vars) => fmt(locale, message, vars),
      href: (path) => localizePath(locale, path),
      date: (iso) => formatDate(locale, iso),
      number: (n, maxDecimals) => formatNumber(locale, n, maxDecimals),
      ago: (iso) => timeAgo(locale, iso, dictionary.common.justNow),
      genre: (genre) => (dictionary.genres as Record<string, string>)[genre] ?? genre,
      r: (text, parts) =>
        rich(text, parts).map((piece, i) => <Fragment key={i}>{piece}</Fragment>),
    }),
    [locale, dictionary],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n doit être utilisé dans <I18nProvider>");
  return value;
}
