// Types et couleurs communs aux sélections de toutes les langues (voir src/lib/collections.ts).

export type BookRef = { title: string; author: string };

export type Theme = { from: string; to: string; accent: string };

export type Collection = {
  id: string;
  title: string;
  subtitle: string;
  season?: { from: string; to: string };
  theme: Theme;
  books: BookRef[];
};

/** Couleurs des bandeaux : dégradé de « from » vers « to », « accent » pour le petit titre. */
export const THEMES = {
  classiques: { from: "#0e4f4c", to: "#0b2b29", accent: "#ecc267" },
  rentree: { from: "#1d5e7a", to: "#123a4d", accent: "#f2c46b" },
  halloween: { from: "#5a2a0c", to: "#1c0f08", accent: "#ff9f43" },
  couette: { from: "#5b3a5e", to: "#2c1c33", accent: "#f4c7a1" },
  noel: { from: "#8a1c24", to: "#3d0b10", accent: "#f5d38a" },
  amour: { from: "#9c2f4f", to: "#4a1224", accent: "#ffd1dc" },
  printemps: { from: "#3f7a4a", to: "#1f4428", accent: "#f7e08a" },
  plage: { from: "#1f7a8c", to: "#0f3f4a", accent: "#ffd98e" },
} satisfies Record<string, Theme>;
