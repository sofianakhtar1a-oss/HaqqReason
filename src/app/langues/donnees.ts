"use client";

/*
 * L'état du Truchement, partagé par tous les écrans : cartes de révision, dictionnaire et journal.
 * Chargé une fois depuis l'appareil, tenu en mémoire, et réécrit à chaque changement.
 */
import { useSyncExternalStore } from "react";
import { EVENEMENT_RECU } from "@/lib/client/synchro/journal";
import { cleJour, nouvelleCarte, reviser, serie } from "@/lib/langues/srs";
import { effacer, ecrire, type Jour, tout } from "@/lib/langues/stockage";
import type { Carte, MotPerso, Note } from "@/lib/langues/types";

export type Etat = {
  pret: boolean;
  erreur: string | null;
  cartes: Map<string, Carte>;
  mots: MotPerso[];
  journal: Map<string, Jour>;
};

let etat: Etat = { pret: false, erreur: null, cartes: new Map(), mots: [], journal: new Map() };
const abonnes = new Set<() => void>();
const SERVEUR: Etat = etat;

function publier(maj: Partial<Etat>) {
  etat = { ...etat, ...maj };
  abonnes.forEach((cb) => cb());
}

let chargement: Promise<void> | null = null;
export function charger(force = false) {
  if (chargement && !force) return chargement;
  chargement = (async () => {
    try {
      const [cartes, mots, journal] = await Promise.all([tout<Carte>("cartes"), tout<MotPerso>("dictionnaire"), tout<Jour>("journal")]);
      publier({
        pret: true,
        erreur: null,
        cartes: new Map(cartes.map((c) => [c.id, c])),
        mots: mots.sort((a, b) => b.ajouteLe - a.ajouteLe),
        journal: new Map(journal.map((j) => [j.jour, j])),
      });
    } catch (e) {
      publier({ pret: true, erreur: e instanceof Error ? e.message : "Le stockage de l'appareil est indisponible." });
    }
  })();
  return chargement;
}

/** Des cartes, des mots ou des jours d'étude arrivent d'un autre appareil : on relit l'appareil. */
let aLEcoute = false;
function ecouterLeCompte() {
  if (aLEcoute || typeof window === "undefined") return;
  aLEcoute = true;
  window.addEventListener(EVENEMENT_RECU, (e) => {
    const magasins = (e as CustomEvent<string[]>).detail;
    if (Array.isArray(magasins) && magasins.some((m) => m === "langues-cartes" || m === "langues-dictionnaire" || m === "langues-journal")) void charger(true);
  });
}

function abonner(cb: () => void) {
  abonnes.add(cb);
  ecouterLeCompte();
  void charger();
  return () => {
    abonnes.delete(cb);
  };
}

export function useDonnees(): Etat {
  return useSyncExternalStore(
    abonner,
    () => etat,
    () => SERVEUR,
  );
}

const silencieux = (p: Promise<unknown>) => void p.catch(() => publier({ erreur: "Une écriture sur l'appareil a échoué (espace plein ?)." }));

/** Une réponse notée : la carte avance, et la journée est comptée. */
export function noter(id: string, note: Note, maintenant = Date.now()) {
  const avant = etat.cartes.get(id);
  const carte = reviser(avant ?? nouvelleCarte(id, maintenant), note, maintenant);
  const cartes = new Map(etat.cartes);
  cartes.set(id, carte);
  const jour = cleJour(maintenant);
  const j = etat.journal.get(jour) ?? { jour, revues: 0, justes: 0, nouveaux: 0 };
  const nj = { ...j, revues: j.revues + 1, justes: j.justes + (note >= 3 ? 1 : 0), nouveaux: j.nouveaux + (!avant || avant.etat === "nouveau" ? 1 : 0) };
  const journal = new Map(etat.journal);
  journal.set(jour, nj);
  publier({ cartes, journal });
  silencieux(ecrire("cartes", carte));
  silencieux(ecrire("journal", nj));
  return carte;
}

/** Remet un mot à zéro (« je veux le réapprendre »). */
export function oublierCarte(id: string) {
  const cartes = new Map(etat.cartes);
  cartes.delete(id);
  publier({ cartes });
  silencieux(effacer("cartes", id));
}

export function ajouterMot(m: MotPerso) {
  const existant = etat.mots.find((x) => x.id === m.id);
  // Un mot déjà présent garde sa date et son origine ; on complète ce qui manque.
  const fusion: MotPerso = existant ? { ...existant, fr: m.fr || existant.fr, phrase: existant.phrase ?? m.phrase, phraseFr: existant.phraseFr ?? m.phraseFr, forme: existant.forme ?? m.forme, nature: existant.nature ?? m.nature } : m;
  publier({ mots: [fusion, ...etat.mots.filter((x) => x.id !== m.id)] });
  silencieux(ecrire("dictionnaire", fusion));
  return { mot: fusion, deja: Boolean(existant) };
}

export function modifierMot(m: MotPerso) {
  publier({ mots: etat.mots.map((x) => (x.id === m.id ? m : x)) });
  silencieux(ecrire("dictionnaire", m));
}

export function supprimerMot(id: string) {
  publier({ mots: etat.mots.filter((x) => x.id !== id) });
  silencieux(effacer("dictionnaire", id));
  oublierCarte(id);
}

export const dansDictionnaire = (id: string) => etat.mots.some((m) => m.id === id);

/* ---------- Le journal ---------- */

export const OBJECTIF_JOUR = 20;

export function resumeJournal(journal: Map<string, Jour>, maintenant = Date.now()) {
  const auj = cleJour(maintenant);
  const actifs = [...journal.values()].filter((j) => j.revues > 0).map((j) => j.jour);
  const semaine = Array.from({ length: 7 }, (_, i) => {
    const t = maintenant - (6 - i) * 86_400_000;
    const cle = cleJour(t);
    return { cle, jour: new Date(t), revues: journal.get(cle)?.revues ?? 0 };
  });
  const totalRevues = [...journal.values()].reduce((s, j) => s + j.revues, 0);
  return { serie: serie(actifs, auj), aujourdhui: journal.get(auj)?.revues ?? 0, semaine, totalRevues, joursActifs: actifs.length };
}
