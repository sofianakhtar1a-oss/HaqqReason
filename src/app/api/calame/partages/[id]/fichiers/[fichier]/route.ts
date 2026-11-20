import { NextResponse, type NextRequest } from "next/server";
import { deposerFichier, lireFichierPartage, peutEcrire } from "@/lib/atelier/partages";
import { acces, refus } from "@/lib/atelier/partages-acces";
import { FICHIER_MAX } from "@/lib/compte/limites";

/* Les images et PDF d'un document partagé : chaque membre les reçoit, l'auteur qui les ajoute les dépose. */
type Contexte = { params: Promise<{ id: string; fichier: string }> };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(requete: NextRequest, { params }: Contexte) {
  const { id, fichier } = await params;
  if (!UUID.test(fichier)) return refus(400, "Fichier illisible.");
  const a = await acces(requete, id);
  if (a instanceof NextResponse) return a;
  const blob = await lireFichierPartage(a.meta.id, fichier);
  if (!blob) return refus(404, "Fichier introuvable.");
  return new NextResponse(blob, { headers: { "Content-Type": blob.type || "application/octet-stream", "Cache-Control": "private, max-age=86400", "X-Content-Type-Options": "nosniff" } });
}

export async function PUT(requete: NextRequest, { params }: Contexte) {
  const { id, fichier } = await params;
  if (!UUID.test(fichier)) return refus(400, "Fichier illisible.");
  const a = await acces(requete, id);
  if (a instanceof NextResponse) return a;
  if (!peutEcrire(a.role)) return refus(403, "Lecture seule.");
  const taille = Number(requete.headers.get("content-length") ?? 0);
  if (taille > FICHIER_MAX) return refus(413, "Fichier trop lourd.");
  const blob = await requete.blob();
  if (blob.size > FICHIER_MAX) return refus(413, "Fichier trop lourd.");
  return (await deposerFichier(a.meta.id, fichier, blob)) ? NextResponse.json({ ok: true }) : refus(503, "Le stockage n'a pas répondu.");
}
