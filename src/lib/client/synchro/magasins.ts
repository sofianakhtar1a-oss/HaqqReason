/*
 * Pour chaque famille de données personnelles : comment la lire sur l'appareil pour l'envoyer
 * sur le compte, et comment ranger ce qui arrive d'un autre appareil.
 *
 * Règle commune : « ecrire » et « effacer » rangent sans rien noter au journal (sinon chaque
 * réception repartirait aussitôt vers le serveur). Quand le rangement a fusionné ce qui arrive avec
 * ce qui était là (le meilleur score d'une leçon, par exemple), il répond « a-renvoyer » : le moteur
 * renverra alors le résultat de la fusion.
 */
import { lireJetons, rangerJetons } from "@/app/contribuer/suivi";
import * as transcriptions from "@/lib/alambic/transcription/bibliotheque";
import type { Transcription } from "@/lib/alambic/transcription/types";
import * as depot from "@/lib/atelier/depot";
import type { NomMagasin } from "@/lib/compte/limites";
import { tiroir } from "@/lib/client/compte";
import { lireFavoris, rangerFavori, type Favori } from "@/lib/client/favoris";
import * as preferencesCalame from "@/lib/atelier/preferences";
import * as journalCalame from "@/lib/atelier/journal-ecriture";
import * as bibliothequeCalame from "@/lib/atelier/bibliotheque";
import { historiqueBrut, lireCollections, rangerCollections, rangerHistorique } from "@/lib/client/historique";
import { rangerRecherchesSauvegardees, recherchesSauvegardees } from "@/lib/client/recherches-locales";
import * as langues from "@/lib/langues/stockage";
import * as histoires from "@/lib/langues/histoires/progression";
import { leconsLocales, rangerLecon, type Resultat } from "@/lib/regles/progression";
import * as reglesSuivi from "@/lib/regles/suivi";
import * as monde from "@/lib/monde/progression";
import * as corps from "@/lib/corps/progression";

export type Adaptateur = {
  /** Tout ce que l'appareil possède déjà (pour le premier envoi), avec sa date si on la connaît. */
  cles(): Promise<{ c: string; q?: number }[]>;
  /** La valeur à envoyer ; undefined si l'objet n'existe plus sur l'appareil (il sera supprimé du compte). */
  lire(c: string): Promise<unknown | undefined>;
  /** Range une valeur venue du compte. */
  ecrire(c: string, v: unknown): Promise<void | "a-renvoyer">;
  /** Retire un objet supprimé sur un autre appareil. */
  effacer(c: string): Promise<void | "a-renvoyer">;
  /**
   * Avant l'envoi : pour les fichiers, dépose (ou retire) le contenu sur le compte.
   * « ignorer » : l'objet ne peut pas partir (trop lourd, place pleine), il reste sur l'appareil.
   */
  avantEnvoi?(c: string, supprime: boolean): Promise<"ok" | "ignorer">;
};

const dateIso = (iso: unknown): number | undefined => {
  const t = typeof iso === "string" ? Date.parse(iso) : NaN;
  return Number.isFinite(t) && t > 0 ? t : undefined;
};

/* ---------- Le Calame ---------- */

const calameDocuments: Adaptateur = {
  cles: async () => (await depot.listerDocuments()).map((d) => ({ c: d.id, q: dateIso(d.modifie) })),
  lire: async (c) => (await depot.lireDocument(c)) ?? undefined,
  ecrire: async (c, v) => depot.ecrireDocumentBrut({ ...(v as object), id: c }),
  effacer: (c) => depot.supprimerDocumentBrut(c),
};

async function documentsCitant(id: string): Promise<boolean> {
  for (const doc of await depot.listerDocuments()) if (depot.fichiersCites(doc.contenu).has(id)) return true;
  return false;
}

const calameFichiers: Adaptateur = {
  cles: async () => (await depot.listerFichesLocales()).map((f) => ({ c: f.id, q: dateIso(f.ajoute) })),
  lire: async (c) => {
    const f = await depot.lireFichierLocal(c);
    return f ? { id: f.id, nom: f.nom, type: f.type, taille: f.taille, ajoute: f.ajoute } : undefined;
  },
  ecrire: async (c, v) => depot.rangerFiche({ ...(v as depot.FicheFichier), id: c }),
  effacer: async (c) => {
    // Supprimé ailleurs, mais un document d'ici le cite encore (copié entre-temps) : on le garde et on le renvoie.
    if ((await depot.lireFichierLocal(c)) && (await documentsCitant(c))) return "a-renvoyer";
    await depot.supprimerFichierBrut(c);
  },
  avantEnvoi: async (c, supprime) => {
    const adresse = `/api/compte/fichiers/${encodeURIComponent(c)}`;
    if (supprime) {
      const r = await fetch(adresse, { method: "DELETE" });
      if (!r.ok && r.status !== 404) throw new Error("suppression refusée");
      return "ok";
    }
    const f = await depot.lireFichierLocal(c);
    if (!f) return "ok";
    const prepare = await fetch(adresse, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type: f.type, taille: f.taille }) });
    if (prepare.status === 413) return "ignorer";
    if (!prepare.ok) throw new Error("envoi refusé");
    const { url, type } = (await prepare.json()) as { url: string; type: string };
    const envoi = await fetch(url, { method: "PUT", headers: { "content-type": type, "x-upsert": "true", "cache-control": "max-age=3600" }, body: f.blob });
    if (!envoi.ok) throw new Error("envoi interrompu");
    return "ok";
  },
};

