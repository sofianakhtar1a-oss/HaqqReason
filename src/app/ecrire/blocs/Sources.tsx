"use client";

import { Extension, Mark, mergeAttributes, Node, type Editor } from "@tiptap/core";
import type { Node as NoeudPM } from "@tiptap/pm/model";
import { Plugin, PluginKey, type Transaction } from "@tiptap/pm/state";
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";
import { ExternalLink, Globe, Play } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { abonnerBibliotheque, cleBibliographique, lireBibliotheque, OUVRAGE_VIDE, referenceOuvrage, referenceTexte, type Ouvrage, type StyleCitation } from "@/lib/atelier/bibliotheque";
import { cleDeTri } from "@/lib/atelier/coran";
import { RECUEILS } from "@/lib/atelier/hadiths";
import { domaine } from "@/lib/liens-web";
import { useMiseEnPage } from "../pages-store";
import { useUrlLocale } from "../VuesLocales";

/**
 * Le Calame — les sources d'un travail : la bibliographie tirée des notes, l'index des versets
 * et des hadiths cités, le glossaire des termes arabes, et les cartes de lien gardées sur
 * l'appareil. Tout se met à jour seul quand le texte, la bibliothèque ou le style changent.
 */

type Fiche = Omit<Ouvrage, "id" | "q">;

/** Le style des références du document, posé par l'atelier (réglages de la page). */
export const CLE_SOURCES = new PluginKey<{ style: StyleCitation }>("sourcesCalame");

/** Préfixes des entrées que la mise en page publie avec leurs pages (index des sources, glossaire). */
export const PREFIXE_VERSET = "\u0001verset\u0001";
export const PREFIXE_HADITH = "\u0001hadith\u0001";
export const PREFIXE_GLOSSAIRE = "\u0001glossaire\u0001";

const attribut = (nom: string, data: string) => ({
  [nom]: {
    default: null,
    parseHTML: (el: HTMLElement) => el.getAttribute(data),
    renderHTML: (a: Record<string, unknown>) => (a[nom] ? { [data]: String(a[nom]) } : {}),
  },
});

export const SourcesCalame = Extension.create({
  name: "sourcesCalame",
  addGlobalAttributes() {
    return [
      // Une note tirée de la bibliothèque garde l'ouvrage et la page : elle se réécrit seule quand le style change.
      { types: ["note"], attributes: { ...attribut("ouvrage", "data-ouvrage"), ...attribut("pageOuvrage", "data-page-ouvrage"), ...attribut("refAuto", "data-ref-auto") } },
      // La vignette d'une carte de lien, rangée sur l'appareil comme les images.
      { types: ["lienCarte"], attributes: attribut("fichier", "data-fichier") },
    ];
  },
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: CLE_SOURCES,
        state: {
          init: () => ({ style: "chicago" as StyleCitation }),
          apply: (tr, avant) => (tr.getMeta(CLE_SOURCES) as { style: StyleCitation } | undefined) ?? avant,
        },
      }),
    ];
  },
});

export const styleDe = (editor: Editor): StyleCitation => CLE_SOURCES.getState(editor.state)?.style ?? "chicago";

/**
 * Réécrit les notes tirées de la bibliothèque dans le style choisi (ou après la correction d'un
 * ouvrage). Une note que l'auteur a retouchée à la main n'est plus touchée.
 */
export function reformaterReferences(editor: Editor): void {
  if (editor.isDestroyed || !editor.isEditable) return;
  const style = styleDe(editor);
  const biblio = lireBibliotheque();
  const tr = editor.state.tr;
  editor.state.doc.descendants((n, pos) => {
    if (n.type.name !== "note" || !n.attrs.ouvrage) return true;
    const o = biblio.find((x) => x.id === n.attrs.ouvrage);
    const auto = String(n.attrs.refAuto ?? "");
    if (!o || (auto && auto !== n.attrs.texte)) return false;
    const texte = referenceTexte(o, style, String(n.attrs.pageOuvrage ?? ""));
    if (texte !== n.attrs.texte) tr.setNodeMarkup(pos, undefined, { ...n.attrs, texte, refAuto: texte });
    return false;
  });
  if (!tr.docChanged) return;
  tr.setMeta("addToHistory", false);
  editor.view.dispatch(tr);
}

