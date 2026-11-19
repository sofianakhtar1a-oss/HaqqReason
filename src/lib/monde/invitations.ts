import type { SorteInvitation } from "./pages-publiques";

/* Ce que dit une invitation partagée (la page publique, et son image d'aperçu). */
export const TEXTES_INVITATION: Record<SorteInvitation, { titre: string; ligne: string; texte: string; bouton: string }> = {
  duel: {
    titre: "Un duel t'attend",
    ligne: "Drapeaux, capitales, cartes : le plus juste et le plus rapide l'emporte.",
    texte: "On te lance un défi au Portulan, le jeu de géographie de HaqqReason. Les mêmes questions pour vous deux ; chaque bonne réponse rapporte, la vitesse aussi.",
    bouton: "Relever le défi",
  },
  salon: {
    titre: "Un salon t'attend",
    ligne: "De trois à huit joueurs, les mêmes questions pour tous.",
    texte: "Un salon du Portulan, le jeu de géographie de HaqqReason : quinze secondes par question, et un classement qui bouge à chaque réponse.",
    bouton: "Entrer dans le salon",
  },
  ami: {
    titre: "Une invitation d'ami",
    ligne: "Pour se défier au Portulan quand on veut.",
    texte: "Quelqu'un veut t'ajouter en ami au Portulan, le jeu de géographie de HaqqReason : vous pourrez vous lancer des duels et comparer vos progrès.",
    bouton: "Accepter l'invitation",
  },
  classe: {
    titre: "Rejoins la classe",
    ligne: "Ton enseignant suit tes progrès en géographie.",
    texte: "Une classe du Portulan, le jeu de géographie de HaqqReason : drapeaux, capitales, cartes et continents, à ton rythme.",
    bouton: "Rejoindre la classe",
  },
};
