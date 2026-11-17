/*
 * Le compte connecté, vu du navigateur.
 *
 * Le serveur inscrit l'identifiant du compte sur la balise <html> (attribut data-compte) :
 * il est donc connu dès le premier affichage, sans requête.
 *
 * Chaque compte a ses propres tiroirs sur l'appareil (bases IndexedDB et clés localStorage),
 * pour que deux personnes qui partagent un ordinateur ne voient jamais les documents l'une de l'autre.
 * Le premier compte qui se connecte sur un appareil hérite des tiroirs « sans nom » : ce sont ceux
 * qui existaient avant les comptes, et son travail d'avant y est déjà. Les comptes suivants
 * reçoivent des tiroirs à leur nom.
 */

const CLE_PROPRIETAIRE = "haqqreason-proprietaire";

export type CompteLocal = { id: string; nom: string; email: string };

/** Le compte connecté, ou null (visiteur, ou connexion Google pas encore réglée). */
export function compteLocal(): CompteLocal | null {
  if (typeof document === "undefined") return null;
  const d = document.documentElement.dataset;
  return d.compte ? { id: d.compte, nom: d.compteNom ?? "", email: d.compteEmail ?? "" } : null;
}

/** Vrai si le site propose la connexion (réglée sur le serveur). */
export function comptesActifs(): boolean {
  return typeof document !== "undefined" && document.documentElement.dataset.comptes === "1";
}

let suffixeConnu: string | null = null;

/** Ce qui distingue les tiroirs de ce compte sur l'appareil : rien pour le premier compte, « ::identifiant » ensuite. */
export function suffixeCompte(): string {
  if (suffixeConnu !== null) return suffixeConnu;
  const compte = compteLocal();
  if (!compte) return (suffixeConnu = "");
  let proprietaire: string | null = null;
  try {
    proprietaire = window.localStorage.getItem(CLE_PROPRIETAIRE);
    if (!proprietaire) {
      window.localStorage.setItem(CLE_PROPRIETAIRE, compte.id);
      proprietaire = compte.id;
    }
  } catch {
    // Stockage indisponible : tout vit le temps de la visite, il n'y a rien à cloisonner.
    proprietaire = compte.id;
  }
  return (suffixeConnu = proprietaire === compte.id ? "" : `::${compte.id}`);
}

/** Nom d'une base IndexedDB ou d'une clé localStorage pour le compte en cours. */
export function tiroir(nom: string): string {
  return `${nom}${suffixeCompte()}`;
}
