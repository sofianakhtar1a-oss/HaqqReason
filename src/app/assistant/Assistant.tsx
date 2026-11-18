"use client";

import Link from "next/link";
import {
  BookOpenText,
  Check,
  Copy,
  FileStack,
  KeyRound,
  LoaderCircle,
  MessageSquareText,
  MessagesSquare,
  PanelLeft,
  Pencil,
  Plus,
  RotateCcw,
  SendHorizontal,
  Settings2,
  Square,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { BoutonTheme } from "@/components/BoutonTheme";
import { BoutonCompte } from "@/components/compte/BoutonCompte";
import { Logo } from "@/components/Logo";
import { LIMITES } from "@/lib/assistant/limites";
import { EFFORTS, FOURNISSEURS, formaterCout, formaterJetons, infoFournisseur, modele as ficheModele, modeleConseille, modelesDe, nomModele, USAGE_VIDE, type Effort, type Fournisseur, type IdModele } from "@/lib/assistant/modeles";
import { noteArret, type EvenementFlux, type InfoContexte } from "@/lib/assistant/protocole";
import { useAccesComplet } from "@/lib/client/acces";
import { useTextes } from "@/lib/modules/textes-client";
import { api, envoyerQuestion, ErreurApi, type Conversation, type Espace, type Etat, type FicheCle, type FicheDocument, type Message } from "./api";
import { Reglages, RelierCle } from "./Cle";
import { Documents, type Envoi } from "./Documents";
import { estPdf, lirePdfPourAssistant } from "./extraction";
import { Lutrin } from "./Lutrin";
import { Reponse } from "./Reponse";
import "./assistant.css";
import "@fontsource-variable/literata/opsz.css";
import "@fontsource-variable/literata/opsz-italic.css";

type MessageLocal = Message & { contexte?: InfoContexte | null; raison?: string };
type Detail = { conversation: Conversation; messages: MessageLocal[]; documents: FicheDocument[] };
type Direct = { conversationId: string; texte: string; reflexion: boolean; contexte: InfoContexte | null; modele: IdModele };
type Alerte = { code: string; message: string; fournisseur?: Fournisseur };

const ESPACES: Espace[] = ["general", "pdf"];
const CODES_CLE = ["sans_cle", "cle_illisible", "cle_invalide"];

const SUGGESTIONS_GENERAL = [
  "Explique-moi le raisonnement par l'absurde, avec un exemple simple.",
  "Aide-moi à construire le plan d'un exposé sur ",
  "Corrige et améliore ce texte, sans changer son sens : ",
  "Quelles objections peut-on faire à cet argument, et comment y répondre ? ",
];
const ACTIONS_PDF = [
  { nom: "Résumer", texte: "Résume chaque document : son sujet, sa thèse, ses grandes parties et sa conclusion, avec les pages." },
  { nom: "Comparer", texte: "Compare les documents : points communs, différences et contradictions éventuelles, avec un tableau si c'est utile." },
  { nom: "Arguments", texte: "Quels sont les arguments principaux de chaque document, et sur quelles preuves reposent-ils ?" },
  { nom: "Citations", texte: "Relève les passages les plus importants à citer, entre guillemets, avec leurs pages." },
];

const maintenant = () => new Date().toISOString();
/** Identifiants provisoires des messages, en attendant ceux du serveur. */
let numeroLocal = 0;
const idLocal = (prefixe: string) => `${prefixe}-${++numeroLocal}`;

function titreProvisoire(texte: string): string {
  const ligne = texte.replace(/\s+/g, " ").trim();
  return ligne.length <= 70 ? ligne : `${ligne.slice(0, 68).replace(/\s+\S*$/, "")}…`;
}

function dateCourte(iso: string): string {
  const d = new Date(iso);
  const jour = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const ecart = Math.round((jour(new Date()) - jour(d)) / 86_400_000);
  if (ecart === 0) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (ecart === 1) return "hier";
  if (ecart < 7) return d.toLocaleDateString("fr-FR", { weekday: "long" });
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", ...(d.getFullYear() !== new Date().getFullYear() ? { year: "numeric" } : {}) });
}

function ligneLecture(c: InfoContexte): string {
  const docs = c.documents.filter((d) => d.pages);
  if (c.mode === "complet") return `Lu : le texte intégral de ${docs.length === 1 ? "Doc " + docs[0].numero : docs.length + " documents"}.`;
  const liste = docs.map((d) => `Doc ${d.numero} p. ${d.pages}`).join(" · ");
  return `${c.integraleImpossible ? "Trop long pour la lecture intégrale : " : ""}lu, les passages les plus utiles : ${liste || "aucun passage trouvé"}.`;
}

export function Assistant() {
  const t = useTextes("assistant");
  const accesComplet = useAccesComplet();

  const [etat, setEtat] = useState<Etat | null>(null);
  const [erreurEtat, setErreurEtat] = useState<ErreurApi | null>(null);
  const [espace, setEspace] = useState<Espace>("general");
  const [listes, setListes] = useState<Record<Espace, Conversation[] | null>>({ general: null, pdf: null });
  const [detail, setDetail] = useState<Detail | null>(null);
  const [chargement, setChargement] = useState(false);
  const [direct, setDirect] = useState<Direct | null>(null);
  const [saisie, setSaisie] = useState("");
  const [alerte, setAlerte] = useState<Alerte | null>(null);
  const [reglages, setReglages] = useState(false);
  const [lutrin, setLutrin] = useState<{ doc: FicheDocument; page: number } | null>(null);
  const [envois, setEnvois] = useState<Envoi[]>([]);
  const [coteOuvert, setCoteOuvert] = useState(false);
  const [docsOuverts, setDocsOuverts] = useState(false);
  const [renommer, setRenommer] = useState<{ id: string; titre: string } | null>(null);
  const [aSupprimer, setASupprimer] = useState<string | null>(null);
  const [copie, setCopie] = useState<string | null>(null);
  const [lit, setLit] = useState(false);
  const [annonce, setAnnonce] = useState("");
  const [modele, setModele] = useState<IdModele>("claude-sonnet-5-5");
  const [effort, setEffort] = useState<Effort>("medium");

  const arret = useRef<AbortController | null>(null);
  const lecture = useRef<AbortController | null>(null);
  const fil = useRef<HTMLDivElement>(null);
  const enBas = useRef(true);
  const zoneSaisie = useRef<HTMLTextAreaElement>(null);
  const convCourante = useRef<string | null>(null);
  const annulerRenommer = useRef(false);

  const fournisseur: Fournisseur = ficheModele(modele).fournisseur;
  const ia = infoFournisseur(fournisseur);
  const cles = etat?.cles ?? [];
  const cle = cles.find((c) => c.fournisseur === fournisseur) ?? null;
  const cleUtilisable = Boolean(cle && cle.statut === "valide" && cle.lisible !== false);
  const noms = useMemo(() => new Map((detail?.documents ?? []).map((d) => [d.numero, d.nom])), [detail?.documents]);
  const conversations = listes[espace];

  /* ---------- Adresse de la page : #general / #pdf, et ?c= la conversation ouverte ---------- */
  const marquerAdresse = useCallback((e: Espace, id: string | null) => {
    history.replaceState(null, "", `${window.location.pathname}${id ? `?c=${id}` : ""}#${e}`);
  }, []);

  const chargerListe = useCallback(async (e: Espace) => {
    try {
      const { conversations: liste } = await api.conversations(e);
      setListes((x) => ({ ...x, [e]: liste }));
    } catch (err) {
      setListes((x) => ({ ...x, [e]: x[e] ?? [] }));
      if (err instanceof ErreurApi) setAlerte({ code: err.code, message: err.message });
    }
  }, []);

  const ouvrir = useCallback(
    async (id: string) => {
      // Une réponse en cours dans une autre conversation s'arrête (le serveur garde ce qui est écrit).
      if (arret.current && convCourante.current !== id) arret.current.abort();
      setChargement(true);
      setAlerte(null);
      setLutrin(null);
      setCoteOuvert(false);
      try {
        const d = await api.conversation(id);
        setDetail({ conversation: d.conversation, messages: d.messages, documents: d.documents });
        setEspace(d.conversation.espace);
        marquerAdresse(d.conversation.espace, id);
        enBas.current = true;
      } catch (err) {
        if (err instanceof ErreurApi && err.code === "absent") {
          setListes((x) => ({ general: x.general?.filter((c) => c.id !== id) ?? null, pdf: x.pdf?.filter((c) => c.id !== id) ?? null }));
          marquerAdresse(espace, null);
        }
        setAlerte({ code: err instanceof ErreurApi ? err.code : "reseau", message: err instanceof ErreurApi ? err.message : "Ouverture impossible." });
      } finally {
        setChargement(false);
      }
    },
    [espace, marquerAdresse],
  );

  /* ---------- À l'ouverture : l'état du compte, la liste, la conversation de l'adresse ---------- */
  useEffect(() => {
    let vivant = true;
    const e: Espace = window.location.hash === "#pdf" ? "pdf" : "general";
    const c = new URLSearchParams(window.location.search).get("c");
    api
      .etat()
      .then((reponse) => {
        if (!vivant) return;
        setEtat(reponse);
        setEspace(e);
        // Le modèle par défaut ; s'il appartient à une IA sans clé, celui d'une IA reliée.
        const relie = reponse.cles.find((c) => c.statut === "valide" && c.lisible !== false);
        const prefere = ficheModele(reponse.reglages.modele);
        setModele(relie && !reponse.cles.some((c) => c.fournisseur === prefere.fournisseur) ? modeleConseille(relie.fournisseur).id : prefere.id);
        setEffort(reponse.reglages.effort);
        void chargerListe(e);
        if (c && /^[0-9a-f-]{36}$/i.test(c)) void ouvrir(c);
      })
      .catch((err) => vivant && setErreurEtat(err instanceof ErreurApi ? err : new ErreurApi("reseau", "Le serveur ne répond pas.", 0)));
    return () => {
      vivant = false;
    };
    // Une seule fois, à l'ouverture de la page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    convCourante.current = detail?.conversation.id ?? null;
  }, [detail?.conversation.id]);

  /* ---------- Le fil défile avec la réponse, sauf si l'on remonte pour relire ---------- */
  useEffect(() => {
    const el = fil.current;
    if (el && enBas.current) el.scrollTop = el.scrollHeight;
  }, [detail?.messages.length, direct?.texte, direct?.reflexion]);

  // Hauteur de la zone de saisie selon son texte, pour les navigateurs sans « field-sizing ».
  useLayoutEffect(() => {
    const z = zoneSaisie.current;
    if (!z || (typeof CSS !== "undefined" && CSS.supports("field-sizing", "content"))) return;
    z.style.height = "auto";
    z.style.height = `${Math.min(z.scrollHeight, 224)}px`;
  }, [saisie]);

  const changerEspace = (e: Espace) => {
    if (e === espace) return;
    arret.current?.abort();
    setEspace(e);
    setDetail(null);
    setLutrin(null);
    setAlerte(null);
    setDocsOuverts(false);
    marquerAdresse(e, null);
    if (!listes[e]) void chargerListe(e);
  };

  const nouvelle = () => {
    arret.current?.abort();
    setDetail(null);
    setLutrin(null);
    setAlerte(null);
    setCoteOuvert(false);
    marquerAdresse(espace, null);
    requestAnimationFrame(() => zoneSaisie.current?.focus());
  };

  /** La conversation ouverte, créée au premier message ou au premier PDF. */
  const assurerConversation = async (titre: string): Promise<Detail> => {
    if (detail) return detail;
    const { conversation } = await api.creerConversation(espace, titre);
    const d: Detail = { conversation, messages: [], documents: [] };
    setDetail(d);
    setListes((x) => ({ ...x, [espace]: [conversation, ...(x[espace] ?? [])] }));
    marquerAdresse(espace, conversation.id);
    return d;
  };

  const remonter = (id: string, titre?: string) =>
    setListes((x) => {
      const liste = x[espace] ?? [];
      const c = liste.find((y) => y.id === id);
      if (!c) return x;
      return { ...x, [espace]: [{ ...c, maj: maintenant(), titre: c.titre || titre || c.titre }, ...liste.filter((y) => y.id !== id)] };
    });

  /* ---------- Envoyer une question, lire la réponse au fil de l'eau ---------- */
  const envoyer = async (texteBrut?: string, reessayer = false) => {
    if (direct) return;
    const texte = (texteBrut ?? saisie).trim();
    if (!reessayer && !texte) return;
    if (!cleUtilisable) {
      setAlerte({ code: cle ? "cle_invalide" : "sans_cle", message: cle ? `Ta clé ${ia.nom} doit être remplacée avant de continuer.` : `Relie d'abord ta clé ${ia.nom} pour lui poser des questions.` });
      return;
    }
    if (texte.length > LIMITES.questionMax) {
      setAlerte({ code: "question", message: `Ta question dépasse ${LIMITES.questionMax.toLocaleString("fr-FR")} caractères : raccourcis-la, ou importe le texte en PDF dans ChatPDF.` });
      return;
    }
    if (espace === "pdf" && !detail?.documents.some((x) => x.actif)) {
      setAlerte({ code: "sans_document", message: "Ajoute ou coche au moins un PDF : c'est lui que Claude va lire." });
      return;
    }
    let d: Detail;
    try {
      d = await assurerConversation(titreProvisoire(texte));
    } catch (err) {
      setAlerte({ code: err instanceof ErreurApi ? err.code : "reseau", message: err instanceof ErreurApi ? err.message : "Impossible d'ouvrir la conversation." });
      return;
    }

    const idTemp = idLocal("local");
    const idConv = d.conversation.id;
    /** Ne touche qu'à CETTE conversation, même si l'on en a ouvert une autre entre-temps. */
    const majConv = (f: (x: Detail) => Detail) => setDetail((x) => (x && x.conversation.id === idConv ? f(x) : x));
    setAlerte(null);
    enBas.current = true;
    if (reessayer) {
      majConv((x) => {
        const i = x.messages.findLastIndex((m) => m.role === "user");
        return { ...x, messages: x.messages.slice(0, i + 1) };
      });
    } else {
      setSaisie("");
      majConv((x) => ({ ...x, messages: [...x.messages, { id: idTemp, role: "user", contenu: texte, modele: "", etat: "complet", usage: USAGE_VIDE, cout: 0, creeLe: maintenant() }] }));
    }

    const controleur = new AbortController();
    arret.current = controleur;
    setDirect({ conversationId: idConv, texte: "", reflexion: false, contexte: null, modele });
    setAnnonce("");
    const recu: { texte: string; contexte: InfoContexte | null; fin: Extract<EvenementFlux, { t: "fin" }> | null; erreur: Alerte | null } = { texte: "", contexte: null, fin: null, erreur: null };

    try {
      await envoyerQuestion(
        { conversationId: d.conversation.id, texte: reessayer ? undefined : texte, modele, effort, reessayer },
        (ev) => {
          if (ev.t === "debut") {
            recu.contexte = ev.contexte;
            majConv((x) => ({ ...x, messages: x.messages.map((m) => (m.id === idTemp ? { ...m, id: ev.questionId } : m)) }));
            setDirect((v) => v && { ...v, contexte: ev.contexte });
          } else if (ev.t === "reflexion") setDirect((v) => v && { ...v, reflexion: true });
          else if (ev.t === "texte") {
            recu.texte += ev.v;
            const courant = recu.texte;
            setDirect((v) => v && { ...v, texte: courant });
          } else if (ev.t === "erreur") recu.erreur = { code: ev.code, message: ev.message };
          else if (ev.t === "fin") recu.fin = ev;
        },
        controleur.signal,
      );
    } catch (err) {
      const e = err instanceof ErreurApi ? err : new ErreurApi("reseau", "La réponse n'a pas pu arriver.", 0);
      const questionId = typeof e.extra.questionId === "string" ? e.extra.questionId : null;
      if (questionId) {
        // La question est enregistrée, avec l'erreur en guise de réponse (comme après un rechargement).
        majConv((x) => ({ ...x, messages: [...x.messages.map((m) => (m.id === idTemp ? { ...m, id: questionId } : m)), { id: idLocal("erreur"), role: "assistant", contenu: e.message, modele, etat: "erreur", usage: USAGE_VIDE, cout: 0, creeLe: maintenant() }] }));
        remonter(d.conversation.id, titreProvisoire(texte));
      } else if (!reessayer) {
        // Refusée avant d'être enregistrée (clé, rythme, plafond) : la question revient dans la zone de saisie.
        majConv((x) => ({ ...x, messages: x.messages.filter((m) => m.id !== idTemp) }));
        if (convCourante.current === idConv) setSaisie(texte);
      }
      if (CODES_CLE.includes(e.code)) {
        const f = (e.extra.fournisseur as Fournisseur | undefined) ?? fournisseur;
        setEtat((x) => x && { ...x, cles: e.code === "sans_cle" ? x.cles.filter((c) => c.fournisseur !== f) : x.cles.map((c) => (c.fournisseur === f ? { ...c, statut: e.code === "cle_invalide" ? "invalide" : c.statut, lisible: e.code === "cle_illisible" ? false : c.lisible } : c)) });
      }
      setAlerte({ code: e.code, message: e.message, fournisseur: (e.extra.fournisseur as Fournisseur | undefined) ?? fournisseur });
      setDirect(null);
      arret.current = null;
      return;
    }

    const coupe = controleur.signal.aborted && !recu.fin;
    const fin = recu.fin;
    const etatReponse = fin?.etat ?? (coupe ? "interrompu" : "complet");
    const reponse: MessageLocal = {
      id: fin?.id ?? idLocal("local-r"),
      role: "assistant",
      contenu: etatReponse === "erreur" ? (recu.erreur?.message ?? "Erreur.") : recu.texte,
      modele,
      etat: etatReponse,
      usage: fin?.usage ?? USAGE_VIDE,
      cout: fin?.cout ?? 0,
      creeLe: maintenant(),
      contexte: recu.contexte,
      raison: fin?.raison ?? "",
    };
    majConv((x) => ({ ...x, messages: [...x.messages, reponse], conversation: { ...x.conversation, titre: x.conversation.titre || titreProvisoire(texte) } }));
    remonter(d.conversation.id, titreProvisoire(texte));
    if (fin) {
      setEtat((x) => x && { ...x, bilan: { ...x.bilan, moisCout: x.bilan.moisCout + fin.cout, moisAppels: x.bilan.moisAppels + 1, moisJetons: x.bilan.moisJetons + fin.usage.entree + fin.usage.sortie + fin.usage.ecritureCache + fin.usage.lectureCache, dixMinutes: x.bilan.dixMinutes + 1 } });
      if (recu.erreur?.code === "cle_invalide") setEtat((x) => x && { ...x, cles: x.cles.map((c) => (c.fournisseur === fournisseur ? { ...c, statut: "invalide" } : c)) });
    }
    setDirect(null);
    arret.current = null;
    setAnnonce(etatReponse === "complet" ? "Réponse de Claude terminée." : etatReponse === "interrompu" ? "Réponse interrompue." : "La réponse a échoué.");
    // Arrêtée avant la fin : le serveur a gardé la réponse partielle ; on relit pour avoir son identifiant.
    if (coupe) window.setTimeout(() => convCourante.current === idConv && void ouvrir(idConv), 1500);
  };

  const arreter = () => arret.current?.abort();

  /* ---------- Les PDF : lus ici, puis leur texte rejoint la conversation ---------- */
  const ajouterFichiers = async (fichiers: File[]) => {
    if (lecture.current) return;
    const refuses = fichiers.filter((f) => !estPdf(f));
    const pdfs = fichiers.filter(estPdf).slice(0, LIMITES.pdfParEnvoi);
    const horsLimite = fichiers.filter(estPdf).length - pdfs.length;
    const base = Date.now();
    const lignes: Envoi[] = pdfs.map((f, i) => ({ cle: `${base}-${i}`, nom: f.name, etat: "attente", fait: 0, total: 0 }));
    const erreurs: Envoi[] = [
      ...refuses.map((f, i) => ({ cle: `${base}-r${i}`, nom: f.name, etat: "erreur" as const, fait: 0, total: 0, message: "Ce n'est pas un PDF." })),
      ...(horsLimite > 0 ? [{ cle: `${base}-l`, nom: `${horsLimite} fichier${horsLimite > 1 ? "s" : ""} de plus`, etat: "erreur" as const, fait: 0, total: 0, message: `${LIMITES.pdfParEnvoi} PDF au plus à la fois.` }] : []),
    ];
    setEnvois((x) => [...x.filter((e) => e.etat !== "fini" && e.etat !== "erreur"), ...lignes, ...erreurs]);
    if (!pdfs.length) return;
    let d: Detail;
    try {
      d = await assurerConversation(titreProvisoire(pdfs.map((f) => f.name.replace(/\.pdf$/i, "")).join(", ")));
    } catch (err) {
      setAlerte({ code: err instanceof ErreurApi ? err.code : "reseau", message: err instanceof ErreurApi ? err.message : "Impossible d'ouvrir la conversation." });
      setEnvois((x) => x.map((e) => (lignes.some((l) => l.cle === e.cle) ? { ...e, etat: "erreur", message: "Conversation indisponible." } : e)));
      return;
    }
    const controleur = new AbortController();
    lecture.current = controleur;
    setLit(true);
    const maj = (cleLigne: string, champs: Partial<Envoi>) => setEnvois((x) => x.map((e) => (e.cle === cleLigne ? { ...e, ...champs } : e)));
    for (let i = 0; i < pdfs.length; i++) {
      const ligne = lignes[i];
      if (controleur.signal.aborted) {
        maj(ligne.cle, { etat: "erreur", message: "Annulé." });
        continue;
      }
      try {
        maj(ligne.cle, { etat: "lecture" });
        const lu = await lirePdfPourAssistant(pdfs[i], (a) => maj(ligne.cle, { etat: a.etape, fait: a.fait, total: a.total }), controleur.signal);
        maj(ligne.cle, { etat: "envoi" });
        const { document } = await api.ajouterDocument({ conversationId: d.conversation.id, nom: lu.nom, pages: lu.pages, pagesVides: lu.pagesVides, empreinte: lu.empreinte, texte: lu.texte });
        setDetail((x) => (x && x.conversation.id === d.conversation.id ? { ...x, documents: [...x.documents, document] } : x));
        const ocr = lu.ocr ? ` · ${lu.ocr} page${lu.ocr > 1 ? "s" : ""} reconnue${lu.ocr > 1 ? "s" : ""} par OCR` : "";
        maj(ligne.cle, { etat: "fini", message: `Prêt : Doc ${document.numero}${ocr}${lu.ocrLimite ? ` (OCR limité à ${LIMITES.pagesOcrMax} pages)` : ""}` });
      } catch (err) {
        const message = (err as { name?: string }).name === "AbortError" ? "Annulé." : err instanceof Error ? err.message : "Lecture impossible.";
        maj(ligne.cle, { etat: "erreur", message });
      }
    }
    lecture.current = null;
    setLit(false);
    remonter(d.conversation.id);
    window.setTimeout(() => setEnvois((x) => x.filter((e) => e.etat !== "fini")), 8000);
  };

  // Coller des PDF (Ctrl+V) dans ChatPDF.
  const ajouter = useRef(ajouterFichiers);
  useEffect(() => {
    ajouter.current = ajouterFichiers;
  });
  useEffect(() => {
    if (espace !== "pdf") return;
    const coller = (e: ClipboardEvent) => {
      const fichiers = [...(e.clipboardData?.files ?? [])].filter(estPdf);
      if (!fichiers.length) return;
      e.preventDefault();
      void ajouter.current(fichiers);
    };
    window.addEventListener("paste", coller);
    return () => window.removeEventListener("paste", coller);
  }, [espace]);

  const basculerDocument = async (id: string, actif: boolean) => {
    setDetail((x) => x && { ...x, documents: x.documents.map((d) => (d.id === id ? { ...d, actif } : d)) });
    try {
      await api.basculerDocument(id, actif);
    } catch (err) {
      setDetail((x) => x && { ...x, documents: x.documents.map((d) => (d.id === id ? { ...d, actif: !actif } : d)) });
      setAlerte({ code: "document", message: err instanceof ErreurApi ? err.message : "Modification impossible." });
    }
  };

  const supprimerDocument = async (id: string) => {
    try {
      await api.supprimerDocument(id);
      setDetail((x) => x && { ...x, documents: x.documents.filter((d) => d.id !== id) });
      setLutrin((l) => (l?.doc.id === id ? null : l));
    } catch (err) {
      setAlerte({ code: "document", message: err instanceof ErreurApi ? err.message : "Suppression impossible." });
    }
  };

  const reglerLecture = async (l: "auto" | "integrale") => {
    if (!detail) return;
    try {
      const { conversation } = await api.modifierConversation(detail.conversation.id, { lecture: l });
      setDetail((x) => x && { ...x, conversation });
    } catch (err) {
      setAlerte({ code: "lecture", message: err instanceof ErreurApi ? err.message : "Réglage impossible." });
    }
  };

  const validerRenommer = async () => {
    if (annulerRenommer.current) {
      annulerRenommer.current = false;
      return;
    }
    if (!renommer) return;
    const { id, titre } = renommer;
    setRenommer(null);
    try {
      const { conversation } = await api.modifierConversation(id, { titre: titre.trim() });
      setListes((x) => ({ ...x, [conversation.espace]: (x[conversation.espace] ?? []).map((c) => (c.id === id ? conversation : c)) }));
      setDetail((x) => (x && x.conversation.id === id ? { ...x, conversation } : x));
    } catch (err) {
      setAlerte({ code: "renommer", message: err instanceof ErreurApi ? err.message : "Renommage impossible." });
    }
  };

  const supprimerConversation = async (id: string) => {
    setASupprimer(null);
    try {
      await api.supprimerConversation(id);
      setListes((x) => ({ general: x.general?.filter((c) => c.id !== id) ?? null, pdf: x.pdf?.filter((c) => c.id !== id) ?? null }));
      if (detail?.conversation.id === id) nouvelle();
    } catch (err) {
      setAlerte({ code: "supprimer", message: err instanceof ErreurApi ? err.message : "Suppression impossible." });
    }
  };

  const choisirModele = (m: IdModele) => {
    setModele(m);
    setAlerte(null);
    void api
      .regler({ modele: m })
      .then((r) => setEtat((x) => x && { ...x, reglages: r.reglages }))
      .catch(() => undefined);
  };
  /** Choisir une IA : son modèle conseillé (ou celui des réglages s'il est de cette IA). */
  const choisirIA = (f: Fournisseur) => {
    const prefere = etat ? ficheModele(etat.reglages.modele) : null;
    choisirModele(prefere?.fournisseur === f ? prefere.id : modeleConseille(f).id);
  };
  const choisirEffort = (ef: Effort) => {
    setEffort(ef);
    void api
      .regler({ effort: ef })
      .then((r) => setEtat((x) => x && { ...x, reglages: r.reglages }))
      .catch(() => undefined);
  };
  const [reglagesSur, setReglagesSur] = useState<Fournisseur | null>(null);
  const ouvrirReglages = (sur: Fournisseur | null = null) => {
    setReglagesSur(sur);
    setReglages(true);
  };

  const copier = async (id: string, texte: string) => {
    try {
      await navigator.clipboard.writeText(texte);
      setCopie(id);
      window.setTimeout(() => setCopie((c) => (c === id ? null : c)), 1600);
    } catch {
      // Presse-papiers refusé par le navigateur.
    }
  };

  /** Clics dans le fil : références vers le lutrin, boutons « Copier » des blocs de code. */
  const clicDansLeFil = (e: React.MouseEvent<HTMLDivElement>) => {
    const cible = e.target as HTMLElement;
    const ref = cible.closest<HTMLElement>(".aia-ref");
    if (ref && detail) {
      const doc = detail.documents.find((d) => d.numero === Number(ref.dataset.doc));
      if (!doc) {
        setAlerte({ code: "reference", message: `Le Doc ${ref.dataset.doc} n'est plus dans cette conversation.` });
        return;
      }
      setLutrin({ doc, page: Math.min(doc.pages, Math.max(1, Number(ref.dataset.page) || 1)) });
      return;
    }
    const code = cible.closest<HTMLElement>(".aia-copier-code");
    if (code) {
      const texte = code.parentElement?.querySelector("code")?.textContent ?? "";
      void navigator.clipboard.writeText(texte).then(() => {
        code.textContent = "Copié";
        window.setTimeout(() => (code.textContent = "Copier"), 1400);
      });
    }
  };

  const onFermerReglages = useCallback(() => setReglages(false), []);
  const onFermerLutrin = useCallback(() => setLutrin(null), []);

  /* ---------- Affichage ---------- */
  const messages = detail?.messages ?? [];
  const derniereReponse = messages.findLast((m) => m.role === "assistant");
  const docs = detail?.documents ?? [];
  const enPdf = espace === "pdf";

  const panneauDocuments = (fermer?: () => void) => (
    <Documents
      documents={docs}
      envois={envois}
      lecture={detail?.conversation.lecture ?? "auto"}
      occupe={lit || !etat}
      onFichiers={(f) => void ajouterFichiers(f)}
      onBasculer={(id, a) => void basculerDocument(id, a)}
      onSupprimer={(id) => void supprimerDocument(id)}
      onLecture={(l) => void reglerLecture(l)}
      onAnnuler={() => lecture.current?.abort()}
      onFermer={fermer}
    />
  );

  const accueilEspace = (
    <div className="aia-accueil">
      {enPdf ? <BookOpenText className="aia-accueil-icone" strokeWidth={1.2} aria-hidden="true" /> : <MessageSquareText className="aia-accueil-icone" strokeWidth={1.2} aria-hidden="true" />}
      <h2 className="aia-accueil-titre">{enPdf ? t("pdf.titre") : t("general.titre")}</h2>
      <p className="aia-accueil-texte">{enPdf ? t("pdf.texte") : t("general.texte")}</p>
      {enPdf ? (
        docs.some((d) => d.actif) ? (
          <div className="aia-suggestions" role="group" aria-label="Actions rapides">
            {ACTIONS_PDF.map((a) => (
              <button key={a.nom} type="button" className="aia-suggestion" onClick={() => void envoyer(a.texte)} disabled={!cleUtilisable}>
                <span className="aia-suggestion-nom">{a.nom}</span>
                <span className="aia-suggestion-texte">{a.texte}</span>
              </button>
            ))}
          </div>
        ) : (
          <button type="button" className="bouton bouton-discret aia-accueil-docs" onClick={() => setDocsOuverts(true)}>
            <FileStack className="size-4" aria-hidden="true" />
            Ajouter des PDF
          </button>
        )
      ) : (
        <div className="aia-suggestions" role="group" aria-label="Idées pour commencer">
          {SUGGESTIONS_GENERAL.map((s) => (
            <button
              key={s}
              type="button"
              className="aia-suggestion"
              onClick={() => {
                setSaisie(s);
                requestAnimationFrame(() => {
                  const z = zoneSaisie.current;
                  if (z) {
                    z.focus();
                    z.setSelectionRange(s.length, s.length);
                  }
                });
              }}
            >
              <span className="aia-suggestion-texte">{s.endsWith(" ") ? `${s}…` : s}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const actionAlerte = (a: Alerte) => {
    if (CODES_CLE.includes(a.code) || a.code === "plafond") {
      return (
        <button type="button" className="aia-lien" onClick={() => ouvrirReglages(a.code === "plafond" ? null : (a.fournisseur ?? fournisseur))}>
          {a.code === "plafond" ? "Régler le plafond" : "Ouvrir les réglages de la clé"}
        </button>
      );
    }
    if (a.code === "deconnecte") {
      return (
        <Link className="aia-lien" href="/connexion?retour=%2Fassistant">
          Se reconnecter
        </Link>
      );
    }
    if (a.code === "credit_epuise") {
      return (
        <a className="aia-lien" href={infoFournisseur(a.fournisseur ?? fournisseur).pageCredit} target="_blank" rel="noopener noreferrer">
          Recharger mon crédit
        </a>
      );
    }
    return null;
  };

  let centre: React.ReactNode;
  if (erreurEtat) {
    centre = (
      <div className="aia-etat-page">
        {erreurEtat.code === "deconnecte" ? (
          <>
            <KeyRound className="aia-accueil-icone" strokeWidth={1.2} aria-hidden="true" />
            <h2 className="aia-accueil-titre">Connecte-toi pour utiliser l&apos;assistant</h2>
            <p className="aia-accueil-texte">Tes conversations, tes PDF et ta clé sont rangés avec ton compte Google : personne d&apos;autre n&apos;y a accès.</p>
            <Link className="bouton bouton-principal" href="/connexion?retour=%2Fassistant">
              Se connecter avec Google
            </Link>
          </>
        ) : (
          <>
            <h2 className="aia-accueil-titre">{erreurEtat.code === "installation" ? "Encore un peu de patience" : "L'assistant ne répond pas"}</h2>
            <p className="aia-accueil-texte">{erreurEtat.message}</p>
            <button type="button" className="bouton bouton-discret" onClick={() => window.location.reload()}>
              Réessayer
            </button>
          </>
        )}
      </div>
    );
  } else if (!etat) {
    centre = (
      <div className="aia-etat-page" role="status">
        <LoaderCircle className="size-6 animate-spin text-encre-douce" aria-hidden="true" />
        <p className="aia-accueil-texte">Ouverture de l&apos;assistant…</p>
      </div>
    );
  } else if (cles.length === 0 && !detail) {
    centre = (
      <div className="aia-fil aia-fil-cle">
        <RelierCle
          titre={t("cle.titre")}
          texte={t("cle.texte")}
          fournisseurInitial={fournisseur}
          onRelie={(f) => {
            setEtat((x) => x && { ...x, cles: [...x.cles.filter((c) => c.fournisseur !== f.fournisseur), f] });
            if (ficheModele(modele).fournisseur !== f.fournisseur) choisirModele(modeleConseille(f.fournisseur).id);
          }}
        />
      </div>
    );
  } else {
    centre = (
      <>
        <div className="aia-fil" ref={fil} onClick={clicDansLeFil} onScroll={(e) => (enBas.current = e.currentTarget.scrollHeight - e.currentTarget.scrollTop - e.currentTarget.clientHeight < 80)}>
          <div className="aia-fil-colonne">
            {chargement ? (
              <p className="aia-attente" role="status">
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> Ouverture de la conversation…
              </p>
            ) : messages.length === 0 && !(direct && direct.conversationId === detail?.conversation.id) ? (
              accueilEspace
            ) : (
              messages.map((m) =>
                m.role === "user" ? (
                  <div key={m.id} className="aia-question">
                    <p>{m.contenu}</p>
                  </div>
                ) : (
                  <article key={m.id} className="aia-reponse" data-etat={m.etat}>
                    {m.etat === "erreur" ? <p className="aia-reponse-erreur">{m.contenu}</p> : <Reponse contenu={m.contenu} noms={noms} />}
                    {m.contexte && <p className="aia-reponse-lecture">{ligneLecture(m.contexte)}</p>}
                    {noteArret(m.raison ?? "", m.etat) && <p className="aia-reponse-note">{noteArret(m.raison ?? "", m.etat)}</p>}
                    <footer className="aia-reponse-pied">
                      {m.etat !== "erreur" && (
                        <span
                          className="aia-reponse-conso"
                          title={`Entrée : ${m.usage.entree.toLocaleString("fr-FR")} jetons · cache relu : ${m.usage.lectureCache.toLocaleString("fr-FR")} · cache écrit : ${m.usage.ecritureCache.toLocaleString("fr-FR")} · sortie : ${m.usage.sortie.toLocaleString("fr-FR")}. Coût estimé par le site ; la facture qui fait foi est celle d'Anthropic.`}
                        >
                          {nomModele(m.modele)} · {formaterJetons(m.usage.entree + m.usage.lectureCache + m.usage.ecritureCache)} lus, {formaterJetons(m.usage.sortie)} écrits · ≈ {formaterCout(m.cout)}
                        </span>
                      )}
                      <span className="flex-1" />
                      {m.etat !== "erreur" && (
                        <button type="button" className="aia-pied-bouton" onClick={() => void copier(m.id, m.contenu)}>
                          {copie === m.id ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
                          {copie === m.id ? "Copié" : "Copier"}
                        </button>
                      )}
                      {m.id === derniereReponse?.id && !direct && cleUtilisable && (
                        <button type="button" className="aia-pied-bouton" onClick={() => void envoyer(undefined, true)}>
                          <RotateCcw className="size-3.5" aria-hidden="true" />
                          {m.etat === "complet" ? "Régénérer" : "Réessayer"}
                        </button>
                      )}
                    </footer>
                  </article>
                ),
              )
            )}
            {direct && direct.conversationId === detail?.conversation.id && (
              <article className="aia-reponse" data-direct="" aria-busy="true">
                {direct.texte ? (
                  <Reponse contenu={direct.texte} noms={noms} enDirect />
                ) : (
                  <p className="aia-reflexion" role="status">
                    <span className="aia-astrolabe" aria-hidden="true" />
                    {direct.reflexion ? "Claude réfléchit…" : direct.contexte ? "Claude lit tes documents…" : "Claude lit ta question…"}
                  </p>
                )}
                {direct.contexte && <p className="aia-reponse-lecture">{ligneLecture(direct.contexte)}</p>}
              </article>
            )}
          </div>
        </div>

        <p className="sr-only" role="status" aria-live="polite">
          {annonce}
        </p>
        <div className="aia-bas">
          {alerte && (
            <div className="message message-erreur aia-alerte" role="alert">
              <span className="flex-1">{alerte.message}</span>
              {actionAlerte(alerte)}
              <button type="button" className="bouton-icone" onClick={() => setAlerte(null)} aria-label="Fermer le message">
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          )}
          {etat && !cleUtilisable && !alerte && (
            <div className="message aia-alerte aia-alerte-ia" role="status">
              <span className="flex-1">
                {!cle
                  ? `Pour poser tes questions à ${ia.nom}, relie ta clé ${ia.entreprise} (facturée sur ton compte).`
                  : cle.lisible === false
                    ? `Ta clé ${ia.nom} ne peut plus être lue : colle-la de nouveau.`
                    : `${ia.entreprise} a refusé ta clé ${ia.nom} : remplace-la pour continuer.`}
              </span>
              <button type="button" className="aia-lien" onClick={() => ouvrirReglages(fournisseur)}>
                {cle ? "Remplacer la clé" : `Relier ma clé ${ia.nom}`}
              </button>
            </div>
          )}
          <form
            className="aia-saisie"
            onSubmit={(e) => {
              e.preventDefault();
              void envoyer();
            }}
          >
            <textarea
              ref={zoneSaisie}
              className="aia-saisie-zone"
              rows={1}
              value={saisie}
              maxLength={LIMITES.questionMax}
              placeholder={enPdf ? "Pose une question sur tes PDF…" : "Écris ta question…"}
              aria-label="Ta question"
              onChange={(e) => setSaisie(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  void envoyer();
                } else if (e.key === "Escape" && direct) arreter();
              }}
            />
            <div className="aia-saisie-barre">
              <div className="aia-saisie-reglages">
              <label className="aia-choix aia-choix-ia" data-ia={fournisseur}>
                <span className="sr-only">Intelligence artificielle</span>
                <select value={fournisseur} onChange={(e) => choisirIA(e.target.value as Fournisseur)}>
                  {FOURNISSEURS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nom}
                      {cles.some((c) => c.fournisseur === f.id) ? "" : " (clé à relier)"}
                    </option>
                  ))}
                </select>
              </label>
              <label className="aia-choix">
                <span className="sr-only">Modèle</span>
                <select value={modele} onChange={(e) => choisirModele(e.target.value as IdModele)}>
                  {modelesDe(fournisseur).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nom.replace(/^(Claude|Gemini) /, "")}
                    </option>
                  ))}
                </select>
              </label>
              <label className="aia-choix">
                <span className="sr-only">Réflexion</span>
                <select value={effort} onChange={(e) => choisirEffort(e.target.value as Effort)}>
                  {EFFORTS.map((ef) => (
                    <option key={ef.id} value={ef.id}>
                      {ef.nom}
                    </option>
                  ))}
                </select>
              </label>
              {enPdf && (
                <button type="button" className="aia-choix aia-docs-bouton" onClick={() => setDocsOuverts(true)}>
                  <FileStack className="size-4" aria-hidden="true" />
                  PDF ({docs.filter((d) => d.actif).length}/{docs.length})
                </button>
              )}
              <span className="aia-saisie-facture">{cle ? `Facturé sur ta clé ${ia.nom} ${cle.apercu}` : `${ia.nom} : clé à relier`}</span>
              </div>
              {direct ? (
                <button type="button" className="aia-envoyer" data-arret="" onClick={arreter} aria-label="Arrêter la réponse">
                  <Square className="size-4" fill="currentColor" aria-hidden="true" />
                </button>
              ) : (
                <button type="submit" className="aia-envoyer" disabled={!saisie.trim() || !cleUtilisable} aria-label="Envoyer">
                  <SendHorizontal className="size-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </form>
        </div>
      </>
    );
  }

  return (
    <div
      className="aia"
      data-espace={espace}
      onDragOver={(e) => {
        if (enPdf && e.dataTransfer.types.includes("Files")) e.preventDefault();
      }}
      onDrop={(e) => {
        if (!enPdf || !e.dataTransfer.files.length) return;
        e.preventDefault();
        void ajouterFichiers([...e.dataTransfer.files]);
      }}
    >
      <header className="aia-tete sans-impression">
        <Logo />
        <span className="aia-tete-titre" aria-hidden="true">
          {t("tete.titre")}
        </span>
        <nav className="aia-onglets" aria-label="Espaces de l'assistant">
          {ESPACES.map((e) => (
            <button key={e} type="button" className="aia-onglet" aria-current={espace === e ? "page" : undefined} onClick={() => changerEspace(e)}>
              {e === "pdf" ? <FileStack className="size-4" aria-hidden="true" /> : <MessagesSquare className="size-4" aria-hidden="true" />}
              {e === "pdf" ? t("onglet.pdf") : t("onglet.general")}
            </button>
          ))}
        </nav>
        <span className="flex-1" />
        {etat && (cles.length > 0 || etat.bilan.moisAppels > 0) && (
          <button type="button" className="aia-depense" onClick={() => ouvrirReglages()} title="Ta dépense estimée ce mois-ci, sur ta clé">
            <span className="aia-depense-libelle">Ce mois</span> {formaterCout(etat.bilan.moisCout)}
          </button>
        )}
        {etat && (
          <button type="button" className="bouton-icone" onClick={() => ouvrirReglages()} aria-label="Réglages de l'assistant">
            <Settings2 className="size-5" aria-hidden="true" />
          </button>
        )}
        <BoutonTheme />
        <BoutonCompte />
        {accesComplet && (
          <Link href="/utilisateur" className="calame-sortie">
            Quitter
          </Link>
        )}
      </header>

      <div className="aia-corps">
        <h1 className="sr-only">{t("meta.titre")}</h1>
        <aside className="aia-cote" data-ouvert={coteOuvert ? "" : undefined} aria-label="Conversations">
          <div className="aia-cote-tete">
            <button type="button" className="bouton bouton-discret aia-nouvelle" onClick={nouvelle} disabled={!etat}>
              <Plus className="size-4" aria-hidden="true" />
              Nouvelle conversation
            </button>
            <button type="button" className="bouton-icone aia-cote-fermer" onClick={() => setCoteOuvert(false)} aria-label="Fermer la liste">
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
          <ul className="aia-conversations">
            {conversations === null && etat && (
              <li className="aia-attente">
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> Chargement…
              </li>
            )}
            {conversations?.length === 0 && <li className="aia-conversations-vide">{enPdf ? "Tes conversations sur des PDF apparaîtront ici." : "Tes conversations apparaîtront ici."}</li>}
            {conversations?.map((c) => (
              <li key={c.id} className="aia-conversation" aria-current={detail?.conversation.id === c.id ? "true" : undefined}>
                {renommer?.id === c.id ? (
                  <form
                    className="aia-renommer"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void validerRenommer();
                    }}
                  >
                    <input
                      className="champ"
                      autoFocus
                      value={renommer.titre}
                      maxLength={200}
                      onChange={(e) => setRenommer({ id: c.id, titre: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key !== "Escape") return;
                        annulerRenommer.current = true;
                        setRenommer(null);
                      }}
                      onBlur={() => void validerRenommer()}
                      aria-label="Nouveau titre"
                    />
                  </form>
                ) : aSupprimer === c.id ? (
                  <div className="aia-conversation-confirmer">
                    <span>Supprimer avec ses messages{c.espace === "pdf" ? " et ses PDF" : ""} ?</span>
                    <button type="button" className="aia-lien aia-lien-danger" onClick={() => void supprimerConversation(c.id)}>
                      Supprimer
                    </button>
                    <button type="button" className="aia-lien" onClick={() => setASupprimer(null)}>
                      Garder
                    </button>
                  </div>
                ) : (
                  <>
                    <button type="button" className="aia-conversation-ouvrir" onClick={() => void ouvrir(c.id)}>
                      <span className="aia-conversation-titre">{c.titre || "Sans titre"}</span>
                      <span className="aia-conversation-date">{dateCourte(c.maj)}</span>
                    </button>
                    <span className="aia-conversation-actions">
                      <button type="button" className="bouton-icone" onClick={() => setRenommer({ id: c.id, titre: c.titre })} aria-label={`Renommer « ${c.titre || "Sans titre"} »`}>
                        <Pencil className="size-3.5" aria-hidden="true" />
                      </button>
                      <button type="button" className="bouton-icone" onClick={() => setASupprimer(c.id)} aria-label={`Supprimer « ${c.titre || "Sans titre"} »`}>
                        <Trash2 className="size-3.5" aria-hidden="true" />
                      </button>
                    </span>
                  </>
                )}
              </li>
            ))}
          </ul>
          <p className="aia-cote-pied">
            {t("tete.pastille")}
            {cles.length ? ` · ${cles.map((c) => infoFournisseur(c.fournisseur).nom).join(", ")}` : ""}
          </p>
        </aside>
        {coteOuvert && <button type="button" className="aia-voile" aria-label="Fermer la liste" onClick={() => setCoteOuvert(false)} />}

        <main className="aia-centre">
          <div className="aia-centre-tete">
            <button type="button" className="bouton-icone aia-cote-bouton" onClick={() => setCoteOuvert(true)} aria-label="Afficher les conversations">
              <PanelLeft className="size-5" aria-hidden="true" />
            </button>
            <p className="aia-centre-titre">{detail?.conversation.titre || (enPdf ? t("onglet.pdf") : t("onglet.general"))}</p>
            <button type="button" className="bouton-icone" onClick={nouvelle} aria-label="Nouvelle conversation" disabled={!etat}>
              <Plus className="size-5" aria-hidden="true" />
            </button>
          </div>
          {centre}
        </main>

        {enPdf && etat && !erreurEtat && (
          <>
            <div className="aia-droite" data-ouvert={docsOuverts ? "" : undefined}>
              {panneauDocuments(() => setDocsOuverts(false))}
            </div>
            {docsOuverts && <button type="button" className="aia-voile aia-voile-droite" aria-label="Fermer la liste des PDF" onClick={() => setDocsOuverts(false)} />}
          </>
        )}
      </div>

      {reglages && etat && (
        <Reglages
          cles={cles}
          reglages={etat.reglages}
          bilan={etat.bilan}
          ouvrirSur={reglagesSur}
          onCle={(f: FicheCle) => {
            setEtat((x) => x && { ...x, cles: [...x.cles.filter((c) => c.fournisseur !== f.fournisseur), f] });
            setAlerte(null);
          }}
          onOublie={(f) => setEtat((x) => x && { ...x, cles: x.cles.filter((c) => c.fournisseur !== f) })}
          onReglages={(r) => {
            setEtat((x) => x && { ...x, reglages: r });
            setModele(r.modele);
            setEffort(r.effort);
          }}
          onFermer={onFermerReglages}
        />
      )}
      {lutrin && <Lutrin document={lutrin.doc} page={lutrin.page} onPage={(n) => setLutrin((l) => l && { ...l, page: n })} onFermer={onFermerLutrin} />}
    </div>
  );
}