/* ---------- Les Règles ---------- */

const regles: Adaptateur = {
  cles: async () => Object.entries(leconsLocales()).map(([c, r]) => ({ c, q: r.fini || undefined })),
  lire: async (c) => leconsLocales()[c],
  ecrire: async (c, v) => {
    // On garde le meilleur des deux appareils ; s'il diffère de ce qui arrive, il repart vers le compte.
    rangerLecon(c, v as Resultat);
    const ici = leconsLocales()[c];
    const venu = v as Partial<Resultat>;
    if (ici && (ici.etoiles !== venu.etoiles || ici.xp !== venu.xp || ici.fini !== venu.fini)) return "a-renvoyer";
  },
  effacer: async (c) => rangerLecon(c, null),
};

/* L'entraînement, les examens et le carnet d'erreurs des Règles. */
const suiviRegles: Adaptateur = {
  cles: async () => reglesSuivi.clesLocales(),
  lire: async (c) => reglesSuivi.valeurLocale(c),
  // On garde le meilleur score des deux appareils, et l'état le plus récent d'une erreur.
  ecrire: async (c, v) => (reglesSuivi.rangerValeur(c, v) ? "a-renvoyer" : undefined),
  effacer: async (c) => reglesSuivi.effacerValeur(c),
};

/* La lecture des histoires du Truchement. */
const lecturesHistoires: Adaptateur = {
  cles: async () => histoires.clesLocales(),
  lire: async (c) => histoires.valeurLocale(c),
  ecrire: async (c, v) => (histoires.rangerValeur(c, v) ? "a-renvoyer" : undefined),
  effacer: async (c) => histoires.effacerValeur(c),
};

/* ---------- Le Portulan ---------- */

const portulan: Adaptateur = {
  cles: async () => monde.clesLocales(),
  lire: async (c) => monde.valeurLocale(c),
  // On garde le meilleur des deux appareils ; si celui-ci avait mieux, il repart vers le compte.
  ecrire: async (c, v) => (monde.rangerValeur(c, v) ? "a-renvoyer" : undefined),
  effacer: async (c) => monde.effacerValeur(c),
};

/* ---------- L'Écorché ---------- */

const ecorche: Adaptateur = {
  cles: async () => corps.clesLocales(),
  lire: async (c) => corps.valeurLocale(c),
  // Le meilleur des deux appareils ; si celui-ci avait mieux, il repart vers le compte.
  ecrire: async (c, v) => (corps.rangerValeur(c, v) ? "a-renvoyer" : undefined),
  effacer: async (c) => corps.effacerValeur(c),
};

/* ---------- Le Truchement ---------- */

function magasinLangue(nom: "cartes" | "dictionnaire" | "journal"): Adaptateur {
  const champ = nom === "journal" ? "jour" : "id";
  return {
    cles: async () => (await langues.tout<Record<string, unknown>>(nom)).map((x) => ({ c: String(x[champ]) })),
    lire: (c) => langues.lireUn(nom, c),
    ecrire: (c, v) => langues.ecrireBrut(nom, { ...(v as object), [champ]: c }),
    effacer: (c) => langues.effacerBrut(nom, c),
  };
}

/*
 * Un média (ou un PDF) est lourd : son texte, ses traductions. L'endroit où l'on s'est arrêté, lui,
 * change toutes les quelques secondes. Les deux voyagent donc séparément : le texte dans son magasin,
 * la « reprise » (position, page, dernière ouverture) dans le sien. Ainsi, regarder une vidéo n'envoie
 * que quelques octets, pas tout le texte à chaque fois.
 */
const REPRISE = { medias: ["vu", "position"], documents: ["vu", "page", "affiche"] } as const;
const cleAttente = () => tiroir("haqqreason-reprises-en-attente");

