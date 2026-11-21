"use client";

import { BookOpen, Check, Clock3, Play, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { HISTOIRES, type FicheHistoire } from "@/lib/langues/histoires/catalogue";
import { type Lecture, useLectures } from "@/lib/langues/histoires/progression";
import { NIVEAUX, type Niveau } from "@/lib/langues/types";
import { useTextes } from "@/lib/modules/textes-client";
import "./histoires.css";

/*
 * La bibliothèque : les histoires en anglais, du niveau A1 au C2, à lire avec la traduction de chaque mot.
 * On filtre par niveau ; une histoire commencée se reprend là où on l'a laissée.
 */

export const NOMS_NIVEAUX_LECTURE: Record<Niveau, string> = {
  A1: "Premiers pas",
  A2: "Les bases",
  B1: "En autonomie",
  B2: "Avec aisance",
  C1: "La maîtrise",
  C2: "La littérature",
};

/** La couverture : le titre anglais composé comme un livre, aux couleurs du niveau. */
export function Couverture({ h, petite }: { h: FicheHistoire; petite?: boolean }) {
  return (
    <span className="hs-couverture" data-niveau={h.niveau} data-petite={petite || undefined} data-long={h.titre.length > 22 || undefined} aria-hidden="true">
      <span className="hs-couverture-niveau">{h.niveau}</span>
      <span className="hs-couverture-titre" lang="en">
        {h.titre}
      </span>
      <span className="hs-couverture-auteur">{h.auteur === "HaqqReason" ? "Le Truchement" : h.auteur}</span>
    </span>
  );
}

function etat(l: Lecture | undefined, h: FicheHistoire) {
  if (!l) return null;
  if (l.fini) return { fini: true, texte: l.quiz ? `Lue · questions ${l.quiz.juste}/${l.quiz.total}` : "Lue" };
  return { fini: false, texte: `Page ${Math.min(l.page, h.pages)} sur ${h.pages}` };
}

export function Bibliotheque({ onOuvrir }: { onOuvrir: (id: string) => void }) {
  const lectures = useLectures();
  const t = useTextes("langues");
  const [filtre, setFiltre] = useState<Niveau | "tous">("tous");
  const enCours = useMemo(
    () =>
      HISTOIRES.filter((h) => lectures[h.id] && !lectures[h.id].fini)
        .sort((a, b) => lectures[b.id].vu - lectures[a.id].vu)
        .slice(0, 1)[0],
    [lectures],
  );
  const montrees = filtre === "tous" ? HISTOIRES : HISTOIRES.filter((h) => h.niveau === filtre);
  const lues = HISTOIRES.filter((h) => lectures[h.id]?.fini).length;
  const pages = HISTOIRES.reduce((s, h) => s + h.pages, 0);

  return (
    <section className="hs-bibliotheque" aria-labelledby="titre-histoires">
      <div className="hs-tete">
        <div>
          <h3 id="titre-histoires" className="hs-titre">
            <BookOpen className="size-5" aria-hidden="true" />
            {t("histoires.titre")}
          </h3>
          <p className="hs-chapo">
            {t("histoires.chapo", { histoires: HISTOIRES.length, pages })}
          </p>
        </div>
        {lues > 0 && (
          <p className="hs-compteur">
            <Sparkles className="size-4" aria-hidden="true" />
            {lues} histoire{lues > 1 ? "s" : ""} lue{lues > 1 ? "s" : ""}
          </p>
        )}
      </div>

      {enCours && (
        <button type="button" className="hs-reprendre" onClick={() => onOuvrir(enCours.id)}>
          <Couverture h={enCours} petite />
          <span className="hs-reprendre-texte">
            <span className="hs-reprendre-etiquette">Reprendre ta lecture</span>
            <span className="hs-reprendre-titre" lang="en">
              {enCours.titre}
            </span>
            <span className="hs-reprendre-infos">
              Page {Math.min(lectures[enCours.id].page, enCours.pages)} sur {enCours.pages}
            </span>
            <span className="hs-barre" style={{ "--p": `${(Math.min(lectures[enCours.id].page, enCours.pages) / enCours.pages) * 100}%` } as React.CSSProperties} />
          </span>
          <Play className="size-6 shrink-0" fill="currentColor" aria-hidden="true" />
        </button>
      )}

      <div className="hs-niveaux" role="group" aria-label="Choisis ton niveau">
        <button type="button" aria-pressed={filtre === "tous"} onClick={() => setFiltre("tous")}>
          Tous les niveaux
        </button>
        {NIVEAUX.map((n) => {
          const nombre = HISTOIRES.filter((h) => h.niveau === n).length;
          return (
            <button key={n} type="button" aria-pressed={filtre === n} data-niveau={n} disabled={!nombre} onClick={() => setFiltre(n)}>
              <strong>{n}</strong>
              <span>{NOMS_NIVEAUX_LECTURE[n]}</span>
            </button>
          );
        })}
      </div>

      <ul className="hs-grille">
        {montrees.map((h) => {
          const e = etat(lectures[h.id], h);
          return (
            <li key={h.id}>
              <button type="button" className="hs-carte" onClick={() => onOuvrir(h.id)}>
                <Couverture h={h} />
                <span className="hs-carte-corps">
                  <span className="hs-carte-titre">{h.titreFr}</span>
                  <span className="hs-carte-auteur">
                    {h.auteur === "HaqqReason" ? "Histoire originale" : h.auteur}
                    {h.annee ? `, ${h.annee}` : ""} · {h.genre}
                  </span>
                  <span className="hs-carte-resume">{h.resume}</span>
                  <span className="hs-carte-pied">
                    <span>
                      <BookOpen className="size-3.5" aria-hidden="true" />
                      {h.pages} pages
                    </span>
                    <span>
                      <Clock3 className="size-3.5" aria-hidden="true" />
                      {h.minutes} min
                    </span>
                    {e ? (
                      <span className="hs-carte-etat" data-fini={e.fini || undefined}>
                        {e.fini && <Check className="size-3.5" aria-hidden="true" />}
                        {e.texte}
                      </span>
                    ) : (
                      <span className="hs-carte-etat" data-nouvelle>
                        À découvrir
                      </span>
                    )}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
