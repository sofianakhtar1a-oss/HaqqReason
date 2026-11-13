"use client";

import Link from "next/link";
import { FileUp } from "lucide-react";
import { useMemo, useState } from "react";
import { preparerImport, versDocument, type Brouillon } from "@/lib/client/import";
import { importerArticle, terminerImport } from "./actions";

type Props = { categories: { id: string; libelle: string; bloc: string }[] };

export function Importeur({ categories }: Props) {
  const [categorie, setCategorie] = useState(categories[0]?.id ?? "");
  const [dossiers, setDossiers] = useState(true);
  const [brouillons, setBrouillons] = useState<Brouillon[]>([]);
  const [ignores, setIgnores] = useState<string[]>([]);
  const [etat, setEtat] = useState<{ phase: "attente" | "lecture" | "import" | "fini"; fait: number; erreurs: string[]; message?: string }>({ phase: "attente", fait: 0, erreurs: [] });
  const groupes = useMemo(() => {
    const m = new Map<string, typeof categories>();
    for (const c of categories) m.set(c.bloc, [...(m.get(c.bloc) ?? []), c]);
    return [...m.entries()];
  }, [categories]);

  async function lire(liste: FileList | null) {
    if (!liste || liste.length === 0) return;
    setEtat({ phase: "lecture", fait: 0, erreurs: [] });
    try {
      const r = await preparerImport([...liste], dossiers);
      setBrouillons(r.brouillons);
      setIgnores(r.ignores);
      setEtat({ phase: "attente", fait: 0, erreurs: [], message: r.brouillons.length === 0 ? "Aucun document reconnu dans ces fichiers." : undefined });
    } catch {
      setEtat({ phase: "attente", fait: 0, erreurs: [], message: "Lecture impossible : le fichier est peut-être abîmé." });
    }
  }

  async function importer() {
    const choisis = brouillons.filter((b) => b.garder);
    setEtat({ phase: "import", fait: 0, erreurs: [] });
    const erreurs: string[] = [];
    let reussis = 0;
    for (let i = 0; i < choisis.length; i++) {
      const b = choisis[i];
      try {
        const r = await importerArticle({ categorieId: categorie, titre: b.titre, contenu: versDocument(b.html), chemin: b.chemin });
        if (r.ok) reussis++;
        else erreurs.push(r.message);
      } catch {
        erreurs.push(`« ${b.titre} » : erreur réseau.`);
      }
      setEtat({ phase: "import", fait: i + 1, erreurs: [...erreurs] });
    }
    await terminerImport(reussis);
    setEtat({ phase: "fini", fait: reussis, erreurs });
    setBrouillons([]);
  }

  const choisis = brouillons.filter((b) => b.garder).length;

  return (
    <div className="mt-8 space-y-6">
      <div className="verre panneau space-y-5">
        <div>
          <label htmlFor="destination" className="etiquette">
            Catégorie de destination
          </label>
          <select id="destination" className="champ" value={categorie} onChange={(e) => setCategorie(e.target.value)}>
            {groupes.map(([bloc, liste]) => (
              <optgroup key={bloc} label={bloc}>
                {liste.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.libelle}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <label className="flex items-start gap-3">
          <input type="checkbox" className="mt-1 size-4" checked={dossiers} onChange={(e) => setDossiers(e.target.checked)} />
          <span>
            Recréer les dossiers de l&apos;archive en sous-catégories
            <span className="block text-sm text-encre-douce">Utile pour un export Notion : la structure de tes pages est conservée.</span>
          </span>
        </label>
        <label className="zone-depot">
          <FileUp className="size-7 text-accent" strokeWidth={1.5} aria-hidden="true" />
          <span className="font-semibold text-encre">Choisis tes fichiers</span>
          <span className="text-sm">.md, .docx, .txt, .html ou .zip (export Notion : « Markdown &amp; CSV » ou « HTML »)</span>
          <input
            type="file"
            multiple
            className="sr-only"
            accept=".md,.markdown,.txt,.docx,.html,.htm,.zip"
            disabled={etat.phase === "lecture" || etat.phase === "import"}
            onChange={(e) => {
              void lire(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
        {etat.phase === "lecture" && <p role="status">Lecture des fichiers…</p>}
        {etat.message && <p className="message">{etat.message}</p>}
      </div>

      {brouillons.length > 0 && (
        <section className="verre panneau" aria-labelledby="titre-apercu">
          <h2 id="titre-apercu" className="text-2xl font-bold">
            {brouillons.length} document{brouillons.length > 1 ? "s" : ""} prêt{brouillons.length > 1 ? "s" : ""}
          </h2>
          <p className="mt-1 text-encre-douce">Vérifie les titres. Les images ne sont pas importées : ajoute-les ensuite dans l&apos;éditeur.</p>
          <ul className="mt-4 max-h-[28rem] space-y-2 overflow-y-auto pr-1">
            {brouillons.map((b) => (
              <li key={b.cle} className="rangee flex-wrap !px-2">
                <input
                  type="checkbox"
                  className="size-4"
                  aria-label={`Importer « ${b.titre} »`}
                  checked={b.garder}
                  onChange={(e) => setBrouillons((l) => l.map((x) => (x.cle === b.cle ? { ...x, garder: e.target.checked } : x)))}
                />
                <input
                  className="champ !min-h-9 flex-1 !py-1"
                  aria-label="Titre de l'article"
                  value={b.titre}
                  maxLength={200}
                  onChange={(e) => setBrouillons((l) => l.map((x) => (x.cle === b.cle ? { ...x, titre: e.target.value } : x)))}
                />
                {b.chemin.length > 0 && <span className="w-full pl-7 text-sm text-encre-douce">dans {b.chemin.join(" › ")}</span>}
              </li>
            ))}
          </ul>
          {ignores.length > 0 && <p className="mt-3 text-sm text-encre-douce">Ignorés (format non pris en charge) : {ignores.slice(0, 8).join(", ")}{ignores.length > 8 ? ` et ${ignores.length - 8} autres` : ""}.</p>}
          <button type="button" className="bouton bouton-principal mt-6" disabled={choisis === 0 || etat.phase === "import"} onClick={() => void importer()}>
            Importer {choisis} article{choisis > 1 ? "s" : ""} en brouillon
          </button>
        </section>
      )}

      {etat.phase === "import" && (
        <div className="verre panneau" role="status">
          <p>
            Import en cours : {etat.fait} sur {choisis}
          </p>
          <div className="barre-progression mt-3" role="progressbar" aria-valuenow={etat.fait} aria-valuemin={0} aria-valuemax={choisis}>
            <span style={{ width: `${(etat.fait / Math.max(1, choisis)) * 100}%` }} />
          </div>
        </div>
      )}
      {etat.phase === "fini" && (
        <div className="message message-succes" role="status">
          {etat.fait} article{etat.fait > 1 ? "s" : ""} importé{etat.fait > 1 ? "s" : ""} en brouillon.{" "}
          <Link href={`/createur/categorie/${categorie}`} className="font-semibold underline underline-offset-4">
            Ouvrir la catégorie
          </Link>
        </div>
      )}
      {etat.erreurs.length > 0 && (
        <ul className="message message-erreur list-disc space-y-1 pl-8">
          {etat.erreurs.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
