/*
 * L'offre Premium : ce qui est gratuit, ce qui est réservé, ce qui est limité.
 * Ce fichier sert au serveur ET au navigateur (aucun secret ici) : le serveur décide,
 * le navigateur ne fait qu'afficher ce que le serveur a décidé.
 */

/** Gratuit pour tous, réservé à Premium, ou gratuit un certain nombre de fois par période. */
export type Acces = "libre" | "premium" | "limite";
export type Periode = "jour" | "semaine" | "mois" | "total";
export type Regle = { acces: Acces; limite: number; periode: Periode };

export type ModulePremium = "truchement" | "alambic" | "calame" | "portulan" | "ecorche" | "bibliotheque" | "islam";
/** Tout le module gratuit, tout le module réservé, ou réglé partie par partie. */
export type ModeModule = "libre" | "premium" | "parties";

export type DefModulePremium = { id: ModulePremium; nom: string; adresse: string; resume: string };

export type DefFonction = {
  id: string;
  module: ModulePremium;
  nom: string;
  /** Ce qui compte pour une utilisation, dit simplement. */
  unite: { un: string; plusieurs: string };
  /** Rouvrir le même objet (la même histoire, la même dictée) dans la période ne compte pas deux fois. */
  distinct?: boolean;
  defaut: Regle;
  /**
   * « serveur » : le contenu ne quitte le serveur qu'après vérification (impossible à contourner).
   * « appareil » : l'outil travaille sur l'appareil ; le compteur est tenu par le serveur, mais une
   * personne très habile pourrait passer outre en modifiant le code de sa page.
   */
  verrou: "serveur" | "appareil";
};

export const MODULES_PREMIUM: DefModulePremium[] = [
  { id: "truchement", nom: "Le Truchement", adresse: "/langues", resume: "L'anglais du A1 au C2 : vocabulaire, histoires, dictées, immersion, règles." },
  { id: "alambic", nom: "L'Alambic", adresse: "/alambic", resume: "Convertir, assembler et transformer ses fichiers." },
  { id: "calame", nom: "Le Calame", adresse: "/ecrire", resume: "Écrire, mettre en page et exporter ses documents." },
  { id: "portulan", nom: "Le Portulan", adresse: "/monde", resume: "La géographie du monde en jouant." },
  { id: "ecorche", nom: "L'Écorché", adresse: "/corps", resume: "L'anatomie du corps humain en trois dimensions." },
  { id: "bibliotheque", nom: "La bibliothèque", adresse: "/explorer", resume: "Les articles d'apologétique." },
  { id: "islam", nom: "Islam authentique", adresse: "/islam", resume: "Les vidéos et leurs fiches." },
];

const L = (limite: number, periode: Periode): Regle => ({ acces: "limite", limite, periode });
const LIBRE: Regle = { acces: "libre", limite: 0, periode: "mois" };
const PREMIUM: Regle = { acces: "premium", limite: 0, periode: "mois" };
const u = (un: string, plusieurs: string) => ({ un, plusieurs });

/*
 * Les réglages de départ : tout ce qui fait connaître le site reste ouvert (le vocabulaire, les
 * premières histoires, les leçons, l'écriture, l'exploration), on goûte au reste quelques fois,
 * et ce qui a le plus de valeur (C1-C2, diplômes, traitements en lot, niveaux avancés) est réservé.
 */
