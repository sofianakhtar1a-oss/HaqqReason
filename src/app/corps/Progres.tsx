"use client";

import { Award, Download, Flame, Snowflake, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ELEMENTS, PAR_ID } from "@/lib/corps/catalogue";
import { CATEGORIES, type CategorieId, ELEMENTS_APPRIS, IDS_CATEGORIES, nombreNiveaux, titreDuJoueur, TITRES } from "@/lib/corps/niveaux";
import { boite, confusionsFrequentes, type Etat, exporterProgression, importerProgression, niveauxReussis, prevision, resume, useEcorche } from "@/lib/corps/progression";
import { COUCHES_DEFAUT, teinteMemoire } from "./communs";
import type { Navigation, Stage } from "./Ecorche";
import type { EtatStructure } from "./moteur/Corps3D";

type Medaille = { id: string; nom: string; texte: string; metal: "bronze" | "argent" | "or"; obtenue: (e: Etat) => boolean };
const toutes = (e: Etat, c: CategorieId) => nombreNiveaux(c) > 0 && niveauxReussis(e, c) === nombreNiveaux(c);
/** Les structures sues, parmi celles qu'on apprend dans les planches. */
const sues = (e: Etat) => ELEMENTS_APPRIS.filter((x) => boite(e, x.id) >= 3).length;

const MEDAILLES: Medaille[] = [
  { id: "premiere", nom: "Première planche", texte: "Réussir une première planche.", metal: "bronze", obtenue: (e) => Object.values(e.niveaux).some((n) => n.f > 0) },
  { id: "semaine", nom: "Une semaine", texte: "L'objectif du jour, sept jours d'affilée.", metal: "bronze", obtenue: (e) => e.profil.jours >= 7 },
  { id: "dix", nom: "Main sûre", texte: "Trois étoiles à dix planches.", metal: "argent", obtenue: (e) => Object.values(e.niveaux).filter((n) => n.e >= 3).length >= 10 },
  { id: "cent", nom: "Cent structures", texte: "Cent structures sues.", metal: "argent", obtenue: (e) => sues(e) >= 100 },
  { id: "eclair", nom: "Foudre", texte: "Vingt bonnes réponses en une minute.", metal: "argent", obtenue: (e) => (e.records.eclair ?? 0) >= 20 },
  { id: "survie", nom: "Increvable", texte: "Trente bonnes réponses en survie.", metal: "argent", obtenue: (e) => (e.records.survie ?? 0) >= 30 },
  { id: "os", nom: "Ostéologiste", texte: "Toutes les planches des os.", metal: "or", obtenue: (e) => toutes(e, "os") },
  { id: "muscles", nom: "Myologiste", texte: "Toutes les planches des muscles.", metal: "or", obtenue: (e) => toutes(e, "muscles") },
  { id: "tendons", nom: "Les cordes", texte: "Toutes les planches des tendons.", metal: "or", obtenue: (e) => toutes(e, "tendons") },
  { id: "arteres", nom: "Angéiologiste", texte: "Toutes les planches des artères.", metal: "or", obtenue: (e) => toutes(e, "arteres") },
  { id: "mois", nom: "Un mois", texte: "Trente jours d'affilée.", metal: "or", obtenue: (e) => e.profil.jours >= 30 },
  { id: "vesale", nom: "Vésale", texte: "Toutes les structures du corps sues.", metal: "or", obtenue: (e) => sues(e) >= ELEMENTS_APPRIS.length },
];

const JOURS = ["Auj.", "Dem.", "J+2", "J+3", "J+4", "J+5", "J+6"];

