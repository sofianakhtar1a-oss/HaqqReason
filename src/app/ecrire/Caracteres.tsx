"use client";

import type { Editor } from "@tiptap/core";
import { Search } from "lucide-react";
import { useMemo, useState, useSyncExternalStore } from "react";
import { abonnerPreferences, lirePreferences, modifierPreferences, PREFERENCES_SERVEUR } from "@/lib/atelier/preferences";
import { Fenetre } from "./Fenetre";
import { FORMULES, TRANSLITERATION } from "./extensions/saisie";

export type OngletCaracteres = "formules" | "translit" | "symboles";

/** Les symboles, avec le nom sous lequel on les cherche. */
export const SYMBOLES: { c: string; nom: string; groupe: string }[] = [
  // Typographie
  { c: "«", nom: "guillemet ouvrant", groupe: "Typographie" },
  { c: "»", nom: "guillemet fermant", groupe: "Typographie" },
  { c: "“", nom: "guillemet anglais ouvrant", groupe: "Typographie" },
  { c: "”", nom: "guillemet anglais fermant", groupe: "Typographie" },
  { c: "’", nom: "apostrophe typographique", groupe: "Typographie" },
  { c: "…", nom: "points de suspension", groupe: "Typographie" },
  { c: "–", nom: "tiret demi-cadratin", groupe: "Typographie" },
  { c: "—", nom: "tiret cadratin", groupe: "Typographie" },
  { c: "•", nom: "puce", groupe: "Typographie" },
  { c: "·", nom: "point médian", groupe: "Typographie" },
  { c: "§", nom: "paragraphe section", groupe: "Typographie" },
  { c: "¶", nom: "pied de mouche alinéa", groupe: "Typographie" },
  { c: "†", nom: "croix obèle", groupe: "Typographie" },
  { c: "‡", nom: "double croix", groupe: "Typographie" },
  { c: "©", nom: "copyright droit d'auteur", groupe: "Typographie" },
  { c: "®", nom: "marque déposée", groupe: "Typographie" },
  { c: "™", nom: "marque commerciale", groupe: "Typographie" },
  { c: "°", nom: "degré", groupe: "Typographie" },
  { c: "№", nom: "numéro", groupe: "Typographie" },
  { c: " ", nom: "espace insécable", groupe: "Typographie" },
  { c: " ", nom: "espace fine insécable", groupe: "Typographie" },
  // Mathématiques et logique
  { c: "×", nom: "multiplié par fois", groupe: "Mathématiques" },
  { c: "÷", nom: "divisé par", groupe: "Mathématiques" },
  { c: "±", nom: "plus ou moins", groupe: "Mathématiques" },
  { c: "≠", nom: "différent de", groupe: "Mathématiques" },
  { c: "≈", nom: "environ égal", groupe: "Mathématiques" },
  { c: "≤", nom: "inférieur ou égal", groupe: "Mathématiques" },
  { c: "≥", nom: "supérieur ou égal", groupe: "Mathématiques" },
  { c: "∞", nom: "infini", groupe: "Mathématiques" },
  { c: "√", nom: "racine carrée", groupe: "Mathématiques" },
  { c: "∑", nom: "somme sigma", groupe: "Mathématiques" },
  { c: "π", nom: "pi", groupe: "Mathématiques" },
  { c: "½", nom: "un demi", groupe: "Mathématiques" },
  { c: "¼", nom: "un quart", groupe: "Mathématiques" },
  { c: "¾", nom: "trois quarts", groupe: "Mathématiques" },
  { c: "²", nom: "exposant deux carré", groupe: "Mathématiques" },
  { c: "³", nom: "exposant trois cube", groupe: "Mathématiques" },
  { c: "∀", nom: "pour tout quel que soit", groupe: "Logique" },
  { c: "∃", nom: "il existe", groupe: "Logique" },
  { c: "¬", nom: "non négation", groupe: "Logique" },
  { c: "∧", nom: "et conjonction", groupe: "Logique" },
  { c: "∨", nom: "ou disjonction", groupe: "Logique" },
  { c: "⇒", nom: "implique donc", groupe: "Logique" },
  { c: "⇔", nom: "équivaut si et seulement si", groupe: "Logique" },
  { c: "∴", nom: "par conséquent donc", groupe: "Logique" },
  { c: "∵", nom: "parce que", groupe: "Logique" },
  { c: "∈", nom: "appartient à", groupe: "Logique" },
  { c: "∉", nom: "n'appartient pas à", groupe: "Logique" },
  { c: "⊂", nom: "inclus dans sous-ensemble", groupe: "Logique" },
  { c: "∅", nom: "ensemble vide", groupe: "Logique" },
  { c: "⊥", nom: "contradiction absurde", groupe: "Logique" },
  // Flèches
  { c: "→", nom: "flèche droite", groupe: "Flèches" },
  { c: "←", nom: "flèche gauche", groupe: "Flèches" },
  { c: "↑", nom: "flèche haut", groupe: "Flèches" },
  { c: "↓", nom: "flèche bas", groupe: "Flèches" },
  { c: "↔", nom: "flèche double", groupe: "Flèches" },
  { c: "↻", nom: "flèche circulaire", groupe: "Flèches" },
  // Grec
  ...["α alpha", "β bêta", "γ gamma", "δ delta", "ε epsilon", "θ thêta", "λ lambda", "μ mu", "σ sigma", "φ phi", "ψ psi", "ω oméga", "Δ delta majuscule", "Σ sigma majuscule", "Ω oméga majuscule"].map((x) => ({ c: x.split(" ")[0], nom: `lettre grecque ${x.slice(x.indexOf(" ") + 1)}`, groupe: "Grec" })),
  // Monnaies
  { c: "€", nom: "euro", groupe: "Monnaies" },
  { c: "£", nom: "livre sterling", groupe: "Monnaies" },
  { c: "$", nom: "dollar", groupe: "Monnaies" },
  { c: "¥", nom: "yen yuan", groupe: "Monnaies" },
  // Arabe et coran
  { c: "﴾", nom: "parenthèse ornée ouvrante (verset)", groupe: "Arabe" },
  { c: "﴿", nom: "parenthèse ornée fermante (verset)", groupe: "Arabe" },
  { c: "۞", nom: "début de hizb rub el hizb", groupe: "Arabe" },
  { c: "۩", nom: "prosternation sajda", groupe: "Arabe" },
  { c: "ﷺ", nom: "salla Allahu alayhi wa sallam", groupe: "Arabe" },
  { c: "ﷻ", nom: "jalla jalaluhu", groupe: "Arabe" },
  { c: "؟", nom: "point d'interrogation arabe", groupe: "Arabe" },
  { c: "،", nom: "virgule arabe", groupe: "Arabe" },
  { c: "؛", nom: "point-virgule arabe", groupe: "Arabe" },
  ...["٠ zéro", "١ un", "٢ deux", "٣ trois", "٤ quatre", "٥ cinq", "٦ six", "٧ sept", "٨ huit", "٩ neuf"].map((x) => ({ c: x.split(" ")[0], nom: `chiffre arabe ${x.split(" ")[1]}`, groupe: "Arabe" })),
];

