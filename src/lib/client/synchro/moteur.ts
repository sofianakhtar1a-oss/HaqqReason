/*
 * Le moteur de synchronisation : fait suivre les données personnelles d'un appareil à l'autre.
 *
 * Principe : on écrit toujours d'abord sur l'appareil (rapide, et ça marche hors ligne). Le moteur
 * passe ensuite, quand un compte est connecté et que le réseau est là :
 *   1. il reçoit ce qui a changé sur le compte depuis sa dernière visite ;
 *   2. il envoie ce que cet appareil a modifié.
 * Si le même objet a été modifié sur deux appareils, la modification la plus récente l'emporte.
 */
import { espacePersonnel } from "@/lib/compte/chemins";
import { LOT_MAX, MAGASINS, OBJET_MAX, type NomMagasin } from "@/lib/compte/limites";
import { compteLocal, tiroir } from "@/lib/client/compte";
import {
  cleTrace,
  ecrireTrace,
  ecrireTraces,
  empreinte,
  EVENEMENT_A_ENVOYER,
  EVENEMENT_RECU,
  lireEtat,
  lireTrace,
  marquerPret,
  publierEtat,
  toutesLesTraces,
  tracesEnAttente,
  type Trace,
} from "./journal";
import { ADAPTATEURS } from "./magasins";

type Memoire = { curseur: number; amorce: boolean };
type Ligne = { m: string; c: string; v: unknown; q: number; j: number };

const SUPPRIME = "supprime";
/** Poids d'un envoi : bien en dessous de ce qu'accepte l'hébergement pour une requête. */
const POIDS_LOT = 1_500_000;

class Deconnecte extends Error {}

const cleMemoire = () => tiroir("haqqreason-synchro-etat");

function lireMemoire(): Memoire {
  try {
    const brut = JSON.parse(localStorage.getItem(cleMemoire()) ?? "null") as Partial<Memoire> | null;
    return { curseur: Number(brut?.curseur) || 0, amorce: brut?.amorce === true };
  } catch {
    return { curseur: 0, amorce: false };
  }
}
function ecrireMemoire(m: Memoire) {
  try {
    localStorage.setItem(cleMemoire(), JSON.stringify(m));
  } catch {
    /* stockage plein : on redemandera tout la prochaine fois, sans dommage */
  }
}

/** Première visite de ce compte sur cet appareil : tout ce qui s'y trouve déjà devra partir sur le compte. */
async function amorcer() {
  const connues = new Set((await toutesLesTraces()).map((t) => t.k));
  const nouvelles: Trace[] = [];
  for (const m of MAGASINS) {
    let cles: { c: string; q?: number }[] = [];
    try {
      cles = await ADAPTATEURS[m].cles();
    } catch {
      continue;
    }
    for (const { c, q } of cles) {
      const k = cleTrace(m, c);
      // Sans date connue, l'objet est « très ancien » : s'il existe déjà sur le compte, c'est le compte qui a raison.
      if (!connues.has(k)) nouvelles.push({ k, m, c, q: q && q > 1 ? Math.floor(q) : 1, p: 1 });
    }
  }
  await ecrireTraces(nouvelles);
}

async function recevoir(memoire: Memoire): Promise<Set<string>> {
  const touches = new Set<string>();
  for (let tour = 0; tour < 400; tour++) {
    const reponse = await fetch(`/api/compte/donnees?depuis=${memoire.curseur}`, { cache: "no-store" });
    if (reponse.status === 401) throw new Deconnecte();
    if (!reponse.ok) throw new Error("lecture impossible");
    const { lignes } = (await reponse.json()) as { lignes: Ligne[] };
    if (!Array.isArray(lignes) || lignes.length === 0) break;
    for (const l of lignes) {
      const adaptateur = ADAPTATEURS[l.m as NomMagasin];
      if (adaptateur) {
        const trace = await lireTrace(l.m, l.c);
        const dejaCommun = trace && !trace.p && trace.qs === l.q;
        if (!dejaCommun && (!trace || l.q > trace.q || trace.q <= 1)) {
          try {
            const suite = l.v === null ? await adaptateur.effacer(l.c) : await adaptateur.ecrire(l.c, l.v);
            const commun = { k: cleTrace(l.m, l.c), m: l.m as NomMagasin, c: l.c, h: l.v === null ? SUPPRIME : empreinte(l.v), qs: l.q };
            // « a-renvoyer » : le rangement a fusionné les deux versions, le résultat repart vers le compte.
            if (suite === "a-renvoyer") await ecrireTrace({ ...commun, q: Math.max(Date.now(), l.q + 1), p: 1 });
            else await ecrireTrace({ ...commun, q: l.q, p: 0 });
            touches.add(l.m);
          } catch {
            // Un objet illisible ne doit pas bloquer tous les autres.
          }
        }
      }
      memoire.curseur = Math.max(memoire.curseur, l.j);
    }
    ecrireMemoire(memoire);
  }
  return touches;
}

