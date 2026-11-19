import "server-only";
import { dbAdmin } from "@/lib/supabase";
import { PAR_CODE } from "./atlas";
import { PAYS } from "./donnees";
import { TYPES, type TypeQuestion } from "./categories";
import { estChampFiche, type ChampFiche, type EditionPortulan, type FichesEditees, MESURES_VITESSE, type MesureVitesse, type Nouveaute, type PaysChoisis, type Populations } from "./edition";

/*
 * L'atelier du Portulan, côté serveur : ce que le créateur règle sans toucher au code.
 *
 * Rangé dans la table « reglages » (lecture et écriture réservées au serveur, sans migration) :
 *   portulan_fiches       les corrections des fiches (devise, hymne, anecdote…) ;
 *   portulan_jour         les pays du jour choisis à la main, avec leur anecdote ;
 *   portulan_population   la population de la Banque mondiale, mise à jour chaque année ;
 *   portulan_nouveautes   le « Quoi de neuf » montré aux joueurs.
 * Et dans les tables de la migration 019 : signalements, questions manquées, vitesse réelle.
 * Si la base ne répond pas, le Portulan garde ses données d'origine : rien ne casse.
 */

const CLES = { fiches: "portulan_fiches", jour: "portulan_jour", population: "portulan_population", nouveautes: "portulan_nouveautes" } as const;

async function lire<T>(cle: string): Promise<T | null> {
  const { data, error } = await dbAdmin().from("reglages").select("valeur").eq("cle", cle).maybeSingle();
  if (error) throw new Error(error.message);
  return ((data as { valeur: T } | null)?.valeur ?? null) as T | null;
}

async function ecrire(cle: string, valeur: unknown) {
  const { error } = await dbAdmin().from("reglages").upsert({ cle, valeur: valeur as never }, { onConflict: "cle" });
  if (error) throw new Error(`Enregistrement impossible : ${error.message}`);
  cache = null;
}

/* ---------- Ce que voient les joueurs : une seule lecture, gardée trente secondes ---------- */

const VIDE: EditionPortulan = { fiches: {}, jour: {}, population: null, nouveautes: [] };
let cache: { valeur: EditionPortulan; expire: number } | null = null;

export async function editionPortulan(): Promise<EditionPortulan> {
  if (cache && cache.expire > Date.now()) return cache.valeur;
  let valeur = VIDE;
  try {
    const { data, error } = await dbAdmin().from("reglages").select("cle, valeur").in("cle", Object.values(CLES));
    if (error) throw new Error(error.message);
    const par = new Map((data as { cle: string; valeur: unknown }[]).map((l) => [l.cle, l.valeur]));
    valeur = {
      fiches: nettoyerFiches(par.get(CLES.fiches)),
      jour: nettoyerJour(par.get(CLES.jour)),
      population: nettoyerPopulation(par.get(CLES.population)),
      nouveautes: nettoyerNouveautes(par.get(CLES.nouveautes)),
    };
  } catch {
    // La base ne répond pas : les données d'origine, et un nouvel essai bientôt.
    cache = { valeur: VIDE, expire: Date.now() + 5_000 };
    return VIDE;
  }
  cache = { valeur, expire: Date.now() + 30_000 };
  return valeur;
}

/* ---------- Ce qui est rangé est relu sans rien croire ---------- */

const texte = (x: unknown, max: number) => (typeof x === "string" ? x.replace(/\s+/g, " ").trim().slice(0, max) : "");
const estJour = (x: string) => /^\d{4}-\d{2}-\d{2}$/.test(x);

function nettoyerFiches(x: unknown): FichesEditees {
  const sortie: FichesEditees = {};
  if (!x || typeof x !== "object") return sortie;
  for (const [code, champs] of Object.entries(x as Record<string, unknown>)) {
    if (!PAR_CODE.has(code) || !champs || typeof champs !== "object") continue;
    const propres: Partial<Record<ChampFiche, string>> = {};
    for (const [champ, valeur] of Object.entries(champs as Record<string, unknown>)) if (estChampFiche(champ) && texte(valeur, 600)) propres[champ] = texte(valeur, 600);
    if (Object.keys(propres).length) sortie[code] = propres;
  }
  return sortie;
}

function nettoyerJour(x: unknown): PaysChoisis {
  const sortie: PaysChoisis = {};
  if (!x || typeof x !== "object") return sortie;
  for (const [jour, choix] of Object.entries(x as Record<string, unknown>)) {
    const c = choix as { code?: unknown; anecdote?: unknown } | null;
    if (!estJour(jour) || !c || typeof c.code !== "string" || !PAR_CODE.has(c.code)) continue;
    sortie[jour] = { code: c.code, ...(texte(c.anecdote, 400) ? { anecdote: texte(c.anecdote, 400) } : {}) };
  }
  return sortie;
}

