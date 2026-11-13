"use client";

import type { Editor } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { EditorContent, ReactNodeViewRenderer, useEditor, type NodeViewProps } from "@tiptap/react";
import { Node as NoeudTiptap, type AnyExtension } from "@tiptap/core";
import { Placeholder } from "@tiptap/extensions";
import { AlertTriangle, CheckCircle2, CloudOff, History, LoaderCircle, ScanEye } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { BadgeStatut } from "@/components/BadgeStatut";
import { compterMots, controlerDocument, texteDuDocument, type Alerte } from "@/lib/document-schema";
import { extensionsDocument } from "@/lib/editeur/extensions";
import { LIMITES } from "@/lib/validation";
import { changerStatutArticle, enregistrerCommeModele, sauvegarderArticle, type ResultatSauvegarde } from "../../contenu-actions";
import { envoyerFichier, extraireTextePdf } from "@/lib/client/envoi";
import { BarreOutils } from "./BarreOutils";
import { actionsSpeciales } from "./commandes";
import { ListeSlash, MenuSlash } from "./MenuSlash";
import { MenuBulle } from "./MenuBulle";
import { PanneauBloc } from "./PanneauBloc";
import { VueCitationOuvrage, VueLienCarte, VueLogique, VueReference, VueSchema, VueSommaire, VueSophisme } from "./VuesBlocs";
import { creerApercu } from "../../apercu-actions";
import { ChoixSource } from "../ateliers/ChoixSource";
import { Modale } from "../ateliers/Modale";

/** Blocs affichés dans l'éditeur par un composant React (aperçu fidèle, atelier). */
const VUES: Record<string, (p: NodeViewProps) => React.ReactNode> = {
  schema: VueSchema,
  logique: VueLogique,
  lienCarte: VueLienCarte,
  sophisme: VueSophisme,
  reference: VueReference,
  citationOuvrage: VueCitationOuvrage,
  sommaire: VueSommaire,
};
function avecVues(extensions: AnyExtension[]): AnyExtension[] {
  return extensions.map((e) => {
    const Vue = VUES[e.name];
    if (!Vue) return e;
    return (e as NoeudTiptap).extend({ addNodeView: () => ReactNodeViewRenderer(Vue as Parameters<typeof ReactNodeViewRenderer>[0]) });
  });
}

type Props = {
  article: {
    id: string;
    titre: string;
    resume: string;
    contenu: unknown;
    etiquettes: string;
    statut: "brouillon" | "publie";
    updated_at: string;
  };
  visibilite: string;
  enLigne: string | null;
  /** Actions préparées par le serveur (déplacer, dupliquer, corbeille). */
  actions: React.ReactNode;
};

type EtatSauvegarde = "propre" | "modifie" | "enregistrement" | "erreur" | "conflit";

const DELAI_SAUVEGARDE_MS = 2000;

/**
 * ProseMirror crée ses objets d'attributs sans prototype ; React ne sait pas les transmettre au serveur
 * (ils arriveraient vides). On les convertit donc en JSON ordinaire avant chaque envoi.
 */
function enJson(document: unknown): unknown {
  return JSON.parse(JSON.stringify(document));
}

const AIDES: Record<string, string> = {
  versetArabe: "Texte arabe du verset",
  versetTraduction: "Traduction française du verset",
  hadithArabe: "Texte arabe du hadith",
  hadithTraduction: "Traduction française du hadith",
  evenementDate: "Date ou époque",
  accordeonTitre: "Titre de la section repliable",
};

