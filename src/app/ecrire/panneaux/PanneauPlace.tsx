"use client";

import { AlertTriangle, HardDrive } from "lucide-react";
import { useEffect, useState } from "react";
import { placeDuDocument } from "@/lib/atelier/depot";
import type { DocumentAtelier } from "@/lib/atelier/modele";
import { useEtatsDocuments, type EtatDocument } from "../etats-synchro";

type PlaceCompte = { donnees: number; fichiers: number; plafondDonnees: number; plafondFichiers: number; plusLourds: { magasin: string; cle: string; taille: number }[] };

export const taille = (octets: number) =>
  octets < 1024 ? `${octets} o` : octets < 1024 * 1024 ? `${Math.round(octets / 1024).toLocaleString("fr-FR")} Ko` : `${(octets / 1024 / 1024).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Mo`;

const ETATS: Record<EtatDocument, string> = {
  compte: "Enregistré sur ton compte : il te suit sur tes autres appareils.",
  attente: "Modifié ici, en attente d'envoi sur ton compte.",
  appareil: "Seulement sur cet appareil : trop lourd pour le compte (plus de 20 Mo d'images ou de pièces jointes), ou place du compte pleine.",
  local: "Sur cet appareil (sans compte connecté).",
};

const NOMS_MAGASINS: Record<string, string> = {
  "calame-documents": "Document",
  "calame-versions": "Version",
  "calame-fichiers": "Fichier joint",
  "langues-medias": "Média (Truchement)",
  transcriptions: "Transcription (Alambic)",
};

/**
 * La place d'un document (texte, versions, images) et celle du compte, avec une alerte avant la
 * limite qui montre ce qui pèse le plus.
 */
export function PanneauPlace({ doc, documents }: { doc: DocumentAtelier; documents: DocumentAtelier[] }) {
  const [place, setPlace] = useState<Awaited<ReturnType<typeof placeDuDocument>>>(null);
  const [compte, setCompte] = useState<PlaceCompte | null>(null);
  const etats = useEtatsDocuments();
  const etat = etats.get(doc.id) ?? "local";

  useEffect(() => {
    let vivant = true;
    void placeDuDocument(doc.id).then((p) => vivant && setPlace(p));
    return () => {
      vivant = false;
    };
  }, [doc.id, doc.modifie]);

  useEffect(() => {
    if (typeof document === "undefined" || !document.documentElement.dataset.compte) return;
    let vivant = true;
    fetch("/api/compte/place", { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<PlaceCompte>) : null))
      .then((d) => vivant && d && setCompte(d))
      .catch(() => undefined);
    return () => {
      vivant = false;
    };
  }, []);

  const total = place ? place.texte + place.versions + place.fichiers : 0;
  const partDonnees = compte ? compte.donnees / compte.plafondDonnees : 0;
  const partFichiers = compte ? compte.fichiers / compte.plafondFichiers : 0;
  const alerte = Math.max(partDonnees, partFichiers) >= 0.8;
  const titreDe = (cle: string) => documents.find((d) => d.id === cle)?.titre || "";

  return (
    <section className="calame-section" aria-labelledby="place-titre">
      <h3 className="calame-section-titre" id="place-titre">
        <HardDrive className="size-4" aria-hidden="true" /> Place et enregistrement
      </h3>
      <p className="inspecteur-aide" data-etat-synchro={etat}>
        {ETATS[etat]}
      </p>
      {place && (
        <dl className="calame-place">
          <div>
            <dt>Ce document</dt>
            <dd>{taille(total)}</dd>
          </div>
          <div>
            <dt>Texte</dt>
            <dd>{taille(place.texte)}</dd>
          </div>
          <div>
            <dt>
              {place.nbVersions} version{place.nbVersions > 1 ? "s" : ""}
            </dt>
            <dd>{taille(place.versions)}</dd>
          </div>
          <div>
            <dt>
              {place.nbFichiers} image{place.nbFichiers > 1 ? "s" : ""} et pièce{place.nbFichiers > 1 ? "s" : ""} jointe{place.nbFichiers > 1 ? "s" : ""}
            </dt>
            <dd>{taille(place.fichiers)}</dd>
          </div>
        </dl>
      )}
      {compte && (
        <div className="calame-place-compte">
          <p className="inspecteur-libelle">Ton compte</p>
          <div className="calame-jauge" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(partDonnees * 100)} aria-label="Textes et données du compte">
            <span style={{ width: `${Math.min(100, partDonnees * 100)}%` }} data-plein={partDonnees >= 0.8 || undefined} />
          </div>
          <p className="inspecteur-aide">
            Textes : {taille(compte.donnees)} sur {taille(compte.plafondDonnees)} · Fichiers : {taille(compte.fichiers)} sur {taille(compte.plafondFichiers)}
          </p>
          {alerte && (
            <div className="calame-place-alerte" role="alert">
              <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
              <div>
                <p>Ton compte approche de sa limite. Ce qui pèse le plus :</p>
                <ul>
                  {compte.plusLourds.slice(0, 5).map((o) => (
                    <li key={`${o.magasin}-${o.cle}`}>
                      {NOMS_MAGASINS[o.magasin] ?? o.magasin}
                      {titreDe(o.cle) ? ` « ${titreDe(o.cle)} »` : ""} — {taille(o.taille)}
                    </li>
                  ))}
                </ul>
                <p>Vide la corbeille, retire des versions anciennes ou des images lourdes : la place se libère aussitôt.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