/** Pose le style des références du document (et remet les notes à ce style). */
export function reglerSources(editor: Editor, style: StyleCitation): void {
  if (editor.isDestroyed) return;
  if (styleDe(editor) !== style) {
    const tr = editor.state.tr.setMeta(CLE_SOURCES, { style });
    tr.setMeta("addToHistory", false);
    editor.view.dispatch(tr);
  }
  reformaterReferences(editor);
}

/** La note de bas de page d'un ouvrage de la bibliothèque, à la page donnée. */
export function noteOuvrage(editor: Editor, o: Ouvrage, page: string) {
  const texte = referenceTexte(o, styleDe(editor), page.trim());
  return { type: "note", attrs: { texte, ouvrage: o.id, pageOuvrage: page.trim() || null, refAuto: texte } };
}

export function insererReference(editor: Editor, o: Ouvrage, page: string): boolean {
  return editor.chain().focus().insertContent(noteOuvrage(editor, o, page)).run();
}

/** Le passage cité, en retrait, suivi de l'appel de note vers l'ouvrage. */
export function insererCitation(editor: Editor, o: Ouvrage, page: string, passage: string): boolean {
  const paragraphes = passage
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);
  if (paragraphes.length === 0) return false;
  const contenu = paragraphes.map((p, i) => ({
    type: "paragraph",
    content: [{ type: "text", text: i === 0 ? `« ${p}` : p }, ...(i === paragraphes.length - 1 ? [{ type: "text", text: " »" }, noteOuvrage(editor, o, page)] : [])],
  }));
  return editor.chain().focus().insertContent([{ type: "blockquote", content: contenu }, { type: "paragraph" }]).run();
}

/* ---------- Lecture du document ---------- */

function useLecture<T>(editor: Editor, lire: () => T): T {
  const [valeur, setValeur] = useState<T>(lire);
  useEffect(() => {
    const relire = ({ transaction }: { transaction: Transaction }) => {
      if (transaction.docChanged || transaction.getMeta(CLE_SOURCES) !== undefined) setValeur(lire());
    };
    editor.on("transaction", relire);
    return () => {
      editor.off("transaction", relire);
    };
  }, [editor]); // eslint-disable-line react-hooks/exhaustive-deps
  return valeur;
}

const AUCUN: Ouvrage[] = [];
const useBibliotheque = () => useSyncExternalStore(abonnerBibliotheque, lireBibliotheque, () => AUCUN);

/** Les ouvrages appelés en note, dans l'ordre de leur première citation. */
export function ouvragesCites(doc: NoeudPM): string[] {
  const ids: string[] = [];
  doc.descendants((n) => {
    if (n.type.name === "note" && n.attrs.ouvrage && !ids.includes(String(n.attrs.ouvrage))) ids.push(String(n.attrs.ouvrage));
    return true;
  });
  return ids;
}

/** Les blocs « Source » écrits à la main deviennent des entrées de bibliographie. */
export function sourcesLibres(doc: NoeudPM): Fiche[] {
  const fiches: Fiche[] = [];
  doc.descendants((n) => {
    if (n.type.name !== "source") return true;
    const a = n.attrs as Record<string, string>;
    if (a.ouvrage || a.auteur) fiches.push({ ...OUVRAGE_VIDE, auteur: a.auteur ?? "", titre: a.ouvrage ?? "", editeur: a.edition ?? "", url: a.lien ?? "" });
    return false;
  });
  return fiches;
}

export function entreesBibliographie(cites: Ouvrage[], libres: Fiche[]): Fiche[] {
  const vues = new Set<string>();
  const toutes: Fiche[] = [];
  for (const f of [...cites, ...libres]) {
    const cle = `${cleBibliographique(f)}\u0000${f.editeur}`.toLowerCase();
    if (vues.has(cle)) continue;
    vues.add(cle);
    toutes.push(f);
  }
  return toutes.sort((a, b) => cleBibliographique(a).localeCompare(cleBibliographique(b), "fr", { sensitivity: "base" }));
}

/* ---------- Bibliographie ---------- */

