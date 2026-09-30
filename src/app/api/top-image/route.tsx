import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { isLocale } from "@/i18n/config";
import { DICTIONARIES } from "@/i18n/dictionaries";
import { fmt } from "@/i18n/format";
import { SITE } from "@/lib/site";
import { fetchSharedTop, type TopBook } from "@/lib/top-share";

// GET /api/top-image?u=leo&lang=fr → l'image du top 10 de @leo (1080 × 1350, format Instagram)

const WIDTH = 1080;
const HEIGHT = 1350;
const INK = "#0b2b29";
const GOLD = "#ecc267";
const PAPER = "#f7f3ea";

const fontsDir = join(process.cwd(), "src/assets/fonts");
const fonts = Promise.all(
  [
    ["Fraunces", "fraunces-latin-600-italic.woff", 600, "italic"],
    ["Fraunces", "fraunces-latin-500-normal.woff", 500, "normal"],
    ["Inter", "inter-latin-400-normal.woff", 400, "normal"],
    ["Inter", "inter-latin-600-normal.woff", 600, "normal"],
  ].map(async ([name, file, weight, style]) => ({
    name: name as string,
    data: await readFile(join(fontsDir, file as string)),
    weight: weight as 400 | 500 | 600,
    style: style as "normal" | "italic",
  })),
);

// Le logo « étagère » (même dessin que src/components/LogoMark.tsx)
const LOGO =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="22 24 106 96"><rect x="34" y="40" width="22" height="72" rx="3" fill="#f7f3ea"/><rect x="34" y="52" width="22" height="3" fill="#0b2b29" opacity=".25"/><rect x="34" y="98" width="22" height="3" fill="#0b2b29" opacity=".25"/><rect x="60" y="30" width="24" height="82" rx="3" fill="#ecc267"/><path d="M72 58 l3.2 6.5 7.2 1 -5.2 5.1 1.2 7.1 -6.4-3.4 -6.4 3.4 1.2-7.1 -5.2-5.1 7.2-1z" fill="#0b2b29"/><rect x="95" y="46" width="20" height="68" rx="3" fill="#6cc4b8" transform="rotate(14 95 114)"/><rect x="26" y="112" width="98" height="5" rx="2.5" fill="#f7f3ea" opacity=".9"/></svg>`,
  );

/** Télécharge une couverture et la glisse dans l'image (null si elle ne vient pas). */
async function loadCover(url: string | null): Promise<string | null> {
  if (!url || url.startsWith("data:")) return url;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !/image\/(jpeg|png)/.test(type)) return null;
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.length < 1000) return null; // image vide (pixel de remplacement)
    return `data:${type.split(";")[0]};base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}

const COVER_COLORS = ["#8a1c24", "#1d5e7a", "#3f7a4a", "#5b3a5e", "#a0612a"];

function Cover({ book, src, rank, width }: { book: TopBook; src: string | null; rank: number; width: number }) {
  const height = Math.round(width * 1.5);
  return (
    <div style={{ display: "flex", flexDirection: "column", width }}>
      <div style={{ display: "flex", position: "relative", width, height }}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- image générée, pas de page web
          <img src={src} width={width} height={height} style={{ borderRadius: 8, objectFit: "cover" }} alt="" />
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width,
              height,
              padding: 14,
              borderRadius: 8,
              background: COVER_COLORS[rank % COVER_COLORS.length],
              color: PAPER,
              fontFamily: "Fraunces",
              fontStyle: "italic",
              fontSize: 22,
              textAlign: "center",
            }}
          >
            {book.title.slice(0, 60)}
          </div>
        )}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: -14,
            left: -14,
            width: 48,
            height: 48,
            borderRadius: 24,
            alignItems: "center",
            justifyContent: "center",
            background: GOLD,
            color: INK,
            fontFamily: "Inter",
            fontWeight: 600,
            fontSize: 24,
            border: `3px solid ${INK}`,
          }}
        >
          {rank}
        </div>
      </div>
      <div
        style={{
          display: "block",
          marginTop: 12,
          color: PAPER,
          fontFamily: "Inter",
          fontWeight: 600,
          fontSize: 20,
          lineHeight: 1.25,
          lineClamp: 2,
        }}
      >
        {book.title}
      </div>
    </div>
  );
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const lang = params.get("lang");
  const locale = isLocale(lang) ? lang : "fr";
  const t = DICTIONARIES[locale];

  const top = await fetchSharedTop(params.get("u") ?? "").catch(() => null);
  if (!top || !top.books.length) return new Response("Top introuvable", { status: 404 });

  const covers = await Promise.all(top.books.map((b) => loadCover(b.coverUrl)));
  const count = top.books.length;
  // Jusqu'à 5 livres par rangée ; des couvertures plus grandes s'il y en a peu
  const perRow = count <= 3 ? count : count <= 4 ? 2 : count <= 6 ? 3 : 5;
  // Largeur utile : 1080 − 2 × 70 de marge = 940 pixels, moins les espaces entre couvertures
  const gap = perRow === 5 ? 20 : 40;
  const coverWidth = Math.min(260, Math.floor((940 - gap * (perRow - 1)) / perRow));
  const rows = Array.from({ length: Math.ceil(count / perRow) }, (_, r) =>
    top.books.slice(r * perRow, r * perRow + perRow).map((book, i) => ({
      book,
      rank: r * perRow + i + 1,
      src: covers[r * perRow + i],
    })),
  );

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          padding: "80px 70px 60px",
          background: `linear-gradient(165deg, #0e4f4c, ${INK} 70%)`,
          color: PAPER,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontFamily: "Inter",
              fontWeight: 600,
              fontSize: 28,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: GOLD,
            }}
          >
            {fmt(locale, t.share.imageEyebrow, { n: count })}
          </div>
          <div style={{ fontFamily: "Fraunces", fontStyle: "italic", fontWeight: 600, fontSize: 84, marginTop: 8 }}>
            {`@${top.username}`}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", gap: 44 }}>
          {rows.map((row, r) => (
            <div key={r} style={{ display: "flex", justifyContent: "center", gap }}>
              {row.map(({ book, rank, src }) => (
                <Cover key={rank} book={book} src={src} rank={rank} width={coverWidth} />
              ))}
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 28,
            borderTop: "2px solid rgba(236, 194, 103, 0.5)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- image générée */}
            <img src={LOGO} width={64} height={58} alt="" />
            <div style={{ fontFamily: "Fraunces", fontStyle: "italic", fontWeight: 600, fontSize: 48 }}>
              {SITE.name}
            </div>
            <div style={{ display: "flex", width: 12, height: 12, borderRadius: 6, background: GOLD, marginTop: 22, marginLeft: -12 }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <div style={{ fontFamily: "Inter", fontWeight: 600, fontSize: 26, color: GOLD }}>
              {SITE.url.replace("https://", "")}
            </div>
            <div style={{ fontFamily: "Inter", fontSize: 22, color: "rgba(247, 243, 234, 0.7)" }}>
              {t.meta.tagline}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: await fonts,
      headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=86400" },
    },
  );
}
