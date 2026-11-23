"use client";

import type { Editor } from "@tiptap/core";
import { BookA, ChevronLeft, ChevronRight, Eraser, Plus, SpellCheck, Square, X } from "lucide-react";
import { useState } from "react";
import { MarquePremium } from "@/components/premium/MarquePremium";
import { modifierPreferences } from "@/lib/atelier/preferences";
import { usePreferences, useRevision } from "../crochets";
import {
  GENRES_REMARQUE,
  allerALaRemarque,
  appliquerSuggestion,
  contexteDe,
  effacerRemarques,
  genresCaches,
  ignorerMot,
  ignorerRemarque,
  listerRemarques,
  masquerGenres,
  normaliserMot,
  type GenreRemarque,
  type RemarqueLT,
} from "../extensions/grammaire";
import { arreterRelecture, derniereRelecture, lancerRelecture, useRelecture } from "../relecture-grammaire";

const PAR_PAGE = 40;

/** Ajoute un mot au dictionnaire personnel et efface ses soulignés. */
export function ajouterAuDictionnaire(editor: Editor | null, mot: string): boolean {
  const propre = mot.trim().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "").slice(0, 60);
  if (!propre) return false;
  modifierPreferences((p) => ({ dictionnaire: p.dictionnaire.some((x) => normaliserMot(x) === normaliserMot(propre)) ? p.dictionnaire : [...p.dictionnaire, propre] }));
  if (editor) ignorerMot(editor, propre);
  return true;
}

const pluriel = (n: number, mot: string) => `${n.toLocaleString("fr-FR")} ${mot}${n > 1 ? "s" : ""}`;

const INSECABLES = String.fromCharCode(0x00a0, 0x202f);

/** Une correction proposée, où les espaces insécables (souvent tout l'enjeu) se voient. */
export function TexteSuggestion({ texte }: { texte: string }) {
  if (texte === "") return <>(supprimer)</>;
  if (texte.trim() === "") return <>(espace)</>;
  return (
    <>
      {[...texte].map((c, i) =>
        INSECABLES.includes(c) ? (
          <span key={i} className="calame-lt-espace" title={c.charCodeAt(0) === 0x202f ? "Espace fine insécable" : "Espace insécable"}>
            {c}
          </span>
        ) : (
          c
        ),
      )}
    </>
  );
}

/** Une remarque : le passage, l'explication, les corrections proposées. */
function LigneRemarque({ editor, r }: { editor: Editor; r: RemarqueLT }) {
  const c = contexteDe(editor.state, r);
  return (
    <li className="calame-lt-remarque" data-genre={r.genre}>
      <button type="button" className="calame-lt-contexte" onClick={() => allerALaRemarque(editor, r)} title="Aller au passage">
        <span>{c.avant}</span>
        <mark>{c.mot || "·"}</mark>
        <span>{c.apres}</span>
      </button>
      <p className="calame-lt-message">{r.message}</p>
      <div className="calame-lt-gestes">
        {r.suggestions.map((s, i) => (
          <button key={`${i}-${s}`} type="button" className="calame-lt-suggestion" onClick={() => appliquerSuggestion(editor, r.id, s)} title={`Remplacer par « ${s} »`}>
            <TexteSuggestion texte={s} />
          </button>
        ))}
        <button type="button" className="bouton bouton-discret bouton-petit" onClick={() => ignorerRemarque(editor, r.id)}>
          Ignorer
        </button>
        {r.genre === "orthographe" && (
          <button type="button" className="bouton bouton-discret bouton-petit" onClick={() => ajouterAuDictionnaire(editor, r.mot)}>
            <BookA className="size-4" aria-hidden="true" />
            Ajouter au dictionnaire
          </button>
        )}
      </div>
    </li>
  );
}

/**
 * La section « Grammaire et orthographe » de l'onglet Relire : la relecture par LanguageTool,
 * les remarques à corriger une à une, et le dictionnaire personnel.
 */
