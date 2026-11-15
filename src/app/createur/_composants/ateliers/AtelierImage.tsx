"use client";

import { Check, Crop, ImageDown, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  bornerRecadrage,
  dessiner,
  LARGEUR_MAX,
  LARGEUR_MIN,
  nomPourCapture,
  poidsLisible,
  RECADRAGE_ENTIER,
  REGLAGES_PAR_DEFAUT,
  tailleFichier,
  type Recadrage,
  type Reglages,
} from "@/lib/client/image-atelier";
import { LARGEURS_IMAGE } from "@/lib/document-schema";
import { Modale } from "./Modale";

export type ResultatAtelier = { fichier: File; largeur: (typeof LARGEURS_IMAGE)[number]["cle"]; legende: string; alt: string };

/** Teintes du cadre : celles du site, plus le noir et le blanc. */
const TEINTES = [
  { cle: "#c9a227", nom: "Or" },
  { cle: "#1f6feb", nom: "Bleu" },
  { cle: "#2e7d52", nom: "Vert" },
  { cle: "#a23b72", nom: "Rose" },
  { cle: "#c2410c", nom: "Orange" },
  { cle: "#6d4aff", nom: "Violet" },
  { cle: "#111827", nom: "Noir" },
  { cle: "#ffffff", nom: "Blanc" },
];

type Poignee = "nw" | "ne" | "sw" | "se" | "deplacer";

