"use client";

import { Fenetre } from "./Fenetre";

const RACCOURCIS: { groupe: string; touches: [string, string][] }[] = [
  {
    groupe: "Partout",
    touches: [
      ["Ctrl + K", "Barre de commande : tout le Calame au clavier"],
      ["Ctrl + F", "Rechercher dans le document"],
      ["Ctrl + H", "Rechercher et remplacer"],
      ["Ctrl + S", "Enregistrer et garder une version"],
      ["Ctrl + P", "Imprimer ou enregistrer en PDF"],
      ["Ctrl + Maj + F", "Mode concentration"],
      ["Ctrl + Maj + C", "Caractères et formules de respect"],
      ["F1 ou Ctrl + /", "Cette aide"],
    ],
  },
  {
    groupe: "Mise en forme",
    touches: [
      ["Ctrl + B / I / U", "Gras, italique, souligné"],
      ["Ctrl + Alt + 1, 2, 3", "Grand titre, titre moyen, petit titre"],
      ["Ctrl + Alt + 0", "Texte normal"],
      ["Ctrl + Maj + 8 / 7", "Liste à puces, liste numérotée"],
      ["Ctrl + Maj + B", "Citation"],
      ["Ctrl + Alt + V", "Verset coranique"],
      ["Ctrl + Alt + H", "Hadith"],
      ["Ctrl + Alt + N", "Note de bas de page"],
      ["/", "Insérer un bloc (tableau, frise, carte mentale…)"],
    ],
  },
  {
    groupe: "Pendant la frappe",
    touches: [
      ["saws + espace", "ﷺ"],
      ["swt + espace", "ﷻ"],
      [":ra: :as: :rah:", "Formules de respect en arabe"],
      ["# + espace", "Grand titre (## titre moyen, ### petit titre)"],
      ["- + espace", "Liste à puces"],
      ["1. + espace", "Liste numérotée"],
      ["> + espace", "Citation"],
      ["... / -- / ---", "… / – / —"],
    ],
  },
];

export function Aide({ surFermer, surBienvenue }: { surFermer: () => void; surBienvenue: () => void }) {
  return (
    <Fenetre titre="Raccourcis du Calame" sousTitre="Sur Mac, Cmd remplace Ctrl." surFermer={surFermer} largeur={44}>
      {RACCOURCIS.map((g) => (
        <section key={g.groupe} className="calame-aide-groupe">
          <h3 className="choix-menu-groupe">{g.groupe}</h3>
          <dl>
            {g.touches.map(([t, d]) => (
              <div key={t}>
                <dt>
                  <kbd className="calame-touche">{t}</kbd>
                </dt>
                <dd>{d}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
      <button type="button" className="bouton bouton-discret w-full" onClick={surBienvenue}>
        Ouvrir le document de bienvenue (tout ce que sait faire le Calame)
      </button>
    </Fenetre>
  );
}
