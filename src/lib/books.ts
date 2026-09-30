// Recherche de livres : Open Library en priorité, Google Books en complément.
// Ce fichier ne tourne que côté serveur (appelé par /api/recherche).

export type Book = {
  /** Identifiant stable : "ol:OL45883W" (Open Library) ou "gb:xxxx" (Google Books) */
  id: string;
  title: string;
  authors: string[];
  coverUrl: string | null;
  genres: string[];
  year: number | null;
};

const TIMEOUT_MS = 6000;
const MAX_RESULTS = 20;

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
type OpenLibraryDoc = {
  key: string; // "/works/OL45883W"
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  subject?: string[];
};

async function searchOpenLibrary(title: string, author?: string): Promise<Book[]> {
  const url = new URL("https://openlibrary.org/search.json");
  url.searchParams.set("title", title);
  if (author) url.searchParams.set("author", author);
  url.searchParams.set("fields", "key,title,author_name,first_publish_year,cover_i,subject");
  url.searchParams.set("limit", String(MAX_RESULTS));
  url.searchParams.set("lang", "fr"); // privilégie les titres des éditions françaises

  const res = await fetch(url, {
    // Open Library demande d'identifier les applications qui utilisent son API
    headers: { "User-Agent": "LivresApp/0.1 (application de suivi de lectures)" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Open Library a répondu ${res.status}`);
  const data: { docs?: OpenLibraryDoc[] } = await res.json();

  return (data.docs ?? []).map((doc) => ({
    id: "ol:" + doc.key.replace("/works/", ""),
    title: doc.title,
    authors: doc.author_name?.slice(0, 3) ?? [],
    coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
    genres: toGenres(doc.subject),
    year: doc.first_publish_year ?? null,
  }));
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

async function searchGoogleBooks(title: string, author?: string): Promise<Book[]> {
  const url = new URL("https://www.googleapis.com/books/v1/volumes");
  url.searchParams.set("q", `intitle:${title}` + (author ? ` inauthor:${author}` : ""));
  url.searchParams.set("maxResults", String(MAX_RESULTS));
  url.searchParams.set("printType", "books");
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
      };
    });
}

// ---------------------------------------------------------------------------
// Fusion des deux sources
// ---------------------------------------------------------------------------
export function mergeResults(openLibrary: Book[], google: Book[]): Book[] {
  const usedGoogle = new Set<string>();

  // 1. On complète les résultats Open Library (couverture manquante, genres) avec Google
  const merged = openLibrary.map((book) => {
    const match = google.find((g) => !usedGoogle.has(g.id) && sameBook(book, g));
    if (!match) return book;
    usedGoogle.add(match.id);
    return {
      ...book,
      coverUrl: book.coverUrl ?? match.coverUrl,
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
    .map(({ book }) => book);
}

export async function searchBooks(title: string, author?: string): Promise<Book[]> {
  const [ol, gb] = await Promise.allSettled([
    searchOpenLibrary(title, author),
    searchGoogleBooks(title, author),
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
