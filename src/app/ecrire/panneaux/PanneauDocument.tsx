"use client";

import { Archive, ArchiveRestore, CalendarClock, Copy, FolderInput, Pin, PinOff, Plus, Tag, Target, Trash2 } from "lucide-react";
import { useState } from "react";
import { modifierPreferences, COULEURS_ETIQUETTES } from "@/lib/atelier/preferences";
import { extrasDe, STATUTS_DOCUMENT, type DocumentAtelier, type StatutDocument } from "@/lib/atelier/modele";
import { delaiEcheance, usePreferences } from "../crochets";
import { tousLesDossiers } from "../rangement";

type Props = {
  doc: DocumentAtelier;
  mots: number;
  /** Enregistre aussitôt des champs du document (hors texte). */
  surModifier: (modif: Partial<DocumentAtelier>) => void;
  surDupliquer: () => void;
  surCorbeille: () => void;
  documents: DocumentAtelier[];
};

/** L'onglet « Document » de l'inspecteur : propriétés, rangement, objectif, échéance. */
export function PanneauDocument({ doc, mots, surModifier, surDupliquer, surCorbeille, documents }: Props) {
  const prefs = usePreferences();
  const extras = extrasDe(doc);
  const [proprietes, setProprietes] = useState(extras.proprietes);
  const [nouvelle, setNouvelle] = useState("");
  const [couleur, setCouleur] = useState<string>(COULEURS_ETIQUETTES[1]);
  const [nouveauDossier, setNouveauDossier] = useState("");

  // Le document change (autre document, ou modifié ailleurs) : les champs suivent.
  const empreinte = `${doc.id}|${JSON.stringify(extras.proprietes)}`;
  const [empreinteVue, setEmpreinteVue] = useState(empreinte);
  if (empreinte !== empreinteVue) {
    setEmpreinteVue(empreinte);
    setProprietes(extras.proprietes);
  }

  const dossiers = tousLesDossiers(documents, prefs.dossiers);
  const progression = extras.objectifMots > 0 ? Math.min(1, mots / extras.objectifMots) : 0;
  const delai = extras.echeance ? delaiEcheance(extras.echeance) : null;

  const champ = (cle: "auteur" | "sujet" | "motsCles", libelle: string, aide: string) => (
    <label className="inspecteur-reglage">
      <span className="inspecteur-libelle">{libelle}</span>
      <input
        className="champ"
        value={proprietes[cle]}
        placeholder={aide}
        onChange={(e) => setProprietes((p) => ({ ...p, [cle]: e.target.value }))}
        onBlur={() => surModifier({ proprietes })}
      />
    </label>
  );

  return (
    <>
      <section className="calame-section">
        <h3 className="calame-section-titre">Propriétés</h3>
        <label className="inspecteur-reglage">
          <span className="inspecteur-libelle">Statut</span>
          <select
            className="champ"
            value={proprietes.statut}
            onChange={(e) => {
              const suite = { ...proprietes, statut: e.target.value as StatutDocument };
              setProprietes(suite);
              surModifier({ proprietes: suite });
            }}
          >
            {STATUTS_DOCUMENT.map((s) => (
              <option key={s.cle} value={s.cle}>
                {s.libelle}
              </option>
            ))}
          </select>
        </label>
        {champ("auteur", "Auteur", "Ton nom, tel qu'il apparaîtra")}
        {champ("sujet", "Sujet", "En une ligne")}
        {champ("motsCles", "Mots-clés", "Séparés par des virgules")}
        <p className="inspecteur-aide">Repris dans le fichier Word et dans le PDF téléchargé.</p>
      </section>

      <section className="calame-section">
        <h3 className="calame-section-titre">
          <FolderInput className="size-4" aria-hidden="true" /> Rangement
        </h3>
        <label className="inspecteur-reglage">
          <span className="inspecteur-libelle">Dossier</span>
          <select className="champ" value={doc.dossier} onChange={(e) => surModifier({ dossier: e.target.value })}>
            <option value="">Aucun (à la racine)</option>
            {dossiers.map((d) => (
              <option key={d} value={d}>
                {d.split("/").join(" › ")}
              </option>
            ))}
          </select>
        </label>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const nom = nouveauDossier.trim().replace(/\/+/g, "/").replace(/^\/|\/$/g, "");
            if (!nom) return;
            modifierPreferences((p) => ({ dossiers: [...p.dossiers, nom] }));
            surModifier({ dossier: nom });
            setNouveauDossier("");
          }}
        >
          <input className="champ flex-1" value={nouveauDossier} onChange={(e) => setNouveauDossier(e.target.value)} placeholder="Nouveau dossier (Cours/2026)" aria-label="Nom du nouveau dossier" />
          <button type="submit" className="bouton bouton-discret bouton-petit" disabled={!nouveauDossier.trim()}>
            <Plus className="size-4" aria-hidden="true" />
            <span className="sr-only">Créer le dossier</span>
          </button>
        </form>

        <div className="inspecteur-reglage">
          <span className="inspecteur-libelle">
            <span className="inline-flex items-center gap-1">
              <Tag className="size-4" aria-hidden="true" /> Étiquettes
            </span>
          </span>
          <div className="calame-etiquettes" role="group" aria-label="Étiquettes du document">
            {prefs.etiquettes.map((e) => {
              const active = extras.etiquettes.includes(e.nom);
              return (
                <button
                  key={e.nom}
                  type="button"
                  className="calame-etiquette"
                  aria-pressed={active}
                  style={{ "--etiquette": e.couleur } as React.CSSProperties}
                  onClick={() => surModifier({ etiquettes: active ? extras.etiquettes.filter((x) => x !== e.nom) : [...extras.etiquettes, e.nom] })}
                >
                  {e.nom}
                </button>
              );
            })}
            {prefs.etiquettes.length === 0 && <span className="text-sm text-encre-douce">Aucune étiquette pour l&apos;instant.</span>}
          </div>
          <form
            className="calame-ligne-ajout"
            onSubmit={(e) => {
              e.preventDefault();
              const nom = nouvelle.trim().slice(0, 40);
              if (!nom) return;
              if (!prefs.etiquettes.some((x) => x.nom === nom)) modifierPreferences((p) => ({ etiquettes: [...p.etiquettes, { nom, couleur }] }));
              if (!extras.etiquettes.includes(nom)) surModifier({ etiquettes: [...extras.etiquettes, nom] });
              setNouvelle("");
            }}
          >
            <input className="champ" value={nouvelle} onChange={(e) => setNouvelle(e.target.value)} placeholder="Nouvelle étiquette" aria-label="Nom de la nouvelle étiquette" />
            <select className="champ" value={couleur} onChange={(e) => setCouleur(e.target.value)} aria-label="Couleur de l'étiquette" style={{ color: couleur }}>
              {COULEURS_ETIQUETTES.map((c) => (
                <option key={c} value={c} style={{ color: c }}>
                  ●
                </option>
              ))}
            </select>
            <button type="submit" className="bouton bouton-discret bouton-petit" disabled={!nouvelle.trim()}>
              <Plus className="size-4" aria-hidden="true" />
              <span className="sr-only">Ajouter l&apos;étiquette</span>
            </button>
          </form>
        </div>
      </section>

      <section className="calame-section">
        <h3 className="calame-section-titre">
          <Target className="size-4" aria-hidden="true" /> Objectif et échéance
        </h3>
        <label className="inspecteur-reglage">
          <span className="inspecteur-libelle">Mots visés pour ce document</span>
          <input
            type="number"
            min={0}
            step={500}
            className="champ"
            value={extras.objectifMots || ""}
            placeholder="Aucun objectif"
            onChange={(e) => surModifier({ objectifMots: Math.max(0, Number(e.target.value) || 0) })}
          />
        </label>
        {extras.objectifMots > 0 && (
          <div className="calame-progression" role="progressbar" aria-valuemin={0} aria-valuemax={extras.objectifMots} aria-valuenow={mots} aria-label="Avancement vers l'objectif">
            <span style={{ width: `${progression * 100}%` }} />
            <p>
              {mots.toLocaleString("fr-FR")} / {extras.objectifMots.toLocaleString("fr-FR")} mots · {Math.round(progression * 100)} %
            </p>
          </div>
        )}
        <label className="inspecteur-reglage">
          <span className="inspecteur-libelle">
            <CalendarClock className="size-4" aria-hidden="true" /> Échéance
          </span>
          <input type="date" className="champ" value={extras.echeance ?? ""} onChange={(e) => surModifier({ echeance: e.target.value || null })} />
        </label>
        {delai && <p className="inspecteur-aide" data-alerte={delai.jours < 0 ? "" : undefined}>Échéance {delai.texte}.</p>}
      </section>

      <section className="calame-section calame-actions">
        <button type="button" className="bouton bouton-discret w-full" onClick={() => surModifier({ epingle: !extras.epingle })}>
          {extras.epingle ? <PinOff className="size-4" aria-hidden="true" /> : <Pin className="size-4" aria-hidden="true" />}
          {extras.epingle ? "Ne plus épingler" : "Épingler en haut de la liste"}
        </button>
        <button type="button" className="bouton bouton-discret w-full" onClick={() => surModifier({ archive: !extras.archive })}>
          {extras.archive ? <ArchiveRestore className="size-4" aria-hidden="true" /> : <Archive className="size-4" aria-hidden="true" />}
          {extras.archive ? "Sortir des archives" : "Archiver (terminé)"}
        </button>
        <button type="button" className="bouton bouton-discret w-full" onClick={surDupliquer}>
          <Copy className="size-4" aria-hidden="true" />
          Dupliquer
        </button>
        <button type="button" className="bouton bouton-discret w-full" onClick={surCorbeille}>
          <Trash2 className="size-4" aria-hidden="true" />
          Mettre à la corbeille
        </button>
      </section>
    </>
  );
}
