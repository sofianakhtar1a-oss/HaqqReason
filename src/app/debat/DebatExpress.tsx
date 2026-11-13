"use client";

import Link from "next/link";
import { ArrowRight, Search, Shuffle } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { normaliser } from "@/lib/recherche-texte";

type Fiche = { cle: string; articleId: string; articleTitre: string; blocId: string; objection: string; recherche: string; reponse: ReactNode };
type Props = { fiches: Fiche[]; blocs: { id: string; titre: string; accent: string }[] };

export function DebatExpress({ fiches, blocs }: Props) {
  const [q, setQ] = useState("");
  const [bloc, setBloc] = useState<string | null>(null);
  const [ouvertes, setOuvertes] = useState<Set<string>>(new Set());
  const accents = useMemo(() => new Map(blocs.map((b) => [b.id, b.accent])), [blocs]);

  const visibles = useMemo(() => {
    const mots = normaliser(q).split(/\s+/).filter((m) => m.length >= 2);
    return fiches.filter((f) => (!bloc || f.blocId === bloc) && mots.every((m) => f.recherche.includes(m)));
  }, [fiches, q, bloc]);

  const basculer = (cle: string) =>
    setOuvertes((s) => {
      const n = new Set(s);
      if (n.has(cle)) n.delete(cle);
      else n.add(cle);
      return n;
    });

  function auHasard() {
    if (visibles.length === 0) return;
    const f = visibles[Math.floor(Math.random() * visibles.length)];
    setOuvertes(new Set([f.cle]));
    requestAnimationFrame(() => document.getElementById(`fiche-${f.cle}`)?.scrollIntoView({ behavior: "smooth", block: "center" }));
  }

  if (fiches.length === 0) {
    return (
      <p className="verre mt-10 rounded-3xl p-6 text-encre-douce">
        Aucune fiche pour l&apos;instant. Elles apparaissent dès qu&apos;un article publié contient un bloc « Objection → Réponse ».
      </p>
    );
  }

  return (
    <div className="mt-8">
      <div className="debat-recherche">
        <Search className="size-5 text-accent" aria-hidden="true" />
        <label htmlFor="debat-q" className="sr-only">
          Chercher une objection
        </label>
        <input id="debat-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Par exemple : abrogation, Jean 1:1, contradiction…" autoComplete="off" />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Filtrer par bloc">
        <button type="button" className="puce-filtre" aria-pressed={bloc === null} onClick={() => setBloc(null)}>
          Tous
        </button>
        {blocs.map((b) => (
          <button key={b.id} type="button" className="puce-filtre" data-accent={b.accent} aria-pressed={bloc === b.id} onClick={() => setBloc(bloc === b.id ? null : b.id)}>
            {b.titre}
          </button>
        ))}
        <button type="button" className="puce-filtre ml-auto" onClick={auHasard}>
          <Shuffle className="size-4" aria-hidden="true" />
          Au hasard
        </button>
      </div>
      <p className="mt-6 text-sm text-encre-douce" aria-live="polite">
        {visibles.length} fiche{visibles.length > 1 ? "s" : ""}
      </p>
      <ul className="mt-3 grid gap-4">
        {visibles.map((f) => {
          const ouverte = ouvertes.has(f.cle);
          return (
            <li key={f.cle} id={`fiche-${f.cle}`} className="fiche-debat" data-accent={accents.get(f.blocId) ?? "or"} data-ouverte={ouverte}>
              <button type="button" className="fiche-objection" aria-expanded={ouverte} aria-controls={`reponse-${f.cle}`} onClick={() => basculer(f.cle)}>
                <span className="fiche-libelle">Objection</span>
                <span className="fiche-texte">{f.objection}</span>
                <span className="fiche-action">{ouverte ? "Masquer la réponse" : "Voir la réponse"}</span>
              </button>
              <div id={`reponse-${f.cle}`} className="fiche-reponse" hidden={!ouverte}>
                <span className="fiche-libelle">Réponse</span>
                <div className="lecture-corps">{f.reponse}</div>
                <Link href={`/explorer/article/${f.articleId}`} className="mt-4 inline-flex items-center gap-2 font-semibold text-accent hover:underline hover:underline-offset-4">
                  Lire l&apos;article complet : {f.articleTitre}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
