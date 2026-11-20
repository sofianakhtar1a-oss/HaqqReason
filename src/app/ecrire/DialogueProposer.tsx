"use client";

import type { Editor } from "@tiptap/core";
import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import type { DocumentAtelier } from "@/lib/atelier/modele";
import { texteDe } from "@/lib/atelier/neutre";
import { ajouterJeton } from "../contribuer/suivi";
import { Fenetre } from "./Fenetre";
import { preparerSortie } from "./sorties";

/**
 * Proposer le document à la bibliothèque du site : il arrive dans « Contribuer » (idée de sujet ou
 * argument de plus), avec un résumé ; le créateur peut lire le texte complet. La réponse arrive dans
 * « Mes messages », sur la page Contribuer.
 */
export function DialogueProposer({ doc, editor, surFermer }: { doc: DocumentAtelier; editor: Editor | null; surFermer: () => void }) {
  const [blocs, setBlocs] = useState<{ id: string; titre: string }[] | null>(null);
  const [type, setType] = useState<"idee" | "argument">("argument");
  const [blocId, setBlocId] = useState("");
  const [pseudo, setPseudo] = useState("");
  const [titre, setTitre] = useState(doc.titre);
  const [resume, setResume] = useState(() => texteDe(doc.contenu as Parameters<typeof texteDe>[0]).replace(/\s+/g, " ").trim().slice(0, 1200));
  const [etat, setEtat] = useState<{ envoi: boolean; message: string; reussi: boolean }>({ envoi: false, message: "", reussi: false });

  useEffect(() => {
    let vivant = true;
    fetch("/api/calame/contribuer", { cache: "no-store" })
      .then((r) => r.json() as Promise<{ blocs?: { id: string; titre: string }[] }>)
      .then(
        (d) => vivant && setBlocs(d.blocs ?? []),
        () => vivant && setBlocs([]),
      );
    return () => {
      vivant = false;
    };
  }, []);

  const envoyer = async () => {
    setEtat({ envoi: true, message: "", reussi: false });
    try {
      const { neutre } = await preparerSortie(doc, editor, { sansImages: true });
      const r = await fetch("/api/calame/contribuer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type, blocId, pseudo, titre, resume, contenu: neutre }),
      });
      const d = (await r.json().catch(() => ({}))) as { message?: string; jeton?: string; erreur?: string };
      if (!r.ok) {
        setEtat({ envoi: false, message: d.erreur ?? "L'envoi n'a pas abouti.", reussi: false });
        return;
      }
      if (d.jeton) ajouterJeton(d.jeton);
      setEtat({ envoi: false, message: d.message ?? "Merci, ta proposition est arrivée.", reussi: true });
    } catch {
      setEtat({ envoi: false, message: "Pas de connexion : l'envoi n'a pas abouti.", reussi: false });
    }
  };

  return (
    <Fenetre
      titre="Proposer à la bibliothèque du site"
      sousTitre="Ton texte arrive dans « Contribuer », avec son résumé ; le créateur peut lire le texte complet. Sa réponse arrivera dans « Mes messages »."
      surFermer={surFermer}
      largeur={40}
      pied={
        etat.reussi ? (
          <button type="button" className="bouton bouton-principal" onClick={surFermer}>
            Fermer
          </button>
        ) : (
          <button type="button" className="bouton bouton-principal" disabled={etat.envoi || !blocId || titre.trim().length < 5 || resume.trim().length < 20} onClick={() => void envoyer()}>
            {etat.envoi ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : "Envoyer la proposition"}
          </button>
        )
      }
    >
      {etat.reussi ? (
        <p className="inspecteur-aide" role="status">
          {etat.message}
        </p>
      ) : (
        <div className="grid gap-3">
          <div className="inspecteur-choix" role="group" aria-label="Nature de la proposition">
            <button type="button" className="puce-module" aria-pressed={type === "argument"} onClick={() => setType("argument")}>
              Un argument de plus
            </button>
            <button type="button" className="puce-module" aria-pressed={type === "idee"} onClick={() => setType("idee")}>
              Une idée de sujet
            </button>
          </div>
          <label className="inspecteur-reglage">
            <span className="inspecteur-libelle">Module</span>
            <select className="champ" value={blocId} onChange={(e) => setBlocId(e.target.value)}>
              <option value="">{blocs === null ? "Chargement…" : "Choisir le module"}</option>
              {(blocs ?? []).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.titre}
                </option>
              ))}
            </select>
          </label>
          <label className="inspecteur-reglage">
            <span className="inspecteur-libelle">Titre</span>
            <input className="champ" value={titre} onChange={(e) => setTitre(e.target.value.slice(0, 160))} />
          </label>
          <label className="inspecteur-reglage">
            <span className="inspecteur-libelle">Résumé (ce que le créateur lira en premier)</span>
            <textarea className="champ" rows={6} value={resume} onChange={(e) => setResume(e.target.value.slice(0, 3800))} />
          </label>
          <label className="inspecteur-reglage">
            <span className="inspecteur-libelle">Pseudonyme (facultatif)</span>
            <input className="champ" value={pseudo} onChange={(e) => setPseudo(e.target.value.slice(0, 40))} />
          </label>
          {etat.message && (
            <p className="inspecteur-aide" data-alerte="">
              {etat.message}
            </p>
          )}
        </div>
      )}
    </Fenetre>
  );
}
