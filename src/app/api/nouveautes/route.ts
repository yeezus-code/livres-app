import { isLocale } from "@/i18n/config";
import { latestReleases, searchBooks, type Book } from "@/lib/books";
import { newReleasesFor } from "@/lib/collections";

// GET /api/nouveautes?lang=en → les dernières sorties littéraires dans cette langue.
// - Si une liste est écrite à la main (newReleases, dans src/collections/<langue>.ts), on l'utilise.
// - Sinon, on demande à Google Books les romans les plus récents dans cette langue.
// La réponse est gardée une journée dans le cache de Vercel.
export async function GET(request: Request) {
  const lang = new URL(request.url).searchParams.get("lang");
  const locale = isLocale(lang) ? lang : "fr";
  const picks = newReleasesFor(locale);
  let books: Book[] = [];
  try {
    if (picks.length) {
      const results = await Promise.allSettled(
        picks.map(async ({ title, author }) => (await searchBooks(title, author, locale))[0] ?? null),
      );
      books = results
        .map((r) => (r.status === "fulfilled" ? r.value : null))
        .filter((b): b is Book => b !== null);
    } else {
      books = await latestReleases(locale);
    }
  } catch (e) {
    console.error("Nouveautés :", e);
  }

  return Response.json(
    { books },
    {
      headers: {
        "Cache-Control":
          books.length > 0 ? "public, s-maxage=86400, stale-while-revalidate=43200" : "no-store",
      },
    },
  );
}
