import { latestReleases, searchBooks, type Book } from "@/lib/books";
import { NEW_RELEASES } from "@/lib/collections";

// GET /api/nouveautes → les dernières sorties littéraires.
// - Si une liste est écrite à la main dans src/lib/collections.ts (NEW_RELEASES), on l'utilise.
// - Sinon, on demande à Google Books les romans en français les plus récents.
// La réponse est gardée une journée dans le cache de Vercel.
export async function GET() {
  let books: Book[] = [];
  try {
    if (NEW_RELEASES.length) {
      const results = await Promise.allSettled(
        NEW_RELEASES.map(async ({ title, author }) => (await searchBooks(title, author))[0] ?? null),
      );
      books = results
        .map((r) => (r.status === "fulfilled" ? r.value : null))
        .filter((b): b is Book => b !== null);
    } else {
      books = await latestReleases();
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
