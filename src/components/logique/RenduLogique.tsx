import { CircleCheck, CircleX, ExternalLink, HelpCircle } from "lucide-react";
import { analyserLogique, GENRES_LOGIQUE, type DonneesLogique } from "@/lib/logique/bloc";
import type { Valuation } from "@/lib/logique/moteur";

/** Bloc « Atelier de logique » dans un article : formules, sens des propositions et résultats calculés. */

function V({ v }: { v: boolean }) {
  return <span className={v ? "logique-v" : "logique-f"}>{v ? "V" : "F"}</span>;
}

function Situation({ valuation, sens }: { valuation: Valuation; sens: Map<string, string> }) {
  return (
    <ul className="logique-situation">
      {Object.entries(valuation).map(([nom, v]) => (
        <li key={nom}>
          <strong>{nom}</strong> <V v={v} />
          {sens.get(nom) && <span className="text-encre-douce"> : {v ? sens.get(nom) : `il est faux que « ${sens.get(nom)} »`}</span>}
        </li>
      ))}
    </ul>
  );
}

function Verdict({ ok, titre, texte }: { ok: boolean | null; titre: string; texte?: string }) {
  const Icone = ok === null ? HelpCircle : ok ? CircleCheck : CircleX;
  return (
    <div className="logique-verdict" data-ok={ok === null ? "inconnu" : ok}>
      <Icone className="size-6 shrink-0" aria-hidden="true" />
      <div>
        <p className="font-display text-lg font-bold">{titre}</p>
        {texte && <p className="text-encre-douce">{texte}</p>}
      </div>
    </div>
  );
}

