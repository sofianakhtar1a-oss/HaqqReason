/**
 * Bloc « Atelier de logique » d'un article : données enregistrées, nettoyage, et calcul des résultats.
 * Partagé entre l'éditeur, le serveur (nettoyage) et l'affichage.
 */
import {
  analyser,
  coherence,
  ecrire,
  ErreurFormule,
  MAX_VARIABLES_TABLE,
  NOMS_MODES,
  QUANTITES,
  REGLES,
  statutFormule,
  syllogismeValide,
  tableDeVerite,
  validite,
  type Formule,
  type LigneTable,
  type Proposition,
  type Quantite,
  type Statut,
  type Valuation,
} from "./moteur";

export const GENRES_LOGIQUE = [
  { cle: "validite", libelle: "Analyse de validité", aide: "Des prémisses, une conclusion : la conclusion en découle-t-elle ?" },
  { cle: "demonstration", libelle: "Démonstration pas à pas", aide: "Chaque étape justifiée et vérifiée automatiquement" },
  { cle: "syllogisme", libelle: "Syllogisme", aide: "Deux prémisses, trois termes, une conclusion" },
  { cle: "coherence", libelle: "Test de cohérence", aide: "Ces affirmations peuvent-elles être vraies ensemble ?" },
  { cle: "verite", libelle: "Table de vérité", aide: "Toutes les situations possibles, calculées" },
] as const;
export type GenreLogique = (typeof GENRES_LOGIQUE)[number]["cle"];

