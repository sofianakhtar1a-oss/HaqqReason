/*
 * HaqqReason — service hors-ligne.
 * - Les pages publiques consultées sont gardées : elles restent lisibles sans connexion.
 * - Les favoris sont mis de côté dans un espace à part, jamais effacé automatiquement.
 * - Une histoire du Truchement ouverte une fois se relit sans connexion.
 * - Le Portulan, quand le joueur le demande (Mes réglages → Hors ligne), est gardé tout entier
 *   dans un espace à lui : sa page, son code, ses drapeaux et ses cartes. Il se joue sans réseau.
 * - L'espace créateur, les API et les fichiers ne sont JAMAIS mis en cache.
 * - Une page qui renvoie vers la connexion n'est jamais gardée à la place de la page demandée.
 */
const VERSION = "hr-v8-0";
const PAGES = `${VERSION}-pages`;
const STATIQUE = `${VERSION}-statique`;
const GARDE = "hr-favoris";
const PORTULAN = "hr-portulan";
/* Ce qu'une autre application partage avec le Calame, le temps que la page le prenne. */
const RECU = "hr-calame-recu";
const MAX_PORTULAN = 900;
const MAX_PAGES = 150;
const PRECHARGE = ["/hors-ligne", "/favoris", "/icon.svg", "/icones/icone-192.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(PAGES)
      .then((c) => Promise.allSettled(PRECHARGE.map((u) => fetch(u, { credentials: "same-origin" }).then((r) => r.ok && !r.redirected && c.put(u, r)))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((cles) => Promise.all(cles.filter((c) => ![PAGES, STATIQUE, GARDE, PORTULAN, RECU].includes(c)).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  );
});

const INTERDIT = /^\/(createur|api|fichiers|_next\/image|_next\/data)(\/|$)/;
const PUBLIC = /^\/($|explorer|islam|debat|graphe|favoris|recherche|hors-ligne|langues|monde)/;
/* Les fichiers du Portulan : drapeaux, emblèmes, cartes. Ils ne changent jamais d'adresse sans changer de nom. */
const FICHIER_PORTULAN = /^\/monde\/.+\.(json|svg|webp|png)$/;
/* Les histoires du Truchement : chaque version a son adresse (?v=…), une histoire ouverte se relit sans réseau.
   Elles sont servies par le serveur après vérification des droits Premium ; un refus (402) n'est jamais gardé. */
const HISTOIRE = /^\/api\/langues\/histoires\/[a-z0-9-]+$/;

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
    const garde =
      (await caches.match(url, { cacheName: GARDE })) ||
      (await caches.match(url, { cacheName: PAGES, ignoreSearch: false })) ||
      (new URL(url).pathname === "/monde" ? await caches.match("/monde", { cacheName: PORTULAN }) : undefined);
    if (garde) return garde;
    return (await caches.match("/hors-ligne")) || Response.error();
  }
}

