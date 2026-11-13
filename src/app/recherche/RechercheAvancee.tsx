"use client";

import { Bookmark, Check, ChevronDown, ChevronRight, LoaderCircle, Minus, RotateCcw, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CarteResultat } from "@/components/ResultatRecherche";
import {
  memoriserRecherche,
  recherchesRecentes,
  recherchesSauvegardees,
  sauvegarderRecherche,
  supprimerRechercheSauvegardee,
  type RechercheSauvegardee,
} from "@/lib/client/recherches-locales";
import type { ArbreFiltres, Criteres, Resultat } from "@/lib/recherche";
import { motsDeRequete } from "@/lib/recherche-texte";

/*
 * Recherche avancée : résultats instantanés, filtres en arborescence (blocs, catégories, sous-catégories
 * de tous niveaux), types de contenu, étiquettes, dates, tri ; recherches récentes et sauvegardées.
 */

type Props = {
  criteres: Criteres;
  premiers: { resultats: Resultat[]; total: number; createur: boolean; erreur: boolean };
  filtres: ArbreFiltres;
};

const TYPES = [
  { cle: "article", libelle: "Articles" },
  { cle: "document", libelle: "Documents et PDF" },
  { cle: "dossier", libelle: "Dossiers" },
];
const SOUS_TYPES = [
  { cle: "verset", libelle: "Versets" },
  { cle: "hadith", libelle: "Hadiths" },
  { cle: "objection", libelle: "Objections et réponses" },
];

type EtatCase = "coche" | "partiel" | "vide";

function CaseArbre({ etat }: { etat: EtatCase }) {
  return (
    <span className="case-arbre" data-etat={etat} aria-hidden="true">
      {etat === "coche" && <Check className="size-3" strokeWidth={3} />}
      {etat === "partiel" && <Minus className="size-3" strokeWidth={3} />}
    </span>
  );
}

