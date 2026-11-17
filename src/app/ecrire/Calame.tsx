"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Feather, LoaderCircle } from "lucide-react";
import {
  ajouterFichier,
  ecrireDocument,
  listerDocuments,
  lireDocument,
  nouvelIdentifiant,
  supprimerDocument,
} from "@/lib/atelier/depot";
import { documentVide, type DocumentAtelier } from "@/lib/atelier/modele";
import { tiroir } from "@/lib/client/compte";
import { attendreSynchro, EVENEMENT_RECU } from "@/lib/client/synchro/journal";
import { useTextes } from "@/lib/modules/textes-client";
import { Atelier } from "./Atelier";
import { blobDuFichierPaquet, lirePaquet } from "./exporter";

/** Le dernier document ouvert, pour ce compte et sur cet appareil. */
const dernier = {
  lire: () => (typeof localStorage !== "undefined" ? localStorage.getItem(tiroir("calame-dernier-document")) : null),
  ecrire: (id: string) => localStorage.setItem(tiroir("calame-dernier-document"), id),
};

/**
 * Le Calame — la coque.
 *
 * Charge la bibliothèque locale, ouvre le dernier document travaillé, et monte
 * l'atelier. L'atelier lui-même est remonté à neuf à chaque changement de
 * document : c'est la façon la plus sûre de repartir d'un texte propre.
 */
export function Calame() {
  const [documents, setDocuments] = useState<DocumentAtelier[]>([]);
  const [actif, setActif] = useState<DocumentAtelier | null>(null);
  const [etat, setEtat] = useState<"chargement" | "pret" | "impossible">("chargement");
  const [message, setMessage] = useState("");
  const t = useTextes("calame");
  const premierTitre = useRef(t("premier"));

  useEffect(() => {
    let vivant = true;
    void (async () => {
      try {
        // Avec un compte : on laisse d'abord arriver les documents écrits sur un autre appareil,
        // pour ne pas ouvrir une page blanche à leur place.
        await attendreSynchro();
        let liste = await listerDocuments();
        if (liste.length === 0) {
          const premier = documentVide(nouvelIdentifiant(), premierTitre.current);
          await ecrireDocument(premier);
          liste = [premier];
        }
        if (!vivant) return;
        const memorise = dernier.lire();
        const ouvert = liste.find((d) => d.id === memorise) ?? liste[0];
        setDocuments(liste);
        setActif(ouvert);
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
        setActif((courant) => (courant && liste.some((d) => d.id === courant.id) ? courant : liste[0]));
      });
    };
    window.addEventListener(EVENEMENT_RECU, surReception);
    return () => window.removeEventListener(EVENEMENT_RECU, surReception);
  }, []);

  const ouvrir = useCallback(async (id: string) => {
    const doc = await lireDocument(id);
    if (!doc) return;
    dernier.ecrire(id);
    setActif(doc);
  }, []);

  const nouveau = useCallback(async () => {
    const doc = documentVide(nouvelIdentifiant());
    await ecrireDocument(doc);
    setDocuments((liste) => [doc, ...liste]);
    dernier.ecrire(doc.id);
    setActif(doc);
  }, []);

  const supprimer = useCallback(
    async (id: string) => {
      await supprimerDocument(id);
      const liste = await listerDocuments();
      setDocuments(liste);
      if (actif?.id === id) {
        if (liste.length === 0) {
          const doc = documentVide(nouvelIdentifiant());
          await ecrireDocument(doc);
          setDocuments([doc]);
          setActif(doc);
        } else {
          setActif(liste[0]);
          dernier.ecrire(liste[0].id);
        }
      }
    },
    [actif],
  );

  const importer = useCallback(async (fichier: File) => {
    try {
      const paquet = lirePaquet(new Uint8Array(await fichier.arrayBuffer()));
      // Les fichiers joints reprennent leur identifiant d'origine : les images du texte les retrouvent.
      for (const joint of paquet.fichiers) {
        const enregistre = await ajouterFichier(blobDuFichierPaquet(joint), joint.nom);
        const texte = JSON.stringify(paquet.document.contenu).split(joint.id).join(enregistre.id);
        paquet.document.contenu = JSON.parse(texte);
      }
      const doc: DocumentAtelier = { ...paquet.document, id: nouvelIdentifiant(), modifie: new Date().toISOString() };
      await ecrireDocument(doc);
      setDocuments(await listerDocuments());
      dernier.ecrire(doc.id);
      setActif(doc);
      setMessage("");
    } catch {
      setMessage("Ce fichier n'a pas pu être ouvert. Vérifie qu'il s'agit bien d'une sauvegarde .calame.");
    }
  }, []);

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

  if (etat === "impossible" || !actif) {
    return (
      <div className="calame-attente">
        <Feather className="size-8 text-accent" aria-hidden="true" />
        <p className="max-w-[52ch] text-center">{t("impossible")}</p>
      </div>
    );
  }

  return (
    <>
      {message && (
        <p className="message message-erreur sans-impression" role="alert">
          {message}
        </p>
      )}
      <Atelier
        key={actif.id}
        doc={actif}
        documents={documents}
        surOuvrir={(id) => void ouvrir(id)}
        surNouveau={() => void nouveau()}
        surSupprimer={(id) => void supprimer(id)}
        surImporter={(f) => void importer(f)}
        surListeChangee={listeChangee}
      />
    </>
  );
}
