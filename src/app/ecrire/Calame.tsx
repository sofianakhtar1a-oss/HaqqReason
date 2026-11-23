"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Feather, LoaderCircle } from "lucide-react";
import { utiliser } from "@/lib/client/premium";
import {
  ajouterFichier,
  dupliquerDocument,
  ecrireDocument,
  listerDocuments,
  lireDocument,
  mettreALaCorbeille,
  modifierDocument,
  nouvelIdentifiant,
  supprimerDocument,
  viderCorbeilleExpiree,
} from "@/lib/atelier/depot";
import { documentVide, extrasDe, nettoyerReglages, type DocumentAtelier } from "@/lib/atelier/modele";
import { reglagesDuJeu } from "@/lib/atelier/jeux-styles";
import { lirePreferences } from "@/lib/atelier/preferences";
import { tiroir } from "@/lib/client/compte";
import { attendreSynchro, EVENEMENT_RECU } from "@/lib/client/synchro/journal";
import { EVENEMENT_CONFLIT } from "@/lib/client/synchro/moteur";
import { useTextes } from "@/lib/modules/textes-client";
import { Atelier } from "./Atelier";
import { blobDuFichierPaquet, lirePaquet } from "./exporter";
import { documentDeBienvenue } from "./bienvenue";
import type { DepartDocument } from "./DialogueModeles";
import { EcranVerrou } from "./EcranVerrou";
import { abonnerVerrous, estOuvert, versionVerrous } from "./verrou";
import "@fontsource/eb-garamond/400.css";
import "@fontsource/eb-garamond/400-italic.css";
import "@fontsource/eb-garamond/600.css";
import "@fontsource/eb-garamond/700.css";
import "@fontsource-variable/literata/opsz.css";
import "@fontsource-variable/literata/opsz-italic.css";
import "@fontsource/crimson-pro/400.css";
import "@fontsource/crimson-pro/400-italic.css";
import "@fontsource/crimson-pro/700.css";
import "@fontsource/noto-naskh-arabic/400.css";
import "@fontsource/noto-naskh-arabic/700.css";
import "@fontsource/scheherazade-new/400.css";
import "@fontsource/scheherazade-new/700.css";
import "@fontsource/opendyslexic/400.css";
import "@fontsource/opendyslexic/700.css";
import "./calame-plus.css";
import { departDuPartage, lirePartageRecu } from "./partage-recu";
import { DialogueManuscrit } from "./DialogueManuscrit";
import { assemblerManuscrit, type OptionsManuscrit } from "@/lib/atelier/manuscrit";
import { exporterSelection } from "./sorties";
import { abonnerEnSilence, demanderAuPremierGeste } from "@/lib/client/notifications-push";

/** Le dernier document ouvert, pour ce compte et sur cet appareil. */
const dernier = {
  lire: () => (typeof localStorage !== "undefined" ? localStorage.getItem(tiroir("calame-dernier-document")) : null),
  ecrire: (id: string) => localStorage.setItem(tiroir("calame-dernier-document"), id),
};

/** Les documents ouverts en onglets, pour ce compte et sur cet appareil. */
const ongletsMemorises = {
  lire: (): string[] => {
    try {
      const brut = localStorage.getItem(tiroir("calame-onglets"));
      const v = brut ? (JSON.parse(brut) as unknown) : [];
      return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, 12) : [];
    } catch {
      return [];
    }
  },
  ecrire: (ids: string[]) => {
    try {
      localStorage.setItem(tiroir("calame-onglets"), JSON.stringify(ids.slice(0, 12)));
    } catch {
      /* stockage plein : les onglets restent pour cette visite */
    }
  },
};

const actif = (d: DocumentAtelier) => !extrasDe(d).corbeille;

/**
 * Le Calame — la coque.
 *
 * Charge la bibliothèque locale, ouvre le dernier document travaillé, et monte
 * l'atelier. L'atelier lui-même est remonté à neuf à chaque changement de
 * document : c'est la façon la plus sûre de repartir d'un texte propre.
 */
