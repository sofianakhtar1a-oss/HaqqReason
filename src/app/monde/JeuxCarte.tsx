"use client";

import { Crosshair, Flag, Timer, Trophy, X } from "lucide-react";
import { type RefObject, useEffect, useRef, useState } from "react";
import { PAR_CODE } from "@/lib/monde/atlas";
import { nombreFr } from "@/lib/monde/calques";
import { type JeuId, pointsCapitale } from "@/lib/monde/carte-outils";
import { PAYS } from "@/lib/monde/donnees";
import { distanceKm, formatKm, grandCercle, type LatLng } from "@/lib/monde/geo";
import { hasard, melanger } from "@/lib/monde/hasard";
import { battreRecordDe, noterJournal, profilActuel, useMonde } from "@/lib/monde/progression";
import { ressentir } from "./sons";

/** Deux fois plus de temps, si le réglage le demande. */
const facteurTemps = () => (profilActuel().plusDeTemps ? 2 : 1);
import { Drapeau } from "./figures";
import type { GlobeProps, GlobeRef, Marque, Teinte, Trait } from "./Globe";

/*
 * Les jeux de la carte : la chasse aux pays (une minute sur le planisphère), tous les voisins d'un pays,
 * et les capitales à placer du doigt. Les meilleurs scores se gardent avec les autres records.
 */

export type { JeuId };
export type Jeu = { globe: Partial<GlobeProps>; panneau: React.ReactNode };

/** Une graine nouvelle (seulement au moment où l'on commence : jamais pendant le rendu). */
const nouvelleGraine = () => (Date.now() ^ Math.floor(Math.random() * 2 ** 30)) >>> 0;

function Tete({ titre, icone, onFermer }: { titre: string; icone: React.ReactNode; onFermer: () => void }) {
  return (
    <header className="pt-outil-tete">
      {icone}
      <h3>{titre}</h3>
      <button type="button" className="pt-icone" onClick={onFermer} aria-label="Quitter le jeu">
        <X className="size-4" aria-hidden="true" />
      </button>
    </header>
  );
}

function Record({ cle, record }: { cle: string; record: (n: number) => string }) {
  const monde = useMonde();
  const n = monde.records[cle] ?? 0;
  return n ? (
    <p className="pt-jeu-record">
      <Trophy className="size-4" aria-hidden="true" />
      Ton record : {record(n)}
    </p>
  ) : null;
}

/* ---------- La chasse aux pays ---------- */

const POOL_CHASSE = PAYS.filter((p) => p.quiz && p.carte && p.statut !== "territoire" && (p.superficie ?? 0) >= 20000).map((p) => p.code);
const DUREE_CHASSE = 60_000;

type Chasse = { phase: "pret" | "jeu" | "fin"; file: string[]; i: number; trouves: string[]; rates: string[]; fautes: number; flash: { touche: string; cible: string } | null; fin: number; record: boolean };

