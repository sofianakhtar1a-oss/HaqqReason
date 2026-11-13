"use client";

import type { Editor } from "@tiptap/core";
import { useEditorState } from "@tiptap/react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Highlighter,
  Italic,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  Palette,
  Plus,
  Redo2,
  RemoveFormatting,
  Sparkles,
  Strikethrough,
  Subscript,
  Superscript,
  Underline,
  Undo2,
} from "lucide-react";
import { EFFETS, STYLES_SOULIGNE } from "@/lib/document-schema";
import { COMMANDES, executer } from "./commandes";
import { Deroulant } from "./Deroulant";
import { FormulaireLien, Pastilles } from "./outils-communs";

function Outil({ libelle, actif, onClick, desactive, children }: { libelle: string; actif?: boolean; onClick: () => void; desactive?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="outil"
      aria-label={libelle}
      title={libelle}
      aria-pressed={actif ?? undefined}
      disabled={desactive}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

const STYLES_PARAGRAPHE = [
  { valeur: "p", libelle: "Texte" },
  { valeur: "2", libelle: "Grand titre" },
  { valeur: "3", libelle: "Titre moyen" },
  { valeur: "4", libelle: "Petit titre" },
];

const GROUPES = ["Texte", "Apologétique", "Schémas", "Logique", "Liens et sources", "Encadrés"] as const;

export function BarreOutils({ editor }: { editor: Editor }) {
  const e = useEditorState({
    editor,
    selector: ({ editor: ed }) => ({
      gras: ed.isActive("bold"),
      italique: ed.isActive("italic"),
      barre: ed.isActive("strike"),
      exposant: ed.isActive("superscript"),
      indice: ed.isActive("subscript"),
      souligne: ed.isActive("souligne"),
      styleSouligne: (ed.getAttributes("souligne").style as string | undefined) ?? null,
      couleurSouligne: (ed.getAttributes("souligne").couleur as string | undefined) ?? null,
      surligne: (ed.getAttributes("surligne").couleur as string | undefined) ?? null,
      couleur: (ed.getAttributes("couleur").couleur as string | undefined) ?? null,
      effet: (ed.getAttributes("effet").type as string | undefined) ?? null,
      lien: ed.isActive("link"),
      niveau: ed.isActive("heading") ? String(ed.getAttributes("heading").level) : "p",
      puces: ed.isActive("bulletList"),
      numeros: ed.isActive("orderedList"),
      cases: ed.isActive("taskList"),
      alignement: (["left", "center", "right", "justify"] as const).find((a) => ed.isActive({ textAlign: a })) ?? "left",
      annuler: ed.can().undo(),
      refaire: ed.can().redo(),
    }),
  });

  const c = () => editor.chain().focus();
  const IconeAlignement = { left: AlignLeft, center: AlignCenter, right: AlignRight, justify: AlignJustify }[e.alignement];

  return (
    <div className="barre-outils" role="toolbar" aria-label="Mise en forme">
      <Outil libelle="Annuler (Ctrl+Z)" onClick={() => c().undo().run()} desactive={!e.annuler}>
        <Undo2 className="size-4" aria-hidden="true" />
      </Outil>
      <Outil libelle="Rétablir (Ctrl+Maj+Z)" onClick={() => c().redo().run()} desactive={!e.refaire}>
        <Redo2 className="size-4" aria-hidden="true" />
      </Outil>
      <span className="barre-separateur" aria-hidden="true" />

      <label className="sr-only" htmlFor="style-paragraphe">
        Style du paragraphe
      </label>
      <select
        id="style-paragraphe"
        className="outil !w-36 !justify-start bg-transparent"
        value={e.niveau}
        onChange={(ev) => {
          const v = ev.target.value;
          if (v === "p") c().setParagraph().run();
          else c().setNode("heading", { level: Number(v) }).run();
        }}
      >
        {STYLES_PARAGRAPHE.map((s) => (
          <option key={s.valeur} value={s.valeur}>
            {s.libelle}
          </option>
        ))}
      </select>
      <span className="barre-separateur" aria-hidden="true" />

      <Outil libelle="Gras (Ctrl+B)" actif={e.gras} onClick={() => c().toggleBold().run()}>
        <Bold className="size-4" aria-hidden="true" />
      </Outil>
      <Outil libelle="Italique (Ctrl+I)" actif={e.italique} onClick={() => c().toggleItalic().run()}>
        <Italic className="size-4" aria-hidden="true" />
      </Outil>
      <Deroulant libelle="Souligner" actif={e.souligne} bouton={<Underline className="size-4" aria-hidden="true" />}>
        {(fermer) => (
          <div className="w-64">
            <p className="choix-menu-groupe">Style</p>
            {STYLES_SOULIGNE.map((s) => (
              <button
                key={s.cle}
                type="button"
                className="choix-menu"
                data-actif={e.styleSouligne === s.cle}
                onMouseDown={(ev) => ev.preventDefault()}
                onClick={() => {
                  c().setMark("souligne", { style: s.cle, couleur: e.couleurSouligne }).run();
                  fermer();
                }}
              >
                <span className={`souligne souligne-${s.cle}`}>{s.libelle}</span>
              </button>
            ))}
            <p className="choix-menu-groupe">Couleur du trait</p>
            <Pastilles
              prefixe="f"
              actuelle={e.couleurSouligne}
              choisir={(couleur) => c().setMark("souligne", { style: e.styleSouligne ?? "simple", couleur }).run()}
              retirer={() => {
                c().unsetMark("souligne").run();
                fermer();
              }}
            />
          </div>
        )}
      </Deroulant>
      <Outil libelle="Barré" actif={e.barre} onClick={() => c().toggleStrike().run()}>
        <Strikethrough className="size-4" aria-hidden="true" />
      </Outil>
      <Outil libelle="Exposant" actif={e.exposant} onClick={() => c().toggleSuperscript().run()}>
        <Superscript className="size-4" aria-hidden="true" />
      </Outil>
      <Outil libelle="Indice" actif={e.indice} onClick={() => c().toggleSubscript().run()}>
        <Subscript className="size-4" aria-hidden="true" />
      </Outil>
      <span className="barre-separateur" aria-hidden="true" />

      <Deroulant
        libelle="Surligneur fluo"
        actif={Boolean(e.surligne)}
        bouton={
          <>
            <Highlighter className="size-4" aria-hidden="true" />
            <span className="h-1 w-3 rounded-full" style={{ background: e.surligne ? `var(--f-${e.surligne})` : "var(--f-jaune)" }} aria-hidden="true" />
          </>
        }
      >
        {(fermer) => (
          <Pastilles
            prefixe="f"
            actuelle={e.surligne}
            choisir={(couleur) => {
              c().setMark("surligne", { couleur }).run();
              fermer();
            }}
            retirer={() => {
              c().unsetMark("surligne").run();
              fermer();
            }}
          />
        )}
      </Deroulant>
      <Deroulant libelle="Couleur du texte" actif={Boolean(e.couleur)} bouton={<Palette className="size-4" aria-hidden="true" />}>
        {(fermer) => (
          <Pastilles
            prefixe="t"
            actuelle={e.couleur}
            choisir={(couleur) => {
              c().setMark("couleur", { couleur }).run();
              fermer();
            }}
            retirer={() => {
              c().unsetMark("couleur").run();
              fermer();
            }}
          />
        )}
      </Deroulant>
      <Deroulant libelle="Effets" actif={Boolean(e.effet)} bouton={<Sparkles className="size-4" aria-hidden="true" />}>
        {(fermer) => (
          <div className="w-56">
            {EFFETS.map((ef) => (
              <button
                key={ef.cle}
                type="button"
                className="choix-menu"
                data-actif={e.effet === ef.cle}
                onMouseDown={(ev) => ev.preventDefault()}
                onClick={() => {
                  c().setMark("effet", { type: ef.cle }).run();
                  fermer();
                }}
              >
                <span className={`effet-${ef.cle}`}>{ef.libelle}</span>
              </button>
            ))}
            <button
              type="button"
              className="choix-menu text-encre-douce"
              onMouseDown={(ev) => ev.preventDefault()}
              onClick={() => {
                c().unsetMark("effet").run();
                fermer();
              }}
            >
              Retirer l&apos;effet
            </button>
          </div>
        )}
      </Deroulant>
      <Outil libelle="Effacer la mise en forme" onClick={() => c().unsetAllMarks().run()}>
        <RemoveFormatting className="size-4" aria-hidden="true" />
      </Outil>
      <span className="barre-separateur" aria-hidden="true" />

      <Outil libelle="Liste à puces" actif={e.puces} onClick={() => c().toggleBulletList().run()}>
        <List className="size-4" aria-hidden="true" />
      </Outil>
      <Outil libelle="Liste numérotée" actif={e.numeros} onClick={() => c().toggleOrderedList().run()}>
        <ListOrdered className="size-4" aria-hidden="true" />
      </Outil>
      <Outil libelle="Liste de cases à cocher" actif={e.cases} onClick={() => c().toggleTaskList().run()}>
        <ListChecks className="size-4" aria-hidden="true" />
      </Outil>
      <Deroulant libelle="Alignement" bouton={<IconeAlignement className="size-4" aria-hidden="true" />}>
        {(fermer) => (
          <div className="flex gap-1 p-1">
            {(
              [
                ["left", "Aligner à gauche", AlignLeft],
                ["center", "Centrer", AlignCenter],
                ["right", "Aligner à droite", AlignRight],
                ["justify", "Justifier", AlignJustify],
              ] as const
            ).map(([valeur, libelle, Icone]) => (
              <Outil
                key={valeur}
                libelle={libelle}
                actif={e.alignement === valeur}
                onClick={() => {
                  c().setTextAlign(valeur).run();
                  fermer();
                }}
              >
                <Icone className="size-4" aria-hidden="true" />
              </Outil>
            ))}
          </div>
        )}
      </Deroulant>
      <Deroulant libelle="Lien" actif={e.lien} bouton={<Link2 className="size-4" aria-hidden="true" />}>
        {(fermer) => <FormulaireLien editor={editor} fermer={fermer} />}
      </Deroulant>
      <span className="barre-separateur" aria-hidden="true" />

      <Deroulant
        libelle="Insérer un bloc"
        aDroite
        bouton={
          <>
            <Plus className="size-4" aria-hidden="true" />
            <span>Insérer</span>
          </>
        }
      >
        {(fermer) => (
          <div className="w-80">
            {GROUPES.map((g) => (
              <div key={g}>
                <p className="choix-menu-groupe">{g}</p>
                {COMMANDES.filter((cmd) => cmd.groupe === g).map((cmd) => (
                  <button
                    key={cmd.cle}
                    type="button"
                    className="choix-menu"
                    onMouseDown={(ev) => ev.preventDefault()}
                    onClick={() => {
                      executer(editor, cmd);
                      fermer();
                    }}
                  >
                    <span>
                      <span className="block font-semibold">{cmd.libelle}</span>
                      <span className="block text-sm text-encre-douce">{cmd.description}</span>
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </Deroulant>
    </div>
  );
}
