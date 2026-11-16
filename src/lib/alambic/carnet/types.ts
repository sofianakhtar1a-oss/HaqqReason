/* Le Carnet de L'Alambic : vocabulaire commun (navigateur, serveur, tests). */

export type TypeSource = "pdf" | "word" | "texte" | "markdown" | "csv" | "audio" | "video" | "youtube";

/** Unité extraite d'une source, avec son repère : une page, un instant, ou une ligne de tableau. */
export type Segment = { texte: string; page?: number; t?: number; ligne?: number };

/** Morceau indexé : quelques centaines de mots, coupés aux paragraphes et aux phrases. */
export type Morceau = {
  id: string;
  source: string;
  ordre: number;
  texte: string;
  page?: number;
  t?: number;
  ligne?: number;
  jetons: number;
  vecteur?: number[];
};

export type Source = {
  id: string;
  nom: string;
  type: TypeSource;
  ajouteLe: number;
  active: boolean;
  etat: "attente" | "analyse" | "pret" | "erreur";
  progression?: number;
  erreur?: string;
  nbMorceaux: number;
  jetons: number;
  /** Pages réelles (PDF) ou estimées (Word, texte : 3 000 signes par page). */
  pages?: number;
  pagesEstimees?: boolean;
  duree?: number;
  youtube?: string;
  langue?: string;
};

export type Message = { id: string; role: "utilisateur" | "assistant"; texte: string; action?: Action; creeLe: number; erreur?: boolean };

export type Carnet = { id: string; titre: string; creeLe: number; majLe: number; sources: Source[]; messages: Message[] };

export type Action = "synthese" | "divergences" | "glossaire" | "questions";

export const ACTIONS: { id: Action; nom: string; aide: string }[] = [
  { id: "synthese", nom: "Synthèse exhaustive", aide: "Tout ce que disent les sources, structuré" },
  { id: "divergences", nom: "Points de divergence", aide: "Désaccords, nuances et contradictions" },
  { id: "glossaire", nom: "Glossaire", aide: "Les termes clés, définis par les sources" },
  { id: "questions", nom: "Questions d'approfondissement", aide: "Pour creuser plus loin" },
];

/** Extrait envoyé au serveur : le texte et la référence exacte que le modèle doit recopier. */
export type Extrait = { ref: string; source: string; texte: string };

export const estMedia = (t: TypeSource) => t === "audio" || t === "video" || t === "youtube";

/** Estimation prudente du nombre de jetons (l'arabe en compte davantage). */
export function jetons(texte: string): number {
  const arabe = (texte.match(/[؀-ۿ]/g) ?? []).length;
  return Math.ceil((texte.length - arabe) / 3.8 + arabe / 2.2);
}

export function minutage(s: number): string {
  const total = Math.max(0, Math.floor(s));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = String(total % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

/** Nom affiché dans les citations, sans extension pour les vidéos. */
export function referenceDe(s: Pick<Source, "nom" | "type" | "pagesEstimees">, m: Pick<Morceau, "page" | "t" | "ligne">): string {
  if (s.type === "youtube") return `[Vidéo YouTube - ${s.nom}, ${minutage(m.t ?? 0)}]`;
  if (s.type === "audio" || s.type === "video") return `[${s.nom}, ${minutage(m.t ?? 0)}]`;
  if (s.type === "csv") return `[${s.nom}, ligne ${m.ligne ?? 1}]`;
  return `[${s.nom}, p. ${m.page ?? 1}]`;
}
