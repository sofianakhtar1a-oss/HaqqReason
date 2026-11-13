"use client";

import Link from "next/link";
import { BookOpen, Plus, Quote, Search, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { manquesOuvrage, STATUTS_SOURCE, statutSource } from "@/lib/sources";
import { enregistrerAuteur, enregistrerCitation, enregistrerOuvrage, ouvragesSemblables, supprimerAuteur, supprimerCitation, supprimerOuvrage, type ChampsAuteur, type ChampsCitation, type ChampsOuvrage } from "./actions";

type Ouvrage = ChampsOuvrage & { id: string };
type Auteur = ChampsAuteur & { id: string };
type Citation = ChampsCitation & { id: string };
export type Donnees = { ouvrages: Ouvrage[]; auteurs: Auteur[]; citations: Citation[]; usages: Record<string, number> };

const norme = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const OUVRAGE_VIDE: ChampsOuvrage = { titre: "", titre_original: "", auteur_id: null, auteur_texte: "", editeur: "", edition: "", lieu: "", annee: "", volumes: "", langue: "", isbn: "", lien: "", statut: "a-verifier", notes: "" };

function Statut({ cle }: { cle: string }) {
  const s = statutSource(cle);
  return (
    <span className="statut-source" data-teinte={s.teinte}>
      {s.court}
    </span>
  );
}

function ChampTexte({ libelle, valeur, onChange, long = false, dir }: { libelle: string; valeur: string; onChange: (v: string) => void; long?: boolean; dir?: "auto" }) {
  return (
    <label className="block">
      <span className="etiquette text-sm">{libelle}</span>
      {long ? <textarea className="champ min-h-24" value={valeur} dir={dir} onChange={(e) => onChange(e.target.value)} /> : <input className="champ !min-h-10 !py-2" value={valeur} dir={dir} onChange={(e) => onChange(e.target.value)} />}
    </label>
  );
}

function SelectStatut({ valeur, onChange }: { valeur: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="etiquette text-sm">Niveau de vérification</span>
      <select className="champ !min-h-10 !py-2" value={valeur} onChange={(e) => onChange(e.target.value)}>
        {STATUTS_SOURCE.map((s) => (
          <option key={s.cle} value={s.cle}>
            {s.libelle}
          </option>
        ))}
      </select>
    </label>
  );
}

export function GestionSources({ donnees, ouvrir }: { donnees: Donnees; ouvrir: string | null }) {
  const router = useRouter();
  const [onglet, setOnglet] = useState<"ouvrages" | "auteurs" | "citations">("ouvrages");
  const [q, setQ] = useState("");
  const [edition, setEdition] = useState<{ type: "ouvrage"; id: string | null; c: ChampsOuvrage } | { type: "auteur"; id: string | null; c: ChampsAuteur } | { type: "citation"; id: string | null; c: ChampsCitation } | null>(() => {
    const o = ouvrir ? donnees.ouvrages.find((x) => x.id === ouvrir) : undefined;
    return o ? { type: "ouvrage", id: o.id, c: { ...o } } : null;
  });
  const [message, setMessage] = useState("");
  const [semblables, setSemblables] = useState<{ id: string; titre: string }[]>([]);
  const nomAuteur = useMemo(() => new Map(donnees.auteurs.map((a) => [a.id, a.nom])), [donnees.auteurs]);
  const titreOuvrage = useMemo(() => new Map(donnees.ouvrages.map((o) => [o.id, o.titre])), [donnees.ouvrages]);
  const filtre = (t: string) => norme(t).includes(norme(q.trim()));

  async function enregistrer() {
    if (!edition) return;
    setMessage("");
    const r =
      edition.type === "ouvrage" ? await enregistrerOuvrage(edition.id, edition.c) : edition.type === "auteur" ? await enregistrerAuteur(edition.id, edition.c) : await enregistrerCitation(edition.id, edition.c);
    if (!r.ok) return setMessage(r.message);
    setEdition(null);
    router.refresh();
  }
  async function supprimer() {
    if (!edition?.id || !window.confirm("Supprimer définitivement ?")) return;
    const r = edition.type === "ouvrage" ? await supprimerOuvrage(edition.id) : edition.type === "auteur" ? await supprimerAuteur(edition.id) : await supprimerCitation(edition.id);
    if (!r.ok) return setMessage(r.message);
    setEdition(null);
    router.refresh();
  }

  if (edition) {
    return (
      <div className="verre panneau mt-8 max-w-3xl space-y-4">
        <h2 className="text-2xl font-bold">{edition.id ? "Modifier" : "Nouvel"} {edition.type === "ouvrage" ? "ouvrage" : edition.type === "auteur" ? "auteur" : "citation"}</h2>
        {edition.type === "ouvrage" && (
          <>
            <ChampTexte
              libelle="Titre"
              valeur={edition.c.titre}
              onChange={(v) => {
                setEdition({ ...edition, c: { ...edition.c, titre: v } });
                if (!edition.id && v.trim().length >= 4) void ouvragesSemblables(v).then((r) => r.ok && setSemblables(r.donnees));
              }}
            />
            {!edition.id && semblables.length > 0 && <p className="message text-sm">Déjà enregistrés, au titre proche : {semblables.map((s) => s.titre).join(" ; ")}. Vérifie que ce n&apos;est pas un doublon.</p>}
            <ChampTexte libelle="Titre original (arabe, anglais…)" valeur={edition.c.titre_original} dir="auto" onChange={(v) => setEdition({ ...edition, c: { ...edition.c, titre_original: v } })} />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="etiquette text-sm">Fiche de l&apos;auteur</span>
                <select className="champ !min-h-10 !py-2" value={edition.c.auteur_id ?? ""} onChange={(e) => setEdition({ ...edition, c: { ...edition.c, auteur_id: e.target.value || null } })}>
                  <option value="">Aucune (auteur écrit à la main)</option>
                  {donnees.auteurs.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nom}
                    </option>
                  ))}
                </select>
              </label>
              <ChampTexte libelle="Ou auteur (texte)" valeur={edition.c.auteur_texte} onChange={(v) => setEdition({ ...edition, c: { ...edition.c, auteur_texte: v } })} />
              <ChampTexte libelle="Éditeur" valeur={edition.c.editeur} onChange={(v) => setEdition({ ...edition, c: { ...edition.c, editeur: v } })} />
              <ChampTexte libelle="Édition (n°, revue, tahqiq…)" valeur={edition.c.edition} onChange={(v) => setEdition({ ...edition, c: { ...edition.c, edition: v } })} />
              <ChampTexte libelle="Lieu" valeur={edition.c.lieu} onChange={(v) => setEdition({ ...edition, c: { ...edition.c, lieu: v } })} />
              <ChampTexte libelle="Année" valeur={edition.c.annee} onChange={(v) => setEdition({ ...edition, c: { ...edition.c, annee: v } })} />
              <ChampTexte libelle="Nombre de volumes" valeur={edition.c.volumes} onChange={(v) => setEdition({ ...edition, c: { ...edition.c, volumes: v } })} />
              <ChampTexte libelle="Langue" valeur={edition.c.langue} onChange={(v) => setEdition({ ...edition, c: { ...edition.c, langue: v } })} />
              <ChampTexte libelle="ISBN" valeur={edition.c.isbn} onChange={(v) => setEdition({ ...edition, c: { ...edition.c, isbn: v } })} />
              <ChampTexte libelle="Lien (consultation en ligne)" valeur={edition.c.lien} onChange={(v) => setEdition({ ...edition, c: { ...edition.c, lien: v } })} />
            </div>
            <SelectStatut valeur={edition.c.statut} onChange={(v) => setEdition({ ...edition, c: { ...edition.c, statut: v as ChampsOuvrage["statut"] } })} />
            <ChampTexte libelle="Notes personnelles (jamais visibles des lecteurs)" long valeur={edition.c.notes} onChange={(v) => setEdition({ ...edition, c: { ...edition.c, notes: v } })} />
          </>
        )}
        {edition.type === "auteur" && (
          <>
            <ChampTexte libelle="Nom" valeur={edition.c.nom} onChange={(v) => setEdition({ ...edition, c: { ...edition.c, nom: v } })} />
            <ChampTexte libelle="Nom original (arabe…)" valeur={edition.c.nom_original} dir="auto" onChange={(v) => setEdition({ ...edition, c: { ...edition.c, nom_original: v } })} />
            <ChampTexte libelle="Époque (par exemple : m. 256 H / 870)" valeur={edition.c.epoque} onChange={(v) => setEdition({ ...edition, c: { ...edition.c, epoque: v } })} />
            <ChampTexte libelle="Biographie" long valeur={edition.c.biographie} onChange={(v) => setEdition({ ...edition, c: { ...edition.c, biographie: v } })} />
            <ChampTexte libelle="Notes personnelles (jamais visibles des lecteurs)" long valeur={edition.c.notes} onChange={(v) => setEdition({ ...edition, c: { ...edition.c, notes: v } })} />
          </>
        )}
        {edition.type === "citation" && (
          <>
            <label className="block">
              <span className="etiquette text-sm">Ouvrage</span>
              <select className="champ !min-h-10 !py-2" value={edition.c.ouvrage_id} onChange={(e) => setEdition({ ...edition, c: { ...edition.c, ouvrage_id: e.target.value } })}>
                <option value="">Choisis l&apos;ouvrage…</option>
                {donnees.ouvrages.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.titre}
                  </option>
                ))}
              </select>
            </label>
            <ChampTexte libelle="Texte (traduction française)" long valeur={edition.c.texte} onChange={(v) => setEdition({ ...edition, c: { ...edition.c, texte: v } })} />
            <ChampTexte libelle="Texte original" long dir="auto" valeur={edition.c.texte_original} onChange={(v) => setEdition({ ...edition, c: { ...edition.c, texte_original: v } })} />
            <div className="grid grid-cols-2 gap-3">
              <ChampTexte libelle="Tome" valeur={edition.c.tome} onChange={(v) => setEdition({ ...edition, c: { ...edition.c, tome: v } })} />
              <ChampTexte libelle="Page" valeur={edition.c.page} onChange={(v) => setEdition({ ...edition, c: { ...edition.c, page: v } })} />
            </div>
            <ChampTexte libelle="Contexte (ce qui précède et suit, pour ne pas déformer le sens)" long valeur={edition.c.contexte} onChange={(v) => setEdition({ ...edition, c: { ...edition.c, contexte: v } })} />
            <SelectStatut valeur={edition.c.statut} onChange={(v) => setEdition({ ...edition, c: { ...edition.c, statut: v as ChampsCitation["statut"] } })} />
          </>
        )}
        {message && <p className="message message-erreur">{message}</p>}
        <div className="flex flex-wrap gap-2">
          <button type="button" className="bouton bouton-principal" onClick={() => void enregistrer()}>
            Enregistrer
          </button>
          <button type="button" className="bouton bouton-discret" onClick={() => setEdition(null)}>
            Annuler
          </button>
          {edition.id && (
            <button type="button" className="bouton bouton-danger ml-auto" onClick={() => void supprimer()}>
              Supprimer
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Type de source">
        {(
          [
            ["ouvrages", "Ouvrages", BookOpen, donnees.ouvrages.length],
            ["auteurs", "Auteurs", UserRound, donnees.auteurs.length],
            ["citations", "Citations", Quote, donnees.citations.length],
          ] as const
        ).map(([cle, libelle, Icone, n]) => (
          <button key={cle} type="button" role="tab" aria-selected={onglet === cle} className="puce-filtre" onClick={() => setOnglet(cle)}>
            <Icone className="size-4" aria-hidden="true" /> {libelle} ({n})
          </button>
        ))}
        <button
          type="button"
          className="bouton bouton-principal ml-auto !min-h-10"
          onClick={() =>
            setEdition(
              onglet === "ouvrages"
                ? { type: "ouvrage", id: null, c: { ...OUVRAGE_VIDE } }
                : onglet === "auteurs"
                  ? { type: "auteur", id: null, c: { nom: "", nom_original: "", epoque: "", biographie: "", notes: "" } }
                  : { type: "citation", id: null, c: { ouvrage_id: "", texte: "", texte_original: "", tome: "", page: "", contexte: "", statut: "a-verifier" } },
            )
          }
        >
          <Plus className="size-4" aria-hidden="true" />
          {onglet === "ouvrages" ? "Nouvel ouvrage" : onglet === "auteurs" ? "Nouvel auteur" : "Nouvelle citation"}
        </button>
      </div>
      <div className="debat-recherche mt-4 !min-h-12">
        <Search className="size-4 text-accent" aria-hidden="true" />
        <input type="search" aria-label="Filtrer" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrer…" className="!text-base" />
      </div>
      <ul className="mt-5 grid gap-2">
        {onglet === "ouvrages" &&
          donnees.ouvrages
            .filter((o) => filtre(`${o.titre} ${o.titre_original} ${o.auteur_texte} ${nomAuteur.get(o.auteur_id ?? "") ?? ""}`))
            .map((o) => {
              const manques = manquesOuvrage(o);
              return (
                <li key={o.id}>
                  <button type="button" className="rangee w-full flex-wrap text-left hover:border-or" onClick={() => setEdition({ type: "ouvrage", id: o.id, c: { ...o } })}>
                    <span className="min-w-0 flex-1">
                      <cite className="block truncate font-semibold not-italic">{o.titre}</cite>
                      <span className="block truncate text-sm text-encre-douce">
                        {[nomAuteur.get(o.auteur_id ?? "") || o.auteur_texte, o.annee].filter(Boolean).join(", ") || "Auteur non renseigné"}
                        {manques.length > 0 && `. Il manque : ${manques.join(", ")}`}
                      </span>
                    </span>
                    <span className="text-sm text-encre-douce">{donnees.usages[o.id] ?? 0} réf.</span>
                    <Statut cle={o.statut} />
                  </button>
                </li>
              );
            })}
        {onglet === "auteurs" &&
          donnees.auteurs
            .filter((a) => filtre(`${a.nom} ${a.nom_original}`))
            .map((a) => (
              <li key={a.id}>
                <button type="button" className="rangee w-full text-left hover:border-or" onClick={() => setEdition({ type: "auteur", id: a.id, c: { ...a } })}>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{a.nom}</span>
                    <span className="block text-sm text-encre-douce">{[a.nom_original, a.epoque].filter(Boolean).join(", ")}</span>
                  </span>
                  <span className="text-sm text-encre-douce">{donnees.ouvrages.filter((o) => o.auteur_id === a.id).length} ouvrage(s)</span>
                </button>
              </li>
            ))}
        {onglet === "citations" &&
          donnees.citations
            .filter((c) => filtre(`${c.texte} ${c.texte_original} ${titreOuvrage.get(c.ouvrage_id) ?? ""}`))
            .map((c) => (
              <li key={c.id}>
                <button type="button" className="rangee w-full text-left hover:border-or" onClick={() => setEdition({ type: "citation", id: c.id, c: { ...c } })}>
                  <span className="min-w-0 flex-1">
                    <span className="block line-clamp-2">« {c.texte} »</span>
                    <span className="block text-sm text-encre-douce">
                      {titreOuvrage.get(c.ouvrage_id)}
                      {c.page && `, p. ${c.page}`}
                    </span>
                  </span>
                  <span className="text-sm text-encre-douce">{donnees.usages[c.id] ?? 0} article(s)</span>
                  <Statut cle={c.statut} />
                </button>
              </li>
            ))}
      </ul>
      <p className="mt-6 text-sm text-encre-douce">
        Les fiches publiques (ouvrages, auteurs) n&apos;apparaissent aux lecteurs que lorsqu&apos;un article publié les cite. Voir aussi le{" "}
        <Link href="/createur/qualite" className="underline underline-offset-4">
          contrôle qualité
        </Link>
        .
      </p>
    </div>
  );
}