export type VariableLogique = { nom: string; sens: string };
export type LigneLogique = {
  formule: string;
  texte: string;
  role: "premisse" | "conclusion" | "etape" | "affirmation" | "formule";
  regle: string;
  depuis: number[];
  source: string;
  lien: string;
  article: string;
  quantite: Quantite;
  sujet: "S" | "M" | "P";
  predicat: "S" | "M" | "P";
};
export type DonneesLogique = {
  genre: GenreLogique;
  titre: string;
  variables: VariableLogique[];
  lignes: LigneLogique[];
  termes: { S: string; M: string; P: string };
  existentielle: boolean;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const t = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").slice(0, max) : "");
const lien = (v: unknown) => {
  if (typeof v !== "string" || !v.trim()) return "";
  try {
    const u = new URL(v.trim());
    return u.protocol === "https:" || u.protocol === "http:" ? u.href.slice(0, 2000) : "";
  } catch {
    return "";
  }
};
const terme = (v: unknown): "S" | "M" | "P" => (v === "S" || v === "M" || v === "P" ? v : "S");

export function ligneVide(role: LigneLogique["role"] = "premisse"): LigneLogique {
  return { formule: "", texte: "", role, regle: role === "premisse" ? "Prémisse" : "", depuis: [], source: "", lien: "", article: "", quantite: "A", sujet: "S", predicat: "P" };
}

export function logiqueParDefaut(genre: GenreLogique = "validite"): DonneesLogique {
  const base = { genre, titre: "", variables: [] as VariableLogique[], termes: { S: "", M: "", P: "" }, existentielle: true };
  switch (genre) {
    case "validite":
      return { ...base, lignes: [ligneVide("premisse"), ligneVide("premisse"), ligneVide("conclusion")] };
    case "demonstration":
      return { ...base, lignes: [ligneVide("premisse"), ligneVide("premisse"), { ...ligneVide("etape"), regle: "Modus ponens", depuis: [0, 1] }] };
    case "syllogisme":
      return {
        ...base,
        lignes: [
          { ...ligneVide("premisse"), sujet: "M", predicat: "P" },
          { ...ligneVide("premisse"), sujet: "S", predicat: "M" },
          { ...ligneVide("conclusion"), sujet: "S", predicat: "P" },
        ],
      };
    case "coherence":
      return { ...base, lignes: [ligneVide("affirmation"), ligneVide("affirmation")] };
    case "verite":
      return { ...base, lignes: [ligneVide("formule")] };
  }
}

/** Nettoyage strict (appelé par le serveur à chaque enregistrement). */
export function nettoyerLogique(brut: unknown): DonneesLogique {
  const d = brut && typeof brut === "object" ? (brut as Record<string, unknown>) : {};
  const genre = (GENRES_LOGIQUE.some((g) => g.cle === d.genre) ? d.genre : "validite") as GenreLogique;
  const roles = ["premisse", "conclusion", "etape", "affirmation", "formule"];
  const lignes = (Array.isArray(d.lignes) ? d.lignes : []).slice(0, 40).map((l): LigneLogique => {
    const x = l && typeof l === "object" ? (l as Record<string, unknown>) : {};
    return {
      formule: t(x.formule, 500),
      texte: t(x.texte, 1000),
      role: (roles.includes(x.role as string) ? x.role : "premisse") as LigneLogique["role"],
      regle: REGLES.includes(x.regle as (typeof REGLES)[number]) ? (x.regle as string) : "",
      depuis: (Array.isArray(x.depuis) ? x.depuis : []).filter((n): n is number => Number.isInteger(n) && n >= 0 && n < 40).slice(0, 10),
      source: t(x.source, 400),
      lien: lien(x.lien),
      article: typeof x.article === "string" && UUID.test(x.article) ? x.article.toLowerCase() : "",
      quantite: (["A", "E", "I", "O"].includes(x.quantite as string) ? x.quantite : "A") as Quantite,
      sujet: terme(x.sujet),
      predicat: terme(x.predicat),
    };
  });
  const variables = (Array.isArray(d.variables) ? d.variables : []).slice(0, 14).flatMap((v): VariableLogique[] => {
    const x = v && typeof v === "object" ? (v as Record<string, unknown>) : {};
    const nom = t(x.nom, 4);
    return /^[A-Z][0-9]{0,2}$/.test(nom) ? [{ nom, sens: t(x.sens, 300) }] : [];
  });
  const tm = d.termes && typeof d.termes === "object" ? (d.termes as Record<string, unknown>) : {};
  return {
    genre,
    titre: t(d.titre, 200),
    variables,
    lignes: lignes.length > 0 ? lignes : logiqueParDefaut(genre).lignes,
    termes: { S: t(tm.S, 120), M: t(tm.M, 120), P: t(tm.P, 120) },
    existentielle: d.existentielle !== false,
  };
}

export function texteLogique(d: DonneesLogique): string {
  return [d.titre, ...d.variables.map((v) => v.sens), ...d.lignes.map((l) => l.texte), d.termes.S, d.termes.M, d.termes.P].filter(Boolean).join(" ");
}

// ----------------------------------------------------------------------
// Calcul des résultats
// ----------------------------------------------------------------------

export type AnalyseLigne = { formule: Formule | null; ecrite: string; erreur: string };
export type ResultatLogique =
  | { genre: "verite"; lignes: AnalyseLigne[]; variables: string[]; table: LigneTable[]; trop: boolean; statuts: (Statut | null)[] }
  | { genre: "validite"; lignes: AnalyseLigne[]; variables: string[]; valide: boolean | null; contreExemple?: Valuation; incoherentes: boolean }
  | { genre: "coherence"; lignes: AnalyseLigne[]; variables: string[]; coherent: boolean | null; exemple?: Valuation; conflits: number[][] }
  | { genre: "demonstration"; lignes: AnalyseLigne[]; variables: string[]; verifications: ("ok" | "faux" | "premisse" | "inconnu")[]; conclusionEtablie: boolean }
  | { genre: "syllogisme"; valide: boolean; figure: number | null; mode: string; nom: string; phrases: string[]; erreur: string };

function lire(f: string): AnalyseLigne {
  if (!f.trim()) return { formule: null, ecrite: "", erreur: "" };
  try {
    const formule = analyser(f);
    return { formule, ecrite: ecrire(formule), erreur: "" };
  } catch (e) {
    return { formule: null, ecrite: "", erreur: e instanceof ErreurFormule ? e.message : "Formule illisible." };
  }
}

function nomsDe(lignes: AnalyseLigne[]): string[] {
  const vues = new Set<string>();
  const visiter = (f: Formule) => {
    if (f.t === "var") vues.add(f.nom);
    else if (f.t === "non") visiter(f.a);
    else if (f.t !== "const") {
      visiter(f.a);
      visiter(f.b);
    }
  };
  lignes.forEach((l) => l.formule && visiter(l.formule));
  return [...vues].sort((a, b) => a.localeCompare(b, "fr", { numeric: true }));
}

export function phraseProposition(p: Proposition, termes: DonneesLogique["termes"]): string {
  const nom = (k: "S" | "M" | "P") => termes[k] || { S: "S", M: "M", P: "P" }[k];
  return (QUANTITES.find((q) => q.cle === p.quantite)?.modele ?? "").replace("{s}", nom(p.sujet)).replace("{p}", nom(p.predicat));
}

export function analyserLogique(d: DonneesLogique): ResultatLogique {
  if (d.genre === "syllogisme") {
    const [maj, min, concl] = d.lignes;
    if (!maj || !min || !concl) return { genre: "syllogisme", valide: false, figure: null, mode: "", nom: "", phrases: [], erreur: "Il faut deux prémisses et une conclusion." };
    const props = [maj, min, concl].map((l) => ({ quantite: l.quantite, sujet: l.sujet, predicat: l.predicat }));
    const phrases = props.map((p) => phraseProposition(p, d.termes));
    if (props.some((p) => p.sujet === p.predicat)) return { genre: "syllogisme", valide: false, figure: null, mode: "", nom: "", phrases, erreur: "Chaque proposition relie deux termes différents." };
    const r = syllogismeValide(props[0], props[1], props[2], d.existentielle);
    return { genre: "syllogisme", valide: r.valide, figure: r.figure, mode: r.mode, nom: r.valide && r.figure ? (NOMS_MODES[`${r.figure}-${r.mode}`] ?? "") : "", phrases, erreur: "" };
  }

  const lignes = d.lignes.map((l) => lire(l.formule));
  const variables = nomsDe(lignes);
  const formules = (filtre: (l: LigneLogique) => boolean) => d.lignes.flatMap((l, i) => (filtre(l) && lignes[i].formule ? [lignes[i].formule as Formule] : []));
  try {
    switch (d.genre) {
      case "verite": {
        const fs = lignes.map((l) => l.formule).filter((f): f is Formule => f !== null);
        const trop = variables.length > MAX_VARIABLES_TABLE;
        return { genre: "verite", lignes, variables, table: trop ? [] : tableDeVerite(fs).lignes, trop, statuts: lignes.map((l) => (l.formule ? statutFormule(l.formule) : null)) };
      }
      case "validite": {
        const premisses = formules((l) => l.role === "premisse");
        const conclusionIndex = d.lignes.findIndex((l) => l.role === "conclusion");
        const conclusion = conclusionIndex >= 0 ? lignes[conclusionIndex].formule : null;
        if (!conclusion || lignes.some((l) => l.erreur)) return { genre: "validite", lignes, variables, valide: null, incoherentes: false };
        const r = validite(premisses, conclusion);
        return { genre: "validite", lignes, variables, valide: r.valide, contreExemple: r.contreExemple, incoherentes: r.premissesIncoherentes };
      }
      case "coherence": {
        if (lignes.some((l) => l.erreur) || lignes.every((l) => !l.formule)) return { genre: "coherence", lignes, variables, coherent: null, conflits: [] };
        const indices = lignes.flatMap((l, i) => (l.formule ? [i] : []));
        const r = coherence(indices.map((i) => lignes[i].formule as Formule));
        return { genre: "coherence", lignes, variables, coherent: r.coherent, exemple: r.exemple, conflits: r.conflits.map((c) => c.map((k) => indices[k])) };
      }
      case "demonstration": {
        const verifications = d.lignes.map((l, i): "ok" | "faux" | "premisse" | "inconnu" => {
          if (l.regle === "Prémisse" || l.regle === "Hypothèse" || l.role === "premisse") return "premisse";
          const f = lignes[i].formule;
          const appuis = l.depuis.filter((k) => k < i).map((k) => lignes[k]?.formule);
          if (!f || appuis.some((a) => !a)) return "inconnu";
          return validite(appuis as Formule[], f).valide ? "ok" : "faux";
        });
        const derniere = verifications.length - 1;
        return { genre: "demonstration", lignes, variables, verifications, conclusionEtablie: derniere >= 0 && verifications.every((v) => v === "ok" || v === "premisse") && verifications[derniere] === "ok" };
      }
    }
  } catch (e) {
    const erreur = e instanceof ErreurFormule ? e.message : "Calcul impossible.";
    return { genre: "validite", lignes: lignes.map((l) => (l.erreur ? l : { ...l, erreur })), variables, valide: null, incoherentes: false };
  }
}
