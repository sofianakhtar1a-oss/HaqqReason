"use client";

/*
 * Créer sa signature : la dessiner au doigt ou à la souris, ou importer la photo d'une signature sur papier
 * (le papier devient transparent). Elle peut être gardée sur cet appareil, et seulement là.
 */
import { Eraser, ImageUp, PenLine, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { cadreUtile, detourerEncre } from "@/lib/alambic/signature";
import { usePiegeFocus } from "../commun";

const ENCRES = [
  { v: "#111827", n: "Noire" },
  { v: "#1d3a8a", n: "Bleue" },
];

/** Rogne une toile à son dessin, avec une petite marge, et la rend en PNG transparent. */
function rogner(c: HTMLCanvasElement): string | null {
  const ctx = c.getContext("2d")!;
  const d = ctx.getImageData(0, 0, c.width, c.height);
  const cadre = cadreUtile(d.data, c.width, c.height);
  if (!cadre) return null;
  const marge = Math.round(Math.max(cadre.w, cadre.h) * 0.04) + 2;
  const x = Math.max(0, cadre.x - marge);
  const y = Math.max(0, cadre.y - marge);
  const w = Math.min(c.width - x, cadre.w + 2 * marge);
  const h = Math.min(c.height - y, cadre.h + 2 * marge);
  const echelle = Math.min(1, 1200 / w);
  const sortie = document.createElement("canvas");
  sortie.width = Math.max(1, Math.round(w * echelle));
  sortie.height = Math.max(1, Math.round(h * echelle));
  sortie.getContext("2d")!.drawImage(c, x, y, w, h, 0, 0, sortie.width, sortie.height);
  return sortie.toDataURL("image/png");
}

export function PadSignature({ onValider, onFermer }: { onValider: (png: string, garder: boolean) => void; onFermer: () => void }) {
  const [onglet, setOnglet] = useState<"dessin" | "photo">("dessin");
  const [encre, setEncre] = useState(ENCRES[0].v);
  const [vide, setVide] = useState(true);
  const [photo, setPhoto] = useState<string | null>(null);
  const [garder, setGarder] = useState(false);
  const toile = useRef<HTMLCanvasElement>(null);
  const trace = useRef<{ x: number; y: number }[] | null>(null);
  const choix = useRef<HTMLInputElement>(null);
  const boite = useRef<HTMLDivElement>(null);
  const [erreurPhoto, setErreurPhoto] = useState<string | null>(null);
  const titre = useId();
  usePiegeFocus(boite);

  // Revenir au dessin repart d'une toile vierge : le bouton « Utiliser » doit l'être aussi.
  const changerOnglet = (o: "dessin" | "photo") => {
    if (o === onglet) return;
    if (o === "dessin") setVide(true);
    setOnglet(o);
  };

  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFermer();
    };
    document.addEventListener("keydown", touche);
    return () => document.removeEventListener("keydown", touche);
  }, [onFermer]);

  // Toile nette sur les écrans haute densité.
  useEffect(() => {
    const c = toile.current;
    if (!c || onglet !== "dessin") return;
    const r = c.getBoundingClientRect();
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    c.width = Math.round(r.width * dpr);
    c.height = Math.round(r.height * dpr);
  }, [onglet]);

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * e.currentTarget.width, y: ((e.clientY - r.top) / r.height) * e.currentTarget.height };
  };

  const dessiner = (pts: { x: number; y: number }[]) => {
    const c = toile.current;
    if (!c || pts.length < 2) return;
    const ctx = c.getContext("2d")!;
    ctx.strokeStyle = encre;
    ctx.lineWidth = Math.max(2, c.width / 220);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    const n = pts.length;
    // Courbe lissée entre les trois derniers points.
    const a = pts[Math.max(0, n - 3)];
    const b = pts[n - 2];
    const c2 = pts[n - 1];
    ctx.moveTo((a.x + b.x) / 2, (a.y + b.y) / 2);
    ctx.quadraticCurveTo(b.x, b.y, (b.x + c2.x) / 2, (b.y + c2.y) / 2);
    ctx.stroke();
  };

  const importer = async (f: File) => {
    setErreurPhoto(null);
    let bitmap: ImageBitmap;
    try {
      bitmap = await createImageBitmap(f);
    } catch {
      setErreurPhoto("Cette photo ne s'ouvre pas dans ton navigateur (une photo HEIC d'iPhone, par exemple). Choisis une photo JPEG ou PNG, ou fais une capture d'écran de la signature.");
      return;
    }
    const echelle = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bitmap.width * echelle);
    c.height = Math.round(bitmap.height * echelle);
    const ctx = c.getContext("2d")!;
    ctx.drawImage(bitmap, 0, 0, c.width, c.height);
    bitmap.close();
    const d = ctx.getImageData(0, 0, c.width, c.height);
    detourerEncre(d.data);
    ctx.putImageData(d, 0, 0);
    setPhoto(rogner(c));
  };

  const resultat = () => (onglet === "dessin" ? (toile.current && !vide ? rogner(toile.current) : null) : photo);

  return (
    <div className="alambic-choix-fond" role="presentation" onMouseDown={onFermer}>
      <div ref={boite} className="alambic-pad verre" role="dialog" aria-modal="true" aria-labelledby={titre} onMouseDown={(e) => e.stopPropagation()}>
        <header className="alambic-choix-tete">
          <h2 id={titre} className="font-display text-xl font-bold">
            Ta signature
          </h2>
          <button type="button" className="bouton-icone" onClick={onFermer} aria-label="Fermer">
            <X className="size-5" aria-hidden="true" />
          </button>
        </header>
        <div className="alambic-segments" role="tablist" aria-label="Façon de créer la signature">
          <button type="button" role="tab" aria-selected={onglet === "dessin"} onClick={() => changerOnglet("dessin")}>
            <PenLine className="mr-1 inline size-4" aria-hidden="true" />
            La dessiner
          </button>
          <button type="button" role="tab" aria-selected={onglet === "photo"} onClick={() => changerOnglet("photo")}>
            <ImageUp className="mr-1 inline size-4" aria-hidden="true" />
            Importer une photo
          </button>
        </div>

        {onglet === "dessin" ? (
          <>
            <canvas
              ref={toile}
              className="alambic-pad-toile"
              aria-label="Zone de signature : dessine avec le doigt ou la souris"
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                trace.current = [point(e)];
              }}
              onPointerMove={(e) => {
                if (!trace.current) return;
                trace.current.push(point(e));
                dessiner(trace.current);
                if (vide) setVide(false);
              }}
              onPointerUp={() => {
                trace.current = null;
              }}
              onPointerCancel={() => {
                trace.current = null;
              }}
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="alambic-couleurs" role="radiogroup" aria-label="Encre">
                {ENCRES.map((c) => (
                  <button key={c.v} type="button" role="radio" aria-checked={encre === c.v} aria-label={`Encre ${c.n.toLowerCase()}`} title={`Encre ${c.n.toLowerCase()}`} style={{ ["--teinte" as string]: c.v }} onClick={() => setEncre(c.v)} />
                ))}
              </div>
              <button
                type="button"
                className="bouton bouton-discret !min-h-10"
                onClick={() => {
                  const c = toile.current;
                  c?.getContext("2d")!.clearRect(0, 0, c.width, c.height);
                  setVide(true);
                }}
              >
                <Eraser className="size-4" aria-hidden="true" />
                Effacer
              </button>
            </div>
          </>
        ) : (
          <>
            <input
              ref={choix}
              type="file"
              accept="image/*"
              className="sr-only"
              tabIndex={-1}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void importer(f);
                e.target.value = "";
              }}
            />
            <button type="button" className="alambic-depot alambic-pad-photo" onClick={() => choix.current?.click()}>
              {/* eslint-disable-next-line @next/next/no-img-element -- image locale */}
              {photo ? <img src={photo} alt="Signature importée" /> : <ImageUp className="size-8 text-or" strokeWidth={1.4} aria-hidden="true" />}
              <span className="text-sm text-encre-douce">{photo ? "Choisir une autre photo" : "Signe sur une feuille blanche, prends-la en photo de près : le blanc disparaît."}</span>
            </button>
            {erreurPhoto && (
              <p className="message message-erreur" role="alert">
                {erreurPhoto}
              </p>
            )}
          </>
        )}

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1" checked={garder} onChange={(e) => setGarder(e.target.checked)} />
          <span>Garder cette signature sur cet appareil (elle n&apos;est enregistrée nulle part ailleurs)</span>
        </label>
        <div className="alambic-actions">
          <button
            type="button"
            className="bouton bouton-principal"
            disabled={onglet === "dessin" ? vide : !photo}
            onClick={() => {
              const png = resultat();
              if (png) onValider(png, garder);
            }}
          >
            Utiliser cette signature
          </button>
          <button type="button" className="bouton bouton-discret" onClick={onFermer}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