function VueBibliographie({ node, editor, selected, updateAttributes }: NodeViewProps) {
  const style = useLecture(editor, () => styleDe(editor));
  const cites = useLecture(editor, () => ouvragesCites(editor.state.doc).join("\n"));
  const libres = useLecture(editor, () => JSON.stringify(sourcesLibres(editor.state.doc)));
  const bibliotheque = useBibliotheque();
  const toute = node.attrs.portee === "toute";
  const titre = String(node.attrs.titre || "Bibliographie");
  const ids = cites ? cites.split("\n") : [];
  const choisis = toute ? bibliotheque : ids.map((id) => bibliotheque.find((o) => o.id === id)).filter((o): o is Ouvrage => Boolean(o));
  const entrees = entreesBibliographie(choisis, JSON.parse(libres) as Fiche[]);
  return (
    <NodeViewWrapper as="section" className="calame-bibliographie" data-selectionne={selected || undefined} data-drag-handle="" contentEditable={false} aria-label={titre}>
      <p className="calame-sommaire-titre">{titre}</p>
      {entrees.length === 0 ? (
        <p className="calame-sommaire-vide">
          {toute ? "Ta bibliothèque est vide : ajoute des ouvrages (barre de commande, « Bibliothèque »)." : "Cite des ouvrages en note (« Référence à un ouvrage ») ou ajoute des blocs « Source » : ils viendront ici, classés par auteur."}
        </p>
      ) : (
        <ul className="calame-biblio-liste">
          {entrees.map((f, i) => (
            <li key={`${cleBibliographique(f)}-${i}`} className="calame-biblio-entree">
              {referenceOuvrage(f, style).map((m, k) => (m.italique ? <i key={k}>{m.texte}</i> : <span key={k}>{m.texte}</span>))}
            </li>
          ))}
        </ul>
      )}
      {selected && editor.isEditable && (
        <div className="calame-bloc-reglages sans-impression">
          <input className="champ" value={String(node.attrs.titre ?? "")} onChange={(e) => updateAttributes({ titre: e.target.value.slice(0, 80) })} placeholder="Bibliographie" aria-label="Titre de la bibliographie" />
          <div className="inspecteur-choix" role="group" aria-label="Ouvrages présentés">
            <button type="button" className="puce-module" aria-pressed={!toute} onClick={() => updateAttributes({ portee: "citees" })}>
              Ceux cités ici
            </button>
            <button type="button" className="puce-module" aria-pressed={toute} onClick={() => updateAttributes({ portee: "toute" })}>
              Toute la bibliothèque
            </button>
          </div>
          <p className="inspecteur-aide">Le style (Chicago, APA, ISO 690) se règle dans l&apos;onglet « Page », section « Composition du texte ».</p>
        </div>
      )}
    </NodeViewWrapper>
  );
}

export const Bibliographie = Node.create({
  name: "bibliographie",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      titre: { default: "Bibliographie", parseHTML: (el) => el.getAttribute("data-titre") ?? "Bibliographie", renderHTML: (a) => ({ "data-titre": String(a.titre ?? "") }) },
      portee: { default: "citees", parseHTML: (el) => el.getAttribute("data-portee") ?? "citees", renderHTML: (a) => ({ "data-portee": String(a.portee ?? "citees") }) },
    };
  },
  parseHTML() {
    return [{ tag: "section.calame-bibliographie" }];
  },
  renderHTML({ HTMLAttributes, node }) {
    return ["section", mergeAttributes(HTMLAttributes, { class: "calame-bibliographie" }), String(node.attrs.titre || "Bibliographie")];
  },
  addNodeView() {
    return ReactNodeViewRenderer(VueBibliographie);
  },
});

/* ---------- Index des versets et des hadiths ---------- */

type EntreeSource = { cle: string; libelle: string };

export function versetsDuDocument(doc: NoeudPM): EntreeSource[] {
  const vus = new Map<string, EntreeSource>();
  doc.descendants((n) => {
    if (n.type.name === "verset") {
      const ref = String(n.attrs.reference ?? "").trim();
      if (ref && !vus.has(ref)) vus.set(ref, { cle: `${PREFIXE_VERSET}Coran, ${ref}`, libelle: ref });
      return false;
    }
    return true;
  });
  return [...vus.values()].sort((a, b) => {
    const [sa, va] = cleDeTri(a.libelle);
    const [sb, vb] = cleDeTri(b.libelle);
    return sa - sb || va - vb || a.libelle.localeCompare(b.libelle, "fr");
  });
}

