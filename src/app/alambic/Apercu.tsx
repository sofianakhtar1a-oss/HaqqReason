"use client";

/*
 * Aperçu d'un fichier produit, avant de le télécharger : l'image, les pages d'un PDF, le son,
 * la vidéo, le début d'un texte ou d'un tableau, le contenu d'une archive (chaque fichier s'en extrait).
 */
import { ChevronLeft, ChevronRight, Download, LoaderCircle, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { familleDuFormat, tailleLisible } from "@/lib/alambic/formats";
import { telecharger } from "./telecharger";

const IMAGES_NATIVES = new Set(["png", "jpg", "webp", "gif", "bmp", "ico", "svg", "avif", "heic"]);
const TEXTES = new Set(["txt", "md", "csv", "json", "xml", "yaml", "sql", "html", "rtf"]);
const DOCUMENTS = new Set(["docx", "odt", "epub"]);
const ARCHIVES = new Set(["zip", "tar", "gz"]);
const MAX_TEXTE = 4000;

type Contenu =
  | { genre: "chargement" }
  | { genre: "image"; url: string }
  | { genre: "media"; url: string; video: boolean }
  | { genre: "pdf"; url: string; page: number; pages: number }
  | { genre: "texte"; texte: string; coupe: boolean }
  | { genre: "tableau"; colonnes: string[]; lignes: string[][]; total: number; feuille: string }
  | { genre: "archive"; entrees: { nom: string; taille: number; chiffre: boolean }[] }
  | { genre: "aucun"; raison: string };

export function Apercu({ blob, formatId, nom }: { blob: Blob; formatId: string; nom: string }) {
  const [contenu, setContenu] = useState<Contenu>({ genre: "chargement" });
  const [page, setPage] = useState(1);

  useEffect(() => {
    let vivant = true;
    const liens: string[] = [];
    const lien = (b: Blob) => {
      const u = URL.createObjectURL(b);
      liens.push(u);
      return u;
    };
    // Un lien créé après la fermeture de l'aperçu est libéré aussitôt.
    const garder = (u: string) => {
      if (!vivant) {
        URL.revokeObjectURL(u);
        return null;
      }
      liens.push(u);
      return u;
    };
    (async () => {
      try {
        const famille = familleDuFormat(formatId);
        if (IMAGES_NATIVES.has(formatId)) return setContenu({ genre: "image", url: lien(formatId === "svg" ? new Blob([blob], { type: "image/svg+xml" }) : blob) });
        if (formatId === "tiff") {
          const { vignette } = await import("@/lib/alambic/navigateur/images");
          const u = garder(await vignette(blob, "tiff", 1200));
          return u && setContenu({ genre: "image", url: u });
        }
        if (famille === "audio" || famille === "video") return setContenu({ genre: "media", url: lien(blob), video: famille === "video" });
        if (formatId === "pdf") {
          const { ouvrir, vignettePage } = await import("@/lib/alambic/navigateur/pdf");
          const { doc, fermer } = await ouvrir(new Uint8Array(await blob.arrayBuffer()));
          try {
            const n = Math.min(Math.max(1, page), doc.numPages);
            const u = garder(await vignettePage(doc, n, 900));
            if (u) setContenu({ genre: "pdf", url: u, page: n, pages: doc.numPages });
          } finally {
            await fermer();
          }
          return;
        }
        if (TEXTES.has(formatId)) {
          const t = await blob.slice(0, MAX_TEXTE * 4).text();
          return vivant && setContenu({ genre: "texte", texte: t.slice(0, MAX_TEXTE), coupe: blob.size > MAX_TEXTE });
        }
        if (DOCUMENTS.has(formatId)) {
          const [{ lireDocument }, { texteDuDocument }] = await Promise.all([import("@/lib/alambic/navigateur/documents"), import("@/lib/document-schema")]);
          const lu = await lireDocument(nom, formatId, blob, () => {});
          const t = texteDuDocument(lu.doc, true);
          return vivant && setContenu({ genre: "texte", texte: t.slice(0, MAX_TEXTE), coupe: t.length > MAX_TEXTE });
        }
        if (formatId === "xlsx") {
          const { lireDonnees } = await import("@/lib/alambic/navigateur/donnees");
          const lu = await lireDonnees(nom, "xlsx", blob);
          const f = lu.feuilles[0];
          return (
            vivant &&
            setContenu({ genre: "tableau", feuille: f.nom, colonnes: f.colonnes, lignes: f.lignes.slice(0, 12).map((l) => l.map((v) => (v === null ? "" : String(v)))), total: f.lignes.length })
          );
        }
        if (ARCHIVES.has(formatId)) {
          const { sommaireArchive } = await import("@/lib/alambic/navigateur/archives");
          const entrees = await sommaireArchive(nom, formatId, blob);
          return vivant && setContenu({ genre: "archive", entrees });
        }
        setContenu({ genre: "aucun", raison: "Pas d'aperçu pour ce format : télécharge-le pour l'ouvrir." });
      } catch (e) {
        if (vivant) setContenu({ genre: "aucun", raison: (e as Error).message || "L'aperçu n'a pas pu être préparé." });
      }
    })();
    return () => {
      vivant = false;
      setTimeout(() => liens.forEach((u) => URL.revokeObjectURL(u)), 0);
    };
  }, [blob, formatId, nom, page]);

  return (
    <div className="alambic-apercu" aria-live="polite">
      {contenu.genre === "chargement" && (
        <p className="alambic-etape">
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          Préparation de l&apos;aperçu
        </p>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element -- image locale (blob:) */}
      {contenu.genre === "image" && <img src={contenu.url} alt={`Aperçu de ${nom}`} className="alambic-apercu-image" />}
      {contenu.genre === "media" &&
        (contenu.video ? <video src={contenu.url} controls className="alambic-lecteur" /> : <audio src={contenu.url} controls className="w-full" />)}
      {contenu.genre === "pdf" && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- page rendue sur place (blob:) */}
          <img src={contenu.url} alt={`Page ${contenu.page} de ${nom}`} className="alambic-apercu-image alambic-apercu-page" />
          {contenu.pages > 1 && (
            <div className="alambic-apercu-pages">
              <button type="button" className="bouton-icone" onClick={() => setPage(Math.max(1, contenu.page - 1))} disabled={contenu.page <= 1} aria-label="Page précédente">
                <ChevronLeft className="size-5" aria-hidden="true" />
              </button>
              <span className="tabular-nums">
                Page {contenu.page} sur {contenu.pages}
              </span>
              <button type="button" className="bouton-icone" onClick={() => setPage(Math.min(contenu.pages, contenu.page + 1))} disabled={contenu.page >= contenu.pages} aria-label="Page suivante">
                <ChevronRight className="size-5" aria-hidden="true" />
              </button>
            </div>
          )}
        </>
      )}
      {contenu.genre === "texte" && (
        <pre className="alambic-apercu-texte">
          {contenu.texte}
          {contenu.coupe && "\n…"}
        </pre>
      )}
      {contenu.genre === "tableau" && (
        <div className="alambic-apercu-tableau">
          <table>
            <caption>
              {contenu.feuille} — {contenu.total} ligne{contenu.total > 1 ? "s" : ""}
              {contenu.total > contenu.lignes.length ? `, les ${contenu.lignes.length} premières` : ""}
            </caption>
            <thead>
              <tr>
                {contenu.colonnes.map((c, i) => (
                  <th key={i} scope="col">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contenu.lignes.map((l, i) => (
                <tr key={i}>
                  {l.map((v, j) => (
                    <td key={j}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {contenu.genre === "archive" && <ContenuArchive blob={blob} formatId={formatId} nom={nom} entrees={contenu.entrees} />}
      {contenu.genre === "aucun" && <p className="text-sm text-encre-douce">{contenu.raison}</p>}
    </div>
  );
}

function ContenuArchive({ blob, formatId, nom, entrees }: { blob: Blob; formatId: string; nom: string; entrees: { nom: string; taille: number; chiffre: boolean }[] }) {
  const [enCours, setEnCours] = useState<string | null>(null);
  const [erreur, setErreur] = useState("");
  const extraire = async (cible: string) => {
    setEnCours(cible);
    setErreur("");
    try {
      const { lireEntree } = await import("@/lib/alambic/navigateur/archives");
      const f = await lireEntree(nom, formatId, blob, cible);
      if (f) telecharger(f.blob, f.nom.split("/").pop() || f.nom);
    } catch (e) {
      setErreur((e as Error).message);
    } finally {
      setEnCours(null);
    }
  };
  return (
    <>
      <p className="text-sm text-encre-douce">
        {entrees.length} fichier{entrees.length > 1 ? "s" : ""} dans l&apos;archive. Chacun s&apos;extrait d&apos;un clic.
      </p>
      <ul className="alambic-apercu-archive">
        {entrees.slice(0, 200).map((e) => (
          <li key={e.nom}>
            <span className="min-w-0 flex-1 truncate" title={e.nom}>
              {e.nom}
            </span>
            <span className="text-sm tabular-nums text-encre-douce">{tailleLisible(e.taille)}</span>
            {e.chiffre ? (
              <Lock className="size-4 text-encre-douce" aria-label="Protégé par un mot de passe" />
            ) : (
              <button type="button" className="bouton-icone !size-9" onClick={() => void extraire(e.nom)} disabled={enCours !== null} aria-label={`Extraire ${e.nom}`} title="Extraire ce fichier">
                {enCours === e.nom ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Download className="size-4" aria-hidden="true" />}
              </button>
            )}
          </li>
        ))}
      </ul>
      {entrees.length > 200 && <p className="text-sm text-encre-douce">… et {entrees.length - 200} autres.</p>}
      {erreur && <p className="message message-erreur">{erreur}</p>}
    </>
  );
}
