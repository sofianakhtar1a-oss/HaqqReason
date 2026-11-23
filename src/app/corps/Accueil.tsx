"use client";

import { Activity, ChevronLeft, Crosshair, Flame, GraduationCap, Lock, Play, Shield, Snowflake, Sparkles, Target, Timer, Type, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MarquePremium } from "@/components/premium/MarquePremium";
import { ELEMENTS, PAR_ID } from "@/lib/corps/catalogue";
import { CATEGORIES, type CategorieId, ELEMENTS_APPRIS, IDS_CATEGORIES, niveauxDe, titreDuJoueur } from "@/lib/corps/niveaux";
import { aReviserAvant, etoiles, facettesDues, jourDeParis, maitrise, niveauCourant, niveauOuvert, niveauxReussis, useEcorche } from "@/lib/corps/progression";
import { METHODES, type TypeQ, typesDuNiveau } from "@/lib/corps/quiz";
import { REGIONS } from "@/lib/corps/types";
import { useTextes } from "@/lib/modules/textes-client";
import { Anneau, COUCHES_DEFAUT, type Couches, Etoiles, TEINTE, couchesPour, enLumiere, romain } from "./communs";
import type { Jeu, Navigation, Stage } from "./Ecorche";

/** Ce que montre le corps quand on feuillette une catégorie : sa couche pleine, ce qui la situe en retrait. */
const couchesDe = (c: CategorieId): Couches => (c === "corps" ? COUCHES_DEFAUT : couchesPour(CATEGORIES[c].couches[0]));

export function Accueil({ stage, detail, nav }: { stage: Stage; detail: string | null; nav: Navigation }) {
  const categorie = IDS_CATEGORIES.find((c) => c === detail?.split("/")[0]) ?? null;
  return categorie ? <Categorie stage={stage} categorie={categorie} nav={nav} /> : <Vestibule stage={stage} nav={nav} />;
}

/* ---------------------------------------------------------------- le vestibule */

