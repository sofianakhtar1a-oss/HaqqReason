"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Compass, Sparkles } from "lucide-react";

type Resultat = { id: string; titre: string; resume: string; score: number; extrait: string };

/**
 * Articles proches par le sens, proposés quand la recherche par mots ne suffit pas.
 * Appelé seulement dans ce cas : chaque demande coûte une requête au service d'IA.
 */
export function ParLeSens({ question, actif }: { question: string; actif: boolean }) {
  const [resultats, setResultats] = useState<Resultat[]>([]);
  const [etat, setEtat] = useState<"attente" | "chargement" | "fini" | "indisponible">("attente");
  const propre = question.trim();
  const inutile = !actif || propre.length < 3;

  useEffect(() => {
    if (inutile) return;
    const controleur = new AbortController();
    const minuteur = setTimeout(async () => {
      setEtat("chargement");
      try {
        const reponse = await fetch(`/api/sens?q=${encodeURIComponent(propre)}`, { signal: controleur.signal });
        const donnees = (await reponse.json()) as { resultats?: Resultat[]; inactif?: boolean; limite?: boolean };
        setResultats(donnees.resultats ?? []);
        setEtat(donnees.inactif || donnees.limite ? "indisponible" : "fini");
      } catch {
        if (!controleur.signal.aborted) setEtat("indisponible");
      }
    }, 600);
    return () => {
      controleur.abort();
      clearTimeout(minuteur);
    };
  }, [propre, inutile]);

  if (inutile || etat === "attente" || etat === "indisponible") return null;

  return (
    <section className="par-le-sens" aria-labelledby="titre-par-le-sens">
      <p id="titre-par-le-sens" className="par-le-sens-titre">
        <Compass className="size-5 text-accent" aria-hidden="true" />
        Articles proches par le sens
      </p>
      {etat === "chargement" ? (
        <p className="text-encre-douce">Recherche en cours…</p>
      ) : resultats.length === 0 ? (
        <p className="text-encre-douce">Aucun article ne traite de ce sujet pour l&apos;instant.</p>
      ) : (
        <>
          <p className="par-le-sens-aide">
            Ces articles ne contiennent pas forcément tes mots, mais parlent du même sujet.
          </p>
          <ul className="par-le-sens-liste">
            {resultats.map((r) => (
              <li key={r.id}>
                <Link href={`/explorer/article/${r.id}`}>
                  <span className="par-le-sens-article">{r.titre}</span>
                  {r.resume && <span className="par-le-sens-resume">{r.resume}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

/** Signale au créateur un sujet qu'un lecteur n'a pas trouvé. */
export function PasTrouve({ question, onEnvoye }: { question: string; onEnvoye?: () => void }) {
  const [envoye, setEnvoye] = useState(false);

  if (question.trim().length < 3) return null;
  if (envoye) {
    return (
      <p role="status" className="message message-succes mt-4">
        Merci. Ta question a été transmise : elle pourra donner naissance à un article.
      </p>
    );
  }
  return (
    <button
      type="button"
      className="bouton bouton-discret mt-4"
      onClick={async () => {
        setEnvoye(true);
        onEnvoye?.();
        try {
          await fetch("/api/recherche/signaler", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ question: question.trim().slice(0, 300) }),
          });
        } catch {
          // Sans importance pour le lecteur : le remerciement reste affiché.
        }
      }}
    >
      <Sparkles className="size-4" aria-hidden="true" />
      Je n&apos;ai pas trouvé ma réponse
    </button>
  );
}
