"use client";

import { BookOpen, Hash, ListOrdered, NotebookText, Stamp, Type } from "lucide-react";
import { BORDURES, PLACES_NOTES, POSITIONS_NUMERO, STYLES_NUMERO, type ReglagesPage, type ZonesLigne } from "@/lib/atelier/modele";
import { Curseur } from "../Inspecteur";

type Props = {
  reglages: ReglagesPage;
  surReglages: (modif: Partial<ReglagesPage>) => void;
};

const JETONS = ["{titre}", "{partie}", "{page}", "{pages}", "{auteur}", "{date}", "{hégire}"];

function Champ({ libelle, valeur, surChangement, indication }: { libelle: string; valeur: string; surChangement: (v: string) => void; indication?: string }) {
  return (
    <label className="inspecteur-reglage">
      <span className="inspecteur-libelle">{libelle}</span>
      <input className="champ" value={valeur} onChange={(e) => surChangement(e.target.value)} placeholder={indication} />
    </label>
  );
}

function Bascule({ libelle, coche, surChangement }: { libelle: string; coche: boolean; surChangement: (v: boolean) => void }) {
  return (
    <label className="inspecteur-bascule">
      <input type="checkbox" checked={coche} onChange={(e) => surChangement(e.target.checked)} />
      <span>{libelle}</span>
    </label>
  );
}

/**
 * L'onglet « Page », suite : ce qu'il faut pour un livre ou un mémoire — reliure, en-têtes en
 * trois zones (pages paires à part), numérotation, notes, filigrane, bordure, numéros de ligne.
 */
