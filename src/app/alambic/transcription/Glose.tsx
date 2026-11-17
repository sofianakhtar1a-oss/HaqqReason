"use client";

import { Play, X } from "lucide-react";
import { type ReactNode, useLayoutEffect, useRef, useState } from "react";
import type { Analyse, Glose as TypeGlose, Phrase } from "@/lib/alambic/transcription/types";

export type Cible = { phrase: number; mot: number; el: HTMLElement; via: "survol" | "toucher" };

const nu = (m: string) => m.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "") || m;

type Props = {
  cible: Cible;
  phrase: Phrase;
  langue: string;
  rtl: boolean;
  analyse?: Analyse;
  traduction?: string;
  erreur: string | null;
  onEntrer: () => void;
  onSortir: () => void;
  onFermer: () => void;
  /** Absent : pas de bouton « Écouter » (texte sans son, comme un PDF). */
  onEcouter?: (t: number) => void;
  onMot: (i: number, el: HTMLElement) => void;
  /** Boutons en plus, sous la traduction (Le Truchement : écouter le mot, l'ajouter au dictionnaire). */
  actions?: ReactNode;
  /** Remplace l'astuce du bas de la carte flottante ; null pour la masquer. */
  astuce?: string | null;
};

function Contenu({ phrase, cible, langue, analyse, traduction, erreur }: Pick<Props, "phrase" | "cible" | "langue" | "analyse" | "traduction" | "erreur">) {
  const g: TypeGlose | undefined = analyse?.mots.find((x) => x.i === cible.mot);
  const mot = nu(phrase.mots[cible.mot]?.t ?? "");
  const infos = [g?.nature, g?.lemme && nu(g.lemme) !== mot ? g.lemme : null].filter(Boolean);
  const chargement = !analyse && !erreur;
  return (
    <>
      <p className="tr-glose-mot" lang={langue} dir="auto">
        {mot}
      </p>
      {g ? (
        <p className="tr-glose-sens">{g.sens}</p>
      ) : analyse ? (
        <p className="tr-glose-sens text-encre-douce">—</p>
      ) : chargement ? (
        <span className="tr-attente tr-attente-large" />
      ) : null}
      {(infos.length > 0 || g?.racine) && (
        <p className="tr-glose-infos">
          {infos.map((x, i) => (
            <span key={i} lang={i ? langue : "fr"} dir="auto">
              {x}
            </span>
          ))}
          {g?.racine && (
            <span className="tr-glose-racine" lang="ar" dir="rtl" title="Racine">
              {g.racine}
            </span>
          )}
        </p>
      )}
      <div className="tr-glose-phrase">
        {traduction ? <p>{traduction}</p> : chargement ? (
          <>
            <span className="tr-attente" />
            <span className="tr-attente tr-attente-courte" />
          </>
        ) : null}
        {erreur && !analyse && <p className="text-danger">{erreur}</p>}
      </div>
    </>
  );
}

/** Carte flottante, au survol d'un mot (souris). */
export function Popover(p: Props) {
  const carte = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; fleche: number; cote: "haut" | "bas" } | null>(null);

  useLayoutEffect(() => {
    let image = 0;
    const placer = () => {
      const r = p.cible.el.getBoundingClientRect();
      const c = carte.current;
      if (!c) return;
      const l = c.offsetWidth;
      const h = c.offsetHeight;
      const haut = r.top - h - 14 > 72;
      const left = Math.min(window.innerWidth - l - 12, Math.max(12, r.left + r.width / 2 - l / 2));
      setPos((avant) => {
        const top = haut ? r.top - h - 14 : r.bottom + 14;
        const fleche = r.left + r.width / 2 - left;
        if (avant && Math.abs(avant.top - top) < 0.5 && Math.abs(avant.left - left) < 0.5 && avant.fleche === fleche) return avant;
        return { top, left, fleche, cote: haut ? "haut" : "bas" };
      });
      image = requestAnimationFrame(placer);
    };
    placer();
    return () => cancelAnimationFrame(image);
  }, [p.cible.el]);

  return (
    <div
      ref={carte}
      className="tr-glose"
      role="tooltip"
      data-cote={pos?.cote}
      data-visible={pos ? "" : undefined}
      style={pos ? { top: pos.top, left: pos.left, ["--fleche" as string]: `${pos.fleche}px` } : { top: -9999, left: -9999 }}
      onPointerEnter={p.onEntrer}
      onPointerLeave={p.onSortir}
    >
      <Contenu {...p} />
      {p.actions && <div className="tr-glose-actions">{p.actions}</div>}
      {p.astuce !== null && <p className="tr-glose-astuce">{p.astuce ?? "Clic sur un mot : écouter à partir de là"}</p>}
    </div>
  );
}

/** Tiroir du bas, au toucher (téléphone) : on lit, on touche les autres mots, on écoute. */
export function Tiroir(p: Props) {
  return (
    <div className="tr-tiroir-fond" onClick={p.onFermer}>
      <div className="tr-tiroir" role="dialog" aria-modal="true" aria-label="Traduction" onClick={(e) => e.stopPropagation()}>
        <span className="tr-tiroir-poignee" aria-hidden="true" />
        <button type="button" className="tr-tiroir-fermer bouton-icone" aria-label="Fermer" onClick={p.onFermer}>
          <X className="size-5" aria-hidden="true" />
        </button>
        <div className="tr-tiroir-glose">
          <Contenu {...p} />
        </div>
        <p className="tr-tiroir-source" lang={p.langue} dir={p.rtl ? "rtl" : "ltr"} data-rtl={p.rtl || undefined}>
          {p.phrase.mots.map((m, i) => (
            <span key={i}>
              <button type="button" className="tr-tiroir-mot" aria-pressed={i === p.cible.mot} onClick={(e) => p.onMot(i, e.currentTarget)}>
                {m.t}
              </button>{" "}
            </span>
          ))}
        </p>
        {p.actions && <div className="tr-glose-actions tr-tiroir-actions">{p.actions}</div>}
        {p.onEcouter && (
          <button type="button" className="bouton bouton-principal w-full" onClick={() => p.onEcouter?.(p.phrase.mots[p.cible.mot]?.d ?? p.phrase.debut)}>
            <Play className="size-4" fill="currentColor" aria-hidden="true" />
            Écouter à partir de ce mot
          </button>
        )}
      </div>
    </div>
  );
}
