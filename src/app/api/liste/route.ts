import { searchBooks, type Book } from "@/lib/books";
import { getCollection } from "@/lib/collections";

// GET /api/liste?id=noel → les livres d'une sélection (voir src/lib/collections.ts),
// avec couverture et identifiant. La réponse est gardée une semaine dans le cache de
// Vercel : les sites de livres ne sont interrogés qu'une fois par semaine par sélection.
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id") ?? "";
  const collection = getCollection(id);
  if (!collection) return Response.json({ books: [] }, { status: 404 });

  const results = await Promise.allSettled(
    collection.books.map(async ({ title, author }) => {
      const found = await searchBooks(title, author);
      // Le premier résultat avec couverture (la liste met déjà ceux-là en tête)
      return found[0] ?? null;
    }),
  );

  const seen = new Set<string>();
  const books = results
    .map((r) => (r.status === "fulfilled" ? r.value : null))
    .filter((b): b is Book => b !== null && !seen.has(b.id) && !!seen.add(b.id));

  return Response.json(
    { books },
    {
      headers: {
        "Cache-Control":
          books.length > 0
            ? "public, s-maxage=604800, stale-while-revalidate=86400"
            : "no-store", // si tout a échoué, on ne garde pas une liste vide
      },
    },
  );
}
