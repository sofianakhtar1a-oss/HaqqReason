"use client";

import { Flame } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { eclat, franchir, Moteur, mouvementReduit, recetteAmbiance, souffler } from "@/lib/langues/feux";
import { palier, PALIERS } from "@/lib/langues/points";
import { surEvenement, useJoueur } from "@/lib/langues/points-client";

/*
 * La série, en séance : ce qui change à l'écran selon le palier atteint.
 *   Palier 0 (azur)       : une aura calme qui respire.
 *   Étincelle (×1,5, 5)   : l'aura s'ambre, des poussières d'or montent du bas.
 *   Flamme (×2, 10)       : des braises montent, l'aura vire au feu.
 *   Brasier (×2,5, 20)    : braises pourpres plus vives, l'aura tourne lentement.
 *   Comète (×3, 40)       : aurore boréale en fond, comètes au passage du palier.
 * Une bonne réponse jette quelques étincelles depuis la réponse ; une erreur souffle la flamme.
 * Tout reste derrière le texte ou passe en moins d'une seconde : la lecture n'est jamais gênée.
 */

/** Le compteur de série, dans l'en-tête de la séance. */
export function CompteurSerie() {
  const { serie, connecte } = useJoueur();
  const p = palier(serie);
  const ref = useRef<HTMLSpanElement>(null);
  const [gains, setGains] = useState<{ id: number; texte: string; bonus?: string }[]>([]);
  const [secousse, setSecousse] = useState(0);
  const [eteinte, setEteinte] = useState(0);
  const [tampon, setTampon] = useState<{ id: number; nom: string } | null>(null);

  useEffect(() => {
    let n = 0;
    return surEvenement((e) => {
      if (e.type === "serie") {
        if (e.serie > e.avant) {
          setSecousse((k) => k + 1);
          // Les étincelles partent de la bonne réponse (choix, champ écrit, ou bandeau du résultat).
          requestAnimationFrame(() => {
            const cible = document.querySelector('.lg-choix-bouton[data-etat="bonne"], .lg-ecriture-champ, .lg-retour-icone, .lg-paire[data-trouve]');
            const r = cible?.getBoundingClientRect();
            if (r) eclat(r.left + r.width / 2, r.top + r.height / 2, palier(e.serie).teinte, 0.8 + Math.min(1.2, e.serie / 25));
          });
        } else if (e.serie === 0 && e.avant >= 3) {
          setEteinte((k) => k + 1);
          souffler(ref.current);
        }
      } else if (e.type === "palier") {
        const pa = PALIERS[e.index];
        setTampon({ id: ++n, nom: pa.nom });
        franchir(ref.current, pa.teinte);
      } else if (e.type === "gain") {
        const id = ++n;
        setGains((g) => [...g.slice(-3), { id, texte: `+${e.gain}`, bonus: e.bonus ? `+${e.bonus} · ${e.jours} jour${e.jours > 1 ? "s" : ""} d'affilée` : undefined }]);
        setTimeout(() => setGains((g) => g.filter((x) => x.id !== id)), 1600);
      }
    });
  }, []);

  useEffect(() => {
    if (!tampon) return;
    const m = setTimeout(() => setTampon(null), 1900);
    return () => clearTimeout(m);
  }, [tampon]);

  const titre = serie
    ? `${serie} bonne${serie > 1 ? "s" : ""} réponse${serie > 1 ? "s" : ""} d'affilée${p.mult > 1 ? ` : points ×${String(p.mult).replace(".", ",")}` : ""}${p.prochain ? ` (palier suivant à ${p.prochain})` : ""}`
    : "Série de bonnes réponses";
  return (
    <span className="lg-serie" data-teinte={p.teinte} data-palier={p.index} data-actif={serie > 0 || undefined} title={titre} aria-label={titre}>
      <span ref={ref} key={`f${eteinte}`} className="lg-serie-flamme" data-eteinte={eteinte ? "" : undefined} aria-hidden="true">
        <Flame className="size-4" strokeWidth={2.2} />
      </span>
      <span key={`n${secousse}`} className="lg-serie-nombre" data-anime={secousse ? "" : undefined}>
        {serie}
      </span>
      {p.mult > 1 && <span className="lg-serie-mult">×{String(p.mult).replace(".", ",")}</span>}
      {gains.map((g) => (
        <span key={g.id} className="lg-gain" aria-hidden="true">
          {g.texte}
          {g.bonus && <small>{g.bonus}</small>}
        </span>
      ))}
      {tampon && (
        <span key={tampon.id} className="lg-tampon" role="status">
          {tampon.nom}
          <small>points ×{String(PALIERS.find((x) => x.nom === tampon.nom)?.mult ?? 1).replace(".", ",")}</small>
        </span>
      )}
      {connecte === false && <span className="sr-only">Connecte-toi pour que tes points entrent au classement.</span>}
    </span>
  );
}

/** L'ambiance derrière la séance : une aura (CSS) et quelques particules selon le palier. */
export function Atmosphere() {
  const { serie } = useJoueur();
  const p = palier(serie);
  const canvas = useRef<HTMLCanvasElement>(null);
  const moteur = useRef<Moteur | null>(null);

  useEffect(() => {
    if (!canvas.current || mouvementReduit()) return;
    const m = new Moteur(canvas.current);
    moteur.current = m;
    return () => {
      m.detruire();
      moteur.current = null;
    };
  }, []);

  useEffect(() => {
    const a = recetteAmbiance(p.teinte);
    moteur.current?.regler(a.debit, a.recette);
  }, [p.teinte]);

  return (
    <div className="lg-atmosphere" data-teinte={p.teinte} aria-hidden="true">
      <span className="lg-aura" />
      <span className="lg-aurore" />
      <canvas ref={canvas} className="lg-atmosphere-feux" />
    </div>
  );
}
