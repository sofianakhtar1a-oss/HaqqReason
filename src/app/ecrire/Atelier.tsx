"use client";

import type { Editor } from "@tiptap/core";
import { Node as NoeudTiptap, type AnyExtension } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { ReactNodeViewRenderer, useEditor, type NodeViewProps } from "@tiptap/react";
import { Placeholder } from "@tiptap/extensions";
import { Check, Command, LoaderCircle, PanelLeft, PanelRight, Printer } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { compterMots, texteDuDocument } from "@/lib/document-schema";
import { extensionsDocument } from "@/lib/editeur/extensions";
import { sommaireDuDocument, type EntreeSommaire } from "@/lib/sommaire";
import { ajouterFichier, ajouterVersion, ecrireDocument } from "@/lib/atelier/depot";
import { geometrie, LIMITES_ATELIER, nettoyerReglages, tailleDuPapier, type DocumentAtelier, type ReglagesPage } from "@/lib/atelier/modele";
import { BarreOutils } from "../createur/_composants/editeur/BarreOutils";
import { actionsSpeciales } from "../createur/_composants/editeur/commandes";
import { MenuBulle } from "../createur/_composants/editeur/MenuBulle";
import { ListeSlash, MenuSlash } from "../createur/_composants/editeur/MenuSlash";
import { OutilsBloc } from "../createur/_composants/editeur/OutilsBloc";
import { PanneauBloc } from "../createur/_composants/editeur/PanneauBloc";
import { VueLienCarte, VueLogique, VueSchema, VueSommaire, VueSophisme } from "../createur/_composants/editeur/VuesBlocs";
import { AtelierImage, type ResultatAtelier } from "../createur/_composants/ateliers/AtelierImage";
import { BarreLaterale } from "./BarreLaterale";
import { Inspecteur } from "./Inspecteur";
import { PaletteCommandes, type ActionPalette } from "./PaletteCommandes";
import { Papier } from "./Papier";
import { CoupuresDePage } from "./pages-extension";
import { COMMANDE_TABLEAU, extensionsTableau, GROUPES_ECARTES_ATELIER } from "./tableaux";
import { VueDocumentLocal, VueImageLocale } from "./VuesLocales";
import { exporterDocx, exporterMarkdown, exporterPaquet, exporterPdf } from "./exporter";
import { useAccesComplet } from "@/lib/client/acces";

const VUES: Record<string, (p: NodeViewProps) => React.ReactNode> = {
  schema: VueSchema,
  logique: VueLogique,
  lienCarte: VueLienCarte,
  sophisme: VueSophisme,
  sommaire: VueSommaire,
  image: VueImageLocale,
  documentPdf: VueDocumentLocal,
};

function avecVues(extensions: AnyExtension[]): AnyExtension[] {
  return extensions.map((e) => {
    const Vue = VUES[e.name];
    if (!Vue) return e;
    return (e as NoeudTiptap).extend({ addNodeView: () => ReactNodeViewRenderer(Vue as Parameters<typeof ReactNodeViewRenderer>[0]) });
  });
}

const AIDES: Record<string, string> = {
  versetArabe: "Texte arabe du verset",
  versetTraduction: "Traduction française",
  hadithArabe: "Texte arabe du hadith",
  hadithTraduction: "Traduction française",
  evenementDate: "Date ou époque",
  accordeonTitre: "Titre de la section repliable",
};

const DELAI_ENREGISTREMENT = 1200;
const DELAI_VERSION_MS = 5 * 60 * 1000;

type Props = {
  doc: DocumentAtelier;
  documents: DocumentAtelier[];
  surOuvrir: (id: string) => void;
  surNouveau: () => void;
  surSupprimer: (id: string) => void;
  surImporter: (fichier: File) => void;
  surListeChangee: (doc: DocumentAtelier) => void;
};