export const FONCTIONS: DefFonction[] = [
  // Le Truchement
  { id: "truchement.vocabulaire", module: "truchement", nom: "Le vocabulaire : 23 902 mots, séances et séries", unite: u("séance", "séances"), defaut: LIBRE, verrou: "appareil" },
  { id: "truchement.histoires-a", module: "truchement", nom: "Histoires A1 et A2", unite: u("histoire", "histoires"), distinct: true, defaut: LIBRE, verrou: "serveur" },
  { id: "truchement.histoires-b", module: "truchement", nom: "Histoires B1 et B2", unite: u("histoire", "histoires"), distinct: true, defaut: L(2, "mois"), verrou: "serveur" },
  { id: "truchement.histoires-c", module: "truchement", nom: "Histoires C1 et C2", unite: u("histoire", "histoires"), distinct: true, defaut: PREMIUM, verrou: "serveur" },
  { id: "truchement.dictees", module: "truchement", nom: "Dictées au choix", unite: u("dictée", "dictées"), distinct: true, defaut: L(3, "semaine"), verrou: "serveur" },
  { id: "truchement.dictee-surprise", module: "truchement", nom: "Dictée surprise", unite: u("dictée", "dictées"), defaut: L(1, "jour"), verrou: "serveur" },
  { id: "truchement.immersion", module: "truchement", nom: "Écouter : vidéos et sons en immersion", unite: u("vidéo ou son", "vidéos ou sons"), distinct: true, defaut: L(3, "semaine"), verrou: "appareil" },
  { id: "truchement.lire", module: "truchement", nom: "Lire : PDF et livres traduits au mot", unite: u("livre", "livres"), distinct: true, defaut: L(3, "semaine"), verrou: "appareil" },
  { id: "truchement.regles", module: "truchement", nom: "Les leçons des règles de l'anglais", unite: u("leçon", "leçons"), defaut: LIBRE, verrou: "appareil" },
  { id: "truchement.examens", module: "truchement", nom: "Examens de niveau et diplômes", unite: u("examen", "examens"), defaut: L(1, "mois"), verrou: "appareil" },
  { id: "truchement.positionnement", module: "truchement", nom: "Test de positionnement", unite: u("test", "tests"), defaut: LIBRE, verrou: "appareil" },
  { id: "truchement.dictionnaire", module: "truchement", nom: "Le dictionnaire personnel", unite: u("mot", "mots"), defaut: LIBRE, verrou: "appareil" },

  // L'Alambic
  { id: "alambic.convertir", module: "alambic", nom: "Convertir un fichier", unite: u("conversion", "conversions"), defaut: L(5, "jour"), verrou: "appareil" },
  { id: "alambic.lot", module: "alambic", nom: "Convertir plusieurs fichiers d'un coup", unite: u("lot", "lots"), defaut: PREMIUM, verrou: "appareil" },
  { id: "alambic.fusionner", module: "alambic", nom: "Fusionner des PDF", unite: u("fusion", "fusions"), defaut: L(3, "jour"), verrou: "appareil" },
  { id: "alambic.decouper", module: "alambic", nom: "Découper un PDF", unite: u("découpe", "découpes"), defaut: L(3, "jour"), verrou: "appareil" },
  { id: "alambic.organiser", module: "alambic", nom: "Organiser les pages", unite: u("document", "documents"), defaut: L(3, "jour"), verrou: "appareil" },
  { id: "alambic.alleger", module: "alambic", nom: "Alléger un fichier", unite: u("fichier", "fichiers"), defaut: L(3, "jour"), verrou: "appareil" },
  { id: "alambic.reconnaitre", module: "alambic", nom: "Reconnaître le texte d'une image ou d'un scan", unite: u("document", "documents"), defaut: L(2, "jour"), verrou: "appareil" },
  { id: "alambic.rassembler", module: "alambic", nom: "Rassembler le texte de plusieurs documents", unite: u("rassemblement", "rassemblements"), defaut: L(3, "jour"), verrou: "appareil" },
  { id: "alambic.transcrire", module: "alambic", nom: "Transcrire et traduire une vidéo ou un son", unite: u("transcription", "transcriptions"), defaut: L(1, "semaine"), verrou: "appareil" },
  { id: "alambic.proteger", module: "alambic", nom: "Protéger un PDF par mot de passe", unite: u("fichier", "fichiers"), defaut: L(3, "jour"), verrou: "appareil" },
  { id: "alambic.deverrouiller", module: "alambic", nom: "Déverrouiller un PDF", unite: u("fichier", "fichiers"), defaut: L(3, "jour"), verrou: "appareil" },
  { id: "alambic.signer", module: "alambic", nom: "Signer un document", unite: u("signature", "signatures"), defaut: PREMIUM, verrou: "appareil" },
  { id: "alambic.filigraner", module: "alambic", nom: "Ajouter un filigrane", unite: u("fichier", "fichiers"), defaut: PREMIUM, verrou: "appareil" },
  { id: "alambic.masquer", module: "alambic", nom: "Masquer des passages", unite: u("fichier", "fichiers"), defaut: LIBRE, verrou: "appareil" },
  { id: "alambic.nettoyer", module: "alambic", nom: "Effacer les informations cachées", unite: u("fichier", "fichiers"), defaut: LIBRE, verrou: "appareil" },

  // Le Calame
  { id: "calame.ecrire", module: "calame", nom: "Écrire, enregistrer et retrouver ses documents partout", unite: u("document", "documents"), defaut: LIBRE, verrou: "appareil" },
  { id: "calame.export-pdf", module: "calame", nom: "Imprimer et exporter en PDF", unite: u("export", "exports"), defaut: LIBRE, verrou: "appareil" },
  { id: "calame.export-word", module: "calame", nom: "Exporter en Word", unite: u("export", "exports"), defaut: L(3, "mois"), verrou: "appareil" },
  { id: "calame.grammaire", module: "calame", nom: "Relecture grammaticale", unite: u("relecture", "relectures"), defaut: L(5, "jour"), verrou: "appareil" },

  // Le Portulan
  { id: "portulan.niveaux", module: "portulan", nom: "Les niveaux 1 à 5 de chaque jeu", unite: u("partie", "parties"), defaut: LIBRE, verrou: "appareil" },
  { id: "portulan.niveaux-avances", module: "portulan", nom: "Les niveaux 6 à 15 de chaque jeu", unite: u("niveau", "niveaux"), distinct: true, defaut: PREMIUM, verrou: "appareil" },
  { id: "portulan.duels", module: "portulan", nom: "Duels et salons entre amis", unite: u("duel", "duels"), defaut: L(3, "jour"), verrou: "appareil" },
  { id: "portulan.atlas", module: "portulan", nom: "La carte, les fiches et l'atlas", unite: u("fiche", "fiches"), defaut: LIBRE, verrou: "appareil" },

  // L'Écorché
  { id: "ecorche.explorer", module: "ecorche", nom: "Explorer le corps en trois dimensions", unite: u("visite", "visites"), defaut: LIBRE, verrou: "appareil" },
  { id: "ecorche.jeux", module: "ecorche", nom: "Les jeux pour apprendre", unite: u("partie", "parties"), defaut: L(3, "jour"), verrou: "appareil" },
  { id: "ecorche.fiches", module: "ecorche", nom: "Les fiches détaillées", unite: u("fiche", "fiches"), distinct: true, defaut: L(5, "jour"), verrou: "appareil" },

  // La bibliothèque et Islam authentique : ouvertes, comme avant, sauf si le créateur en décide autrement.
  { id: "bibliotheque.articles", module: "bibliotheque", nom: "Lire les articles", unite: u("article", "articles"), distinct: true, defaut: LIBRE, verrou: "serveur" },
  { id: "islam.videos", module: "islam", nom: "Les vidéos et leurs fiches", unite: u("vidéo", "vidéos"), distinct: true, defaut: LIBRE, verrou: "serveur" },
];

