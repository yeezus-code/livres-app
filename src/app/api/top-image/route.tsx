import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { isLocale } from "@/i18n/config";
import { DICTIONARIES } from "@/i18n/dictionaries";
import { fmt } from "@/i18n/format";
import { SITE } from "@/lib/site";
import { fetchSharedTop, type TopBook } from "@/lib/top-share";

// GET /api/top-image?u=leo&lang=fr → l'image du top 10 de @leo (1080 × 1350, format Instagram).
// Le pseudo n'apparaît pas sur l'image.

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
// Pastilles du podium : or, argent, bronze ; puis un doré discret pour les suivants
const MEDALS = ["#ecc267", "#d9dee2", "#d9a066"];

type Placed = { book: TopBook; src: string | null; rank: number };

function Cover({ item, width, badge }: { item: Placed; width: number; badge: number }) {
  const height = Math.round(width * 1.5);
  const medal = MEDALS[item.rank - 1];
  return (
    <div style={{ display: "flex", position: "relative", width, height }}>
      {item.src ? (
        // eslint-disable-next-line @next/next/no-img-element -- image générée, pas de page web
        <img
          src={item.src}
          width={width}
          height={height}
          alt=""
          style={{ borderRadius: 6, objectFit: "cover", boxShadow: "0 18px 30px rgba(0, 0, 0, 0.45)" }}
        />
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width,
            height,
            padding: Math.round(width / 10),
            borderRadius: 6,
            background: COVER_COLORS[item.rank % COVER_COLORS.length],
            boxShadow: "0 18px 30px rgba(0, 0, 0, 0.45)",
            color: PAPER,
            fontFamily: "Fraunces",
            fontStyle: "italic",
            fontWeight: 600,
            fontSize: Math.max(16, Math.round(width / 9)),
            textAlign: "center",
          }}
        >
          {item.book.title.slice(0, 60)}
        </div>
      )}
      {/* Numéro, posé à cheval sur le bas de la couverture */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          bottom: -Math.round(badge / 2),
          left: Math.round((width - badge) / 2),
          width: badge,
          height: badge,
          borderRadius: badge / 2,
          alignItems: "center",
          justifyContent: "center",
          background: medal ?? INK,
          color: medal ? INK : GOLD,
          border: medal ? `4px solid ${INK}` : `2px solid ${GOLD}`,
          fontFamily: "Fraunces",
          fontWeight: 500,
          fontSize: Math.round(badge * 0.48),
        }}
      >
        {String(item.rank)}
      </div>
    </div>
  );
}

/** Titre raccourci pour tenir sur deux lignes sous une couverture. */
function shortTitle(title: string, max: number) {
  return title.length <= max ? title : title.slice(0, max - 1).trimEnd() + "…";
}

/** Une étagère : les couvertures posées sur une planche dorée (dessinée derrière les numéros). */
function Shelf({
  items,
  width,
  gap,
  badge,
  titles = false,
  titleSize = 22,
}: {
  items: Placed[];
  width: (rank: number) => number;
  gap: number;
  badge: number;
  titles?: boolean;
  titleSize?: number;
}) {
  const rowHeight = Math.max(...items.map((item) => Math.round(width(item.rank) * 1.5)));
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", width: 940 }}>
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: rowHeight - 3,
          left: 0,
          width: 940,
          height: 10,
          borderRadius: 5,
          background: "linear-gradient(90deg, rgba(236,194,103,0.15), #ecc267 50%, rgba(236,194,103,0.15))",
          boxShadow: "0 12px 26px rgba(0, 0, 0, 0.55)",
        }}
      />
      <div style={{ display: "flex", alignItems: "flex-end", gap, height: rowHeight }}>
        {items.map((item) => (
          <Cover key={item.rank} item={item} width={width(item.rank)} badge={badge} />
        ))}
      </div>
      {titles && (
        <div style={{ display: "flex", gap, marginTop: badge / 2 + 18 }}>
          {items.map((item) => (
            <div
              key={item.rank}
              style={{
                display: "flex",
                justifyContent: "center",
                width: width(item.rank),
                color: PAPER,
                fontFamily: "Inter",
                fontWeight: 600,
                fontSize: titleSize,
                lineHeight: 1.3,
                textAlign: "center",
              }}
            >
              {shortTitle(item.book.title, Math.round((width(item.rank) / titleSize) * 3.4))}
            </div>
          ))}
        </div>
      )}
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
  const placed: Placed[] = top.books.map((book, i) => ({ book, src: covers[i], rank: i + 1 }));
  const count = placed.length;

  // Le podium : n° 2, n° 1 (au centre, plus grand), n° 3
  const podium = placed.slice(0, 3);
  const podiumOrder = count >= 2 ? [podium[1], podium[0], podium[2]].filter(Boolean) : podium;
  // Les suivants, sur une seconde étagère
  const rest = placed.slice(3);
  // Sans seconde étagère, le podium a toute la place
  const podiumWidth = (rank: number) =>
    !rest.length ? (rank === 1 ? 310 : 250) : rank === 1 ? 236 : 190;
  const restGap = 18;
  const restWidth = Math.min(150, Math.floor((900 - restGap * (rest.length - 1)) / Math.max(rest.length, 1)));

  // « Mon top 10 » : le nombre en doré
  const [before, after] = fmt(locale, t.share.pageTitle, { n: "#" }).split("#");

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: "84px 70px 64px",
          backgroundColor: INK,
          backgroundImage:
            "radial-gradient(circle at 50% 42%, rgba(236, 194, 103, 0.20), rgba(236, 194, 103, 0) 48%), " +
            "linear-gradient(170deg, #0f5552, #0b2b29 62%, #081f1e)",
          color: PAPER,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div
            style={{
              fontFamily: "Inter",
              fontWeight: 600,
              fontSize: 24,
              letterSpacing: 8,
              textTransform: "uppercase",
              color: "rgba(236, 194, 103, 0.85)",
            }}
          >
            {t.share.imageSubtitle}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", marginTop: 6, fontFamily: "Fraunces", fontStyle: "italic", fontWeight: 600, fontSize: 104, lineHeight: 1.1 }}>
            <span>{before.trim()}</span>
            <span style={{ color: GOLD, marginLeft: before.endsWith(" ") ? 28 : 0 }}>{String(count)}</span>
            {after.trim() && <span style={{ marginLeft: after.startsWith(" ") ? 28 : 0 }}>{after.trim()}</span>}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 50 }}>
          <Shelf items={podiumOrder} width={podiumWidth} gap={34} badge={64} titles />
          {rest.length > 0 && (
            <Shelf items={rest} width={() => restWidth} gap={restGap} badge={44} titles titleSize={16} />
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- image générée */}
          <img src={LOGO} width={58} height={52} alt="" />
          <div style={{ display: "flex", alignItems: "baseline" }}>
            <span style={{ fontFamily: "Fraunces", fontStyle: "italic", fontWeight: 600, fontSize: 44 }}>
              {SITE.name}
            </span>
            <span style={{ color: GOLD, fontFamily: "Fraunces", fontSize: 44 }}>.</span>
          </div>
          <div style={{ display: "flex", width: 2, height: 36, background: "rgba(247, 243, 234, 0.3)", marginLeft: 6, marginRight: 6 }} />
          <div style={{ fontFamily: "Inter", fontWeight: 600, fontSize: 26, color: GOLD }}>
            {SITE.url.replace("https://", "")}
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
