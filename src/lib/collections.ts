// Les sélections de livres de Codex : les grands classiques et les sélections de saison.
//
// Pour modifier une sélection, ajouter un livre ou créer une nouvelle saison, il suffit
// d'éditer ce fichier (sur GitHub : bouton crayon ✎, puis « Commit changes »).
// Le site se met à jour tout seul en 1 à 2 minutes.
//
// - « season » : période d'affichage sur l'accueil, au format « MM-JJ » (mois-jour).
//   Une période peut passer d'une année à l'autre (ex. du 11-01 au 02-28).
// - « theme » : couleurs du bandeau (dégradé de « from » vers « to », « accent » pour le titre).

export type BookRef = { title: string; author: string };

export type Collection = {
  id: string;
  title: string;
  subtitle: string;
  season?: { from: string; to: string };
  theme: { from: string; to: string; accent: string };
  books: BookRef[];
};

export const COLLECTIONS: Collection[] = [
  {
    id: "classiques",
    title: "Les grands classiques",
    subtitle: "Les incontournables, à lire au moins une fois.",
    theme: { from: "#0e4f4c", to: "#0b2b29", accent: "#ecc267" },
    books: [
      { title: "L'Étranger", author: "Albert Camus" },
      { title: "Les Misérables", author: "Victor Hugo" },
      { title: "Madame Bovary", author: "Gustave Flaubert" },
      { title: "Le Petit Prince", author: "Antoine de Saint-Exupéry" },
      { title: "1984", author: "George Orwell" },
      { title: "Orgueil et préjugés", author: "Jane Austen" },
      { title: "Crime et châtiment", author: "Fiodor Dostoïevski" },
      { title: "Cent ans de solitude", author: "Gabriel García Márquez" },
      { title: "Le Comte de Monte-Cristo", author: "Alexandre Dumas" },
      { title: "Germinal", author: "Émile Zola" },
      { title: "Le Rouge et le Noir", author: "Stendhal" },
      { title: "Du côté de chez Swann", author: "Marcel Proust" },
    ],
  },
  {
    id: "rentree",
    title: "C'est la rentrée",
    subtitle: "Cartables, souvenirs d'école et premières fois.",
    season: { from: "09-01", to: "10-15" },
    theme: { from: "#1d5e7a", to: "#123a4d", accent: "#f2c46b" },
    books: [
      { title: "Le Grand Meaulnes", author: "Alain-Fournier" },
      { title: "Le Petit Nicolas", author: "René Goscinny" },
      { title: "La Gloire de mon père", author: "Marcel Pagnol" },
      { title: "Le Cercle des poètes disparus", author: "N. H. Kleinbaum" },
      { title: "L'Attrape-cœurs", author: "J. D. Salinger" },
      { title: "Harry Potter à l'école des sorciers", author: "J. K. Rowling" },
    ],
  },
  {
    id: "halloween",
    title: "Frissons d'Halloween",
    subtitle: "À lire la lumière allumée.",
    season: { from: "10-16", to: "11-02" },
    theme: { from: "#5a2a0c", to: "#1c0f08", accent: "#ff9f43" },
    books: [
      { title: "Frankenstein", author: "Mary Shelley" },
      { title: "Dracula", author: "Bram Stoker" },
      { title: "Shining", author: "Stephen King" },
      { title: "Ça", author: "Stephen King" },
      { title: "Rebecca", author: "Daphne du Maurier" },
      { title: "Le Tour d'écrou", author: "Henry James" },
    ],
  },
  {
    id: "couette",
    title: "Sous la couette",
    subtitle: "Des livres doudous pour les longues soirées d'hiver.",
    season: { from: "11-03", to: "02-28" },
    theme: { from: "#5b3a5e", to: "#2c1c33", accent: "#f4c7a1" },
    books: [
      { title: "Le Cercle littéraire des amateurs d'épluchures de patates", author: "Mary Ann Shaffer" },
      { title: "Les Délices de Tokyo", author: "Durian Sukegawa" },
      { title: "La Tresse", author: "Laetitia Colombani" },
      { title: "La Vie devant soi", author: "Romain Gary" },
      { title: "Jane Eyre", author: "Charlotte Brontë" },
      { title: "Le Hobbit", author: "J. R. R. Tolkien" },
      { title: "Ensemble, c'est tout", author: "Anna Gavalda" },
    ],
  },
  {
    id: "noel",
    title: "Lectures de Noël",
    subtitle: "Des histoires qui sentent le sapin et le chocolat chaud.",
    season: { from: "12-01", to: "12-31" },
    theme: { from: "#8a1c24", to: "#3d0b10", accent: "#f5d38a" },
    books: [
      { title: "Un chant de Noël", author: "Charles Dickens" },
      { title: "Le Noël d'Hercule Poirot", author: "Agatha Christie" },
      { title: "Les Quatre Filles du docteur March", author: "Louisa May Alcott" },
      { title: "Casse-Noisette et le Roi des souris", author: "E. T. A. Hoffmann" },
      { title: "Le Pôle Express", author: "Chris Van Allsburg" },
      { title: "La Petite Fille aux allumettes", author: "Hans Christian Andersen" },
    ],
  },
  {
    id: "saint-valentin",
    title: "Histoires d'amour",
    subtitle: "Pour la Saint-Valentin, ou pour toute l'année.",
    season: { from: "02-01", to: "02-15" },
    theme: { from: "#9c2f4f", to: "#4a1224", accent: "#ffd1dc" },
    books: [
      { title: "Roméo et Juliette", author: "William Shakespeare" },
      { title: "Belle du Seigneur", author: "Albert Cohen" },
      { title: "Les Hauts de Hurlevent", author: "Emily Brontë" },
      { title: "Le Temps de l'innocence", author: "Edith Wharton" },
      { title: "Autant en emporte le vent", author: "Margaret Mitchell" },
      { title: "Orgueil et préjugés", author: "Jane Austen" },
    ],
  },
  {
    id: "printemps",
    title: "Le printemps des lecteurs",
    subtitle: "Des livres lumineux pour les beaux jours qui reviennent.",
    season: { from: "03-01", to: "06-14" },
    theme: { from: "#3f7a4a", to: "#1f4428", accent: "#f7e08a" },
    books: [
      { title: "Le Jardin secret", author: "Frances Hodgson Burnett" },
      { title: "L'Élégance du hérisson", author: "Muriel Barbery" },
      { title: "Le Liseur du 6h27", author: "Jean-Paul Didierlaurent" },
      { title: "Mange, prie, aime", author: "Elizabeth Gilbert" },
      { title: "Chocolat", author: "Joanne Harris" },
      { title: "Le Vieux qui ne voulait pas fêter son anniversaire", author: "Jonas Jonasson" },
    ],
  },
  {
    id: "plage",
    title: "Les indispensables de la plage",
    subtitle: "Des pages qui se tournent toutes seules, les pieds dans le sable.",
    season: { from: "06-15", to: "08-31" },
    theme: { from: "#1f7a8c", to: "#0f3f4a", accent: "#ffd98e" },
    books: [
      { title: "L'Amie prodigieuse", author: "Elena Ferrante" },
      { title: "La Vérité sur l'affaire Harry Quebert", author: "Joël Dicker" },
      { title: "Bonjour tristesse", author: "Françoise Sagan" },
      { title: "Ils étaient dix", author: "Agatha Christie" },
      { title: "Le Vieil Homme et la Mer", author: "Ernest Hemingway" },
      { title: "Tendre est la nuit", author: "F. Scott Fitzgerald" },
      { title: "Le Comte de Monte-Cristo", author: "Alexandre Dumas" },
    ],
  },
];

