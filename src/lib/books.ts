// Recherche de livres : Open Library en priorité, Google Books en complément.
// Ce fichier ne tourne que côté serveur (appelé par /api/recherche).
import type { Locale } from "@/i18n/config";

export type Book = {
  /** Identifiant stable : "ol:OL45883W" (Open Library) ou "gb:xxxx" (Google Books) */
  id: string;
  title: string;
  authors: string[];
  coverUrl: string | null;
  genres: string[];
  year: number | null;
};

// Open Library est parfois lent : on lui laisse un peu de temps avant d'abandonner
const TIMEOUT_MS = 9000;
const MAX_RESULTS = 30;

/**
 * Codes de langue attendus par chaque source. Les titres et les couvertures sont pris
 * dans une édition de la langue du visiteur quand elle existe.
 */
const SOURCE_LANGS: Record<Locale, { openLibrary: string; edition: string; google: string }> = {
  fr: { openLibrary: "fr", edition: "fre", google: "fr" },
  en: { openLibrary: "en", edition: "eng", google: "en" },
  es: { openLibrary: "es", edition: "spa", google: "es" },
  pt: { openLibrary: "pt", edition: "por", google: "pt" },
};

/** Un résultat, avec « localized » = titre et couverture pris dans une édition de la bonne langue. */
type Found = Book & { localized: boolean };

