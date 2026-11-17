"use client";

import { ArrowLeft, Clock, Play, Sparkles, Star, Trophy } from "lucide-react";
import { sectionDe, NOMS_NIVEAUX, SECTIONS } from "@/lib/regles";
import { type Resultat, useProgression } from "@/lib/regles/progression";
import { NIVEAUX, type Section } from "@/lib/regles/types";
import { LeconVue } from "./Lecon";
import { Machine } from "./Machine";
import { Phrase } from "./Phrase";
import "./regles.css";

/*
 * Les Règles du français : deux mondes, la Conjugaison (la Machine à voyager dans le temps)
 * et la Grammaire (la Cité des mots), du niveau A1 au niveau C2.
 * Adresses : #regles, #regles/conjugaison, #regles/conjugaison/<leçon>, #regles/machine.
 */

type Props = { detail: string | null; onOuvrir: (chemin: string | null) => void; onRemplacer: (chemin: string) => void };

export function Regles({ detail, onOuvrir, onRemplacer }: Props) {
  const [sId, lId] = (detail ?? "").split("/");
  if (sId === "machine") return <PageMachine onRetour={() => onOuvrir(null)} />;
  const section = sectionDe(sId);
  if (section) {
    const lecon = lId ? section.lecons.find((l) => l.id === lId) : undefined;
    if (lecon) return <LeconVue key={lecon.id} section={section} lecon={lecon} onRetour={() => onRemplacer(section.id)} onOuvrir={(id) => onRemplacer(`${section.id}/${id}`)} />;
    return <Carte section={section} onRetour={() => onOuvrir(null)} onLecon={(id) => onOuvrir(`${section.id}/${id}`)} />;
  }
  return <Portes onOuvrir={onOuvrir} />;
}

/* ---------- La progression d'une section ---------- */

function bilanDe(section: Section, lecons: Record<string, Resultat>) {
  const faites = section.lecons.filter((l) => (lecons[l.id]?.etoiles ?? 0) > 0);
  const etoiles = section.lecons.reduce((s, l) => s + (lecons[l.id]?.etoiles ?? 0), 0);
  const xp = section.lecons.reduce((s, l) => s + (lecons[l.id]?.xp ?? 0), 0);
  const prochaine = section.lecons.find((l) => !lecons[l.id]?.etoiles);
  const niveauxFinis = NIVEAUX.filter((n) => section.lecons.filter((l) => l.niveau === n).every((l) => (lecons[l.id]?.etoiles ?? 0) > 0));
  // Le grade : le dernier niveau terminé sans trou depuis A1.
  let grade: string | null = null;
  for (const n of NIVEAUX) {
    if (!niveauxFinis.includes(n)) break;
    grade = section.grades[n];
  }
  return { faites: faites.length, total: section.lecons.length, etoiles, xp, prochaine, grade, niveauxFinis };
}

/* ---------- Les deux portes ---------- */

