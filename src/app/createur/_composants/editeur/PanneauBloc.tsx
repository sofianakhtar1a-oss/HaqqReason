"use client";

import type { Editor } from "@tiptap/core";
import { NodeSelection } from "@tiptap/pm/state";
import { useEditorState } from "@tiptap/react";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { DEGRES_HADITH, ENCADRES, LARGEURS_IMAGE, lienSur } from "@/lib/document-schema";
import { FAMILLES_SOPHISMES, SOPHISMES, sophismeParCle } from "@/lib/sophismes";
import { BLOCS } from "./commandes";

/*
 * Panneau « Bloc sélectionné » : réglages du bloc où se trouve le curseur
 * (référence d'un verset, recueil et degré d'un hadith, champs d'une source, texte d'une note…).
 */

const BLOCS_REGLABLES = ["verset", "hadith", "encadre", "frise", "objectionReponse", "comparaison", "accordeon"];

const NOMS: Record<string, string> = {
  verset: "Verset coranique",
  hadith: "Hadith",
  encadre: "Encadré",
  frise: "Frise chronologique",
  objectionReponse: "Objection → Réponse",
  comparaison: "Comparaison",
  accordeon: "Section repliable",
  source: "Source",
  note: "Note de bas de page",
  image: "Image",
  documentPdf: "Document PDF",
  lienCarte: "Carte de lien",
  schema: "Schéma",
  logique: "Atelier de logique",
  sophisme: "Sophisme identifié",
  reference: "Référence",
  citationOuvrage: "Citation d'un ouvrage",
};

const RECUEILS = [
  "Sahih al-Bukhari",
  "Sahih Muslim",
  "Sunan Abi Dawud",
  "Jami' at-Tirmidhi",
  "Sunan an-Nasa'i",
  "Sunan Ibn Majah",
  "Muwatta Malik",
  "Musnad Ahmad",
  "Sunan ad-Darimi",
  "Sahih Ibn Hibban",
  "Al-Mustadrak d'al-Hakim",
];

type Bloc = { type: string; pos: number; attrs: Record<string, unknown> } | null;

function blocCourant(editor: Editor): Bloc {
  const { selection } = editor.state;
  if (selection instanceof NodeSelection && ["source", "note", "image", "documentPdf", "lienCarte", "schema", "logique", "sophisme", "reference", "citationOuvrage"].includes(selection.node.type.name)) {
    return { type: selection.node.type.name, pos: selection.from, attrs: { ...selection.node.attrs } };
  }
  const { $from } = selection;
  for (let d = $from.depth; d > 0; d--) {
    const n = $from.node(d);
    if (BLOCS_REGLABLES.includes(n.type.name)) return { type: n.type.name, pos: $from.before(d), attrs: { ...n.attrs } };
  }
  return null;
}

function Champ({ id, libelle, valeur, onChange, aide, liste, dir }: { id: string; libelle: string; valeur: string; onChange: (v: string) => void; aide?: string; liste?: string; dir?: "rtl" }) {
  return (
    <div>
      <label htmlFor={id} className="etiquette text-sm">
        {libelle}
      </label>
      <input id={id} className="champ !min-h-10 !py-2" value={valeur} onChange={(e) => onChange(e.target.value)} list={liste} dir={dir} autoComplete="off" />
      {aide && <p className="aide mt-1 text-sm">{aide}</p>}
    </div>
  );
}

