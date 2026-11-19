"use client";

import { ArrowLeftRight, Home, MapPin, Plane, Ruler, Scaling, Trash2, X } from "lucide-react";
import { type RefObject, useMemo, useState } from "react";
import { formatSuperficie, PAR_CODE } from "@/lib/monde/atlas";
import { comparerSurfaces, coordonnees } from "@/lib/monde/carte-outils";
import { PAYS } from "@/lib/monde/donnees";
import { cap, distanceKm, dureeVol, formatKm, grandCercle, type LatLng, pointCardinal } from "@/lib/monde/geo";
import { regler } from "@/lib/monde/progression";
import { normaliser } from "@/lib/monde/texte";
import { Drapeau } from "./figures";
import type { GlobeProps, GlobeRef, Marque, Mode, Silhouette, Teinte } from "./Globe";

/*
 * Les outils de la carte : mesurer une distance (et le temps de vol), comparer la vraie taille des
 * pays en promenant leur silhouette sur le globe, et choisir son pays (le point de départ des
 * distances et des heures). Chaque outil donne au globe ce qu'il doit dessiner et au panneau ce
 * qu'il faut lire.
 */

export type Outil = { globe: Partial<GlobeProps>; panneau: React.ReactNode; ajouter: (code: string) => void };

/** Un pays pour mesurer : sa capitale, sinon son centre. */
function pointPays(code: string): { latlng: LatLng; nom: string } | null {
  const p = PAR_CODE.get(code);
  if (!p) return null;
  return p.capLatLng && p.capitale ? { latlng: p.capLatLng, nom: `${p.capitale} (${p.nom})` } : { latlng: p.latlng, nom: p.nom };
}

/* ---------- La distance ---------- */

type Point = { latlng: LatLng; nom: string };