type Sortant = { trace: Trace; v: unknown; h: string };

async function expedier(lot: Sortant[]): Promise<number> {
  if (lot.length === 0) return 0;
  const reponse = await fetch("/api/compte/donnees", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ecritures: lot.map(({ trace, v }) => ({ m: trace.m, c: trace.c, v, q: trace.q })) }),
  });
  if (reponse.status === 401) throw new Deconnecte();
  if (!reponse.ok) throw new Error("envoi impossible");
  const { refusees } = (await reponse.json()) as { refusees?: { m: string; c: string }[] };
  const refus = new Set((refusees ?? []).map((r) => cleTrace(r.m, r.c)));
  for (const { trace, h } of lot) {
    const maintenant = await lireTrace(trace.m, trace.c);
    // Modifié de nouveau pendant l'envoi : il repartira au prochain passage.
    if (maintenant && maintenant.q !== trace.q) continue;
    if (refus.has(trace.k)) await ecrireTrace({ ...trace, p: 0, r: 1 });
    else await ecrireTrace({ k: trace.k, m: trace.m, c: trace.c, q: trace.q, p: 0, h, qs: trace.q });
  }
  return refus.size;
}

async function envoyer(): Promise<void> {
  // Les fichiers d'abord : un document ne doit pas arriver ailleurs avant ses images.
  const attente = (await tracesEnAttente()).sort((a, b) => Number(b.m === "calame-fichiers") - Number(a.m === "calame-fichiers"));
  let lot: Sortant[] = [];
  let poids = 0;
  let echecs = 0;
  const vider = async () => {
    const aEnvoyer = lot;
    lot = [];
    poids = 0;
    await expedier(aEnvoyer);
  };
  for (const trace of attente) {
    const adaptateur = ADAPTATEURS[trace.m];
    if (!adaptateur) continue;
    try {
      const valeur = await adaptateur.lire(trace.c);
      const supprime = valeur === undefined || valeur === null;
      const h = supprime ? SUPPRIME : empreinte(valeur);
      // Rien n'a changé depuis la dernière version commune (un document rouvert sans retouche, par exemple).
      if (trace.h === h && trace.qs !== undefined) {
        await ecrireTrace({ ...trace, q: trace.qs, p: 0 });
        continue;
      }
      // Jamais parti, déjà supprimé : il n'y a rien à dire au compte.
      if (supprime && trace.h === undefined && trace.qs === undefined) {
        await ecrireTrace({ ...trace, p: 0, h: SUPPRIME, qs: trace.q });
        continue;
      }
      const taille = supprime ? 0 : JSON.stringify(valeur).length;
      if (taille > OBJET_MAX) {
        await ecrireTrace({ ...trace, p: 0, r: 1 });
        continue;
      }
      if (adaptateur.avantEnvoi && (await adaptateur.avantEnvoi(trace.c, supprime)) === "ignorer") {
        await ecrireTrace({ ...trace, p: 0, r: 1 });
        continue;
      }
      if (lot.length >= Math.min(LOT_MAX, 100) || (lot.length > 0 && poids + taille > POIDS_LOT)) await vider();
      lot.push({ trace, v: supprime ? null : valeur, h });
      poids += taille;
    } catch (e) {
      if (e instanceof Deconnecte) throw e;
      echecs++;
    }
  }
  await vider();
  if (echecs > 0) throw new Error("envois incomplets");
}

async function compter() {
  const toutes = await toutesLesTraces();
  return { enAttente: toutes.filter((t) => t.p === 1).length, refuses: toutes.filter((t) => t.r === 1).length };
}

let enCours = false;
let encore = false;

/** Les autres onglets du même compte sont prévenus de ce qui vient d'arriver, pour se rafraîchir aussi. */
let diffusion: BroadcastChannel | null | undefined;
function canal(): BroadcastChannel | null {
  if (diffusion !== undefined) return diffusion;
  try {
    diffusion = new BroadcastChannel(tiroir("haqqreason-synchro"));
    diffusion.onmessage = (e) => {
      if (Array.isArray(e.data)) window.dispatchEvent(new CustomEvent(EVENEMENT_RECU, { detail: e.data }));
    };
  } catch {
    diffusion = null;
  }
  return diffusion;
}