export function hadithsDuDocument(doc: NoeudPM): EntreeSource[] {
  const vus = new Map<string, EntreeSource & { rang: number; numero: number }>();
  doc.descendants((n) => {
    if (n.type.name !== "hadith") return true;
    const { recueil, numero } = n.attrs as { recueil: string; numero: string };
    if (!recueil && !numero) return false;
    const legende = [recueil || "Recueil à préciser", numero ? `n° ${numero}` : ""].filter(Boolean).join(", ");
    if (!vus.has(legende)) {
      const rang = RECUEILS.findIndex((r) => r.nom === recueil || r.cle === recueil);
      vus.set(legende, { cle: `${PREFIXE_HADITH}${legende}`, libelle: legende, rang: rang < 0 ? 99 : rang, numero: Number(numero) || 0 });
    }
    return false;
  });
  return [...vus.values()].sort((a, b) => a.rang - b.rang || a.libelle.split(",")[0].localeCompare(b.libelle.split(",")[0], "fr") || a.numero - b.numero).map(({ cle, libelle }) => ({ cle, libelle }));
}

function VueIndexSources({ node, editor, selected, updateAttributes }: NodeViewProps) {
  const mep = useMiseEnPage(editor);
  const listes = useLecture(editor, () => JSON.stringify({ versets: versetsDuDocument(editor.state.doc), hadiths: hadithsDuDocument(editor.state.doc) }));
  const hadiths = node.attrs.genre === "hadiths";
  const entrees = (JSON.parse(listes) as { versets: EntreeSource[]; hadiths: EntreeSource[] })[hadiths ? "hadiths" : "versets"];
  const titre = hadiths ? "Index des hadiths" : "Index des versets";
  return (
    <NodeViewWrapper as="section" className="calame-index calame-index-sources" data-selectionne={selected || undefined} data-drag-handle="" contentEditable={false} aria-label={titre}>
      <p className="calame-sommaire-titre">{titre}</p>
      {entrees.length === 0 ? (
        <p className="calame-sommaire-vide">{hadiths ? "Insère des hadiths (« Hadith par sa référence ») : ils viendront ici, par recueil et par numéro, avec leurs pages." : "Insère des versets (« Verset par sa référence ») : ils viendront ici, dans l'ordre du Coran, avec leurs pages."}</p>
      ) : (
        <div className="calame-index-colonnes">
          {entrees.map((e) => {
            const pages = mep.index.get(e.cle) ?? [];
            return (
              // Une référence contient déjà des nombres : la page vient après des points de conduite, précédée de « p. ».
              <p key={e.cle} className="calame-index-ligne">
                <span>{e.libelle}</span>
                {pages.length > 0 && (
                  <>
                    <span className="calame-index-points" aria-hidden="true" />
                    <span className="calame-index-pages">
                      {pages.length > 1 ? "pp." : "p."}&nbsp;{pages.join(", ")}
                    </span>
                  </>
                )}
              </p>
            );
          })}
        </div>
      )}
      {selected && editor.isEditable && (
        <div className="calame-bloc-reglages sans-impression">
          <div className="inspecteur-choix" role="group" aria-label="Index">
            <button type="button" className="puce-module" aria-pressed={!hadiths} onClick={() => updateAttributes({ genre: "versets" })}>
              Versets
            </button>
            <button type="button" className="puce-module" aria-pressed={hadiths} onClick={() => updateAttributes({ genre: "hadiths" })}>
              Hadiths
            </button>
          </div>
        </div>
      )}
    </NodeViewWrapper>
  );
}

export const IndexSources = Node.create({
  name: "indexSources",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return { genre: { default: "versets", parseHTML: (el) => el.getAttribute("data-genre") ?? "versets", renderHTML: (a) => ({ "data-genre": String(a.genre ?? "versets") }) } };
  },
  parseHTML() {
    return [{ tag: "section.calame-index-sources" }];
  },
  renderHTML({ HTMLAttributes, node }) {
    return ["section", mergeAttributes(HTMLAttributes, { class: "calame-index calame-index-sources" }), node.attrs.genre === "hadiths" ? "Index des hadiths" : "Index des versets"];
  },
  addNodeView() {
    return ReactNodeViewRenderer(VueIndexSources);
  },
});

/* ---------- Glossaire ---------- */

