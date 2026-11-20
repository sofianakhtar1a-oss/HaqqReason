"use client";

import { Copy, Paintbrush, Plus, Trash2, WandSparkles } from "lucide-react";
import { useState } from "react";
import { BORNES_JETON, GRAISSES, POLICES, STYLES_NOMMES_PAR_DEFAUT, type DocumentAtelier, type ReglagesPage, type StyleNomme } from "@/lib/atelier/modele";
import { JEUX_STYLES, jeuActuel, reglagesDuJeu } from "@/lib/atelier/jeux-styles";
import { modifierPreferences } from "@/lib/atelier/preferences";
import { usePreferences } from "../crochets";
import { Curseur } from "../Inspecteur";

type Props = {
  reglages: ReglagesPage;
  surReglages: (modif: Partial<ReglagesPage>) => void;
  /** Les autres documents, pour en reprendre les styles. */
  documents: DocumentAtelier[];
  docId: string;
};

const PROTEGES = new Set(STYLES_NOMMES_PAR_DEFAUT.map((s) => s.id));

const ALIGNEMENTS: { cle: StyleNomme["alignement"]; libelle: string }[] = [
  { cle: "", libelle: "Comme le texte" },
  { cle: "left", libelle: "À gauche" },
  { cle: "center", libelle: "Centré" },
  { cle: "right", libelle: "À droite" },
  { cle: "justify", libelle: "Justifié" },
];

function nouvelId(nom: string, existants: StyleNomme[]): string {
  const base =
    nom
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 30) || "style";
  let id = base;
  for (let i = 2; existants.some((s) => s.id === id); i++) id = `${base}-${i}`;
  return id;
}

