"use client";

import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, FilePlus2, GripVertical, Layers, LoaderCircle, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { format, tailleLisible } from "@/lib/alambic/formats";
import type { Resultat } from "@/lib/alambic/navigateur/moteur";
import { CarteResultat } from "./CarteResultat";
import { ChampProtection } from "./ChampProtection";
import { BonASavoir, MessageErreur } from "./commun";
import { utiliser } from "@/lib/client/premium";
import { MarquePremium } from "@/components/premium/MarquePremium";
import { useReception, type Abonner } from "./reception";
import { ICONES } from "./SelecteurFormat";

const ACCEPTES = new Set(["pdf", "png", "jpg", "webp", "gif", "bmp", "tiff", "svg", "ico", "heic", "avif", "docx", "odt", "rtf", "txt", "md", "html", "epub"]);
const IMAGES = new Set(["png", "jpg", "webp", "gif", "bmp", "tiff", "svg", "ico", "heic", "avif"]);

type Piece = { id: string; fichier: File; format: string; vignette: string | null; pages: number | null };

function Ligne({ piece, rang, total, onMonter, onDescendre, onRetirer }: { piece: Piece; rang: number; total: number; onMonter: () => void; onDescendre: () => void; onRetirer: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: piece.id });
  const Icone = ICONES[format(piece.format).famille];
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className="alambic-piece" data-glisse={isDragging || undefined}>
      <button type="button" className="alambic-poignee" aria-label={`Déplacer ${piece.fichier.name}`} {...attributes} {...listeners}>
        <GripVertical className="size-5" aria-hidden="true" />
      </button>
      <span className="alambic-piece-rang" aria-hidden="true">
        {rang + 1}
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element -- vignette locale (blob:) */}
      <span className="alambic-piece-vignette">{piece.vignette ? <img src={piece.vignette} alt="" /> : <Icone className="size-6 text-encre-douce" aria-hidden="true" />}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{piece.fichier.name}</span>
        <span className="text-sm text-encre-douce">
          {format(piece.format).nom}, {tailleLisible(piece.fichier.size)}
          {piece.pages ? `, ${piece.pages} page${piece.pages > 1 ? "s" : ""}` : ""}
        </span>
      </span>
      <button type="button" className="bouton-icone !size-9" onClick={onMonter} disabled={rang === 0} aria-label="Monter">
        <ArrowUp className="size-4" aria-hidden="true" />
      </button>
      <button type="button" className="bouton-icone !size-9" onClick={onDescendre} disabled={rang === total - 1} aria-label="Descendre">
        <ArrowDown className="size-4" aria-hidden="true" />
      </button>
      <button type="button" className="bouton-icone !size-9" onClick={onRetirer} aria-label={`Retirer ${piece.fichier.name}`}>
        <X className="size-4" aria-hidden="true" />
      </button>
    </li>
  );
}

