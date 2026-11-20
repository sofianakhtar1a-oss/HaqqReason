"use client";

import { ajouterFichier } from "@/lib/atelier/depot";
import { LIMITES_ATELIER } from "@/lib/atelier/modele";
import type { DepartDocument } from "./DialogueModeles";

/*
 * Le Calame, destination de partage : ce qu'une autre application a envoyé (« Partager » du téléphone)
 * devient un document. Le service du site l'a gardé un instant (voir public/sw.js) ; sans lui, le texte
 * est arrivé dans l'adresse (voir ecrire/recu/route.ts).
 */

export const CACHE_RECU = "hr-calame-recu";

type FichierRecu = { nom: string; type: string; blob: Blob };
export type PartageRecu = { titre: string; texte: string; lien: string; fichiers: FichierRecu[]; restes: number };

/** Le partage annoncé par l'adresse de la page, lu puis effacé de l'appareil ; null s'il n'y en a pas. */
export async function lirePartageRecu(recherche: string): Promise<PartageRecu | { erreur: string } | null> {
  const p = new URLSearchParams(recherche);
  const id = p.get("recu");
  if (id === "echec") return { erreur: "Le partage n'a pas pu être reçu : réessaie depuis l'autre application." };
  if (id === "sans-service") return { erreur: "Les fichiers partagés ne sont pas arrivés : ouvre une fois le Calame sur cet appareil, puis partage-les de nouveau." };
  if (id && /^[a-z0-9]{4,24}$/.test(id)) {
    if (!("caches" in window)) return { erreur: "Ce navigateur ne sait pas recevoir de partage." };
    const cache = await caches.open(CACHE_RECU);
    const reponse = await cache.match(`/ecrire/recu/${id}/paquet.json`);
    if (!reponse) return null; // Déjà reçu (la page a été rechargée).
    const meta = (await reponse.json()) as { titre?: string; texte?: string; lien?: string; fichiers?: { nom: string; type: string; chemin: string }[] };
    const fichiers: FichierRecu[] = [];
    for (const f of meta.fichiers ?? []) {
      const r = await cache.match(f.chemin);
      if (r) fichiers.push({ nom: f.nom, type: f.type, blob: await r.blob() });
    }
    for (const cle of await cache.keys()) if (new URL(cle.url).pathname.startsWith(`/ecrire/recu/${id}/`)) await cache.delete(cle);
    return { titre: meta.titre ?? "", texte: meta.texte ?? "", lien: meta.lien ?? "", fichiers, restes: 0 };
  }
  if (p.has("recu-titre") || p.has("recu-texte") || p.has("recu-lien")) {
    return { titre: p.get("recu-titre") ?? "", texte: p.get("recu-texte") ?? "", lien: p.get("recu-lien") ?? "", fichiers: [], restes: Number(p.get("recu-fichiers")) || 0 };
  }
  return null;
}

const URL_WEB = /https?:\/\/[^\s<>"«»]+[^\s<>"«».,;:!?)\]]/g;

/** Une ligne de texte, ses adresses web devenues des liens. */
function avecLiens(ligne: string): object[] {
  const morceaux: object[] = [];
  let depuis = 0;
  for (const m of ligne.matchAll(URL_WEB)) {
    if (m.index > depuis) morceaux.push({ type: "text", text: ligne.slice(depuis, m.index) });
    morceaux.push({ type: "text", text: m[0], marks: [{ type: "link", attrs: { href: m[0] } }] });
    depuis = m.index + m[0].length;
  }
  if (depuis < ligne.length) morceaux.push({ type: "text", text: ligne.slice(depuis) });
  return morceaux;
}

/** Des paragraphes (séparés par une ligne vide), les retours à la ligne gardés. */
export function paragraphesDe(texte: string): object[] {
  return texte
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .map((bloc) => bloc.replace(/^\n+|\n+$/g, ""))
    .filter((bloc) => bloc.trim())
    .map((bloc) => ({ type: "paragraph", content: bloc.split("\n").flatMap((l, i) => [...(i ? [{ type: "hardBreak" }] : []), ...avecLiens(l)]) }));
}

/** Le nouveau document : le texte, le lien, les images et les PDF ; ce qui n'a pas pu entrer est nommé. */
export async function departDuPartage(p: PartageRecu, maintenant = new Date()): Promise<{ depart: DepartDocument; laisses: string[] }> {
  let texte = p.texte.trim();
  let lien = p.lien.trim();
  // Beaucoup d'applications envoient le lien dans le texte.
  if (!lien && /^https?:\/\/\S+$/.test(texte)) {
    lien = texte;
    texte = "";
  }
  if (lien && texte.includes(lien)) lien = "";
  const contenu: object[] = paragraphesDe(texte);
  if (/^https?:\/\//i.test(lien)) contenu.push({ type: "paragraph", content: [{ type: "text", text: lien, marks: [{ type: "link", attrs: { href: lien } }] }] });
  const laisses: string[] = [];
  const plafond = LIMITES_ATELIER.fichierMo * 1024 * 1024;
  for (const f of p.fichiers) {
    if (f.blob.size > plafond) {
      laisses.push(`${f.nom} (plus de ${LIMITES_ATELIER.fichierMo} Mo)`);
      continue;
    }
    if (f.type.startsWith("image/")) {
      const e = await ajouterFichier(f.blob, f.nom);
      contenu.push({ type: "image", attrs: { fichier: e.id, legende: "", alt: f.nom.replace(/\.[^.]+$/, ""), largeur: "normale" } });
    } else if (f.type === "application/pdf" || /\.pdf$/i.test(f.nom)) {
      const e = await ajouterFichier(f.blob, f.nom);
      contenu.push({ type: "documentPdf", attrs: { fichier: e.id, nom: f.nom, page: "1" } });
    } else if (f.type.startsWith("text/") || /\.(txt|md|markdown)$/i.test(f.nom)) {
      contenu.push(...paragraphesDe(await f.blob.text()));
    } else laisses.push(f.nom);
  }
  if (p.restes > 0) laisses.push(`${p.restes} fichier${p.restes > 1 ? "s" : ""} (ouvre une fois le Calame sur cet appareil, puis partage de nouveau)`);
  if (contenu.length === 0) contenu.push({ type: "paragraph" });
  const premiereLigne = texte.split("\n").find((l) => l.trim())?.trim() ?? "";
  let site = "";
  try {
    site = lien ? new URL(lien).hostname.replace(/^www\./, "") : "";
  } catch {
    site = "";
  }
  const date = maintenant.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
  const titre = (p.titre.trim() || (premiereLigne.length <= 80 ? premiereLigne : `${premiereLigne.slice(0, 77)}…`) || (site ? `Lien : ${site}` : "") || (p.fichiers[0]?.nom ?? "") || `Reçu le ${date}`).slice(0, 120);
  return { depart: { titre, contenu: { type: "doc", content: contenu } }, laisses };
}