function Portes({ onOuvrir }: { onOuvrir: (chemin: string) => void }) {
  const { lecons } = useProgression();
  const xpTotal = Object.values(lecons).reduce((s, r) => s + r.xp, 0);
  return (
    <section aria-labelledby="titre-regles" className="rg">
      <div className="lg-section-tete">
        <div>
          <h2 id="titre-regles" className="lg-titre">
            Les règles du français
          </h2>
          <p className="lg-chapo">Deux mondes à explorer, du tout premier pas (A1) jusqu&apos;à l&apos;excellence (C2). Ici, les mots sont des personnages, les règles des aventures, et chaque erreur un indice qui te fait avancer.</p>
        </div>
        {xpTotal > 0 && (
          <p className="rg-total" aria-label={`${xpTotal} points d'expérience au total`}>
            <Sparkles className="size-4" aria-hidden="true" />
            {xpTotal} XP
          </p>
        )}
      </div>

      <div className="rg-portes">
        {SECTIONS.map((s) => {
          const b = bilanDe(s, lecons);
          return (
            <article key={s.id} className="rg-porte" data-section={s.id}>
              <div className="rg-porte-visuel" aria-hidden="true">
                {s.id === "conjugaison" ? <RubanTemps /> : <SilhouetteCite />}
              </div>
              <p className="rg-porte-section">{s.nom}</p>
              <h3 className="rg-porte-univers">{s.univers}</h3>
              <p className="rg-porte-accroche">{s.accroche}</p>
              <div className="rg-porte-progres">
                <span className="rg-barre" style={{ "--p": `${(b.faites / b.total) * 100}%` } as React.CSSProperties} aria-hidden="true" />
                <span>
                  {b.faites} / {b.total} leçons
                </span>
                <span className="rg-porte-etoiles">
                  <Star className="size-3.5" aria-hidden="true" />
                  {b.etoiles}
                </span>
              </div>
              <p className="rg-porte-grade">
                <Trophy className="size-4" aria-hidden="true" />
                {b.grade ? `Grade : ${b.grade}` : `Premier grade à gagner : ${s.grades.A1}`}
              </p>
              <div className="rg-actions">
                {b.prochaine && (
                  <button type="button" className="bouton bouton-principal" onClick={() => onOuvrir(`${s.id}/${b.prochaine!.id}`)}>
                    <Play className="size-4" fill="currentColor" aria-hidden="true" />
                    {b.faites ? "Continuer" : "Commencer"} : {b.prochaine.titre}
                  </button>
                )}
                <button type="button" className="bouton" onClick={() => onOuvrir(s.id)}>
                  Voir les {b.total} leçons
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <button type="button" className="rg-bandeau-machine" onClick={() => onOuvrir("machine")}>
        <Clock className="size-6 shrink-0" aria-hidden="true" />
        <span>
          <strong>La Machine à voyager dans le temps</strong>
          <span>Embarque n&apos;importe quel verbe parmi plus de 270 et regarde-le changer de costume à toutes les époques, dans les quatre mondes.</span>
        </span>
      </button>
    </section>
  );
}

/** Conjugaison : un verbe qui glisse d'hier à demain. */
function RubanTemps() {
  return (
    <div className="rg-ruban">
      <span className="rg-ruban-ligne" />
      <span className="rg-ruban-curseur" />
      <span className="rg-ruban-forme" style={{ "--i": 0 } as React.CSSProperties}>
        <small>hier</small>
        <Phrase p="je [r:chant][t:ais]" />
      </span>
      <span className="rg-ruban-forme" data-ici style={{ "--i": 1 } as React.CSSProperties}>
        <small>maintenant</small>
        <Phrase p="je [r:chant][t:e]" />
      </span>
      <span className="rg-ruban-forme" style={{ "--i": 2 } as React.CSSProperties}>
        <small>demain</small>
        <Phrase p="je [r:chante][t:rai]" />
      </span>
    </div>
  );
}

/** Grammaire : une rue où chaque mot est un immeuble de sa couleur. */
function SilhouetteCite() {
  const mots: [string, string, number][] = [
    ["d", "Les", 38],
    ["n", "chats", 72],
    ["j", "noirs", 56],
    ["v", "dorment", 88],
    ["k", "sur", 30],
    ["d", "le", 42],
    ["n", "toit", 64],
  ];
  return (
    <div className="rg-cite">
      {mots.map(([c, m, h], i) => (
        <span key={i} className="rg-immeuble" data-code={c} style={{ "--h": `${h}%`, "--i": i } as React.CSSProperties}>
          <span>{m}</span>
        </span>
      ))}
    </div>
  );
}

/* ---------- La carte des niveaux ---------- */

function Carte({ section, onRetour, onLecon }: { section: Section; onRetour: () => void; onLecon: (id: string) => void }) {
  const { lecons } = useProgression();
  const b = bilanDe(section, lecons);
  return (
    <section className="rg rg-carte" data-section={section.id} aria-labelledby="titre-carte">
      <button type="button" className="rg-retour" onClick={onRetour}>
        <ArrowLeft className="size-4" aria-hidden="true" />
        Les règles
      </button>
      <div className="lg-section-tete">
        <div>
          <p className="rg-porte-section">
            {section.heros} {section.nom}
          </p>
          <h2 id="titre-carte" className="lg-titre">
            {section.univers}
          </h2>
          <p className="lg-chapo">{section.accroche}</p>
        </div>
        <div className="rg-carte-bilan">
          <span>
            <Star className="size-4" aria-hidden="true" />
            {b.etoiles} / {b.total * 3}
          </span>
          <span>
            <Sparkles className="size-4" aria-hidden="true" />
            {b.xp} XP
          </span>
          <span>
            <Trophy className="size-4" aria-hidden="true" />
            {b.grade ?? "Pas encore de grade"}
          </span>
        </div>
      </div>

      {section.id === "conjugaison" && (
        <a className="rg-lien-machine" href="#regles/machine">
          <Clock className="size-4" aria-hidden="true" />
          Ouvrir la Machine à voyager dans le temps
        </a>
      )}

      {NIVEAUX.map((n) => {
        const ls = section.lecons.filter((l) => l.niveau === n);
        if (!ls.length) return null;
        const fini = b.niveauxFinis.includes(n);
        return (
          <div key={n} className="rg-niveau" data-fini={fini || undefined}>
            <div className="rg-niveau-tete">
              <span className="rg-niveau-code">{n}</span>
              <div>
                <h3 className="rg-niveau-nom">{NOMS_NIVEAUX[n]}</h3>
                <p className="rg-niveau-grade">
                  <Trophy className="size-3.5" aria-hidden="true" />
                  {fini ? `Grade gagné : ${section.grades[n]}` : `Grade à gagner : ${section.grades[n]}`}
                </p>
              </div>
            </div>
            <ol className="rg-chemin">
              {ls.map((l) => {
                const r = lecons[l.id];
                const prochaine = b.prochaine?.id === l.id;
                return (
                  <li key={l.id} data-faite={r?.etoiles ? true : undefined} data-prochaine={prochaine || undefined}>
                    <button type="button" className="rg-station" onClick={() => onLecon(l.id)}>
                      <span className="rg-station-heros" aria-hidden="true">
                        {l.heros}
                      </span>
                      <span className="rg-station-texte">
                        <span className="rg-station-titre">{l.titre}</span>
                        <span className="rg-station-notion">{l.notion}</span>
                      </span>
                      <span className="rg-station-etoiles" aria-label={r?.etoiles ? `${r.etoiles} étoile${r.etoiles > 1 ? "s" : ""}` : prochaine ? "Prochaine leçon" : "Pas encore faite"}>
                        {prochaine && !r ? (
                          <span className="rg-station-ici">À toi !</span>
                        ) : (
                          [0, 1, 2].map((i) => <Star key={i} className="size-3.5" data-pleine={i < (r?.etoiles ?? 0) || undefined} aria-hidden="true" />)
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        );
      })}
    </section>
  );
}

/* ---------- La Machine en grand ---------- */

function PageMachine({ onRetour }: { onRetour: () => void }) {
  return (
    <section className="rg" aria-labelledby="titre-machine">
      <button type="button" className="rg-retour" onClick={onRetour}>
        <ArrowLeft className="size-4" aria-hidden="true" />
        Les règles
      </button>
      <div className="lg-section-tete">
        <div>
          <h2 id="titre-machine" className="lg-titre">
            La Machine à voyager dans le temps
          </h2>
          <p className="lg-chapo">Choisis un verbe, un monde, une époque : les six passagers l&apos;habillent sous tes yeux. Le corps du verbe est en bleu, son costume en or, le moteur des temps composés en violet.</p>
        </div>
      </div>
      <Machine />
    </section>
  );
}
