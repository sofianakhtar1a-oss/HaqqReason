"use client";

import { ArrowLeft, BookOpen, Crown, Lock, Map as IconeCarte, Sailboat } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { CONTINENTS, NOM_CONTINENT, pays } from "@/lib/monde/atlas";
import { CATEGORIES, type CategorieId, TYPES, type TypeQuestion, typesDe } from "@/lib/monde/categories";
import { MarquePremium } from "@/components/premium/MarquePremium";
import { grade, NB_NIVEAUX, niveauxDe, QUESTIONS_PAR_NIVEAU } from "@/lib/monde/niveaux";
import { boite, etoiles, maitrise, niveauCourant, niveauOuvert, niveauxReussis, useMonde } from "@/lib/monde/progression";
import { ICONES_CATEGORIES } from "./Accueil";
import { Decouvrir } from "./Apprendre";
import { Globe, type Teinte } from "./Globe";
import { Etoiles } from "./communs";
import { type Lancement, useLancer } from "./Partie";
import { jouer } from "./sons";

/*
 * Une catégorie : quinze escales sur une route maritime, du mousse à l'Atlas.
 * Avant de partir, on choisit sa méthode (le mélange, ou une seule façon de poser la question).
 */

export function Categorie({ id, onRetour, lancer }: { id: CategorieId; onRetour: () => void; lancer: (l: Lancement) => void }) {
  const def = CATEGORIES[id];
  const Icone = ICONES_CATEGORIES[id];
  const monde = useMonde();
  const l = useLancer();
  const [methode, setMethode] = useState<TypeQuestion | null>(null);
  const niveaux = niveauxDe(id);
  const [decouvre, setDecouvre] = useState<number | null>(null);
  const [carte, setCarte] = useState(false);
  const faits = niveauxReussis(monde, id);
  const record = monde.records[`epreuve:${id}`];
  // La carte de conquête : dorés, les pays maîtrisés ; pâles, ceux qu'on a commencé à apprendre.
  const conquete = useMemo(() => {
    const t: Record<string, Teinte> = {};
    for (const code of niveaux.flat()) {
      const b = boite(monde, code, id);
      if (b >= 3) t[code] = "or";
      else if (monde.pays[code]?.[id]) t[code] = "doux";
    }
    return t;
  }, [monde, niveaux, id]);
  const courant = niveauCourant(monde, id);
  const m = maitrise(monde, id);

  /*
   * Une escale vient de s'ouvrir (la partie est refermée) : le cadenas saute, puis le voilier
   * descend la route jusqu'à elle, et l'escale se dore comme de l'encre fraîche.
   */
  const route = useRef<HTMLOListElement>(null);
  const voilier = useRef<HTMLSpanElement>(null);
  const courantVu = useRef(courant);
  const courantActuel = useRef(courant);
  const [ouverture, setOuverture] = useState<{ de: number; vers: number; etape: "cadenas" | "voile" | "dore" } | null>(null);
  useEffect(() => {
    courantActuel.current = courant;
  });
  useEffect(() => {
    const fermee = () => {
      const vers = courantActuel.current;
      const de = courantVu.current;
      courantVu.current = vers;
      if (vers <= de || vers > NB_NIVEAUX) return;
      jouer("debloque");
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      setOuverture({ de, vers, etape: "cadenas" });
    };
    window.addEventListener("portulan:partie-fermee", fermee);
    return () => window.removeEventListener("portulan:partie-fermee", fermee);
  }, []);
  useEffect(() => {
    if (!ouverture) return;
    const ol = route.current;
    const li = ol?.querySelector<HTMLElement>(`[data-n="${ouverture.vers}"]`);
    if (ouverture.etape === "cadenas") {
      li?.scrollIntoView({ behavior: "smooth", block: "center" });
      const t = setTimeout(() => setOuverture((o) => (o ? { ...o, etape: "voile" } : o)), 1000);
      return () => clearTimeout(t);
    }
    if (ouverture.etape === "voile") {
      const a = ol?.querySelector<HTMLElement>(`[data-n="${ouverture.de}"] .pt-escale-medaille`)?.getBoundingClientRect();
      const b = li?.querySelector<HTMLElement>(".pt-escale-medaille")?.getBoundingClientRect();
      const base = ol?.getBoundingClientRect();
      const v = voilier.current;
      if (!a || !b || !base || !v) {
        const t = setTimeout(() => setOuverture((o) => (o ? { ...o, etape: "dore" } : o)), 0);
        return () => clearTimeout(t);
      }
      const ax = a.left + a.width / 2 - base.left;
      const ay = a.top + a.height / 2 - base.top;
      const bx = b.left + b.width / 2 - base.left;
      const by = b.top + b.height / 2 - base.top;
      // Une courbe douce : le voilier s'écarte un peu de la route à mi-chemin, en tanguant.
      const mx = (ax + bx) / 2 + Math.min(46, Math.abs(by - ay) * 0.35);
      const my = (ay + by) / 2;
      const anim = v.animate(
        [
          { transform: `translate(${ax}px, ${ay}px) rotate(-8deg) scale(0.9)`, opacity: 0 },
          { transform: `translate(${ax}px, ${ay}px) rotate(-8deg) scale(1)`, opacity: 1, offset: 0.12 },
          { transform: `translate(${mx}px, ${my}px) rotate(7deg) scale(1.08)`, offset: 0.55 },
          { transform: `translate(${bx}px, ${by}px) rotate(-3deg) scale(1)`, opacity: 1, offset: 0.92 },
          { transform: `translate(${bx}px, ${by}px) rotate(0deg) scale(1)`, opacity: 0 },
        ],
        { duration: 1500, easing: "cubic-bezier(0.45, 0.05, 0.3, 1)", fill: "forwards" },
      );
      anim.onfinish = () => setOuverture((o) => (o ? { ...o, etape: "dore" } : o));
      return () => anim.cancel();
    }
    // L'encre dorée s'étale, puis tout redevient la route de tous les jours.
    const t = setTimeout(() => setOuverture(null), 1400);
    return () => clearTimeout(t);
  }, [ouverture]);

  return (
    <div className="pt-categorie" data-categorie={id}>
      <button type="button" className="pt-retour-lien" onClick={onRetour}>
        <ArrowLeft className="size-4" aria-hidden="true" />
        Toutes les routes
      </button>
      <header className="pt-categorie-tete">
        <Icone className="pt-categorie-icone" strokeWidth={1.3} aria-hidden="true" />
        <div>
          <h2 className="pt-titre">{def.nom}</h2>
          <p className="pt-chapo">{def.texte}</p>
          <p className="pt-maitrise">
            <span className="pt-maitrise-barre" aria-hidden="true">
              <span style={{ transform: `scaleX(${m.total ? m.sus / m.total : 0})` }} />
            </span>
            <span className="tabular-nums">
              {m.sus} sur {m.total} maîtrisés
            </span>
          </p>
        </div>
      </header>

      <fieldset className="pt-methodes">
        <legend>Méthode</legend>
        <button type="button" className="pt-puce" aria-pressed={methode === null} onClick={() => setMethode(null)}>
          Mélange (recommandé)
        </button>
        {typesDe(id).map((t) => (
          <button key={t} type="button" className="pt-puce" aria-pressed={methode === t} onClick={() => setMethode(t)}>
            {TYPES[t].libelle}
          </button>
        ))}
      </fieldset>

      <div className="pt-categorie-outils">
        <button type="button" className="bouton bouton-discret" aria-pressed={carte} onClick={() => setCarte((c) => !c)}>
          <IconeCarte className="size-4" aria-hidden="true" />
          {carte ? "Cacher ma carte" : "Ma carte de conquête"}
        </button>
        <div className="pt-continents" role="group" aria-label="Jouer sur un continent">
          {CONTINENTS.filter((c) => c.id !== "antarctique" && niveaux.flat().some((code) => pays(code).continent === c.id)).map((c) => (
            <button key={c.id} type="button" className="pt-puce" onClick={() => lancer(l.filtre(id, c.id))} title={`20 questions sur ${NOM_CONTINENT[c.id]}`}>
              {c.court}
            </button>
          ))}
        </div>
      </div>
      {carte && (
        <div className="pt-conquete">
          <Globe key={monde.profil.globe} mode="plan" teintes={conquete} interactif libelle={`Ma carte de conquête : ${m.sus} pays maîtrisés sur ${m.total}.`} />
          <p className="pt-astuce">Dorés : les pays maîtrisés ; pâles : ceux que tu as commencé à apprendre.</p>
        </div>
      )}

      <div className="pt-route-cadre">
        {ouverture?.etape === "voile" && (
          <span ref={voilier} className="pt-route-voilier" aria-hidden="true">
            <Sailboat className="size-5" />
          </span>
        )}
        <ol ref={route} className="pt-route" aria-label={`Les ${NB_NIVEAUX} niveaux`}>
        {niveaux.map((codes, i) => {
          const n = i + 1;
          const ouvert = niveauOuvert(monde, id, n);
          const e = etoiles(monde, id, n);
          const fait = Boolean(monde.niveaux[`${id}:${n}`]?.f);
          const g = grade(n);
          const apercu = codes.slice(0, 3).map((c) => pays(c).nom);
          return (
            <li key={n} data-n={n} className="pt-escale" data-ouvert={ouvert || undefined} data-fait={fait || undefined} data-courant={n === courant || undefined} style={{ "--i": i } as React.CSSProperties}>
              <button
                type="button"
                className="pt-escale-bouton"
                disabled={!ouvert}
                onClick={() => lancer(l.niveau(id, n, methode))}
                aria-label={`Niveau ${n}, ${g.nom}${ouvert ? (fait ? `, ${e} étoile${e > 1 ? "s" : ""}` : ", à jouer") : ", verrouillé"}`}
              >
                <span className="pt-escale-medaille" aria-hidden="true" data-ouvre={(ouverture?.vers === n && ouverture.etape === "cadenas") || undefined} data-dore={(ouverture?.vers === n && ouverture.etape === "dore") || undefined}>
                  {ouverture?.vers === n && ouverture.etape === "cadenas" ? (
                    <Lock className="size-4" />
                  ) : ouverture?.vers === n && ouverture.etape === "voile" ? null : n === courant && ouvert ? (
                    <Sailboat className="size-5" />
                  ) : ouvert ? (
                    n
                  ) : (
                    <Lock className="size-4" />
                  )}
                </span>
                <span className="pt-escale-corps">
                  <span className="pt-escale-grade">
                    <span className="pt-escale-num">Niveau {n}</span> {g.nom}
                    {n > 5 && <MarquePremium fonction="portulan.niveaux-avances" compacte />}
                  </span>
                  <span className="pt-escale-pays">
                    {apercu.join(", ")}
                    {codes.length > 3 ? ` et ${codes.length - 3} autres` : ""}
                  </span>
                  <span className="pt-escale-regles">{QUESTIONS_PAR_NIVEAU} questions et 3 cœurs</span>
                </span>
                <Etoiles n={e} />
              </button>
              <button type="button" className="pt-escale-decouvrir" onClick={() => setDecouvre(n)} aria-label={`Découvrir les pays du niveau ${n}`}>
                <BookOpen className="size-4" aria-hidden="true" />
                <span>Découvrir</span>
              </button>
            </li>
          );
        })}
        </ol>
      </div>
      <div className="pt-epreuve" data-ouverte={faits >= NB_NIVEAUX || undefined}>
        <Crown className="pt-epreuve-icone" aria-hidden="true" />
        <div>
          <p className="pt-epreuve-titre">L&apos;épreuve finale</p>
          <p className="pt-epreuve-texte">
            {faits >= NB_NIVEAUX
              ? record
                ? `Réussie : ${record} bonnes réponses. Tu peux la rejouer pour faire mieux.`
                : "Quarante questions sur toute la route, toutes les méthodes, trois cœurs. Une médaille de saphir pour les maîtres."
              : `Réussis les ${NB_NIVEAUX} niveaux pour l'ouvrir (encore ${NB_NIVEAUX - faits}).`}
          </p>
        </div>
        <button type="button" className="bouton bouton-principal" disabled={faits < NB_NIVEAUX} onClick={() => lancer(l.epreuve(id))}>
          {faits >= NB_NIVEAUX ? "Tenter l'épreuve" : <Lock className="size-4" aria-label="Verrouillée" />}
        </button>
      </div>
      {decouvre !== null && (
        <Decouvrir
          titre={`${def.nom}, niveau ${decouvre}`}
          codes={niveaux[decouvre - 1] ?? []}
          categorie={id}
          onFermer={() => setDecouvre(null)}
          onJouer={niveauOuvert(monde, id, decouvre) ? () => {
            const n = decouvre;
            setDecouvre(null);
            lancer(l.niveau(id, n, methode));
          } : undefined}
        />
      )}
    </div>
  );
}
