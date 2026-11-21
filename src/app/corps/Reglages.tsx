"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { type Aspect, type Finesse, reglerAppareil, useAppareil } from "@/lib/corps/appareil";
import { HAUTE_DEFINITION } from "@/lib/corps/modele/modele";
import { CATEGORIES, type CategorieId, IDS_CATEGORIES } from "@/lib/corps/niveaux";
import { type Profil, regler, remettreAZero, useEcorche } from "@/lib/corps/progression";

function Interrupteur({ nom, aide, valeur, changer }: { nom: string; aide?: string; valeur: boolean; changer: (v: boolean) => void }) {
  return (
    <label className="ec-interrupteur">
      <span>
        <b>{nom}</b>
        {aide && <small>{aide}</small>}
      </span>
      <input type="checkbox" role="switch" checked={valeur} onChange={(ev) => changer(ev.target.checked)} />
    </label>
  );
}

function Choix<T extends string | number>({ nom, valeur, options, changer }: { nom: string; valeur: T; options: { v: T; nom: string }[]; changer: (v: T) => void }) {
  return (
    <div className="ec-choix">
      <b>{nom}</b>
      <div className="ec-segment" role="radiogroup" aria-label={nom}>
        {options.map((o) => (
          <button key={String(o.v)} type="button" role="radio" aria-checked={valeur === o.v} onClick={() => changer(o.v)}>
            {o.nom}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Reglages({ fermer, sources }: { fermer: () => void; sources: () => void }) {
  const e = useEcorche();
  const p = e.profil;
  const appareil = useAppareil();
  const boite = useRef<HTMLDialogElement>(null);
  const [aZero, setAZero] = useState<CategorieId | null>(null);
  const r = (x: Partial<Profil>) => regler(x as Parameters<typeof regler>[0]);

  useEffect(() => {
    const d = boite.current;
    if (d && !d.open) d.showModal();
    const fermeture = () => fermer();
    d?.addEventListener("close", fermeture);
    return () => d?.removeEventListener("close", fermeture);
  }, [fermer]);

  return (
    <dialog ref={boite} className="ec-dialogue" aria-labelledby="ec-titre-reglages">
      <header>
        <h2 id="ec-titre-reglages">Réglages</h2>
        <button type="button" className="ec-icone" onClick={() => boite.current?.close()} aria-label="Fermer">
          <X size={18} aria-hidden="true" />
        </button>
      </header>
      <div className="ec-dialogue-corps">
        <h3 className="ec-section-titre">Les parties</h3>
        <Choix nom="Questions par planche" valeur={p.questions} options={[8, 12, 16].map((v) => ({ v: v as 8 | 12 | 16, nom: String(v) }))} changer={(v) => r({ questions: v })} />
        <Choix
          nom="Les faux choix"
          valeur={p.difficulte}
          options={[
            { v: "facile", nom: "Faciles" },
            { v: "normal", nom: "Voisins" },
            { v: "difficile", nom: "Trompeurs" },
          ]}
          changer={(v) => r({ difficulte: v })}
        />
        <Choix nom="Objectif du jour" valeur={p.objectif} options={[10, 20, 40].map((v) => ({ v, nom: `${v} questions` }))} changer={(v) => r({ objectif: v })} />
        <Interrupteur nom="Montrer le latin" aide="Le nom latin et le nom anglais sous chaque nom français." valeur={p.latin} changer={(v) => r({ latin: v })} />
        <h3 className="ec-section-titre">Le corps</h3>
        <Choix<Aspect>
          nom="La pièce"
          valeur={appareil.aspect}
          options={[
            { v: "frais", nom: "Fraîche" },
            { v: "plastine", nom: "Plastinée" },
          ]}
          changer={(v) => reglerAppareil({ aspect: v })}
        />
        <p className="ec-note">Fraîche : humide et brillante, comme en salle de dissection. Plastinée : satinée, comme une pièce de musée.</p>
        <Choix<Finesse>
          nom="La finesse des modèles"
          valeur={appareil.finesse}
          options={[
            { v: "auto" as Finesse, nom: "Selon l'appareil" },
            { v: "legere" as Finesse, nom: "Légère" },
            { v: "standard" as Finesse, nom: "Standard" },
            ...(HAUTE_DEFINITION ? [{ v: "haute" as Finesse, nom: "Haute" }] : []),
          ]}
          changer={(v) => reglerAppareil({ finesse: v })}
        />
        <p className="ec-note">
          Légère : un million de triangles, pour les téléphones. Standard : près de quatre millions.{HAUTE_DEFINITION ? " Haute : douze millions, pour une carte graphique puissante (50 Mo à télécharger)." : ""} Ce réglage reste sur cet appareil.
        </p>
        <Interrupteur nom="Rotation tranquille" aide="Le corps tourne seul quand on ne le touche pas." valeur={p.rotation} changer={(v) => r({ rotation: v })} />
        <h3 className="ec-section-titre">Le son et la lecture</h3>
        <Interrupteur nom="Les sons" valeur={p.son} changer={(v) => r({ son: v })} />
        <Interrupteur nom="Les vibrations" aide="Sur téléphone." valeur={p.vibrations} changer={(v) => r({ vibrations: v })} />
        <Interrupteur nom="Lire les réponses à voix haute" aide="La bonne réponse est prononcée." valeur={p.voix} changer={(v) => r({ voix: v })} />
        <Interrupteur nom="Plus de contraste" valeur={p.contraste} changer={(v) => r({ contraste: v })} />
        <Choix
          nom="Taille du texte"
          valeur={p.taille}
          options={[
            { v: 100, nom: "Normale" },
            { v: 115, nom: "Grande" },
            { v: 130, nom: "Très grande" },
          ]}
          changer={(v) => r({ taille: v as 100 | 115 | 130 })}
        />
        <h3 className="ec-section-titre">Recommencer une couche</h3>
        <p className="ec-note">Ses planches et la mémoire de ses structures repartent de zéro. Ton expérience et tes médailles restent.</p>
        <div className="ec-boutons">
          {IDS_CATEGORIES.map((c) =>
            aZero === c ? (
              <span key={c} className="ec-confirmer">
                Remettre {CATEGORIES[c].nom.toLowerCase()} à zéro ?
                <button
                  type="button"
                  className="ec-bouton est-faux"
                  onClick={() => {
                    remettreAZero(c);
                    setAZero(null);
                  }}
                >
                  Oui
                </button>
                <button type="button" className="ec-bouton est-discret" onClick={() => setAZero(null)}>
                  Non
                </button>
              </span>
            ) : (
              <button key={c} type="button" className="ec-bouton est-discret" onClick={() => setAZero(c)}>
                {CATEGORIES[c].nom}
              </button>
            ),
          )}
        </div>
        <h3 className="ec-section-titre">D’où vient ce corps</h3>
        <p className="ec-note">Les modèles viennent d’atlas libres (Z-Anatomy, BodyParts3D).</p>
        <button
          type="button"
          className="ec-bouton est-discret"
          onClick={() => {
            boite.current?.close();
            sources();
          }}
        >
          Sources et licences
        </button>
        <h3 className="ec-section-titre">Au clavier</h3>
        <p className="ec-note">Flèches : tourner le corps · + et − : rapprocher, éloigner · 0 : de face · 1 à 4 : choisir une réponse · Entrée : continuer · Échap : quitter la partie. Maj + glisser ou clic droit : déplacer.</p>
      </div>
    </dialog>
  );
}
