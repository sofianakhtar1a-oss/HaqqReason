import "server-only";
import { LIMITES_DOCUMENT, type NoeudJSON } from "./document-schema";
import { normaliser } from "./recherche-texte";
import { dbPublic } from "./supabase";

export type FicheDebat = {
  cle: string;
  articleId: string;
  articleTitre: string;
  blocId: string;
  objection: string;
  reponse: NoeudJSON;
  recherche: string;
};

const texteDe = (n: NoeudJSON | undefined): string =>
  !n ? "" : n.type === "text" ? (n.text ?? "") : (n.content ?? []).map(texteDe).join(n.type === "paragraph" ? " " : " ");

/** Toutes les fiches Objection → Réponse des articles publiés. */
export async function fichesDebat(): Promise<FicheDebat[]> {
  const { data } = await dbPublic()
    .from("articles")
    .select("id, titre, bloc_id, contenu")
    .neq("texte_objections", "")
    .order("titre")
    .limit(2000);
  const fiches: FicheDebat[] = [];
  for (const a of (data ?? []) as { id: string; titre: string; bloc_id: string; contenu: NoeudJSON }[]) {
    let n = 0;
    const parcourir = (noeud: NoeudJSON, profondeur: number) => {
      if (profondeur > LIMITES_DOCUMENT.profondeur) return;
      if (noeud.type === "objectionReponse") {
        const objection = texteDe(noeud.content?.find((e) => e.type === "objection")).replace(/\s+/g, " ").trim();
        const reponse = noeud.content?.find((e) => e.type === "reponse");
        if (objection && reponse) {
          fiches.push({
            cle: `${a.id}-${n++}`,
            articleId: a.id,
            articleTitre: a.titre,
            blocId: a.bloc_id,
            objection,
            reponse: { type: "doc", content: reponse.content ?? [] },
            recherche: normaliser(`${objection} ${texteDe(reponse)} ${a.titre}`),
          });
        }
        return;
      }
      for (const e of noeud.content ?? []) parcourir(e, profondeur + 1);
    };
    parcourir(a.contenu, 0);
  }
  return fiches;
}
