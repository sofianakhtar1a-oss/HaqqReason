"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, Lightbulb, Lock, ShieldCheck, Sparkles } from "lucide-react";
import { BoutonEnvoi } from "@/components/BoutonEnvoi";
import { MessageFormulaire } from "@/components/MessageFormulaire";
import { LIMITES_CONTRIBUTION, type ContributionPublique, type TypeContribution } from "@/lib/contributions/modele";
import { ETAT_INITIAL } from "@/lib/form-state";
import { envoyerContribution } from "./actions";
import { CarteContribution } from "./CarteContribution";
import { ChoixArticle, type BlocSimple } from "./ChoixArticle";

const SECTIONS: { type: TypeContribution; onglet: string; titre: string }[] = [
  { type: "idee", onglet: "Idées de sujet", titre: "Proposer un sujet à traiter" },
  { type: "argument", onglet: "Renforcer un article", titre: "Apporter un argument de plus" },
];

function Formulaire({ type, blocs, ouvertes, onFini }: { type: TypeContribution; blocs: BlocSimple[]; ouvertes: boolean; onFini: () => void }) {
  const [etat, action] = useActionState(envoyerContribution, ETAT_INITIAL);
  // Pour une idée, le rattachement à un article est facultatif ; pour un argument, c'est la première question.
  const [lie, setLie] = useState<"" | "oui" | "non">(type === "idee" ? "non" : "");
  const [texte, setTexte] = useState("");

  if (!ouvertes) {
    return (
      <p className="contrib-ferme">
        <Lock className="size-5 shrink-0" aria-hidden="true" />
        Les envois sont fermés pour le moment. Les propositions déjà publiées restent lisibles ci-dessous.
      </p>
    );
  }

  if (etat.statut === "succes") {
    return (
      <div className="contrib-merci" role="status">
        <CheckCircle2 className="size-8 text-accent" aria-hidden="true" />
        <p className="text-lg font-semibold">{etat.message}</p>
        <button type="button" className="bouton bouton-secondaire" onClick={onFini}>
          Envoyer une autre proposition
        </button>
      </div>
    );
  }

  const quArticle = type === "idee" ? "Ton idée part-elle d'un article déjà publié ?" : "Ton argument se rattache-t-il à l'un des articles publiés ?";

  return (
    <form action={action} className="contrib-formulaire">
      <input type="hidden" name="type" value={type} />
      {/* Champ-piège : une personne ne le voit pas, un robot le remplit. */}
      <input type="text" name="site" tabIndex={-1} autoComplete="off" aria-hidden="true" className="champ-piege" />

      <fieldset className="contrib-bloc-champ">
        <legend className="etiquette">{quArticle}</legend>
        <div className="contrib-oui-non">
          {(["oui", "non"] as const).map((valeur) => (
            <label key={valeur} className="contrib-radio">
              <input type="radio" name="lie" value={valeur} checked={lie === valeur} onChange={() => setLie(valeur)} />
              <span>{valeur === "oui" ? "Oui, un article précis" : type === "idee" ? "Non, c'est un sujet nouveau" : "Non, c'est un apport général"}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {lie === "oui" && (
        <div className="contrib-bloc-champ">
          <p className="etiquette">Lequel ?</p>
          <p className="contrib-aide">Choisis-le dans la liste : ta proposition s&apos;affichera avec un encadré qui renvoie directement à cet article.</p>
          <ChoixArticle blocs={blocs} />
        </div>
      )}

      {lie === "non" && (
        <fieldset className="contrib-bloc-champ">
          <legend className="etiquette">À quel module cela se rattache-t-il ?</legend>
          <div className="contrib-modules">
            {blocs.map((b) => (
              <label key={b.id} className="contrib-module" data-accent={b.accent}>
                <input type="radio" name="bloc" value={b.id} required />
                <span className="contrib-module-titre">{b.titre}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {lie !== "" && (
        <>
          <div className="contrib-bloc-champ">
            <label htmlFor={`titre-${type}`} className="etiquette">
              {type === "idee" ? "Ton idée en une phrase" : "Ton apport en une phrase"}
            </label>
            <input
              id={`titre-${type}`}
              name="titre"
              required
              minLength={LIMITES_CONTRIBUTION.titreMin}
              maxLength={LIMITES_CONTRIBUTION.titre}
              className="champ"
              placeholder={type === "idee" ? "Par exemple : la transmission du Coran par les manuscrits" : "Par exemple : le témoignage des manuscrits anciens"}
            />
          </div>

          <div className="contrib-bloc-champ">
            <label htmlFor={`texte-${type}`} className="etiquette">
              {type === "idee" ? "Explique en quelques lignes" : "Développe ton argument"}
            </label>
            <textarea
              id={`texte-${type}`}
              name="texte"
              required
              rows={7}
              minLength={LIMITES_CONTRIBUTION.texteMin}
              maxLength={LIMITES_CONTRIBUTION.texte}
              className="champ"
              value={texte}
              onChange={(e) => setTexte(e.target.value)}
              placeholder={
                type === "idee"
                  ? "Ce qui manque, la question qu'on t'a posée, pourquoi le sujet serait utile…"
                  : "L'argument, la référence, le fait historique — et en quoi il renforce la thèse de l'article."
              }
            />
            <p className="contrib-compteur">
              {texte.length} / {LIMITES_CONTRIBUTION.texte} caractères
            </p>
          </div>

          <div className="contrib-bloc-champ">
            <label htmlFor={`pseudo-${type}`} className="etiquette">
              Ton prénom ou ton pseudo <span className="font-normal text-encre-douce">— facultatif</span>
            </label>
            <input
              id={`pseudo-${type}`}
              name="pseudo"
              maxLength={LIMITES_CONTRIBUTION.pseudo}
              className="champ"
              placeholder="Laisse vide pour rester anonyme"
              autoComplete="off"
            />
          </div>

          <MessageFormulaire etat={etat} />
          <BoutonEnvoi enCours="Envoi…" className="bouton bouton-principal w-full sm:w-auto">
            Envoyer ma proposition
          </BoutonEnvoi>
          <p className="contrib-note">
            <ShieldCheck className="size-4 shrink-0 text-accent" aria-hidden="true" />
            Les propositions sont filtrées automatiquement : une insulte ou une grossièreté n&apos;est jamais publiée. Aucun compte n&apos;est demandé.
          </p>
        </>
      )}
    </form>
  );
}

export function Contribuer({
  blocs,
  idees,
  propositions,
  ouvertes,
}: {
  blocs: BlocSimple[];
  idees: ContributionPublique[];
  propositions: ContributionPublique[];
  ouvertes: boolean;
}) {
  const [onglet, setOnglet] = useState<TypeContribution>("idee");
  const [cle, setCle] = useState(0);
  const liste = onglet === "idee" ? idees : propositions;

  return (
    <>
      <div className="contrib-onglets" role="tablist" aria-label="Deux manières de contribuer">
        {SECTIONS.map((s) => (
          <button
            key={s.type}
            role="tab"
            type="button"
            id={`onglet-${s.type}`}
            aria-selected={onglet === s.type}
            aria-controls={`section-${s.type}`}
            className="contrib-onglet"
            onClick={() => setOnglet(s.type)}
          >
            {s.type === "idee" ? <Lightbulb className="size-5" aria-hidden="true" /> : <Sparkles className="size-5" aria-hidden="true" />}
            {s.onglet}
          </button>
        ))}
      </div>

      <section id={`section-${onglet}`} role="tabpanel" aria-labelledby={`onglet-${onglet}`} className="mt-8">
        <div className="contrib-explication">
          <h2 className="contrib-explication-titre">{onglet === "idee" ? "À quoi sert cette section ?" : "À quoi sert cette section ?"}</h2>
          {onglet === "idee" ? (
            <>
              <p>
                Une question est restée sans réponse, un doute revient souvent autour de toi, une objection n&apos;est traitée nulle part sur le site ?
                Propose-la ici. Indique le module auquel elle se rattache, puis explique en quelques lignes ce qui manque et pourquoi ce sujet serait
                utile.
              </p>
              <p>
                Les idées envoyées sont visibles de tous : si la tienne est déjà là, tu le verras tout de suite, et tu sauras sur quoi les autres
                lecteurs butent. Les sujets retenus deviennent de vrais articles de la bibliothèque.
              </p>
            </>
          ) : (
            <>
              <p>
                Un article existe déjà, mais tu connais un argument, un verset, un hadith, une référence ou un fait historique qui le rendrait plus
                solide ? C&apos;est ici. Commence par dire si ta proposition se rattache à l&apos;un des articles publiés : si oui, choisis-le, et ta
                proposition paraîtra avec un encadré qui y renvoie directement.
              </p>
              <p>
                Ce n&apos;est pas un espace de débat : on y apporte des éléments qui appuient la thèse déjà défendue. Pour discuter une objection,
                passe plutôt par les idées de sujet.
              </p>
            </>
          )}
        </div>

        <div className="contrib-colonnes">
          <div className="contrib-colonne-formulaire">
            <h2 className="text-xl font-bold">{SECTIONS.find((s) => s.type === onglet)?.titre}</h2>
            <Formulaire key={`${onglet}-${cle}`} type={onglet} blocs={blocs} ouvertes={ouvertes} onFini={() => setCle((c) => c + 1)} />
          </div>

          <div className="contrib-colonne-liste">
            <h2 className="text-xl font-bold">
              {onglet === "idee" ? "Les idées déjà proposées" : "Les apports déjà proposés"}
              <span className="ml-2 text-base font-normal text-encre-douce">{liste.length}</span>
            </h2>
            {liste.length === 0 ? (
              <p className="contrib-vide">Rien pour l&apos;instant. La première proposition pourrait être la tienne.</p>
            ) : (
              <div className="contrib-cartes">
                {liste.map((c) => (
                  <CarteContribution key={c.id} contribution={c} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