function EditeurStyle({ style, surChangement, surSupprimer }: { style: StyleNomme; surChangement: (m: Partial<StyleNomme>) => void; surSupprimer: (() => void) | null }) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <section className="inspecteur-jeton" data-ouvert={ouvert ? "" : undefined}>
      <button type="button" className="inspecteur-jeton-tete" onClick={() => setOuvert((o) => !o)} aria-expanded={ouvert}>
        <span className="font-semibold">{style.nom}</span>
        <span className="text-sm text-encre-douce">
          {style.genre === "paragraphe" ? "Paragraphe" : "Caractère"} · {style.taille} pt
        </span>
      </button>
      {ouvert && (
        <div className="inspecteur-jeton-corps">
          <label className="inspecteur-reglage">
            <span className="inspecteur-libelle">Nom</span>
            <input className="champ" value={style.nom} onChange={(e) => surChangement({ nom: e.target.value.slice(0, 40) })} />
          </label>
          <label className="inspecteur-reglage">
            <span className="inspecteur-libelle">Police</span>
            <select className="champ" value={style.police} onChange={(e) => surChangement({ police: e.target.value as StyleNomme["police"] })}>
              {POLICES.map((p) => (
                <option key={p.cle} value={p.cle}>
                  {p.libelle}
                </option>
              ))}
            </select>
          </label>
          <Curseur id={`sn-${style.id}-taille`} libelle="Taille" valeur={style.taille} bornes={BORNES_JETON.taille} unite=" pt" surChangement={(taille) => surChangement({ taille })} />
          <div className="flex items-center gap-3">
            <label className="inspecteur-reglage flex-1">
              <span className="inspecteur-libelle">Graisse</span>
              <select className="champ" value={style.graisse} onChange={(e) => surChangement({ graisse: Number(e.target.value) })}>
                {GRAISSES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </label>
            <label className="inspecteur-reglage">
              <span className="inspecteur-libelle">Couleur</span>
              <input type="color" className="inspecteur-couleur" value={style.couleur} onChange={(e) => surChangement({ couleur: e.target.value })} aria-label="Couleur du style" />
            </label>
          </div>
          <label className="inspecteur-bascule">
            <input type="checkbox" checked={style.italique} onChange={(e) => surChangement({ italique: e.target.checked })} />
            <span>Italique</span>
          </label>
          <label className="inspecteur-bascule">
            <input type="checkbox" checked={style.majuscules} onChange={(e) => surChangement({ majuscules: e.target.checked })} />
            <span>Petites capitales</span>
          </label>
          {style.genre === "paragraphe" && (
            <>
              <Curseur id={`sn-${style.id}-interligne`} libelle="Interligne" valeur={style.interligne} bornes={BORNES_JETON.interligne} unite="" surChangement={(interligne) => surChangement({ interligne })} />
              <div className="grid grid-cols-2 gap-3">
                <Curseur id={`sn-${style.id}-avant`} libelle="Avant" valeur={style.avant} bornes={BORNES_JETON.avant} unite=" pt" surChangement={(avant) => surChangement({ avant })} />
                <Curseur id={`sn-${style.id}-apres`} libelle="Après" valeur={style.apres} bornes={BORNES_JETON.apres} unite=" pt" surChangement={(apres) => surChangement({ apres })} />
              </div>
              <Curseur id={`sn-${style.id}-retrait`} libelle="Retrait à gauche" valeur={style.retrait} bornes={{ min: 0, max: 40, pas: 1 }} unite=" mm" surChangement={(retrait) => surChangement({ retrait })} />
              <label className="inspecteur-reglage">
                <span className="inspecteur-libelle">Alignement</span>
                <select className="champ" value={style.alignement} onChange={(e) => surChangement({ alignement: e.target.value as StyleNomme["alignement"] })}>
                  {ALIGNEMENTS.map((a) => (
                    <option key={a.cle} value={a.cle}>
                      {a.libelle}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
          {surSupprimer && (
            <button type="button" className="bouton bouton-discret w-full" onClick={surSupprimer}>
              <Trash2 className="size-4" aria-hidden="true" /> Supprimer ce style
            </button>
          )}
        </div>
      )}
    </section>
  );
}

/** L'onglet « Styles », suite : jeux de styles en un clic, styles nommés, styles repris d'un autre document. */
export function PanneauStyles({ reglages, surReglages, documents, docId }: Props) {
  const prefs = usePreferences();
  const [source, setSource] = useState("");
  const actuel = jeuActuel(reglages);
  const styles = reglages.stylesNommes;
  const modifierStyle = (id: string, m: Partial<StyleNomme>) => surReglages({ stylesNommes: styles.map((s) => (s.id === id ? { ...s, ...m } : s)) });
  const ajouter = (genre: StyleNomme["genre"]) => {
    const nom = genre === "paragraphe" ? "Nouveau style" : "Nouveau style de caractère";
    const modele = genre === "paragraphe" ? STYLES_NOMMES_PAR_DEFAUT[1] : STYLES_NOMMES_PAR_DEFAUT[3];
    surReglages({ stylesNommes: [...styles, { ...modele, id: nouvelId(nom, styles), nom, genre, italique: false, alignement: "" }] });
  };
  const autres = documents.filter((d) => d.id !== docId);

  return (
    <>
      <section className="calame-section" aria-labelledby="st-jeux">
        <h3 className="calame-section-titre" id="st-jeux">
          <WandSparkles className="size-4" aria-hidden="true" /> Jeux de styles
        </h3>
        <div className="calame-jeux">
          {JEUX_STYLES.map((j) => (
            <button
              key={j.cle}
              type="button"
              className="calame-jeu"
              aria-pressed={actuel === j.cle}
              onClick={() => {
                const r = reglagesDuJeu(j.cle);
                if (r) surReglages(r);
              }}
            >
              <span className="calame-jeu-nom">{j.libelle}</span>
              <span className="calame-jeu-description">{j.description}</span>
            </button>
          ))}
        </div>
        <label className="inspecteur-reglage">
          <span className="inspecteur-libelle">Jeu des nouveaux documents</span>
          <select className="champ" value={prefs.jeuParDefaut ?? ""} onChange={(e) => modifierPreferences({ jeuParDefaut: e.target.value || null })}>
            <option value="">D&apos;origine</option>
            {JEUX_STYLES.filter((j) => j.cle !== "origine").map((j) => (
              <option key={j.cle} value={j.cle}>
                {j.libelle}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="calame-section" aria-labelledby="st-nommes">
        <h3 className="calame-section-titre" id="st-nommes">
          <Paintbrush className="size-4" aria-hidden="true" /> Styles nommés
        </h3>
        <p className="inspecteur-aide">Pose-les depuis la liste « Style » de la barre d&apos;outils : un paragraphe entier, ou seulement les mots choisis.</p>
        {styles.map((s) => (
          <EditeurStyle key={s.id} style={s} surChangement={(m) => modifierStyle(s.id, m)} surSupprimer={PROTEGES.has(s.id) ? null : () => surReglages({ stylesNommes: styles.filter((x) => x.id !== s.id) })} />
        ))}
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="bouton bouton-discret" onClick={() => ajouter("paragraphe")}>
            <Plus className="size-4" aria-hidden="true" /> Paragraphe
          </button>
          <button type="button" className="bouton bouton-discret" onClick={() => ajouter("caractere")}>
            <Plus className="size-4" aria-hidden="true" /> Caractère
          </button>
        </div>
      </section>

      {autres.length > 0 && (
        <section className="calame-section" aria-labelledby="st-reprendre">
          <h3 className="calame-section-titre" id="st-reprendre">
            <Copy className="size-4" aria-hidden="true" /> Reprendre les styles d&apos;un autre document
          </h3>
          <div className="flex gap-2">
            <select className="champ flex-1" value={source} onChange={(e) => setSource(e.target.value)} aria-label="Document dont reprendre les styles">
              <option value="">Choisir un document…</option>
              {autres.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.titre || "Sans titre"}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="bouton bouton-principal"
              disabled={!source}
              onClick={() => {
                const d = autres.find((x) => x.id === source);
                if (!d) return;
                surReglages({ styles: JSON.parse(JSON.stringify(d.reglages.styles)), stylesNommes: JSON.parse(JSON.stringify(d.reglages.stylesNommes ?? STYLES_NOMMES_PAR_DEFAUT)), alinea: d.reglages.alinea, lettrine: d.reglages.lettrine, cesure: d.reglages.cesure, justifier: d.reglages.justifier, numeroterTitres: d.reglages.numeroterTitres });
                setSource("");
              }}
            >
              Reprendre
            </button>
          </div>
          <p className="inspecteur-aide">Polices, tailles, couleurs, styles nommés et composition du texte : le document prend l&apos;allure de l&apos;autre, sans toucher à son texte.</p>
        </section>
      )}
    </>
  );
}