function Vestibule({ stage, nav }: { stage: Stage; nav: Navigation }) {
  const t = useTextes("corps");
  const e = useEcorche();
  const p = e.profil;
  const dues = facettesDues(e);
  const connues = Object.keys(e.elements).length;
  const { titre, suivant, part } = titreDuJoueur(p.xp);
  const jour = jourDeParis();
  const faites = p.jourObjectif === jour ? p.faites : 0;
  const defiFait = (e.records[`defi:${jour}`] ?? 0) > 0;

  useEffect(() => {
    stage.regler({ couches: COUCHES_DEFAUT, profondeur: 0, etats: {}, isoler: null, rotation: true, etiquette: null, retrait: false });
    stage.surChoix(null);
    stage.poignee.current?.vue("ensemble");
  }, [stage]);

  return (
    <div className="ec-vestibule">
      <header className="ec-hero">
        <h1 className="ec-hero-titre">{t("accueil.titre") || "Le corps humain, couche par couche"}</h1>
        <p className="ec-hero-chapo">{t("accueil.chapo") || `Un vrai corps en trois dimensions : ${ELEMENTS.length} structures à explorer, des os aux nerfs, et ${ELEMENTS_APPRIS.length} à reconnaître, à situer et à nommer, planche après planche.`}</p>
      </header>

      <section className="ec-jour" aria-label="Aujourd'hui">
        <Anneau part={faites / p.objectif} taille={64}>
          <b>{Math.min(faites, p.objectif)}</b>
          <small>/{p.objectif}</small>
        </Anneau>
        <div className="ec-jour-texte">
          <p className="ec-jour-titre">{faites >= p.objectif ? "Objectif du jour atteint" : "L'objectif du jour"}</p>
          <p className="ec-jour-detail">
            <span className="ec-serie" title="Jours d'affilée">
              <Flame size={15} aria-hidden="true" /> {p.jours} jour{p.jours > 1 ? "s" : ""}
            </span>
            {p.gels > 0 && (
              <span className="ec-gels" title="Un gel sauve la série d'un jour manqué">
                <Snowflake size={14} aria-hidden="true" /> {p.gels}
              </span>
            )}
            <span className="ec-titre-joueur" title={suivant ? `${suivant.nom} à ${suivant.xp} XP` : "Le plus haut titre"}>
              {titre.nom} · {p.xp} XP
            </span>
          </p>
          <span className="ec-jauge" aria-hidden="true">
            <span style={{ transform: `scaleX(${part})` }} />
          </span>
        </div>
      </section>

      <div className="ec-actions-jour">
        <button type="button" className="ec-bouton est-plein" disabled={!dues.length && !connues} onClick={() => nav.jouer({ sorte: "jour", titre: "La révision du jour" })}>
          <Sparkles size={16} aria-hidden="true" />
          {dues.length ? `La révision du jour : ${dues.length} à revoir` : connues ? "Rien qui s'oublie : apprendre plus" : "Rien à réviser aujourd'hui"}
        </button>
        <button type="button" className="ec-bouton" onClick={() => nav.jouer({ sorte: "defi", titre: "Le défi du jour", jour })}>
          <Target size={16} aria-hidden="true" />
          {defiFait ? `Défi du jour : ${e.records[`defi:${jour}`]}/10` : "Le défi du jour"}
          <MarquePremium fonction="ecorche.jeux" compacte />
        </button>
      </div>

      <section className="ec-registre" aria-labelledby="ec-titre-couches">
        <h2 id="ec-titre-couches" className="ec-section-titre">
          {t("accueil.categories") || "Les couches du corps"}
        </h2>
        <ol className="ec-registre-liste">
          {IDS_CATEGORIES.map((c) => {
            const def = CATEGORIES[c];
            const total = niveauxDe(c).length;
            const reussis = niveauxReussis(e, c);
            const m = maitrise(e, c);
            return (
              <li key={c}>
                <a href={`#apprendre/${c}`} className="ec-registre-ligne" data-categorie={c}>
                  <span className="ec-registre-nom">{def.nom}</span>
                  <span className="ec-registre-texte">{def.texte}</span>
                  <span className="ec-registre-chiffres">
                    <span>
                      {reussis}/{total} planches
                    </span>
                    <span>
                      {m.sus}/{m.total} sues
                    </span>
                  </span>
                  <span className="ec-jauge fine" aria-hidden="true">
                    <span style={{ transform: `scaleX(${m.total ? m.sus / m.total : 0})` }} />
                  </span>
                </a>
              </li>
            );
          })}
        </ol>
      </section>

      <section aria-labelledby="ec-titre-rapides">
        <h2 id="ec-titre-rapides" className="ec-section-titre">
          {t("accueil.rapides") || "Pour quelques minutes"}
        </h2>
        <div className="ec-rapides">
          <button type="button" className="ec-rapide" onClick={() => nav.jouer({ sorte: "eclair", titre: "Éclair", categorie: "corps" })}>
            <Zap size={20} aria-hidden="true" />
            <b>Éclair</b>
            <MarquePremium fonction="ecorche.jeux" compacte />
            <span>Une minute, le plus de bonnes réponses. {e.records.eclair ? `Record : ${e.records.eclair}` : ""}</span>
          </button>
          <button type="button" className="ec-rapide" onClick={() => nav.jouer({ sorte: "survie", titre: "Survie", categorie: "corps" })}>
            <Shield size={20} aria-hidden="true" />
            <b>Survie</b>
            <MarquePremium fonction="ecorche.jeux" compacte />
            <span>Trois vies, des questions de plus en plus dures. {e.records.survie ? `Record : ${e.records.survie}` : ""}</span>
          </button>
          <button type="button" className="ec-rapide" onClick={() => nav.jouer({ sorte: "fonctions", titre: "Les fonctions", categorie: "corps" })}>
            <Activity size={20} aria-hidden="true" />
            <b>Les fonctions</b>
            <MarquePremium fonction="ecorche.jeux" compacte />
            <span>Le geste d’un muscle, son nerf, le chemin du sang, le pouls, la clinique.</span>
          </button>
          <button type="button" className="ec-rapide" onClick={() => nav.jouer({ sorte: "examen", titre: "L'examen final" })}>
            <GraduationCap size={20} aria-hidden="true" />
            <b>L’examen final</b>
            <MarquePremium fonction="ecorche.jeux" compacte />
            <span>Quarante questions sur tout le corps ; réussi à 80 %. {e.records.examen ? `Meilleur : ${e.records.examen} %` : ""}</span>
          </button>
          <button type="button" className="ec-rapide" onClick={() => nav.jeu({ sorte: "nomme", categorie: "muscles", grande: "membre-sup" })}>
            <Type size={20} aria-hidden="true" />
            <b>Nomme-les tous</b>
            <MarquePremium fonction="ecorche.jeux" compacte />
            <span>Écris tous les noms d’une région avant la fin du temps.</span>
          </button>
          <button type="button" className="ec-rapide" onClick={() => nav.jeu({ sorte: "muet", categorie: "os", grande: "tronc" })}>
            <Crosshair size={20} aria-hidden="true" />
            <b>Le corps muet</b>
            <MarquePremium fonction="ecorche.jeux" compacte />
            <span>Un nom, un toucher : retrouve chaque structure sur le corps.</span>
          </button>
        </div>
      </section>
    </div>
  );
}