export function useDistance({ globe, monPays, mode, onFermer }: { globe: RefObject<GlobeRef | null>; monPays: string; mode: Mode; onFermer: () => void }): Outil {
  const [points, setPoints] = useState<Point[]>([]);
  /** Deux points posés : le globe prend du recul pour montrer toute la route. */
  const montrer = (ps: Point[]) => {
    const g = globe.current;
    if (!g || ps.length < 2) return;
    const [a, b] = [ps[0].latlng, ps[1].latlng];
    const milieu = grandCercle(a, b, 2)[1];
    const km = distanceKm(a, b);
    g.voler({ lon: milieu[1], lat: milieu[0], zoom: km > 6000 ? 1 : km > 2500 ? 1.4 : 2.2 });
  };
  const poser = (pt: Point) => {
    const nouveaux = points.length >= 2 ? [pt] : [...points, pt];
    setPoints(nouveaux);
    montrer(nouveaux);
  };

  const onPoint = (ll: LatLng | null) => {
    if (!ll) return;
    // Près d'une capitale (d'autant plus près qu'on a zoomé), le point s'y accroche.
    const seuil = 380 / Math.max(1, globe.current?.vue().zoom ?? 1);
    let meilleur: { code: string; d: number } | null = null;
    for (const p of PAYS) {
      if (!p.capLatLng || !p.capitale) continue;
      const d = distanceKm(ll, p.capLatLng);
      if (d < seuil && (!meilleur || d < meilleur.d)) meilleur = { code: p.code, d };
    }
    const accroche = meilleur ? pointPays(meilleur.code) : null;
    if (accroche) return poser(accroche);
    const code = globe.current?.paysA(ll) ?? null;
    poser({ latlng: ll, nom: `${coordonnees(ll)} (${code ? (PAR_CODE.get(code)?.nom ?? code) : "en mer"})` });
  };

  const [a, b] = points;
  const km = a && b ? distanceKm(a.latlng, b.latlng) : null;
  const marques: Marque[] = points.map((p, i) => ({ latlng: p.latlng, teinte: i ? "choix" : "or", libelle: i ? "B" : "A" }));
  const traits = a && b ? [{ points: grandCercle(a.latlng, b.latlng, 96), teinte: "or" as Teinte, tirets: true, epaisseur: 2.4 }] : [];
  const chezMoi = monPays ? pointPays(monPays) : null;

  const panneau = (
    <section className="pt-outil" aria-labelledby="pt-outil-distance">
      <header className="pt-outil-tete">
        <Ruler className="size-5" aria-hidden="true" />
        <h3 id="pt-outil-distance">La distance</h3>
        <button type="button" className="pt-icone" onClick={onFermer} aria-label="Fermer l'outil">
          <X className="size-4" aria-hidden="true" />
        </button>
      </header>
      <p className="pt-outil-aide">Touche deux points sur la carte : près d&apos;une capitale, le point s&apos;y accroche. Tu peux aussi chercher deux pays.</p>
      <ol className="pt-outil-points">
        {[0, 1].map((i) => (
          <li key={i} data-plein={points[i] ? "" : undefined}>
            <span className="pt-outil-lettre" data-b={i ? "" : undefined}>
              {i ? "B" : "A"}
            </span>
            {points[i]?.nom ?? (i === points.length ? "à toucher sur la carte" : "…")}
          </li>
        ))}
      </ol>
      {km !== null && (
        <div className="pt-outil-resultat" aria-live="polite">
          <p className="pt-outil-chiffre">{formatKm(km)}</p>
          <p>à vol d&apos;oiseau, par le plus court chemin à la surface de la Terre.</p>
          <p className="pt-outil-ligne">
            <Plane className="size-4" aria-hidden="true" />
            Vol direct : environ {dureeVol(km)}
          </p>
          <p className="pt-outil-ligne">
            <MapPin className="size-4" aria-hidden="true" />
            Au départ de A, cap au {pointCardinal(cap(a!.latlng, b!.latlng))} ({Math.round(cap(a!.latlng, b!.latlng))}°).
          </p>
          {mode !== "globe" && <p className="pt-outil-note">Sur une carte plane, ce chemin paraît courbe : c&apos;est pourtant le plus court, celui que suivent les avions.</p>}
        </div>
      )}
      <div className="pt-outil-actions">
        {chezMoi && (
          <button
            type="button"
            className="bouton"
            onClick={() => {
              const autre = points.length >= 2 ? points[1] : points[0];
              const nouveaux = autre ? [chezMoi, autre] : [chezMoi];
              setPoints(nouveaux);
              montrer(nouveaux);
            }}
          >
            <Home className="size-4" aria-hidden="true" />
            Partir de chez moi
          </button>
        )}
        <button type="button" className="bouton" disabled={points.length < 2} onClick={() => setPoints((ps) => [...ps].reverse())}>
          <ArrowLeftRight className="size-4" aria-hidden="true" />
          Inverser
        </button>
        <button type="button" className="bouton" disabled={!points.length} onClick={() => setPoints([])}>
          <Trash2 className="size-4" aria-hidden="true" />
          Effacer
        </button>
      </div>
    </section>
  );

  return {
    globe: { onPoint, marques, traits },
    panneau,
    ajouter: (code) => {
      const p = pointPays(code);
      if (p) poser(p);
    },
  };
}

/* ---------- La vraie taille ---------- */

type Posee = Silhouette & { sur?: string | null };
const TEINTES_SILHOUETTES: Teinte[] = ["choix", "juste", "or"];

