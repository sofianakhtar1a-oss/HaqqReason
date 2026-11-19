"use client";

import { Check, RotateCcw, Shuffle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { piegesDe, PIEGES_CAPITALES, paysDuTheme, THEMES, type ThemeId } from "@/lib/monde/apprendre";
import { CONTINENTS, formatPopulation, formatSuperficie, motCapitale, NOM_CONTINENT, pays } from "@/lib/monde/atlas";
import { melanger, hasard, nouvelleGraine } from "@/lib/monde/hasard";
import { grade, NB_NIVEAUX, niveauxDe } from "@/lib/monde/niveaux";
import { aRevoir, mesPays, noterReponse, useMonde } from "@/lib/monde/progression";
import type { ContinentId } from "@/lib/monde/types";
import { useTextes } from "@/lib/modules/textes-client";
import { EtoileFavori } from "./Apprendre";
import { Drapeau, Silhouette } from "./figures";
import { Globe } from "./Globe";
import { populationDe, useEdition } from "@/lib/monde/edition-client";

/*
 * Les fiches mémoire : le recto (un drapeau, un nom ou une silhouette), on se répond dans sa tête,
 * on retourne la carte. « Je savais » l'éloigne, « À revoir » la fait revenir dans la séance
 * et demain. Chaque niveau a son paquet ; un paquet spécial réunit les fiches à revoir.
 */

type Recto = "drapeau" | "nom" | "silhouette" | "capitale" | "carte";
/** Un paquet : un niveau (n:3), les fiches à revoir, « Mes pays », un continent (c:afrique) ou une route (t:ue). */
type Paquet = string;

function codesDuPaquet(paquet: Paquet, dues: string[], mes: string[]): string[] {
  if (paquet === "revoir") return dues;
  if (paquet === "mes") return mes;
  if (paquet.startsWith("c:")) {
    const c = paquet.slice(2) as ContinentId;
    return niveauxDe("drapeaux")
      .flat()
      .filter((x) => pays(x).continent === c);
  }
  if (paquet.startsWith("t:")) return paysDuTheme(paquet.slice(2) as ThemeId);
  return niveauxDe("drapeaux")[Number(paquet.slice(2)) - 1] ?? [];
}

export function Fiches() {
  const t = useTextes("monde");
  const monde = useMonde();
  const [paquet, setPaquet] = useState<Paquet>("n:1");
  const [recto, setRecto] = useState<Recto>("drapeau");
  const [graine, setGraine] = useState(nouvelleGraine);
  const [tour, setTour] = useState(0);

  const dues = useMemo(() => Object.entries(monde.pays).filter(([, m]) => aRevoir(m.fiches)).map(([c]) => c), [monde.pays]);
  // Le paquet : les pays du niveau (l'ordre des drapeaux, du plus connu au moins connu).
  // Il ne change pas à chaque fiche notée : seulement quand on en choisit un autre.
  const [duesFigees, setDuesFigees] = useState(dues);
  const mes = useMemo(() => mesPays(monde), [monde]);
  const [mesFiges, setMesFiges] = useState(mes);
  const codes = useMemo(() => {
    const base = codesDuPaquet(paquet, duesFigees, mesFiges);
    return melanger(
      base.filter((c) => (recto !== "silhouette" && recto !== "carte") || pays(c).carte).filter((c) => recto !== "capitale" || pays(c).capitale),
      hasard(graine),
    );
  }, [paquet, recto, graine, duesFigees, mesFiges]);

  return (
    <div className="pt-fiches">
      <header className="pt-section-tete">
        <div>
          <h2 className="pt-titre">{t("fiches.titre")}</h2>
          <p className="pt-chapo">{t("fiches.chapo")}</p>
        </div>
      </header>

      <div className="pt-fiches-outils">
        <label className="pt-selecteur">
          <span>Paquet</span>
          <select
            value={paquet}
            onChange={(e) => {
              setDuesFigees(dues);
              setMesFiges(mes);
              setPaquet(e.target.value);
            }}
          >
            {(dues.length > 0 || paquet === "revoir") && <option value="revoir">À revoir ({dues.length})</option>}
            {(mes.length > 0 || paquet === "mes") && <option value="mes">Mes pays ({mes.length})</option>}
            <optgroup label="Par niveau">
              {Array.from({ length: NB_NIVEAUX }, (_, i) => (
                <option key={i} value={`n:${i + 1}`}>
                  Niveau {i + 1} : {grade(i + 1).nom} ({niveauxDe("drapeaux")[i].length} pays)
                </option>
              ))}
            </optgroup>
            <optgroup label="Par continent">
              {CONTINENTS.filter((c) => c.id !== "antarctique").map((c) => (
                <option key={c.id} value={`c:${c.id}`}>
                  {NOM_CONTINENT[c.id]}
                </option>
              ))}
            </optgroup>
            <optgroup label="Par route thématique">
              {THEMES.map((t) => (
                <option key={t.id} value={`t:${t.id}`}>
                  {t.nom}
                </option>
              ))}
            </optgroup>
          </select>
        </label>
        <div className="pt-segments" role="group" aria-label="Le recto des fiches">
          {(
            [
              ["drapeau", "Drapeau"],
              ["nom", "Nom"],
              ["capitale", "Capitale"],
              ["silhouette", "Silhouette"],
              ["carte", "Globe"],
            ] as const
          ).map(([v, n]) => (
            <button key={v} type="button" aria-pressed={recto === v} onClick={() => setRecto(v)}>
              {n}
            </button>
          ))}
        </div>
        <button type="button" className="pt-icone" onClick={() => setGraine(nouvelleGraine())} aria-label="Mélanger le paquet" title="Mélanger le paquet">
          <Shuffle className="size-4" aria-hidden="true" />
        </button>
      </div>

      <Seance key={`${paquet}-${recto}-${graine}-${tour}`} codes={codes} recto={recto} onRecommencer={() => setTour((n) => n + 1)} />
    </div>
  );
}

/** Une séance de fiches : elle repart de zéro quand le paquet change (clé). */
function Seance({ codes, recto, onRecommencer }: { codes: string[]; recto: Recto; onRecommencer: () => void }) {
  const edition = useEdition();
  const [file, setFile] = useState<string[]>(codes);
  const [retournee, setRetournee] = useState(false);
  const [sus, setSus] = useState(0);
  const [vus, setVus] = useState(0);

  const code = file[0];
  const noter = useCallback(
    (savait: boolean) => {
      if (!code) return;
      noterReponse(code, "fiches", savait);
      setVus((v) => v + 1);
      if (savait) setSus((s) => s + 1);
      setRetournee(false);
      // Une fiche ratée revient un peu plus loin dans la séance.
      setFile((f) => (savait ? f.slice(1) : [...f.slice(1, 4), f[0], ...f.slice(4)]));
    },
    [code],
  );

  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "BUTTON") return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setRetournee((r) => !r);
      } else if (retournee && e.key === "ArrowRight") noter(true);
      else if (retournee && e.key === "ArrowLeft") noter(false);
    };
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  }, [retournee, noter]);

  const p = code ? pays(code) : null;
  if (!p)
    return (
      <div className="pt-fiches-fin">
        <p className="pt-nom-grand">{vus ? "Paquet terminé" : "Ce paquet est vide"}</p>
        {vus > 0 && (
          <p>
            {sus} fiche{sus > 1 ? "s" : ""} sue{sus > 1 ? "s" : ""} du premier coup sur {vus}.
          </p>
        )}
        <button type="button" className="bouton bouton-principal" onClick={onRecommencer} disabled={!codes.length}>
          <RotateCcw className="size-4" aria-hidden="true" />
          Recommencer le paquet
        </button>
      </div>
    );
  return (
    <div className="pt-fiche-scene">
      <div className="pt-fiches-ligne">
        <p className="pt-fiches-compte" role="status">
          {file.length} fiche{file.length > 1 ? "s" : ""} restante{file.length > 1 ? "s" : ""}
          {vus > 0 ? `, ${sus} sue${sus > 1 ? "s" : ""} sur ${vus}` : ""}
        </p>
        {retournee && <EtoileFavori code={p.code} />}
      </div>
      <button type="button" className="pt-carte-memoire" data-retournee={retournee || undefined} onClick={() => setRetournee((r) => !r)} aria-label={retournee ? `Verso : ${p.nom}` : "Recto : retourne la fiche pour voir la réponse"}>
        <span className="pt-carte-face pt-carte-recto" aria-hidden={retournee}>
          {recto === "drapeau" ? (
            <Drapeau code={p.code} nomme={false} grand />
          ) : recto === "silhouette" ? (
            <Silhouette code={p.code} />
          ) : recto === "carte" ? (
            <span className="pt-carte-globe">
              <Globe key={p.code} cible={p.code} reperes="cible" libelle="Le globe : un pays est allumé" />
            </span>
          ) : recto === "capitale" ? (
            <span className="pt-invite-texte">
              <span className="pt-invite-etiquette">{motCapitale(p)} de quel pays ?</span>
              <span className="pt-nom-grand">{p.capitale}</span>
            </span>
          ) : (
            <span className="pt-nom-grand">{p.nom}</span>
          )}
          <span className="pt-carte-indice">Touche pour retourner</span>
        </span>
        <span className="pt-carte-face pt-carte-verso" aria-hidden={!retournee}>
          <span className="pt-verso-tete">
            <Drapeau code={p.code} />
            <span className="pt-verso-nom">{p.nom}</span>
          </span>
          <span className="pt-verso-faits">
            <span>
              <b>{motCapitale(p)}</b> {p.capitale ?? "—"}
            </span>
            <span>
              <b>Continent</b> {NOM_CONTINENT[p.continent]}
            </span>
            <span>
              <b>Monnaie</b> {p.monnaies[0]?.nom ?? "—"}
            </span>
            <span>
              <b>Population</b> {formatPopulation(populationDe(p, edition).n)}
            </span>
            <span>
              <b>Superficie</b> {formatSuperficie(p.superficie)}
            </span>
          </span>
          {(piegesDe(p.code)[0] || PIEGES_CAPITALES[p.code]) && <span className="pt-verso-piege">{piegesDe(p.code)[0]?.texte ?? PIEGES_CAPITALES[p.code]}</span>}
        </span>
      </button>
      <div className="pt-fiches-reponse" data-visible={retournee || undefined}>
        <button type="button" className="bouton bouton-discret" disabled={!retournee} onClick={() => noter(false)}>
          <RotateCcw className="size-4" aria-hidden="true" />À revoir
        </button>
        <button type="button" className="bouton bouton-principal" disabled={!retournee} onClick={() => noter(true)}>
          <Check className="size-4" aria-hidden="true" />
          Je savais
        </button>
      </div>
      <p className="pt-astuce">Au clavier : Espace retourne la fiche, flèche droite pour « Je savais », flèche gauche pour « À revoir ».</p>
    </div>
  );
}
