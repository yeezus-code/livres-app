import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

// Permet d'« installer » Codex sur l'écran d'accueil du téléphone, comme une appli.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.name,
    short_name: SITE.name,
    description: SITE.description,
    start_url: "/",
    display: "standalone",
    background_color: "#f7f3ea",
    theme_color: "#0b2b29",
    lang: "fr",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