function nettoyerPopulation(x: unknown): Populations | null {
  const p = x as Populations | null;
  if (!p || typeof p !== "object" || !p.valeurs || typeof p.valeurs !== "object") return null;
  const valeurs: Populations["valeurs"] = {};
  for (const [code, v] of Object.entries(p.valeurs)) {
    if (PAR_CODE.has(code) && Array.isArray(v) && Number.isFinite(v[0]) && v[0] > 0 && Number.isInteger(v[1]) && v[1] > 1990) valeurs[code] = [Math.round(v[0]), v[1]];
  }
  return { maj: texte(p.maj, 40), source: texte(p.source, 120), valeurs };
}

function nettoyerNouveautes(x: unknown): Nouveaute[] {
  if (!Array.isArray(x)) return [];
  return x
    .map((n) => n as Partial<Nouveaute>)
    .filter((n) => typeof n.id === "string" && estJour(String(n.le)) && texte(n.titre, 90))
    .map((n) => ({ id: String(n.id).slice(0, 40), le: String(n.le), titre: texte(n.titre, 90), texte: texte(n.texte, 400) }))
    .slice(0, 30);
}

/* ---------- Le créateur corrige une fiche, choisit le pays du jour, annonce une nouveauté ---------- */

export async function corrigerFiche(code: string, champs: Record<string, unknown>): Promise<void> {
  if (!PAR_CODE.has(code)) throw new Error("Pays inconnu.");
  const toutes = nettoyerFiches(await lire(CLES.fiches));
  const propres: Partial<Record<ChampFiche, string>> = {};
  for (const [champ, valeur] of Object.entries(champs)) if (estChampFiche(champ) && texte(valeur, 600)) propres[champ] = texte(valeur, 600);
  if (Object.keys(propres).length) toutes[code] = propres;
  else delete toutes[code];
  await ecrire(CLES.fiches, toutes);
}

export async function choisirPaysDuJour(jour: string, code: string, anecdote: string): Promise<void> {
  if (!estJour(jour)) throw new Error("Date illisible.");
  if (!PAR_CODE.has(code)) throw new Error("Pays inconnu.");
  const tous = nettoyerJour(await lire(CLES.jour));
  tous[jour] = { code, ...(texte(anecdote, 400) ? { anecdote: texte(anecdote, 400) } : {}) };
  // Les choix de plus de deux mois sont oubliés : la liste reste courte.
  const limite = new Date(Date.now() - 62 * 86_400_000).toISOString().slice(0, 10);
  for (const j of Object.keys(tous)) if (j < limite) delete tous[j];
  await ecrire(CLES.jour, tous);
}

export async function oublierPaysDuJour(jour: string): Promise<void> {
  const tous = nettoyerJour(await lire(CLES.jour));
  delete tous[jour];
  await ecrire(CLES.jour, tous);
}

export async function annoncer(titre: string, corps: string, le: string): Promise<void> {
  if (!texte(titre, 90)) throw new Error("Il faut un titre.");
  if (!estJour(le)) throw new Error("Date illisible.");
  const toutes = nettoyerNouveautes(await lire(CLES.nouveautes));
  toutes.unshift({ id: `${le}-${Math.random().toString(36).slice(2, 8)}`, le, titre: texte(titre, 90), texte: texte(corps, 400) });
  toutes.sort((a, b) => b.le.localeCompare(a.le));
  await ecrire(CLES.nouveautes, toutes.slice(0, 30));
}

export async function retirerNouveaute(id: string): Promise<void> {
  await ecrire(
    CLES.nouveautes,
    nettoyerNouveautes(await lire(CLES.nouveautes)).filter((n) => n.id !== id),
  );
}

/* ---------- La population : la Banque mondiale, une fois par an ---------- */

const BANQUE_MONDIALE = "https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&per_page=20000&mrnev=1";

/**
 * Relit la population de chaque pays (la dernière année connue de la Banque mondiale) et la range.
 * Sans « force », ne fait rien si la dernière mise à jour a moins de trente jours : un appel répété
 * (la tâche planifiée, un double clic) ne martèle pas la Banque mondiale.
 */
