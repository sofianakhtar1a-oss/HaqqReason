"use client";

import { CalendarDays, Check, Minus, MousePointer2, Move, PenLine, Plus, Save, Signature as IconeSignature, Trash2, Type, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { tailleLisible } from "@/lib/alambic/formats";
import type { Resultat } from "@/lib/alambic/navigateur/moteur";
import type { ChampFormulaire, ElementSigne } from "@/lib/alambic/navigateur/signer";
import { borner, dateDuJour, type BoiteVisible } from "@/lib/alambic/signature";
import { CarteResultat } from "../CarteResultat";
import { useAlambic } from "../contexte";
import { BonASavoir, EnTeteOutil, MessageErreur, Progression, reconnaitreTous, resultatDe, sansExtension, useTravail, ZoneDepot } from "../commun";
import { useReception, type Abonner } from "../reception";
import { PadSignature } from "./PadSignature";
import { VignettePdf, type DocPdf } from "./VignettePdf";

type Mode = "signature" | "texte" | "date" | "coche" | "croix" | null;
type TaillePage = { l: number; h: number };
const IMAGES = new Set(["png", "jpg", "webp", "gif", "bmp", "tiff", "heic", "avif"]);
const ENCRES = ["#111827", "#1d3a8a"];
const MAX_GARDEES = 3;
let compteur = 0;
const nouvelId = () => `e${Date.now().toString(36)}${(compteur++).toString(36)}`;

/** Largeur estimée d'un texte (fraction de la page) pour le cadre de sélection. */
const largeurTexte = (texte: string, taille: number, l: number) => Math.max(0.04, ((Math.max(3, texte.length) + 1) * taille * 0.52) / l);

function ElementVue({
  e,
  page,
  choisi,
  onChoisir,
  onChanger,
  onRetirer,
}: {
  e: ElementSigne;
  page: TaillePage;
  choisi: boolean;
  onChoisir: () => void;
  onChanger: (e: ElementSigne) => void;
  onRetirer: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const glisse = useRef<{ x: number; y: number; l: number; h: number; boite: BoiteVisible; taille: number; mode: "deplacer" | "taille" } | null>(null);

  const debut = (ev: React.PointerEvent, mode: "deplacer" | "taille") => {
    ev.stopPropagation();
    onChoisir();
    const cadre = ref.current?.parentElement?.getBoundingClientRect();
    if (!cadre) return;
    glisse.current = { x: ev.clientX, y: ev.clientY, l: cadre.width, h: cadre.height, boite: e.boite, taille: e.genre === "texte" ? e.taille : 0, mode };
    (ev.currentTarget as HTMLElement).setPointerCapture(ev.pointerId);
  };
  const bouger = (ev: React.PointerEvent) => {
    const g = glisse.current;
    if (!g) return;
    const dx = (ev.clientX - g.x) / g.l;
    const dy = (ev.clientY - g.y) / g.h;
    if (g.mode === "deplacer") onChanger({ ...e, boite: borner({ ...g.boite, x: g.boite.x + dx, y: g.boite.y + dy }) } as ElementSigne);
    else if (e.genre === "texte") {
      const taille = Math.max(5, Math.min(72, g.taille * (1 + dx / Math.max(0.05, g.boite.w))));
      onChanger({ ...e, taille, boite: { ...e.boite, w: largeurTexte(e.texte, taille, page.l), h: (taille * 1.3) / page.h } });
    } else {
      const w = Math.max(0.02, g.boite.w + dx);
      // Les proportions sont gardées (signature, coche) : la hauteur suit la largeur.
      onChanger({ ...e, boite: borner({ ...g.boite, w, h: g.boite.h * (w / g.boite.w) }) } as ElementSigne);
    }
  };
  const fin = () => {
    glisse.current = null;
  };

  const style: React.CSSProperties = { left: `${e.boite.x * 100}%`, top: `${e.boite.y * 100}%` };
  if (e.genre !== "texte") Object.assign(style, { width: `${e.boite.w * 100}%`, height: `${e.boite.h * 100}%` });

  return (
    <div
      ref={ref}
      className="alambic-signe-element"
      data-genre={e.genre}
      data-choisi={choisi || undefined}
      style={style}
      onPointerDown={(ev) => {
        if (e.genre !== "texte") debut(ev, "deplacer");
        else {
          ev.stopPropagation();
          onChoisir();
        }
      }}
      onPointerMove={bouger}
      onPointerUp={fin}
      onPointerCancel={fin}
      onClick={(ev) => ev.stopPropagation()}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- signature locale (data:) */}
      {e.genre === "image" && <img src={e.source} alt="Signature" draggable={false} />}
      {(e.genre === "coche" || e.genre === "croix") && (
        <svg viewBox="0 0 1 1" preserveAspectRatio="none" aria-label={e.genre === "coche" ? "Coche" : "Croix"} role="img">
          {e.genre === "coche" ? <path d="M0.12 0.55 L0.4 0.85 L0.9 0.15" /> : <path d="M0.15 0.15 L0.85 0.85 M0.85 0.15 L0.15 0.85" />}
        </svg>
      )}
      {e.genre === "texte" && (
        <input
          value={e.texte}
          aria-label="Texte ajouté"
          placeholder="Écris ici"
          autoFocus={choisi && !e.texte}
          spellCheck
          dir="auto"
          style={{ fontSize: `${(e.taille / page.l) * 100}cqw`, color: e.couleur, width: `${Math.max(4, e.texte.length + 1)}ch` }}
          onChange={(ev) => onChanger({ ...e, texte: ev.target.value, boite: { ...e.boite, w: largeurTexte(ev.target.value, e.taille, page.l) } })}
          onFocus={onChoisir}
        />
      )}
      {choisi && (
        <span className="alambic-signe-barre" onPointerDown={(ev) => ev.stopPropagation()}>
          {e.genre === "texte" && (
            <>
              <button type="button" className="alambic-signe-poignee" aria-label="Déplacer" title="Glisser pour déplacer" onPointerDown={(ev) => debut(ev, "deplacer")} onPointerMove={bouger} onPointerUp={fin} onPointerCancel={fin}>
                <Move className="size-4" aria-hidden="true" />
              </button>
              <button type="button" aria-label="Plus petit" title="Plus petit" onClick={() => onChanger({ ...e, taille: Math.max(5, e.taille - 1) })}>
                <Minus className="size-4" aria-hidden="true" />
              </button>
              <button type="button" aria-label="Plus grand" title="Plus grand" onClick={() => onChanger({ ...e, taille: Math.min(72, e.taille + 1) })}>
                <Plus className="size-4" aria-hidden="true" />
              </button>
            </>
          )}
          {e.genre !== "image" && (
            <button type="button" aria-label={e.couleur === ENCRES[0] ? "Encre bleue" : "Encre noire"} title="Changer d'encre" onClick={() => onChanger({ ...e, couleur: e.couleur === ENCRES[0] ? ENCRES[1] : ENCRES[0] } as ElementSigne)}>
              <span className="alambic-signe-encre" style={{ background: e.couleur === ENCRES[0] ? ENCRES[1] : ENCRES[0] }} />
            </button>
          )}
          <button type="button" aria-label="Retirer" title="Retirer" onClick={onRetirer}>
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        </span>
      )}
      {choisi && <span className="alambic-signe-taille" role="presentation" onPointerDown={(ev) => debut(ev, "taille")} onPointerMove={bouger} onPointerUp={fin} onPointerCancel={fin} />}
    </div>
  );
}

function ChampVue({ champ, widget, page, valeur, onValeur }: { champ: ChampFormulaire; widget: ChampFormulaire["widgets"][number]; page: TaillePage; valeur: string | boolean; onValeur: (v: string | boolean) => void }) {
  const b = widget.boite;
  const style: React.CSSProperties = { left: `${b.x * 100}%`, top: `${b.y * 100}%`, width: `${b.w * 100}%`, height: `${b.h * 100}%` };
  const taillePt = Math.max(6, Math.min(b.h * page.h * 0.62, 11));
  const police = { fontSize: `${(taillePt / page.l) * 100}cqw` };
  const commun = { "aria-label": champ.libelle, title: champ.libelle, disabled: champ.lectureSeule, onClick: (ev: React.MouseEvent) => ev.stopPropagation() };
  if (champ.genre === "case")
    return <input type="checkbox" className="alambic-signe-champ" data-genre="case" style={style} checked={Boolean(valeur)} onChange={(ev) => onValeur(ev.target.checked)} {...commun} />;
  if (champ.genre === "radio")
    return <input type="radio" className="alambic-signe-champ" data-genre="case" style={style} name={champ.nom} checked={valeur === widget.option} onChange={() => onValeur(widget.option ?? "")} {...commun} />;
  if (champ.genre === "liste")
    return (
      <select className="alambic-signe-champ" style={{ ...style, ...police }} value={String(valeur)} onChange={(ev) => onValeur(ev.target.value)} {...commun}>
        <option value="" />
        {champ.options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  if (champ.multiligne) return <textarea className="alambic-signe-champ" style={{ ...style, ...police }} value={String(valeur)} maxLength={champ.max} onChange={(ev) => onValeur(ev.target.value)} dir="auto" {...commun} />;
  return <input className="alambic-signe-champ" style={{ ...style, ...police }} value={String(valeur)} maxLength={champ.max} onChange={(ev) => onValeur(ev.target.value)} dir="auto" {...commun} />;
}

export function Signature({ abonner }: { abonner: Abonner }) {
  const { intention } = useAlambic();
  const [fichier, setFichier] = useState<File | null>(null);
  const [octets, setOctets] = useState<Uint8Array | null>(null);
  const [pdf, setPdf] = useState<{ doc: DocPdf; fermer: () => Promise<void> } | null>(null);
  const [pages, setPages] = useState<TaillePage[]>([]);
  const [champs, setChamps] = useState<ChampFormulaire[]>([]);
  const [valeurs, setValeurs] = useState<Record<string, string | boolean>>({});
  const [elements, setElements] = useState<ElementSigne[]>([]);
  const [choisi, setChoisi] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>(null);
  const [signature, setSignature] = useState<{ png: string; ratio: number } | null>(null);
  const [pad, setPad] = useState(false);
  const [gardees, setGardees] = useState<string[]>([]);
  const [figer, setFiger] = useState(false);
  const [verrouille, setVerrouille] = useState<File | null>(null);
  const [resultat, setResultat] = useState<Resultat | null>(null);
  const { travail, erreur, setErreur, lancer } = useTravail();

  // Les signatures gardées sur cet appareil (rangées par compte).
  useEffect(() => {
    void import("@/lib/client/compte").then(({ tiroir }) => {
      try {
        const brut = window.localStorage.getItem(tiroir("alambic-signatures"));
        if (brut) setGardees((JSON.parse(brut) as string[]).filter((s) => typeof s === "string" && s.startsWith("data:image/png")).slice(0, MAX_GARDEES));
      } catch {}
    });
  }, []);
  const enregistrerGardees = (liste: string[]) => {
    setGardees(liste);
    void import("@/lib/client/compte").then(({ tiroir }) => {
      try {
        window.localStorage.setItem(tiroir("alambic-signatures"), JSON.stringify(liste));
      } catch {}
    });
  };

  useEffect(() => () => void pdf?.fermer(), [pdf]);

  const charger = (entrants: File[], mdp?: string) =>
    lancer(async (avancer) => {
      const f = entrants[0];
      if (!f) return;
      setResultat(null);
      setElements([]);
      setChoisi(null);
      setVerrouille(null);
      avancer(null, "Ouverture du document");
      const [{ format }] = await reconnaitreTous([f]);
      const { ouvrir, dechiffrer, imageEnPage } = await import("@/lib/alambic/navigateur/pdf");
      let o: Uint8Array;
      if (format && IMAGES.has(format)) {
        const { PDFDocument } = await import("@cantoo/pdf-lib");
        const doc = await PDFDocument.create();
        await imageEnPage(doc, f, format);
        o = await doc.save();
      } else if (format === "pdf") o = new Uint8Array(await f.arrayBuffer());
      else throw new Error("Signer porte sur un PDF (ou une image, qui devient une page de PDF).");
      try {
        if (mdp !== undefined) o = await dechiffrer(o, mdp);
        const ouvert = await ouvrir(o);
        const tailles: TaillePage[] = [];
        for (let n = 1; n <= ouvert.doc.numPages; n++) {
          const vue = (await ouvert.doc.getPage(n)).getViewport({ scale: 1 });
          tailles.push({ l: vue.width, h: vue.height });
        }
        const { lireFormulaire } = await import("@/lib/alambic/navigateur/signer");
        const lus = await lireFormulaire(o);
        setFichier(f);
        setOctets(o);
        setPdf(ouvert);
        setPages(tailles);
        setChamps(lus);
        setValeurs(Object.fromEntries(lus.map((c) => [c.nom, c.valeur])));
      } catch (e) {
        if ((e as Error).name === "PdfProtege" || (e as Error).name === "MotDePasseFaux") setVerrouille(f);
        throw e;
      }
    });

  useReception(abonner, (f) => void charger(f));

  const placer = (ev: React.MouseEvent<HTMLDivElement>, numero: number) => {
    if (!mode) {
      setChoisi(null);
      return;
    }
    const r = ev.currentTarget.getBoundingClientRect();
    const fx = (ev.clientX - r.left) / r.width;
    const fy = (ev.clientY - r.top) / r.height;
    const page = pages[numero];
    const id = nouvelId();
    let e: ElementSigne;
    if (mode === "signature") {
      if (!signature) {
        setPad(true);
        return;
      }
      const w = Math.min(0.32, 190 / page.l);
      const h = (w * page.l * signature.ratio) / page.h;
      e = { id, genre: "image", page: numero, source: signature.png, boite: borner({ x: fx - w / 2, y: fy - h / 2, w, h }) };
    } else if (mode === "texte" || mode === "date") {
      const taille = 11;
      const texte = mode === "date" ? dateDuJour() : "";
      e = { id, genre: "texte", page: numero, texte, taille, couleur: ENCRES[0], boite: borner({ x: fx, y: fy - (taille * 0.65) / page.h, w: largeurTexte(texte, taille, page.l), h: (taille * 1.3) / page.h }) };
    } else {
      const cote = 14;
      e = { id, genre: mode, page: numero, couleur: ENCRES[0], boite: borner({ x: fx - cote / 2 / page.l, y: fy - cote / 2 / page.h, w: cote / page.l, h: cote / page.h }) };
    }
    setElements((l) => [...l, e]);
    setChoisi(id);
    setResultat(null);
    // Les coches s'enchaînent ; le reste se pose une fois.
    if (mode !== "coche" && mode !== "croix") setMode(null);
  };

  const changer = useCallback((e: ElementSigne) => {
    setElements((l) => l.map((x) => (x.id === e.id ? e : x)));
    setResultat(null);
  }, []);
  const retirer = (id: string) => {
    setElements((l) => l.filter((x) => x.id !== id));
    setChoisi(null);
    setResultat(null);
  };

  // Clavier : flèches pour ajuster, Suppr pour retirer (hors saisie de texte).
  useEffect(() => {
    if (!choisi) return;
    const touche = (ev: KeyboardEvent) => {
      const cible = ev.target as HTMLElement;
      if (cible.tagName === "INPUT" || cible.tagName === "TEXTAREA" || cible.tagName === "SELECT") return;
      const e = elements.find((x) => x.id === choisi);
      if (!e) return;
      const pas = ev.shiftKey ? 0.02 : 0.004;
      const d = { ArrowLeft: [-pas, 0], ArrowRight: [pas, 0], ArrowUp: [0, -pas], ArrowDown: [0, pas] }[ev.key];
      if (d) {
        ev.preventDefault();
        changer({ ...e, boite: borner({ ...e.boite, x: e.boite.x + d[0], y: e.boite.y + d[1] }) } as ElementSigne);
      } else if (ev.key === "Delete" || ev.key === "Backspace") {
        ev.preventDefault();
        retirer(e.id);
      } else if (ev.key === "Escape") setChoisi(null);
    };
    document.addEventListener("keydown", touche);
    return () => document.removeEventListener("keydown", touche);
  }, [choisi, elements, changer]);

  const choisirSignature = (png: string) => {
    const img = new Image();
    img.onload = () => setSignature({ png, ratio: img.naturalHeight / Math.max(1, img.naturalWidth) });
    img.src = png;
    setMode("signature");
  };

  const modifiees = Object.fromEntries(Object.entries(valeurs).filter(([nom, v]) => champs.find((c) => c.nom === nom)?.valeur !== v));
  const rien = !elements.length && !Object.keys(modifiees).length && !figer;

  const enregistrer = () =>
    lancer(async (avancer) => {
      if (!octets || !fichier) return;
      avancer(null, "Écriture du PDF");
      const { enregistrerSigne } = await import("@/lib/alambic/navigateur/signer");
      const r = await enregistrerSigne(octets, elements.filter((e) => e.genre !== "texte" || e.texte.trim()), modifiees, figer && champs.length > 0);
      const avertissements = [...r.avertissements];
      if (elements.length) avertissements.push("Signature, textes et coches font maintenant partie des pages.");
      setResultat(resultatDe(`${sansExtension(fichier.name)} (signé).pdf`, r.octets, "pdf", "application/pdf", avertissements));
    });

  const vider = () => {
    setPdf(null);
    setFichier(null);
    setOctets(null);
    setPages([]);
    setChamps([]);
    setElements([]);
    setResultat(null);
    setErreur(null);
  };

  const OUTILS: { id: Exclude<Mode, null>; nom: string; Icone: typeof PenLine }[] = [
    { id: "signature", nom: "Signature", Icone: PenLine },
    { id: "texte", nom: "Texte", Icone: Type },
    { id: "date", nom: "Date", Icone: CalendarDays },
    { id: "coche", nom: "Coche", Icone: Check },
    { id: "croix", nom: "Croix", Icone: X },
  ];

  return (
    <section className="alambic-outil" aria-labelledby="titre-signer">
      <EnTeteOutil Icone={IconeSignature} titre="Signer et remplir" id="titre-signer">
        Signe un contrat, date un bail, coche les cases d&apos;un Cerfa, remplis ses champs : sans imprimer ni scanner, et sans rien envoyer.
      </EnTeteOutil>

      {!fichier ? (
        <ZoneDepot titre={intention?.reglage === "formulaire" ? "Dépose le formulaire PDF" : "Dépose le PDF à signer"} aide="ou clique pour le choisir. Une photo de document devient une page." accept=".pdf,image/*" onFichiers={(f) => void charger(f)} desactive={travail !== null} />
      ) : (
        <div className="alambic-fichier">
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold">{fichier.name}</span>
            <span className="text-sm text-encre-douce">
              {pages.length} page{pages.length > 1 ? "s" : ""}, {tailleLisible(fichier.size)}
              {champs.length ? `, ${champs.length} champ${champs.length > 1 ? "s" : ""} à remplir` : ""}
            </span>
          </span>
          <button type="button" className="bouton-icone" aria-label="Retirer le fichier" onClick={vider} disabled={travail !== null}>
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
      )}
      {verrouille && <MessageErreur erreur={erreur} onMotDePasse={(mdp) => charger([verrouille], mdp)} />}

      {pdf && pages.length > 0 && (
        <>
          <div className="alambic-signe-outils" role="toolbar" aria-label="Ajouter sur le document">
            {OUTILS.map(({ id, nom, Icone }) => (
              <button
                key={id}
                type="button"
                className="alambic-signe-outil"
                aria-pressed={mode === id}
                onClick={() => {
                  if (id === "signature" && !signature) setPad(true);
                  setMode(mode === id ? null : id);
                }}
              >
                <Icone className="size-4" aria-hidden="true" />
                {nom}
              </button>
            ))}
            {mode && (
              <button type="button" className="alambic-signe-outil" onClick={() => setMode(null)}>
                <MousePointer2 className="size-4" aria-hidden="true" />
                Fini
              </button>
            )}
          </div>
          <p className="alambic-signe-consigne" aria-live="polite">
            {mode === "signature" && signature
              ? "Touche l'endroit où signer."
              : mode === "texte"
                ? "Touche l'endroit où écrire."
                : mode === "date"
                  ? "Touche l'endroit où mettre la date du jour."
                  : mode === "coche" || mode === "croix"
                    ? "Touche chaque case à cocher, puis « Fini »."
                    : champs.length
                      ? "Remplis les champs surlignés en bleu, ou ajoute une signature, un texte, une date ou une coche."
                      : "Choisis ce que tu veux ajouter, puis touche l'endroit voulu sur la page."}
          </p>
          {(gardees.length > 0 || signature) && (
            <div className="alambic-signe-gardees">
              {gardees.map((g, i) => (
                <span key={i} className="alambic-signe-gardee" data-active={signature?.png === g || undefined}>
                  <button type="button" onClick={() => choisirSignature(g)} aria-label={`Utiliser la signature gardée ${i + 1}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- signature locale */}
                    <img src={g} alt="" />
                  </button>
                  <button type="button" className="alambic-signe-oublier" aria-label="Oublier cette signature" title="L'oublier sur cet appareil" onClick={() => enregistrerGardees(gardees.filter((_, k) => k !== i))}>
                    <X className="size-3" aria-hidden="true" />
                  </button>
                </span>
              ))}
              <button type="button" className="bouton bouton-discret !min-h-10" onClick={() => setPad(true)}>
                <PenLine className="size-4" aria-hidden="true" />
                {gardees.length || signature ? "Nouvelle signature" : "Créer ma signature"}
              </button>
            </div>
          )}

          <div className="alambic-signe-pages" data-mode={mode ?? undefined}>
            {pages.map((t, i) => (
              <div key={i} className="alambic-signe-page" style={{ aspectRatio: `${t.l} / ${t.h}` }} onClick={(ev) => placer(ev, i)} role="group" aria-label={`Page ${i + 1}`}>
                <VignettePdf doc={pdf.doc} numero={i + 1} largeur={1100} className="alambic-signe-fond" />
                {champs.flatMap((c) =>
                  c.widgets
                    .filter((w) => w.page === i)
                    .map((w, k) => <ChampVue key={`${c.nom}-${k}`} champ={c} widget={w} page={t} valeur={valeurs[c.nom] ?? ""} onValeur={(v) => { setValeurs((x) => ({ ...x, [c.nom]: v })); setResultat(null); }} />),
                )}
                {elements
                  .filter((e) => e.page === i)
                  .map((e) => (
                    <ElementVue key={e.id} e={e} page={t} choisi={choisi === e.id} onChoisir={() => setChoisi(e.id)} onChanger={changer} onRetirer={() => retirer(e.id)} />
                  ))}
                <span className="alambic-signe-numero" aria-hidden="true">
                  {i + 1}
                </span>
              </div>
            ))}
          </div>

          {champs.length > 0 && (
            <label className="alambic-interrupteur">
              <input type="checkbox" checked={figer} onChange={(e) => setFiger(e.target.checked)} />
              <span className="alambic-interrupteur-piste" aria-hidden="true" />
              <span>
                <span className="font-semibold">Figer le formulaire</span>
                <span className="block text-sm text-encre-douce">Les réponses deviennent du texte imprimé : plus personne ne peut les changer.</span>
              </span>
            </label>
          )}
          <div className="alambic-actions">
            {travail ? (
              <Progression travail={travail} />
            ) : (
              <button type="button" className="bouton bouton-principal alambic-lancer" onClick={() => void enregistrer()} disabled={rien}>
                <Save className="size-5" aria-hidden="true" />
                {rien ? "Rien d'ajouté pour l'instant" : "Enregistrer le PDF signé"}
              </button>
            )}
          </div>
        </>
      )}

      {travail && !pdf && <Progression travail={travail} />}
      {!verrouille && <MessageErreur erreur={erreur} />}
      {resultat && <CarteResultat resultat={resultat} tailleAvant={fichier?.size} protege={false} />}

      {pad && (
        <PadSignature
          onFermer={() => {
            setPad(false);
            if (!signature) setMode(null);
          }}
          onValider={(png, garder) => {
            setPad(false);
            choisirSignature(png);
            if (garder) enregistrerGardees([png, ...gardees.filter((g) => g !== png)].slice(0, MAX_GARDEES));
          }}
        />
      )}

      <BonASavoir
        points={[
          "Une signature dessinée ou importée a la même valeur qu'une signature scannée : c'est une image apposée, pas une signature électronique certifiée.",
          "Les champs des formulaires officiels (Cerfa) sont reconnus : remplis-les directement sur la page.",
          "Ta signature n'est gardée que si tu le demandes, et seulement sur cet appareil ; « l'oublier » l'efface.",
          "Au clavier : flèches pour ajuster la place d'un élément choisi, Suppr pour le retirer.",
        ]}
      />
    </section>
  );
}
