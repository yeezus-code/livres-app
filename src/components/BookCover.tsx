/* eslint-disable @next/next/no-img-element -- les couvertures viennent de sites externes, une simple <img> suffit */
"use client";

import { useState } from "react";

type Props = { src: string | null; title: string; size?: "sm" | "md" };

/** Couverture du livre, ou une couverture de remplacement avec le titre. */
export function BookCover({ src, title, size = "md" }: Props) {
  const [failed, setFailed] = useState(false);

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
      alt={`Couverture de « ${title} »`}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