export function useVraieTaille({ globe, mode, choisirMode, onFermer }: { globe: RefObject<GlobeRef | null>; mode: Mode; choisirMode: (m: Mode) => void; onFermer: () => void }): Outil {
  const [poses, setPoses] = useState<Posee[]>([]);

  const ajouter = (code: string) => {
    if (!PAR_CODE.get(code)?.carte) return;
    setPoses((ps) => {
      const restes = ps.filter((x) => x.code !== code).slice(-2);
      const libre = TEINTES_SILHOUETTES.find((t) => !restes.some((x) => x.teinte === t)) ?? "choix";
      return [...restes, { code, teinte: libre }];
    });
  };
  const onSilhouette = (i: number, vers: [number, number]) => {
    const sur = globe.current?.paysA(vers) ?? null;
    setPoses((ps) => ps.map((x, k) => (k === i ? { ...x, vers, sur } : x)));
  };

  const panneau = (
    <section className="pt-outil" aria-labelledby="pt-outil-taille">
      <header className="pt-outil-tete">
        <Scaling className="size-5" aria-hidden="true" />
        <h3 id="pt-outil-taille">La vraie taille</h3>
        <button type="button" className="pt-icone" onClick={onFermer} aria-label="Fermer l'outil">
          <X className="size-4" aria-hidden="true" />
        </button>
      </header>
      <p className="pt-outil-aide">Touche un pays : sa silhouette se détache. Fais-la glisser ailleurs sur le globe, elle garde sa vraie taille. Trois silhouettes au plus.</p>
      {mode === "mercator" ? (
        <p className="pt-outil-note">Sur le Mercator, les pays grossissent à mesure qu&apos;on s&apos;éloigne de l&apos;équateur. Fais glisser le Groenland jusqu&apos;à l&apos;Afrique : il fond à sa vraie taille, quatorze fois plus petite.</p>
      ) : (
        <p className="pt-outil-note">
          Le Mercator, la carte des salles de classe, gonfle les pays du Nord.{" "}
          <button type="button" className="pt-lien" onClick={() => choisirMode("mercator")}>
            Le voir sur le Mercator
          </button>
        </p>
      )}
      {poses.length > 0 && (
        <ul className="pt-outil-silhouettes">
          {poses.map((s) => {
            const p = PAR_CODE.get(s.code)!;
            const sous = s.sur && s.sur !== s.code ? PAR_CODE.get(s.sur) : undefined;
            return (
              <li key={s.code} data-teinte={s.teinte}>
                <Drapeau code={s.code} />
                <span>
                  <strong>{p.nom}</strong>
                  {p.superficie ? `, ${formatSuperficie(p.superficie)}` : ""}
                  <small>
                    {!s.vers
                      ? "À sa place : fais-la glisser."
                      : sous && sous.superficie && p.superficie
                        ? `Posée sur : ${sous.nom}, ${comparerSurfaces(p.superficie, sous.superficie)}.`
                        : s.sur === null
                          ? "Posée en mer."
                          : "Déplacée."}
                  </small>
                </span>
                <button type="button" className="pt-icone" onClick={() => setPoses((ps) => ps.filter((x) => x.code !== s.code))} aria-label={`Retirer la silhouette : ${p.nom}`}>
                  <X className="size-4" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );

  return { globe: { silhouettes: poses, onSilhouette, onToucher: (code) => code && ajouter(code) }, panneau, ajouter };
}

/* ---------- Mon pays ---------- */

const TRIES = [...PAYS].filter((p) => p.statut !== "territoire" || p.population).sort((a, b) => a.nom.localeCompare(b.nom, "fr"));

export function MonPays({ code, onVoir }: { code: string; onVoir: (code: string) => void }) {
  const [changer, setChanger] = useState(false);
  const [requete, setRequete] = useState("");
  const p = code ? PAR_CODE.get(code) : undefined;
  const liste = useMemo(() => {
    const q = normaliser(requete);
    return q ? TRIES.filter((x) => x.noms.some((n) => normaliser(n).includes(q))).slice(0, 8) : [];
  }, [requete]);
  const choisir = (c: string) => {
    regler({ monPays: c });
    setChanger(false);
    setRequete("");
    onVoir(c);
  };
  return (
    <section className="pt-mon-pays" aria-labelledby="pt-mon-pays-titre">
      <h3 id="pt-mon-pays-titre">Mon pays</h3>
      {p && !changer ? (
        <div className="pt-mon-pays-choisi">
          <Drapeau code={p.code} />
          <p>
            <strong>{p.nom}</strong>
            <small>Les fiches donnent la distance et le décalage horaire depuis chez toi ; la carte le cerne d&apos;un pointillé.</small>
          </p>
          <div className="pt-mon-pays-actions">
            <button type="button" className="bouton" onClick={() => onVoir(p.code)}>
              Y aller
            </button>
            <button type="button" className="pt-lien" onClick={() => setChanger(true)}>
              Changer
            </button>
          </div>
        </div>
      ) : (
        <div className="pt-mon-pays-choix">
          <p>Choisis ton pays : chaque fiche te dira à quelle distance il est de chez toi, et quelle heure il y est par rapport à toi.</p>
          <input type="search" value={requete} onChange={(e) => setRequete(e.target.value)} placeholder="Ton pays…" aria-label="Chercher mon pays" autoComplete="off" />
          {liste.length > 0 && (
            <ul className="pt-mon-pays-liste">
              {liste.map((x) => (
                <li key={x.code}>
                  <button type="button" onClick={() => choisir(x.code)}>
                    <Drapeau code={x.code} />
                    {x.nom}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {p && (
            <button type="button" className="pt-lien" onClick={() => setChanger(false)}>
              Garder {p.nom}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
