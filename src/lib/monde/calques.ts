import { PAYS } from "./donnees";
import { decalageMinutes, formatDecalage, type LatLng } from "./geo";
import { FUSEAUX_PAYS } from "./geographie-donnees";
import { ORGANISATIONS } from "./organisations";
import type { OrganisationId, Pays } from "./types";

/*
 * Le Portulan : les calques de la carte (les pays coloriés selon un chiffre ou ce qu'ils partagent)
 * et la course du Soleil (le jour et la nuit). Aucune dépendance au DOM.
 */

export type CalqueId = "maitrise" | "aucun" | "population" | "superficie" | "monnaies" | "organisations" | "langues" | "fuseaux";

export type EntreeLegende = { couleur: string; texte: string; raye?: boolean };
export type Legende = { titre: string; entrees: EntreeLegende[]; note?: string; degrade?: { couleurs: string[]; debut: string; fin: string } };
export type Coloriage = { couleurs: Record<string, string>; rayes: string[]; legende: Legende };

export const CALQUES: readonly { id: CalqueId; nom: string }[] = [
  { id: "maitrise", nom: "Ce que je maîtrise" },
  { id: "population", nom: "Population" },
  { id: "superficie", nom: "Superficie" },
  { id: "monnaies", nom: "Monnaies partagées" },
  { id: "organisations", nom: "Organisations" },
  { id: "langues", nom: "Langues" },
  { id: "fuseaux", nom: "Fuseaux horaires" },
  { id: "aucun", nom: "Aucune couleur" },
];

/** De la plus petite valeur à la plus grande : du vélin au garance, en passant par le safran. */
export const SEQUENCE = ["#f4e7c6", "#ecd194", "#e2b462", "#d6923e", "#c06f2c", "#9d4d24", "#73301b"] as const;
/** Des teintes bien distinctes, assourdies comme des encres anciennes. */
export const PALETTE = ["#e2a246", "#5fb39b", "#6f92dc", "#c96a7c", "#9b84d2", "#c9b356", "#49afc8", "#de8160", "#8fb05c", "#b98d6b", "#d17fb5", "#7ea0a6", "#e6c37a", "#8c7fb8"] as const;
/** La couleur d'un pays mis en avant (membre d'une organisation, pays d'une langue). */
export const MIS_EN_AVANT = "#e2a246";

const fr = (n: number) => new Intl.NumberFormat("fr-FR").format(n).replace(/[  ]/g, " ");
const sur = (n: number) => `${n} pays et territoire${n > 1 ? "s" : ""}`;

/** Les n couleurs d'une échelle, prises régulièrement dans SEQUENCE. */
function echelle(n: number): string[] {
  return Array.from({ length: n }, (_, i) => SEQUENCE[Math.round((i * (SEQUENCE.length - 1)) / Math.max(1, n - 1))]);
}

/** L'indice de la classe d'une valeur (0 : sous la première borne). */
export function classeDe(x: number, bornes: readonly number[]): number {
  let i = 0;
  while (i < bornes.length && x >= bornes[i]) i++;
  return i;
}

function parClasses(titre: string, valeur: (p: Pays) => number | null, bornes: readonly number[], textes: readonly string[], note?: string): Coloriage {
  const couleurs: Record<string, string> = {};
  const teintes = echelle(textes.length);
  const compte = textes.map(() => 0);
  for (const p of PAYS) {
    const v = valeur(p);
    if (v === null || !Number.isFinite(v)) continue;
    const k = classeDe(v, bornes);
    couleurs[p.code] = teintes[k];
    compte[k]++;
  }
  return { couleurs, rayes: [], legende: { titre, entrees: textes.map((texte, i) => ({ couleur: teintes[i], texte: `${texte} (${compte[i]})` })), note } };
}

export const BORNES_POPULATION = [1e6, 5e6, 2e7, 5e7, 1e8, 3e8] as const;
export const BORNES_SUPERFICIE = [1e4, 1e5, 3e5, 1e6, 3e6] as const;

export function calquePopulation(): Coloriage {
  return parClasses(
    "Habitants",
    (p) => p.population,
    BORNES_POPULATION,
    ["moins d'un million", "1 à 5 millions", "5 à 20 millions", "20 à 50 millions", "50 à 100 millions", "100 à 300 millions", "plus de 300 millions"],
    "Les chiffres de la Banque mondiale, ou du dernier recensement.",
  );
}

