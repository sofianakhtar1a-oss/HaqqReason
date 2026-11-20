"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Eye, EyeOff, Flag, Mail, MailOpen, Send, Trash2, X } from "lucide-react";
import { MessageFormulaire } from "@/components/MessageFormulaire";
import {
  LIBELLE_STATUT,
  LIMITES_MESSAGE,
  NOM_NATURE,
  NOM_TYPE,
  type ContributionCreateur,
  type MessageContribution,
  type StatutContribution,
  type TypeContribution,
} from "@/lib/contributions/modele";
import { ETAT_INITIAL } from "@/lib/form-state";
import { MARQUE_CALAME } from "@/lib/atelier/propositions";
import { basculerLue, effacer, effacerReponse, marquer, repondreA, viderLesRefusees } from "./actions";

type Filtre = StatutContribution | "tout" | "non_lues";

const FILTRES: { cle: Filtre; libelle: string }[] = [
  { cle: "non_lues", libelle: "Non lues" },
  { cle: "en_attente", libelle: "En attente" },
  { cle: "publiee", libelle: "Publiées" },
  { cle: "masquee", libelle: "Masquées" },
  { cle: "refusee", libelle: "Refusées par le filtre" },
  { cle: "tout", libelle: "Tout" },
];

const TYPES: { cle: TypeContribution | "tous"; libelle: string }[] = [
  { cle: "tous", libelle: "Tous les types" },
  { cle: "idee", libelle: "Idées de sujet" },
  { cle: "argument", libelle: "Arguments" },
  { cle: "site", libelle: "Amélioration du site" },
];