export const PAR_ID = new Map(FONCTIONS.map((f) => [f.id, f]));

/* ---------- La configuration du créateur ---------- */

export type Vendeur = {
  /** Nom ou raison sociale. */
  nom: string;
  /** Forme : micro-entreprise, EI, SASU… */
  forme: string;
  siret: string;
  adresse: string;
  email: string;
  /** Mention de TVA (par exemple « TVA non applicable, art. 293 B du CGI »). */
  tva: string;
  /** Médiateur de la consommation (obligatoire pour vendre à des particuliers). */
  mediateur: string;
};

export type Offert = { email: string; jusqu: string | null; note: string };

export type ConfigPremium = {
  /** L'offre payante est allumée (elle ne s'allume vraiment que si Stripe est réglé). */
  active: boolean;
  /** Prix en centimes d'euro, TTC. */
  prixMois: number;
  prixAnnee: number;
  /** Jours d'essai gratuit avant le premier paiement (0 : aucun). */
  essaiJours: number;
  modules: Record<ModulePremium, ModeModule>;
  regles: Record<string, Regle>;
  vendeur: Vendeur;
  offerts: Offert[];
  /** Phrase d'accroche de la page Premium (vide : le texte d'origine). */
  accroche: string;
  /** Date de la version des conditions de vente acceptée par chaque abonné. */
  versionCgv: string;
  maj: string | null;
};

