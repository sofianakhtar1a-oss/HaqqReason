"use client";

import { useCallback, useEffect, useState } from "react";
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
import { Atelier } from "./Atelier";
import { blobDuFichierPaquet, lirePaquet } from "./exporter";

const DERNIER = "calame-dernier-document";

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

  useEffect(() => {
    let vivant = true;
    void (async () => {
      try {
        let liste = await listerDocuments();
        if (liste.length === 0) {
          const premier = documentVide(nouvelIdentifiant(), "Mon premier document");
          await ecrireDocument(premier);
          liste = [premier];
        }
        if (!vivant) return;
        const memorise = typeof localStorage !== "undefined" ? localStorage.getItem(DERNIER) : null;
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

  const ouvrir = useCallback(async (id: string) => {
    const doc = await lireDocument(id);
    if (!doc) return;
    localStorage.setItem(DERNIER, id);
    setActif(doc);
  }, []);

  const nouveau = useCallback(async () => {
    const doc = documentVide(nouvelIdentifiant());
    await ecrireDocument(doc);
    setDocuments((liste) => [doc, ...liste]);
    localStorage.setItem(DERNIER, doc.id);
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
          localStorage.setItem(DERNIER, liste[0].id);
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
      localStorage.setItem(DERNIER, doc.id);
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
        Ouverture de l&apos;atelier…
      </p>
    );
  }

  if (etat === "impossible" || !actif) {
    return (
      <div className="calame-attente">
        <Feather className="size-8 text-accent" aria-hidden="true" />
        <p className="max-w-[52ch] text-center">
          Cet atelier garde tes documents dans la mémoire du navigateur, et ce navigateur ne le permet pas — souvent à cause d&apos;une navigation
          privée ou d&apos;un réglage de confidentialité. Rouvre la page dans une fenêtre ordinaire.
        </p>
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