/** Un passage complet : recevoir, puis envoyer. Ne lève jamais d'erreur. */
export async function synchroniser(): Promise<void> {
  if (!compteLocal()) return;
  if (enCours) {
    encore = true;
    return;
  }
  enCours = true;
  try {
    do {
      encore = false;
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        publierEtat({ phase: "hors-ligne", ...(await compter()) });
        break;
      }
      publierEtat({ phase: "en-cours" });
      try {
        const memoire = lireMemoire();
        if (!memoire.amorce) {
          await amorcer();
          memoire.amorce = true;
          ecrireMemoire(memoire);
        }
        const touches = await recevoir(memoire);
        if (touches.size > 0) {
          window.dispatchEvent(new CustomEvent(EVENEMENT_RECU, { detail: [...touches] }));
          canal()?.postMessage([...touches]);
        }
        marquerPret();
        await envoyer();
        publierEtat({ phase: "a-jour", dernier: Date.now(), ...(await compter()) });
      } catch (e) {
        if (e instanceof Deconnecte) {
          publierEtat({ phase: "deconnecte", ...(await compter()) });
          arreter();
          sessionFermee();
          break;
        }
        publierEtat({ phase: navigator.onLine === false ? "hors-ligne" : "erreur", ...(await compter()) });
      }
    } while (encore);
  } finally {
    enCours = false;
    marquerPret();
  }
}

/**
 * La session a été fermée ailleurs (« déconnecter tous mes appareils », compte supprimé) : on retire le
 * cookie devenu inutile, puis on repasse par la connexion. Ce qui n'a pas encore été envoyé reste sur
 * l'appareil, dans les tiroirs du compte, et partira à la prochaine connexion.
 */
function sessionFermee() {
  const ici = `${window.location.pathname}${window.location.search}`;
  void fetch("/api/compte/deconnexion", { method: "POST", redirect: "manual" })
    .catch(() => undefined)
    .finally(() => {
      // Un vrai rechargement, exprès : le compte est inscrit sur la page par le serveur.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      if (espacePersonnel(window.location.pathname)) window.location.assign(`/connexion?retour=${encodeURIComponent(ici)}`);
      else window.location.reload();
    });
}

/* ---------- Quand passer ---------- */

let minuteur: ReturnType<typeof setTimeout> | null = null;
let intervalle: ReturnType<typeof setInterval> | null = null;
let demarre = false;
let dernierPassage = 0;

function passer() {
  dernierPassage = Date.now();
  // Un seul onglet à la fois fait le travail, quand le navigateur sait le garantir.
  const verrou = typeof navigator !== "undefined" ? navigator.locks : undefined;
  if (verrou?.request) {
    void verrou
      .request(tiroir("haqqreason-synchro"), { ifAvailable: true }, async (obtenu) => {
        if (obtenu) return synchroniser();
        // Un autre onglet est en train de passer : il nous préviendra, et on repassera juste après.
        marquerPret();
        planifier(4000);
      })
      .catch(() => undefined);
  } else void synchroniser();
}

function planifier(delai: number) {
  if (minuteur) clearTimeout(minuteur);
  minuteur = setTimeout(passer, delai);
}

const surEcriture = () => planifier(1500);
const surRetourReseau = () => planifier(0);
const surVisibilite = () => {
  // En quittant la page : on envoie tout de suite ce qui reste. En y revenant : on regarde ce qui a changé ailleurs.
  if (document.visibilityState === "hidden") planifier(0);
  else if (Date.now() - dernierPassage > 20_000) planifier(0);
};

function arreter() {
  if (minuteur) clearTimeout(minuteur);
  if (intervalle) clearInterval(intervalle);
  window.removeEventListener(EVENEMENT_A_ENVOYER, surEcriture);
  window.removeEventListener("online", surRetourReseau);
  document.removeEventListener("visibilitychange", surVisibilite);
  demarre = false;
}

/** Lance la synchronisation pour le compte connecté (sans effet s'il n'y en a pas). */
export function demarrerSynchro() {
  if (demarre || !compteLocal()) return;
  demarre = true;
  if (lireEtat().phase === "inactif") publierEtat({ phase: "attente" });
  canal();
  window.addEventListener(EVENEMENT_A_ENVOYER, surEcriture);
  window.addEventListener("online", surRetourReseau);
  window.addEventListener("offline", () => publierEtat({ phase: "hors-ligne" }));
  document.addEventListener("visibilitychange", surVisibilite);
  intervalle = setInterval(() => {
    if (document.visibilityState === "visible") passer();
  }, 90_000);
  passer();
}