function reprisesEnAttente(): Record<string, Record<string, unknown>> {
  try {
    const brut = JSON.parse(localStorage.getItem(cleAttente()) ?? "{}");
    return brut && typeof brut === "object" ? brut : {};
  } catch {
    return {};
  }
}
function garderReprises(r: Record<string, Record<string, unknown>>) {
  try {
    localStorage.setItem(cleAttente(), JSON.stringify(r));
  } catch {
    /* stockage plein */
  }
}

function sansReprise(nom: "medias" | "documents", objet: Record<string, unknown>) {
  const copie = { ...objet };
  for (const champ of REPRISE[nom]) delete copie[champ];
  return copie;
}
function repriseDe(nom: "medias" | "documents", objet: Record<string, unknown>) {
  const r: Record<string, unknown> = {};
  for (const champ of REPRISE[nom]) if (objet[champ] !== undefined) r[champ] = objet[champ];
  return r;
}

function contenuLangue(nom: "medias" | "documents"): Adaptateur {
  return {
    cles: async () => (await langues.tout<Record<string, unknown>>(nom)).map((x) => ({ c: String(x.id), q: Number(x.vu) || undefined })),
    lire: async (c) => {
      const objet = await langues.lireUn<Record<string, unknown>>(nom, c);
      return objet ? sansReprise(nom, objet) : undefined;
    },
    ecrire: async (c, v) => {
      const ici = await langues.lireUn<Record<string, unknown>>(nom, c);
      // La reprise est peut-être arrivée avant le texte : on la retrouve ici.
      const attente = reprisesEnAttente();
      const cle = langues.cleReprise(nom, c);
      const reprise = ici ? repriseDe(nom, ici) : (attente[cle] ?? {});
      const defaut = nom === "medias" ? { vu: Date.now() } : { vu: Date.now(), page: 1, traductions: {}, analyses: {} };
      await langues.ecrireBrut(nom, { ...defaut, ...(v as object), ...reprise, id: c });
      if (attente[cle]) {
        delete attente[cle];
        garderReprises(attente);
      }
    },
    effacer: async (c) => {
      await langues.effacerBrut(nom, c);
      if (nom === "medias") await langues.effacerBrut("blobs", c).catch(() => undefined);
    },
  };
}

function nomDeReprise(c: string): { nom: "medias" | "documents"; id: string } | null {
  if (c.startsWith("media:")) return { nom: "medias", id: c.slice(6) };
  if (c.startsWith("document:")) return { nom: "documents", id: c.slice(9) };
  return null;
}

const reprise: Adaptateur = {
  cles: async () => [
    ...(await langues.tout<Record<string, unknown>>("medias")).map((x) => ({ c: langues.cleReprise("medias", String(x.id)), q: Number(x.vu) || undefined })),
    ...(await langues.tout<Record<string, unknown>>("documents")).map((x) => ({ c: langues.cleReprise("documents", String(x.id)), q: Number(x.vu) || undefined })),
  ],
  lire: async (c) => {
    const cible = nomDeReprise(c);
    if (!cible) return undefined;
    const objet = await langues.lireUn<Record<string, unknown>>(cible.nom, cible.id);
    return objet ? repriseDe(cible.nom, objet) : undefined;
  },
  ecrire: async (c, v) => {
    const cible = nomDeReprise(c);
    if (!cible || !v || typeof v !== "object") return;
    const objet = await langues.lireUn<Record<string, unknown>>(cible.nom, cible.id);
    if (objet) {
      await langues.ecrireBrut(cible.nom, { ...objet, ...repriseDe(cible.nom, v as Record<string, unknown>) });
      return;
    }
    // Le texte n'est pas encore arrivé : la reprise attend son tour.
    garderReprises({ ...reprisesEnAttente(), [c]: repriseDe(cible.nom, v as Record<string, unknown>) });
  },
  effacer: async (c) => {
    const attente = reprisesEnAttente();
    if (attente[c]) {
      delete attente[c];
      garderReprises(attente);
    }
  },
};

/* ---------- L'Alambic : les transcriptions ---------- */

const alambicTranscriptions: Adaptateur = {
  cles: async () => (await transcriptions.listerTout()).map((t) => ({ c: t.id, q: Number(t.creeLe) || undefined })),
  lire: (c) => transcriptions.lire(c),
  ecrire: async (c, v) => {
    await transcriptions.enregistrerBrut({ ...(v as Transcription), id: c });
  },
  effacer: async (c) => {
    await transcriptions.supprimerBrut(c);
  },
};

/* ---------- La bibliothèque : favoris, historique, collections, recherches, « Mes messages » ---------- */

