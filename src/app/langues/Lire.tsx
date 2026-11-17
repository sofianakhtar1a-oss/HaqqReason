"use client";

import { BookOpenText, FileText, LoaderCircle, Upload } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { type DocumentLangue, ecrire, effacer, listerDocuments, lireUn } from "@/lib/langues/stockage";
import { BoutonSupprimer } from "./communs";
import { LiseusePdf } from "./LiseusePdf";

/*
 * Lire : un PDF en anglais devient un livre où chaque mot se traduit.
 * Le texte est extrait ici, dans le navigateur ; seules les phrases à traduire sont envoyées.
 */

const nouvelId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

export function Lire({ ouvert, onOuvrir }: { ouvert: string | null; onOuvrir: (id: string | null) => void }) {
  const [documents, setDocuments] = useState<DocumentLangue[] | null>(null);
  const [courant, setCourant] = useState<DocumentLangue | null>(null);
  const [lecture, setLecture] = useState<{ nom: string; progression: number } | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [survol, setSurvol] = useState(false);

  const recharger = useCallback(() => void listerDocuments().then(setDocuments).catch(() => setDocuments([])), []);
  useEffect(recharger, [recharger]);

  useEffect(() => {
    if (!ouvert) return;
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
      const d: DocumentLangue = {
        id: nouvelId(),
        titre: f.name.replace(/\.pdf$/i, "").replace(/[_-]+/g, " ").trim() || "Sans titre",
        pages,
        page: pages.find((p) => p.texte.length > 80)?.page ?? 1,
        ajouteLe: Date.now(),
        vu: Date.now(),
        traductions: {},
        analyses: {},
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

  if (courant && courant.id === ouvert) return <LiseusePdf key={courant.id} document={courant} onFermer={() => { onOuvrir(null); recharger(); }} />;

  return (
    <section aria-labelledby="titre-lire">
      <div className="lg-section-tete">
        <div>
          <h2 id="titre-lire" className="lg-titre">
            Lire
          </h2>
          <p className="lg-chapo">Un livre, un article ou un cours en PDF, mis en page pour la lecture. Touche un mot pour sa traduction, sélectionne un passage pour le traduire en entier.</p>
        </div>
      </div>

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
            <strong>Choisis ou dépose un PDF en anglais</strong>
            <small>Le texte est lu sur ton appareil. Les PDF scannés (images seules) ne sont pas lisibles.</small>
          </span>
          <input type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(e) => e.target.files?.[0] && void importer(e.target.files[0])} />
        </label>
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
          <p>Aucune lecture pour l&apos;instant. Un texte un peu en dessous de ton niveau est idéal : tu comprends l&apos;essentiel, et chaque mot nouveau se retient mieux.</p>
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
                    {x.pages.length} pages · page {x.page}
                  </span>
                  <span className="lg-element-avancee">
                    <span style={{ transform: `scaleX(${x.page / Math.max(1, x.pages.length)})` }} />
                  </span>
                </span>
              </button>
              <BoutonSupprimer nom={x.titre} onSupprimer={() => void effacer("documents", x.id).then(recharger)} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
