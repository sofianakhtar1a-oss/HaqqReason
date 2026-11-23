"use client";

import { ArrowRight, BookMarked, BookOpen, Clapperboard, Compass, Ear, FileText, Flame, NotebookPen, Play, Volume2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { dureeLisible } from "@/lib/alambic/transcription/exports";
import { elementDe, elementDEntree } from "@/lib/langues/dictionnaire";
import { cleJour, estDue } from "@/lib/langues/srs";
import { type DocumentLangue, listerDocuments, listerMedias, type MediaLangue } from "@/lib/langues/stockage";
import { chargerDictees, DICTEES_PAR_NIVEAU, serieDicteeNumero } from "@/lib/langues/dictees";
import { type Entree, NIVEAUX, type Niveau } from "@/lib/langues/types";
import { useTextes } from "@/lib/modules/textes-client";
import { HISTOIRES } from "@/lib/langues/histoires/catalogue";
import { useLectures } from "@/lib/langues/histoires/progression";
import { SERIE_POSITIONNEMENT, useSuivi } from "@/lib/regles/suivi";
import { Couverture } from "./histoires/Bibliotheque";
import "./histoires/histoires.css";
import { parler, voixDisponible } from "@/lib/langues/voix";
import { resumeJournal, useDonnees } from "./donnees";
import type { Lancement } from "./Seance";
import { BarreProgres, ICONES_THEMES, progresDe, useThemes } from "./Vocabulaire";

type Props = { lancer: (l: Lancement) => void; aller: (hash: string) => void };

/** Le même mot pour tout le monde, chaque jour. */
function motDuJour(maintenant: number, entrees: Entree[]) {
  const cle = cleJour(maintenant);
  let h = 0;
  for (const c of cle) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return entrees.length ? entrees[h % entrees.length] : null;
}

export function Accueil({ lancer, aller }: Props) {
  const { cartes, mots, journal } = useDonnees();
  const [maintenant] = useState(() => Date.now());
  const [recents, setRecents] = useState<{ media?: MediaLangue; document?: DocumentLangue }>({});

  useEffect(() => {
    void Promise.all([listerMedias().catch(() => []), listerDocuments().catch(() => [])]).then(([m, d]) => setRecents({ media: m[0], document: d[0] }));
  }, []);

  const themes = useThemes();
  const t = useTextes("langues");
  const OBJECTIF_JOUR = Math.max(1, Number(t("objectif")) || 20);
  const toutes = useMemo(() => themes.flatMap((x) => x.entrees), [themes]);
  const mot = motDuJour(maintenant, toutes);
  const r = resumeJournal(journal, maintenant);
  const elements = useMemo(() => [...toutes.map(elementDEntree), ...mots.filter((m) => !m.passage).map(elementDe)], [mots, toutes]);
  const dus = elements.filter((e) => estDue(cartes.get(e.id), maintenant)).length;
  const fait = Math.min(1, r.aujourdhui / OBJECTIF_JOUR);
  const maxSemaine = Math.max(OBJECTIF_JOUR, ...r.semaine.map((j) => j.revues));
  const enCours = themes.map((x) => ({ t: x, p: progresDe(x.entrees.map((e) => e.id), cartes, maintenant) }))
    .sort((a, b) => b.p.dus - a.p.dus || b.p.total - b.p.nouveau - (a.p.total - a.p.nouveau))
    .slice(0, 4);

  return (
    <div className="lg-accueil">
      {mot && (
      <section className="lg-mot-du-jour" aria-labelledby="titre-mot-jour">
        <p id="titre-mot-jour" className="lg-etiquette">
          {t("accueil.motDuJour")}
        </p>
        <p className="lg-mdj-en" lang="en">
          {mot.en}
        </p>
        <p className="lg-mdj-api">
          <span lang="en">{mot.api}</span>
          <span>{mot.nature}</span>
          {voixDisponible() && (
            <button type="button" className="lg-ecoute" aria-label={`Écouter « ${mot.en} »`} onClick={() => void parler(mot.en)}>
              <Volume2 className="size-4" aria-hidden="true" />
            </button>
          )}
        </p>
        <p className="lg-mdj-fr">{mot.fr}</p>
        <figure className="lg-mdj-exemple">
          <blockquote lang="en">{mot.exEn}</blockquote>
          <figcaption>{mot.exFr}</figcaption>
        </figure>
      </section>
      )}

      <section className="lg-journee" aria-labelledby="titre-journee">
        <h2 id="titre-journee" className="lg-etiquette">
          {t("accueil.journee")}
        </h2>
        <div className="lg-journee-haut">
          <div className="lg-anneau" style={{ ["--fait" as string]: fait }} role="img" aria-label={`${r.aujourdhui} révisions sur ${OBJECTIF_JOUR} aujourd'hui`}>
            <svg viewBox="0 0 40 40" aria-hidden="true">
              <circle cx="20" cy="20" r="17" />
              <circle cx="20" cy="20" r="17" pathLength="1" />
            </svg>
            <span>
              {r.aujourdhui}
              <small>/{OBJECTIF_JOUR}</small>
            </span>
          </div>
          <div>
            <p className="lg-serie" data-active={r.serie > 0 || undefined}>
              <Flame className="size-5" aria-hidden="true" />
              {r.serie ? `${r.serie} jour${r.serie > 1 ? "s" : ""} d'affilée` : "Commence ta série"}
            </p>
            <p className="text-sm text-encre-douce">{dus ? `${dus} mot${dus > 1 ? "s" : ""} t'attend${dus > 1 ? "ent" : ""}.` : r.aujourdhui ? "Tout est révisé, bravo." : "De nouveaux mots t'attendent."}</p>
          </div>
        </div>
        <ol className="lg-semaine" aria-label="Les sept derniers jours">
          {r.semaine.map((j) => (
            <li key={j.cle} title={`${j.revues} révision${j.revues > 1 ? "s" : ""}`}>
              <span className="lg-semaine-barre">
                <span style={{ height: `${Math.max(j.revues ? 8 : 0, (j.revues / maxSemaine) * 100)}%` }} data-objectif={j.revues >= OBJECTIF_JOUR || undefined} />
              </span>
              <span className="lg-semaine-jour">{j.jour.toLocaleDateString("fr-FR", { weekday: "narrow" })}</span>
            </li>
          ))}
        </ol>
        <button type="button" className="bouton bouton-principal w-full" onClick={() => lancer({ titre: "Séance du jour", elements, mode: "guidee" })}>
          <Play className="size-4" fill="currentColor" aria-hidden="true" />
          {dus ? `Réviser ${dus} mot${dus > 1 ? "s" : ""}` : "Apprendre de nouveaux mots"}
        </button>
      </section>

      <Progresser aller={aller} />

      {(recents.media || recents.document) && (
        <section className="lg-reprendre" aria-labelledby="titre-reprendre">
          <h2 id="titre-reprendre" className="lg-sous-titre">
            {t("accueil.reprendre")}
          </h2>
          <div className="lg-reprendre-grille">
            {recents.media && (
              <button type="button" className="lg-reprise" onClick={() => aller(`ecouter/${recents.media!.id}`)}>
                <Clapperboard className="size-5 text-accent" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="lg-element-titre">{recents.media.titre}</span>
                  <span className="lg-element-infos">{recents.media.position ? `Repris à ${dureeLisible(recents.media.position)}` : "Pas encore commencé"}</span>
                </span>
                <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            )}
            {recents.document && (
              <button type="button" className="lg-reprise" onClick={() => aller(`lire/${recents.document!.id}`)}>
                <FileText className="size-5 text-accent" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="lg-element-titre">{recents.document.titre}</span>
                  <span className="lg-element-infos">
                    Page {recents.document.page} sur {recents.document.pages.length}
                  </span>
                </span>
                <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </section>
      )}

      <section className="lg-accueil-themes" aria-labelledby="titre-themes-accueil">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="titre-themes-accueil" className="lg-sous-titre">
            {t("accueil.themes")}
          </h2>
          <button type="button" className="lg-lien" onClick={() => aller("vocabulaire")}>
            Les {themes.length} thèmes
          </button>
        </div>
        <ul className="lg-mini-themes">
          {enCours.map(({ t, p }) => {
            const Icone = ICONES_THEMES[t.icone];
            return (
              <li key={t.id}>
                <button type="button" className="lg-mini-theme" onClick={() => aller(`vocabulaire/${t.id}`)}>
                  {Icone && <Icone className="size-5 text-accent" strokeWidth={1.5} aria-hidden="true" />}
                  <span className="min-w-0 flex-1">
                    <span className="lg-mini-theme-nom">{t.nom}</span>
                    <BarreProgres p={p} fine />
                  </span>
                  {p.dus > 0 && <span className="lg-badge">{p.dus}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="lg-accueil-dico" aria-labelledby="titre-dico-accueil">
        <BookMarked className="size-6 text-accent" strokeWidth={1.4} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h2 id="titre-dico-accueil" className="font-display text-lg font-bold">
            {t("accueil.dico")}
          </h2>
          <p className="text-sm text-encre-douce">{mots.length ? `${mots.length} mot${mots.length > 1 ? "s" : ""} rangé${mots.length > 1 ? "s" : ""} depuis tes vidéos, tes lectures et les thèmes.` : t("accueil.dicoVide")}</p>
        </div>
        <button type="button" className="bouton" onClick={() => aller("dictionnaire")}>
          Ouvrir
        </button>
      </section>
    </div>
  );
}

/**
 * Pour progresser : une histoire à lire (celle en cours, ou une de ton niveau), le carnet d'erreurs ou le
 * test de niveau, et la dictée de ton niveau.
 */
function Progresser({ aller }: { aller: (hash: string) => void }) {
  const lectures = useLectures();
  const { erreurs, series } = useSuivi();
  const niveau = series[SERIE_POSITIONNEMENT]?.niveau;
  const enCours = HISTOIRES.filter((h) => lectures[h.id] && !lectures[h.id].fini).sort((a, b) => lectures[b.id].vu - lectures[a.id].vu)[0];
  const proposee = enCours ?? HISTOIRES.find((h) => (niveau ? h.niveau === niveau : true) && !lectures[h.id]?.fini) ?? HISTOIRES[0];
  const nbErreurs = Object.keys(erreurs).length;
  if (!proposee) return null;
  return (
    <section className="lg-progresser" aria-labelledby="titre-progresser">
      <h2 id="titre-progresser" className="lg-sous-titre">
        Pour progresser
      </h2>
      <div className="lg-progresser-grille">
        <button type="button" className="lg-progresser-carte" data-niveau={proposee.niveau} onClick={() => aller(`lire/histoire/${proposee.id}`)}>
          <Couverture h={proposee} petite />
          <span className="min-w-0 flex-1">
            <span className="lg-progresser-etiquette">
              <BookOpen className="size-3.5" aria-hidden="true" />
              {enCours ? "Reprendre ton histoire" : "Une histoire à lire"}
            </span>
            <span className="lg-element-titre">{proposee.titreFr}</span>
            <span className="lg-element-infos">{enCours ? `Page ${Math.min(lectures[enCours.id].page, enCours.pages)} sur ${enCours.pages}` : `${proposee.niveau} · ${proposee.pages} pages · ${proposee.minutes} min`}</span>
          </span>
          <ArrowRight className="size-4" aria-hidden="true" />
        </button>
        {nbErreurs > 0 ? (
          <button type="button" className="lg-progresser-carte" onClick={() => aller("regles/carnet")}>
            <NotebookPen className="size-6 text-accent" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="lg-progresser-etiquette">Ton carnet d&apos;erreurs</span>
              <span className="lg-element-titre">
                {nbErreurs} exercice{nbErreurs > 1 ? "s" : ""} à revoir
              </span>
              <span className="lg-element-infos">Réussis-les deux fois : ils quittent le carnet.</span>
            </span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        ) : (
          <button type="button" className="lg-progresser-carte" onClick={() => aller("regles/positionnement")}>
            <Compass className="size-6 text-accent" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="lg-progresser-etiquette">Test de niveau</span>
              <span className="lg-element-titre">{niveau ? `Ton niveau : ${niveau}` : "Quel est ton niveau ?"}</span>
              <span className="lg-element-infos">{niveau ? "Refais le test pour mesurer tes progrès." : "Quelques minutes pour savoir par où commencer."}</span>
            </span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        )}
        <CarteDictee niveau={niveau && (NIVEAUX as string[]).includes(niveau) ? (niveau as Niveau) : "A1"} aller={aller} />
      </div>
    </section>
  );
}

/** La dictée à faire : la première dictée numérotée du niveau qui n'est pas encore faite, sinon une dictée surprise. */
function CarteDictee({ niveau, aller }: { niveau: Niveau; aller: (hash: string) => void }) {
  const { series } = useSuivi();
  const suivante = Array.from({ length: DICTEES_PAR_NIVEAU }, (_, k) => k + 1).find((n) => !series[serieDicteeNumero(niveau, n)]);
  const cle = `${niveau}/${suivante ?? ""}`;
  const [titre, setTitre] = useState<{ cle: string; titre: string } | null>(null);
  useEffect(() => {
    if (!suivante) return;
    let vivant = true;
    chargerDictees(niveau).then(
      (liste) => {
        const d = liste.find((x) => x.n === suivante);
        if (vivant && d) setTitre({ cle: `${niveau}/${suivante}`, titre: d.titre });
      },
      () => undefined,
    );
    return () => {
      vivant = false;
    };
  }, [niveau, suivante]);
  const nom = titre?.cle === cle ? titre.titre : null;
  return (
    <button type="button" className="lg-progresser-carte" onClick={() => aller(suivante ? `ecouter/dictee/${niveau}/${suivante}` : `ecouter/dictee/${niveau}`)}>
      <Ear className="size-6 text-accent" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="lg-progresser-etiquette">La dictée</span>
        <span className="lg-element-titre">{suivante ? `Dictée n° ${suivante}${nom ? ` · ${nom}` : ""}` : `Dictée surprise, niveau ${niveau}`}</span>
        <span className="lg-element-infos">{suivante ? `Niveau ${niveau} · huit phrases, chaque mot corrigé, puis la traduction.` : `Les ${DICTEES_PAR_NIVEAU} dictées du niveau sont faites : en voici une au hasard.`}</span>
      </span>
      <ArrowRight className="size-4" aria-hidden="true" />
    </button>
  );
}
