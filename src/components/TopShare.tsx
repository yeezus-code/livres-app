"use client";

import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { profileHref } from "@/lib/social";

/** Page de partage d'un top : l'image, et les boutons Partager / Télécharger / Copier le lien. */
export function TopShare({
  username,
  count,
  imagePath,
}: {
  username: string;
  count: number;
  imagePath: string | null;
}) {
  const { t, f, href } = useI18n();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!imagePath) {
    return (
      <div className="empty">
        <p>{f(t.share.empty, { name: username })}</p>
        <Link href={href(profileHref(username))} className="btn btn--primary">
          {f(t.share.seeProfile, { name: username })}
        </Link>
      </div>
    );
  }

  const title = f(t.share.pageTitle, { n: count, name: username });
  const fileName = `codex-top-${username}.png`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt(t.share.copy, window.location.href);
    }
  }

  async function share() {
    setBusy(true);
    const url = window.location.href;
    const text = f(t.share.shareText, { n: count });
    try {
      // Sur téléphone : on envoie l'image elle-même (Instagram, WhatsApp, Messages…)
      const blob = await fetch(imagePath!).then((res) => res.blob());
      const file = new File([blob], fileName, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title, text: `${text} — ${url}` });
      } else if (navigator.share) {
        await navigator.share({ title, text, url }); // le lien affiche l'image en aperçu
      } else {
        await copyLink();
      }
    } catch (e) {
      // « AbortError » : la personne a simplement fermé la fenêtre de partage
      if ((e as Error).name !== "AbortError") await copyLink();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="top-share">
      <h1 className="page-title">{title}</h1>
      <p className="muted">{t.share.intro}</p>
      {/* eslint-disable-next-line @next/next/no-img-element -- image générée par /api/top-image */}
      <img className="top-share__image" src={imagePath} alt={title} width={1080} height={1350} />
      <div className="top-share__actions">
        <button className="btn btn--primary" onClick={share} disabled={busy}>
          {busy ? "…" : t.share.share}
        </button>
        <a className="btn btn--ghost" href={imagePath} download={fileName}>
          {t.share.download}
        </a>
        <button className="btn btn--ghost" onClick={copyLink}>
          {copied ? t.share.copied : t.share.copy}
        </button>
      </div>
      <p className="center small">
        <Link href={href(profileHref(username))}>{f(t.share.seeProfile, { name: username })}</Link>
      </p>
    </div>
  );
}
