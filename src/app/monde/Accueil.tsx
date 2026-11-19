"use client";

import { ArrowRight, Coins, Earth, Flag, Flame, Infinity as Infini, Landmark, Map as IconeCarte, RotateCcw, Shuffle, Timer, Zap } from "lucide-react";
import { useMemo } from "react";
import { formatNombre, formatPopulation, formatSuperficie, jourDeParis, motCapitale, NOM_CONTINENT, paysDuJour } from "@/lib/monde/atlas";
import { CATEGORIES, type CategorieId, IDS_CATEGORIES } from "@/lib/monde/categories";
import { NOMBRE_PAYS } from "@/lib/monde/chiffres";
import { useCompteMonde } from "@/lib/monde/compte-client";
import { grade, NB_NIVEAUX } from "@/lib/monde/niveaux";
import { ducats, maitrise, niveauCourant, niveauxReussis, paysConnus, regler, revisionsDues, useMonde } from "@/lib/monde/progression";
import { useTextes } from "@/lib/modules/textes-client";
import { Categorie } from "./Categorie";
import { Ducats, RoseDesVents } from "./communs";
import { Drapeau } from "./figures";
import { Globe, type Teinte } from "./Globe";
import { type Lancement, useLancer } from "./Partie";

export const ICONES_CATEGORIES: Record<CategorieId, typeof Flag> = { drapeaux: Flag, capitales: Landmark, cartes: IconeCarte, continents: Earth, monnaies: Coins };

export function Accueil({ categorie, onCategorie, lancer, aller }: { categorie: string | null; onCategorie: (id: string | null) => void; lancer: (l: Lancement) => void; aller: (hash: string) => void }) {
  if (categorie && categorie in CATEGORIES) return <Categorie id={categorie as CategorieId} onRetour={() => onCategorie(null)} lancer={lancer} />;
  return <Hub onCategorie={onCategorie} lancer={lancer} aller={aller} />;
}

