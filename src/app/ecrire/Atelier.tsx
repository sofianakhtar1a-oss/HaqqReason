"use client";

import type { Editor } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { useEditor } from "@tiptap/react";
import { Placeholder } from "@tiptap/extensions";
import {
  BarChart3,
  CalendarClock,
  Command,
  FileCog,
  HelpCircle,
  History,
  LoaderCircle,
  Omega,
  PanelLeft,
  PanelRight,
  Printer,
  Search,
  Settings2,
  SpellCheck2,
  Timer,
  X,
  Languages,
  WholeWord,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { compterMots, texteDuDocument } from "@/lib/document-schema";
import { BoutonCompte } from "@/components/compte/BoutonCompte";
import { EtatEnregistre } from "@/components/compte/EtatEnregistre";
import { ajouterFichier, ajouterVersion, ecrireDocument, lireDocument } from "@/lib/atelier/depot";
import { extrasDe, geometrie, LIMITES_ATELIER, nettoyerReglages, tailleDuPapier, type DocumentAtelier, type ReglagesPage, type VersionAtelier } from "@/lib/atelier/modele";
import { lirePreferences } from "@/lib/atelier/preferences";
import { noterEcriture, noterTemps, viderTampon } from "@/lib/atelier/journal-ecriture";
import { BarreOutils } from "../createur/_composants/editeur/BarreOutils";
import { actionsSpeciales } from "../createur/_composants/editeur/commandes";
import { MenuBulle } from "../createur/_composants/editeur/MenuBulle";
import { ListeSlash, MenuSlash } from "../createur/_composants/editeur/MenuSlash";
import { OutilsBloc } from "../createur/_composants/editeur/OutilsBloc";
import { PanneauBloc } from "../createur/_composants/editeur/PanneauBloc";
import { AtelierImage, type ResultatAtelier } from "../createur/_composants/ateliers/AtelierImage";
import { BarreLaterale } from "./BarreLaterale";
import { Inspecteur, type OngletSupplementaire } from "./Inspecteur";
import { PaletteCommandes, type ActionPalette } from "./PaletteCommandes";
import { Papier } from "./Papier";
import { CoupuresDePage } from "./pages-extension";
import { Numeros } from "./extensions/numeros";
import { GROUPES_ECARTES_ATELIER } from "./tableaux";
import { COMMANDES_CALAME, EVENEMENT_DIALOGUE, type DialogueCalame } from "./commandes-calame";
import { DialogueHadith, DialogueVerset } from "./DialoguesSources";
import { DialogueArticle, DialogueBibliotheque, DialogueGlossaire, DialogueLienWeb } from "./DialoguesBibliotheque";
import { reformaterReferences, reglerSources } from "./blocs/Sources";
import { abonnerBibliotheque } from "@/lib/atelier/bibliotheque";
import { lireFichier } from "@/lib/atelier/depot";
import { LecteurPdfLocal } from "./LecteurPdfLocal";
import { DialogueModeles, type DepartDocument } from "./DialogueModeles";
import { PanneauSortie, type ActionSortie } from "./panneaux/PanneauSortie";
import { exporterEpub, exporterHtml, exporterMarkdownComplet, exporterTexte, exporterTousLesDocuments, exporterWord, partagerDocument, publierDocument, retirerPublicationDuDocument } from "./sorties";
import { DialogueProposer } from "./DialogueProposer";
import { construirePdfDirect } from "./pdf-direct";
import { nomDeFichier, telecharger } from "./exporter";
import { EVENEMENT_PDF_COTE, type DemandePdfCote } from "./VuesLocales";
import { exporterPaquet, exporterPdf } from "./exporter";
import { useAccesComplet } from "@/lib/client/acces";
import { extensionsContenu } from "./extensions-calame";
import { Recherche } from "./extensions/recherche";
import { AidesSaisie, reglagesSaisie } from "./extensions/saisie";
import { SensEcriture } from "./extensions/sens";
import { Analyse } from "./extensions/analyse";
import { Replis, replisActuels, toutDeplier } from "./extensions/replis";
import { imprimerLivret, imprimerPages, imprimerSelection, lirePlagesDePages } from "./impression";
import { PanneauMiseEnPage, PanneauTexte } from "./panneaux/PanneauMiseEnPage";
import { PanneauStyles } from "./panneaux/PanneauStyles";
import { SelecteurStyle } from "./SelecteurStyle";
import { DialogueRenvoi } from "./DialogueRenvoi";
import { ajouterALIndex } from "./blocs/References";
import { separerGalerie } from "./blocs/ImageCalame";
import { allerALAncre, brancherSuiviLiens, mettreEnDeuxColonnes, revenirAUneColonne, SuiviLiensInternes } from "./blocs/Marges";
import { DialogueCommentaire, DialogueLien } from "./DialoguesMarge";
import { Sections } from "./blocs/Sections";
import { BlocCourant } from "./extensions/concentration";
import { dicteeDisponible, dicter, SurlignageLecture, type Dictee } from "./voix";
import { BarreRecherche } from "./BarreRecherche";
import { Caracteres, type OngletCaracteres } from "./Caracteres";
import { BarreEtat, ZOOMS } from "./BarreEtat";
import { BarreMobile } from "./BarreMobile";
import { Aide } from "./Aide";
import { ReglagesAtelier } from "./ReglagesAtelier";
import { VueLecture } from "./VueLecture";
import { PanneauDocument } from "./panneaux/PanneauDocument";
import { PanneauPlace } from "./panneaux/PanneauPlace";
import { PanneauVerrou } from "./panneaux/PanneauVerrou";
import { estOuvert } from "./verrou";
import { dossierPossible, ecrireReglage as ecrireReglageSauvegarde, lireReglage as lireReglageSauvegarde, sauvegardeDue, sauvegarderMaintenant } from "./sauvegarde-auto";
import { PanneauRelire } from "./panneaux/PanneauRelire";
import { PanneauVersions } from "./panneaux/PanneauVersions";
import { PanneauBilan } from "./panneaux/PanneauBilan";
import { nouveauxJalons } from "./jalons";
import { carillon, jouerAmbiance, arreterAmbiance } from "./ambiance";
import { delaiEcheance, usePreferences } from "./crochets";
import type { ApercuPage } from "./Miniatures";
import type { ActionsDocuments } from "./BarreLaterale";
import { allerAuTitre, carteMentaleEnPlan, planDuDocument } from "./plan";
import { Grammaire, allerALaRemarque, remarqueSuivante } from "./extensions/grammaire";
import { lancerRelecture } from "./relecture-grammaire";
import { BulleGrammaire, ouvrirBulle } from "./BulleGrammaire";
import { DialogueMot, type OngletMot } from "./DialogueMot";

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
const ECART_PAGES = 30;

type Props = ActionsDocuments & {
  doc: DocumentAtelier;
  documents: DocumentAtelier[];
  surListeChangee: (doc: DocumentAtelier) => void;
  /** Documents ouverts en onglets (le document actif compris). */
  onglets: DocumentAtelier[];
  surFermerOnglet: (id: string) => void;
  /** Texte à chercher dès l'ouverture (venu de la recherche dans tous les documents). */
  requeteInitiale?: string;
  /** Ouvre un document neuf de bienvenue. */
  surBienvenue: () => void;
  /** Créer un document à partir d'un modèle. */
  surModele?: (depart: DepartDocument) => void;
};

/** Vrai sur téléphone et petite tablette (les colonnes s'y ouvrent par-dessus la page). */
function ecranEtroit() {
  return typeof window !== "undefined" && window.matchMedia("(max-width: 70rem)").matches;
}

export function Atelier(props: Props) {
  const { doc, documents, surListeChangee, onglets, surFermerOnglet, requeteInitiale, surBienvenue } = props;
  const accesComplet = useAccesComplet();
  const prefs = usePreferences();
  const [titre, setTitre] = useState(doc.titre);
  const [reglages, setReglages] = useState<ReglagesPage>(doc.reglages);
  const [etat, setEtat] = useState<"propre" | "modifie" | "enregistrement">("propre");
  const [pages, setPages] = useState(1);
  // Sur un écran étroit, les deux colonnes passent par-dessus la page : on ouvre d'abord la page.
  const [coteOuvert, setCoteOuvert] = useState(() => !ecranEtroit());
  const [inspecteurOuvert, setInspecteurOuvert] = useState(() => !ecranEtroit());
  const [ongletInspecteur, setOngletInspecteur] = useState("page");
  const [palette, setPalette] = useState(false);
  const [imageCollee, setImageCollee] = useState<{ source: Blob; position: number } | null>(null);
  const [exportEnCours, setExportEnCours] = useState("");
  const [message, setMessage] = useState("");
  const [recherche, setRecherche] = useState<{ remplacement: boolean; requete: string } | null>(requeteInitiale ? { remplacement: false, requete: requeteInitiale } : null);
  const [caracteres, setCaracteres] = useState<OngletCaracteres | null>(null);
  const [zoom, setZoom] = useState(1);
  const zoomRef = useRef(zoom);
  useEffect(() => {
    zoomRef.current = zoom;
  });
  const [concentration, setConcentration] = useState(false);
  const [relecture, setRelecture] = useState(false);
  const [vueCote, setVueCote] = useState<string | null>(null);
  // Un PDF lu à côté du texte (« choix » : la liste des PDF joints, ou un PDF de l'appareil).
  const [pdfCote, setPdfCote] = useState<{ fichier: Blob; nom: string; page: number } | "choix" | null>(null);
  const choixPdfCote = useRef<HTMLInputElement>(null);
  const [apercuPages, setApercuPages] = useState<ApercuPage[]>([]);
  const [pageCourante, setPageCourante] = useState(1);
  const [seance, setSeance] = useState<{ fin: number; motsDebut: number; minutes: number } | null>(null);
  const [maintenant, setMaintenant] = useState(() => Date.now());
  const [dictee, setDictee] = useState<"arret" | "ecoute">("arret");
  const [provisoire, setProvisoire] = useState("");
  const [annonces, setAnnonces] = useState<{ id: number; texte: string }[]>([]);
  const [aide, setAide] = useState(false);
  const [reglagesAtelier, setReglagesAtelier] = useState(false);
  const [renvoi, setRenvoi] = useState(false);
  const [commentaire, setCommentaire] = useState(false);
  const [dialogueSource, setDialogueSource] = useState<DialogueCalame | null>(null);
  const [dialogueModeles, setDialogueModeles] = useState(false);
  const [dialogueMot, setDialogueMot] = useState<OngletMot | null>(null);
  const [proposer, setProposer] = useState(false);
  const [lienInterne, setLienInterne] = useState(false);
  const [extras, setExtras] = useState(() => extrasDe(doc));
  // Ouvert (à nouveau) depuis la recherche dans tous les documents : on cherche aussitôt.
  const [requeteVue, setRequeteVue] = useState(requeteInitiale);
  if (requeteInitiale !== requeteVue) {
    setRequeteVue(requeteInitiale);
    if (requeteInitiale) setRecherche({ remplacement: false, requete: requeteInitiale });
  }

  const centre = useRef<HTMLDivElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const choixImage = useRef<HTMLInputElement>(null);
  const choixDocument = useRef<HTMLInputElement>(null);
  const minuteur = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const derniereVersion = useRef(0);
  const collerRef = useRef<(e: ClipboardEvent) => boolean>(() => false);
  const courant = useRef({ titre: doc.titre, reglages: doc.reglages });
  const surFrappeRef = useRef<() => void>(() => {});
  // Le point de départ du journal : ce qui est déjà écrit (un document importé ou de bienvenue ne compte pas comme écrit aujourd'hui).
  const motsEnregistres = useRef<number | null>(null);
  const derniereFrappe = useRef(0);
  const dicteeRef = useRef<Dictee | null>(null);
  const zoomAvantRelecture = useRef(1);

  // Les aides à la frappe lisent ces réglages à chaque touche.
  useEffect(() => {
    reglagesSaisie.typographie = prefs.typographie;
    reglagesSaisie.translit = prefs.translitRapide;
  }, [prefs.typographie, prefs.translitRapide]);

  const [options] = useState(() => ({
    immediatelyRender: false,
    extensions: [
      ...extensionsContenu(),
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
      MenuSlash.configure({ supplementaires: COMMANDES_CALAME }),
      CoupuresDePage,
      Numeros,
      Recherche,
      AidesSaisie,
      SensEcriture,
      Analyse,
      Grammaire,
      Replis,
      BlocCourant,
      SurlignageLecture,
      SuiviLiensInternes,
      Sections,
    ],
    content: doc.contenu as object,
    editorProps: {
      attributes: { class: "tiptap", "aria-label": "Texte du document", lang: "fr", spellcheck: "true" },
      handlePaste: (_vue: unknown, evenement: ClipboardEvent) => collerRef.current(evenement),
    },
    onUpdate: () => surFrappeRef.current(),
  }));
  const editor = useEditor(options);
  // Les blocs du menu « / » qui ont besoin d'un dialogue (verset, hadith…) le demandent par un événement.
  useEffect(() => {
    const ouvrir = (e: Event) => {
      const nom = (e as CustomEvent<DialogueCalame>).detail;
      if (nom === "renvoi") setRenvoi(true);
      else if (nom === "lien") setLienInterne(true);
      else if (nom === "pdf") {
        setVueCote(null);
        setPdfCote((p) => p ?? "choix");
      } else setDialogueSource(nom);
    };
    window.addEventListener(EVENEMENT_DIALOGUE, ouvrir);
    return () => window.removeEventListener(EVENEMENT_DIALOGUE, ouvrir);
  }, []);

  // Le style des références suit le réglage du document ; corriger un ouvrage de la bibliothèque corrige ses notes.
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    reglerSources(editor, reglages.styleCitation);
    return abonnerBibliotheque(() => reformaterReferences(editor));
  }, [editor, reglages.styleCitation]);

  // La sauvegarde automatique dans un dossier, à la fréquence choisie (onglet « Sortie »).
  useEffect(() => {
    const verifier = () => {
      const r = lireReglageSauvegarde();
      if (!sauvegardeDue(r)) return;
      if (!dossierPossible() || !r.dossier) {
        // Sans accès à un dossier : un rappel, une fois par période.
        ecrireReglageSauvegarde({ derniere: Date.now() });
        setMessage("Il est temps de sauvegarder tes documents : onglet « Sortie », « Tous mes documents (.zip) ».");
        return;
      }
      void sauvegarderMaintenant(false).then((etat) => {
        if (etat === "permission") setMessage("La sauvegarde automatique attend ton accord : onglet « Sortie », « Sauvegarder maintenant ».");
      });
    };
    const minuteur = setInterval(verifier, 5 * 60_000);
    const premier = setTimeout(verifier, 20_000);
    return () => {
      clearInterval(minuteur);
      clearTimeout(premier);
    };
  }, []);

  // « Lire à côté » sur un PDF joint : il s'ouvre dans la colonne de droite.
  useEffect(() => {
    const ouvrir = (e: Event) => {
      const d = (e as CustomEvent<DemandePdfCote>).detail;
      void lireFichier(d.fichier).then((f) => {
        if (!f) {
          setMessage("Ce PDF n'est pas encore arrivé sur cet appareil : réessaie dans un instant.");
          return;
        }
        setVueCote(null);
        setPdfCote({ fichier: f.blob, nom: d.nom || f.nom || "Document", page: d.page });
      });
    };
    window.addEventListener(EVENEMENT_PDF_COTE, ouvrir);
    return () => window.removeEventListener(EVENEMENT_PDF_COTE, ouvrir);
  }, []);

  // Suivre un lien interne (Ctrl + clic) : vers un titre du document, ou vers un autre document.
  useEffect(() => {
    if (!editor) return;
    brancherSuiviLiens(editor, (c) => {
      if (c.document) props.surOuvrir(c.document);
      else if (c.ancre && !allerALAncre(editor, c.ancre)) setMessage("La partie visée par ce lien n'existe plus.");
    });
  });

  // ---------------------------------------------------------------- enregistrement
  const annoncer = useCallback((texte: string) => {
    const id = Date.now() + Math.random();
    setAnnonces((a) => [...a, { id, texte }]);
    setTimeout(() => setAnnonces((a) => a.filter((x) => x.id !== id)), 6000);
  }, []);

  const enregistrer = useCallback(
    async (versionAussi = false, nomVersion?: string) => {
      if (!editor) return;
      clearTimeout(minuteur.current);
      setEtat("enregistrement");
      const contenu = JSON.parse(JSON.stringify(editor.getJSON())) as unknown;
      const texte = texteDuDocument(contenu);
      // Les champs rangés ailleurs (dossier, étiquettes, propriétés) sont relus : on ne les écrase jamais.
      const stocke = (await lireDocument(doc.id)) ?? doc;
      const aJour: DocumentAtelier = {
        ...stocke,
        titre: courant.current.titre.slice(0, LIMITES_ATELIER.titre),
        reglages: nettoyerReglages(courant.current.reglages),
        contenu,
        modifie: new Date().toISOString(),
        mots: compterMots(texte),
        signes: texte.length,
      };
      try {
        await ecrireDocument(aJour);
        if (motsEnregistres.current === null) motsEnregistres.current = compterMots(texteDuDocument(doc.contenu));
        const delta = aJour.mots - motsEnregistres.current;
        if (delta !== 0) noterEcriture(doc.id, delta);
        motsEnregistres.current = aJour.mots;
        const maintenantMs = Date.now();
        if (versionAussi || maintenantMs - derniereVersion.current > DELAI_VERSION_MS) {
          derniereVersion.current = maintenantMs;
          await ajouterVersion({ documentId: doc.id, quand: aJour.modifie, deltaMots: aJour.mots - doc.mots, contenu, titre: aJour.titre, ...(nomVersion ? { nom: nomVersion } : {}) });
        }
        surListeChangee(aJour);
        setExtras(extrasDe(aJour));
        setEtat("propre");
        for (const j of nouveauxJalons({ pages, termine: extrasDe(aJour).proprietes.statut === "termine" })) annoncer(`Jalon : ${j.libelle} !`);
      } catch {
        setEtat("modifie");
        setMessage("Impossible d'enregistrer sur cet appareil. Vérifie qu'il reste de la place, puis fais une sauvegarde complète.");
      }
    },
    [doc, editor, surListeChangee, pages, annoncer],
  );

  const marquerModifie = useCallback(() => {
    setEtat("modifie");
    // Le temps d'écriture : les secondes entre deux frappes rapprochées (moins d'une minute).
    const ici = Date.now();
    if (derniereFrappe.current > 0 && ici - derniereFrappe.current < 60_000) noterTemps(doc.id, (ici - derniereFrappe.current) / 1000);
    derniereFrappe.current = ici;
    clearTimeout(minuteur.current);
    minuteur.current = setTimeout(() => void enregistrer(), DELAI_ENREGISTREMENT);
  }, [enregistrer, doc.id]);

  useEffect(() => {
    courant.current = { titre, reglages };
  }, [titre, reglages]);

  useEffect(() => {
    surFrappeRef.current = marquerModifie;
  }, [marquerModifie]);

  useEffect(
    () => () => {
      clearTimeout(minuteur.current);
      viderTampon();
    },
    [],
  );

  // Enregistrer avant de quitter la page, s'il reste quelque chose à écrire.
  useEffect(() => {
    const avantFermeture = (e: BeforeUnloadEvent) => {
      viderTampon();
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
    const zone = centre.current;
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
  /*
   * Imprimer : les pages de l'écran, recopiées une à une (impression.ts). Une partie repliée
   * est d'abord dépliée, et sur un écran plus étroit que le papier, la page reprend sa vraie
   * largeur le temps de l'impression : on attend que le texte soit recomposé avant de copier.
   */
  const imprimerComposees = useCallback(async () => {
    if (!editor) return;
    const flux = scene.current?.querySelector<HTMLElement>(".calame-flux");
    if (!flux) {
      exporterPdf();
      return;
    }
    const attendre = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const replie = replisActuels(editor).length > 0;
    toutDeplier(editor);
    const etroit = flux.offsetWidth < geometrie(courant.current.reglages).page.largeur - 1;
    const zoomAvant = zoomRef.current;
    if (etroit) setZoom(0.5);
    if (replie || etroit) await attendre(650);
    try {
      await imprimerPages(flux, courant.current.reglages);
    } finally {
      if (etroit) setZoom(zoomAvant);
    }
  }, [editor]);

  const exporter = useCallback(
    async (quoi: "pdf" | "docx" | "md" | "calame") => {
      if (!editor) return;
      await enregistrer();
      const stocke = (await lireDocument(doc.id)) ?? doc;
      const aJour: DocumentAtelier = {
        ...stocke,
        titre: courant.current.titre,
        reglages: courant.current.reglages,
        contenu: JSON.parse(JSON.stringify(editor.getJSON())),
      };
      try {
        if (quoi === "pdf") {
          await imprimerComposees();
        } else {
          setExportEnCours(quoi);
          // Word et Markdown complets : notes, arabe, schémas et cartes en images, table des matières.
          if (quoi === "docx") await exporterWord(aJour, editor);
          else if (quoi === "md") await exporterMarkdownComplet(aJour, editor);
          else await exporterPaquet(aJour);
        }
      } catch {
        setMessage("L'export n'a pas abouti. Réessaie, ou passe par la sauvegarde complète.");
      } finally {
        setExportEnCours("");
      }
    },
    [doc, editor, enregistrer, imprimerComposees],
  );

  /** Les autres sorties : PDF direct, EPUB, HTML, texte, impression partielle, livret, archive, partage. */
  const sortir = useCallback(
    async (action: ActionSortie) => {
      if (!editor) return;
      const flux = scene.current?.querySelector<HTMLElement>(".calame-flux") ?? null;
      if (action.quoi === "selection") {
        const s = window.getSelection();
        const plage = s && s.rangeCount > 0 ? s.getRangeAt(0) : null;
        if (!flux || !plage || plage.collapsed || !(await imprimerSelection(flux, courant.current.reglages, plage))) setMessage("Sélectionne d'abord le passage à imprimer, dans le texte.");
        return;
      }
      if (action.quoi === "pages") {
        const voulues = lirePlagesDePages(action.pages, pages);
        if (!flux || voulues.length === 0) {
          setMessage(`Indique des pages entre 1 et ${pages}, par exemple « 1-3, 5 ».`);
          return;
        }
        await imprimerPages(flux, courant.current.reglages, { pages: voulues });
        return;
      }
      if (action.quoi === "livret") {
        if (!flux || !(await imprimerLivret(flux, courant.current.reglages))) setMessage("Le livret n'a pas pu être préparé.");
        return;
      }
      await enregistrer();
      const stocke = (await lireDocument(doc.id)) ?? doc;
      const aJour: DocumentAtelier = { ...stocke, titre: courant.current.titre, reglages: courant.current.reglages, contenu: JSON.parse(JSON.stringify(editor.getJSON())) };
      setExportEnCours(action.quoi);
      try {
        switch (action.quoi) {
          case "pdf-direct": {
            if (!flux) break;
            toutDeplier(editor);
            const p = extrasDe(aJour).proprietes;
            const octets = await construirePdfDirect(flux, aJour.reglages, { titre: aJour.titre, auteur: p.auteur, sujet: p.sujet, motsCles: p.motsCles });
            if (octets) telecharger(nomDeFichier(aJour.titre, "pdf"), octets, "application/pdf");
            break;
          }
          case "epub":
            await exporterEpub(aJour, editor);
            break;
          case "html":
            await exporterHtml(aJour, editor);
            break;
          case "txt":
            await exporterTexte(aJour, editor);
            break;
          case "tout": {
            const nombre = await exporterTousLesDocuments();
            annoncer(`${nombre} document${nombre > 1 ? "s" : ""} dans l'archive.`);
            break;
          }
          case "partager":
            await partagerDocument(aJour, editor, action.format);
            break;
          case "publier": {
            const avant = extrasDe(documents.find((d) => d.id === doc.id) ?? doc).publication;
            const r = await publierDocument(aJour, editor, { id: avant?.id, motDePasse: action.motDePasse });
            if ("erreur" in r) setMessage(r.erreur);
            else {
              const protege = action.motDePasse === undefined ? Boolean(avant?.protege) : Boolean(action.motDePasse);
              props.surModifier(doc.id, { publication: { id: r.id, protege, quand: new Date().toISOString() } });
              annoncer(avant ? "Page mise à jour." : "Page publiée : copie son adresse dans l'onglet « Sortie ».");
            }
            break;
          }
          case "depublier": {
            const avant = extrasDe(documents.find((d) => d.id === doc.id) ?? doc).publication;
            if (avant && (await retirerPublicationDuDocument(avant.id))) {
              props.surModifier(doc.id, { publication: null });
              annoncer("Page retirée : son adresse ne mène plus nulle part.");
            } else setMessage("La page n'a pas pu être retirée. Réessaie dans un instant.");
            break;
          }
          case "proposer":
            setProposer(true);
            break;
        }
      } catch {
        setMessage("L'export n'a pas abouti. Réessaie, ou passe par la sauvegarde complète.");
      } finally {
        setExportEnCours("");
      }
    },
    [annoncer, doc, documents, editor, enregistrer, pages, props],
  );

  // ---------------------------------------------------------------- modes
  const basculerConcentration = useCallback(() => {
    setConcentration((avant) => {
      const suite = !avant;
      try {
        if (suite && !document.fullscreenElement) void document.documentElement.requestFullscreen?.().catch(() => undefined);
        if (!suite && document.fullscreenElement) void document.exitFullscreen?.().catch(() => undefined);
      } catch {
        // Le plein écran peut être refusé : le mode concentration reste utile sans lui.
      }
      return suite;
    });
  }, []);

  useEffect(() => {
    const surPleinEcran = () => {
      if (!document.fullscreenElement) setConcentration(false);
    };
    document.addEventListener("fullscreenchange", surPleinEcran);
    return () => document.removeEventListener("fullscreenchange", surPleinEcran);
  }, []);

  const basculerRelecture = useCallback(
    (actif: boolean) => {
      setRelecture(actif);
      editor?.setEditable(!actif);
      if (actif) {
        zoomAvantRelecture.current = zoom;
        setZoom(Math.max(zoom, 1.25));
      } else setZoom(zoomAvantRelecture.current);
    },
    [editor, zoom],
  );

  const basculerDictee = useCallback(() => {
    if (!editor) return;
    if (dicteeRef.current) {
      dicteeRef.current.arreter();
      dicteeRef.current = null;
      setDictee("arret");
      return;
    }
    const d = dicter(editor, "fr-FR", setProvisoire, (erreur) => {
      dicteeRef.current = null;
      setDictee("arret");
      setProvisoire("");
      if (erreur) setMessage(erreur);
    });
    if (d) {
      dicteeRef.current = d;
      setDictee("ecoute");
    } else setMessage("La dictée n'a pas pu démarrer : ce navigateur ne la permet pas (Chrome, Edge et Safari la permettent).");
  }, [editor]);

  useEffect(() => () => dicteeRef.current?.arreter(), []);

  // L'ambiance sonore choisie reprend à l'ouverture (après le premier geste, comme l'exige le navigateur).
  useEffect(() => {
    if (prefs.ambiance === "aucune") return;
    const demarrer = () => jouerAmbiance(lirePreferences().ambiance, lirePreferences().volume);
    window.addEventListener("pointerdown", demarrer, { once: true });
    return () => {
      window.removeEventListener("pointerdown", demarrer);
      arreterAmbiance();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Machine à écrire : la ligne en cours reste au milieu de l'écran.
  useEffect(() => {
    if (!editor || !prefs.machineAEcrire) return;
    const centrer = () => {
      const s = scene.current;
      if (!s || !editor.isFocused) return;
      try {
        const coords = editor.view.coordsAtPos(editor.state.selection.head);
        const boite = s.getBoundingClientRect();
        const ecart = coords.top - (boite.top + boite.height / 2);
        if (Math.abs(ecart) > 4) s.scrollTop += ecart;
      } catch {
        // Position non affichée : rien à centrer.
      }
    };
    editor.on("update", centrer);
    editor.on("selectionUpdate", centrer);
    return () => {
      editor.off("update", centrer);
      editor.off("selectionUpdate", centrer);
    };
  }, [editor, prefs.machineAEcrire]);

  // La page affichée, d'après le défilement.
  const g = geometrie(reglages);
  useEffect(() => {
    const s = scene.current;
    if (!s) return;
    const suivre = () => {
      const pas = (g.page.hauteur + ECART_PAGES) * zoom;
      setPageCourante(Math.min(pages, Math.max(1, Math.floor((s.scrollTop + s.clientHeight / 3) / pas) + 1)));
    };
    suivre();
    s.addEventListener("scroll", suivre, { passive: true });
    return () => s.removeEventListener("scroll", suivre);
  }, [g.page.hauteur, zoom, pages]);

  const allerPage = useCallback(
    (n: number) => {
      const s = scene.current;
      if (!s) return;
      const pas = (g.page.hauteur + ECART_PAGES) * zoom;
      s.scrollTo({ top: (n - 1) * pas, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    },
    [g.page.hauteur, zoom],
  );

  const ajusterLargeur = useCallback(() => {
    const s = scene.current;
    if (!s) return;
    const disponible = s.clientWidth - 48;
    // Jusqu'à 30 % : sur téléphone, la page entière doit pouvoir tenir dans l'écran.
    setZoom(Math.max(0.3, Math.min(ZOOMS[ZOOMS.length - 1], Math.round((disponible / g.page.largeur) * 100) / 100)));
  }, [g.page.largeur]);

  // Séance chronométrée : un tic par seconde, et le bilan à la fin.
  const motsActuels = editor ? compterMots(texteDuDocument(editor.getJSON())) : doc.mots;
  const motsRef = useRef(motsActuels);
  useEffect(() => {
    motsRef.current = motsActuels;
  });
  useEffect(() => {
    if (!seance) return;
    const tic = setInterval(() => {
      const ici = Date.now();
      setMaintenant(ici);
      if (ici < seance.fin) return;
      clearInterval(tic);
      const ecrits = motsRef.current - seance.motsDebut;
      setSeance(null);
      carillon();
      annoncer(`Séance de ${seance.minutes} minutes terminée : ${ecrits >= 0 ? "+" : "−"}${Math.abs(ecrits).toLocaleString("fr-FR")} mots.`);
    }, 1000);
    return () => clearInterval(tic);
  }, [seance, annoncer]);

  // F7 : la remarque de relecture suivante (sa bulle s'ouvre), ou la relecture de tout le document s'il n'y en a pas.
  const relireAuClavier = useCallback(() => {
    if (!editor) return;
    const r = remarqueSuivante(editor.state, editor.state.selection.to);
    if (r) {
      allerALaRemarque(editor, r);
      ouvrirBulle(r.id);
      return;
    }
    setInspecteurOuvert(true);
    setOngletInspecteur("relire");
    void lancerRelecture(editor, "tout", true).then((n) => {
      if (n !== null) annoncer(n === 0 ? "Relecture terminée : rien à redire." : `Relecture terminée : ${n} remarque${n > 1 ? "s" : ""}. F7 pour aller de l'une à l'autre.`);
    });
  }, [editor, annoncer]);

  // ---------------------------------------------------------------- clavier
  useEffect(() => {
    const auClavier = (e: KeyboardEvent) => {
      const commande = e.ctrlKey || e.metaKey;
      const touche = e.key.toLowerCase();
      const cible = e.target as HTMLElement | null;
      const enSaisie = Boolean(cible?.closest("input, textarea, select, [contenteditable='true'], .ProseMirror"));
      if (e.key === "F1" || (commande && e.key === "/") || (e.key === "?" && !enSaisie && !commande && !e.altKey)) {
        e.preventDefault();
        setAide(true);
      } else if (e.key === "F7" && !commande && !e.altKey && editor) {
        // Comme dans les traitements de texte : F7 relit, Maj+F7 donne les synonymes.
        e.preventDefault();
        if (e.shiftKey) setDialogueMot("synonymes");
        else relireAuClavier();
      } else if (commande && e.altKey && e.shiftKey && (touche === "v" || touche === "h")) {
        // Le verset ou le hadith par sa référence (le texte arabe se remplit seul).
        e.preventDefault();
        setDialogueSource(touche === "v" ? "verset" : "hadith");
      } else if (commande && e.shiftKey && touche === "f") {
        e.preventDefault();
        basculerConcentration();
      } else if (commande && e.shiftKey && touche === "c") {
        e.preventDefault();
        setCaracteres("formules");
      } else if (commande && touche === "k") {
        // La barre de commande du Calame passe avant la recherche du site (même raccourci).
        e.preventDefault();
        e.stopImmediatePropagation();
        setPalette((o) => !o);
      } else if (commande && touche === "f") {
        e.preventDefault();
        const choisi = editor && !editor.state.selection.empty ? editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, " ").slice(0, 100) : "";
        setRecherche((r) => ({ remplacement: r?.remplacement ?? false, requete: choisi || r?.requete || "" }));
      } else if (commande && touche === "h") {
        e.preventDefault();
        setRecherche((r) => ({ remplacement: true, requete: r?.requete ?? "" }));
      } else if (commande && touche === "s") {
        e.preventDefault();
        void enregistrer(true);
      } else if (commande && touche === "p") {
        e.preventDefault();
        void exporter("pdf");
      } else if (commande && e.altKey && editor) {
        const chaine = editor.chain().focus();
        if (["1", "2", "3"].includes(e.key)) {
          e.preventDefault();
          chaine.setNode("heading", { level: Number(e.key) + 1 }).run();
        } else if (e.key === "0") {
          e.preventDefault();
          chaine.setParagraph().run();
        } else if (touche === "v") {
          e.preventDefault();
          chaine.insertContent({ type: "verset", attrs: { reference: "" }, content: [{ type: "versetArabe" }, { type: "versetTraduction" }] }).run();
        } else if (touche === "h") {
          e.preventDefault();
          chaine.insertContent({ type: "hadith", attrs: { recueil: "", numero: "", degre: "" }, content: [{ type: "hadithArabe" }, { type: "hadithTraduction" }] }).run();
        } else if (touche === "n") {
          e.preventDefault();
          chaine.insertContent({ type: "note", attrs: { texte: "" } }).run();
        }
      }
    };
    window.addEventListener("keydown", auClavier, true);
    return () => window.removeEventListener("keydown", auClavier, true);
  }, [enregistrer, exporter, editor, basculerConcentration, relireAuClavier]);

  // ---------------------------------------------------------------- actions de la barre de commande
  const actions = useMemo<ActionPalette[]>(
    () => [
      { cle: "nouveau", libelle: "Nouveau document", description: "Commencer une page blanche", groupe: "Document", faire: props.surNouveau },
      { cle: "enregistrer", libelle: "Enregistrer maintenant", description: "Et garder une version datée", groupe: "Document", faire: () => void enregistrer(true) },
      { cle: "rechercher", libelle: "Rechercher dans le document", description: "Ctrl+F", groupe: "Document", faire: () => setRecherche({ remplacement: false, requete: "" }) },
      { cle: "remplacer", libelle: "Rechercher et remplacer", description: "Ctrl+H", groupe: "Document", faire: () => setRecherche({ remplacement: true, requete: "" }) },
      { cle: "dupliquer", libelle: "Dupliquer ce document", description: "Une copie complète", groupe: "Document", faire: () => props.surDupliquer(doc.id) },
      { cle: "corbeille", libelle: "Mettre ce document à la corbeille", description: "Il y reste 30 jours", groupe: "Document", faire: () => props.surCorbeille(doc.id, true) },
      { cle: "versions", libelle: "Versions du document", description: "Voir, comparer, restaurer", groupe: "Document", faire: () => ouvrirOnglet("versions") },
      { cle: "proprietes", libelle: "Propriétés, objectif et échéance", description: "Onglet « Document »", groupe: "Document", faire: () => ouvrirOnglet("document") },
      { cle: "pdf", libelle: "Imprimer ou enregistrer en PDF", description: "La mise en page de l'écran, à l'identique", groupe: "Sortie", faire: () => void exporter("pdf") },
      { cle: "docx", libelle: "Exporter en Word", description: "Un vrai fichier .docx", groupe: "Sortie", faire: () => void exporter("docx") },
      { cle: "md", libelle: "Exporter en Markdown", description: "Texte structuré, pour un autre outil", groupe: "Sortie", faire: () => void exporter("md") },
      { cle: "paquet", libelle: "Sauvegarde complète", description: "Texte, mise en page et images dans un seul fichier", groupe: "Sortie", faire: () => void exporter("calame") },
      { cle: "caracteres", libelle: "Caractères et formules de respect", description: "ﷺ, translittération, symboles (Ctrl+Maj+C)", groupe: "Insérer", faire: () => setCaracteres("formules") },
      { cle: "symboles", libelle: "Symboles", description: "Chercher un caractère par son nom", groupe: "Insérer", faire: () => setCaracteres("symboles") },
      {
        cle: "page-de-garde",
        libelle: "Ajouter une page de garde",
        description: "Au tout début, avec le titre et l'auteur du document",
        groupe: "Insérer",
        faire: () => editor?.chain().focus().insertContentAt(0, { type: "pageDeGarde", attrs: { titre: courant.current.titre, auteur: extras.proprietes.auteur, modele: "classique" } }).run(),
      },
      {
        cle: "commentaire",
        libelle: "Ajouter un commentaire pour moi",
        description: "Dans la marge, à côté du passage choisi ; jamais imprimé",
        groupe: "Relire",
        faire: () => {
          if (editor?.state.selection.empty) setMessage("Sélectionne d'abord le passage à commenter.");
          else setCommentaire(true);
        },
      },
      { cle: "lien-interne", libelle: "Lien interne", description: "Vers une partie de ce document, ou vers un autre document", groupe: "Insérer", faire: () => setLienInterne(true) },
      { cle: "deux-colonnes", libelle: "Mettre en deux colonnes", description: "Le paragraphe ou la sélection", groupe: "Mise en page", faire: () => editor && mettreEnDeuxColonnes(editor) },
      { cle: "une-colonne", libelle: "Revenir à une colonne", description: "Défait le bloc « deux colonnes » où se trouve le curseur", groupe: "Mise en page", faire: () => editor && revenirAUneColonne(editor) },
      {
        cle: "carte-plan",
        libelle: "Carte mentale → plan",
        description: "Chaque branche de la carte devient un titre, juste après elle",
        groupe: "Plan",
        faire: () => {
          if (!editor) return;
          const n = carteMentaleEnPlan(editor);
          setMessage(n > 0 ? "" : "Aucune carte mentale à transformer : insère-en une (« / » puis « carte mentale ») ou sélectionne-la.");
          if (n > 0) annoncer(`${n} titres ajoutés au plan.`);
        },
      },
      { cle: "galerie-separer", libelle: "Séparer la galerie d'images", description: "Les images reprennent leur place l'une sous l'autre", groupe: "Image", faire: () => editor && separerGalerie(editor) },
      { cle: "verset-reference", libelle: "Verset par sa référence", description: "2:255 ou 2:1-5 : le texte arabe se remplit seul", groupe: "Sources", faire: () => setDialogueSource("verset") },
      { cle: "hadith-reference", libelle: "Hadith par sa référence", description: "Recueil et numéro : texte arabe et degré", groupe: "Sources", faire: () => setDialogueSource("hadith") },
      { cle: "renvoi", libelle: "Insérer un renvoi", description: "« voir partie 2, p. 12 » : se met à jour seul", groupe: "Insérer", faire: () => setRenvoi(true) },
      {
        cle: "index-ajouter",
        libelle: "Ajouter à l'index",
        description: "Les mots sélectionnés entrent dans l'index alphabétique",
        groupe: "Insérer",
        faire: () => {
          if (!editor || !ajouterALIndex(editor)) setMessage("Sélectionne d'abord les mots à mettre dans l'index.");
        },
      },
      { cle: "index-inserer", libelle: "Insérer l'index", description: "Tous les mots marqués, avec leurs pages", groupe: "Insérer", faire: () => editor?.chain().focus().insertContent({ type: "indexAlpha" }).run() },
      { cle: "figures-inserer", libelle: "Insérer la table des figures", description: "Images et tableaux légendés, avec leur page", groupe: "Insérer", faire: () => editor?.chain().focus().insertContent({ type: "tableFigures" }).run() },
      {
        cle: "sommaire-insere",
        libelle: "Insérer la table des matières",
        description: "Avec les numéros de page, à l'endroit du curseur",
        groupe: "Insérer",
        faire: () => editor?.chain().focus().insertContent({ type: "sommaire", attrs: { titre: "", profondeur: 4 } }).run(),
      },
      { cle: "relire", libelle: "Relire", description: "Mesures, répétitions, lecture à voix haute", groupe: "Relire", faire: () => ouvrirOnglet("relire") },
      { cle: "grammaire", libelle: "Relire la grammaire et l'orthographe", description: "Accords, conjugaison, typographie (F7)", groupe: "Relire", faire: relireAuClavier },
      { cle: "synonymes", libelle: "Synonymes du mot", description: "Le mot sous le curseur (Maj+F7)", groupe: "Relire", faire: () => setDialogueMot("synonymes") },
      { cle: "anglais", libelle: "Traduire le mot en anglais", description: "D'après le Truchement et le Wiktionnaire", groupe: "Relire", faire: () => setDialogueMot("anglais") },
      { cle: "dictionnaire-perso", libelle: "Mon dictionnaire personnel", description: "Les mots que la relecture ne signale plus", groupe: "Relire", faire: () => ouvrirOnglet("relire") },
      { cle: "relecture", libelle: relecture ? "Quitter le mode relecture" : "Mode relecture", description: "Texte en lecture seule, plus grand", groupe: "Relire", faire: () => basculerRelecture(!relecture) },
      { cle: "cote", libelle: "Afficher ou cacher le plan", description: "La colonne de gauche", groupe: "Affichage", faire: () => setCoteOuvert((o) => !o) },
      { cle: "inspecteur", libelle: "Afficher ou cacher l'inspecteur", description: "La colonne de droite", groupe: "Affichage", faire: () => setInspecteurOuvert((o) => !o) },
      { cle: "sombre", libelle: "Papier sombre", description: "Écrire la nuit sans être ébloui", groupe: "Affichage", faire: () => setReglages((r) => ({ ...r, papierSombre: !r.papierSombre })) },
      { cle: "concentration", libelle: "Mode concentration", description: "Plein écran, seul le paragraphe en cours (Ctrl+Maj+F)", groupe: "Affichage", faire: basculerConcentration },
      { cle: "ajuster", libelle: "Ajuster la page à la largeur", description: "Agrandissement à l'écran", groupe: "Affichage", faire: ajusterLargeur },
      { cle: "taille-reelle", libelle: "Taille réelle (100 %)", description: "Agrandissement à l'écran", groupe: "Affichage", faire: () => setZoom(1) },
      { cle: "reglages-atelier", libelle: "Réglages de l'atelier", description: "Thème, taille des menus, police pour dyslexiques", groupe: "Affichage", faire: () => setReglagesAtelier(true) },
      { cle: "bilan", libelle: "Bilan d'écriture", description: "Objectif du jour, série, calendrier", groupe: "Écriture", faire: () => ouvrirOnglet("bilan") },
      { cle: "seance", libelle: "Séance de 25 minutes", description: "Un compte à rebours, et les mots écrits", groupe: "Écriture", faire: () => setSeance({ fin: Date.now() + 25 * 60_000, motsDebut: motsActuels, minutes: 25 }) },
      { cle: "aide", libelle: "Raccourcis clavier", description: "F1", groupe: "Aide", faire: () => setAide(true) },
      { cle: "bienvenue", libelle: "Document de bienvenue", description: "Tout ce que sait faire le Calame", groupe: "Aide", faire: surBienvenue },
      { cle: "modele", libelle: "Nouveau document à partir d'un modèle", description: "Lettre, exposé, mémoire, fiche de lecture, réfutation, sermon, plan de cours", groupe: "Document", faire: () => setDialogueModeles(true) },
      ...(palette && editor
        ? planDuDocument(editor.state.doc).map((entree) => ({
            cle: `plan-${entree.pos}`,
            libelle: entree.texte || "Titre sans texte",
            description: `Aller à cette partie (niveau ${entree.niveau - 1})`,
            groupe: "Plan",
            faire: () => allerAuTitre(editor, entree.pos),
          }))
        : []),
      ...documents
        .filter((d) => d.id !== doc.id && !extrasDe(d).corbeille)
        .slice(0, 200)
        .map((d) => ({ cle: `doc-${d.id}`, libelle: d.titre || "Sans titre", description: `${d.mots.toLocaleString("fr-FR")} mots`, groupe: "Ouvrir", faire: () => props.surOuvrir(d.id) })),
    ],
    [enregistrer, exporter, documents, doc.id, relecture, basculerRelecture, basculerConcentration, ajusterLargeur, motsActuels, surBienvenue, props, palette, editor, extras.proprietes.auteur, annoncer, relireAuClavier],
  );

  function ouvrirOnglet(cle: string) {
    setInspecteurOuvert(true);
    setOngletInspecteur(cle);
  }

  const papier = tailleDuPapier(reglages.format, reglages.orientation);
  const stats = useMemo(() => {
    const texte = editor ? texteDuDocument(editor.getJSON()) : "";
    const mots = compterMots(texte);
    return { mots, signes: texte.length, pages, minutes: Math.max(1, Math.round(mots / 220)) };
  }, [editor, pages, etat]); // eslint-disable-line react-hooks/exhaustive-deps

  const motsSelection = useMemo(() => {
    if (!editor || editor.state.selection.empty) return null;
    const { from, to } = editor.state.selection;
    return compterMots(editor.state.doc.textBetween(from, to, " ", " "));
  }, [editor, etat, maintenant]); // eslint-disable-line react-hooks/exhaustive-deps

  const modifierReglages = (modif: Partial<ReglagesPage>) => {
    setReglages((r) => ({ ...r, ...modif }));
    marquerModifie();
  };

  const modifierDocument = (modif: Partial<DocumentAtelier>) => {
    props.surModifier(doc.id, modif);
    setExtras((x) => ({ ...x, ...modif }) as typeof x);
  };

  const restaurer = async (v: VersionAtelier) => {
    if (!editor) return;
    await enregistrer(true, "Avant restauration");
    editor.commands.setContent(v.contenu as object);
    setTitre(v.titre);
    courant.current = { ...courant.current, titre: v.titre };
    await enregistrer(true);
  };

  const supplementaires: OngletSupplementaire[] = editor
    ? [
        {
          cle: "document",
          libelle: "Document",
          Icone: FileCog,
          contenu: (
            <>
              <PanneauDocument
                doc={{ ...doc, ...extras, dossier: documents.find((d) => d.id === doc.id)?.dossier ?? doc.dossier }}
                mots={stats.mots}
                documents={documents}
                surModifier={modifierDocument}
                surDupliquer={() => props.surDupliquer(doc.id)}
                surCorbeille={() => props.surCorbeille(doc.id, true)}
              />
              <PanneauVerrou doc={documents.find((d) => d.id === doc.id) ?? doc} surModifier={modifierDocument} />
              <PanneauPlace doc={documents.find((d) => d.id === doc.id) ?? doc} documents={documents} />
            </>
          ),
        },
        {
          cle: "relire",
          libelle: "Relire",
          Icone: SpellCheck2,
          contenu: <PanneauRelire editor={editor} stats={stats} relecture={relecture} surRelecture={basculerRelecture} surChercher={(mot) => setRecherche({ remplacement: false, requete: mot })} />,
        },
        {
          cle: "versions",
          libelle: "Versions",
          Icone: History,
          contenu: <PanneauVersions editor={editor} documentId={doc.id} reglages={reglages} surVersion={(nom) => enregistrer(true, nom)} surRestaurer={restaurer} />,
        },
        {
          cle: "bilan",
          libelle: "Bilan d'écriture",
          Icone: BarChart3,
          contenu: <PanneauBilan seanceEnCours={seance !== null} surSeance={(minutes) => setSeance({ fin: Date.now() + minutes * 60_000, motsDebut: motsActuels, minutes })} />,
        },
      ]
    : [];

  const delai = extras.echeance ? delaiEcheance(extras.echeance) : null;
  const restant = seance ? Math.max(0, seance.fin - maintenant) : 0;
  const docCote = vueCote ? (vueCote === doc.id ? null : documents.find((d) => d.id === vueCote)) : null;
  // Les PDF joints au document (pour les lire à côté).
  const pdfsJoints: DemandePdfCote[] = [];
  if (pdfCote === "choix" && editor) {
    editor.state.doc.descendants((n) => {
      if (n.type.name === "documentPdf" && n.attrs.fichier) pdfsJoints.push({ fichier: String(n.attrs.fichier), nom: String(n.attrs.nom ?? ""), page: Number(n.attrs.page) || 1 });
      return n.type.name !== "documentPdf";
    });
  }
  /** Citer le PDF lu à côté : la page seule (en note), ou le passage sélectionné et sa page. */
  const citerPdf = (nom: string, c: { page: number; texte: string }) => {
    if (!editor) return;
    const note = { type: "note", attrs: { texte: `${nom.replace(/\.pdf$/i, "")}, p.\u00a0${c.page}.` } };
    if (c.texte) editor.chain().focus().insertContent([{ type: "blockquote", content: [{ type: "paragraph", content: [{ type: "text", text: `«\u00a0${c.texte}\u00a0»` }, note] }] }, { type: "paragraph" }]).run();
    else editor.chain().focus().insertContent(note).run();
  };

  return (
    <div
      className="calame"
      data-cote={coteOuvert && !concentration ? "" : undefined}
      data-inspecteur={inspecteurOuvert && !concentration ? "" : undefined}
      data-concentration={concentration ? "" : undefined}
      data-relecture={relecture ? "" : undefined}
      data-theme-atelier={prefs.theme !== "auto" ? prefs.theme : undefined}
      data-dyslexie={prefs.dyslexie ? "" : undefined}
      style={{ "--calame-echelle": prefs.tailleInterface } as React.CSSProperties}
    >
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

        {extras.objectifMots > 0 && (
          <span className="calame-objectif" title={`Objectif : ${extras.objectifMots.toLocaleString("fr-FR")} mots`}>
            <span className="calame-objectif-jauge" style={{ width: `${Math.min(100, (stats.mots / extras.objectifMots) * 100)}%` }} />
            <span className="calame-objectif-texte">{Math.min(100, Math.round((stats.mots / extras.objectifMots) * 100))} %</span>
          </span>
        )}
        {delai && (
          <span className="calame-echeance" data-alerte={delai.jours <= 1 ? "" : undefined} title={`Échéance : ${extras.echeance}`}>
            <CalendarClock className="size-4" aria-hidden="true" />
            {delai.jours >= 0 ? `J−${delai.jours}` : `+${-delai.jours} j`}
          </span>
        )}
        {seance && (
          <button type="button" className="calame-seance" onClick={() => setSeance(null)} title="Séance en cours (cliquer pour arrêter)">
            <Timer className="size-4" aria-hidden="true" />
            {Math.floor(restant / 60000)}:{String(Math.floor((restant % 60000) / 1000)).padStart(2, "0")}
            <span className="calame-seance-mots">+{Math.max(0, motsActuels - seance.motsDebut)}</span>
          </button>
        )}

        <span className="calame-etat" aria-live="polite">
          {etat === "enregistrement" ? (
            <>
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> Enregistrement…
            </>
          ) : etat === "modifie" ? (
            "Modifié"
          ) : (
            <EtatEnregistre />
          )}
        </span>

        <button type="button" className="calame-icone calame-icone-large" onClick={() => setRecherche((r) => (r ? null : { remplacement: false, requete: "" }))} aria-pressed={recherche !== null} title="Rechercher (Ctrl+F)">
          <Search className="size-5" aria-hidden="true" />
          <span className="sr-only">Rechercher dans le document</span>
        </button>
        <button type="button" className="calame-icone calame-icone-large" onClick={() => setCaracteres("formules")} title="Caractères et formules (Ctrl+Maj+C)">
          <Omega className="size-5" aria-hidden="true" />
          <span className="sr-only">Caractères et formules de respect</span>
        </button>
        <button type="button" className="calame-icone" onClick={() => setPalette(true)} title="Barre de commande (Ctrl+K)">
          <Command className="size-5" aria-hidden="true" />
          <span className="sr-only">Ouvrir la barre de commande</span>
        </button>
        <button type="button" className="calame-icone" onClick={() => void exporter("pdf")} title="Imprimer ou enregistrer en PDF (Ctrl+P)">
          <Printer className="size-5" aria-hidden="true" />
          <span className="sr-only">Imprimer</span>
        </button>
        <button type="button" className="calame-icone calame-icone-large" onClick={() => setReglagesAtelier(true)} title="Réglages de l'atelier">
          <Settings2 className="size-5" aria-hidden="true" />
          <span className="sr-only">Réglages de l&apos;atelier</span>
        </button>
        <button type="button" className="calame-icone calame-icone-large" onClick={() => setAide(true)} title="Raccourcis (F1)">
          <HelpCircle className="size-5" aria-hidden="true" />
          <span className="sr-only">Aide</span>
        </button>
        <button type="button" className="calame-icone" onClick={() => setInspecteurOuvert((o) => !o)} aria-pressed={inspecteurOuvert} title="Mise en forme">
          <PanelRight className="size-5" aria-hidden="true" />
          <span className="sr-only">Afficher ou cacher la colonne de droite</span>
        </button>
        <BoutonCompte />
        {accesComplet && (
          <Link href="/utilisateur" className="calame-sortie" data-portail="Les espaces" data-portail-sur="Mode utilisateur" data-portail-accent="or">
            Quitter
          </Link>
        )}
      </header>

      {coteOuvert && !concentration && (
        <BarreLaterale
          documents={documents}
          actif={doc.id}
          editor={editor}
          pages={apercuPages}
          pageCourante={pageCourante}
          surAllerPage={allerPage}
          surOuvrir={props.surOuvrir}
          surNouveau={props.surNouveau}
          surImporter={props.surImporter}
          surModifier={props.surModifier}
          surDupliquer={props.surDupliquer}
          surCorbeille={props.surCorbeille}
          surSupprimerDefinitivement={props.surSupprimerDefinitivement}
          surOuvrirACote={(id) => setVueCote(id)}
          surModeles={props.surModele ? () => setDialogueModeles(true) : undefined}
        />
      )}

      <main className="calame-centre" ref={centre}>
        {onglets.length > 1 && (
          <nav className="calame-onglets-docs sans-impression" aria-label="Documents ouverts">
            {onglets.map((o) => (
              <span key={o.id} className="calame-onglet-doc" aria-current={o.id === doc.id ? "page" : undefined}>
                <button type="button" onClick={() => o.id !== doc.id && props.surOuvrir(o.id)} title={o.titre}>
                  {o.titre || "Sans titre"}
                </button>
                <button type="button" className="calame-onglet-fermer" onClick={() => surFermerOnglet(o.id)} aria-label={`Fermer l'onglet ${o.titre}`}>
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              </span>
            ))}
          </nav>
        )}
        {!concentration && (
          <div className="calame-outils sans-impression">
            {editor && (
              <BarreOutils
                editor={editor}
                groupesEcartes={GROUPES_ECARTES_ATELIER}
                commandesSupplementaires={COMMANDES_CALAME}
                finDeBarre={<SelecteurStyle editor={editor} styles={reglages.stylesNommes} />}
              />
            )}
          </div>
        )}
        {message && (
          <p className="message message-erreur sans-impression" role="alert" onClick={() => setMessage("")}>
            {message}
          </p>
        )}
        <div className="calame-plateau" data-cote-a-cote={vueCote || pdfCote ? "" : undefined}>
          {recherche && editor && <BarreRecherche key={recherche.requete} editor={editor} avecRemplacement={recherche.remplacement} requeteInitiale={recherche.requete} surFermer={() => setRecherche(null)} />}
          <h1 className="calame-titre-impression">{titre}</h1>
          <Papier editor={editor} reglages={reglages} titre={titre} auteur={extras.proprietes.auteur} surPages={setPages} zoom={zoom} surApercu={setApercuPages} refScene={scene} />
          {vueCote && (
            <aside className="calame-vue-cote sans-impression" aria-label="Document ouvert à côté">
              <div className="calame-vue-cote-tete">
                <select
                  className="champ"
                  value={vueCote}
                  onChange={(e) => {
                    if (e.target.value === "__pdf") {
                      setVueCote(null);
                      setPdfCote("choix");
                    } else setVueCote(e.target.value);
                  }}
                  aria-label="Document affiché à côté"
                >
                  <option value={doc.id}>Ce document (dernier enregistrement)</option>
                  <option value="__pdf">Un PDF (joint ou de cet appareil)…</option>
                  {documents
                    .filter((d) => d.id !== doc.id && !extrasDe(d).corbeille && (!extrasDe(d).verrou || estOuvert(d.id)))
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.titre || "Sans titre"}
                      </option>
                    ))}
                </select>
                <button type="button" className="calame-icone" onClick={() => setVueCote(null)} aria-label="Fermer la vue côte à côte">
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
              <div className="calame-vue-cote-corps">
                <VueLecture contenu={docCote ? docCote.contenu : (documents.find((d) => d.id === doc.id)?.contenu ?? doc.contenu)} reglages={docCote ? docCote.reglages : reglages} />
              </div>
            </aside>
          )}
          {!vueCote && pdfCote && (
            <aside className="calame-vue-cote calame-vue-cote-pdf sans-impression" aria-label="PDF ouvert à côté">
              <div className="calame-vue-cote-tete">
                {pdfCote === "choix" ? (
                  <span className="calame-vue-cote-titre">Lire un PDF à côté</span>
                ) : (
                  <button type="button" className="bouton bouton-discret bouton-petit" onClick={() => setPdfCote("choix")}>
                    Changer de PDF
                  </button>
                )}
                <button
                  type="button"
                  className="calame-icone"
                  onClick={() => setPdfCote(null)}
                  aria-label="Fermer le PDF"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
              <div className="calame-vue-cote-corps">
                {pdfCote === "choix" ? (
                  <div className="calame-pdf-choix">
                    {pdfsJoints.length > 0 && (
                      <>
                        <p className="inspecteur-libelle">PDF joints à ce document</p>
                        <ul>
                          {pdfsJoints.map((p) => (
                            <li key={p.fichier}>
                              <button
                                type="button"
                                className="calame-biblio-ouvrage"
                                onClick={() => window.dispatchEvent(new CustomEvent<DemandePdfCote>(EVENEMENT_PDF_COTE, { detail: p }))}
                              >
                                <span className="calame-biblio-titre">{p.nom || "Document"}</span>
                                {p.page > 1 && <span className="calame-biblio-meta">à partir de la page {p.page}</span>}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                    <button type="button" className="bouton bouton-principal" onClick={() => choixPdfCote.current?.click()}>
                      Ouvrir un PDF de cet appareil
                    </button>
                    <p className="inspecteur-aide">Le PDF ouvert ainsi n&apos;est pas ajouté au document : il reste le temps de la lecture. Pour le garder, joins-le (bouton « Insérer », « Document »).</p>
                  </div>
                ) : (
                  <LecteurPdfLocal fichier={pdfCote.fichier} nom={pdfCote.nom} pageInitiale={pdfCote.page} surCiter={(c) => citerPdf(pdfCote.nom, c)} />
                )}
              </div>
            </aside>
          )}
          <input
            ref={choixPdfCote}
            type="file"
            accept="application/pdf,.pdf"
            hidden
            onChange={(e) => {
              const fichier = e.target.files?.[0];
              e.target.value = "";
              if (fichier) setPdfCote({ fichier, nom: fichier.name, page: 1 });
            }}
          />
        </div>
        {editor && <OutilsBloc editor={editor} conteneur={centre} />}
        {editor && (
          <MenuBulle
            editor={editor}
            extra={
              <>
                <button type="button" className="outil" aria-label="Synonymes" title="Synonymes (Maj+F7)" onMouseDown={(e) => e.preventDefault()} onClick={() => setDialogueMot("synonymes")}>
                  <WholeWord className="size-4" aria-hidden="true" />
                </button>
                <button type="button" className="outil" aria-label="Traduire en anglais" title="En anglais (Truchement)" onMouseDown={(e) => e.preventDefault()} onClick={() => setDialogueMot("anglais")}>
                  <Languages className="size-4" aria-hidden="true" />
                </button>
              </>
            }
          />
        )}
        {editor && <BulleGrammaire editor={editor} />}
        {editor && <PanneauBloc editor={editor} />}
        {editor && (
          <BarreEtat
            page={pageCourante}
            pages={pages}
            mots={stats.mots}
            motsSelection={motsSelection}
            zoom={zoom}
            surZoom={setZoom}
            surAjuster={ajusterLargeur}
            surAllerPage={allerPage}
            concentration={concentration}
            surConcentration={basculerConcentration}
            vueCote={vueCote !== null}
            surVueCote={() => setVueCote((v) => (v ? null : doc.id))}
            dictee={dicteeDisponible() ? dictee : "indisponible"}
            surDictee={basculerDictee}
            provisoire={provisoire}
          />
        )}
        {editor && <BarreMobile editor={editor} surRechercher={() => setRecherche({ remplacement: false, requete: "" })} />}
      </main>

      {inspecteurOuvert && !concentration && (
        <Inspecteur
          reglages={reglages}
          surReglages={modifierReglages}
          stats={stats}
          surExport={(q) => void exporter(q)}
          enCours={exportEnCours}
          supplementaires={supplementaires}
          onglet={ongletInspecteur}
          surOnglet={setOngletInspecteur}
          pageEnPlus={<PanneauMiseEnPage reglages={reglages} surReglages={modifierReglages} />}
          sortieEnPlus={<PanneauSortie editor={editor} pages={pages} enCours={exportEnCours} surAction={(a) => void sortir(a)} publication={extrasDe(documents.find((d) => d.id === doc.id) ?? doc).publication} />}
          stylesEnPlus={
            <>
              <PanneauStyles reglages={reglages} surReglages={modifierReglages} documents={documents} docId={doc.id} />
              <PanneauTexte reglages={reglages} surReglages={modifierReglages} />
            </>
          }
        />
      )}

      <ListeSlash />
      {renvoi && editor && <DialogueRenvoi editor={editor} surFermer={() => setRenvoi(false)} />}
      {commentaire && editor && <DialogueCommentaire editor={editor} surFermer={() => setCommentaire(false)} />}
      {dialogueSource === "verset" && editor && <DialogueVerset editor={editor} surFermer={() => setDialogueSource(null)} />}
      {dialogueSource === "hadith" && editor && <DialogueHadith editor={editor} surFermer={() => setDialogueSource(null)} />}
      {(dialogueSource === "bibliotheque" || dialogueSource === "reference-ouvrage" || dialogueSource === "citation-ouvrage") && editor && (
        <DialogueBibliotheque editor={editor} mode={dialogueSource === "reference-ouvrage" ? "reference" : dialogueSource === "citation-ouvrage" ? "citation" : "gerer"} surFermer={() => setDialogueSource(null)} />
      )}
      {(dialogueSource === "lien-web" || dialogueSource === "youtube") && editor && <DialogueLienWeb editor={editor} youtube={dialogueSource === "youtube"} surFermer={() => setDialogueSource(null)} />}
      {dialogueSource === "glossaire" && editor && <DialogueGlossaire editor={editor} surFermer={() => setDialogueSource(null)} />}
      {dialogueMot && editor && <DialogueMot editor={editor} onglet={dialogueMot} surFermer={() => setDialogueMot(null)} surAnnonce={annoncer} />}
      {proposer && <DialogueProposer doc={{ ...doc, titre, reglages, contenu: editor ? editor.getJSON() : doc.contenu }} editor={editor} surFermer={() => setProposer(false)} />}
      {dialogueModeles && props.surModele && (
        <DialogueModeles
          docOuvert={{ ...doc, titre, reglages, contenu: editor ? editor.getJSON() : doc.contenu }}
          surChoisir={(d) => {
            setDialogueModeles(false);
            props.surModele?.(d);
          }}
          surFermer={() => setDialogueModeles(false)}
        />
      )}
      {dialogueSource === "article" && editor && <DialogueArticle editor={editor} surFermer={() => setDialogueSource(null)} />}
      {lienInterne && editor && <DialogueLien editor={editor} documents={documents} docId={doc.id} surFermer={() => setLienInterne(false)} />}
      {palette && <PaletteCommandes editor={editor} actions={actions} surFermer={() => setPalette(false)} />}
      {caracteres && editor && <Caracteres editor={editor} onglet={caracteres} surOnglet={setCaracteres} surFermer={() => setCaracteres(null)} />}
      {aide && (
        <Aide
          surFermer={() => setAide(false)}
          surBienvenue={() => {
            setAide(false);
            surBienvenue();
          }}
        />
      )}
      {reglagesAtelier && <ReglagesAtelier surFermer={() => setReglagesAtelier(false)} />}

      {annonces.length > 0 && (
        <div className="calame-annonces sans-impression" role="status" aria-live="polite">
          {annonces.map((a) => (
            <p key={a.id} className="calame-annonce">
              {a.texte}
            </p>
          ))}
        </div>
      )}

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