export async function mettreAJourPopulations(force = false): Promise<{ faits: number; deja?: boolean }> {
  const avant = nettoyerPopulation(await lire(CLES.population));
  if (!force && avant?.maj && Date.now() - Date.parse(avant.maj) < 30 * 86_400_000) return { faits: Object.keys(avant.valeurs).length, deja: true };
  const controle = new AbortController();
  const delai = setTimeout(() => controle.abort(), 20_000);
  let brut: unknown;
  try {
    const r = await fetch(BANQUE_MONDIALE, { signal: controle.signal, headers: { Accept: "application/json" } });
    if (!r.ok) throw new Error(`La Banque mondiale répond ${r.status} : rien n'a changé, réessaie plus tard.`);
    brut = await r.json();
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("La Banque mondiale")) throw e;
    throw new Error("La Banque mondiale ne répond pas pour le moment : rien n'a changé, réessaie plus tard.");
  } finally {
    clearTimeout(delai);
  }
  const lignes = Array.isArray(brut) && Array.isArray(brut[1]) ? (brut[1] as { countryiso3code?: string; date?: string; value?: number | null }[]) : [];
  const parIso3 = new Map(PAYS.filter((p) => p.iso3).map((p) => [p.iso3!.toUpperCase(), p.code]));
  const valeurs: Populations["valeurs"] = {};
  for (const l of lignes) {
    const code = parIso3.get(String(l.countryiso3code ?? "").toUpperCase());
    const annee = Number(l.date);
    if (code && typeof l.value === "number" && l.value > 0 && Number.isInteger(annee)) valeurs[code] = [Math.round(l.value), annee];
  }
  if (Object.keys(valeurs).length < 150) throw new Error("La réponse de la Banque mondiale est incomplète : rien n'a changé.");
  await ecrire(CLES.population, { maj: new Date().toISOString(), source: "Banque mondiale, SP.POP.TOTL (CC BY 4.0)", valeurs });
  return { faits: Object.keys(valeurs).length };
}

/* ---------- Les signalements ---------- */

export type Signalement = { id: string; le: string; code: string | null; sujet: string; texte: string; contexte: Record<string, unknown>; traite: boolean };
export const SUJETS_SIGNALEMENT = ["fiche", "question", "carte", "traduction", "autre"] as const;
export type SujetSignalement = (typeof SUJETS_SIGNALEMENT)[number];