export function Fusion({ abonner }: { abonner: Abonner }) {
  const [pieces, setPieces] = useState<Piece[]>([]);
  // Liens des vignettes : libérés quand un fichier est retiré, et tous en quittant l'outil.
  const liensVignettes = useRef(new Set<string>());
  useEffect(() => {
    const liens = liensVignettes.current;
    return () => liens.forEach((u) => URL.revokeObjectURL(u));
  }, []);
  const libererVignette = (url: string | null) => {
    if (!url) return;
    URL.revokeObjectURL(url);
    liensVignettes.current.delete(url);
  };
  const [refuses, setRefuses] = useState<string[]>([]);
  const [nom, setNom] = useState("Document fusionné");
  const [proteger, setProteger] = useState(false);
  const [pagesImages, setPagesImages] = useState<"image" | "a4">("image");
  const [signets, setSignets] = useState(true);
  const [numeroter, setNumeroter] = useState(false);
  const [motDePasse, setMotDePasse] = useState("");
  const [travail, setTravail] = useState<{ avancement: number; etape: string } | null>(null);
  const [resultat, setResultat] = useState<Resultat | null>(null);
  const [erreur, setErreur] = useState<unknown>(null);
  const [fichierFautif, setFichierFautif] = useState<File | null>(null);
  const choix = useRef<HTMLInputElement>(null);
  const capteurs = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const ajouter = async (fichiers: File[]) => {
    const { reconnaitre } = await import("@/lib/alambic/navigateur/moteur");
    const nouvelles: Piece[] = [];
    const rejets: string[] = [];
    for (const f of fichiers) {
      const id = await reconnaitre(f);
      if (!id || !ACCEPTES.has(id)) {
        rejets.push(f.name);
        continue;
      }
      nouvelles.push({ id: crypto.randomUUID(), fichier: f, format: id, vignette: null, pages: null });
    }
    setRefuses(rejets);
    setResultat(null);
    setPieces((p) => [...p, ...nouvelles]);
    // Vignettes et nombre de pages, sans bloquer la liste.
    for (const piece of nouvelles) {
      try {
        if (IMAGES.has(piece.format)) {
          const { vignette } = await import("@/lib/alambic/navigateur/images");
          const url = await vignette(piece.fichier, piece.format, 96);
          liensVignettes.current.add(url);
          setPieces((p) => p.map((x) => (x.id === piece.id ? { ...x, vignette: url } : x)));
        } else if (piece.format === "pdf") {
          const { ouvrir, vignettePage } = await import("@/lib/alambic/navigateur/pdf");
          const { doc, fermer } = await ouvrir(new Uint8Array(await piece.fichier.arrayBuffer()));
          const url = await vignettePage(doc, 1, 96);
          liensVignettes.current.add(url);
          const pages = doc.numPages;
          await fermer();
          setPieces((p) => p.map((x) => (x.id === piece.id ? { ...x, vignette: url, pages } : x)));
        }
      } catch {
        // Vignette impossible (PDF protégé…) : l'erreur claire viendra à la fusion.
      }
    }
  };

  useReception(abonner, (fichiers) => void ajouter(fichiers));

  const deplacer = (de: number, vers: number) => {
    setResultat(null);
    setPieces((p) => arrayMove(p, de, vers));
  };

  const fin = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const de = pieces.findIndex((p) => p.id === e.active.id);
    const vers = pieces.findIndex((p) => p.id === e.over!.id);
    deplacer(de, vers);
  };

  const fusionner = async () => {
    if (!(await utiliser("alambic.fusionner"))) return;
    setErreur(null);
    setFichierFautif(null);
    setResultat(null);
    // Le bouton se désactive dès le clic, avant même que le module soit chargé : pas de double lancement.
    setTravail({ avancement: 0, etape: "Préparation" });
    try {
      const [{ assembler, assemblerAvecSignets, imageEnPage, imageSurA4 }, { PDFDocument }] = await Promise.all([import("@/lib/alambic/navigateur/pdf"), import("@cantoo/pdf-lib")]);
      const pdfs: Uint8Array[] = [];
      for (let i = 0; i < pieces.length; i++) {
        const p = pieces[i];
        setTravail({ avancement: (i / pieces.length) * 0.8, etape: `Préparation de « ${p.fichier.name} »` });
        setFichierFautif(p.fichier);
        if (p.format === "pdf") {
          // Vérifié dès maintenant : un PDF protégé est nommé, et peut être déverrouillé sur place.
          const { charger } = await import("@/lib/alambic/navigateur/pdf");
          try {
            await charger(new Uint8Array(await p.fichier.arrayBuffer()));
          } catch (e) {
            throw Object.assign(new Error(`« ${p.fichier.name} » : ${(e as Error).message}`), { name: (e as Error).name });
          }
          pdfs.push(new Uint8Array(await p.fichier.arrayBuffer()));
        }
        else if (IMAGES.has(p.format)) {
          const doc = await PDFDocument.create();
          if (pagesImages === "a4") await imageSurA4(doc, p.fichier, p.format);
          else await imageEnPage(doc, p.fichier, p.format);
          pdfs.push(await doc.save());
        } else {
          const { lireDocument, ecrireDocument } = await import("@/lib/alambic/navigateur/documents");
          const lu = await lireDocument(p.fichier.name, p.format, p.fichier, () => {});
          const { blob } = await ecrireDocument(lu.doc, "pdf", lu.titre);
          pdfs.push(new Uint8Array(await blob.arrayBuffer()));
        }
      }
      setTravail({ avancement: 0.85, etape: "Assemblage" });
      let octets: Uint8Array;
      try {
        const avancer = (f: number) => setTravail({ avancement: 0.85 + f * 0.1, etape: "Assemblage" });
        octets = signets && pieces.length > 1 ? await assemblerAvecSignets(pdfs.map((o, k) => ({ octets: o, titre: pieces[k].fichier.name.replace(/\.[^.]+$/, "") })), avancer) : await assembler(pdfs, avancer);
      } catch (e) {
        throw new Error((e as Error).message);
      }
      let r: Resultat = { nom: `${nom.trim() || "Document fusionné"}.pdf`, blob: new Blob([octets.slice().buffer], { type: "application/pdf" }), format: "pdf", avertissements: signets && pieces.length > 1 ? ["Un signet par fichier : le volet « Signets » du lecteur PDF mène au début de chacun."] : [] };
      if (numeroter) {
        setTravail({ avancement: 0.96, etape: "Numérotation des pages" });
        const { marquerPdf } = await import("@/lib/alambic/navigateur/filigraner");
        const numerote = await marquerPdf(r.blob, r.nom, { filigrane: null, numeros: { format: "n/t", position: "bas-centre", debut: 1, sansPremiere: false }, inseparable: false }, () => {});
        r = { ...r, blob: numerote.blob };
      }
      if (proteger && motDePasse) {
        const { proteger: chiffrer } = await import("@/lib/alambic/navigateur/moteur");
        r = await chiffrer(r, motDePasse, (a, etape) => setTravail({ avancement: a ?? 0.97, etape }));
      }
      setResultat(r);
    } catch (e) {
      setErreur(e);
    } finally {
      setTravail(null);
    }
  };

  return (
    <section className="alambic-outil" aria-labelledby="titre-fusion">
      <header className="alambic-outil-tete">
        <Layers className="size-7 text-or" strokeWidth={1.4} aria-hidden="true" />
        <div>
          <h2 id="titre-fusion" className="font-display text-2xl font-bold">
            Fusionner en un seul PDF <MarquePremium fonction="alambic.fusionner" />
          </h2>
          <p className="text-encre-douce">PDF, images, Word, OpenDocument, texte… Chaque fichier est mis en pages, puis tout est réuni dans l&apos;ordre que tu choisis.</p>
        </div>
      </header>

      <input
        ref={choix}
        type="file"
        multiple
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          void ajouter([...(e.target.files ?? [])]);
          e.target.value = "";
        }}
      />

      <div
        className="alambic-liste-zone"
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes("Files")) e.preventDefault();
        }}
        onDrop={(e) => {
          if (!e.dataTransfer.files.length) return;
          e.preventDefault();
          void ajouter([...e.dataTransfer.files]);
        }}
      >
        {pieces.length > 0 && (
          <DndContext sensors={capteurs} collisionDetection={closestCenter} onDragEnd={fin}>
            <SortableContext items={pieces.map((p) => p.id)} strategy={verticalListSortingStrategy}>
              <ol className="alambic-pieces">
                {pieces.map((p, i) => (
                  <Ligne
                    key={p.id}
                    piece={p}
                    rang={i}
                    total={pieces.length}
                    onMonter={() => deplacer(i, i - 1)}
                    onDescendre={() => deplacer(i, i + 1)}
                    onRetirer={() => {
                      setResultat(null);
                      libererVignette(p.vignette);
                      setPieces((x) => x.filter((y) => y.id !== p.id));
                    }}
                  />
                ))}
              </ol>
            </SortableContext>
          </DndContext>
        )}
        <button type="button" className="alambic-depot alambic-depot-compact" onClick={() => choix.current?.click()}>
          <FilePlus2 className="size-6 text-or" strokeWidth={1.4} aria-hidden="true" />
          <span className="font-semibold">{pieces.length ? "Ajouter d'autres fichiers" : "Dépose ou choisis les fichiers à réunir"}</span>
          {!pieces.length && <span className="text-sm text-encre-douce">Plusieurs à la fois ; tu les remettras dans l&apos;ordre en les faisant glisser.</span>}
        </button>
      </div>

      {refuses.length > 0 && (
        <p className="message">
          Non repris (ni document, ni image, ni PDF) : {refuses.join(", ")}.
        </p>
      )}

      {pieces.length > 0 && (
        <>
          <label className="alambic-option">
            <span>Nom du PDF</span>
            <input className="champ" value={nom} onChange={(e) => setNom(e.target.value)} maxLength={120} />
          </label>
          {pieces.some((p) => IMAGES.has(p.format)) && (
            <div className="alambic-option" role="radiogroup" aria-label="Pages des images">
              <span>Images</span>
              <div className="alambic-segments">
                <button type="button" role="radio" aria-checked={pagesImages === "image"} onClick={() => setPagesImages("image")}>
                  Page à la taille de l&apos;image
                </button>
                <button type="button" role="radio" aria-checked={pagesImages === "a4"} onClick={() => setPagesImages("a4")}>
                  Page A4, avec marge
                </button>
              </div>
              {pagesImages === "a4" && <span className="w-full text-sm text-encre-douce">Chaque photo est centrée sur une page A4 (en paysage si elle est plus large que haute) : idéal pour imprimer des tickets ou des justificatifs.</span>}
            </div>
          )}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {pieces.length > 1 && (
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={signets} onChange={(e) => setSignets(e.target.checked)} />
                Un signet par fichier
              </label>
            )}
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={numeroter} onChange={(e) => setNumeroter(e.target.checked)} />
              Numéroter les pages
            </label>
          </div>
          <ChampProtection actif={proteger} onActif={setProteger} motDePasse={motDePasse} onMotDePasse={setMotDePasse} formatPdf={proteger ? true : null} />
          <div className="alambic-actions">
            {travail ? (
              <>
                <div className="alambic-progression" role="progressbar" aria-valuenow={Math.round(travail.avancement * 100)} aria-valuemin={0} aria-valuemax={100} aria-label={travail.etape}>
                  <span style={{ width: `${travail.avancement * 100}%` }} />
                </div>
                <p className="alambic-etape">
                  <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                  {travail.etape}
                </p>
              </>
            ) : (
              <button type="button" className="bouton bouton-principal alambic-lancer" disabled={pieces.length < 1 || (proteger && !motDePasse)} onClick={() => void fusionner()}>
                <Layers className="size-5" aria-hidden="true" />
                {pieces.length < 2 ? "Mettre en PDF" : `Fusionner les ${pieces.length} fichiers`}
                <MarquePremium fonction="alambic.fusionner" />
              </button>
            )}
          </div>
        </>
      )}
      <MessageErreur erreur={erreur} fichier={fichierFautif} />
      {resultat && <CarteResultat resultat={resultat} protege={proteger && Boolean(motDePasse)} />}

      <BonASavoir
        points={[
          "Fais glisser les fichiers par leur poignée pour choisir l'ordre ; au clavier, Espace puis les flèches.",
          "Un Word, un texte ou une page web sont d'abord mis en pages, puis réunis avec le reste.",
          "Pour retirer ou pivoter des pages ensuite, passe le résultat à « Organiser ».",
        ]}
      />
    </section>
  );
}
