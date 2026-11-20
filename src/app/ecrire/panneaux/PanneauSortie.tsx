"use client";

import type { Editor } from "@tiptap/core";
import { AlertTriangle, BookOpen, CheckCircle2, FileArchive, FileCode2, FileDown, FileType2, Printer, Share2, TextSelect } from "lucide-react";
import { useEffect, useState } from "react";
import { choisirDossier, dossierPossible, ecrireReglage, FREQUENCES, lireReglage, sauvegarderMaintenant, type Frequence } from "../sauvegarde-auto";
import { allerARemarque, verifierDocument, type Remarque } from "../verification";
import type { FormatPartage } from "../sorties";

export type ActionSortie =
  | { quoi: "pdf-direct" | "epub" | "html" | "txt" | "tout" | "livret" | "selection" }
  | { quoi: "pages"; pages: string }
  | { quoi: "partager"; format: FormatPartage };

type Props = {
  editor: Editor | null;
  pages: number;
  enCours: string;
  surAction: (action: ActionSortie) => void;
};

const GENRES: Record<Remarque["genre"], string> = { note: "Notes", image: "Images", lien: "Liens", titre: "Titres", source: "Sources" };

/**
 * L'onglet « Sortie », suite : vérifier avant d'exporter, les autres formats (PDF direct avec
 * signets, EPUB, page HTML, texte), imprimer une partie ou un livret, tout exporter, partager.
 */
function SauvegardeAuto() {
  const [reglage, setReglage] = useState(() => lireReglage());
  const [etat, setEtat] = useState("");
  const possible = dossierPossible();
  useEffect(() => {
    const relire = () => setReglage(lireReglage());
    window.addEventListener("calame:sauvegarde-auto", relire);
    return () => window.removeEventListener("calame:sauvegarde-auto", relire);
  }, []);
  const maintenant = async () => {
    setEtat("…");
    const r = await sauvegarderMaintenant(true);
    setEtat(r === "ok" ? "Sauvegarde écrite dans le dossier." : r === "permission" ? "Le navigateur n'a pas donné l'accès au dossier." : r === "sans-dossier" ? "Choisis d'abord un dossier." : "La sauvegarde n'a pas pu s'écrire.");
  };
  return (
    <section className="calame-section" aria-labelledby="sortie-sauvegarde">
      <h3 className="calame-section-titre" id="sortie-sauvegarde">
        <FileArchive className="size-4" aria-hidden="true" /> Sauvegarde automatique
      </h3>
      <select className="champ" value={reglage.frequence} onChange={(e) => setReglage(ecrireReglage({ frequence: e.target.value as Frequence }))} aria-label="Fréquence de la sauvegarde automatique">
        {FREQUENCES.map((f) => (
          <option key={f.cle} value={f.cle}>
            {f.libelle}
          </option>
        ))}
      </select>
      {possible ? (
        <>
          <button type="button" className="bouton bouton-discret w-full" onClick={() => void choisirDossier().then(() => setReglage(lireReglage()))}>
            {reglage.dossier ? `Dossier : ${reglage.dossier} (changer)` : "Choisir le dossier de sauvegarde"}
          </button>
          {reglage.dossier && (
            <button type="button" className="bouton bouton-discret w-full" onClick={() => void maintenant()}>
              Sauvegarder maintenant
            </button>
          )}
          <p className="inspecteur-aide">Tous tes documents, dans une archive .zip datée ; les dix dernières sont gardées.{reglage.derniere ? ` Dernière : ${new Date(reglage.derniere).toLocaleString("fr-FR")}.` : ""}</p>
        </>
      ) : (
        <p className="inspecteur-aide">Ce navigateur ne laisse pas écrire dans un dossier : à l&apos;échéance, le Calame te rappellera de télécharger l&apos;archive de tous tes documents.</p>
      )}
      {etat && (
        <p className="inspecteur-aide" role="status">
          {etat}
        </p>
      )}
    </section>
  );
}

