"use client";

import { useState } from "react";
import { FilePlus2, FileText, ListTree, Search, Trash2, Upload } from "lucide-react";
import type { EntreeSommaire } from "@/lib/sommaire";
import type { DocumentAtelier } from "@/lib/atelier/modele";
import { pagesEstimees } from "@/lib/atelier/pagination";

type Props = {
  documents: DocumentAtelier[];
  actif: string;
  plan: EntreeSommaire[];
  surOuvrir: (id: string) => void;
  surNouveau: () => void;
  surSupprimer: (id: string) => void;
  surImporter: (fichier: File) => void;
  surAllerAu: (entree: EntreeSommaire) => void;
};

function quand(iso: string): string {
  const date = new Date(iso);
  const jours = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (jours === 0) return `aujourd'hui, ${date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
  if (jours === 1) return "hier";
  if (jours < 30) return `il y a ${jours} jours`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export function BarreLaterale({ documents, actif, plan, surOuvrir, surNouveau, surSupprimer, surImporter, surAllerAu }: Props) {
  const [vue, setVue] = useState<"documents" | "plan">("documents");
  const [recherche, setRecherche] = useState("");
  const [aSupprimer, setASupprimer] = useState<string | null>(null);

  const filtres = documents.filter((d) => d.titre.toLowerCase().includes(recherche.trim().toLowerCase()));

  return (
    <aside className="calame-cote" aria-label="Documents et plan">
      <div className="calame-onglets" role="tablist">
        <button type="button" role="tab" aria-selected={vue === "documents"} className="calame-onglet" onClick={() => setVue("documents")}>
          <FileText className="size-4" aria-hidden="true" />
          Documents
          <span className="text-sm text-encre-douce">{documents.length}</span>
        </button>
        <button type="button" role="tab" aria-selected={vue === "plan"} className="calame-onglet" onClick={() => setVue("plan")}>
          <ListTree className="size-4" aria-hidden="true" />
          Plan
        </button>
      </div>

      {vue === "documents" ? (
        <div className="calame-cote-corps">
          <div className="flex gap-2">
            <button type="button" className="bouton bouton-principal bouton-petit flex-1" onClick={surNouveau}>
              <FilePlus2 className="size-4" aria-hidden="true" />
              Nouveau
            </button>
            <label className="bouton bouton-discret bouton-petit cursor-pointer" title="Ouvrir une sauvegarde .calame">
              <Upload className="size-4" aria-hidden="true" />
              <span className="sr-only">Importer un document</span>
              <input
                type="file"
                accept=".calame,application/gzip"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) surImporter(f);
                  e.target.value = "";
                }}
              />
            </label>
          </div>

          <label className="contrib-recherche">
            <Search className="size-4 shrink-0 text-encre-douce" aria-hidden="true" />
            <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Chercher un document…" aria-label="Chercher un document" className="w-full bg-transparent outline-none" />
          </label>

          <ul className="calame-documents">
            {filtres.map((d) => (
              <li key={d.id}>
                <button type="button" className="calame-document" aria-current={d.id === actif} onClick={() => surOuvrir(d.id)}>
                  <span className="calame-document-titre">{d.titre || "Sans titre"}</span>
                  <span className="calame-document-detail">
                    {quand(d.modifie)} · {d.mots.toLocaleString("fr-FR")} mots · {pagesEstimees(d.mots)} p.
                  </span>
                </button>
                {aSupprimer === d.id ? (
                  <span className="calame-document-confirme">
                    Supprimer ?
                    <button type="button" className="bouton bouton-danger bouton-petit" onClick={() => { surSupprimer(d.id); setASupprimer(null); }}>
                      Oui
                    </button>
                    <button type="button" className="bouton bouton-discret bouton-petit" onClick={() => setASupprimer(null)}>
                      Non
                    </button>
                  </span>
                ) : (
                  <button type="button" className="calame-document-poubelle" onClick={() => setASupprimer(d.id)} title="Supprimer ce document">
                    <Trash2 className="size-4" aria-hidden="true" />
                    <span className="sr-only">Supprimer {d.titre}</span>
                  </button>
                )}
              </li>
            ))}
            {filtres.length === 0 && <li className="calame-vide">Aucun document à ce nom.</li>}
          </ul>
        </div>
      ) : (
        <div className="calame-cote-corps">
          {plan.length === 0 ? (
            <p className="calame-vide">
              Le plan se remplit tout seul : donne des titres à tes parties (Grand titre, Titre moyen…) et elles apparaîtront ici.
            </p>
          ) : (
            <ol className="calame-plan">
              {plan.map((entree) => (
                <li key={entree.id} data-niveau={entree.niveau}>
                  <button type="button" onClick={() => surAllerAu(entree)}>
                    {entree.texte || "Sans titre"}
                  </button>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </aside>
  );
}