export function Progres({ stage, nav }: { stage: Stage; nav: Navigation }) {
  const e = useEcorche();
  const { titre, suivant, part } = titreDuJoueur(e.profil.xp);
  const lignes = resume(e);
  const confusions = confusionsFrequentes(e, 6);
  const futur = prevision(e);
  const max = Math.max(1, ...futur);
  const fichier = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");

  // Le corps devient la carte de ce qu'on sait : du rouge de l'oubli au vert du su ; le gris, jamais vu.
  const etats = useMemo(() => Object.fromEntries(ELEMENTS.map((x) => [x.id, { teinte: teinteMemoire(e.elements[x.id] ? boite(e, x.id) : undefined) } as EtatStructure])), [e]);
  useEffect(() => {
    stage.regler({ couches: COUCHES_DEFAUT, profondeur: 0, etats, isoler: null, rotation: true, etiquette: null, retrait: false });
    stage.surChoix((s) => {
      if (s) nav.aller(`explorer/${s.element}`);
    });
    return () => stage.surChoix(null);
  }, [stage, etats, nav]);
  useEffect(() => {
    stage.poignee.current?.vue("ensemble");
  }, [stage]);

  return (
    <div className="ec-progres">
      <h1 className="ec-page-titre">{titre.nom}</h1>
      <p className="ec-page-chapo">
        {titre.devise} {suivant ? `Prochain titre : ${suivant.nom}, à ${suivant.xp} XP.` : "Le plus haut titre de l'amphithéâtre."}
      </p>
      <span className="ec-jauge" aria-label={`${e.profil.xp} XP`}>
        <span style={{ transform: `scaleX(${part})` }} />
      </span>
      <p className="ec-chiffres-cles">
        <span>
          <b>{e.profil.xp}</b> XP
        </span>
        <span>
          <Flame size={15} aria-hidden="true" /> <b>{e.profil.jours}</b> jour{e.profil.jours > 1 ? "s" : ""}
        </span>
        <span>
          <Snowflake size={14} aria-hidden="true" /> <b>{e.profil.gels}</b> gel{e.profil.gels > 1 ? "s" : ""}
        </span>
        <span>
          <b>{sues(e)}</b>/{ELEMENTS_APPRIS.length} sues
        </span>
      </p>
      <p className="ec-note">Sur le corps, chaque structure a la couleur de ce que tu en sais : gris, jamais vue ; rouge, oubliée ; vert, sue. Touche-en une pour l’ouvrir.</p>

      <section>
        <h2 className="ec-section-titre">Par couche</h2>
        <ul className="ec-tableau-couches">
          {lignes.map((l) => (
            <li key={l.c}>
              <a href={`#apprendre/${l.c}`}>
                <span className="ec-registre-nom">{CATEGORIES[l.c].nom}</span>
                <span className="ec-registre-chiffres">
                  <span>
                    {l.reussis}/{l.planches} planches · {l.etoiles}/{l.planches * 3} étoiles
                  </span>
                  <span>
                    {l.sues}/{l.structures} sues
                  </span>
                </span>
                <span className="ec-jauge fine" aria-hidden="true">
                  <span style={{ transform: `scaleX(${l.structures ? l.sues / l.structures : 0})` }} />
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="ec-section-titre">Les révisions des sept jours</h2>
        <div className="ec-histogramme" role="img" aria-label={`Révisions prévues : ${futur.join(", ")}`}>
          {futur.map((n, k) => (
            <span key={k} className="ec-barre">
              <span style={{ height: `${(n / max) * 100}%` }} />
              <small>{JOURS[k]}</small>
              <b>{n}</b>
            </span>
          ))}
        </div>
      </section>

      {confusions.length > 0 && (
        <section>
          <h2 className="ec-section-titre">Ce que tu confonds</h2>
          <ul className="ec-confusions">
            {confusions.map(([a, b, n]) => (
              <li key={`${a}>${b}`}>
                <button type="button" className="ec-lien" onClick={() => nav.jouer({ sorte: "entrainement", ids: [a, b], titre: `${PAR_ID.get(a)?.nom} ou ${PAR_ID.get(b)?.nom} ?` })}>
                  {PAR_ID.get(a)?.nom} <span>pris pour</span> {PAR_ID.get(b)?.nom}
                </button>
                <small>{n} fois</small>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="ec-section-titre">Les médailles</h2>
        <ul className="ec-medailles">
          {MEDAILLES.map((m) => {
            const ok = m.obtenue(e);
            return (
              <li key={m.id} data-metal={m.metal} data-obtenue={ok}>
                <Award size={22} aria-hidden="true" />
                <b>{m.nom}</b>
                <span>{m.texte}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2 className="ec-section-titre">Les titres</h2>
        <ol className="ec-titres">
          {TITRES.map((x) => (
            <li key={x.n} data-atteint={e.profil.xp >= x.xp}>
              <b>{x.nom}</b>
              <span>{x.xp} XP</span>
            </li>
          ))}
        </ol>
      </section>

      {e.journal.length > 0 && (
        <section>
          <h2 className="ec-section-titre">Les dernières parties</h2>
          <ul className="ec-journal">
            {e.journal
              .slice(-8)
              .reverse()
              .map((j) => (
                <li key={j.t}>
                  <span>{j.n}</span>
                  <span>{j.q ? `${j.b}/${j.q}` : j.b}</span>
                  <span>+{j.x} XP</span>
                </li>
              ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="ec-section-titre">Ta progression, en fichier</h2>
        <p className="ec-note">Avec ton compte, elle te suit déjà sur tous tes appareils. Tu peux aussi la garder dans un fichier.</p>
        <div className="ec-boutons">
          <button
            type="button"
            className="ec-bouton"
            onClick={() => {
              const lien = document.createElement("a");
              lien.href = URL.createObjectURL(new Blob([exporterProgression()], { type: "application/json" }));
              lien.download = "ecorche-progression.json";
              lien.click();
              setTimeout(() => URL.revokeObjectURL(lien.href), 2000);
            }}
          >
            <Download size={15} aria-hidden="true" /> Enregistrer
          </button>
          <button type="button" className="ec-bouton" onClick={() => fichier.current?.click()}>
            <Upload size={15} aria-hidden="true" /> Reprendre un fichier
          </button>
          <input
            ref={fichier}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={async (ev) => {
              const f = ev.target.files?.[0];
              if (!f) return;
              setMessage(importerProgression(await f.text()) ? "Progression reprise : le meilleur des deux a été gardé." : "Ce fichier n'est pas une progression de L'Écorché.");
              ev.target.value = "";
            }}
          />
        </div>
        {message && (
          <p className="ec-note" role="status">
            {message}
          </p>
        )}
      </section>
      <p className="ec-note ec-pied">{IDS_CATEGORIES.reduce((s, c) => s + nombreNiveaux(c), 0)} planches en tout.</p>
    </div>
  );
}