export function PanneauMiseEnPage({ reglages: r, surReglages }: Props) {
  const zonesPaires = (quoi: "entete" | "pied", cote: keyof ZonesLigne, valeur: string) =>
    surReglages({ paires: { ...r.paires, [quoi]: { ...r.paires[quoi], [cote]: valeur } } });

  return (
    <>
      <section className="calame-section" aria-labelledby="mep-livre">
        <h3 className="calame-section-titre" id="mep-livre">
          <BookOpen className="size-4" aria-hidden="true" /> Livre et reliure
        </h3>
        <Bascule libelle="Marges en miroir (recto verso)" coche={r.miroir} surChangement={(v) => surReglages({ miroir: v })} />
        <p className="inspecteur-aide">La marge de gauche devient la marge intérieure, côté reliure : sur les pages paires, elle passe à droite.</p>
        <div className="inspecteur-choix" role="group" aria-label="Fond perdu">
          {[0, 3, 5].map((mm) => (
            <button key={mm} type="button" className="puce-module" aria-pressed={r.fondPerdu === mm} onClick={() => surReglages({ fondPerdu: mm })}>
              {mm === 0 ? "Sans fond perdu" : `Fond perdu ${mm} mm`}
            </button>
          ))}
        </div>
        <p className="inspecteur-aide">Le fond perdu agrandit chaque page imprimée de quelques millimètres tout autour, comme le demandent les imprimeurs.</p>
      </section>

      <section className="calame-section" aria-labelledby="mep-zones">
        <h3 className="calame-section-titre" id="mep-zones">
          <Type className="size-4" aria-hidden="true" /> En-tête et pied en trois zones
        </h3>
        <Champ libelle="En-tête, à gauche" valeur={r.enteteGauche} surChangement={(v) => surReglages({ enteteGauche: v })} indication="{titre}" />
        <Champ libelle="En-tête, au centre" valeur={r.enteteCentre} surChangement={(v) => surReglages({ enteteCentre: v })} indication="{partie}" />
        <p className="inspecteur-aide">À droite : le champ « En-tête » plus haut.</p>
        <Champ libelle="Pied, au centre" valeur={r.piedCentre} surChangement={(v) => surReglages({ piedCentre: v })} indication="{hégire}" />
        <Champ libelle="Pied, à droite" valeur={r.piedDroite} surChangement={(v) => surReglages({ piedDroite: v })} indication="{auteur}" />
        <p className="inspecteur-aide">À gauche : le champ « Pied de page » plus haut.</p>
        <Bascule libelle="Différents sur les pages paires" coche={r.pairesDifferentes} surChangement={(v) => surReglages({ pairesDifferentes: v })} />
        {r.pairesDifferentes && (
          <div className="calame-zones-paires">
            {(["entete", "pied"] as const).map((quoi) =>
              (["gauche", "centre", "droite"] as const).map((cote) => (
                <Champ
                  key={`${quoi}-${cote}`}
                  libelle={`${quoi === "entete" ? "En-tête" : "Pied"} des pages paires, ${cote === "gauche" ? "à gauche" : cote === "centre" ? "au centre" : "à droite"}`}
                  valeur={r.paires[quoi][cote]}
                  surChangement={(v) => zonesPaires(quoi, cote, v)}
                />
              )),
            )}
          </div>
        )}
        <p className="inspecteur-aide">
          Se remplacent tout seuls :{" "}
          {JETONS.map((j) => (
            <code key={j} className="mr-1">
              {j}
            </code>
          ))}
          — {"{partie}"} donne le titre de la partie en cours, {"{hégire}"} la date du jour selon le calendrier de l&apos;Hégire.
        </p>
      </section>

      <section className="calame-section" aria-labelledby="mep-numeros">
        <h3 className="calame-section-titre" id="mep-numeros">
          <Hash className="size-4" aria-hidden="true" /> Numérotation des pages
        </h3>
        <div className="inspecteur-choix" role="group" aria-label="Chiffres">
          {STYLES_NUMERO.map((s) => (
            <button key={s.cle} type="button" className="puce-module" aria-pressed={r.numeroStyle === s.cle} onClick={() => surReglages({ numeroStyle: s.cle })}>
              {s.libelle}
            </button>
          ))}
        </div>
        <label className="inspecteur-reglage">
          <span className="inspecteur-libelle">Place du numéro</span>
          <select className="champ" value={r.numeroPosition} onChange={(e) => surReglages({ numeroPosition: e.target.value as ReglagesPage["numeroPosition"] })}>
            {POSITIONS_NUMERO.map((p) => (
              <option key={p.cle} value={p.cle}>
                {p.libelle}
              </option>
            ))}
          </select>
        </label>
        <label className="inspecteur-reglage">
          <span className="inspecteur-libelle">Premier numéro du corps du texte</span>
          <input className="champ" type="number" min={0} max={9999} value={r.premierNumero} onChange={(e) => surReglages({ premierNumero: Math.max(0, Math.min(9999, Math.round(Number(e.target.value) || 0))) })} />
        </label>
        <Curseur id="mep-liminaires" libelle="Pages liminaires en chiffres romains" valeur={r.pagesLiminaires} bornes={{ min: 0, max: 30, pas: 1 }} unite="" surChangement={(v) => surReglages({ pagesLiminaires: v })} />
        <p className="inspecteur-aide">Les premières pages (page de garde, remerciements, sommaire) sont numérotées i, ii, iii ; le corps du texte repart ensuite au premier numéro.</p>
      </section>

      <section className="calame-section" aria-labelledby="mep-notes">
        <h3 className="calame-section-titre" id="mep-notes">
          <NotebookText className="size-4" aria-hidden="true" /> Notes
        </h3>
        <div className="inspecteur-choix" role="group" aria-label="Place des notes">
          {PLACES_NOTES.map((p) => (
            <button key={p.cle} type="button" className="puce-module" aria-pressed={r.notes === p.cle} onClick={() => surReglages({ notes: p.cle })}>
              {p.libelle}
            </button>
          ))}
        </div>
        <p className="inspecteur-aide">En bas de page, chaque note s&apos;imprime sur la page où elle est appelée ; à la fin, elles sont rassemblées sous un titre « Notes ».</p>
      </section>

      <section className="calame-section" aria-labelledby="mep-decor">
        <h3 className="calame-section-titre" id="mep-decor">
          <Stamp className="size-4" aria-hidden="true" /> Filigrane, bordure, lignes
        </h3>
        <Champ libelle="Filigrane" valeur={r.filigrane} surChangement={(v) => surReglages({ filigrane: v.slice(0, 40) })} indication="Brouillon, Confidentiel…" />
        <div className="inspecteur-choix" role="group" aria-label="Filigranes prêts">
          {["Brouillon", "Confidentiel", "Copie", "Ne pas diffuser"].map((f) => (
            <button key={f} type="button" className="puce-module" aria-pressed={r.filigrane === f} onClick={() => surReglages({ filigrane: r.filigrane === f ? "" : f })}>
              {f}
            </button>
          ))}
        </div>
        <div className="inspecteur-choix" role="group" aria-label="Bordure de page">
          {BORDURES.map((b) => (
            <button key={b.cle} type="button" className="puce-module" aria-pressed={r.bordure === b.cle} onClick={() => surReglages({ bordure: b.cle })}>
              {b.libelle}
            </button>
          ))}
        </div>
        <Bascule libelle="Numéroter les lignes (toutes les cinq)" coche={r.numerosLignes} surChangement={(v) => surReglages({ numerosLignes: v })} />
      </section>
    </>
  );
}

/** L'onglet « Styles », suite : ce qui règle le texte courant de tout le document. */
export function PanneauTexte({ reglages: r, surReglages }: Props) {
  return (
    <section className="calame-section" aria-labelledby="mep-texte">
      <h3 className="calame-section-titre" id="mep-texte">
        <ListOrdered className="size-4" aria-hidden="true" /> Composition du texte
      </h3>
      <Bascule libelle="Numéroter les titres (1., 1.1., 1.1.1.)" coche={r.numeroterTitres} surChangement={(v) => surReglages({ numeroterTitres: v })} />
      <Curseur id="mep-alinea" libelle="Alinéa (retrait de première ligne)" valeur={r.alinea} bornes={{ min: 0, max: 15, pas: 0.5 }} unite=" mm" surChangement={(v) => surReglages({ alinea: v })} />
      <Bascule libelle="Lettrine au début de chaque partie" coche={r.lettrine} surChangement={(v) => surReglages({ lettrine: v })} />
      <Bascule libelle="Césure du français (texte justifié sans grands blancs)" coche={r.cesure} surChangement={(v) => surReglages({ cesure: v })} />
      <Bascule libelle="Ni ligne seule en bas de page, ni en haut de la suivante" coche={r.veuves} surChangement={(v) => surReglages({ veuves: v })} />
    </section>
  );
}