/* ---------------------------------------------------------------- une catégorie et ses planches */

function Categorie({ stage, categorie, nav }: { stage: Stage; categorie: CategorieId; nav: Navigation }) {
  const e = useEcorche();
  const def = CATEGORIES[categorie];
  const niveaux = niveauxDe(categorie);
  const courant = niveauCourant(e, categorie);
  const [choisi, setChoisi] = useState(courant);
  const niv = niveaux[choisi - 1];
  const ouvert = niveauOuvert(e, categorie, choisi);
  const [methode, setMethode] = useState<TypeQ | "">("");
  const methodes = useMemo(() => typesDuNiveau(categorie, Math.max(choisi, 6)), [categorie, choisi]);
  const flanchent = aReviserAvant(e, categorie, choisi);

  // La planche choisie s'allume sur le corps, et la caméra s'en approche.
  useEffect(() => {
    if (!niv) return;
    const ids = categorie === "corps" ? niv.nouveaux.filter((id) => (PAR_ID.get(id)?.rang ?? 9) <= 1).slice(0, 30) : niv.nouveaux;
    // Les structures de la planche ressortent ; le reste du corps passe en transparence.
    stage.regler({ couches: couchesDe(categorie), decouvrir: categorie === "muscles" || categorie === "tendons" ? ids : null, profondeur: 0, etats: enLumiere(ids, TEINTE.laiton, false), isoler: null, voiler: { ids, reste: 0.35 }, rotation: false, etiquette: null, retrait: false });
    stage.surChoix((s) => {
      if (s) nav.aller(`explorer/${s.element}`);
    });
    if (categorie === "corps" && choisi >= 5) stage.poignee.current?.vue("ensemble");
    else stage.poignee.current?.viser(ids, { marge: 1.1 });
    return () => stage.surChoix(null);
  }, [stage, categorie, choisi, niv, nav]);

  const lancer = (m: TypeQ | "") => nav.jouer({ sorte: "niveau", categorie, n: choisi, titre: `${def.nom} · Planche ${romain(choisi)}`, methode: m || null, revision: flanchent });

  return (
    <div className="ec-categorie">
      <a href="#apprendre" className="ec-retour">
        <ChevronLeft size={16} aria-hidden="true" /> Toutes les couches
      </a>
      <h1 className="ec-page-titre">{def.nom}</h1>
      <p className="ec-page-chapo">{def.texte}</p>

      <ol className="ec-planches" aria-label="Les planches">
        {niveaux.map((n) => {
          const ok = niveauOuvert(e, categorie, n.n);
          const et = etoiles(e, categorie, n.n);
          return (
            <li key={n.n}>
              <button type="button" className="ec-planche" aria-pressed={choisi === n.n} data-ouverte={ok} onClick={() => setChoisi(n.n)}>
                <span className="ec-planche-num">{romain(n.n)}</span>
                <span className="ec-planche-titre">{n.titre}</span>
                <span className="ec-planche-etat">{ok ? et > 0 ? <Etoiles n={et} taille={12} /> : n.n === courant ? <span className="ec-pastille">À faire</span> : null : <Lock size={13} aria-label="Fermée" />}</span>
              </button>
            </li>
          );
        })}
      </ol>

      {niv && (
        <section className="ec-planche-detail" aria-live="polite">
          <h2 className="ec-section-titre">
            Planche {romain(niv.n)} · {niv.titre}
          </h2>
          <p className="ec-planche-noms">
            {categorie === "corps"
              ? `${niv.nouveaux.length} structures, toutes couches mêlées : chaque partie en tire de nouvelles.`
              : niv.nouveaux.map((id) => PAR_ID.get(id)?.nom).join(" · ")}
          </p>
          {ouvert ? (
            <>
              <button type="button" className="ec-bouton est-plein est-grand" onClick={() => lancer(methode)}>
                <Play size={17} aria-hidden="true" />
                {etoiles(e, categorie, niv.n) > 0 ? "Rejouer la planche" : "Commencer la planche"}
                <MarquePremium fonction="ecorche.jeux" compacte />
              </button>
              <label className="ec-champ">
                <span>Méthode</span>
                <select value={methode} onChange={(ev) => setMethode(ev.target.value as TypeQ | "")}>
                  <option value="">Toutes, mêlées (conseillé)</option>
                  {methodes.map((m) => (
                    <option key={m} value={m}>
                      {METHODES[m].nom} — {METHODES[m].texte}
                    </option>
                  ))}
                </select>
              </label>
              {flanchent.length > 0 && <p className="ec-note">{flanchent.length} structure{flanchent.length > 1 ? "s" : ""} déjà vue{flanchent.length > 1 ? "s" : ""} reviendront pendant la planche : elles flanchent encore.</p>}
            </>
          ) : (
            <p className="ec-note">
              <Lock size={14} aria-hidden="true" /> Réussis d’abord la planche {romain(niv.n - 1)}.
            </p>
          )}
          {categorie !== "corps" && (
            <div className="ec-jeux-categorie">
              <p className="ec-note">Ou, sur toute la couche :</p>
              <div className="ec-boutons">
                <button type="button" className="ec-bouton" onClick={() => nav.jeu({ sorte: "muet", categorie: categorie as Jeu["categorie"], grande: REGIONS.find((r) => r.id === PAR_ID.get(niv.nouveaux[0])?.region)?.grande ?? "tronc" })}>
                  <Crosshair size={15} aria-hidden="true" /> Le corps muet <MarquePremium fonction="ecorche.jeux" compacte />
                </button>
                <button type="button" className="ec-bouton" onClick={() => nav.jeu({ sorte: "nomme", categorie: categorie as Jeu["categorie"], grande: REGIONS.find((r) => r.id === PAR_ID.get(niv.nouveaux[0])?.region)?.grande ?? "tronc" })}>
                  <Type size={15} aria-hidden="true" /> Nomme-les tous <MarquePremium fonction="ecorche.jeux" compacte />
                </button>
                <button type="button" className="ec-bouton" onClick={() => nav.jouer({ sorte: "eclair", titre: `Éclair · ${def.nom}`, categorie })}>
                  <Timer size={15} aria-hidden="true" /> Éclair <MarquePremium fonction="ecorche.jeux" compacte />
                </button>
                <button type="button" className="ec-bouton" onClick={() => nav.jouer({ sorte: "fonctions", titre: `Les fonctions · ${def.nom}`, categorie })}>
                  <Activity size={15} aria-hidden="true" /> Les fonctions <MarquePremium fonction="ecorche.jeux" compacte />
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
