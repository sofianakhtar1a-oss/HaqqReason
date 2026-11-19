"use client";

import { ArrowLeft, ArrowRight, BookOpen, CalendarDays, Gauge, RotateCcw, Star, Target, X } from "lucide-react";
import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { piegesDe, PIEGES_CAPITALES, paysDuTheme, THEMES } from "@/lib/monde/apprendre";
import { formatPopulation, formatSuperficie, jourDeParis, motCapitale, NOM_CONTINENT, PAR_CODE, pays } from "@/lib/monde/atlas";
import { CATEGORIES, type CategorieId, TYPES } from "@/lib/monde/categories";
import { decalageMinutes, formatDecalage } from "@/lib/monde/geo";
import { aujourdhui, basculerFavori, boite, confusionsFrequentes, type Difficulte, erreursRecentes, estFavori, prevision, regler, useMonde } from "@/lib/monde/progression";
import type { Pays } from "@/lib/monde/types";
import { Drapeau, Silhouette } from "./figures";
import type { Lancement } from "./Partie";

/*
 * Mieux apprendre : découvrir avant de jouer, le carnet du jour (objectif, révisions à venir,
 * difficulté), les routes thématiques, « Mes erreurs » et « Tes confusions », l'étoile des pays.
 */

/* ---------- L'étoile « Mes pays » ---------- */

export function EtoileFavori({ code }: { code: string }) {
  const monde = useMonde();
  const actif = estFavori(monde, code);
  return (
    <button
      type="button"
      className="pt-etoile-favori"
      aria-pressed={actif}
      onClick={(e) => {
        e.stopPropagation();
        basculerFavori(code);
      }}
      aria-label={actif ? `Retirer ${pays(code).nom} de « Mes pays »` : `Ajouter ${pays(code).nom} à « Mes pays »`}
      title={actif ? "Dans « Mes pays »" : "Ajouter à « Mes pays »"}
    >
      <Star className="size-4" aria-hidden="true" />
    </button>
  );
}

/* ---------- Ce qu'on apprend d'un pays, selon la route ---------- */

function ceQuOnApprend(p: Pays, c: CategorieId | null): string[] {
  const capitale = p.capitale ? `${motCapitale(p)} : ${p.capitale}` : null;
  switch (c) {
    case "capitales":
      return [capitale ?? "Pas de capitale à apprendre", ...(p.noteCapitale ? [p.noteCapitale] : [])];
    case "continents":
      return [`En ${NOM_CONTINENT[p.continent]}`, p.sousRegion];
    case "monnaies":
      return [p.monnaies.map((m) => `${m.nom}${m.symbole ? ` (${m.symbole})` : ""}`).join(", ") || "Pas de monnaie propre"];
    case "gentiles":
      return [p.gentile ? `Les habitants : ${p.gentile[0]}${p.gentile[1] ? `, ${p.gentile[1]}` : ""}` : "Pas de gentilé usuel"];
    case "langues":
      return [p.langues.length ? `Langues : ${p.langues.join(", ")}` : "—"];
    case "villes":
      return [(p.villes ?? []).length ? `Grandes villes : ${(p.villes ?? []).slice(0, 4).join(", ")}` : "—", ...(capitale ? [capitale] : [])];
    case "reliefs":
      return [p.sommet ? `Point culminant : ${p.sommet[0]} (${new Intl.NumberFormat("fr-FR").format(p.sommet[1])} m)` : "—", ...(p.fleuve ? [`Plus long fleuve : ${p.fleuve[0]}`] : [])];
    case "codes":
      return [[p.tld, p.indicatif, p.iso3].filter(Boolean).join(", ") || "—", p.conduite ? `On roule à ${p.conduite}` : ""].filter(Boolean);
    case "fuseaux":
      return [p.fuseau ? `Heure : ${formatDecalage(decalageMinutes(p.fuseau))}` : "—"];
    case "voisins":
      return [p.voisins.length ? `Voisins : ${p.voisins.map((v) => PAR_CODE.get(v)?.nom).filter(Boolean).join(", ")}` : "Aucun voisin terrestre"];
    case "comparaisons":
      return [`${formatPopulation(p.population)}`, formatSuperficie(p.superficie)];
    default:
      return [capitale ?? `En ${NOM_CONTINENT[p.continent]}`, `En ${NOM_CONTINENT[p.continent]}`].filter((x, i, t) => t.indexOf(x) === i);
  }
}

/* ---------- Découvrir avant de jouer ---------- */