export function calqueSuperficie(): Coloriage {
  return parClasses(
    "Superficie",
    (p) => p.superficie,
    BORNES_SUPERFICIE,
    ["moins de 10 000 km²", "10 000 à 100 000 km²", "100 000 à 300 000 km²", "300 000 km² à 1 million", "1 à 3 millions de km²", "plus de 3 millions de km²"],
  );
}

/* ---------- Les monnaies partagées ---------- */

/**
 * Une monnaie partagée : la première monnaie de deux pays ou territoires au moins (l'euro, le franc CFA,
 * le dollar des Caraïbes orientales…), ou celle de trois au moins quand l'un d'eux en a fait la sienne
 * (le rand, qui a cours en Eswatini, au Lesotho et en Namibie à côté de leur monnaie).
 * Le Sahara occidental, où ont cours le dirham marocain et le dinar algérien, reste sans couleur.
 */
const SANS_MONNAIE_UNIQUE = new Set(["eh"]);

export type ZoneMonnaie = { code: string; nom: string; membres: string[] };

export function zonesMonetaires(): ZoneMonnaie[] {
  const premiere = new Map<string, number>();
  const partout = new Map<string, { nom: string; membres: string[] }>();
  for (const p of PAYS) {
    if (SANS_MONNAIE_UNIQUE.has(p.code)) continue;
    p.monnaies.forEach((m, i) => {
      if (i === 0) premiere.set(m.code, (premiere.get(m.code) ?? 0) + 1);
      const z = partout.get(m.code) ?? { nom: m.nom, membres: [] };
      if (!z.membres.includes(p.code)) z.membres.push(p.code);
      partout.set(m.code, z);
    });
  }
  const zones: ZoneMonnaie[] = [];
  for (const [code, z] of partout) {
    const n1 = premiere.get(code) ?? 0;
    if (n1 >= 2 || (n1 >= 1 && z.membres.length >= 3)) zones.push({ code, nom: z.nom, membres: z.membres });
  }
  return zones.sort((a, b) => b.membres.length - a.membres.length || a.nom.localeCompare(b.nom, "fr"));
}

export function calqueMonnaies(): Coloriage {
  const zones = zonesMonetaires();
  const couleurDe = new Map(zones.map((z, i) => [z.code, PALETTE[i % PALETTE.length]]));
  const couleurs: Record<string, string> = {};
  for (const p of PAYS) {
    if (SANS_MONNAIE_UNIQUE.has(p.code)) continue;
    // La monnaie à soi d'abord si elle est partagée, sinon la plus partagée de celles qui ont cours.
    const dans = p.monnaies.filter((m) => couleurDe.has(m.code));
    if (!dans.length) continue;
    const choisie = couleurDe.has(p.monnaies[0].code) ? p.monnaies[0].code : dans.map((m) => m.code).sort((a, b) => zones.findIndex((z) => z.code === a) - zones.findIndex((z) => z.code === b))[0];
    couleurs[p.code] = couleurDe.get(choisie)!;
  }
  return {
    couleurs,
    rayes: [],
    legende: {
      titre: "Monnaies partagées",
      entrees: zones.map((z) => ({ couleur: couleurDe.get(z.code)!, texte: `${z.nom} (${z.membres.length})` })),
      note: "Une couleur par monnaie que plusieurs pays ou territoires ont en commun ; les autres pays ont la leur.",
    },
  };
}

/* ---------- Les organisations, les langues ---------- */

export function calqueOrganisation(org: OrganisationId): Coloriage {
  const membres = PAYS.filter((p) => p.orgs?.includes(org)).map((p) => p.code);
  const o = ORGANISATIONS[org];
  return {
    couleurs: Object.fromEntries(membres.map((c) => [c, MIS_EN_AVANT])),
    rayes: [],
    legende: { titre: o.nom, entrees: [{ couleur: MIS_EN_AVANT, texte: `membres (${membres.length})` }], note: o.texte },
  };
}

/** Les langues officielles les plus répandues (au moins deux pays ou territoires), de la plus présente à la moins présente. */
export function languesRepandues(): { langue: string; n: number }[] {
  const compte = new Map<string, number>();
  for (const p of PAYS) for (const l of p.langues) compte.set(l, (compte.get(l) ?? 0) + 1);
  return [...compte]
    .filter(([, n]) => n >= 2)
    .map(([langue, n]) => ({ langue, n }))
    .sort((a, b) => b.n - a.n || a.langue.localeCompare(b.langue, "fr"));
}