export function RechercheAvancee({ criteres, premiers, filtres }: Props) {
  const createur = premiers.createur;

  // ---- Arborescence -------------------------------------------------------
  const enfants = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const c of filtres.categories) {
      const cle = c.parent_id ?? `bloc:${c.bloc_id}`;
      m.set(cle, [...(m.get(cle) ?? []), c.id]);
    }
    return m;
  }, [filtres.categories]);
  const titres = useMemo(() => new Map(filtres.categories.map((c) => [c.id, c.titre])), [filtres.categories]);

  const descendants = useCallback(
    (cle: string): string[] => {
      const resultat: string[] = [];
      const pile = [...(enfants.get(cle) ?? [])];
      while (pile.length) {
        const id = pile.pop()!;
        resultat.push(id);
        pile.push(...(enfants.get(id) ?? []));
      }
      return resultat;
    },
    [enfants],
  );

  const selectionInitiale = useMemo(() => {
    const s = new Set<string>();
    for (const b of criteres.blocs) {
      s.add(`bloc:${b}`);
      descendants(`bloc:${b}`).forEach((d) => s.add(d));
    }
    criteres.categories.forEach((c) => s.add(c));
    return s;
  }, [criteres, descendants]);

  const [q, setQ] = useState(criteres.q);
  // Sur téléphone, les filtres sont repliés au départ pour laisser les résultats visibles.
  const tiroir = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (tiroir.current && !matchMedia("(min-width: 1024px)").matches) tiroir.current.open = false;
  }, []);
  const [selection, setSelection] = useState<Set<string>>(selectionInitiale);
  const [ouverts, setOuverts] = useState<Set<string>>(() => new Set(filtres.blocs.map((b) => `bloc:${b.id}`)));
  const [types, setTypes] = useState<string[]>(criteres.types);
  const [etiquettes, setEtiquettes] = useState<string[]>(criteres.etiquettes);
  const [depuis, setDepuis] = useState(criteres.depuis ?? "");
  const [jusqua, setJusqua] = useState(criteres.jusqua ?? "");
  const [statut, setStatut] = useState(criteres.statut);
  const [tri, setTri] = useState(criteres.tri);
  const [resultats, setResultats] = useState(premiers.resultats);
  const [total, setTotal] = useState(premiers.total);
  const [page, setPage] = useState(1);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(premiers.erreur);
  const [toutesEtiquettes, setToutesEtiquettes] = useState(false);
  const [sauvegardees, setSauvegardees] = useState<RechercheSauvegardee[]>([]);
  const [recentes, setRecentes] = useState<string[]>([]);
  const [nomSauvegarde, setNomSauvegarde] = useState("");
  const premierAffichage = useRef(true);
  const numero = useRef(0);

  useEffect(() => {
    // Lu après l'affichage : ces listes vivent dans le navigateur.
    const minuteur = setTimeout(() => {
      setSauvegardees(recherchesSauvegardees());
      setRecentes(recherchesRecentes());
    }, 0);
    return () => clearTimeout(minuteur);
  }, []);

  const etat = useCallback(
    (cle: string): EtatCase => {
      const tous = [cle, ...descendants(cle)];
      const coches = tous.filter((x) => selection.has(x)).length;
      return coches === 0 ? "vide" : coches === tous.length ? "coche" : "partiel";
    },
    [descendants, selection],
  );

  function basculer(cle: string) {
    const valeur = etat(cle) !== "coche";
    setSelection((s) => {
      const n = new Set(s);
      for (const x of [cle, ...descendants(cle)]) {
        if (valeur) n.add(x);
        else n.delete(x);
      }
      return n;
    });
  }

  // ---- Paramètres de recherche --------------------------------------------
  const parametres = useMemo(() => {
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    const blocs: string[] = [];
    const categories: string[] = [];
    for (const b of filtres.blocs) {
      const cle = `bloc:${b.id}`;
      const etatBloc = etat(cle);
      if (etatBloc === "coche") blocs.push(b.id);
      else if (etatBloc === "partiel") categories.push(...descendants(cle).filter((c) => selection.has(c)));
    }
    if (blocs.length) p.set("blocs", blocs.join(","));
    if (categories.length) p.set("categories", categories.join(","));
    if (types.length) p.set("types", types.join(","));
    if (etiquettes.length) p.set("etiquettes", etiquettes.join(","));
    if (depuis) p.set("depuis", depuis);
    if (jusqua) p.set("jusqua", jusqua);
    if (createur && statut !== "tous") p.set("statut", statut);
    if (tri !== "pertinence") p.set("tri", tri);
    return p;
  }, [q, filtres.blocs, etat, descendants, selection, types, etiquettes, depuis, jusqua, createur, statut, tri]);

  const chaine = parametres.toString();

  const charger = useCallback(
    async (pageVoulue: number, ajouter: boolean) => {
      const n = ++numero.current;
      setChargement(true);
      try {
        const p = new URLSearchParams(chaine);
        p.set("page", String(pageVoulue));
        const reponse = await fetch(`/api/recherche?${p.toString()}`);
        const donnees = (await reponse.json()) as { resultats: Resultat[]; total: number; erreur: boolean };
        if (n !== numero.current) return;
        setErreur(donnees.erreur);
        setResultats((r) => (ajouter ? [...r, ...donnees.resultats] : donnees.resultats));
        setTotal(donnees.total);
        setPage(pageVoulue);
      } catch {
        if (n === numero.current) setErreur(true);
      } finally {
        if (n === numero.current) setChargement(false);
      }
    },
    [chaine],
  );

  // Toute modification relance la recherche (après une courte pause) et met l'adresse à jour.
  useEffect(() => {
    if (premierAffichage.current) {
      premierAffichage.current = false;
      return;
    }
    const minuteur = setTimeout(() => {
      window.history.replaceState(null, "", chaine ? `/recherche?${chaine}` : "/recherche");
      void charger(1, false);
    }, 250);
    return () => clearTimeout(minuteur);
  }, [chaine, charger]);

  function appliquer(p: URLSearchParams) {
    setQ(p.get("q") ?? "");
    const s = new Set<string>();
    for (const b of (p.get("blocs") ?? "").split(",").filter(Boolean)) {
      s.add(`bloc:${b}`);
      descendants(`bloc:${b}`).forEach((d) => s.add(d));
    }
    (p.get("categories") ?? "").split(",").filter(Boolean).forEach((c) => s.add(c));
    setSelection(s);
    setTypes((p.get("types") ?? "").split(",").filter(Boolean));
    setEtiquettes((p.get("etiquettes") ?? "").split(",").filter(Boolean));
    setDepuis(p.get("depuis") ?? "");
    setJusqua(p.get("jusqua") ?? "");
    const st = p.get("statut");
    setStatut(st === "publie" || st === "brouillon" ? st : "tous");
    const t = p.get("tri");
    setTri(t === "date" || t === "titre" ? t : "pertinence");
  }

  function reinitialiser() {
    setSelection(new Set());
    setTypes([]);
    setEtiquettes([]);
    setDepuis("");
    setJusqua("");
    setStatut("tous");
    setTri("pertinence");
  }

  const filtresActifs = selection.size + types.length + etiquettes.length + (depuis ? 1 : 0) + (jusqua ? 1 : 0) + (statut !== "tous" ? 1 : 0);
  const mots = motsDeRequete(q);
  const approchants = resultats.length > 0 && resultats.every((r) => r.approchant);

  const noeud = (id: string, profondeur: number): React.ReactNode => {
    const sous = enfants.get(id) ?? [];
    const ouvert = ouverts.has(id);
    const e = etat(id);
    return (
      <li key={id}>
        <div className="flex items-center gap-1" style={{ paddingLeft: profondeur * 14 }}>
          {sous.length > 0 ? (
            <button
              type="button"
              className="bouton-icone !size-7"
              aria-label={ouvert ? `Replier « ${titres.get(id)} »` : `Déplier « ${titres.get(id)} »`}
              aria-expanded={ouvert}
              onClick={() => setOuverts((o) => (o.has(id) ? new Set([...o].filter((x) => x !== id)) : new Set(o).add(id)))}
            >
              {ouvert ? <ChevronDown className="size-4" aria-hidden="true" /> : <ChevronRight className="size-4" aria-hidden="true" />}
            </button>
          ) : (
            <span className="inline-block w-7" />
          )}
          <button type="button" role="checkbox" aria-checked={e === "coche" ? true : e === "partiel" ? "mixed" : false} className="flex min-w-0 items-center gap-2 rounded-lg px-1.5 py-1 text-left hover:bg-[var(--surface-forte)]" onClick={() => basculer(id)}>
            <CaseArbre etat={e} />
            <span className="truncate text-[0.9375rem]">{titres.get(id)}</span>
          </button>
        </div>
        {ouvert && sous.length > 0 && <ul>{sous.map((s) => noeud(s, profondeur + 1))}</ul>}
      </li>
    );
  };

  const etiquettesAffichees = toutesEtiquettes ? filtres.etiquettes : filtres.etiquettes.slice(0, 24);

  return (
    <div className="mt-6">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          memoriserRecherche(q);
          setRecentes(recherchesRecentes());
          void charger(1, false);
        }}
        className="flex items-center gap-3 rounded-2xl border border-trait bg-[var(--surface)] px-4"
      >
        {chargement ? <LoaderCircle className="size-6 shrink-0 animate-spin text-or" aria-hidden="true" /> : <Search className="size-6 shrink-0 text-or" aria-hidden="true" />}
        <label htmlFor="champ-recherche" className="sr-only">
          Rechercher
        </label>
        <input
          id="champ-recherche"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="min-h-16 flex-1 bg-transparent text-xl outline-none placeholder:text-encre-douce"
          placeholder="Trinité, « Jean 1:1 », الرحمن…"
          maxLength={200}
          autoFocus={!criteres.q}
        />
      </form>
      <p className="mt-2 text-sm text-encre-douce">
        Sans accents ni voyelles arabes si tu veux. Guillemets pour une phrase exacte, un tiret pour exclure un mot (-paul), « OU » pour accepter l&apos;un ou
        l&apos;autre.
      </p>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[18.5rem_minmax(0,1fr)]">
        <details ref={tiroir} className="tiroir verre rounded-3xl lg:sticky lg:top-6 lg:[&>summary]:hidden" open>
          <summary className="flex items-center justify-between rounded-3xl border border-transparent px-6 py-4 font-semibold">
            Filtres {filtresActifs > 0 && `(${filtresActifs})`}
          </summary>
          <div className="max-h-[80vh] space-y-6 overflow-y-auto p-5">
            <section aria-labelledby="filtre-lieu">
              <div className="flex items-center justify-between">
                <h2 id="filtre-lieu" className="font-bold">
                  Où chercher
                </h2>
                {filtresActifs > 0 && (
                  <button type="button" className="outil text-sm" onClick={reinitialiser}>
                    <RotateCcw className="size-4" aria-hidden="true" />
                    Tout effacer
                  </button>
                )}
              </div>
              <p className="aide mt-1 text-sm">Rien de coché : partout.</p>
              <ul className="mt-2 space-y-0.5">
                {filtres.blocs.map((b) => {
                  const cle = `bloc:${b.id}`;
                  const sous = enfants.get(cle) ?? [];
                  const ouvert = ouverts.has(cle);
                  const e = etat(cle);
                  return (
                    <li key={b.id} data-accent={b.accent}>
                      <div className="flex items-center gap-1">
                        {sous.length > 0 ? (
                          <button
                            type="button"
                            className="bouton-icone !size-7"
                            aria-label={ouvert ? `Replier « ${b.titre} »` : `Déplier « ${b.titre} »`}
                            aria-expanded={ouvert}
                            onClick={() => setOuverts((o) => (o.has(cle) ? new Set([...o].filter((x) => x !== cle)) : new Set(o).add(cle)))}
                          >
                            {ouvert ? <ChevronDown className="size-4" aria-hidden="true" /> : <ChevronRight className="size-4" aria-hidden="true" />}
                          </button>
                        ) : (
                          <span className="inline-block w-7" />
                        )}
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={e === "coche" ? true : e === "partiel" ? "mixed" : false}
                          className="flex min-w-0 items-center gap-2 rounded-lg px-1.5 py-1 text-left font-semibold text-accent hover:bg-[var(--surface-forte)]"
                          onClick={() => basculer(cle)}
                        >
                          <CaseArbre etat={e} />
                          <span>{b.titre}</span>
                        </button>
                      </div>
                      {ouvert && sous.length > 0 && <ul>{sous.map((s) => noeud(s, 1))}</ul>}
                    </li>
                  );
                })}
              </ul>
            </section>

            <fieldset>
              <legend className="font-bold">Quoi chercher</legend>
              <div className="mt-2 space-y-1">
                {TYPES.map((t) => (
                  <label key={t.cle} className="flex cursor-pointer items-center gap-2">
                    <input type="checkbox" className="size-4 accent-[var(--or)]" checked={types.includes(t.cle)} onChange={(e) => setTypes((x) => (e.target.checked ? [...x, t.cle] : x.filter((y) => y !== t.cle)))} />
                    {t.libelle}
                  </label>
                ))}
                <p className="aide pt-2 text-sm">Seulement à l&apos;intérieur des blocs :</p>
                {SOUS_TYPES.map((t) => (
                  <label key={t.cle} className="flex cursor-pointer items-center gap-2">
                    <input type="checkbox" className="size-4 accent-[var(--or)]" checked={types.includes(t.cle)} onChange={(e) => setTypes((x) => (e.target.checked ? [...x, t.cle] : x.filter((y) => y !== t.cle)))} />
                    {t.libelle}
                  </label>
                ))}
              </div>
            </fieldset>

            {filtres.etiquettes.length > 0 && (
              <fieldset>
                <legend className="font-bold">Étiquettes</legend>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {etiquettesAffichees.map((t) => {
                    const actif = etiquettes.includes(t.cle);
                    return (
                      <button
                        key={t.cle}
                        type="button"
                        aria-pressed={actif}
                        className={`etiquette-puce !text-sm ${actif ? "!border-or !bg-[color-mix(in_srgb,var(--or)_25%,transparent)]" : ""}`}
                        onClick={() => setEtiquettes((x) => (actif ? x.filter((y) => y !== t.cle) : [...x, t.cle]))}
                      >
                        {t.nom}
                      </button>
                    );
                  })}
                </div>
                {filtres.etiquettes.length > 24 && (
                  <button type="button" className="outil mt-2 text-sm" onClick={() => setToutesEtiquettes((v) => !v)}>
                    {toutesEtiquettes ? "Moins d'étiquettes" : `Voir les ${filtres.etiquettes.length} étiquettes`}
                  </button>
                )}
              </fieldset>
            )}

            <fieldset>
              <legend className="font-bold">Date de mise à jour</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <label className="text-sm">
                  Depuis
                  <input type="date" className="champ !min-h-10 !py-1.5" value={depuis} onChange={(e) => setDepuis(e.target.value)} />
                </label>
                <label className="text-sm">
                  Jusqu&apos;au
                  <input type="date" className="champ !min-h-10 !py-1.5" value={jusqua} onChange={(e) => setJusqua(e.target.value)} />
                </label>
              </div>
            </fieldset>

            {createur && (
              <label className="block">
                <span className="font-bold">Statut</span>
                <select className="champ mt-2 !min-h-10 !py-1.5" value={statut} onChange={(e) => setStatut(e.target.value as Criteres["statut"])}>
                  <option value="tous">Publiés et brouillons</option>
                  <option value="publie">Publiés seulement</option>
                  <option value="brouillon">Brouillons seulement</option>
                </select>
              </label>
            )}

            <section aria-labelledby="titre-sauvegardes" className="border-t border-trait pt-5">
              <h2 id="titre-sauvegardes" className="font-bold">
                Recherches sauvegardées
              </h2>
              {sauvegardees.length > 0 ? (
                <ul className="mt-2 space-y-1">
                  {sauvegardees.map((s) => (
                    <li key={s.nom} className="flex items-center gap-1">
                      <button type="button" className="min-w-0 flex-1 truncate rounded-lg px-2 py-1 text-left hover:bg-[var(--surface-forte)]" onClick={() => appliquer(new URLSearchParams(s.parametres))}>
                        <Bookmark className="mr-1.5 inline size-4 text-or" aria-hidden="true" />
                        {s.nom}
                      </button>
                      <button
                        type="button"
                        className="bouton-icone !size-8"
                        aria-label={`Supprimer « ${s.nom} »`}
                        onClick={() => {
                          supprimerRechercheSauvegardee(s.nom);
                          setSauvegardees(recherchesSauvegardees());
                        }}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="aide mt-1 text-sm">Aucune pour l&apos;instant.</p>
              )}
              <form
                className="mt-3 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  sauvegarderRecherche(nomSauvegarde || q || "Ma recherche", chaine);
                  setSauvegardees(recherchesSauvegardees());
                  setNomSauvegarde("");
                }}
              >
                <label htmlFor="nom-sauvegarde" className="sr-only">
                  Nom de la recherche à sauvegarder
                </label>
                <input id="nom-sauvegarde" className="champ !min-h-10 !py-1.5 text-sm" placeholder="Nom (facultatif)" value={nomSauvegarde} onChange={(e) => setNomSauvegarde(e.target.value)} maxLength={80} />
                <button type="submit" className="bouton bouton-discret !min-h-10 shrink-0 !px-3 text-sm" disabled={!chaine}>
                  Sauvegarder
                </button>
              </form>
              {recentes.length > 0 && (
                <>
                  <h2 className="mt-5 font-bold">Recherches récentes</h2>
                  <ul className="mt-1 flex flex-wrap gap-1.5">
                    {recentes.map((r) => (
                      <li key={r}>
                        <button type="button" className="etiquette-puce !text-sm" onClick={() => setQ(r)}>
                          {r}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          </div>
        </details>

        <section aria-labelledby="titre-resultats" aria-busy={chargement}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="titre-resultats" className="text-xl font-bold" aria-live="polite">
              {erreur
                ? "La recherche n'a pas pu aboutir"
                : !chaine
                  ? "Tape un mot ou choisis un filtre"
                  : total === 0
                    ? "Aucun résultat"
                    : approchants
                      ? `Aucun résultat exact : ${total} résultat${total > 1 ? "s" : ""} approchant${total > 1 ? "s" : ""}`
                      : `${total} résultat${total > 1 ? "s" : ""}`}
            </h2>
            <label className="flex items-center gap-2 text-sm">
              Trier par
              <select className="champ !min-h-9 !w-auto !py-1" value={tri} onChange={(e) => setTri(e.target.value as Criteres["tri"])}>
                <option value="pertinence">Pertinence</option>
                <option value="date">Date</option>
                <option value="titre">Titre</option>
              </select>
            </label>
          </div>
          {erreur && <p className="message message-erreur mt-4">Vérifie que le fichier 005_recherche.sql a bien été exécuté dans Supabase, puis réessaie.</p>}
          {chaine && total === 0 && !erreur && !chargement && (
            <p className="mt-3 text-encre-douce">Essaie un mot plus court, retire un filtre, ou vérifie l&apos;orthographe.</p>
          )}
          <ul className="mt-5 grid gap-3">
            {resultats.map((r) => (
              <CarteResultat key={`${r.type}-${r.id}-${r.page ?? ""}`} r={r} q={q} mots={mots} createur={createur} />
            ))}
          </ul>
          {resultats.length < total && (
            <button type="button" className="bouton bouton-discret mt-6" onClick={() => void charger(page + 1, true)} disabled={chargement}>
              {chargement ? "Chargement…" : `Afficher plus (${total - resultats.length} restants)`}
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
