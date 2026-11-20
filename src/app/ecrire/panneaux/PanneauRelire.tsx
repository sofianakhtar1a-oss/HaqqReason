"use client";

import type { Editor } from "@tiptap/core";
import type { Node as NoeudPM } from "@tiptap/pm/model";
import { BookOpenCheck, ChevronRight, Pause, Play, Square, Type, Volume2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { lisibilite, motsDe, motsFrequents } from "@/lib/atelier/analyse-texte";
import { modifierPreferences } from "@/lib/atelier/preferences";
import { useRevision, usePreferences } from "../crochets";
import { optionsActuelles, regler, signalements, type OptionsAnalyse } from "../extensions/analyse";
import { corrigerTypographie } from "../extensions/saisie";
import { montrerPosition } from "../extensions/recherche";
import { lire, voixDisponibles, type Lecteur } from "../voix";
import { TextSelection } from "@tiptap/pm/state";

type Props = {
  editor: Editor;
  stats: { mots: number; signes: number; pages: number; minutes: number };
  relecture: boolean;
  surRelecture: (actif: boolean) => void;
  surChercher: (mot: string) => void;
};

const SANS_CITATIONS = new Set(["blockquote", "verset", "hadith", "citationOuvrage"]);

/** Le texte du document, sans (ou avec) les citations. */
function texteDe(doc: NoeudPM, sansCitations: boolean): string {
  const morceaux: string[] = [];
  doc.descendants((n) => {
    if (sansCitations && SANS_CITATIONS.has(n.type.name)) return false;
    if (n.isTextblock) {
      morceaux.push(n.textContent);
      return false;
    }
    return true;
  });
  return morceaux.join("\n");
}

const GENRES: { cle: keyof OptionsAnalyse; libelle: string; aide: string }[] = [
  { cle: "repetitions", libelle: "Répétitions", aide: "Un même mot trop proche de lui-même" },
  { cle: "longues", libelle: "Phrases longues", aide: "Plus de 35 mots" },
  { cle: "faibles", libelle: "Mots faibles", aide: "« chose », « faire », « il y a »…" },
  { cle: "passif", libelle: "Tournures passives", aide: "« est écrit par… »" },
];

/** L'onglet « Relire » : mesures, relecture assistée, lecture à voix haute, typographie. */
export function PanneauRelire({ editor, stats, relecture, surRelecture, surChercher }: Props) {
  const revision = useRevision(editor);
  const prefs = usePreferences();
  const [sansCitations, setSansCitations] = useState(false);
  const [mesures, setMesures] = useState<{ lisi: ReturnType<typeof lisibilite>; frequents: { mot: string; n: number }[]; motsCorps: number } | null>(null);
  const [lecture, setLecture] = useState<"arret" | "lecture" | "pause">("arret");
  const [vitesse, setVitesse] = useState(1);
  const [corrections, setCorrections] = useState<number | null>(null);
  const lecteur = useRef<Lecteur | null>(null);

  // Les mesures du texte entier : recalculées un instant après la frappe, pas à chaque touche.
  useEffect(() => {
    const minuteur = setTimeout(() => {
      const texte = texteDe(editor.state.doc, sansCitations);
      setMesures({ lisi: lisibilite(texte), frequents: motsFrequents(texte, 14), motsCorps: motsDe(texte).length });
    }, 500);
    return () => clearTimeout(minuteur);
  }, [editor, revision, sansCitations]);

  useEffect(() => () => lecteur.current?.arreter(), []);

  const selection = useMemo(() => {
    const { from, to, empty } = editor.state.selection;
    if (empty) return null;
    const texte = editor.state.doc.textBetween(from, to, "\n", " ");
    return { mots: motsDe(texte).length, signes: texte.length };
  }, [editor, revision]); // eslint-disable-line react-hooks/exhaustive-deps

  const options = optionsActuelles(editor);
  const trouves = useMemo(() => signalements(editor), [editor, revision]); // eslint-disable-line react-hooks/exhaustive-deps

  const allerAuSuivant = (cle: keyof OptionsAnalyse) => {
    const positions = trouves[cle];
    if (positions.length === 0) return;
    const ici = editor.state.selection.to;
    const pos = positions.find((p) => p > ici) ?? positions[0];
    editor.view.dispatch(editor.state.tr.setSelection(TextSelection.create(editor.state.doc, pos)));
    editor.view.focus();
    montrerPosition(editor, pos);
  };

  const demarrer = () => {
    if (lecture === "pause") {
      lecteur.current?.reprendre();
      setLecture("lecture");
      return;
    }
    lecteur.current?.arreter();
    lecteur.current = lire(editor, vitesse, () => setLecture("arret"));
    if (lecteur.current) setLecture("lecture");
  };

  return (
    <>
      <section className="calame-section">
        <h3 className="calame-section-titre">Mesures</h3>
        <dl className="inspecteur-stats">
          <div>
            <dt>Mots</dt>
            <dd>{(sansCitations && mesures ? mesures.motsCorps : stats.mots).toLocaleString("fr-FR")}</dd>
          </div>
          <div>
            <dt>Signes</dt>
            <dd>{stats.signes.toLocaleString("fr-FR")}</dd>
          </div>
          <div>
            <dt>Sélection</dt>
            <dd>{selection ? `${selection.mots.toLocaleString("fr-FR")} mots` : "—"}</dd>
          </div>
          <div>
            <dt>Signes sél.</dt>
            <dd>{selection ? selection.signes.toLocaleString("fr-FR") : "—"}</dd>
          </div>
        </dl>
        <label className="inspecteur-bascule">
          <input type="checkbox" checked={sansCitations} onChange={(e) => setSansCitations(e.target.checked)} />
          <span>Compter sans les citations, versets et hadiths (les notes ne sont jamais comptées)</span>
        </label>
        {mesures && (
          <div className="calame-lisibilite">
            <p>
              <strong>Lisibilité : {mesures.lisi.niveau}</strong>
              {mesures.lisi.score > 0 && <span> · indice {mesures.lisi.score}</span>}
            </p>
            <p className="inspecteur-aide">
              {mesures.lisi.motsParPhrase} mots par phrase en moyenne, {String(mesures.lisi.syllabesParMot).replace(".", ",")} syllabes par mot (formule de Kandel et Moles).
            </p>
          </div>
        )}
        {mesures && mesures.frequents.length > 0 && (
          <div className="inspecteur-reglage">
            <span className="inspecteur-libelle">Mots les plus employés</span>
            <div className="calame-etiquettes">
              {mesures.frequents.map((f) => (
                <button key={f.mot} type="button" className="calame-mot-frequent" onClick={() => surChercher(f.mot)} title={`Chercher « ${f.mot} » dans le document`}>
                  {f.mot} <span>{f.n}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="calame-section">
        <h3 className="calame-section-titre">
          <BookOpenCheck className="size-4" aria-hidden="true" /> Relecture assistée
        </h3>
        {GENRES.map((g) => (
          <div key={g.cle} className="calame-analyse-ligne" data-genre={g.cle}>
            <label className="inspecteur-bascule">
              <input type="checkbox" checked={options[g.cle]} onChange={(e) => regler(editor, { ...options, [g.cle]: e.target.checked })} />
              <span>
                <strong>{g.libelle}</strong>
                <span className="block text-sm text-encre-douce">{g.aide}</span>
              </span>
            </label>
            {options[g.cle] && (
              <button type="button" className="bouton bouton-discret bouton-petit" onClick={() => allerAuSuivant(g.cle)} disabled={trouves[g.cle].length === 0}>
                {trouves[g.cle].length}
                <ChevronRight className="size-4" aria-hidden="true" />
                <span className="sr-only">Aller au suivant</span>
              </button>
            )}
          </div>
        ))}
        <button type="button" className="bouton bouton-discret w-full" aria-pressed={relecture} onClick={() => surRelecture(!relecture)}>
          <BookOpenCheck className="size-4" aria-hidden="true" />
          {relecture ? "Quitter le mode relecture" : "Mode relecture (texte en lecture seule, plus grand)"}
        </button>
      </section>

      <section className="calame-section">
        <h3 className="calame-section-titre">
          <Volume2 className="size-4" aria-hidden="true" /> Écouter le texte
        </h3>
        {voixDisponibles() ? (
          <>
            <div className="flex items-center gap-2">
              <button type="button" className="bouton bouton-principal bouton-petit" onClick={demarrer}>
                <Play className="size-4" aria-hidden="true" />
                {lecture === "pause" ? "Reprendre" : "Lire"}
              </button>
              <button
                type="button"
                className="bouton bouton-discret bouton-petit"
                disabled={lecture !== "lecture"}
                onClick={() => {
                  lecteur.current?.pause();
                  setLecture("pause");
                }}
              >
                <Pause className="size-4" aria-hidden="true" />
                Pause
              </button>
              <button
                type="button"
                className="bouton bouton-discret bouton-petit"
                disabled={lecture === "arret"}
                onClick={() => {
                  lecteur.current?.arreter();
                  setLecture("arret");
                }}
              >
                <Square className="size-4" aria-hidden="true" />
                Arrêter
              </button>
            </div>
            <label className="inspecteur-reglage">
              <span className="inspecteur-libelle">
                Vitesse <span className="inspecteur-valeur">× {String(vitesse).replace(".", ",")}</span>
              </span>
              <input type="range" min={0.6} max={1.6} step={0.1} value={vitesse} onChange={(e) => setVitesse(Number(e.target.value))} className="atelier-glissiere" />
            </label>
            <p className="inspecteur-aide">Lit la sélection, sinon depuis le curseur ; le passage lu est surligné. L&apos;arabe est lu avec une voix arabe si l&apos;appareil en a une.</p>
          </>
        ) : (
          <p className="inspecteur-aide">Ce navigateur ne sait pas lire à voix haute.</p>
        )}
      </section>

      <section className="calame-section">
        <h3 className="calame-section-titre">
          <Type className="size-4" aria-hidden="true" /> Typographie française
        </h3>
        <label className="inspecteur-bascule">
          <input type="checkbox" checked={prefs.typographie} onChange={(e) => modifierPreferences({ typographie: e.target.checked })} />
          <span>Corriger pendant la frappe : espaces fines avant ; ! ?, guillemets « », apostrophe ’, points de suspension</span>
        </label>
        <button
          type="button"
          className="bouton bouton-discret w-full"
          onClick={() => {
            setCorrections(corrigerTypographie(editor));
          }}
        >
          Corriger la typographie de tout le document
        </button>
        {corrections !== null && (
          <p className="inspecteur-aide" role="status">
            {corrections === 0 ? "Rien à corriger." : `${corrections} passage${corrections > 1 ? "s" : ""} corrigé${corrections > 1 ? "s" : ""} (Ctrl+Z pour annuler).`}
          </p>
        )}
      </section>
    </>
  );
}
