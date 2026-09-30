/* eslint-disable @next/next/no-img-element -- photo stockée sur Supabase, une simple <img> suffit */
"use client";

import { useState } from "react";

// Couleurs de fond quand il n'y a pas de photo (choisie d'après le pseudo)
const COLORS = ["#0f6b6b", "#13807f", "#2f7d6d", "#3b6e8f", "#5b7f3a", "#8a5a2b", "#7a4d7e"];

function colorFor(username: string) {
  let hash = 0;
  for (const char of username) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return COLORS[hash % COLORS.length];
}

/** Photo de profil ronde, ou la première lettre du pseudo sur un fond coloré. */
export function Avatar({
  url,
  username,
  size = 32,
}: {
  url: string | null | undefined;
  username: string;
  size?: number;
}) {
  const style = { width: size, height: size, fontSize: size * 0.45 };
  // Si la photo ne se charge pas, on affiche l'initiale à la place
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (url && url !== failedUrl) {
    return (
      <img
        className="avatar"
        src={url}
        alt=""
        style={style}
        loading="lazy"
        onError={() => setFailedUrl(url)}
      />
    );
  }
  return (
    <span className="avatar avatar--letter" style={{ ...style, background: colorFor(username) }} aria-hidden="true">
      {username.charAt(0).toUpperCase()}
    </span>
  );
}