export function Calame() {
  const [documents, setDocuments] = useState<DocumentAtelier[]>([]);
  const [ouvert, setOuvert] = useState<DocumentAtelier | null>(null);
  const [onglets, setOnglets] = useState<string[]>([]);
  const [requete, setRequete] = useState<string | undefined>(undefined);
  const [etat, setEtat] = useState<"chargement" | "pret" | "impossible">("chargement");
  const [message, setMessage] = useState("");
  // Les documents choisis pour un manuscrit en chapitres (fenêtre ouverte).
  const [manuscrit, setManuscrit] = useState<string[] | null>(null);
  // Ouvrir ou refermer un verrou redessine la page (document verrouillé ou non).
  useSyncExternalStore(abonnerVerrous, versionVerrous, () => 0);
  const t = useTextes("calame");
  const premierTitre = useRef(t("premier"));

  const afficher = useCallback((doc: DocumentAtelier) => {
    dernier.ecrire(doc.id);
    setOuvert(doc);
    setOnglets((o) => {
      const suite = o.includes(doc.id) ? o : [...o, doc.id].slice(-12);
      ongletsMemorises.ecrire(suite);
      return suite;
    });
  }, []);

  useEffect(() => {
    let vivant = true;
    void (async () => {
      try {
        // Avec un compte : on laisse d'abord arriver les documents écrits sur un autre appareil,
        // pour ne pas ouvrir une page blanche à leur place.
        await attendreSynchro();
        await viderCorbeilleExpiree().catch(() => 0);
        let liste = await listerDocuments();
        if (liste.length === 0) {
          // Le tout premier document : une page qui montre ce que sait faire l'atelier.
          const premier: DocumentAtelier = { ...documentVide(nouvelIdentifiant(), premierTitre.current), contenu: documentDeBienvenue() };
          await ecrireDocument(premier);
          liste = [premier];
        }
        if (!vivant) return;
        const actifs = liste.filter(actif);
        if (actifs.length === 0) {
          const doc = documentVide(nouvelIdentifiant());
          await ecrireDocument(doc);
          liste = [doc, ...liste];
          actifs.push(doc);
        }
        const memorise = dernier.lire();
        const choisi = actifs.find((d) => d.id === memorise) ?? actifs[0];
        const anciens = ongletsMemorises.lire().filter((id) => actifs.some((d) => d.id === id));
        setDocuments(liste);
        setOnglets(anciens.includes(choisi.id) ? anciens : [...anciens, choisi.id]);
        setOuvert(choisi);
        setEtat("pret");
      } catch {
        if (vivant) setEtat("impossible");
      }
    })();
    return () => {
      vivant = false;
    };
  }, []);

  // Des documents arrivent d'un autre appareil pendant qu'on est là : la liste se met à jour.
  // Celui qui est ouvert n'est rechargé que s'il a disparu (supprimé ailleurs) : on ne touche jamais
  // au texte en cours de frappe.
  useEffect(() => {
    const surReception = (e: Event) => {
      const magasins = (e as CustomEvent<string[]>).detail;
      if (!Array.isArray(magasins) || !magasins.includes("calame-documents")) return;
      void listerDocuments().then((liste) => {
        if (liste.length === 0) return;
        setDocuments(liste);
        setOuvert((courant) => (courant && liste.some((d) => d.id === courant.id) ? courant : (liste.filter(actif)[0] ?? liste[0])));
      });
    };
    window.addEventListener(EVENEMENT_RECU, surReception);
    return () => window.removeEventListener(EVENEMENT_RECU, surReception);
  }, []);

  // Un document modifié sur deux appareils : les deux versions sont gardées, et on le dit.
  useEffect(() => {
    const surConflit = (e: Event) => {
      const titres = (e as CustomEvent<string[]>).detail ?? [];
      if (titres.length === 0) return;
      setMessage(`Modifié sur deux appareils à la fois : rien n'est perdu, l'autre version est gardée à côté (${titres.map((t) => `« ${t} »`).join(", ")}). Compare-les, puis garde celle que tu veux.`);
    };
    window.addEventListener(EVENEMENT_CONFLIT, surConflit);
    return () => window.removeEventListener(EVENEMENT_CONFLIT, surConflit);
  }, []);

  const ouvrir = useCallback(
    async (id: string, recherche?: string) => {
      const doc = await lireDocument(id);
      if (!doc) return;
      setRequete(recherche);
      afficher(doc);
    },
    [afficher],
  );

  const nouveau = useCallback(async () => {
    if (!(await utiliser("calame.ecrire"))) return;
    const doc = documentVide(nouvelIdentifiant());
    // Le jeu de styles choisi pour les nouveaux documents (onglet « Styles »).
    const jeu = lirePreferences().jeuParDefaut;
    const reglagesJeu = jeu ? reglagesDuJeu(jeu) : null;
    if (reglagesJeu) doc.reglages = { ...doc.reglages, ...reglagesJeu };
    await ecrireDocument(doc);
    setDocuments((liste) => [doc, ...liste]);
    setRequete(undefined);
    afficher(doc);
  }, [afficher]);

  /** Un nouveau document à partir d'un modèle (lettre, mémoire…, ou modèle publié par le créateur). */
  const depuisModele = useCallback(
    async (depart: DepartDocument) => {
      const doc = documentVide(nouvelIdentifiant(), depart.titre || "Document sans titre");
      const jeu = lirePreferences().jeuParDefaut;
      const reglagesJeu = jeu ? reglagesDuJeu(jeu) : null;
      doc.reglages = nettoyerReglages({ ...doc.reglages, ...(reglagesJeu ?? {}), ...(depart.reglages ?? {}) });
      doc.contenu = JSON.parse(JSON.stringify(depart.contenu ?? { type: "doc", content: [{ type: "paragraph" }] }));
      await ecrireDocument(doc);
      setDocuments((liste) => [doc, ...liste]);
      setRequete(undefined);
      afficher(doc);
    },
    [afficher],
  );

  // Les rappels d'écriture arrivent sur chaque appareil sans chercher de bouton : abonnement silencieux
  // là où les notifications sont déjà permises, sinon une seule demande, au premier geste.
  useEffect(() => {
    if (etat !== "pret") return;
    const r = lirePreferences().rappel;
    if (!r.actif && !r.veille) return;
    void abonnerEnSilence().catch(() => false);
    return r.actif ? demanderAuPremierGeste() : undefined;
  }, [etat]);

  // Un texte, un lien ou une photo envoyés depuis une autre application (« Partager » du téléphone).
  const partageTraite = useRef(false);
  useEffect(() => {
    if (etat !== "pret" || partageTraite.current) return;
    partageTraite.current = true;
    void (async () => {
      const recu = await lirePartageRecu(window.location.search).catch(() => null);
      if (!recu) return;
      window.history.replaceState(null, "", "/ecrire");
      if ("erreur" in recu) {
        setMessage(recu.erreur);
        return;
      }
      const { depart, laisses } = await departDuPartage(recu);
      await depuisModele(depart);
      setMessage(laisses.length ? `Reçu dans un nouveau document. Pas pu entrer : ${laisses.join(", ")}.` : "Reçu dans un nouveau document.");
    })();
  }, [etat, depuisModele]);

  /** Un document partagé avec moi : sa copie liée (créée la première fois), qui se met à jour en l'ouvrant. */
  const ouvrirPartage = useCallback(
    async (id: string) => {
      const liste = await listerDocuments();
      const local = liste.find((d) => extrasDe(d).partage?.id === id && !extrasDe(d).corbeille);
      if (local) {
        afficher(local);
        return;
      }
      const r = await fetch(`/api/calame/partages/${encodeURIComponent(id)}`, { cache: "no-store" }).catch(() => null);
      const d = (r ? await r.json().catch(() => ({})) : {}) as { erreur?: string; role?: "lecture" | "commentaire" | "ecriture" | "proprietaire"; meta?: { titre: string }; base?: { version: number; contenu: unknown; reglages: unknown } };
      if (!r || !r.ok || !d.base || !d.role || !d.meta) {
        setMessage(d.erreur ?? "Ce document partagé ne s'ouvre pas pour l'instant : vérifie ta connexion.");
        return;
      }
      const doc = documentVide(nouvelIdentifiant(), d.meta.titre);
      doc.contenu = d.base.contenu;
      if (d.base.reglages && typeof d.base.reglages === "object") doc.reglages = nettoyerReglages({ ...doc.reglages, ...(d.base.reglages as object) });
      doc.partage = { id, role: d.role, version: d.base.version, attente: false };
      await ecrireDocument(doc);
      setDocuments((l) => [doc, ...l]);
      afficher(doc);
    },
    [afficher],
  );

  // Ouvert depuis une notification (« … partage un document avec toi »).
  const partageDemande = useRef(false);
  useEffect(() => {
    if (etat !== "pret" || partageDemande.current) return;
    partageDemande.current = true;
    void (async () => {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("partage");
      if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return;
      window.history.replaceState(null, "", "/ecrire");
      // Un lien d'invitation : on rejoint d'abord le document, puis il s'ouvre comme les autres.
      const jeton = params.get("invitation");
      if (jeton) {
        const r = await fetch(`/api/calame/partages/${id}/rejoindre`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jeton }) }).catch(() => null);
        if (!r?.ok) {
          const d = (r ? await r.json().catch(() => ({})) : {}) as { erreur?: string };
          setMessage(d.erreur ?? "Le lien d'invitation n'a pas pu être ouvert : vérifie ta connexion, puis rouvre-le.");
          return;
        }
      }
      await ouvrirPartage(id);
    })();
  }, [etat, ouvrirPartage]);

  /** Le manuscrit en chapitres : un nouveau document, les originaux intacts. */
  const assembler = useCallback(
    async (ordre: string[], options: OptionsManuscrit) => {
      setManuscrit(null);
      const chapitres: DocumentAtelier[] = [];
      for (const id of ordre) {
        const d = await lireDocument(id);
        if (d && (!extrasDe(d).verrou || estOuvert(d.id))) chapitres.push(d);
      }
      if (chapitres.length < 2) {
        setMessage("Il faut au moins deux documents ouverts (un document verrouillé doit d'abord être ouvert avec son code).");
        return;
      }
      const { titre, contenu, reglages } = assemblerManuscrit(chapitres, options);
      await depuisModele({ titre, contenu, reglages });
      setMessage(`Manuscrit assemblé : ${chapitres.length} chapitres. Exporte-le d'un seul tenant depuis l'onglet « Sortie ».`);
    },
    [depuisModele],
  );

  const bienvenue = useCallback(async () => {
    const doc: DocumentAtelier = { ...documentVide(nouvelIdentifiant(), "Bienvenue dans le Calame"), contenu: documentDeBienvenue() };
    await ecrireDocument(doc);
    setDocuments((liste) => [doc, ...liste]);
    afficher(doc);
  }, [afficher]);

  /** Quand le document ouvert quitte la liste active : on passe au suivant (ou on en crée un). */
  const remplacerOuvert = useCallback(
    async (liste: DocumentAtelier[], parti: string) => {
      setOnglets((o) => {
        const suite = o.filter((x) => x !== parti);
        ongletsMemorises.ecrire(suite);
        return suite;
      });
      if (ouvert?.id !== parti) return;
      const restants = liste.filter((d) => actif(d) && d.id !== parti);
      if (restants.length === 0) {
        const doc = documentVide(nouvelIdentifiant());
        await ecrireDocument(doc);
        setDocuments([doc, ...liste]);
        afficher(doc);
      } else afficher(restants[0]);
    },
    [ouvert, afficher],
  );

  const corbeille = useCallback(
    async (id: string, dedans: boolean) => {
      await mettreALaCorbeille(id, dedans);
      const liste = await listerDocuments();
      setDocuments(liste);
      if (dedans) await remplacerOuvert(liste, id);
    },
    [remplacerOuvert],
  );

  const supprimerDefinitivement = useCallback(
    async (id: string) => {
      await supprimerDocument(id);
      const liste = await listerDocuments();
      setDocuments(liste);
      await remplacerOuvert(liste, id);
    },
    [remplacerOuvert],
  );

  const modifier = useCallback(async (id: string, modif: Partial<DocumentAtelier>) => {
    const aJour = await modifierDocument(id, modif);
    if (!aJour) return;
    setDocuments((liste) => liste.map((d) => (d.id === id ? aJour : d)));
  }, []);

  const dupliquer = useCallback(
    async (id: string) => {
      const copie = await dupliquerDocument(id);
      if (!copie) return;
      setDocuments(await listerDocuments());
      afficher(copie);
    },
    [afficher],
  );

  const fermerOnglet = useCallback(
    (id: string) => {
      setOnglets((o) => {
        const suite = o.filter((x) => x !== id);
        ongletsMemorises.ecrire(suite);
        if (ouvert?.id === id && suite.length > 0) void ouvrir(suite[suite.length - 1]);
        return suite.length > 0 ? suite : o;
      });
    },
    [ouvert, ouvrir],
  );

  const importer = useCallback(
    async (fichier: File) => {
      try {
        if (!/\.calame$/i.test(fichier.name) && fichier.type !== "application/gzip") {
          const { importerFichier } = await import("./importer");
          const doc = await importerFichier(fichier);
          await ecrireDocument(doc);
          setDocuments(await listerDocuments());
          afficher(doc);
          setMessage("");
          return;
        }
        const paquet = lirePaquet(new Uint8Array(await fichier.arrayBuffer()));
        // Les fichiers joints reprennent leur identifiant d'origine : les images du texte les retrouvent.
        for (const joint of paquet.fichiers) {
          const enregistre = await ajouterFichier(blobDuFichierPaquet(joint), joint.nom);
          const texte = JSON.stringify(paquet.document.contenu).split(joint.id).join(enregistre.id);
          paquet.document.contenu = JSON.parse(texte);
        }
        const doc: DocumentAtelier = { ...paquet.document, id: nouvelIdentifiant(), modifie: new Date().toISOString(), corbeille: null };
        await ecrireDocument(doc);
        setDocuments(await listerDocuments());
        afficher(doc);
        setMessage("");
      } catch {
        setMessage("Ce fichier n'a pas pu être ouvert. Le Calame lit ses sauvegardes .calame, les fichiers Word (.docx), Markdown, texte et HTML.");
      }
    },
    [afficher],
  );

  const listeChangee = useCallback((doc: DocumentAtelier) => {
    setDocuments((liste) => [doc, ...liste.filter((d) => d.id !== doc.id)]);
  }, []);

  if (etat === "chargement") {
    return (
      <p className="calame-attente">
        <LoaderCircle className="size-6 animate-spin text-accent" aria-hidden="true" />
        {t("attente")}
      </p>
    );
  }

  if (etat === "impossible" || !ouvert) {
    return (
      <div className="calame-attente">
        <Feather className="size-8 text-accent" aria-hidden="true" />
        <p className="max-w-[52ch] text-center">{t("impossible")}</p>
      </div>
    );
  }

  // Un document verrouillé (appareil partagé) : son code avant tout.
  // (le verrou se lit sur la liste à jour : il peut avoir été posé depuis l'ouverture du document)
  const verrouOuvert = extrasDe(documents.find((d) => d.id === ouvert.id) ?? ouvert).verrou;
  const verrouille = Boolean(verrouOuvert) && !estOuvert(ouvert.id);
  const autreQueVerrouille = verrouille ? documents.find((d) => d.id !== ouvert.id && actif(d) && (!extrasDe(d).verrou || estOuvert(d.id))) : undefined;
  const docsOnglets = onglets.map((id) => documents.find((d) => d.id === id)).filter((d): d is DocumentAtelier => Boolean(d) && actif(d as DocumentAtelier));

  return (
    <>
      {message && (
        <p className="message message-erreur sans-impression" role="alert">
          {message}
        </p>
      )}
      {verrouille ? (
        <EcranVerrou doc={ouvert} verrou={verrouOuvert!} surAutre={autreQueVerrouille ? () => afficher(autreQueVerrouille) : undefined} />
      ) : (
      <Atelier
        key={ouvert.id}
        doc={ouvert}
        documents={documents}
        onglets={docsOnglets}
        requeteInitiale={requete}
        surOuvrir={(id, r) => void ouvrir(id, r)}
        surNouveau={() => void nouveau()}
        surImporter={(f) => void importer(f)}
        surModifier={(id, m) => void modifier(id, m)}
        surDupliquer={(id) => void dupliquer(id)}
        surCorbeille={(id, dedans) => void corbeille(id, dedans)}
        surSupprimerDefinitivement={(id) => void supprimerDefinitivement(id)}
        surOuvrirACote={() => undefined}
        surFermerOnglet={fermerOnglet}
        surListeChangee={listeChangee}
        surBienvenue={() => void bienvenue()}
        surModele={(d) => void depuisModele(d)}
        surExporterSelection={(ids) =>
          void exporterSelection(ids)
            .then((n) => setMessage(`${n} document${n > 1 ? "s" : ""} dans l'archive .zip (chacun en .calame et en Markdown).`))
            .catch(() => setMessage("L'archive n'a pas pu être préparée : réessaie."))
        }
        surManuscrit={(ids) => setManuscrit(ids)}
        surOuvrirPartage={(id) => void ouvrirPartage(id)}
      />
      )}
      {manuscrit && (
        <DialogueManuscrit
          documents={documents}
          ids={manuscrit}
          surFermer={() => setManuscrit(null)}
          surCreer={(ordre, options) => void assembler(ordre, options)}
        />
      )}
    </>
  );
}
