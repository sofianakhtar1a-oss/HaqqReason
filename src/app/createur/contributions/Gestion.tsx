"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Eye, EyeOff, Flag, Trash2 } from "lucide-react";
import { MessageFormulaire } from "@/components/MessageFormulaire";
import { LIBELLE_STATUT, type ContributionCreateur, type StatutContribution, type TypeContribution } from "@/lib/contributions/modele";
import { ETAT_INITIAL } from "@/lib/form-state";
import { effacer, marquer, viderLesRefusees } from "./actions";

const FILTRES: { cle: StatutContribution | "tout"; libelle: string }[] = [
  { cle: "en_attente", libelle: "En attente" },
  { cle: "publiee", libelle: "Publiées" },
  { cle: "masquee", libelle: "Masquées" },
  { cle: "refusee", libelle: "Refusées par le filtre" },
  { cle: "tout", libelle: "Tout" },
];

const NOM_TYPE: Record<TypeContribution, string> = { idee: "Idée de sujet", argument: "Argument proposé" };

function quand(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return "";
  }
}

function Carte({ c }: { c: ContributionCreateur }) {
  const [etatMarquer, actionMarquer] = useActionState(marquer, ETAT_INITIAL);
  const [etatEffacer, actionEffacer] = useActionState(effacer, ETAT_INITIAL);
  const [confirme, setConfirme] = useState(false);

  return (
    <article className="contrib-gestion" data-statut={c.statut}>
      <header className="flex flex-wrap items-center gap-2">
        <span className="contrib-badge" data-statut={c.statut}>
          {LIBELLE_STATUT[c.statut]}
        </span>
        <span className="text-sm font-semibold">{NOM_TYPE[c.type]}</span>
        <span className="text-sm text-encre-douce">
          {c.pseudo || "Anonyme"} · {quand(c.created_at)}
        </span>
        {c.signalements > 0 && (
          <span className="contrib-badge contrib-badge-alerte">
            <Flag className="size-3.5" aria-hidden="true" />
            {c.signalements} signalement{c.signalements > 1 ? "s" : ""}
          </span>
        )}
      </header>

      {c.motif && <p className="contrib-motif">Relevé par le filtre : {c.motif}.</p>}

      <h3 className="mt-2 font-display text-lg font-bold">{c.titre}</h3>
      <p className="mt-1 whitespace-pre-wrap text-encre-douce">{c.texte}</p>

      {c.article ? (
        <Link href={`/explorer/article/${c.article.id}`} className="contrib-renvoi mt-3">
          <span className="contrib-renvoi-intro">Article visé</span>
          <span className="contrib-renvoi-titre">{c.article.titre}</span>
          <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
        </Link>
      ) : (
        c.bloc && <p className="mt-3 text-sm text-encre-douce">Module : {c.bloc.titre}</p>
      )}

      <footer className="mt-4 flex flex-wrap items-center gap-2">
        {c.statut !== "publiee" && (
          <form action={actionMarquer}>
            <input type="hidden" name="id" value={c.id} />
            <input type="hidden" name="statut" value="publiee" />
            <button type="submit" className="bouton bouton-principal bouton-petit">
              <Check className="size-4" aria-hidden="true" />
              Publier
            </button>
          </form>
        )}
        {c.statut === "publiee" && (
          <form action={actionMarquer}>
            <input type="hidden" name="id" value={c.id} />
            <input type="hidden" name="statut" value="masquee" />
            <button type="submit" className="bouton bouton-discret bouton-petit">
              <EyeOff className="size-4" aria-hidden="true" />
              Masquer
            </button>
          </form>
        )}
        {c.statut !== "en_attente" && (
          <form action={actionMarquer}>
            <input type="hidden" name="id" value={c.id} />
            <input type="hidden" name="statut" value="en_attente" />
            <button type="submit" className="bouton bouton-discret bouton-petit">
              <Eye className="size-4" aria-hidden="true" />
              Remettre en attente
            </button>
          </form>
        )}
        {confirme ? (
          <form action={actionEffacer} className="flex items-center gap-2">
            <input type="hidden" name="id" value={c.id} />
            <span className="text-sm text-encre-douce">Effacer définitivement ?</span>
            <button type="submit" className="bouton bouton-danger bouton-petit">
              Oui, effacer
            </button>
            <button type="button" className="bouton bouton-discret bouton-petit" onClick={() => setConfirme(false)}>
              Non
            </button>
          </form>
        ) : (
          <button type="button" className="bouton bouton-discret bouton-petit ml-auto" onClick={() => setConfirme(true)}>
            <Trash2 className="size-4" aria-hidden="true" />
            Effacer
          </button>
        )}
      </footer>
      <MessageFormulaire etat={etatMarquer.statut === "initial" ? etatEffacer : etatMarquer} />
    </article>
  );
}

export function Gestion({ contributions }: { contributions: ContributionCreateur[] }) {
  const [filtre, setFiltre] = useState<StatutContribution | "tout">("en_attente");
  const [etatVider, actionVider] = useActionState(viderLesRefusees, ETAT_INITIAL);
  const liste = filtre === "tout" ? contributions : contributions.filter((c) => c.statut === filtre);
  const combien = (cle: StatutContribution | "tout") => (cle === "tout" ? contributions.length : contributions.filter((c) => c.statut === cle).length);

  return (
    <>
      <div className="contrib-onglets" role="group" aria-label="Filtrer les contributions">
        {FILTRES.map((f) => (
          <button key={f.cle} type="button" className="contrib-onglet" aria-pressed={filtre === f.cle} onClick={() => setFiltre(f.cle)}>
            {f.libelle}
            <span className="text-sm font-normal text-encre-douce">{combien(f.cle)}</span>
          </button>
        ))}
      </div>

      {filtre === "refusee" && combien("refusee") > 0 && (
        <form action={actionVider} className="mt-4 flex flex-wrap items-center gap-3">
          <button type="submit" className="bouton bouton-discret bouton-petit">
            <Trash2 className="size-4" aria-hidden="true" />
            Vider les refusées
          </button>
          <span className="text-sm text-encre-douce">
            Elles ne sont visibles que d&apos;ici. Garde-les le temps de vérifier que le filtre n&apos;a pas été trop sévère.
          </span>
        </form>
      )}
      <MessageFormulaire etat={etatVider} />

      {liste.length === 0 ? (
        <p className="contrib-vide mt-6">Rien dans cette liste.</p>
      ) : (
        <div className="mt-6 grid gap-4">
          {liste.map((c) => (
            <Carte key={c.id} c={c} />
          ))}
        </div>
      )}
    </>
  );
}
