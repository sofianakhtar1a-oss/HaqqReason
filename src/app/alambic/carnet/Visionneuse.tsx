"use client";

import { ExternalLink, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { lireFichier } from "@/lib/alambic/carnet/stockage";
import { minutage, type Morceau, type Source } from "@/lib/alambic/carnet/types";

export type Cible = { source: Source; page?: number; t?: number; ligne?: number };

/** Les passages qui couvrent le repère cité (un morceau s'étend jusqu'au début du suivant). */
function passages(morceaux: Morceau[], c: Cible): { liste: Morceau[]; vise: string | null } {
  const tries = [...morceaux].sort((a, b) => a.ordre - b.ordre);
  const cle = c.page !== undefined ? "page" : c.t !== undefined ? "t" : c.ligne !== undefined ? "ligne" : null;
  if (!cle || !tries.length) return { liste: tries.slice(0, 3), vise: null };
  const valeur = (c[cle] ?? 0) as number;
  let k = tries.findIndex((m, i) => (m[cle] ?? 0) <= valeur && (i === tries.length - 1 || (tries[i + 1][cle] ?? 0) > valeur));
  if (k < 0) k = 0;
  // Pour une page : tous les morceaux qui commencent sur cette page.
  const memes = tries.filter((m) => m[cle] === valeur);
  const coeur = cle === "page" && memes.length ? memes : [tries[k]];
  const debut = Math.max(0, tries.indexOf(coeur[0]) - 1);
  const fin = Math.min(tries.length, tries.indexOf(coeur[coeur.length - 1]) + 2);
  return { liste: tries.slice(debut, fin), vise: coeur.map((m) => m.id).join(" ") };
}

export function Visionneuse({ cible, morceaux, onFermer }: { cible: Cible; morceaux: Morceau[]; onFermer: () => void }) {
  const { source } = cible;
  const [url, setUrl] = useState<string | null>(null);
  const [apercu, setApercu] = useState<string | null>(null);
  const media = useRef<HTMLMediaElement | null>(null);
  const { liste, vise } = useMemo(() => passages(morceaux, cible), [morceaux, cible]);
  const repere = cible.page !== undefined ? `p. ${cible.page}` : cible.t !== undefined ? minutage(cible.t) : cible.ligne !== undefined ? `ligne ${cible.ligne}` : "";

  // Fichier d'origine : pour réécouter, ou voir la vraie page du PDF.
  useEffect(() => {
    if (source.type === "youtube") return;
    let lien: string | null = null;
    let fini = false;
    void lireFichier(source.id).then(async (blob) => {
      if (!blob || fini) return;
      lien = URL.createObjectURL(blob);
      setUrl(lien);
      if (source.type === "pdf" && cible.page) {
        try {
          const { ouvrir, vignettePage } = await import("@/lib/alambic/navigateur/pdf");
          const { doc, fermer } = await ouvrir(new Uint8Array(await blob.arrayBuffer()));
          const image = await vignettePage(doc, Math.min(cible.page, doc.numPages), 720);
          await fermer();
          if (!fini) setApercu(image);
        } catch {
          // L'aperçu de la page est un bonus : le texte suffit.
        }
      }
    });
    return () => {
      fini = true;
      if (lien) URL.revokeObjectURL(lien);
    };
  }, [source.id, source.type, cible.page]);

  useEffect(() => {
    const el = media.current;
    if (el && cible.t !== undefined) {
      const aller = () => {
        el.currentTime = cible.t!;
        void el.play().catch(() => undefined);
      };
      if (el.readyState >= 1) aller();
      else el.addEventListener("loadedmetadata", aller, { once: true });
    }
  }, [url, cible.t]);

  useEffect(() => {
    document.querySelector(".cb-passage[data-vise]")?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [vise]);

  return (
    <aside className="cb-visionneuse" aria-label={`Source citée : ${source.nom}`}>
      <header className="cb-vis-tete">
        <span className="min-w-0 flex-1">
          <span className="cb-vis-nom" dir="auto">
            {source.nom}
          </span>
          <span className="cb-vis-repere">{repere}</span>
        </span>
        <button type="button" className="tr-cmd" onClick={onFermer} aria-label="Fermer la source">
          <X className="size-5" aria-hidden="true" />
        </button>
      </header>

      <div className="cb-vis-corps">
        {source.type === "youtube" && source.youtube && (
          <iframe
            key={`${source.youtube}-${cible.t}`}
            className="cb-vis-video"
            src={`https://www.youtube-nocookie.com/embed/${source.youtube}?start=${Math.floor(cible.t ?? 0)}&autoplay=1&rel=0&modestbranding=1`}
            title={source.nom}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        )}
        {source.type === "video" && url && <video ref={(el) => void (media.current = el)} className="cb-vis-video" src={url} controls playsInline />}
        {source.type === "audio" && url && <audio ref={(el) => void (media.current = el)} className="w-full" src={url} controls />}

        {apercu && (
          // eslint-disable-next-line @next/next/no-img-element -- page du PDF dessinée dans le navigateur
          <img className="cb-vis-page" src={apercu} alt={`Page ${cible.page} de ${source.nom}`} />
        )}
        {source.type === "pdf" && url && (
          <a className="cb-vis-ouvrir" href={`${url}#page=${cible.page ?? 1}`} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-4" aria-hidden="true" />
            Ouvrir le PDF à la page {cible.page ?? 1}
          </a>
        )}
        {source.pagesEstimees && <p className="cb-vis-note">Pour ce type de fichier, les pages sont estimées (3 000 signes par page).</p>}

        <p className="cb-vis-intertitre">Le passage cité</p>
        {liste.map((m) => (
          <div key={m.id} className="cb-passage" data-vise={vise?.split(" ").includes(m.id) || undefined}>
            <span className="cb-passage-repere">{m.page !== undefined ? `p. ${m.page}` : m.t !== undefined ? minutage(m.t) : `ligne ${m.ligne}`}</span>
            <p dir="auto">{m.texte}</p>
          </div>
        ))}
        {!liste.length && <p className="text-sm text-encre-douce">Le texte de cette source n&apos;est plus disponible.</p>}
      </div>
    </aside>
  );
}
