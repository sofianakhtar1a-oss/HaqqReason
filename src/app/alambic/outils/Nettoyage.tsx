"use client";

import { CircleCheck, Eraser, LoaderCircle, LockOpen, MapPin, TriangleAlert, X } from "lucide-react";
import { useState } from "react";
import { familleDuFormat, nomDuFormat, tailleLisible } from "@/lib/alambic/formats";
import type { Resultat } from "@/lib/alambic/navigateur/moteur";
import { bureautique } from "@/lib/alambic/outils";
import type { Examen } from "@/lib/alambic/traces";
import { CarteResultat } from "../CarteResultat";
import { useAlambic } from "../contexte";
import { BonASavoir, EnTeteOutil, ListeResultats, MessageErreur, Progression, reconnaitreTous, sansExtension, useTravail, verifierAnnulation, ZoneDepot } from "../commun";
import { useReception, type Abonner } from "../reception";
import { ICONES } from "../SelecteurFormat";

const NETTOYABLES = new Set(["jpg", "png", "webp", "pdf", "mp3", "docx", "xlsx", "pptx", "odt", "ods", "odp"]);
const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  pdf: "application/pdf",
  mp3: "audio/mpeg",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  odt: "application/vnd.oasis.opendocument.text",
  ods: "application/vnd.oasis.opendocument.spreadsheet",
  odp: "application/vnd.oasis.opendocument.presentation",
};

type Element = { id: string; fichier: File; format: string; examen: Examen | null };

