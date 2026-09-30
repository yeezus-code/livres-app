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

/**
 * Un résultat, avec :
 * - « localized » : la couverture vient d'une édition dans la langue du visiteur ;
 * - « isbn » : un numéro ISBN de l'édition (pour chercher une couverture en dernier recours).
 */
type Found = Book & { localized: boolean; isbn?: string };

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
    language?: string;
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
    industryIdentifiers?: { type: string; identifier: string }[];
  };
};

export function googleCover(links: GoogleVolume["volumeInfo"]["imageLinks"]): string | null {
  const raw = links?.thumbnail ?? links?.smallThumbnail;
  if (!raw) return null;
  // Google renvoie des liens http, avec un effet « page cornée » et en toute petite taille
  // (128 pixels de large, flou sur les écrans de téléphone) : on corrige les trois
  return raw.replace(/^http:/, "https:").replace("&edge=curl", "") + "&fife=w400-h600";
}

function googleIsbn(info: GoogleVolume["volumeInfo"]): string | undefined {
  const ids = info.industryIdentifiers ?? [];
  return (ids.find((i) => i.type === "ISBN_13") ?? ids.find((i) => i.type === "ISBN_10"))?.identifier;
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
        // Sans « langue » connue, on fait confiance au filtre de langue (sélections)
        localized: (info.language ?? SOURCE_LANGS[locale].google) === SOURCE_LANGS[locale].google,
        isbn: googleIsbn(info),
      };
    });
}

// ---------------------------------------------------------------------------
// Fusion des deux sources
// ---------------------------------------------------------------------------
/**
 * La meilleure couverture parmi plusieurs éditions du même livre :
 * 1. une édition dans la langue du visiteur (Open Library d'abord, puis Google) ;
 * 2. sinon n'importe quelle couverture (Open Library d'abord) ;
 * 3. sinon la couverture Open Library retrouvée grâce au numéro ISBN (si elle existe).
 */
function bestCover(editions: Found[]): string | null {
  const withCover = editions.filter((e) => e.coverUrl);
  const cover = (withCover.find((e) => e.localized) ?? withCover[0])?.coverUrl;
  if (cover) return cover;
  const isbn = editions.find((e) => e.isbn)?.isbn;
  // « default=false » : pas d'image grise si Open Library n'a rien (la fiche affiche alors le titre)
  return isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg?default=false` : null;
}

export function mergeResults(openLibrary: Found[], google: Found[]): Book[] {
  const usedGoogle = new Set<string>();

  // 1. On complète les résultats Open Library avec toutes les éditions Google du même livre :
  //    genres, et meilleure couverture
  const merged: Found[] = openLibrary.map((book) => {
    const matches = google.filter((g) => !usedGoogle.has(g.id) && sameBook(book, g));
    if (!matches.length) return book;
    matches.forEach((g) => usedGoogle.add(g.id));
    return {
      ...book,
      coverUrl: bestCover([book, ...matches]),
      localized: book.localized || matches.some((g) => g.localized && g.coverUrl),
      genres: dropGenericGenre([...new Set([...book.genres, ...matches.flatMap((g) => g.genres)])]).slice(0, 3),
    };
  });

  // 2. On ajoute les livres que seul Google connaît : une seule fois par livre, avec la
  //    meilleure couverture parmi ses éditions
  const googleOnly = google.filter((g) => !usedGoogle.has(g.id));
  for (const g of googleOnly) {
    if (merged.length >= MAX_RESULTS) break;
    if (merged.some((b) => sameBook(b, g))) continue;
    const editions = googleOnly.filter((other) => sameBook(g, other));
    merged.push({ ...g, coverUrl: bestCover(editions) });
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

// ---------------------------------------------------------------------------
// Couvertures possibles d'un livre (pour que le lecteur choisisse la sienne)
// ---------------------------------------------------------------------------
export type CoverChoice = { url: string; localized: boolean };

type OpenLibraryEditionEntry = { covers?: number[]; languages?: { key: string }[] };

/** Les couvertures des éditions d'un livre, celles dans la langue du visiteur d'abord. */
export async function findCovers(
  book: { id: string; title: string; author?: string },
  locale: Locale,
): Promise<CoverChoice[]> {
  const langs = SOURCE_LANGS[locale];

  const openLibrary = async (): Promise<CoverChoice[]> => {
    if (!book.id.startsWith("ol:")) return [];
    const work = book.id.slice(3).replace(/[^A-Za-z0-9]/g, "");
    const res = await fetch(`https://openlibrary.org/works/${work}/editions.json?limit=100`, {
      headers: { "User-Agent": "CodexApp/0.1 (carnet de lecture en ligne)" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`Open Library a répondu ${res.status}`);
    const data: { entries?: OpenLibraryEditionEntry[] } = await res.json();
    return (data.entries ?? [])
      .filter((e) => e.covers?.[0] && e.covers[0] > 0) // -1 : couverture supprimée
      .map((e) => ({
        url: coverFromId(e.covers![0]),
        localized: Boolean(e.languages?.some((l) => l.key === `/languages/${langs.edition}`)),
      }));
  };

  const google = async (): Promise<CoverChoice[]> => {
    const url = new URL("https://www.googleapis.com/books/v1/volumes");
    url.searchParams.set(
      "q",
      `intitle:${book.title}` + (book.author ? ` inauthor:${book.author}` : ""),
    );
    url.searchParams.set("maxResults", "40");
    url.searchParams.set("printType", "books");
    const key = process.env.GOOGLE_BOOKS_API_KEY;
    if (key) url.searchParams.set("key", key);
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) throw new Error(`Google Books a répondu ${res.status}`);
    const data: { items?: GoogleVolume[] } = await res.json();
    const wanted = { title: book.title, authors: book.author ? [book.author] : [] } as Book;
    return (data.items ?? [])
      .filter((item) => item.volumeInfo.imageLinks && item.volumeInfo.title)
      // Seulement le même livre (pas les guides de lecture, résumés…)
      .filter((item) =>
        sameBook(wanted, { title: item.volumeInfo.title!, authors: item.volumeInfo.authors ?? [] } as Book),
      )
      .map((item) => ({
        url: googleCover(item.volumeInfo.imageLinks)!,
        localized: item.volumeInfo.language === langs.google,
      }));
  };

  const [ol, gb] = await Promise.allSettled([openLibrary(), google()]);
  const all = [
    ...(ol.status === "fulfilled" ? ol.value : []),
    ...(gb.status === "fulfilled" ? gb.value : []),
  ];
  const unique = [...new Map(all.map((c) => [c.url, c])).values()];
  // Langue du visiteur d'abord (l'ordre des sources est conservé sinon)
  return unique.sort((a, b) => Number(b.localized) - Number(a.localized)).slice(0, 36);
}
