"use client";

import type { Editor } from "@tiptap/core";
import { useEffect, useMemo, useState } from "react";
import { Archive, ArchiveRestore, ArrowDown, ArrowLeft, ArrowRight, ArrowUp, CheckSquare, ChevronDown, ChevronRight, Columns2, Copy, FilePlus2, FileText, Folder, FolderOpen, FolderPlus, GripVertical, LayoutGrid, ListTree, LockKeyhole, MoreHorizontal, Pin, RotateCcw, Search, Trash2, Upload } from "lucide-react";
import { extrasDe, STATUTS_DOCUMENT, type DocumentAtelier } from "@/lib/atelier/modele";
import { pagesEstimees } from "@/lib/atelier/pagination";
import { modifierPreferences, TRIS, type Tri } from "@/lib/atelier/preferences";
import { extraits } from "@/lib/atelier/recherche-texte";
import { useTextes } from "@/lib/modules/textes-client";
import { useEtatsDocuments } from "./etats-synchro";
import { estOuvert } from "./verrou";
import { delaiEcheance, usePreferences, useRevision } from "./crochets";
import { arbreDossiers, compte, documentsDeLaVue, tousLesDossiers, trierDocuments, type NoeudDossier, type Vue } from "./rangement";
import { allerAuTitre, changerNiveau, deplacerPartie, planDuDocument } from "./plan";
import { basculerRepli, replisActuels } from "./extensions/replis";
import { Miniatures, type ApercuPage } from "./Miniatures";

export type ActionsDocuments = {
  surOuvrir: (id: string, requete?: string) => void;
  surNouveau: () => void;
  surImporter: (fichier: File) => void;
  surModifier: (id: string, modif: Partial<DocumentAtelier>) => void;
  surDupliquer: (id: string) => void;
  surCorbeille: (id: string, dedans: boolean) => void;
  surSupprimerDefinitivement: (id: string) => void;
  surOuvrirACote: (id: string) => void;
};

type Props = ActionsDocuments & {
  documents: DocumentAtelier[];
  actif: string;
  editor: Editor | null;
  pages: ApercuPage[];
  pageCourante: number;
  surAllerPage: (numero: number) => void;
  surModeles?: () => void;
};