export function RenduLogique({ donnees: d }: { donnees: DonneesLogique }) {
  const r = analyserLogique(d);
  const sens = new Map(d.variables.filter((v) => v.sens).map((v) => [v.nom, v.sens]));
  const libelle = GENRES_LOGIQUE.find((g) => g.cle === d.genre)?.libelle;

  return (
    <section className="logique-bloc" aria-label={d.titre || libelle}>
      <p className="logique-surtitre">{libelle}</p>
      {d.titre && <p className="logique-titre">{d.titre}</p>}

      {r.genre !== "syllogisme" && sens.size > 0 && (
        <dl className="logique-legende">
          {[...sens].map(([nom, s]) => (
            <div key={nom}>
              <dt>{nom}</dt>
              <dd>{s}</dd>
            </div>
          ))}
        </dl>
      )}

      {r.genre === "syllogisme" ? (
        <>
          <ol className="logique-lignes">
            {r.phrases.map((ph, i) => (
              <li key={i} data-role={i === 2 ? "conclusion" : "premisse"}>
                <span className="logique-role">{i === 0 ? "Majeure" : i === 1 ? "Mineure" : "Donc"}</span>
                <span className="logique-texte">{ph}</span>
              </li>
            ))}
          </ol>
          <Verdict
            ok={r.erreur ? null : r.valide}
            titre={r.erreur ? "Syllogisme incomplet" : r.valide ? `Syllogisme valide${r.nom ? ` (${r.nom})` : ""}` : "Syllogisme invalide"}
            texte={
              r.erreur ||
              (r.valide
                ? `Mode ${r.mode}${r.figure ? `, ${r.figure}ᵉ figure` : ""}. Si les deux prémisses sont vraies, la conclusion l'est nécessairement.`
                : `Mode ${r.mode}${r.figure ? `, ${r.figure}ᵉ figure` : ""}. Les prémisses peuvent être vraies sans que la conclusion le soit.`)
            }
          />
        </>
      ) : (
        <ol className="logique-lignes">
          {d.lignes.map((l, i) => {
            const a = r.lignes[i];
            const verif = r.genre === "demonstration" ? r.verifications[i] : null;
            const enConflit = r.genre === "coherence" && r.conflits[0]?.includes(i);
            return (
              <li key={i} data-role={l.role} data-conflit={enConflit || undefined}>
                <span className="logique-role">
                  {r.genre === "demonstration" ? `${i + 1}.` : l.role === "conclusion" ? "Donc" : l.role === "premisse" ? `Prémisse ${i + 1}` : `${i + 1}.`}
                </span>
                <div className="min-w-0 flex-1">
                  {l.texte && <p className="logique-texte">{l.texte}</p>}
                  {a?.ecrite && <p className="logique-formule">{a.ecrite}</p>}
                  {a?.erreur && <p className="logique-erreur">{a.erreur}</p>}
                  {r.genre === "demonstration" && (
                    <p className="logique-justification">
                      {l.regle || (l.role === "premisse" ? "Prémisse" : "")}
                      {l.depuis.length > 0 && ` (de ${l.depuis.map((k) => k + 1).join(", ")})`}
                    </p>
                  )}
                  {(l.source || l.lien) && (
                    <p className="logique-source">
                      Source :{" "}
                      {l.lien ? (
                        <a href={l.lien} target="_blank" rel="noopener noreferrer">
                          {l.source || new URL(l.lien).hostname}
                          <ExternalLink className="ml-1 inline size-3.5" aria-hidden="true" />
                        </a>
                      ) : (
                        l.source
                      )}
                    </p>
                  )}
                  {l.article && (
                    <a className="logique-article" href={`/explorer/article/${l.article}`}>
                      Voir la démonstration complète
                    </a>
                  )}
                </div>
                {verif === "ok" && <CircleCheck className="logique-coche size-5" aria-label="Étape vérifiée" />}
                {verif === "faux" && <CircleX className="logique-croix size-5" aria-label="Cette étape ne découle pas des étapes citées" />}
                {r.genre === "verite" && r.statuts[i] && <span className="logique-statut">{{ tautologie: "Toujours vraie", contradiction: "Toujours fausse", contingente: "Dépend de la situation" }[r.statuts[i]!]}</span>}
              </li>
            );
          })}
        </ol>
      )}

      {r.genre === "validite" && (
        <>
          <Verdict
            ok={r.valide}
            titre={r.valide === null ? "Analyse en attente" : r.valide ? "Raisonnement valide" : "Raisonnement invalide"}
            texte={
              r.valide === null
                ? "Complète les formules pour lancer la vérification."
                : r.valide
                  ? r.incoherentes
                    ? "Attention : les prémisses se contredisent entre elles ; n'importe quelle conclusion en « découlerait »."
                    : "Dans toutes les situations où les prémisses sont vraies, la conclusion l'est aussi."
                  : "Il existe une situation où toutes les prémisses sont vraies et la conclusion fausse :"
            }
          />
          {r.contreExemple && <Situation valuation={r.contreExemple} sens={sens} />}
        </>
      )}
      {r.genre === "coherence" && (
        <>
          <Verdict
            ok={r.coherent}
            titre={r.coherent === null ? "Analyse en attente" : r.coherent ? "Affirmations compatibles" : "Affirmations incompatibles"}
            texte={r.coherent === null ? undefined : r.coherent ? "Elles peuvent être vraies ensemble, par exemple :" : `Aucune situation ne les rend toutes vraies. Groupe contradictoire : ${r.conflits.map((c) => c.map((k) => k + 1).join(", ")).join(" ; ")}.`}
          />
          {r.exemple && <Situation valuation={r.exemple} sens={sens} />}
        </>
      )}
      {r.genre === "demonstration" && (
        <Verdict
          ok={r.verifications.some((v) => v === "faux") ? false : r.conclusionEtablie ? true : null}
          titre={r.verifications.some((v) => v === "faux") ? "Une étape ne découle pas de ses appuis" : r.conclusionEtablie ? "Démonstration vérifiée" : "Démonstration à compléter"}
          texte={r.conclusionEtablie ? "Chaque étape découle logiquement des étapes qu'elle cite." : undefined}
        />
      )}
      {r.genre === "verite" &&
        (r.trop ? (
          <p className="text-encre-douce">Trop de propositions pour afficher la table (6 au plus).</p>
        ) : (
          r.table.length > 0 && (
            <div className="logique-table-defile">
              <table className="logique-table">
                <thead>
                  <tr>
                    {r.variables.map((v) => (
                      <th key={v} scope="col">
                        {v}
                      </th>
                    ))}
                    {r.lignes.map((l, i) => l.formule && <th key={`f${i}`} scope="col">{l.ecrite}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {r.table.map((ligne, k) => (
                    <tr key={k}>
                      {r.variables.map((v) => (
                        <td key={v}>
                          <V v={ligne.valuation[v]} />
                        </td>
                      ))}
                      {ligne.resultats.map((res, i) => (
                        <td key={`r${i}`} className="logique-resultat">
                          <V v={res} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ))}
    </section>
  );
}
