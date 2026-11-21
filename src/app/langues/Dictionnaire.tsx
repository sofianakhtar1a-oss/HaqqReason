"use client";

import { BookMarked, Download, FileUp, Layers, Pencil, Play, Plus, Search, Volume2, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { elementDe, libelleOrigine, nouveauMot, versAnki, versCsv } from "@/lib/langues/dictionnaire";
import { estDue, type Maitrise, maitrise } from "@/lib/langues/srs";
import { exporterTout, importerTout } from "@/lib/langues/stockage";
import type { MotPerso, OrigineMot } from "@/lib/langues/types";
import { normaliser } from "@/lib/langues/verification";
import { parler, voixDisponible } from "@/lib/langues/voix";
import { BoutonSupprimer, telecharger } from "./communs";
import { ajouterMot, charger, modifierMot, supprimerMot, useDonnees } from "./donnees";
import type { Lancement } from "./Seance";
import { useTextes } from "@/lib/modules/textes-client";
import { Pastille } from "./Vocabulaire";

/*
 * Le dictionnaire personnel : les mots rangés depuis les vidéos, les PDF et les thèmes,
 * à chercher, corriger, exporter, et à réviser en séances sur mesure.
 */

type FiltreOrigine = "tous" | OrigineMot["type"];
type FiltreMaitrise = "tous" | "dus" | Maitrise;

const ORIGINES: { id: FiltreOrigine; nom: string }[] = [
  { id: "tous", nom: "Toutes origines" },
  { id: "video", nom: "Vidéos" },
  { id: "pdf", nom: "PDF" },
  { id: "histoire", nom: "Histoires" },
  { id: "theme", nom: "Thèmes" },
  { id: "manuel", nom: "À la main" },
];
const MAITRISES: { id: FiltreMaitrise; nom: string }[] = [
  { id: "tous", nom: "Tous" },
  { id: "dus", nom: "À revoir" },
  { id: "nouveau", nom: "Nouveaux" },
  { id: "en-cours", nom: "En cours" },
  { id: "appris", nom: "Appris" },
  { id: "maitrise", nom: "Maîtrisés" },
];
const NATURES = ["", "nom", "verbe", "adjectif", "adverbe", "expression", "préposition", "pronom", "conjonction", "déterminant"];

export function Dictionnaire({ lancer }: { lancer: (l: Lancement) => void }) {
  const { mots, cartes, pret } = useDonnees();
  const [recherche, setRecherche] = useState("");
  const [origine, setOrigine] = useState<FiltreOrigine>("tous");
  const [etat, setEtat] = useState<FiltreMaitrise>("tous");
  const [choisis, setChoisis] = useState<Set<string>>(new Set());
  const [edition, setEdition] = useState<MotPerso | "nouveau" | null>(null);
  const [menu, setMenu] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const fichier = useRef<HTMLInputElement>(null);
  const t = useTextes("langues");
  const [maintenant] = useState(() => Date.now());

  const filtres = useMemo(() => {
    const q = normaliser(recherche);
    return mots.filter((m) => {
      if (origine !== "tous" && m.origine.type !== origine) return false;
      const c = cartes.get(m.id);
      if (etat === "dus" && !estDue(c, maintenant)) return false;
      if (etat !== "tous" && etat !== "dus" && maitrise(c) !== etat) return false;
      return !q || normaliser(m.en).includes(q) || normaliser(m.fr).includes(q) || normaliser(m.phrase ?? "").includes(q);
    });
  }, [mots, recherche, origine, etat, cartes, maintenant]);

  const cible = choisis.size ? mots.filter((m) => choisis.has(m.id)) : filtres;
  const dus = mots.filter((m) => estDue(cartes.get(m.id), maintenant)).length;
  const reserve = mots.filter((m) => !m.passage).map(elementDe);

  const reviser = (mode: Lancement["mode"]) => {
    const liste = mode === "guidee" ? cible.filter((m) => !m.passage) : cible;
    lancer({ titre: choisis.size ? "Ma sélection" : "Mon dictionnaire", elements: liste.map(elementDe), reserve, mode, libre: choisis.size > 0 || etat !== "tous" || origine !== "tous" || Boolean(recherche) });
  };

  const basculer = (id: string) =>
    setChoisis((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const importer = async (f: File) => {
    try {
      const r = await importerTout(JSON.parse(await f.text()));
      await charger(true);
      setMessage(`Sauvegarde importée : ${r.mots} mots, ${r.cartes} cartes de révision.`);
    } catch (e) {
      setMessage(e instanceof SyntaxError ? "Ce fichier n'est pas une sauvegarde lisible." : e instanceof Error ? e.message : "L'import a échoué.");
    }
  };

  const date = new Date().toISOString().slice(0, 10);

  return (
    <section aria-labelledby="titre-dictionnaire">
      <div className="lg-section-tete">
        <div>
          <h2 id="titre-dictionnaire" className="lg-titre">
            {t("dico.titre")}
          </h2>
          <p className="lg-chapo">
            {mots.length ? `${mots.length} mot${mots.length > 1 ? "s" : ""} et passage${mots.length > 1 ? "s" : ""} rangés${dus ? `, dont ${dus} à revoir aujourd'hui` : ""}.` : "Les mots que tu ranges depuis les vidéos, les PDF et les thèmes arrivent ici."}
          </p>
        </div>
        <div className="lg-section-actions">
          <button type="button" className="bouton" onClick={() => setEdition("nouveau")}>
            <Plus className="size-4" aria-hidden="true" />
            Ajouter un mot
          </button>
          <div className="relative">
            <button type="button" className="bouton" aria-expanded={menu} onClick={() => setMenu((x) => !x)}>
              <Download className="size-4" aria-hidden="true" />
              Exporter
            </button>
            {menu && (
              <div className="lg-menu" role="menu">
                <button type="button" role="menuitem" disabled={!mots.length} onClick={() => (telecharger(`dictionnaire-${date}.csv`, versCsv(cible), "text/csv"), setMenu(false))}>
                  <strong>Tableur (CSV)</strong>
                  <small>{cible.length} mots, pour Excel ou LibreOffice</small>
                </button>
                <button type="button" role="menuitem" disabled={!mots.length} onClick={() => (telecharger(`dictionnaire-anki-${date}.txt`, versAnki(cible)), setMenu(false))}>
                  <strong>Anki</strong>
                  <small>Recto anglais, verso français</small>
                </button>
                <hr />
                <button type="button" role="menuitem" onClick={() => void exporterTout().then((s) => (telecharger(`truchement-sauvegarde-${date}.json`, JSON.stringify(s), "application/json"), setMenu(false)))}>
                  <strong>Sauvegarde complète</strong>
                  <small>Dictionnaire, progression, vidéos et lectures (sans les fichiers)</small>
                </button>
                <button type="button" role="menuitem" onClick={() => (fichier.current?.click(), setMenu(false))}>
                  <strong>
                    <FileUp className="inline size-4" aria-hidden="true" /> Importer une sauvegarde
                  </strong>
                  <small>Pour reprendre une sauvegarde gardée dans un fichier</small>
                </button>
              </div>
            )}
            <input ref={fichier} type="file" accept="application/json,.json" className="sr-only" tabIndex={-1} onChange={(e) => e.target.files?.[0] && void importer(e.target.files[0])} />
          </div>
        </div>
      </div>

      {message && (
        <p className="lg-message" role="status">
          {message}
          <button type="button" className="bouton-icone" aria-label="Fermer" onClick={() => setMessage(null)}>
            <X className="size-4" aria-hidden="true" />
          </button>
        </p>
      )}

      {edition && <Formulaire mot={edition === "nouveau" ? null : edition} onFermer={() => setEdition(null)} />}

      {mots.length > 0 && (
        <>
          <div className="lg-dico-barre">
            <label className="lg-recherche">
              <Search className="size-4" aria-hidden="true" />
              <input type="search" value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Chercher en anglais ou en français" aria-label="Chercher un mot" />
            </label>
            <select className="lg-select" value={origine} onChange={(e) => setOrigine(e.target.value as FiltreOrigine)} aria-label="Origine">
              {ORIGINES.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nom}
                </option>
              ))}
            </select>
            <select className="lg-select" value={etat} onChange={(e) => setEtat(e.target.value as FiltreMaitrise)} aria-label="Mémoire">
              {MAITRISES.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nom}
                </option>
              ))}
            </select>
          </div>

          <div className="lg-revision-perso">
            <p>
              {choisis.size ? (
                <>
                  <strong>{choisis.size}</strong> mot{choisis.size > 1 ? "s" : ""} choisi{choisis.size > 1 ? "s" : ""}
                  <button type="button" className="lg-lien" onClick={() => setChoisis(new Set())}>
                    Tout désélectionner
                  </button>
                </>
              ) : (
                <>
                  Réviser <strong>{filtres.length === mots.length ? "tout le dictionnaire" : `ces ${filtres.length} mots`}</strong>, ou coche les mots de ton choix.
                </>
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="bouton" disabled={!cible.length} onClick={() => reviser("cartes")}>
                <Layers className="size-4" aria-hidden="true" />
                Cartes
              </button>
              <button type="button" className="bouton bouton-principal" disabled={!cible.some((m) => !m.passage)} onClick={() => reviser("guidee")}>
                <Play className="size-4" fill="currentColor" aria-hidden="true" />
                Séance
              </button>
            </div>
          </div>
        </>
      )}

      {!pret ? (
        <p className="text-encre-douce">Chargement…</p>
      ) : mots.length === 0 ? (
        <div className="lg-vide">
          <BookMarked className="size-8" strokeWidth={1.3} aria-hidden="true" />
          <p>{t("dico.vide")}</p>
        </div>
      ) : filtres.length === 0 ? (
        <p className="lg-vide">Aucun mot ne correspond.</p>
      ) : (
        <ul className="lg-liste-mots">
          {filtres.map((m) => (
            <li key={m.id} className="lg-ligne-mot" data-choisi={choisis.has(m.id) || undefined}>
              <input type="checkbox" className="lg-case" checked={choisis.has(m.id)} onChange={() => basculer(m.id)} aria-label={`Choisir « ${m.en} »`} />
              <Pastille m={maitrise(cartes.get(m.id))} />
              <div className="min-w-0 flex-1">
                <p className="lg-ligne-en" lang="en" data-passage={m.passage || undefined}>
                  {m.en}
                  {m.nature && <span className="lg-ligne-api">{m.nature}</span>}
                </p>
                <p className="lg-ligne-fr">{m.fr || <span className="text-encre-douce">sans traduction</span>}</p>
                {m.phrase && !m.passage && (
                  <p className="lg-ligne-ex" lang="en">
                    {m.phrase}
                  </p>
                )}
                <p className="lg-ligne-origine">{libelleOrigine(m.origine)}</p>
              </div>
              {voixDisponible() && (
                <button type="button" className="bouton-icone" aria-label={`Écouter « ${m.en.slice(0, 40)} »`} onClick={() => void parler(m.en)}>
                  <Volume2 className="size-4" aria-hidden="true" />
                </button>
              )}
              <button type="button" className="bouton-icone" aria-label={`Modifier « ${m.en.slice(0, 40)} »`} onClick={() => setEdition(m)}>
                <Pencil className="size-4" aria-hidden="true" />
              </button>
              <BoutonSupprimer nom={m.en.slice(0, 40)} onSupprimer={() => supprimerMot(m.id)} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Formulaire({ mot, onFermer }: { mot: MotPerso | null; onFermer: () => void }) {
  const [v, setV] = useState({ en: mot?.en ?? "", fr: mot?.fr ?? "", nature: mot?.nature ?? "", phrase: mot?.phrase ?? "", phraseFr: mot?.phraseFr ?? "" });
  const champ = (k: keyof typeof v) => ({ value: v[k], onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setV((x) => ({ ...x, [k]: e.target.value })) });
  return (
    <form
      className="lg-formulaire"
      onSubmit={(e) => {
        e.preventDefault();
        if (!v.en.trim() || !v.fr.trim()) return;
        if (mot) modifierMot({ ...mot, en: v.en.trim(), fr: v.fr.trim(), nature: v.nature || undefined, phrase: v.phrase.trim() || undefined, phraseFr: v.phraseFr.trim() || undefined });
        else ajouterMot(nouveauMot(v, { type: "manuel", titre: "À la main" }));
        onFermer();
      }}
    >
      <p className="font-display text-lg font-bold">{mot ? "Modifier le mot" : "Ajouter un mot"}</p>
      <div className="lg-formulaire-grille">
        <label>
          <span>Anglais</span>
          <input lang="en" required autoFocus {...champ("en")} autoCapitalize="off" />
        </label>
        <label>
          <span>Français</span>
          <input required {...champ("fr")} />
        </label>
        <label>
          <span>Nature</span>
          <select {...champ("nature")}>
            {NATURES.map((n) => (
              <option key={n} value={n}>
                {n || "—"}
              </option>
            ))}
          </select>
        </label>
        <label className="lg-formulaire-large">
          <span>Phrase d&apos;exemple (anglais)</span>
          <input lang="en" {...champ("phrase")} />
        </label>
        <label className="lg-formulaire-large">
          <span>Sa traduction</span>
          <input {...champ("phraseFr")} />
        </label>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" className="bouton" onClick={onFermer}>
          Annuler
        </button>
        <button type="submit" className="bouton bouton-principal">
          {mot ? "Enregistrer" : "Ajouter"}
        </button>
      </div>
    </form>
  );
}
