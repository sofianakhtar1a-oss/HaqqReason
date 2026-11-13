"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Check, Pencil, ScanText, Upload } from "lucide-react";
import { BoutonConfirmation } from "@/components/BoutonConfirmation";
import { IconeFichier } from "@/components/IconeFichier";
import { envoyerFichier, extraireTextePdf, reconnaitreTexte } from "@/lib/client/envoi";
import { formatTaille, TYPES_FICHIERS } from "@/lib/fichiers";
import type { FichierResume } from "@/lib/fichiers-donnees";
import { renommerFichier, supprimerFichier, type Cible } from "../fichiers-actions";

type Tache = { cle: string; message: string; pourcentage: number; erreur?: boolean; fini?: boolean };

const STATUTS: Record<FichierResume["statut_texte"], string> = {
  en_attente: "Texte pas encore lu",
  extrait: "Texte prêt pour la recherche",
  scanne: "PDF scanné : certaines pages n'ont pas de texte",
  ocr: "Texte reconnu (OCR)",
  non_applicable: "",
};

/** Dépôt et gestion des documents d'un article ou d'une catégorie (mode créateur). */
export function GestionnaireFichiers({ cible, fichiers }: { cible: Cible; fichiers: FichierResume[] }) {
  const router = useRouter();
  const [taches, setTaches] = useState<Tache[]>([]);
  const [survol, setSurvol] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [renomme, setRenomme] = useState<string | null>(null);
  const entree = useRef<HTMLInputElement>(null);

  const majTache = (cle: string, maj: Partial<Tache>) => setTaches((t) => t.map((x) => (x.cle === cle ? { ...x, ...maj } : x)));

  async function traiter(liste: FileList | File[]) {
    const fichiersAEnvoyer = Array.from(liste);
    if (fichiersAEnvoyer.length === 0) return;
    setEnCours(true);
    const nouvelles = fichiersAEnvoyer.map((f, i) => ({ cle: `${Date.now()}-${i}`, message: `En attente : « ${f.name} »`, pourcentage: 0 }));
    setTaches((t) => [...nouvelles, ...t.filter((x) => !x.fini)]);
    for (let i = 0; i < fichiersAEnvoyer.length; i++) {
      const cle = nouvelles[i].cle;
      const suivi = (message: string, pourcentage = 0) => majTache(cle, { message, pourcentage });
      const r = await envoyerFichier(fichiersAEnvoyer[i], cible, { suivi });
      if (!r.ok) {
        majTache(cle, { message: r.message, erreur: true, fini: true });
        continue;
      }
      if (r.typeMime === "application/pdf") {
        try {
          const { pages, sansTexte } = await extraireTextePdf(r.id, suivi);
          majTache(cle, {
            message: sansTexte > 0 ? `« ${r.nom} » envoyé (${pages} pages, dont ${sansTexte} sans texte : lance la reconnaissance de texte ci-dessous).` : `« ${r.nom} » envoyé : ${pages} pages, texte prêt pour la recherche.`,
            pourcentage: 100,
            fini: true,
          });
        } catch {
          majTache(cle, { message: `« ${r.nom} » envoyé, mais son texte n'a pas pu être lu.`, pourcentage: 100, fini: true });
        }
      } else {
        majTache(cle, { message: `« ${r.nom} » envoyé.`, pourcentage: 100, fini: true });
      }
    }
    setEnCours(false);
    router.refresh();
  }

  async function ocr(f: FichierResume) {
    const cle = `ocr-${f.id}`;
    setEnCours(true);
    setTaches((t) => [{ cle, message: "Préparation de la reconnaissance de texte", pourcentage: 0 }, ...t]);
    try {
      const { reconnues } = await reconnaitreTexte(f.id, (message, pourcentage = 0) => majTache(cle, { message, pourcentage }));
      majTache(cle, { message: `Reconnaissance terminée : ${reconnues} page${reconnues > 1 ? "s" : ""} lue${reconnues > 1 ? "s" : ""} dans « ${f.nom} ».`, pourcentage: 100, fini: true });
    } catch {
      majTache(cle, { message: "La reconnaissance de texte a échoué. Réessaie.", erreur: true, fini: true });
    }
    setEnCours(false);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <label
        className="zone-depot"
        data-survol={survol}
        onDragOver={(e) => {
          e.preventDefault();
          setSurvol(true);
        }}
        onDragLeave={() => setSurvol(false)}
        onDrop={(e) => {
          e.preventDefault();
          setSurvol(false);
          if (!enCours) void traiter(e.dataTransfer.files);
        }}
      >
        <Upload className="size-7 text-accent" strokeWidth={1.5} aria-hidden="true" />
        <span className="font-semibold text-encre">Dépose tes fichiers ici, ou clique pour les choisir</span>
        <span className="text-sm">PDF, images, Word, Excel, PowerPoint, OpenDocument, EPUB, texte. 50 Mo au plus par fichier.</span>
        <input
          ref={entree}
          type="file"
          multiple
          className="sr-only"
          disabled={enCours}
          accept={Object.keys(TYPES_FICHIERS).join(",") + ",.pdf,.docx,.xlsx,.pptx,.odt,.epub,.txt"}
          onChange={(e) => {
            if (e.target.files) void traiter(e.target.files);
            e.target.value = "";
          }}
        />
      </label>

      {taches.length > 0 && (
        <ul className="space-y-3" aria-live="polite">
          {taches.map((t) => (
            <li key={t.cle} className={t.erreur ? "message message-erreur" : "verre rounded-2xl p-3"}>
              <p className="text-sm">{t.message}</p>
              {!t.erreur && !t.fini && (
                <div className="barre-progression mt-2" role="progressbar" aria-valuenow={t.pourcentage} aria-valuemin={0} aria-valuemax={100}>
                  <span style={{ width: `${t.pourcentage}%` }} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {fichiers.length > 0 && (
        <ul className="space-y-2">
          {fichiers.map((f) => {
            const famille = TYPES_FICHIERS[f.type_mime]?.famille ?? "document";
            return (
              <li key={f.id} className="rangee flex-wrap">
                <span className="vignette-fichier">
                  {famille === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/fichiers/${f.id}`} alt="" loading="lazy" />
                  ) : (
                    <IconeFichier typeMime={f.type_mime} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  {renomme === f.id ? (
                    <form
                      className="flex gap-2"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const nom = new FormData(e.currentTarget).get("nom");
                        await renommerFichier({ id: f.id, nom: String(nom) });
                        setRenomme(null);
                        router.refresh();
                      }}
                    >
                      <label className="sr-only" htmlFor={`nom-${f.id}`}>
                        Nouveau nom
                      </label>
                      <input id={`nom-${f.id}`} name="nom" className="champ !min-h-9 !py-1" defaultValue={f.nom} autoFocus maxLength={200} />
                      <button type="submit" className="bouton-icone" aria-label="Enregistrer le nom">
                        <Check className="size-4" aria-hidden="true" />
                      </button>
                    </form>
                  ) : (
                    <Link href={`/createur/document/${f.id}`} className="block truncate font-semibold hover:underline hover:underline-offset-4">
                      {f.nom}
                    </Link>
                  )}
                  <span className="block text-sm text-encre-douce">
                    {[TYPES_FICHIERS[f.type_mime]?.libelle, f.pages ? `${f.pages} pages` : null, formatTaille(f.taille), STATUTS[f.statut_texte]].filter(Boolean).join(", ")}
                  </span>
                </div>
                {f.statut_texte === "scanne" && (
                  <button type="button" className="bouton bouton-discret !min-h-10 text-sm" onClick={() => void ocr(f)} disabled={enCours}>
                    <ScanText className="size-4" aria-hidden="true" />
                    Reconnaître le texte
                  </button>
                )}
                <button type="button" className="bouton-icone" aria-label={`Renommer « ${f.nom} »`} title="Renommer" onClick={() => setRenomme(f.id)}>
                  <Pencil className="size-4" aria-hidden="true" />
                </button>
                <form action={supprimerFichier}>
                  <input type="hidden" name="id" value={f.id} />
                  <BoutonConfirmation libelle="Supprimer" confirmation="Oui, supprimer" enCours="Suppression…" className="bouton bouton-danger !min-h-10 text-sm" />
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
