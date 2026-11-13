/*
 * Envoi d'un fichier depuis le navigateur du créateur, puis extraction du texte des PDF
 * et, pour les PDF scannés, reconnaissance du texte (OCR). Tout se passe dans le navigateur :
 * le serveur ne fait que vérifier et enregistrer.
 */
import {
  annulerEnvoi,
  confirmerEnvoi,
  enregistrerTextePages,
  pagesSansTexte,
  preparerEnvoi,
  terminerExtraction,
  type Cible,
} from "@/app/createur/fichiers-actions";
import { ouvrirPdf } from "./pdf";

export type Suivi = (message: string, pourcentage?: number) => void;

export type EnvoiReussi = { ok: true; id: string; nom: string; typeMime: string };
export type EnvoiRate = { ok: false; message: string };

function televerser(url: string, fichier: File, typeMime: string, suivi?: Suivi): Promise<boolean> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("content-type", typeMime);
    xhr.setRequestHeader("cache-control", "max-age=3600");
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) suivi?.(`Envoi de « ${fichier.name} »`, Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300);
    xhr.onerror = () => resolve(false);
    xhr.send(fichier);
  });
}

export async function envoyerFichier(fichier: File, cible: Cible, options: { dansListe?: boolean; suivi?: Suivi } = {}): Promise<EnvoiReussi | EnvoiRate> {
  const { suivi } = options;
  suivi?.(`Préparation de « ${fichier.name} »`, 0);
  let empreinte: string | undefined;
  try {
    if (fichier.size <= 50_000_000 && crypto.subtle) {
      const h = await crypto.subtle.digest("SHA-256", await fichier.arrayBuffer());
      empreinte = [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, "0")).join("");
    }
  } catch {
    /* empreinte facultative */
  }
  const base = { cible, nom: fichier.name, typeDeclare: fichier.type, taille: fichier.size, dansListe: options.dansListe !== false, empreinte };
  let preparation = await preparerEnvoi(base);
  if (!preparation.ok && "doublon" in preparation) {
    if (!window.confirm(`${preparation.message}\n\nL'envoyer quand même ?`)) return { ok: false, message: `« ${fichier.name} » n'a pas été envoyé : c'est un doublon.` };
    preparation = await preparerEnvoi({ ...base, forcer: true });
  }
  if (!preparation.ok) return { ok: false, message: preparation.message };

  const envoye = await televerser(preparation.url, fichier, preparation.typeMime, suivi);
  if (!envoye) {
    await annulerEnvoi({ id: preparation.id });
    return { ok: false, message: `L'envoi de « ${fichier.name} » a échoué. Vérifie ta connexion et réessaie.` };
  }
  suivi?.(`Vérification de « ${fichier.name} »`, 100);
  const confirmation = await confirmerEnvoi({ id: preparation.id });
  if (!confirmation.ok) return confirmation;
  return { ok: true, id: preparation.id, nom: confirmation.nom, typeMime: confirmation.typeMime };
}

const SEUIL_SANS_TEXTE = 25;
const LOT = 20;

/** Extrait le texte de chaque page d'un PDF et l'enregistre (pour la recherche). */
export async function extraireTextePdf(id: string, suivi?: Suivi): Promise<{ pages: number; sansTexte: number }> {
  const { document, fermer } = await ouvrirPdf(id);
  const total = document.numPages;
  let sansTexte = 0;
  let lot: { numero: number; texte: string }[] = [];
  try {
    for (let numero = 1; numero <= total; numero++) {
      const page = await document.getPage(numero);
      const contenu = await page.getTextContent();
      const texte = contenu.items
        .map((item) => ("str" in item ? item.str + (item.hasEOL ? "\n" : " ") : ""))
        .join("")
        .replace(/[ \t]+/g, " ")
        .trim();
      if (texte.length < SEUIL_SANS_TEXTE) sansTexte++;
      lot.push({ numero, texte });
      page.cleanup();
      if (lot.length === LOT || numero === total) {
        const r = await enregistrerTextePages({ id, pages: lot });
        if (!r.ok) throw new Error(r.message);
        lot = [];
      }
      suivi?.(`Lecture du texte : page ${numero} sur ${total}`, Math.round((numero / total) * 100));
    }
    await terminerExtraction({ id, pages: total, pagesSansTexte: sansTexte, ocr: false });
  } finally {
    await fermer();
  }
  return { pages: total, sansTexte };
}

/**
 * Reconnaissance du texte (OCR) des pages sans texte d'un PDF scanné, en français, arabe et anglais.
 * Plusieurs secondes par page : le navigateur doit rester ouvert pendant l'opération.
 */
export async function reconnaitreTexte(id: string, suivi?: Suivi): Promise<{ reconnues: number }> {
  const aTraiter = await pagesSansTexte({ id });
  if (aTraiter.length === 0) return { reconnues: 0 };
  suivi?.("Chargement de la reconnaissance de texte (première fois : quelques secondes)", 0);

  const { createWorker, OEM } = await import("tesseract.js");
  const ocr = await createWorker(["fra", "ara", "eng"], OEM.LSTM_ONLY, {
    workerPath: "/vendor/tesseract/worker.min.js",
    corePath: "/vendor/tesseract/core/",
    langPath: "/vendor/tesseract/lang",
    workerBlobURL: false,
    gzip: true,
  });
  const { document, fermer } = await ouvrirPdf(id);
  let reconnues = 0;
  try {
    for (let i = 0; i < aTraiter.length; i++) {
      const numero = aTraiter[i];
      suivi?.(`Reconnaissance du texte : page ${numero} (${i + 1} sur ${aTraiter.length})`, Math.round((i / aTraiter.length) * 100));
      const page = await document.getPage(numero);
      const vue = page.getViewport({ scale: 2 });
      const toile = window.document.createElement("canvas");
      toile.width = Math.ceil(vue.width);
      toile.height = Math.ceil(vue.height);
      await page.render({ canvas: toile, viewport: vue }).promise;
      const { data } = await ocr.recognize(toile);
      const texte = data.text.replace(/[ \t]+/g, " ").trim();
      if (texte.length >= SEUIL_SANS_TEXTE) reconnues++;
      const r = await enregistrerTextePages({ id, pages: [{ numero, texte, ocr: true }] });
      if (!r.ok) throw new Error(r.message);
      page.cleanup();
    }
    const restantes = (await pagesSansTexte({ id })).length;
    await terminerExtraction({ id, pages: document.numPages, pagesSansTexte: restantes, ocr: true });
    suivi?.("Reconnaissance terminée", 100);
  } finally {
    await ocr.terminate();
    await fermer();
  }
  return { reconnues };
}
