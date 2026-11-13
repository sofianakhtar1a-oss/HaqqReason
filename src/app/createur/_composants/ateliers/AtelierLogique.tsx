"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { RenduLogique } from "@/components/logique/RenduLogique";
import { analyserLogique, GENRES_LOGIQUE, ligneVide, logiqueParDefaut, nettoyerLogique, type DonneesLogique, type LigneLogique } from "@/lib/logique/bloc";
import { QUANTITES, REGLES, variablesDe, analyser } from "@/lib/logique/moteur";
import { ChoixArticle } from "./ChoixArticle";
import { Modale } from "./Modale";

const SYMBOLES = ["¬", "∧", "∨", "→", "↔", "⊕", "(", ")"];

/** Atelier de logique : formaliser un raisonnement, le vérifier, relier prémisses et sources. */
export function AtelierLogique({ initial, onValider, onFermer }: { initial: DonneesLogique | null; onValider: (d: DonneesLogique) => void; onFermer: () => void }) {
  const [d, setD] = useState<DonneesLogique>(() => nettoyerLogique(initial ?? logiqueParDefaut("validite")));
  const [champActif, setChampActif] = useState<HTMLInputElement | null>(null);
  const resultat = useMemo(() => analyserLogique(d), [d]);

  const maj = (changement: Partial<DonneesLogique>) => setD((x) => ({ ...x, ...changement }));
  const majLigne = (i: number, changement: Partial<LigneLogique>) => setD((x) => ({ ...x, lignes: x.lignes.map((l, k) => (k === i ? { ...l, ...changement } : l)) }));

  // Propositions utilisées dans les formules, pour en écrire le sens.
  const noms = useMemo(() => {
    const fs = d.lignes.flatMap((l) => {
      try {
        return l.formule.trim() ? [analyser(l.formule)] : [];
      } catch {
        return [];
      }
    });
    return variablesDe(fs);
  }, [d.lignes]);
  const sens = (nom: string) => d.variables.find((v) => v.nom === nom)?.sens ?? "";
  const majSens = (nom: string, valeur: string) =>
    setD((x) => ({ ...x, variables: [...x.variables.filter((v) => v.nom !== nom), { nom, sens: valeur }].sort((a, b) => a.nom.localeCompare(b.nom)) }));

  const insererSymbole = (s: string) => {
    if (!champActif) return;
    const i = Number(champActif.dataset.ligne);
    const debut = champActif.selectionStart ?? champActif.value.length;
    const fin = champActif.selectionEnd ?? debut;
    const valeur = `${champActif.value.slice(0, debut)}${s}${champActif.value.slice(fin)}`;
    majLigne(i, { formule: valeur });
    requestAnimationFrame(() => {
      champActif.focus();
      champActif.setSelectionRange(debut + s.length, debut + s.length);
    });
  };

  const changerGenre = (genre: DonneesLogique["genre"]) => {
    if (genre === d.genre) return;
    const neuf = logiqueParDefaut(genre);
    setD({ ...neuf, titre: d.titre, variables: d.variables });
  };

  const roleParDefaut: LigneLogique["role"] = d.genre === "coherence" ? "affirmation" : d.genre === "verite" ? "formule" : d.genre === "demonstration" ? "etape" : "premisse";

  return (
    <Modale
      titre="Atelier de logique"
      onFermer={onFermer}
      actions={
        <button type="button" className="bouton bouton-principal !min-h-10" onClick={() => onValider(nettoyerLogique(d))}>
          Insérer dans l&apos;article
        </button>
      }
    >
      <div className="atelier-grille">
        <div className="atelier-formulaire space-y-5">
          <fieldset>
            <legend className="etiquette">Type d&apos;analyse</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {GENRES_LOGIQUE.map((g) => (
                <label key={g.cle} className="choix-carte" data-choisi={d.genre === g.cle}>
                  <input type="radio" name="genre-logique" className="sr-only" checked={d.genre === g.cle} onChange={() => changerGenre(g.cle)} />
                  <span className="font-semibold">{g.libelle}</span>
                  <span className="text-sm text-encre-douce">{g.aide}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="logique-titre" className="etiquette">
              Titre (facultatif)
            </label>
            <input id="logique-titre" className="champ" value={d.titre} maxLength={200} onChange={(e) => maj({ titre: e.target.value })} placeholder="Par exemple : L'argument de la contingence" />
          </div>

          {d.genre === "syllogisme" ? (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                {(["S", "M", "P"] as const).map((t) => (
                  <div key={t}>
                    <label htmlFor={`terme-${t}`} className="etiquette text-sm">
                      {t === "S" ? "Petit terme (S)" : t === "M" ? "Moyen terme (M)" : "Grand terme (P)"}
                    </label>
                    <input id={`terme-${t}`} className="champ !min-h-10 !py-2" value={d.termes[t]} onChange={(e) => maj({ termes: { ...d.termes, [t]: e.target.value } })} placeholder={t === "S" ? "les prophètes" : t === "M" ? "les messagers" : "les humains"} />
                  </div>
                ))}
              </div>
              {d.lignes.slice(0, 3).map((l, i) => (
                <div key={i} className="ligne-logique">
                  <p className="font-semibold">{i === 0 ? "Majeure" : i === 1 ? "Mineure" : "Conclusion"}</p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <select className="champ !min-h-10 !py-2" aria-label="Quantité" value={l.quantite} onChange={(e) => majLigne(i, { quantite: e.target.value as LigneLogique["quantite"] })}>
                      {QUANTITES.map((q) => (
                        <option key={q.cle} value={q.cle}>
                          {q.cle} : {q.libelle}
                        </option>
                      ))}
                    </select>
                    <select className="champ !min-h-10 !py-2" aria-label="Sujet" value={l.sujet} onChange={(e) => majLigne(i, { sujet: e.target.value as "S" })}>
                      {(["S", "M", "P"] as const).map((t) => (
                        <option key={t} value={t}>
                          Sujet : {d.termes[t] || t}
                        </option>
                      ))}
                    </select>
                    <select className="champ !min-h-10 !py-2" aria-label="Prédicat" value={l.predicat} onChange={(e) => majLigne(i, { predicat: e.target.value as "S" })}>
                      {(["S", "M", "P"] as const).map((t) => (
                        <option key={t} value={t}>
                          Prédicat : {d.termes[t] || t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
              <label className="flex items-start gap-3">
                <input type="checkbox" className="mt-1 size-4" checked={d.existentielle} onChange={(e) => maj({ existentielle: e.target.checked })} />
                <span>
                  Les termes désignent des êtres qui existent
                  <span className="block text-sm text-encre-douce">Logique d&apos;Aristote. Décoche pour la lecture moderne, où « tout S est P » n&apos;affirme pas qu&apos;il existe des S.</span>
                </span>
              </label>
            </>
          ) : (
            <>
              <div className="rounded-2xl border border-trait p-4 text-sm text-encre-douce">
                Écris chaque proposition avec une lettre majuscule (P, Q, R…), et les liens logiques avec les symboles ou les mots : <strong>non</strong>, <strong>et</strong>, <strong>ou</strong>, <strong>implique</strong>, <strong>ssi</strong>. Exemple : <code>P implique Q</code>.
                <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Insérer un symbole">
                  {SYMBOLES.map((s) => (
                    <button key={s} type="button" className="symbole-logique" onMouseDown={(e) => e.preventDefault()} onClick={() => insererSymbole(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <ol className="space-y-3">
                {d.lignes.map((l, i) => {
                  const a = "lignes" in resultat ? resultat.lignes[i] : undefined;
                  return (
                    <li key={i} className="ligne-logique">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{d.genre === "demonstration" ? `Étape ${i + 1}` : l.role === "conclusion" ? "Conclusion" : l.role === "premisse" ? `Prémisse ${i + 1}` : `${i + 1}.`}</span>
                        {d.genre === "validite" && (
                          <select className="champ !min-h-8 !w-auto !py-1 text-sm" aria-label="Rôle" value={l.role} onChange={(e) => majLigne(i, { role: e.target.value as LigneLogique["role"] })}>
                            <option value="premisse">Prémisse</option>
                            <option value="conclusion">Conclusion</option>
                          </select>
                        )}
                        <span className="ml-auto flex gap-1">
                          <button type="button" className="bouton-icone !size-8" aria-label="Monter" disabled={i === 0} onClick={() => setD((x) => ({ ...x, lignes: x.lignes.map((ll, k) => (k === i ? x.lignes[i - 1] : k === i - 1 ? x.lignes[i] : ll)) }))}>
                            <ArrowUp className="size-4" aria-hidden="true" />
                          </button>
                          <button type="button" className="bouton-icone !size-8" aria-label="Descendre" disabled={i === d.lignes.length - 1} onClick={() => setD((x) => ({ ...x, lignes: x.lignes.map((ll, k) => (k === i ? x.lignes[i + 1] : k === i + 1 ? x.lignes[i] : ll)) }))}>
                            <ArrowDown className="size-4" aria-hidden="true" />
                          </button>
                          <button type="button" className="bouton-icone !size-8" aria-label="Supprimer la ligne" disabled={d.lignes.length <= 1} onClick={() => setD((x) => ({ ...x, lignes: x.lignes.filter((_, k) => k !== i) }))}>
                            <Trash2 className="size-4" aria-hidden="true" />
                          </button>
                        </span>
                      </div>
                      <input className="champ !min-h-10 !py-2 font-mono" data-ligne={i} aria-label="Formule" value={l.formule} onFocus={(e) => setChampActif(e.currentTarget)} onChange={(e) => majLigne(i, { formule: e.target.value })} placeholder="P → Q" spellCheck={false} autoComplete="off" />
                      {a?.erreur && <p className="text-sm text-danger">{a.erreur}</p>}
                      <input className="champ !min-h-10 !py-2" aria-label="En français" value={l.texte} onChange={(e) => majLigne(i, { texte: e.target.value })} placeholder="En français : ce que dit cette ligne" />
                      {d.genre === "demonstration" && (
                        <div className="grid gap-2 sm:grid-cols-2">
                          <select className="champ !min-h-10 !py-2" aria-label="Justification" value={l.regle} onChange={(e) => majLigne(i, { regle: e.target.value, role: e.target.value === "Prémisse" || e.target.value === "Hypothèse" ? "premisse" : "etape" })}>
                            <option value="">Justification…</option>
                            {REGLES.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                          <input
                            className="champ !min-h-10 !py-2"
                            aria-label="S'appuie sur les étapes"
                            value={l.depuis.map((k) => k + 1).join(", ")}
                            onChange={(e) => majLigne(i, { depuis: e.target.value.split(/[^0-9]+/).filter(Boolean).map((n) => Number(n) - 1).filter((n) => n >= 0 && n < i) })}
                            placeholder="S'appuie sur les étapes : 1, 2"
                          />
                        </div>
                      )}
                      {(l.role === "premisse" || d.genre === "demonstration") && (
                        <div className="grid gap-2 sm:grid-cols-2">
                          <input className="champ !min-h-10 !py-2" aria-label="Source" value={l.source} onChange={(e) => majLigne(i, { source: e.target.value })} placeholder="Source de cette prémisse" />
                          <input className="champ !min-h-10 !py-2" aria-label="Lien de la source" value={l.lien} onChange={(e) => majLigne(i, { lien: e.target.value })} placeholder="https://… (facultatif)" />
                        </div>
                      )}
                      {(l.role === "conclusion" || (d.genre === "demonstration" && i === d.lignes.length - 1)) && <ChoixArticle libelle="Article qui développe cette conclusion" valeur={l.article} onChange={(id) => majLigne(i, { article: id })} />}
                    </li>
                  );
                })}
              </ol>
              <button type="button" className="bouton bouton-discret" onClick={() => setD((x) => ({ ...x, lignes: [...x.lignes, { ...ligneVide(roleParDefaut), depuis: d.genre === "demonstration" ? [x.lignes.length - 1] : [] }] }))} disabled={d.lignes.length >= 40}>
                <Plus className="size-4" aria-hidden="true" />
                Ajouter une ligne
              </button>
              {noms.length > 0 && (
                <fieldset className="space-y-2">
                  <legend className="etiquette">Sens de chaque proposition</legend>
                  {noms.map((nom) => (
                    <label key={nom} className="flex items-center gap-3">
                      <span className="w-8 font-mono font-bold">{nom}</span>
                      <input className="champ !min-h-10 flex-1 !py-2" value={sens(nom)} onChange={(e) => majSens(nom, e.target.value)} placeholder={`Que signifie ${nom} ?`} />
                    </label>
                  ))}
                </fieldset>
              )}
            </>
          )}
        </div>
        <div className="atelier-apercu">
          <p className="etiquette">Aperçu, calculé en direct</p>
          <RenduLogique donnees={d} />
        </div>
      </div>
    </Modale>
  );
}
