"use client";

import { FileText, FileUp, LoaderCircle, ScanText, Trash2, TriangleAlert, X } from "lucide-react";
import { useId, useRef, useState } from "react";
import { BUDGET_COMPLET_AUTO, BUDGET_EXTRAITS, BUDGET_EXTRAITS_LARGE, BUDGET_INTEGRAL } from "@/lib/assistant/contexte";
import { formaterCaracteres, LIMITES } from "@/lib/assistant/limites";
import { formaterJetons } from "@/lib/assistant/modeles";
import type { FicheDocument } from "./api";

export type Envoi = {
  cle: string;
  nom: string;
  etat: "attente" | "lecture" | "ocr" | "envoi" | "fini" | "erreur";
  fait: number;
  total: number;
  message?: string;
};

function etiquetteEnvoi(e: Envoi): string {
  if (e.etat === "attente") return "En attente";
  if (e.etat === "lecture") return e.total ? `Lecture : page ${e.fait} sur ${e.total}` : "Ouverture…";
  if (e.etat === "ocr") return `Reconnaissance du texte : page ${e.fait} sur ${e.total}`;
  if (e.etat === "envoi") return "Enregistrement…";
  if (e.etat === "fini") return e.message ?? "Prêt";
  return e.message ?? "Échec";
}

/** Ce que Claude lira pour la prochaine question, selon le poids des documents cochés. */
function lectureAnnoncee(jetons: number, integrale: boolean): string {
  if (jetons === 0) return "Coche au moins un document : Claude ne lit que les documents cochés.";
  if (jetons <= BUDGET_COMPLET_AUTO) return `Claude lit le texte intégral (≈ ${formaterJetons(jetons)} jetons), relu depuis le cache pour les questions suivantes.`;
  if (integrale && jetons <= BUDGET_INTEGRAL) return `Lecture intégrale (≈ ${formaterJetons(jetons)} jetons par question, en grande partie depuis le cache) : la plus précise, et la plus coûteuse.`;
  return `Documents longs (≈ ${formaterJetons(jetons)} jetons) : Claude lit, pour chaque question, les passages les plus utiles (≈ ${formaterJetons(integrale ? BUDGET_EXTRAITS_LARGE : BUDGET_EXTRAITS)} jetons).`;
}