export async function signaler(s: { utilisateur: string | null; code: string | null; sujet: SujetSignalement; texte: string; contexte: Record<string, unknown> }): Promise<boolean> {
  const corps = texte(s.texte, 1000);
  if (corps.length < 3) return false;
  const code = s.code && PAR_CODE.has(s.code) ? s.code : null;
  const { error } = await dbAdmin().from("portulan_signalements").insert({ utilisateur_id: s.utilisateur, code, sujet: s.sujet, texte: corps, contexte: s.contexte });
  if (!error) return true;
  // La table n'existe pas encore (migration 019 pas lancée) : le signalement se range dans « reglages »,
  // une clé par signalement, et l'atelier le montre quand même.
  // La clé suit la règle de la table : minuscules, chiffres et soulignés seulement.
  const id = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8).padEnd(6, "0")}`;
  const { error: autre } = await dbAdmin()
    .from("reglages")
    .insert({ cle: `${PREFIXE_SIGNALEMENT}${id}`, valeur: { le: new Date().toISOString(), code, sujet: s.sujet, texte: corps, contexte: s.contexte, traite: false } as never });
  return !autre;
}

const PREFIXE_SIGNALEMENT = "portulan_signalement_";
const ID_REGLAGES = "reglages:";

/** Les signalements rangés dans « reglages » (avant la migration 019). */
async function signalementsDeReglages(): Promise<Signalement[]> {
  const { data, error } = await dbAdmin().from("reglages").select("cle, valeur").like("cle", `${PREFIXE_SIGNALEMENT}%`).limit(500);
  if (error) return [];
  return (data as { cle: string; valeur: Partial<Signalement> }[]).map((l) => ({
    id: `${ID_REGLAGES}${l.cle}`,
    le: String(l.valeur?.le ?? ""),
    code: l.valeur?.code ?? null,
    sujet: String(l.valeur?.sujet ?? "autre"),
    texte: String(l.valeur?.texte ?? ""),
    contexte: (l.valeur?.contexte as Record<string, unknown>) ?? {},
    traite: Boolean(l.valeur?.traite),
  }));
}

export async function lireSignalements(tous = false): Promise<Signalement[] | null> {
  let requete = dbAdmin().from("portulan_signalements").select("id, le, code, sujet, texte, contexte, traite").order("le", { ascending: false }).limit(200);
  if (!tous) requete = requete.eq("traite", false);
  const [{ data, error }, anciens] = await Promise.all([requete, signalementsDeReglages()]);
  const liste = [...(error ? [] : (data as Signalement[])), ...anciens.filter((x) => tous || !x.traite)];
  if (error && !anciens.length) {
    // Ni la table ni de signalement de secours : on dit « rien » plutôt qu'« indisponible » si la base répond.
    const { error: base } = await dbAdmin().from("reglages").select("cle").limit(1);
    return base ? null : [];
  }
  return liste.sort((a, b) => b.le.localeCompare(a.le));
}

export async function classerSignalement(id: string, traite: boolean): Promise<void> {
  if (id.startsWith(ID_REGLAGES)) {
    const cle = id.slice(ID_REGLAGES.length);
    const ancien = await lire<Record<string, unknown>>(cle);
    if (!ancien) throw new Error("Signalement introuvable.");
    const { error } = await dbAdmin().from("reglages").update({ valeur: { ...ancien, traite } as never }).eq("cle", cle);
    if (error) throw new Error(error.message);
    return;
  }
  const { error } = await dbAdmin().from("portulan_signalements").update({ traite }).eq("id", id);
  if (error) throw new Error(error.message);
}

/* ---------- Les questions les plus manquées ---------- */

/** Noté après chaque envoi de réponses (questions sur les pays seulement, jamais de nom d'élève). */
export async function noterManques(reponses: { type: string; cible: string; juste: boolean }[]): Promise<void> {
  if (!reponses.length) return;
  await dbAdmin().rpc("portulan_manques_noter", { p_reponses: reponses });
}

export type Manque = { type: TypeQuestion; methode: string; cible: string; pays: string; vues: number; fautes: number; taux: number };

/** Les questions les plus manquées des derniers mois (au moins dix réponses chacune). */
export async function lireManques(mois = 3): Promise<Manque[] | null> {
  const depuis = new Date();
  depuis.setUTCDate(1);
  depuis.setUTCMonth(depuis.getUTCMonth() - (mois - 1));
  const { data, error } = await dbAdmin().from("portulan_manques").select("type, cible, vues, fautes").gte("mois", depuis.toISOString().slice(0, 10)).limit(20000);
  if (error) return null;
  const somme = new Map<string, { type: string; cible: string; vues: number; fautes: number }>();
  for (const l of data as { type: string; cible: string; vues: number; fautes: number }[]) {
    const k = `${l.type}:${l.cible}`;
    const s = somme.get(k) ?? { type: l.type, cible: l.cible, vues: 0, fautes: 0 };
    s.vues += l.vues;
    s.fautes += l.fautes;
    somme.set(k, s);
  }
  return [...somme.values()]
    .filter((s) => s.vues >= 10 && s.type in TYPES && PAR_CODE.has(s.cible))
    .map((s) => ({ type: s.type as TypeQuestion, methode: TYPES[s.type as TypeQuestion].libelle, cible: s.cible, pays: PAR_CODE.get(s.cible)!.nom, vues: s.vues, fautes: s.fautes, taux: s.fautes / s.vues }))
    .sort((a, b) => b.taux - a.taux || b.vues - a.vues)
    .slice(0, 40);
}

/* ---------- La vitesse réelle ---------- */

export async function noterVitesse(mesure: MesureVitesse, valeur: number): Promise<void> {
  await dbAdmin().rpc("portulan_vitesse_noter", { p_mesure: mesure, p_valeur: valeur });
}

const LARGEUR_SEAU: Record<MesureVitesse, number> = { LCP: 50, FCP: 50, TTFB: 50, INP: 10, CLS: 0.01 };
export type Vitesse = Record<MesureVitesse, { n: number; p75: number | null }>;

/** Le 75e centile de chaque mesure sur les derniers jours (le milieu du seau où il tombe). */
export async function lireVitesse(jours = 28): Promise<Vitesse | null> {
  const depuis = new Date(Date.now() - jours * 86_400_000).toISOString().slice(0, 10);
  const { data, error } = await dbAdmin().from("portulan_vitesse").select("mesure, seau, n").gte("jour", depuis).limit(20000);
  if (error) return null;
  const sortie = Object.fromEntries(MESURES_VITESSE.map((m) => [m, { n: 0, p75: null }])) as Vitesse;
  for (const m of MESURES_VITESSE) {
    const seaux = new Map<number, number>();
    for (const l of data as { mesure: string; seau: number; n: number }[]) if (l.mesure === m) seaux.set(l.seau, (seaux.get(l.seau) ?? 0) + l.n);
    const total = [...seaux.values()].reduce((a, b) => a + b, 0);
    if (!total) continue;
    let cumul = 0;
    for (const seau of [...seaux.keys()].sort((a, b) => a - b)) {
      cumul += seaux.get(seau)!;
      if (cumul >= total * 0.75) {
        sortie[m] = { n: total, p75: (seau + 0.5) * LARGEUR_SEAU[m] };
        break;
      }
    }
  }
  return sortie;
}