export function Decouvrir({ titre, codes, categorie, onFermer, onJouer }: { titre: string; codes: string[]; categorie: CategorieId | null; onFermer: () => void; onJouer?: () => void }) {
  useEffect(() => {
    const avant = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const echap = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFermer();
    };
    window.addEventListener("keydown", echap);
    return () => {
      document.body.style.overflow = avant;
      window.removeEventListener("keydown", echap);
    };
  }, [onFermer]);
  const surCarte = categorie === "cartes";
  return createPortal(
    <div className="pt pt-partie pt-decouvrir" data-accent="safran" role="dialog" aria-modal="true" aria-label={`Découvrir : ${titre}`}>
      <div className="pt-partie-fond" aria-hidden="true" />
      <header className="pt-partie-tete">
        <button type="button" className="pt-icone" onClick={onFermer} aria-label="Fermer">
          <X className="size-5" aria-hidden="true" />
        </button>
        <div className="pt-decouvrir-titre">
          <span>Découvrir</span>
          <strong>{titre}</strong>
        </div>
        {onJouer && (
          <button type="button" className="bouton bouton-principal" onClick={onJouer}>
            Je suis prêt
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        )}
      </header>
      <ul className="pt-decouvrir-cartes">
        {codes.map((code, i) => {
          const p = pays(code);
          const lignes = ceQuOnApprend(p, categorie);
          const pieges = [
            ...piegesDe(code)
              .filter((x) => (categorie === "drapeaux" ? x.sur === "drapeau" : categorie === "capitales" ? false : true))
              .map((x) => x.texte),
            ...(categorie === "capitales" || categorie === null ? [PIEGES_CAPITALES[code]].filter(Boolean) : []),
          ];
          return (
            <li key={code} style={{ "--i": Math.min(i, 20) } as React.CSSProperties}>
              <span className="pt-decouvrir-figure">{surCarte && p.carte ? <Silhouette code={code} /> : <Drapeau code={code} grand />}</span>
              <span className="pt-decouvrir-corps">
                <span className="pt-decouvrir-nom">
                  {p.nom}
                  <EtoileFavori code={code} />
                </span>
                {lignes.map((l) => (
                  <span key={l} className="pt-decouvrir-ligne">
                    {l}
                  </span>
                ))}
                {pieges.slice(0, 2).map((t) => (
                  <span key={t} className="pt-decouvrir-piege">
                    {t}
                  </span>
                ))}
              </span>
            </li>
          );
        })}
      </ul>
    </div>,
    document.body,
  );
}

/* ---------- Le carnet du jour ---------- */

const JOURS_COURTS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];

