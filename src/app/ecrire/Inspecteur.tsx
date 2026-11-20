"use client";

import { useState } from "react";
import { Download, FileDown, FileText, Hash, Palette, Ruler, Sparkles, Type, type LucideIcon } from "lucide-react";
import {
  BORNES_JETON,
  FORMATS,
  GRAISSES,
  MARGES_TYPES,
  NOMS_STYLES,
  ORIENTATIONS,
  POLICES,
  STYLES_PAR_DEFAUT,
  type Jeton,
  type ReglagesPage,
  type Styles,
} from "@/lib/atelier/modele";

export type OngletSupplementaire = { cle: string; libelle: string; Icone: LucideIcon; contenu: React.ReactNode };

type Props = {
  reglages: ReglagesPage;
  surReglages: (modif: Partial<ReglagesPage>) => void;
  stats: { mots: number; signes: number; pages: number; minutes: number };
  surExport: (quoi: "pdf" | "docx" | "md" | "calame") => void;
  enCours: string;
  /** Onglets ajoutés par l'atelier (document, relecture, versions, bilan…). */
  supplementaires?: OngletSupplementaire[];
  /** Onglet ouvert, quand l'atelier le pilote (barre de commande, raccourcis). */
  onglet?: string;
  surOnglet?: (cle: string) => void;
  /** Ce qui s'ajoute en bas de l'onglet « Sortie » (autres formats, partage…). */
  sortieEnPlus?: React.ReactNode;
  /** Ce qui s'ajoute en bas de l'onglet « Page » (mise en page avancée). */
  pageEnPlus?: React.ReactNode;
  /** Ce qui s'ajoute en bas de l'onglet « Styles » (jeux de styles, styles à soi). */
  stylesEnPlus?: React.ReactNode;
};

const ONGLETS = [
  { cle: "page", libelle: "Page", Icone: Ruler },
  { cle: "styles", libelle: "Styles", Icone: Type },
  { cle: "sortie", libelle: "Sortie", Icone: Download },
] as const;

export function Curseur({
  id,
  libelle,
  valeur,
  bornes,
  unite,
  surChangement,
}: {
  id: string;
  libelle: string;
  valeur: number;
  bornes: { min: number; max: number; pas: number };
  unite: string;
  surChangement: (v: number) => void;
}) {
  return (
    <label htmlFor={id} className="inspecteur-reglage">
      <span className="inspecteur-libelle">
        {libelle}
        <span className="inspecteur-valeur">
          {valeur}
          {unite}
        </span>
      </span>
      <input
        id={id}
        type="range"
        min={bornes.min}
        max={bornes.max}
        step={bornes.pas}
        value={valeur}
        onChange={(e) => surChangement(Number(e.target.value))}
        className="atelier-glissiere"
      />
    </label>
  );
}

