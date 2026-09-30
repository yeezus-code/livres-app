import { AccountError } from "./account";

/** Taille (en pixels) des photos de profil enregistrées */
const SIZE = 256;

/**
 * Recadre une image au centre en carré et la réduit à 256 × 256 (JPEG).
 * Une photo de téléphone de plusieurs Mo devient ainsi un fichier d'environ 20 à 40 Ko.
 */
export async function prepareAvatar(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) {
    throw new AccountError("notImage");
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    // Ex. photos HEIC d'iPhone que certains navigateurs ne savent pas lire
    throw new AccountError("imageFormat");
  }

  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff"; // fond blanc pour les PNG transparents
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    SIZE,
    SIZE,
  );
  bitmap.close();

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new AccountError("imagePrepare"))),
      "image/jpeg",
      0.85,
    ),
  );
}
