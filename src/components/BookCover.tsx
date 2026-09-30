/* eslint-disable @next/next/no-img-element -- les couvertures viennent de sites externes, une simple <img> suffit */
"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";

type Props = { src: string | null; title: string; size?: "sm" | "md" | "lg" };

/** Couverture du livre, ou une couverture de remplacement avec le titre. */
export function BookCover({ src: rawSrc, title, size = "md" }: Props) {
  const [failed, setFailed] = useState(false);
  const { t, f } = useI18n();
  // Grande couverture : on demande la version haute définition à Open Library
  const src = size === "lg" && rawSrc ? rawSrc.replace(/-M\.jpg(\?|$)/, "-L.jpg$1") : rawSrc;

  if (!src || failed) {
    return (
      <div className={`cover cover--${size} cover--empty`} aria-hidden="true">
        <span>{title}</span>
      </div>
    );
  }

  return (
    <img
      className={`cover cover--${size}`}
      src={src}
      alt={f(t.common.coverOf, { title })}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
