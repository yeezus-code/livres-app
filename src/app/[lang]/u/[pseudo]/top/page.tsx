import type { Metadata } from "next";
import { cache } from "react";
import { TopShare } from "@/components/TopShare";
import { isLocale, type Locale } from "@/i18n/config";
import { DICTIONARIES } from "@/i18n/dictionaries";
import { fmt } from "@/i18n/format";
import { SITE } from "@/lib/site";
import { fetchSharedTop, topImagePath } from "@/lib/top-share";

// /u/<pseudo>/top : le top d'un lecteur en image, prêt à être partagé.
// Le lien envoyé affiche l'image en aperçu (WhatsApp, iMessage, réseaux sociaux…).

type Props = PageProps<"/[lang]/u/[pseudo]/top">;

const loadTop = cache((username: string) => fetchSharedTop(username).catch(() => null));

async function read(params: Props["params"]) {
  const { lang, pseudo } = await params;
  const locale: Locale = isLocale(lang) ? lang : "fr";
  const username = decodeURIComponent(pseudo);
  return { locale, username, top: await loadTop(username) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, top } = await read(params);
  if (!top || !top.books.length) return {};
  const t = DICTIONARIES[locale];
  const title = `${fmt(locale, t.share.pageTitle, { n: top.books.length, name: top.username })} — ${SITE.name}`;
  const image = { url: topImagePath(top, locale), width: 1080, height: 1350, alt: title };
  return {
    title,
    description: top.books.map((b, i) => `${i + 1}. ${b.title}`).join(" · "),
    openGraph: { title, images: [image] },
    twitter: { card: "summary_large_image", title, images: [image.url] },
  };
}

export default async function TopSharePage({ params }: Props) {
  const { locale, username, top } = await read(params);
  return (
    <TopShare
      username={top?.username ?? username}
      count={top?.books.length ?? 0}
      imagePath={top && top.books.length ? topImagePath(top, locale) : null}
    />
  );
}