self.addEventListener("fetch", (e) => {
  const requete = e.request;
  if (requete.method !== "GET") return;
  const url = new URL(requete.url);
  // Les histoires passent par /api/ (vérification des droits) mais se relisent hors ligne : seule exception.
  const histoire = HISTOIRE.test(url.pathname) && url.searchParams.has("v");
  if (url.origin !== self.location.origin || (!histoire && INTERDIT.test(url.pathname))) return;

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

  // Une histoire : gardée seulement si c'est bien elle (jamais la page de connexion vers laquelle on a été renvoyé).
  if (histoire) {
    e.respondWith(
      caches.match(requete).then(
        (trouve) =>
          trouve ||
          fetch(requete).then((r) => {
            if (r.ok && !r.redirected && (r.headers.get("content-type") ?? "").includes("json")) caches.open(STATIQUE).then((c) => c.put(requete, r.clone()));
            return r;
          }),
      ),
    );
    return;
  }

  if (FICHIER_PORTULAN.test(url.pathname)) {
    e.respondWith(
      caches.match(requete).then(
        (trouve) =>
          trouve ||
          fetch(requete).then((r) => {
            if (r.ok && !r.redirected) caches.open(PORTULAN).then((c) => c.put(requete, r.clone()));
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

/* ---------- Le Calame, destination de partage ---------- */

/*
 * « Partager » depuis une autre application envoie un formulaire à /ecrire/recu : le service le garde
 * (texte, lien, fichiers) dans un espace à part, puis ouvre le Calame qui en fait un document.
 */
self.addEventListener("fetch", (e) => {
  const requete = e.request;
  if (requete.method !== "POST") return;
  const url = new URL(requete.url);
  if (url.origin !== self.location.origin || url.pathname !== "/ecrire/recu") return;
  e.respondWith(
    (async () => {
      try {
        const donnees = await requete.formData();
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        const champ = (nom, max) => String(donnees.get(nom) || "").slice(0, max);
        const fichiers = donnees
          .getAll("fichiers")
          .filter((f) => f && typeof f === "object" && f.size > 0)
          .slice(0, 12);
        const cache = await caches.open(RECU);
        // Un partage ancien jamais ouvert ne s'accumule pas.
        for (const cle of await cache.keys()) {
          const morceaux = new URL(cle.url).pathname.split("/");
          const quand = parseInt((morceaux[3] || "").slice(0, -4), 36);
          if (!quand || Date.now() - quand > 7 * 86400000) await cache.delete(cle);
        }
        const liste = fichiers.map((f, i) => ({ nom: String(f.name || `fichier-${i + 1}`).slice(0, 200), type: f.type || "", taille: f.size, chemin: `/ecrire/recu/${id}/f${i}` }));
        await Promise.all(fichiers.map((f, i) => cache.put(liste[i].chemin, new Response(f, { headers: { "content-type": f.type || "application/octet-stream" } }))));
        await cache.put(
          `/ecrire/recu/${id}/paquet.json`,
          new Response(JSON.stringify({ titre: champ("titre", 300), texte: champ("texte", 200000), lien: champ("lien", 2000), fichiers: liste, quand: Date.now() }), { headers: { "content-type": "application/json" } }),
        );
        return Response.redirect(`/ecrire?recu=${id}`, 303);
      } catch {
        return Response.redirect("/ecrire?recu=echec", 303);
      }
    })(),
  );
});

/* ---------- Le Portulan hors ligne ---------- */

/** Garde la page du Portulan et tout ce qu'elle charge ; dit l'avancement au joueur. */
async function garderPortulan(urls, port) {
  const cache = await caches.open(PORTULAN);
  const dire = (m) => {
    try {
      port && port.postMessage(m);
    } catch {}
  };
  // La page d'abord : sans compte connecté, elle renvoie vers la connexion, et rien n'est gardé.
  const page = await fetch("/monde", { credentials: "same-origin" }).catch(() => null);
  if (!page || !page.ok || page.redirected) return dire({ fin: true, erreur: page && page.redirected ? "connexion" : "reseau" });
  const html = await page.clone().text();
  await cache.put("/monde", page);
  const ressources = [...new Set([...html.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+)"/g)].map((m) => m[1]))];
  const tout = [...new Set([...ressources, ...urls])];
  let fait = 0;
  let rates = 0;
  for (let i = 0; i < tout.length; i += 8) {
    await Promise.all(
      tout.slice(i, i + 8).map(async (u) => {
        try {
          if (!(await cache.match(u))) {
            const r = await fetch(u, { credentials: "same-origin" });
            if (r.ok && !r.redirected) await cache.put(u, r);
            else rates++;
          }
        } catch {
          rates++;
        }
        fait++;
      }),
    );
    dire({ fait, total: tout.length });
  }
  await limiter(PORTULAN, MAX_PORTULAN);
  dire({ fin: true, fait, total: tout.length, rates });
}

self.addEventListener("message", (e) => {
  const d = e.data || {};
  if (d.type === "portulan-garder" && Array.isArray(d.urls)) {
    const propres = d.urls.filter((u) => typeof u === "string" && /^\/(monde\/|_next\/static\/|icones\/portulan)/.test(u)).slice(0, 1500);
    e.waitUntil(garderPortulan(propres, e.ports && e.ports[0]));
  } else if (d.type === "portulan-oublier") {
    e.waitUntil(caches.delete(PORTULAN));
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

/* Les notifications du Portulan (un duel relevé, ton tour de jouer, une demande d'ami). */
self.addEventListener("push", (e) => {
  let d = {};
  try {
    d = e.data ? e.data.json() : {};
  } catch {
    d = { titre: "Le Portulan", corps: e.data ? e.data.text() : "" };
  }
  e.waitUntil(
    self.registration.showNotification(d.titre || "Le Portulan", {
      body: d.corps || "",
      icon: "/icones/icone-192.png",
      badge: "/icones/icone-192.png",
      tag: d.etiquette || "portulan",
      lang: "fr",
      data: { url: typeof d.url === "string" && d.url.startsWith("/") ? d.url : "/monde" },
    }),
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || "/monde", self.location.origin).href;
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((fenetres) => {
      for (const f of fenetres) {
        if (new URL(f.url).pathname === new URL(url).pathname && "focus" in f) {
          if ("navigate" in f) f.navigate(url).catch(() => {});
          return f.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