export function AtelierImage({ source, onFermer, onValider }: { source: Blob; onFermer: () => void; onValider: (r: ResultatAtelier) => void }) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [reglages, setReglages] = useState<Reglages>(REGLAGES_PAR_DEFAUT);
  const [legende, setLegende] = useState("");
  const [alt, setAlt] = useState("");
  const [largeurArticle, setLargeurArticle] = useState<(typeof LARGEURS_IMAGE)[number]["cle"]>("normale");
  const [poids, setPoids] = useState<number | null>(null);
  const [resultat, setResultat] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);
  const zone = useRef<HTMLDivElement>(null);
  const geste = useRef<{ poignee: Poignee; x: number; y: number; depart: Recadrage } | null>(null);

  // Lecture de l'image collée.
  useEffect(() => {
    const url = URL.createObjectURL(source);
    const img = new Image();
    img.onload = () => {
      setImage(img);
      setReglages((r) => ({ ...r, largeur: Math.min(img.naturalWidth, 1000) }));
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [source]);

  // Ce qu'on annonce, c'est la taille du fichier produit : image, cadre et place de l'ombre compris.
  const dimensions = useMemo(
    () => (image ? tailleFichier({ largeur: image.naturalWidth, hauteur: image.naturalHeight }, reglages) : { largeur: 0, hauteur: 0 }),
    [image, reglages],
  );

  const produire = useCallback(async (): Promise<Blob | null> => {
    if (!image) return null;
    const canevas = dessiner(image, reglages);
    return new Promise((resoudre) => canevas.toBlob((b) => resoudre(b), "image/png"));
  }, [image, reglages]);

  /*
   * Poids estimé et aperçu du résultat, recalculés tranquillement après chaque réglage :
   * on fabrique vraiment le fichier, donc ce qui est montré est exactement ce qui sera inséré.
   */
  useEffect(() => {
    if (!image) return;
    let vivant = true;
    const minuteur = setTimeout(() => {
      void produire().then((b) => {
        if (!vivant) return;
        setPoids(b?.size ?? null);
        setResultat((ancien) => {
          if (ancien) URL.revokeObjectURL(ancien);
          return b ? URL.createObjectURL(b) : null;
        });
      });
    }, 300);
    return () => {
      vivant = false;
      clearTimeout(minuteur);
    };
  }, [image, produire]);

  // La dernière adresse d'aperçu est rendue au navigateur quand l'atelier se ferme.
  useEffect(() => () => setResultat((ancien) => (ancien ? (URL.revokeObjectURL(ancien), null) : null)), []);

  const modifier = (p: Partial<Reglages>) => setReglages((r) => ({ ...r, ...p }));

  // --- Recadrage à la souris ou au doigt
  const auPointeur = (e: React.PointerEvent, poignee: Poignee) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch {}
    geste.current = { poignee, x: e.clientX, y: e.clientY, depart: reglages.recadrage };
  };

  const enGlissant = (e: React.PointerEvent) => {
    const g = geste.current;
    const boite = zone.current?.getBoundingClientRect();
    if (!g || !boite) return;
    const dx = (e.clientX - g.x) / boite.width;
    const dy = (e.clientY - g.y) / boite.height;
    const d = g.depart;
    let suivant: Recadrage;
    if (g.poignee === "deplacer") {
      suivant = { ...d, x: d.x + dx, y: d.y + dy };
    } else {
      const versLaGauche = g.poignee === "nw" || g.poignee === "sw";
      const versLeHaut = g.poignee === "nw" || g.poignee === "ne";
      suivant = {
        x: versLaGauche ? d.x + dx : d.x,
        y: versLeHaut ? d.y + dy : d.y,
        largeur: versLaGauche ? d.largeur - dx : d.largeur + dx,
        hauteur: versLeHaut ? d.hauteur - dy : d.hauteur + dy,
      };
    }
    modifier({ recadrage: bornerRecadrage(suivant) });
  };

  const finGeste = () => {
    geste.current = null;
  };

  async function valider() {
    const blob = await produire();
    if (!blob) return;
    setOccupe(true);
    const fichier = new File([blob], nomPourCapture(), { type: "image/png" });
    onValider({ fichier, largeur: largeurArticle, legende: legende.trim(), alt: alt.trim() });
  }

  const r = reglages.recadrage;
  const recadre = r.largeur < 0.999 || r.hauteur < 0.999;

  return (
    <Modale
      titre="Retoucher l'image collée"
      onFermer={onFermer}
      actions={
        <>
          <button type="button" className="bouton bouton-discret" onClick={onFermer} disabled={occupe}>
            Annuler
          </button>
          <button type="button" className="bouton bouton-principal" onClick={() => void valider()} disabled={!image || occupe}>
            <Check className="size-4" aria-hidden="true" />
            {occupe ? "Envoi…" : "Insérer dans l'article"}
          </button>
        </>
      }
    >
      <div className="atelier-image">
        <div className="atelier-image-scene">
          {!image ? (
            <p className="text-encre-douce">Lecture de l&apos;image…</p>
          ) : (
            <>
              <div
                ref={zone}
                className="atelier-image-cadre"
                onPointerMove={enGlissant}
                onPointerUp={finGeste}
                onPointerCancel={finGeste}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.src} alt="" className="atelier-image-source" draggable={false} />
                <div className="atelier-image-voile" />
                <div
                  className="atelier-image-zone"
                  style={{ left: `${r.x * 100}%`, top: `${r.y * 100}%`, width: `${r.largeur * 100}%`, height: `${r.hauteur * 100}%` }}
                  onPointerDown={(e) => auPointeur(e, "deplacer")}
                >
                  {(["nw", "ne", "sw", "se"] as const).map((p) => (
                    <span key={p} className={`atelier-image-poignee poignee-${p}`} onPointerDown={(e) => auPointeur(e, p)} />
                  ))}
                </div>
              </div>
              <p className="atelier-image-mesures" aria-live="polite">
                <span>
                  {dimensions.largeur} × {dimensions.hauteur} pixels
                </span>
                {poids !== null && <span>≈ {poidsLisible(poids)}</span>}
              </p>
              {resultat && (
                <figure className="atelier-image-resultat">
                  <figcaption>Ce qui sera inséré</figcaption>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={resultat} alt="Aperçu de l'image retouchée" />
                </figure>
              )}
            </>
          )}
        </div>

        <div className="atelier-image-reglages">
          <section>
            <h3 className="atelier-titre">
              <Crop className="size-4 text-accent" aria-hidden="true" />
              Cadrage
            </h3>
            <p className="aide text-sm">Glisse à l&apos;intérieur de l&apos;image pour déplacer la zone gardée, ou attrape un coin pour la retailler.</p>
            <button type="button" className="bouton bouton-discret mt-2" onClick={() => modifier({ recadrage: RECADRAGE_ENTIER })} disabled={!recadre}>
              <RotateCcw className="size-4" aria-hidden="true" />
              Garder toute l&apos;image
            </button>
          </section>

          <section>
            <label htmlFor="img-largeur" className="atelier-titre">
              <ImageDown className="size-4 text-accent" aria-hidden="true" />
              Largeur : {reglages.largeur} px
            </label>
            <input
              id="img-largeur"
              type="range"
              min={LARGEUR_MIN}
              max={Math.min(LARGEUR_MAX, image?.naturalWidth ?? LARGEUR_MAX)}
              step={20}
              value={reglages.largeur}
              onChange={(e) => modifier({ largeur: Number(e.target.value) })}
              className="atelier-glissiere"
            />
            <p className="aide text-sm">Une capture d&apos;écran n&apos;a jamais besoin de plus de 1 200 pixels de large dans un article.</p>
          </section>

          <section>
            <label htmlFor="img-arrondi" className="atelier-titre">
              Coins arrondis : {reglages.arrondi} %
            </label>
            <input
              id="img-arrondi"
              type="range"
              min={0}
              max={50}
              step={1}
              value={reglages.arrondi}
              onChange={(e) => modifier({ arrondi: Number(e.target.value) })}
              className="atelier-glissiere"
            />
          </section>

          <section>
            <label htmlFor="img-cadre" className="atelier-titre">
              Cadre : {reglages.cadre === 0 ? "aucun" : `${reglages.cadre} px`}
            </label>
            <input
              id="img-cadre"
              type="range"
              min={0}
              max={24}
              step={1}
              value={reglages.cadre}
              onChange={(e) => modifier({ cadre: Number(e.target.value) })}
              className="atelier-glissiere"
            />
            <div className="atelier-teintes" role="group" aria-label="Couleur du cadre">
              {TEINTES.map((t) => (
                <button
                  key={t.cle}
                  type="button"
                  className="atelier-teinte"
                  style={{ background: t.cle }}
                  aria-label={t.nom}
                  aria-pressed={reglages.couleurCadre === t.cle}
                  disabled={reglages.cadre === 0}
                  onClick={() => modifier({ couleurCadre: t.cle })}
                />
              ))}
            </div>
          </section>

          <section>
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={reglages.ombre} onChange={(e) => modifier({ ombre: e.target.checked })} className="size-5 accent-[var(--accent)]" />
              <span className="font-semibold">Ombre portée</span>
            </label>
          </section>

          <section>
            <label htmlFor="img-place" className="atelier-titre">
              Place dans l&apos;article
            </label>
            <select id="img-place" className="champ" value={largeurArticle} onChange={(e) => setLargeurArticle(e.target.value as typeof largeurArticle)}>
              {LARGEURS_IMAGE.map((l) => (
                <option key={l.cle} value={l.cle}>
                  {l.libelle}
                </option>
              ))}
            </select>
          </section>

          <section>
            <label htmlFor="img-legende" className="atelier-titre">
              Légende
            </label>
            <input id="img-legende" className="champ !min-h-10 !py-2" value={legende} onChange={(e) => setLegende(e.target.value)} placeholder="Facultative, affichée sous l'image" />
            <label htmlFor="img-alt" className="atelier-titre mt-3">
              Description pour les lecteurs d&apos;écran
            </label>
            <input id="img-alt" className="champ !min-h-10 !py-2" value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Ce que montre l'image" />
          </section>
        </div>
      </div>
    </Modale>
  );
}
