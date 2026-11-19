import { PAYS } from "./donnees";
import type { Pays } from "./types";

/*
 * Les pages publiques du Portulan (ouvertes sans compte, pour les moteurs de recherche et les
 * aperçus de liens) : /monde/pays, une page par pays, et les invitations /monde/rejoindre/…
 */

/** « Côte d'Ivoire » → « cote-d-ivoire » ; un même nom pour deux entités prend le code en plus. */
function slugBrut(nom: string): string {
  return nom
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const SLUGS = new Map<string, string>();
const PAR_SLUG = new Map<string, Pays>();
{
  const comptes = new Map<string, number>();
  for (const p of PAYS) comptes.set(slugBrut(p.nom), (comptes.get(slugBrut(p.nom)) ?? 0) + 1);
  for (const p of PAYS) {
    const s = (comptes.get(slugBrut(p.nom)) ?? 0) > 1 ? `${slugBrut(p.nom)}-${p.code}` : slugBrut(p.nom);
    SLUGS.set(p.code, s);
    PAR_SLUG.set(s, p);
  }
}

export const slugDe = (p: Pays): string => SLUGS.get(p.code) ?? p.code;
export const paysDuSlug = (slug: string): Pays | undefined => PAR_SLUG.get(slug);
export const adressePays = (p: Pays): string => `/monde/pays/${slugDe(p)}`;

/** Les invitations qu'on partage : un duel, un salon, un ami, une classe. */
export const SORTES_INVITATION = ["duel", "salon", "ami", "classe"] as const;
export type SorteInvitation = (typeof SORTES_INVITATION)[number];
export const estSorteInvitation = (x: string): x is SorteInvitation => (SORTES_INVITATION as readonly string[]).includes(x);
/** Six caractères pour un duel, un salon, une classe ; huit pour un code ami. */
export const codeInvitationValide = (sorte: SorteInvitation, code: string): boolean => (sorte === "ami" ? /^[A-Z2-9]{8}$/ : /^[A-Z2-9]{6}$/).test(code);
/** Où l'invitation mène dans le Portulan (le fragment que lit l'onglet Duels). */
export const fragmentInvitation = (sorte: SorteInvitation, code: string): string => `#duels/${sorte}=${code}`;
export const adresseInvitation = (sorte: SorteInvitation, code: string): string => `/monde/rejoindre/${sorte}/${code}`;
