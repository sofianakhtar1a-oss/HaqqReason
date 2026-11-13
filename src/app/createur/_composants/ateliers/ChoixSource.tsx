"use client";

import { BookOpen, Plus, Quote, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { STATUTS_SOURCE } from "@/lib/sources";
import { enregistrerCitation, enregistrerOuvrage, ouvragesSemblables, rechercherSources, type ResultatSource } from "../../sources/actions";
import { Modale } from "./Modale";

type Choix = { ouvrage: string; citation: string; page: string; tome: string };

/**
 * Choisir (ou créer) l'ouvrage ou la citation à insérer dans l'article.
 * mode « reference » : appel numéroté dans le texte ; mode « citation » : bloc de citation.
 */
export function ChoixSource({ mode, onChoisir, onFermer }: { mode: "reference" | "citation"; onChoisir: (c: Choix) => void; onFermer: () => void }) {
  const [q, setQ] = useState("");
  const [resultats, setResultats] = useState<ResultatSource[]>([]);
  const [choisi, setChoisi] = useState<ResultatSource | null>(null);
  const [page, setPage] = useState("");
  const [tome, setTome] = useState("");
  const [creation, setCreation] = useState<"ouvrage" | "citation" | null>(null);
  const [message, setMessage] = useState("");
  const [nouveau, setNouveau] = useState({ titre: "", auteur_texte: "", editeur: "", annee: "", statut: "a-verifier" as string });
  const [semblables, setSemblables] = useState<{ id: string; titre: string; auteur_texte: string; annee: string }[]>([]);
  const [citation, setCitation] = useState({ texte: "", texte_original: "", page: "", tome: "" });

  useEffect(() => {
    const minuteur = setTimeout(async () => {
      const r = await rechercherSources(q);
      if (r.ok) setResultats(mode === "citation" ? r.donnees : r.donnees);
    }, 200);
    return () => clearTimeout(minuteur);
  }, [q, mode]);

  useEffect(() => {
    if (creation !== "ouvrage" || nouveau.titre.trim().length < 4) return;
    const minuteur = setTimeout(async () => {
      const r = await ouvragesSemblables(nouveau.titre);
      if (r.ok) setSemblables(r.donnees);
    }, 300);
    return () => clearTimeout(minuteur);
  }, [nouveau.titre, creation]);

  async function creerOuvrage() {
    const r = await enregistrerOuvrage(null, { ...nouveau, statut: nouveau.statut as "a-verifier" });
    if (!r.ok) return setMessage(r.message);
    setChoisi({ type: "ouvrage", id: r.donnees.id, titre: nouveau.titre, detail: [nouveau.auteur_texte, nouveau.annee].filter(Boolean).join(", "), ouvrage_id: r.donnees.id });
    setCreation(mode === "citation" ? "citation" : null);
    setMessage("");
  }

  async function creerCitation() {
    if (!choisi) return;
    const r = await enregistrerCitation(null, { ouvrage_id: choisi.ouvrage_id, ...citation, contexte: "", statut: "a-verifier" });
    if (!r.ok) return setMessage(r.message);
    onChoisir({ ouvrage: choisi.ouvrage_id, citation: r.donnees.id, page: "", tome: "" });
  }

  const valider = () => {
    if (!choisi) return;
    if (choisi.type === "citation") onChoisir({ ouvrage: choisi.ouvrage_id, citation: choisi.id, page: "", tome: "" });
    else if (mode === "citation") setCreation("citation");
    else onChoisir({ ouvrage: choisi.id, citation: "", page, tome });
  };

  return (
    <Modale titre={mode === "citation" ? "Insérer une citation d'ouvrage" : "Insérer une référence"} onFermer={onFermer} large={false}>
      <div className="space-y-5">
        {creation === "ouvrage" ? (
          <div className="space-y-3">
            <p className="font-semibold">Nouvel ouvrage</p>
            <input className="champ" placeholder="Titre de l'ouvrage" aria-label="Titre de l'ouvrage" value={nouveau.titre} onChange={(e) => setNouveau({ ...nouveau, titre: e.target.value })} />
            {semblables.length > 0 && (
              <div className="message text-sm">
                Ouvrages au titre proche déjà enregistrés :
                <ul className="mt-1 space-y-1">
                  {semblables.map((s) => (
                    <li key={s.id}>
                      <button type="button" className="underline underline-offset-4" onClick={() => { setChoisi({ type: "ouvrage", id: s.id, titre: s.titre, detail: [s.auteur_texte, s.annee].filter(Boolean).join(", "), ouvrage_id: s.id }); setCreation(null); }}>
                        {s.titre}
                        {s.auteur_texte && `, ${s.auteur_texte}`}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="grid gap-2 sm:grid-cols-2">
              <input className="champ" placeholder="Auteur" aria-label="Auteur" value={nouveau.auteur_texte} onChange={(e) => setNouveau({ ...nouveau, auteur_texte: e.target.value })} />
              <input className="champ" placeholder="Éditeur" aria-label="Éditeur" value={nouveau.editeur} onChange={(e) => setNouveau({ ...nouveau, editeur: e.target.value })} />
              <input className="champ" placeholder="Année" aria-label="Année" value={nouveau.annee} onChange={(e) => setNouveau({ ...nouveau, annee: e.target.value })} />
              <select className="champ" aria-label="Statut de vérification" value={nouveau.statut} onChange={(e) => setNouveau({ ...nouveau, statut: e.target.value })}>
                {STATUTS_SOURCE.map((s) => (
                  <option key={s.cle} value={s.cle}>
                    {s.libelle}
                  </option>
                ))}
              </select>
            </div>
            <p className="aide text-sm">Les autres détails (édition, lieu, tomes, ISBN, fiche de l&apos;auteur) se complètent dans Outils, Sources.</p>
            {message && <p className="message message-erreur">{message}</p>}
            <div className="flex gap-2">
              <button type="button" className="bouton bouton-principal" onClick={() => void creerOuvrage()} disabled={!nouveau.titre.trim()}>
                Créer l&apos;ouvrage
              </button>
              <button type="button" className="bouton bouton-discret" onClick={() => setCreation(null)}>
                Retour
              </button>
            </div>
          </div>
        ) : creation === "citation" && choisi ? (
          <div className="space-y-3">
            <p className="font-semibold">Nouvelle citation de « {choisi.titre} »</p>
            <textarea className="champ min-h-28" placeholder="Texte de la citation (traduction française)" aria-label="Texte de la citation" value={citation.texte} onChange={(e) => setCitation({ ...citation, texte: e.target.value })} />
            <textarea className="champ min-h-20" dir="auto" placeholder="Texte original (arabe, anglais…), facultatif" aria-label="Texte original" value={citation.texte_original} onChange={(e) => setCitation({ ...citation, texte_original: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <input className="champ" placeholder="Tome" aria-label="Tome" value={citation.tome} onChange={(e) => setCitation({ ...citation, tome: e.target.value })} />
              <input className="champ" placeholder="Page" aria-label="Page" value={citation.page} onChange={(e) => setCitation({ ...citation, page: e.target.value })} />
            </div>
            {message && <p className="message message-erreur">{message}</p>}
            <button type="button" className="bouton bouton-principal" onClick={() => void creerCitation()} disabled={!citation.texte.trim()}>
              Enregistrer et insérer
            </button>
          </div>
        ) : (
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-encre-douce" aria-hidden="true" />
              <input className="champ !pl-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Titre, auteur, ou mots d'une citation…" aria-label="Chercher un ouvrage ou une citation" />
            </div>
            <ul className="max-h-72 space-y-1.5 overflow-y-auto" role="listbox" aria-label="Sources enregistrées">
              {resultats.map((r) => (
                <li key={`${r.type}-${r.id}`}>
                  <button type="button" role="option" aria-selected={choisi?.id === r.id} className="choix-source" onClick={() => setChoisi(r)}>
                    {r.type === "ouvrage" ? <BookOpen className="size-4 shrink-0 text-accent" aria-hidden="true" /> : <Quote className="size-4 shrink-0 text-accent" aria-hidden="true" />}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{r.titre}</span>
                      {r.detail && <span className="block truncate text-sm text-encre-douce">{r.detail}</span>}
                    </span>
                  </button>
                </li>
              ))}
              {resultats.length === 0 && <li className="text-sm text-encre-douce">Aucune source trouvée.</li>}
            </ul>
            <button type="button" className="bouton bouton-discret" onClick={() => { setCreation("ouvrage"); setNouveau({ ...nouveau, titre: q }); }}>
              <Plus className="size-4" aria-hidden="true" />
              Nouvel ouvrage
            </button>
            {choisi && choisi.type === "ouvrage" && mode === "reference" && (
              <div className="grid grid-cols-2 gap-2">
                <input className="champ" placeholder="Tome" aria-label="Tome" value={tome} onChange={(e) => setTome(e.target.value)} />
                <input className="champ" placeholder="Page" aria-label="Page" value={page} onChange={(e) => setPage(e.target.value)} />
              </div>
            )}
            <button type="button" className="bouton bouton-principal w-full" disabled={!choisi} onClick={valider}>
              {!choisi ? "Choisis une source" : choisi.type === "ouvrage" && mode === "citation" ? "Écrire une citation de cet ouvrage" : "Insérer"}
            </button>
          </>
        )}
      </div>
    </Modale>
  );
}
