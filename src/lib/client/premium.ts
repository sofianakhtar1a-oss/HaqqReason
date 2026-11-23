
import type { DroitsPublics } from "@/lib/premium/droits";

/*
 * L'offre Premium, vue du navigateur (sans React : ce fichier peut être importé partout ; le crochet
 * React est dans use-premium.ts). Le serveur décide de tout ; ici on ne fait que :
 *   • savoir tout de suite (attributs de <html>) si l'offre est en service et si la personne est abonnée ;
 *   • demander au serveur ce qu'il reste d'essais gratuits ;
 *   • demander au serveur la permission avant une utilisation limitée (il compte, il répond) ;
 *   • ouvrir la fenêtre Premium quand la réponse est non.
 */

export type DroitsClient = DroitsPublics;
export type RaisonRefus = "premium" | "limite" | "compte";
export type DemandePremium = { fonction?: string; raison: RaisonRefus; limite?: number; periode?: string; remise?: string };
export const EVENEMENT_PREMIUM = "haqqreason:premium";

const attribut = (nom: string) => (typeof document === "undefined" ? undefined : document.documentElement.dataset[nom]);

/** L'offre payante est en service sur le site. */
export function offreEnService(): boolean {
  return attribut("offre") === "1";
}

/** Abonné (ou accès offert), ou le créateur dans son espace : tout est ouvert. */
export function toutEstOuvert(): boolean {
  if (!offreEnService()) return true;
  const p = attribut("premium");
  return p === "1" || p === "createur";
}

/** Abonné Premium (pour le badge doré) : vrai même si l'offre a été éteinte depuis. */
export function estAbonne(): boolean {
  return attribut("premium") === "1";
}

/** Prévient quand la page change d'état Premium (après un paiement, la page se met à jour d'elle-même). */
export function abonnerPremium(f: () => void): () => void {
  if (typeof MutationObserver === "undefined" || typeof document === "undefined") return () => undefined;
  const o = new MutationObserver(f);
  o.observe(document.documentElement, { attributes: true, attributeFilter: ["data-premium", "data-offre"] });
  return () => o.disconnect();
}

/* ---------- Ce que le serveur a répondu, partagé par toute la page ---------- */

export type EtatDroits = { droits: DroitsClient | null; pret: boolean };
let etat: EtatDroits = { droits: null, pret: false };
let enCours: Promise<void> | null = null;
let chargeLe = 0;
const abonnes = new Set<() => void>();
const prevenir = () => abonnes.forEach((f) => f());

export function abonnerDroits(f: () => void): () => void {
  abonnes.add(f);
  return () => abonnes.delete(f);
}

export function lireDroits(): EtatDroits {
  return etat;
}

export function rechargerDroits(force = false): Promise<void> {
  if (toutEstOuvert()) {
    if (!etat.pret) {
      etat = { droits: null, pret: true };
      prevenir();
    }
    return Promise.resolve();
  }
  if (!force && enCours) return enCours;
  if (!force && etat.pret && Date.now() - chargeLe < 30_000) return Promise.resolve();
  enCours = (async () => {
    try {
      const r = await fetch("/api/premium/droits", { credentials: "same-origin", cache: "no-store" });
      if (r.ok) {
        etat = { droits: (await r.json()) as DroitsClient, pret: true };
        chargeLe = Date.now();
      } else etat = { ...etat, pret: true };
    } catch {
      etat = { ...etat, pret: true };
    } finally {
      enCours = null;
      prevenir();
    }
  })();
  return enCours;
}

export type EtatAcces = { etat: "libre" } | { etat: "premium" } | { etat: "limite"; reste: number; limite: number; periode: string; remise: string } | { etat: "epuise"; limite: number; periode: string; remise: string };

/** Ce qu'il faut afficher pour une partie (cadenas, essais restants) : un simple reflet de la réponse du serveur. */
export function accesDe(droits: DroitsClient | null, fonction: string): EtatAcces {
  if (!droits || !droits.offre || droits.premium || droits.createur) return { etat: "libre" };
  const f = droits.fonctions[fonction];
  if (!f) return { etat: "libre" };
  if (f.acces === "premium") return { etat: "premium" };
  const reste = Math.max(0, f.limite - f.utilise);
  return reste > 0 ? { etat: "limite", reste, limite: f.limite, periode: f.periode, remise: f.remise } : { etat: "epuise", limite: f.limite, periode: f.periode, remise: f.remise };
}

export function ouvrirFenetrePremium(demande: DemandePremium): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<DemandePremium>(EVENEMENT_PREMIUM, { detail: demande }));
}

/**
 * Avant une utilisation : « puis-je ? ». Le serveur compte si la partie est limitée. Non : la fenêtre
 * Premium s'ouvre et la réponse est false. Sans réseau, on laisse faire (l'outil travaille sur l'appareil).
 */
const enVol = new Map<string, Promise<boolean>>();

export function utiliser(fonction: string, element?: string): Promise<boolean> {
  if (toutEstOuvert()) return Promise.resolve(true);
  // Les droits sont déjà connus et cette partie est gratuite pour la personne : rien à demander.
  if (etat.droits && Date.now() - chargeLe < 60_000 && !(fonction in etat.droits.fonctions) && etat.droits.offre) return Promise.resolve(true);
  // Un double clic ne compte qu'une fois : la même demande en cours sert aux deux.
  const cle = `${fonction}|${element ?? ""}`;
  const deja = enVol.get(cle);
  if (deja) return deja;
  const p = demanderUtilisation(fonction, element).finally(() => enVol.delete(cle));
  enVol.set(cle, p);
  return p;
}

async function demanderUtilisation(fonction: string, element?: string): Promise<boolean> {
  try {
    const r = await fetch("/api/premium/utiliser", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fonction, element }),
    });
    if (!r.ok) return true;
    const v = (await r.json()) as { ok: boolean; raison?: RaisonRefus; utilise?: number; limite?: number; periode?: string; remise?: string };
    if (v.ok) {
      const f = etat.droits?.fonctions[fonction];
      if (f && typeof v.utilise === "number") {
        etat = { ...etat, droits: etat.droits && { ...etat.droits, fonctions: { ...etat.droits.fonctions, [fonction]: { ...f, utilise: v.utilise } } } };
        prevenir();
      }
      return true;
    }
    ouvrirFenetrePremium({ fonction, raison: v.raison ?? "premium", limite: v.limite, periode: v.periode, remise: v.remise });
    void rechargerDroits(true);
    return false;
  } catch {
    return true;
  }
}

/**
 * Une réponse du serveur qui refuse un contenu réservé (histoire, dictée…) : la fenêtre Premium s'ouvre.
 * Renvoie true si c'était bien un refus Premium.
 */
export async function refusPremium(reponse: Response, fonction?: string): Promise<boolean> {
  if (reponse.status !== 402) return false;
  try {
    const v = (await reponse.clone().json()) as { raison?: RaisonRefus; limite?: number; periode?: string; remise?: string; fonction?: string };
    ouvrirFenetrePremium({ fonction: v.fonction ?? fonction, raison: v.raison ?? "premium", limite: v.limite, periode: v.periode, remise: v.remise });
  } catch {
    ouvrirFenetrePremium({ fonction, raison: "premium" });
  }
  void rechargerDroits(true);
  return true;
}