export const PRIX_MOIS_DEFAUT = 499;
export const PRIX_ANNEE_DEFAUT = 3999;
export const PRIX_MIN = 99;
export const PRIX_MOIS_MAX = 9999;
export const PRIX_ANNEE_MAX = 99999;
export const ESSAI_MAX = 30;
export const LIMITE_MAX = 999;
export const OFFERTS_MAX = 500;
export const VERSION_CGV_DEFAUT = "2026-11-23";
export const ACCROCHE_DEFAUT = "Tout HaqqReason, sans limite : chaque histoire, chaque dictée, chaque outil, et les diplômes du Truchement.";

export const VENDEUR_VIDE: Vendeur = { nom: "", forme: "", siret: "", adresse: "", email: "", tva: "", mediateur: "" };

export function configParDefaut(): ConfigPremium {
  return {
    active: false,
    prixMois: PRIX_MOIS_DEFAUT,
    prixAnnee: PRIX_ANNEE_DEFAUT,
    essaiJours: 0,
    modules: Object.fromEntries(MODULES_PREMIUM.map((m) => [m.id, "parties"])) as Record<ModulePremium, ModeModule>,
    regles: Object.fromEntries(FONCTIONS.map((f) => [f.id, { ...f.defaut }])),
    vendeur: { ...VENDEUR_VIDE },
    offerts: [],
    accroche: "",
    versionCgv: VERSION_CGV_DEFAUT,
    maj: null,
  };
}

const ACCES: Acces[] = ["libre", "premium", "limite"];
const PERIODES: Periode[] = ["jour", "semaine", "mois", "total"];
const MODES: ModeModule[] = ["libre", "premium", "parties"];
const EMAIL = /^[^\s@<>()[\]\\,;:"]{1,64}@[^\s@<>()[\]\\,;:"]{1,190}\.[a-z]{2,24}$/i;

/** Un texte sans caractères de contrôle (sauf les retours à la ligne), coupé à la longueur permise. */
const texte = (v: unknown, max: number) =>
  typeof v === "string"
    ? Array.from(v)
        .filter((c) => {
          const n = c.charCodeAt(0);
          return n === 10 || n === 13 || n === 9 || (n >= 32 && n !== 127);
        })
        .join("")
        .trim()
        .slice(0, max)
    : "";
const entier = (v: unknown, min: number, max: number, defaut: number) => {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : defaut;
};

export function nettoyerRegle(brut: unknown, defaut: Regle): Regle {
  const r = (brut ?? {}) as Partial<Regle>;
  const acces = ACCES.includes(r.acces as Acces) ? (r.acces as Acces) : defaut.acces;
  const periode = PERIODES.includes(r.periode as Periode) ? (r.periode as Periode) : defaut.periode;
  const limite = entier(r.limite, 1, LIMITE_MAX, defaut.acces === "limite" ? defaut.limite : 3);
  return { acces, limite: acces === "limite" ? limite : 0, periode };
}