function Hub({ onCategorie, lancer, aller }: { onCategorie: (id: string | null) => void; lancer: (l: Lancement) => void; aller: (hash: string) => void }) {
  const t = useTextes("monde");
  const monde = useMonde();
  const compte = useCompteMonde();
  const l = useLancer();
  const connus = paysConnus(monde);
  const dues = revisionsDues(monde).length;
  const jour = jourDeParis();
  const duJour = paysDuJour(jour);

  // Les pays maîtrisés se dorent sur le globe.
  const teintes = useMemo(() => {
    const t: Record<string, Teinte> = {};
    for (const [code, m] of Object.entries(monde.pays)) {
      const n = Object.entries(m).filter(([f, x]) => f !== "fiches" && (x?.[2] ?? 0) >= 3).length;
      if (n >= 1) t[code] = "or";
    }
    return t;
  }, [monde.pays]);

  // Reprendre : la catégorie la plus avancée, à son prochain niveau.
  const reprise = useMemo(() => {
    let meilleure: { c: CategorieId; n: number; faits: number } | null = null;
    for (const c of IDS_CATEGORIES) {
      const faits = niveauxReussis(monde, c);
      if (!meilleure || faits > meilleure.faits) meilleure = { c, n: niveauCourant(monde, c), faits };
    }
    return meilleure!;
  }, [monde]);
  const xpAffichee = compte.enLigne && compte.connecte ? compte.xp : monde.profil.xp;

  return (
    <div className="pt-hub">
      <section className="pt-heros">
        <div className="pt-heros-texte">
          <h2 className="pt-titre">{t("accueil.titre")}</h2>
          <p className="pt-chapo">{t("accueil.chapo", { pays: NOMBRE_PAYS })}</p>
          <dl className="pt-bilan">
            <div>
              <dt>Pays connus</dt>
              <dd>
                <span className="tabular-nums">{connus}</span>
                <span className="pt-bilan-sur">/{NOMBRE_PAYS}</span>
              </dd>
            </div>
            <div>
              <dt>XP</dt>
              <dd className="tabular-nums">{formatNombre(xpAffichee)}</dd>
            </div>
            <div>
              <dt>Ducats</dt>
              <dd>
                <Ducats n={ducats(monde)} />
              </dd>
            </div>
            <div>
              <dt>Série</dt>
              <dd>
                <Flame className="pt-flamme" data-allumee={monde.profil.dernierJour === jour || undefined} aria-hidden="true" />
                <span className="tabular-nums">{monde.profil.jours}</span>
                <span className="pt-bilan-sur"> j</span>
              </dd>
            </div>
          </dl>
          <div className="pt-heros-actions">
            <button type="button" className="bouton bouton-principal" onClick={() => lancer(l.niveau(reprise.c, reprise.n))}>
              {reprise.faits ? "Reprendre" : "Commencer"} : {CATEGORIES[reprise.c].nom}, niveau {reprise.n}
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
            <button type="button" className="bouton bouton-discret" onClick={() => lancer(l.rapide("tour"))}>
              <Shuffle className="size-4" aria-hidden="true" />
              Le tour du monde
            </button>
          </div>
        </div>
        <div className="pt-heros-globe">
          <RoseDesVents className="pt-heros-rose" />
          <Globe tourne glissable teintes={teintes} libelle={`Le globe : ${Object.keys(teintes).length} pays déjà dorés par ta mémoire. Fais-le tourner dans tous les sens.`} vueInitiale={{ lon: 12, lat: 24, zoom: 1 }} />
        </div>
      </section>

      <section aria-labelledby="pt-routes">
        <h3 id="pt-routes" className="pt-sous-titre">
          {t("accueil.categories")}
        </h3>
        <div className="pt-cartouches">
          {IDS_CATEGORIES.map((c, i) => {
            const def = CATEGORIES[c];
            const Icone = ICONES_CATEGORIES[c];
            const m = maitrise(monde, c);
            const faits = niveauxReussis(monde, c);
            const courant = niveauCourant(monde, c);
            const pourcent = m.total ? Math.round((m.sus / m.total) * 100) : 0;
            return (
              <button key={c} type="button" className="pt-cartouche" data-categorie={c} style={{ "--i": i, "--part": pourcent / 100 } as React.CSSProperties} onClick={() => onCategorie(c)}>
                <span className="pt-cartouche-cadre" aria-hidden="true" />
                <span className="pt-cartouche-tete">
                  <Icone className="pt-cartouche-icone" strokeWidth={1.5} aria-hidden="true" />
                  <span className="pt-anneau" role="img" aria-label={`${pourcent} % maîtrisé`}>
                    <svg viewBox="0 0 36 36" aria-hidden="true">
                      <circle cx="18" cy="18" r="15.5" className="pt-anneau-fond" />
                      <circle cx="18" cy="18" r="15.5" className="pt-anneau-plein" pathLength={100} />
                    </svg>
                    <span className="tabular-nums">{pourcent}%</span>
                  </span>
                </span>
                <span className="pt-cartouche-nom">{def.nom}</span>
                <span className="pt-cartouche-texte">{def.texte}</span>
                <span className="pt-cartouche-pied">
                  <span>
                    Niveau {courant} : {grade(courant).nom}
                  </span>
                  <span className="pt-piste" aria-label={`${faits} niveaux réussis sur ${NB_NIVEAUX}`}>
                    {Array.from({ length: NB_NIVEAUX }, (_, k) => (
                      <span key={k} data-fait={k < faits || undefined} data-courant={k === courant - 1 || undefined} />
                    ))}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="pt-rapides">
        <h3 id="pt-rapides" className="pt-sous-titre">
          {t("accueil.rapides")}
        </h3>
        <div className="pt-rapides">
          <button type="button" className="pt-rapide" onClick={() => lancer(l.rapide("eclair"))}>
            <Zap className="pt-rapide-icone" aria-hidden="true" />
            <span className="pt-rapide-nom">L&apos;éclair</span>
            <span className="pt-rapide-texte">60 secondes, toutes catégories.</span>
            <span className="pt-rapide-record">{monde.profil.eclair ? `Record : ${monde.profil.eclair}` : "Pas encore de record"}</span>
          </button>
          <button type="button" className="pt-rapide" onClick={() => lancer(l.rapide("survie"))}>
            <Infini className="pt-rapide-icone" aria-hidden="true" />
            <span className="pt-rapide-nom">Sans faute</span>
            <span className="pt-rapide-texte">Une seule vie : jusqu&apos;à la première erreur.</span>
            <span className="pt-rapide-record">{monde.profil.survie ? `Record : ${monde.profil.survie}` : "Pas encore de record"}</span>
          </button>
          <button type="button" className="pt-rapide" onClick={() => lancer(l.rapide("revision"))} data-vide={dues === 0 || undefined}>
            <RotateCcw className="pt-rapide-icone" aria-hidden="true" />
            <span className="pt-rapide-nom">Révisions du jour</span>
            <span className="pt-rapide-texte">Les pays que ta mémoire est en train de perdre.</span>
            <span className="pt-rapide-record">{dues ? `${dues} à revoir` : "Rien à revoir aujourd'hui"}</span>
          </button>
          <button type="button" className="pt-rapide" onClick={() => lancer(l.rapide("tour"))}>
            <Shuffle className="pt-rapide-icone" aria-hidden="true" />
            <span className="pt-rapide-nom">Le tour du monde</span>
            <span className="pt-rapide-texte">20 questions mêlées, avec trois cœurs.</span>
            <span className="pt-rapide-record">Drapeaux, capitales, cartes…</span>
          </button>
        </div>
      </section>

      <section aria-labelledby="pt-jour" className="pt-jour">
        <h3 id="pt-jour" className="pt-sous-titre">
          {t("accueil.jour")}
        </h3>
        <div className="pt-jour-carte">
          <Drapeau code={duJour.code} grand />
          <div className="pt-jour-texte">
            <p className="pt-jour-nom">{duJour.nom}</p>
            <p className="pt-jour-ligne">
              {duJour.capitale ? `${motCapitale(duJour)} : ${duJour.capitale}, en ${NOM_CONTINENT[duJour.continent]}` : `En ${NOM_CONTINENT[duJour.continent]}`}
            </p>
            <ul className="pt-puces">
              <li>{formatPopulation(duJour.population)}</li>
              <li>{formatSuperficie(duJour.superficie)}</li>
              {duJour.monnaies[0] && <li>{duJour.monnaies[0].nom}</li>}
              {duJour.langues.length > 0 && <li>{duJour.langues.slice(0, 3).join(", ")}</li>}
            </ul>
            <button type="button" className="pt-lien" onClick={() => aller(`carte/${duJour.code}`)}>
              Voir sur le globe
            </button>
          </div>
        </div>
      </section>

      <section className="pt-reglages" aria-label="Réglages">
        <label className="pt-interrupteur">
          <input type="checkbox" checked={monde.profil.chrono} onChange={(e) => regler({ chrono: e.target.checked })} />
          <span className="pt-interrupteur-piste" aria-hidden="true" />
          <span>
            <Timer className="mr-1 inline size-4 align-[-3px]" aria-hidden="true" />
            Chrono à chaque question
          </span>
        </label>
      </section>
    </div>
  );
}
