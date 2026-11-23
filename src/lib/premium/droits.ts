import "server-only";
import { compteCourant } from "@/lib/compte/session";
import type { Compte } from "@/lib/compte/jeton";
import { sessionCreateurVisible } from "@/lib/session";
import { dbAdmin } from "@/lib/supabase";
import { type Abonnement, abonnementActif, abonnementEnCache, aReverifier, synchroniserAbonnement } from "./abonnements";
import { accesOffert, clePeriode, type ConfigPremium, FONCTIONS, PAR_ID, type Regle, regleEffective, remiseLisible } from "./catalogue";
import { lireConfigPremium, offreActive, tablesPremium } from "./config";

/*
 * Qui a droit à quoi. C'est ici, sur le serveur, que tout se décide : le navigateur reçoit le
 * résultat, il ne le calcule jamais lui-même.
 */

export type SourcePremium = "abonnement" | "offert" | "createur";

export type Contexte = {
  config: ConfigPremium;
  offre: boolean;
  compte: Compte | null;
  createur: boolean;
  premium: boolean;
  source: SourcePremium | null;
  abonnement: Abonnement | null;
  /** Date de fin d'un accès offert (null : sans fin). */
  offertJusqu: string | null;
  /** La base n'a pas répondu : on laisse passer, sans pour autant afficher de badge. */
  incertain: boolean;
};

export async function contextePremium(compteConnu?: Compte | null): Promise<Contexte> {
  const config = await lireConfigPremium();
  const [offre, compte, createur] = await Promise.all([offreActive(config), compteConnu === undefined ? compteCourant() : Promise.resolve(compteConnu), sessionCreateurVisible().then(Boolean)]);
  let abonnement: Abonnement | null = null;
  let premium = false;
  let source: SourcePremium | null = null;
  let offertJusqu: string | null = null;
  let incertain = false;
  // Sans la migration 021, il n'y a pas d'abonnements à lire (et l'offre ne peut pas être en service).
  if (compte && (await tablesPremium())) {
    let a = await abonnementEnCache(compte.id);
    if (a === "indisponible") {
      // Base injoignable : on ne ferme pas la porte à un abonné qui a payé.
      incertain = true;
      a = null;
    } else if (a && aReverifier(a)) {
      // La période payée est finie et aucun renouvellement n'est arrivé : on redemande à Stripe.
      try {
        await synchroniserAbonnement(a.stripe_abonnement as string);
        const relu = await abonnementEnCache(compte.id);
        a = relu === "indisponible" ? a : relu;
      } catch {
        // Stripe injoignable : on garde l'état connu (avec sa marge de trois jours).
      }
    }
    abonnement = a;
    if (abonnementActif(a)) {
      premium = true;
      source = "abonnement";
    }
  }
  if (compte && !premium) {
    const o = accesOffert(config, compte.email);
    if (o) {
      premium = true;
      source = "offert";
      offertJusqu = o.jusqu;
    }
  }
  if (createur && !premium) source = "createur";
  return { config, offre, compte, createur, premium, source, abonnement, offertJusqu, incertain };
}

/** Tout est ouvert : offre éteinte, créateur dans son espace, abonné, ou base injoignable. */
export function toutOuvert(ctx: Contexte): boolean {
  return !ctx.offre || ctx.createur || ctx.premium || ctx.incertain;
}

/* ---------- Les compteurs ---------- */

type LigneUsage = { fonction: string; periode: string; element: string; nombre: number };

/** Ce que le compte a déjà utilisé, pour chaque partie limitée, dans la période en cours. */
export async function usagesDuCompte(compte: string, config: ConfigPremium, maintenant = new Date()): Promise<Record<string, number>> {
  const sortie: Record<string, number> = {};
  const { data, error } = await dbAdmin().from("usages_premium").select("fonction, periode, element, nombre").eq("compte", compte).limit(2000);
  if (error) return sortie;
  for (const l of (data ?? []) as LigneUsage[]) {
    const f = PAR_ID.get(l.fonction);
    if (!f) continue;
    const r = regleEffective(config, f.id);
    if (r.acces !== "limite" || l.periode !== clePeriode(r.periode, maintenant)) continue;
    const ajout = f.distinct ? (l.element ? 1 : 0) : l.element ? 0 : l.nombre;
    sortie[f.id] = (sortie[f.id] ?? 0) + ajout;
  }
  return sortie;
}