export function Atelier({ doc, documents, surOuvrir, surNouveau, surSupprimer, surImporter, surListeChangee }: Props) {
  const accesComplet = useAccesComplet();
  const [titre, setTitre] = useState(doc.titre);
  const [reglages, setReglages] = useState<ReglagesPage>(doc.reglages);
  const [etat, setEtat] = useState<"propre" | "modifie" | "enregistrement">("propre");
  const [pages, setPages] = useState(1);
  const [plan, setPlan] = useState<EntreeSommaire[]>(() => sommaireDuDocument(doc.contenu));
  const [coteOuvert, setCoteOuvert] = useState(true);
  const [inspecteurOuvert, setInspecteurOuvert] = useState(true);
  const [palette, setPalette] = useState(false);
  const [imageCollee, setImageCollee] = useState<{ source: Blob; position: number } | null>(null);
  const [exportEnCours, setExportEnCours] = useState("");
  const [message, setMessage] = useState("");

  const scene = useRef<HTMLDivElement>(null);
  const choixImage = useRef<HTMLInputElement>(null);
  const choixDocument = useRef<HTMLInputElement>(null);
  const minuteur = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const derniereVersion = useRef(0);
  const collerRef = useRef<(e: ClipboardEvent) => boolean>(() => false);
  const courant = useRef({ titre: doc.titre, reglages: doc.reglages });
  const surFrappeRef = useRef<() => void>(() => {});

  const [options] = useState(() => ({
    immediatelyRender: false,
    extensions: [
      ...avecVues(extensionsDocument()),
      ...extensionsTableau,
      Placeholder.configure({
        includeChildren: true,
        showOnlyCurrent: false,
        placeholder: ({ editor: ed, node }: { editor: Editor; node: ProseMirrorNode }) => {
          if (AIDES[node.type.name]) return AIDES[node.type.name];
          if (node.type.name === "heading") return "Titre de partie";
          if (node.type.name !== "paragraph") return "";
          return ed.isEmpty ? "Écris ici. Tape « / » pour insérer un tableau, une image, une frise, une carte mentale…" : "";
        },
      }),
      MenuSlash,
      CoupuresDePage,
    ],
    content: doc.contenu as object,
    editorProps: {
      attributes: { class: "tiptap", "aria-label": "Texte du document", lang: "fr", spellcheck: "true" },
      handlePaste: (_vue: unknown, evenement: ClipboardEvent) => collerRef.current(evenement),
    },
    onUpdate: () => surFrappeRef.current(),
  }));
  const editor = useEditor(options);

  // ---------------------------------------------------------------- enregistrement
  const enregistrer = useCallback(
    async (versionAussi = false) => {
      if (!editor) return;
      clearTimeout(minuteur.current);
      setEtat("enregistrement");
      const contenu = JSON.parse(JSON.stringify(editor.getJSON())) as unknown;
      const texte = texteDuDocument(contenu);
      const aJour: DocumentAtelier = {
        ...doc,
        titre: courant.current.titre.slice(0, LIMITES_ATELIER.titre),
        reglages: nettoyerReglages(courant.current.reglages),
        contenu,
        modifie: new Date().toISOString(),
        mots: compterMots(texte),
        signes: texte.length,
      };
      try {
        await ecrireDocument(aJour);
        const maintenant = Date.now();
        if (versionAussi || maintenant - derniereVersion.current > DELAI_VERSION_MS) {
          derniereVersion.current = maintenant;
          await ajouterVersion({ documentId: doc.id, quand: aJour.modifie, deltaMots: aJour.mots - doc.mots, contenu, titre: aJour.titre });
        }
        surListeChangee(aJour);
        setEtat("propre");
      } catch {
        setEtat("modifie");
        setMessage("Impossible d'enregistrer sur cet appareil. Vérifie qu'il reste de la place, puis fais une sauvegarde complète.");
      }
    },
    [doc, editor, surListeChangee],
  );

  const marquerModifie = useCallback(() => {
    setEtat("modifie");
    clearTimeout(minuteur.current);
    minuteur.current = setTimeout(() => void enregistrer(), DELAI_ENREGISTREMENT);
  }, [enregistrer]);

  // Le plan suit la frappe, mais sans la gêner.
  useEffect(() => {
    if (!editor) return;
    let attente: ReturnType<typeof setTimeout>;
    const suivre = () => {
      clearTimeout(attente);
      attente = setTimeout(() => setPlan(sommaireDuDocument(editor.getJSON())), 400);
    };
    editor.on("update", suivre);
    return () => {
      clearTimeout(attente);
      editor.off("update", suivre);
    };
  }, [editor]);

  useEffect(() => {
    courant.current = { titre, reglages };
  }, [titre, reglages]);

  useEffect(() => {
    surFrappeRef.current = marquerModifie;
  }, [marquerModifie]);

  useEffect(() => () => clearTimeout(minuteur.current), []);

  // Enregistrer avant de quitter la page, s'il reste quelque chose à écrire.
  useEffect(() => {
    const avantFermeture = (e: BeforeUnloadEvent) => {
      if (etat !== "propre") e.preventDefault();
    };
    window.addEventListener("beforeunload", avantFermeture);
    return () => window.removeEventListener("beforeunload", avantFermeture);
  }, [etat]);

  // ---------------------------------------------------------------- fichiers
  const insererImage = useCallback(
    async ({ fichier, largeur, legende, alt }: ResultatAtelier, position: number) => {
      if (!editor) return;
      setImageCollee(null);
      const enregistre = await ajouterFichier(fichier, fichier.name || "image.png");
      editor
        .chain()
        .focus()
        .insertContentAt(Math.min(position, editor.state.doc.content.size), { type: "image", attrs: { fichier: enregistre.id, legende, alt, largeur } })
        .run();
    },
    [editor],
  );

  const insererFichier = useCallback(
    async (fichier: File | undefined, genre: "image" | "document") => {
      if (!fichier || !editor) return;
      if (fichier.size > LIMITES_ATELIER.fichierMo * 1024 * 1024) {
        setMessage(`Ce fichier dépasse ${LIMITES_ATELIER.fichierMo} Mo : il ralentirait l'atelier.`);
        return;
      }
      if (genre === "image") {
        setImageCollee({ source: fichier, position: editor.state.selection.from });
        return;
      }
      const enregistre = await ajouterFichier(fichier, fichier.name);
      editor.chain().focus().insertContent({ type: "documentPdf", attrs: { fichier: enregistre.id, nom: fichier.name, page: "1" } }).run();
      marquerModifie();
    },
    [editor, marquerModifie],
  );

  useEffect(() => {
    actionsSpeciales.image = () => choixImage.current?.click();
    actionsSpeciales.document = () => choixDocument.current?.click();
    return () => {
      actionsSpeciales.image = undefined;
      actionsSpeciales.document = undefined;
    };
  }, []);

  // Coller une capture d'écran ouvre l'atelier d'image, comme en mode créateur.
  useEffect(() => {
    collerRef.current = (e: ClipboardEvent) => {
      if (!editor) return false;
      const image = [...(e.clipboardData?.items ?? [])].find((i) => i.kind === "file" && i.type.startsWith("image/"));
      const fichier = image?.getAsFile();
      if (fichier && fichier.size > 0) {
        setImageCollee({ source: fichier, position: editor.state.selection.from });
        return true;
      }
      return false;
    };
  }, [editor]);

  // Glisser-déposer un fichier dans la page.
  useEffect(() => {
    const zone = scene.current;
    if (!zone) return;
    const surDepot = (e: DragEvent) => {
      const fichier = e.dataTransfer?.files?.[0];
      if (!fichier) return;
      e.preventDefault();
      void insererFichier(fichier, fichier.type.startsWith("image/") ? "image" : "document");
    };
    const surSurvol = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes("Files")) e.preventDefault();
    };
    zone.addEventListener("drop", surDepot);
    zone.addEventListener("dragover", surSurvol);
    return () => {
      zone.removeEventListener("drop", surDepot);
      zone.removeEventListener("dragover", surSurvol);
    };
  }, [insererFichier]);

  // ---------------------------------------------------------------- sortie
  const exporter = useCallback(
    async (quoi: "pdf" | "docx" | "md" | "calame") => {
      if (!editor) return;
      await enregistrer();
      const aJour: DocumentAtelier = {
        ...doc,
        titre: courant.current.titre,
        reglages: courant.current.reglages,
        contenu: JSON.parse(JSON.stringify(editor.getJSON())),
      };
      try {
        if (quoi === "pdf") exporterPdf();
        else if (quoi === "md") exporterMarkdown(aJour);
        else {
          setExportEnCours(quoi);
          if (quoi === "docx") await exporterDocx(aJour);
          else await exporterPaquet(aJour);
        }
      } catch {
        setMessage("L'export n'a pas abouti. Réessaie, ou passe par la sauvegarde complète.");
      } finally {
        setExportEnCours("");
      }
    },
    [doc, editor, enregistrer],
  );

  // ---------------------------------------------------------------- clavier
  useEffect(() => {
    const auClavier = (e: KeyboardEvent) => {
      const commande = e.ctrlKey || e.metaKey;
      if (commande && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((o) => !o);
      } else if (commande && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void enregistrer(true);
      } else if (commande && e.key.toLowerCase() === "p") {
        e.preventDefault();
        void exporter("pdf");
      }
    };
    window.addEventListener("keydown", auClavier);
    return () => window.removeEventListener("keydown", auClavier);
  }, [enregistrer, exporter]);

  const allerAu = useCallback((entree: EntreeSommaire) => {
    const cible = document.getElementById(entree.id) ?? document.querySelector(`[data-plan="${entree.id}"]`);
    const titres = scene.current?.querySelectorAll<HTMLElement>(".tiptap h2, .tiptap h3, .tiptap h4");
    const index = Number(entree.id.replace("section-", "")) - 1;
    const element = cible ?? (titres && titres[index]);
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const actions = useMemo<ActionPalette[]>(
    () => [
      { cle: "nouveau", libelle: "Nouveau document", description: "Commencer une page blanche", groupe: "Document", faire: surNouveau },
      { cle: "enregistrer", libelle: "Enregistrer maintenant", description: "Et garder une version datée", groupe: "Document", faire: () => void enregistrer(true) },
      { cle: "pdf", libelle: "Imprimer ou enregistrer en PDF", description: "La mise en page de l'écran, à l'identique", groupe: "Sortie", faire: () => void exporter("pdf") },
      { cle: "docx", libelle: "Exporter en Word", description: "Un vrai fichier .docx", groupe: "Sortie", faire: () => void exporter("docx") },
      { cle: "md", libelle: "Exporter en Markdown", description: "Texte structuré, pour un autre outil", groupe: "Sortie", faire: () => void exporter("md") },
      { cle: "paquet", libelle: "Sauvegarde complète", description: "Texte, mise en page et images dans un seul fichier", groupe: "Sortie", faire: () => void exporter("calame") },
      { cle: "cote", libelle: "Afficher ou cacher le plan", description: "La colonne de gauche", groupe: "Affichage", faire: () => setCoteOuvert((o) => !o) },
      { cle: "inspecteur", libelle: "Afficher ou cacher l'inspecteur", description: "La colonne de droite", groupe: "Affichage", faire: () => setInspecteurOuvert((o) => !o) },
      { cle: "sombre", libelle: "Papier sombre", description: "Écrire la nuit sans être ébloui", groupe: "Affichage", faire: () => setReglages((r) => ({ ...r, papierSombre: !r.papierSombre })) },
      ...plan.map((entree) => ({
        cle: `plan-${entree.id}`,
        libelle: entree.texte || "Titre sans texte",
        description: `Aller à cette partie (niveau ${entree.niveau - 1})`,
        groupe: "Plan",
        faire: () => allerAu(entree),
      })),
    ],
    [allerAu, enregistrer, exporter, plan, surNouveau],
  );

  const papier = tailleDuPapier(reglages.format, reglages.orientation);
  const stats = useMemo(() => {
    const texte = editor ? texteDuDocument(editor.getJSON()) : "";
    const mots = compterMots(texte);
    return { mots, signes: texte.length, pages, minutes: Math.max(1, Math.round(mots / 220)) };
  }, [editor, pages, etat]); // eslint-disable-line react-hooks/exhaustive-deps

  const modifierReglages = (modif: Partial<ReglagesPage>) => {
    setReglages((r) => ({ ...r, ...modif }));
    marquerModifie();
  };

  return (
    <div className="calame" data-cote={coteOuvert ? "" : undefined} data-inspecteur={inspecteurOuvert ? "" : undefined}>
      {/* La géométrie du papier est donnée à l'imprimante : le PDF sort exactement comme l'écran. */}
      <style>{`@page { size: ${papier.largeur}mm ${papier.hauteur}mm; margin: ${reglages.marges.haut}mm ${reglages.marges.droite}mm ${reglages.marges.bas}mm ${reglages.marges.gauche}mm; }`}</style>

      <header className="calame-barre sans-impression">
        <button type="button" className="calame-icone" onClick={() => setCoteOuvert((o) => !o)} aria-pressed={coteOuvert} title="Documents et plan">
          <PanelLeft className="size-5" aria-hidden="true" />
          <span className="sr-only">Afficher ou cacher la colonne de gauche</span>
        </button>

        <input
          value={titre}
          onChange={(e) => {
            setTitre(e.target.value.slice(0, LIMITES_ATELIER.titre));
            marquerModifie();
          }}
          className="calame-titre"
          aria-label="Titre du document"
          placeholder="Titre du document"
        />

        <span className="calame-etat" aria-live="polite">
          {etat === "enregistrement" ? (
            <>
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> Enregistrement…
            </>
          ) : etat === "modifie" ? (
            "Modifié"
          ) : (
            <>
              <Check className="size-4 text-emeraude" aria-hidden="true" /> Enregistré sur cet appareil
            </>
          )}
        </span>

        <button type="button" className="calame-icone" onClick={() => setPalette(true)} title="Barre de commande (Ctrl+K)">
          <Command className="size-5" aria-hidden="true" />
          <span className="sr-only">Ouvrir la barre de commande</span>
        </button>
        <button type="button" className="calame-icone" onClick={() => void exporter("pdf")} title="Imprimer ou enregistrer en PDF (Ctrl+P)">
          <Printer className="size-5" aria-hidden="true" />
          <span className="sr-only">Imprimer</span>
        </button>
        <button type="button" className="calame-icone" onClick={() => setInspecteurOuvert((o) => !o)} aria-pressed={inspecteurOuvert} title="Mise en forme">
          <PanelRight className="size-5" aria-hidden="true" />
          <span className="sr-only">Afficher ou cacher la colonne de droite</span>
        </button>
        {accesComplet && (
          <Link href="/utilisateur" className="calame-sortie">
            Quitter
          </Link>
        )}
      </header>

      {coteOuvert && (
        <BarreLaterale
          documents={documents}
          actif={doc.id}
          plan={plan}
          surOuvrir={surOuvrir}
          surNouveau={surNouveau}
          surSupprimer={surSupprimer}
          surImporter={surImporter}
          surAllerAu={allerAu}
        />
      )}

      <main className="calame-centre" ref={scene}>
        <div className="calame-outils sans-impression">
          {editor && <BarreOutils editor={editor} groupesEcartes={GROUPES_ECARTES_ATELIER} commandesSupplementaires={[COMMANDE_TABLEAU]} />}
        </div>
        {message && (
          <p className="message message-erreur sans-impression" role="alert" onClick={() => setMessage("")}>
            {message}
          </p>
        )}
        <h1 className="calame-titre-impression">{titre}</h1>
        <Papier editor={editor} reglages={reglages} titre={titre} surPages={setPages} />
        {editor && <OutilsBloc editor={editor} conteneur={scene} />}
        {editor && <MenuBulle editor={editor} />}
        {editor && <PanneauBloc editor={editor} />}
      </main>

      {inspecteurOuvert && <Inspecteur reglages={reglages} surReglages={modifierReglages} stats={stats} surExport={(q) => void exporter(q)} enCours={exportEnCours} />}

      <ListeSlash />
      {palette && <PaletteCommandes editor={editor} actions={actions} surFermer={() => setPalette(false)} />}

      <input ref={choixImage} type="file" accept="image/*" className="hidden" onChange={(e) => { void insererFichier(e.target.files?.[0], "image"); e.target.value = ""; }} />
      <input ref={choixDocument} type="file" className="hidden" onChange={(e) => { void insererFichier(e.target.files?.[0], "document"); e.target.value = ""; }} />

      {imageCollee && (
        <AtelierImage source={imageCollee.source} onFermer={() => setImageCollee(null)} onValider={(r) => void insererImage(r, imageCollee.position)} />
      )}
    </div>
  );
}

/** Hauteur utile d'une page, pour les écrans qui en ont besoin ailleurs. */
export function hauteurUtile(reglages: ReglagesPage): number {
  return geometrie(reglages).zone.hauteur;
}