function ReglageJeton({ nom, jeton, surChangement }: { nom: keyof Styles; jeton: Jeton; surChangement: (modif: Partial<Jeton>) => void }) {
  const [ouvert, setOuvert] = useState(nom === "corps");
  return (
    <section className="inspecteur-jeton" data-ouvert={ouvert ? "" : undefined}>
      <button type="button" className="inspecteur-jeton-tete" onClick={() => setOuvert((o) => !o)} aria-expanded={ouvert}>
        <span className="font-semibold">{NOMS_STYLES[nom]}</span>
        <span className="text-sm text-encre-douce">
          {jeton.taille} pt · {POLICES.find((p) => p.cle === jeton.police)?.libelle.split(" ")[0]}
        </span>
      </button>
      {ouvert && (
        <div className="inspecteur-jeton-corps">
          <label className="inspecteur-reglage">
            <span className="inspecteur-libelle">Police</span>
            <select value={jeton.police} onChange={(e) => surChangement({ police: e.target.value as Jeton["police"] })} className="champ">
              {POLICES.map((p) => (
                <option key={p.cle} value={p.cle}>
                  {p.libelle}
                </option>
              ))}
            </select>
          </label>
          <Curseur id={`${nom}-taille`} libelle="Taille" valeur={jeton.taille} bornes={BORNES_JETON.taille} unite=" pt" surChangement={(taille) => surChangement({ taille })} />
          <Curseur
            id={`${nom}-interligne`}
            libelle="Interligne"
            valeur={jeton.interligne}
            bornes={BORNES_JETON.interligne}
            unite=""
            surChangement={(interligne) => surChangement({ interligne })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Curseur id={`${nom}-avant`} libelle="Avant" valeur={jeton.avant} bornes={BORNES_JETON.avant} unite=" pt" surChangement={(avant) => surChangement({ avant })} />
            <Curseur id={`${nom}-apres`} libelle="Après" valeur={jeton.apres} bornes={BORNES_JETON.apres} unite=" pt" surChangement={(apres) => surChangement({ apres })} />
          </div>
          <div className="flex items-center gap-3">
            <label className="inspecteur-reglage flex-1">
              <span className="inspecteur-libelle">Graisse</span>
              <select value={jeton.graisse} onChange={(e) => surChangement({ graisse: Number(e.target.value) })} className="champ">
                {GRAISSES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </label>
            <label className="inspecteur-reglage">
              <span className="inspecteur-libelle">Couleur</span>
              <input type="color" value={jeton.couleur} onChange={(e) => surChangement({ couleur: e.target.value })} className="inspecteur-couleur" aria-label="Couleur du texte" />
            </label>
          </div>
        </div>
      )}
    </section>
  );
}

export function Inspecteur({ reglages, surReglages, stats, surExport, enCours, supplementaires = [], onglet: ongletPilote, surOnglet, sortieEnPlus, pageEnPlus, stylesEnPlus }: Props) {
  const [ongletLocal, setOngletLocal] = useState<string>("page");
  const onglet = ongletPilote ?? ongletLocal;
  const setOnglet = (cle: string) => {
    setOngletLocal(cle);
    surOnglet?.(cle);
  };
  const tous = [...ONGLETS.map((o) => ({ cle: o.cle as string, libelle: o.libelle, Icone: o.Icone as LucideIcon })), ...supplementaires.map(({ cle, libelle, Icone }) => ({ cle, libelle, Icone }))];
  const supplementaire = supplementaires.find((o) => o.cle === onglet);
  const modifierStyle = (nom: keyof Styles, modif: Partial<Jeton>) =>
    surReglages({ styles: { ...reglages.styles, [nom]: { ...reglages.styles[nom], ...modif } } });

  return (
    <aside className="calame-inspecteur" aria-label="Mise en forme et sortie">
      <div className="calame-onglets calame-onglets-icones" role="tablist" aria-label="Panneaux de l'inspecteur">
        {tous.map(({ cle, libelle, Icone }) => (
          <button key={cle} type="button" role="tab" aria-selected={onglet === cle} className="calame-onglet" onClick={() => setOnglet(cle)} title={libelle}>
            <Icone className="size-4" aria-hidden="true" />
            <span className={tous.length > 3 ? "sr-only" : undefined}>{libelle}</span>
          </button>
        ))}
      </div>
      {tous.length > 3 && <p className="calame-inspecteur-titre">{tous.find((o) => o.cle === onglet)?.libelle}</p>}

      <div className="calame-inspecteur-corps">
        {supplementaire?.contenu}
        {onglet === "page" && (
          <>
            <label className="inspecteur-reglage">
              <span className="inspecteur-libelle">Format du papier</span>
              <select value={reglages.format} onChange={(e) => surReglages({ format: e.target.value as ReglagesPage["format"] })} className="champ">
                {FORMATS.map((f) => (
                  <option key={f.cle} value={f.cle}>
                    {f.libelle} — {f.largeur} × {f.hauteur} mm
                  </option>
                ))}
              </select>
            </label>

            <div className="inspecteur-choix" role="group" aria-label="Orientation">
              {ORIENTATIONS.map((o) => (
                <button key={o.cle} type="button" className="puce-module" aria-pressed={reglages.orientation === o.cle} onClick={() => surReglages({ orientation: o.cle })}>
                  {o.libelle}
                </button>
              ))}
            </div>

            <div className="inspecteur-choix" role="group" aria-label="Marges">
              {MARGES_TYPES.map((m) => (
                <button
                  key={m.cle}
                  type="button"
                  className="puce-module"
                  aria-pressed={JSON.stringify(reglages.marges) === JSON.stringify(m.marges)}
                  onClick={() => surReglages({ marges: { ...m.marges } })}
                >
                  {m.libelle}
                </button>
              ))}
            </div>

            {(["haut", "bas", "gauche", "droite"] as const).map((cote) => (
              <Curseur
                key={cote}
                id={`marge-${cote}`}
                libelle={`Marge ${cote}`}
                valeur={reglages.marges[cote]}
                bornes={{ min: 0, max: 60, pas: 1 }}
                unite=" mm"
                surChangement={(v) => surReglages({ marges: { ...reglages.marges, [cote]: v } })}
              />
            ))}

            <label className="inspecteur-reglage">
              <span className="inspecteur-libelle">En-tête</span>
              <input value={reglages.entete} onChange={(e) => surReglages({ entete: e.target.value })} className="champ" placeholder="Vide, ou {titre}" />
            </label>
            <label className="inspecteur-reglage">
              <span className="inspecteur-libelle">Pied de page</span>
              <input value={reglages.pied} onChange={(e) => surReglages({ pied: e.target.value })} className="champ" placeholder="Vide, ou {titre} — {date}" />
            </label>
            <p className="inspecteur-aide">
              Dans l&apos;en-tête et le pied, <code>{"{titre}"}</code>, <code>{"{page}"}</code>, <code>{"{pages}"}</code> et <code>{"{date}"}</code> se remplacent tout seuls.
            </p>

            {(
              [
                ["numeroter", "Numéroter les pages"],
                ["premierePageNue", "Première page sans en-tête"],
                ["reperes", "Montrer les marges à l'écran"],
                ["papierSombre", "Papier sombre (pour écrire la nuit)"],
              ] as const
            ).map(([cle, libelle]) => (
              <label key={cle} className="inspecteur-bascule">
                <input type="checkbox" checked={reglages[cle]} onChange={(e) => surReglages({ [cle]: e.target.checked } as Partial<ReglagesPage>)} />
                <span>{libelle}</span>
              </label>
            ))}
            {pageEnPlus}
          </>
        )}

        {onglet === "styles" && (
          <>
            <p className="inspecteur-aide">
              <Palette className="size-4 shrink-0 text-accent" aria-hidden="true" />
              Un seul réglage par famille de texte : tout le document suit aussitôt, sans retouche ligne à ligne.
            </p>
            {(Object.keys(NOMS_STYLES) as (keyof Styles)[]).map((nom) => (
              <ReglageJeton key={nom} nom={nom} jeton={reglages.styles[nom]} surChangement={(modif) => modifierStyle(nom, modif)} />
            ))}
            <button type="button" className="bouton bouton-discret w-full" onClick={() => surReglages({ styles: JSON.parse(JSON.stringify(STYLES_PAR_DEFAUT)) })}>
              <Sparkles className="size-4" aria-hidden="true" />
              Revenir aux styles d&apos;origine
            </button>
            {stylesEnPlus}
          </>
        )}

        {onglet === "sortie" && (
          <>
            <dl className="inspecteur-stats">
              <div>
                <dt>Mots</dt>
                <dd>{stats.mots.toLocaleString("fr-FR")}</dd>
              </div>
              <div>
                <dt>Signes</dt>
                <dd>{stats.signes.toLocaleString("fr-FR")}</dd>
              </div>
              <div>
                <dt>Pages</dt>
                <dd>{stats.pages}</dd>
              </div>
              <div>
                <dt>Lecture</dt>
                <dd>{stats.minutes} min</dd>
              </div>
            </dl>

            <button type="button" className="bouton bouton-principal w-full" onClick={() => surExport("pdf")}>
              <FileDown className="size-4" aria-hidden="true" />
              Imprimer ou enregistrer en PDF
            </button>
            <button type="button" className="bouton bouton-discret w-full" onClick={() => surExport("docx")} disabled={enCours !== ""}>
              <FileText className="size-4" aria-hidden="true" />
              {enCours === "docx" ? "Préparation…" : "Exporter en Word (.docx)"}
            </button>
            <button type="button" className="bouton bouton-discret w-full" onClick={() => surExport("md")}>
              <Hash className="size-4" aria-hidden="true" />
              Exporter en Markdown
            </button>
            <button type="button" className="bouton bouton-discret w-full" onClick={() => surExport("calame")} disabled={enCours !== ""}>
              <Download className="size-4" aria-hidden="true" />
              {enCours === "calame" ? "Préparation…" : "Sauvegarde complète (.calame)"}
            </button>
            <p className="inspecteur-aide">
              La sauvegarde complète contient le texte, la mise en page et les images : un fichier à garder ou à transmettre à quelqu&apos;un. Avec ton
              compte, tes documents te suivent déjà d&apos;un appareil à l&apos;autre.
            </p>
            {sortieEnPlus}
          </>
        )}
      </div>
    </aside>
  );
}
