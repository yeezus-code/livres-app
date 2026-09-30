// Les sélections de livres de Codex : les grands classiques et les sélections de saison.
//
// Chaque langue a ses propres sélections, dans le dossier src/collections :
//   fr.ts (français), en.ts (anglais), es.ts (espagnol), pt.ts (portugais du Brésil).
//
// Pour modifier une sélection, ajouter un livre ou créer une nouvelle saison, il suffit
// d'éditer le fichier de la langue voulue (sur GitHub : bouton crayon ✎, puis « Commit changes »).
// Le site se met à jour tout seul en 1 à 2 minutes.
//
// - « books » : écrivez le titre tel qu'il est publié dans cette langue ; la couverture
//   de l'édition correspondante est trouvée toute seule.
// - « season » : période d'affichage sur l'accueil, au format « MM-JJ » (mois-jour).
//   Une période peut passer d'une année à l'autre (ex. du 11-01 au 02-28).
// - « theme » : couleurs du bandeau, à choisir parmi THEMES (src/collections/themes.ts).
import * as en from "@/collections/en";
import * as es from "@/collections/es";
import * as fr from "@/collections/fr";
import * as pt from "@/collections/pt";
import type { BookRef, Collection } from "@/collections/themes";
import type { Locale } from "@/i18n/config";

export { THEMES, type BookRef, type Collection, type Theme } from "@/collections/themes";

const BY_LOCALE: Record<Locale, { collections: Collection[]; newReleases: BookRef[] }> = {
  fr,
  en,
  es,
  pt,
};

/** Toutes les sélections d'une langue (la première est celle des classiques). */
export function collectionsFor(locale: Locale): Collection[] {
  return BY_LOCALE[locale].collections;
}

/** Nouveautés choisies à la main (liste vide = recherche automatique). */
export function newReleasesFor(locale: Locale): BookRef[] {
  return BY_LOCALE[locale].newReleases;
}

export function getCollection(locale: Locale, id: string) {
  return collectionsFor(locale).find((c) => c.id === id);
}

/** « 2026-09-30 » → « 09-30 » (mois-jour, heure locale du visiteur) */
function monthDay(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function isInSeason(collection: Collection, date = new Date()) {
  if (!collection.season) return false;
  const md = monthDay(date);
  const { from, to } = collection.season;
  // Période à cheval sur deux années (ex. novembre → février)
  return from <= to ? md >= from && md <= to : md >= from || md <= to;
}

/** Les sélections de saison du moment (souvent une, parfois deux qui se chevauchent). */
export function currentCollections(locale: Locale, date = new Date()) {
  return collectionsFor(locale).filter((c) => isInSeason(c, date));
}

/** Toutes les sélections de saison, celles du moment en premier. */
export function seasonalCollections(locale: Locale, date = new Date()) {
  const seasonal = collectionsFor(locale).filter((c) => c.season);
  return [
    ...seasonal.filter((c) => isInSeason(c, date)),
    ...seasonal.filter((c) => !isInSeason(c, date)),
  ];
}