export function useChasse({ actif, onFermer }: { actif: boolean; onFermer: () => void }): Jeu {
  const [etat, setEtat] = useState<Chasse>({ phase: "pret", file: [], i: 0, trouves: [], rates: [], fautes: 0, flash: null, fin: 0, record: false });
  const [maintenant, setMaintenant] = useState(0);
  const memoire = useRef(etat);
  const eclair = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    memoire.current = etat;
  });
  useEffect(() => () => clearTimeout(eclair.current), []);

  const terminer = () => {
    const e = memoire.current;
    if (e.phase !== "jeu") return;
    clearTimeout(eclair.current);
    const record = battreRecordDe("carte-chasse", e.trouves.length);
    setEtat({ ...e, phase: "fin", flash: null, record });
    noterJournal({ s: "carte", n: "La chasse aux pays", b: e.trouves.length, q: null, x: 0, d: (DUREE_CHASSE * facteurTemps()) / 1000 });
    ressentir(record ? "record" : "niveau");
  };

  // L'horloge : un quart de seconde suffit à l'afficher.
  useEffect(() => {
    if (etat.phase !== "jeu" || !actif) return;
    const id = setInterval(() => {
      const t = Date.now();
      setMaintenant(t);
      if (t >= memoire.current.fin) terminer();
    }, 250);
    return () => clearInterval(id);
  }, [etat.phase, actif]);

  const commencer = () => {
    const t = Date.now();
    setMaintenant(t);
    setEtat({ phase: "jeu", file: melanger(POOL_CHASSE, hasard(nouvelleGraine())), i: 0, trouves: [], rates: [], fautes: 0, flash: null, fin: t + DUREE_CHASSE * facteurTemps(), record: false });
  };

  const toucher = (code: string | null) => {
    const e = memoire.current;
    if (e.phase !== "jeu" || e.flash || !code) return;
    const cible = e.file[e.i];
    if (code === cible) {
      setEtat((x) => ({ ...x, trouves: [...x.trouves, code], i: x.i + 1 }));
      ressentir("juste");
      if (e.i + 1 >= e.file.length) setTimeout(terminer, 0);
      return;
    }
    // Une erreur : le bon pays s'allume un instant, puis on passe au suivant.
    ressentir("faux");
    setEtat((x) => ({ ...x, fautes: x.fautes + 1, flash: { touche: code, cible } }));
    eclair.current = setTimeout(() => setEtat((x) => (x.phase === "jeu" ? { ...x, flash: null, rates: [...x.rates, cible], i: x.i + 1 } : x)), 900);
  };

  const teintes: Record<string, Teinte> = {};
  for (const c of etat.trouves) teintes[c] = "juste";
  for (const c of etat.rates) teintes[c] = "doux";
  if (etat.flash) {
    teintes[etat.flash.touche] = "faux";
    teintes[etat.flash.cible] = "cible";
  }
  const cible = etat.phase === "jeu" ? PAR_CODE.get(etat.file[etat.i]) : undefined;
  const secondes = Math.max(0, Math.ceil((etat.fin - maintenant) / 1000));
  // Le bon pays, trop petit pour se voir sur le planisphère : un point le montre aussi.
  const montre = etat.flash ? PAR_CODE.get(etat.flash.cible) : undefined;
  const marques: Marque[] = montre ? [{ latlng: montre.latlng, teinte: "cible", taille: 6, libelle: montre.nom }] : [];

  const panneau = (
    <section className="pt-outil pt-jeu-carte" aria-labelledby="pt-jeu-titre">
      <Tete titre="La chasse aux pays" icone={<Timer className="size-5" aria-hidden="true" />} onFermer={onFermer} />
      {etat.phase === "pret" && (
        <>
          <p className="pt-outil-aide">Un nom s&apos;affiche : touche le pays sur le planisphère. Une erreur, et le bon pays s&apos;allume un instant avant le suivant. Tu as une minute.</p>
          <Record cle="carte-chasse" record={(n) => `${n} pays`} />
          <button type="button" className="bouton bouton-principal" onClick={commencer}>
            Commencer
          </button>
        </>
      )}
      {etat.phase === "jeu" && cible && (
        <>
          <div className="pt-jeu-chrono" role="timer" aria-label={`${secondes} secondes`} data-presse={secondes <= 10 || undefined}>
            <span>{secondes}</span> s
          </div>
          <p className="pt-jeu-consigne" aria-live="polite">
            Touche <Drapeau code={cible.code} nomme={false} /> <strong>{cible.nom}</strong>
          </p>
          <p className="pt-jeu-score">
            {etat.trouves.length} trouvé{etat.trouves.length > 1 ? "s" : ""}, {etat.fautes} erreur{etat.fautes > 1 ? "s" : ""}
          </p>
        </>
      )}
      {etat.phase === "fin" && (
        <div className="pt-outil-resultat" aria-live="polite">
          <p className="pt-outil-chiffre">
            {etat.trouves.length} pays
          </p>
          <p>
            trouvés en une minute, avec {etat.fautes} erreur{etat.fautes > 1 ? "s" : ""}.
          </p>
          {etat.record ? <p className="pt-jeu-nouveau">Nouveau record !</p> : <Record cle="carte-chasse" record={(n) => `${n} pays`} />}
          <button type="button" className="bouton bouton-principal" onClick={commencer}>
            Rejouer
          </button>
        </div>
      )}
    </section>
  );

  return { globe: { mode: "plan", teintes, marques, onToucher: toucher, reperes: "tous" }, panneau };
}

