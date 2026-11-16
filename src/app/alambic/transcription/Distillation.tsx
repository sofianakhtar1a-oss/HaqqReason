"use client";

import { Check, LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Etape } from "@/lib/alambic/transcription/client";
import { estRtl } from "@/lib/alambic/transcription/types";

/*
 * L'attente devient une distillation : la cucurbite (le son) se vide, la vapeur monte,
 * des gouttes descendent le col de cygne et chacune dépose un mot réellement entendu
 * sur la page de droite. Tout est dessiné au trait, à l'or, comme le reste de L'Alambic.
 */

const ETAPES: { id: Etape; nom: string }[] = [
  { id: "preparation", nom: "Préparer le son" },
  { id: "distillation", nom: "Distiller la parole" },
  { id: "mise-en-page", nom: "Mettre en page" },
];

/* Géométrie de l'alambic (viewBox 0 0 380 300). */
const COL = "M152 104 C 205 92, 262 108, 312 178";
const NIVEAU_PLEIN = 168;
const NIVEAU_VIDE = 262;
const FIOLE_HAUT = 214;
const FIOLE_BAS = 270;

type Props = {
  etape: Etape;
  progression: number;
  detail: { transcrits: number; total: number };
  distillat: string[];
  langue: string | null;
  titre: string;
  onAnnuler: () => void;
};

