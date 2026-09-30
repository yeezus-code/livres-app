import { isLocale } from "@/i18n/config";
import { searchFreeText } from "@/lib/books";

// GET /api/recherche?titre=dune&lang=en  →  liste de livres au format JSON
// (« titre » : ce que le lecteur a tapé — titre, auteur, les deux ou un ISBN)
// (« lang » : langue des titres et des couvertures, français par défaut)
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const title = params.get("titre")?.trim() ?? "";
  const lang = params.get("lang");

  if (title.length < 2) {
    return Response.json({ books: [] });
  }

  try {
    const books = await searchFreeText(title.slice(0, 200), isLocale(lang) ? lang : "fr");
    return Response.json(
      { books },
      // Une même recherche peut être resservie depuis le cache de Vercel pendant 1 h
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
    );
  } catch (error) {
    console.error(error);
    return Response.json({ error: "unavailable" }, { status: 502 });
  }
}
