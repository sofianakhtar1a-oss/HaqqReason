import { NextResponse, type NextRequest } from "next/server";

/*
 * « Partager » vers le Calame, quand le service du site n'est pas encore installé sur l'appareil
 * (toute première visite) : le texte, le titre et le lien passent dans l'adresse du Calame, qui en
 * fait un document. Les fichiers ne peuvent pas suivre ce chemin : on dit combien sont restés en route.
 * Rien n'est gardé ici.
 */
export async function POST(requete: NextRequest) {
  const adresse = new URL("/ecrire", requete.url);
  try {
    const donnees = await requete.formData();
    const champ = (nom: string, max: number) => String(donnees.get(nom) ?? "").slice(0, max);
    const titre = champ("titre", 300);
    const texte = champ("texte", 6000);
    const lien = champ("lien", 2000);
    const fichiers = donnees.getAll("fichiers").filter((f) => typeof f === "object" && f !== null && (f as Blob).size > 0).length;
    if (titre) adresse.searchParams.set("recu-titre", titre);
    if (texte) adresse.searchParams.set("recu-texte", texte);
    if (lien) adresse.searchParams.set("recu-lien", lien);
    if (fichiers) adresse.searchParams.set("recu-fichiers", String(fichiers));
    if (!titre && !texte && !lien) adresse.searchParams.set("recu", fichiers ? "sans-service" : "echec");
  } catch {
    adresse.searchParams.set("recu", "echec");
  }
  return NextResponse.redirect(adresse, 303);
}
