import { isLocale } from "@/i18n/config";
import { findCovers } from "@/lib/books";

// GET /api/couvertures?id=ol:OL45883W&titre=L'Étranger&auteur=Albert Camus&lang=fr
// → les couvertures des différentes éditions du livre, pour choisir la sienne.
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const id = params.get("id") ?? "";
  const title = params.get("titre")?.trim().slice(0, 300) ?? "";
  const author = params.get("auteur")?.trim().slice(0, 200) || undefined;
  const lang = params.get("lang");
  if (!title) return Response.json({ covers: [] });

  const covers = await findCovers({ id, title, author }, isLocale(lang) ? lang : "fr");
  return Response.json(
    { covers },
    {
      headers: {
        "Cache-Control": covers.length
          ? "public, s-maxage=86400, stale-while-revalidate=86400"
          : "no-store",
      },
    },
  );
}
