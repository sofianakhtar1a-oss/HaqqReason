"use client";

import type { Editor } from "@tiptap/core";
import { Bookmark, Eye, GitCompareArrows, History, RotateCcw, Save } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { blocsDeTexte } from "@/lib/atelier/recherche-texte";
import { bilanDiff, comparerParagraphes } from "@/lib/atelier/diff";
import { listerVersions, nommerVersion } from "@/lib/atelier/depot";
import type { ReglagesPage, VersionAtelier } from "@/lib/atelier/modele";
import { Fenetre } from "../Fenetre";
import { VueLecture } from "../VueLecture";

type Props = {
  editor: Editor;
  documentId: string;
  reglages: ReglagesPage;
  /** Enregistre maintenant une version, avec un nom facultatif. */
  surVersion: (nom?: string) => Promise<void>;
  /** Remet le texte d'une version (l'état actuel est gardé comme version avant). */
  surRestaurer: (v: VersionAtelier) => Promise<void>;
};

function quand(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

/** L'onglet « Versions » : l'historique daté du document, à regarder, comparer, nommer et restaurer. */
export function PanneauVersions({ editor, documentId, reglages, surVersion, surRestaurer }: Props) {
  const [versions, setVersions] = useState<VersionAtelier[] | null>(null);
  const [nom, setNom] = useState("");
  const [apercu, setApercu] = useState<VersionAtelier | null>(null);
  const [comparee, setComparee] = useState<VersionAtelier | null>(null);
  const [aRestaurer, setARestaurer] = useState<VersionAtelier | null>(null);
  const [renommage, setRenommage] = useState<{ id: string; nom: string } | null>(null);

  const [revision, setRevision] = useState(0);
  const recharger = useCallback(async () => setRevision((r) => r + 1), []);
  useEffect(() => {
    let vivant = true;
    listerVersions(documentId).then((v) => {
      if (vivant) setVersions(v);
    });
    return () => {
      vivant = false;
    };
  }, [documentId, revision]);

  const comparaison = useMemo(() => {
    if (!comparee) return null;
    const paragraphes = comparerParagraphes(blocsDeTexte(comparee.contenu), blocsDeTexte(editor.getJSON()));
    return { paragraphes, bilan: bilanDiff(paragraphes) };
  }, [comparee, editor]);

  return (
    <>
      <section className="calame-section">
        <h3 className="calame-section-titre">
          <History className="size-4" aria-hidden="true" /> Garder une version
        </h3>
        <form
          className="flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            await surVersion(nom.trim() || undefined);
            setNom("");
            await recharger();
          }}
        >
          <input className="champ flex-1" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom facultatif : « Envoyée au jury »" aria-label="Nom de la version" maxLength={80} />
          <button type="submit" className="bouton bouton-principal bouton-petit">
            <Save className="size-4" aria-hidden="true" />
            Garder
          </button>
        </form>
        <p className="inspecteur-aide">Une version est aussi gardée toute seule toutes les cinq minutes d&apos;écriture et à chaque Ctrl+S. Les 60 dernières restent ; une version nommée n&apos;est jamais effacée.</p>
      </section>

      <section className="calame-section">
        <h3 className="calame-section-titre">Historique</h3>
        {versions === null ? (
          <p className="calame-vide">Chargement…</p>
        ) : versions.length === 0 ? (
          <p className="calame-vide">Aucune version pour l&apos;instant : elles arrivent au fil de l&apos;écriture.</p>
        ) : (
          <ol className="calame-versions">
            {versions.map((v) => (
              <li key={v.id} data-nommee={v.nom ? "" : undefined}>
                <div className="calame-version-tete">
                  {v.nom && <Bookmark className="size-4 shrink-0 text-accent" aria-hidden="true" />}
                  <span className="calame-version-titre">{v.nom || quand(v.quand)}</span>
                  <span className="calame-version-delta" data-signe={v.deltaMots >= 0 ? "plus" : "moins"}>
                    {v.deltaMots >= 0 ? "+" : "−"}
                    {Math.abs(v.deltaMots).toLocaleString("fr-FR")} mots
                  </span>
                </div>
                {v.nom && <span className="calame-version-date">{quand(v.quand)}</span>}
                {renommage?.id === v.id ? (
                  <form
                    className="flex gap-2"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      await nommerVersion(v.id, renommage.nom);
                      setRenommage(null);
                      await recharger();
                    }}
                  >
                    <input className="champ flex-1" autoFocus value={renommage.nom} onChange={(e) => setRenommage({ id: v.id, nom: e.target.value })} aria-label="Nom de la version" maxLength={80} />
                    <button type="submit" className="bouton bouton-discret bouton-petit">
                      OK
                    </button>
                  </form>
                ) : (
                  <div className="calame-version-actions">
                    <button type="button" onClick={() => setApercu(v)} title="Voir cette version">
                      <Eye className="size-4" aria-hidden="true" />
                      <span>Voir</span>
                    </button>
                    <button type="button" onClick={() => setComparee(v)} title="Comparer avec le texte actuel">
                      <GitCompareArrows className="size-4" aria-hidden="true" />
                      <span>Comparer</span>
                    </button>
                    <button type="button" onClick={() => setRenommage({ id: v.id, nom: v.nom ?? "" })} title="Nommer cette version">
                      <Bookmark className="size-4" aria-hidden="true" />
                      <span>Nommer</span>
                    </button>
                    <button type="button" onClick={() => setARestaurer(v)} title="Revenir à cette version">
                      <RotateCcw className="size-4" aria-hidden="true" />
                      <span>Restaurer</span>
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>

      {apercu && (
        <Fenetre titre={apercu.nom || "Version du document"} sousTitre={`${apercu.titre} · ${quand(apercu.quand)}`} surFermer={() => setApercu(null)} largeur={56}>
          <VueLecture contenu={apercu.contenu} reglages={reglages} etiquette="Texte de la version" />
        </Fenetre>
      )}

      {comparee && comparaison && (
        <Fenetre
          titre="Comparer avec le texte actuel"
          sousTitre={`${comparee.nom || quand(comparee.quand)} → maintenant : ${comparaison.bilan.ajoutes.toLocaleString("fr-FR")} mots ajoutés, ${comparaison.bilan.retires.toLocaleString("fr-FR")} retirés`}
          surFermer={() => setComparee(null)}
          largeur={60}
        >
          <div className="calame-diff">
            {comparaison.paragraphes.every((p) => p.genre === "egal") ? (
              <p className="calame-vide">Aucune différence : le texte est identique.</p>
            ) : (
              comparaison.paragraphes.map((p, i) =>
                p.genre === "egal" ? (
                  <p key={i} className="calame-diff-egal">
                    {p.morceaux[0]?.texte}
                  </p>
                ) : (
                  <p key={i} data-genre={p.genre}>
                    {p.morceaux.map((m, j) =>
                      m.genre === "egal" ? (
                        <span key={j}>{m.texte}</span>
                      ) : m.genre === "ajout" ? (
                        <ins key={j}>{m.texte}</ins>
                      ) : (
                        <del key={j}>{m.texte}</del>
                      ),
                    )}
                  </p>
                ),
              )
            )}
          </div>
        </Fenetre>
      )}

      {aRestaurer && (
        <Fenetre
          titre="Restaurer cette version ?"
          sousTitre={aRestaurer.nom || quand(aRestaurer.quand)}
          surFermer={() => setARestaurer(null)}
          largeur={30}
          pied={
            <>
              <button type="button" className="bouton bouton-discret" onClick={() => setARestaurer(null)}>
                Annuler
              </button>
              <button
                type="button"
                className="bouton bouton-principal"
                onClick={async () => {
                  await surRestaurer(aRestaurer);
                  setARestaurer(null);
                  await recharger();
                }}
              >
                Restaurer
              </button>
            </>
          }
        >
          <p>Le texte actuel est d&apos;abord gardé comme version (« Avant restauration ») : rien ne se perd, tu pourras y revenir.</p>
        </Fenetre>
      )}
    </>
  );
}
