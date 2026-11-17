"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowRight, Flag, MessageCircleReply, Quote } from "lucide-react";
import { NOM_NATURE, type ContributionPublique } from "@/lib/contributions/modele";
import { ETAT_INITIAL } from "@/lib/form-state";
import { signaler } from "./actions";

function quand(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return "";
  }
}

export function CarteContribution({ contribution }: { contribution: ContributionPublique }) {
  const [etat, action] = useActionState(signaler, ETAT_INITIAL);
  const { article, bloc } = contribution;

  return (
    <article className="contrib-carte" data-accent={bloc?.accent}>
      <header className="contrib-carte-tete">
        <Quote className="size-4 shrink-0 text-accent" aria-hidden="true" />
        <span className="font-semibold">{contribution.pseudo || "Un lecteur"}</span>
        <time dateTime={contribution.created_at} className="text-sm text-encre-douce">
          {quand(contribution.created_at)}
        </time>
      </header>

      {contribution.type === "site" && contribution.nature && <p className="contrib-nature">{NOM_NATURE[contribution.nature]}</p>}
      <h3 className="contrib-carte-titre">{contribution.titre}</h3>
      <p className="contrib-carte-texte">{contribution.texte}</p>

      {contribution.reponses.map((r) => (
        <div key={r.id} className="contrib-reponse">
          <p className="contrib-reponse-qui">
            <MessageCircleReply className="size-4 shrink-0" aria-hidden="true" />
            Réponse de HaqqReason
          </p>
          <p className="whitespace-pre-wrap">{r.texte}</p>
        </div>
      ))}

      {article ? (
        <Link href={`/explorer/article/${article.id}`} className="contrib-renvoi">
          <span className="contrib-renvoi-intro">En lien avec l&apos;article</span>
          <span className="contrib-renvoi-titre">{article.titre}</span>
          <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
        </Link>
      ) : (
        bloc && (
          <p className="contrib-renvoi contrib-renvoi-module">
            <span className="contrib-renvoi-intro">Module</span>
            <span className="contrib-renvoi-titre">{bloc.titre}</span>
          </p>
        )
      )}

      <footer className="contrib-carte-pied">
        {etat.statut === "succes" ? (
          <span role="status" className="text-sm text-encre-douce">
            {etat.message}
          </span>
        ) : (
          <form action={action}>
            <input type="hidden" name="id" value={contribution.id} />
            <button type="submit" className="contrib-signaler" title="Signaler cette proposition">
              <Flag className="size-3.5" aria-hidden="true" />
              Signaler
            </button>
          </form>
        )}
      </footer>
    </article>
  );
}
