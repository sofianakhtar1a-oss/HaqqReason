"use client";

import { CloudUpload, Download, History, PackageOpen } from "lucide-react";
import { useState } from "react";
import { ChampMotDePasse } from "@/components/ChampMotDePasse";
import {
  commencerRestauration,
  debutExport,
  exporterPaquet,
  lienCopieCloud,
  lienRestaurationFichier,
  liensFichiers,
  restaurerLot,
  sauvegarderDansLeCloud,
  terminerRestauration,
} from "./actions";

const ORDRE = ["categories", "articles", "etiquettes", "articles_etiquettes", "liens_articles", "versions_articles", "fichiers", "pages_fichiers", "annotations", "modeles", "synonymes", "auteurs", "ouvrages", "citations", "references_articles", "articles_categories", "prerequis"] as const;
const NOMS: Record<string, string> = {
  categories: "catégories",
  articles: "articles",
  etiquettes: "étiquettes",
  articles_etiquettes: "liens d'étiquettes",
  liens_articles: "liens entre articles",
  versions_articles: "versions",
  fichiers: "documents",
  pages_fichiers: "pages de PDF",
  annotations: "annotations",
  modeles: "modèles",
  synonymes: "groupes de synonymes",
  auteurs: "auteurs",
  ouvrages: "ouvrages",
  citations: "citations",
  references_articles: "références",
  articles_categories: "classements multiples",
  prerequis: "prérequis",
};

type Ligne = Record<string, unknown>;
type Sauvegarde = { format: string; version: number; date: string; blocs: { id: string; slug: string }[]; tables: Record<string, Ligne[]> };
type Copie = { nom: string; taille: number; date: string };

