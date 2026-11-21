"use client";

import { BookOpenText, FileText, LoaderCircle, Upload } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useArrivees } from "@/lib/client/synchro/useArrivees";
import { type DocumentLangue, ecrire, ecrireBlob, effacer, listerDocuments, lireUn } from "@/lib/langues/stockage";
import { cleOriginal } from "@/lib/langues/pdf";
import { BoutonSupprimer, ChoixLangue } from "./communs";
import { useTextes } from "@/lib/modules/textes-client";
import { Bibliotheque } from "./histoires/Bibliotheque";
import { LiseuseHistoire } from "./histoires/LiseuseHistoire";
import { LiseusePdf } from "./LiseusePdf";

/*
 * Lire : d'abord la bibliothèque d'histoires en anglais (A1 à C2), chaque mot traduit d'avance ;
 * puis tes PDF, en anglais ou en français, où chaque mot se traduit dans l'autre langue.
 * Le texte d'un PDF est extrait ici, dans le navigateur ; seules les phrases à traduire sont envoyées.
 * Adresses : #lire, #lire/<document>, #lire/histoire/<histoire>.
 */

const HISTOIRE = "histoire/";

const nouvelId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

const MAGASINS_DOCUMENTS = ["langues-documents", "reprise"] as const;

export function Lire({ ouvert, onOuvrir }: { ouvert: string | null; onOuvrir: (id: string | null) => void }) {
  const [documents, setDocuments] = useState<DocumentLangue[] | null>(null);
  const [courant, setCourant] = useState<DocumentLangue | null>(null);
  const [lecture, setLecture] = useState<{ nom: string; progression: number } | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [survol, setSurvol] = useState(false);
  const [langue, setLangue] = useState<"en" | "fr">("en");
  const t = useTextes("langues");

  const recharger = useCallback(() => void listerDocuments().then(setDocuments).catch(() => setDocuments([])), []);
  useEffect(recharger, [recharger]);
  useArrivees(MAGASINS_DOCUMENTS, recharger);

  useEffect(() => {
    if (!ouvert || ouvert.startsWith(HISTOIRE)) return;
    let fini = false;
    void lireUn<DocumentLangue>("documents", ouvert).then((x) => {
      if (fini) return;
      if (x) setCourant(x);
      else onOuvrir(null);
    });
    return () => {
      fini = true;
    };
  }, [ouvert, onOuvrir]);

  const importer = async (f: File) => {
    if (!/\.pdf$/i.test(f.name) && f.type !== "application/pdf") {
      setErreur("Choisis un fichier PDF.");
      return;
    }
    setErreur(null);
    setLecture({ nom: f.name, progression: 0 });
    try {
      const { lirePdf } = await import("@/lib/langues/pdf");
      const pages = await lirePdf(f, (progression) => setLecture((l) => l && { ...l, progression }));
      const id = nouvelId();
      // Le fichier lui-même reste sur l'appareil : la liseuse peut montrer chaque page telle qu'elle a été composée.
      const garde = await ecrireBlob(cleOriginal(id), f).then(
        () => true,
        () => false,
      );
      const d: DocumentLangue = {
        id,
        titre: f.name.replace(/\.pdf$/i, "").replace(/[_-]+/g, " ").trim() || "Sans titre",
        pages,
        // Avec la mise en page d'origine, la lecture commence à la couverture.
        page: garde ? 1 : (pages.find((p) => p.texte.length > 80)?.page ?? 1),
        ajouteLe: Date.now(),
        vu: Date.now(),
        traductions: {},
        analyses: {},
        langue,
        affiche: "original",
      };
      await ecrire("documents", d);
      recharger();
      onOuvrir(d.id);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Ce PDF n'a pas pu être lu.");
    } finally {
      setLecture(null);
    }
  };

  if (ouvert?.startsWith(HISTOIRE)) {
    const id = ouvert.slice(HISTOIRE.length);
    return <LiseuseHistoire key={id} id={id} onFermer={() => onOuvrir(null)} onOuvrir={(autre) => onOuvrir(`${HISTOIRE}${autre}`)} />;
  }
  if (courant && courant.id === ouvert) return <LiseusePdf key={courant.id} document={courant} onFermer={() => { onOuvrir(null); recharger(); }} />;

  return (
    <section aria-labelledby="titre-lire">
      <div className="lg-section-tete">
        <div>
          <h2 id="titre-lire" className="lg-titre">
            {t("lire.titre")}
          </h2>
        </div>
      </div>

      <Bibliotheque onOuvrir={(id) => onOuvrir(`${HISTOIRE}${id}`)} />

      <h3 className="lg-sous-titre hs-pdf-titre">{t("lire.pdf")}</h3>
      <p className="lg-chapo hs-pdf-chapo">{t("lire.chapo")}</p>

      {lecture ? (
        <div className="lg-travail" role="status">
          <div className="flex items-center gap-3">
            <LoaderCircle className="size-5 animate-spin text-accent" aria-hidden="true" />
            <p className="min-w-0 flex-1 truncate font-semibold">{lecture.nom}</p>
          </div>
          <p className="mt-1 text-sm text-encre-douce">Lecture des pages · {Math.round(lecture.progression * 100)} %</p>
          <span className="lg-travail-barre">
            <span style={{ transform: `scaleX(${Math.max(0.03, lecture.progression)})` }} />
          </span>
        </div>
      ) : (
        <div className="lg-import lg-import-pdf">
        <ChoixLangue valeur={langue} onChange={setLangue} quoi="Le PDF est en" />
        <label
          className="lg-import-fichier lg-import-grand"
          data-survol={survol || undefined}
          onDragOver={(e) => {
            e.preventDefault();
            setSurvol(true);
          }}
          onDragLeave={() => setSurvol(false)}
          onDrop={(e) => {
            e.preventDefault();
            setSurvol(false);
            const f = e.dataTransfer.files[0];
            if (f) void importer(f);
          }}
        >
          <Upload className="size-6 text-accent" aria-hidden="true" />
          <span>
            <strong>{t("lire.depot")}</strong>
            <small>Le texte est lu sur ton appareil, et la mise en page d&apos;origine est conservée. Les PDF scannés (images seules) ne sont pas lisibles.</small>
          </span>
          <input type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(e) => e.target.files?.[0] && void importer(e.target.files[0])} />
        </label>
        </div>
      )}
      {erreur && (
        <p className="lg-erreur" role="alert">
          {erreur}
        </p>
      )}

      <h3 className="lg-sous-titre">Mes lectures</h3>
      {documents === null ? (
        <p className="text-encre-douce">Chargement…</p>
      ) : documents.length === 0 ? (
        <div className="lg-vide">
          <BookOpenText className="size-8" strokeWidth={1.3} aria-hidden="true" />
          <p>{t("lire.vide")}</p>
        </div>
      ) : (
        <ul className="lg-bibliotheque">
          {documents.map((x) => (
            <li key={x.id} className="lg-element">
              <button type="button" className="lg-element-ouvrir" onClick={() => onOuvrir(x.id)}>
                <span className="lg-vignette lg-vignette-pdf" aria-hidden="true">
                  <FileText className="size-6" strokeWidth={1.4} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="lg-element-titre" dir="auto">
                    {x.titre}
                  </span>
                  <span className="lg-element-infos">
                    {x.langue === "fr" ? "Français" : "Anglais"} · {x.pages.length} pages · page {x.page}
                  </span>
                  <span className="lg-element-avancee">
                    <span style={{ transform: `scaleX(${x.page / Math.max(1, x.pages.length)})` }} />
                  </span>
                </span>
              </button>
              <BoutonSupprimer
                nom={x.titre}
                onSupprimer={() =>
                  void effacer("documents", x.id)
                    .then(() => effacer("blobs", cleOriginal(x.id)).catch(() => undefined))
                    .then(recharger)
                }
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
