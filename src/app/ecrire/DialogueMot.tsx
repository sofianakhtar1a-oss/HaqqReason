"use client";

import type { Editor } from "@tiptap/core";
import { BookPlus, Check, Copy, ExternalLink, Languages, LoaderCircle, Search, WholeWord } from "lucide-react";
import { useEffect, useState } from "react";
import { FICHIER_LEXIQUE } from "@/lib/atelier/lexique-fichier";
import { idMot, nouveauMot } from "@/lib/langues/dictionnaire";
import { ecrire, tout } from "@/lib/langues/stockage";
import type { MotPerso } from "@/lib/langues/types";
import { Fenetre } from "./Fenetre";

/*
 * Le Calame — un mot en un clic : ses synonymes (Wiktionnaire), et sa traduction anglaise tirée du
 * Truchement (ton dictionnaire personnel, puis les thèmes), complétée par le Wiktionnaire. Un synonyme
 * remplace le mot dans le texte ; une traduction peut rejoindre ton dictionnaire du Truchement.
 */

export type OngletMot = "synonymes" | "anglais";
type Cible = { de: number; a: number; mot: string };
type ReponseMot = { mot: string; lemme?: string | null; synonymes: string[]; anglais: string[]; source: string };
type Traduction = { en: string; nature?: string; origine: "perso" | "theme" | "wiktionnaire" };