export function PanneauBloc({ editor }: { editor: Editor }) {
  const bloc = useEditorState({ editor, selector: ({ editor: ed }) => blocCourant(ed) });
  const [erreurLien, setErreurLien] = useState("");
  if (!bloc) return null;

  // Modifie seulement les attributs (sans remplacer le bloc) : la sélection et le panneau restent en place.
  const modifier = (changements: Record<string, unknown>) => {
    editor
      .chain()
      .command(({ tr }) => {
        if (!tr.doc.nodeAt(bloc.pos)) return false;
        for (const [cle, valeur] of Object.entries(changements)) tr.setNodeAttribute(bloc.pos, cle, valeur);
        return true;
      })
      .run();
  };
  const supprimer = () => {
    editor
      .chain()
      .focus()
      .command(({ tr }) => {
        const noeud = tr.doc.nodeAt(bloc.pos);
        if (!noeud) return false;
        tr.delete(bloc.pos, bloc.pos + noeud.nodeSize);
        return true;
      })
      .run();
  };
  const a = (cle: string) => String(bloc.attrs[cle] ?? "");

  return (
    <section
      className="verre panneau space-y-4"
      aria-labelledby="titre-bloc"
      onKeyDown={(e) => {
        // Échap ramène dans le texte, exactement là où se trouvait le curseur.
        if (e.key === "Escape") {
          e.preventDefault();
          editor.commands.focus();
        }
      }}
    >
      <h2 id="titre-bloc" className="text-lg font-bold">
        {NOMS[bloc.type]}
      </h2>
      <p className="aide text-sm">Échap pour revenir au texte.</p>

      {bloc.type === "verset" && (
        <Champ
          id="verset-reference"
          libelle="Référence"
          valeur={a("reference")}
          onChange={(v) => modifier({ reference: v })}
          aide="Par exemple : al-Baqara (2:255). Le texte arabe s'écrit de droite à gauche dans le bloc."
        />
      )}

      {bloc.type === "hadith" && (
        <>
          <Champ id="hadith-recueil" libelle="Recueil" valeur={a("recueil")} onChange={(v) => modifier({ recueil: v })} liste="liste-recueils" />
          <datalist id="liste-recueils">
            {RECUEILS.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
          <Champ id="hadith-numero" libelle="Numéro" valeur={a("numero")} onChange={(v) => modifier({ numero: v })} />
          <div>
            <label htmlFor="hadith-degre" className="etiquette text-sm">
              Degré d&apos;authenticité
            </label>
            <select id="hadith-degre" className="champ !min-h-10 !py-2" value={a("degre")} onChange={(e) => modifier({ degre: e.target.value })}>
              {DEGRES_HADITH.map((d) => (
                <option key={d.cle} value={d.cle}>
                  {d.libelle}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      {bloc.type === "encadre" && (
        <div>
          <label htmlFor="encadre-type" className="etiquette text-sm">
            Type d&apos;encadré
          </label>
          <select id="encadre-type" className="champ !min-h-10 !py-2" value={a("type")} onChange={(e) => modifier({ type: e.target.value })}>
            {ENCADRES.map((t) => (
              <option key={t.cle} value={t.cle}>
                {t.libelle}
              </option>
            ))}
          </select>
        </div>
      )}

      {bloc.type === "frise" && (
        <button
          type="button"
          className="bouton bouton-discret w-full"
          onClick={() => {
            const noeud = editor.state.doc.nodeAt(bloc.pos);
            if (!noeud) return;
            const fin = bloc.pos + noeud.nodeSize - 1;
            editor.chain().focus().insertContentAt(fin, BLOCS.evenement()).setTextSelection(fin + 2).run();
          }}
        >
          <Plus className="size-4" aria-hidden="true" />
          Ajouter un événement
        </button>
      )}

      {bloc.type === "source" && (
        <>
          <Champ id="source-auteur" libelle="Auteur" valeur={a("auteur")} onChange={(v) => modifier({ auteur: v })} />
          <Champ id="source-ouvrage" libelle="Ouvrage" valeur={a("ouvrage")} onChange={(v) => modifier({ ouvrage: v })} />
          <Champ id="source-edition" libelle="Édition, année" valeur={a("edition")} onChange={(v) => modifier({ edition: v })} />
          <Champ id="source-page" libelle="Page" valeur={a("page")} onChange={(v) => modifier({ page: v })} />
          <div>
            <label htmlFor="source-lien" className="etiquette text-sm">
              Lien (facultatif)
            </label>
            <input
              id="source-lien"
              className="champ !min-h-10 !py-2"
              defaultValue={a("lien")}
              placeholder="https://"
              onBlur={(e) => {
                const brut = e.target.value.trim();
                if (!brut) {
                  setErreurLien("");
                  modifier({ lien: "" });
                  return;
                }
                const sur = lienSur(brut);
                setErreurLien(sur ? "" : "Adresse invalide : elle doit commencer par https://");
                if (sur) modifier({ lien: sur });
              }}
            />
            {erreurLien && <p className="mt-1 text-sm text-danger">{erreurLien}</p>}
          </div>
          <p className="aide text-sm">La source est ajoutée automatiquement à la bibliographie en fin d&apos;article.</p>
        </>
      )}

      {bloc.type === "note" && (
        <div>
          <label htmlFor="note-texte" className="etiquette text-sm">
            Texte de la note
          </label>
          <textarea id="note-texte" className="champ min-h-28" value={a("texte")} onChange={(e) => modifier({ texte: e.target.value })} autoFocus />
          <p className="aide mt-1 text-sm">Affichée en fin d&apos;article, numérotée automatiquement.</p>
        </div>
      )}

      {bloc.type === "image" && (
        <>
          <Champ id="image-legende" libelle="Légende" valeur={a("legende")} onChange={(v) => modifier({ legende: v })} />
          <Champ
            id="image-alt"
            libelle="Description pour les personnes aveugles"
            valeur={a("alt")}
            onChange={(v) => modifier({ alt: v })}
            aide="Décris ce que montre l'image (lue par les lecteurs d'écran)."
          />
          <div>
            <label htmlFor="image-largeur" className="etiquette text-sm">
              Largeur
            </label>
            <select id="image-largeur" className="champ !min-h-10 !py-2" value={a("largeur") || "normale"} onChange={(e) => modifier({ largeur: e.target.value })}>
              {LARGEURS_IMAGE.map((l) => (
                <option key={l.cle} value={l.cle}>
                  {l.libelle}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      {bloc.type === "documentPdf" && (
        <>
          <Champ id="document-nom" libelle="Texte du lien" valeur={a("nom")} onChange={(v) => modifier({ nom: v })} />
          <Champ
            id="document-page"
            libelle="Ouvrir à la page"
            valeur={a("page") || "1"}
            onChange={(v) => modifier({ page: v.replace(/\D/g, "") || "1" })}
            aide="Le lecteur arrive directement sur cette page."
          />
        </>
      )}

      {bloc.type === "lienCarte" && (
        <>
          <p className="break-all text-sm text-encre-douce">{a("url")}</p>
          <Champ id="lien-titre" libelle="Titre affiché" valeur={a("titre")} onChange={(v) => modifier({ titre: v })} />
          <div>
            <label htmlFor="lien-description" className="etiquette text-sm">
              Description
            </label>
            <textarea id="lien-description" className="champ min-h-20" value={a("description")} maxLength={500} onChange={(e) => modifier({ description: e.target.value })} />
          </div>
          <p className="aide text-sm">Toute la carte ouvre le lien dans un nouvel onglet.</p>
        </>
      )}

      {(bloc.type === "schema" || bloc.type === "logique") && <p className="aide text-sm">Clique sur « Modifier » au-dessus du bloc, ou double-clique dessus, pour ouvrir l&apos;atelier.</p>}

      {bloc.type === "sophisme" && (
        <>
          <div>
            <label htmlFor="sophisme-cle" className="etiquette text-sm">
              Sophisme
            </label>
            <select id="sophisme-cle" className="champ !min-h-10 !py-2" value={a("cle")} onChange={(e) => modifier({ cle: e.target.value })}>
              {FAMILLES_SOPHISMES.map((f) => (
                <optgroup key={f} label={f}>
                  {SOPHISMES.filter((x) => x.famille === f).map((x) => (
                    <option key={x.cle} value={x.cle}>
                      {x.nom}
                      {x.latin ? ` (${x.latin})` : ""}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <p className="aide mt-1 text-sm">{sophismeParCle(a("cle"))?.reponse}</p>
          </div>
          <div>
            <label htmlFor="sophisme-commentaire" className="etiquette text-sm">
              Où se trouve l&apos;erreur dans cet argument
            </label>
            <textarea id="sophisme-commentaire" className="champ min-h-20" value={a("commentaire")} maxLength={1000} onChange={(e) => modifier({ commentaire: e.target.value })} />
          </div>
        </>
      )}

      {bloc.type === "reference" && !a("citation") && (
        <>
          <Champ id="reference-tome" libelle="Tome" valeur={a("tome")} onChange={(v) => modifier({ tome: v })} />
          <Champ id="reference-page" libelle="Page" valeur={a("page")} onChange={(v) => modifier({ page: v })} aide="L'ouvrage est ajouté à la bibliographie en fin d'article." />
        </>
      )}

      {(bloc.type === "citationOuvrage" || (bloc.type === "reference" && a("citation"))) && <p className="aide text-sm">Le texte, la page et le statut de la citation se modifient dans Outils, Sources.</p>}

      {(bloc.type === "objectionReponse" || bloc.type === "comparaison" || bloc.type === "accordeon") && (
        <p className="aide text-sm">
          {bloc.type === "objectionReponse" && "Formule l'objection comme la présentent ses meilleurs défenseurs, puis réponds-y."}
          {bloc.type === "comparaison" && "Les deux colonnes s'affichent côte à côte sur ordinateur, l'une sous l'autre sur téléphone."}
          {bloc.type === "accordeon" && "Le lecteur voit le titre et ouvre la section s'il le souhaite."}
        </p>
      )}

      <button type="button" className="bouton bouton-danger w-full !min-h-10" onClick={supprimer}>
        <Trash2 className="size-4" aria-hidden="true" />
        Supprimer ce bloc
      </button>
    </section>
  );
}

