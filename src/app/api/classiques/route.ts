import { searchBooks, type Book } from "@/lib/books";
import { CLASSICS } from "@/lib/classics";

// GET /api/classiques → les grands classiques, avec couverture et identifiant.
// La réponse est gardée une semaine dans le cache de Vercel : les sites de livres
// ne sont interrogés qu'une fois par semaine, pas à chaque visite.
export async function GET() {
  const results = await Promise.allSettled(
    CLASSICS.map(async ({ title, author }) => {
      const found = await searchBooks(title, author);
      // Le premier résultat avec couverture (la liste met déjà ceux-là en tête)
      return found[0] ?? null;
    }),
  );

  const books = results
    .map((r) => (r.status === "fulfilled" ? r.value : null))
    .filter((b): b is Book => b !== null);

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