export function adresseValide(email: string): boolean {
  return EMAIL.test(email);
}

/** Toute configuration lue (base ou formulaire) passe par ici : rien d'inattendu n'en sort. */
export function nettoyerConfig(brut: unknown): ConfigPremium {
  const d = configParDefaut();
  const c = (brut && typeof brut === "object" ? brut : {}) as Partial<Record<keyof ConfigPremium, unknown>>;
  const modules = { ...d.modules };
  const mb = (c.modules ?? {}) as Record<string, unknown>;
  for (const m of MODULES_PREMIUM) if (MODES.includes(mb[m.id] as ModeModule)) modules[m.id] = mb[m.id] as ModeModule;
  const regles: Record<string, Regle> = {};
  const rb = (c.regles ?? {}) as Record<string, unknown>;
  for (const f of FONCTIONS) regles[f.id] = rb[f.id] === undefined ? { ...f.defaut } : nettoyerRegle(rb[f.id], f.defaut);
  const vb = (c.vendeur ?? {}) as Record<string, unknown>;
  const vendeur: Vendeur = {
    nom: texte(vb.nom, 160),
    forme: texte(vb.forme, 120),
    siret: texte(vb.siret, 40).replace(/[^0-9 ]/g, ""),
    adresse: texte(vb.adresse, 300),
    email: adresseValide(texte(vb.email, 254)) ? texte(vb.email, 254) : "",
    tva: texte(vb.tva, 200),
    mediateur: texte(vb.mediateur, 400),
  };
  const vus = new Set<string>();
  const offerts: Offert[] = [];
  for (const o of Array.isArray(c.offerts) ? (c.offerts as unknown[]) : []) {
    const x = (o ?? {}) as Record<string, unknown>;
    const email = texte(x.email, 254).toLowerCase();
    if (!adresseValide(email) || vus.has(email)) continue;
    const jusqu = typeof x.jusqu === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x.jusqu) ? x.jusqu : null;
    vus.add(email);
    offerts.push({ email, jusqu, note: texte(x.note, 120) });
    if (offerts.length >= OFFERTS_MAX) break;
  }
  const version = typeof c.versionCgv === "string" && /^\d{4}-\d{2}-\d{2}$/.test(c.versionCgv) ? c.versionCgv : d.versionCgv;
  return {
    active: c.active === true,
    prixMois: entier(c.prixMois, PRIX_MIN, PRIX_MOIS_MAX, d.prixMois),
    prixAnnee: entier(c.prixAnnee, PRIX_MIN, PRIX_ANNEE_MAX, d.prixAnnee),
    essaiJours: entier(c.essaiJours, 0, ESSAI_MAX, 0),
    modules,
    regles,
    vendeur,
    offerts,
    accroche: texte(c.accroche, 240),
    versionCgv: version,
    maj: typeof c.maj === "string" ? c.maj.slice(0, 40) : null,
  };
}

/** La règle qui s'applique vraiment : le réglage du module passe avant celui de la partie. */
export function regleEffective(config: ConfigPremium, id: string): Regle {
  const f = PAR_ID.get(id);
  if (!f) return LIBRE;
  const mode = config.modules[f.module] ?? "parties";
  if (mode === "libre") return LIBRE;
  if (mode === "premium") return PREMIUM;
  return config.regles[id] ?? f.defaut;
}

/** Un accès offert par le créateur, d'après l'adresse e-mail (vérifiée par Google à la connexion). */
export function accesOffert(config: Pick<ConfigPremium, "offerts">, email: string | null | undefined, maintenant = new Date()): { jusqu: string | null } | null {
  const e = (email ?? "").trim().toLowerCase();
  if (!e) return null;
  const o = config.offerts.find((x) => x.email === e);
  if (!o) return null;
  // Valable jusqu'au soir du jour choisi, à l'heure de Paris.
  if (o.jusqu && new Date(`${o.jusqu}T23:59:59+01:00`).getTime() < maintenant.getTime()) return null;
  return { jusqu: o.jusqu };
}

