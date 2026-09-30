import { searchBooks } from "@/lib/books";

// GET /api/recherche?titre=dune  →  liste de livres au format JSON
export async function GET(request: Request) {
  const title = new URL(request.url).searchParams.get("titre")?.trim() ?? "";

  if (title.length < 2) {
    return Response.json({ books: [] });
  }

  try {
    const books = await searchBooks(title.slice(0, 200));
    return Response.json(
      { books },
      // Une même recherche peut être resservie depuis le cache de Vercel pendant 1 h
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
    );
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "La recherche est momentanément indisponible. Réessayez dans un instant." },
      { status: 502 },
    );
  }
}
