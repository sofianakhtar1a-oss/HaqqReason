"use client";

import { FileWarning, LockOpen, ShieldOff, X } from "lucide-react";
import { useState } from "react";
import { estMotDePasseFaux } from "@/lib/alambic/erreurs";
import { extensionDe, FORMATS, tailleLisible } from "@/lib/alambic/formats";
import type { Resultat } from "@/lib/alambic/navigateur/moteur";
import { Apercu } from "../Apercu";
import { CarteResultat } from "../CarteResultat";
import { BonASavoir, ChampDeverrouillage, EnTeteOutil, ListeResultats, MessageErreur, Progression, reconnaitreTous, resultatDe, sansExtension, useTravail, ZoneDepot } from "../commun";
import { useReception, type Abonner } from "../reception";

/** Ce que le fichier demande : un mot de passe, seulement le retrait de restrictions, ou rien. */
type Etat = { genre: "pdf-mdp" } | { genre: "pdf-restreint" } | { genre: "pdf-libre" } | { genre: "zip-mdp" } | { genre: "zip-libre" } | { genre: "autre" };

const formatParNom = (nom: string) => {
  const ext = extensionDe(nom);
  return FORMATS.find((f) => f.extensions.includes(ext))?.id ?? "";
};

export function Deverrouillage({ abonner }: { abonner: Abonner }) {
  const [fichier, setFichier] = useState<File | null>(null);
  const [etat, setEtat] = useState<Etat | null>(null);
  const [faux, setFaux] = useState(0);
  const [resultat, setResultat] = useState<Resultat | null>(null);
  const [extraits, setExtraits] = useState<Resultat[]>([]);
  const { travail, erreur, setErreur, lancer } = useTravail();

  const charger = (f: File) =>
    lancer(async () => {
      setResultat(null);
      setExtraits([]);
      setFaux(0);
      setFichier(f);
      setEtat(null);
      const [{ format }] = await reconnaitreTous([f]);
      if (format === "pdf") {
        const { PDFDocument } = await import("@cantoo/pdf-lib");
        const { demandeMotDePasse } = await import("@/lib/alambic/navigateur/pdf");
        const octets = new Uint8Array(await f.arrayBuffer());
        let chiffre = false;
        try {
          chiffre = (await PDFDocument.load(octets, { ignoreEncryption: true, updateMetadata: false })).isEncrypted;
        } catch {
          throw new Error("Ce PDF est illisible : il est peut-être abîmé.");
        }
        if (!chiffre) return setEtat({ genre: "pdf-libre" });
        setEtat({ genre: (await demandeMotDePasse(octets)) ? "pdf-mdp" : "pdf-restreint" });
      } else if (format === "zip") {
        const { zipChiffre } = await import("@/lib/alambic/navigateur/archives");
        setEtat({ genre: (await zipChiffre(f)) ? "zip-mdp" : "zip-libre" });
      } else setEtat({ genre: "autre" });
    });

  useReception(abonner, (fichiers) => void charger(fichiers[0]));

  const deverrouillerPdf = (mdp: string) =>
    lancer(async (avancer) => {
      if (!fichier) return;
      avancer(null, "Déchiffrement du PDF");
      const { dechiffrer } = await import("@/lib/alambic/navigateur/pdf");
      try {
        const octets = await dechiffrer(new Uint8Array(await fichier.arrayBuffer()), mdp);
        setResultat(resultatDe(`${sansExtension(fichier.name)} (déverrouillé).pdf`, octets, "pdf", "application/pdf"));
      } catch (e) {
        if (estMotDePasseFaux(e)) setFaux((n) => n + 1);
        throw e;
      }
    });

  const ouvrirZip = (mdp?: string) =>
    lancer(async (avancer) => {
      if (!fichier) return;
      avancer(null, "Ouverture de l'archive");
      const { lireArchive, ecrireArchive } = await import("@/lib/alambic/navigateur/archives");
      let fichiers;
      try {
        fichiers = await lireArchive(fichier.name, "zip", fichier, mdp);
      } catch (e) {
        if (estMotDePasseFaux(e)) setFaux((n) => n + 1);
        throw e;
      }
      if (!fichiers.length) throw new Error("Cette archive est vide.");
      avancer(0.6, "Rangement dans un ZIP sans mot de passe");
      const zip = await ecrireArchive(fichiers, "zip", (f) => avancer(0.6 + f * 0.4, "Rangement dans un ZIP sans mot de passe"));
      setResultat(resultatDe(`${sansExtension(fichier.name)} (déverrouillé).zip`, zip, "zip", "application/zip", [`${fichiers.length} fichier${fichiers.length > 1 ? "s" : ""} repris, sans mot de passe.`]));
      setExtraits(fichiers.slice(0, 200).map((x) => resultatDe(x.nom.split("/").pop() || x.nom, x.blob, formatParNom(x.nom) || "zip", x.blob.type || "application/octet-stream")));
    });

  const vider = () => {
    setFichier(null);
    setEtat(null);
    setResultat(null);
    setExtraits([]);
    setErreur(null);
  };

  return (
    <section className="alambic-outil" aria-labelledby="titre-deverrouiller">
      <EnTeteOutil Icone={LockOpen} titre="Déverrouiller un PDF ou un ZIP" id="titre-deverrouiller">
        Si tu connais son mot de passe, le fichier ressort sans protection : il s&apos;ouvre, s&apos;imprime et passe dans tous les autres outils.
      </EnTeteOutil>

      {fichier ? (
        <div className="alambic-fichier">
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold">{fichier.name}</span>
            <span className="text-sm text-encre-douce">{tailleLisible(fichier.size)}, lu sur place</span>
          </span>
          <button type="button" className="bouton-icone" aria-label="Retirer le fichier" onClick={vider} disabled={travail !== null}>
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <ZoneDepot titre="Dépose le PDF ou le ZIP protégé" aide="ou clique pour le choisir. Le mot de passe ne quitte pas ton appareil." accept=".pdf,.zip" onFichiers={(f) => void charger(f[0])} />
      )}

      {etat?.genre === "pdf-mdp" && !resultat && (
        <div className="alambic-carte-etat">
          <p>
            <strong>Ce PDF demande un mot de passe pour s&apos;ouvrir.</strong> Saisis-le : la protection est retirée, le contenu reste identique.
          </p>
          <ChampDeverrouillage onValider={deverrouillerPdf} />
          {faux > 1 && <p className="text-sm text-encre-douce">Attention aux majuscules, aux accents et à la disposition du clavier (AZERTY / QWERTY). Sans le bon mot de passe, personne ne peut ouvrir ce PDF : c&apos;est le principe du chiffrement.</p>}
        </div>
      )}
      {etat?.genre === "pdf-restreint" && !resultat && (
        <div className="alambic-carte-etat">
          <p>
            <strong>Ce PDF s&apos;ouvre sans mot de passe, mais porte des restrictions</strong> (impression, copie ou modification interdites). Tu peux les retirer s&apos;il s&apos;agit de ton document.
          </p>
          <button type="button" className="bouton bouton-principal" onClick={() => void deverrouillerPdf("")} disabled={travail !== null}>
            <ShieldOff className="size-4" aria-hidden="true" />
            Retirer les restrictions
          </button>
        </div>
      )}
      {etat?.genre === "pdf-libre" && (
        <p className="message">Ce PDF n&apos;est pas protégé : il s&apos;ouvre et se modifie déjà librement.</p>
      )}
      {etat?.genre === "zip-mdp" && !resultat && (
        <div className="alambic-carte-etat">
          <p>
            <strong>Ce ZIP est protégé par un mot de passe.</strong> Saisis-le : chaque fichier s&apos;extrait, et l&apos;archive ressort sans protection.
          </p>
          <ChampDeverrouillage onValider={(mdp) => ouvrirZip(mdp)} libelle="Ouvrir" />
        </div>
      )}
      {etat?.genre === "zip-libre" && fichier && !resultat && (
        <>
          <p className="message">Ce ZIP n&apos;est pas protégé. Voici son contenu : chaque fichier s&apos;extrait d&apos;un clic.</p>
          <Apercu blob={fichier} formatId="zip" nom={fichier.name} />
        </>
      )}
      {etat?.genre === "autre" && (
        <p className="message">
          <FileWarning className="mr-1 inline size-4" aria-hidden="true" />
          Seuls les PDF et les ZIP se déverrouillent ici. Pour un document Word ou Excel protégé, ouvre-le avec Word ou LibreOffice, puis enregistre-le sans mot de passe.
        </p>
      )}

      {travail && <Progression travail={travail} />}
      <MessageErreur erreur={erreur} />

      {resultat && <CarteResultat resultat={resultat} protege={false} />}
      {extraits.length > 0 && <ListeResultats resultats={extraits} nomZip={`${sansExtension(fichier?.name ?? "Archive")} (fichiers).zip`} />}

      <BonASavoir
        points={[
          "Le déverrouillage se fait sur ton appareil : ni le fichier ni le mot de passe ne sont envoyés.",
          "Un PDF « restreint » s'ouvre sans mot de passe mais interdit l'impression ou la copie : ces interdictions se retirent sans mot de passe.",
          "Sans le mot de passe d'ouverture, aucun outil honnête ne peut ouvrir un fichier bien chiffré (AES-256) : c'est ce qui le protège.",
          "Pour remettre une protection ensuite, utilise l'outil « Protéger ».",
        ]}
      />
    </section>
  );
}