/** Les informations obligatoires du vendeur sont-elles là (pour les conditions de vente) ? */
export function vendeurComplet(v: Vendeur): boolean {
  return Boolean(v.nom && v.adresse && v.email && v.siret);
}

/* ---------- Les périodes, à l'heure de Paris ---------- */

function partiesParis(quand: Date): { a: number; m: number; j: number } {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(quand);
  const v = (t: string) => Number(p.find((x) => x.type === t)?.value);
  return { a: v("year"), m: v("month"), j: v("day") };
}

const deux = (n: number) => String(n).padStart(2, "0");

/** La semaine ISO (année de la semaine, numéro) d'un jour du calendrier. */
export function semaineIso(a: number, m: number, j: number): { annee: number; semaine: number } {
  const d = new Date(Date.UTC(a, m - 1, j));
  const jour = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - jour);
  const debut = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return { annee: d.getUTCFullYear(), semaine: Math.ceil(((d.getTime() - debut.getTime()) / 86400000 + 1) / 7) };
}

/** La clé de la période en cours, celle que le compteur de la base retient. */
export function clePeriode(periode: Periode, quand: Date = new Date()): string {
  if (periode === "total") return "total";
  const { a, m, j } = partiesParis(quand);
  if (periode === "jour") return `j-${a}-${deux(m)}-${deux(j)}`;
  if (periode === "mois") return `m-${a}-${deux(m)}`;
  const s = semaineIso(a, m, j);
  return `s-${s.annee}-w${deux(s.semaine)}`;
}

/** Quand le compteur repart à zéro, dit simplement (« demain », « lundi », « le 1er décembre »). */
export function remiseLisible(periode: Periode, quand: Date = new Date()): string {
  if (periode === "total") return "";
  if (periode === "jour") return "demain";
  if (periode === "semaine") return "lundi";
  const { a, m } = partiesParis(quand);
  const suivant = new Date(Date.UTC(m === 12 ? a + 1 : a, m === 12 ? 0 : m, 1, 12));
  return `le 1er ${new Intl.DateTimeFormat("fr-FR", { month: "long", timeZone: "UTC" }).format(suivant)}`;
}

export const LIBELLES_PERIODE: Record<Periode, { par: string; seul: string }> = {
  jour: { par: "par jour", seul: "chaque jour" },
  semaine: { par: "par semaine", seul: "chaque semaine" },
  mois: { par: "par mois", seul: "chaque mois" },
  total: { par: "en tout", seul: "une fois pour toutes" },
};

/** « 4,99 € », « 39,99 € ». */
export function prixLisible(centimes: number): string {
  return `${(centimes / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

/** Ce que l'abonnement annuel fait gagner par rapport à douze mois. */
export function economieAnnuelle(c: Pick<ConfigPremium, "prixMois" | "prixAnnee">): { centimes: number; pourcent: number; moisOfferts: number } {
  const douze = c.prixMois * 12;
  const centimes = Math.max(0, douze - c.prixAnnee);
  return { centimes, pourcent: douze ? Math.round((centimes / douze) * 100) : 0, moisOfferts: c.prixMois ? Math.floor(centimes / c.prixMois) : 0 };
}

/** « 3 dictées par semaine », « 1 examen par mois ». */
export function regleLisible(r: Regle, f: Pick<DefFonction, "unite">): string {
  if (r.acces === "libre") return "Gratuit";
  if (r.acces === "premium") return "Premium";
  return `${r.limite} ${r.limite > 1 ? f.unite.plusieurs : f.unite.un} ${LIBELLES_PERIODE[r.periode].par}`;
}
