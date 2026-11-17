"use client";

import { Search } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import {
  auxiliaireDe,
  chargerVerbes,
  conjuguer,
  formesSansPersonne,
  lireVerbe,
  type Monde,
  MONDES,
  PRONOMINAUX,
  TEMPS,
  type TempsId,
} from "@/lib/regles/conjugueur";
import { CODE_DU_ROLE, collage, Legende } from "./Phrase";

/*
 * La Machine à voyager dans le temps : un verbe, une époque, un monde, et les six passagers
 * qui l'habillent sous tes yeux (le corps en bleu, le costume en or, le moteur en violet).
 */

type Props = {
  /** Les temps proposés (dans une leçon). Sans eux : la Machine complète, avec ses quatre mondes. */
  temps?: TempsId[];
  /** Les verbes proposés en raccourci. */
  verbes?: string[];
};

const SEULEMENT_PRONOMINAUX = new Set(["souvenir", "repentir", "évanouir"]);
const VERBES_DEPART = ["chanter", "finir", "être", "avoir", "aller", "faire", "prendre", "venir", "se laver"];

export function Machine({ temps: tempsLecon, verbes: verbesLecon }: Props) {
  const complete = !tempsLecon;
  const raccourcis = verbesLecon ?? VERBES_DEPART;
  const [base, setBase] = useState<Awaited<ReturnType<typeof chargerVerbes>> | null>(null);
  const [verbe, setVerbe] = useState(raccourcis[0]);
  const [saisie, setSaisie] = useState("");
  const [monde, setMonde] = useState<Monde>("reel");
  const [temps, setTemps] = useState<TempsId>(tempsLecon?.[0] ?? "present");
  const [feminin, setFeminin] = useState(false);
  const [inconnu, setInconnu] = useState<string | null>(null);
  const liste = useId();

  useEffect(() => {
    let fini = false;
    void chargerVerbes().then((m) => !fini && setBase(m));
    return () => {
      fini = true;
    };
  }, []);

  // Les verbes qui n'existent qu'avec « se » ne sont proposés que sous leur forme pronominale.
  const tousLesVerbes = useMemo(
    () => (base ? [...[...base.keys()].filter((x) => !SEULEMENT_PRONOMINAUX.has(x)), ...PRONOMINAUX].sort((a, b) => a.localeCompare(b, "fr")) : []),
    [base],
  );
  const tempsVisibles = complete ? TEMPS.filter((t) => t.monde === monde) : TEMPS.filter((t) => tempsLecon.includes(t.id));
  const infoTemps = TEMPS.find((t) => t.id === temps);
  const formes = base ? conjuguer(base, verbe, temps, { feminin }) : [];
  const sans = base ? formesSansPersonne(base, verbe) : null;
  const v = lireVerbe(verbe);

  const choisir = (s: string) => {
    const propre = s.trim().toLowerCase().replace(/’/g, "'");
    if (!propre) return;
    const lu = lireVerbe(propre);
    if (base && !base.has(lu.base)) {
      setInconnu(propre);
      return;
    }
    setInconnu(null);
    setVerbe(propre);
    setSaisie("");
  };

  const changerMonde = (m: Monde) => {
    setMonde(m);
    const premier = TEMPS.find((t) => t.monde === m && (m !== "reel" || t.id === "present")) ?? TEMPS.find((t) => t.monde === m);
    if (premier) setTemps(premier.id);
  };

  return (
    <section className="rg-machine" data-complete={complete || undefined} aria-label="La Machine à voyager dans le temps">
      <div className="rg-machine-verbe">
        <span className="rg-machine-infinitif" lang="fr">
          {verbe}
        </span>
        <div className="rg-machine-raccourcis" role="group" aria-label="Choisir un verbe">
          {raccourcis.map((x) => (
            <button key={x} type="button" className="rg-puce" aria-pressed={x === verbe} onClick={() => choisir(x)}>
              {x}
            </button>
          ))}
        </div>
        <form
          className="rg-machine-cherche"
          onSubmit={(e) => {
            e.preventDefault();
            choisir(saisie);
          }}
        >
          <Search className="size-4 shrink-0" aria-hidden="true" />
          <input
            type="text"
            list={liste}
            value={saisie}
            onChange={(e) => setSaisie(e.target.value)}
            placeholder={complete ? `Un verbe parmi ${tousLesVerbes.length || "270"}` : "Essaie un autre verbe"}
            aria-label="Écris un verbe à l'infinitif"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <datalist id={liste}>
            {tousLesVerbes.map((x) => (
              <option key={x} value={x} />
            ))}
          </datalist>
          <button type="submit" className="rg-puce" disabled={!saisie.trim()}>
            Embarquer
          </button>
        </form>
        {inconnu && (
          <p className="rg-machine-inconnu" role="status">
            « {inconnu} » n&apos;est pas encore à bord. Vérifie qu&apos;il est à l&apos;infinitif (manger, finir, prendre…).
          </p>
        )}
      </div>

      {complete && (
        <div className="rg-mondes" role="tablist" aria-label="Le monde">
          {MONDES.map((m) => (
            <button key={m.id} type="button" role="tab" aria-selected={monde === m.id} className="rg-monde" data-monde={m.id} onClick={() => changerMonde(m.id)}>
              <span className="rg-monde-nom">{m.nom}</span>
              <span className="rg-monde-image">{m.image}</span>
            </button>
          ))}
        </div>
      )}

      <div className="rg-epoques" role="radiogroup" aria-label="L'époque">
        {complete && monde === "reel" && (
          <span className="rg-epoques-axe" aria-hidden="true">
            <span>le passé</span>
            <span>le futur</span>
          </span>
        )}
        <div className="rg-epoques-rail" data-monde={complete ? monde : undefined}>
          {tempsVisibles.map((t) => (
            <button key={t.id} type="button" role="radio" aria-checked={temps === t.id} className="rg-epoque" data-maintenant={t.id === "present" || undefined} onClick={() => setTemps(t.id)}>
              <span className="rg-epoque-point" aria-hidden="true" />
              <span className="rg-epoque-nom">{t.nom}</span>
              {complete && <span className="rg-epoque-niveau">{t.id === "present" ? `maintenant · ${t.niveau}` : t.niveau}</span>}
            </button>
          ))}
        </div>
      </div>

      {infoTemps && (
        <p className="rg-machine-image" aria-live="polite">
          {infoTemps.image}
        </p>
      )}

      <div className="rg-sieges-tete">
        <div className="rg-bascule" role="group" aria-label="Les passagers">
          <button type="button" aria-pressed={!feminin} onClick={() => setFeminin(false)}>
            il, ils
          </button>
          <button type="button" aria-pressed={feminin} onClick={() => setFeminin(true)}>
            elle, elles
          </button>
        </div>
        {(temps === "passeCompose" || temps === "plusQueParfait" || temps.endsWith("Anterieur") || temps === "conditionnelPasse" || temps.endsWith("Passe") || temps === "subjonctifPlusQueParfait") && (
          <span className="rg-moteur">
            Moteur : <strong>{auxiliaireDe(v)}</strong>
            {auxiliaireDe(v) === "être" ? " · l'aimant du participe est allumé" : ""}
          </span>
        )}
      </div>

      <ol className="rg-sieges" data-trois={temps.startsWith("imperatif") || undefined} aria-live="polite">
        {!base
          ? Array.from({ length: 6 }, (_, i) => <li key={i} className="rg-siege" data-attente />)
          : formes.map((f, i) => (
              <li key={`${verbe}-${temps}-${feminin}-${i}`} className="rg-siege" data-vide={!f || undefined} style={{ "--i": i } as React.CSSProperties}>
                {f ? (
                  <span className="rg-forme" lang="fr">
                    {f.map((m, k, tout) => (
                      <span key={k} className="rg-mot" data-code={CODE_DU_ROLE[m.role]} {...collage(tout.map((x) => x.texte), k)}>
                        {m.texte}
                      </span>
                    ))}
                  </span>
                ) : (
                  <span className="rg-forme-vide" title="Cette forme n'existe pas pour ce verbe">
                    n&apos;existe pas
                  </span>
                )}
              </li>
            ))}
      </ol>

      <Legende
        codes={["s", "r", "t", "a", "p"]}
        libelles={{ s: "le passager", r: "le corps (radical)", t: "le costume (terminaison)", a: "le moteur (auxiliaire)", p: "la valise souvenir (participe)" }}
      />

      {sans && complete && (
        <dl className="rg-sans-personne">
          <div>
            <dt>Participe présent</dt>
            <dd lang="fr">{sans.participePresent ?? "—"}</dd>
          </div>
          <div>
            <dt>Gérondif</dt>
            <dd lang="fr">{sans.gerondif ?? "—"}</dd>
          </div>
          <div>
            <dt>Participe passé</dt>
            <dd lang="fr">{sans.participePasse ?? "—"}</dd>
          </div>
          <div>
            <dt>Moteur des temps composés</dt>
            <dd>{sans.auxiliaire}</dd>
          </div>
        </dl>
      )}
      {complete && <p className="rg-credit">Conjugaisons issues du Lefff (licence LGPL-LR), vérifiées et corrigées à la main.</p>}
    </section>
  );
}
