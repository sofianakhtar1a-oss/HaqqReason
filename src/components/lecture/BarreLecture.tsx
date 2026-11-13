"use client";

import { Check, Focus, Heart, Printer, Share2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { basculerFavori, EVENEMENT_FAVORIS, lireFavoris } from "@/lib/client/favoris";

type Props = { id: string; titre: string; resume: string; lienPdf: string };

/** Progression de lecture, favoris, partage, export PDF et mode immersif. */
export function BarreLecture({ id, titre, resume, lienPdf }: Props) {
  const [progression, setProgression] = useState(0);
  const [favori, setFavori] = useState(false);
  const [immersif, setImmersif] = useState(false);
  const [copie, setCopie] = useState(false);

  useEffect(() => {
    const maj = () => setFavori(lireFavoris().some((f) => f.id === id));
    maj();
    window.addEventListener(EVENEMENT_FAVORIS, maj);
    window.addEventListener("storage", maj);
    return () => {
      window.removeEventListener(EVENEMENT_FAVORIS, maj);
      window.removeEventListener("storage", maj);
    };
  }, [id]);

  useEffect(() => {
    let image = 0;
    const calculer = () => {
      image = 0;
      const article = document.querySelector<HTMLElement>("article.lecture");
      if (!article) return;
      const debut = article.offsetTop;
      const fin = debut + article.offsetHeight - window.innerHeight;
      setProgression(fin <= debut ? 1 : Math.min(1, Math.max(0, (window.scrollY - debut) / (fin - debut))));
    };
    const demander = () => {
      if (!image) image = requestAnimationFrame(calculer);
    };
    calculer();
    window.addEventListener("scroll", demander, { passive: true });
    window.addEventListener("resize", demander);
    return () => {
      window.removeEventListener("scroll", demander);
      window.removeEventListener("resize", demander);
      cancelAnimationFrame(image);
    };
  }, []);

  useEffect(() => {
    const racine = document.documentElement;
    if (immersif) racine.dataset.immersif = "";
    else delete racine.dataset.immersif;
    const echap = (e: KeyboardEvent) => {
      if (e.key === "Escape") setImmersif(false);
    };
    if (immersif) window.addEventListener("keydown", echap);
    return () => {
      window.removeEventListener("keydown", echap);
      delete racine.dataset.immersif;
    };
  }, [immersif]);

  async function partager() {
    const url = window.location.href.split("#")[0];
    if (navigator.share) {
      try {
        await navigator.share({ title: titre, text: resume || titre, url });
        return;
      } catch {
        /* partage annulé : on copie le lien */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopie(true);
      setTimeout(() => setCopie(false), 2500);
    } catch {
      window.prompt("Copie ce lien :", url);
    }
  }

  return (
    <>
      <div className="progression-lecture" role="progressbar" aria-label="Progression de la lecture" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progression * 100)}>
        <span style={{ transform: `scaleX(${progression})` }} />
      </div>
      {immersif ? (
        <button type="button" className="sortie-immersif bouton bouton-discret" onClick={() => setImmersif(false)}>
          <X className="size-4" aria-hidden="true" />
          Quitter le mode immersif
        </button>
      ) : (
        <div className="barre-lecture sans-impression" role="toolbar" aria-label="Actions sur l'article">
          <button type="button" className="bouton bouton-discret" aria-pressed={favori} onClick={() => setFavori(basculerFavori({ id, titre, resume }))}>
            <Heart className="size-4" aria-hidden="true" fill={favori ? "currentColor" : "none"} />
            {favori ? "Dans mes favoris" : "Ajouter aux favoris"}
          </button>
          <button type="button" className="bouton bouton-discret" onClick={() => void partager()}>
            {copie ? <Check className="size-4" aria-hidden="true" /> : <Share2 className="size-4" aria-hidden="true" />}
            {copie ? "Lien copié" : "Partager"}
          </button>
          <a href={lienPdf} className="bouton bouton-discret" target="_blank" rel="noopener">
            <Printer className="size-4" aria-hidden="true" />
            Exporter en PDF
          </a>
          <button type="button" className="bouton bouton-discret" onClick={() => setImmersif(true)}>
            <Focus className="size-4" aria-hidden="true" />
            Mode immersif
          </button>
        </div>
      )}
    </>
  );
}
