/*
 * HaqqReason — service hors-ligne.
 * - Les pages publiques consultées sont gardées : elles restent lisibles sans connexion.
 * - Les favoris sont mis de côté dans un espace à part, jamais effacé automatiquement.
 * - L'espace créateur, les API et les fichiers ne sont JAMAIS mis en cache.
 */
const VERSION = "hr-v6-1";
const PAGES = `${VERSION}-pages`;
const STATIQUE = `${VERSION}-statique`;
const GARDE = "hr-favoris";
const MAX_PAGES = 150;
const PRECHARGE = ["/hors-ligne", "/favoris", "/icon.svg", "/icones/icone-192.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(PAGES)
      .then((c) => Promise.allSettled(PRECHARGE.map((u) => fetch(u, { credentials: "same-origin" }).then((r) => r.ok && c.put(u, r)))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((cles) => Promise.all(cles.filter((c) => ![PAGES, STATIQUE, GARDE].includes(c)).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  );
});

const INTERDIT = /^\/(createur|api|fichiers|_next\/image|_next\/data)(\/|$)/;
const PUBLIC = /^\/($|explorer|debat|graphe|favoris|recherche|hors-ligne)/;

async function limiter(nom, max) {
  const cache = await caches.open(nom);
  const cles = await cache.keys();
  for (let i = 0; i < cles.length - max; i++) await cache.delete(cles[i]);
}

/** Met de côté les fichiers JavaScript et CSS d'une page pour qu'elle fonctionne hors ligne. */
async function garderRessources(html) {
  const cache = await caches.open(STATIQUE);
  const urls = [...new Set([...html.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+)"/g)].map((m) => m[1]))];
  await Promise.allSettled(
    urls.map(async (u) => {
      if (await cache.match(u)) return;
      const r = await fetch(u);
      if (r.ok) await cache.put(u, r);
    }),
  );
}

async function pageDepuisReseau(requete) {
  const controle = new AbortController();
  const delai = setTimeout(() => controle.abort(), 6000);
  try {
    const reponse = await fetch(requete, { signal: controle.signal });
    clearTimeout(delai);
    if (reponse.ok && reponse.type === "basic" && !reponse.redirected) {
      const copie = reponse.clone();
      const cache = await caches.open(PAGES);
      await cache.put(requete.url.split("#")[0], copie.clone());
      copie.text().then(garderRessources).catch(() => {});
      limiter(PAGES, MAX_PAGES);
    }
    return reponse;
  } catch {
    clearTimeout(delai);
    const url = requete.url.split("#")[0];
    const garde = (await caches.match(url, { cacheName: GARDE })) || (await caches.match(url, { cacheName: PAGES, ignoreSearch: false }));
    if (garde) return garde;
    return (await caches.match("/hors-ligne")) || Response.error();
  }
}

self.addEventListener("fetch", (e) => {
  const requete = e.request;
  if (requete.method !== "GET") return;
  const url = new URL(requete.url);
  if (url.origin !== self.location.origin || INTERDIT.test(url.pathname)) return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icones/")) {
    e.respondWith(
      caches.match(requete).then(
        (trouve) =>
          trouve ||
          fetch(requete).then((r) => {
            if (r.ok) caches.open(STATIQUE).then((c) => c.put(requete, r.clone()));
            return r;
          }),
      ),
    );
    return;
  }

  if (requete.mode === "navigate" && PUBLIC.test(url.pathname) && !url.searchParams.has("_rsc")) {
    e.respondWith(pageDepuisReseau(requete));
  }
});

self.addEventListener("message", (e) => {
  const { type, urls } = e.data || {};
  if (!Array.isArray(urls)) return;
  const propres = urls.filter((u) => typeof u === "string" && u.startsWith("/explorer/")).slice(0, 500);
  if (type === "garder") {
    e.waitUntil(
      caches.open(GARDE).then((cache) =>
        Promise.allSettled(
          propres.map(async (u) => {
            const r = await fetch(u, { credentials: "same-origin" });
            if (r.ok && !r.redirected) {
              await cache.put(u, r.clone());
              await garderRessources(await r.text());
            }
          }),
        ),
      ),
    );
  } else if (type === "oublier") {
    e.waitUntil(caches.open(GARDE).then((cache) => Promise.all(propres.map((u) => cache.delete(u)))));
  }
});
