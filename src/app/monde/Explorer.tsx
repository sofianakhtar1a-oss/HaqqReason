"use client";

import { Globe2, Map as IconePlan, Minus, Plus, Search, LocateFixed } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { PAR_CODE } from "@/lib/monde/atlas";
import { PAYS } from "@/lib/monde/donnees";
import { useMonde } from "@/lib/monde/progression";
import { normaliser } from "@/lib/monde/texte";
import type { ContinentId } from "@/lib/monde/types";
import { useTextes } from "@/lib/modules/textes-client";
import { FichePays } from "./FichePays";
import { Drapeau } from "./figures";
import { Globe, type GlobeRef, type Teinte, type Vue } from "./Globe";

/*
 * La carte du monde, libre : on fait tourner le globe (ou on déplie le planisphère), on touche
 * un pays, sa fiche s'ouvre. Une recherche, et un saut vers chaque continent.
 */

const VUES: { id: ContinentId; nom: string; vue: Vue }[] = [
  { id: "europe", nom: "Europe", vue: { lon: 15, lat: 52, zoom: 2.7 } },
  { id: "afrique", nom: "Afrique", vue: { lon: 19, lat: 2, zoom: 1.55 } },
  { id: "asie", nom: "Asie", vue: { lon: 88, lat: 32, zoom: 1.35 } },
  { id: "amerique-nord", nom: "Amérique du Nord", vue: { lon: -92, lat: 36, zoom: 1.45 } },
  { id: "amerique-sud", nom: "Amérique du Sud", vue: { lon: -60, lat: -20, zoom: 1.65 } },
  { id: "oceanie", nom: "Océanie", vue: { lon: 155, lat: -18, zoom: 1.6 } },
];

const INDEX = PAYS.map((p) => ({ code: p.code, formes: p.noms.map(normaliser), capitale: p.capitale ? normaliser(p.capitale) : "" }));

export function Explorer({ focus, onFocus }: { focus: string | null; onFocus: (code: string | null) => void }) {
  const t = useTextes("monde");
  const monde = useMonde();
  const globe = useRef<GlobeRef>(null);
  const [mode, setMode] = useState<"globe" | "plan">("globe");
  const [dorer, setDorer] = useState(true);
  const [requete, setRequete] = useState("");
  const choisi = focus && PAR_CODE.has(focus) ? focus : null;

  const teintes = useMemo(() => {
    if (!dorer) return {};
    const t: Record<string, Teinte> = {};
    for (const [code, m] of Object.entries(monde.pays)) if (Object.entries(m).some(([f, x]) => f !== "fiches" && (x?.[2] ?? 0) >= 3)) t[code] = "or";
    return t;
  }, [dorer, monde.pays]);

  const resultats = useMemo(() => {
    const q = normaliser(requete);
    if (!q) return [];
    const debut = INDEX.filter((x) => x.formes.some((f) => f.startsWith(q)) || x.capitale.startsWith(q));
    const dedans = INDEX.filter((x) => !debut.includes(x) && (x.formes.some((f) => f.includes(q)) || x.capitale.includes(q)));
    return [...debut, ...dedans].slice(0, 8).map((x) => PAR_CODE.get(x.code)!);
  }, [requete]);

  const ouvrir = (code: string | null) => {
    setRequete("");
    if (code === choisi) return;
    // Remplacer le pays affiché, sans empiler un écran par pays touché.
    if (code && choisi) {
      history.replaceState(null, "", `#carte/${code}`);
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    } else onFocus(code);
  };

  return (
    <div className="pt-explorer" data-ouvert={choisi ? "" : undefined}>
      <header className="pt-section-tete">
        <div>
          <h2 className="pt-titre">{t("carte.titre")}</h2>
          <p className="pt-chapo">{t("carte.chapo")}</p>
        </div>
      </header>

      <div className="pt-explorer-outils">
        <div className="pt-recherche" role="search">
          <Search className="size-4" aria-hidden="true" />
          <input
            type="search"
            value={requete}
            onChange={(e) => setRequete(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && resultats[0]) ouvrir(resultats[0].code);
            }}
            placeholder="Un pays, une capitale…"
            aria-label="Chercher un pays ou une capitale"
            aria-controls="pt-resultats"
            autoComplete="off"
          />
          {resultats.length > 0 && (
            <ul id="pt-resultats" className="pt-resultats" role="listbox">
              {resultats.map((p) => (
                <li key={p.code} role="option" aria-selected={false}>
                  <button type="button" onClick={() => ouvrir(p.code)}>
                    <Drapeau code={p.code} />
                    <span>{p.nom}</span>
                    {p.capitale && <small>{p.capitale}</small>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="pt-segments" role="group" aria-label="Projection">
          <button type="button" aria-pressed={mode === "globe"} onClick={() => setMode("globe")}>
            <Globe2 className="size-4" aria-hidden="true" />
            Globe
          </button>
          <button type="button" aria-pressed={mode === "plan"} onClick={() => setMode("plan")}>
            <IconePlan className="size-4" aria-hidden="true" />
            Planisphère
          </button>
        </div>
        <label className="pt-interrupteur">
          <input type="checkbox" checked={dorer} onChange={(e) => setDorer(e.target.checked)} />
          <span className="pt-interrupteur-piste" aria-hidden="true" />
          <span>Dorer ce que je maîtrise</span>
        </label>
      </div>

      <div className="pt-continents" role="group" aria-label="Aller vers un continent">
        {VUES.map((v) => (
          <button key={v.id} type="button" className="pt-puce" onClick={() => globe.current?.voler(mode === "plan" ? { ...v.vue, zoom: Math.max(1.4, v.vue.zoom * 1.25) } : v.vue)}>
            {v.nom}
          </button>
        ))}
      </div>

      <div className="pt-explorer-corps">
        <div className="pt-explorer-carte">
          <Globe
            key={mode}
            ref={globe}
            mode={mode}
            interactif
            reperes="tous"
            teintes={teintes}
            cible={choisi}
            recul={1.6}
            onToucher={(code) => code && ouvrir(code)}
            libelle="La carte du monde : touche un pays pour ouvrir sa fiche"
            vueInitiale={mode === "plan" ? { lon: 10, lat: 15, zoom: 1 } : { lon: 12, lat: 28, zoom: 1.05 }}
          />
          <div className="pt-globe-outils">
            <button type="button" className="pt-icone" onClick={() => globe.current?.zoomer(1.6)} aria-label="Zoomer">
              <Plus className="size-4" aria-hidden="true" />
            </button>
            <button type="button" className="pt-icone" onClick={() => globe.current?.zoomer(1 / 1.6)} aria-label="Dézoomer">
              <Minus className="size-4" aria-hidden="true" />
            </button>
            <button type="button" className="pt-icone" onClick={() => globe.current?.recentrer()} aria-label="Revenir au monde entier">
              <LocateFixed className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
        {choisi ? (
          <aside className="pt-explorer-fiche">
            <FichePays code={choisi} onChoisir={(c) => ouvrir(c)} onFermer={() => onFocus(null)} />
          </aside>
        ) : (
          <aside className="pt-explorer-vide">
            <p>Touche un pays sur le globe, ou cherche-le par son nom ou sa capitale.</p>
            <p className="pt-explorer-astuce">Les petits points dorés sont les micro-États et les îles trop petites pour se voir : touche-les aussi.</p>
          </aside>
        )}
      </div>
    </div>
  );
}
