"use client";

import { Check, RotateCcw, Undo2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MarquePremium } from "@/components/premium/MarquePremium";
import { PAR_ID } from "@/lib/corps/catalogue";
import { CATEGORIES, type CategorieId, IDS_CATEGORIES, niveauxDe } from "@/lib/corps/niveaux";
import { QUEL } from "@/lib/corps/quiz";
import { aRevoir, mesFavoris, noterReponse, useEcorche } from "@/lib/corps/progression";
import { Cartel, TEINTE, miseEnScene } from "./communs";
import type { Navigation, Stage } from "./Ecorche";
import { dire, jouer } from "./sons";

type Paquet = CategorieId | "favoris" | "revoir";
const PAQUETS: { id: Paquet; nom: string }[] = [
  { id: "revoir", nom: "À revoir" },
  ...IDS_CATEGORIES.filter((c) => c !== "corps").map((c) => ({ id: c as Paquet, nom: CATEGORIES[c].nom.replace(/^(Les |Le |L')/, "").replace(/^./, (l) => l.toUpperCase()) })),
  { id: "favoris", nom: "Mes fiches" },
];

/*
 * Les fiches : une structure s'allume sur le corps, on cherche son nom, on retourne la fiche.
 * « Je savais » l'éloigne (elle reviendra dans quelques jours) ; « Je ne savais pas » la ramène vite.
 */
export function Fiches({ stage, nav }: { stage: Stage; nav: Navigation }) {
  const e = useEcorche();
  const [paquet, setPaquet] = useState<Paquet>("revoir");
  const [i, setI] = useState(0);
  const [retournee, setRetournee] = useState(false);
  const [faites, setFaites] = useState(0);
  const [historique, setHistorique] = useState<string[]>([]);

  // Le paquet : d'abord ce qui est dû, puis ce qui n'a jamais été vu (dans l'ordre des planches).
  const liste = useMemo(() => {
    const ordre = (c: CategorieId) => niveauxDe(c).flatMap((n) => n.nouveaux);
    let ids: string[];
    if (paquet === "favoris") ids = mesFavoris(e);
    else if (paquet === "revoir") ids = Object.entries(e.elements).filter(([id, m]) => PAR_ID.has(id) && aRevoir(m)).sort((a, b) => a[1][2] - b[1][2]).map(([id]) => id);
    else {
      const tout = ordre(paquet);
      const dues = tout.filter((id) => aRevoir(e.elements[id]));
      const nouvelles = tout.filter((id) => !e.elements[id]);
      ids = [...dues, ...nouvelles];
    }
    return ids;
    // Le paquet se fige à l'ouverture : ce qu'on vient de réviser ne doit pas le faire bouger sous nos doigts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paquet]);
  const id = liste[i % Math.max(1, liste.length)];
  const el = id ? PAR_ID.get(id) : undefined;

  useEffect(() => {
    if (!el) {
      stage.regler({ etats: {}, etiquette: null, rotation: true, isoler: null, retrait: false });
      stage.poignee.current?.vue("ensemble");
      return;
    }
    const { couches, calques, profondeur, decouvrir } = miseEnScene(el);
    // La structure de la fiche ressort, liserée ; le reste du corps passe en transparence, sans disparaître.
    stage.regler({ couches, calques, profondeur, decouvrir, etats: { [el.id]: { teinte: retournee ? TEINTE.juste : TEINTE.laiton, pulse: !retournee, choisi: true } }, isoler: null, voiler: { ids: [el.id] }, rotation: false, etiquette: retournee ? { id: el.id, texte: el.nom } : null, retrait: false });
    stage.poignee.current?.viser([el.id], { marge: 1.6 });
  }, [el, retournee, stage]);

  useEffect(() => {
    stage.surChoix(null);
  }, [stage]);

  const noter = (savais: boolean) => {
    if (!el) return;
    noterReponse(el.id, savais, savais ? 3 : 0);
    jouer(savais ? "juste" : "retourne");
    setHistorique((h) => [...h, el.id]);
    setFaites((f) => f + 1);
    setRetournee(false);
    setI((x) => x + 1);
  };

  return (
    <div className="ec-fiches">
      <h1 className="ec-page-titre">Les fiches</h1>
      <MarquePremium fonction="ecorche.fiches" />
      <p className="ec-page-chapo">Une structure s’allume : trouve son nom, puis retourne la fiche. Ce que tu sais s’éloigne, ce qui t’échappe revient vite.</p>
      <div className="ec-segment" role="radiogroup" aria-label="Le paquet">
        {PAQUETS.map((x) => (
          <button
            key={x.id}
            type="button"
            role="radio"
            aria-checked={paquet === x.id}
            onClick={() => {
              setPaquet(x.id);
              setI(0);
              setRetournee(false);
            }}
          >
            {x.nom}
          </button>
        ))}
      </div>
      {!el ? (
        <div className="ec-vide">
          <p>{paquet === "revoir" ? "Rien à revoir aujourd'hui : tout ce que tu as appris tient bon." : paquet === "favoris" ? "Garde des structures depuis l'onglet Explorer : elles viendront ici." : "Ce paquet est vide."}</p>
          {paquet !== "favoris" && (
            <button type="button" className="ec-bouton" onClick={() => setPaquet("muscles")}>
              Prendre le paquet des muscles
            </button>
          )}
        </div>
      ) : (
        <div className={`ec-fiche ${retournee ? "est-retournee" : ""}`}>
          <p className="ec-methode">
            Fiche {(i % liste.length) + 1} sur {liste.length}
            {faites > 0 && <span className="ec-score">{faites} revue{faites > 1 ? "s" : ""}</span>}
          </p>
          {!retournee ? (
            <>
              <h2 className="ec-consigne">{QUEL[el.couche]}</h2>
              <p className="ec-note">Cherche dans ta tête, puis retourne.</p>
              <button
                type="button"
                className="ec-bouton est-plein est-grand"
                onClick={() => {
                  setRetournee(true);
                  jouer("retourne");
                  dire(el.nom);
                }}
                autoFocus
              >
                <RotateCcw size={16} aria-hidden="true" /> Retourner la fiche
              </button>
            </>
          ) : (
            <>
              <Cartel e={el} compter latin={e.profil.latin} />
              <div className="ec-boutons ec-fiche-choix">
                <button type="button" className="ec-bouton est-faux" onClick={() => noter(false)}>
                  <X size={16} aria-hidden="true" /> Je ne savais pas
                </button>
                <button type="button" className="ec-bouton est-juste" onClick={() => noter(true)}>
                  <Check size={16} aria-hidden="true" /> Je savais
                </button>
              </div>
            </>
          )}
          {historique.length > 0 && !retournee && (
            <button type="button" className="ec-lien" onClick={() => nav.aller(`explorer/${historique[historique.length - 1]}`)}>
              <Undo2 size={14} aria-hidden="true" /> Revoir la précédente dans l’explorateur
            </button>
          )}
          <p className="ec-note ec-pied">Ce paquet : {paquet === "revoir" || paquet === "favoris" ? PAQUETS.find((x) => x.id === paquet)?.nom : CATEGORIES[paquet].nom}.</p>
        </div>
      )}
    </div>
  );
}
