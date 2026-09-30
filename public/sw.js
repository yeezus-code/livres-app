// « Service worker » de Codex : un petit programme qui tourne en arrière-plan dans le
// navigateur. Il sert l'écran « Pas de connexion » quand le réseau manque, et garde
// en mémoire les fichiers du site qui ne changent jamais (pour aller plus vite).
// Il ne met JAMAIS en cache les pages ni les données : on voit toujours la dernière version.

const CACHE = "codex-v2";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll([OFFLINE_URL])),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Supprime les anciennes versions du cache
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // Ouverture d'une page : on essaie le réseau, sinon l'écran « Pas de connexion »
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  // Fichiers du site dont le nom change à chaque version (/_next/static) : on les garde
  if (url.origin === self.location.origin && url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
  }
  // Tout le reste (données Supabase, couvertures, recherche) passe normalement par le réseau
});
