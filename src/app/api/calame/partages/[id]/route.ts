import { NextResponse, type NextRequest } from "next/server";
import { LIMITES_PARTAGE, ROLES_PARTAGE, type RolePartage } from "@/lib/atelier/partage-commun";
import { ajouterMembre, changementsDepuis, ecrireBase, fichiersDeposes, lireBase, peutEcrire, quitter, remettre, rendre, retirerMembre, supprimerPartage } from "@/lib/atelier/partages";
import { SANS_CACHE, acces, refus } from "@/lib/atelier/partages-acces";

/*
 * Un document partagé.
 *   GET     ce qu'il faut pour l'ouvrir : membres, mon rôle, le texte de départ et les changements depuis ;
 *   POST    { action: "membre", compte, role } | { action: "retirer", compte } | { action: "remettre", classe }
 *           | { action: "rendre" } | { action: "quitter" } | { action: "base", version, contenu, reglages, titre } ;
 *   DELETE  arrêter le partage (le propriétaire seul ; chacun garde sa copie).
 */
type Contexte = { params: Promise<{ id: string }> };

export async function GET(requete: NextRequest, { params }: Contexte) {
  const a = await acces(requete, (await params).id);
  if (a instanceof NextResponse) return a;
  const base = await lireBase(a.meta.id);
  if (!base) return refus(404, "Le texte de ce partage est introuvable.");
  const suite = await changementsDepuis(a.meta.id, base.version);
  if ("recharger" in suite) return refus(409, "Le partage est en cours de mise à jour : réessaie dans un instant.");
  const fichiers = await fichiersDeposes(a.meta.id);
  return NextResponse.json({ meta: a.meta, role: a.role, moi: a.compte, base, ...suite, fichiers }, { headers: SANS_CACHE });
}

export async function POST(requete: NextRequest, { params }: Contexte) {
  const a = await acces(requete, (await params).id);
  if (a instanceof NextResponse) return a;
  let o: Record<string, unknown>;
  try {
    const brut = await requete.text();
    if (brut.length > LIMITES_PARTAGE.poidsBase + 10_000) return refus(413, "Trop lourd.");
    o = JSON.parse(brut) as Record<string, unknown>;
  } catch {
    return refus(400, "Envoi illisible.");
  }
  const proprietaire = a.role === "proprietaire";
  const reponse = (r: unknown) => ("erreur" in (r as object) ? refus(400, (r as { erreur: string }).erreur) : NextResponse.json({ meta: r }, { headers: SANS_CACHE }));
  switch (o.action) {
    case "membre": {
      if (!proprietaire) return refus(403, "Seul le propriétaire choisit qui participe.");
      const role = ROLES_PARTAGE.some((r) => r.cle === o.role) ? (o.role as RolePartage) : null;
      if (typeof o.compte !== "string" || !role) return refus(400, "Choix illisible.");
      return reponse(await ajouterMembre(a.meta, o.compte, role));
    }
    case "retirer":
      if (!proprietaire) return refus(403, "Seul le propriétaire choisit qui participe.");
      if (typeof o.compte !== "string") return refus(400, "Choix illisible.");
      return reponse(await retirerMembre(a.meta, o.compte));
    case "remettre":
      if (typeof o.classe !== "string") return refus(400, "Classe illisible.");
      return reponse(await remettre(a.meta, a.compte, o.classe));
    case "rendre":
      return reponse(await rendre(a.meta, a.compte));
    case "quitter":
      return (await quitter(a.meta, a.compte)) ? NextResponse.json({ ok: true }, { headers: SANS_CACHE }) : refus(400, "Le propriétaire ne quitte pas son document : il arrête le partage.");
    case "base": {
      if (!peutEcrire(a.role)) return refus(403, "Lecture seule.");
      const version = Number(o.version);
      const contenu = o.contenu as { type?: unknown } | undefined;
      if (!Number.isInteger(version) || version < 0 || !contenu || contenu.type !== "doc") return refus(400, "Envoi illisible.");
      return (await ecrireBase(a.meta, a.role, { version, contenu, reglages: o.reglages ?? null, titre: String(o.titre ?? "") }))
        ? NextResponse.json({ ok: true }, { headers: SANS_CACHE })
        : refus(409, "Version dépassée.");
    }
    default:
      return refus(400, "Action inconnue.");
  }
}

export async function DELETE(requete: NextRequest, { params }: Contexte) {
  const a = await acces(requete, (await params).id);
  if (a instanceof NextResponse) return a;
  if (a.role !== "proprietaire") return refus(403, "Seul le propriétaire arrête le partage.");
  return (await supprimerPartage(a.meta)) ? NextResponse.json({ ok: true }, { headers: SANS_CACHE }) : refus(503, "Le stockage n'a pas répondu.");
}