// ---------------------------------------------------------------------------
// Genres : les deux sources renvoient des « sujets » en anglais, souvent très
// nombreux. On les ramène à une courte liste de genres en français.
// L'ordre compte : les genres les plus précis d'abord.
// ---------------------------------------------------------------------------
const GENRE_RULES: [RegExp, string][] = [
  [/science.?fiction|sci-fi/i, "Science-fiction"],
  [/fantasy|fantastique/i, "Fantasy"],
  [/horror|horreur/i, "Horreur"],
  [/thriller|suspense/i, "Thriller"],
  [/detective|mystery|crime|policier|polar/i, "Policier"],
  [/romance|love stories|roman d'amour/i, "Romance"],
  [/comic|graphic novel|manga|bande dessinée/i, "BD & manga"],
  [/juvenile|children|young adult|jeunesse/i, "Jeunesse"],
  [/poetry|poésie|poems/i, "Poésie"],
  [/drama|théâtre|plays/i, "Théâtre"],
  [/biograph|autobiograph|memoir/i, "Biographie"],
  [/histor/i, "Histoire"],
  [/philosoph/i, "Philosophie"],
  [/psycholog/i, "Psychologie"],
  [/self-help|développement personnel|personal development/i, "Développement personnel"],
  [/business|economics|économie/i, "Économie"],
  [/politic/i, "Politique"],
  [/science(?!.?fiction)|mathemat|physics|biology/i, "Sciences"],
  [/cooking|cuisine|recipes/i, "Cuisine"],
  [/travel|voyage/i, "Voyage"],
  [/art\b|arts\b|photograph/i, "Art"],
  [/religio/i, "Religion"],
  [/essay|essai/i, "Essai"],
  [/fiction|novel|roman/i, "Roman"],
];

export function toGenres(subjects: string[] | undefined, max = 3): string[] {
  if (!subjects?.length) return [];
  const found: string[] = [];
  for (const [pattern, genre] of GENRE_RULES) {
    if (found.length >= max) break;
    if (subjects.some((s) => pattern.test(s))) found.push(genre);
  }
  return dropGenericGenre(found);
}

/** « Roman » n'apporte rien si on a déjà un genre plus précis. */
function dropGenericGenre(genres: string[]): string[] {
  return genres.length > 1 ? genres.filter((g) => g !== "Roman") : genres;
}

// ---------------------------------------------------------------------------
// Outils de comparaison (pour reconnaître le même livre dans les deux sources)
// ---------------------------------------------------------------------------
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // retire les accents
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function lastName(author: string | undefined): string {
  if (!author) return "";
  const parts = normalize(author).split(" ");
  return parts[parts.length - 1] ?? "";
}

function sameBook(a: Book, b: Book): boolean {
  if (normalize(a.title) !== normalize(b.title)) return false;
  // Si l'une des sources n'a pas d'auteur, le titre suffit
  if (!a.authors.length || !b.authors.length) return true;
  return lastName(a.authors[0]) === lastName(b.authors[0]);
}

// ---------------------------------------------------------------------------
// Open Library — https://openlibrary.org/dev/docs/api/search
// ---------------------------------------------------------------------------
type OpenLibraryEdition = { title?: string; cover_i?: number; language?: string[] };

type OpenLibraryDoc = {
  key: string; // "/works/OL45883W"
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  subject?: string[];
  /** La meilleure édition dans la langue demandée (« lang ») */
  editions?: { docs?: OpenLibraryEdition[] };
};

const coverFromId = (id: number) => `https://covers.openlibrary.org/b/id/${id}-M.jpg`;

/**
 * Ce qu'on cherche : un titre précis (et son auteur) pour les sélections, un texte libre
 * (titre, auteur, les deux…) pour la page de recherche, ou un numéro ISBN.
 */
type Query =
  | { kind: "title"; title: string; author?: string }
  | { kind: "text"; text: string }
  | { kind: "isbn"; isbn: string };

async function searchOpenLibrary(query: Query, locale: Locale): Promise<Found[]> {
  const langs = SOURCE_LANGS[locale];
  const url = new URL("https://openlibrary.org/search.json");
  if (query.kind === "title") {
    url.searchParams.set("title", query.title);
    if (query.author) url.searchParams.set("author", query.author);
  } else if (query.kind === "isbn") {
    url.searchParams.set("isbn", query.isbn);
  } else {
    url.searchParams.set("q", query.text); // titre, auteur, sujet… n'importe quoi
  }
  url.searchParams.set(
    "fields",
    "key,title,author_name,first_publish_year,cover_i,subject," +
      "editions,editions.title,editions.cover_i,editions.language",
  );
  url.searchParams.set("limit", String(MAX_RESULTS));
  url.searchParams.set("lang", langs.openLibrary); // choisit une édition dans cette langue

  const res = await fetch(url, {
    // Open Library demande d'identifier les applications qui utilisent son API
    headers: { "User-Agent": "CodexApp/0.1 (carnet de lecture en ligne)" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Open Library a répondu ${res.status}`);
  const data: { docs?: OpenLibraryDoc[] } = await res.json();

  return (data.docs ?? []).map((doc) => {
    const edition = doc.editions?.docs?.[0];
    const localized = Boolean(edition?.language?.includes(langs.edition));
    const coverId = (localized && edition?.cover_i) || doc.cover_i;
    return {
      id: "ol:" + doc.key.replace("/works/", ""),
      title: (localized && edition?.title) || doc.title,
      authors: doc.author_name?.slice(0, 3) ?? [],
      coverUrl: coverId ? coverFromId(coverId) : null,
      genres: toGenres(doc.subject),
      year: doc.first_publish_year ?? null,
      localized: localized && Boolean(edition?.cover_i),
    };
  });
}

// ---------------------------------------------------------------------------
// Google Books — https://developers.google.com/books/docs/v1/using
// ---------------------------------------------------------------------------
type GoogleVolume = {
  id: string;
  volumeInfo: {
    title?: string;
    authors?: string[];
    publishedDate?: string;
    categories?: string[];
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
  };
};

function googleCover(links: GoogleVolume["volumeInfo"]["imageLinks"]): string | null {
  const raw = links?.thumbnail ?? links?.smallThumbnail;
  if (!raw) return null;
  // Google renvoie des liens http avec un effet « page cornée » : on corrige les deux
  return raw.replace(/^http:/, "https:").replace("&edge=curl", "");
}

async function searchGoogleBooks(query: Query, locale: Locale): Promise<Found[]> {
  const url = new URL("https://www.googleapis.com/books/v1/volumes");
  url.searchParams.set(
    "q",
    query.kind === "title"
      ? `intitle:${query.title}` + (query.author ? ` inauthor:${query.author}` : "")
      : query.kind === "isbn"
        ? `isbn:${query.isbn}`
        : query.text,
  );
  url.searchParams.set("maxResults", String(MAX_RESULTS));
  url.searchParams.set("printType", "books");
  // Sélections : seulement les éditions dans la langue du visiteur (et leurs couvertures).
  // Recherche libre : toutes les langues, pour ne rater aucun livre.
  if (query.kind === "title") url.searchParams.set("langRestrict", SOURCE_LANGS[locale].google);
  const key = process.env.GOOGLE_BOOKS_API_KEY;
  if (key) url.searchParams.set("key", key);

  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Google Books a répondu ${res.status}`);
  const data: { items?: GoogleVolume[] } = await res.json();

  return (data.items ?? [])
    .filter((item) => item.volumeInfo.title)
    .map((item) => {
      const info = item.volumeInfo;
      const year = parseInt(info.publishedDate?.slice(0, 4) ?? "", 10);
      return {
        id: "gb:" + item.id,
        title: info.title!,
        authors: info.authors?.slice(0, 3) ?? [],
        coverUrl: googleCover(info.imageLinks),
        genres: toGenres(info.categories),
        year: Number.isNaN(year) ? null : year,
        localized: true,
      };
    });
}

// ---------------------------------------------------------------------------
// Fusion des deux sources
// ---------------------------------------------------------------------------
export function mergeResults(openLibrary: Found[], google: Found[]): Book[] {
  const usedGoogle = new Set<string>();

  // 1. On complète les résultats Open Library avec Google : genres, et couverture si Open
  //    Library n'en a pas dans la bonne langue (Google ne renvoie que des éditions de cette langue)
  const merged: Found[] = openLibrary.map((book) => {
    const match = google.find((g) => !usedGoogle.has(g.id) && sameBook(book, g));
    if (!match) return book;
    usedGoogle.add(match.id);
    return {
      ...book,
      coverUrl: book.localized ? book.coverUrl : (match.coverUrl ?? book.coverUrl),
      genres: dropGenericGenre([...new Set([...book.genres, ...match.genres])]).slice(0, 3),
    };
  });

  // 2. On ajoute les livres que seul Google connaît (sans doublons)
  for (const g of google) {
    if (merged.length >= MAX_RESULTS) break;
    if (usedGoogle.has(g.id)) continue;
    if (merged.some((b) => sameBook(b, g))) continue;
    merged.push(g);
  }

  // 3. Les livres avec couverture d'abord (l'ordre de pertinence est conservé sinon)
  return merged
    .map((book, index) => ({ book, index }))
    .sort((a, b) => Number(!a.book.coverUrl) - Number(!b.book.coverUrl) || a.index - b.index)
    .map(({ book: { id, title, authors, coverUrl, genres, year } }) => ({
      id, title, authors, coverUrl, genres, year,
    }));
}

/** Un titre précis, avec son auteur (sélections, nouveautés choisies à la main). */
export function searchBooks(title: string, author?: string, locale: Locale = "fr"): Promise<Book[]> {
  return searchBoth({ kind: "title", title, author }, locale);
}

/** Recherche tapée par le lecteur : un titre, un auteur, les deux, ou un numéro ISBN. */
export function searchFreeText(text: string, locale: Locale = "fr"): Promise<Book[]> {
  const digits = text.replace(/[\s-]/g, "");
  if (/^(97[89])?\d{9}[\dXx]$/.test(digits)) {
    return searchBoth({ kind: "isbn", isbn: digits.toUpperCase() }, locale);
  }
  return searchBoth({ kind: "text", text }, locale);
}

async function searchBoth(query: Query, locale: Locale): Promise<Book[]> {
  const [ol, gb] = await Promise.allSettled([
    searchOpenLibrary(query, locale),
    searchGoogleBooks(query, locale),
  ]);

  if (ol.status === "rejected") console.error("Open Library :", ol.reason);
  if (gb.status === "rejected") console.error("Google Books :", gb.reason);
  if (ol.status === "rejected" && gb.status === "rejected") {
    throw new Error("Aucune source de livres n'a répondu");
  }

  return mergeResults(
    ol.status === "fulfilled" ? ol.value : [],
    gb.status === "fulfilled" ? gb.value : [],
  );
}

// ---------------------------------------------------------------------------
// Dernières sorties : romans en français récemment publiés (Google Books)
// ---------------------------------------------------------------------------
type GoogleVolumeDetails = GoogleVolume & {
  volumeInfo: GoogleVolume["volumeInfo"] & { pageCount?: number; language?: string };
};

/** Mots-clés de recherche des romans, par langue (en plus de « fiction »). */
const NOVEL_SUBJECTS: Record<Locale, string[]> = {
  fr: ["subject:roman", 'subject:"literary fiction"'],
  en: ['subject:"literary fiction"', 'subject:"fiction / general"'],
  es: ["subject:novela", 'subject:"literary fiction"'],
  pt: ["subject:romance", 'subject:"literary fiction"'],
};

/** Les romans parus ces derniers mois dans la langue du visiteur, avec couverture. */
export async function latestReleases(locale: Locale, max = 18): Promise<Book[]> {
  const lang = SOURCE_LANGS[locale].google;
  const queries = ["subject:fiction", ...NOVEL_SUBJECTS[locale]];
  const responses = await Promise.allSettled(
    queries.map(async (q) => {
      const url = new URL("https://www.googleapis.com/books/v1/volumes");
      url.searchParams.set("q", q);
      url.searchParams.set("orderBy", "newest");
      url.searchParams.set("langRestrict", lang);
      url.searchParams.set("printType", "books");
      url.searchParams.set("maxResults", "40");
      const key = process.env.GOOGLE_BOOKS_API_KEY;
      if (key) url.searchParams.set("key", key);
      const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (!res.ok) throw new Error(`Google Books a répondu ${res.status}`);
      const data: { items?: GoogleVolumeDetails[] } = await res.json();
      return data.items ?? [];
    }),
  );
  const items = responses.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  if (!items.length && responses.every((r) => r.status === "rejected")) {
    throw new Error("Google Books n'a pas répondu");
  }

  // Parus il y a moins de 9 mois (et pas dans le futur : précommandes exclues)
  const now = new Date();
  const oldest = new Date(now);
  oldest.setMonth(oldest.getMonth() - 9);

  const books: Book[] = [];
  for (const item of items) {
    const info = item.volumeInfo;
    const published = new Date(info.publishedDate ?? "");
    if (!info.title || !info.authors?.length || !info.imageLinks) continue;
    if (info.language && info.language !== lang) continue;
    if (Number.isNaN(published.getTime()) || published < oldest || published > now) continue;
    if (info.pageCount !== undefined && info.pageCount < 80) continue; // brochures, nouvelles isolées
    const book: Book = {
      id: "gb:" + item.id,
      title: info.title,
      authors: info.authors.slice(0, 3),
      coverUrl: googleCover(info.imageLinks),
      genres: toGenres(info.categories),
      year: published.getFullYear(),
    };
    if (books.some((b) => b.id === book.id || sameBook(b, book))) continue;
    books.push(book);
    if (books.length >= max) break;
  }
  return books;
}