function telecharger(blob: Blob, nom: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nom;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

function taille(o: number): string {
  return o > 1e6 ? `${(o / 1e6).toFixed(1)} Mo` : `${Math.max(1, Math.round(o / 1e3))} Ko`;
}

/** Parents avant enfants. */
function ordonner(categories: Ligne[]): Ligne[] {
  const parId = new Map(categories.map((c) => [String(c.id), c]));
  const vues = new Set<string>();
  const sortie: Ligne[] = [];
  const visiter = (c: Ligne, n: number) => {
    if (vues.has(String(c.id)) || n > 300) return;
    const p = c.parent_id ? parId.get(String(c.parent_id)) : undefined;
    if (p) visiter(p, n + 1);
    vues.add(String(c.id));
    sortie.push(c);
  };
  categories.forEach((c) => visiter(c, 0));
  return sortie;
}

/** Découpe en lots d'environ 1,5 Mo (limite d'envoi au serveur). */
function lots(lignes: Ligne[]): Ligne[][] {
  const sortie: Ligne[][] = [];
  let courant: Ligne[] = [];
  let poids = 0;
  for (const l of lignes) {
    const p = JSON.stringify(l).length;
    if (courant.length > 0 && (poids + p > 1_500_000 || courant.length >= 1000)) {
      sortie.push(courant);
      courant = [];
      poids = 0;
    }
    courant.push(l);
    poids += p;
  }
  if (courant.length) sortie.push(courant);
  return sortie;
}

export function Sauvegardes({ copies }: { copies: Copie[] }) {
  const [message, setMessage] = useState<{ type: "info" | "succes" | "erreur"; texte: string } | null>(null);
  const [occupe, setOccupe] = useState(false);
  const [progression, setProgression] = useState<number | null>(null);
  const [aRestaurer, setARestaurer] = useState<{ sauvegarde: Sauvegarde; fichiers: Map<string, Uint8Array>; source: string } | null>(null);
  const [motDePasse, setMotDePasse] = useState("");
  const [phrase, setPhrase] = useState("");

  const info = (texte: string, type: "info" | "succes" | "erreur" = "info") => setMessage({ type, texte });

  async function exporter() {
    setOccupe(true);
    try {
      info("Lecture de la bibliothèque…");
      const debut = await debutExport();
      if (!debut.ok) throw new Error(debut.message);
      const tables: Record<string, Ligne[]> = {};
      for (const t of ORDRE) {
        tables[t] = [];
        for (let d = 0; ; ) {
          const r = await exporterPaquet(t, d);
          if (!r.ok) throw new Error(r.message);
          tables[t].push(...r.lignes);
          d += r.lignes.length;
          if (r.fin) break;
        }
      }
      const { strToU8, zipSync } = await import("fflate");
      const contenu: Record<string, Uint8Array | [Uint8Array, { level: 0 }]> = {
        "bibliotheque.json": strToU8(JSON.stringify({ ...debut.entete, tables }, null, 1)),
        "LISEZ-MOI.txt": strToU8(
          "Sauvegarde complète de HaqqReason.\n\nbibliotheque.json : toutes les catégories, tous les articles, étiquettes, versions, modèles et synonymes.\nfichiers/ : les PDF et images.\n\nPour restaurer : Espace créateur > Outils > Sauvegardes > Restaurer.\n",
        ),
      };
      const fichiers = tables.fichiers ?? [];
      for (let i = 0; i < fichiers.length; i += 50) {
        const r = await liensFichiers(fichiers.slice(i, i + 50).map((f) => String(f.id)));
        if (!r.ok) throw new Error(r.message);
        for (const l of r.liens) {
          if (!l.url) continue;
          const reponse = await fetch(l.url);
          if (reponse.ok) contenu[`fichiers/${l.chemin}`] = [new Uint8Array(await reponse.arrayBuffer()), { level: 0 }];
        }
        setProgression(Math.round(((i + 50) / fichiers.length) * 100));
        info(`Récupération des documents : ${Math.min(i + 50, fichiers.length)} sur ${fichiers.length}`);
      }
      const archive = zipSync(contenu, { level: 6 });
      telecharger(new Blob([archive as BlobPart], { type: "application/zip" }), `haqqreason-sauvegarde-${new Date().toISOString().slice(0, 10)}.zip`);
      const articles = tables.articles?.length ?? 0;
      info(`Sauvegarde téléchargée : ${articles} article${articles > 1 ? "s" : ""}, ${fichiers.length} document${fichiers.length > 1 ? "s" : ""}, ${taille(archive.length)}. Range-la en lieu sûr (clé USB, Google Drive…).`, "succes");
    } catch (e) {
      info(e instanceof Error && e.message ? e.message : "L'export a échoué. Réessaie.", "erreur");
    }
    setProgression(null);
    setOccupe(false);
  }

  async function lireSauvegarde(fichier: File) {
    setOccupe(true);
    try {
      const octets = new Uint8Array(await fichier.arrayBuffer());
      let json: string;
      const fichiers = new Map<string, Uint8Array>();
      if (fichier.name.toLowerCase().endsWith(".zip")) {
        const { strFromU8, unzipSync } = await import("fflate");
        const entrees = unzipSync(octets);
        if (!entrees["bibliotheque.json"]) throw new Error("Ce fichier ZIP n'est pas une sauvegarde HaqqReason.");
        json = strFromU8(entrees["bibliotheque.json"]);
        for (const [nom, contenu] of Object.entries(entrees)) if (nom.startsWith("fichiers/") && !nom.endsWith("/")) fichiers.set(nom.slice(9), contenu);
      } else json = new TextDecoder().decode(octets);
      const sauvegarde = JSON.parse(json) as Sauvegarde;
      if (sauvegarde.format !== "haqqreason-sauvegarde" || typeof sauvegarde.tables !== "object") throw new Error("Ce fichier n'est pas une sauvegarde HaqqReason.");
      setARestaurer({ sauvegarde, fichiers, source: fichier.name });
      setMessage(null);
    } catch (e) {
      info(e instanceof Error ? e.message : "Fichier illisible.", "erreur");
    }
    setOccupe(false);
  }

  async function ouvrirCopie(nom: string) {
    setOccupe(true);
    try {
      const r = await lienCopieCloud(nom, false);
      if (!r.ok) throw new Error(r.message);
      const sauvegarde = (await (await fetch(r.url)).json()) as Sauvegarde;
      setARestaurer({ sauvegarde, fichiers: new Map(), source: nom });
      setMessage(null);
    } catch (e) {
      info(e instanceof Error ? e.message : "Sauvegarde illisible.", "erreur");
    }
    setOccupe(false);
  }

  async function restaurer() {
    if (!aRestaurer) return;
    const { sauvegarde, fichiers, source } = aRestaurer;
    setOccupe(true);
    try {
      const fd = new FormData();
      fd.set("motDePasseActuel", motDePasse);
      fd.set("phrase", phrase);
      fd.set("avecFichiers", fichiers.size > 0 ? "oui" : "non");
      const debut = await commencerRestauration(fd);
      if (!debut.ok) throw new Error(debut.message);
      const actuels = new Map(debut.blocs.map((b) => [b.slug, b.id]));
      const blocs: Record<string, string> = {};
      for (const b of sauvegarde.blocs ?? []) if (actuels.has(b.slug)) blocs[b.id] = actuels.get(b.slug)!;

      let total = 0;
      const tous = ORDRE.reduce((n, t) => n + (sauvegarde.tables[t]?.length ?? 0), 0);
      for (const t of ORDRE) {
        let lignes = sauvegarde.tables[t] ?? [];
        if (t === "categories") lignes = ordonner(lignes);
        for (const lot of lots(lignes)) {
          const r = await restaurerLot({ table: t, lignes: lot, blocs });
          if (!r.ok) throw new Error(r.message);
          total += lot.length;
          setProgression(Math.round((total / Math.max(1, tous)) * 100));
          info(`Restauration des ${NOMS[t]}…`);
        }
      }
      let envoyes = 0;
      for (const f of sauvegarde.tables.fichiers ?? []) {
        const chemin = String(f.chemin);
        const octets = fichiers.get(chemin);
        if (!octets) continue;
        const lien = await lienRestaurationFichier(chemin);
        if (!lien.ok) continue;
        const r = await fetch(lien.url, { method: "PUT", body: octets as BodyInit, headers: { "Content-Type": String(f.type_mime ?? "application/octet-stream"), "x-upsert": "true" } });
        if (r.ok) envoyes++;
        info(`Envoi des documents : ${envoyes} sur ${fichiers.size}`);
      }
      await terminerRestauration({ lignes: total, fichiers: envoyes, source });
      setARestaurer(null);
      setMotDePasse("");
      setPhrase("");
      info(`Restauration terminée : ${sauvegarde.tables.articles?.length ?? 0} articles, ${sauvegarde.tables.categories?.length ?? 0} catégories, ${envoyes} documents.`, "succes");
    } catch (e) {
      info(e instanceof Error && e.message ? e.message : "La restauration a échoué.", "erreur");
    }
    setProgression(null);
    setOccupe(false);
  }

  async function copieCloud() {
    setOccupe(true);
    const r = await sauvegarderDansLeCloud();
    info(r.message, r.ok ? "succes" : "erreur");
    setOccupe(false);
  }

  return (
    <div className="mt-8 space-y-6">
      {message && (
        <p role="status" className={`message ${message.type === "succes" ? "message-succes" : message.type === "erreur" ? "message-erreur" : ""}`}>
          {message.texte}
        </p>
      )}
      {progression !== null && (
        <div className="barre-progression" role="progressbar" aria-valuenow={progression} aria-valuemin={0} aria-valuemax={100}>
          <span style={{ width: `${Math.min(100, progression)}%` }} />
        </div>
      )}

      <section className="verre panneau" aria-labelledby="titre-export">
        <Download className="size-7 text-or" strokeWidth={1.5} aria-hidden="true" />
        <h2 id="titre-export" className="mt-3 text-2xl font-bold">
          Exporter toute ma bibliothèque
        </h2>
        <p className="mb-5 mt-2 text-encre-douce">
          Un fichier ZIP avec tous tes articles, catégories, étiquettes, versions, modèles, synonymes, et tous tes PDF et images. Fais-le
          régulièrement et range le fichier hors de Supabase (clé USB, Google Drive).
        </p>
        <button type="button" className="bouton bouton-principal" disabled={occupe} onClick={() => void exporter()}>
          Télécharger la sauvegarde complète
        </button>
      </section>

      <section className="verre panneau" aria-labelledby="titre-cloud">
        <History className="size-7 text-or" strokeWidth={1.5} aria-hidden="true" />
        <h2 id="titre-cloud" className="mt-3 text-2xl font-bold">
          Sauvegardes automatiques
        </h2>
        <p className="mb-5 mt-2 text-encre-douce">
          Chaque nuit, une copie de la base est rangée dans l&apos;espace privé « sauvegardes » de Supabase. Les 30 dernières sont gardées. Les PDF
          et images restent dans leur propre espace.
        </p>
        <button type="button" className="bouton bouton-discret" disabled={occupe} onClick={() => void copieCloud()}>
          <CloudUpload className="size-4" aria-hidden="true" />
          Faire une copie maintenant
        </button>
        {copies.length === 0 ? (
          <p className="mt-5 text-encre-douce">Aucune copie pour l&apos;instant.</p>
        ) : (
          <ul className="mt-5 space-y-2">
            {copies.map((c) => (
              <li key={c.nom} className="rangee flex-wrap !px-2">
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{new Date(c.nom.slice(5, 15)).toLocaleDateString("fr-FR", { dateStyle: "full" })}</span>
                  {c.taille > 0 && <span className="text-sm text-encre-douce">{taille(c.taille)}</span>}
                </span>
                <button
                  type="button"
                  className="bouton bouton-discret !min-h-9 text-sm"
                  disabled={occupe}
                  onClick={async () => {
                    const r = await lienCopieCloud(c.nom, true);
                    if (r.ok) window.location.href = r.url;
                  }}
                >
                  Télécharger
                </button>
                <button type="button" className="bouton bouton-discret !min-h-9 text-sm" disabled={occupe} onClick={() => void ouvrirCopie(c.nom)}>
                  Restaurer
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panneau rounded-[1.75rem] border border-[color-mix(in_srgb,var(--danger)_45%,transparent)]" aria-labelledby="titre-restaurer">
        <PackageOpen className="size-7 text-danger" strokeWidth={1.5} aria-hidden="true" />
        <h2 id="titre-restaurer" className="mt-3 text-2xl font-bold">
          Restaurer une sauvegarde
        </h2>
        <p className="mb-5 mt-2 text-encre-douce">
          Remplace TOUT le contenu actuel (catégories, articles, documents, modèles, synonymes) par celui de la sauvegarde. Sert aussi à
          déménager la bibliothèque vers une nouvelle installation.
        </p>
        {!aRestaurer ? (
          <label className="zone-depot">
            <span className="font-semibold text-encre">Choisir un fichier de sauvegarde</span>
            <span className="text-sm">haqqreason-sauvegarde-….zip, ou une copie automatique .json</span>
            <input
              type="file"
              accept=".zip,.json"
              className="sr-only"
              disabled={occupe}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void lireSauvegarde(f);
                e.target.value = "";
              }}
            />
          </label>
        ) : (
          <form
            className="max-w-md space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              void restaurer();
            }}
          >
            <div className="verre rounded-2xl p-4 text-sm">
              <p className="font-semibold">Sauvegarde du {new Date(aRestaurer.sauvegarde.date).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" })}</p>
              <p className="mt-1 text-encre-douce">
                {ORDRE.filter((t) => (aRestaurer.sauvegarde.tables[t]?.length ?? 0) > 0)
                  .map((t) => `${aRestaurer.sauvegarde.tables[t].length} ${NOMS[t]}`)
                  .join(", ") || "Bibliothèque vide"}
                {aRestaurer.fichiers.size > 0 ? `, ${aRestaurer.fichiers.size} fichiers joints` : ""}.
              </p>
            </div>
            <ChampMotDePasse nom="motDePasseActuel" libelle="Mot de passe actuel" valeur={motDePasse} onChange={setMotDePasse} autoComplete="current-password" />
            <div>
              <label htmlFor="phrase-restauration" className="etiquette">
                Recopie : RESTAURER
              </label>
              <input id="phrase-restauration" className="champ" value={phrase} onChange={(e) => setPhrase(e.target.value)} autoComplete="off" required />
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="submit" className="bouton bouton-danger" disabled={occupe}>
                Remplacer tout le contenu
              </button>
              <button type="button" className="bouton bouton-discret" disabled={occupe} onClick={() => setARestaurer(null)}>
                Annuler
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