export function PanneauSortie({ editor, pages, enCours, surAction }: Props) {
  const [remarques, setRemarques] = useState<Remarque[] | null>(null);
  const [plages, setPlages] = useState("");
  const [format, setFormat] = useState<FormatPartage>("docx");
  const occupe = enCours !== "";

  const verifier = () => editor && setRemarques(verifierDocument(editor));

  return (
    <>
      <section className="calame-section" aria-labelledby="sortie-verifier">
        <h3 className="calame-section-titre" id="sortie-verifier">
          <CheckCircle2 className="size-4" aria-hidden="true" /> Vérifier avant d&apos;exporter
        </h3>
        <button type="button" className="bouton bouton-discret w-full" onClick={verifier} disabled={!editor}>
          {remarques === null ? "Lancer la vérification" : "Vérifier à nouveau"}
        </button>
        {remarques !== null &&
          (remarques.length === 0 ? (
            <p className="inspecteur-aide calame-verif-ok">Rien à signaler : notes, images, liens, titres et sources sont complets.</p>
          ) : (
            <ul className="calame-verif-liste">
              {remarques.slice(0, 60).map((r, i) => (
                <li key={`${r.pos}-${i}`}>
                  <button type="button" onClick={() => editor && allerARemarque(editor, r)}>
                    <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
                    <span>
                      <span className="calame-verif-genre">{GENRES[r.genre]}</span> {r.message}
                    </span>
                  </button>
                </li>
              ))}
              {remarques.length > 60 && <li className="inspecteur-aide">… et {remarques.length - 60} autres.</li>}
            </ul>
          ))}
      </section>

      <section className="calame-section" aria-labelledby="sortie-formats">
        <h3 className="calame-section-titre" id="sortie-formats">
          <FileDown className="size-4" aria-hidden="true" /> Autres formats
        </h3>
        <button type="button" className="bouton bouton-discret w-full" onClick={() => surAction({ quoi: "pdf-direct" })} disabled={occupe}>
          <FileDown className="size-4" aria-hidden="true" />
          {enCours === "pdf-direct" ? "Préparation des pages…" : "PDF direct, avec signets et liens"}
        </button>
        <button type="button" className="bouton bouton-discret w-full" onClick={() => surAction({ quoi: "epub" })} disabled={occupe}>
          <BookOpen className="size-4" aria-hidden="true" />
          {enCours === "epub" ? "Préparation…" : "Livre numérique (.epub)"}
        </button>
        <button type="button" className="bouton bouton-discret w-full" onClick={() => surAction({ quoi: "html" })} disabled={occupe}>
          <FileCode2 className="size-4" aria-hidden="true" />
          {enCours === "html" ? "Préparation…" : "Page web autonome (.html)"}
        </button>
        <button type="button" className="bouton bouton-discret w-full" onClick={() => surAction({ quoi: "txt" })} disabled={occupe}>
          <FileType2 className="size-4" aria-hidden="true" />
          Texte brut (.txt)
        </button>
        <p className="inspecteur-aide">Le PDF direct est une image fidèle de chaque page (texte non sélectionnable) ; « Imprimer ou enregistrer en PDF » garde le texte sélectionnable.</p>
      </section>

      <section className="calame-section" aria-labelledby="sortie-imprimer">
        <h3 className="calame-section-titre" id="sortie-imprimer">
          <Printer className="size-4" aria-hidden="true" /> Imprimer une partie
        </h3>
        <form
          className="calame-sortie-pages"
          onSubmit={(e) => {
            e.preventDefault();
            if (plages.trim()) surAction({ quoi: "pages", pages: plages });
          }}
        >
          <input className="champ" value={plages} onChange={(e) => setPlages(e.target.value)} placeholder={pages > 1 ? `1-${Math.min(3, pages)}, ${pages}` : "1"} aria-label="Pages à imprimer" inputMode="numeric" />
          <button type="submit" className="bouton bouton-discret" disabled={!plages.trim()}>
            Imprimer
          </button>
        </form>
        <button type="button" className="bouton bouton-discret w-full" onClick={() => surAction({ quoi: "selection" })}>
          <TextSelect className="size-4" aria-hidden="true" />
          Imprimer la sélection
        </button>
        <button type="button" className="bouton bouton-discret w-full" onClick={() => surAction({ quoi: "livret" })}>
          <BookOpen className="size-4" aria-hidden="true" />
          Livret A5 (à plier et agrafer)
        </button>
        <p className="inspecteur-aide">Livret : imprime en recto verso, retournement sur le petit côté, puis plie la pile en deux.</p>
      </section>

      <section className="calame-section" aria-labelledby="sortie-partager">
        <h3 className="calame-section-titre" id="sortie-partager">
          <Share2 className="size-4" aria-hidden="true" /> Partager
        </h3>
        <div className="calame-sortie-pages">
          <select className="champ" value={format} onChange={(e) => setFormat(e.target.value as FormatPartage)} aria-label="Format à partager">
            <option value="docx">Word (.docx)</option>
            <option value="epub">Livre numérique (.epub)</option>
            <option value="html">Page web (.html)</option>
            <option value="md">Markdown (.md)</option>
            <option value="txt">Texte (.txt)</option>
            <option value="calame">Document complet (.calame)</option>
          </select>
          <button type="button" className="bouton bouton-discret" onClick={() => surAction({ quoi: "partager", format })} disabled={occupe}>
            Partager
          </button>
        </div>
        <p className="inspecteur-aide">Sur téléphone, la feuille de partage s&apos;ouvre (messagerie, e-mail, Drive…). Ailleurs, le fichier se télécharge et un e-mail prêt à partir s&apos;ouvre.</p>
        <button type="button" className="bouton bouton-discret w-full" onClick={() => surAction({ quoi: "tout" })} disabled={occupe}>
          <FileArchive className="size-4" aria-hidden="true" />
          {enCours === "tout" ? "Préparation…" : "Tous mes documents (.zip)"}
        </button>
      </section>
      <SauvegardeAuto />
    </>
  );
}
