"use client";

import type { Editor } from "@tiptap/core";
import { BookPlus, LoaderCircle, Pencil, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { abonnerBibliotheque, enregistrerOuvrage, GENRES_OUVRAGE, lireBibliotheque, OUVRAGE_VIDE, referenceOuvrage, supprimerOuvrage, type GenreOuvrage, type Ouvrage } from "@/lib/atelier/bibliotheque";
import { ajouterFichier } from "@/lib/atelier/depot";
import { domaine, infosYoutube } from "@/lib/liens-web";
import { Fenetre } from "./Fenetre";
import { insererCitation, insererReference, marquerTerme, styleDe, termeConnu } from "./blocs/Sources";

type Fiche = Omit<Ouvrage, "id" | "q">;
const AUCUN: Ouvrage[] = [];
const sansAccents = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function Apercu({ fiche, editor, page = "" }: { fiche: Fiche; editor: Editor; page?: string }) {
  return (
    <p className="calame-biblio-apercu">
      {referenceOuvrage(fiche, styleDe(editor), page).map((m, i) => (m.italique ? <i key={i}>{m.texte}</i> : <span key={i}>{m.texte}</span>))}
    </p>
  );
}

const LIBELLE_RECUEIL: Record<GenreOuvrage, string> = { livre: "", chapitre: "Livre qui contient le chapitre", article: "Revue", site: "" };

function FormulaireOuvrage({ fiche, surChangement }: { fiche: Fiche; surChangement: (f: Fiche) => void }) {
  const champ = (cle: keyof Fiche, libelle: string, indication = "", large = false) => (
    <label className={`inspecteur-reglage${large ? " calame-biblio-large" : ""}`}>
      <span className="inspecteur-libelle">{libelle}</span>
      <input className="champ" value={String(fiche[cle] ?? "")} onChange={(e) => surChangement({ ...fiche, [cle]: e.target.value })} placeholder={indication} />
    </label>
  );
  return (
    <div className="calame-biblio-formulaire">
      <label className="inspecteur-reglage calame-biblio-large">
        <span className="inspecteur-libelle">Genre</span>
        <select className="champ" value={fiche.genre} onChange={(e) => surChangement({ ...fiche, genre: e.target.value as GenreOuvrage })}>
          {GENRES_OUVRAGE.map((g) => (
            <option key={g.cle} value={g.cle}>
              {g.libelle}
            </option>
          ))}
        </select>
      </label>
      {champ("auteur", "Auteur(s)", "Nom, Prénom ; Nom, Prénom", true)}
      {champ("titre", fiche.genre === "chapitre" ? "Titre du chapitre" : fiche.genre === "article" ? "Titre de l'article" : "Titre", "", true)}
      {LIBELLE_RECUEIL[fiche.genre] && champ("recueil", LIBELLE_RECUEIL[fiche.genre], "", true)}
      {fiche.genre !== "site" && champ("traducteur", "Traduction", "Prénom Nom")}
      {fiche.genre !== "article" && champ("editeur", fiche.genre === "site" ? "Site" : "Éditeur")}
      {fiche.genre !== "article" && fiche.genre !== "site" && champ("lieu", "Lieu d'édition", "Paris")}
      {champ("annee", "Année", "1981")}
      {(fiche.genre === "article" || fiche.genre === "livre") && champ("volume", fiche.genre === "article" ? "Numéro ou volume" : "Tome", "")}
      {(fiche.genre === "article" || fiche.genre === "chapitre") && champ("pages", "Pages", "5-20")}
      {champ("url", "Adresse web (facultative)", "https://…", true)}
    </div>
  );
}

/**
 * La bibliothèque personnelle : chercher, ajouter, corriger un ouvrage — et, selon d'où on vient,
 * l'appeler en note (« Référence à un ouvrage ») ou en citer un passage (« Citation d'un ouvrage »).
 */
export function DialogueBibliotheque({ editor, mode, surFermer }: { editor: Editor; mode: "gerer" | "reference" | "citation"; surFermer: () => void }) {
  const ouvrages = useSyncExternalStore(abonnerBibliotheque, lireBibliotheque, () => AUCUN);
  const [recherche, setRecherche] = useState("");
  const [choisi, setChoisi] = useState<string | null>(null);
  const [edition, setEdition] = useState<(Fiche & { id?: string }) | null>(null);
  const [page, setPage] = useState("");
  const [passage, setPassage] = useState("");
  const [aRetirer, setARetirer] = useState<string | null>(null);

  const trouves = useMemo(() => {
    const q = sansAccents(recherche.trim());
    const liste = q ? ouvrages.filter((o) => sansAccents(`${o.auteur} ${o.titre} ${o.recueil} ${o.annee}`).includes(q)) : ouvrages;
    return [...liste].sort((a, b) => (a.auteur || a.titre).localeCompare(b.auteur || b.titre, "fr", { sensitivity: "base" }));
  }, [ouvrages, recherche]);
  const ouvrage = ouvrages.find((o) => o.id === choisi) ?? null;

  const enregistrer = () => {
    if (!edition || !edition.titre.trim()) return;
    const id = enregistrerOuvrage({ ...edition, titre: edition.titre.trim(), auteur: edition.auteur.trim() });
    setEdition(null);
    if (mode !== "gerer") setChoisi(id);
  };
  const inserer = () => {
    if (!ouvrage) return;
    const fait = mode === "citation" ? insererCitation(editor, ouvrage, page, passage) : insererReference(editor, ouvrage, page);
    if (fait) surFermer();
  };

  const titre = mode === "reference" ? "Référence à un ouvrage" : mode === "citation" ? "Citation d'un ouvrage" : "Ma bibliothèque";
  const pied = edition ? (
    <>
      <button type="button" className="bouton bouton-discret" onClick={() => setEdition(null)}>
        Annuler
      </button>
      <button type="button" className="bouton bouton-principal" disabled={!edition.titre.trim()} onClick={enregistrer}>
        Enregistrer l&apos;ouvrage
      </button>
    </>
  ) : mode === "gerer" ? (
    <button type="button" className="bouton bouton-principal" onClick={() => setEdition({ ...OUVRAGE_VIDE })}>
      <BookPlus className="size-4" aria-hidden="true" /> Nouvel ouvrage
    </button>
  ) : (
    <>
      <button type="button" className="bouton bouton-discret" onClick={() => setEdition({ ...OUVRAGE_VIDE })}>
        <BookPlus className="size-4" aria-hidden="true" /> Nouvel ouvrage
      </button>
      <button type="button" className="bouton bouton-principal" disabled={!ouvrage || (mode === "citation" && !passage.trim())} onClick={inserer}>
        {mode === "citation" ? "Insérer la citation" : "Insérer la note"}
      </button>
    </>
  );

  return (
    <Fenetre
      titre={edition ? (edition.id ? "Corriger l'ouvrage" : "Nouvel ouvrage") : titre}
      sousTitre={edition ? "Saisi une fois, il sert dans tous tes documents ; corrigé ici, il se corrige partout." : "Tes ouvrages suivent ton compte d'un appareil à l'autre. Les notes et la bibliographie prennent le style choisi dans l'onglet « Page »."}
      surFermer={surFermer}
      largeur={46}
      pied={pied}
    >
      {edition ? (
        <div className="grid gap-3">
          <FormulaireOuvrage fiche={edition} surChangement={(f) => setEdition({ ...f, id: edition.id })} />
          {!edition.id && edition.titre.trim() && ouvrages.some((o) => sansAccents(o.titre.trim()) === sansAccents(edition.titre.trim()) && sansAccents(o.auteur.trim()) === sansAccents(edition.auteur.trim())) && (
            <p className="inspecteur-aide" data-alerte="">
              Cet ouvrage est déjà dans ta bibliothèque : tu peux le choisir dans la liste plutôt que d&apos;en enregistrer un second.
            </p>
          )}
          {edition.titre.trim() && <Apercu fiche={edition} editor={editor} />}
        </div>
      ) : (
        <div className="grid gap-3">
          <label className="calame-biblio-recherche">
            <Search className="size-4" aria-hidden="true" />
            <input className="champ" value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Chercher un auteur, un titre…" aria-label="Chercher dans la bibliothèque" autoFocus />
          </label>
          {ouvrages.length === 0 ? (
            <p className="inspecteur-aide">Ta bibliothèque est vide. « Nouvel ouvrage » pour saisir le premier : il servira dans tous tes documents.</p>
          ) : trouves.length === 0 ? (
            <p className="inspecteur-aide">Aucun ouvrage ne correspond à « {recherche} ».</p>
          ) : (
            <ul className="calame-biblio-choix" role="listbox" aria-label="Ouvrages">
              {trouves.map((o) => (
                <li key={o.id} role="option" aria-selected={choisi === o.id}>
                  <button type="button" className="calame-biblio-ouvrage" aria-pressed={mode === "gerer" ? undefined : choisi === o.id} onClick={() => (mode === "gerer" ? setEdition({ ...o }) : setChoisi(o.id))}>
                    <span className="calame-biblio-titre">{o.titre}</span>
                    <span className="calame-biblio-meta">{[o.auteur.split(";")[0], o.annee].filter(Boolean).join(", ") || "Auteur à préciser"}</span>
                  </button>
                  {aRetirer === o.id ? (
                    <span className="calame-biblio-confirmer">
                      Retirer ?
                      <button
                        type="button"
                        className="bouton bouton-discret"
                        onClick={() => {
                          supprimerOuvrage(o.id);
                          setARetirer(null);
                          if (choisi === o.id) setChoisi(null);
                        }}
                      >
                        Oui
                      </button>
                      <button type="button" className="bouton bouton-discret" onClick={() => setARetirer(null)}>
                        Non
                      </button>
                    </span>
                  ) : (
                    <span className="calame-biblio-actions">
                      <button type="button" className="calame-icone" onClick={() => setEdition({ ...o })} aria-label={`Corriger « ${o.titre} »`} title="Corriger">
                        <Pencil className="size-4" aria-hidden="true" />
                      </button>
                      <button type="button" className="calame-icone" onClick={() => setARetirer(o.id)} aria-label={`Retirer « ${o.titre} » de la bibliothèque`} title="Retirer">
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
          {mode !== "gerer" && ouvrage && (
            <div className="grid gap-2">
              {mode === "citation" && (
                <label className="inspecteur-reglage">
                  <span className="inspecteur-libelle">Passage cité</span>
                  <textarea className="champ" rows={4} value={passage} onChange={(e) => setPassage(e.target.value)} placeholder="Recopie le passage exact ; une ligne vide sépare deux paragraphes." />
                </label>
              )}
              <label className="inspecteur-reglage">
                <span className="inspecteur-libelle">Page(s)</span>
                <input className="champ" value={page} onChange={(e) => setPage(e.target.value.slice(0, 20))} placeholder="42 ou 42-45" inputMode="text" />
              </label>
              <Apercu fiche={ouvrage} editor={editor} page={page.trim()} />
            </div>
          )}
        </div>
      )}
    </Fenetre>
  );
}

/* ---------- Carte de lien et vidéo YouTube ---------- */

type ReponseApercu = { apercu: Record<string, string>; image: { type: string; donnees: string } | null; erreur?: string };

/** Un lien web présenté en carte (titre, description, vignette), ou une vidéo YouTube avec sa vignette. */
export function DialogueLienWeb({ editor, youtube, surFermer }: { editor: Editor; youtube: boolean; surFermer: () => void }) {
  const [adresse, setAdresse] = useState("");
  const [etat, setEtat] = useState<{ chargement: boolean; erreur: string; horsLigne: boolean }>({ chargement: false, erreur: "", horsLigne: false });

  const inserer = (attrs: Record<string, unknown>) => {
    editor.chain().focus().insertContent({ type: "lienCarte", attrs }).run();
    surFermer();
  };
  const minimal = () => {
    const yt = infosYoutube(adresse);
    inserer({ url: adresse.trim(), titre: yt ? "Vidéo YouTube" : domaine(adresse) || adresse.trim(), genre: yt ? "youtube" : "web", video: yt?.video ?? "", liste: yt?.liste ?? "", site: yt ? "YouTube" : domaine(adresse) });
  };
  const preparer = async () => {
    const url = adresse.trim();
    if (!/^https?:\/\/\S+$/i.test(url)) {
      setEtat({ chargement: false, erreur: "Colle une adresse complète, qui commence par https://", horsLigne: false });
      return;
    }
    if (youtube && !infosYoutube(url)) {
      setEtat({ chargement: false, erreur: "Ce n'est pas une adresse de vidéo ou de playlist YouTube.", horsLigne: false });
      return;
    }
    setEtat({ chargement: true, erreur: "", horsLigne: false });
    try {
      const r = await fetch("/api/calame/apercu", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url }) });
      const d = (await r.json()) as ReponseApercu;
      if (!r.ok || !d.apercu) {
        setEtat({ chargement: false, erreur: d.erreur ?? "L'aperçu n'a pas pu être préparé.", horsLigne: true });
        return;
      }
      let fichier: string | null = null;
      if (d.image) {
        const octets = Uint8Array.from(atob(d.image.donnees), (c) => c.charCodeAt(0));
        const extension = d.image.type.split("/")[1] ?? "jpg";
        fichier = (await ajouterFichier(new Blob([octets], { type: d.image.type }), `apercu-${domaine(url) || "lien"}.${extension}`)).id;
      }
      inserer({ ...d.apercu, image: "", fichier });
    } catch {
      setEtat({ chargement: false, erreur: "Pas de connexion : l'aperçu n'a pas pu être préparé.", horsLigne: true });
    }
  };

  return (
    <Fenetre
      titre={youtube ? "Vidéo YouTube" : "Carte de lien"}
      sousTitre={youtube ? "Colle l'adresse d'une vidéo ou d'une playlist : titre, chaîne et vignette se remplissent seuls." : "Colle l'adresse d'une page : titre, description et vignette se remplissent seuls, et restent dans le document."}
      surFermer={surFermer}
      largeur={36}
      pied={
        <>
          {etat.horsLigne && (
            <button type="button" className="bouton bouton-discret" onClick={minimal}>
              Insérer sans aperçu
            </button>
          )}
          <button type="button" className="bouton bouton-principal" disabled={etat.chargement || !adresse.trim()} onClick={() => void preparer()}>
            {etat.chargement ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : "Insérer la carte"}
          </button>
        </>
      }
    >
      <form
        className="grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void preparer();
        }}
      >
        <input className="champ" type="url" value={adresse} onChange={(e) => setAdresse(e.target.value)} placeholder={youtube ? "https://www.youtube.com/watch?v=…" : "https://…"} aria-label="Adresse du lien" autoFocus />
        {etat.erreur && <p className="inspecteur-aide" data-alerte="">{etat.erreur}</p>}
        <p className="inspecteur-aide">Seule la page demandée est visitée, par le serveur du site ; la vignette est rangée sur ton appareil avec tes images.</p>
      </form>
    </Fenetre>
  );
}

/* ---------- Glossaire ---------- */

/** Expliquer au glossaire le terme sélectionné : terme, translittération, sens. */
export function DialogueGlossaire({ editor, surFermer }: { editor: Editor; surFermer: () => void }) {
  const [depart] = useState(() => {
    const { from, to } = editor.state.selection;
    const selection = editor.state.doc.textBetween(from, to, " ").trim();
    const marque = editor.state.doc.rangeHasMark(from, to, editor.schema.marks.termeGlossaire) ? editor.getAttributes("termeGlossaire") : null;
    const entree = String(marque?.entree || selection).slice(0, 80);
    const connu = entree ? termeConnu(editor.state.doc, entree) : undefined;
    return { selection, marque: Boolean(marque), entree, translitteration: String(marque?.translitteration || connu?.translitteration || ""), sens: String(marque?.sens || connu?.sens || "") };
  });
  const [entree, setEntree] = useState(depart.entree);
  const [translitteration, setTranslitteration] = useState(depart.translitteration);
  const [sens, setSens] = useState(depart.sens);

  const valider = () => {
    if (!entree.trim()) return;
    if (marquerTerme(editor, { entree, translitteration, sens })) surFermer();
  };

  return (
    <Fenetre
      titre="Expliquer au glossaire"
      sousTitre="Le terme reste dans le texte ; son sens s'affiche au survol et dans le bloc « Glossaire », rassemblé tout seul."
      surFermer={surFermer}
      largeur={34}
      pied={
        <>
          {depart.marque && (
            <button
              type="button"
              className="bouton bouton-discret"
              onClick={() => {
                editor.chain().focus().unsetMark("termeGlossaire").run();
                surFermer();
              }}
            >
              Retirer du glossaire
            </button>
          )}
          <button type="button" className="bouton bouton-principal" disabled={!depart.selection || !entree.trim()} onClick={valider}>
            {depart.marque ? "Mettre à jour" : "Ajouter au glossaire"}
          </button>
        </>
      }
    >
      {!depart.selection ? (
        <p className="inspecteur-aide" data-alerte="">
          Sélectionne d&apos;abord le terme dans le texte (par exemple « tawḥīd » ou « توحيد »), puis reviens ici.
        </p>
      ) : (
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            valider();
          }}
        >
          <label className="inspecteur-reglage">
            <span className="inspecteur-libelle">Terme (tel qu&apos;il apparaît au glossaire)</span>
            <input className="champ" dir="auto" value={entree} onChange={(e) => setEntree(e.target.value)} autoFocus />
          </label>
          <label className="inspecteur-reglage">
            <span className="inspecteur-libelle">Translittération</span>
            <input className="champ" value={translitteration} onChange={(e) => setTranslitteration(e.target.value)} placeholder="tawḥīd" />
          </label>
          <label className="inspecteur-reglage">
            <span className="inspecteur-libelle">Sens</span>
            <textarea className="champ" rows={3} value={sens} onChange={(e) => setSens(e.target.value)} placeholder="L'unicité de Dieu, fondement de la foi." />
          </label>
        </form>
      )}
    </Fenetre>
  );
}

/* ---------- Citer un article HaqqReason ---------- */

type ResultatArticle = { id: string; titre: string; fenetre: string; chemin: string; type: string };

/** Chercher un article de la bibliothèque HaqqReason et le citer (extrait, titre, lien) sans quitter le texte. */
export function DialogueArticle({ editor, surFermer }: { editor: Editor; surFermer: () => void }) {
  const [requete, setRequete] = useState("");
  const [etat, setEtat] = useState<{ chargement: boolean; erreur: string; resultats: ResultatArticle[]; verrouille: boolean }>({ chargement: false, erreur: "", resultats: [], verrouille: false });
  const [choisi, setChoisi] = useState<ResultatArticle | null>(null);
  const [extrait, setExtrait] = useState("");

  useEffect(() => {
    const q = requete.trim();
    if (q.length < 2) return;
    let vivant = true;
    const minuteur = window.setTimeout(async () => {
      setEtat((e) => ({ ...e, chargement: true, erreur: "" }));
      try {
        const r = await fetch(`/api/recherche?q=${encodeURIComponent(q)}&types=article&limite=8`, { cache: "no-store" });
        const d = (await r.json()) as { resultats?: ResultatArticle[]; verrouille?: boolean; erreur?: boolean | string };
        if (!vivant) return;
        setEtat({ chargement: false, erreur: d.erreur === true ? "La recherche n'a pas répondu. Réessaie dans un instant." : "", resultats: (d.resultats ?? []).filter((x) => x.type === "article"), verrouille: Boolean(d.verrouille) });
      } catch {
        if (vivant) setEtat({ chargement: false, erreur: "Pas de connexion : la recherche n'a pas pu se faire.", resultats: [], verrouille: false });
      }
    }, 250);
    return () => {
      vivant = false;
      window.clearTimeout(minuteur);
    };
  }, [requete]);

  const inserer = () => {
    if (!choisi) return;
    const lien = new URL(choisi.chemin, window.location.origin).href;
    const passage = extrait.trim();
    const contenu = [
      ...(passage ? [{ type: "paragraph", content: [{ type: "text", text: `« ${passage} »` }] }] : []),
      {
        type: "paragraph",
        content: [
          { type: "text", text: "— " },
          { type: "text", text: choisi.titre, marks: [{ type: "italic" }, { type: "link", attrs: { href: lien } }] },
          { type: "text", text: ", HaqqReason." },
        ],
      },
    ];
    editor.chain().focus().insertContent([{ type: "blockquote", content: contenu }, { type: "paragraph" }]).run();
    surFermer();
  };

  return (
    <Fenetre
      titre="Citer un article HaqqReason"
      sousTitre="Cherche un article de la bibliothèque : son titre, son lien et l'extrait choisi entrent dans ton texte."
      surFermer={surFermer}
      largeur={42}
      pied={
        <button type="button" className="bouton bouton-principal" disabled={!choisi} onClick={inserer}>
          Insérer la citation
        </button>
      }
    >
      <div className="grid gap-3">
        <label className="calame-biblio-recherche">
          {etat.chargement ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Search className="size-4" aria-hidden="true" />}
          <input className="champ" value={requete} onChange={(e) => setRequete(e.target.value)} placeholder="Trinité, preuve cosmologique, abrogation…" aria-label="Chercher un article" autoFocus />
        </label>
        {etat.erreur && <p className="inspecteur-aide" data-alerte="">{etat.erreur}</p>}
        {etat.verrouille && <p className="inspecteur-aide">Les articles réservés demandent d&apos;abord le mot de passe des modules (page « Accès »).</p>}
        {requete.trim().length >= 2 && !etat.chargement && !etat.erreur && !etat.verrouille && etat.resultats.length === 0 && <p className="inspecteur-aide">Aucun article ne correspond.</p>}
        {etat.resultats.length > 0 && (
          <ul className="calame-biblio-choix" role="listbox" aria-label="Articles">
            {etat.resultats.map((r) => (
              <li key={r.id} role="option" aria-selected={choisi?.id === r.id}>
                <button
                  type="button"
                  className="calame-biblio-ouvrage"
                  aria-pressed={choisi?.id === r.id}
                  onClick={() => {
                    setChoisi(r);
                    setExtrait(r.fenetre ?? "");
                  }}
                >
                  <span className="calame-biblio-titre">{r.titre}</span>
                  {r.fenetre && <span className="calame-biblio-meta">{r.fenetre.slice(0, 140)}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
        {choisi && (
          <label className="inspecteur-reglage">
            <span className="inspecteur-libelle">Extrait cité (à raccourcir ou laisser vide)</span>
            <textarea className="champ" rows={4} value={extrait} onChange={(e) => setExtrait(e.target.value)} />
          </label>
        )}
      </div>
    </Fenetre>
  );
}
