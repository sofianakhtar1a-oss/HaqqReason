"use client";

import { ArrowRight, Award, Building2, Clock, Coins, Earth, Flag, Flame, GraduationCap, Hash, Infinity as Infini, Landmark, Languages, Map as IconeCarte, Mountain, RotateCcw, Scale, Settings2, Shuffle, Timer, Users, Waypoints, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { formatNombre, formatPopulation, formatSuperficie, jourDeParis, motCapitale, NOM_CONTINENT, PAR_CODE, paysDuJour } from "@/lib/monde/atlas";
import { populationDe, useEdition } from "@/lib/monde/edition-client";
import { CATEGORIES, CATEGORIES_CLASSIQUES, CATEGORIES_NOUVELLES, type CategorieId, IDS_CATEGORIES } from "@/lib/monde/categories";
import { NOMBRE_PAYS } from "@/lib/monde/chiffres";
import { useCompteMonde } from "@/lib/monde/compte-client";
import { grade, NB_NIVEAUX } from "@/lib/monde/niveaux";
import { ducats, maitrise, niveauCourant, niveauxReussis, partieSauvee, paysConnus, regler, revisionsDues, useMonde } from "@/lib/monde/progression";
import { niveauProfil } from "@/lib/monde/collection";
import { useTextes } from "@/lib/modules/textes-client";
import { CABINETS, estCabinet } from "@/lib/monde/cabinets";
import type { CabinetId } from "@/lib/monde/types";
import { Carnet, Decouvrir, MesErreurs, RoutesThematiques } from "./Apprendre";
import { Collection } from "./Collection";
import { Defis } from "./Defis";
import { CartoucheCabinet, EcranCabinet } from "./Cabinet";
import { Categorie } from "./Categorie";
import { Ciel, Ducats, RoseDesVents } from "./communs";
import { Drapeau } from "./figures";
import { Globe, type Teinte } from "./Globe";
import { CONTINENTS_A_NOMMER, paysANommer, titreContinent } from "./NommeLesTous";
import { type Lancement, useLancer } from "./Partie";
import { QuoiDeNeuf } from "./Nouveautes";
import { JournalDeBord, PageReglages, Statistiques } from "./Reglages";

export const ICONES_CATEGORIES: Record<CategorieId, typeof Flag> = {
  drapeaux: Flag,
  capitales: Landmark,
  cartes: IconeCarte,
  continents: Earth,
  monnaies: Coins,
  gentiles: Users,
  langues: Languages,
  villes: Building2,
  reliefs: Mountain,
  codes: Hash,
  fuseaux: Clock,
  voisins: Waypoints,
  comparaisons: Scale,
};

/** La carte d'une catégorie : son icône, sa maîtrise, sa route de quinze niveaux. */
function Cartouche({ c, i, onCategorie }: { c: CategorieId; i: number; onCategorie: (id: string | null) => void }) {
  const monde = useMonde();
  const def = CATEGORIES[c];
  const Icone = ICONES_CATEGORIES[c];
  const m = maitrise(monde, c);
  const faits = niveauxReussis(monde, c);
  const courant = niveauCourant(monde, c);
  const pourcent = m.total ? Math.round((m.sus / m.total) * 100) : 0;
  return (
    <button type="button" className="pt-cartouche" data-categorie={c} style={{ "--i": i, "--part": pourcent / 100 } as React.CSSProperties} onClick={() => onCategorie(c)}>
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
}

export function Accueil({ categorie, onCategorie, lancer, aller }: { categorie: string | null; onCategorie: (id: string | null) => void; lancer: (l: Lancement) => void; aller: (hash: string) => void }) {
  if (categorie && categorie in CATEGORIES) return <Categorie id={categorie as CategorieId} onRetour={() => onCategorie(null)} lancer={lancer} />;
  if (categorie?.startsWith("cabinet-") && estCabinet(categorie.slice(8))) return <EcranCabinet id={categorie.slice(8) as CabinetId} onRetour={() => onCategorie(null)} lancer={lancer} />;
  if (categorie === "erreurs") return <MesErreurs onRetour={() => onCategorie(null)} lancer={lancer} />;
  if (categorie === "collection") return <Collection onRetour={() => onCategorie(null)} />;
  if (categorie === "reglages") return <PageReglages onRetour={() => onCategorie(null)} aller={aller} />;
  if (categorie === "journal") return <JournalDeBord onRetour={() => onCategorie("reglages")} aller={aller} />;
  if (categorie === "statistiques") return <Statistiques onRetour={() => onCategorie("reglages")} aller={aller} />;
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
  const edition = useEdition();
  // Le pays du jour : celui que le créateur a choisi pour cette date, sinon le tirage du jour.
  const choisi = edition?.jour[jour];
  const duJour = choisi && PAR_CODE.has(choisi.code) ? PAR_CODE.get(choisi.code)! : paysDuJour(jour);

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
  const [decouverte, setDecouverte] = useState<{ titre: string; codes: string[] } | null>(null);
  // Une partie laissée en cours (sur cet appareil).
  const [sauvee] = useState(() => partieSauvee<{ lancement: Lancement; index: number; questions: unknown[] }>());
  const profil = niveauProfil(xpAffichee);

  return (
    <div className="pt-hub">
      <section className="pt-heros">
        <div className="pt-heros-texte">
          <QuoiDeNeuf />
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
            <div title={`Niveau ${profil.n} : ${profil.titre}`}>
              <dt>Niveau</dt>
              <dd>
                <span className="tabular-nums">{profil.n}</span>
                <span className="pt-bilan-sur"> {profil.titre}</span>
              </dd>
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
            <button type="button" className="bouton bouton-discret" onClick={() => aller("accueil/collection")}>
              <Award className="size-4" aria-hidden="true" />
              Ma collection
            </button>
          </div>
          {sauvee && (
            <div className="pt-reprise" role="status">
              <span>
                Une partie t&apos;attend : <strong>{sauvee.lancement.titre}</strong>, question {sauvee.index + 1} sur {sauvee.questions.length}.
              </span>
              <button type="button" className="bouton bouton-principal" onClick={() => lancer({ ...sauvee.lancement, cle: `${Date.now()}`, reprise: true })}>
                Reprendre
                <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
        <div className="pt-heros-globe">
          <Ciel />
          <RoseDesVents className="pt-heros-rose" />
          <Globe key={monde.profil.globe} tourne glissable nuages teintes={teintes} libelle={`Le globe : ${Object.keys(teintes).length} pays déjà dorés par ta mémoire. Fais-le tourner dans tous les sens.`} vueInitiale={{ lon: 12, lat: 24, zoom: 1 }} />
        </div>
      </section>

      <Carnet aller={aller} />

      <Defis lancer={lancer} />

      <section aria-labelledby="pt-routes">
        <h3 id="pt-routes" className="pt-sous-titre">
          {t("accueil.categories")}
        </h3>
        <div className="pt-cartouches">
          {CATEGORIES_CLASSIQUES.map((c, i) => (
            <Cartouche key={c} c={c} i={i} onCategorie={onCategorie} />
          ))}
        </div>
      </section>

      <section aria-labelledby="pt-plus-loin">
        <h3 id="pt-plus-loin" className="pt-sous-titre">
          Pour aller plus loin
        </h3>
        <p className="pt-sous-chapo">Les habitants, les langues, les grandes villes, les sommets, les codes, les fuseaux, les voisins, les comparaisons : huit nouvelles routes de quinze niveaux.</p>
        <div className="pt-cartouches" data-petites="">
          {CATEGORIES_NOUVELLES.map((c, i) => (
            <Cartouche key={c} c={c} i={i} onCategorie={onCategorie} />
          ))}
        </div>
      </section>

      <RoutesThematiques lancer={lancer} decouvrir={(titre, codes) => setDecouverte({ titre, codes })} />

      <section aria-labelledby="pt-cabinets">
        <h3 id="pt-cabinets" className="pt-sous-titre">
          Les pays vus de l&apos;intérieur
        </h3>
        <p className="pt-sous-chapo">Départements et régions de France, États américains, provinces du Canada, régions du Maroc, wilayas d&apos;Algérie, et des drapeaux qui ne sont pas ceux d&apos;un pays.</p>
        <div className="pt-cartouches" data-petites="">
          {CABINETS.map((c, i) => (
            <CartoucheCabinet key={c.id} c={c} i={i} onOuvrir={() => onCategorie(`cabinet-${c.id}`)} />
          ))}
        </div>
      </section>

      <section aria-labelledby="pt-nomme">
        <h3 id="pt-nomme" className="pt-sous-titre">
          Nomme-les tous
        </h3>
        <p className="pt-sous-chapo">Tous les pays d&apos;un continent, de mémoire, contre la montre : chacun se dore sur le globe dès que tu l&apos;écris.</p>
        <div className="pt-nomme-choix">
          {CONTINENTS_A_NOMMER.map(({ id }) => {
            const total = paysANommer(id).length;
            const r = monde.records[`nomme:continent:${id}`] ?? 0;
            return (
              <button key={id} type="button" className="pt-nomme-carte" data-monde={id === "monde" || undefined} onClick={() => lancer({ cle: `${Date.now()}`, sorte: "nomme", liste: `continent:${id}`, titre: titreContinent(id) })}>
                <span className="pt-nomme-carte-nom">{titreContinent(id)}</span>
                <span className="pt-nomme-carte-total tabular-nums">{total} pays</span>
                <span className="pt-nomme-carte-record">{r ? `Record : ${r}` : "À tenter"}</span>
                <span className="pt-nomme-carte-barre" aria-hidden="true">
                  <span style={{ transform: `scaleX(${r / total})` }} />
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
          <button type="button" className="pt-rapide" onClick={() => lancer(l.examen())}>
            <GraduationCap className="pt-rapide-icone" aria-hidden="true" />
            <span className="pt-rapide-nom">L&apos;examen</span>
            <span className="pt-rapide-texte">20 questions, une note sur 20 et un certificat à imprimer.</span>
            <span className="pt-rapide-record">{monde.records.examen ? `Meilleure note : ${monde.records.examen}/20` : "Pas encore passé"}</span>
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
              <li>{formatPopulation(populationDe(duJour, edition).n)}</li>
              <li>{formatSuperficie(duJour.superficie)}</li>
              {duJour.monnaies[0] && <li>{duJour.monnaies[0].nom}</li>}
              {duJour.langues.length > 0 && <li>{duJour.langues.slice(0, 3).join(", ")}</li>}
            </ul>
            {choisi?.anecdote && <p className="pt-jour-anecdote">{choisi.anecdote}</p>}
            <button type="button" className="pt-lien" onClick={() => aller(`carte/${duJour.code}`)}>
              Voir sur le globe
            </button>
          </div>
        </div>
      </section>

      {decouverte && <Decouvrir titre={decouverte.titre} codes={decouverte.codes} categorie={null} onFermer={() => setDecouverte(null)} />}

      <section className="pt-reglages" aria-label="Réglages">
        <label className="pt-interrupteur">
          <input type="checkbox" checked={monde.profil.chrono} onChange={(e) => regler({ chrono: e.target.checked })} />
          <span className="pt-interrupteur-piste" aria-hidden="true" />
          <span>
            <Timer className="mr-1 inline size-4 align-[-3px]" aria-hidden="true" />
            Chrono à chaque question
          </span>
        </label>
        <button type="button" className="bouton bouton-discret" onClick={() => aller("accueil/reglages")}>
          <Settings2 className="size-4" aria-hidden="true" />
          Réglages, accessibilité et données
        </button>
      </section>
    </div>
  );
}
