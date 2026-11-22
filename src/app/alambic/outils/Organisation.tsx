"use client";

import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDownUp, CheckCheck, Copy, GripVertical, LayoutGrid, RotateCcw, RotateCw, Save, SquareDashed, Trash2, Undo2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { format as formatDe, tailleLisible } from "@/lib/alambic/formats";
import type { Resultat } from "@/lib/alambic/navigateur/moteur";
import { deplacer, dupliquer, estIntacte, insererBlanche, inverser, pagesDe, pivoter, placeBlanche, retirer, type PageOrdonnee } from "@/lib/alambic/pages";
import { CarteResultat } from "../CarteResultat";
import { ChampProtection } from "../ChampProtection";
import { BonASavoir, EnTeteOutil, MessageErreur, Progression, reconnaitreTous, resultatDe, sansExtension, useTravail, ZoneDepot } from "../commun";
import { useReception, type Abonner } from "../reception";
import { VignettePdf, type DocPdf } from "./VignettePdf";

type Source = { id: string; nom: string; octets: Uint8Array; doc: DocPdf; fermer: () => Promise<void>; pages: number; taille: number };
const IMAGES = new Set(["png", "jpg", "webp", "gif", "bmp", "tiff", "svg"]);
const MAX_HISTORIQUE = 40;

function Carte({
  page,
  rang,
  doc,
  choisie,
  onBasculer,
  onPivoter,
  onRetirer,
}: {
  page: PageOrdonnee;
  rang: number;
  doc: DocPdf | null;
  choisie: boolean;
  onBasculer: () => void;
  onPivoter: (quart: 1 | -1) => void;
  onRetirer: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.cle });
  const libelle = page.source === null ? `Page ${rang + 1}, page blanche` : `Page ${rang + 1}${page.rotation ? `, pivotée de ${page.rotation}°` : ""}`;
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className="alambic-orga-page" data-choisie={choisie || undefined} data-glisse={isDragging || undefined}>
      <button
        type="button"
        className="alambic-orga-vignette"
        aria-pressed={choisie}
        aria-label={`${libelle}${choisie ? ", choisie" : ""}`}
        onClick={onBasculer}
        onKeyDown={(e) => {
          if (e.key === "Delete" || e.key === "Backspace") {
            e.preventDefault();
            onRetirer();
          }
        }}
      >
        <span className="alambic-orga-cadre">
          {page.source === null || !doc ? (
            <span className="alambic-orga-blanche" style={{ aspectRatio: page.taille ? `${page.taille[0]} / ${page.taille[1]}` : "1 / 1.414" }}>
              Page blanche
            </span>
          ) : (
            <VignettePdf doc={doc} numero={page.index + 1} largeur={180} style={{ transform: `rotate(${page.rotation}deg)` }} />
          )}
        </span>
        {choisie && <CheckCheck className="alambic-orga-coche" aria-hidden="true" />}
      </button>
      <span className="alambic-orga-pied">
        <button type="button" className="alambic-orga-poignee" aria-label={`Déplacer la page ${rang + 1}`} title="Glisser pour déplacer" {...attributes} {...listeners}>
          <GripVertical className="size-4" aria-hidden="true" />
        </button>
        <span className="alambic-orga-numero">{rang + 1}</span>
        <button type="button" className="bouton-icone !size-8" onClick={() => onPivoter(-1)} aria-label={`Pivoter la page ${rang + 1} vers la gauche`} title="Pivoter à gauche">
          <RotateCcw className="size-4" aria-hidden="true" />
        </button>
        <button type="button" className="bouton-icone !size-8" onClick={() => onPivoter(1)} aria-label={`Pivoter la page ${rang + 1} vers la droite`} title="Pivoter à droite">
          <RotateCw className="size-4" aria-hidden="true" />
        </button>
        <button type="button" className="bouton-icone !size-8" onClick={onRetirer} aria-label={`Retirer la page ${rang + 1}`} title="Retirer">
          <Trash2 className="size-4" aria-hidden="true" />
        </button>
      </span>
    </li>
  );
}

