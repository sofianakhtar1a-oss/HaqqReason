"use client";

import { GraduationCap, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { extrasDe, type DocumentAtelier } from "@/lib/atelier/modele";
import { libelleRole, type ResumePartage } from "@/lib/atelier/partage-commun";

/**
 * Les documents que d'autres partagent avec moi (et les copies remises, pour un enseignant),
 * qui ne sont pas encore dans ma liste : un clic les ouvre (une copie liée arrive dans mon Calame).
 */
export function PartagesRecus({ documents, surOuvrir }: { documents: DocumentAtelier[]; surOuvrir: (id: string) => void }) {
  const [partages, setPartages] = useState<ResumePartage[] | null>(null);
  const [ouvert, setOuvert] = useState(true);

  useEffect(() => {
    let vivant = true;
    const charger = () =>
      void fetch("/api/calame/partages", { cache: "no-store" })
        .then(async (r) => (r.ok ? (((await r.json()) as { partages?: ResumePartage[] }).partages ?? []) : null))
        .then((p) => vivant && p && setPartages(p))
        .catch(() => undefined);
    charger();
    const auRetour = () => document.visibilityState === "visible" && charger();
    document.addEventListener("visibilitychange", auRetour);
    return () => {
      vivant = false;
      document.removeEventListener("visibilitychange", auRetour);
    };
  }, []);

  const locaux = new Set(documents.map((d) => extrasDe(d).partage?.id).filter(Boolean));
  const recus = (partages ?? []).filter((p) => p.role !== "proprietaire" && !locaux.has(p.id));
  if (recus.length === 0) return null;
  return (
    <div className="calame-partages-recus">
      <button type="button" className="calame-partages-recus-titre" aria-expanded={ouvert} onClick={() => setOuvert((o) => !o)}>
        <Users className="size-4" aria-hidden="true" /> Partagés avec toi <span>{recus.length}</span>
      </button>
      {ouvert && (
        <ul className="calame-documents">
          {recus.map((p) => (
            <li key={p.id}>
              <button type="button" className="calame-document" onClick={() => surOuvrir(p.id)}>
                <span className="calame-document-titre">
                  {p.remise ? <GraduationCap className="calame-epingle" aria-label="Copie remise" /> : <Users className="calame-epingle" aria-label="Partagé" />}
                  {p.titre}
                </span>
                <span className="calame-document-detail">
                  {p.remise ? `${p.remise.nomClasse} · copie de ${p.nomProprietaire}` : `de ${p.nomProprietaire}`} · {libelleRole(p.role).toLowerCase()}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
