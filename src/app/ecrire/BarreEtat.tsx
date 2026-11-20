"use client";

import { AlignVerticalSpaceAround, Columns2, Focus, Maximize2, Mic, MicOff, Minus, Music, Plus } from "lucide-react";
import { useState } from "react";
import { AMBIANCES, modifierPreferences, type Ambiance } from "@/lib/atelier/preferences";
import { usePreferences } from "./crochets";
import { jouerAmbiance, reglerVolume } from "./ambiance";

type Props = {
  page: number;
  pages: number;
  mots: number;
  motsSelection: number | null;
  zoom: number;
  surZoom: (z: number) => void;
  surAjuster: () => void;
  surAllerPage: (n: number) => void;
  concentration: boolean;
  surConcentration: () => void;
  vueCote: boolean;
  surVueCote: () => void;
  dictee: "arret" | "ecoute" | "indisponible";
  surDictee: () => void;
  provisoire: string;
};

export const ZOOMS = [0.5, 0.67, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2];

/** La barre d'état, en bas de la page : où l'on est, combien de mots, l'agrandissement, les modes. */
export function BarreEtat(p: Props) {
  const prefs = usePreferences();
  const [allerA, setAllerA] = useState<string | null>(null);
  const [son, setSon] = useState(false);
  const pas = (sens: 1 | -1) => {
    const i = ZOOMS.findIndex((z) => Math.abs(z - p.zoom) < 0.01);
    // Après « ajuster à la largeur », l'agrandissement tombe entre deux crans : on part du plus proche.
    const suivant =
      i >= 0
        ? ZOOMS[Math.min(ZOOMS.length - 1, Math.max(0, i + sens))]
        : sens > 0
          ? (ZOOMS.find((z) => z > p.zoom) ?? ZOOMS[ZOOMS.length - 1])
          : ([...ZOOMS].reverse().find((z) => z < p.zoom) ?? p.zoom);
    p.surZoom(suivant);
  };

  return (
    <div className="calame-etat-barre sans-impression" role="status" aria-label="État du document">
      {p.provisoire && <p className="calame-dictee-provisoire">{p.provisoire}</p>}
      <div className="calame-etat-groupe">
        {allerA === null ? (
          <button type="button" className="calame-etat-bouton" onClick={() => setAllerA(String(p.page))} title="Aller à une page">
            Page {p.page} sur {p.pages}
          </button>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const n = Number(allerA);
              if (Number.isFinite(n) && n >= 1) p.surAllerPage(Math.min(p.pages, Math.round(n)));
              setAllerA(null);
            }}
          >
            <label className="calame-etat-bouton">
              Page
              <input autoFocus type="number" min={1} max={p.pages} value={allerA} onChange={(e) => setAllerA(e.target.value)} onBlur={() => setAllerA(null)} className="calame-etat-champ" aria-label="Numéro de la page" />
              sur {p.pages}
            </label>
          </form>
        )}
        <span className="calame-etat-texte">
          {p.mots.toLocaleString("fr-FR")} mots
          {p.motsSelection !== null && ` · sélection ${p.motsSelection.toLocaleString("fr-FR")}`}
        </span>
      </div>

      <div className="calame-etat-groupe">
        <button type="button" className="calame-etat-icone" aria-pressed={prefs.machineAEcrire} onClick={() => modifierPreferences({ machineAEcrire: !prefs.machineAEcrire })} title="Machine à écrire : la ligne en cours reste au milieu">
          <AlignVerticalSpaceAround className="size-4" aria-hidden="true" />
          <span className="sr-only">Mode machine à écrire</span>
        </button>
        <button type="button" className="calame-etat-icone" aria-pressed={p.concentration} onClick={p.surConcentration} title="Concentration : plein écran, seul le paragraphe en cours (Ctrl+Maj+F)">
          <Focus className="size-4" aria-hidden="true" />
          <span className="sr-only">Mode concentration</span>
        </button>
        <button type="button" className="calame-etat-icone" aria-pressed={p.vueCote} onClick={p.surVueCote} title="Vue côte à côte">
          <Columns2 className="size-4" aria-hidden="true" />
          <span className="sr-only">Vue côte à côte</span>
        </button>
        {p.dictee !== "indisponible" && (
          <button type="button" className="calame-etat-icone" aria-pressed={p.dictee === "ecoute"} onClick={p.surDictee} title={p.dictee === "ecoute" ? "Arrêter la dictée" : "Dicter (le micro écoute, le texte s'écrit)"} data-ecoute={p.dictee === "ecoute" ? "" : undefined}>
            {p.dictee === "ecoute" ? <MicOff className="size-4" aria-hidden="true" /> : <Mic className="size-4" aria-hidden="true" />}
            <span className="sr-only">Dictée vocale</span>
          </button>
        )}
        <span className="calame-etat-son">
          <button type="button" className="calame-etat-icone" aria-pressed={prefs.ambiance !== "aucune"} aria-expanded={son} onClick={() => setSon((x) => !x)} title="Ambiance sonore">
            <Music className="size-4" aria-hidden="true" />
            <span className="sr-only">Ambiance sonore</span>
          </button>
          {son && (
            <span className="calame-etat-popover" role="group" aria-label="Ambiance sonore">
              {AMBIANCES.map((a) => (
                <button
                  key={a.cle}
                  type="button"
                  className="puce-module"
                  aria-pressed={prefs.ambiance === a.cle}
                  onClick={() => {
                    modifierPreferences({ ambiance: a.cle as Ambiance });
                    jouerAmbiance(a.cle as Ambiance, prefs.volume);
                  }}
                >
                  {a.libelle}
                </button>
              ))}
              <label className="inspecteur-reglage">
                <span className="inspecteur-libelle">Volume</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={prefs.volume}
                  className="atelier-glissiere"
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    modifierPreferences({ volume: v });
                    reglerVolume(v);
                  }}
                />
              </label>
            </span>
          )}
        </span>
        <span className="calame-etat-zoom">
          <button type="button" className="calame-etat-icone" onClick={() => pas(-1)} title="Réduire">
            <Minus className="size-4" aria-hidden="true" />
            <span className="sr-only">Réduire la page</span>
          </button>
          <button type="button" className="calame-etat-bouton" onClick={() => p.surZoom(1)} title="Taille réelle">
            {Math.round(p.zoom * 100)} %
          </button>
          <button type="button" className="calame-etat-icone" onClick={() => pas(1)} title="Agrandir">
            <Plus className="size-4" aria-hidden="true" />
            <span className="sr-only">Agrandir la page</span>
          </button>
          <button type="button" className="calame-etat-icone" onClick={p.surAjuster} title="Ajuster à la largeur">
            <Maximize2 className="size-4" aria-hidden="true" />
            <span className="sr-only">Ajuster à la largeur</span>
          </button>
        </span>
      </div>
    </div>
  );
}