export function Documents({
  documents,
  envois,
  lecture,
  occupe,
  onFichiers,
  onBasculer,
  onSupprimer,
  onLecture,
  onAnnuler,
  onFermer,
}: {
  documents: FicheDocument[];
  envois: Envoi[];
  lecture: "auto" | "integrale";
  occupe: boolean;
  onFichiers: (f: File[]) => void;
  onBasculer: (id: string, actif: boolean) => void;
  onSupprimer: (id: string) => void;
  onLecture: (l: "auto" | "integrale") => void;
  onAnnuler: () => void;
  onFermer?: () => void;
}) {
  const champ = useRef<HTMLInputElement>(null);
  const [survol, setSurvol] = useState(false);
  const [aSupprimer, setASupprimer] = useState<string | null>(null);
  const id = useId();
  const coches = documents.filter((d) => d.actif);
  const jetons = coches.reduce((s, d) => s + d.jetons, 0);
  const enCours = envois.some((e) => e.etat !== "fini" && e.etat !== "erreur");

  const recevoir = (liste: FileList | File[] | null) => {
    const fichiers = [...(liste ?? [])];
    if (fichiers.length) onFichiers(fichiers);
  };

  return (
    <section className="aia-docs" aria-labelledby={`${id}-titre`}>
      <div className="aia-docs-tete">
        <h2 id={`${id}-titre`}>Tes PDF</h2>
        <span className="aia-docs-compte">
          {documents.length} / {LIMITES.documentsParConversation}
        </span>
        {onFermer && (
          <button type="button" className="bouton-icone aia-docs-fermer" onClick={onFermer} aria-label="Fermer la liste des PDF">
            <X className="size-5" aria-hidden="true" />
          </button>
        )}
      </div>

      <button
        type="button"
        className="aia-depot"
        data-survol={survol ? "" : undefined}
        disabled={occupe}
        onClick={() => champ.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setSurvol(true);
        }}
        onDragLeave={() => setSurvol(false)}
        onDrop={(e) => {
          e.preventDefault();
          setSurvol(false);
          recevoir(e.dataTransfer.files);
        }}
      >
        <FileUp className="size-6" strokeWidth={1.5} aria-hidden="true" />
        <span className="aia-depot-titre">Ajouter des PDF</span>
        <span className="aia-depot-aide">Dépose-les ici ou choisis-les : plusieurs à la fois. Ils sont lus sur ton appareil ; seul leur texte est envoyé.</span>
      </button>
      <input
        ref={champ}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        hidden
        onChange={(e) => {
          recevoir(e.target.files);
          e.target.value = "";
        }}
      />

      {envois.length > 0 && (
        <ul className="aia-envois" aria-live="polite">
          {envois.map((e) => (
            <li key={e.cle} className="aia-envoi" data-etat={e.etat}>
              {e.etat === "erreur" ? (
                <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
              ) : e.etat === "fini" ? (
                <FileText className="size-4 shrink-0" aria-hidden="true" />
              ) : e.etat === "ocr" ? (
                <ScanText className="size-4 shrink-0" aria-hidden="true" />
              ) : (
                <LoaderCircle className="size-4 shrink-0 animate-spin" aria-hidden="true" />
              )}
              <span className="aia-envoi-nom">{e.nom}</span>
              <span className="aia-envoi-etat">{etiquetteEnvoi(e)}</span>
              {(e.etat === "lecture" || e.etat === "ocr") && e.total > 0 && <progress max={e.total} value={e.fait} aria-label={`Avancement de ${e.nom}`} />}
            </li>
          ))}
          {enCours && (
            <li>
              <button type="button" className="aia-lien" onClick={onAnnuler}>
                Arrêter la lecture
              </button>
            </li>
          )}
        </ul>
      )}

      {documents.length > 0 ? (
        <ul className="aia-liste-docs">
          {documents.map((d) => (
            <li key={d.id} className="aia-doc" data-inactif={d.actif ? undefined : ""}>
              <label className="aia-doc-case">
                <input type="checkbox" checked={d.actif} onChange={(e) => onBasculer(d.id, e.target.checked)} />
                <span className="aia-doc-numero" aria-hidden="true">
                  {d.numero}
                </span>
                <span className="aia-doc-infos">
                  <span className="aia-doc-nom" title={d.nom}>
                    <span className="sr-only">Doc {d.numero} : </span>
                    {d.nom}
                  </span>
                  <span className="aia-doc-meta">
                    {d.pages} page{d.pages > 1 ? "s" : ""} · ≈ {formaterJetons(d.jetons)} jetons
                    {d.pagesVides > 0 ? ` · ${d.pagesVides} sans texte` : ""}
                  </span>
                </span>
              </label>
              {aSupprimer === d.id ? (
                <span className="aia-doc-confirmer">
                  <button type="button" className="aia-lien aia-lien-danger" onClick={() => onSupprimer(d.id)}>
                    Retirer
                  </button>
                  <button type="button" className="aia-lien" onClick={() => setASupprimer(null)}>
                    Garder
                  </button>
                </span>
              ) : (
                <button type="button" className="bouton-icone" onClick={() => setASupprimer(d.id)} aria-label={`Retirer ${d.nom}`}>
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        !envois.length && <p className="aia-docs-vide">Aucun document pour l&apos;instant.</p>
      )}

      {documents.length > 0 && (
        <div className="aia-lecture">
          <p className="aia-lecture-annonce">{lectureAnnoncee(jetons, lecture === "integrale")}</p>
          {jetons > BUDGET_COMPLET_AUTO && (
            <label className="aia-interrupteur">
              <input type="checkbox" checked={lecture === "integrale"} onChange={(e) => onLecture(e.target.checked ? "integrale" : "auto")} />
              <span>
                Lecture intégrale
                <span className="aia-interrupteur-aide">Jusqu&apos;à {formaterJetons(BUDGET_INTEGRAL)} jetons : Claude lit tout, à chaque question.</span>
              </span>
            </label>
          )}
          <p className="aia-lecture-place">Place utilisée par tes PDF : {formaterCaracteres(documents.reduce((s, d) => s + d.caracteres, 0))} caractères dans cette conversation.</p>
        </div>
      )}
    </section>
  );
}