const sansAccents = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

type Props = { editor: Editor; onglet: OngletCaracteres; surOnglet: (o: OngletCaracteres) => void; surFermer: () => void };

/** Formules de respect, lettres de translittération et symboles, insérés d'un clic. */
export function Caracteres({ editor, onglet, surOnglet, surFermer }: Props) {
  const [q, setQ] = useState("");
  const prefs = useSyncExternalStore(abonnerPreferences, lirePreferences, () => PREFERENCES_SERVEUR);

  const inserer = (texte: string) => {
    editor.chain().focus().insertContent(texte).run();
  };

  const symboles = useMemo(() => {
    const r = sansAccents(q.trim());
    return r ? SYMBOLES.filter((s) => sansAccents(`${s.nom} ${s.groupe}`).includes(r) || s.c === q.trim()) : SYMBOLES;
  }, [q]);
  const groupes = [...new Set(symboles.map((s) => s.groupe))];

  return (
    <Fenetre titre="Caractères et formules" sousTitre="Un clic insère au curseur ; la fenêtre reste ouverte." surFermer={surFermer} largeur={46}>
      <div className="calame-onglets calame-onglets-plats" role="tablist">
        {(
          [
            ["formules", "Formules de respect"],
            ["translit", "Translittération"],
            ["symboles", "Symboles"],
          ] as const
        ).map(([cle, libelle]) => (
          <button key={cle} type="button" role="tab" aria-selected={onglet === cle} className="calame-onglet" onClick={() => surOnglet(cle)}>
            {libelle}
          </button>
        ))}
      </div>

      {onglet === "formules" && (
        <div className="calame-caracteres-liste">
          {FORMULES.map((f) => (
            <button key={f.code} type="button" className="calame-formule" onClick={() => inserer(f.texte)}>
              <span className="calame-formule-texte" lang={/[؀-ۿﷺﷻ]/.test(f.texte) ? "ar" : "fr"} dir="auto">
                {f.texte}
              </span>
              <span className="calame-formule-libelle">{f.libelle}</span>
              <code className="calame-touche">{f.code}</code>
            </button>
          ))}
          <p className="inspecteur-aide">Tape le code dans le texte : « saws » et « swt » suivis d&apos;une espace, les autres entre deux-points.</p>
        </div>
      )}

      {onglet === "translit" && (
        <div className="calame-caracteres-liste">
          <div className="calame-grille-lettres">
            {TRANSLITERATION.map((t) => (
              <button key={t.code} type="button" className="calame-lettre" onClick={() => inserer(t.lettre)} title={`Code : ${t.code}`}>
                <span>{t.lettre}</span>
                <code>{t.code}</code>
              </button>
            ))}
          </div>
          <label className="inspecteur-bascule">
            <input type="checkbox" checked={prefs.translitRapide} onChange={(e) => modifierPreferences({ translitRapide: e.target.checked })} />
            <span>Saisie rapide pendant la frappe (taper « _a » donne « ā », « .h » donne « ḥ »)</span>
          </label>
          <p className="inspecteur-aide">Désactivée par défaut, pour ne jamais toucher à une adresse comme « site.dz ».</p>
        </div>
      )}

      {onglet === "symboles" && (
        <div className="calame-caracteres-liste">
          <label className="contrib-recherche">
            <Search className="size-4 shrink-0 text-encre-douce" aria-hidden="true" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Chercher par nom : flèche, degré, implique…" aria-label="Chercher un symbole" className="w-full bg-transparent outline-none" />
          </label>
          {groupes.map((g) => (
            <section key={g}>
              <h3 className="choix-menu-groupe">{g}</h3>
              <div className="calame-grille-lettres">
                {symboles
                  .filter((s) => s.groupe === g)
                  .map((s) => (
                    <button key={`${g}-${s.c}-${s.nom}`} type="button" className="calame-lettre" onClick={() => inserer(s.c)} title={s.nom}>
                      <span>{s.c === " " ? "⍽" : s.c === " " ? "⍽ʹ" : s.c}</span>
                      <span className="sr-only">{s.nom}</span>
                    </button>
                  ))}
              </div>
            </section>
          ))}
          {symboles.length === 0 && <p className="calame-vide">Aucun symbole à ce nom.</p>}
        </div>
      )}
    </Fenetre>
  );
}