export function Carnet({ aller }: { aller: (hash: string) => void }) {
  const monde = useMonde();
  const p = monde.profil;
  const faites = p.jourObjectif === jourDeParis() ? p.faites : 0;
  const part = Math.min(1, faites / Math.max(1, p.objectif));
  const jours = useMemo(() => prevision(monde), [monde]);
  const plusHaut = Math.max(1, ...jours);
  const erreurs = erreursRecentes(monde).length;
  // Le jour de la semaine (le 1er janvier 1970 était un jeudi).
  const aujourd = (aujourdhui() + 4) % 7;
  return (
    <section className="pt-carnet" aria-labelledby="pt-carnet">
      <h3 id="pt-carnet" className="pt-sous-titre">
        Mon carnet
      </h3>
      <div className="pt-carnet-grille">
        <div className="pt-carnet-carte">
          <p className="pt-carnet-tete">
            <Target className="size-4" aria-hidden="true" />
            Objectif du jour
          </p>
          <div className="pt-objectif">
            <span className="pt-anneau pt-anneau-grand" role="img" aria-label={`${faites} questions sur ${p.objectif}`} style={{ "--part": part } as React.CSSProperties}>
              <svg viewBox="0 0 36 36" aria-hidden="true">
                <circle cx="18" cy="18" r="15.5" className="pt-anneau-fond" />
                <circle cx="18" cy="18" r="15.5" className="pt-anneau-plein" pathLength={100} />
              </svg>
              <span className="tabular-nums">
                {Math.min(faites, 999)}
                <small>/{p.objectif}</small>
              </span>
            </span>
            <div>
              <p className="pt-objectif-texte">{faites >= p.objectif ? "Objectif atteint. Bravo !" : `Encore ${p.objectif - faites} question${p.objectif - faites > 1 ? "s" : ""} aujourd'hui.`}</p>
              <div className="pt-segments" role="group" aria-label="L'objectif du jour">
                {[10, 20, 50].map((n) => (
                  <button key={n} type="button" aria-pressed={p.objectif === n} onClick={() => regler({ objectif: n })}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-carnet-carte">
          <p className="pt-carnet-tete">
            <CalendarDays className="size-4" aria-hidden="true" />
            Les révisions des 7 prochains jours
          </p>
          <ol className="pt-prevision" aria-label="Le nombre de révisions prévues chaque jour">
            {jours.map((n, k) => (
              <li key={k} aria-label={`${k === 0 ? "Aujourd'hui" : k === 1 ? "Demain" : JOURS_COURTS[(aujourd + k) % 7]} : ${n}`}>
                <span className="pt-prevision-n tabular-nums">{n || ""}</span>
                <span className="pt-prevision-barre" style={{ "--h": n / plusHaut } as React.CSSProperties} />
                <span className="pt-prevision-jour">{k === 0 ? "auj." : k === 1 ? "dem." : JOURS_COURTS[(aujourd + k) % 7]}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="pt-carnet-carte">
          <p className="pt-carnet-tete">
            <Gauge className="size-4" aria-hidden="true" />
            Les faux choix
          </p>
          <div className="pt-segments" role="group" aria-label="La difficulté des faux choix">
            {(
              [
                ["facile", "Faciles"],
                ["normal", "Normaux"],
                ["difficile", "Trompeurs"],
              ] as [Difficulte, string][]
            ).map(([d, n]) => (
              <button key={d} type="button" aria-pressed={p.difficulte === d} onClick={() => regler({ difficulte: d })}>
                {n}
              </button>
            ))}
          </div>
          <p className="pt-carnet-aide">{p.difficulte === "facile" ? "Des pays éloignés et quatre choix : pour débuter." : p.difficulte === "difficile" ? "Des voisins et des drapeaux jumeaux, souvent six choix." : "Des faux choix qui suivent ton niveau."}</p>
          <p className="pt-carnet-tete">Questions par niveau</p>
          <div className="pt-segments" role="group" aria-label="Le nombre de questions d'un niveau">
            {([10, 20, 30] as const).map((n) => (
              <button key={n} type="button" aria-pressed={p.questions === n} onClick={() => regler({ questions: n })}>
                {n}
              </button>
            ))}
          </div>
          <p className="pt-carnet-tete">Le rythme du chrono</p>
          <div className="pt-segments" role="group" aria-label="Le rythme du chrono">
            {(
              [
                ["lent", "Lent"],
                ["normal", "Normal"],
                ["rapide", "Rapide"],
              ] as const
            ).map(([r, n]) => (
              <button key={r} type="button" aria-pressed={p.rythme === r} onClick={() => regler({ rythme: r })}>
                {n}
              </button>
            ))}
          </div>
          <button type="button" className="pt-lien" onClick={() => aller("accueil/erreurs")}>
            {erreurs ? `Mes erreurs des 7 derniers jours (${erreurs})` : "Mes erreurs et mes confusions"}
          </button>
        </div>
      </div>
    </section>
  );
}

/* ---------- Les routes thématiques ---------- */

export function RoutesThematiques({ lancer, decouvrir }: { lancer: (l: Lancement) => void; decouvrir: (titre: string, codes: string[]) => void }) {
  const monde = useMonde();
  return (
    <section aria-labelledby="pt-themes">
      <h3 id="pt-themes" className="pt-sous-titre">
        Routes thématiques
      </h3>
      <p className="pt-sous-chapo">Vingt questions sur un groupe de pays : drapeaux, capitales et cartes mêlés, trois cœurs.</p>
      <div className="pt-themes">
        {THEMES.map((t) => {
          const codes = paysDuTheme(t.id);
          const sus = codes.filter((c) => ["drapeaux", "capitales", "cartes"].some((f) => boite(monde, c, f as CategorieId) >= 3)).length;
          const r = monde.records[`theme:${t.id}`] ?? 0;
          return (
            <div key={t.id} className="pt-theme" style={{ "--part": codes.length ? sus / codes.length : 0 } as React.CSSProperties}>
              <span className="pt-theme-drapeaux" aria-hidden="true">
                {codes.slice(0, 4).map((c) => (
                  <Drapeau key={c} code={c} nomme={false} />
                ))}
              </span>
              <span className="pt-theme-nom">{t.nom}</span>
              <span className="pt-theme-texte">{t.texte}</span>
              <span className="pt-theme-pied">
                <span className="tabular-nums">
                  {codes.length} pays, {sus} maîtrisés{r ? `, record ${r}/20` : ""}
                </span>
              </span>
              <span className="pt-theme-actions">
                <button type="button" className="bouton bouton-principal" onClick={() => lancer({ cle: `${Date.now()}`, sorte: "theme", theme: t.id, titre: t.nom })}>
                  Jouer
                </button>
                <button type="button" className="bouton bouton-discret" onClick={() => decouvrir(t.nom, codes)}>
                  <BookOpen className="size-4" aria-hidden="true" />
                  Découvrir
                </button>
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- Mes erreurs et tes confusions ---------- */

const libelleJour = (ecart: number) => (ecart === 0 ? "Aujourd'hui" : ecart === 1 ? "Hier" : `Il y a ${ecart} jours`);

export function MesErreurs({ onRetour, lancer }: { onRetour: () => void; lancer: (l: Lancement) => void }) {
  const monde = useMonde();
  const erreurs = erreursRecentes(monde);
  const confusions = confusionsFrequentes(monde);
  const jour = aujourdhui();
  const parJour = useMemo(() => {
    const m = new Map<number, typeof erreurs>();
    for (const x of [...erreurs].reverse()) m.set(jour - x.j, [...(m.get(jour - x.j) ?? []), x]);
    return [...m.entries()].sort((a, b) => a[0] - b[0]);
  }, [erreurs, jour]);
  const lisible = (t: string, r: string) => (r === "__temps__" ? "le temps s'est écoulé" : PAR_CODE.get(r)?.nom ?? (t.includes("puzzle") || t.includes("colorie") ? "un dessin inexact" : r));
  return (
    <div className="pt-categorie pt-erreurs">
      <button type="button" className="pt-retour-lien" onClick={onRetour}>
        <ArrowLeft className="size-4" aria-hidden="true" />
        Toutes les routes
      </button>
      <header className="pt-categorie-tete">
        <RotateCcw className="pt-categorie-icone" strokeWidth={1.3} aria-hidden="true" />
        <div>
          <h2 className="pt-titre">Mes erreurs</h2>
          <p className="pt-chapo">Les questions manquées ces sept derniers jours, et les pays que tu prends l&apos;un pour l&apos;autre.</p>
          <button type="button" className="bouton bouton-principal" disabled={!erreurs.length} onClick={() => lancer({ cle: `${Date.now()}`, sorte: "erreurs", titre: "Mes erreurs" })}>
            <RotateCcw className="size-4" aria-hidden="true" />
            Rejouer mes erreurs
          </button>
        </div>
      </header>

      {confusions.length > 0 && (
        <section aria-labelledby="pt-confusions">
          <h3 id="pt-confusions" className="pt-sous-titre">
            Tes confusions
          </h3>
          <ul className="pt-confusions">
            {confusions.map(([a, b, n]) => {
              const piege = piegesDe(a).find((x) => x.codes.includes(b));
              return (
                <li key={`${a}>${b}`}>
                  <span className="pt-confusion">
                    <span>
                      <Drapeau code={a} />
                      <span>{pays(a).nom}</span>
                    </span>
                    <span>
                      <Drapeau code={b} />
                      <span>{pays(b).nom}</span>
                    </span>
                  </span>
                  <span className="pt-confusions-n">
                    {n} fois{piege ? "" : "."}
                  </span>
                  {piege && <span className="pt-piege-texte">{piege.texte}</span>}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section aria-labelledby="pt-erreurs-jours">
        <h3 id="pt-erreurs-jours" className="pt-sous-titre">
          Jour par jour
        </h3>
        {!erreurs.length && <p className="pt-sous-chapo">Aucune erreur ces sept derniers jours. Elles apparaîtront ici, pour que tu les rejoues.</p>}
        {parJour.map(([ecart, liste]) => (
          <div key={ecart} className="pt-erreurs-jour">
            <p className="pt-erreurs-date">{libelleJour(ecart)}</p>
            <ul className="pt-cabinet-liste">
              {liste.map((x, i) => {
                const p = PAR_CODE.get(x.c);
                if (!p) return null;
                const def = TYPES[x.t as keyof typeof TYPES];
                return (
                  <li key={`${x.t}-${x.c}-${i}`}>
                    <Drapeau code={p.code} />
                    <span className="pt-cabinet-element">
                      <strong>{p.nom}</strong>
                      <span>{def ? `${CATEGORIES[def.categorie].nom} : ${def.libelle.toLowerCase()}` : ""}</span>
                      <span className="pt-cabinet-element-note">Ta réponse : {lisible(x.t, x.r)}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}