/* ---------- Tous les voisins ---------- */

const POOL_VOISINS = PAYS.filter((p) => p.quiz && p.carte && p.voisins.filter((v) => PAR_CODE.has(v)).length >= 3).map((p) => p.code);

type Voisins = { phase: "pret" | "jeu" | "fini"; pays: string; trouves: string[]; fautes: number; flash: string | null; abandon: boolean; serie: number; record: boolean };

export function useVoisins({ onFermer }: { onFermer: () => void }): Jeu {
  const [etat, setEtat] = useState<Voisins>({ phase: "pret", pays: "", trouves: [], fautes: 0, flash: null, abandon: false, serie: 0, record: false });
  const memoire = useRef(etat);
  const eclair = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    memoire.current = etat;
  });
  useEffect(() => () => clearTimeout(eclair.current), []);

  const voisins = etat.pays ? (PAR_CODE.get(etat.pays)?.voisins ?? []).filter((v) => PAR_CODE.has(v)) : [];

  const suivant = () => {
    const h = hasard(nouvelleGraine());
    const autres = POOL_VOISINS.filter((c) => c !== memoire.current.pays);
    const pays = autres[Math.floor(h() * autres.length)];
    setEtat((x) => ({ ...x, phase: "jeu", pays, trouves: [], fautes: 0, flash: null, abandon: false, record: false }));
  };

  const toucher = (code: string | null) => {
    const e = memoire.current;
    if (e.phase !== "jeu" || !code || code === e.pays) return;
    const liste = (PAR_CODE.get(e.pays)?.voisins ?? []).filter((v) => PAR_CODE.has(v));
    if (liste.includes(code)) {
      if (e.trouves.includes(code)) return;
      const trouves = [...e.trouves, code];
      if (trouves.length === liste.length) {
        const serie = e.serie + 1;
        const record = battreRecordDe("carte-voisins", serie);
        setEtat({ ...e, trouves, phase: "fini", serie, record, flash: null });
        ressentir(record ? "record" : "niveau");
      } else {
        setEtat({ ...e, trouves });
        ressentir("juste");
      }
      return;
    }
    ressentir("faux");
    clearTimeout(eclair.current);
    setEtat({ ...e, fautes: e.fautes + 1, flash: code });
    eclair.current = setTimeout(() => setEtat((x) => ({ ...x, flash: null })), 800);
  };

  const teintes: Record<string, Teinte> = {};
  for (const c of etat.trouves) teintes[c] = "juste";
  if (etat.abandon) for (const c of voisins) if (!etat.trouves.includes(c)) teintes[c] = "choix";
  if (etat.flash) teintes[etat.flash] = "faux";
  const p = PAR_CODE.get(etat.pays);

  const panneau = (
    <section className="pt-outil pt-jeu-carte">
      <Tete titre="Tous les voisins" icone={<Flag className="size-5" aria-hidden="true" />} onFermer={onFermer} />
      {etat.phase === "pret" && (
        <>
          <p className="pt-outil-aide">Un pays s&apos;allume sur le globe : touche, un à un, tous les pays qui ont une frontière avec lui. Les tout petits sont des points dorés.</p>
          <Record cle="carte-voisins" record={(n) => `${n} pays de suite`} />
          <button type="button" className="bouton bouton-principal" onClick={suivant}>
            Commencer
          </button>
        </>
      )}
      {etat.phase !== "pret" && p && (
        <>
          <p className="pt-jeu-consigne">
            Les voisins de <Drapeau code={p.code} /> <strong>{p.nom}</strong>
          </p>
          <p className="pt-jeu-score" aria-live="polite">
            {etat.trouves.length} sur {voisins.length}, {etat.fautes} erreur{etat.fautes > 1 ? "s" : ""}
            {etat.serie > 0 && `, série de ${etat.serie}`}
          </p>
          {etat.trouves.length > 0 && (
            <p className="pt-jeu-trouves">
              {etat.trouves.map((c) => PAR_CODE.get(c)?.nom).join(", ")}
              {etat.abandon && voisins.some((c) => !etat.trouves.includes(c)) && (
                <>
                  {" "}
                  ; il manquait : {voisins.filter((c) => !etat.trouves.includes(c)).map((c) => PAR_CODE.get(c)?.nom).join(", ")}
                </>
              )}
            </p>
          )}
          {etat.phase === "fini" && !etat.abandon && <p className="pt-jeu-nouveau">{etat.record ? `Tous trouvés : nouveau record, ${etat.serie} de suite !` : "Tous trouvés !"}</p>}
          <div className="pt-outil-actions">
            {etat.phase === "jeu" ? (
              <button type="button" className="bouton" onClick={() => setEtat((x) => ({ ...x, phase: "fini", abandon: true, serie: 0 }))}>
                Je donne ma langue au chat
              </button>
            ) : (
              <button type="button" className="bouton bouton-principal" onClick={suivant}>
                Pays suivant
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );

  return { globe: { teintes, cible: etat.phase === "pret" ? null : etat.pays, recul: 3.2, onToucher: toucher, reperes: "tous" }, panneau };
}

/* ---------- Où est la capitale ? ---------- */

const POOL_CAPITALES = PAYS.filter((p) => p.quiz && p.capitale && p.capLatLng && p.statut !== "territoire" && p.rangCapitale < 130).map((p) => p.code);
const MANCHES = 10;

type Capitales = { phase: "pret" | "jeu" | "reponse" | "fin"; file: string[]; i: number; manches: { code: string; km: number; points: number }[]; touche: LatLng | null; record: boolean };

export function useCapitales({ globe, onFermer }: { globe: RefObject<GlobeRef | null>; onFermer: () => void }): Jeu {
  const [etat, setEtat] = useState<Capitales>({ phase: "pret", file: [], i: 0, manches: [], touche: null, record: false });
  const memoire = useRef(etat);
  useEffect(() => {
    memoire.current = etat;
  });

  const commencer = () => setEtat({ phase: "jeu", file: melanger(POOL_CAPITALES, hasard(nouvelleGraine())).slice(0, MANCHES), i: 0, manches: [], touche: null, record: false });

  const onPoint = (ll: LatLng | null) => {
    const e = memoire.current;
    if (e.phase !== "jeu" || !ll) return;
    const p = PAR_CODE.get(e.file[e.i]);
    if (!p?.capLatLng) return;
    const km = distanceKm(ll, p.capLatLng);
    setEtat({ ...e, phase: "reponse", touche: ll, manches: [...e.manches, { code: p.code, km, points: pointsCapitale(km) }] });
    ressentir(km < 300 ? "juste" : km < 1000 ? "presque" : "faux");
    // Montrer où elle était : tout près, on reste ; loin, on prend du recul entre les deux points.
    const g = globe.current;
    if (g) {
      if (km < 800) g.voler({ ...g.vue(), lon: p.capLatLng[1], lat: p.capLatLng[0] });
      else {
        const milieu = grandCercle(ll, p.capLatLng, 2)[1];
        g.voler({ lon: milieu[1], lat: milieu[0], zoom: 1 });
      }
    }
  };

  const suivante = () => {
    const e = memoire.current;
    if (e.i + 1 >= e.file.length) {
      const total = e.manches.reduce((s, m) => s + m.points, 0);
      const record = battreRecordDe("carte-capitales", total);
      setEtat({ ...e, phase: "fin", record });
      noterJournal({ s: "carte", n: "Où est la capitale ?", b: e.manches.filter((m) => m.km < 300).length, q: e.manches.length, x: 0, d: 0 });
      ressentir(record ? "record" : "niveau");
    } else setEtat({ ...e, phase: "jeu", i: e.i + 1, touche: null });
  };

  const p = etat.phase === "jeu" || etat.phase === "reponse" ? PAR_CODE.get(etat.file[etat.i]) : undefined;
  const derniere = etat.manches[etat.manches.length - 1];
  const total = etat.manches.reduce((s, m) => s + m.points, 0);
  const marques: Marque[] = [];
  const traits: Trait[] = [];
  if (etat.phase === "reponse" && p?.capLatLng && etat.touche) {
    marques.push({ latlng: etat.touche, teinte: (derniere?.km ?? 9999) < 300 ? "juste" : "faux" });
    marques.push({ latlng: p.capLatLng, teinte: "or", libelle: p.capitale ?? undefined });
    traits.push({ points: grandCercle(etat.touche, p.capLatLng, 48), teinte: "or", tirets: true });
  }

  const panneau = (
    <section className="pt-outil pt-jeu-carte">
      <Tete titre="Où est la capitale ?" icone={<Crosshair className="size-5" aria-hidden="true" />} onFermer={onFermer} />
      {etat.phase === "pret" && (
        <>
          <p className="pt-outil-aide">Une capitale est nommée : touche l&apos;endroit où elle se trouve. Mille points pile dessus, de moins en moins à mesure qu&apos;on s&apos;en éloigne. Dix capitales.</p>
          <Record cle="carte-capitales" record={(n) => `${nombreFr(n)} points`} />
          <button type="button" className="bouton bouton-principal" onClick={commencer}>
            Commencer
          </button>
        </>
      )}
      {p && (
        <>
          <p className="pt-jeu-manche">
            Capitale {etat.i + 1} sur {etat.file.length}, {nombreFr(total)} points
          </p>
          <p className="pt-jeu-consigne">
            Où est <strong>{p.capitale}</strong> ? <Drapeau code={p.code} /> {p.nom}
          </p>
          {etat.phase === "reponse" && derniere && (
            <div className="pt-outil-resultat" aria-live="polite">
              <p className="pt-outil-chiffre">{nombreFr(derniere.points)} points</p>
              <p>{derniere.km < 25 ? "Pile dessus !" : `À ${formatKm(derniere.km)} de ${p.capitale}.`}</p>
              <button type="button" className="bouton bouton-principal" onClick={suivante}>
                {etat.i + 1 >= etat.file.length ? "Voir le score" : "Capitale suivante"}
              </button>
            </div>
          )}
        </>
      )}
      {etat.phase === "fin" && (
        <div className="pt-outil-resultat" aria-live="polite">
          <p className="pt-outil-chiffre">{nombreFr(total)} points</p>
          <p>sur {nombreFr(MANCHES * 1000)} possibles.</p>
          {etat.record ? <p className="pt-jeu-nouveau">Nouveau record !</p> : <Record cle="carte-capitales" record={(n) => `${nombreFr(n)} points`} />}
          <ol className="pt-jeu-manches">
            {etat.manches.map((m) => (
              <li key={m.code}>
                {PAR_CODE.get(m.code)?.capitale} : {formatKm(m.km)}, {nombreFr(m.points)} points
              </li>
            ))}
          </ol>
          <button type="button" className="bouton bouton-principal" onClick={commencer}>
            Rejouer
          </button>
        </div>
      )}
    </section>
  );

  return { globe: { onPoint, marques, traits, reperes: "tous" }, panneau };
}