export type Refus = "premium" | "limite" | "compte";
export type Verdict = { ok: true; utilise?: number; limite?: number; deja?: boolean } | { ok: false; raison: Refus; utilise?: number; limite?: number; periode?: Regle["periode"]; remise?: string };

const ELEMENT = /^[A-Za-z0-9._:/-]{1,120}$/;

/** Nettoie l'objet compté (une histoire, une dictée…) : rien d'autre que des caractères sûrs. */
export function elementPropre(e: unknown): string {
  return typeof e === "string" && ELEMENT.test(e) ? e : "";
}

/**
 * Compte une utilisation si la partie est limitée (la base refuse au-delà de la limite, même si deux
 * demandes arrivent en même temps). Les parties gratuites passent sans rien compter ; les parties
 * Premium ne passent que pour les abonnés.
 */
export async function consommer(ctx: Contexte, fonction: string, element = "", maintenant = new Date()): Promise<Verdict> {
  const f = PAR_ID.get(fonction);
  if (!f) return { ok: false, raison: "premium" };
  if (toutOuvert(ctx)) return { ok: true };
  const r: Regle = regleEffective(ctx.config, f.id);
  if (r.acces === "libre") return { ok: true };
  if (r.acces === "premium") return { ok: false, raison: "premium" };
  if (!ctx.compte) return { ok: false, raison: "compte", limite: r.limite, periode: r.periode };
  // Une partie « distincte » compte des objets : sans nom lisible, l'objet est le même pour tous les appels.
  const el = f.distinct ? elementPropre(element) || "sans-nom" : "";
  const { data, error } = await dbAdmin().rpc("premium_consommer", { p_compte: ctx.compte.id, p_fonction: f.id, p_periode: clePeriode(r.periode, maintenant), p_limite: r.limite, p_element: el });
  // Compteur injoignable : on laisse passer plutôt que de bloquer un essai gratuit à tort.
  if (error || !data) return { ok: true };
  const d = data as { ok: boolean; utilise: number; deja: boolean };
  if (d.ok) return { ok: true, utilise: d.utilise, limite: r.limite, deja: d.deja };
  return { ok: false, raison: "limite", utilise: d.utilise, limite: r.limite, periode: r.periode, remise: remiseLisible(r.periode, maintenant) };
}

/** Sans rien compter : la partie serait-elle ouverte ? (pour afficher un cadenas à l'avance) */
export function regleAffichee(ctx: Contexte, fonction: string): Regle {
  return toutOuvert(ctx) ? { acces: "libre", limite: 0, periode: "mois" } : regleEffective(ctx.config, fonction);
}

/* ---------- Ce que le navigateur reçoit ---------- */

export type DroitsPublics = {
  offre: boolean;
  premium: boolean;
  createur: boolean;
  connecte: boolean;
  source: SourcePremium | null;
  abonnement: { formule: "mois" | "annee" | null; fin: string | null; resiliation: boolean; statut: string } | null;
  offertJusqu: string | null;
  prix: { mois: number; annee: number; essaiJours: number };
  /** Seulement les parties qui ne sont pas gratuites pour cette personne. */
  fonctions: Record<string, { acces: "premium" | "limite"; limite: number; periode: Regle["periode"]; utilise: number; remise: string }>;
};

export async function droitsPublics(ctx: Contexte, maintenant = new Date()): Promise<DroitsPublics> {
  const fonctions: DroitsPublics["fonctions"] = {};
  if (!toutOuvert(ctx)) {
    const usages = ctx.compte ? await usagesDuCompte(ctx.compte.id, ctx.config, maintenant) : {};
    for (const f of FONCTIONS) {
      const r = regleEffective(ctx.config, f.id);
      if (r.acces === "libre") continue;
      fonctions[f.id] = { acces: r.acces, limite: r.limite, periode: r.periode, utilise: usages[f.id] ?? 0, remise: remiseLisible(r.periode, maintenant) };
    }
  }
  const a = ctx.abonnement;
  return {
    offre: ctx.offre,
    premium: ctx.premium,
    createur: ctx.createur,
    connecte: Boolean(ctx.compte),
    source: ctx.source,
    abonnement: a && a.statut !== "aucun" ? { formule: a.formule, fin: a.fin_periode, resiliation: a.resiliation_fin_periode, statut: a.statut } : null,
    offertJusqu: ctx.offertJusqu,
    prix: { mois: ctx.config.prixMois, annee: ctx.config.prixAnnee, essaiJours: ctx.config.essaiJours },
    fonctions,
  };
}
