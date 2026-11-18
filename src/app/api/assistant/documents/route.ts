import type { NextRequest } from "next/server";
import { ajouterDocument, bilan, compterDocuments, lireConversation, toucherConversation } from "@/lib/assistant/donnees";
import { entree, erreurDonnees, lireCorps, refus, repondre } from "@/lib/assistant/http";
import { formaterCaracteres, LIMITES } from "@/lib/assistant/limites";
import { estimerJetons } from "@/lib/assistant/modeles";

/*
 * POST : le texte d'un PDF, extrait dans le navigateur, rejoint une conversation ChatPDF.
 * Le fichier lui-même n'est jamais envoyé : seulement son texte, page par page (« [Page N] … »),
 * son nom, son nombre de pages et son empreinte SHA-256 (pour ne pas l'importer deux fois).
 */

type Corps = { conversationId?: unknown; nom?: unknown; pages?: unknown; pagesVides?: unknown; empreinte?: unknown; texte?: unknown };

/** Le texte (3 Mo au plus) et ce que JSON y ajoute (sauts de ligne, guillemets échappés). */
const CORPS_MAX = Math.ceil(LIMITES.texteDocumentOctets * 1.3) + 10_000;

function nomPropre(v: unknown): string {
  const brut = typeof v === "string" ? v : "";
  const nom = brut.replace(/[\u0000-\u001F\u007F]/g, "").replace(/^.*[\\/]/, "").trim().slice(0, 300);
  return nom || "document.pdf";
}

const entier = (v: unknown, min: number, max: number) => (typeof v === "number" && Number.isInteger(v) && v >= min && v <= max ? v : null);

export async function POST(requete: NextRequest) {
  const e = await entree(requete);
  if ("refus" in e) return e.refus;
  const corps = await lireCorps<Corps>(requete, CORPS_MAX);
  if (!corps) return refus(413, "trop_lourd", "Ce document est trop long : découpe-le (L'Alambic › Découper), puis importe ses parties.");

  const conversationId = typeof corps.conversationId === "string" ? corps.conversationId : "";
  const pages = entier(corps.pages, 1, 5000);
  const pagesVides = entier(corps.pagesVides ?? 0, 0, 5000);
  const empreinte = typeof corps.empreinte === "string" && /^[0-9a-f]{64}$/.test(corps.empreinte) ? corps.empreinte : null;
  let texte = typeof corps.texte === "string" ? corps.texte.replaceAll("\u0000", "") : "";
  if (!pages || pagesVides === null || pagesVides > pages || !empreinte) return refus(400, "illisible");
  if (!texte.trim()) return refus(400, "vide", "Aucun texte n'a pu être lu dans ce PDF.");
  if (!texte.startsWith("[Page ")) texte = `[Page 1]\n${texte}`;
  if (texte.length > LIMITES.texteDocumentMax || Buffer.byteLength(texte, "utf8") > LIMITES.texteDocumentOctets) {
    return refus(413, "trop_lourd", `Ce document dépasse ${formaterCaracteres(LIMITES.texteDocumentMax)} de caractères : découpe-le (L'Alambic › Découper), puis importe ses parties.`);
  }

  try {
    const [conversation, b, nombre] = await Promise.all([lireConversation(e.compte.id, conversationId), bilan(e.compte.id), compterDocuments(e.compte.id, conversationId)]);
    if (!conversation || conversation.espace !== "pdf") return refus(404, "absent", "Cette conversation n'existe plus.");
    if (nombre >= LIMITES.documentsParConversation) {
      return refus(409, "trop_documents", `${LIMITES.documentsParConversation} documents au plus par conversation : ouvre une nouvelle conversation.`);
    }
    if (b.documentsCaracteres + texte.length > LIMITES.texteCompteMax) {
      return refus(409, "plein", `Tes PDF occupent déjà ${formaterCaracteres(b.documentsCaracteres)} de caractères sur ${formaterCaracteres(LIMITES.texteCompteMax)} : supprime d'anciennes conversations pour faire de la place.`);
    }
    const r = await ajouterDocument(e.compte.id, conversationId, {
      nom: nomPropre(corps.nom),
      pages,
      pagesVides,
      caracteres: texte.length,
      jetons: estimerJetons(texte),
      empreinte,
      texte,
    });
    if (!r.ok) return refus(409, "doublon", "Ce PDF est déjà dans la conversation.");
    await toucherConversation(e.compte.id, conversationId);
    return repondre({ document: r.document }, 201);
  } catch (err) {
    return erreurDonnees(err);
  }
}