export function PanneauGrammaire({ editor }: { editor: Editor }) {
  useRevision(editor);
  const prefs = usePreferences();
  const relecture = useRelecture();
  const [sansCitations, setSansCitations] = useState(true);
  const [limite, setLimite] = useState(PAR_PAGE);
  const [nouveauMot, setNouveauMot] = useState("");
  const [filtreDico, setFiltreDico] = useState("");

  const enCours = relecture.enCours === editor;
  const occupe = relecture.enCours !== null && !enCours;
  const derniere = derniereRelecture(editor);
  const erreur = relecture.erreur?.editeur === editor ? relecture.erreur.texte : null;
  const caches = genresCaches(editor.state);
  const toutes = listerRemarques(editor.state);
  const visibles = toutes.filter((r) => !caches.includes(r.genre));
  const selectionVide = editor.state.selection.empty;

  const compter = (g: GenreRemarque) => toutes.filter((r) => r.genre === g).length;
  const basculerGenre = (g: GenreRemarque) => masquerGenres(editor, caches.includes(g) ? caches.filter((x) => x !== g) : [...caches, g]);

  const aller = (sens: 1 | -1) => {
    if (visibles.length === 0) return;
    const ici = sens === 1 ? editor.state.selection.to : editor.state.selection.from;
    const r = sens === 1 ? (visibles.find((x) => x.de >= ici && x.de !== editor.state.selection.from) ?? visibles[0]) : ([...visibles].reverse().find((x) => x.a <= ici && x.a !== editor.state.selection.to) ?? visibles[visibles.length - 1]);
    allerALaRemarque(editor, r);
  };

  const lancer = (portee: "tout" | "selection") => {
    setLimite(PAR_PAGE);
    void lancerRelecture(editor, portee, sansCitations);
  };

  const mots = [...prefs.dictionnaire].sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
  const motsVus = filtreDico.trim() ? mots.filter((m) => normaliserMot(m).includes(normaliserMot(filtreDico))) : mots;

  return (
    <section className="calame-section calame-grammaire" aria-labelledby="calame-grammaire-titre">
      <h3 className="calame-section-titre" id="calame-grammaire-titre">
        <SpellCheck className="size-4" aria-hidden="true" /> Grammaire et orthographe
      </h3>
      <p className="inspecteur-aide">
        Accords, conjugaison, orthographe et typographie, vérifiés par LanguageTool (service libre). Le texte ne part qu&apos;au moment où tu demandes la relecture, et rien n&apos;est gardé. Le
        texte arabe et les mots translittérés (ā, ḥ, ʿ…) ne sont jamais signalés.
      </p>
      <div className="calame-lt-lancer">
        <button type="button" className="bouton bouton-principal bouton-petit" onClick={() => lancer("tout")} disabled={enCours || occupe}>
          <SpellCheck className="size-4" aria-hidden="true" />
          Relire tout le document
          <MarquePremium fonction="calame.grammaire" compacte />
        </button>
        <button type="button" className="bouton bouton-discret bouton-petit" onClick={() => lancer("selection")} disabled={enCours || occupe || selectionVide} title={selectionVide ? "Sélectionne d'abord un passage" : undefined}>
          Relire la sélection
        </button>
      </div>
      <label className="inspecteur-bascule">
        <input type="checkbox" checked={sansCitations} onChange={(e) => setSansCitations(e.target.checked)} />
        <span>Laisser de côté les citations, versets et hadiths (le texte d&apos;un autre auteur)</span>
      </label>
      <p className="inspecteur-aide">Raccourci : F7 relit le document, puis passe d&apos;une remarque à la suivante.</p>

      {enCours && relecture.avancement && (
        <div className="calame-lt-avancement" role="status">
          <progress value={relecture.avancement.fait} max={Math.max(1, relecture.avancement.total)} />
          <span>
            {relecture.avancement.attente
              ? `Le service limite le débit : reprise dans ${relecture.avancement.attente} s.`
              : relecture.avancement.total > 1
                ? `Relecture… ${relecture.avancement.fait} / ${relecture.avancement.total}`
                : "Relecture…"}
          </span>
          <button type="button" className="bouton bouton-discret bouton-petit" onClick={arreterRelecture}>
            <Square className="size-4" aria-hidden="true" />
            Arrêter
          </button>
        </div>
      )}
      {occupe && <p className="inspecteur-aide">Une relecture est déjà en cours dans un autre document.</p>}
      {erreur && (
        <p className="inspecteur-aide" data-alerte="" role="alert">
          {erreur}
        </p>
      )}
      {!enCours && derniere && toutes.length === 0 && (
        <p className="calame-lt-propre" role="status">
          {derniere.nombre === 0 ? (derniere.portee === "selection" ? "Rien à redire sur ce passage." : "Rien à redire : le texte est propre.") : "Toutes les remarques ont été traitées."}
        </p>
      )}

      {toutes.length > 0 && (
        <>
          <div className="calame-lt-genres" role="group" aria-label="Souligner dans le texte">
            {GENRES_REMARQUE.map((g) => {
              const n = compter(g.cle);
              return (
                <button key={g.cle} type="button" className="calame-lt-genre" data-genre={g.cle} aria-pressed={!caches.includes(g.cle)} onClick={() => basculerGenre(g.cle)} disabled={n === 0}>
                  <span className="calame-lt-pastille" aria-hidden="true" />
                  {g.libelle} <span className="calame-lt-nombre">{n}</span>
                </button>
              );
            })}
          </div>
          <div className="calame-lt-nav">
            <span>{pluriel(visibles.length, "remarque")}</span>
            <button type="button" className="bouton bouton-discret bouton-petit" onClick={() => aller(-1)} disabled={visibles.length === 0} aria-label="Remarque précédente">
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
            <button type="button" className="bouton bouton-discret bouton-petit" onClick={() => aller(1)} disabled={visibles.length === 0} aria-label="Remarque suivante">
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
            <button type="button" className="bouton bouton-discret bouton-petit" onClick={() => effacerRemarques(editor)}>
              <Eraser className="size-4" aria-hidden="true" />
              Effacer
            </button>
          </div>
          <ol className="calame-lt-liste">
            {visibles.slice(0, limite).map((r) => (
              <LigneRemarque key={r.id} editor={editor} r={r} />
            ))}
          </ol>
          {visibles.length > limite && (
            <button type="button" className="bouton bouton-discret w-full" onClick={() => setLimite((l) => l + PAR_PAGE)}>
              Afficher {Math.min(PAR_PAGE, visibles.length - limite)} remarques de plus
            </button>
          )}
        </>
      )}

      <details className="calame-dictionnaire">
        <summary>
          <BookA className="size-4" aria-hidden="true" />
          Mon dictionnaire personnel <span className="calame-lt-nombre">{prefs.dictionnaire.length}</span>
        </summary>
        <p className="inspecteur-aide">Noms propres, mots arabes, termes techniques : les mots d&apos;ici ne sont plus signalés comme fautes. Il suit ton compte d&apos;un appareil à l&apos;autre.</p>
        <form
          className="calame-dictionnaire-ajout"
          onSubmit={(e) => {
            e.preventDefault();
            if (ajouterAuDictionnaire(editor, nouveauMot)) setNouveauMot("");
          }}
        >
          <input className="champ" value={nouveauMot} onChange={(e) => setNouveauMot(e.target.value)} placeholder="Ajouter un mot" aria-label="Mot à ajouter au dictionnaire" maxLength={60} dir="auto" />
          <button type="submit" className="bouton bouton-discret bouton-petit" disabled={!nouveauMot.trim()}>
            <Plus className="size-4" aria-hidden="true" />
            Ajouter
          </button>
        </form>
        {mots.length > 12 && <input className="champ" value={filtreDico} onChange={(e) => setFiltreDico(e.target.value)} placeholder="Chercher dans le dictionnaire" aria-label="Chercher dans le dictionnaire" />}
        {mots.length === 0 ? (
          <p className="inspecteur-aide">Encore vide : ajoute un mot ici, ou depuis une remarque d&apos;orthographe.</p>
        ) : (
          <ul className="calame-dictionnaire-mots">
            {motsVus.map((m) => (
              <li key={m}>
                <span dir="auto">{m}</span>
                <button type="button" onClick={() => modifierPreferences((p) => ({ dictionnaire: p.dictionnaire.filter((x) => x !== m) }))} aria-label={`Retirer « ${m} » du dictionnaire`}>
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </details>
    </section>
  );
}