export function EditeurRiche({ article, visibilite, enLigne, actions }: Props) {
  const router = useRouter();
  const [titre, setTitre] = useState(article.titre);
  const [resume, setResume] = useState(article.resume);
  const [etiquettes, setEtiquettes] = useState(article.etiquettes);
  const [statut, setStatut] = useState(article.statut);
  const [etat, setEtat] = useState<EtatSauvegarde>("propre");
  const [heure, setHeure] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [alertes, setAlertes] = useState<Alerte[]>(() => controlerDocument(article.contenu));
  const [mots, setMots] = useState(() => compterMots(texteDuDocument(article.contenu)));
  const [changementStatut, setChangementStatut] = useState(false);
  const [envoiEnCours, setEnvoiEnCours] = useState("");
  const choixImage = useRef<HTMLInputElement>(null);
  const choixPdf = useRef<HTMLInputElement>(null);
  const collerRef = useRef<(e: ClipboardEvent) => boolean>(() => false);
  const [demandeLien, setDemandeLien] = useState<{ youtube: boolean; position: number } | null>(null);
  const [adresse, setAdresse] = useState("");
  const [choixSource, setChoixSource] = useState<{ mode: "reference" | "citation"; position: number } | null>(null);

  // Valeurs courantes lues par l'enregistrement (évite de travailler sur des valeurs périmées).
  const champs = useRef({ titre: article.titre, resume: article.resume, etiquettes: article.etiquettes });
  const base = useRef<string | null>(article.updated_at);
  const etatRef = useRef<EtatSauvegarde>("propre");
  const enCours = useRef(false);
  const encore = useRef(false);
  const minuteur = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const minuteurAnalyse = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Fonction d'enregistrement la plus récente, appelable depuis les minuteurs et l'éditeur (créé une seule fois).
  const enregistrerRef = useRef<(manuel?: boolean, forcer?: boolean) => Promise<boolean>>(async () => false);

  const changerEtat = (suivant: EtatSauvegarde) => {
    etatRef.current = suivant;
    setEtat(suivant);
  };

  // Appelée à chaque modification du texte ; gardée dans une référence pour toujours appeler la version à jour.
  const surModificationRef = useRef<(json: unknown) => void>(() => {});

  /*
   * Options de l'éditeur créées UNE SEULE FOIS. Si elles changeaient à chaque affichage, l'éditeur les
   * réappliquerait et pourrait rétablir une ancienne sélection juste avant une frappe (texte remplacé).
   */
  const [options] = useState(() => ({
    immediatelyRender: false,
    extensions: [
      ...avecVues(extensionsDocument()),
      Placeholder.configure({
        includeChildren: true,
        showOnlyCurrent: false,
        placeholder: ({ editor: ed, node, pos }: { editor: Editor; node: ProseMirrorNode; pos: number }) => {
          if (AIDES[node.type.name]) return AIDES[node.type.name];
          if (node.type.name === "heading") return "Titre de section";
          if (node.type.name !== "paragraph") return "";
          const parent = ed.state.doc.resolve(pos).parent.type.name;
          if (parent === "objection") return "Formule l'objection telle que la présentent ses défenseurs";
          if (parent === "reponse") return "Rédige la réponse";
          if (ed.isEmpty) return "Écris ici, ou tape « / » pour insérer un verset, un hadith, un encadré…";
          return "";
        },
      }),
      MenuSlash,
    ],
    content: article.contenu as object,
    editorProps: {
      attributes: { class: "tiptap", "aria-label": "Texte de l'article", lang: "fr", spellcheck: "true" },
      // Une adresse collée seule sur une ligne vide devient une carte (comme dans Notion).
      handlePaste: (_vue: unknown, evenement: ClipboardEvent) => collerRef.current(evenement),
    },
    onUpdate: ({ editor: ed }: { editor: Editor }) => surModificationRef.current(ed.getJSON()),
  }));
  const editor = useEditor(options);

  const enregistrer = useCallback(
    async (manuel = false, forcer = false): Promise<boolean> => {
      if (!editor) return false;
      clearTimeout(minuteur.current);
      if (enCours.current) {
        encore.current = true;
        return false;
      }
      enCours.current = true;
      changerEtat("enregistrement");
      let resultat: ResultatSauvegarde;
      try {
        resultat = await sauvegarderArticle({
          id: article.id,
          base: forcer ? null : base.current,
          titre: champs.current.titre,
          resume: champs.current.resume,
          etiquettes: champs.current.etiquettes,
          contenu: enJson(editor.getJSON()),
          manuel,
        });
      } catch {
        resultat = { ok: false, message: "Connexion perdue. Tes modifications sont conservées ici et seront enregistrées dès que possible." };
      }
      enCours.current = false;

      if (resultat.ok) {
        base.current = resultat.misAJour;
        setHeure(resultat.heure);
        setMessage("");
        if (encore.current) {
          encore.current = false;
          changerEtat("modifie");
          minuteur.current = setTimeout(() => void enregistrerRef.current(), 300);
        } else {
          changerEtat("propre");
        }
        return true;
      }
      encore.current = false;
      setMessage(resultat.message);
      changerEtat(resultat.conflit ? "conflit" : "erreur");
      return false;
    },
    [editor, article.id],
  );

  useEffect(() => {
    enregistrerRef.current = enregistrer;
  }, [enregistrer]);

  useEffect(() => {
    surModificationRef.current = (json) => {
      signalerModification();
      clearTimeout(minuteurAnalyse.current);
      minuteurAnalyse.current = setTimeout(() => {
        setAlertes(controlerDocument(json));
        setMots(compterMots(texteDuDocument(json)));
      }, 700);
    };
  });

  function signalerModification() {
    if (etatRef.current === "conflit") return;
    if (enCours.current) encore.current = true;
    changerEtat(enCours.current ? "enregistrement" : "modifie");
    clearTimeout(minuteur.current);
    minuteur.current = setTimeout(() => void enregistrerRef.current(), DELAI_SAUVEGARDE_MS);
  }

  // « /image » et « /document » : choix du fichier, envoi, puis insertion du bloc à l'endroit du curseur.
  useEffect(() => {
    actionsSpeciales.image = () => choixImage.current?.click();
    actionsSpeciales.document = () => choixPdf.current?.click();
    return () => {
      actionsSpeciales.image = undefined;
      actionsSpeciales.document = undefined;
    };
  }, []);

  async function insererFichier(fichier: File | undefined, nature: "image" | "pdf") {
    if (!fichier || !editor) return;
    const position = editor.state.selection.from;
    const r = await envoyerFichier(fichier, { type: "article", id: article.id }, {
      dansListe: nature === "pdf",
      suivi: (m, p) => setEnvoiEnCours(p !== undefined ? `${m} (${p} %)` : m),
    });
    if (!r.ok) {
      setEnvoiEnCours("");
      setMessage(r.message);
      changerEtat("erreur");
      return;
    }
    const attendu = nature === "image" ? r.typeMime.startsWith("image/") : r.typeMime === "application/pdf";
    if (!attendu) {
      setEnvoiEnCours("");
      setMessage(`« ${r.nom} » a été ajouté aux documents joints, mais ce n'est pas ${nature === "image" ? "une image" : "un PDF"}.`);
      changerEtat("erreur");
      return;
    }
    const bloc =
      nature === "image"
        ? { type: "image", attrs: { fichier: r.id, legende: "", alt: "", largeur: "normale" } }
        : { type: "documentPdf", attrs: { fichier: r.id, nom: r.nom.replace(/\.pdf$/i, ""), page: "1" } };
    editor.chain().focus().insertContentAt(Math.min(position, editor.state.doc.content.size), bloc).run();
    if (nature === "pdf") {
      try {
        await extraireTextePdf(r.id, (m, p) => setEnvoiEnCours(p !== undefined ? `${m} (${p} %)` : m));
      } catch {
        // Le texte pourra être relu plus tard ; le document est bien inséré.
      }
    }
    setEnvoiEnCours("");
    router.refresh();
  }

  /** Prépare l'aperçu (titre, vignette) puis insère la carte du lien à la position donnée. */
  async function insererCarte(url: string, position: number, remplacerLigneVide: boolean) {
    if (!editor) return;
    setEnvoiEnCours("Préparation de l'aperçu du lien…");
    let r: Awaited<ReturnType<typeof creerApercu>>;
    try {
      r = await creerApercu({ articleId: article.id, url });
    } catch {
      r = { ok: false, message: "Connexion perdue pendant la préparation de l'aperçu." };
    }
    setEnvoiEnCours("");
    if (!r.ok) {
      setMessage(r.message);
      changerEtat("erreur");
      return;
    }
    const pos = Math.min(position, editor.state.doc.content.size);
    const noeud = editor.state.doc.nodeAt(pos);
    const bloc = { type: "lienCarte", attrs: { ...r.apercu } };
    if (remplacerLigneVide && noeud?.type.name === "paragraph" && noeud.content.size === 0) editor.chain().focus().insertContentAt({ from: pos, to: pos + noeud.nodeSize }, bloc).run();
    else editor.chain().focus().insertContentAt(pos, bloc).run();
    router.refresh();
  }

  useEffect(() => {
    collerRef.current = (e: ClipboardEvent) => {
      if (!editor) return false;
      const texte = e.clipboardData?.getData("text/plain")?.trim() ?? "";
      if (!/^https?:\/\/\S+$/.test(texte) || texte.length > 2000) return false;
      const { $from, empty } = editor.state.selection;
      if (!empty || $from.parent.type.name !== "paragraph" || $from.parent.content.size > 0) return false;
      void insererCarte(texte, $from.before(), true);
      return true;
    };
    actionsSpeciales.lien = (youtube) => {
      setAdresse("");
      setDemandeLien({ youtube, position: editor?.state.selection.from ?? 0 });
    };
    actionsSpeciales.reference = () => setChoixSource({ mode: "reference", position: editor?.state.selection.from ?? 0 });
    actionsSpeciales.citation = () => setChoixSource({ mode: "citation", position: editor?.state.selection.from ?? 0 });
    return () => {
      actionsSpeciales.lien = undefined;
      actionsSpeciales.reference = undefined;
      actionsSpeciales.citation = undefined;
    };
  });

  // L'article a été modifié par une autre action de cette page (déplacement…) : on reprend la nouvelle date.
  useEffect(() => {
    if (etatRef.current === "propre") base.current = article.updated_at;
  }, [article.updated_at]);

  // Ctrl+S, avertissement avant de quitter, enregistrement quand la page passe en arrière-plan.
  useEffect(() => {
    const raccourci = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void enregistrerRef.current(true);
      }
    };
    const avantDepart = (e: BeforeUnloadEvent) => {
      if (etatRef.current !== "propre") e.preventDefault();
    };
    const arrierePlan = () => {
      if (document.visibilityState === "hidden" && etatRef.current === "modifie") void enregistrerRef.current();
    };
    window.addEventListener("keydown", raccourci);
    window.addEventListener("beforeunload", avantDepart);
    document.addEventListener("visibilitychange", arrierePlan);
    return () => {
      window.removeEventListener("keydown", raccourci);
      window.removeEventListener("beforeunload", avantDepart);
      document.removeEventListener("visibilitychange", arrierePlan);
      clearTimeout(minuteur.current);
      clearTimeout(minuteurAnalyse.current);
    };
  }, []);

  function modifierChamp(nom: "titre" | "resume" | "etiquettes", valeur: string) {
    champs.current = { ...champs.current, [nom]: valeur };
    if (nom === "titre") setTitre(valeur);
    if (nom === "resume") setResume(valeur);
    if (nom === "etiquettes") setEtiquettes(valeur);
    signalerModification();
  }

  async function basculerStatut() {
    setChangementStatut(true);
    if (etatRef.current !== "propre") {
      const ok = await enregistrer(true);
      if (!ok) {
        setChangementStatut(false);
        return;
      }
    }
    const suivant = statut === "publie" ? "brouillon" : "publie";
    const resultat = await changerStatutArticle({ id: article.id, statut: suivant });
    if (resultat.ok) {
      base.current = resultat.misAJour;
      setStatut(suivant);
      router.refresh();
    } else {
      setMessage(resultat.message);
      changerEtat("erreur");
    }
    setChangementStatut(false);
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_21rem]">
      {/* Hors du panneau en verre : un effet de flou fausserait la position du menu « / ». */}
      <ListeSlash />
      <div className="verre panneau min-w-0">
        <label htmlFor="art-titre" className="sr-only">
          Titre de l&apos;article
        </label>
        <textarea
          id="art-titre"
          rows={1}
          value={titre}
          maxLength={LIMITES.titreArticle}
          onChange={(e) => modifierChamp("titre", e.target.value.replace(/\n/g, " "))}
          className="w-full resize-none bg-transparent font-display text-[clamp(1.9rem,4vw,2.75rem)] font-extrabold leading-tight outline-none [field-sizing:content] placeholder:text-encre-douce"
          placeholder="Titre de l'article"
        />
        <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-4">
          <label htmlFor="art-resume" className="etiquette text-sm text-encre-douce">
            Résumé
          </label>
          <span className="text-xs text-encre-douce" aria-live="polite">
            {resume.length.toLocaleString("fr-FR")} / {LIMITES.resume.toLocaleString("fr-FR")} caractères
          </span>
        </div>
        <textarea
          id="art-resume"
          value={resume}
          maxLength={LIMITES.resume}
          onChange={(e) => modifierChamp("resume", e.target.value)}
          className="champ min-h-24 max-h-[50vh] [field-sizing:content]"
          placeholder="Le chapeau de l'article : de quelques phrases à plusieurs paragraphes. Affiché sous le titre, et en deux lignes dans les listes."
        />

        <div className="mt-6">{editor && <BarreOutils editor={editor} />}</div>
        <div className="mt-4">
          <EditorContent editor={editor} />
        </div>
        {editor && <MenuBulle editor={editor} />}
        <input ref={choixImage} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => { void insererFichier(e.target.files?.[0], "image"); e.target.value = ""; }} />
        <input ref={choixPdf} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => { void insererFichier(e.target.files?.[0], "pdf"); e.target.value = ""; }} />
        {demandeLien && (
          <Modale titre={demandeLien.youtube ? "Insérer une vidéo YouTube" : "Insérer un lien"} onFermer={() => setDemandeLien(null)} large={false}>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const url = adresse.trim();
                if (!/^https?:\/\//.test(url)) return;
                const { position } = demandeLien;
                setDemandeLien(null);
                void insererCarte(url, position, false);
              }}
            >
              <label htmlFor="adresse-lien" className="etiquette">
                {demandeLien.youtube ? "Adresse de la vidéo ou de la playlist" : "Adresse du site"}
              </label>
              <input id="adresse-lien" className="champ" type="url" required value={adresse} onChange={(e) => setAdresse(e.target.value)} placeholder={demandeLien.youtube ? "https://www.youtube.com/watch?v=…" : "https://…"} autoFocus />
              <p className="aide text-sm">Astuce : tu peux aussi coller directement une adresse sur une ligne vide de l&apos;article.</p>
              <button type="submit" className="bouton bouton-principal w-full">
                Insérer la carte
              </button>
            </form>
          </Modale>
        )}
        {choixSource && (
          <ChoixSource
            mode={choixSource.mode}
            onFermer={() => setChoixSource(null)}
            onChoisir={(c) => {
              const { mode, position } = choixSource;
              setChoixSource(null);
              if (!editor) return;
              const pos = Math.min(position, editor.state.doc.content.size);
              if (mode === "citation" && c.citation) editor.chain().focus().insertContentAt(pos, { type: "citationOuvrage", attrs: { citation: c.citation } }).run();
              else editor.chain().focus().insertContentAt(pos, { type: "reference", attrs: { ouvrage: c.citation ? "" : c.ouvrage, citation: c.citation, page: c.page, tome: c.tome } }).run();
            }}
          />
        )}
        {envoiEnCours && (
          <p className="message message-succes mt-3 text-sm" role="status">
            {envoiEnCours}
          </p>
        )}

        <div className="mt-2 border-t border-trait pt-5">
          <label htmlFor="art-etiquettes" className="etiquette">
            Étiquettes
          </label>
          <input
            id="art-etiquettes"
            className="champ"
            value={etiquettes}
            onChange={(e) => modifierChamp("etiquettes", e.target.value)}
            placeholder="Par exemple : Trinité, Évangiles, Paul"
            aria-describedby="art-etiquettes-aide"
          />
          <p id="art-etiquettes-aide" className="aide mt-1.5">
            Sépare-les par des virgules. Elles serviront à retrouver l&apos;article avec la recherche.
          </p>
        </div>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-6" aria-label="Réglages de l'article">
        <section className="verre panneau space-y-4" aria-labelledby="titre-statut">
          <div className="flex items-center justify-between gap-3">
            <h2 id="titre-statut" className="text-lg font-bold">
              Publication
            </h2>
            <BadgeStatut statut={statut} />
          </div>
          <p className="text-sm font-semibold text-accent">{visibilite}</p>
          <button
            type="button"
            className={statut === "publie" ? "bouton bouton-discret w-full" : "bouton bouton-principal w-full"}
            onClick={basculerStatut}
            disabled={changementStatut}
          >
            {changementStatut ? "Un instant…" : statut === "publie" ? "Repasser en brouillon" : "Publier l'article"}
          </button>

          <div className="statut-sauvegarde flex items-start gap-2 text-sm" data-etat={etat === "propre" ? "ok" : etat === "erreur" || etat === "conflit" ? "erreur" : "attente"} role="status" aria-live="polite">
            {etat === "propre" && <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
            {(etat === "modifie" || etat === "enregistrement") && <LoaderCircle className="mt-0.5 size-4 shrink-0 animate-spin" aria-hidden="true" />}
            {etat === "erreur" && <CloudOff className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
            {etat === "conflit" && <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
            <span>
              {etat === "propre" && (heure ? `Enregistré à ${heure}` : "Tout est enregistré")}
              {etat === "modifie" && "Modifications en attente…"}
              {etat === "enregistrement" && "Enregistrement…"}
              {(etat === "erreur" || etat === "conflit") && message}
            </span>
          </div>
          {etat === "erreur" && (
            <button type="button" className="bouton bouton-discret w-full !min-h-10" onClick={() => void enregistrer(true)}>
              Réessayer maintenant
            </button>
          )}
          {etat === "conflit" && (
            <div className="flex flex-col gap-2">
              <button type="button" className="bouton bouton-discret !min-h-10" onClick={() => window.location.reload()}>
                Recharger la page (perdre mes changements)
              </button>
              <button type="button" className="bouton bouton-danger !min-h-10" onClick={() => void enregistrer(true, true)}>
                Garder ma version (écraser l&apos;autre)
              </button>
            </div>
          )}
          <p className="aide text-sm">
            {mots === 1 ? "1 mot" : `${mots.toLocaleString("fr-FR")} mots`}. Enregistrement automatique ; Ctrl+S crée aussi une version dans l&apos;historique.
          </p>
        </section>

        {editor && <PanneauBloc editor={editor} />}

        {alertes.length > 0 && (
          <section className="verre panneau" aria-labelledby="titre-alertes">
            <h2 id="titre-alertes" className="text-lg font-bold">
              À vérifier
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {alertes.map((a) => (
                <li key={a.cle} className="flex gap-2">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-or" aria-hidden="true" />
                  {a.message}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="verre panneau space-y-3" aria-label="Consulter">
          <Link href={`/createur/article/${article.id}/apercu`} className="bouton bouton-discret w-full">
            <ScanEye className="size-5" aria-hidden="true" />
            Aperçu
          </Link>
          <Link href={`/createur/article/${article.id}/versions`} className="bouton bouton-discret w-full">
            <History className="size-5" aria-hidden="true" />
            Historique des versions
          </Link>
          {enLigne && (
            <Link href={enLigne} className="bouton bouton-discret w-full">
              Voir en ligne
            </Link>
          )}
        </section>

        {editor && <EnregistrerModele contenu={() => enJson(editor.getJSON())} />}
        {actions}
      </aside>
    </div>
  );
}

function EnregistrerModele({ contenu }: { contenu: () => unknown }) {
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [retour, setRetour] = useState<{ ok: boolean; message: string } | null>(null);
  const [envoi, setEnvoi] = useState(false);

  return (
    <details className="tiroir verre rounded-3xl">
      <summary className="flex items-center gap-3 rounded-3xl border border-transparent px-6 py-4 font-semibold">Enregistrer comme modèle</summary>
      <form
        className="space-y-3 px-6 pb-6 pt-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setEnvoi(true);
          const r = await enregistrerCommeModele({ nom, description, contenu: contenu() });
          setRetour(r);
          setEnvoi(false);
          if (r.ok) {
            setNom("");
            setDescription("");
          }
        }}
      >
        <p className="aide text-sm">La structure de cet article servira de point de départ à de futurs articles.</p>
        <label htmlFor="modele-nom" className="etiquette text-sm">
          Nom du modèle
        </label>
        <input id="modele-nom" className="champ !min-h-10 !py-2" value={nom} onChange={(e) => setNom(e.target.value)} maxLength={120} required />
        <label htmlFor="modele-description" className="etiquette text-sm">
          Description (facultatif)
        </label>
        <input id="modele-description" className="champ !min-h-10 !py-2" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={400} />
        {retour && <p className={`message ${retour.ok ? "message-succes" : "message-erreur"} text-sm`}>{retour.message}</p>}
        <button type="submit" className="bouton bouton-discret w-full" disabled={envoi}>
          {envoi ? "Enregistrement…" : "Enregistrer le modèle"}
        </button>
      </form>
    </details>
  );
}
