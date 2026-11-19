import { planchePortulan, TAILLE_APERCU_PORTULAN } from "@/lib/monde/apercu-portulan";
import { TEXTES_INVITATION } from "@/lib/monde/invitations";
import { codeInvitationValide, estSorteInvitation } from "@/lib/monde/pages-publiques";

export const size = TAILLE_APERCU_PORTULAN;
export const contentType = "image/png";
export const alt = "Une invitation au Portulan";

export default async function Image({ params }: { params: Promise<{ sorte: string; code: string }> }) {
  const { sorte, code: brut } = await params;
  const code = brut.toUpperCase();
  if (!estSorteInvitation(sorte) || !codeInvitationValide(sorte, code)) {
    return planchePortulan({ titre: "Le Portulan", ligne: "Apprendre la géographie en jouant", pied: "Drapeaux, capitales, cartes, continents, monnaies" });
  }
  const t = TEXTES_INVITATION[sorte];
  return planchePortulan({ titre: t.titre, ligne: t.ligne, pied: "Le jeu de géographie de HaqqReason", code });
}