// Dernières sorties : laissez cette liste vide pour que Codex aille chercher tout seul
// les romans en français les plus récents (Google Books). Pour choisir vous-même les
// nouveautés mises en avant, écrivez-les ici, par exemple :
//   { title: "Titre du livre", author: "Nom de l'auteur" },
export const NEW_RELEASES: BookRef[] = [];

export function getCollection(id: string) {
  return COLLECTIONS.find((c) => c.id === id);
}

/** « 2026-09-30 » → « 09-30 » (mois-jour, heure de Paris) */
function monthDay(date: Date) {
  const parts = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${get("month")}-${get("day")}`;
}

export function isInSeason(collection: Collection, date = new Date()) {
  if (!collection.season) return false;
  const md = monthDay(date);
  const { from, to } = collection.season;
  // Période à cheval sur deux années (ex. novembre → février)
  return from <= to ? md >= from && md <= to : md >= from || md <= to;
}

/** Les sélections de saison du moment (souvent une, parfois deux qui se chevauchent). */
export function currentCollections(date = new Date()) {
  return COLLECTIONS.filter((c) => isInSeason(c, date));
}

/** Toutes les sélections de saison, celles du moment en premier. */
export function seasonalCollections(date = new Date()) {
  const seasonal = COLLECTIONS.filter((c) => c.season);
  return [
    ...seasonal.filter((c) => isInSeason(c, date)),
    ...seasonal.filter((c) => !isInSeason(c, date)),
  ];
}