function quand(iso: string): string {
  try {
    return new Date(iso).toLocaleString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function Message({ m }: { m: MessageContribution }) {
  const [etat, action] = useActionState(effacerReponse, ETAT_INITIAL);
  return (
    <div className={`messagerie-bulle messagerie-bulle-${m.auteur}`}>
      <p className="messagerie-qui">
        {m.auteur === "createur" ? "Toi" : "L'auteur"} · {quand(m.created_at)}
        {m.auteur === "createur" && (m.lu ? " · lu" : " · pas encore lu")}
      </p>
      <p className="whitespace-pre-wrap">{m.texte}</p>
      {m.auteur === "createur" && etat.statut !== "succes" && (
        <form action={action}>
          <input type="hidden" name="id" value={m.id} />
          <button type="submit" className="messagerie-effacer" title="Effacer cette réponse">
            <X className="size-3.5" aria-hidden="true" />
            Effacer
          </button>
        </form>
      )}
    </div>
  );
}

function Carte({ c }: { c: ContributionCreateur }) {
  const [etatMarquer, actionMarquer] = useActionState(marquer, ETAT_INITIAL);
  const [etatEffacer, actionEffacer] = useActionState(effacer, ETAT_INITIAL);
  const [etatRepondre, actionRepondre] = useActionState(repondreA, ETAT_INITIAL);
  const [etatLue, actionLue] = useActionState(basculerLue, ETAT_INITIAL);
  const [confirme, setConfirme] = useState(false);
  const [texte, setTexte] = useState("");
  const [vu, setVu] = useState(etatRepondre);
  if (vu !== etatRepondre) {
    setVu(etatRepondre);
    if (etatRepondre.statut === "succes") setTexte("");
  }

  return (
    <article className="contrib-gestion" data-statut={c.statut} data-non-lue={!c.lue || undefined}>
      <header className="flex flex-wrap items-center gap-2">
        {!c.lue && <span className="messagerie-pastille">Nouveau</span>}
        <span className="contrib-badge" data-statut={c.statut}>
          {LIBELLE_STATUT[c.statut]}
        </span>
        <span className="text-sm font-semibold">{c.type === "site" && c.nature ? `${NOM_TYPE.site} · ${NOM_NATURE[c.nature]}` : NOM_TYPE[c.type]}</span>
        <span className="text-sm text-encre-douce">
          {c.pseudo || "Anonyme"} · {quand(c.created_at)}
        </span>
        {c.signalements > 0 && (
          <span className="contrib-badge contrib-badge-alerte">
            <Flag className="size-3.5" aria-hidden="true" />
            {c.signalements} signalement{c.signalements > 1 ? "s" : ""}
          </span>
        )}
        <form action={actionLue} className="ml-auto">
          <input type="hidden" name="id" value={c.id} />
          <input type="hidden" name="lue" value={c.lue ? "non" : "oui"} />
          <button type="submit" className="bouton bouton-discret bouton-petit" title={c.lue ? "Marquer comme non lue" : "Marquer comme lue"}>
            {c.lue ? <Mail className="size-4" aria-hidden="true" /> : <MailOpen className="size-4" aria-hidden="true" />}
            {c.lue ? "Non lue" : "Lue"}
          </button>
        </form>
      </header>

      {c.motif && <p className="contrib-motif">Relevé par le filtre : {c.motif}.</p>}

      <h3 className="mt-2 font-display text-lg font-bold">{c.titre}</h3>
      <p className="mt-1 whitespace-pre-wrap text-encre-douce">{c.texte}</p>
      {c.texte.includes(MARQUE_CALAME) && (
        <Link href={`/createur/contributions/calame/${c.id}`} className="contrib-renvoi mt-3">
          <span className="contrib-renvoi-intro">Texte complet</span>
          <span className="contrib-renvoi-titre">Lire le document envoyé depuis le Calame</span>
          <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
        </Link>
      )}

      {c.article ? (
        <Link href={`/explorer/article/${c.article.id}`} className="contrib-renvoi mt-3">
          <span className="contrib-renvoi-intro">Article visé</span>
          <span className="contrib-renvoi-titre">{c.article.titre}</span>
          <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
        </Link>
      ) : (
        c.bloc && <p className="mt-3 text-sm text-encre-douce">Module : {c.bloc.titre}</p>
      )}

      {c.messages.length > 0 && (
        <div className="messagerie-corps mt-4">
          {c.messages.map((m) => (
            <Message key={m.id} m={m} />
          ))}
        </div>
      )}

      {c.statut !== "refusee" && (
        <form action={actionRepondre} className="messagerie-reponse mt-4">
          <input type="hidden" name="id" value={c.id} />
          <label htmlFor={`rep-${c.id}`} className="etiquette">
            Ta réponse
          </label>
          <textarea
            id={`rep-${c.id}`}
            name="texte"
            rows={3}
            maxLength={LIMITES_MESSAGE.texte}
            className="champ"
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            placeholder={c.suivie ? "L'auteur la verra dans « Mes messages »." : "L'auteur a envoyé sa proposition avant la messagerie : ta réponse ne sera visible que sous la carte publiée."}
          />
          <div className="flex flex-wrap gap-2">
            <button type="submit" name="publier" value="non" className="bouton bouton-secondaire bouton-petit" disabled={!texte.trim()}>
              <Send className="size-4" aria-hidden="true" />
              Répondre
            </button>
            {c.statut !== "publiee" && (
              <button type="submit" name="publier" value="oui" className="bouton bouton-principal bouton-petit" disabled={!texte.trim()}>
                <Check className="size-4" aria-hidden="true" />
                Répondre et publier
              </button>
            )}
          </div>
          <MessageFormulaire etat={etatRepondre} />
        </form>
      )}

      <footer className="mt-4 flex flex-wrap items-center gap-2">
        {c.statut !== "publiee" && (
          <form action={actionMarquer}>
            <input type="hidden" name="id" value={c.id} />
            <input type="hidden" name="statut" value="publiee" />
            <button type="submit" className="bouton bouton-discret bouton-petit">
              <Check className="size-4" aria-hidden="true" />
              Publier sans répondre
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
            <span className="text-sm text-encre-douce">Effacer définitivement, avec la conversation ?</span>
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
      <MessageFormulaire etat={etatMarquer.statut !== "initial" ? etatMarquer : etatLue.statut === "erreur" ? etatLue : etatEffacer} />
    </article>
  );
}

export function Gestion({ contributions }: { contributions: ContributionCreateur[] }) {
  const nonLues = contributions.filter((c) => !c.lue && c.statut !== "refusee").length;
  const [filtre, setFiltre] = useState<Filtre>(nonLues > 0 ? "non_lues" : "en_attente");
  const [type, setType] = useState<TypeContribution | "tous">("tous");
  const [etatVider, actionVider] = useActionState(viderLesRefusees, ETAT_INITIAL);

  const garde = (c: ContributionCreateur, f: Filtre) =>
    f === "tout" ? true : f === "non_lues" ? !c.lue && c.statut !== "refusee" : c.statut === f;
  const parType = type === "tous" ? contributions : contributions.filter((c) => c.type === type);
  const liste = parType.filter((c) => garde(c, filtre));
  const combien = (f: Filtre) => parType.filter((c) => garde(c, f)).length;

  return (
    <>
      <div className="contrib-onglets" role="group" aria-label="Filtrer par état">
        {FILTRES.map((f) => (
          <button key={f.cle} type="button" className="contrib-onglet" aria-pressed={filtre === f.cle} onClick={() => setFiltre(f.cle)}>
            {f.libelle}
            <span className="text-sm font-normal text-encre-douce">{combien(f.cle)}</span>
          </button>
        ))}
      </div>
      <div className="messagerie-types" role="group" aria-label="Filtrer par type">
        {TYPES.map((t) => (
          <button key={t.cle} type="button" className="messagerie-type" aria-pressed={type === t.cle} onClick={() => setType(t.cle)}>
            {t.libelle}
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