export function Nettoyage({ abonner }: { abonner: Abonner }) {
  const { envoyer } = useAlambic();
  const [elements, setElements] = useState<Element[]>([]);
  const [refuses, setRefuses] = useState<string[]>([]);
  const [resultats, setResultats] = useState<{ r: Resultat; avant: number }[]>([]);
  const [echecs, setEchecs] = useState<{ nom: string; message: string; fichier: File; protege: boolean }[]>([]);
  const { travail, erreur, lancer } = useTravail();

  const ajouter = async (fichiers: File[]) => {
    setResultats([]);
    setEchecs([]);
    const reconnus = await reconnaitreTous(fichiers);
    const rejets: string[] = [];
    const nouveaux: Element[] = [];
    for (const { fichier, format } of reconnus) {
      const f = format ? (bureautique(format, fichier.name) ?? format) : null;
      if (!f || !NETTOYABLES.has(f)) rejets.push(fichier.name);
      else nouveaux.push({ id: crypto.randomUUID(), fichier, format: f, examen: null });
    }
    setRefuses(rejets);
    setElements((e) => [...e, ...nouveaux]);
    // L'examen de chaque fichier, sans bloquer la liste.
    const { examiner } = await import("@/lib/alambic/traces");
    for (const e of nouveaux) {
      const examen = await examiner(new Uint8Array(await e.fichier.arrayBuffer()), e.format, e.fichier.name);
      setElements((l) => l.map((x) => (x.id === e.id ? { ...x, examen } : x)));
    }
  };

  useReception(abonner, (fichiers) => void ajouter(fichiers));

  const aNettoyer = elements.filter((e) => e.examen?.nettoyable && e.examen.traces.length > 0);
  const totalTraces = aNettoyer.reduce((s, e) => s + (e.examen?.traces.length ?? 0), 0);
  const examensFinis = elements.every((e) => e.examen);

  const nettoyerTout = () =>
    lancer(async (avancer, signal) => {
      setResultats([]);
      setEchecs([]);
      const { nettoyer } = await import("@/lib/alambic/traces");
      const faits: { r: Resultat; avant: number }[] = [];
      const rates: typeof echecs = [];
      for (let i = 0; i < aNettoyer.length; i++) {
        verifierAnnulation(signal);
        const e = aNettoyer[i];
        avancer(i / aNettoyer.length, `Nettoyage de « ${e.fichier.name} »`);
        try {
          const r = await nettoyer(new Uint8Array(await e.fichier.arrayBuffer()), e.format, e.fichier.name);
          const ext = e.fichier.name.match(/\.([^.]+)$/)?.[1] ?? e.format;
          faits.push({
            r: { nom: `${sansExtension(e.fichier.name)} (nettoyé).${ext}`, blob: new Blob([r.octets.slice().buffer], { type: TYPES[e.format] ?? "application/octet-stream" }), format: e.format, avertissements: r.remarques },
            avant: e.fichier.size,
          });
        } catch (err) {
          rates.push({ nom: e.fichier.name, message: (err as Error)?.message || "Le nettoyage a échoué.", fichier: e.fichier, protege: (err as Error)?.name === "PdfProtege" });
        }
      }
      setResultats(faits);
      setEchecs(rates);
    });

  const enCours = travail !== null;

  return (
    <section className="alambic-outil" aria-labelledby="titre-nettoyer">
      <EnTeteOutil Icone={Eraser} titre="Nettoyer les traces cachées" id="titre-nettoyer">
        Une photo dit où et avec quel téléphone elle a été prise ; un Word garde le nom de son auteur et de sa société. Vois ce que tes fichiers révèlent, puis efface-le avant de les envoyer.
      </EnTeteOutil>

      {elements.length > 0 && (
        <ul className="alambic-traces">
          {elements.map((e) => {
            const Icone = ICONES[familleDuFormat(e.format)];
            const ex = e.examen;
            const gps = ex?.traces.find((t) => t.cle === "gps");
            return (
              <li key={e.id} className="alambic-traces-fichier" data-propre={ex && ex.nettoyable && ex.traces.length === 0 ? true : undefined}>
                <div className="alambic-traces-tete">
                  <Icone className="size-5 shrink-0 text-or" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{e.fichier.name}</span>
                    <span className="text-sm text-encre-douce">
                      {nomDuFormat(e.format)}, {tailleLisible(e.fichier.size)}
                      {ex ? (!ex.nettoyable ? " — ne peut pas être examiné" : ex.traces.length ? ` — ${ex.traces.length} trace${ex.traces.length > 1 ? "s" : ""} trouvée${ex.traces.length > 1 ? "s" : ""}` : " — aucune trace connue") : ""}
                    </span>
                  </span>
                  {!ex && <LoaderCircle className="size-4 animate-spin text-encre-douce" aria-label="Examen en cours" />}
                  {ex && ex.nettoyable && ex.traces.length === 0 && <CircleCheck className="size-5 text-succes" aria-hidden="true" />}
                  {ex && !ex.nettoyable && e.format === "pdf" && ex.remarques.some((r) => r.includes("mot de passe")) && (
                    <button type="button" className="bouton bouton-discret !min-h-9" onClick={() => envoyer("deverrouiller", [e.fichier])}>
                      <LockOpen className="size-4" aria-hidden="true" />
                      Déverrouiller
                    </button>
                  )}
                  <button
                    type="button"
                    className="bouton-icone !size-9"
                    aria-label={`Retirer ${e.fichier.name}`}
                    disabled={enCours}
                    onClick={() => {
                      setElements((l) => l.filter((x) => x.id !== e.id));
                      setResultats([]);
                    }}
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                </div>
                {gps && (
                  <p className="alambic-traces-alerte">
                    <MapPin className="size-4 shrink-0" aria-hidden="true" />
                    <span>
                      Cette photo contient l&apos;endroit où elle a été prise ({gps.valeur}). Toute personne qui la reçoit peut le retrouver.
                    </span>
                  </p>
                )}
                {ex && ex.traces.length > 0 && (
                  <dl className="alambic-traces-liste">
                    {ex.traces.map((t, i) => (
                      <div key={`${t.cle}-${i}`} data-sensible={t.sensible || undefined}>
                        <dt>{t.libelle}</dt>
                        <dd>{t.valeur}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {ex && ex.remarques.length > 0 && (
                  <ul className="alambic-traces-remarques">
                    {ex.remarques.map((r) => (
                      <li key={r}>
                        <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
                        {r}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <ZoneDepot
        compact={elements.length > 0}
        multiple
        titre={elements.length ? "Examiner d'autres fichiers" : "Dépose les fichiers à examiner"}
        aide={elements.length ? undefined : "Photos (JPEG, PNG, WebP), PDF, Word, Excel, PowerPoint, OpenDocument, MP3."}
        accept=".jpg,.jpeg,.png,.webp,.pdf,.mp3,.docx,.xlsx,.pptx,.odt,.ods,.odp"
        onFichiers={(f) => void ajouter(f)}
        desactive={enCours}
      />
      {refuses.length > 0 && <p className="message">Pas de traces connues pour ce type de fichier : {refuses.join(", ")}.</p>}

      {elements.length > 0 && examensFinis && (
        <div className="alambic-actions">
          {travail ? (
            <Progression travail={travail} />
          ) : aNettoyer.length ? (
            <button type="button" className="bouton bouton-principal alambic-lancer" onClick={() => void nettoyerTout()}>
              <Eraser className="size-5" aria-hidden="true" />
              {aNettoyer.length > 1 ? `Effacer les ${totalTraces} traces des ${aNettoyer.length} fichiers` : `Effacer ${totalTraces > 1 ? `les ${totalTraces} traces` : "la trace"}`}
            </button>
          ) : (
            <p className="message message-succes">Rien à effacer : ces fichiers ne contiennent aucune trace connue.</p>
          )}
        </div>
      )}

      <MessageErreur erreur={erreur} />
      {echecs.length > 0 && (
        <div className="message message-erreur alambic-erreur" role="alert">
          {echecs.map((e, i) => (
            <p key={`${e.nom}-${i}`}>
              <strong>{e.nom} :</strong> {e.message}{" "}
              {e.protege && (
                <button type="button" className="underline underline-offset-2" onClick={() => envoyer("deverrouiller", [e.fichier])}>
                  Le déverrouiller
                </button>
              )}
            </p>
          ))}
        </div>
      )}
      {resultats.length === 1 && <CarteResultat resultat={resultats[0].r} protege={false} />}
      {resultats.length > 1 && <ListeResultats resultats={resultats.map((x) => x.r)} nomZip="Fichiers nettoyés.zip" />}

      <BonASavoir
        points={[
          "Rien n'est réencodé : la photo, le son ou le document restent identiques, seules les informations cachées disparaissent.",
          "L'orientation d'une photo est gardée : elle ne se retrouve pas couchée.",
          "Les commentaires et les modifications suivies d'un Word sont signalés, pas effacés : accepte-les ou supprime-les dans Word, car ils font partie du texte.",
          "Les captures d'écran et les photos envoyées par WhatsApp ont souvent déjà perdu leurs traces ; celles copiées depuis l'appareil photo, presque jamais.",
        ]}
      />
    </section>
  );
}
