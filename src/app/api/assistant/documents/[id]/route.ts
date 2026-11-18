import type { NextRequest } from "next/server";
import { lirePage, modifierDocument, supprimerDocument } from "@/lib/assistant/donnees";
import { entree, erreurDonnees, lireCorps, refus, repondre } from "@/lib/assistant/http";

/*
 * Un PDF importé du compte connecté.
 *   GET ?page=N : le texte de cette page, pour vérifier une référence « [Doc 2, p. 14] ».
 *   PATCH { actif } : cocher ou décocher le document (décoché, Claude ne le lit plus).
 *   DELETE : retirer le document de la conversation.
 */

type Contexte = { params: Promise<{ id: string }> };

export async function GET(requete: NextRequest, contexte: Contexte) {
  const e = await entree(requete);
  if ("refus" in e) return e.refus;
  const { id } = await contexte.params;
  const page = Number(requete.nextUrl.searchParams.get("page"));
  if (!Number.isInteger(page) || page < 1 || page > 5000) return refus(400, "page");
  try {
    const texte = await lirePage(e.compte.id, id, page);
    if (texte === null) return refus(404, "absent", "Cette page n'existe pas dans le document.");
    return repondre({ page, texte: texte.replace(/^\[Page \d+\]\n?/, "") });
  } catch (err) {
    return erreurDonnees(err);
  }
}

export async function PATCH(requete: NextRequest, contexte: Contexte) {
  const e = await entree(requete);
  if ("refus" in e) return e.refus;
  const { id } = await contexte.params;
  const corps = await lireCorps<{ actif?: unknown }>(requete, 1_000);
  if (!corps || typeof corps.actif !== "boolean") return refus(400, "illisible");
  try {
    const document = await modifierDocument(e.compte.id, id, { actif: corps.actif });
    if (!document) return refus(404, "absent");
    return repondre({ document });
  } catch (err) {
    return erreurDonnees(err);
  }
}

export async function DELETE(requete: NextRequest, contexte: Contexte) {
  const e = await entree(requete);
  if ("refus" in e) return e.refus;
  const { id } = await contexte.params;
  try {
    if (!(await supprimerDocument(e.compte.id, id))) return refus(404, "absent");
    return repondre({ ok: true });
  } catch (err) {
    return erreurDonnees(err);
  }
}
