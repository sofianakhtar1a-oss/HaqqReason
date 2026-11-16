"use client";

import { AlertTriangle, Check, FileSpreadsheet, FileText, FileType, Film, Hash, Link2, Music, Trash2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { minutage, type Source, type TypeSource } from "@/lib/alambic/carnet/types";

const ICONES: Record<TypeSource, typeof FileText> = {
  pdf: FileText,
  word: FileType,
  texte: FileText,
  markdown: Hash,
  csv: FileSpreadsheet,
  audio: Music,
  video: Film,
  youtube: Film,
};

const millier = (n: number) => n.toLocaleString("fr-FR");

function meta(s: Source): string {
  if (s.etat === "attente") return "En file d'attente";
  if (s.etat === "analyse") return s.type === "youtube" || s.type === "audio" || s.type === "video" ? "Transcription…" : "Lecture…";
  const parties: string[] = [];
  if (s.pages) parties.push(`${s.pages} p.${s.pagesEstimees ? " (estimées)" : ""}`);
  if (s.duree) parties.push(minutage(s.duree));
  if (s.type === "youtube") parties.unshift("YouTube");
  parties.push(`${millier(s.jetons)} jetons`);
  return parties.join(" · ");
}

type Props = {
  sources: Source[];
  budget: number;
  onFichiers: (f: File[]) => void;
  onLiens: (texte: string) => string[];
  onCocher: (s: Source, active: boolean) => void;
  onTout: (active: boolean) => void;
  onRetirer: (s: Source) => void;
  onFermer: () => void;
};

export function Sources({ sources, budget, onFichiers, onLiens, onCocher, onTout, onRetirer, onFermer }: Props) {
  const choix = useRef<HTMLInputElement>(null);
  const [glisse, setGlisse] = useState(false);
  const [liens, setLiens] = useState("");
  const [retourLiens, setRetourLiens] = useState<string | null>(null);
  const pretes = sources.filter((s) => s.etat === "pret");
  const cochees = pretes.filter((s) => s.active);
  const total = cochees.reduce((s, x) => s + x.jetons, 0);
  const complet = total <= budget;

  return (
    <aside className="cb-sources" aria-label="Sources">
      <div className="cb-sources-tete">
        <h2 className="cb-sources-titre">Sources</h2>
        <button type="button" className="tr-cmd cb-sources-fermer" onClick={onFermer} aria-label="Masquer les sources">
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      <input
        ref={choix}
        type="file"
        multiple
        hidden
        accept=".pdf,.docx,.doc,.txt,.md,.markdown,.csv,.tsv,audio/*,video/*"
        onChange={(e) => {
          onFichiers([...(e.target.files ?? [])]);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        className="cb-depot"
        data-glisse={glisse || undefined}
        onClick={() => choix.current?.click()}
        onDragOver={(e) => {
          if (![...e.dataTransfer.types].includes("Files")) return;
          e.preventDefault();
          setGlisse(true);
        }}
        onDragLeave={() => setGlisse(false)}
        onDrop={(e) => {
          e.preventDefault();
          setGlisse(false);
          onFichiers([...e.dataTransfer.files]);
        }}
      >
        <Upload className="size-5 text-or" aria-hidden="true" />
        <span className="font-semibold">{glisse ? "Lâche-les ici" : "Glisse tes fichiers"}</span>
        <span className="text-xs text-encre-douce">PDF, Word, TXT, Markdown, CSV, sons, vidéos · plusieurs à la fois</span>
      </button>

      <form
        className="cb-liens"
        onSubmit={(e) => {
          e.preventDefault();
          const ids = onLiens(liens);
          setRetourLiens(ids.length ? null : "Aucun lien YouTube reconnu.");
          if (ids.length) setLiens("");
        }}
      >
        <label htmlFor="cb-liens" className="sr-only">
          Liens YouTube, un par ligne
        </label>
        <Link2 className="size-4 text-encre-douce" aria-hidden="true" />
        <textarea id="cb-liens" rows={1} placeholder="Liens YouTube (un ou plusieurs)" value={liens} onChange={(e) => setLiens(e.target.value)} />
        <button type="submit" className="cb-liens-ajouter" disabled={!liens.trim()}>
          Ajouter
        </button>
      </form>
      {retourLiens && <p className="px-1 text-xs text-danger">{retourLiens}</p>}

      {sources.length > 0 && (
        <div className="cb-tout">
          <button type="button" onClick={() => onTout(cochees.length < pretes.length)}>
            {cochees.length < pretes.length ? "Tout cocher" : "Tout décocher"}
          </button>
          <span>
            {cochees.length}/{pretes.length}
          </span>
        </div>
      )}

      <ul className="cb-liste">
        {sources.map((s) => {
          const Icone = ICONES[s.type];
          return (
            <li key={s.id} className="cb-source" data-etat={s.etat} data-active={(s.active && s.etat === "pret") || undefined}>
              <label className="cb-case">
                <input type="checkbox" checked={s.active} disabled={s.etat !== "pret"} onChange={(e) => onCocher(s, e.target.checked)} />
                <span aria-hidden="true">
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
                <span className="sr-only">Utiliser « {s.nom} »</span>
              </label>
              <Icone className="cb-source-icone size-4" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="cb-source-nom" dir="auto" title={s.nom}>
                  {s.nom}
                </span>
                {s.etat === "erreur" ? (
                  <span className="cb-source-erreur">
                    <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
                    {s.erreur}
                  </span>
                ) : (
                  <span className="cb-source-meta">{meta(s)}</span>
                )}
                {(s.etat === "analyse" || s.etat === "attente") && (
                  <span className="cb-source-barre" aria-hidden="true">
                    <span style={{ transform: `scaleX(${Math.max(0.03, s.progression ?? 0)})` }} data-attente={s.etat === "attente" || undefined} />
                  </span>
                )}
              </span>
              <button type="button" className="tr-cmd cb-source-retirer" aria-label={`Retirer « ${s.nom} »`} onClick={() => onRetirer(s)}>
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>

      {cochees.length > 0 && (
        <p className="cb-jauge" data-complet={complet || undefined}>
          <span className="cb-jauge-barre" aria-hidden="true">
            <span style={{ transform: `scaleX(${Math.min(1, total / budget)})` }} />
          </span>
          {complet
            ? `Lues en entier : ${millier(total)} jetons sur ${millier(budget)}.`
            : `${millier(total)} jetons : l'assistant ira chercher les passages utiles (${Math.round((budget / total) * 100)} % lus par question).`}
        </p>
      )}
    </aside>
  );
}
