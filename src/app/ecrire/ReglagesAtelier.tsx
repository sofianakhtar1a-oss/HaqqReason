"use client";

import { modifierPreferences, THEMES_ATELIER, type ThemeAtelier } from "@/lib/atelier/preferences";
import { usePreferences } from "./crochets";
import { Fenetre } from "./Fenetre";

/** Les réglages de l'atelier lui-même (pas du document) : apparence, confort, aides à la frappe. */
export function ReglagesAtelier({ surFermer }: { surFermer: () => void }) {
  const prefs = usePreferences();
  const bascule = (cle: "typographie" | "translitRapide" | "dyslexie" | "machineAEcrire", libelle: string, aide?: string) => (
    <label className="inspecteur-bascule">
      <input type="checkbox" checked={prefs[cle]} onChange={(e) => modifierPreferences({ [cle]: e.target.checked })} />
      <span>
        {libelle}
        {aide && <span className="block text-sm text-encre-douce">{aide}</span>}
      </span>
    </label>
  );
  return (
    <Fenetre titre="Réglages de l'atelier" sousTitre="Ils te suivent sur tous tes appareils, avec ton compte." surFermer={surFermer} largeur={34}>
      <section className="calame-section">
        <h3 className="calame-section-titre">Apparence</h3>
        <div className="inspecteur-choix" role="group" aria-label="Thème de l'atelier">
          {THEMES_ATELIER.map((t) => (
            <button key={t.cle} type="button" className="puce-module" aria-pressed={prefs.theme === t.cle} onClick={() => modifierPreferences({ theme: t.cle as ThemeAtelier })}>
              {t.libelle}
            </button>
          ))}
        </div>
        <label className="inspecteur-reglage">
          <span className="inspecteur-libelle">
            Taille du texte des menus <span className="inspecteur-valeur">{Math.round(prefs.tailleInterface * 100)} %</span>
          </span>
          <input type="range" min={0.85} max={1.4} step={0.05} value={prefs.tailleInterface} onChange={(e) => modifierPreferences({ tailleInterface: Number(e.target.value) })} className="atelier-glissiere" />
        </label>
        {bascule("dyslexie", "Police pour lecteurs dyslexiques", "À l'écran seulement : le texte s'espace davantage, la mise en page affichée change le temps de l'option ; l'impression et les exports gardent tes styles.")}
      </section>
      <section className="calame-section">
        <h3 className="calame-section-titre">Écriture</h3>
        {bascule("typographie", "Typographie française pendant la frappe", "Espaces fines avant ; ! ?, guillemets « », apostrophe ’, points de suspension.")}
        {bascule("translitRapide", "Translittération rapide", "_a → ā, .h → ḥ, ` → ʿ… (voir Ctrl+Maj+C).")}
        {bascule("machineAEcrire", "Machine à écrire", "La ligne en cours reste au milieu de l'écran.")}
      </section>
    </Fenetre>
  );
}