const sansAccents = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[’]/g, "'").trim();
const LETTRE = /[\p{L}\p{M}'’-]/u;
const ELISION = /^(?:[ldjmntsc]|qu|jusqu|lorsqu|puisqu|quoiqu)['’](?=\p{L})/iu;

/** Le mot sous le curseur (ou la courte expression sélectionnée), sans l'élision ni la ponctuation autour. */
export function motSousLeCurseur(editor: Editor): Cible | null {
  const { from, to, empty, $from } = editor.state.selection;
  if (!empty) {
    const brut = editor.state.doc.textBetween(from, to, "\n", "￼");
    if (!brut.trim() || brut.length > 60 || brut.includes("\n") || brut.includes("￼") || brut.trim().split(/\s+/).length > 4) return null;
    const avant = brut.length - brut.replace(/^[^\p{L}\p{N}]+/u, "").length;
    const apres = brut.length - brut.replace(/[^\p{L}\p{N}]+$/u, "").length;
    let de = from + avant;
    let mot = brut.slice(avant, brut.length - apres);
    const elision = ELISION.exec(mot);
    if (elision && !mot.includes(" ")) {
      de += elision[0].length;
      mot = mot.slice(elision[0].length);
    }
    return mot ? { de, a: to - apres, mot } : null;
  }
  const bloc = $from.parent;
  if (!bloc.isTextblock) return null;
  const texte = bloc.textBetween(0, bloc.content.size, "\n", "￼");
  let i = $from.parentOffset;
  let j = i;
  while (i > 0 && LETTRE.test(texte[i - 1])) i--;
  while (j < texte.length && LETTRE.test(texte[j])) j++;
  while (i < j && /['’-]/.test(texte[i])) i++;
  while (j > i && /['’-]/.test(texte[j - 1])) j--;
  let mot = texte.slice(i, j);
  const elision = ELISION.exec(mot);
  if (elision) {
    i += elision[0].length;
    mot = mot.slice(elision[0].length);
  }
  if (!mot) return null;
  const debut = $from.start();
  return { de: debut + i, a: debut + j, mot };
}

/** Les formes sous lesquelles chercher un mot dans le lexique (pluriel, féminin, forme de base). */
export function formesDeRecherche(mot: string, lemme?: string | null): string[] {
  const m = sansAccents(mot);
  const formes = [m];
  if (lemme) formes.push(sansAccents(lemme));
  if (/aux$/.test(m)) formes.push(m.replace(/aux$/, "al"));
  if (/[sx]$/.test(m)) formes.push(m.slice(0, -1));
  if (/es$/.test(m)) formes.push(m.slice(0, -2));
  if (/e$/.test(m)) formes.push(m.slice(0, -1));
  return [...new Set(formes.filter((x) => x.length > 1))];
}

/** Les clés françaises d'une entrée du Truchement (« le chien, la chienne » → chien, chienne). */
const clesFrancaises = (fr: string) =>
  fr
    .split(/[,;/]|\bou\b/)
    .map((x) => sansAccents(x.replace(/\([^)]*\)/g, " ").replace(/^(le|la|les|l'|un|une|des|se|s'|to)\s*/i, "")))
    .filter(Boolean);

let lexique: Promise<Record<string, [string, string][]>> | null = null;
const chargerLexique = () =>
  (lexique ??= fetch(FICHIER_LEXIQUE)
    .then((r) => (r.ok ? (r.json() as Promise<Record<string, [string, string][]>>) : {}))
    .catch(() => {
      lexique = null;
      return {};
    }));

type Props = { editor: Editor; onglet: OngletMot; surFermer: () => void; surAnnonce?: (texte: string) => void };

export function DialogueMot({ editor, onglet: ongletDepart, surFermer, surAnnonce }: Props) {
  const [cible] = useState(() => motSousLeCurseur(editor));
  const [onglet, setOnglet] = useState<OngletMot>(ongletDepart);
  const [saisie, setSaisie] = useState(cible?.mot ?? "");
  const [cherche, setCherche] = useState(cible?.mot ?? "");
  const [reponses, setReponses] = useState<Record<string, ReponseMot | { erreur: string }>>({});
  const [lex, setLex] = useState<Record<string, [string, string][]> | null>(null);
  const [perso, setPerso] = useState<MotPerso[] | null>(null);
  const [copie, setCopie] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!cherche || reponses[cherche]) return;
    let vivant = true;
    fetch(`/api/calame/mot?mot=${encodeURIComponent(cherche)}`)
      .then(async (r) => {
        const d = (await r.json().catch(() => ({}))) as ReponseMot & { erreur?: string };
        if (vivant) setReponses((x) => ({ ...x, [cherche]: r.ok ? d : { erreur: d.erreur ?? "Le Wiktionnaire n'a pas répondu." } }));
      })
      .catch(() => vivant && setReponses((x) => ({ ...x, [cherche]: { erreur: "Pas de connexion : synonymes et Wiktionnaire ont besoin d'Internet." } })));
    return () => {
      vivant = false;
    };
  }, [cherche, reponses]);

  useEffect(() => {
    let vivant = true;
    void chargerLexique().then((l) => vivant && setLex(l));
    tout<MotPerso>("dictionnaire")
      .then((m) => vivant && setPerso(m))
      .catch(() => vivant && setPerso([]));
    return () => {
      vivant = false;
    };
  }, []);

  const reponse = cherche ? reponses[cherche] : undefined;
  const donnees = reponse && !("erreur" in reponse) ? reponse : null;
  const chargement = Boolean(cherche) && !reponse;
  const lemme = donnees?.lemme && sansAccents(donnees.lemme) !== sansAccents(cherche) ? donnees.lemme : null;

  // La traduction : ton dictionnaire du Truchement d'abord, puis les thèmes, puis le Wiktionnaire.
  const formes = cherche ? formesDeRecherche(cherche, lemme) : [];
  const traductions: Traduction[] = [];
  const vus = new Set<string>();
  const ajouterTrad = (t: Traduction) => {
    const cle = t.en.toLowerCase();
    if (vus.has(cle)) return;
    vus.add(cle);
    traductions.push(t);
  };
  for (const p of perso ?? []) if (clesFrancaises(p.fr).some((c) => formes.includes(c))) ajouterTrad({ en: p.en, nature: p.nature, origine: "perso" });
  for (const f of formes) for (const [en, nature] of lex?.[f] ?? []) ajouterTrad({ en, nature: nature || undefined, origine: "theme" });
  for (const en of donnees?.anglais ?? []) ajouterTrad({ en, origine: "wiktionnaire" });

  const chercher = (mot: string) => {
    const propre = mot.trim().replace(/^[^\p{L}]+|[^\p{L}]+$/gu, "").slice(0, 60);
    if (propre) setCherche(propre);
  };

  const copier = async (texte: string) => {
    try {
      await navigator.clipboard.writeText(texte);
      setCopie(texte);
    } catch {
      setMessage("Le presse-papiers n'est pas accessible ici.");
    }
  };

  const remplacer = (synonyme: string) => {
    if (!cible || sansAccents(cherche) !== sansAccents(cible.mot)) {
      void copier(synonyme);
      return;
    }
    if (editor.state.doc.textBetween(cible.de, cible.a, "", "") !== cible.mot) {
      setMessage("Le texte a changé : le mot n'est plus à sa place.");
      return;
    }
    const texte = /^\p{Lu}/u.test(cible.mot) && !/^\p{Lu}/u.test(synonyme) ? synonyme.charAt(0).toUpperCase() + synonyme.slice(1) : synonyme;
    editor
      .chain()
      .focus()
      .command(({ tr }) => {
        tr.insertText(texte, cible.de, cible.a);
        return true;
      })
      .run();
    surAnnonce?.(`« ${cible.mot} » remplacé par « ${texte} ».`);
    surFermer();
  };

  const ajouterAuTruchement = async (t: Traduction) => {
    const francais = lemme ?? cherche;
    const id = idMot(t.en);
    const existant = perso?.find((p) => p.id === id);
    const mot: MotPerso = existant
      ? { ...existant, fr: clesFrancaises(existant.fr).includes(sansAccents(francais)) ? existant.fr : `${existant.fr}, ${francais}` }
      : nouveauMot({ en: t.en, fr: francais, nature: t.nature }, { type: "manuel", titre: "Le Calame" });
    try {
      await ecrire("dictionnaire", mot);
      setPerso((p) => [...(p ?? []).filter((x) => x.id !== id), mot]);
      setMessage(`« ${t.en} » rejoint ton dictionnaire du Truchement.`);
    } catch {
      setMessage("Le dictionnaire du Truchement n'est pas accessible sur cet appareil.");
    }
  };

  const remplaceDansLeTexte = Boolean(cible) && sansAccents(cherche) === sansAccents(cible?.mot ?? "");

  return (
    <Fenetre titre={cherche ? `« ${cherche} »` : "Un mot"} sousTitre="Synonymes et traduction anglaise" surFermer={surFermer} largeur={34}>
      <form
        className="calame-mot-recherche"
        onSubmit={(e) => {
          e.preventDefault();
          chercher(saisie);
        }}
      >
        <input className="champ" value={saisie} onChange={(e) => setSaisie(e.target.value)} placeholder="Un mot français" aria-label="Mot à chercher" maxLength={60} autoFocus={!cible} />
        <button type="submit" className="bouton bouton-discret bouton-petit" disabled={!saisie.trim()}>
          <Search className="size-4" aria-hidden="true" />
          Chercher
        </button>
      </form>
      <div className="calame-mot-onglets" role="group" aria-label="Afficher">
        <button type="button" aria-pressed={onglet === "synonymes"} onClick={() => setOnglet("synonymes")} autoFocus={Boolean(cible) && ongletDepart === "synonymes"}>
          <WholeWord className="size-4" aria-hidden="true" />
          Synonymes
        </button>
        <button type="button" aria-pressed={onglet === "anglais"} onClick={() => setOnglet("anglais")} autoFocus={Boolean(cible) && ongletDepart === "anglais"}>
          <Languages className="size-4" aria-hidden="true" />
          En anglais
        </button>
      </div>

      {!cherche && <p className="inspecteur-aide">Place le curseur sur un mot (ou sélectionne-le), ou écris-le ci-dessus.</p>}
      {chargement && onglet === "synonymes" && (
        <p className="calame-mot-attente" role="status">
          <LoaderCircle className="size-4 calame-tourne" aria-hidden="true" /> Recherche dans le Wiktionnaire…
        </p>
      )}
      {reponse && "erreur" in reponse && (
        <p className="inspecteur-aide" data-alerte="" role="alert">
          {reponse.erreur}
        </p>
      )}

      {onglet === "synonymes" && donnees && (
        <div className="calame-mot-resultats">
          {lemme && <p className="inspecteur-aide">Synonymes de la forme de base, « {lemme} » : accorde-les au besoin.</p>}
          {donnees.synonymes.length === 0 ? (
            <p className="inspecteur-aide">Le Wiktionnaire ne donne pas de synonyme pour ce mot.</p>
          ) : (
            <>
              <ul className="calame-mot-synonymes">
                {donnees.synonymes.map((s) => (
                  <li key={s}>
                    <button type="button" onClick={() => remplacer(s)} title={remplaceDansLeTexte ? `Remplacer « ${cible?.mot} » par « ${s} »` : `Copier « ${s} »`}>
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
              <p className="inspecteur-aide">{remplaceDansLeTexte ? "Un clic remplace le mot dans le texte (Ctrl+Z pour revenir)." : "Un clic copie le synonyme."}</p>
            </>
          )}
        </div>
      )}

      {onglet === "anglais" && cherche && (
        <div className="calame-mot-resultats">
          {traductions.length === 0 ? (
            chargement || lex === null ? (
              <p className="calame-mot-attente" role="status">
                <LoaderCircle className="size-4 calame-tourne" aria-hidden="true" /> Recherche dans le Truchement…
              </p>
            ) : (
              <p className="inspecteur-aide">Aucune traduction trouvée pour ce mot.</p>
            )
          ) : (
            <ul className="calame-mot-traductions">
              {traductions.map((t) => (
                <li key={t.en} data-origine={t.origine}>
                  <span className="calame-mot-en" lang="en">
                    {t.en}
                  </span>
                  {t.nature && <span className="calame-mot-nature">{t.nature}</span>}
                  <span className="calame-mot-origine">{t.origine === "perso" ? "ton dictionnaire" : t.origine === "theme" ? "thèmes du Truchement" : "Wiktionnaire"}</span>
                  <span className="calame-mot-gestes">
                    <button type="button" className="bouton bouton-discret bouton-petit" onClick={() => void copier(t.en)} aria-label={`Copier « ${t.en} »`}>
                      {copie === t.en ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
                    </button>
                    {t.origine === "perso" ? (
                      <span className="calame-mot-deja" title="Déjà dans ton dictionnaire du Truchement">
                        <Check className="size-4" aria-hidden="true" />
                        <span className="sr-only">Déjà dans ton dictionnaire du Truchement</span>
                      </span>
                    ) : (
                      <button type="button" className="bouton bouton-discret bouton-petit" onClick={() => void ajouterAuTruchement(t)} title="Ajouter à mon dictionnaire du Truchement">
                        <BookPlus className="size-4" aria-hidden="true" />
                        <span className="sr-only">Ajouter « {t.en} » à mon dictionnaire du Truchement</span>
                      </button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {message && (
        <p className="inspecteur-aide" role="status">
          {message}
        </p>
      )}
      {donnees && (
        <p className="calame-mot-source">
          Synonymes et traductions complémentaires :{" "}
          <a href={donnees.source} target="_blank" rel="noopener noreferrer">
            Wiktionnaire <ExternalLink className="inline size-3" aria-hidden="true" />
          </a>{" "}
          (CC BY-SA).
        </p>
      )}
    </Fenetre>
  );
}
