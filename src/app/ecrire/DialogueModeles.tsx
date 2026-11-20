"use client";

import { BookMarked, FileText, GraduationCap, Library, LoaderCircle, Mail, Megaphone, NotebookPen, Presentation, Scale, Send, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { MODELES } from "@/lib/atelier/modeles";
import type { DocumentAtelier, ReglagesPage } from "@/lib/atelier/modele";
import { Fenetre } from "./Fenetre";

/** Ce qu'il faut pour créer un document : un titre, un contenu, des réglages de page. */
export type DepartDocument = { titre: string; contenu: unknown; reglages?: Partial<ReglagesPage> };

type ModelePublie = { id: string; titre: string; description: string; contenu: unknown; reglages: Partial<ReglagesPage>; publie: string };

const ICONES: Record<string, typeof FileText> = { lettre: Mail, expose: Presentation, memoire: GraduationCap, "fiche-lecture": NotebookPen, refutation: Scale, sermon: Megaphone, "plan-cours": BookMarked };

/**
 * Partir d'un modèle : ceux du Calame (lettre, exposé, mémoire…) et ceux que le créateur publie
 * pour tous. Le créateur peut publier ici le document ouvert comme modèle, ou retirer les siens.
 */
export function DialogueModeles({ docOuvert, surChoisir, surFermer }: { docOuvert: DocumentAtelier; surChoisir: (d: DepartDocument) => void; surFermer: () => void }) {
  const [publies, setPublies] = useState<ModelePublie[] | null>(null);
  const [createur, setCreateur] = useState(false);
  const [etat, setEtat] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    let vivant = true;
    fetch("/api/calame/modeles", { cache: "no-store" })
      .then((r) => r.json() as Promise<{ modeles?: ModelePublie[]; createur?: boolean }>)
      .then(
        (d) => {
          if (!vivant) return;
          setPublies(d.modeles ?? []);
          setCreateur(Boolean(d.createur));
        },
        () => vivant && setPublies([]),
      );
    return () => {
      vivant = false;
    };
  }, []);

  const publier = async () => {
    setEtat("publication");
    try {
      const r = await fetch("/api/calame/modeles", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ titre: docOuvert.titre || "Modèle", description, contenu: docOuvert.contenu, reglages: docOuvert.reglages }),
      });
      const d = (await r.json()) as { id?: string; erreur?: string };
      if (!r.ok || !d.id) {
        setEtat(d.erreur ?? "La publication n'a pas abouti.");
        return;
      }
      setPublies((liste) => [{ id: d.id!, titre: docOuvert.titre || "Modèle", description, contenu: docOuvert.contenu, reglages: docOuvert.reglages, publie: new Date().toISOString() }, ...(liste ?? [])]);
      setDescription("");
      setEtat("Publié : il est proposé à tous dès maintenant.");
    } catch {
      setEtat("Pas de connexion : la publication n'a pas abouti.");
    }
  };

  const retirer = async (id: string) => {
    try {
      const r = await fetch(`/api/calame/modeles?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (r.ok) setPublies((liste) => (liste ?? []).filter((m) => m.id !== id));
    } catch {
      setEtat("Pas de connexion : le modèle n'a pas été retiré.");
    }
  };

  return (
    <Fenetre titre="Partir d'un modèle" sousTitre="La structure est déjà posée ; les indications entre crochets sont à remplacer." surFermer={surFermer} largeur={52}>
      <div className="grid gap-4">
        <ul className="calame-modeles">
          <li>
            <button type="button" className="calame-modele" onClick={() => surChoisir({ titre: "Document sans titre", contenu: { type: "doc", content: [{ type: "paragraph" }] } })}>
              <FileText className="size-6" aria-hidden="true" />
              <span className="calame-modele-titre">Page blanche</span>
              <span className="calame-modele-description">Rien que du papier</span>
            </button>
          </li>
          {MODELES.map((m) => {
            const Icone = ICONES[m.cle] ?? FileText;
            return (
              <li key={m.cle}>
                <button type="button" className="calame-modele" onClick={() => surChoisir({ titre: m.titreDocument, contenu: m.contenu(), reglages: m.reglages })}>
                  <Icone className="size-6" aria-hidden="true" />
                  <span className="calame-modele-titre">{m.titre}</span>
                  <span className="calame-modele-description">{m.description}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <section aria-labelledby="modeles-site">
          <h3 className="calame-section-titre" id="modeles-site">
            <Library className="size-4" aria-hidden="true" /> Modèles du site
          </h3>
          {publies === null ? (
            <p className="inspecteur-aide">
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> Chargement…
            </p>
          ) : publies.length === 0 ? (
            <p className="inspecteur-aide">Le créateur n&apos;a pas encore publié de modèle.</p>
          ) : (
            <ul className="calame-modeles">
              {publies.map((m) => (
                <li key={m.id} className="calame-modele-publie">
                  <button type="button" className="calame-modele" onClick={() => surChoisir({ titre: m.titre, contenu: m.contenu, reglages: m.reglages })}>
                    <Library className="size-6" aria-hidden="true" />
                    <span className="calame-modele-titre">{m.titre}</span>
                    {m.description && <span className="calame-modele-description">{m.description}</span>}
                  </button>
                  {createur && (
                    <button type="button" className="calame-icone calame-modele-retirer" onClick={() => void retirer(m.id)} aria-label={`Retirer le modèle « ${m.titre} »`} title="Retirer ce modèle">
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {createur && (
          <section className="calame-modele-publier" aria-labelledby="modeles-publier">
            <h3 className="calame-section-titre" id="modeles-publier">
              <Send className="size-4" aria-hidden="true" /> Publier « {docOuvert.titre || "Sans titre"} » comme modèle
            </h3>
            <input className="champ" value={description} onChange={(e) => setDescription(e.target.value.slice(0, 160))} placeholder="Une ligne pour dire à quoi il sert" aria-label="Description du modèle" />
            <button type="button" className="bouton bouton-principal" disabled={etat === "publication"} onClick={() => void publier()}>
              {etat === "publication" ? "Publication…" : "Publier pour tous"}
            </button>
            <p className="inspecteur-aide">Les images et pièces jointes restent sur ton appareil : le modèle n&apos;en garde que la place.</p>
          </section>
        )}
        {etat && etat !== "publication" && (
          <p className="inspecteur-aide" role="status">
            {etat}
          </p>
        )}
      </div>
    </Fenetre>
  );
}
