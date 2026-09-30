import type { Metadata } from "next";
import { Fragment } from "react";
import { isLocale, type Locale } from "@/i18n/config";
import { DICTIONARIES } from "@/i18n/dictionaries";
import { fmt, rich } from "@/i18n/format";
import { SITE } from "@/lib/site";

async function getLocale(params: PageProps<"/[lang]/mentions-legales">["params"]): Promise<Locale> {
  const { lang } = await params;
  return isLocale(lang) ? lang : "fr";
}

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/mentions-legales">): Promise<Metadata> {
  const t = DICTIONARIES[await getLocale(params)];
  return { title: `${t.legal.title} — ${SITE.name}` };
}

export default async function LegalPage({ params }: PageProps<"/[lang]/mentions-legales">) {
  const locale = await getLocale(params);
  const t = DICTIONARIES[locale];
  const l = t.legal;
  const name = SITE.name;
  const mail = <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>;
  const keyed = (pieces: React.ReactNode[]) =>
    pieces.map((piece, i) => <Fragment key={i}>{piece}</Fragment>);
  const withMail = (text: string) => keyed(rich(fmt(locale, text, { name }), { mail }));

  return (
    <article className="prose">
      <h1 className="page-title">{l.title}</h1>

      <h2>{fmt(locale, l.whatIs, { name })}</h2>
      <p className="lead">{t.meta.description}</p>
      <p>{l.free}</p>

      <h2>{l.publisherTitle}</h2>
      <p>{withMail(l.publisher)}</p>

      <h2>{l.hostingTitle}</h2>
      <ul>
        <li>{l.hostingSite}</li>
        <li>{l.hostingData}</li>
        <li>{l.hostingEmail}</li>
      </ul>

      <h2>{l.dataTitle}</h2>
      <p>{fmt(locale, l.dataIntro, { name })}</p>
      <ul>
        <li>{l.dataAccount}</li>
        <li>{l.dataBooks}</li>
      </ul>
      <p>{keyed(rich(l.dataEmail, { public: <strong>{l.public}</strong> }))}</p>
      <p>{withMail(l.dataRights)}</p>

      <h2>{l.cookiesTitle}</h2>
      <p>{fmt(locale, l.cookies, { name })}</p>

      <h2>{l.booksTitle}</h2>
      <p>{withMail(l.books)}</p>
    </article>
  );
}