/** Un terme expliqué au glossaire (توحيد, « tawḥīd » : l'unicité de Dieu). Le sens s'affiche au survol. */
export const TermeGlossaire = Mark.create({
  name: "termeGlossaire",
  inclusive: false,
  addAttributes() {
    return {
      entree: { default: "", parseHTML: (el) => el.getAttribute("data-glossaire") ?? "", renderHTML: (a) => ({ "data-glossaire": String(a.entree ?? "") }) },
      translitteration: { default: "", parseHTML: (el) => el.getAttribute("data-translit") ?? "", renderHTML: (a) => (a.translitteration ? { "data-translit": String(a.translitteration) } : {}) },
      sens: { default: "", parseHTML: (el) => el.getAttribute("data-sens") ?? "", renderHTML: (a) => (a.sens ? { "data-sens": String(a.sens), title: [a.translitteration, a.sens].filter(Boolean).join(" : ") } : {}) },
    };
  },
  parseHTML() {
    return [{ tag: "span[data-glossaire]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { class: "calame-terme" }), 0];
  },
});

const sansAccents = (t: string) => t.normalize("NFD").replace(/[̀-ͯʻʼʾʿ'’ʿʾ]/g, "");

export type EntreeGlossaire = { entree: string; translitteration: string; sens: string };

/** Les termes du glossaire, par entrée (la première explication donnée l'emporte), dans l'ordre alphabétique. */
export function entreesGlossaire(doc: NoeudPM): EntreeGlossaire[] {
  const termes = new Map<string, EntreeGlossaire>();
  doc.descendants((n) => {
    if (!n.isText) return true;
    const m = n.marks.find((x) => x.type.name === "termeGlossaire");
    if (m) {
      const entree = (String(m.attrs.entree ?? "") || n.text || "").trim();
      const avant = termes.get(entree);
      const sens = String(m.attrs.sens ?? "").trim();
      const translitteration = String(m.attrs.translitteration ?? "").trim();
      if (entree && !avant) termes.set(entree, { entree, translitteration, sens });
      else if (avant) termes.set(entree, { entree, translitteration: avant.translitteration || translitteration, sens: avant.sens || sens });
    }
    return false;
  });
  // Classées par leur forme latine ; l'article arabe ne compte pas (« al-tawḥīd » se range à T).
  const cle = (e: EntreeGlossaire) => sansAccents(e.translitteration || e.entree).replace(/^(al|an|ar|as|ash|at|ad|adh|az|el)[-\s]/i, "");
  return [...termes.values()].sort((a, b) => cle(a).localeCompare(cle(b), "fr", { sensitivity: "base" }));
}

/** Ce qui a déjà été dit d'un terme ailleurs dans le document (pour ne pas le réécrire). */
export function termeConnu(doc: NoeudPM, entree: string): EntreeGlossaire | undefined {
  return entreesGlossaire(doc).find((e) => e.entree.toLowerCase() === entree.trim().toLowerCase());
}

export function marquerTerme(editor: Editor, t: EntreeGlossaire): boolean {
  const { empty } = editor.state.selection;
  if (empty) return false;
  return editor.chain().focus().setMark("termeGlossaire", { entree: t.entree.trim().slice(0, 80), translitteration: t.translitteration.trim().slice(0, 80), sens: t.sens.trim().slice(0, 400) }).run();
}

function VueGlossaire({ node, editor, selected, updateAttributes }: NodeViewProps) {
  const mep = useMiseEnPage(editor);
  const termes = useLecture(editor, () => JSON.stringify(entreesGlossaire(editor.state.doc)));
  const liste = JSON.parse(termes) as EntreeGlossaire[];
  const titre = String(node.attrs.titre || "Glossaire");
  return (
    <NodeViewWrapper as="section" className="calame-glossaire" data-selectionne={selected || undefined} data-drag-handle="" contentEditable={false} aria-label={titre}>
      <p className="calame-sommaire-titre">{titre}</p>
      {liste.length === 0 ? (
        <p className="calame-sommaire-vide">Sélectionne un terme dans le texte, puis « Expliquer au glossaire » (barre de commande) : il viendra ici avec son sens.</p>
      ) : (
        <dl>
          {liste.map((t) => (
            <div key={t.entree} className="calame-glossaire-entree">
              <dt>
                <span dir="auto">{t.entree}</span>
                {t.translitteration && t.translitteration !== t.entree && <span className="calame-glossaire-translit"> ({t.translitteration})</span>}
              </dt>
              <dd>
                {t.sens || <span className="calame-sommaire-vide">sens à préciser</span>}
                {node.attrs.pages !== false && (mep.index.get(`${PREFIXE_GLOSSAIRE}${t.entree}`) ?? []).length > 0 && (
                  <span className="calame-index-pages"> ({(mep.index.get(`${PREFIXE_GLOSSAIRE}${t.entree}`) ?? []).length > 1 ? "pages" : "page"} {(mep.index.get(`${PREFIXE_GLOSSAIRE}${t.entree}`) ?? []).join(", ")})</span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {selected && editor.isEditable && (
        <div className="calame-bloc-reglages sans-impression">
          <input className="champ" value={String(node.attrs.titre ?? "")} onChange={(e) => updateAttributes({ titre: e.target.value.slice(0, 80) })} placeholder="Glossaire" aria-label="Titre du glossaire" />
          <label className="inspecteur-bascule">
            <input type="checkbox" checked={node.attrs.pages !== false} onChange={(e) => updateAttributes({ pages: e.target.checked })} />
            <span>Indiquer les pages où chaque terme apparaît</span>
          </label>
        </div>
      )}
    </NodeViewWrapper>
  );
}

export const Glossaire = Node.create({
  name: "glossaire",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      titre: { default: "Glossaire", parseHTML: (el) => el.getAttribute("data-titre") ?? "Glossaire", renderHTML: (a) => ({ "data-titre": String(a.titre ?? "") }) },
      pages: { default: true, parseHTML: (el) => el.getAttribute("data-pages") !== "non", renderHTML: (a) => (a.pages === false ? { "data-pages": "non" } : {}) },
    };
  },
  parseHTML() {
    return [{ tag: "section.calame-glossaire" }];
  },
  renderHTML({ HTMLAttributes, node }) {
    return ["section", mergeAttributes(HTMLAttributes, { class: "calame-glossaire" }), String(node.attrs.titre || "Glossaire")];
  },
  addNodeView() {
    return ReactNodeViewRenderer(VueGlossaire);
  },
});

/* ---------- Carte de lien (vignette sur l'appareil) ---------- */

/** La carte d'un lien dans le Calame : la vignette vient de l'appareil (ou de YouTube), jamais du site d'origine. */
export function VueLienCarteCalame({ node, selected }: NodeViewProps) {
  const a = node.attrs as Record<string, string>;
  const locale = useUrlLocale(a.fichier ?? "");
  const youtube = a.genre === "youtube";
  const source = locale || (youtube && a.video ? `https://i.ytimg.com/vi/${a.video}/hqdefault.jpg` : a.image ? `/fichiers/${a.image}` : "");
  // Hors ligne, la vignette distante ne vient pas : l'icône la remplace au lieu d'une image cassée.
  const [cassee, setCassee] = useState("");
  const image = source && cassee !== source ? source : "";
  const playlist = youtube && a.liste && !a.video;
  return (
    <NodeViewWrapper className="carte-lien-conteneur" data-selectionne={selected || undefined} data-drag-handle="" contentEditable={false}>
      <span className="carte-lien" data-genre={a.genre || "web"}>
        <span className="carte-lien-image" data-vide={!image || undefined}>
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" loading="lazy" decoding="async" onError={() => setCassee(image)} />
          ) : (
            <span className="carte-lien-sans-image" aria-hidden="true">
              {youtube ? <Play className="size-10" /> : <Globe className="size-10" />}
            </span>
          )}
          {youtube && (
            <span className="carte-lien-lecture" aria-hidden="true">
              <Play className="size-6" fill="currentColor" />
            </span>
          )}
          {playlist && <span className="carte-lien-pastille">Playlist</span>}
        </span>
        <span className="carte-lien-texte">
          <span className="carte-lien-site">
            {youtube ? <Play className="size-3" fill="currentColor" aria-hidden="true" /> : <Globe className="size-4" aria-hidden="true" />}
            {youtube ? (a.auteur ? `${a.auteur} sur YouTube` : "YouTube") : a.site || domaine(a.url ?? "")}
          </span>
          <span className="carte-lien-titre">{a.titre || a.url}</span>
          {a.description && <span className="carte-lien-description">{a.description}</span>}
          <span className="carte-lien-url">{(a.url ?? "").replace(/^https?:\/\/(www\.)?/, "")}</span>
        </span>
      </span>
      {a.url && (
        <a className="calame-lien-ouvrir sans-impression" href={a.url} target="_blank" rel="noopener noreferrer nofollow" aria-label={`Ouvrir ${a.titre || a.url} dans un nouvel onglet`} title="Ouvrir dans un nouvel onglet">
          <ExternalLink className="size-4" aria-hidden="true" />
        </a>
      )}
    </NodeViewWrapper>
  );
}
