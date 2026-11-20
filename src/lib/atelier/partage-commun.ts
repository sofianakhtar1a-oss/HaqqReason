/*
 * Le Calame — l'écriture à plusieurs : ce que le navigateur et le serveur partagent (types, rôles,
 * limites, couleurs, mesure de l'historique). Module pur, testé.
 */

export type RolePartage = "lecture" | "commentaire" | "ecriture";
/** Mon rôle dans un document partagé : celui qu'on m'a donné, ou propriétaire. */
export type MonRole = RolePartage | "proprietaire";

export const ROLES_PARTAGE: { cle: RolePartage; libelle: string; aide: string }[] = [
  { cle: "lecture", libelle: "Lecture", aide: "lit le texte et voit les changements en direct." },
  { cle: "commentaire", libelle: "Relecture", aide: "commente dans la marge et propose des changements, que tu acceptes ou refuses." },
  { cle: "ecriture", libelle: "Écriture", aide: "écrit avec toi, en même temps." },
];

export const libelleRole = (r: MonRole): string => (r === "proprietaire" ? "Propriétaire" : (ROLES_PARTAGE.find((x) => x.cle === r)?.libelle ?? r));

export const LIMITES_PARTAGE = {
  /** Le texte de départ d'un document partagé (JSON), comme un document du compte. */
  poidsBase: 3_000_000,
  /** Un envoi de changements. */
  poidsEnvoi: 2_000_000,
  pasParEnvoi: 2_000,
  /** Personnes invitées, en plus du propriétaire. */
  membres: 30,
  /** Un curseur sans nouvelles depuis ce délai n'est plus montré. */
  presenceMs: 45_000,
} as const;

export type MembrePartage = { compte: string; nom: string; role: RolePartage; ajoute: string };

/** Une copie remise à l'enseignant d'une classe du Portulan. */
export type RemiseCopie = {
  classe: string;
  nomClasse: string;
  enseignant: string;
  nomEnseignant: string;
  etat: "remise" | "rendue";
  remiseLe: string;
  rendueLe: string | null;
};

export type MetaPartage = {
  id: string;
  proprietaire: string;
  nomProprietaire: string;
  titre: string;
  membres: MembrePartage[];
  remise: RemiseCopie | null;
  cree: string;
  maj: string;
};

/** Ce que la liste « Partagés avec moi » montre d'un partage. */
export type ResumePartage = { id: string; titre: string; role: MonRole; nomProprietaire: string; membres: number; remise: RemiseCopie | null; maj: string };

/** Qui est là, et où est son curseur (positions dans sa propre version du texte). */
export type Presence = { compte: string; nom: string; couleur: string; client: number; de: number; a: number; quand: number };

/** Un lot de changements, tel que l'historique le montre. */
export type LigneHistorique = { debut: number; compte: string; nom: string; quand: string; pas: number; ajouts: number; retraits: number; marques: number };

export const COULEURS_PRESENCE = ["#2563eb", "#db2777", "#16a34a", "#ea580c", "#7c3aed", "#0891b2", "#ca8a04", "#dc2626"] as const;

/** Une couleur stable par compte (curseur, pastille, auteur d'une suggestion). */
export function couleurDe(compte: string): string {
  let h = 0;
  for (let i = 0; i < compte.length; i++) h = (h * 31 + compte.charCodeAt(i)) >>> 0;
  return COULEURS_PRESENCE[h % COULEURS_PRESENCE.length];
}

/** Ce que pèsent des changements (étapes ProseMirror en JSON) : signes ajoutés, retirés, et mises en forme. */
export function mesurerPas(pas: unknown[]): { ajouts: number; retraits: number; marques: number } {
  let ajouts = 0;
  let retraits = 0;
  let marques = 0;
  const texteDe = (n: unknown): number => {
    if (!n || typeof n !== "object") return 0;
    const o = n as { text?: unknown; content?: unknown[] };
    return (typeof o.text === "string" ? o.text.length : 0) + (Array.isArray(o.content) ? o.content.reduce<number>((s, x) => s + texteDe(x), 0) : 0);
  };
  for (const p of pas) {
    const s = (p ?? {}) as { stepType?: string; from?: number; to?: number; slice?: { content?: unknown[] } };
    if (s.stepType === "replace" || s.stepType === "replaceAround") {
      if (s.stepType === "replace" && typeof s.from === "number" && typeof s.to === "number" && s.to > s.from) retraits += s.to - s.from;
      ajouts += Array.isArray(s.slice?.content) ? s.slice.content.reduce<number>((t, x) => t + texteDe(x), 0) : 0;
    } else if (s.stepType === "addMark" || s.stepType === "removeMark" || s.stepType === "addNodeMark" || s.stepType === "removeNodeMark" || s.stepType === "attr") marques++;
  }
  return { ajouts, retraits, marques };
}

export type GroupeHistorique = { compte: string; nom: string; debut: string; fin: string; lots: number; ajouts: number; retraits: number; marques: number };

/**
 * L'historique lisible : les lots d'une même personne, à moins de dix minutes d'écart, forment une
 * seule ligne (« Sofian, 14 h 02 → 14 h 20, +830 signes »). Les lots arrivent du plus récent au plus ancien.
 */
export function regrouperHistorique(lignes: LigneHistorique[], ecartMs = 10 * 60_000): GroupeHistorique[] {
  const groupes: GroupeHistorique[] = [];
  const tries = [...lignes].sort((a, b) => b.debut - a.debut);
  for (const l of tries) {
    const g = groupes[groupes.length - 1];
    const quand = Date.parse(l.quand);
    if (g && g.compte === l.compte && Date.parse(g.debut) - quand <= ecartMs) {
      g.debut = l.quand;
      g.lots++;
      g.ajouts += l.ajouts;
      g.retraits += l.retraits;
      g.marques += l.marques;
    } else groupes.push({ compte: l.compte, nom: l.nom, debut: l.quand, fin: l.quand, lots: 1, ajouts: l.ajouts, retraits: l.retraits, marques: l.marques });
  }
  return groupes;
}