export function Distillation({ etape, progression, detail, distillat, langue, titre, onAnnuler }: Props) {
  const surface = useRef<SVGPathElement>(null);
  const fiole = useRef<SVGRectElement>(null);
  const col = useRef<SVGPathElement>(null);
  const gouttes = useRef<SVGGElement>(null);
  const bulles = useRef<SVGGElement>(null);
  const vapeur = useRef<SVGGElement>(null);
  const cible = useRef(progression);
  const [deposes, setDeposes] = useState(0);
  const motsDispo = useRef(0);
  const rtl = langue ? estRtl(langue) : distillat.some((m) => /[؀-ۿ]/.test(m));

  useEffect(() => {
    cible.current = progression;
  }, [progression]);
  useEffect(() => {
    motsDispo.current = distillat.length;
  }, [distillat.length]);

  useEffect(() => {
    const calme = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let p = 0;
    let image = 0;
    let derniereGoutte = 0;
    const enVol: { nee: number; el: SVGCircleElement }[] = [];
    const longueur = col.current?.getTotalLength() ?? 1;
    const listeBulles = [...(bulles.current?.children ?? [])] as SVGCircleElement[];
    const graines = listeBulles.map(() => ({ x: 92 + Math.random() * 56, v: 0.25 + Math.random() * 0.5, d: Math.random() }));
    const filets = [...(vapeur.current?.children ?? [])] as SVGPathElement[];

    const tour = (maintenant: number) => {
      p += (cible.current - p) * (calme ? 1 : 0.04);
      const s = maintenant / 1000;
      // Surface de la cucurbite : une onde sonore, dont l'amplitude respire.
      const niveau = NIVEAU_PLEIN + (NIVEAU_VIDE - NIVEAU_PLEIN - 10) * p;
      if (surface.current) {
        const amp = calme ? 0 : 2.2 + Math.sin(s * 1.7) * 1.4 + Math.sin(s * 4.3) * 0.8;
        let d = `M40 ${niveau}`;
        for (let x = 40; x <= 200; x += 4) {
          const y = niveau + Math.sin(x * 0.11 + s * 5) * amp * 0.6 + Math.sin(x * 0.23 - s * 7.3) * amp * 0.4;
          d += ` L${x} ${y.toFixed(2)}`;
        }
        surface.current.setAttribute("d", `${d} L200 280 L40 280 Z`);
      }
      // La fiole se remplit du distillat.
      if (fiole.current) {
        const h = (FIOLE_BAS - FIOLE_HAUT - 6) * Math.min(1, p * 1.02);
        fiole.current.setAttribute("y", String(FIOLE_BAS - h));
        fiole.current.setAttribute("height", String(h));
      }
      if (!calme) {
        listeBulles.forEach((b, i) => {
          const g = graines[i];
          const cycle = (s * g.v + g.d) % 1;
          const y = 262 - cycle * (262 - niveau);
          b.setAttribute("cx", String(g.x + Math.sin(s * 3 + i) * 2));
          b.setAttribute("cy", String(y));
          b.setAttribute("opacity", y < niveau + 4 ? "0" : String(0.25 + 0.5 * cycle));
        });
        filets.forEach((f, i) => {
          const phase = (s * 0.35 + i / filets.length) % 1;
          f.setAttribute("opacity", String(Math.sin(phase * Math.PI) * 0.55));
          f.setAttribute("transform", `translate(0 ${(-phase * 26).toFixed(2)})`);
        });
        // Une goutte toutes les 0,9 s pendant la distillation.
        const distille = cible.current > 0.02 && cible.current < 1.01;
        if (distille && s - derniereGoutte > 0.9 && gouttes.current) {
          derniereGoutte = s;
          const el = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          el.setAttribute("r", "3.2");
          el.setAttribute("class", "tr-goutte");
          gouttes.current.appendChild(el);
          enVol.push({ nee: s, el });
        }
        for (let i = enVol.length - 1; i >= 0; i--) {
          const g = enVol[i];
          const age = (s - g.nee) / 1.6;
          if (age >= 1) {
            g.el.remove();
            enVol.splice(i, 1);
            // La goutte tombe dans la fiole : un mot de plus sur la page.
            setDeposes((n) => Math.min(motsDispo.current, n + 1 + Math.floor(n / 24)));
            continue;
          }
          const pt = col.current?.getPointAtLength(Math.min(1, age * 1.12) * longueur);
          if (pt) {
            const chute = Math.max(0, age * 1.12 - 1) * 60;
            g.el.setAttribute("cx", String(pt.x));
            g.el.setAttribute("cy", String(pt.y + chute));
          }
        }
      } else {
        setDeposes(motsDispo.current);
      }
      image = requestAnimationFrame(tour);
    };
    image = requestAnimationFrame(tour);
    return () => {
      cancelAnimationFrame(image);
      enVol.forEach((g) => g.el.remove());
    };
  }, []);

  const rang = ETAPES.findIndex((e) => e.id === etape);
  const pourcent = Math.round(progression * 100);
  const mots = distillat.slice(0, deposes);

  return (
    <section className="alambic-outil tr-distillation" aria-labelledby="tr-distille-titre" aria-busy="true">
      <header className="tr-entete">
        <h2 id="tr-distille-titre" className="tr-entete-titre">
          Distillation
        </h2>
        <p className="tr-entete-aide truncate" dir="auto">
          {titre}
        </p>
      </header>

      <div className="tr-atelier">
        <svg className="tr-alambic" viewBox="0 0 380 300" role="img" aria-label={`Distillation en cours, ${pourcent} %`}>
          <defs>
            <clipPath id="tr-interieur">
              <path d="M98 150 C 62 164, 54 230, 84 254 C 106 272, 134 272, 156 254 C 186 230, 178 164, 142 150 Z" />
            </clipPath>
            <clipPath id="tr-interieur-fiole">
              <path d="M298 214 L298 254 C298 264, 306 270, 314 270 C322 270, 330 264, 330 254 L330 214 Z" />
            </clipPath>
            <linearGradient id="tr-or" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--or)" stopOpacity="0.85" />
              <stop offset="1" stopColor="var(--or)" stopOpacity="0.35" />
            </linearGradient>
          </defs>

          {/* Chaleur sous la cucurbite */}
          <g className="tr-chaleur">
            <path pathLength={1} d="M100 286 q5 -6 0 -12 q-5 -6 0 -12" />
            <path pathLength={1} d="M120 288 q5 -6 0 -12 q-5 -6 0 -12" />
            <path pathLength={1} d="M140 286 q5 -6 0 -12 q-5 -6 0 -12" />
          </g>

          {/* Contenu : le son, puis le distillat */}
          <g clipPath="url(#tr-interieur)">
            <path ref={surface} className="tr-liquide" fill="url(#tr-or)" d="M40 168 L200 168 L200 280 L40 280 Z" />
            <g ref={bulles} className="tr-bulles">
              {Array.from({ length: 7 }, (_, i) => (
                <circle key={i} r={1.4 + (i % 3) * 0.6} cx="120" cy="260" opacity="0" />
              ))}
            </g>
          </g>
          <g clipPath="url(#tr-interieur-fiole)">
            <rect ref={fiole} className="tr-liquide" x="296" y={FIOLE_BAS} width="36" height="0" fill="url(#tr-or)" />
          </g>

          {/* Vapeur dans le chapiteau */}
          <g ref={vapeur} className="tr-vapeur">
            <path d="M110 136 q6 -8 0 -16 q-6 -8 0 -16" />
            <path d="M122 138 q6 -8 0 -16 q-6 -8 0 -16" />
            <path d="M134 136 q6 -8 0 -16 q-6 -8 0 -16" />
          </g>

          {/* Le tracé de l'alambic */}
          <g className="tr-trace">
            <path pathLength={1} d="M98 150 C 62 164, 54 230, 84 254 C 106 272, 134 272, 156 254 C 186 230, 178 164, 142 150 L142 140 L98 140 Z" />
            <path pathLength={1} d="M90 140 L150 140 C 156 110, 142 84, 120 82 C 98 84, 84 110, 90 140 Z" />
            <path pathLength={1} className="tr-trace-tube" d={COL} />
            <path ref={col} d={COL} fill="none" stroke="none" />
            <path pathLength={1} d="M296 206 L332 206 M298 206 L298 254 C298 264, 306 270, 314 270 C322 270, 330 264, 330 254 L330 206" />
            <path pathLength={1} className="tr-trace-fin" d="M70 286 L170 286 M120 76 L120 70" />
          </g>
          <g ref={gouttes} />
        </svg>

        <div className="tr-page" aria-live="polite">
          <p className="tr-page-etiquette">Le distillat</p>
          {mots.length ? (
            <p className="tr-page-texte" dir={rtl ? "rtl" : "ltr"} lang={langue ?? undefined} data-rtl={rtl || undefined}>
              {mots.map((m, i) => (
                <span key={i} className="tr-page-mot">
                  {m}{" "}
                </span>
              ))}
            </p>
          ) : (
            <div className="tr-page-attente" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          )}
          {!mots.length && <p className="tr-page-legende">Les premiers mots entendus vont tomber ici.</p>}
        </div>
      </div>

      <ol className="tr-etapes">
        {ETAPES.map((e, i) => (
          <li key={e.id} data-etat={i < rang ? "fait" : i === rang ? "cours" : "attente"}>
            <span className="tr-etape-pastille" aria-hidden="true">
              {i < rang ? <Check className="size-3.5" strokeWidth={3} /> : i === rang ? <LoaderCircle className="size-3.5 animate-spin" strokeWidth={2.5} /> : i + 1}
            </span>
            {e.nom}
          </li>
        ))}
      </ol>

      <div className="alambic-actions">
        <div className="alambic-progression" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pourcent} aria-label="Avancement">
          <span style={{ width: `${Math.max(2, pourcent)}%` }} />
        </div>
        <p className="alambic-etape tabular-nums">
          {etape === "preparation" && "Le son est allégé sur ton appareil avant l'envoi"}
          {etape === "distillation" && (detail.total > 1 ? `Morceau ${Math.min(detail.transcrits + 1, detail.total)} sur ${detail.total} · ${pourcent} %` : `Whisper écoute… ${pourcent} %`)}
          {etape === "mise-en-page" && "Les phrases et les paragraphes se mettent en place"}
        </p>
        <button type="button" className="bouton bouton-discret" onClick={onAnnuler}>
          Annuler
        </button>
      </div>
    </section>
  );
}