export function Organisation({ abonner }: { abonner: Abonner }) {
  const [sources, setSources] = useState<Source[]>([]);
  const [pages, setPages] = useState<PageOrdonnee[]>([]);
  const [choisies, setChoisies] = useState<Set<string>>(new Set());
  const [historique, setHistorique] = useState<PageOrdonnee[][]>([]);
  const [verrouille, setVerrouille] = useState<File | null>(null);
  const [refuses, setRefuses] = useState<string[]>([]);
  const [proteger, setProteger] = useState(false);
  const [motDePasse, setMotDePasse] = useState("");
  const [resultat, setResultat] = useState<Resultat | null>(null);
  const { travail, erreur, setErreur, lancer } = useTravail();
  const sourcesRef = useRef<Source[]>([]);
  const capteurs = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  useEffect(() => {
    sourcesRef.current = sources;
  }, [sources]);
  useEffect(() => () => sourcesRef.current.forEach((s) => void s.fermer()), []);

  /** Toute modification passe par ici : elle peut être annulée. */
  const modifier = (suivantes: PageOrdonnee[]) => {
    setHistorique((h) => [...h.slice(-MAX_HISTORIQUE + 1), pages]);
    setPages(suivantes);
    setResultat(null);
  };

  const ouvrirUn = async (f: File, mdp?: string): Promise<Source | null> => {
    const [{ ouvrir, dechiffrer }, [{ format }]] = await Promise.all([import("@/lib/alambic/navigateur/pdf"), reconnaitreTous([f])]);
    let octets: Uint8Array = new Uint8Array(await f.arrayBuffer());
    if (format && IMAGES.has(format)) {
      // Une image (une page scannée, une photo) devient une page à sa taille.
      const [{ PDFDocument }, { imageEnPage }] = await Promise.all([import("@cantoo/pdf-lib"), import("@/lib/alambic/navigateur/pdf")]);
      const pdf = await PDFDocument.create();
      await imageEnPage(pdf, f, format);
      octets = await pdf.save();
    } else if (format !== "pdf") {
      setRefuses((r) => [...r, f.name]);
      return null;
    }
    if (mdp !== undefined) octets = await dechiffrer(octets, mdp);
    const { doc, fermer } = await ouvrir(octets);
    return { id: crypto.randomUUID(), nom: f.name, octets, doc, fermer, pages: doc.numPages, taille: f.size };
  };

  const ajouter = async (fichiers: File[], mdp?: string) => {
    setRefuses([]);
    await lancer(async (avancer) => {
      const nouvelles: Source[] = [];
      for (let i = 0; i < fichiers.length; i++) {
        avancer(i / fichiers.length, `Ouverture de « ${fichiers[i].name} »`);
        try {
          const s = await ouvrirUn(fichiers[i], i === 0 ? mdp : undefined);
          if (s) nouvelles.push(s);
        } catch (e) {
          if ((e as Error).name === "PdfProtege") setVerrouille(fichiers[i]);
          throw e;
        }
      }
      if (!nouvelles.length) return;
      setVerrouille(null);
      setSources((s) => [...s, ...nouvelles]);
      const ajoutees = nouvelles.flatMap((s) => pagesDe(s.id, s.pages));
      if (pages.length) modifier([...pages, ...ajoutees]);
      else {
        setPages(ajoutees);
        setHistorique([]);
        setResultat(null);
      }
    });
  };

  useReception(abonner, (fichiers) => void ajouter(fichiers));

  const vider = () => {
    sources.forEach((s) => void s.fermer());
    setSources([]);
    setPages([]);
    setChoisies(new Set());
    setHistorique([]);
    setResultat(null);
    setErreur(null);
    setVerrouille(null);
  };

  const basculer = (cle: string) =>
    setChoisies((c) => {
      const n = new Set(c);
      if (n.has(cle)) n.delete(cle);
      else n.add(cle);
      return n;
    });

  const annuler = () => {
    const precedente = historique[historique.length - 1];
    if (!precedente) return;
    setHistorique((h) => h.slice(0, -1));
    setPages(precedente);
    setResultat(null);
  };

  const fin = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    modifier(deplacer(pages, pages.findIndex((p) => p.cle === e.active.id), pages.findIndex((p) => p.cle === e.over!.id)));
  };

  /** Taille visible (points) de la page avant la place d'une page blanche : la blanche lui ressemble. */
  const ajouterBlanche = async () => {
    const place = placeBlanche(pages, choisies);
    const voisine = pages[place - 1] ?? pages[place];
    let taille: [number, number] | undefined;
    const source = voisine?.source ? sources.find((s) => s.id === voisine.source) : null;
    if (voisine?.source === null) taille = voisine.taille;
    else if (source && voisine) {
      try {
        const vue = (await source.doc.getPage(voisine.index + 1)).getViewport({ scale: 1 });
        taille = [vue.width, vue.height];
      } catch {}
    }
    modifier(insererBlanche(pages, place, taille));
  };

  const enregistrer = () =>
    lancer(async (avancer) => {
      setResultat(null);
      const [{ charger }, { ecrireOrganise }] = await Promise.all([import("@/lib/alambic/navigateur/pdf"), import("@/lib/alambic/organiser-pdf")]);
      const utilisees = sources.filter((s) => pages.some((p) => p.source === s.id));
      const docs = new Map();
      for (let i = 0; i < utilisees.length; i++) {
        avancer((i / Math.max(1, utilisees.length)) * 0.4, `Lecture de « ${utilisees[i].nom} »`);
        docs.set(utilisees[i].id, await charger(utilisees[i].octets));
      }
      avancer(0.5, `Assemblage de ${pages.length} page${pages.length > 1 ? "s" : ""}`);
      const base = sansExtension(sources[0]?.nom ?? "Document");
      const octets = await ecrireOrganise(docs, pages, base);
      let r = resultatDe(`${base} (organisé).pdf`, octets, "pdf", "application/pdf");
      if (proteger && motDePasse) {
        const { proteger: chiffrer } = await import("@/lib/alambic/navigateur/moteur");
        r = await chiffrer(r, motDePasse, avancer);
      }
      setResultat(r);
    });

  const docDe = (p: PageOrdonnee) => (p.source ? (sources.find((s) => s.id === p.source)?.doc ?? null) : null);
  const n = choisies.size;
  const intacte = sources.length === 1 && estIntacte(pages, sources[0].id, sources[0].pages);
  const enCours = travail !== null;

  return (
    <section className="alambic-outil" aria-labelledby="titre-organiser">
      <EnTeteOutil Icone={LayoutGrid} titre="Organiser les pages d'un PDF" id="titre-organiser">
        Pivote, déplace, retire ou duplique des pages ; ajoute une page blanche, une page scannée ou les pages d&apos;un autre PDF.
      </EnTeteOutil>

      {!sources.length ? (
        <ZoneDepot titre="Dépose un PDF" aide="ou clique pour le choisir. Une photo ou un scan devient une page." multiple accept=".pdf,image/*" onFichiers={(f) => void ajouter(f)} desactive={enCours} />
      ) : (
        <div className="alambic-fichier">
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold">{sources.map((s) => s.nom).join(", ")}</span>
            <span className="text-sm text-encre-douce">
              {pages.length} page{pages.length > 1 ? "s" : ""}
              {sources.length === 1 ? `, ${tailleLisible(sources[0].taille)}` : `, de ${sources.length} fichiers`}
            </span>
          </span>
          <button type="button" className="bouton-icone" aria-label="Tout retirer et recommencer" onClick={vider} disabled={enCours}>
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
      )}

      {verrouille && <MessageErreur erreur={erreur} onMotDePasse={(mdp) => ajouter([verrouille], mdp)} />}

      {pages.length > 0 && (
        <>
          <div className="alambic-orga-barre" role="toolbar" aria-label="Actions sur les pages">
            <span className="alambic-orga-portee">{n ? `${n} page${n > 1 ? "s" : ""} choisie${n > 1 ? "s" : ""}` : "Toutes les pages"}</span>
            <button type="button" className="bouton bouton-discret !min-h-10" onClick={() => modifier(pivoter(pages, choisies, -1))} disabled={enCours}>
              <RotateCcw className="size-4" aria-hidden="true" />
              À gauche
            </button>
            <button type="button" className="bouton bouton-discret !min-h-10" onClick={() => modifier(pivoter(pages, choisies, 1))} disabled={enCours}>
              <RotateCw className="size-4" aria-hidden="true" />
              À droite
            </button>
            {n > 0 && (
              <>
                <button type="button" className="bouton bouton-discret !min-h-10" onClick={() => modifier(dupliquer(pages, choisies))} disabled={enCours}>
                  <Copy className="size-4" aria-hidden="true" />
                  Dupliquer
                </button>
                <button
                  type="button"
                  className="bouton bouton-discret !min-h-10"
                  onClick={() => {
                    modifier(retirer(pages, choisies));
                    setChoisies(new Set());
                  }}
                  disabled={enCours || n === pages.length}
                  title={n === pages.length ? "Garde au moins une page" : undefined}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Retirer
                </button>
              </>
            )}
            <button type="button" className="bouton bouton-discret !min-h-10" onClick={() => void ajouterBlanche()} disabled={enCours}>
              <SquareDashed className="size-4" aria-hidden="true" />
              Page blanche
            </button>
            <button type="button" className="bouton bouton-discret !min-h-10" onClick={() => modifier(inverser(pages))} disabled={enCours || pages.length < 2}>
              <ArrowDownUp className="size-4" aria-hidden="true" />
              Inverser l&apos;ordre
            </button>
            <button type="button" className="bouton bouton-discret !min-h-10" onClick={() => setChoisies(n === pages.length ? new Set() : new Set(pages.map((p) => p.cle)))}>
              {n === pages.length ? "Aucune" : "Tout choisir"}
            </button>
            <button type="button" className="bouton bouton-discret !min-h-10" onClick={annuler} disabled={!historique.length || enCours} title="Annuler la dernière modification">
              <Undo2 className="size-4" aria-hidden="true" />
              Annuler
            </button>
          </div>

          <DndContext sensors={capteurs} collisionDetection={closestCenter} onDragEnd={fin}>
            <SortableContext items={pages.map((p) => p.cle)} strategy={rectSortingStrategy}>
              <ol className="alambic-orga-grille">
                {pages.map((p, i) => (
                  <Carte
                    key={p.cle}
                    page={p}
                    rang={i}
                    doc={docDe(p)}
                    choisie={choisies.has(p.cle)}
                    onBasculer={() => basculer(p.cle)}
                    onPivoter={(q) => modifier(pivoter(pages, new Set([p.cle]), q))}
                    onRetirer={() => {
                      if (pages.length > 1) modifier(retirer(pages, new Set([p.cle])));
                    }}
                  />
                ))}
              </ol>
            </SortableContext>
          </DndContext>

          <ZoneDepot compact multiple titre="Ajouter des pages" aide="Un autre PDF, une photo ou un scan, à la suite" accept=".pdf,image/*" onFichiers={(f) => void ajouter(f)} desactive={enCours} />
        </>
      )}

      {refuses.length > 0 && <p className="message">Non repris (ni PDF, ni image) : {refuses.join(", ")}.</p>}

      {pages.length > 0 && (
        <>
          <ChampProtection actif={proteger} onActif={setProteger} motDePasse={motDePasse} onMotDePasse={setMotDePasse} formatPdf={proteger ? true : null} />
          <div className="alambic-actions">
            {travail ? (
              <Progression travail={travail} />
            ) : (
              <button type="button" className="bouton bouton-principal alambic-lancer" onClick={() => void enregistrer()} disabled={(proteger && !motDePasse) || (intacte && !proteger)}>
                <Save className="size-5" aria-hidden="true" />
                {intacte && !proteger ? "Aucune modification pour l'instant" : `Enregistrer le PDF (${pages.length} page${pages.length > 1 ? "s" : ""})`}
              </button>
            )}
          </div>
        </>
      )}

      {travail && !pages.length && <Progression travail={travail} />}
      {!verrouille && <MessageErreur erreur={erreur} />}
      {resultat && <CarteResultat resultat={resultat} tailleAvant={sources.length === 1 ? sources[0].taille : undefined} protege={proteger && Boolean(motDePasse)} />}

      <BonASavoir
        points={[
          "Touche une page pour la choisir : les boutons du haut agissent alors sur les pages choisies, sinon sur toutes.",
          "Pour déplacer une page, fais-la glisser par sa poignée ; au clavier : Espace pour la prendre, les flèches, puis Espace pour la poser.",
          "Scan recto verso fait en deux passes ? Ajoute les versos à la suite, puis remets-les en place en les faisant glisser.",
          `Le PDF garde sa qualité d'origine : les pages sont recopiées telles quelles, rien n'est réimprimé. Formats acceptés pour ajouter : PDF et images (${["png", "jpg", "webp"].map((f) => formatDe(f).nom).join(", ")}…).`,
        ]}
      />
    </section>
  );
}

