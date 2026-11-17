import { NextResponse, type NextRequest } from "next/server";
import { ESPACE_COMPTES, placeDuCompte } from "@/lib/compte/donnees";
import { FICHIER_MAX, PLAFOND_FICHIERS } from "@/lib/compte/limites";
import { compteVerifie, memeOrigine } from "@/lib/compte/session";
import { dbAdmin } from "@/lib/supabase";

/*
 * Les fichiers joints aux documents (images, PDF) d'un compte.
 * Le navigateur n'a jamais de droit sur l'espace de stockage : il reçoit ici, pour un seul
 * fichier de son propre compte, un lien d'envoi à usage unique ou un lien de lecture de 10 minutes.
 */

const SANS_CACHE = { "Cache-Control": "private, no-store" };
const refus = (statut: number, erreur: string) => NextResponse.json({ erreur }, { status: statut, headers: SANS_CACHE });
const ID = /^[A-Za-z0-9_-]{1,80}$/;

type Contexte = { params: Promise<{ id: string }> };

async function entree(requete: NextRequest, contexte: Contexte) {
  if (!memeOrigine(requete)) return { erreur: refus(403, "refuse") };
  const compte = await compteVerifie();
  if (compte === "indisponible") return { erreur: refus(503, "indisponible") };
  if (!compte) return { erreur: refus(401, "deconnecte") };
  const { id } = await contexte.params;
  if (!ID.test(id)) return { erreur: refus(400, "illisible") };
  return { compte, id, chemin: `${compte.id}/${id}` };
}

/** Lien de lecture temporaire. */
export async function GET(requete: NextRequest, contexte: Contexte) {
  const e = await entree(requete, contexte);
  if ("erreur" in e) return e.erreur;
  const { data: fiche } = await dbAdmin().from("fichiers_utilisateur").select("type, taille").eq("utilisateur_id", e.compte.id).eq("id", e.id).maybeSingle();
  if (!fiche) return refus(404, "absent");
  const { data, error } = await dbAdmin().storage.from(ESPACE_COMPTES).createSignedUrl(e.chemin, 600);
  if (error || !data) return refus(404, "absent");
  return NextResponse.json({ url: data.signedUrl, type: fiche.type }, { headers: SANS_CACHE });
}

/** Prépare l'envoi d'un fichier : vérifie la place, puis donne un lien d'envoi à usage unique. */
export async function POST(requete: NextRequest, contexte: Contexte) {
  const e = await entree(requete, contexte);
  if ("erreur" in e) return e.erreur;
  let corps: { type?: unknown; taille?: unknown };
  try {
    corps = (await requete.json()) as { type?: unknown; taille?: unknown };
  } catch {
    return refus(400, "illisible");
  }
  const taille = typeof corps.taille === "number" && Number.isFinite(corps.taille) ? Math.floor(corps.taille) : -1;
  const type = typeof corps.type === "string" && /^[\w.+-]+\/[\w.+-]+$/.test(corps.type) ? corps.type.slice(0, 120) : "application/octet-stream";
  if (taille < 0) return refus(400, "illisible");
  if (taille > FICHIER_MAX) return refus(413, "trop-lourd");

  const { data: deja } = await dbAdmin().from("fichiers_utilisateur").select("taille").eq("utilisateur_id", e.compte.id).eq("id", e.id).maybeSingle();
  const place = await placeDuCompte(e.compte.id);
  if (!place) return refus(503, "indisponible");
  if (place.fichiers - Number(deja?.taille ?? 0) + taille > PLAFOND_FICHIERS) return refus(413, "plein");

  const { error: erreurFiche } = await dbAdmin().from("fichiers_utilisateur").upsert({ utilisateur_id: e.compte.id, id: e.id, type, taille }, { onConflict: "utilisateur_id,id" });
  if (erreurFiche) return refus(503, "indisponible");
  const { data, error } = await dbAdmin().storage.from(ESPACE_COMPTES).createSignedUploadUrl(e.chemin, { upsert: true });
  if (error || !data) return refus(503, "indisponible");
  return NextResponse.json({ url: data.signedUrl, type }, { headers: SANS_CACHE });
}

export async function DELETE(requete: NextRequest, contexte: Contexte) {
  const e = await entree(requete, contexte);
  if ("erreur" in e) return e.erreur;
  await dbAdmin().storage.from(ESPACE_COMPTES).remove([e.chemin]);
  await dbAdmin().from("fichiers_utilisateur").delete().eq("utilisateur_id", e.compte.id).eq("id", e.id);
  return NextResponse.json({ ok: true }, { headers: SANS_CACHE });
}