const favoris: Adaptateur = {
  cles: async () => lireFavoris().map((f) => ({ c: f.id, q: dateIso(f.ajoute) })),
  lire: async (c) => lireFavoris().find((f) => f.id === c),
  ecrire: async (c, v) => rangerFavori(c, v as Favori),
  effacer: async (c) => rangerFavori(c, null),
};

/** De petits réglages qui voyagent chacun d'un bloc. */
const BLOCS: Record<string, { lire: () => unknown; ranger: (v: unknown) => void; vide: (v: unknown) => boolean }> = {
  historique: { lire: historiqueBrut, ranger: rangerHistorique, vide: (v) => !Array.isArray(v) || v.length === 0 },
  collections: { lire: lireCollections, ranger: rangerCollections, vide: (v) => !v || Object.keys(v as object).length === 0 },
  recherches: { lire: recherchesSauvegardees, ranger: rangerRecherchesSauvegardees, vide: (v) => !Array.isArray(v) || v.length === 0 },
  contributions: { lire: lireJetons, ranger: rangerJetons, vide: (v) => !Array.isArray(v) || v.length === 0 },
};

const reglages: Adaptateur = {
  cles: async () => Object.entries(BLOCS).filter(([, b]) => !b.vide(b.lire())).map(([c]) => ({ c })),
  lire: async (c) => BLOCS[c]?.lire(),
  ecrire: async (c, v) => {
    if (c === "contributions") {
      // Les jetons de suivi s'additionnent : un message envoyé d'un appareil ne doit pas faire oublier ceux d'un autre.
      const ici = lireJetons();
      const venus = Array.isArray(v) ? v.filter((j): j is string => typeof j === "string") : [];
      const union = [...new Set([...venus, ...ici])];
      rangerJetons(union);
      return union.length > venus.length ? "a-renvoyer" : undefined;
    }
    BLOCS[c]?.ranger(v);
  },
  effacer: async (c) => BLOCS[c]?.ranger(c === "collections" ? {} : []),
};

/* Les préférences du Calame (un seul bloc) et son journal d'écriture (un objet par mois). */
const calamePreferences: Adaptateur = {
  cles: async () => (preferencesCalame.preferencesBrutes() ? [{ c: "preferences" }] : []),
  lire: async (c) => (c === "preferences" ? preferencesCalame.preferencesBrutes() : undefined),
  ecrire: async (c, v) => (c === "preferences" ? preferencesCalame.rangerPreferences(v) : undefined),
  effacer: async () => undefined,
};

const calameJournal: Adaptateur = {
  cles: async () => journalCalame.moisLocaux().map((c) => ({ c })),
  lire: async (c) => {
    const mois = journalCalame.lireMois(c);
    return Object.keys(mois).length > 0 ? mois : undefined;
  },
  ecrire: async (c, v) => journalCalame.rangerMois(c, v),
  effacer: async () => undefined,
};

/* La bibliothèque personnelle du Calame (un seul bloc, fusionné ouvrage par ouvrage). */
const calameBibliotheque: Adaptateur = {
  cles: async () => (bibliothequeCalame.bibliothequeBrute() ? [{ c: "ouvrages" }] : []),
  lire: async (c) => (c === "ouvrages" ? bibliothequeCalame.bibliothequeBrute() : undefined),
  ecrire: async (c, v) => (c === "ouvrages" ? bibliothequeCalame.rangerBibliotheque(v) : undefined),
  effacer: async () => undefined,
};

/* Les versions du Calame : les nommées, et les plus récentes de chaque document. */
const calameVersions: Adaptateur = {
  cles: async () => (await depot.versionsSuivies()).map((v) => ({ c: v.id, q: dateIso(v.quand) })),
  lire: async (c) => depot.versionSuivie(c),
  ecrire: async (_c, v) => depot.rangerVersion(v),
  effacer: async (c) => depot.supprimerVersionBrute(c),
};

export const ADAPTATEURS: Record<NomMagasin, Adaptateur> = {
  "calame-documents": calameDocuments,
  "calame-fichiers": calameFichiers,
  "calame-preferences": calamePreferences,
  "calame-journal": calameJournal,
  "calame-bibliotheque": calameBibliotheque,
  "calame-versions": calameVersions,
  regles,
  "regles-suivi": suiviRegles,
  histoires: lecturesHistoires,
  "langues-cartes": magasinLangue("cartes"),
  "langues-dictionnaire": magasinLangue("dictionnaire"),
  "langues-journal": magasinLangue("journal"),
  "langues-medias": contenuLangue("medias"),
  "langues-documents": contenuLangue("documents"),
  transcriptions: alambicTranscriptions,
  reprise,
  favoris,
  reglages,
  monde: portulan,
  corps: ecorche,
};
