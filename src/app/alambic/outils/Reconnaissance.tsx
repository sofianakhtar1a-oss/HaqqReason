"use client";

import { Check, Copy, Download, Feather, ScanText, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { nomDuFormat, tailleLisible } from "@/lib/alambic/formats";
import type { Resultat } from "@/lib/alambic/navigateur/moteur";
import type { LangueOcr, PageLue } from "@/lib/alambic/navigateur/ocr";
import type { Noeud } from "@/lib/alambic/pm";
import { useAccesComplet } from "@/lib/client/acces";
import { CarteResultat } from "../CarteResultat";
import { useAlambic } from "../contexte";
import { BonASavoir, EnTeteOutil, MessageErreur, Progression, reconnaitreTous, resultatDe, sansExtension, useTravail, ZoneDepot } from "../commun";
import { utiliser } from "@/lib/client/premium";
import { MarquePremium } from "@/components/premium/MarquePremium";
import { useReception, type Abonner } from "../reception";

const IMAGES = new Set(["jpg", "png", "webp", "bmp", "tiff", "gif", "heic", "avif"]);
const LANGUES: { id: LangueOcr; nom: string }[] = [
  { id: "fra", nom: "Français" },
  { id: "eng", nom: "Anglais" },
  { id: "ara", nom: "Arabe" },
];
type Sortie = "txt" | "docx" | "odt" | "md" | "pdf";
const SORTIES: { id: Sortie; nom: string }[] = [
  { id: "txt", nom: "Texte" },
  { id: "docx", nom: "Word" },
  { id: "odt", nom: "OpenDocument" },
  { id: "md", nom: "Markdown" },
  { id: "pdf", nom: "PDF cherchable" },
];

/** Le texte (éventuellement corrigé) redevient un document : pages séparées par deux lignes vides, paragraphes par une. */
function documentDuTexte(texte: string): Noeud {
  const content: Noeud[] = [];
  texte
    .replace(/\r\n?/g, "\n")
    .split(/\n{3,}/)
    .forEach((page, i) => {
      if (i > 0 && content.length) content.push({ type: "sautPage" });
      for (const p of page.split(/\n{2}/)) {
        const t = p.replace(/\s*\n\s*/g, " ").trim();
        if (t) content.push({ type: "paragraph", content: [{ type: "text", text: t }] });
      }
    });
  return { type: "doc", content: content.length ? content : [{ type: "paragraph" }] };
}

export function Reconnaissance({ abonner }: { abonner: Abonner }) {
  const { intention } = useAlambic();
  const router = useRouter();
  const accesComplet = useAccesComplet();
  const [fichiers, setFichiers] = useState<{ fichier: File; format: string }[]>([]);
  const [refuses, setRefuses] = useState<string[]>([]);
  const [langues, setLangues] = useState<LangueOcr[]>(["fra", "eng"]);
  const [forcer, setForcer] = useState(false);
  const [pages, setPages] = useState<PageLue[] | null>(null);
  const [texte, setTexte] = useState("");
  const [sortie, setSortie] = useState<Sortie>(intention?.reglage === "pdf" ? "pdf" : "docx");
  const [copie, setCopie] = useState(false);
  const [resultat, setResultat] = useState<Resultat | null>(null);
  const { travail, erreur, setErreur, lancer, annuler } = useTravail();

  const [intentionVue, setIntentionVue] = useState(intention);
  if (intention !== intentionVue) {
    setIntentionVue(intention);
    if (intention?.reglage === "pdf") setSortie("pdf");
  }

  const charger = async (entrants: File[]) => {
    setPages(null);
    setTexte("");
    setResultat(null);
    setErreur(null);
    const reconnus = await reconnaitreTous(entrants);
    const pdf = reconnus.find((x) => x.format === "pdf");
    const images = reconnus.filter((x) => x.format && IMAGES.has(x.format));
    setRefuses(reconnus.filter((x) => x.format !== "pdf" && !(x.format && IMAGES.has(x.format))).map((x) => x.fichier.name));
    setFichiers(pdf ? [{ fichier: pdf.fichier, format: "pdf" }] : images.map((x) => ({ fichier: x.fichier, format: x.format! })));
  };

  useReception(abonner, (f) => void charger(f));

  const estPdf = fichiers[0]?.format === "pdf";

  const lire = async () => {
    if (!(await utiliser("alambic.reconnaitre"))) return;
    await lancer(async (avancer, signal) => {
      setResultat(null);
      const { lireImages, lirePdf, texteLu } = await import("@/lib/alambic/navigateur/ocr");
      const lues = estPdf ? await lirePdf(new Uint8Array(await fichiers[0].fichier.arrayBuffer()), langues, avancer, signal, forcer) : await lireImages(fichiers, langues, avancer, signal);
      setPages(lues);
      setTexte(texteLu(lues));
    });
  };

  const base = sansExtension(fichiers[0]?.fichier.name ?? "Texte reconnu");

  const exporter = () =>
    lancer(async (avancer) => {
      if (!pages) return;
      avancer(null, `Écriture en ${SORTIES.find((s) => s.id === sortie)?.nom}`);
      if (sortie === "txt") {
        setResultat(resultatDe(`${base} (texte).txt`, new Blob([texte.trim() + "\n"], { type: "text/plain;charset=utf-8" }), "txt", "text/plain"));
        return;
      }
      if (sortie === "pdf") {
        const { pdfCherchable } = await import("@/lib/alambic/navigateur/ocr");
        const source = estPdf ? { pdf: new Uint8Array(await fichiers[0].fichier.arrayBuffer()) } : { images: fichiers };
        const r = await pdfCherchable(source, pages, base);
        const avertissements = ["Le texte reconnu est posé, invisible, sur chaque page : il se cherche (Ctrl+F) et se sélectionne. Les corrections faites dans le texte ci-dessus ne s'y reportent pas."];
        if (r.absents > 0) avertissements.push(`${r.absents} ligne${r.absents > 1 ? "s" : ""} en écriture non latine (arabe, par exemple) ne ${r.absents > 1 ? "sont" : "est"} pas cherchable${r.absents > 1 ? "s" : ""} dans le PDF : récupère-les dans l'export Word ou Texte.`);
        setResultat(resultatDe(`${base} (cherchable).pdf`, r.octets, "pdf", "application/pdf", avertissements));
        return;
      }
      const { ecrireDocument } = await import("@/lib/alambic/navigateur/documents");
      const ecrit = await ecrireDocument(documentDuTexte(texte), sortie, base);
      setResultat({ nom: `${base} (texte).${sortie}`, blob: ecrit.blob, format: sortie, avertissements: ecrit.avertissements });
    });

  const ouvrirDansCalame = async () => {
    const [depot, modele, schema] = await Promise.all([import("@/lib/atelier/depot"), import("@/lib/atelier/modele"), import("@/lib/document-schema")]);
    const doc = modele.documentVide(depot.nouvelIdentifiant(), base.slice(0, 200) || "Texte reconnu");
    doc.contenu = documentDuTexte(texte) as never;
    const brut = schema.texteDuDocument(doc.contenu);
    doc.mots = schema.compterMots(brut);
    doc.signes = brut.length;
    await depot.ecrireDocument(doc);
    try {
      window.localStorage.setItem((await import("@/lib/client/compte")).tiroir("calame-dernier-document"), doc.id);
    } catch {}
    router.push("/ecrire");
  };

  const mots = texte.split(/\s+/).filter(Boolean).length;
  const ocr = pages?.filter((p) => !p.deja) ?? [];
  const confiance = ocr.length ? Math.round(ocr.reduce((s, p) => s + (p.confiance ?? 0), 0) / ocr.length) : null;

  return (
    <section className="alambic-outil" aria-labelledby="titre-reconnaitre">
      <EnTeteOutil Icone={ScanText} titre="Reconnaître le texte" id="titre-reconnaitre">
        Une photo de document, un scan ou un PDF scanné devient du texte à copier, à corriger, à mettre en Word, ou un PDF où l&apos;on peut chercher. La lecture se fait sur ton appareil.
      </EnTeteOutil>

      {fichiers.length ? (
        <div className="alambic-fichier">
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold">{fichiers.map((f) => f.fichier.name).join(", ")}</span>
            <span className="text-sm text-encre-douce">
              {estPdf ? `PDF, ${tailleLisible(fichiers[0].fichier.size)}` : `${fichiers.length} image${fichiers.length > 1 ? "s" : ""} (${fichiers.map((f) => nomDuFormat(f.format)).filter((v, i, a) => a.indexOf(v) === i).join(", ")}), une page chacune`}
            </span>
          </span>
          <button
            type="button"
            className="bouton-icone"
            aria-label="Retirer"
            disabled={travail !== null}
            onClick={() => {
              setFichiers([]);
              setPages(null);
              setResultat(null);
            }}
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <ZoneDepot titre="Dépose une photo, un scan ou un PDF" aide="Plusieurs photos deviennent plusieurs pages, dans l'ordre choisi." multiple accept=".pdf,image/*" onFichiers={(f) => void charger(f)} />
      )}
      {refuses.length > 0 && <p className="message">Ni image, ni PDF : {refuses.join(", ")}.</p>}

      {fichiers.length > 0 && !pages && (
        <>
          <div className="alambic-option" role="group" aria-label="Langues du document">
            <span>Langues</span>
            <div className="alambic-segments">
              {LANGUES.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  aria-pressed={langues.includes(l.id)}
                  onClick={() => setLangues((ls) => (ls.includes(l.id) ? (ls.length > 1 ? ls.filter((x) => x !== l.id) : ls) : [...ls, l.id]))}
                >
                  {l.nom}
                </button>
              ))}
            </div>
            <span className="w-full text-sm text-encre-douce">Coche seulement les langues présentes : la lecture est plus juste et plus rapide.</span>
          </div>
          {estPdf && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={forcer} onChange={(e) => setForcer(e.target.checked)} />
              Relire aussi les pages qui contiennent déjà du texte
            </label>
          )}
          <div className="alambic-actions">
            {travail ? (
              <Progression travail={travail} onAnnuler={annuler} />
            ) : (
              <button type="button" className="bouton bouton-principal alambic-lancer" onClick={() => void lire()}>
                <ScanText className="size-5" aria-hidden="true" />
                Reconnaître le texte
                <MarquePremium fonction="alambic.reconnaitre" />
              </button>
            )}
          </div>
        </>
      )}

      {pages && (
        <div className="alambic-lu">
          <div className="alambic-lu-tete">
            <p className="text-sm text-encre-douce">
              {mots} mot{mots > 1 ? "s" : ""} sur {pages.length} page{pages.length > 1 ? "s" : ""}
              {confiance !== null ? `, lecture sûre à ${confiance} %` : ""}
              {pages.some((p) => p.deja) ? ` ; ${pages.filter((p) => p.deja).length} page(s) avaient déjà du texte` : ""}
            </p>
            <button
              type="button"
              className="bouton bouton-discret !min-h-10"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(texte);
                  setCopie(true);
                  setTimeout(() => setCopie(false), 1800);
                } catch {}
              }}
            >
              {copie ? <Check className="size-4 text-succes" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
              {copie ? "Copié" : "Copier le texte"}
            </button>
          </div>
          {confiance !== null && confiance < 70 && <p className="message">La lecture est incertaine (photo floue, penchée ou sombre ?) : relis bien le texte, ou reprends une photo bien à plat et éclairée.</p>}
          {!mots && <p className="message">Aucun texte n&apos;a été trouvé. Vérifie la langue choisie, ou que la page contient bien du texte imprimé (l&apos;écriture manuscrite se lit mal).</p>}
          <label className="sr-only" htmlFor="texte-reconnu">
            Texte reconnu, modifiable
          </label>
          <textarea id="texte-reconnu" className="champ alambic-lu-texte" value={texte} onChange={(e) => { setTexte(e.target.value); setResultat(null); }} dir="auto" spellCheck />
          <div className="alambic-option" role="radiogroup" aria-label="Format">
            <span>Format</span>
            <div className="alambic-segments">
              {SORTIES.map((s) => (
                <button key={s.id} type="button" role="radio" aria-checked={sortie === s.id} onClick={() => { setSortie(s.id); setResultat(null); }}>
                  {s.nom}
                </button>
              ))}
            </div>
          </div>
          <div className="alambic-actions">
            {travail ? (
              <Progression travail={travail} />
            ) : (
              <button type="button" className="bouton bouton-principal alambic-lancer" onClick={() => void exporter()} disabled={!mots && sortie !== "pdf"}>
                <Download className="size-5" aria-hidden="true" />
                {sortie === "pdf" ? "Créer le PDF cherchable" : `Créer le fichier ${SORTIES.find((s) => s.id === sortie)?.nom}`}
              </button>
            )}
            {accesComplet && mots > 0 && !travail && (
              <button type="button" className="bouton bouton-discret" onClick={() => void ouvrirDansCalame().catch(setErreur)} title="Le texte s'ouvre comme un nouveau document du Calame, pour le relire et le mettre en forme.">
                <Feather className="size-4" aria-hidden="true" />
                Ouvrir dans Le Calame
              </button>
            )}
          </div>
        </div>
      )}

      <MessageErreur erreur={erreur} fichier={fichiers[0]?.fichier} />
      {resultat && <CarteResultat resultat={resultat} protege={false} />}

      <BonASavoir
        points={[
          "Pour une photo de document : bien à plat, de face, sans reflet ni ombre ; plus le texte est grand dans l'image, mieux il se lit.",
          "Les pages d'un PDF qui contiennent déjà du texte ne sont pas relues : c'est plus rapide et plus exact.",
          "Le PDF cherchable garde les pages telles quelles : le texte reconnu est posé dessous, invisible, pour la recherche et le copier-coller.",
          "La lecture se fait sur ton appareil : la première fois, le dictionnaire de chaque langue se charge (quelques secondes).",
        ]}
      />
    </section>
  );
}