export function calqueLangue(langue: string): Coloriage {
  const membres = PAYS.filter((p) => p.langues.includes(langue)).map((p) => p.code);
  return {
    couleurs: Object.fromEntries(membres.map((c) => [c, MIS_EN_AVANT])),
    rayes: [],
    legende: { titre: `Le ${langue}`.replace(/^Le ([aeiouyéèêàâîôûh])/i, "L'$1"), entrees: [{ couleur: MIS_EN_AVANT, texte: `langue officielle (${sur(membres.length)})` }] },
  };
}

/* ---------- Les fuseaux horaires ---------- */

/** La couleur d'une heure : un tour du cercle des couleurs en vingt-quatre heures, l'or au temps universel. */
export function couleurHeure(minutes: number): string {
  const h = ((((minutes / 60) % 24) + 24) % 24) * 15;
  return `hsl(${Math.round((h + 40) % 360)}, 52%, 60%)`;
}

/** Les heures d'hiver d'un pays qui vit à plusieurs heures officielles (sinon : rien). */
export const fuseauxDe = (code: string): readonly number[] | undefined => FUSEAUX_PAYS[code];

export function calqueFuseaux(date: Date): Coloriage {
  const couleurs: Record<string, string> = {};
  for (const p of PAYS) if (p.fuseau) couleurs[p.code] = couleurHeure(decalageMinutes(p.fuseau, date));
  const rayes = Object.keys(FUSEAUX_PAYS).filter((c) => couleurs[c]);
  return {
    couleurs,
    rayes,
    legende: {
      titre: "L'heure de la capitale",
      entrees: [{ couleur: "transparent", texte: "rayé : plusieurs fuseaux horaires", raye: true }],
      degrade: { couleurs: Array.from({ length: 13 }, (_, i) => couleurHeure((i * 2 - 12) * 60)), debut: formatDecalage(-12 * 60), fin: formatDecalage(12 * 60) },
      note: "La couleur donne l'heure qu'il est dans la capitale en ce moment, heure d'été comprise.",
    },
  };
}

/** Le coloriage d'un calque (la maîtrise et « aucune couleur » se dessinent autrement : rien ici). */
export function coloriage(calque: CalqueId, options: { org: OrganisationId; langue: string; date: Date }): Coloriage | null {
  switch (calque) {
    case "population":
      return calquePopulation();
    case "superficie":
      return calqueSuperficie();
    case "monnaies":
      return calqueMonnaies();
    case "organisations":
      return calqueOrganisation(options.org);
    case "langues":
      return calqueLangue(options.langue);
    case "fuseaux":
      return calqueFuseaux(options.date);
    default:
      return null;
  }
}

/* ---------- Le Soleil ---------- */

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/**
 * Le point de la Terre où le Soleil est au zénith (à un dixième de degré près, d'après les formules
 * simplifiées de l'Almanach astronomique) : [latitude, longitude].
 */
export function soleilAuZenith(date: Date): LatLng {
  const n = date.getTime() / 864e5 - 10957.5; // jours depuis le 1er janvier 2000 à midi (temps universel)
  const g = rad((357.529 + 0.98560028 * n) % 360); // anomalie moyenne
  const q = (280.459 + 0.98564736 * n) % 360; // longitude moyenne
  const l = rad(q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)); // longitude écliptique
  const e = rad(23.439 - 0.00000036 * n); // obliquité de l'écliptique
  const ascension = Math.atan2(Math.cos(e) * Math.sin(l), Math.cos(l));
  const declinaison = Math.asin(Math.sin(e) * Math.sin(l));
  const sideral = (280.46061837 + 360.98564736629 * n) % 360; // temps sidéral de Greenwich, en degrés
  const lon = ((((deg(ascension) - sideral) % 360) + 540) % 360) - 180;
  return [deg(declinaison), lon];
}

/** La hauteur du Soleil au-dessus de l'horizon en un lieu, en degrés (négative la nuit). */
export function hauteurSoleil([la, lo]: LatLng, date: Date): number {
  const [sla, slo] = soleilAuZenith(date);
  const c = Math.sin(rad(la)) * Math.sin(rad(sla)) + Math.cos(rad(la)) * Math.cos(rad(sla)) * Math.cos(rad(lo - slo));
  return 90 - deg(Math.acos(Math.max(-1, Math.min(1, c))));
}

/** « jour », « aube ou crépuscule » (le Soleil à moins de 6° sous l'horizon) ou « nuit ». */
export function momentDuJour(lieu: LatLng, date: Date): "jour" | "crepuscule" | "nuit" {
  const h = hauteurSoleil(lieu, date);
  return h > 0 ? "jour" : h > -6 ? "crepuscule" : "nuit";
}

/** Les nombres en français (pour les légendes et les fiches). */
export const nombreFr = fr;