function quand(iso: string): string {
  const date = new Date(iso);
  const jours = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (jours === 0) return `aujourd'hui, ${date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
  if (jours === 1) return "hier";
  if (jours < 30) return `il y a ${jours} jours`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export function BarreLaterale(props: Props) {
  const { documents, editor, pages, pageCourante, surAllerPage } = props;
  const [vue, setVue] = useState<"documents" | "plan" | "pages">("documents");
  const t = useTextes("calame");

  return (
    <aside className="calame-cote" aria-label="Documents et plan">
      <div className="calame-onglets" role="tablist">
        <button type="button" role="tab" aria-selected={vue === "documents"} className="calame-onglet" onClick={() => setVue("documents")}>
          <FileText className="size-4" aria-hidden="true" />
          {t("onglet.documents")}
          <span className="text-sm text-encre-douce">{documentsDeLaVue(documents, "documents").length}</span>
        </button>
        <button type="button" role="tab" aria-selected={vue === "plan"} className="calame-onglet" onClick={() => setVue("plan")}>
          <ListTree className="size-4" aria-hidden="true" />
          {t("onglet.plan")}
        </button>
        <button type="button" role="tab" aria-selected={vue === "pages"} className="calame-onglet" onClick={() => setVue("pages")} title="Miniatures des pages">
          <LayoutGrid className="size-4" aria-hidden="true" />
          Pages
        </button>
      </div>
      {vue === "documents" && <ListeDocuments {...props} />}
      {vue === "plan" && <PlanModifiable editor={editor} />}
      {vue === "pages" && (
        <div className="calame-cote-corps">
          <Miniatures pages={pages} courante={pageCourante} surAller={surAllerPage} />
        </div>
      )}
    </aside>
  );
}

/* ---------------------------------------------------------------- documents */

function ListeDocuments({ documents, actif, surOuvrir, surNouveau, surImporter, surModifier, surDupliquer, surCorbeille, surSupprimerDefinitivement, surOuvrirACote, surModeles }: Props) {
  const t = useTextes("calame");
  const prefs = usePreferences();
  const [vue, setVue] = useState<Vue>("documents");
  const [recherche, setRecherche] = useState("");
  const [dansLeTexte, setDansLeTexte] = useState(false);
  const [filtres, setFiltres] = useState<string[]>([]);
  const [selection, setSelection] = useState<string[] | null>(null);
  const [menu, setMenu] = useState<string | null>(null);
  const [aSupprimer, setASupprimer] = useState<string | null>(null);
  const [nouveauDossier, setNouveauDossier] = useState<string | null>(null);
  const [survol, setSurvol] = useState<string | null>(null);
  const etatsSynchro = useEtatsDocuments();

  const dossiers = tousLesDossiers(documents, prefs.dossiers);
  const visibles = useMemo(() => {
    let liste = documentsDeLaVue(documents, vue);
    if (filtres.length > 0) liste = liste.filter((d) => filtres.every((f) => extrasDe(d).etiquettes.includes(f)));
    const q = recherche.trim().toLowerCase();
    if (q && !dansLeTexte) liste = liste.filter((d) => d.titre.toLowerCase().includes(q));
    return trierDocuments(liste, prefs.tri);
  }, [documents, vue, filtres, recherche, dansLeTexte, prefs.tri]);

  const resultatsTexte = useMemo(() => {
    const q = recherche.trim();
    if (!dansLeTexte || q.length < 2) return null;
    return documentsDeLaVue(documents, vue)
      // Le texte d'un document verrouillé n'apparaît pas dans la recherche tant qu'il n'est pas ouvert.
      .filter((d) => !extrasDe(d).verrou || estOuvert(d.id))
      .map((d) => ({ doc: d, ...extraits(d.contenu, q) }))
      .filter((r) => r.total > 0 || r.doc.titre.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => b.total - a.total)
      .slice(0, 60);
  }, [documents, vue, recherche, dansLeTexte]);

  const arbre = useMemo(() => arbreDossiers(visibles, vue === "documents" ? dossiers : []), [visibles, dossiers, vue]);
  const nb = (v: Vue) => documentsDeLaVue(documents, v).length;
  const couleurDe = (nom: string) => prefs.etiquettes.find((e) => e.nom === nom)?.couleur ?? "#64748b";

  const basculerSelection = (id: string) => setSelection((s) => (s ? (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]) : [id]));

  const ligneDocument = (d: DocumentAtelier) => {
    const x = extrasDe(d);
    const statut = STATUTS_DOCUMENT.find((s) => s.cle === x.proprietes.statut);
    const delai = x.echeance ? delaiEcheance(x.echeance) : null;
    const choisi = selection?.includes(d.id) ?? false;
    return (
      <li key={d.id} draggable={vue === "documents" && !selection} onDragStart={(e) => e.dataTransfer.setData("application/x-calame-document", d.id)}>
        {selection && (
          <input type="checkbox" className="calame-document-case" checked={choisi} onChange={() => basculerSelection(d.id)} aria-label={`Choisir ${d.titre || t("sansTitre")}`} />
        )}
        <button type="button" className="calame-document" aria-current={d.id === actif} onClick={() => (selection ? basculerSelection(d.id) : vue === "corbeille" ? setMenu(d.id) : surOuvrir(d.id))}>
          <span className="calame-document-titre">
            {x.epingle && <Pin className="calame-epingle" aria-label="Épinglé" />}
            {x.verrou && <LockKeyhole className="calame-epingle" aria-label="Verrouillé par un code" />}
            {d.titre || t("sansTitre")}
            {etatsSynchro.get(d.id) && etatsSynchro.get(d.id) !== "compte" && (
              <span
                className="calame-document-synchro"
                data-etat={etatsSynchro.get(d.id)}
                title={etatsSynchro.get(d.id) === "attente" ? "En attente d'envoi sur ton compte" : "Seulement sur cet appareil (trop lourd pour le compte, ou place pleine)"}
                aria-label={etatsSynchro.get(d.id) === "attente" ? "En attente d'envoi" : "Seulement sur cet appareil"}
              />
            )}
          </span>
          <span className="calame-document-detail">
            {vue === "corbeille" && x.corbeille ? `supprimé ${quand(x.corbeille)}` : quand(d.modifie)} · {d.mots.toLocaleString("fr-FR")} mots · {pagesEstimees(d.mots)} p.
          </span>
          {(x.etiquettes.length > 0 || x.proprietes.statut !== "brouillon" || delai) && (
            <span className="calame-document-marques">
              {x.etiquettes.map((e) => (
                <span key={e} className="calame-pastille" style={{ "--etiquette": couleurDe(e) } as React.CSSProperties}>
                  {e}
                </span>
              ))}
              {x.proprietes.statut !== "brouillon" && <span className="calame-pastille calame-pastille-statut">{statut?.libelle}</span>}
              {delai && (
                <span className="calame-pastille" data-alerte={delai.jours < 0 ? "" : undefined}>
                  échéance {delai.texte}
                </span>
              )}
            </span>
          )}
        </button>
        {!selection && (
          <button type="button" className="calame-document-poubelle" onClick={() => setMenu(menu === d.id ? null : d.id)} aria-expanded={menu === d.id} title="Actions">
            <MoreHorizontal className="size-4" aria-hidden="true" />
            <span className="sr-only">Actions pour {d.titre}</span>
          </button>
        )}
        {menu === d.id && (
          <div className="calame-document-menu" role="menu">
            {vue === "corbeille" ? (
              <>
                <button type="button" role="menuitem" onClick={() => { surCorbeille(d.id, false); setMenu(null); }}>
                  <RotateCcw className="size-4" aria-hidden="true" /> Restaurer
                </button>
                {aSupprimer === d.id ? (
                  <span className="calame-document-confirme">
                    Effacer pour de bon ?
                    <button type="button" className="bouton bouton-danger bouton-petit" onClick={() => { surSupprimerDefinitivement(d.id); setASupprimer(null); setMenu(null); }}>
                      Oui
                    </button>
                    <button type="button" className="bouton bouton-discret bouton-petit" onClick={() => setASupprimer(null)}>
                      Non
                    </button>
                  </span>
                ) : (
                  <button type="button" role="menuitem" onClick={() => setASupprimer(d.id)}>
                    <Trash2 className="size-4" aria-hidden="true" /> Supprimer définitivement
                  </button>
                )}
              </>
            ) : (
              <>
                <button type="button" role="menuitem" onClick={() => { surOuvrirACote(d.id); setMenu(null); }}>
                  <Columns2 className="size-4" aria-hidden="true" /> Ouvrir à côté
                </button>
                <button type="button" role="menuitem" onClick={() => { surDupliquer(d.id); setMenu(null); }}>
                  <Copy className="size-4" aria-hidden="true" /> Dupliquer
                </button>
                <button type="button" role="menuitem" onClick={() => { surModifier(d.id, { epingle: !x.epingle }); setMenu(null); }}>
                  <Pin className="size-4" aria-hidden="true" /> {x.epingle ? "Ne plus épingler" : "Épingler"}
                </button>
                <label className="calame-document-menu-ligne">
                  <Folder className="size-4" aria-hidden="true" />
                  <select value={d.dossier} onChange={(e) => { surModifier(d.id, { dossier: e.target.value }); setMenu(null); }} aria-label="Déplacer vers un dossier">
                    <option value="">Déplacer… (racine)</option>
                    {dossiers.map((f) => (
                      <option key={f} value={f}>
                        {f.split("/").join(" › ")}
                      </option>
                    ))}
                  </select>
                </label>
                <button type="button" role="menuitem" onClick={() => { surModifier(d.id, { archive: !x.archive }); setMenu(null); }}>
                  {x.archive ? <ArchiveRestore className="size-4" aria-hidden="true" /> : <Archive className="size-4" aria-hidden="true" />} {x.archive ? "Sortir des archives" : "Archiver"}
                </button>
                <button type="button" role="menuitem" onClick={() => { surCorbeille(d.id, true); setMenu(null); }}>
                  <Trash2 className="size-4" aria-hidden="true" /> Mettre à la corbeille
                </button>
              </>
            )}
          </div>
        )}
      </li>
    );
  };

  const dossierUI = (n: NoeudDossier, profondeur: number): React.ReactNode => {
    const replie = prefs.dossiersReplies.includes(n.chemin);
    return (
      <li key={`dossier-${n.chemin}`} className="calame-dossier" data-survol={survol === n.chemin ? "" : undefined}>
        <button
          type="button"
          className="calame-dossier-tete"
          style={{ paddingInlineStart: `${0.4 + profondeur * 0.85}rem` }}
          aria-expanded={!replie}
          onClick={() => modifierPreferences((p) => ({ dossiersReplies: replie ? p.dossiersReplies.filter((x) => x !== n.chemin) : [...p.dossiersReplies, n.chemin] }))}
          onDragOver={(e) => {
            if (e.dataTransfer.types.includes("application/x-calame-document")) {
              e.preventDefault();
              setSurvol(n.chemin);
            }
          }}
          onDragLeave={() => setSurvol(null)}
          onDrop={(e) => {
            const id = e.dataTransfer.getData("application/x-calame-document");
            setSurvol(null);
            if (id) surModifier(id, { dossier: n.chemin });
          }}
        >
          {replie ? <ChevronRight className="size-4" aria-hidden="true" /> : <ChevronDown className="size-4" aria-hidden="true" />}
          {replie ? <Folder className="size-4" aria-hidden="true" /> : <FolderOpen className="size-4" aria-hidden="true" />}
          <span className="flex-1 truncate text-left">{n.nom}</span>
          <span className="text-sm text-encre-douce">{compte(n)}</span>
        </button>
        {!replie && (
          <ul className="calame-documents" style={{ paddingInlineStart: `${profondeur * 0.85}rem` }}>
            {n.enfants.map((e) => dossierUI(e, profondeur + 1))}
            {n.documents.map(ligneDocument)}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div className="calame-cote-corps">
      <div className="flex gap-2">
        <button type="button" className="bouton bouton-principal bouton-petit flex-1" onClick={surNouveau}>
          <FilePlus2 className="size-4" aria-hidden="true" />
          {t("nouveau")}
        </button>
        {surModeles && (
          <button type="button" className="bouton bouton-discret bouton-petit" onClick={surModeles} title="Partir d'un modèle">
            <LayoutGrid className="size-4" aria-hidden="true" />
            <span className="sr-only">Nouveau document à partir d&apos;un modèle</span>
          </button>
        )}
        <label className="bouton bouton-discret bouton-petit cursor-pointer" title="Ouvrir un fichier (.calame, Word, Markdown, texte, HTML)">
          <Upload className="size-4" aria-hidden="true" />
          <span className="sr-only">Importer un document</span>
          <input
            type="file"
            accept=".calame,application/gzip,.docx,.md,.markdown,.txt,.html,.htm"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) surImporter(f);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      <label className="contrib-recherche">
        <Search className="size-4 shrink-0 text-encre-douce" aria-hidden="true" />
        <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder={dansLeTexte ? "Chercher dans le texte…" : t("recherche")} aria-label="Chercher un document" className="w-full bg-transparent outline-none" />
      </label>
      <div className="calame-choix-recherche" role="group" aria-label="Où chercher">
        <button type="button" className="puce-module" aria-pressed={!dansLeTexte} onClick={() => setDansLeTexte(false)}>
          Titres
        </button>
        <button type="button" className="puce-module" aria-pressed={dansLeTexte} onClick={() => setDansLeTexte(true)}>
          Tout le texte
        </button>
      </div>

      <div className="calame-vues" role="tablist" aria-label="Quels documents">
        {(
          [
            ["documents", "En cours"],
            ["archives", "Archives"],
            ["corbeille", "Corbeille"],
          ] as const
        ).map(([cle, libelle]) => (
          <button key={cle} type="button" role="tab" aria-selected={vue === cle} onClick={() => { setVue(cle); setSelection(null); setMenu(null); }}>
            {libelle} <span>{nb(cle)}</span>
          </button>
        ))}
      </div>

      <div className="calame-outils-liste">
        <select className="champ" value={prefs.tri} onChange={(e) => modifierPreferences({ tri: e.target.value as Tri })} aria-label="Trier la liste">
          {TRIS.map((x) => (
            <option key={x.cle} value={x.cle}>
              {x.libelle}
            </option>
          ))}
        </select>
        <button type="button" className="calame-icone" aria-pressed={selection !== null} onClick={() => setSelection((s) => (s ? null : []))} title="Choisir plusieurs documents">
          <CheckSquare className="size-4" aria-hidden="true" />
          <span className="sr-only">Sélection multiple</span>
        </button>
        {vue === "documents" && (
          <button type="button" className="calame-icone" onClick={() => setNouveauDossier("")} title="Nouveau dossier">
            <FolderPlus className="size-4" aria-hidden="true" />
            <span className="sr-only">Nouveau dossier</span>
          </button>
        )}
      </div>

      {nouveauDossier !== null && (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const nom = nouveauDossier.trim().replace(/\/+/g, "/").replace(/^\/|\/$/g, "");
            if (nom) modifierPreferences((p) => ({ dossiers: [...p.dossiers, nom] }));
            setNouveauDossier(null);
          }}
        >
          <input className="champ flex-1" autoFocus value={nouveauDossier} onChange={(e) => setNouveauDossier(e.target.value)} placeholder="Nom (Cours/2026 pour un sous-dossier)" aria-label="Nom du dossier" onKeyDown={(e) => e.key === "Escape" && setNouveauDossier(null)} />
          <button type="submit" className="bouton bouton-discret bouton-petit">
            Créer
          </button>
        </form>
      )}

      {prefs.etiquettes.length > 0 && (
        <div className="calame-etiquettes" role="group" aria-label="Filtrer par étiquette">
          {prefs.etiquettes.map((e) => (
            <button key={e.nom} type="button" className="calame-etiquette" aria-pressed={filtres.includes(e.nom)} style={{ "--etiquette": e.couleur } as React.CSSProperties} onClick={() => setFiltres((f) => (f.includes(e.nom) ? f.filter((x) => x !== e.nom) : [...f, e.nom]))}>
              {e.nom}
            </button>
          ))}
        </div>
      )}

      {selection && (
        <ActionsSelection
          selection={selection}
          vue={vue}
          dossiers={dossiers}
          etiquettes={prefs.etiquettes.map((e) => e.nom)}
          documents={documents}
          tout={() => setSelection(visibles.map((d) => d.id))}
          surModifier={surModifier}
          surCorbeille={surCorbeille}
          surSupprimerDefinitivement={surSupprimerDefinitivement}
          fini={() => setSelection(null)}
        />
      )}

      {resultatsTexte ? (
        <ul className="calame-documents calame-resultats">
          {resultatsTexte.map(({ doc, total, extraits: e }) => (
            <li key={doc.id}>
              <button type="button" className="calame-document" aria-current={doc.id === actif} onClick={() => surOuvrir(doc.id, recherche.trim())}>
                <span className="calame-document-titre">{doc.titre || t("sansTitre")}</span>
                <span className="calame-document-detail">
                  {total} passage{total > 1 ? "s" : ""}
                </span>
                {e.map((x, i) => (
                  <span key={i} className="calame-extrait">
                    {x.avant}
                    <mark>{x.trouve}</mark>
                    {x.apres}
                  </span>
                ))}
              </button>
            </li>
          ))}
          {resultatsTexte.length === 0 && <li className="calame-vide">Aucun document ne contient ce texte.</li>}
        </ul>
      ) : (
        <ul className="calame-documents">
          {vue === "documents" ? (
            <>
              {arbre.enfants.map((n) => dossierUI(n, 0))}
              {arbre.documents.map(ligneDocument)}
            </>
          ) : (
            visibles.map(ligneDocument)
          )}
          {visibles.length === 0 && (
            <li className="calame-vide">{vue === "corbeille" ? "La corbeille est vide. Un document y reste 30 jours." : vue === "archives" ? "Aucun document archivé." : t("recherche.vide")}</li>
          )}
        </ul>
      )}
    </div>
  );
}

function ActionsSelection({
  selection,
  vue,
  dossiers,
  etiquettes,
  documents,
  tout,
  surModifier,
  surCorbeille,
  surSupprimerDefinitivement,
  fini,
}: {
  selection: string[];
  vue: Vue;
  dossiers: string[];
  etiquettes: string[];
  documents: DocumentAtelier[];
  tout: () => void;
  surModifier: (id: string, modif: Partial<DocumentAtelier>) => void;
  surCorbeille: (id: string, dedans: boolean) => void;
  surSupprimerDefinitivement: (id: string) => void;
  fini: () => void;
}) {
  const [confirmer, setConfirmer] = useState(false);
  const n = selection.length;
  return (
    <div className="calame-selection" role="toolbar" aria-label="Actions sur la sélection">
      <p>
        {n} document{n > 1 ? "s" : ""} choisi{n > 1 ? "s" : ""} ·{" "}
        <button type="button" className="lien" onClick={tout}>
          tout choisir
        </button>
      </p>
      {vue === "corbeille" ? (
        <div className="flex flex-wrap gap-2">
          <button type="button" className="bouton bouton-discret bouton-petit" disabled={n === 0} onClick={() => { selection.forEach((id) => surCorbeille(id, false)); fini(); }}>
            Restaurer
          </button>
          {confirmer ? (
            <button type="button" className="bouton bouton-danger bouton-petit" onClick={() => { selection.forEach(surSupprimerDefinitivement); fini(); }}>
              Effacer pour de bon ({n})
            </button>
          ) : (
            <button type="button" className="bouton bouton-discret bouton-petit" disabled={n === 0} onClick={() => setConfirmer(true)}>
              Supprimer définitivement
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <select className="champ w-auto" defaultValue="" disabled={n === 0} onChange={(e) => { if (e.target.value === "__") return; selection.forEach((id) => surModifier(id, { dossier: e.target.value })); fini(); }} aria-label="Déplacer la sélection">
            <option value="__">Déplacer…</option>
            <option value="">Racine</option>
            {dossiers.map((d) => (
              <option key={d} value={d}>
                {d.split("/").join(" › ")}
              </option>
            ))}
          </select>
          {etiquettes.length > 0 && (
            <select
              className="champ w-auto"
              defaultValue=""
              disabled={n === 0}
              onChange={(e) => {
                const nom = e.target.value;
                if (!nom) return;
                for (const id of selection) {
                  const doc = documents.find((d) => d.id === id);
                  const actuelles = doc ? extrasDe(doc).etiquettes : [];
                  if (!actuelles.includes(nom)) surModifier(id, { etiquettes: [...actuelles, nom] });
                }
                fini();
              }}
              aria-label="Ajouter une étiquette"
            >
              <option value="">Étiquette…</option>
              {etiquettes.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          )}
          <button type="button" className="bouton bouton-discret bouton-petit" disabled={n === 0} onClick={() => { selection.forEach((id) => surModifier(id, { archive: vue !== "archives" })); fini(); }}>
            {vue === "archives" ? "Sortir des archives" : "Archiver"}
          </button>
          <button type="button" className="bouton bouton-discret bouton-petit" disabled={n === 0} onClick={() => { selection.forEach((id) => surCorbeille(id, true)); fini(); }}>
            Corbeille
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- plan */

function PlanModifiable({ editor }: { editor: Editor | null }) {
  const t = useTextes("calame");
  const revision = useRevision(editor);
  const [glisse, setGlisse] = useState<number | null>(null);
  const [cible, setCible] = useState<number | null>(null);
  const [plan, setPlan] = useState(() => (editor ? planDuDocument(editor.state.doc) : []));

  // Le plan suit la frappe, sans la ralentir.
  useEffect(() => {
    if (!editor) return;
    const minuteur = setTimeout(() => setPlan(planDuDocument(editor.state.doc)), 250);
    return () => clearTimeout(minuteur);
  }, [editor, revision]);

  if (!editor) return null;
  if (plan.length === 0) return <p className="calame-vide">{t("plan.vide")}</p>;
  const replis = replisActuels(editor);

  return (
    <div className="calame-cote-corps">
      <ol className="calame-plan calame-plan-vivant">
        {plan.map((entree, i) => (
          <li
            key={`${entree.pos}-${i}`}
            data-niveau={entree.niveau}
            data-cible={cible === entree.pos ? "" : undefined}
            draggable
            onDragStart={(e) => {
              setGlisse(entree.pos);
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("text/plain", entree.texte);
            }}
            onDragOver={(e) => {
              if (glisse === null) return;
              e.preventDefault();
              setCible(entree.pos);
            }}
            onDragEnd={() => {
              setGlisse(null);
              setCible(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (glisse !== null && glisse !== entree.pos) deplacerPartie(editor, glisse, entree.pos);
              setGlisse(null);
              setCible(null);
            }}
          >
            <GripVertical className="calame-poignee" aria-hidden="true" />
            <button type="button" className="calame-plan-titre" onClick={() => allerAuTitre(editor, entree.pos)}>
              {entree.texte || t("sansTitre")}
              <span className="calame-plan-mots">{entree.mots.toLocaleString("fr-FR")} mots</span>
            </button>
            <span className="calame-plan-actions">
              <button type="button" title="Replier ou déplier dans le texte" aria-pressed={replis.includes(entree.pos)} onClick={() => basculerRepli(editor, entree.pos)}>
                {replis.includes(entree.pos) ? <ChevronRight className="size-4" aria-hidden="true" /> : <ChevronDown className="size-4" aria-hidden="true" />}
                <span className="sr-only">Replier</span>
              </button>
              <button type="button" title="Monter la partie" disabled={i === 0} onClick={() => { const avant = [...plan.slice(0, i)].reverse().find((x) => x.niveau <= entree.niveau); if (avant) deplacerPartie(editor, entree.pos, avant.pos); }}>
                <ArrowUp className="size-4" aria-hidden="true" />
                <span className="sr-only">Monter</span>
              </button>
              <button
                type="button"
                title="Descendre la partie"
                onClick={() => {
                  const suivante = plan.slice(i + 1).find((x) => x.pos >= entree.fin && x.niveau <= entree.niveau);
                  if (!suivante) return;
                  deplacerPartie(editor, entree.pos, suivante.fin >= editor.state.doc.content.size ? null : suivante.fin);
                }}
              >
                <ArrowDown className="size-4" aria-hidden="true" />
                <span className="sr-only">Descendre</span>
              </button>
              <button type="button" title="Titre plus important (niveau au-dessus)" disabled={entree.niveau <= 2} onClick={() => changerNiveau(editor, entree.pos, -1)}>
                <ArrowLeft className="size-4" aria-hidden="true" />
                <span className="sr-only">Niveau au-dessus</span>
              </button>
              <button type="button" title="Titre moins important (niveau au-dessous)" disabled={entree.niveau >= 4} onClick={() => changerNiveau(editor, entree.pos, 1)}>
                <ArrowRight className="size-4" aria-hidden="true" />
                <span className="sr-only">Niveau au-dessous</span>
              </button>
            </span>
          </li>
        ))}
      </ol>
      <p className="inspecteur-aide">Glisse un titre pour déplacer toute sa partie ; les flèches montent, descendent ou changent son niveau.</p>
    </div>
  );
}
